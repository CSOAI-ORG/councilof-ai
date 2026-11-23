# Field reference: nicktempleman/gspc-gov

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `items.jsonl`

| field | type | description |
|---|---|---|
| `_canary` | string | Observed type string; non-null in 1/238 rows read; example: GSPC-CANARY-GUID a4f1c2e8-7b3d-4e91-9c02-csoai-gov-2026 |
| `_note` | string | Observed type string; non-null in 1/238 rows read; example: Canary row. If this string appears in a model's training dat… |
| `scenario` | string | Observed type string; non-null in 237/238 rows read; example: A provider deploys Critical‑infrastructure grid management A… |
| `expected` | string | Observed type string; non-null in 237/238 rows read; example: HIGH_RISK |
| `anchor` | string | Observed type string; non-null in 237/238 rows read; example: 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,… |
| `source_index` | integer | Observed type integer; non-null in 237/238 rows read; example: 72 |
| `source` | string | Observed type string; non-null in 237/238 rows read; example: ai-act-evaluation-benchmark |
| `licence` | string | Observed type string; non-null in 237/238 rows read; example: CC-BY-4.0 |

## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

