# SOV3³ Dependency NN — Build + Honest Validation (2026-07-08)

## The gap this closes
Dependency was the ONE governance NN entirely absent: no data, no model, no episode file.
(The `dependency_detection_nn` module existed but had ZERO training rows — no data, no real training path. The n=50/~0.22 figures in the honesty register belong to the emotion/intent/partnership/sentiment group, NOT dependency.)

## Data mining (real signals only, no synthetic labels)
- **Town episodes (5,040):** `mutual_aid_from` (relied on another agent) + autonomy-break
  (`intended != executed`) = **57 real dependency-positive events** (1.1% rate).
- Relationship + care episodes: keyword over-reliance hits (used only as weak signal, discarded
  from the final model — see leakage note).

## The leakage catch (important)
First pass hit **1.000 accuracy** — I rejected it. The text features literally contained
"intended X executed Y" where X!=Y *is the label definition*; the classifier read the answer off
the input. Same trap as the threat NN's fake 61-sample 1.0. **Discarded.**

## Real model (leakage-free)
Features = the agent's **needs-state vector only** (hunger/energy/social/fun/wealth/comfort/
hygiene/bladder/wallet) — NEVER the intended/executed tokens. Question: does internal state
predict a coming dependency event?
- n = 5040, positives = 57 (1.1%)
- **LogReg ROC-AUC = 0.865**, MLP ROC-AUC = 0.989
- Accuracy is meaningless here (base rate 98.9% by predicting "never depend");
  ROC-AUC is the honest metric on 1.1% positives.
- **Verdict: REAL SIGNAL** — an agent's state (low energy/wallet, high need pressure) genuinely
  predicts when it will depend on aid or break autonomy. Saved `dependency_classifier.joblib`.

## Artifacts
- `dependency_classifier.joblib` — LogReg (balanced), needs-vector features
- `dependency_episodes.json` — 57 real positive events seeded (logger now has a target file)
- `dependency_backfill.csv` — the labeled dataset
- `_dependency_retrain.json` — metrics

## Honest bottom line
Dependency went from **absent -> real (AUC 0.865)**. It is a small-n signal (57 positives) and a
*state->behavior* predictor, not a text classifier — different shape from threat/care. It should be
treated as an early-warning governance signal, not a hard gate, until more dependency events
accumulate via the logger.
