# Field reference: nicktempleman/csoai-x402-activity

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `2026-09-25/x402-activity-2026-09-25.json`

Top-level keys: `schema`, `kind`, `day`, `as_of`, `started`, `partial`, `publisher`, `doctrine`, `question`, `window`, `population`, `method`, `inbound_not_eip3009`, `headline`, `by_class`, `flags`, `concentration`, `sensitivity`, `uncheckable`, `not_measured`, `rows_file`, `not_evidence_of`, `verify`, `objection_route`, `finished`.


## `2026-09-25/x402-activity-2026-09-25.ots.json`

Top-level keys: `schema`, `file`, `sha256`, `ots_file`, `ots_sha256`, `stamped_utc`, `calendars_accepted`, `calendars_failed`, `proof_parses`, `proof_binds_to_file_digest`, `attestations`, `state`, `state_meaning`.


## `2026-09-25/x402-activity-2026-09-25.payees.jsonl`

TODO(owner): fields not obtainable anonymously.


## `2026-09-25/x402-activity-2026-09-25.rows.jsonl`

TODO(owner): fields not obtainable anonymously.


## `2026-09-25/x402-activity-2026-09-25.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `context.json`

Top-level keys: `schema`, `as_of`, `what_this_is`, `never_cited`, `items`, `access_times_note`.
Records under `items`:

| field | type | description |
|---|---|---|
| `id` | string | Observed type string; non-null in 4/4 rows read; example: visa-artemis-page |
| `who` | string | Observed type string; non-null in 4/4 rows read; example: Visa (with Artemis Analytics) |
| `title` | string | Observed type string; non-null in 4/4 rows read; example: Agentic Payments: What Onchain Data Reveals |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://www.visa.com/en-us/thought-leadership/innovation/age… |
| `published_as_printed` | string | Observed type string; non-null in 4/4 rows read; example: Last updated on July 14, 2026 |
| `accessed_utc` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-26T15:20:16Z |
| `response_sha256` | string | Observed type string; non-null in 4/4 rows read; example: 7a1c5e0a4911eb916c3c59e95b96d70f6d93f15644d9bb27f7807b6b6a99… |
| `response_bytes` | integer | Observed type integer; non-null in 4/4 rows read; example: 493293 |
| `quotes` | string | Observed type string; non-null in 4/4 rows read; example: ["it has processed roughly $15.0 million in adjusted volume … |
| `derived` | string | Observed type string; non-null in 2/4 rows read; example: {"what": "share of raw x402 dollar volume not in Visa/Artemi… |
| `note` | string | Observed type string; non-null in 1/4 rows read; example: We state only that the figures did not change across these r… |
| `observed_unchanged_in` | string | Observed type string; non-null in 1/4 rows read; example: {"wayback_captures": [{"capture": "https://web.archive.org/w… |

## `context.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`, `verify`.


## `croissant.json`

Top-level keys: `@context`, `@type`, `conformsTo`, `name`, `alternateName`, `description`, `url`, `license`, `keywords`, `creator`, `publisher`, `dateModified`, `isAccessibleForFree`, `inLanguage`, `citeAs`, `distribution`, `recordSet`.
Records under `distribution`:

| field | type | description |
|---|---|---|
| `@type` | string | Observed type string; non-null in 9/9 rows read; example: cr:FileObject |
| `@id` | string | Observed type string; non-null in 9/9 rows read; example: 2026-09-25/x402-activity-2026-09-25.json |
| `name` | string | Observed type string; non-null in 9/9 rows read; example: 2026-09-25/x402-activity-2026-09-25.json |
| `contentUrl` | url | Observed type url; non-null in 9/9 rows read; example: https://huggingface.co/datasets/csoai/x402-activity/resolve/… |
| `encodingFormat` | string | Observed type string; non-null in 9/9 rows read; example: application/json |
| `contentSize` | string | Observed type string; non-null in 9/9 rows read; example: 10251 B |
| `sha256` | string | Observed type string; non-null in 9/9 rows read; example: b8faf56f5634fe7d1ee29985ac0a9346fc5c2ebb54bb951508ff8b745e57… |
| `description` | string | Observed type string; non-null in 9/9 rows read; example: verbatim copy of https://councilof.ai/measurements/x402-acti… |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 12/12 rows read; example: 10251 |
| `kind` | string | Observed type string; non-null in 12/12 rows read; example: verbatim |
| `path` | string | Observed type string; non-null in 12/12 rows read; example: 2026-09-25/x402-activity-2026-09-25.json |
| `sha256` | string | Observed type string; non-null in 12/12 rows read; example: b8faf56f5634fe7d1ee29985ac0a9346fc5c2ebb54bb951508ff8b745e57… |

## `ots-upgraded/2026-09-29/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 2/2 rows read; example: 2026-09-25/x402-activity-2026-09-25.json.ots |
| `original_oid` | string | Observed type string; non-null in 2/2 rows read; example: cd5cfd3dc0c99f0caebd313db1fd4134bbea8a05 |
| `original_sha256` | string | Observed type string; non-null in 2/2 rows read; example: 17510b291d043a7035026ac29f2f299b8ead04891efaec400536edca99f7… |
| `upgraded` | string | Observed type string; non-null in 2/2 rows read; example: ots-upgraded/2026-09-29/2026-09-25/x402-activity-2026-09-25.… |
| `upgraded_sha256` | string | Observed type string; non-null in 2/2 rows read; example: e1e969c2696b50e115d687c92ab3d622838a9722d732ad5934fea5bbaec6… |
| `file_digest` | string | Observed type string; non-null in 2/2 rows read; example: b8faf56f5634fe7d1ee29985ac0a9346fc5c2ebb54bb951508ff8b745e57… |
| `target_file` | string | Observed type string; non-null in 2/2 rows read; example: 2026-09-25/x402-activity-2026-09-25.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 2/2 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 2/2 rows read; example: [{"height": 968706, "block_hash": "000000000000000000013eabe… |
