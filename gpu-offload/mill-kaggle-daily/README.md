# mill-kaggle-daily: the GSPC mill on Kaggle's free 2x T4

The live lane runs on **oracle-micro-2** from `~/lanes/mill-kaggle-daily/` (cron `40 10 * * *`, private kernel
`nicktempleman/csoai-mill-kaggle-daily`). Until 2026-09-28 it existed only there. This directory puts it under version
control. The first commit holds the live bytes exactly (see `LIVE-SHA256SUMS`). Later commits are proposals, and
none of them is on Oracle until someone installs it (see `POST-ROTATION.md`).

| file | what it is |
|---|---|
| `run.sh` | the cron job: rotation pick, quota/disk guards, kernel push/pull, intake, signing (pod token), landing on a `mill/auto-<H>` branch. It never merges. |
| `kernel_template.py` | the Kaggle kernel: pinned code tarball + banks + model digest; it HALTs on any pin mismatch |
| `newest-models.json` | the rotation file for the newest classes. Each entry carries its release date, licence, runtime check, fit and the pinned manifest digest |
| `reports/newest_models_weekly.py` | the weekly report generator. It reads local receipts and slices only and writes `~/lanes/reports/newest-models/`. **Publication is HELD for the owner** |
| `reports/inventory-*.json` | the release inventories the report reads (it uses the newest file) |
| `rotate-kaggle-credential.sh` | **owner-run, HELD** until the Kaggle token is rotated |
| `test_run_guards.sh` | tests for the HOLD/deny-list guard, the build-pod address block and the rotation script (stub CLI, no network) |

Standing rules: measurement, not certification. A single-runtime slice is NOT ADMITTED to the board (owner rule
2026-09-26). Our own models are never eligible for the rotation and never enter a comparison. A model not run is
UNMEASURED.
