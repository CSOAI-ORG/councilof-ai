# Field reference: nicktempleman/csoai-measurement-capsules

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `croissant.json`

Top-level keys: `@context`, `@type`, `conformsTo`, `name`, `alternateName`, `description`, `url`, `license`, `keywords`, `creator`, `publisher`, `dateModified`, `isAccessibleForFree`, `inLanguage`, `citeAs`, `distribution`, `recordSet`.
Records under `distribution`:

| field | type | description |
|---|---|---|
| `@type` | string | Observed type string; non-null in 53/53 rows read; example: cr:FileObject |
| `@id` | string | Observed type string; non-null in 53/53 rows read; example: latest.json |
| `name` | string | Observed type string; non-null in 53/53 rows read; example: latest.json |
| `contentUrl` | url | Observed type url; non-null in 53/53 rows read; example: https://huggingface.co/datasets/csoai/measurement-capsules/r… |
| `encodingFormat` | string | Observed type string; non-null in 53/53 rows read; example: application/json |
| `contentSize` | string | Observed type string; non-null in 53/53 rows read; example: 196 B |
| `sha256` | string | Observed type string; non-null in 53/53 rows read; example: 52e0e2855098aec4ec17d830951cdb7d974e0a612978d44c9d5081d6610e… |
| `description` | string | Observed type string; non-null in 53/53 rows read; example: verbatim copy of https://councilof.ai/measurement-capsules/l… |

## `data/batches.parquet`

| field | type | description |
|---|---|---|
| `adapter` | string | Observed type string; non-null in 8/8 rows read; example: a2a_card |
| `batch` | string | Observed type string; non-null in 8/8 rows read; example: a2a_card |
| `kind` | string | Observed type string; non-null in 8/8 rows read; example: measurement.a2a_card_signature |
| `n_capsules` | integer | Observed type integer; non-null in 8/8 rows read; example: 33 |
| `states_json` | string | Observed type string; non-null in 8/8 rows read; example: {"FAILED": 8, "UNCHECKABLE": 12, "VERIFIED": 13} |
| `merkle_root` | string | Observed type string; non-null in 8/8 rows read; example: bf12f4ad340a11a14ecbd359ba90b3aaebb36bb75bcf9e11f433148441ba… |
| `record_sha256` | string | Observed type string; non-null in 8/8 rows read; example: 180a16f838f33372e1e6345fb272d7b3427a55dacee5571c34a6947a116c… |
| `capsules_sha256` | string | Observed type string; non-null in 8/8 rows read; example: ba413e8160120205d8b9ec87fec95fa9e0f3ac2e6c858d4e6e807851882c… |
| `as_of` | datetime | Observed type datetime; non-null in 8/8 rows read; example: 2026-09-26T06:19:20Z |

## `data/capsules.parquet`

