# Pod loops — CSOAI's non-money loops on RunPod

> The balance and runtime observations recorded on 6 Sep 2026 were a historical
> snapshot, not a current readiness signal. Check the current pod, storage and
> billing state before installation; a passing local test proves none of them.

Installation has two commit-bound parts. A reviewed checkout at
`/workspace/council-of-ai` must contain the matching
`scripts/runpod_gspc_upload_heartbeat.py` and
`scripts/runpod_gspc_push_to_hf.py`. The shell files from that same commit go in
`/workspace/lanes/loops/`, along with
`scripts/census/x402-bazaar-conformance.py`. Do not update only the scheduler:
the heartbeat refuses an uploader without the reviewed atomic and explicit-token
interfaces. The scheduler invokes owned shell files through `bash`, so a fresh
0644 copy is supported and no broad executable-bit mutation is required.

Two similarly named source paths already have different duties; do not collapse
or silently substitute them during this maintenance:

- `/workspace/lanes/councilof-ai` is `$REPO` in `pod-loops/lib.sh` and remains
  the source used by older public-data shell loops.
- `/workspace/council-of-ai` is the dedicated intake checkout invoked directly
  by `scheduler.sh` for the heartbeat and atomic uploader.

The installation checklist must inspect and update each required path explicitly.
The new pre-merge selftest proves repository logic, not either live checkout.

The layout follows `/workspace/lanes/README-LANES.md`: durable state and output
stay under `/workspace`; scratch stays on the container disk. Do not touch the
worker's directories or the `sovos-merge-800` network volume.

## What runs when (UTC)

The pod has **no cron**. `loops/supervise.sh` holds one supervisor lease and runs
`loops/scheduler.sh`, a 60-second loop with its own lease. Each scheduled job
carries a once-per-slot stamp or its own durable due time, so restarts do not
silently duplicate work. `start.sh` reports readiness only when the recorded
scheduler child has the expected Linux `/proc` identity and holds the scheduler
lease.

| when | loop | does | log |
|---|---|---|---|
| every 10 min | `watchdog.sh` | GSPC worker process + `GET :8888/health`, GGUF mill process, ollama :11434/:11500, `/workspace` free, GPU MiB. **Restarts only the worker**, only when no worker process exists AND free ≥ 20 GB AND ollama :11434 is up. The mill is logged as ALERT if dead, never restarted (launched by hand by another lane with explicit shard args; no runbook recipe). | `logs/watchdog.log` |
| hourly at :05 | `root-check.sh` | 2 requests: `/root.json` + `/interop/root-witness-pointer.json` → `as_of`, `card_count`, merkle prefix, pointer `drift.status`; one line per hour, an `ALERT changed:` line only when any of it moved. | `logs/root-check.log` |
| every 6 hours | `runpod_gspc_upload_heartbeat.py` | Freezes complete unsigned run triples and attempts an additive atomic copy to the private intake. Uses only the dedicated token file. Records `SUCCESS`, `NO_COMPLETE_RUNS`, `FAILED`, `TIMEOUT`, `FAILED_TO_START` or `UNCONFIRMED_OUTPUT`; this does not admit, sign or publish a run. | `logs/runpod-upload.log`, `state/runpod-upload/` |
| 03:00 | `bazaar-conformance.sh` | `scripts/census/x402-bazaar-conformance.py`: enumerates both public Bazaars (CDP 15.8k, PayAI 28.2k resources, keyless), one GET per distinct third-party host (12 s, 24 concurrent) → `out/x402-bazaar-conformance/snapshots/conformance-<date>.jsonl` (row-compatible with the 2026-09-05 snapshot), `summary-<date>.json`, `diff-<date>.json` (hosts added/dropped, newly/lost conformant, price drift) → uploads to `csoai/x402-bazaar-conformance`. | `logs/bazaar-conformance.log` (+ `.run.log`) |
| 03:30 | `settlement-dry.sh` | `scripts/grants/x402-settlement-census.py` **DRY** (no `SETTLE`, no `X402_PAYER_KEY` — that key is never on this pod), all eligible hosts, census = today's snapshot from 03:00 else the script's Hub default → `out/x402-settlement-census/dry-<date>.jsonl` → `csoai/x402-settlement-census` as config `dry-<date>`. The paid pass stays on the Mac with the owner. | `logs/settlement-dry.log` |
| 04:00 | `revenue-snapshot.sh` | `GET /api/revenue` → one row per UTC date appended to `out/revenue-history.jsonl` → `csoai/revenue-history` (created on first upload; README carries `one_number.definition` verbatim from the endpoint). The site pulls it back with `scripts/interop/pull-revenue-history.py` (`revenue-history-pull.yml`). | `logs/revenue-snapshot.log` |
| 05:00 | `hubcard-refresh.sh` | `scripts/hf/hf-org-card.py --hubcard` on the three loop-fed datasets, `--push`. Runs only with a token; otherwise logs `SKIPPED` and why. | `logs/hubcard-refresh.log` |
| 05:30 | `hf_upload.py --flush` | pushes anything queued in `out/pending-upload.jsonl` once a token exists. | `logs/hf-flush.log` |

