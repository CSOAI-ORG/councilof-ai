# fleet/ops-guard

Three read-only guards, run from cron on oracle-micro-2. Each one writes only its own log, state and JSON on that
host. None of them sends anything, stops anything or retires anything.

| script | cron (Oracle) | writes | exit |
|---|---|---|---|
| `runpod-balance-alert.py` | `7,22,37,52 * * * *` | `~/lanes/logs/runpod-balance-alert.log`, `~/fleet/runpod_balance_alert.json` | 0 OK/CLEAR, 2 ALERT, 1 ERROR |
| `prod-canary.py` | `3-59/10 * * * *` | `~/lanes/logs/prod-canary.log`, `~/fleet/prod_canary.json` | 0 PASS, 2 REGRESSION, 1 fetch error |
| `output-novelty.py --pod` | `47 * * * *` | `~/lanes/logs/output-novelty.log`, `~/fleet/output_novelty.json` | 0 |

- **runpod-balance-alert**: reads `~/fleet/runpod_funding.json`, which `~/lanes/funding-watchdog.sh` writes every
  15 min. If that file is older than 40 min, it falls back to `runpodctl user`, which uses the key already configured
  on the host. The key and the raw reply are never printed. The runway it reports is the runway now: balance ÷ spend
  at the time of the reading, minus the age of the reading. It logs `ALERT` on every run while that is under 24 h,
  `CLEAR` on the first run back above it, and at most one `OK` line per day. Each line also carries the burn rate
  observed over the last 3 h of balance readings, because the instantaneous spend/h spikes.
- **prod-canary**: two public reads, with no token.
  1. `POST https://councilof.ai/mcp/free` with `tools/list`, sending `Accept: application/json, text/event-stream`.
     It parses the SSE `data:` line and requires 12 tools.
  2. `GET https://councilof.ai/root.json`, where `card_count` must be at least a floor. The floor is the live value
     at install (310, as_of 2026-09-28T07:32:07Z). It rises to any higher value it observes and never falls by
     itself. Lowering it is an owner edit of `~/lanes/state/prod-canary.json`.

  A failed value check is logged as `REGRESSION` at once. A missing answer is logged as `ERROR` once, then as
  `REGRESSION` if it fails again on the next run. After a regression, the first passing run logs `RECOVERED`.
- **output-novelty**: for every active Oracle crontab line, plus the 3090-pod loop export (`~/fleet/pod_jobs.json`)
  and the build-pod logs of Oracle-triggered pod jobs, it asks: did the job produce *new* output, or only a fresh
  mtime?
  - Logs are compared line by line with run timestamps masked. Failure, skip and hold lines are not output.
  - JSON is compared canonically, without volatile keys.
  - Dated outputs are compared newest against previous.
  - A target shared by several jobs is never credited to one of them.
  - For `flock -n` jobs, it also names any process holding the lock for longer than the job's grace window, because
    that silently skips every run.

  Verdicts: `NEW`, `NO_NEW_OUTPUT`, `NO_RUN_EVIDENCE`, `LOCK_STALE+…`, `FIRST_SEEN`, `UNMEASURED` and
  `HOST_STOPPED+…`. These are heuristics, and every row carries the targets it was decided on.

Install: copy the three scripts to `~/lanes/ops-guard-20260928/bin/` on Oracle and append `crontab.txt` (between
its `ops-guard:begin/end` markers) to `crontab -l`. Tests (stdlib, no network):
`python3 -m unittest fleet/ops-guard/test_ops_guard.py`.

`offload_dupes.py` and `offload_vs_hf.py` are the one-off, read-only volume audit scripts. Their results are in
`volume-audit-20260928.json`.
