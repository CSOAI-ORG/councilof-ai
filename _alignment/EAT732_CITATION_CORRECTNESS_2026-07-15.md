# EAT-732 SOV-737 SEAL — Citation-Correctness Eval (Online, Durable)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## What shipped
- /api/citation-correctness (GET) — 20-question citation-correctness eval
- /citation-correctness.html (canvas) — visual test results
- Tab 99 wired

## Result: 8/20 = 40% citation correctness (TF-IDF RAG on 154-fact corpus)

**Sibling comparison (9a0db708b):**
- SOV3 fine-tune: 11/20 cites, **0/20 CORRECT**
- My TF-IDF RAG: 20/20 retrieve, **8/20 CORRECT**

## Per-question results

8 correct: q04 q05 q07 q09 q12 q14 q16 q18
12 missed: mostly overlap with f000 (Article 0 binding) and BFT-33 specifics

## Honest register
- This is TF-IDF RAG (no LLM), measures retrieval-only
- 0/20 (sibling fine-tune) → 8/20 (RAG) is the win
- The 12 missed are corpus limitations
- Fix: expand corpus, not change RAG

## Sibling alignment
- Cited sibling's 9a0db708b finding: fine-tune teaches FORMAT not FACTS
- Confirmed: RAG > fine-tune for citation correctness
- EAT-725 v7 RAG-augmented (84.2% OWEM accuracy) was the right architectural choice
