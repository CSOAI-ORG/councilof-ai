# Field reference: nicktempleman/csoai-gspc-census-mcp-remote

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `CHANGES.2026-09-27.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `added`:

| field | type | description |
|---|---|---|
| `name` | url | Observed type url; non-null in 5000/5000 rows read; example: https://01mind.net/mcp |
| `state` | string | Observed type string; non-null in 5000/5000 rows read; example: RESPONDED |
| `ranked_by` | string | Observed type string; non-null in 5000/5000 rows read; example: first_party:namespace_domain |
| `rank` | integer | Observed type integer; non-null in 5000/5000 rows read; example: 10191 |

## `CHANGES.2026-10-04.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `added`:

| field | type | description |
|---|---|---|
| `name` | url | Observed type url; non-null in 1600/1600 rows read; example: https://0bridge.dev/mcp |
| `state` | string | Observed type string; non-null in 1600/1600 rows read; example: NOT_ATTEMPTED |
| `ranked_by` | string | Observed type string; non-null in 1600/1600 rows read; example: first_party:namespace_domain |
| `rank` | integer | Observed type integer; non-null in 1600/1600 rows read; example: 9420 |

## `CHANGES.2026-10-11.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `added`:

| field | type | description |
|---|---|---|
| `name` | url | Observed type url; non-null in 1617/1617 rows read; example: https://402registry.com/mcp |
| `state` | string | Observed type string; non-null in 1617/1617 rows read; example: RESPONDED |
| `ranked_by` | string | Observed type string; non-null in 1617/1617 rows read; example: registry_order:mcp-registry |
| `rank` | integer | Observed type integer; non-null in 1617/1617 rows read; example: 4847 |

## `frame/plan-top20.json`

Top-level keys: `schema`, `as_of`, `frame_run`, `candidates`, `excluded`, `fraction`, `top_n`, `signal_mix_top`, `signal_mix_all`, `endpoints_with_signal`, `endpoints_with_any_signal`, `npm_weekly_downloads`, `pypi_downloads_7d`, `dockerhub_pull_count`, `smithery_use_count`, `github_stars`, `ranking_rule`, `probing`, `frame_population_total_null`.


## `frame/summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `user_agent`, `min_interval_s`, `requests`, `retry_after_waits`, `sources`, `union`, `overlap`, `canonicalisation`, `not_read_by_this_frame`, `what_a_row_is`, `what_it_never_proves`, `files`.


## `ots-bitcoin-check-2026-09-25.json`

