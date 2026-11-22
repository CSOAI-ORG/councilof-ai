# Field reference: nicktempleman/csoai-gspc-census-a2a-card

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `CHANGES.2026-09-27.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `state_changed`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 9/9 rows read; example: 13b680b9-0053-4b51-8e21-7f19df99cafc |
| `from` | string | Observed type string; non-null in 9/9 rows read; example: CARD_SERVED |
| `to` | string | Observed type string; non-null in 9/9 rows read; example: ROBOTS_DISALLOWED |

## `CHANGES.2026-10-04.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `added`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 72/72 rows read; example: 000fa483-31a2-4eae-88d5-f81c04104814 |
| `state` | string | Observed type string; non-null in 72/72 rows read; example: CARD_SERVED |
| `order` | integer | Observed type integer; non-null in 72/72 rows read; example: 268 |

## `CHANGES.2026-10-11.json`

Top-level keys: `schema`, `dataset`, `date`, `current`, `previous`, `rules`, `frame_read_states`, `counts`, `key`, `added`, `dropped`, `state_changed`, `out_of_plan`, `not_compared_not_attempted_in_one_run`, `unchanged`, `transitions`.
Records under `dropped`:

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 44/44 rows read; example: 114088e2-e1c2-46da-a508-5edb3ee3ff50 |
| `previous_state` | string | Observed type string; non-null in 44/44 rows read; example: CARD_SERVED |
| `why` | string | Observed type string; non-null in 44/44 rows read; example: not in this week's frame read |

## `correction.v0.1.1.evidence.json`

Top-level keys: `rechecked`, `schema`.
Records under `rechecked`:

