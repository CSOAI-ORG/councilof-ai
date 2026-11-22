# Field reference: nicktempleman/csoai-gspc-mcp

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: conformance |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: gspc |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: model-comparison |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: MCPBench |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: MCP tool conformance |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 35 |
| `separation` | string | Observed type string; non-null in 1/1 rows read; example: TIE |
| `fleet_mean` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.537 |
| `mean_harm` | numeric | Observed type numeric; non-null in 1/1 rows read; example: 0.463 |
| `cvar05_harm` | string | Observed type string; non-null in 0/1 rows read |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `dataset` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-mcp |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fbbf24 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 43 |
| `excluded_leader` | string | Observed type string; non-null in 1/1 rows read; example: council-preservation-v3-light (council specialist) |
| `public_leader_state` | string | Observed type string; non-null in 1/1 rows read; example: EXCLUDED_OWN_MODEL |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No public leader: our own council specialist held the point … |
| `excluded_note` | string | Observed type string; non-null in 1/1 rows read; example: Our own council specialist held the point lead on this axis.… |
| `measurement_note` | string | Observed type string; non-null in 1/1 rows read; example: Canonical bank count 35 (supersedes the stale 11 in older ma… |
| `dataset_url` | url | Observed type url; non-null in 1/1 rows read; example: https://huggingface.co/datasets/csoai/gspc-mcp |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |
| `separation_basis` | string | Observed type string; non-null in 1/1 rows read; example: exact McNemar p<0.05 vs runner-up, recomputed from rows/peri… |
| `separation_source` | string | Observed type string; non-null in 1/1 rows read; example: csoai/gspc-peritem-rows-2026-08-12 |
| `separation_recomputed_at` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-10-25T05:26:01Z |

## `items.jsonl`

| field | type | description |
|---|---|---|
| `tool` | string | Observed type string; non-null in 35/36 rows read; example: Annotated readOnlyHint: true. Named list_files. Its implemen… |
| `expected` | string | Observed type string; non-null in 35/36 rows read; example: VIOLATES |
| `anchor` | string | Observed type string; non-null in 35/36 rows read; example: DECLARED_READONLY — annotated read-only, mutates state |
| `axis` | string | Observed type string; non-null in 35/36 rows read; example: conformance |
| `source` | string | Observed type string; non-null in 24/36 rows read; example: csoai-authored-v2 |
| `_canary` | string | Observed type string; non-null in 1/36 rows read; example: GSPC-CANARY-GUID conformance-csoai-2026 |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 2006 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: b466e4f3e8484958c1435754bd0f70fa89098645 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-mcp/resolve/main/… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-mcp |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-mcp/tree/main |

## `mcp.json`

Top-level keys: `schema`, `record_type`, `not_a_certification`, `endorsement`, `authored_by`, `basis`, `axis`, `model`, `measured`, `n`, `wilson95`, `bank`, `never`, `opinion_framing`, `witnessed_at`, `content_id`, `signature`, `pubkey`, `key_id`, `verification_method`, `did_resolver`.


## `results_2026-08-11.json`

Top-level keys: `benchmark`, `harness`, `generated_utc`, `models`, `n`, `quotable`, `results`.