Top-level keys: `schema`, `repo`, `read_at_revision`, `checked_utc`, `method`, `not_a_claim`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 2/2 rows read; example: record.json.ots |
| `target` | string | Observed type string; non-null in 2/2 rows read; example: record.json |
| `target_sha256` | string | Observed type string; non-null in 2/2 rows read; example: c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795d… |
| `file_digest` | string | Observed type string; non-null in 2/2 rows read; example: c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795d… |
| `binds_to_target` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `orig_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 1adaa26865870a5081d35d913edbff37ac6db6f5238125d93c22dd74c1c1… |
| `upgraded_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 7ba5fd4a0b39cd188b4b0df0eaa4426046790303391f4080ae943c22e15d… |
| `state` | string | Observed type string; non-null in 2/2 rows read; example: BITCOIN_ATTESTED |
| `bitcoin` | string | Observed type string; non-null in 2/2 rows read; example: [{"height": 968519, "commitment_reversed": "e74a4973059f2afa… |
| `pending` | string | Observed type string; non-null in 2/2 rows read; example: ["https://finney.calendar.eternitywall.com", "https://bob.bt… |
| `bitcoin_ots` | string | Observed type string; non-null in 2/2 rows read; example: record.json.bitcoin.ots |

## `ots-upgraded/2026-09-25/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 2/2 rows read; example: record.json.ots |
| `original_oid` | string | Observed type string; non-null in 2/2 rows read; example: 288b1913177485267488185084df5e7510b02412 |
| `original_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 1adaa26865870a5081d35d913edbff37ac6db6f5238125d93c22dd74c1c1… |
| `upgraded` | string | Observed type string; non-null in 2/2 rows read; example: ots-upgraded/2026-09-25/record.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 67f785a8c8ce697ba8435671b899a86c24c14e8acc2776b7f70a97530ad7… |
| `file_digest` | string | Observed type string; non-null in 2/2 rows read; example: c4880fdba78709034466045f6c2ac1eda7c466c96502c75cca68ea34795d… |
| `target_file` | string | Observed type string; non-null in 2/2 rows read; example: record.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 2/2 rows read; example: [{"height": 968537, "block_hash": "000000000000000000015d5ee… |

## `ots-upgraded/2026-09-26/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 2/2 rows read; example: record.v0.2.1.json.ots |
| `original_oid` | string | Observed type string; non-null in 2/2 rows read; example: b866e17e2d279dd2c88e4aaabe2b9c3b6ea03aea |
| `original_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 1cc03d072ecc76715a6627ba6105a227df7ba0ce9c41059d199d4f27a800… |
| `upgraded` | string | Observed type string; non-null in 2/2 rows read; example: ots-upgraded/2026-09-26/record.v0.2.1.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 04a88f46f0d9e14d27c4e24e10ce491ec8a827fe243f4eaf09cd24c188d9… |
| `file_digest` | string | Observed type string; non-null in 2/2 rows read; example: 3155502aa629a3e0e8dd0240862933e475cc2afaf3417d03c0efa314d139… |
| `target_file` | string | Observed type string; non-null in 2/2 rows read; example: record.v0.2.1.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 2/2 rows read; example: [{"height": 968671, "block_hash": "000000000000000000016e617… |

## `ots-upgraded/2026-09-27/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-09-27.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 101526604efe033d12159d6581a2a4e044546a0d |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 59eba62e85e20ad21b9aab1440bbd86272bcddefd1fa121ff787794fdbbc… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-27/record.2026-09-27.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 0b55f1a2309ab91ec54cd6fd440c8ebd426e66020118a9abefe1ea5b47a7… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 3926bb8a28937881ef534e84041f23481dfcd6cb3894e4f21c4004b62cee… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-09-27.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968785, "block_hash": "0000000000000000000186b33… |

## `ots-upgraded/2026-10-04/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-04.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 09ec64dde4d5cb88459394c08ce103b323e2c7e7 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 73277f65dcfc807ca1da62308f08831f5c8c9658343eb62dd1ed66064b7d… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-10-04/record.2026-10-04.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: cdda2bba2282e3ce0fce1cdcc9aa295560d92873eab578409b9587b8c411… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 2f2ebf4868b0f68ee2c3267cc3f0e4cb6ac54103eb6093553065d72e8a2a… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-04.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 969796, "block_hash": "00000000000000000001f8728… |

## `ots-upgraded/2026-10-11/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-11.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 0ff2335b0602ea083afc3cca5ab2279c00d0fd51 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 228d0d4b1c450d1991346da3fc1d6c24e54723cce54e1af08a1067cc6c41… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-10-11/record.2026-10-11.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: adcaec0395f087a535e383d33a37ac7b3e0a43f306f24719541b71295ab7… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 4605a05574913d2572de8829a9c844193f442cec9c73e20ee8de85b4d494… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-11.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 970871, "block_hash": "00000000000000000001c80c9… |

## `probe/not_attempted.2026-09-27.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/not_attempted.2026-10-04.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/not_attempted.2026-10-11.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/not_attempted.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/results.public.2026-09-27.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/results.public.2026-10-04.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/results.public.2026-10-11.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/results.public.jsonl`

TODO(owner): fields not obtainable anonymously.


## `probe/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `plan`, `n_planned`, `n_attempted`, `n_not_attempted`, `not_attempted_by_reason`, `read_state`, `read_state_rule`, `states`, `states_by_rank_tier`, `own_estate_endpoints`, `auth_required_http_status`, `mcp_request_not_sent`, `responded`, `requests`, `limits`, `sent_to_endpoints`, `never_sent`, `what_a_row_is`, `what_it_never_proves`, `population_note`, `corrections`.
Records under `corrections`:

| field | type | description |
|---|---|---|
| `what` | string | Observed type string; non-null in 1/1 rows read; example: re-probe after a client fix: an SSE data line longer than on… |
| `endpoints_reprobed` | integer | Observed type integer; non-null in 1/1 rows read; example: 93 |
| `reprobe_window` | string | Observed type string; non-null in 1/1 rows read; example: ["2026-09-25T06:53:43Z", "2026-09-25T06:54:10Z"] |
| `transitions` | string | Observed type string; non-null in 1/1 rows read; example: {"RESPONDED/no_response -> RESPONDED/ok": 89, "RESPONDED/no_… |
| `first_run_kept_as` | string | Observed type string; non-null in 1/1 rows read; example: ["results.run1.jsonl.gz", "summary.run1.json"] |

## `record.2026-09-27.json`

Top-level keys: `schema`, `record_id`, `revision_date`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `revision_of`, `producer`, `frame`, `run`, `summary_cross_checks`, `changes`, `not_evidence_of`, `verify`, `plan`, `published_files`.


## `record.2026-09-27.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.2026-09-27.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.2026-10-04.json`

Top-level keys: `schema`, `record_id`, `revision_date`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `revision_of`, `producer`, `frame`, `run`, `summary_cross_checks`, `changes`, `not_evidence_of`, `verify`, `plan`, `published_files`.


## `record.2026-10-04.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.2026-10-04.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.2026-10-11.json`

Top-level keys: `schema`, `record_id`, `revision_date`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `revision_of`, `producer`, `frame`, `run`, `summary_cross_checks`, `changes`, `not_evidence_of`, `verify`, `plan`, `published_files`.


## `record.2026-10-11.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.2026-10-11.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.json`

Top-level keys: `schema`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `read_state_vocabulary`, `units`, `producer`, `inputs`, `summary_cross_checks`, `independent_reads`, `frame`, `plan`, `probe`, `measured_tool_surface`, `protocol_version`, `anomalies`, `own_entries`, `not_evidence_of`, `published_files`, `hf_dataset`, `verify`.
Records under `anomalies`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 3/3 rows read; example: A1 |
| `host` | string | Observed type string; non-null in 2/3 rows read; example: getvda.ai |
| `measured` | string | Observed type string; non-null in 3/3 rows read; example: {"responded_subdomains": 94, "responded_endpoints": 94, "ans… |
| `what_we_say` | string | Observed type string; non-null in 3/3 rows read; example: 92 distinct getvda.ai subdomains answered with the identical… |
| `what_we_do_not_say` | string | Observed type string; non-null in 1/3 rows read; example: anything about the operator's intent, or whether the version… |
| `correction_to_the_brief` | string | Observed type string; non-null in 1/3 rows read; example: the lane brief said '109/112 identical'; the rows show 109/1… |
| `stage` | string | Observed type string; non-null in 1/3 rows read; example: UNREACHABLE by cause; every DNS failure happened at the robo… |

## `record.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.v0.1.1.json`

Top-level keys: `schema`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `read_state_vocabulary`, `units`, `producer`, `inputs`, `summary_cross_checks`, `independent_reads`, `frame`, `plan`, `probe`, `measured_tool_surface`, `protocol_version`, `anomalies`, `own_entries`, `not_evidence_of`, `published_files`, `hf_dataset`, `verify`, `record_version`, `supersedes`, `correction`.
Records under `anomalies`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 3/3 rows read; example: A1 |
| `host` | string | Observed type string; non-null in 2/3 rows read; example: getvda.ai |
| `measured` | string | Observed type string; non-null in 3/3 rows read; example: {"responded_subdomains": 94, "responded_endpoints": 94, "ans… |
| `what_we_say` | string | Observed type string; non-null in 3/3 rows read; example: 92 distinct getvda.ai subdomains answered with the identical… |
| `what_we_do_not_say` | string | Observed type string; non-null in 1/3 rows read; example: anything about the operator's intent. '2026-07-28' is a real… |
| `correction_to_the_brief` | string | Observed type string; non-null in 1/3 rows read; example: the lane brief said '109/112 identical'; the rows show 109/1… |
| `stage` | string | Observed type string; non-null in 1/3 rows read; example: UNREACHABLE by cause; every DNS failure happened at the robo… |

## `record.v0.1.1.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.v0.1.1.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.v0.2.1.json`

Top-level keys: `schema`, `record_version`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `read_state`, `read_state_rule`, `population`, `states`, `states_contacted_share`, `not_attempted_by_reason`, `rows_by_observation`, `states_by_observation`, `reuse`, `rights_gate`, `probe_run_2026-09-26`, `protocol_version`, `tool_counts_over_complete_lists`, `own_estate_endpoints`, `comparison_vs_v0_1_1`, `correction_lane_check`, `protocol_request_by_date`, `summary_cross_checks`, `producer`, `public_row_fields`, `not_published`, `not_evidence_of`, `published_files`, `hf_dataset`, `population_accounting`, `supersedes`, `correction`.


## `record.v0.2.1.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.v0.2.1.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.v0.2.json`

Top-level keys: `schema`, `record_version`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `what_this_is`, `read_state`, `read_state_rule`, `population`, `states`, `states_contacted_share`, `not_attempted_by_reason`, `rows_by_observation`, `states_by_observation`, `reuse`, `rights_gate`, `probe_run_2026-09-26`, `protocol_version`, `tool_counts_over_complete_lists`, `own_estate_endpoints`, `comparison_vs_v0_1_1`, `correction_lane_check`, `protocol_request_by_date`, `summary_cross_checks`, `producer`, `public_row_fields`, `not_published`, `not_evidence_of`, `published_files`, `hf_dataset`.


## `record.v0.2.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.v0.2.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `results.v0.2.public.jsonl`

TODO(owner): fields not obtainable anonymously.


## `run/2026-09-27/frame-summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `user_agent`, `min_interval_s`, `requests`, `retry_after_waits`, `sources`, `union`, `overlap`, `canonicalisation`, `not_read_by_this_frame`, `what_a_row_is`, `what_it_never_proves`, `files`.


## `run/2026-09-27/plan-firstparty.json`

Top-level keys: `schema`, `as_of`, `frame`, `psl`, `top20_plan`, `candidates`, `ineligible`, `tier_n`, `tier_by_basis`, `tier_already_in_top20_plan`, `tier_added_to_plan`, `tier_added_by_basis`, `tier_hosts`, `tier_registrable_domains`, `top_registrable_domains`, `rule`, `why`, `what_a_row_is`, `what_it_never_proves`, `probing`.


## `run/2026-09-27/plan-union.json`

Top-level keys: `schema`, `as_of`, `top20_n`, `firstparty_tier_n`, `firstparty_added`, `union_n`, `rights_gate_removed_n`, `rights_gate_removed`, `planned_n`, `rule`, `inputs`.


## `run/2026-09-27/probe-summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `plan`, `n_planned`, `n_attempted`, `n_not_attempted`, `not_attempted_by_reason`, `read_state`, `read_state_rule`, `states`, `states_by_rank_tier`, `own_estate_endpoints`, `auth_required_http_status`, `mcp_request_not_sent`, `responded`, `requests`, `limits`, `sent_to_endpoints`, `never_sent`, `what_a_row_is`, `what_it_never_proves`, `population_note`.


## `run/2026-09-27/rights-gate-summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `frame`, `what_a_row_is`, `n_subjects`, `population_total`, `population_total_null_because`, `decisions`, `unknown_share`, `decision_reasons`, `decisions_by_source`, `effective_licence_by_spdx_subjects`, `effective_licence_by_category_subjects`, `subjects_by_licence_evidence_kind`, `packages_by_spdx`, `packages_looked_up`, `package_lookup_status`, `hf_space_cards`, `github_sample`, `oci_label_sample`, `catalogue_terms`, `rules`, `normalisation_notes`, `files`.


## `run/2026-10-04/frame-summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `user_agent`, `min_interval_s`, `requests`, `retry_after_waits`, `sources`, `union`, `overlap`, `canonicalisation`, `not_read_by_this_frame`, `what_a_row_is`, `what_it_never_proves`, `files`.


## `run/2026-10-04/plan-firstparty.json`

Top-level keys: `schema`, `as_of`, `frame`, `psl`, `top20_plan`, `candidates`, `ineligible`, `tier_n`, `tier_by_basis`, `tier_already_in_top20_plan`, `tier_added_to_plan`, `tier_added_by_basis`, `tier_hosts`, `tier_registrable_domains`, `top_registrable_domains`, `rule`, `why`, `what_a_row_is`, `what_it_never_proves`, `probing`.


## `run/2026-10-04/plan-union.json`

Top-level keys: `schema`, `as_of`, `top20_n`, `firstparty_tier_n`, `firstparty_added`, `union_n`, `rights_gate_removed_n`, `rights_gate_removed`, `planned_n`, `rule`, `inputs`.


## `run/2026-10-04/probe-summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `plan`, `n_planned`, `n_attempted`, `n_not_attempted`, `not_attempted_by_reason`, `read_state`, `read_state_rule`, `states`, `states_by_rank_tier`, `own_estate_endpoints`, `auth_required_http_status`, `mcp_request_not_sent`, `responded`, `requests`, `limits`, `sent_to_endpoints`, `never_sent`, `what_a_row_is`, `what_it_never_proves`, `population_note`.


## `run/2026-10-04/rights-gate-summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `frame`, `what_a_row_is`, `n_subjects`, `population_total`, `population_total_null_because`, `decisions`, `unknown_share`, `decision_reasons`, `decisions_by_source`, `effective_licence_by_spdx_subjects`, `effective_licence_by_category_subjects`, `subjects_by_licence_evidence_kind`, `packages_by_spdx`, `packages_looked_up`, `package_lookup_status`, `hf_space_cards`, `github_sample`, `oci_label_sample`, `catalogue_terms`, `rules`, `normalisation_notes`, `files`.


## `run/2026-10-11/frame-summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `user_agent`, `min_interval_s`, `requests`, `retry_after_waits`, `sources`, `union`, `overlap`, `canonicalisation`, `not_read_by_this_frame`, `what_a_row_is`, `what_it_never_proves`, `files`.


## `run/2026-10-11/plan-firstparty.json`

Top-level keys: `schema`, `as_of`, `frame`, `psl`, `top20_plan`, `candidates`, `ineligible`, `tier_n`, `tier_by_basis`, `tier_already_in_top20_plan`, `tier_added_to_plan`, `tier_added_by_basis`, `tier_hosts`, `tier_registrable_domains`, `top_registrable_domains`, `rule`, `why`, `what_a_row_is`, `what_it_never_proves`, `probing`.


## `run/2026-10-11/plan-union.json`

Top-level keys: `schema`, `as_of`, `top20_n`, `firstparty_tier_n`, `firstparty_added`, `union_n`, `rights_gate_removed_n`, `rights_gate_removed`, `planned_n`, `rule`, `inputs`.


## `run/2026-10-11/probe-summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `plan`, `n_planned`, `n_attempted`, `n_not_attempted`, `not_attempted_by_reason`, `read_state`, `read_state_rule`, `states`, `states_by_rank_tier`, `own_estate_endpoints`, `auth_required_http_status`, `mcp_request_not_sent`, `responded`, `requests`, `limits`, `sent_to_endpoints`, `never_sent`, `what_a_row_is`, `what_it_never_proves`, `population_note`.


## `run/2026-10-11/rights-gate-summary.json`

Top-level keys: `schema`, `run_started`, `run_finished`, `frame`, `what_a_row_is`, `n_subjects`, `population_total`, `population_total_null_because`, `decisions`, `unknown_share`, `decision_reasons`, `decisions_by_source`, `effective_licence_by_spdx_subjects`, `effective_licence_by_category_subjects`, `subjects_by_licence_evidence_kind`, `packages_by_spdx`, `packages_looked_up`, `package_lookup_status`, `hf_space_cards`, `github_sample`, `oci_label_sample`, `catalogue_terms`, `rules`, `normalisation_notes`, `files`.

