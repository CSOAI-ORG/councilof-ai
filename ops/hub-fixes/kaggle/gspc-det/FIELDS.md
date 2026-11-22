# Field reference: nicktempleman/gspc-det

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: detector-interop |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: DetBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: cross-detector watermark interoperability matrix |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 33 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: UNTESTED |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.563 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.437 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-det |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #38bdf8 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 199 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: deepseek-r1:8b (base model) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: NO_SIGNED_CARD |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: this axis is measured as a fleet aggregate… |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: This axis named an external base model as the point-leader b… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: A base model leads on points; TIE, and NOT clear of the majo… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-det |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |

## `det.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `items.jsonl`

| field | type | description |
|---|---|---|
| `case` | string | Observed type string; non-null in 33/34 rows read; example: Provenance asset (genuinely C2PA-signed asset #0). Detector-… |
| `expected` | string | Observed type string; non-null in 33/34 rows read; example: INTEROPERABLE |
| `anchor` | string | Observed type string; non-null in 33/34 rows read; example: C2PA provenance detector interoperability with a REAL signed… |
| `axis` | string | Observed type string; non-null in 33/34 rows read; example: detector |
| `_detA_c2pa` | boolean | Observed type boolean; non-null in 33/34 rows read; example: true |
| `_detB_marker` | boolean | Observed type boolean; non-null in 33/34 rows read; example: true |
| `_gt` | string | Observed type string; non-null in 33/34 rows read; example: provenance |
| `_canary` | string | Observed type string; non-null in 1/34 rows read; example: GSPC-CANARY-GUID detector-csoai-2026 |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 7/7 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 6/7 rows read; example: 2102 |
| `sha` | string | Observed type string; non-null in 6/7 rows read; example: 7439c861f289bc9f9745a8ac9dc0a638b319d9e9 |
| `ext` | string | Observed type string; non-null in 7/7 rows read; example: md |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://huggingface.co/datasets/csoai/gspc-det/resolve/main/… |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/gspc-det |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 7/7 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-det/tree/main |

## `protocol.jsonl`

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 30/30 rows read; example: det-001 |
| `criterion` | string | Observed type string; non-null in 30/30 rows read; example: effectiveness |
| `predicate` | string | Observed type string; non-null in 30/30 rows read; example: detects_own_marking |
| `question` | string | Observed type string; non-null in 30/30 rows read; example: Given an asset marked by provider P, does P's own detector r… |
| `labels` | string | Observed type string; non-null in 30/30 rows read; example: ["DETECTED", "NOT_DETECTED", "ERROR"] |
| `why` | string | Observed type string; non-null in 30/30 rows read; example: Baseline. A detector that cannot read its own marking fails … |

## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

