# Field reference: nicktempleman/csoai-gspc-drift

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `drift_rail.json`

Top-level keys: `schema`, `generated`, `register`, `method`, `axes`, `excluded`, `honest_gate`.
Records under `axes`:

| field | type | description |
|---|---|---|
| `axis` | string | Observed type string; non-null in 25/25 rows read; example: accountability |
| `boards` | integer | Observed type integer; non-null in 25/25 rows read; example: 3 |
| `window` | string | Observed type string; non-null in 25/25 rows read; example: {"from": "2026-08-22T05:39:32Z", "to": "2026-08-23T05:38:03Z… |
| `deltas` | string | Observed type string; non-null in 25/25 rows read; example: [{"from_ts": "2026-08-22T05:39:32Z", "to_ts": "2026-08-22T08… |
| `max_drift` | numeric | Observed type numeric; non-null in 25/25 rows read; example: 0.0 |
| `interpretation` | string | Observed type string; non-null in 25/25 rows read; example: stable (<0.05) |

## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 4/4 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 3/4 rows read; example: 1493 |
| `sha` | string | Observed type string; non-null in 3/4 rows read; example: daf29ca8af6b9fbda50689c64c706eda28a54a76 |
| `ext` | string | Observed type string; non-null in 4/4 rows read; example: md |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://huggingface.co/datasets/csoai/gspc-drift/resolve/mai… |
| `repo` | string | Observed type string; non-null in 4/4 rows read; example: csoai/gspc-drift |
| `as_of` | datetime | Observed type datetime; non-null in 4/4 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 4/4 rows read; example: https://huggingface.co/api/datasets/csoai/gspc-drift/tree/ma… |
