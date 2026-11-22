# Field reference: nicktempleman/csoai-arena-rounds

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 3/3 rows read; example: README.md |
| `bytes` | integer | Observed type integer; non-null in 2/3 rows read; example: 5457 |
| `sha` | string | Observed type string; non-null in 2/3 rows read; example: 833bb20b5ca64c74426eda90901ceea0897bd110 |
| `ext` | string | Observed type string; non-null in 3/3 rows read; example: md |
| `url` | url | Observed type url; non-null in 3/3 rows read; example: https://huggingface.co/datasets/csoai/arena-rounds/resolve/m… |
| `repo` | string | Observed type string; non-null in 3/3 rows read; example: csoai/arena-rounds |
| `as_of` | datetime | Observed type datetime; non-null in 3/3 rows read; example: 2026-09-04T04:33:29Z |
| `source` | string | Observed type string; non-null in 3/3 rows read; example: https://huggingface.co/api/datasets/csoai/arena-rounds/tree/… |

## `rounds.jsonl`

| field | type | description |
|---|---|---|
| `round` | integer | `integer` — Monotonic round number. (Observed type integer; non-null in 3052/3052 rows read; example: 1) |
| `ts` | datetime | `string` — UTC timestamp (`ISO 8601`) of the round. (Observed type datetime; non-null in 3052/3052 rows read; example: 2026-08-15T04:56:46Z) |
| `axis` | string | `string` — GSPC axis under measurement (e.g. `provenance`, `gov`, `safety`, `continuity`). (Observed type string; non-null in 3052/3052 rows read; example: provenance) |
| `qwen2.5:1.5b` | string | Observed type string; non-null in 887/3052 rows read; example: {"score": 1, "elo": 1184.0} |
| `qwen3:4b` | string | Observed type string; non-null in 847/3052 rows read; example: {"score": 13, "elo": 1216.0} |
| `winner` | string | `string` — The `<model:id>` that won the round per the deterministic referee. (Observed type string; non-null in 3052/3052 rows read; example: qwen3:4b) |
| `qwen2.5:0.5b-instruct` | string | Observed type string; non-null in 905/3052 rows read; example: {"score": 10, "elo": 1182.6} |
| `qwen2.5:7b` | string | Observed type string; non-null in 899/3052 rows read; example: {"score": 14, "elo": 1215.1} |
| `mistral:7b` | string | Observed type string; non-null in 797/3052 rows read; example: {"score": 12, "elo": 1211.8} |
| `council-safe:latest` | string | Observed type string; non-null in 691/3052 rows read; example: {"score": 1, "elo": 1216.0} |
| `council-oowm:latest` | string | Observed type string; non-null in 654/3052 rows read; example: {"score": 1, "elo": 1184.0} |
| `muse-glimmer:latest` | string | Observed type string; non-null in 197/3052 rows read; example: {"score": 0, "elo": 1191.2} |
| `qwen2.5-0.5b-cards:latest` | string | Observed type string; non-null in 160/3052 rows read; example: {"score": 11, "elo": 1213.0} |
| `deepseek-r1:7b` | string | Observed type string; non-null in 24/3052 rows read; example: {"score": 0, "elo": 1215.4} |
| `llama3:8b` | string | Observed type string; non-null in 28/3052 rows read; example: {"score": 1, "elo": 1188.0} |
| `qwen3:8b` | string | Observed type string; non-null in 15/3052 rows read; example: {"score": 0, "elo": 1184.1} |