| field | type | description |
|---|---|---|
| `adapter` | string | Observed type string; non-null in 2000/2000 rows read; example: a2a_card |
| `batch` | string | Observed type string; non-null in 2000/2000 rows read; example: a2a_card |
| `batch_merkle_root` | string | Observed type string; non-null in 2000/2000 rows read; example: bf12f4ad340a11a14ecbd359ba90b3aaebb36bb75bcf9e11f433148441ba… |
| `batch_record_sha256` | string | Observed type string; non-null in 2000/2000 rows read; example: 180a16f838f33372e1e6345fb272d7b3427a55dacee5571c34a6947a116c… |
| `capsule_id` | string | Observed type string; non-null in 2000/2000 rows read; example: 00b9165af4ad2d520ca216482aaf283bd7de03f9e76bafd8dd68f6ef2a6a… |
| `kind` | string | Observed type string; non-null in 2000/2000 rows read; example: measurement.a2a_card_signature |
| `measurement_state` | string | Observed type string; non-null in 2000/2000 rows read; example: FAILED |
| `subject_id` | url | Observed type url; non-null in 2000/2000 rows read; example: https://agent.co-legal.be/.well-known/agent-card.json |
| `observed_at` | datetime | Observed type datetime; non-null in 2000/2000 rows read; example: 2026-09-25T07:25:59Z |
| `statement` | string | Observed type string; non-null in 2000/2000 rows read; example: the agent card is signed by the key it references |
| `has_correction_pointer` | boolean | Observed type boolean; non-null in 2000/2000 rows read; example: true |
| `capsule_json` | string | Observed type string; non-null in 2000/2000 rows read; example: {"authority_state":"NONE: measurement only; this capsule gra… |

## `latest.json`

Top-level keys: `schema`, `version`, `versions`, `index`, `doctrine`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 56/56 rows read; example: 20724 |
| `kind` | string | Observed type string; non-null in 56/56 rows read; example: docs |
| `path` | string | Observed type string; non-null in 56/56 rows read; example: README.md |
| `sha256` | string | Observed type string; non-null in 56/56 rows read; example: b8090e04bdac4efea20bc436e4c4653216fdd46ec0623d1633b1950019de… |

## `ots-upgraded/2026-09-29/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 10/10 rows read; example: v0.2/a2a_card/record.json.ots |
| `original_oid` | string | Observed type string; non-null in 10/10 rows read; example: 6aa2cae6d0fc03892dffc207146a25eae0d97244 |
| `original_sha256` | string | Observed type string; non-null in 10/10 rows read; example: 5243568f0fb91879c58b21e8e350a45d7090c39c32984e80800f6aee8bf5… |
| `upgraded` | string | Observed type string; non-null in 10/10 rows read; example: ots-upgraded/2026-09-29/v0.2/a2a_card/record.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 10/10 rows read; example: 2be6e7517c6b4660bcb8014cbd21caa31c0b16fc674ddbcb6d71dc7d4abc… |
| `file_digest` | string | Observed type string; non-null in 10/10 rows read; example: 180a16f838f33372e1e6345fb272d7b3427a55dacee5571c34a6947a116c… |
| `target_file` | string | Observed type string; non-null in 10/10 rows read; example: v0.2/a2a_card/record.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 10/10 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 10/10 rows read; example: [{"height": 968650, "block_hash": "00000000000000000001854f1… |

## `v0.2/a2a_card/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/a2a_card/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/a2a_card/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `listing_states`, `served_unsigned_not_capsuled`, `capsules_by_rule_state`, `observed_at_rule`, `private_until`.


## `v0.2/a2a_card/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/anchors.json`

Top-level keys: `schema`, `as_of`, `date`, `what_this_is`, `index`, `opentimestamps`, `rekor`, `xrpl`, `publication`, `copies`.
Records under `rekor`:

| field | type | description |
|---|---|---|
| `subject` | string | Observed type string; non-null in 3/3 rows read; example: daily index |
| `file` | string | Observed type string; non-null in 3/3 rows read; example: measurement-index-v0.2-2026-09-26.json |
| `subject_sha256` | string | Observed type string; non-null in 3/3 rows read; example: ee3d921750d40456eb58ed24d2a9ba141d6fc1d16510ddd338166c4f5620… |
| `signed_payload_sha256` | string | Observed type string; non-null in 3/3 rows read; example: 9f60d6365a335128425570deca35a91e6e6ce929077a6e4baa56b0a982e1… |
| `state` | string | Observed type string; non-null in 3/3 rows read; example: INCLUDED (inclusion proof verifies) |
| `logIndex` | integer | Observed type integer; non-null in 3/3 rows read; example: 2968539665 |
| `uuid` | string | Observed type string; non-null in 3/3 rows read; example: 108e9186e8c5677a95033baa53cbb4134660f8eadd6bd78e45d10c33d9f6… |
| `integratedTime` | integer | Observed type integer; non-null in 3/3 rows read; example: 1790430210 |
| `entry_url` | url | Observed type url; non-null in 3/3 rows read; example: https://rekor.sigstore.dev/api/v1/log/entries?logIndex=29685… |
| `search_url` | url | Observed type url; non-null in 3/3 rows read; example: https://search.sigstore.dev/?logIndex=2968539665 |

## `v0.2/contract_parity/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/contract_parity/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/contract_parity/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `rows`, `included_states`, `inclusion_rule`, `capsules_by_dimension_state`, `skipped_not_capsuled`, `corrections`, `observed_at_rule`, `private_until`.


## `v0.2/contract_parity/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/cross_ledger/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/cross_ledger/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/cross_ledger/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `capsules_by_asset_state`, `label_rule`, `daily_loop`, `claim_types`, `observed_at_rule`, `private_until`.


## `v0.2/cross_ledger/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/index.json`

Top-level keys: `schema`, `as_of`, `what_this_is`, `what_this_is_not`, `authority_state`, `batches`, `n_capsules_total`, `index_root`, `index_root_rule`, `merkle`, `capsule_schema`, `batch_schema`, `root_over_batch_merkle_roots`, `pending_source`, `verify`, `private_until`.
Records under `batches`:

| field | type | description |
|---|---|---|
| `dir` | string | Observed type string; non-null in 8/8 rows read; example: /evac-bulk/measurement-capsules-v0.2-2026-09-26-a2a_card |
| `adapter` | string | Observed type string; non-null in 8/8 rows read; example: a2a_card |
| `kind` | string | Observed type string; non-null in 8/8 rows read; example: measurement.a2a_card_signature |
| `n_capsules` | integer | Observed type integer; non-null in 8/8 rows read; example: 33 |
| `states` | string | Observed type string; non-null in 8/8 rows read; example: {"FAILED": 8, "UNCHECKABLE": 12, "VERIFIED": 13} |
| `merkle_root` | string | Observed type string; non-null in 8/8 rows read; example: bf12f4ad340a11a14ecbd359ba90b3aaebb36bb75bcf9e11f433148441ba… |
| `record_sha256` | string | Observed type string; non-null in 8/8 rows read; example: 180a16f838f33372e1e6345fb272d7b3427a55dacee5571c34a6947a116c… |
| `capsules_sha256` | string | Observed type string; non-null in 8/8 rows read; example: ba413e8160120205d8b9ec87fec95fa9e0f3ac2e6c858d4e6e807851882c… |
| `signature_state` | string | Observed type string; non-null in 8/8 rows read; example: VERIFIES |
| `signed_at` | datetime | Observed type datetime; non-null in 8/8 rows read; example: 2026-09-26T06:23:31.420Z |
| `ots_state` | string | Observed type string; non-null in 8/8 rows read; example: PENDING_CALENDAR_COMMITMENT |
| `ots_attestations` | string | Observed type string; non-null in 8/8 rows read; example: {"PendingAttestation": 3} |
| `source` | string | Observed type string; non-null in 8/8 rows read; example: {"record": "/evac-bulk/cp-fix-20260926/a2a-corr/out/record.v… |

## `v0.2/index.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/mill_cross_runtime-5ae00c1f4c2e/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/mill_cross_runtime-5ae00c1f4c2e/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `private_until`.


## `v0.2/mill_cross_runtime-5ae00c1f4c2e/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/mill_cross_runtime-78226433e9e4/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/mill_cross_runtime-78226433e9e4/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/mill_cross_runtime-78226433e9e4/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `private_until`.


## `v0.2/mill_cross_runtime-78226433e9e4/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/public_signals/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/public_signals/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/public_signals/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `capsules_by_state`, `capsules_by_self_or_external`, `private_until`.


## `v0.2/public_signals/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/publication/2026-09-26-erratum.json`

Top-level keys: `schema`, `as_of`, `what_this_is`, `what_this_is_not`, `date`, `index_file`, `index_sha256`, `index_root`, `erratum`, `field_superseded`, `publication`, `index_publication_record`, `from_now_on`, `n_files`, `files`, `files_sha256`, `files_sha256_rule`, `signed_fields`.
Records under `files`:

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 16/16 rows read; example: measurement-index-v0.2-2026-09-26.json |
| `role` | string | Observed type string; non-null in 16/16 rows read; example: daily index (final) |
| `schema` | string | Observed type string; non-null in 16/16 rows read; example: csoai.measurement-capsule-index/0.2 |
| `sha256` | string | Observed type string; non-null in 16/16 rows read; example: ee3d921750d40456eb58ed24d2a9ba141d6fc1d16510ddd338166c4f5620… |
| `private_until` | string | Observed type string; non-null in 16/16 rows read; example: owner approves publication |
| `public_at` | string | Observed type string; non-null in 16/16 rows read; example: [{"url": "https://huggingface.co/datasets/csoai/evidence-ind… |

## `v0.2/publication/2026-09-26-erratum.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/publication/2026-09-26.json`

Top-level keys: `schema`, `as_of`, `what_this_is`, `what_this_is_not`, `date`, `index_file`, `index_sha256`, `index_root`, `index_schema`, `index_signed_payload_sha256`, `index_field_superseded`, `publication`, `published_at`, `signed_fields`.
Records under `published_at`:

| field | type | description |
|---|---|---|
| `url` | url | Observed type url; non-null in 2/2 rows read; example: https://councilof.ai/measurement-capsules/v0.2/index.json |
| `sha256_at_check` | string | Observed type string; non-null in 2/2 rows read; example: ee3d921750d40456eb58ed24d2a9ba141d6fc1d16510ddd338166c4f5620… |
| `checked_at` | datetime | Observed type datetime; non-null in 2/2 rows read; example: 2026-09-26T14:19:27Z |
| `same_bytes` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |

## `v0.2/publication/2026-09-26.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/self_parity/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/self_parity/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/self_parity/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `source`, `capsules_by_state`, `private_until`.


## `v0.2/self_parity/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `v0.2/tool_drift/capsules.jsonl`

TODO(owner): fields not obtainable anonymously.


## `v0.2/tool_drift/leaves.json`

Top-level keys: `schema`, `adapter`, `batch`, `kind`, `merkle_root`, `rule`, `n`, `leaves`.


## `v0.2/tool_drift/record.json`

Top-level keys: `schema`, `as_of`, `capsule_schema`, `adapter`, `kind`, `n_capsules`, `states`, `merkle_root`, `merkle`, `canonicalisation`, `capsules_file`, `authority_state`, `what_this_is`, `what_this_is_not`, `granularity_available`, `granularity_note`, `source`, `capsules_by_state`, `changes_by_version_state`, `private_until`.


## `v0.2/tool_drift/record.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.

