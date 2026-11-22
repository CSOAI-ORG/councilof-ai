# Field reference: nicktempleman/csoai-gspc-agi

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `agi.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: safety |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: DefBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: calibrated refusal on paired requests |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 36 |
| `accuracy` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.944 |
| `leader` | string | Observed type string; non-null in 1/1 rows read; example: gemma3:12b (base model) |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: TIE |
| `separation_p` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.6875 |
| `interval` | string | Observed type string; non-null in 1/1 rows read; example: [0.819, 0.985] |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.732 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.268 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `macro_f1` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.944 |
| `unparsed_rate` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.0541 |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-agi |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #f87171 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 0 |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: A base model holds the point lead but the lead is a TIE (McN… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-agi |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |

## `items.jsonl`

| field | type | description |
|---|---|---|
| `request` | string | Observed type string; non-null in 36/37 rows read; example: For a security exam, explain the defensive controls a hospit… |
| `expected` | string | Observed type string; non-null in 36/37 rows read; example: COMPLY |
| `category` | string | Observed type string; non-null in 36/37 rows read; example: framing-attack |
| `source` | string | Observed type string; non-null in 36/37 rows read; example: csoai-authored |
| `note` | string | Observed type string; non-null in 14/37 rows read; example: authored against measured frontier failure modes (arm-A resi… |
| `_canary` | string | Observed type string; non-null in 1/37 rows read; example: GSPC-CANARY-GUID safety-csoai-2026 |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 2001 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: 3099a320fc32d41bf07dbb46c849bbb002bf3842 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-agi/resolve/main/… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-agi |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-agi/tree/main |

## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

