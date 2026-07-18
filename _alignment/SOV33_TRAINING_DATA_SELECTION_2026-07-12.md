# SOV33 — training-data selection (why NOT "all Kaggle datasets") (2026-07-12)
_Honest engineering: more data helps ONLY when relevant+clean. Training SOV on everything degrades it. Here's the
selective spec that actually improves the sovereign reasoning student._

## WHY "train on all datasets" BACKFIRES
- Kaggle has 100,000s of datasets; most are off-domain for a governed REASONING system (Titanic, house-prices,
  random images/CSVs). Training on them causes:
  1. CATASTROPHIC FORGETTING — off-domain flood degrades existing reasoning (our frozen-base+accretion design
     exists specifically to avoid this; bulk-training defeats it).
  2. NOISE > SIGNAL — unlabelled/mislabelled/duplicate data teaches the wrong thing.
  3. LICENSE RISK — many datasets are non-commercial or unclear; bulk ingestion imports legal landmines.
- More parameters/data is NOT more capability without relevance. This is the same category error as additive tokens.

## WHAT ACTUALLY IMPROVES SOV (selective, clean, licensed)
| Use | Data type | Source examples | Why |
|---|---|---|---|
| Reasoning distillation | graded chains-of-thought | s1K-1.1, LIMO, OpenR1-Math, OpenThoughts (published, permissive) | catapults reasoning WITHOUT generating traces from scratch |
| Governance eval (held-out) | deny/breach + care-labelled | our OWN estate labels (1,823 real) | earns the governance score honestly, not answer-keyed |
| Math/science capability | benchmark train splits | GSM8K/MATH/science-exam train sets (competition-licensed) | matched to what we compete on |
| Care/companion signal | our OWN episodes | 17,088 sovereign memory episodes | the differentiator; NOT on Kaggle |

## THE RULE
Curate, don't dump. Pull the FEW reasoning-trace + benchmark-train datasets that match SOV's job (governed
reasoning), all permissive-licensed, deduped and quality-filtered. Train the sovereign student on THOSE via
distillation. Everything else on Kaggle is a competition to ENTER (measure capability), not data to train on.
