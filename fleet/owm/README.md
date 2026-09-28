# fleet/owm — reaction orchestrator (outer world model)

Lane `reaction-orchestrator-20260928`. The glue that runs the reaction loop end to end, around the clock:

capture → observation store → change detection → dependency index → recheck → state → sign → capsule → land.

The only human step is an owner-gated publication. Nothing here signs a new kind, lands anything or writes canon.
Canon changes go through the gated staging-mirror land path only.

| file | what |
|---|---|
| `owm-registry.json` | **The one schedule/registry.** Each stage lists the scheduled jobs that carry it, by their ids in `fleet/automation/JOBS.json` (deployed as `~/fleet/jobs_registry.json`). Each subject is a dependency-index row: claim → sources (surfaces) → fields compared. |
| `owm.py` | One cycle (stdlib, Python 3.8+). It reads job evidence from the output-novelty reader (`~/fleet/output_novelty.json`, which tracks new content rather than mtime), re-reads every subject, then writes the snapshot, the event log, the heartbeat and the log. |
| `test_owm.py` | `python3 -m unittest fleet/owm/test_owm.py` (stdlib, no network). |
| `crontab.txt` | The Oracle block (`19,49 * * * *`: flock, disk-floor, nice, timeout 300). |
| `jobs-yaml-entry.json` | The fleet-supervisor registration (`observe`). |
| `install-oracle.sh` | An idempotent install. It backs up the crontab and `jobs.yaml` first. It adds the cron line only when `OWM_ENABLE=1`. |
| `prod-canary-owm.patch` | STAGED, not applied: lets the ops-guard production canary also read the OWM heartbeat. It belongs to lane ops-guard. |
| `../../functions/api/owm.ts` | `GET /api/owm`: serves the committed `public/owm/v0.1/latest.json`, read-only, after re-deriving every count and stage status from its rows. On any mismatch it returns 503. |

## Subject states

Each subject gets one of five states:

- **CONSISTENT**: at least two surfaces answered and every compared field agrees.
- **INCONSISTENT**: the surfaces disagree, or a declared check on the one surface failed.
- **SINGLE_SURFACE**: the subject has one surface by design. Its value is recorded, but there is nothing to compare it with.
- **UNCHECKABLE**: a surface exists but could not be read or compared, or its capture failed.
- **UNMEASURED**: nothing has been observed yet. A 404 means the surface is not deployed; it proves nothing more.

The evidence digest is `sha256` over the canonical JSON of the compared field values (the atoms), not over the raw bytes. So a new `generated_at` on a page does not count as a change. The raw bytes' sha256 is kept separately for each surface.

## Stage status

Each stage gets one of three statuses:

- **LIVE**: a job carrying the stage produced new output within `2 × period + grace`.
- **STAGED**: the stage is built but not producing. Its jobs are stale, on a stopped host, failing, or not enabled.
- **MISSING**: nothing is built for the stage.

## Dead-man's switch

- For every job that missed 2 cycles, the cycle writes one line: `<ts> STALE stage=… job=… missed_cycles=…`.
- It then writes a summary line ending in `rc=0` (nothing stale) or `rc=3 … STALE jobs=…`.
- The fleet supervisor reads that last line through its `jobs.yaml` health check (`must_contain rc=0`, `max_age_s 4500`):
  - a stale stage turns the check red;
  - so does an orchestrator that has itself stopped for 2 cycles.
- `~/fleet/owm_heartbeat.json` carries the same information as JSON.

## Signing

The snapshot is a new kind, so it is **UNSIGNED** and says so. The kinds that already sign keep signing through the existing `POST /api/board-sign` path. Those are the claim-watch receipt, the corrections-watch record, the cross-ledger run, self-parity and the capsule index. Extending the signer to snapshots is an owner decision.
