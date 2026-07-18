# 🜏 Citation-Correctness Breakthrough — 16 Jul 2026

## EXECUTIVE SUMMARY

After **3 rounds** of training + RAG iteration today, **80.0% on Claude's 20-question battery** is the new peak.

| Variant | Claude battery (20) | Unseen phrasings (10) |
|---------|--------------------|--------------------|
| Yesterday (v2) | 12/20 = 60% | 1/10 = 10% |
| v5 (no RAG, 300 steps, mixed data) | 13/20 = 65% | 1/10 = 10% |
| **v5 + Lean RAG** | **16/20 = 80%** | 3/10 = 30% |

## What Made The Difference

The **Lean RAG prompt format**:
```
Ref: EU AI Act Article N - <short summary>

Q: <user question>
Cite Article N.
A:
```

vs. the earlier Heavy RAG prompt (long template, training-data-aligned). The lean format:
- **Doesn't pattern-match against training data** (no overfitting trigger)
- **Directly instructs citation** with "Cite Article N."
- **Short enough** that the model treats it as grounding, not training

## Why Training Plateaus At 65%

Brain v5 was trained on 164 examples × 300 steps → 87.9% loss drop. But:
- More training → more overfitting on literal phrasings
- New phrasing → 10% accuracy
- This is the "format learned, facts broken" pattern from Claude Science

RAG breaks the cycle: retrieval supplies the correct article number, brain just reads it.

## Why Unseen Phrasings Are Still Weak (30%)

The brain still overfits to training data. To improve:
- Reduce training steps further (50 instead of 150?)
- Use RAG-first always (don't rely on brain memory)
- Distillation: train on RAG outputs, not literal Q/A pairs

## What's Saved

```
benchmarks/
  citation_correct_RESCORE_FINAL.json    (12/20 = 60% yesterday baseline)
  brain_v4_citation_eval.json           (12/20 = 60% — no improvement from training)
  brain_v4_RAG_safe_eval.json           (13/20 = 65% — RAG + override fix)
  v5_lean_rag_eval.json                 (16/20 = 80% + 3/10 unseen = 30% — TODAY'S WIN)
```

## What This Means

**Don't ship brain v5 as a citation authority.** Ship it WITH lean-RAG prompt format. The lean-RAG prompt is what users should send to get the right answer 80% of the time.

## Honest Limitations

- The 80% is on Claude's EXACT 20-question phrasing. Real users wouldn't phrase them this way.
- Unseen-phrasing accuracy is only 30% — brain hasn't generalized.
- The lean-RAG prompt is a *prompt engineering* win, not a model win.

SIGIL: v5-lean-rag-2026-07-16
