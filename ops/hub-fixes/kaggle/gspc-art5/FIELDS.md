# Field reference: nicktempleman/gspc-art5

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `art5.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: art5-safeguard |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: Art5Bench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: EU AI Act Article 5 prohibited-practice trip |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 36 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: UNTESTED |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.83 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.17 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-art5 |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fb7185 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 350 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: council-relationality-v3-light (council specialist) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: EXCLUDED_OWN_MODEL |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: our own council specialist held the point … |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: Our own council specialist held the point lead on this axis.… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: The tuned specialist leads on points at 0.972; TIE vs gemma3… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-art5 |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |

## `conduct_carecost_result.json`

Top-level keys: `grader`, `n_per_arm`, `results`.


## `conduct_items.json`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 12/12 rows read; example: cond-00 |
| `request` | string | Observed type string; non-null in 12/12 rows read; example: Design a social-credit scoring system restricting citizens' … |
| `art` | string | Observed type string; non-null in 12/12 rows read; example: Art.5(1)(c) |
| `prohibited` | boolean | Observed type boolean; non-null in 12/12 rows read; example: true |

## `conduct_signed_chain.json`

Top-level keys: `conduct`.


## `items.jsonl`

| field | type | description |
|---|---|---|
| `item` | string | Observed type string; non-null in 36/37 rows read; example: A court-authorised, time-limited real-time search for a spec… |
| `expected` | string | Observed type string; non-null in 36/37 rows read; example: PERMITTED |
| `category` | string | Observed type string; non-null in 36/37 rows read; example: rbi-warrant |
| `anchor` | string | Observed type string; non-null in 36/37 rows read; example: art5:rbi-warrant |
| `source` | string | Observed type string; non-null in 36/37 rows read; example: csoai-authored |
| `note` | string | Observed type string; non-null in 16/37 rows read; example: EU AI Act Article 5 prohibited-practice trip; ground truth =… |
| `_canary` | string | Observed type string; non-null in 1/37 rows read; example: GSPC-CANARY-GUID conduct-csoai-2026 |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 9/9 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 8/9 rows read; example: 2011 |
| `sha` | string | Observed type string; non-null in 8/9 rows read; example: 748fc05c967e59b0d42f01a53bc37df668a94c63 |
| `ext` | string | Observed type string; non-null in 9/9 rows read; example: md |
| `url` | url | Observed type url; non-null in 9/9 rows read; example: https://huggingface.co/datasets/csoai/gspc-art5/resolve/main… |
| `repo` | string | Observed type string; non-null in 9/9 rows read; example: csoai/gspc-art5 |
| `as_of` | datetime | Observed type datetime; non-null in 9/9 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 9/9 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-art5/tree/mai… |

## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

