# Field reference: nicktempleman/csoai-hub-queue

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `SUMMARY.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/hub-queue/SUMMARY.json.

Top-level keys: `kind`, `n`, `n_measured`, `n_unmeasured`, `subject_card_counts`, `coverage_counts`, `n_models_with_measured_axes`, `n_measured_axes`, `as_of`, `org`, `produced_by`, `rewritten_when`, `board_truth`, `columns`, `flipped_this_run`, `note`, `expanded_this_run`, `expansion_source`.


## `locks/FLEET-B.lock.json`

Top-level keys: `kind`, `fleet`, `as_of`, `n_target`, `n_locked`, `status_all`, `enters_board_means`, `note`, `source_queue`, `live_board`, `public_count`, `census_n`, `census_n_measured`, `models`, `halt`.
Records under `models`:

| field | type | description |
|---|---|---|
| `slug` | string | Observed type string; non-null in 40/40 rows read; example: Qwen/Qwen3-0.6B |
| `queue_rank` | integer | Observed type integer; non-null in 40/40 rows read; example: 10 |
| `downloads_at_queue` | integer | Observed type integer; non-null in 40/40 rows read; example: 22399005 |
| `pipeline_tag` | string | Observed type string; non-null in 40/40 rows read; example: text-generation |
| `status` | string | Observed type string; non-null in 40/40 rows read; example: UNMEASURED |
| `card_id` | string | Observed type string; non-null in 0/40 rows read |
| `license` | string | Observed type string; non-null in 40/40 rows read; example: UNMEASURED |
| `reason_in` | string | Observed type string; non-null in 40/40 rows read; example: hub-queue text-generation; not GGUF/quant-only; lock before … |

## `locks/HF2200.lock.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/hub-queue/locks/HF2200.lock.json.

Top-level keys: `kind`, `fleet`, `as_of`, `queue_as_of`, `n_target`, `n_locked`, `n_measured`, `n_practice_probed`, `measurement_definition`, `status_all`, `mill`, `writes_board`, `do_not_mill_today`, `enters_board_means`, `models`, `after_fleet_b`, `source_queue`, `queue_subset`, `census_n`, `census_n_measured`, `live_board`, `note`, `halt`, `membership`.
Records under `models`:

| field | type | description |
|---|---|---|
| `slug` | string | Observed type string; non-null in 2200/2200 rows read; example: sentence-transformers/all-MiniLM-L6-v2 |
| `queue_rank` | integer | Observed type integer; non-null in 2200/2200 rows read; example: 1 |
| `downloads_at_queue` | integer | Observed type integer; non-null in 2200/2200 rows read; example: 247672573 |
| `pipeline_tag` | string | Observed type string; non-null in 1895/2200 rows read; example: sentence-similarity |
| `status` | string | Observed type string; non-null in 2200/2200 rows read; example: practice-mill |
| `card_id` | string | Observed type string; non-null in 3/2200 rows read; example: a0dc1db7ba9c75e52253f4c9c62f7adf1fa71d6fcc5aa511ae17a6eff799… |
| `reason_in` | string | Observed type string; non-null in 2200/2200 rows read; example: hub-queue AFTER FLEET-B 40 ranked by downloads; lock before … |
| `last_mill` | datetime | Observed type datetime; non-null in 411/2200 rows read; example: 2026-09-06T17:19:10Z |
| `n` | integer | Observed type integer; non-null in 405/2200 rows read; example: 1 |
| `reason` | string | Observed type string; non-null in 1795/2200 rows read; example: HTTP 400 {"error":{"message":"The requested model 'cross-enc… |
| `route_kind` | string | Observed type string; non-null in 26/2200 rows read; example: feature |
| `providers_live` | string | Observed type string; non-null in 26/2200 rows read; example: ["featherless-ai"] |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 7/7 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 6/7 rows read; example: 2914 |
| `sha` | string | Observed type string; non-null in 6/7 rows read; example: 959a8df3052fa7bfd0b5370af131f3a881e7e968 |
| `ext` | string | Observed type string; non-null in 7/7 rows read; example: md |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://huggingface.co/datasets/csoai/hub-queue/resolve/main… |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/hub-queue |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 7/7 rows read; example: https://huggingface.co/api/datasets/csoai/hub-queue/tree/mai… |

## `queue.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/hub-queue/queue.jsonl.

| field | type | description |
|---|---|---|
| `rank` | integer | Observed type integer; non-null in 4086/4086 rows read; example: 1 |
| `id` | string | Observed type string; non-null in 4086/4086 rows read; example: sentence-transformers/all-MiniLM-L6-v2 |
| `downloads` | integer | Observed type integer; non-null in 4086/4086 rows read; example: 247672573 |
| `pipeline_tag` | string | Observed type string; non-null in 3752/4086 rows read; example: sentence-similarity |
| `status` | string | Observed type string; non-null in 4086/4086 rows read; example: UNMEASURED |
| `card_id` | string | Observed type string; non-null in 8/4086 rows read; example: 62183c2ff91701a63d8377034c8e136028fd443bc51740769dbabcab05c1… |
| `as_of` | datetime | Observed type datetime; non-null in 4086/4086 rows read; example: 2026-08-29T09:40:48Z |
| `coverage_state` | string | Observed type string; non-null in 4063/4086 rows read; example: UNMEASURED |
| `measured_axes` | string | Observed type string; non-null in 1792/4086 rows read; example: {"governance": {"status": "MEASURED", "card_id": "e2dff62f80… |

## `queue.parquet`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/hub-queue/queue.parquet.

| field | type | description |
|---|---|---|
| `rank` | integer | Observed type integer; non-null in 2000/2000 rows read; example: 1 |
| `id` | string | Observed type string; non-null in 2000/2000 rows read; example: sentence-transformers/all-MiniLM-L6-v2 |
| `downloads` | integer | Observed type integer; non-null in 2000/2000 rows read; example: 247672573 |
| `pipeline_tag` | string | Observed type string; non-null in 1737/2000 rows read; example: sentence-similarity |
| `status` | string | Observed type string; non-null in 2000/2000 rows read; example: UNMEASURED |
| `card_id` | string | Observed type string; non-null in 8/2000 rows read; example: 62183c2ff91701a63d8377034c8e136028fd443bc51740769dbabcab05c1… |
| `as_of` | datetime | Observed type datetime; non-null in 2000/2000 rows read; example: 2026-08-29T09:40:48Z |
| `coverage_state` | string | Observed type string; non-null in 2000/2000 rows read; example: UNMEASURED |
| `measured_axes` | string | Observed type string; non-null in 104/2000 rows read; example: {"governance": {"status": "MEASURED", "card_id": "e2dff62f80… |
