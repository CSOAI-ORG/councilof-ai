---
license: cc0-1.0
pretty_name: Compliance-evidence daily crosswalk — frameworks × provisions × coverage states (CC0)
tags: [gspc, council-of-ai, compliance, dora, eu-ai-act, crosswalk, evidence, daily]
size_categories:
- 1K<n<10K
configs:
- config_name: root-json-sample
  data_files:
  - split: train
    path:
    - 2026-11-11-cell-states.jsonl
    - 2026-11-12-cell-states.jsonl
    - 2026-11-13-cell-states.jsonl
    - 2026-11-14-cell-states.jsonl
    - 2026-11-15-cell-states.jsonl
    - 2026-11-16-cell-states.jsonl
  default: true
- config_name: root-json-v2-sample
  data_files:
  - split: train
    path:
    - 2026-11-11.jsonl
    - 2026-11-12.jsonl
    - 2026-11-13.jsonl
    - 2026-11-14.jsonl
    - 2026-11-15.jsonl
    - 2026-11-16.jsonl
- config_name: root-json-json
  data_files:
  - split: train
    path: '*.json'
language:
- en
---
# Compliance-evidence daily crosswalk (CC0)

Dated daily records mapping regulation frameworks to provisions to the estate's measurement coverage. States only — never a determination, never certification.

Files: `YYYY-MM-DD-index.json` (manifest) · `YYYY-MM-DD.jsonl` (records) · `2026-11-08-cell-states.jsonl` (per-cell states).
Verify the underlying evidence free: https://councilof.ai/gspc-verify

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `root-json-sample` (default) | `2026-11-11-cell-states.jsonl`, `2026-11-12-cell-states.jsonl`, `2026-11-13-cell-states.jsonl` … (+3) | 834 |
| `root-json-v2-sample` | `2026-11-11.jsonl`, `2026-11-12.jsonl`, `2026-11-13.jsonl` … (+3) | 786 |
| `root-json-json` | `*.json` | 10 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/compliance-evidence", "root-json-sample", split="train")
```

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_compliance_evidence_2026,
  title        = {Compliance-evidence daily crosswalk — frameworks × provisions × coverage states (CC0)},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/compliance-evidence}},
  url          = {https://huggingface.co/datasets/csoai/compliance-evidence}
}
```

<!-- csoai-card-fixes:end -->
