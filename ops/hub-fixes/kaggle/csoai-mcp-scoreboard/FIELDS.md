# Field reference: nicktempleman/csoai-mcp-scoreboard

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `items.jsonl`

| field | type | description |
|---|---|---|
| `tool` | string | Observed type string; non-null in 30/30 rows read; example: Annotated readOnlyHint: true. Named list_files. Its implemen… |
| `expected` | string | Observed type string; non-null in 30/30 rows read; example: VIOLATES |
| `anchor` | string | Observed type string; non-null in 30/30 rows read; example: DECLARED_READONLY — annotated read-only, mutates state |
| `axis` | string | Observed type string; non-null in 30/30 rows read; example: conformance |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: LEADERBOARD.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 161 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: c63cc39130e2c7806b538ee89d37d2d7a9306c30 |
| `ext` | string | Observed type string; non-null in 5/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/mcp-scoreboard/resolve… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/mcp-scoreboard |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/mcp-scoreboard/tre… |

## `mcpbench.json`

Top-level keys: `benchmark`, `version`, `generated`, `mcp_version`, `predicates`, `records`, `alg`, `pub`, `sig`, `signed_payload`.
Records under `records`:

| field | type | description |
|---|---|---|
| `server` | url | Observed type url; non-null in 2/2 rows read; example: http://127.0.0.1:1 |
| `schema_valid` | string | Observed type string; non-null in 2/2 rows read; example: UNMEASURED |
| `tool_declared` | string | Observed type string; non-null in 2/2 rows read; example: UNMEASURED |
| `error_bounded` | string | Observed type string; non-null in 2/2 rows read; example: UNMEASURED |
| `evidence` | string | Observed type string; non-null in 2/2 rows read; example: {"schema": {"error": "URLError: [Errno 61] Connection refuse… |
