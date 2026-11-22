# Field reference: nicktempleman/csoai-gspc-humanoid-labour-index

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: humanoid-labour-index |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: financial |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: deterministic-facts |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: Disclosure |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: named vendor publishes a dated deployment count on a stable … |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 8 |
| `n_unit` | string | Observed type string; non-null in 1/1 rows read; example: frozen vendor URLs |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `evidence_url` | string | Observed type string; non-null in 1/1 rows read; example: /interop/financial-measure-run-humanoid-labour-index.json |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fbbf24 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 43 |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED as disclosure facts on 8 frozen URLs. Fleet size / … |
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
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 2394 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: 7184872c371f3baeba89b5a114bef2f95bc489bb |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-humanoid-labour-i… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-humanoid-labour-index |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-humanoid-labo… |

## `skeleton.json`

Top-level keys: `as_of_mined`, `axis`, `companies_house`, `did`, `issuer`, `license`, `rows`, `rule`, `status`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `note` | string | Observed type string; non-null in 1/1 rows read; example: No authoritative public machine series. Vendor self-report i… |
| `registry_field` | string | Observed type string; non-null in 1/1 rows read; example: installed_fleet |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: NOT_BUILT |
