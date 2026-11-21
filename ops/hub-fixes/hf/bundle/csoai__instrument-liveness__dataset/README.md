---
license: cc-by-4.0
pretty_name: instrument liveness
size_categories:
- n<1K
configs:
- config_name: root-json-sample
  data_files:
  - split: train
    path:
    - 2026-11-07/instrument-liveness-2026-11-07.json
    - 2026-11-08/instrument-liveness-2026-11-08.json
    - 2026-11-09/instrument-liveness-2026-11-09.json
    - 2026-11-10/instrument-liveness-2026-11-10.json
    - 2026-11-11/instrument-liveness-2026-11-11.json
    - 2026-11-12/instrument-liveness-2026-11-12.json
  default: true
tags:
- council-of-ai
language:
- en
---
<!-- csoai-card-fixes:start -->

# instrument liveness

TODO(owner): one-paragraph description of what this repository holds, who produced it and the observation date.

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json-sample` (default) | `2026-11-07/instrument-liveness-2026-11-07.json`, `2026-11-08/instrument-liveness-2026-11-08.json`, `2026-11-09/instrument-liveness-2026-11-09.json` … (+3) | 6 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/instrument-liveness", "root-json-sample", split="train")
```

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_instrument_liveness_2026,
  title        = {instrument liveness},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/instrument-liveness}},
  url          = {https://huggingface.co/datasets/csoai/instrument-liveness}
}
```

<!-- csoai-card-fixes:end -->
