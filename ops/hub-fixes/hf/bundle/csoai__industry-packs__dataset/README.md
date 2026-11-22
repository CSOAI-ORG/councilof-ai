---
license: cc-by-4.0
pretty_name: industry packs
size_categories:
- n<1K
configs:
- config_name: root-json
  data_files:
  - split: train
    path: company-size-packs-v0.1.json
  default: true
- config_name: root-json-v2
  data_files:
  - split: train
    path: industry-packs-v0.1.json
tags:
- council-of-ai
language:
- en
---
<!-- csoai-card-fixes:start -->

# industry packs

TODO(owner): one-paragraph description of what this repository holds, who produced it and the observation date.

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json` (default) | `company-size-packs-v0.1.json` | 1 |
| `root-json-v2` | `industry-packs-v0.1.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/industry-packs", "root-json", split="train")
```

## Front door

Council of AI publishes its live measurement board and methods at [https://councilof.ai](https://councilof.ai).

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_industry_packs_2026,
  title        = {industry packs},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/industry-packs}},
  url          = {https://huggingface.co/datasets/csoai/industry-packs}
}
```

<!-- csoai-card-fixes:end -->
