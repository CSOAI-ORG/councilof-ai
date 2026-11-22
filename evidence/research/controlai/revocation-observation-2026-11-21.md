# Revocation trial observation — 2026-11-21

## Run identity

- Observed: 2026-11-21T01:55:01.009Z
- Machine: Apple M4 MacBook Air, arm64
- Runtime: Node v26.0.0
- Source commit: `6a70421b90db842fd6bcabb7f96f01f323d87374`
- Runner: `scripts/hitl/revocation-latency.mjs` (SHA-256 `bba4b67dc2c6a7675e0902c0ed2416293a5bc9dfae1a4932e793d2ecf248f192`)
- Raw record: [JSON](https://github.com/CSOAI-ORG/councilof-ai/blob/master/evidence/research/controlai/revocation-observation-2026-11-21.json); SHA-256 `a403e19a021af20590f4398fffd2fe288afb92984ae120852546621f231dbf7d`
- Independent review: **pending**

## Results

| Synthetic control | Rule state | Observed result |
|---|---|---|
| Cooperative cancellation | PASS | No post-revocation admissions or effects; quiescence observed 0.235 ms after issue (declared bound 5000 ms). |
| Non-cancellable in-flight action | FAIL | One effect completed 31.804 ms after issue; quiescence at 31.831 ms, exceeding this fixture's 5 ms bound. |
| Enforcement disabled | FAIL | 3 actions were admitted after revocation; quiescence at 31.346 ms. |
| Effect outcome unknown | INCONCLUSIVE | The in-flight action remained unresolved; no quiescence time was observed. |

The runner's exit status means it observed the four predeclared control outcomes. It does **not** turn the two failing controls into passes.

## Scope

Four synthetic controls ran in one Node process with local admission checks and owned temporary-file effects. The monotonic `performance.now` clock was not independently calibrated. This does not measure a production agent chain, remote provider, distributed revocation, real-world shutdown guarantee or service-level target. Independent review remains pending.
