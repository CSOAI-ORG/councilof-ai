# Field reference: nicktempleman/csoai-gspc-interop

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 1508 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: 82fa4fe6e630c0d8e00ce3bf7eca9aa11e2d7022 |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/gspc-interop/resolve/m… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/gspc-interop |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-interop/tree/… |

## `pointers.jsonl`

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 7/7 rows read; example: GSPC live board (authority) |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://councilof.ai/api/gspc |
| `kind` | string | Observed type string; non-null in 7/7 rows read; example: api |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/gspc-interop |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
