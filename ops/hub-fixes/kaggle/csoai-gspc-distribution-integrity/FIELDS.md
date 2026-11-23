# Field reference: nicktempleman/csoai-gspc-distribution-integrity

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: distribution-integrity |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: financial |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: deterministic-facts |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: DistributionFacts |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: reader classification + chain supply + holder count (PASS/FA… |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 16 |
| `n_unit` | string | Observed type string; non-null in 1/1 rows read; example: issuer accounts (not bank items) |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `evidence_url` | string | Observed type string; non-null in 1/1 rows read; example: /interop/financial-measure-run-distribution-integrity.json |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fbbf24 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 43 |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED v0.3 from GET /api/xrpl (writes_board=false) over a… |
| `_as_of` | datetime | Observed type datetime; non-null in 1/1 rows read; example: 2026-09-04T04:33:29Z |
| `_source` | url | Observed type url; non-null in 1/1 rows read; example: https://councilof.ai/api/gspc |
| `_authority` | string | Observed type string; non-null in 1/1 rows read; example: the live GET is the authority; this file is a snapshot and m… |
| `_public_count` | string | Observed type string; non-null in 1/1 rows read; example: 22 axis · 22 measured |

## `coverage-card.json`

Top-level keys: `as_of`, `did`, `payload`, `schema`, `sha256`, `sig_ed25519`, `source_urls`, `subject`, `surface`, `tags`, `unmeasured`.


## `input-schema.json`

Top-level keys: `$schema`, `title`, `type`, `required`, `properties`.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 6/6 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 2265 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: c2caace059874706e6108c3be240234e04e9e071 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-distribution-inte… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-distribution-integrity |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-distribution-… |

## `skeleton.json`

Top-level keys: `as_of_mined`, `axis`, `columns`, `companies_house`, `did`, `issuer`, `license`, `public_page_cite`, `rows`, `rule`, `status`, `task`, `unmeasured`.

