# Field reference: nicktempleman/gspc-one

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `gspc-one.json`

Top-level keys: `schema`, `source`, `rules`, `mcp_endpoint_key_scheme`, `planned_classes`, `rows`, `axes_manifest`, `no_aggregate`.
Records under `rows`:

| field | type | description |
|---|---|---|
| `subject_class` | string | Observed type string; non-null in 929/929 rows read; example: board-axis |
| `subject` | string | Observed type string; non-null in 929/929 rows read; example: GSPC board fleet |
| `axis` | string | Observed type string; non-null in 929/929 rows read; example: governance |
| `result` | string | The source's result or state, retained as text. (Observed type string; non-null in 929/929 rows read; example: status=MEASURED n=237 leader=mistral:7b (base model) acc=0.5…) |
| `lane` | string | Signed or unsigned status as recorded in the export. Follow the evidence to verify a signed record. (Observed type string; non-null in 929/929 rows read; example: signed) |
| `group` | string | Comparison boundary. Rows must not be ranked or pooled across groups. (Observed type string; non-null in 929/929 rows read; example: G2-board) |
| `evidence_url` | url | Observed type url; non-null in 929/929 rows read; example: https://councilof.ai/api/gspc |
| `as_of` | string | Observed type string; non-null in 929/929 rows read; example: "2026-08-12" |
| `n` | integer | Observed type integer; non-null in 23/929 rows read; example: 237 |
| `distinct_items` | integer | Observed type integer; non-null in 14/929 rows read; example: 237 |
| `wilson95` | string | Observed type string; non-null in 8/929 rows read; example: [0.523, 0.647] |
| `kind` | string | Observed type string; non-null in 23/929 rows read; example: model-comparison |
