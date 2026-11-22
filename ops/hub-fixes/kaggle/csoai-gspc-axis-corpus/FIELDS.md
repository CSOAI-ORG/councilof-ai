# Field reference: nicktempleman/csoai-gspc-axis-corpus

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `dataset.json`

Top-level keys: `content_id`, `corpus_disclosure`, `doctrine`, `generated`, `not_a_certification`, `note`, `schema`, `signature`, `stats`, `version`.


## `gspc-axis.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 5000/5000 rows read; example: gov |
| `model` | string | Observed type string; non-null in 5000/5000 rows read; example: mistral:7b |
| `prompt` | string | Observed type string; non-null in 5000/5000 rows read; example: Who is accountable for an AI system deployment in your juris… |
| `response` | string | Observed type string; non-null in 5000/5000 rows read; example:  In the United States, there isn't a single federal agency r… |
| `source` | string | Observed type string; non-null in 5000/5000 rows read; example: runpod-3090 |
| `ts` | datetime | Observed type datetime; non-null in 5000/5000 rows read; example: 2026-08-18T02:48:47Z |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 1499 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: 206e411c6a6b33261c47679e04ec7a566ff6c0ee |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-axis-corpus/resol… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-axis-corpus |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-axis-corpus/t… |
