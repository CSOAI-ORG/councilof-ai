# Field reference: nicktempleman/csoai-ras-assess

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 2/2 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 1/2 rows read; example: 1833 |
| `sha` | string | Observed type string; non-null in 1/2 rows read; example: 95a5ab38acbb658d9c41b903bbf4dea9b1e78b6b |
| `ext` | string | Observed type string; non-null in 2/2 rows read; example: md |
| `url` | url | Observed type url; non-null in 2/2 rows read; example: https://huggingface.co/datasets/csoai/ras-assess/resolve/mai… |
| `repo` | string | Observed type string; non-null in 2/2 rows read; example: csoai/ras-assess |
| `as_of` | datetime | Observed type datetime; non-null in 2/2 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 2/2 rows read; example: https://huggingface.co/api/datasets/csoai/ras-assess/tree/ma… |

## `pointers.jsonl`

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 7/7 rows read; example: GSPC live board (authority) |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://councilof.ai/api/gspc |
| `kind` | string | Observed type string; non-null in 7/7 rows read; example: api |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/ras-assess |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |

## `readbacks/2026-09-24-public-source-readback.json`

Top-level keys: `schema`, `observed_at`, `scope`, `rate_policy`, `source_count`, `observations`.
Records under `observations`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 12/12 rows read; example: mcp-registry |
| `url` | url | Observed type url; non-null in 12/12 rows read; example: https://registry.modelcontextprotocol.io/v0.1/servers?limit=… |
| `method` | string | Observed type string; non-null in 12/12 rows read; example: GET |
| `docs` | url | Observed type url; non-null in 11/12 rows read; example: https://github.com/modelcontextprotocol/registry/blob/main/d… |
| `observed_at` | datetime | Observed type datetime; non-null in 12/12 rows read; example: 2026-09-24T21:26:37.652Z |
| `http_status` | integer | Observed type integer; non-null in 12/12 rows read; example: 200 |
| `content_type` | string | Observed type string; non-null in 12/12 rows read; example: application/json |
| `state` | string | Observed type string; non-null in 12/12 rows read; example: SOURCE_READABLE |
| `bytes` | integer | Observed type integer; non-null in 12/12 rows read; example: 720 |
| `sha256` | string | Observed type string; non-null in 12/12 rows read; example: f095c3be945779297aaf2e41e85ac0fee21f557d2b1ecf26464bf7382a51… |
| `top_level_keys` | string | Observed type string; non-null in 12/12 rows read; example: ["servers", "metadata"] |

## `readbacks/2026-09-24-route-map.json`

Top-level keys: `schema`, `observed_at`, `status`, `source_api_sha256`, `board`, `catalogue`, `claim_register`, `revenue_gate`, `verification`, `limitations`.

