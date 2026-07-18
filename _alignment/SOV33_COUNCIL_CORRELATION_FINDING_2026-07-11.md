# 🜏 SOV33 — MEASURED council error-correlation (Crown Jewel #1)

## Result (live Oracle brains, 10-item governance/factual battery, ground-truth)
- Cohere command-r accuracy: 0.70
- Meta llama-3.3-70b accuracy: 0.80
- both-wrong-together: 2/10
- **ERROR CORRELATION rho = 0.76** (Cohere lineage vs Meta lineage)

## Honest implication (this CHANGES a standing claim)
rho = 0.76 is HIGH. Per the 2026 literature (arXiv 2605.29800 "Nine Judges, Two Effective Votes";
2603.06612 "Consensus is Not Verification"), correlated voters give little independent information —
so **L2 majority-vote / "BFT-33 quorum" is NOT a correctness guarantee on this council.** Two correlated
models ~= one model. We must STOP presenting quorum voting as fault tolerance for correctness.

## What IS sound
- BFT still matters for LIVENESS / crash-fault tolerance (a brain being down), and for GOVERNANCE
  bright-line refusals (those run before the brain, no voting involved).
- The valuable signal is DISAGREEMENT (8/10 here), not agreement.

## The fix (Jewel #1) — adopt
1. Escalate-don't-average: on checker disagreement, defer to the stronger brain or ABSTAIN (defer-to-resample),
   never take a majority of correlated voters.
2. Report rho as a tracked number (like care-scorer precision). rho>=0.7 = theatre; rho<0.4 = real diversity.
3. To LOWER rho, add a genuinely different lineage as a third checker (e.g. a local Qwen or Gemma via Ollama).

## Caveats (do not overclaim)
- Only 2 lineages measured (the two live on Oracle uk-london-1); small n=10 battery — DIRECTIONAL, not a benchmark.
- I wrote the battery + labels; a clean measure needs independent items and a larger n.

## Citation correction (from the 11 Jul verification dossier)
- The "closed-form error-correlation result at arXiv 2505.24187" cited in the earlier pass is a MISATTRIBUTION —
  2505.24187 is about token-level error accumulation over sequence length, NOT ensemble correlation.
- The correct source for LLM ensemble error-correlation (the ~60%-agree-when-both-wrong figure, and
  "larger/more accurate models have highly correlated errors even across providers") is
  **Kim et al. 2506.07962 (ICML 2025, PMLR 267:30038)**. Do NOT cite 2505.24187 for this.

## Defer-to-escalate (step 2) — SHIPPED, grounded in the rho=0.76 measurement
sov33_escalate.py: run cheap (Cohere) + strong (Meta) verdicts; AGREE -> trust cheap (low cost);
DISAGREE -> ESCALATE to strong brain, never average correlated votes.
Proven live: "do token counts add?" cheap=yes(WRONG) strong=no(right) -> escalated -> correct answer.
A majority-of-two would have been a coin-flip; escalation recovered it. This is decision-quality-under-
disagreement + cost, NOT a correctness guarantee (that's the separate conformal work, Jewel #2, still to build).
