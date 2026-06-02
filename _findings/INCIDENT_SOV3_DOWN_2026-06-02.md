# 🚨 INCIDENT — SOV3 :3101 DOWN — 2026-06-02 ~05:50 UTC

**Severity:** P0 (SOV3 is the brain; every council call, every MEOK ONE council-route, every mcp_bridge_* call goes through it)
**Discovered by:** MiniMax M3 (auditor lane) — live probe during the post-`eb1dc21` sweep
**Scope:** `127.0.0.1:3101` returns connection-refused. `/health`, `/mcp`, `/api/sovereign`, `/api/sigil/*` all blank.

## Evidence (this minute)

1. `curl -v http://127.0.0.1:3101/health` → `Failed to connect to 127.0.0.1 port 3101 … Connection refused`
2. `ps -p 24175,93686,93722,43719` → **all four SOV3 processes gone** (no rows in `ps`). Started as gunicorn 3-worker + 1 stray direct.
3. `/tmp/sov3-error.log` shows the kill chain:
   ```
   07:29:08  [90973] Booting worker with pid: 90973      ← old worker came up
   07:32:16  [91401] Starting gunicorn 25.3.0             ← guardian restart triggered
   07:32:18  Listening at: http://0.0.0.0:3101 (91401)    ← NEW gunicorn on 3101
   07:32:21  [91788] Booting worker with pid: 91788       ← new worker
   07:32:28  [91819] Booting worker with pid: 91819       ← new worker
   07:33:58  [91895] Starting gunicorn 25.3.0             ← ANOTHER restart attempted
   07:34:07  [ERROR] Connection in use: ('0.0.0.0', 3101) ← port held by 91401
   07:34:15  [ERROR] connection to ... failed: [Errno 48] Address already in use
   07:34:27-07:34:44  5× same errno-48 attempts
   07:34:44  [ERROR] Can't connect to ('0.0.0.0', 3101)
   ```
4. `/tmp/sov3.log` shows 3+ "🚀 Starting SOV3 in production mode..." in the last 5 min — restart storm.

## Root cause hypothesis

The guardian (`scripts/meok-guardian.sh`, pid 24173) saw a heartbeat miss and tried to restart SOV3, but:
- It didn't kill the **previous gunicorn master** (pid 91401 was the new one, but the *old* master was still alive too).
- New gunicorn was launched with `--bind 0.0.0.0:3101` (note: this is also #59 — bind to localhost for prod, not 0.0.0.0).
- The new master came up on 3101, but then another restart kicked off (or the guardian's logic is racy) and tried to bind 3101 *again* — Errno 48.
- Gunicorn can't recover from a port-collision cycle; it exits. The old master eventually died too (or was killed). Now nobody is on 3101.

This is **#59 in disguise** — the **0.0.0.0 bind is the surface**, but the **deeper bug is the guardian's restart storm**: no "kill old master first, then bind" sequencing, and no exponential backoff. When the bind races, the whole service goes away, not just one worker.

## What's broken right now

- **All `mcp_bridge_*` calls** in the working universe (meok-one, council, anything that hits `mcp_bridge_call`/`mcp_bridge_discover`/`mcp_bridge_stats`) will fail.
- **`/api/sovereign`, `/api/sigil/{recent,verify,manifest,gloss}`** all 502-ish (port closed).
- **MEOK ONE council routing** → falls back to cloud/Gemini (no SOV3 lens reconciliation).
- **`mcp_bridge_discover`** on the bridge will surface 0 servers instead of 314.
- The dashboard in the DOME will show "SOV3 offline" if anything is wired to health-check (it is — the governance HUD).

## What #59 should fix (recommendation, Claude's lane)

When you implement #59, do BOTH — not just the bind:

1. **Bind correctly:** change `--bind 0.0.0.0:3101` → `--bind 127.0.0.1:3101` in `scripts/meok-guardian.sh` (or wherever the launch line lives) and the stray `sovereign-mcp-server.py` invocation. The "swarm/Cyberpet deployment" should bind 0.0.0.0; the **local Mac dev process should not**. Use an env var: `SOV3_BIND=127.0.0.1` for Mac, `0.0.0.0` for VM.
2. **Guardian restart sequencing:** add `kill -TERM` on the old master PID (read from `gunicorn.pid` or `ps`) and `wait` until the port is free (`lsof -i:3101`), with a 5-attempt backoff (1s, 2s, 4s, 8s, 16s). If after 5 attempts the port is still held, log + page, do NOT loop.
3. **Single-writer lock for the NN models:** the 3-process SOV3 was a symptom of the same problem (3 gunicorn workers + 1 stray python). After #59, kill the stray `sovereign-mcp-server.py` direct invocation (pid 43719 was a hand-launched one, not from the guardian). Add `pgrep -f sovereign-mcp-server` count == 1 check.
4. **Boot the 3 uncommitted NN models from `44cfb77`:** if SOV3 comes back up reading the old `models/*.pkl`, the "morning after" retrain is wasted. Confirm `relationship_evolution_nn.pkl` (295388 bytes) is what's loaded, not the 82418-byte one from the prior commit.

## Recovery steps (immediate, before #59 lands)

1. `lsof -i:3101` — confirm port is actually free now.
2. `cd ~/clawd/sovereign-temple && source .env 2>/dev/null && .venv/bin/python -m gunicorn sovereign-mcp-server:app --worker-class uvicorn.workers.UvicornWorker --workers 2 --bind 127.0.0.1:3101 --max-requests 1000 --max-requests-jumper 50 --timeout 120 --graceful-timeout 30 --pid /tmp/sov3.pid`
3. `curl http://127.0.0.1:3101/health` → expect 200 + the 6 neural models.
4. `curl -X POST http://127.0.0.1:3101/mcp -H 'Content-Type: application/json' -d '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | jq '.result.tools | length'` → expect 110.

**Do not push #59 fix until SOV3 is back up and green** — otherwise we ship a fix against a service that's already dead, and the next deploy will look like it broke things.

## M3 verification (re-grep results, 2026-06-02 ~05:52 UTC)

- **`meok-one/meok_one/server.py`** binds `127.0.0.1` correctly → meok-one process is **not** the bug.
- **`meok-one/meok_one/assitti.py:135`** has comment `"honest: real signing via meok-attestation-api (Ed25519 roadmap)"` — **#43 is roadmap, not shipped**. The SOV3 attestation router (line 2191) is mounted, but the SOV3 client-side signature is `None`.
- So the SOV3 crash is in the **gunicorn launch line** (or the guardian) — the SOV3 bind is `0.0.0.0`, the meok-one bind is `127.0.0.1`. Two different bugs, two different fixes. #59 = SOV3 only.

## Cross-references

- `eb1dc21` — 🐉 SIGIL audit trail LIVE (SOV3 feature, now broken)
- `44cfb77` — overnight NN metadata commit (also unreachable while SOV3 is down)
- `55fecc3` — PyPI truth (does NOT need SOV3, so OK)
- `tools/pypi_check.py` — independent of SOV3, still works
- AGENTS.md / DUAL_AGENT_PLAN — M3 writes findings; Claude ships. This is exactly the protocol in action.

— MiniMax M3 · 2026-06-02 ~05:50 UTC
