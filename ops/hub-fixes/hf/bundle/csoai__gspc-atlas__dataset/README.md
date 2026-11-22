---
license: cc0-1.0
task_categories: [text-classification]
tags: [gspc, council-of-ai, gpai, eu-ai-act, regulation, atlas, regulator-doors, deadlines, mica, dora]
pretty_name: GSPC Atlas — Global Regulation mirror (CC0)
size_categories:
- n<1K
configs:
- config_name: gpai-matrix
  data_files:
  - split: train
    path: gpai-matrix.json
  default: true
- config_name: regulator-doors
  data_files:
  - split: train
    path: regulator-doors.json
language:
- en
---
# GSPC Atlas — Global Regulation mirror (CC0)

Mirror of the Global Regulation Atlas public artifacts: the EU AI Act provision × estate-tooling grounding matrix (GPAI focus Arts 53–55 + Code of Practice; schema `csoai.gpai-matrix/0.1`) and the regulator doors calendar (schema `csoai.regulator-doors/0.1` — 23 dated doors across NYDFS, BoE, EBA and more).

Truth boundaries (verbatim from the sources): the matrix is DERIVED_GROUNDING — measurement, not certification; a door is a dated public procedure, not a determination; coverage statuses (WIRED/PARTIAL/UNMEASURED) are the estate's honest states.
Primary sources: https://councilof.ai/interop/gpai-matrix.json · regulator calendar maintained in the councilof-ai working repo.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `gpai-matrix` (default) | `gpai-matrix.json` | 1 |
| `regulator-doors` | `regulator-doors.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-atlas", "gpai-matrix", split="train")
```

## Citation

```bibtex
@misc{csoai_gspc_atlas_2026,
  title        = {GSPC Atlas — Global Regulation mirror (CC0)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-atlas}},
  url          = {https://huggingface.co/datasets/csoai/gspc-atlas}
}
```

<!-- csoai-card-fixes:end -->
