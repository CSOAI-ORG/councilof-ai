---
license: mit
task_categories:
- tabular-regression
tags:
- synthetic
- process-model
- partial-observation
- meok
- council-of-ai
pretty_name: MEOK partial-observation process transitions v1
size_categories:
- 1K<n<10K
configs:
- config_name: train
  data_files:
  - split: train
    path: train.jsonl
  default: true
- config_name: test-predictions
  data_files:
  - split: train
    path: test-predictions.jsonl
- config_name: test
  data_files:
  - split: train
    path: test.jsonl
- config_name: validation
  data_files:
  - split: train
    path: validation.jsonl
- config_name: source
  data_files:
  - split: train
    path: SOURCE.json
- config_name: manifest
  data_files:
  - split: train
    path: manifest.json
- config_name: training-report
  data_files:
  - split: train
    path: training-report.json
language:
- en
---

# MEOK partial-observation process transitions v1

Fresh synthetic transitions from the Council's pinned procurement rehearsal engine.

## Splits

- train.jsonl: 1,600 rows from episode IDs 1000–1199 (200 episodes)
- validation.jsonl: 400 rows from IDs 1200–1249 (50 episodes)
- test.jsonl: 560 rows from IDs 1250–1319 (70 episodes)
- test-predictions.jsonl: held-out target and baseline/model predictions

The split is episode-disjoint. Each public row contains 12 partial-observation features and a four-component next-state target. The full simulator profile proportions are excluded from the public dataset. They are used internally only to evaluate the unchanged v0 privileged-input comparator; no privileged feature values are published.

## Provenance

The generator pins eight source files from Council commit 4070aa6d3140ba10226677840f4873fbedd2467e. Exact source hashes and training metrics are in SOURCE.json and training-report.json.

## Limitations

This is synthetic procurement-process data. It does not represent real people, customers, markets, institutions or physical dynamics. It is not a general world model, and model predictions do not authorise actions.


Interactive browser demo: https://csoai-meok-oowm-hybrid-lab.static.hf.space/partial-observation-v1/index.html

Model: https://huggingface.co/csoai/meok-process-world-partial-v1

Source and CI: https://github.com/CSOAI-ORG/councilof-ai/pull/4285

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `train` (default) | `train.jsonl` | 1600 |
| `test-predictions` | `test-predictions.jsonl` | 560 |
| `test` | `test.jsonl` | 560 |
| `validation` | `validation.jsonl` | 400 |
| `source` | `SOURCE.json` | 1 |
| `manifest` | `manifest.json` | 1 |
| `training-report` | `training-report.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/meok-process-world-partial-transitions-v1", "train", split="train")
```

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Citation

```bibtex
@misc{csoai_meok_process_world_partial_transitions_v1_2026,
  title        = {MEOK partial-observation process transitions v1},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/meok-process-world-partial-transitions-v1}},
  url          = {https://huggingface.co/datasets/csoai/meok-process-world-partial-transitions-v1}
}
```

<!-- csoai-card-fixes:end -->
