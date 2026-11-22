# Field reference: nicktempleman/csoai-measured-vs-reported

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 5/5 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 4/5 rows read; example: 1503 |
| `sha` | string | Observed type string; non-null in 4/5 rows read; example: 7c7a5a49c52bc9b74ff16a9dc1ff0e3953a54bb7 |
| `ext` | string | Observed type string; non-null in 5/5 rows read; example: md |
| `url` | url | Observed type url; non-null in 5/5 rows read; example: https://huggingface.co/datasets/csoai/measured-vs-reported/r… |
| `repo` | string | Observed type string; non-null in 5/5 rows read; example: csoai/measured-vs-reported |
| `as_of` | datetime | Observed type datetime; non-null in 5/5 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 5/5 rows read; example: https://huggingface.co/api/datasets/csoai/measured-vs-report… |

## `measured_elo.json`

Top-level keys: `axes`, `content_id`, `generated`, `leaderboard`, `method`, `models`, `per_axis`, `register`, `schema`, `signature`.
Records under `leaderboard`:

| field | type | description |
|---|---|---|
| `ci` | string | Observed type string; non-null in 12/12 rows read; example: [0.691, 0.753] |
| `elo` | numeric | Observed type numeric; non-null in 12/12 rows read; example: 1624.7 |
| `games` | integer | Observed type integer; non-null in 12/12 rows read; example: 797 |
| `model` | string | Observed type string; non-null in 12/12 rows read; example: mistral:7b |
| `winrate` | numeric | Observed type numeric; non-null in 12/12 rows read; example: 0.723 |

## `overlap.json`

Top-level keys: `state`, `cells`, `gate`.


## `reported_rails.json`

Top-level keys: `$schema`, `dataset`, `date_assessed`, `positioning`, `overlap_stance`, `rails`, `cross_rail_guard`.
Records under `rails`:

| field | type | description |
|---|---|---|
| `source` | string | Observed type string; non-null in 2/2 rows read; example: LMArena |
| `rail` | string | Observed type string; non-null in 2/2 rows read; example: REPORTED — Human preference |
| `what` | string | Observed type string; non-null in 2/2 rows read; example: Human-preference Elo, Bradley-Terry model with bootstrap 95%… |
| `how` | string | Observed type string; non-null in 2/2 rows read; example: Crowd-sourced pairwise human comparisons, aggregated via Bra… |
| `what_we_adopt` | string | Observed type string; non-null in 2/2 rows read; example: ["CI discipline — never publish a point estimate without an … |
| `what_we_refuse` | string | Observed type string; non-null in 2/2 rows read; example: ["Vote-as-truth certification — human vote is a preference s… |
| `honest_unknowns` | string | Observed type string; non-null in 2/2 rows read; example: ["Exact bootstrap parameters are not fully public", "Vote-ma… |
| `source_urls` | string | Observed type string; non-null in 2/2 rows read; example: ["https://lmarena.ai/", "https://the-decoder.com/"] |
