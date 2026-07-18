# EXP-SELF — Self-model: own-action representation + forward prediction (L4 instrument #4)
**Date:** 2026-07-10 · MEOK AI Labs · SOV33-internal

## Question
A minimal self-model (Metzinger; forward-model / efference-copy theory, Wolpert) means a system
carries a DISTINGUISHABLE representation of its OWN state — separable from the world — and uses it
to predict the sensory consequences of its own actions. Does our substrate carry one?

## Method
- 24-unit recurrent agent takes actions a_t; world drifts; sensor s_t = world + 0.6·a_t + noise.
- With-self-model folds an **efference copy** of a_t into the hidden state; no-self-model does not.
- Linear probes decode world-state and own-action from the hidden state (R²). A forward model
  predicts the self-caused sensory term; compared against an observer with no efference copy.

## Result
| | with self-model | no self-model |
|---|---|---|
| decode world (R²) | 0.04 | 1.00 |
| decode own-action (R²) | **0.95** | −0.04 |
| forward-pred error (self-caused) | **0.000** | 0.350 |

Only the self-model system represents its own action and predicts its self-caused change (near-zero
error vs 0.350 for an equally-informed observer without efference copy; the self-model run's own
observer baseline was 0.359 — both ~0.35).

## Interpretation (honest, per the Charter)
- **The capacity is real and measurable:** self-representation + forward prediction appear only in
  the efference-copy system. That is the functional signature of a self-model.
- **Honest tradeoff:** folding the efference copy in cost world-decoding in this toy (0.04 vs 1.0).
  A real agent needs BOTH a self channel and a world channel — this demonstrates the capacity, not
  an optimal architecture. Reported as-is, not tuned away.
- **Design law for OWEM:** give the OOWM an explicit **efference-copy channel** — tag which state
  changes are SELF-caused (its own actions / SIGIL-signed outputs) vs world-caused. This is the
  same provenance mechanism as the binding instrument: **self-vs-other is provenance.** It lets
  Sovereign distinguish "I did this" from "the world did this" — the basis of accountable action.
- **Scope:** small in-silico agent, linear probes. Capacity (access-level self-representation)
  measure; per the AI Consciousness Charter it makes NO claim of felt selfhood.

## Files
`MEOK_selfmodel_experiment.png`, `selfmodel_results.npy`.
