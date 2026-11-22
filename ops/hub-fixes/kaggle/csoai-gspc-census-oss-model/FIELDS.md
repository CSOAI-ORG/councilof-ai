# Field reference: nicktempleman/csoai-gspc-census-oss-model

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `census.jsonl`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 5000/5000 rows read; example: Qwen/Qwen3-0.6B |
| `downloads` | integer | Observed type integer; non-null in 5000/5000 rows read; example: 22182252 |
| `likes` | integer | Observed type integer; non-null in 5000/5000 rows read; example: 1561 |
| `licence` | string | Observed type string; non-null in 5000/5000 rows read; example: apache-2.0 |
| `licence_class` | string | Observed type string; non-null in 5000/5000 rows read; example: osi_like |
| `pipeline_tag` | string | Observed type string; non-null in 5000/5000 rows read; example: text-generation |
| `created_at` | datetime | Observed type datetime; non-null in 5000/5000 rows read; example: 2025-04-27T03:40:08.000Z |
| `as_of` | datetime | Observed type datetime; non-null in 5000/5000 rows read; example: 2026-09-01T04:41:36Z |
| `status` | string | Observed type string; non-null in 5000/5000 rows read; example: DISCOVERED |
| `measured` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: false |

## `census.parquet`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 2000/2000 rows read; example: Qwen/Qwen3-0.6B |
| `downloads` | integer | Observed type integer; non-null in 2000/2000 rows read; example: 22182252 |
| `likes` | integer | Observed type integer; non-null in 2000/2000 rows read; example: 1561 |
| `licence` | string | Observed type string; non-null in 2000/2000 rows read; example: apache-2.0 |
| `licence_class` | string | Observed type string; non-null in 2000/2000 rows read; example: osi_like |
| `pipeline_tag` | string | Observed type string; non-null in 2000/2000 rows read; example: text-generation |
| `created_at` | datetime | Observed type datetime; non-null in 2000/2000 rows read; example: "2025-04-27 03:40:08+00:00" |
| `as_of` | datetime | Observed type datetime; non-null in 2000/2000 rows read; example: 2026-09-01T04:41:36Z |
| `status` | string | Observed type string; non-null in 2000/2000 rows read; example: DISCOVERED |
| `measured` | boolean | Observed type boolean; non-null in 2000/2000 rows read; example: false |

## `census_meta.json`

Top-level keys: `dataset`, `as_of`, `source`, `slice`, `raw_listings_seen`, `n_frozen`, `pages_fetched`, `exhausted`, `status_all`, `n_measured`, `note`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 5/5 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 4/5 rows read; example: 2864 |
| `sha` | string | Observed type string; non-null in 4/5 rows read; example: 44f243a655f49e3acd57afe8cbd968f91a0df061 |
| `ext` | string | Observed type string; non-null in 5/5 rows read; example: md |
| `url` | url | Observed type url; non-null in 5/5 rows read; example: https://huggingface.co/datasets/csoai/oss-model-census/resol… |
| `repo` | string | Observed type string; non-null in 5/5 rows read; example: csoai/oss-model-census |
| `as_of` | datetime | Observed type datetime; non-null in 5/5 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 5/5 rows read; example: https://huggingface.co/api/datasets/csoai/oss-model-census/t… |
