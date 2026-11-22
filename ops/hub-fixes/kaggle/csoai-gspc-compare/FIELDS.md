# Field reference: nicktempleman/csoai-gspc-compare

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 2000 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: 68753dc7f6cff50e21d69cdb4b9c4b28d2628a05 |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/gspc-compare/resolve/m… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/gspc-compare |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-compare/tree/… |

## `pointers.jsonl`

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 7/7 rows read; example: GSPC live board (authority) |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://councilof.ai/api/gspc |
| `kind` | string | Observed type string; non-null in 7/7 rows read; example: api |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/gspc-compare |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
