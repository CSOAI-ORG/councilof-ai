# Measured reuse: refresh and retain (research r06)

**Disposition: optional research candidate; not a default-policy improvement or a production release.**

This self-contained experiment follows the documented failure of a no-store bypass: a cheap full recomputation can leave a cache cold for the next stable request. The candidate adds a host-only `force_refresh=False` option to the pinned existing cache. When true it skips lookup, recomputes, validates, rechecks current access/source state and retains the valid result. It grants no new authority.

## Scope and source

Study identity: `csoai.measured-reuse.refresh-retain.20261110.r06`.
Baseline: `harness/meok-memory-venturi/memory_venturi.py` at Council of AI review commit `49fea7fd9f1fc03af85c32b6b930f722136804ef`, SHA-256 `9f2249277c9897788844fe02b8397180e8383dcb4ef381490b39a65410aa4a37`.
The baseline here is an exact copy for reproduction. It is not the earlier frozen research implementation.
Candidate SHA-256: `a0332c36471bf2b726ee00bdcac7733d7b98e2991954b6beb61b6b103e635e69`.

No runtime imports this directory. No live model, permissions, default policy, grader or measurement-board scores are changed by publishing it. Existing source ownership and protected release procedures remain controlling. The copied baseline and tests retain their existing licence; see LICENSE.

## Executed result

49 unit tests passed: 34 existing plus 15 new test methods. The benchmark ran 36 repeated histories, 1,440 timed batches and 576 explicit history assertions. These are distinct denominators, not independent demonstrations of overall system correctness.

Total milliseconds over 12 whole histories at each size, including database construction:

| Records/source | Direct | Selective reuse | No-store bypass | Refresh and retain |
|---|---:|---:|---:|---:|
| 64 | 72.612 | 108.617 | 97.696 | 108.045 |
| 512 | 341.481 | 218.345 | 264.037 | 228.897 |
| 4,096 | 2,565.681 | 1,091.405 | 1,671.339 | 1,149.854 |

At 4,096 records, refresh-and-retain was 1.45x faster than the no-store bypass, but about 5.4% slower than selective reuse. Direct processing won at the cheapest tier. Do not report the comparison against bypass as an improvement over the existing selective cache.

The first stable phase after dense changes required zero provider computations with either selective reuse or refresh-and-retain, versus 14 with bypass. After the task-definition change, bypass required 16. This supports the specific cache-population mechanism, not an automatic optimal routing policy.

## Reader acceptance and retained evidence

For a single checked route from this publication to an isolated reproduction, see
[Reader acceptance](ACCEPTANCE.md). Run `python verify_publication.py` to reconcile
historical source pins, denominators and totals without rerunning the experiment.
Use its `--replay` option for a fresh, separately retained execution. Neither mode
changes the historical measurements or confers production authority.

## Reproduce

Python standard library only. From this directory:

```sh
python prepare.py
python -m unittest discover -s candidate -p 'test_*.py' -v
python run_experiment.py /absolute/path/to/new-results
```

The prepare helper verifies both source hashes and refuses a changed existing candidate. The runner requires a new output directory and writes its protocol before timing, full synthetic input files, input hashes/oracles, raw per-batch measurements, setup measurements and summary. `results/history_totals.csv` contains all 36 retained whole-cycle comparisons; `results/summary.json` and `qualification.log` retain the reviewed run. The reproduction does not guarantee identical timing on another host.

## Frozen method

Sixteen synthetic fixed-width CP037 account/sign/cents/status sources per batch; 64, 512 or 4,096 records per source; exact independently accumulated integer sums. No bank connection, customer data, general COBOL parsing, COMP-3 or neural model is involved.

Ten phases: cold, unchanged, two-source change, two consecutive 14-source changes, two stable phases, task-definition change, and two stable phases. Twelve timing repetitions per size use the same fixed corpus. Arm order is randomized within phase. Three dense/task-change phases use full-batch bypass or forced refresh; other phases use selective reuse. There is no calibration, learned optimizer or future-outcome oracle.

The batch clock includes source/permission checks, request construction, parse or lookup, output validation, retention and per-output hashing. Database setup is separately measured and included in totals. Fixture/oracle generation, imports, warmup, cleanup, assertions and aggregate hash comparison are excluded. Storage is in-memory SQLite, not a durable or distributed production backend. Energy and monetary cost are UNKNOWN. Authorization is a trusted fixture callback, not a real identity service.

Controls cover revocation before/during work, source change during work, expiry, wrong identity, invalid output, incomplete dependencies, invalidation during work, retirement, replay restrictions, invalid refresh-mode types and A-to-B-to-A revisions. No refresh request can create execution authority.

## Failure history

The first harness attempt incorrectly expected 16 recomputations after a 14-source change. The assertion failed. The expected count was corrected to 14; no candidate code or timing-based policy was changed. A clean run then produced the retained results. The correction is recorded separately rather than erased.

## Limitations and next gate

Single-host serial synthetic timing; conditional bootstrap intervals are not population or customer confidence claims. Full-model serving, KV-block isolation, persistent multi-tenant state and authenticated external effects are not tested. Compare the current selective policy against optional refresh only where a real host has an independent reason to require fresh computation. Run shadow qualification with approved source resolution, identity, retention, concurrency and rollback before any runtime adoption.
