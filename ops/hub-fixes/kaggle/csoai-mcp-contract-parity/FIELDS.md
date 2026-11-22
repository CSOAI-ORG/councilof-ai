# Field reference: nicktempleman/csoai-mcp-contract-parity

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `correction.v0.1.1.evidence.json`

Top-level keys: `immersivecommons`, `augenix`, `klarix`, `transloadit`, `toolforte`.


## `correction.v0.1.2.evidence.json`

Top-level keys: `findings`, `inputs`, `schema`, `source`.


## `hold.jsonl`

TODO(owner): fields not obtainable anonymously.


## `ots-bitcoin-check-2026-09-25.json`

Top-level keys: `schema`, `repo`, `read_at_revision`, `checked_utc`, `method`, `not_a_claim`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 1/1 rows read; example: record.json.ots |
| `target` | string | Observed type string; non-null in 1/1 rows read; example: record.json |
| `target_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730c… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 45e3fd63fc98ad251a4f9fe5fdb705ed7fbc28321d5c205d10114a21730c… |
| `binds_to_target` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `orig_sha256` | string | Observed type string; non-null in 1/1 rows read; example: c168264381e3f2ed4af313c9315834c875dc62cb0b223c3020b8e8498fa5… |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: e38d524655a32a8acdca3be872165b3933dbfcdff8ea1ca3354d61a7f6d2… |
| `state` | string | Observed type string; non-null in 1/1 rows read; example: BITCOIN_ATTESTED |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968549, "commitment_reversed": "ae9ca81542821000… |
| `pending` | string | Observed type string; non-null in 1/1 rows read; example: ["https://bob.btc.calendar.opentimestamps.org", "https://fin… |
| `bitcoin_ots` | string | Observed type string; non-null in 1/1 rows read; example: record.json.bitcoin.ots |

## `ots-bitcoin-check-2026-09-26.json`

Top-level keys: `schema`, `checked_utc`, `method`, `files`.


## `ots-upgraded/2026-09-26/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 4/4 rows read; example: probe/record.firstparty-2026-09-25.json.ots |
| `original_oid` | string | Observed type string; non-null in 4/4 rows read; example: 82891cb251f4c7a47060a302b2b32ba4e3870e4b |
| `original_sha256` | string | Observed type string; non-null in 4/4 rows read; example: 159adde3f00bcd02600f2093cbcf6d6f40cf335a87ca5208ec5cb4c63dc6… |
| `upgraded` | string | Observed type string; non-null in 4/4 rows read; example: ots-upgraded/2026-09-26/probe/record.firstparty-2026-09-25.j… |
| `upgraded_sha256` | string | Observed type string; non-null in 4/4 rows read; example: 37e9b0a4e32661c71b636957d75ae400dfa6371b33c2adfcf9acb348aeae… |
| `file_digest` | string | Observed type string; non-null in 4/4 rows read; example: f338012c259fe9790fc5cbb338447fae15078970b35b80cd037aa25fe3f7… |
| `target_file` | string | Observed type string; non-null in 4/4 rows read; example: probe/record.firstparty-2026-09-25.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 4/4 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 4/4 rows read; example: [{"height": 968668, "block_hash": "0000000000000000000188e7a… |

## `probe/census-firstparty-2026-09-25.not_attempted.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/census-firstparty-2026-09-25.plan.json`

Top-level keys: `schema`, `as_of`, `frame`, `psl`, `top20_plan`, `candidates`, `ineligible`, `tier_n`, `tier_by_basis`, `tier_already_in_top20_plan`, `tier_added_to_plan`, `tier_added_by_basis`, `tier_hosts`, `tier_registrable_domains`, `top_registrable_domains`, `rule`, `why`, `what_a_row_is`, `what_it_never_proves`, `probing`.


## `probe/census-firstparty-2026-09-25.results.public.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/census-firstparty-2026-09-25.summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `plan`, `n_planned`, `n_attempted`, `n_not_attempted`, `not_attempted_by_reason`, `read_state`, `read_state_rule`, `states`, `own_estate_endpoints`, `auth_required_http_status`, `mcp_request_not_sent`, `responded`, `requests`, `limits`, `sent_to_endpoints`, `never_sent`, `what_a_row_is`, `what_it_never_proves`, `population_note`, `states_by_basis`, `states_by_overlap_with_top20_plan`, `what_the_tier_never_proves`.


## `probe/record.firstparty-2026-09-25.json`

Top-level keys: `as_of`, `cited_by_parity`, `exclusions`, `not_published`, `probe`, `public_fields`, `published_files`, `published_utc`, `rights_gate`, `schema`, `verify`, `what`.


## `probe/record.firstparty-2026-09-25.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `probe/record.firstparty-2026-09-25.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `record.json`

Top-level keys: `as_of`, `dimension_states`, `endpoints_with_any_inconsistent`, `hf_dataset`, `hold`, `inconsistent_dimensions_per_endpoint`, `inconsistent_pairs_top`, `instrument`, `never_sent`, `own_result_first`, `published_files`, `question`, `run`, `schema`, `states`, `surface_fetch_states`, `timing`, `uncheckable_reasons`, `verify`, `version_namespaces`, `watch_list`, `what_it_does_not_show`.


## `record.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `record.v0.1.1.json`

Top-level keys: `as_of`, `correction`, `dimension_states`, `endpoints_with_any_inconsistent`, `hf_dataset`, `hold`, `inconsistent_dimensions_per_endpoint`, `inconsistent_pairs_top`, `instrument`, `never_sent`, `own_result_first`, `published_files`, `question`, `reclassified_utc`, `record_version`, `run`, `schema`, `states`, `supersedes`, `surface_fetch_states`, `timing`, `uncheckable_reasons`, `verify`, `version_namespaces`, `watch_list`, `what_it_does_not_show`.


## `record.v0.1.1.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.v0.1.1.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `record.v0.1.2.json`

Top-level keys: `as_of`, `correction`, `corrections_history`, `dimension_states`, `endpoints_with_any_inconsistent`, `hf_dataset`, `hold`, `inconsistent_dimensions_per_endpoint`, `inconsistent_pairs_top`, `instrument`, `never_sent`, `own_result_first`, `published_files`, `question`, `reclassified_utc`, `record_version`, `run`, `schema`, `states`, `supersedes`, `surface_fetch_states`, `timing`, `uncheckable_reasons`, `verify`, `version_namespaces`, `watch_list`, `what_it_does_not_show`.


## `record.v0.1.2.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.v0.1.2.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `rereads/2026-09-30/zensched.registry.json`

Top-level keys: `servers`, `metadata`.
Records under `servers`:

| field | type | description |
|---|---|---|
| `server` | string | Observed type string; non-null in 1/1 rows read; example: {"$schema": "https://static.modelcontextprotocol.io/schemas/… |
| `_meta` | string | Observed type string; non-null in 1/1 rows read; example: {"io.modelcontextprotocol.registry/official": {"status": "ac… |

## `rereads/2026-09-30/zensched.reread.json`

Top-level keys: `schema`, `endpoint`, `registry_id`, `dimension`, `read_at`, `reader`, `prior_finding`, `surfaces`, `state_now`, `note`.


## `rereads/2026-09-30/zensched.server-card.json`

Top-level keys: `serverInfo`, `authentication`, `tools`, `resources`, `prompts`.
Records under `tools`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 74/74 rows read; example: zensched_guide |
| `description` | string | Observed type string; non-null in 74/74 rows read; example: START HERE. The ZenSched agent guide: how to Connect (Claude… |
| `inputSchema` | string | Observed type string; non-null in 74/74 rows read; example: {"properties": {}, "title": "zensched_guideArguments", "type… |

## `rows.jsonl`

TODO(owner): fields not obtainable anonymously.


## `rows.v0.1.1.jsonl`

TODO(owner): fields not obtainable anonymously.


## `rows.v0.1.2.jsonl`

TODO(owner): fields not obtainable anonymously.


## `rows.v0.1.2.viewer.parquet`

| field | type | description |
|---|---|---|
| `endpoint` | url | Observed type url; non-null in 2000/2000 rows read; example: https://councilof.ai/mcp |
| `host` | string | Observed type string; non-null in 2000/2000 rows read; example: councilof.ai |
| `inclusion` | string | Observed type string; non-null in 2000/2000 rows read; example: responded |
| `in_watch_list` | boolean | Observed type boolean; non-null in 2000/2000 rows read; example: false |
| `own_estate` | boolean | Observed type boolean; non-null in 2000/2000 rows read; example: true |
| `shared_origin` | boolean | Observed type boolean; non-null in 2000/2000 rows read; example: true |
| `attempted` | boolean | Observed type boolean; non-null in 2000/2000 rows read; example: true |
| `registry_ids` | string | Observed type string; non-null in 2000/2000 rows read; example: io.github.CSOAI-ORG/gspc |
| `live_state` | string | Observed type string; non-null in 2000/2000 rows read; example: RESPONDED |
| `live_http_status` | integer | Observed type integer; non-null in 2000/2000 rows read; example: 200 |
| `live_protocol_version` | datetime | Observed type datetime; non-null in 1992/2000 rows read; example: 2025-11-25 |
| `live_protocol_version_requested` | datetime | Observed type datetime; non-null in 23/2000 rows read; example: 2026-07-28 |
| `live_n_tools` | integer | Observed type integer; non-null in 1963/2000 rows read; example: 13 |
| `live_tools_complete` | boolean | Observed type boolean; non-null in 1963/2000 rows read; example: true |
| `live_tools_list_status` | string | Observed type string; non-null in 1992/2000 rows read; example: ok |
| `live_tool_names_sha256` | string | Observed type string; non-null in 1963/2000 rows read; example: 57ac629337a17b448cf21113e7c405a1d039990078986698f88fc78cd8a1… |
| `live_server_version` | string | Observed type string; non-null in 1976/2000 rows read; example: 1.4.2 |
| `live_probe_source` | string | Observed type string; non-null in 2000/2000 rows read; example: census-probe-2026-09-25 |
| `live_finished` | datetime | Observed type datetime; non-null in 2000/2000 rows read; example: 2026-09-25T06:39:27Z |
| `VERSION_state` | string | Observed type string; non-null in 2000/2000 rows read; example: CONSISTENT |
| `VERSION_reason` | string | Observed type string; non-null in 0/2000 rows read |
| `VERSION_detail` | string | Observed type string; non-null in 1051/2000 rows read; example: live initialize serverInfo.version = 1.0.0 vs registry ai.ad… |
| `TOOLS_state` | string | Observed type string; non-null in 2000/2000 rows read; example: CONSISTENT |
| `TOOLS_reason` | string | Observed type string; non-null in 65/2000 rows read; example: LIVE_TOOL_LIST_UNAVAILABLE |
| `TOOLS_detail` | string | Observed type string; non-null in 1701/2000 rows read; example: no surface declares a tool list or count |
| `AUTH_state` | string | Observed type string; non-null in 2000/2000 rows read; example: CONSISTENT |
| `AUTH_reason` | string | Observed type string; non-null in 186/2000 rows read; example: DECLARED_REQUIRED_SCOPE_UNSTATED |
| `AUTH_detail` | string | Observed type string; non-null in 1644/2000 rows read; example: no surface declares an auth requirement; only the observed b… |
| `PAYMENT_state` | string | Observed type string; non-null in 2000/2000 rows read; example: CONSISTENT |
| `PAYMENT_reason` | string | Observed type string; non-null in 1764/2000 rows read; example: NO_PAYMENT_SURFACE |
| `PAYMENT_detail` | string | Observed type string; non-null in 2000/2000 rows read; example: all 13 tools the x402 manifest names are in the live tools/l… |
| `PROTOCOL_state` | string | Observed type string; non-null in 2000/2000 rows read; example: SINGLE_SURFACE |
| `PROTOCOL_reason` | string | Observed type string; non-null in 172/2000 rows read; example: DECLARED_VERSION_NOT_REQUESTED |
| `PROTOCOL_detail` | string | Observed type string; non-null in 1865/2000 rows read; example: no surface declares an MCP protocol version |
| `row_json` | string | Observed type string; non-null in 2000/2000 rows read; example: {"attempted": true, "dimensions": {"AUTH": {"declared": [{"p… |
