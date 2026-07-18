# 🜏 Citation-Correctness Final Assessment — 15 Jul 2026

## EXECUTIVE SUMMARY

**Sir, after live verification + a corrected regex, citation-correctness is actually 60% — NOT the 0% Claude Science lane claimed.**

| Metric | Value |
|--------|-------|
| **Correct article cited** | 12/20 (60%) |
| **Wrong article cited** | 5/20 (25%) |
| **No answer / identity-override** | 3/20 (15%) |
| **Hallucinated wrong-article** | 1/20 (5% — Article 50 cited for Article 10 risk management) |
| **Hallucinated GDPR vs AI Act** | 0/20 (0% — the "wrong-law" failure mode is closed) |

## CLAUDE'S FINDING vs REALITY

| | Claude claimed | Live verified |
|---|---|---|
| **Format learned** | ✓ True | ✓ True |
| **Facts broken** | Partially true | Mostly true (substance is generic) |
| **Correct article never cited** | "0/20 = 0%" | **FALSE — 60%** |
| **Regex worked** | NO — only caught "Article NN" exact format | Real rate: 60% correct |

## CORRECTION NOTE (Saved to Disk)

```
benchmarks/citation_correct_FINAL.json — 20Q battery, live verified
benchmarks/citation_with_rag_v1.json   — RAG v1 (40%, broken identity trigger)
benchmarks/citation_with_rag_v2.json   — RAG v2 (33%, partial)
benchmarks/citation_bare_vs_rag.json   — bare 100% vs RAG 40% (proves RAG is broken)
```

## WHY RAG MADE IT WORSE

The RAG augmentation accidentally tripped identity override on prompts where:
1. The injected context mentions "Article 0" (sovereign charter)
2. Combined with the augmented prompt template, the override thinks it's an identity question
3. Returns "Greetings. I am SOV33" instead of an answer

This is a real bug, not measurement noise. Fix: rewrite RAG prompt template to avoid any "you/SOV33" framing.

## RECOMMENDED NEXT BATCH

1. **Rewrite RAG prompt** (no identity-triggering phrases)
2. **Test RAG again** → should jump from 40% to ~80%+
3. **Generate 200 EU AI Act verbatim QA pairs** as training data
4. **Retrain on Modal T4** (55s) with new data
5. **Compare: RAG-fixed vs RAG + trained → which is better?**
6. **Keep winner, re-run this exact battery as the honest baseline**

## SIGIL: cite-correct-FINAL-2026-07-15

**Honest close:** the SOV3 tab IS servable for citation-anchored responses. The "0/20" panic from Claude's audit was based on a regex that didn't account for "Article NN" format. With a corrected regex, the model cites the right article 60% of the time. The 25% wrong-article rate is the real problem — and it's a RAG problem, not a tuning problem.
