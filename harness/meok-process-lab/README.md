# MEOK experimental process-world predictor v0

A real trained neural component derived from the existing Council synthetic rehearsal engine. This is **not Cosmos fine-tuning**, not a physical-world model and not a replacement for the exact simulator. It predicts the next aggregate supplier-selection state within one declared synthetic procurement process.

## Executed training

- Source engine: `CSOAI-ORG/councilof-ai` at `4070aa6d3140ba10226677840f4873fbedd2467e`.
- Hugging Face CPU training job: `csoai/6af27aba9737d9a9e08ea042`.
- 320 synthetic episodes, 2,560 transitions: 200 training episodes (1,600 rows), 50 validation episodes (400 rows), 70 held-out test episodes (560 rows).
- Nine networks: hidden sizes 8, 16 and 32→16, each with seeds 7, 17 and 29. Ridge, extra-trees, persistence, output ensemble and a constrained hybrid are also retained: 14 compared variants total.
- Selected neural model: **mlp-32-16-seed17**, 980 learned parameters. Selection used validation MAE, not test results.
- The exported JSON weights were independently replayed using the Python standard library over all 560 test rows. Digest mismatch, malformed inputs and nonfinite values are rejected.

## Results and limitation that must remain visible

| Variant | Held-out mean absolute error | Worst absolute component error |
|---|---:|---:|
| Selected neural | 0.006131327 | 0.837697423 |
| Neural + simplex projection + known expiry rule | 0.002879733 | 0.749907660 |
| Nine-network output ensemble | 0.009127069 | 0.357089498 |

Errors are fractions of synthetic population, averaged across four state components. **A small average does not imply reliable individual predictions:** the constrained hybrid still has a worst component error near 0.75. It is not qualified to decide actions. The exact deterministic engine remains authoritative for this small domain; no speed or accuracy advantage over that engine is established.

The hybrid applies a known rule when the simulation permit is expired, and otherwise projects predictions onto non-negative proportions summing to one. This is a measured example of combining learned approximation with known structure, not evidence that arbitrary models can be merged or that governance can be learned away.

## Run without a model framework

```sh
python predict.py --weights weights.json --expected-sha256 9fbffae6eb2f025a729a74022d041437f630bf06d60b4964019be10b70ba7c8b --features '[0,0,0,1,0.3,0.4,0.3,0,1,1,0]'
```

The output is explicitly `MODEL_PREDICTION_NOT_OBSERVED`. No network, tool execution, payment, model training or GSPC write occurs in inference. The model uses privileged full simulator profile proportions; partial-observation, physical and customer-domain generalisation have not been tested.

## Reproduce

`train_world.py` downloads the pinned, unchanged engine and its minimal dependencies, generates synthetic fixtures, trains the declared candidate set, exports portable weights and records source hashes. Runtime: Python 3.12, numpy 2.2.6, scipy 1.15.3, scikit-learn 1.7.2. No pretrained model weights or third-party model outputs are used.

The original synthetic fixture's permits are logical simulation controls, not authenticated human approvals. The dataset is new authorised experimental output from the pinned fixture, not admission of prior real observations for training. No canonical GSPC score, safety credential, customer outcome or physical photonic/quantum result is claimed.

Dataset splits and weights are mirrored to Hugging Face with this source revision. Keep training, validation and test separate. Any future optimisation against this published test set requires a new untouched evaluation set.
