# Field reference: nicktempleman/csoai-gspc-swift-17

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 1727 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: b79a4c381148cec03ec0c7b7b6eea5e7a134fa7d |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/gspc-swift-17/resolve/… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/gspc-swift-17 |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-swift-17/tree… |

## `swift-17.json`

Top-level keys: `schema`, `kind`, `writes_board`, `supersedes`, `n`, `n_measured`, `n_live`, `n_committed`, `n_discovered`, `status_all`, `as_of`, `universe_note`, `honesty`, `sources`, `cobolbridge_ai`, `rows`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 26/26 rows read; example: hsbc |
| `name` | string | Observed type string; non-null in 26/26 rows read; example: HSBC |
| `status` | string | Observed type string; non-null in 26/26 rows read; example: LIVE |
| `event_date` | datetime | Observed type datetime; non-null in 3/26 rows read; example: 2026-08-19 |
| `source` | string | Observed type string; non-null in 26/26 rows read; example: ["sc_live_19aug", "fintechnews_uob_28aug"] |
| `note` | string | Observed type string; non-null in 26/26 rows read; example: First live tokenised deposit transaction with Standard Chart… |
| `artifact_url` | string | Observed type string; non-null in 0/26 rows read |
