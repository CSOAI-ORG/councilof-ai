# Field reference: nicktempleman/csoai-arena-elo-by-axis

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `elo_reference.json`

Top-level keys: `axes`, `content_id`, `generated`, `leaderboard`, `method`, `models`, `per_axis`, `register`, `schema`, `signature`.
Records under `leaderboard`:

| field | type | description |
|---|---|---|
| `ci` | string | Observed type string; non-null in 12/12 rows read; example: [0.691, 0.753] |
| `elo` | numeric | Observed type numeric; non-null in 12/12 rows read; example: 1624.7 |
| `games` | integer | Observed type integer; non-null in 12/12 rows read; example: 797 |
| `model` | string | Observed type string; non-null in 12/12 rows read; example: mistral:7b |
| `winrate` | numeric | Observed type numeric; non-null in 12/12 rows read; example: 0.723 |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 1500 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: d5bbcea822c9973f8dd3a225fcc13f8569bdd97e |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/arena-elo-by-axis/reso… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/arena-elo-by-axis |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/arena-elo-by-axis/… |
