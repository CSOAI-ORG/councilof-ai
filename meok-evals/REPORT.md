# SOV3 NN Eval + Training Harness Report
**Date:** 2026-07-13 · **Agent:** JEEVES

## Baseline NN Performance (from SOV3 health)

| NN | Samples | Metric | Score | Gap |
|---|---|---|---|---|
| care_validation_nn | 54 | MAE | 0.035 | ⚠️ Only 54 samples — need 500+ |
| partnership_detection_ml | 1000 | MAE | 0.192 | ✅ Good sample count |
| threat_detection_nn | 61 | accuracy | 1.000 | ⚠️ 100% on 61 = overfitting risk |
| relationship_evolution_nn | 542 | MAE | 0.075 | ✅ Good |
| care_pattern_analyzer | 642 | MAE | 0.044 | ✅ Good |
| creativity_assessment_nn | 350 | R² | 0.911 | ✅ Excellent |

## Harness Built (~/clawd/meok-evals/)

| File | Purpose |
|---|---|
| data/care_eval_500.json | 500 care-eval cases (6 dimensions) |
| data/threat_eval_100.json | 100 threat cases (4 categories) |
| evals/dataset_loader.py | Load + normalize test data |
| evals/benchmark.py | Measure accuracy/MAE/R² per NN |
| evals/hyperparam_sweep.py | Grid sweep: lr, epochs, batch_size |
| evals/report.py | Generate markdown + JSON reports |
| scripts/sweep_care_nn.py | Run sweep on care NN |

## Hyperparameter Sweep Plan
- **Grid:** lr=[0.001, 0.005, 0.01] × epochs=[20, 50, 100] × batch=[16, 32, 64]
- **Target:** care_validation_nn (currently 54 samples, MAE=0.035)
- **Expected:** 500 synthetic samples → MAE improvement from 0.035 to ~0.02
- **Status:** Harness built, pending VM execution (Mac disk full)

## Recommendations
1. **Priority 1:** Expand care NN from 54 → 500+ samples (synthetic generation)
2. **Priority 2:** Run threat eval to validate 100% accuracy isn't overfitting
3. **Priority 3:** Hyperparameter sweep on care NN (12 configs × 500 samples)
4. **Priority 4:** Cross-validation on all 6 NNs with held-out test sets
