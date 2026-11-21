# Field reference: nicktempleman/csoai-agent-interop-census

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `census-frame-2026-09-25/summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `user_agent`, `min_interval_s`, `requests`, `retry_after_waits`, `sources`, `union`, `overlap`, `canonicalisation`, `not_read_by_this_frame`, `what_a_row_is`, `what_it_never_proves`, `files`.


## `census.jsonl`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/agent-interop-census/census.jsonl.

| field | type | description |
|---|---|---|
| `source` | string | Observed type string; non-null in 5000/5000 rows read; example: modelcontextprotocol-registry |
| `kind` | string | Observed type string; non-null in 5000/5000 rows read; example: mcp-server |
| `id` | string | Observed type string; non-null in 5000/5000 rows read; example: ac.inference.sh/mcp |
| `version` | string | Observed type string; non-null in 5000/5000 rows read; example: 1.0.0 |
| `is_latest` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: false |
| `status` | string | Observed type string; non-null in 5000/5000 rows read; example: active |
| `exposes_remote_endpoint` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: true |
| `package_registries` | string | Observed type string; non-null in 5000/5000 rows read; example: ["npm"] |
| `repo_url` | url | Observed type url; non-null in 2754/5000 rows read; example: https://github.com/frumu-ai/tandem |
| `graded` | boolean | Observed type boolean; non-null in 5000/5000 rows read; example: false |
| `measurement` | string | Observed type string; non-null in 0/5000 rows read |
| `what_this_row_is` | string | Observed type string; non-null in 5000/5000 rows read; example: an index entry observed in a public registry |
| `what_it_never_proves` | string | Observed type string; non-null in 5000/5000 rows read; example: quality, safety, fitness or compliance of the server |

## `living-cite.json`

TODO(owner): fields not obtainable anonymously.


## `manifest.json`

Top-level keys: `schema`, `as_of`, `files`.
Records under `files`:

| field | type | description |
|---|---|---|
| `path` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 3/3 rows read; example: 9506 |
| `sha256` | string | Observed type string; non-null in 3/3 rows read; example: f26c32772931e341f566ca94b9cf03a76415a024ab4eb5df02f665c8f01b… |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 5/5 rows read; example: census.jsonl |
| `bytes` | integer | Observed type integer; non-null in 5/5 rows read; example: 57186647 |
| `sha256` | string | Observed type string; non-null in 1/5 rows read; example: 69e06a65c9f73e7e641ca135d04644a93116280fe94069838f4a54fd68d3… |
| `blob_id` | string | Observed type string; non-null in 5/5 rows read; example: 7b39df4efbe2c12df634631e38c9998a0e9eb11a |
| `url` | url | Observed type url; non-null in 5/5 rows read; example: https://huggingface.co/datasets/csoai/agent-interop-census/r… |
| `as_of` | datetime | Observed type datetime; non-null in 5/5 rows read; example: 2026-09-06T04:31:59Z |

## `totals.json`

Provisional: read from a differently-sized copy at huggingface.co/datasets/csoai/agent-interop-census/totals.json.

Top-level keys: `schema`, `as_of`, `rows_total`, `rows_by_source`, `mcp_registry_unique_entries`, `mcp_registry_pages_read`, `mcp_registry_source_file`, `mcp_registry_stop_reason`, `mcp_registry_read_state`, `mcp_registry_enumeration_complete`, `mcp_registry_population_total`, `mcp_registry_is_latest`, `mcp_registry_exposing_remote_endpoint`, `hf_spaces_pages_read`, `hf_spaces_read_state`, `rows_with_repo_url`, `github_topic_repo_counts`, `github_mcp_server_by_licence`, `smithery_declared_total`, `smithery_unique_collected`, `mcpso_sitemap_urls`, `hf_mcp_models_enumerated`, `hf_mcp_datasets_enumerated`, `hf_mcp_license_declared`, `github_search_enumeration_cap`, `awesome_list_repos`, `awesome_list_source`, `mcp_official_servers_repo_licence`, `glama_excluded`, `reachability_observation`, `graded_rows`, `grading_note`.

