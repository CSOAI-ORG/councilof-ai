# SOV3 Citation-Correctness — Honest Finding (2026-07-15)
Eval: 20 EU AI Act prompts, each with the KNOWN-CORRECT Article. n=20. Modal A100, greedy decode.

## THE NUMBERS (real, verified with raw-output capture)
| Model | grounds (cites an Article) | CORRECT article | wrong-article | wrong-LAW (GDPR not AI Act) |
|-------|---------------------------|-----------------|---------------|----------------------------|
| base (Qwen2.5-0.5B) | 0/20 | 0 | 0 | 3 |
| tuned (SOV3 adapter) | 11/20 | **0** | **11** | 4 |

## WHAT THIS MEANS (the honest read)
- **The fine-tune taught the FORMAT, not the FACTS.** Tuning moved citation from 0/20 -> 11/20 (the model now
  CITES articles, in the right 'EU AI Act Art.N' style) — but **0/11 are the correct article.** Every single
  citation is wrong (e.g. transparency wants Art.50, cites Art.12; risk-mgmt wants Art.9, cites Art.10).
- **This is expected for a 0.5B model with 113 training pairs.** It learned the SHAPE of a legal citation
  (a real, useful style signal) without memorising the article-number->topic mapping (needs facts, not style).
- **It CONFIRMS the earlier honest caveat as measured fact**: the 83% 'law-grounding' score was grounding in
  legal LANGUAGE, and this proves citation-CORRECTNESS is a separate, currently-FAILING axis (0/20).
- **It also confirms wrong-LAW leakage**: 4/20 cite GDPR when the answer is EU AI Act.

## THE FIX (clear, not hedged)
Citation-correctness is a FACTS problem, and facts come from RAG, not fine-tuning (proven pattern):
1. Build a charter/article RAG index (EU AI Act article text -> retrievable by topic).
2. At inference, retrieve the relevant article FIRST, put its number+text in context, then answer.
3. Re-run this exact battery -> expect correct-citation to jump from 0 toward the retrieval ceiling.
Fine-tune keeps the voice; RAG supplies the right article number. Both, not either.

## HONEST BOUND
- 0/20 correct is a REAL current-state number, not a bug (verified by dumping raw generations: the citations
  are present and wrong, e.g. want 50 got 12).
- Do NOT serve SOV3 as a citation authority until RAG lands. It grounds in law-language (useful) but its
  specific article numbers are currently unreliable. Say so on the tab.
