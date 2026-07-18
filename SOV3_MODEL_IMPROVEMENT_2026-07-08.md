# SOV3 Model Improvement — Session Log 2026-07-08

## What was attempted: grow the starved partnership NN from town data

Current starved NNs: partnership (n=50), emotion/intent/sentiment (n=50 each), threat (n=62),
dependency (n=57, newly built this cycle at ROC-AUC 0.865).

**Hypothesis:** town episodes (5,040 rows) contain relational signal usable to grow partnership.

## Result: HONEST NEGATIVE — no genuine partnership signal in town data

- 616 socialize events (12.2% of rows), all intended==executed, mean care_score 0.900.
- Predicting socialize-choice from full need-state: ROC-AUC 0.94 — **but this is a tautology.**
- **Dropping the `social` need feature → ROC-AUC 0.581** (chance ~0.5). The 0.94 was almost
  entirely "high social need → socialize." Other state carries no real relational signal.
- mutual_aid_from events: only 7. Cooperative intents (help/share/trade/gift): 0.

**Conclusion:** the town simulation does NOT encode genuine partnership/cooperation behavior —
its agents act individually (rest/steal/work/eat). The 0.94 model was DISCARDED as a tautology,
not shipped. Partnership NN remains legitimately starved (n=50); growing it needs real
partnership-interaction data the estate does not currently hold.

## What this confirms (the honesty register working)
- Verification-before-claim (Assay-Integrity Art.I) caught a metric that would have been a false
  win. The residual-signal test (drop the trivial feature) is the correct guard.
- Genuine wins this cycle remain: dependency NN (0.865, leakage-free), threat classifier (0.959
  on 1,823 real deny/breach rows), care_town (0.137 MAE beats 0.172 baseline).

## Real next step for partnership (not doable in-sandbox)
Partnership requires multi-agent cooperative episodes — either (a) run the town sim with a
cooperation-enabled policy to generate real mutual-aid events, or (b) log real user-partnership
interactions via the episode_logger once the server runs. Both are owner/runtime actions.
