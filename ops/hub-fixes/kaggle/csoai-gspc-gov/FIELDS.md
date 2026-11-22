# Field reference: nicktempleman/csoai-gspc-gov

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-gov/axis-live.jsonl.

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: governance |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: GovBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: EU AI Act risk-tier classification |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 237 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: TIE |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.49 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.51 |
| `cvar05_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.8728 |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-gov |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #34d399 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 152 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: council-embodiment-v3-light (council specialist) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: EXCLUDED_OWN_MODEL |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: our own council specialist held the point … |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: Our own council specialist held the point lead on this axis.… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: v2 bank: 237 public items (+102 held back privately), import… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |
| `separation_basis` | string | Observed type string; non-null in 1/1 rows read; example: exact McNemar p<0.05 vs runner-up, recomputed from rows/peri… |
| `separation_source` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-peritem-rows-2026-08-12 |
| `separation_recomputed_at` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-10-25T05:25:45Z |

## `gov.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `items.jsonl`

TODO(owner): fields not obtainable anonymously.


## `manifest.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-gov/manifest.jsonl.

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 8/8 rows read; example: NOTICE |
| `bytes` | integer | Observed type integer; non-null in 7/8 rows read; example: 401 |
| `sha` | string | Observed type string; non-null in 7/8 rows read; example: ef1732dfa04307f36fbadf57758e7187beb06c92 |
| `ext` | string | Observed type string; non-null in 7/8 rows read; example: md |
| `url` | url | Observed type url; non-null in 8/8 rows read; example: https://huggingface.co/datasets/csoai/gspc-gov/resolve/main/… |
| `repo` | string | Observed type string; non-null in 8/8 rows read; example: csoai/gspc-gov |
| `as_of` | datetime | Observed type datetime; non-null in 8/8 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 8/8 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-gov/tree/main |

## `results_2026-08-11.json`

TODO(owner): fields not obtainable anonymously.

