# Field reference: nicktempleman/csoai-gspc-provenance-controls

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: provenance-controls |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: financial |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: deterministic-facts |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: ChainFacts |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: on-chain issuer control facts (allowlisting / freeze capabil… |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 6 |
| `n_unit` | string | Observed type string; non-null in 1/1 rows read; example: issuer accounts (not bank items) |
| `n_note` | string | Observed type string; non-null in 1/1 rows read; example: 6 tokenised instruments read directly from their mainnet iss… |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `evidence_url` | string | Observed type string; non-null in 1/1 rows read; example: /interop/financial-measure-run-v2.json |
| `coverage` | string | Observed type string; non-null in 1/1 rows read; example: 6 of the 16 instruments named in the registry |
| `coverage_note` | string | Observed type string; non-null in 1/1 rows read; example: The registry NAMES 16 instruments and this axis COVERS 6. Th… |
| `carrier` | string | Observed type string; non-null in 1/1 rows read; example: attestation carrier is DEVNET; the facts are read from MAINN… |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fbbf24 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 43 |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED for on-chain control facts only, and only those — o… |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 2262 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: 643cd2b61cddd9e8b93f1eb7b4ca33ad16b4941c |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/gspc-provenance-contro… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/gspc-provenance-controls |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-provenance-co… |

## `pointers.jsonl`

| field | type | description |
|---|---|---|
| `name` | string | Observed type string; non-null in 7/7 rows read; example: GSPC live board (authority) |
| `url` | url | Observed type url; non-null in 7/7 rows read; example: https://councilof.ai/api/gspc |
| `kind` | string | Observed type string; non-null in 7/7 rows read; example: api |
| `repo` | string | Observed type string; non-null in 7/7 rows read; example: csoai/gspc-provenance-controls |
| `as_of` | datetime | Observed type datetime; non-null in 7/7 rows read; example: 2026-09-04T04:33:29Z |
