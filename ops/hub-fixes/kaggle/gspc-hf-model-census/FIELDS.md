# Field reference: nicktempleman/gspc-hf-model-census

Prepared 2026-11-20. Not uploaded by `kaggle datasets metadata --update`. Kaggle accepts column descriptions only for tabular files (CSV/Parquet), so JSON/JSONL fields are documented here.


## `manifest.jsonl`

| field | type | description |
|---|---|---|
| `file` | string | Observed type string; non-null in 4/4 rows read; example: models.jsonl |
| `bytes` | integer | Observed type integer; non-null in 4/4 rows read; example: 14787327 |
| `sha256` | string | Observed type string; non-null in 1/4 rows read; example: d52fd37f6cd7f19791ba2db5540a6cf25d7be508bed4944b5dd7d59e5d6e… |
| `blob_id` | string | Observed type string; non-null in 4/4 rows read; example: 4de07e073a9815a3b3360192fdd2b85ba2a3ecc3 |
| `url` | url | Observed type url; non-null in 4/4 rows read; example: https://huggingface.co/datasets/csoai/gspc-hf-model-census/r… |
| `as_of` | datetime | build time, UTC (Observed type datetime; non-null in 4/4 rows read; example: 2026-09-05T12:52:39Z) |

## `models.jsonl`

| field | type | description |
|---|---|---|
| `as_of` | datetime | build time, UTC (Observed type datetime; non-null in 5000/5000 rows read; example: 2026-09-05T05:34:58Z) |
| `axes` | string | the 22 saved axis slugs read from the board on 5 September; not the current board scope (Observed type string; non-null in 5000/5000 rows read; example: ["governance", "safety", "provenance", "continuity", "confor…) |
| `board` | url | https://councilof.ai/api/gspc — the canonical live view (Observed type url; non-null in 5000/5000 rows read; example: https://councilof.ai/api/gspc) |
| `hub` | string | Observed type string; non-null in 5000/5000 rows read; example: huggingface |
| `issuer` | string | Observed type string; non-null in 5000/5000 rows read; example: did:web:csoai.org#card-attestation-1 |
| `measured_axes` | integer | Observed type integer; non-null in 5000/5000 rows read; example: 0 |
| `model_id` | string | Hub id, e.g. `sentence-transformers/all-MiniLM-L6-v2` (Observed type string; non-null in 5000/5000 rows read; example: sentence-transformers/all-MiniLM-L6-v2) |
| `schema` | string | Observed type string; non-null in 5000/5000 rows read; example: csoai.gspc-axes/0.5 |
| `status` | string | always `UNMEASURED` in this release (Observed type string; non-null in 5000/5000 rows read; example: UNMEASURED) |
| `unmeasured_axes` | integer | Observed type integer; non-null in 5000/5000 rows read; example: 22 |
| `verify` | url | https://councilof.ai/gspc-verify (Observed type url; non-null in 5000/5000 rows read; example: https://councilof.ai/gspc-verify) |
