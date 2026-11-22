# Field reference: nicktempleman/csoai-gspc-prv

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/gspc-prv/axis-live.jsonl.

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: provenance |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: ProvBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: Article 50 marking survival by validity |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 32 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: TIE |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.549 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.451 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-prv |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #60a5fa |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 213 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: council-aesthetics-v3-light (council specialist) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: EXCLUDED_OWN_MODEL |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: our own council specialist held the point … |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: Our own council specialist held the point lead on this axis.… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: v3 bank (validity principle: a manifest present but whose bi… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-prv |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |
| `separation_basis` | string | Observed type string; non-null in 1/1 rows read; example: exact McNemar p<0.05 vs runner-up, recomputed from rows/peri… |
| `separation_source` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-peritem-rows-2026-08-12 |
| `separation_recomputed_at` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-10-25T05:25:50Z |

## `items.jsonl`

TODO(owner): fields not obtainable anonymously.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 13/13 rows read; example: PROVBENCH_ARXIV_PREPRINT_2026-07-30.md |
| `bytes` | integer | Observed type integer; non-null in 12/13 rows read; example: 11296 |
| `sha` | string | Observed type string; non-null in 12/13 rows read; example: 7b09a8401760c5ccdb9372ad43fa8be5c32a1e04 |
| `ext` | string | Observed type string; non-null in 13/13 rows read; example: md |
| `url` | url | Observed type url; non-null in 13/13 rows read; example: https://huggingface.co/datasets/csoai/gspc-prv/resolve/main/… |
| `repo` | string | Observed type string; non-null in 13/13 rows read; example: csoai/gspc-prv |
| `as_of` | datetime | Observed type datetime; non-null in 13/13 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 13/13 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-prv/tree/main |

## `provbench-canonical-bound.json`

Top-level keys: `canonical`, `reconciliation`.


## `provbench-n20.json`

Top-level keys: `benchmark`, `version`, `generated`, `question`, `pre_registered_prediction`, `environment`, `n_assets_marked`, `assets_unsigned`, `transforms`, `checks`, `configs`, `cells`, `pooled_by_check`, `config_comparison`, `prediction_disagreements`, `unmeasured_reasons`, `caveats`, `corpus_anchor`.
Records under `cells`:

| field | type | description |
|---|---|---|
| `config` | string | Observed type string; non-null in 110/110 rows read; example: embedded_only |
| `transform` | string | Observed type string; non-null in 110/110 rows read; example: identity |
| `check` | string | Observed type string; non-null in 110/110 rows read; example: manifest_present |
| `survived` | integer | Observed type integer; non-null in 110/110 rows read; example: 20 |
| `destroyed` | integer | Observed type integer; non-null in 110/110 rows read; example: 0 |
| `unmeasured` | integer | Observed type integer; non-null in 110/110 rows read; example: 0 |
| `n_measured` | integer | Observed type integer; non-null in 110/110 rows read; example: 20 |
| `rate` | numeric | Observed type numeric; non-null in 100/110 rows read; example: 1.0 |
| `ci` | string | Observed type string; non-null in 100/110 rows read; example: [0.8389, 1.0] |
| `outcome` | string | Observed type string; non-null in 110/110 rows read; example: survived |
| `predicted` | string | Observed type string; non-null in 110/110 rows read; example: survived |
| `desc` | string | Observed type string; non-null in 110/110 rows read; example: control — no modification |

## `prv.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `results_2026-08-11.json`

TODO(owner): fields not obtainable anonymously.

