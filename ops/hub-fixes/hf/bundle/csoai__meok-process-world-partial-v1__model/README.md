---
license: mit
tags:
- process-model
- partial-observation
- synthetic
- tabular-regression
- meok
datasets:
- csoai/meok-process-world-partial-transitions-v1
---

# MEOK partial-observation process predictor v1

A three-member MLP output ensemble trained on fresh synthetic procurement-process episodes without the simulator's full hidden profile proportions.

## Evaluation

The held-out test contains 560 rows from 70 episode IDs (1250–1319). The model is selected on validation only.

- Partial-observation best single MLP + simplex/expiry rules: MAE 0.0234502.
- Exported three-model output ensemble + the same rules: MAE 0.0188549.
- Persistence: MAE 0.0613514.
- Original v0 privileged-input model + rules: MAE 0.0016888. This comparator sees three additional hidden profile proportions and is not a like-for-like partial-observation comparison.

The output ensemble averages predictions; it does not merge model weights. The specialist policy router was tested and rejected because it performed worse.

## Input and output

Twelve inputs: previous four-state aggregate, previous-previous four-state aggregate, revocation indicator, ticks until permit expiry divided by eight, policy-mode indicator and tick divided by eight. Four outputs: next aggregate state proportions.

Use predict.py for dependency-free inference. It returns raw and rule-constrained outputs with an explicit NONE authority marker.

## Limitations

This is a deterministic synthetic procurement-process simulator, not a physical world model, real market model, general-purpose agent or autonomous action system. The expiry rule accounts for zero error on expired rows; this is a known rule, not learned behaviour. Worst held-out component error remains above 0.52. Do not use for real decisions or claim real-world capability.

Source and reproducibility: https://github.com/CSOAI-ORG/councilof-ai/pull/4285


## Browser demo and reproduction bundle

- Interactive browser demo: https://csoai-meok-oowm-hybrid-lab.static.hf.space/partial-observation-v1/index.html
- Reproducible source, data splits, weights and tests: [MEOK-PARTIAL-OBSERVATION-V1.zip](https://huggingface.co/csoai/meok-process-world-partial-v1/resolve/main/MEOK-PARTIAL-OBSERVATION-V1.zip)
- Canonical source and CI: https://github.com/CSOAI-ORG/councilof-ai/pull/4285

<!-- csoai-card-fixes:start -->

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Citation

```bibtex
@misc{csoai_meok_process_world_partial_v1_2026,
  title        = {MEOK partial-observation process predictor v1},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/csoai/meok-process-world-partial-v1}},
  url          = {https://huggingface.co/csoai/meok-process-world-partial-v1}
}
```

<!-- csoai-card-fixes:end -->
