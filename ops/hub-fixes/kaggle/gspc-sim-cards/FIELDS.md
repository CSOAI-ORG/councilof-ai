# Field reference: nicktempleman/gspc-sim-cards

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 4/4 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 3/4 rows read; example: 1497 |
| `sha` | string | Observed type string; non-null in 3/4 rows read; example: c6d65089f789fef4fa75d0d30cac08cf9506cfc2 |
| `ext` | string | Observed type string; non-null in 4/4 rows read; example: md |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://huggingface.co/datasets/csoai/gspc-sim-cards/resolve… |
| `repo` | string | Observed type string; non-null in 4/4 rows read; example: csoai/gspc-sim-cards |
| `as_of` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 4/4 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-sim-cards/tre… |

## `sim_cards.jsonl`

| field | type | description |
|---|---|---|
| `card` | string | Observed type string; non-null in 2228/2228 rows read; example: h3k-2026-08-17T1111.json |
| `ts` | datetime | Observed type datetime; non-null in 2228/2228 rows read; example: 2026-08-17T11:11:41.371Z |
| `axis` | string | Observed type string; non-null in 2228/2228 rows read; example: gov |
| `q` | string | Observed type string; non-null in 2228/2228 rows read; example: Who is accountable for an AI system deployment in your juris… |
| `a` | string | Observed type string; non-null in 2228/2228 rows read; example: [gov] EU AI Act Art. 26 deployer duties. Policy applied by s… |
| `ah` | string | Observed type string; non-null in 2228/2228 rows read; example: c0bea65ed259dc90 |
| `signed` | boolean | Observed type boolean; non-null in 2228/2228 rows read; example: true |