Every log line is `YYYY-MM-DDTHH:MM:SSZ <loop text>`. Absence of a line for a slot means the loop did
not run — a silent no-op is never reported as success.

## Separate credentials for separate duties

Do not infer current credential readiness from the 6 Sep snapshot. Verify it on
the running pod without printing token contents. Existing public loop outputs use
the legacy upload credential:

```
/workspace/lanes/.secrets/hf_token
```

The private GSPC intake heartbeat must not use that account-wide path. It uses
only this owner-placed, owner-owned, regular, non-symlink, owner-only file:

```
/workspace/lanes/.secrets/runpod-intake-hf-token
```

Provision the second file with a fine-grained token limited to read/write the
private dataset `csoai/runpod-gspc-intake`; 0600 is recommended. The scheduled
path never falls back to `HF_TOKEN`, `HUGGINGFACE_TOKEN` or the CLI cache. The
code verifies destination privacy, not the token's scope in account settings.
See `RUNPOD-POD-TO-HF-PUSH.md` for dry-run and byte-comparison acceptance.

## Files

```
/workspace/lanes/loops/     scripts (copy of scripts/pod-loops/ + scripts/census/x402-bazaar-conformance.py)
/workspace/lanes/logs/      <loop>.log (one line per run) and <loop>.run.log (the wrapped program's stderr)
/workspace/lanes/out/       revenue-history.jsonl, x402-bazaar-conformance/, x402-settlement-census/, pending-upload.jsonl
/workspace/lanes/state/     leases, process ids, *.stamp, root-check.last, runpod-upload receipts
/workspace/lanes/.secrets/  hf_token + dedicated runpod-intake-hf-token (owner-placed; 0700 dir)
/workspace/council-of-ai/   reviewed matching repo checkout containing the two intake Python files
```

## Start / stop / verify

```
bash /workspace/lanes/loops/start.sh # succeeds only with supervisor + verified scheduler child
bash /workspace/lanes/loops/start.sh # repeat is a no-op only when both are healthy
bash /workspace/lanes/loops/stop.sh  # stops the verified supervisor and its scheduler child only
tail -n 2 /workspace/lanes/logs/*.log
bash <loop>.sh --now                 # run one shell loop by hand, bypassing its stamp
python3 /workspace/council-of-ai/scripts/runpod_gspc_upload_heartbeat.py --dry-run
```

For restart persistence, first verify that `/start.sh` is the image's real current
entrypoint and inspect any `/post_start.sh` behavior. Only then configure the pod
start command to invoke
`bash /workspace/lanes/loops/container-start.sh`. That wrapper starts the
verified supervisor and then execs the existing `/start.sh`; it must not be
installed by guesswork. Without that configured and restart-tested, start the
supervisor manually and describe it as non-durable. The GSPC worker remains the
watchdog's job, not the supervisor's.

Deployment acceptance is: matching reviewed source files; `flock`, Python and
`huggingface_hub` available; no unmanaged scheduler; successful nonempty private
dry-run; one real private upload followed by byte comparison; a zero-write repeat;
and a restart test showing a later due attempt is invoked. No signing key belongs
on this compute pod.

## What the GSPC worker looked like on 6 Sep

It had died at 08:12Z with `OSError: [Errno 28] No space left on device` writing its health file, while
the GGUF mill's `ollama pull`s took `/workspace` from 55 GB free to under its 4 GiB low-water mark. By
08:25Z another lane had relaunched it. The watchdog's 20 GB rule exists so it never relaunches into the
same starvation; when the disk is the reason it says so (`NOT restarted: /workspace free NNG < 20G`).
