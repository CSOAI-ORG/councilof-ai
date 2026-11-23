# Field reference: nicktempleman/csoai-gspc-verify

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 1894 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: 951f532c481eebe606a2af277a7e286c9a9909d1 |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/gspc-verify/resolve/ma… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/gspc-verify |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-verify/tree/m… |

## `pointers.jsonl`

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 7/7 rows read; example: GSPC live board (authority) |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://councilof.ai/api/gspc |
| `kind` | string | Observed type string; non-null in 7/7 rows read; example: api |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/gspc-verify |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
