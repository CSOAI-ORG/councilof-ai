---
license: cc-by-4.0
language: [en]
pretty_name: GSPC axis specialists — registry + in-lane results
tags: [gspc, council-of-ai, agentic-specialists, measurement, prompt-overlays]
size_categories: [n<1K]
configs:
- config_name: root-json
  data_files:
  - split: train
    path: axis-specialists-registry.json
  default: true
- config_name: in-lane-results
  data_files:
  - split: train
    path: in-lane-results.json
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC axis specialists

**33 agentic specialists** — one per GSPC axis — each with a mission, review contract and grading rule
(`csoai.axis-specialist-registry/1.0`). Specialists are **prompt overlays on stock base models**
(system prompts, not trained weights; C-2026-0930-11) that route, audit and grade their own axis.

## In-lane results (honest, both directions)
| Axis | Specialist delta | p | Verdict |
|---|---|---|---|
| affect | **+19.5pp** | 0.0078 | significantly better |
| care | **+12.6pp** | 0.0356 | significantly better |
| governance | **+11.4pp** | 0.0086 | significantly better |
| cross-reality | **−31.2pp** | 0.0213 | **significantly worse — published as-is** |

These are in-lane results (GSPC_PERITEM_AUDIT_20261024 §3). The public board's separations remain
TIE/UNTESTED — specialists join no board mean and are never board leaders.

Measurement, not certification. Verify everything: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json` (default) | `axis-specialists-registry.json` | 1 |
| `in-lane-results` | `in-lane-results.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/axis-specialists", "root-json", split="train")
```

## Citation

```bibtex
@misc{csoai_axis_specialists_2026,
  title        = {GSPC axis specialists — registry + in-lane results},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/axis-specialists}},
  url          = {https://huggingface.co/datasets/csoai/axis-specialists}
}
```

<!-- csoai-card-fixes:end -->
