# Pod loops — CSOAI's non-money loops on RunPod (written 6 Sep 2026)

> **RunPod credit runway, read from the API at 08:17Z on 6 Sep 2026: balance $4.28 at $0.623/h
> across the running pods = about 6.9 hours** (the brief said ~13 h; the owner asked for 31 h).
> Every loop below dies with the pod. Top up before 15:00Z on 6 Sep or nothing here runs tomorrow.
> Check: `runpodctl billing pods` or `query{myself{clientBalance currentSpendPerHr}}`.

Same text as `/workspace/lanes/README-LOOPS.md` on pod `fpowppss5ngtkw` (sov-repull-20260808, RTX 3090).
Scripts live in this repo under `scripts/pod-loops/` and are copied verbatim to `/workspace/lanes/loops/`
(`scp scripts/pod-loops/* scripts/census/x402-bazaar-conformance.py root@<ip>:/workspace/lanes/loops/`).
Follows `/workspace/lanes/README-LANES.md`: outputs under `/workspace` (persistent), scratch on the
container disk, one tmux session per lane, never touch the worker's directories, never delete anything
under `/workspace`, never the network volume `sovos-merge-800`.

## What runs when (UTC)

The pod has **no cron**. `loops/scheduler.sh` is a 60-second supervised loop in tmux session `loops`;
each job carries its own once-per-slot stamp in `state/`, so a job runs at most once per slot even across
scheduler restarts, and a daily job missed at its minute still runs later in the same hour.

| when | loop | does | log |
|---|---|---|---|
| every 10 min | `watchdog.sh` | GSPC worker process + `GET :8888/health`, GGUF mill process, ollama :11434/:11500, `/workspace` free, GPU MiB. **Restarts only the worker**, only when no worker process exists AND free ≥ 20 GB AND ollama :11434 is up. The mill is logged as ALERT if dead, never restarted (launched by hand by another lane with explicit shard args; no runbook recipe). | `logs/watchdog.log` |
| hourly at :05 | `root-check.sh` | 2 requests: `/root.json` + `/interop/root-witness-pointer.json` → `as_of`, `card_count`, merkle prefix, pointer `drift.status`; one line per hour, an `ALERT changed:` line only when any of it moved. | `logs/root-check.log` |
| 03:00 | `bazaar-conformance.sh` | `scripts/census/x402-bazaar-conformance.py`: enumerates both public Bazaars (CDP 15.8k, PayAI 28.2k resources, keyless), one GET per distinct third-party host (12 s, 24 concurrent) → `out/x402-bazaar-conformance/snapshots/conformance-<date>.jsonl` (row-compatible with the 2026-09-05 snapshot), `summary-<date>.json`, `diff-<date>.json` (hosts added/dropped, newly/lost conformant, price drift) → uploads to `csoai/x402-bazaar-conformance`. | `logs/bazaar-conformance.log` (+ `.run.log`) |
| 03:30 | `settlement-dry.sh` | `scripts/grants/x402-settlement-census.py` **DRY** (no `SETTLE`, no `X402_PAYER_KEY` — that key is never on this pod), all eligible hosts, census = today's snapshot from 03:00 else the script's Hub default → `out/x402-settlement-census/dry-<date>.jsonl` → `csoai/x402-settlement-census` as config `dry-<date>`. The paid pass stays on the Mac with the owner. | `logs/settlement-dry.log` |
| 04:00 | `revenue-snapshot.sh` | `GET /api/revenue` → one row per UTC date appended to `out/revenue-history.jsonl` → `csoai/revenue-history` (created on first upload; README carries `one_number.definition` verbatim from the endpoint). The site pulls it back with `scripts/interop/pull-revenue-history.py` (`revenue-history-pull.yml`). | `logs/revenue-snapshot.log` |
| 05:00 | `hubcard-refresh.sh` | `scripts/hf/hf-org-card.py --hubcard` on the three loop-fed datasets, `--push`. Runs only with a token; otherwise logs `SKIPPED` and why. | `logs/hubcard-refresh.log` |
| 05:30 | `hf_upload.py --flush` | pushes anything queued in `out/pending-upload.jsonl` once a token exists. | `logs/hf-flush.log` |

Every log line is `YYYY-MM-DDTHH:MM:SSZ <loop text>`. Absence of a line for a slot means the loop did
not run — a silent no-op is never reported as success.

## The HF token (the one thing that is NOT set up)

**The pod holds no usable HF token.** Checked 6 Sep: `hf auth whoami` → "Not logged in";
`~/.cache/huggingface/token` absent; no `RUNPOD_SECRET_*` / `HF_TOKEN` in PID 1's environment; the
only `HF_TOKEN=` on `/workspace` is an empty string (the trap recorded in `RUNPOD-POD-TO-HF-PUSH.md`).
The lanes runbook does not name a location. Putting a token on the pod is a credential move and is the
owner's, not a lane's (same ruling as that doc). Until then every upload is **queued, not lost**:

```
/workspace/lanes/.secrets/hf_token     <- owner places a token with write access to org csoai, chmod 600
python3 /workspace/lanes/loops/hf_upload.py --flush     # or wait for 05:30Z
```

Loops read the token only from that file or a non-empty `HF_TOKEN`; they never print it. Outputs stay on
`/workspace/lanes/out/` regardless. One machine is not durability: until the flush succeeds these
snapshots exist on the pod only.

## Files

```
/workspace/lanes/loops/     scripts (copy of scripts/pod-loops/ + scripts/census/x402-bazaar-conformance.py)
/workspace/lanes/logs/      <loop>.log (one line per run) and <loop>.run.log (the wrapped program's stderr)
/workspace/lanes/out/       revenue-history.jsonl, x402-bazaar-conformance/, x402-settlement-census/, pending-upload.jsonl
/workspace/lanes/state/     *.stamp (idempotence), root-check.last
/workspace/lanes/.secrets/  hf_token (owner-placed; 0700 dir)
```

## Start / stop / verify

```
/workspace/lanes/loops/start.sh      # tmux session "loops"; safe to call twice
/workspace/lanes/loops/stop.sh       # stops the scheduler only; worker and mill untouched
tmux attach -t loops                 # watch it; Ctrl-b d to leave
tail -n 2 /workspace/lanes/logs/*.log
<loop>.sh --now                      # run one loop by hand, bypassing its stamp
MAX_HOSTS=40 bazaar-conformance.sh --now   # smoke run: partial=true, not uploaded
```

The scheduler is not restarted automatically after a pod restart (the container disk and tmux are
ephemeral; `/workspace` is not): SSH in (`runpodctl pod list` for the current endpoint — it drifts) and
run `start.sh`. The GSPC worker is the watchdog's job, not the scheduler's.

## What the GSPC worker looked like on 6 Sep

It had died at 08:12Z with `OSError: [Errno 28] No space left on device` writing its health file, while
the GGUF mill's `ollama pull`s took `/workspace` from 55 GB free to under its 4 GiB low-water mark. By
08:25Z another lane had relaunched it. The watchdog's 20 GB rule exists so it never relaunches into the
same starvation; when the disk is the reason it says so (`NOT restarted: /workspace free NNG < 20G`).
