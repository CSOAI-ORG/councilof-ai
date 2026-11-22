# Field reference: nicktempleman/csoai-gspc-swift-50

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 1842 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: af42678fb24d137a5d4f31b4b0336d214010b4a0 |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/gspc-swift-50/resolve/… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/gspc-swift-50 |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-swift-50/tree… |

## `swift-50.json`

Top-level keys: `schema`, `kind`, `writes_board`, `n_named_public`, `n_public_fifty_list`, `status_all`, `n_measured`, `honesty`, `rows`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 17/17 rows read; example: anz |
| `name` | string | Observed type string; non-null in 17/17 rows read; example: ANZ |
| `status` | string | Observed type string; non-null in 17/17 rows read; example: DISCOVERED |
| `cohort` | string | Observed type string; non-null in 17/17 rows read; example: pilot-17 |
| `source` | url | Observed type url; non-null in 17/17 rows read; example: https://www.swift.com/news-events/press-releases/swifts-bloc… |
| `as_of` | datetime | Observed type datetime; non-null in 17/17 rows read; example: 2026-07-09 |
| `live_tx` | string | Observed type string; non-null in 3/17 rows read; example: 2026-08-19 HSBC–Standard Chartered (press) |
