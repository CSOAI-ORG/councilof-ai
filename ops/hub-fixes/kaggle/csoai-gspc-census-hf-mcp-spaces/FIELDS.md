# Field reference: nicktempleman/csoai-gspc-census-hf-mcp-spaces

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `CHANGES.2026-09-27.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `state_changed`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 1016/1016 rows read; example: 0208suin/mcp-sentiment |
| `from` | string | Observed type string; non-null in 1016/1016 rows read; example: SLEEPING |
| `to` | string | Observed type string; non-null in 1016/1016 rows read; example: SSE_ENDPOINT_ONLY |

## `CHANGES.2026-10-04.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `state_changed`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 1272/1272 rows read; example: 0208suin/mcp-sentiment |
| `from` | string | Observed type string; non-null in 1272/1272 rows read; example: SSE_ENDPOINT_ONLY |
| `to` | string | Observed type string; non-null in 1272/1272 rows read; example: SLEEPING |

## `CHANGES.2026-10-11.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `state_changed`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 1241/1241 rows read; example: 01pratyush/mcp-sentiment-server |
| `from` | string | Observed type string; non-null in 1241/1241 rows read; example: SLEEPING |
| `to` | string | Observed type string; non-null in 1241/1241 rows read; example: RESPONDED |

## `data/spaces.2026-09-27.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/spaces.2026-10-04.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/spaces.2026-10-11.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/spaces.jsonl`

TODO(owner): fields not obtainable anonymously.


## `ots-bitcoin-check-2026-09-25.json`

