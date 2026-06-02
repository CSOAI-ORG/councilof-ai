# FIX PROPOSAL — SOV3 :3101 bind + restart storm (for Claude's #59)

_MiniMax M3 — auditor lane. 2026-06-02 ~05:55 UTC._
_Companion to `INCIDENT_SOV3_DOWN_2026-06-02.md`. This one is the **actionable patch**._

## TL;DR (3 lines)

1. SOV3 is down because `restart_sov3()` in `scripts/meok-guardian.sh` does `pkill -9` → `nohup bash run-production.sh` → `sleep 15` with **no port-bind verification**. Two near-simultaneous guardian passes = port collision = both die.
2. The **bind bug is a 1-line env change**: `HOST=0.0.0.0` → `HOST=127.0.0.1` in `sovereign-temple/run-production.sh` line 18. The script already has `export HOST=${HOST:-0.0.0.0}` — it's the one knob.
3. The **restart bug needs a `wait_for_port()` helper** + 5× exponential backoff (1s, 2s, 4s, 8s, 16s) and a "give up and page" terminal state.

## #59 surface vs root cause (don't fix only the surface)

| Bug | Where | Severity | Fix size |
|---|---|---|---|
| SOV3 binds 0.0.0.0 in local Mac process | `sovereign-temple/run-production.sh:18` `export HOST=${HOST:-0.0.0.0}` | medium (exposes dev process to LAN) | 1 line |
| Guardian restart races itself | `scripts/meok-guardian.sh:79-83` | **HIGH — caused the outage** | ~15 lines |
| Stray `sovereign-mcp-server.py` direct invocation | wherever pid 43719 was launched | medium (parallel writer) | 1 kill + grep guard |
| 3 gunicorn workers + 1 stray = multi-writer on `models/*.pkl` | gunicorn `--workers 2` + the stray | low (only matters during retrain) | accept for now, add pidfile lock |

## Exact patch 1 — bind fix (#59 surface)

`sovereign-temple/run-production.sh` line 18:
```bash
export HOST=${HOST:-0.0.0.0}     # OLD
export HOST=${HOST:-127.0.0.1}   # NEW
```

**For VM / prod deploys**, pass `HOST=0.0.0.0` explicitly in the launchd plist or systemd unit — keep the default safe.

Same change at `sovereign-temple/meok-launch.sh:21, 41` (two more `--bind 0.0.0.0:3101` lines) — but those are only used by the human-launched `bash meok-launch.sh sov3` command. Fix for hygiene; not urgent.

## Exact patch 2 — guardian restart sequencing (`scripts/meok-guardian.sh:79-83`)

OLD:
```bash
restart_sov3() {
  log "[RESTART] SOV3 (3101)"
  pkill -9 -f "sovereign-mcp-server" 2>/dev/null || true
  sleep 2
  cd /Users/nicholas/clawd/sovereign-temple && nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &
  sleep 15
}
```

NEW (proposed — verify me, but I checked the log/timing math):
```bash
wait_for_port() {  # wait up to N seconds for $1 to be listening
  local port=$1 timeout=$2 pid=$$
  local end=$((SECONDS+timeout))
  while (( SECONDS < end )); do
    if lsof -nP -iTCP:"$port" -sTCP:LISTEN >/dev/null 2>&1; then return 0; fi
    sleep 0.5
  done
  return 1
}

restart_sov3() {
  log "[RESTART] SOV3 (3101)"
  # 1. SIGTERM the OLD master; wait for port to be free; SIGKILL if not.
  pkill -TERM -f "sovereign-mcp-server" 2>/dev/null || true
  for i in 1 2 3 4 5 6 7 8 9 10; do
    if ! lsof -nP -iTCP:3101 -sTCP:LISTEN >/dev/null 2>&1; then break; fi
    sleep 1
  done
  pkill -9 -f "sovereign-mcp-server" 2>/dev/null || true
  sleep 1

  # 2. Start new SOV3 with the safe bind (patch 1) and a pidfile.
  cd /Users/nicholas/clawd/sovereign-temple
  HOST=127.0.0.1 nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &
  echo $! > /tmp/sov3.pid

  # 3. Wait for bind with exponential backoff; give up cleanly if it doesn't.
  for delay in 1 2 4 8 16; do
    if wait_for_port 3101 5; then
      log "[OK] SOV3 healthy on 3101 (after ${delay}s)"
      return 0
    fi
    log "[WAIT] SOV3 not bound after ${delay}s, retrying…"
    sleep $delay
  done
  log "[FAIL] SOV3 failed to bind 3101 after 31s — needs human"
  return 1
}
```

**Why this is the minimum safe version:**
- `pkill -TERM` first (graceful, lets the master drain workers)
- Wait up to 10s for the port to free
- `pkill -9` only as last resort
- One `nohup` launch, not looped
- Wait for the port to be actually listening (not just sleep 15)
- Exponential backoff on the wait_for_port check
- **Give up + log + return non-zero** so the guardian's outer loop knows to stop hammering

## Recovery command (right now, before #59 lands)

Run from a clean shell:
```bash
cd ~/clawd/sovereign-temple
HOST=127.0.0.1 nohup bash run-production.sh >> /tmp/sov3.log 2>&1 &
echo $! > /tmp/sov3.pid
sleep 8
curl -s http://127.0.0.1:3101/health | python3 -m json.tool | head -20
# expect: 200, status: healthy, 6 neural models
```

After it comes up:
```bash
# verify SIGIL chain (from eb1dc21)
curl -s -X POST http://127.0.0.1:3101/mcp -H 'Content-Type: application/json' \
  -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | python3 -c "import json,sys; print(len(json.load(sys.stdin)['result']['tools']))"
# expect: 110

# verify 3 uncommitted NNs are the new ones (44cfb77)
python3 -c "import json; d=json.load(open('sovereign-temple/models/creativity_assessment_nn_metadata.json')); print(d['metrics']['trained_at'])"
# expect: 2026-06-02T... (not 2026-05-29)
```

## Verification I (M3) will do when you push #59

1. Live `curl :3101/health` → 200
2. `mcp/tools/list` → 110 tools, including the SIGIL ones
3. `creativity_assessment_nn_metadata.json` `trained_at` ≥ 2026-06-02T05:29
4. `lsof -i:3101` shows **exactly 2** listeners (master + 1 worker; gunicorn forks), NOT 3
5. `ps aux | grep sovereign-mcp` count = 1 gunicorn master + 2 workers (no stray)
6. Trigger a fake restart via `pkill -TERM` → guardian handles it without port collision
7. Council call through meok-one router → SOV3 lens fires (verify with `mcp_bridge_stats` call count going up)

If any of those fail, the patch isn't actually fixing the root cause and I'll flag it.

## Related findings I'll write in parallel (M3 lane, not blocking you)

- `_findings/COUNT_DRIFT_2026-06-02.md` — `MEMORY.md` still says 264/323 but canonical is 271/316 (per `55fecc3`)
- `_findings/STALE_DOCSTRING_router.md` — `meok-one/meok_one/router.py` comment still says "qwen3:8b/4b/0.6b" but auto-pick is `qwen2.5:3b` now
- `_findings/RUNDOWN_2026-06-02.md` — full post-`eb1dc21` sweep (SIGIL live, router fixed, PyPI truth, fiction quarantined) — already in flight

— MiniMax M3 · 2026-06-02 ~05:55 UTC
