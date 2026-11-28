# Reaction observation timing and witness availability

This study replays a frozen MEOK neural actor against the existing synthetic process oracle. It evaluates 72 new seed groups across three population ranges, two simulator modes, three horizons (8, 16 and 32 steps), and 25 arms per horizon, for 201,600 evaluated transitions. The two modes and all interventions for a seed are matched. The horizons reuse the same seed groups, with horizon-specific expiry and revocation draws. A previously unseen seed here is a new synthetic trajectory.

The pre-run plan binds the harness, prior instrument, frozen neural weights, oracle revision, schedule and primary comparison. Each assisted trajectory receives exactly 1, 2 or 4 attempted observations. Stale and missing responses count against the budget. The fresh arm receives the exact preceding state pair from the synthetic oracle. The mixed profile offers fresh, missing and two-tick-old responses at predeclared rates. The harness rejects stale responses and keeps predicted history when a witness is unavailable. Stale and missing controls reproduce the unassisted errors exactly. A successful refresh costs one extra actor forward pass.

| Horizon | Unassisted MAE | Two early checks, mixed | Two evenly spaced checks, mixed | Two evenly spaced checks, fresh |
| --- | ---: | ---: | ---: | ---: |
| 8 | 0.08632 | 0.05509 | 0.05734 | 0.03952 |
| 16 | 0.08878 | 0.06891 | 0.06309 | 0.04587 |
| 32 | 0.09044 | 0.08129 | 0.07284 | 0.05487 |

At the primary 16-step horizon, evenly spaced minus early MAE was −0.00582 with a paired, population-stratified 95% bootstrap interval of [−0.01492, +0.00369]. The interval includes zero, and the large-population point estimate favours the early schedule. The trial matches attempts, while the two schedules received 140 and 128 fresh observations respectively. The 16-step mixed evenly spaced arm made 288 attempts, rejected 76 stale responses, received 72 missing responses, applied 140 refreshes, corrected 64 above-tolerance forecasts immediately and moved zero forecasts from within tolerance to above tolerance. It refreshed 51 forecasts that were already within tolerance. This counts the cost of checking a correct forecast. The harness measures prediction refreshes and forecast errors. Holding or delaying an action has separate costs.

At 32 steps, four evenly spaced checks yielded 1,785/4,608 above-tolerance forecasts with fresh witnesses and 2,315/4,608 with mixed witnesses, compared with 3,410/4,608 unassisted. The 16- and 32-step conditions extrapolate beyond the actor's original eight-step feature scale. The simulator has a small number of state changes, so transfer to a changing external process requires further evaluation. All comparisons apart from the planned 16-step test are descriptive.

## Reproduce

Run from this directory using Python and NumPy. The existing loaders verify the exact model and simulator bytes obtained from their public pinned revisions.

```sh
python3 reaction_observation_attempts.py \
  --plan reaction-observation-attempts-plan-20261127.json \
  --out /tmp/reaction-observation-replay.json
```

- Plan SHA-256 `746b0a6aaa3706b460430bb0b2fb90f690554a25cb636f007a9dca697d7a9ec1`.
- M4 result SHA-256 `1323fbadf873bfeb2b64876e176dadb843cacee4ab44f8f5019c4f9cf4ff6354`.
- M2 result SHA-256 `de4a321ae2630a5f68a8bf6436f1e7f2f2ae6370e802290a68674c950dd40a59`.
- M4 (Python 3.14.7, NumPy 2.4.6) and M2 (Python 3.9.6, NumPy 2.0.2) produced matching canonical summaries after dropping the NumPy version and rounding floating-point values to 12 decimal places. Normalized SHA-256 `80cdc590ab185b00323ee084725bca633e17400f2bcab9d171d8f0ecdf17831e`.
- The earlier M4 referee audit and equal-budget report replayed byte for byte. The M4 original refresh report matched after omitting a newly emitted null follow-up field. On the M2 the original and equal-budget report counts agreed, with a maximum numeric difference of 2.78e-17 and differing detailed receipt hashes.

The result supports retaining a fixed schedule as the baseline. Qualification for adaptive scheduling would need a comparison that controls for both attempts and successful observations, and measures the cost of interrupting otherwise correct work.