| field | type | description |
|---|---|---|
| `card_sha256` | string | Observed type string; non-null in 19/19 rows read; example: ea17f8fd511f6514b3e8c2ecb7221d4e5ff3fffca88189ed1adecb101b48… |
| `declared` | string | Observed type string; non-null in 19/19 rows read; example: ["1.0"] |
| `id` | string | Observed type string; non-null in 19/19 rows read; example: fbbc1e43-6975-46d2-a066-7e8ad90357b3 |
| `note` | string | Observed type string; non-null in 3/19 rows read; example: protocol 0.3 defines no canonicalisation step; verdict under… |
| `rule` | string | Observed type string; non-null in 19/19 rows read; example: a2a-1.x-8.4.3 |
| `sig_state_0_1` | string | Observed type string; non-null in 19/19 rows read; example: VERIFIED |
| `sig_state_0_1_1` | string | Observed type string; non-null in 19/19 rows read; example: FAILED |
| `sig_state_0_1_rule_same_keys` | string | Observed type string; non-null in 19/19 rows read; example: VERIFIED |
| `sig_state_under_1x_rules` | string | Observed type string; non-null in 5/19 rows read; example: FAILED |
| `signatures` | string | Observed type string; non-null in 19/19 rows read; example: [{"alg": "EdDSA", "alt_serialisations_verifying": ["jcs_defa… |

## `data/cards.2026-09-27.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.2026-10-04.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.2026-10-11.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.not_attempted.2026-09-27.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.not_attempted.2026-10-04.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.not_attempted.2026-10-11.jsonl`

TODO(owner): fields not obtainable anonymously.


## `data/cards.v0.1.1.jsonl`

TODO(owner): fields not obtainable anonymously.


## `ots-bitcoin-check-2026-09-25.json`

Top-level keys: `schema`, `repo`, `read_at_revision`, `checked_utc`, `method`, `not_a_claim`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 1/1 rows read; example: record.json.ots |
| `target` | string | Observed type string; non-null in 1/1 rows read; example: record.json |
| `target_sha256` | string | Observed type string; non-null in 1/1 rows read; example: b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662… |
| `binds_to_target` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `orig_sha256` | string | Observed type string; non-null in 1/1 rows read; example: dec8cc0c938bbd716a94cc2ca1a9a06c835136db74379b67e2c2628f288f… |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: fc4d44231bc385bf0b582484e868c211d936071f1b5caee3c111716068d1… |
| `state` | string | Observed type string; non-null in 1/1 rows read; example: BITCOIN_ATTESTED |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968527, "commitment_reversed": "765c1aa96735b0d7… |
| `pending` | string | Observed type string; non-null in 1/1 rows read; example: ["https://alice.btc.calendar.opentimestamps.org", "https://b… |
| `bitcoin_ots` | string | Observed type string; non-null in 1/1 rows read; example: record.json.bitcoin.ots |

## `ots-upgraded/2026-09-25/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 31a0f25fc2d12b868f2543fe5d7d7bca42eb0625 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: dec8cc0c938bbd716a94cc2ca1a9a06c835136db74379b67e2c2628f288f… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-25/record.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 9d25830ef10d4d84f8049ad07a64d3131037b672373104a9c701f47c94fe… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968527, "block_hash": "000000000000000000017b77d… |

## `ots-upgraded/2026-09-26/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.v0.1.1.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: d8fc502d3237fa6e6326196b02af78c2dac2f9d9 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 29cb8f0885a3b9bdfbd87c1fa111b1e4402eaf048e42a2eb22cf76a9629e… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-26/record.v0.1.1.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 5067e18badbdd1254e8ec4f16ad0258c1084030c6cba0eaf7af4f0e99816… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 4a2b46bb42aa727363ca04d8a2cc21ed76b50a4c6937a62f80d6fcfda191… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.v0.1.1.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968671, "block_hash": "000000000000000000016e617… |

## `ots-upgraded/2026-09-27/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-09-27.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 9547dc5a36160600db676a5e2033b385638622c6 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 22a6cf39c0e33b3e6633db578f0d6c616145b95bcf4ade7895b808f8ba7f… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-27/record.2026-09-27.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 3f19592f0e9e050a4533f3022e5b3e301c5e5e90ddda4ae9139f7f21f72c… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 480d6464b7506d15ef70e75e6d5f93196145dfc5854a79c944838aabc1d7… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-09-27.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968785, "block_hash": "0000000000000000000186b33… |

## `ots-upgraded/2026-10-04/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-04.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: f5f567c0f18b20dbb19500db2e6e2cf761682ceb |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: cc43901bc60674f913fa5fe0ec06b2fde0d6c48151dad63c6d90d8f8bde3… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-10-04/record.2026-10-04.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: c95bb0de1c3232e419adf3aa1f924c9abc87210532b9105a4d04dd0e1193… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: d83d35966555dc23d94af531772982fdd3999c737d0a4361f711c995cc65… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-04.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 969796, "block_hash": "00000000000000000001f8728… |

## `ots-upgraded/2026-10-11/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: record.2026-10-11.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: 598abe8e7d4f70eddd589ae2f4b0a002addf3ee4 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: dff562f6a2d3373ab8f0ffa33d25173c578ffbe35950032ee7d9e3cf9ccf… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-10-11/record.2026-10-11.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 97dc9d4a52e2f718b88eb1f4a950c42f463dda9e8c9f14f059d15d924ab3… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 1fd8dc069089b429ffec1fafcbda5c2c5ce23537a847abc65076bc0ab17f… |
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

Top-level keys: `schema`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `family`, `what_this_is`, `read_state_vocabulary`, `units`, `producer`, `inputs`, `summary_cross_checks`, `read`, `states`, `states_zero`, `state_meanings`, `not_contacted`, `cards_served`, `signatures`, `requests`, `limits`, `sent`, `never_sent`, `protocol_note`, `anomalies`, `not_evidence_of`, `published_files`, `hf_dataset`, `verify`.
Records under `anomalies`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 5/5 rows read; example: B1 |
| `kind` | string | Observed type string; non-null in 1/5 rows read; example: DISCLOSED BREACH OF OUR OWN RULE (superseded run kept) |
| `what_we_say` | string | Observed type string; non-null in 5/5 rows read; example: Run 1 of this census (2026-09-25T07:18:59Z to 2026-09-25T07:… |
| `run1_row` | string | Observed type string; non-null in 1/5 rows read; example: {"id": "2dc86485-7909-47da-91e1-7f1ef894b922", "state": "ROB… |
| `run2_row` | string | Observed type string; non-null in 1/5 rows read; example: {"id": "2dc86485-7909-47da-91e1-7f1ef894b922", "state": "UNR… |
| `space_stage_per_hub_api` | string | Observed type string; non-null in 1/5 rows read; example: {"space": "VishalMysore/a2amcpdemo", "stage": "RUNTIME_ERROR… |
| `run1_vs_run2_state_changes` | string | Observed type string; non-null in 1/5 rows read; example: {"ROBOTS_DISALLOWED -> CARD_SERVED": 1, "UNREACHABLE -> CARD… |
| `fix` | string | Observed type string; non-null in 1/5 rows read; example: a2a-card-probe.py now address-checks every candidate host an… |

## `record.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`, `signing_is_separate`.


## `record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `record.v0.1.1.json`

Top-level keys: `schema`, `record_id`, `as_of`, `built_utc`, `publisher`, `licence`, `family`, `what_this_is`, `read_state_vocabulary`, `units`, `producer`, `inputs`, `summary_cross_checks`, `read`, `states`, `states_zero`, `state_meanings`, `not_contacted`, `cards_served`, `signatures`, `requests`, `limits`, `sent`, `never_sent`, `protocol_note`, `anomalies`, `not_evidence_of`, `published_files`, `hf_dataset`, `verify`, `record_version`, `corrected_utc`, `supersedes`, `summary_cross_checks_0_1_1`, `correction`.
Records under `anomalies`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 5/5 rows read; example: B1 |
| `kind` | string | Observed type string; non-null in 1/5 rows read; example: DISCLOSED BREACH OF OUR OWN RULE (superseded run kept) |
| `what_we_say` | string | Observed type string; non-null in 5/5 rows read; example: Run 1 of this census (2026-09-25T07:18:59Z to 2026-09-25T07:… |
| `run1_row` | string | Observed type string; non-null in 1/5 rows read; example: {"id": "2dc86485-7909-47da-91e1-7f1ef894b922", "state": "ROB… |
| `run2_row` | string | Observed type string; non-null in 1/5 rows read; example: {"id": "2dc86485-7909-47da-91e1-7f1ef894b922", "state": "UNR… |
| `space_stage_per_hub_api` | string | Observed type string; non-null in 1/5 rows read; example: {"space": "VishalMysore/a2amcpdemo", "stage": "RUNTIME_ERROR… |
| `run1_vs_run2_state_changes` | string | Observed type string; non-null in 1/5 rows read; example: {"ROBOTS_DISALLOWED -> CARD_SERVED": 1, "UNREACHABLE -> CARD… |
| `fix` | string | Observed type string; non-null in 1/5 rows read; example: a2a-card-probe.py now address-checks every candidate host an… |

## `record.v0.1.1.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `record.v0.1.1.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `run/2026-09-27/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `n_planned`, `n_attempted`, `read_state`, `read_state_rule`, `states`, `cards_served`, `signatures`, `registry_is_healthy_but_no_card_served`, `requests`, `limits`, `sent`, `never_sent`, `what_a_row_is`, `what_it_never_proves`.


## `run/2026-10-04/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `n_planned`, `n_attempted`, `read_state`, `read_state_rule`, `states`, `cards_served`, `signatures`, `registry_is_healthy_but_no_card_served`, `requests`, `limits`, `sent`, `never_sent`, `what_a_row_is`, `what_it_never_proves`.


## `run/2026-10-11/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `n_planned`, `n_attempted`, `read_state`, `read_state_rule`, `states`, `cards_served`, `signatures`, `registry_is_healthy_but_no_card_served`, `requests`, `limits`, `sent`, `never_sent`, `what_a_row_is`, `what_it_never_proves`.


## `run/summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `n_planned`, `n_attempted`, `read_state`, `read_state_rule`, `states`, `cards_served`, `signatures`, `registry_is_healthy_but_no_card_served`, `requests`, `limits`, `sent`, `never_sent`, `what_a_row_is`, `what_it_never_proves`.


## `run/superseded-run1-summary.json`

Top-level keys: `schema`, `started`, `finished`, `user_agent`, `frame`, `n_planned`, `n_attempted`, `read_state`, `read_state_rule`, `states`, `cards_served`, `signatures`, `registry_is_healthy_but_no_card_served`, `requests`, `limits`, `sent`, `never_sent`, `what_a_row_is`, `what_it_never_proves`.

