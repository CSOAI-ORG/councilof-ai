# SOV3³ NN Data Augmentation — Live Estate Mining (2026-07-07)

Goal: grow the data-starved governance NNs (care_validation n=19, partnership n=19, etc.)
by mining **real** episode/care data from the wider estate. No labels were invented —
every target below is a value the estate's own systems computed.

## Sources checked
| Source | Rows | Usable for NN training? |
|---|---|---|
| `sovereign-temple-public/training_data/*_episodes.json` | 1,076 | ✅ already used (text + care_weight) |
| `sovereign-temple/training_data/*` | byte-identical (SHA-256 verified, all 8 files) | ⚠️ duplicate — no new episodes |
| `sovereign-temple/data/sigil_ledger.jsonl` | 1,044 | handoff log (ts/line/gloss/signature) — no care target; audit trail, not training data |
| **`sovereign-town/**/episodes.jsonl`** | **5,040** | ✅ **NEW** — structured care dataset with real targets |

## New dataset: town care episodes (5,040 rows) → `sov3_town_care_dataset.csv`
Each row is a governed/ungoverned town-sim step with an **8-dim needs vector** + archetype
+ care_style + arm + scarcity, and targets the town's Care-Floor gate actually produced:
`care_score` (0.05–0.9), `care_floor_breach` (14.3% rate), `gate_verdict` (allow 4,983 / deny 57).

## Trained results (honest, cross-validated)
- **care_score regression: MAE 0.137** vs predict-mean baseline 0.172 → **real improvement**.
  This is a legitimate, large replacement for the n=19 care_validation NN.
- **care_floor_breach classification: 0.820 acc — BELOW the 0.857 base rate.** Negative
  result: breaches depend on the *action executed*, not the state vector alone. **Do not
  ship as a classifier** — reported so it isn't mistaken for a working model.

## Net effect on the weak-NN problem
- **care family: FIXED for care-scoring** — n=19 → 5,040 real-target rows, model beats baseline.
- **partnership / threat / dependency: still starved** — the town sim has no direct target
  for these; they need real logged partnership/threat episodes, which don't yet exist on disk
  at scale. Honest gap, not papered over.

## Files
- `sov3_town_care_dataset.csv` — 5,040 town care episodes (features + real targets)
- `sov3_governance_episodes.csv` — the earlier 1,076 text episodes (8 NNs)
Both upload to Kaggle; the notebook trains on either.
