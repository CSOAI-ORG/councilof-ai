# The mill on HF Jobs — the door outside GitHub Actions

`scripts/hf/hf_jobs_mill.py`

## Why: GitHub Actions cannot clear the reachable set in 48 h at any schedule

Authoritative inputs, `public/interop/hf-coverage.json` (as_of 2026-09-05T13:41Z):

    reachable models             : 470
    cells_possible_for_reachable : 6110   (470 x 13 rotation axes)
    cells_measured_for_reachable :  620
    cells_open_for_reachable     : 5490
    models_not_probed (budget)   : 5458   <- not probed is NOT unreachable

Unit cost **measured**, not modelled, from `hub-queue-mill` run 33970269834:

    0.925 wall-minutes per model-axis grading
    0.62 staged per graded
    5490 open cells -> 8784 gradings -> 135.4 h = 5.6 days SEQUENTIAL

| lane | throughput | days to clear |
|---|---|---|
| GHA grade=36, observed 13.5 runs/day | 304 cells/day | 18.1 |
| GHA grade=36, a *perfect* 24 runs/day | 540 cells/day | 10.2 |
| HF Jobs, 1 parallel | — | 5.6 |
| HF Jobs, 2 parallel | — | 2.8 |
| **HF Jobs, 3 parallel** | — | **1.9 (45.1 h) — meets 48 h** |

The 45-minute job timeout caps a GHA run near `grade~49`, and the current `grade=36` already spends
~33 of those minutes. **Removing the 44% schedule starvation still leaves 10.2 days.** The timeout is
the binding constraint, not the schedule — which is why the door has to be outside Actions.

## The door is proven, not assumed

    job 6a9c52f9259f8e97255e3c7a  COMPLETED  "TUI2-DOOR-PROOF queue rows: 2773"   (private dataset read)
    job 6a9c53d5e686246ca69a41c7 COMPLETED  a real mill run:
      queue rows: 2773  bank items: 37
      picked 886, graded 2, staged 2 cards (n=30, route hf-router)
      uploaded 5 file(s) to csoai/mill-jobs-staging

## Transport: inline, not cloned

`harness/gspc-top100/mill_hub_queue.py` is 37,879 bytes of **pure stdlib with no local imports**, so
it ships base64-inline in the job command. No git credential is handed to a third-party runner, and
the job always runs the bytes in *this checkout* rather than whatever a branch happened to hold.

## Credentials

The mill talks to direct provider APIs as well as the HF router — which is why it reaches models an
HF-token-only probe cannot, and why a reachability figure measured with one token describes that
token, not the estate.

Keys present in the caller's environment are forwarded as job **secrets** (never `--env`, which is
echoed in job metadata), and only their **names** are ever printed. With no key at all the launcher
**refuses**: the mill would grade almost nothing and the small result would read as a measurement.

## Run it

    # one shard
    python3 scripts/hf/hf_jobs_mill.py --axis safety --bank-dataset csoai/gspc-agi --grade 36

    # three parallel shards — the configuration that meets 48 h
    for i in 0 1 2; do
      python3 scripts/hf/hf_jobs_mill.py --axis safety --bank-dataset csoai/gspc-agi \
        --grade 36 --shard $i --shards 3 --timeout 6h
    done

    python3 scripts/hf/hf_jobs_mill.py --axis safety --bank-dataset csoai/gspc-agi --dry-run

Staged cards land in `csoai/mill-jobs-staging/<axis>/shard-<i>-of-<n>/`. **Nothing here signs, marks
MEASURED, or writes the board** — the OIDC signer and the human merge gate are unchanged.

## Not done

`--shard/--shards` are recorded in the upload path but the mill has no shard selector yet, so three
parallel jobs on one axis would grade overlapping models. Sharding by axis works today (13 rotation
axes); sharding *within* an axis needs a `--shard` in `mill_hub_queue.py`.
