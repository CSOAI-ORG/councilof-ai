# Field reference: nicktempleman/csoai-gspc-gap-index

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `current.json`

Top-level keys: `schema`, `kind`, `source`, `as_of`, `week`, `board_schema`, `public_count`, `lid`, `measured_axes`, `unmeasured_slots`, `unmeasured_axes`, `rows`, `doctrine`, `not_a_certification`, `supersedes`, `integrity`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `claim` | string | Observed type string; non-null in 2/2 rows read; example: living_stamp |
| `kind` | string | Observed type string; non-null in 2/2 rows read; example: stamp |
| `status` | string | Observed type string; non-null in 1/2 rows read; example: UNVERIFIABLE |
| `note` | string | Observed type string; non-null in 2/2 rows read; example: old stamp stays UNVERIFIABLE; site_attestation is the integr… |
| `index_n_cards` | string | Observed type string; non-null in 0/2 rows read |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 1363 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: 4bc6fbd50653b35dbf9a69308666bada1a5be300 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-gap-index/resolve… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-gap-index |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-gap-index/tre… |

## `weeks/2026-W35.json`

Top-level keys: `schema`, `kind`, `source`, `as_of`, `week`, `board_schema`, `public_count`, `unmeasured_slots`, `unmeasured_axes`, `rows`, `doctrine`, `not_a_certification`, `integrity`, `superseded`, `superseded_by`, `superseded_note`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `claim` | string | Observed type string; non-null in 10/10 rows read; example: axis:provenance-controls |
| `kind` | string | Observed type string; non-null in 10/10 rows read; example: deterministic-facts |
| `status` | string | Observed type string; non-null in 9/10 rows read; example: MEASURED |
| `n` | integer | Observed type integer; non-null in 1/10 rows read; example: 6 |
| `n_unit` | string | Observed type string; non-null in 1/10 rows read; example: issuer accounts (not bank items) |
| `note` | string | Observed type string; non-null in 10/10 rows read; example: on-chain control facts for locatable issuer accounts; not a … |
| `index_n_cards` | integer | Observed type integer; non-null in 1/10 rows read; example: 313 |
| `index_rows` | integer | Observed type integer; non-null in 1/10 rows read; example: 313 |
| `store_count` | string | Observed type string; non-null in 0/10 rows read |

## `weeks/2026-W36.json`

Top-level keys: `schema`, `kind`, `source`, `as_of`, `week`, `board_schema`, `public_count`, `lid`, `measured_axes`, `unmeasured_slots`, `unmeasured_axes`, `rows`, `doctrine`, `not_a_certification`, `supersedes`, `integrity`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `claim` | string | Observed type string; non-null in 2/2 rows read; example: living_stamp |
| `kind` | string | Observed type string; non-null in 2/2 rows read; example: stamp |
| `status` | string | Observed type string; non-null in 1/2 rows read; example: UNVERIFIABLE |
| `note` | string | Observed type string; non-null in 2/2 rows read; example: old stamp stays UNVERIFIABLE; site_attestation is the integr… |
| `index_n_cards` | string | Observed type string; non-null in 0/2 rows read |
