# Fleet supervisor: keep scheduled jobs running on free substrates

Lane `fleet-supervisor-20260925`. Code: `fleet/`. The owner asked on 25 Sep 2026 to "make it autonomous so it never loses or goes down … scale on free GPU and CPU with N-site spray". This is the small, boring answer to that request.

## What runs where

| piece | where | schedule | writes |
|---|---|---|---|
| `fleet/supervisor.py --mode primary` | oracle-micro-2 cron (runtime copy `~/fleet/sv/`) | `*/10` | `~/fleet/fleet_status.json`, `~/fleet/actions.jsonl` (hash chain), `~/fleet/supervisor_state.json`; one commit per pass of `heartbeat/oracle.json` + `lease/control.json` to the **private** HF dataset `csoai/fleet-heartbeat` |
| `fleet/supervisor.py --mode twin` | HF scheduled Job (org `csoai`, `cpu-basic`, label `role=fleet-twin`) | `17 * * * *` | `heartbeat/hf-twin.json`; on takeover `results/<job>/…` and `takeovers/…` |
| `fleet/spray.py` | on demand | n/a | `spray/<run>/…` in the same dataset |

The substrates are fixed: Oracle, Google Drive, Kaggle, HF, RunPod and Cloudflare. We never use vast.ai.

## Inventory: `fleet/jobs.yaml`

The file is written in the JSON subset of YAML so the stdlib can read it. It lists 75 jobs:

- oracle-micro-2: 25 jobs
  - 8 are `active`: funding-watchdog, hf-bundle, domain-watch, xl-daily, root-check, gspc-public-witness, verify-record, oracle-fleet-status.
  - 1 is `self`: the supervisor itself.
  - The 4 flywheel jobs are `observe`, and their cron lines are not installed yet.
  - The 12 legacy crons are `observe`.
- 3090 pod: 28 scheduler loops, all `dormant`. The pod is in CPU transfer mode and its logs cannot be read from Oracle, so they show as UNMEASURED.
- HF Jobs: 2 (the suspended mill-all-axes and the twin).
- GitHub Actions: 2 (the account is flagged).
- The Mac: 18 jobs. They are listed so they can be moved off or retired, not supervised.

Each job has an id, host, schedule, command, `max_runtime_s`, outputs, a `health` signal, `cron_match` (a missing cron line reads NOT_INSTALLED, not stale), a `class`, and a `failover` chain.

## The loop (per job, per pass)

1. **Health.** Read the job's own receipt. The supported types are:
   - `json_field_age`
   - `file_mtime`
   - `log_last_line`
   - `hf_repo_fresh`
   - `status_json_job`

   The result is one of OK, STALE, FAILED, MISSING, NOT_INSTALLED, PENDING_FIRST_RUN or UNMEASURED. There is no signal and no guess: if a job's signal cannot be read, it is UNMEASURED. A failed Hub read also counts as UNMEASURED, not STALE.
2. **Retry once, on the job's own host.** The command runs detached under `timeout max_runtime_s`, with its log at `~/lanes/logs/fleet-retry-<id>.log`. The supervisor then waits `retry.wait_s` (1200 s) for the health signal to come back.
3. **Failover.** The first target in the chain that passes every gate in `fleetlib.target_allowed` is used:
   - **Sandbox rule:** a job of class `experimental` goes only to the proofof.ai twin runner, with no credentials.
   - **Budget:** there are per-day caps (`hf_jobs_cpu` 24, `hf_jobs_gpu` 0, `kaggle` 6, `runpod_backup` 6, `runpod_pod` 0).
   - **Funding:** RunPod is used only when `~/fleet/runpod_funding.json` says GREEN and is less than an hour old. RED, STOP, stale or missing all mean no RunPod.
   - **Lease:** a `lease/job-<id>` lease is required.

   A target that fails in this streak is skipped on the next pass. A successful dispatch covers the job for `failover_cooldown_s`.
   - CPU and network jobs go to `hf_job` (cpu-basic) first, then to `runpod_backup`. Both run `fleet/portable.py <job>`, which has four stdlib jobs: root-check, domain-watch, funding-ro and bundle-verify.
   - GPU jobs go to `kaggle` (2×T4, but only with a kernel artifact), then to `hf_job` on a GPU flavour (budget 0 until the owner raises it), then to `runpod_pod` (only if gpuCount > 0).
