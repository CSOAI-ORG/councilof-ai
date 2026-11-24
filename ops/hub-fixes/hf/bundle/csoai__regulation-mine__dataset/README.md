---
license: cc-by-4.0
pretty_name: The Regulation-Measurement Mine
size_categories:
- n<1K
configs:
- config_name: watch-findings-latest
  data_files:
  - split: train
    path: watch-findings-latest.jsonl
  default: true
- config_name: root-json
  data_files:
  - split: train
    path: '*.json'
tags:
- council-of-ai
language:
- en
---

# The Regulation-Measurement Mine - Council of AI

The daily index joining published regulation crosswalks (9 regimes, 63 article
rows), the live measurement board (34 axes), and the deadline register (22
deadlines with days-until) into one sha256-bound artifact.

Measurement, not certification. Every input is fetched live and its sha256
recorded at read time. OpenTimestamps proofs anchor the bytes to Bitcoin
(pending until confirmed; the proof's own state says which on every read).

- regulation-measurement-index-latest.json - the daily index
- *.ots - OpenTimestamps proofs for each artifact
- Producer: gspc-board Daily Report workflow (06:00 UTC) - source: councilof.ai

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `watch-findings-latest` (default) | `watch-findings-latest.jsonl` | 6 |
| `root-json` | `*.json` | 1 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/regulation-mine", "watch-findings-latest", split="train")
```

## Citation

```bibtex
@misc{csoai_regulation_mine_2026,
  title        = {The Regulation-Measurement Mine},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/regulation-mine}},
  url          = {https://huggingface.co/datasets/csoai/regulation-mine}
}
```

<!-- csoai-card-fixes:end -->
