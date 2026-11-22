# Field reference: nicktempleman/csoai-gspc-ai-economy-index

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `axis-live.jsonl`

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 1/1 rows read; example: ai-adoption-components |
| `family` | string | Observed type string; non-null in 1/1 rows read; example: financial |
| `kind` | string | Observed type string; non-null in 1/1 rows read; example: deterministic-facts |
| `bench` | string | Observed type string; non-null in 1/1 rows read; example: Eurostat |
| `task` | string | Observed type string; non-null in 1/1 rows read; example: cited EU AI-adoption series (not an index) |
| `n` | integer | Observed type integer; non-null in 1/1 rows read; example: 2 |
| `n_unit` | string | Observed type string; non-null in 1/1 rows read; example: public series |
| `status` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED |
| `evidence_url` | string | Observed type string; non-null in 1/1 rows read; example: /interop/financial-measure-run-ai-adoption-components.json |
| `colour` | string | Observed type string; non-null in 1/1 rows read; example: #fbbf24 |
| `hue` | integer | Observed type integer; non-null in 1/1 rows read; example: 43 |
| `note` | string | Observed type string; non-null in 1/1 rows read; example: MEASURED as two Eurostat series (13.48% / 41.17% 2024). Not … |
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
| `bytes` | integer | Observed type integer; non-null in 5/6 rows read; example: 2635 |
| `sha` | string | Observed type string; non-null in 5/6 rows read; example: 58b2005fc1442e7a9cc75c732f4ed1af1bbccbc3 |
| `ext` | string | Observed type string; non-null in 6/6 rows read; example: md |
| `url` | url | Observed type url; non-null in 6/6 rows read; example: https://huggingface.co/datasets/csoai/gspc-ai-economy-index/… |
| `repo` | string | Observed type string; non-null in 6/6 rows read; example: csoai/gspc-ai-economy-index |
| `as_of` | datetime | Observed type datetime; non-null in 6/6 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 6/6 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-ai-economy-in… |

## `skeleton.json`

Top-level keys: `as_of_mined`, `axis`, `companies_house`, `correction`, `did`, `issuer`, `license`, `rows`, `rule`, `status`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `as_of` | datetime | Observed type datetime; non-null in 1/4 rows read; example: 2026-08-25 |
| `component` | string | Observed type string; non-null in 4/4 rows read; example: eu_enterprise_ai_adoption |
| `role` | string | Observed type string; non-null in 4/4 rows read; example: reference_input |
| `series_id` | string | Observed type string; non-null in 1/4 rows read; example: isoc_eb_ai |
| `source_url` | string | Observed type string; non-null in 1/4 rows read; example: Eurostat isoc_eb_ai fetch 2026-08-25 |
| `unit` | string | Observed type string; non-null in 1/4 rows read; example: percent |
| `value` | numeric | Observed type numeric; non-null in 1/4 rows read; example: 13.48 |
| `vintage` | integer | Observed type integer; non-null in 1/4 rows read; example: 2024 |
| `unmeasured` | string | Observed type string; non-null in 3/4 rows read; example: ["no_series"] |
