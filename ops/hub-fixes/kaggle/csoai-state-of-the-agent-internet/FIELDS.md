# Field reference: nicktempleman/csoai-state-of-the-agent-internet

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `2026-09/numbers.json`

Top-level keys: `as_of`, `built_at`, `doctrine`, `external_context_not_ours`, `ledgers_by_evidence_level`, `measurement_index`, `numbers`, `page`, `producer`, `publisher`, `schema`, `sources`, `title`, `what_this_is`, `what_this_is_not`.
Records under `external_context_not_ours`:

| field | type | description |
|---|---|---|
| `source` | string | Observed type string; non-null in 2/2 rows read; example: Visa and Artemis, Agentic Payments from the Ground Up (July … |
| `url` | url | Observed type url; non-null in 2/2 rows read; example: https://www.visa.com/en-us/thought-leadership/innovation/age… |

## `2026-09/numbers.signed.json`

Top-level keys: `schema`, `payload`, `signature`, `local_verification`.


## `croissant.json`

Top-level keys: `@context`, `@type`, `conformsTo`, `name`, `alternateName`, `description`, `url`, `license`, `keywords`, `creator`, `publisher`, `dateModified`, `isAccessibleForFree`, `inLanguage`, `citeAs`, `distribution`, `recordSet`.
Records under `distribution`:

| field | type | description |
|---|---|---|
| `@type` | string | Observed type string; non-null in 5/5 rows read; example: cr:FileObject |
| `@id` | string | Observed type string; non-null in 5/5 rows read; example: 2026-09/numbers.json |
| `name` | string | Observed type string; non-null in 5/5 rows read; example: 2026-09/numbers.json |
| `contentUrl` | url | Observed type url; non-null in 5/5 rows read; example: https://huggingface.co/datasets/csoai/state-of-the-agent-int… |
| `encodingFormat` | string | Observed type string; non-null in 5/5 rows read; example: application/json |
| `contentSize` | string | Observed type string; non-null in 5/5 rows read; example: 47952 B |
| `sha256` | string | Observed type string; non-null in 5/5 rows read; example: 6a9c3f05b54a4cd1a9af051aca4722ee6245ac32a7fdb46e49632b6aec11… |
| `description` | string | Observed type string; non-null in 5/5 rows read; example: verbatim copy of https://councilof.ai/state/2026-09/numbers.… |

## `data/numbers-2026-09.parquet`

| field | type | description |
|---|---|---|
| `key` | string | Observed type string; non-null in 174/174 rows read; example: a2a.0x_VERIFIED |
| `what` | string | Observed type string; non-null in 174/174 rows read; example: 0.x cards that verify |
| `value_int` | integer | Observed type integer; non-null in 172/174 rows read; example: 5 |
| `value_text` | string | Observed type string; non-null in 2/174 rows read; example: 97.2 |
| `source` | string | Observed type string; non-null in 174/174 rows read; example: a2a_v0_1_1_rows |
| `recompute` | string | Observed type string; non-null in 174/174 rows read; example: canonicalisation_rule x sig_state |
| `source_path` | string | Observed type string; non-null in 174/174 rows read; example: cp-fix-20260926/a2a-corr/out/data/cards.v0.1.1.jsonl.gz |
| `source_sha256` | string | Observed type string; non-null in 174/174 rows read; example: 93f9865008531a9cb5c44bc8c8d32a1bf1dc775c4e3ec9880128f13c6ab2… |
| `source_public_copy` | url | Observed type url; non-null in 132/174 rows read; example: https://huggingface.co/datasets/csoai/a2a-card-census/blob/m… |
| `source_board_signature` | string | Observed type string; non-null in 90/174 rows read; example: VERIFIES |

## `data/sources-2026-09.parquet`

| field | type | description |
|---|---|---|
| `source` | string | Observed type string; non-null in 28/28 rows read; example: a2a_v0_1 |
| `what` | string | Observed type string; non-null in 28/28 rows read; example: A2A signed agent-card census, record v0.1 (superseded, kept) |
| `path` | string | Observed type string; non-null in 28/28 rows read; example: census-universes-publish-2026-09-25/a2a/record.json |
| `sha256` | string | Observed type string; non-null in 28/28 rows read; example: b290b53d05912d8b3a5913c7e73e693f40cc71be8e0432c4626643c6d662… |
| `public_copy` | url | Observed type url; non-null in 18/28 rows read; example: https://huggingface.co/datasets/csoai/a2a-card-census/blob/m… |
| `board_signature` | string | Observed type string; non-null in 18/28 rows read; example: VERIFIES |
| `signature_pins_this_sha256` | boolean | Observed type boolean; non-null in 18/28 rows read; example: true |
| `signed_at` | datetime | Observed type datetime; non-null in 18/28 rows read; example: 2026-09-25T08:22:33.567Z |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `bytes` | integer | Observed type integer; non-null in 8/8 rows read; example: 47952 |
| `kind` | string | Observed type string; non-null in 8/8 rows read; example: verbatim |
| `path` | string | Observed type string; non-null in 8/8 rows read; example: 2026-09/numbers.json |
| `sha256` | string | Observed type string; non-null in 8/8 rows read; example: 6a9c3f05b54a4cd1a9af051aca4722ee6245ac32a7fdb46e49632b6aec11… |

## `ots-upgraded/2026-09-29/OTS-UPGRADE.json`

Top-level keys: `schema`, `date`, `repo`, `what_this_is`, `how_to_verify`, `proofs`.
Records under `proofs`:

| field | type | description |
|---|---|---|
| `original` | string | Observed type string; non-null in 1/1 rows read; example: 2026-09/numbers.json.ots |
| `original_oid` | string | Observed type string; non-null in 1/1 rows read; example: d27e1d4ab57c7fc98434304afda73fc489a92991 |
| `original_sha256` | string | Observed type string; non-null in 1/1 rows read; example: 1c9362f80cdfbf6ac98f483f2b815cf2a278297363ae3829321630981880… |
| `upgraded` | string | Observed type string; non-null in 1/1 rows read; example: ots-upgraded/2026-09-29/2026-09/numbers.json.ots |
| `upgraded_sha256` | string | Observed type string; non-null in 1/1 rows read; example: cbb9950dd0eacf02618b1a1158e98a56c59d78cf1ec4cf2d024cf8aa7a58… |
| `file_digest` | string | Observed type string; non-null in 1/1 rows read; example: 6a9c3f05b54a4cd1a9af051aca4722ee6245ac32a7fdb46e49632b6aec11… |
| `target_file` | string | Observed type string; non-null in 1/1 rows read; example: 2026-09/numbers.json |
| `target_digest_matches_proof` | boolean | Observed type boolean; non-null in 1/1 rows read; example: true |
| `bitcoin` | string | Observed type string; non-null in 1/1 rows read; example: [{"height": 968707, "block_hash": "0000000000000000000024c4d… |