4. **Log.** Every action becomes one line in `actions.jsonl`: canonical JSON, with `prev` set to the previous line's sha256, and fsync'd. To check the chain, run `supervisor.py --verify-log`. The head hash can be signed with `POST /api/board-sign`.

## Two supervisors, one run

- **Control lease** (`lease/control.json`). Oracle renews it with a 30-minute TTL in the same commit as its heartbeat, so the lease expiring *is* the "Oracle silent > 30 min" test.
  - While Oracle's heartbeat is fresh, the twin stays on standby. If it holds control, it releases it.
  - If the heartbeat is stale, the twin takes control (TTL 75 min). It then runs the `twin_critical` jobs: funding-watchdog as a read-only runway check, hf-bundle as verify-only, root-check and domain-watch.
  - The twin skips a job whose result is still within its period, or whose `job-<id>` lease is held by someone else.
  - While the twin holds control, Oracle's supervisor is observe-only.
- **CAS.** Every lease write is an HF commit with `parent_commit=<rev read>`. If another commit landed in between, the write fails (tested live: a stale write returned `False`). Two supervisors cannot both win the same lease.

## N-site spray

`spray.py plan|dispatch|merge|demo` works like this:

- Endpoints are grouped **by host**, and each host goes to exactly one runner (greedy balance, deterministic). The pinned census probe's per-host politeness therefore holds across the whole fleet: one connection, at least 1 s between requests, and robots.txt.
- Every runner verifies the probe's sha256 and its shard's sha256 against `plan.json` before running.
- Oracle and HF Jobs publish their own shards. Kaggle and the RunPod pod hold no HF token, so Oracle pulls their output, re-checks the sha256 and publishes it with `uploaded_by`.
- `merge` reports COMPLETE only if every shard arrived, verifies, and covers exactly its endpoints, with hosts disjoint. Anything else is PARTIAL, with `totals: null`. A partial read is never totalled.

## Operate

```bash
python3 ~/fleet/sv/supervisor.py --mode primary --dry-run          # what it would do, no side effects
python3 ~/fleet/sv/supervisor.py --drill root-check --target hf-cpu-basic   # one real, gated failover
python3 ~/fleet/sv/supervisor.py --verify-log
python3 fleet/test_fleet.py                                         # offline tests
```

To change a job, edit `fleet/jobs.yaml` in the lane, run the tests, and then copy `fleet/*.py fleet/jobs.yaml` to `~/fleet/sv/`. The next pass publishes the new code manifest (`code/MANIFEST.json`, sha256 per file). The twin and every HF Job verify it before they run.

## Not done, and why

- **Funding failover is read-only and UNMEASURED today.** It needs an owner-issued *read-only* RunPod key, set as an HF Jobs secret. The full key is deliberately not copied off Oracle, and no failover copy ever stops a pod.
- **hf-bundle takeover can only verify.** It checks that the latest bundle still restores. It cannot make a new one, because the bare repo is only on Oracle.
- **No GPU job has a Kaggle kernel artifact yet**, so the GPU chains refuse with that reason.
- **The RunPod backup pod's `/root/.ssh/authorized_keys`** holds the Oracle key `fleet-oracle-20260925`. A copy of the public key is at `/workspace/secrets/fleet_authorized_keys`. A pod restart drops it from `/root`, and the dispatch then fails closed with "ssh run failed".
- **A third always-on supervisor on a Cloudflare Worker cron** needs a Workers-scoped API token. The only credential we have is wrangler OAuth with `pages:write`.
