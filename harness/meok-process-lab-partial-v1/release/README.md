---
language:
- en
license: mit
tags:
- world-model
- process-model
- partial-observation
- synthetic
- experimental
---

# MEOK partial-observation process predictor v1

A fresh research candidate trained without the simulator's full hidden profile proportions. It predicts the next aggregate state in the Council's bounded synthetic procurement rehearsal. It is not a physical-world model, general-purpose agent, Cosmos fine-tune or action authority.

## Fresh experiment

- Source engine: 4070aa6d3140ba10226677840f4873fbedd2467e; source file SHA-256 pins are in SOURCE.json.
- 320 newly generated episodes, IDs 1000–1319; 2,560 transitions.
- Episode-disjoint splits: train 200 episodes / 1,600 rows; validation 50 / 400; held-out test 70 / 560.
- 12 observable features: previous state, previous-previous state, revocation indicator, remaining permit ticks, policy mode and tick. The three full simulator profile proportions used by v0 are excluded from v1 training and the public dataset.
- Eight MLP candidates across four architectures and two seeds; selection uses validation only. Ridge, persistence, two-step trend, two policy specialists and unchanged privileged v0 comparator are also measured.

## Results

See training-report.json for full error metrics, subgroup results and candidate validation scores. The unchanged v0 model is evaluated with privileged inputs on the same new test episodes; it is an upper-information comparator, not a like-for-like partial-input competitor. test-predictions.jsonl retains row-level outputs.
The exported v1 model is the top-three output ensemble selected by validation MAE. The two-specialist router used the known policy-mode input and performed worse; it is not selected. The output ensemble combines predictions, not model weights.
The portable predictor returns raw output and a separate rule-constrained simplex result. Neither output is action authority.

## Reproduction

From the bundle root: install requirements.txt, run generate_episodes.py, then train_partial.py. The generator pins and verifies the unchanged source engine; training uses fresh episode IDs 1000–1319. The old v0 weights are fetched by their exact SHA-256 pin for the privileged comparator.

## Limits

The engine is a deterministic synthetic lookup simulation. These data do not represent real procurement behaviour, humans, markets or physical dynamics. Even a lower average error does not qualify the model for actions. The exact simulator remains authoritative. No Cosmos weights were changed, no GSPC score was admitted, and no human approval or real-world effect is implied.