Top-level keys: `schema`, `repo`, `read_at_revision`, `checked_utc`, `method`, `not_a_claim`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 1/1 rows read; example: record.json.ots |
| `target` | string | Observed type string; non-null in 1/1 rows read; example: record.json |
| `target_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb… |
| `binds_to_target` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `orig_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 8ffba1a1fcebdea1a28221dab4a59ba28b5b29873344f0dad6457fb9d1a0… |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 63425c7f98d07ce274d9ab4e50569fef04dce4d1e7a618a9bdfa0737e12b… |
| `state` | string | Observed type string; non-null in 1/1 rows read; example: BITCOIN_ATTESTED |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968537, "commitment_reversed": "025e385f3578febe… |
| `pending` | string | Observed type string; non-null in 1/1 rows read; example: ["https://finney.calendar.eternitywall.com", "https://bob.bt… |
| `bitcoin_ots` | string | Observed type string; non-null in 1/1 rows read; example: record.json.bitcoin.ots |

## `ots-upgraded/2026-09-25/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 333cf121ef836ba1e6afb12b55c213a83dfd6352 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 8ffba1a1fcebdea1a28221dab4a59ba28b5b29873344f0dad6457fb9d1a0… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-25/record.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 9300e38c9aa684925ee269bc3ed16326ad5f0a5028aa00ee8527973b70e1… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 53022d26ca321b291ca5578b3b318ef645ecf1e4343b13320ebc91642abb… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968537, "block_hash": "000000000000000000015d5ee… |

## `ots-upgraded/2026-09-27/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-09-27.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 0d8a71f70e2133777a026ddd845c093657903812 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 450295a1d9871e4c195b8cb793f8c9a5bc152042cf5722883b39ecc243d8… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-27/record.2026-09-27.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 232088e8989b0b3d1897adf987b4ae37bbe56463edfd42d269cf70a161fc… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 37ff0db1612ddeb4e4ce31b470e3f2fac8a57972db985982fb0880b3fa50… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-09-27.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968791, "block_hash": "00000000000000000000463d6… |

## `ots-upgraded/2026-10-04/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-04.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 0c520ace6ac5d3108ff0585f100ff6d7dedb294d |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: cd0ec4136a20a2e5317682b4b787688fff7556fd41c969f75255933e9920… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-10-04/record.2026-10-04.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: f3edafd9432302230b3e6c5298352899017ad28c5a1beca4fcbe86328059… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: fdb6b4c1f2ee1e52175ce27b77817c5aec94f7fada4c21551bf7118995e6… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-04.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 969796, "block_hash": "00000000000000000001f8728… |

## `ots-upgraded/2026-10-11/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-11.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: d2202c397271119e2a3cedc650d3f883359dd5fe |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 1791c45cb75240bed80877ab21d812694fe34a8c4064979fade1cdff8277… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-10-11/record.2026-10-11.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: a59607d4e8c172320165f14d24c9304ef2ed1e93991e05466e3815437066… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 7b0edc1d5da537d9406a391a63650d09990edeaf2cd8eae9c89b710158d7… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-11.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 970871, "block_hash": "00000000000000000001c80c9… |

## `record.2026-09-27.json`

Top-level keys: `schema`, `record_id`, `revision_date`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `revision_of`, `producer`, `frame`, `run`, `summary_cross_checks`, `changes`, `not_evidence_of`, `verify`, `rights_gate`, `published_files`.


## `record.2026-09-27.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.2026-09-27.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.2026-10-04.json`

Top-level keys: `schema`, `record_id`, `revision_date`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `revision_of`, `producer`, `frame`, `run`, `summary_cross_checks`, `changes`, `not_evidence_of`, `verify`, `rights_gate`, `published_files`.


## `record.2026-10-04.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.2026-10-04.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.2026-10-11.json`

Top-level keys: `schema`, `record_id`, `revision_date`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `revision_of`, `producer`, `frame`, `run`, `summary_cross_checks`, `changes`, `not_evidence_of`, `verify`, `rights_gate`, `published_files`.


## `record.2026-10-11.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.2026-10-11.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.json`

Top-level keys: `schema`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `family`, `what_this_is`, `read_state_vocabulary`, `units`, `producer`, `inputs`, `summary_cross_checks`, `read`, `states`, `states_by_tier`, `state_meanings`, `not_contacted`, `contacted`, `owner_cost_note`, `measured_tool_surface`, `protocol_version`, `anomalies`, `not_evidence_of`, `published_files`, `hf_dataset`, `verify`.
Records under `anomalies`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 6/6 rows read; example: H1 |
| `what_we_say` | string | Observed type string; non-null in 6/6 rows read; example: 6 Spaces were RUNNING in the listing walk and SLEEPING in th… |

## `record.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `run/2026-09-27/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `stage_listing_walk`, `n_planned`, `n_planned_top20`, `n_reached`, `n_not_attempted`, `not_attempted_by_tier`, `read_state`, `read_state_top20`, `read_state_rule`, `states`, `states_by_tier`, `mcp_states_over_contacted_spaces`, `n_contacted`, `never_woke_invariant`, `hardware_of_contacted`, `responded`, `requests`, `limits`, `sent_to_spaces`, `never_sent`, `cost_to_owners_note`, `what_a_row_is`, `what_it_never_proves`, `population_note`.


## `run/2026-10-04/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `stage_listing_walk`, `n_planned`, `n_planned_top20`, `n_reached`, `n_not_attempted`, `not_attempted_by_tier`, `read_state`, `read_state_top20`, `read_state_rule`, `states`, `states_by_tier`, `mcp_states_over_contacted_spaces`, `n_contacted`, `never_woke_invariant`, `hardware_of_contacted`, `responded`, `requests`, `limits`, `sent_to_spaces`, `never_sent`, `cost_to_owners_note`, `what_a_row_is`, `what_it_never_proves`, `population_note`.


## `run/2026-10-11/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `stage_listing_walk`, `n_planned`, `n_planned_top20`, `n_reached`, `n_not_attempted`, `not_attempted_by_tier`, `read_state`, `read_state_top20`, `read_state_rule`, `states`, `states_by_tier`, `mcp_states_over_contacted_spaces`, `n_contacted`, `never_woke_invariant`, `hardware_of_contacted`, `responded`, `requests`, `limits`, `sent_to_spaces`, `never_sent`, `cost_to_owners_note`, `what_a_row_is`, `what_it_never_proves`, `population_note`.


## `run/listing-pages.json`

| field | type | description |
|---|---|---|
| `i` | integer | Observed type integer; non-null in 11/11 rows read; example: 1 |
| `url` | url | Observed type url; non-null in 11/11 rows read; example: https://huggingface.co/api/spaces?filter=mcp-server&limit=10… |
| `status` | integer | Observed type integer; non-null in 11/11 rows read; example: 200 |
| `bytes` | integer | Observed type integer; non-null in 11/11 rows read; example: 635860 |
| `sha256` | string | Observed type string; non-null in 11/11 rows read; example: 0cc6eac91e15e2e8d29fb1a455b2fcbc8745c03dc17c72feb030b26b68f2… |
| `file` | string | Observed type string; non-null in 11/11 rows read; example: 00001.json.gz |

## `run/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `stage_listing_walk`, `n_planned`, `n_planned_top20`, `n_reached`, `n_not_attempted`, `not_attempted_by_tier`, `read_state`, `read_state_top20`, `read_state_rule`, `states`, `states_by_tier`, `mcp_states_over_contacted_spaces`, `n_contacted`, `never_woke_invariant`, `hardware_of_contacted`, `responded`, `requests`, `limits`, `sent_to_spaces`, `never_sent`, `cost_to_owners_note`, `what_a_row_is`, `what_it_never_proves`, `population_note`, `corrections`.
Records under `corrections`:

| field | type | description |
|---|---|---|
| `what` | string | Observed type string; non-null in 1/1 rows read; example: the 6 STAGE_UNREADABLE rows re-read with the committed Hub c… |
| `spaces_reread` | integer | Observed type integer; non-null in 1/1 rows read; example: 6 |
| `reread_window` | string | Observed type string; non-null in 1/1 rows read; example: ["2026-09-25T07:59:32Z", "2026-09-25T07:59:36Z"] |
| `transitions` | string | Observed type string; non-null in 1/1 rows read; example: {"STAGE_UNREADABLE -> RESPONDED": 1, "STAGE_UNREADABLE -> ST… |
| `run1_kept_as` | string | Observed type string; non-null in 1/1 rows read; example: ["results.run1.jsonl.gz", "summary.run1.json", "not_attempte… |

## `run/summary.run1.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `stage_listing_walk`, `n_planned`, `n_planned_top20`, `n_reached`, `n_not_attempted`, `not_attempted_by_tier`, `read_state`, `read_state_top20`, `read_state_rule`, `states`, `states_by_tier`, `mcp_states_over_contacted_spaces`, `n_contacted`, `never_woke_invariant`, `hardware_of_contacted`, `responded`, `requests`, `limits`, `sent_to_spaces`, `never_sent`, `cost_to_owners_note`, `what_a_row_is`, `what_it_never_proves`, `population_note`.

