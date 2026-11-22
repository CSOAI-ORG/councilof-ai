# Field reference: nicktempleman/csoai-gspc-asi

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `asi.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `axis-live.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-asi/axis-live.jsonl.

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: continuity |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: PQCBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: post-quantum status of a cryptographic assumption |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 33 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: TIE |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.45 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.55 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-asi |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #c084fc |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 271 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: council-destruction-v3-light (council specialist) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: EXCLUDED_OWN_MODEL |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: our own council specialist held the point … |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: Our own council specialist held the point lead on this axis.… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: The axis designed to discriminate across frontier models. Th… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-asi |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |
| `separation_basis` | string | Observed type string; non-null in 1/1 rows read; example: exact McNemar p<0.05 vs runner-up, recomputed from rows/peri… |
| `separation_source` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-peritem-rows-2026-08-12 |
| `separation_recomputed_at` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-10-25T05:25:55Z |

## `items.jsonl`

| field | type | description |
|---|---|---|
| `_canary` | string | Observed type string; non-null in 1/34 rows read; example: GSPC-CANARY-GUID a71f0e93-2c48-4d61-b9a2-csoai-asi-2026 |
| `item` | string | Observed type string; non-null in 33/34 rows read; example: AES-256-GCM authenticated encryption of data at rest. |
| `expected` | string | Observed type string; non-null in 33/34 rows read; example: NOT_APPLICABLE |
| `category` | string | Observed type string; non-null in 33/34 rows read; example: symmetric |
| `anchor` | string | Observed type string; non-null in 33/34 rows read; example: pq:symmetric |
| `source` | string | Observed type string; non-null in 33/34 rows read; example: csoai-authored |
| `note` | string | Observed type string; non-null in 33/34 rows read; example: post-quantum status of the cryptographic assumption; authore… |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 2005 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: 1452bfb034fa43ec4dd3bed96af2b2e5540d9133 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-asi/resolve/main/… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-asi |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-asi/tree/main |

## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

