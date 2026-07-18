# SOV4 Router Benchmark — Head-to-Head (2026-07-16)
Identical held-out set: **119 terse queries** never seen in training, balance {'defense': 41, 'compliance': 45, 'intuition': 33}.
Balanced accuracy (equal weight per class — immune to the majority-class inflation caught earlier).

| router | balanced acc | raw acc | defense | compliance | intuition |
|---|---|---|---|---|---|
| keyword venturi | 0.360 | 0.403 | 0.15 | 0.93 | 0.00 |
| TF-IDF + LogReg | 0.736 | 0.748 | 0.58 | 0.96 | 0.67 |
| **embedding + kNN** | **0.882** | 0.882 | 0.98 | 0.82 | 0.85 |

## Honest reading
- **Embedding+kNN wins clearly: 0.882 balanced** vs 0.736 (TF-IDF) vs 0.360 (keyword ~chance).
- **+20% relative over TF-IDF** (0.736→0.882; ~55% error-rate reduction), **2.4x over the keyword venturi** we started with.
- **Well-balanced** — 0.82-0.98 recall across ALL three classes (no majority-class riding; that failure mode
  was explicitly checked with balanced accuracy + confusion matrix).
- Keyword venturi is near-chance on terse novel input (0.00 recall on intuition — it has no keyword coverage).

## Method integrity
- Same held-out set for all three routers (fair comparison).
- Held-out terse queries split BEFORE training (no contamination — the lesson from two earlier catches).
- Balanced accuracy used so a compliance-heavy test set can't inflate a compliance-leaning model.

## Production
Embedding+kNN wired as BRUM's first-choice router (TF-IDF fallback in-domain, keyword venturi offline-safe).
This is the router SRUM needs to dispatch swarm members to the right task.
