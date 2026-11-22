# Field reference: nicktempleman/csoai-erc8004-agent-census

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `agents.jsonl`

TODO(owner): fields not obtainable anonymously.


## `declared-a2a.jsonl`

TODO(owner): fields not obtainable anonymously.


## `declared-mcp.jsonl`

TODO(owner): fields not obtainable anonymously.


## `ots-upgraded/2026-09-26/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: aa2ec52e168f359acc9132b5828e4b93b35542f0 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 44e3c973f2a3cfe8f21fb1444fc6991c1154c1b07c784b48ef2870f04a2f… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-26/record.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 56cd0c504e2cb1923c5c862eefaf6a32f6f70a69266e8a3a086111e92676… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 60bd9728f22159351feb71ccd6e0c01faab582f0ccf661415e36f339e52d… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968671, "block_hash": "000000000000000000016e617… |

## `probe-a2a.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe-mcp.jsonl`

TODO(owner): fields not obtainable anonymously.


## `record.json`

Top-level keys: `schema`, `record_id`, `as_of`, `publisher`, `licence`, `what_this_is`, `read_state`, `read_state_because`, `limits`, `chains`, `population`, `reach_signal`, `plan`, `fetch`, `states`, `states_by_chain`, `states_in_plan`, `not_fetched_by_reason`, `uri_unreachable_by_reason_top`, `uri_schemes`, `declares_endpoint`, `declared_endpoint_probes`, `summary_cross_checks`, `producer`, `not_evidence_of`, `published_files`.


## `record.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.

