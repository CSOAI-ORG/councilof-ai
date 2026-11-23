---
license: cc-by-4.0
pretty_name: GSPC Board — living mirror
size_categories:
- n<1K
configs:
- config_name: measurements-pulse-rows
  data_files:
  - split: train
    path: measurements/*.pulse-rows.jsonl
  default: true
- config_name: measurements-pulse-summary-sample
  data_files:
  - split: train
    path:
    - measurements/2026-11-17T07-57-47-156Z.pulse-summary.json
    - measurements/2026-11-17T20-57-52-925Z.pulse-summary.json
    - measurements/2026-11-18T07-32-46-045Z.pulse-summary.json
    - measurements/2026-11-18T20-35-11-561Z.pulse-summary.json
    - measurements/2026-11-19T07-29-28-972Z.pulse-summary.json
    - measurements/2026-11-19T20-40-31-037Z.pulse-summary.json
- config_name: measurements-pulse-summary-v2-sample
  data_files:
  - split: train
    path:
    - measurements/2026-11-17T08-04-22-099Z.pulse-summary.json
    - measurements/2026-11-17T21-02-22-245Z.pulse-summary.json
    - measurements/2026-11-18T07-40-16-528Z.pulse-summary.json
    - measurements/2026-11-18T20-40-02-205Z.pulse-summary.json
    - measurements/2026-11-19T07-36-44-138Z.pulse-summary.json
    - measurements/2026-11-19T20-46-36-796Z.pulse-summary.json
tags:
- council-of-ai
language:
- en
---

<p align="center">
  <img src="https://huggingface.co/datasets/csoai/brand-assets/resolve/main/csoai-banner-1280x256.png" alt="Council of AI (CSOAI)" width="100%">
</p>

# GSPC Board — living mirror

`board.json` is a byte-for-byte copy of the live GSPC board at
https://councilof.ai/api/gspc, the source of truth. It is never edited here.
The daily-report workflow in
[CSOAI-ORG/gspc-board](https://github.com/CSOAI-ORG/gspc-board/blob/main/.github/workflows/daily-report.yml)
fetches the board once a day and writes `board.json` and this card in one commit,
so the values below are computed from the file beside them. The commit history
records every refresh.

To check this copy, compare `sha256(board.json)` with the pin below. If
GET https://councilof.ai/api/gspc returns different bytes, the board has moved
since the last refresh, and the live GET wins.

| field | value |
|---|---|
| board_sha256 | `20e6a20c50c77370241000d017b97703c68349f2ddac9bb3051bb3bffe1b85f0` |
| bytes | 161038 |
| public_count (the board's own `totals.public_count`) | 34 axes · 34 measured |
| source of truth | https://councilof.ai/api/gspc |
| issuer | CSOAI Ltd (GB, Companies House 16939677) |

## Other copies of the same board

- Kaggle: https://www.kaggle.com/datasets/nicktempleman/csoai-gspc-living-board
- Hugging Face, dated snapshot release with tables: https://huggingface.co/datasets/csoai/gspc-board
- Interactive board: https://huggingface.co/spaces/csoai/gspc-board

Each copy is refreshed on its own schedule, so compare its sha256 with the live GET rather than with another copy.

<!-- csoai-card-fixes:start -->

## Subsets (configs)

The Dataset Viewer and `datasets` read this repository through the named subsets below. Each subset contains one homogeneous file group, so files with different schemas are not cast into a single table.

| subset | files | rows (as verified) |
|---|---|---|
| `measurements-pulse-rows` (default) | `measurements/*.pulse-rows.jsonl` | 50 |
| `measurements-pulse-summary-sample` | `measurements/2026-11-17T07-57-47-156Z.pulse-summary.json`, `measurements/2026-11-17T20-57-52-925Z.pulse-summary.json`, `measurements/2026-11-18T07-32-46-045Z.pulse-summary.json` … (+3) | 6 |
| `measurements-pulse-summary-v2-sample` | `measurements/2026-11-17T08-04-22-099Z.pulse-summary.json`, `measurements/2026-11-17T21-02-22-245Z.pulse-summary.json`, `measurements/2026-11-18T07-40-16-528Z.pulse-summary.json` … (+3) | 6 |

```python
from datasets import load_dataset

ds = load_dataset("csoai/gspc-board-living", "measurements-pulse-rows", split="train")
```

## Limitations

**Measurement is not certification.** Values in this repository are measurements recorded by Council of AI (CSOAI Ltd) under the method, instrument version and observation date stated in each file. They are not a certification, audit opinion, conformity assessment or legal determination (including under the EU AI Act). Results depend on the instrument version, the sampled items and the date, and a re-measurement can change them. Repository updates and download counts are not new measurements.

## Citation

```bibtex
@misc{csoai_gspc_board_living_2026,
  title        = {GSPC Board — living mirror},
  author       = {{CSOAI Ltd (Council of AI)}},
  year         = {2026},
  publisher    = {Hugging Face},
  howpublished = {\url{https://huggingface.co/datasets/csoai/gspc-board-living}},
  url          = {https://huggingface.co/datasets/csoai/gspc-board-living}
}
```

<!-- csoai-card-fixes:end -->
