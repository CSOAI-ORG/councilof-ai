# Field reference: nicktempleman/csoai-gspc-normalized

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `data/train-00000-of-00001.parquet`

| field | type | description |
|---|---|---|
| `source` | string | Observed type string; non-null in 518/518 rows read; example: csoai/gspc-gov |
| `axis` | string | Observed type string; non-null in 518/518 rows read; example: gov |
| `category` | string | Observed type string; non-null in 506/518 rows read; example: 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,… |
| `anchor` | string | Observed type string; non-null in 514/518 rows read; example: 6, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22,… |
| `prompt` | string | Observed type string; non-null in 518/518 rows read; example: A provider deploys Critical‑infrastructure grid management A… |
| `expected` | string | Observed type string; non-null in 518/518 rows read; example: HIGH_RISK |
| `expected_is_list` | boolean | Observed type boolean; non-null in 518/518 rows read; example: false |
| `raw_keys` | string | Observed type string; non-null in 518/518 rows read; example: ["_canary","_note","anchor","expected","licence","scenario",… |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 4/4 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 3/4 rows read; example: 1498 |
| `sha` | string | Observed type string; non-null in 3/4 rows read; example: efa8cba3b9551fc2bea6ff837b09b0a569007642 |
| `ext` | string | Observed type string; non-null in 4/4 rows read; example: md |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://huggingface.co/datasets/csoai/gspc-normalized/resolv… |
| `repo` | string | Observed type string; non-null in 4/4 rows read; example: csoai/gspc-normalized |
| `as_of` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 4/4 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-normalized/tr… |

## `manifest.parquet`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 4/4 rows read; example: README.md |
| `bytes` | string | Observed type string; non-null in 3/4 rows read; example: 1498 |
| `sha` | string | Observed type string; non-null in 3/4 rows read; example: efa8cba3b9551fc2bea6ff837b09b0a569007642 |
| `ext` | string | Observed type string; non-null in 4/4 rows read; example: md |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://huggingface.co/datasets/csoai/gspc-normalized/resolv… |
| `repo` | string | Observed type string; non-null in 4/4 rows read; example: csoai/gspc-normalized |
| `as_of` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 4/4 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-normalized/tr… |
