# SOV3³ Governance-NN Training — LIVE DATA results (2026-07-07)

Trained on the **real** episode files in `sovereign-temple-public/training_data/` (not placeholders). Features here: TF-IDF (300) on episode `content`; target: `care_weight`. The Kaggle notebook uses BGE-M3 GPU embeddings instead of TF-IDF for stronger features. Baseline = predict-the-mean.

**Total episodes across 8 NNs: 1,076** — exported to `sov3_governance_episodes.csv`.

| Governance NN | n | CV MAE (TF-IDF) | ±std | notes |
|---|---|---|---|---|
| care | 346 | 0.162 | 0.085 | cv=5 |
| creativity | 215 | 0.154 | 0.094 | cv=5 |
| emotion | 50 | 0.233 | 0.014 | cv=2 |
| intent | 50 | 0.224 | 0.007 | cv=2 |
| partnership | 50 | 0.231 | 0.055 | cv=2 |
| relationship | 253 | 0.142 | 0.080 | cv=5 |
| sentiment | 50 | 0.233 | 0.034 | cv=2 |
| threat | 62 | 0.483 | 0.201 | cv=2 |

## Honest read (matches the honesty register)
- **Strong:** relationship (0.142), creativity (0.154), care (0.162) — largest n (253/215/346), lowest error.
- **Weakest:** threat (0.483 ± 0.201) — smallest useful n (62), high variance. The register's 'threat NN weak (0.45)' flag is reproduced on live data.
- **Small-sample (n=50):** emotion / intent / partnership / sentiment sit ~0.23 MAE — usable but data-starved; these are the ones to grow.
- Fixing the weak NNs = **more episodes**, not a better model. The Kaggle cell trains identically once you log more `content`+`care_weight` rows.

## To reproduce / improve
1. Upload `sov3_governance_episodes.csv` as a Kaggle Dataset.
2. Run `SOV3_kaggle_small_models.ipynb` cell 5 (now loads this CSV + BGE-M3 GPU embeddings).
3. Grow the starved NNs by logging more real episodes from SOV3 into the same schema.