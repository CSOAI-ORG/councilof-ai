# EMERGENCE — CONCLUSIVE VERDICT (2026-07-17)

**Question:** does fusing SOV's brains create emergence (fused > best single)?
**Answer, after 5 independent tests: NO.** Build SOV4 on governance/attestation/cost, NOT committee-magic.

## The 5 tests
1. Same-base weight-merge -> no emergence (gain 0).
2. Naive MoA -> 1/3.
3. Graded 24-item, 2-brain, no confidence -> best_single (gain 0 by construction).
4. Claude Code lane: diverse-arch + strong 120B aggregator, judge self-biased -> 4/15, no emergence.
5. **THIS (job bf0fa4ad, 29-item, CONFOUND REMOVED — both brains 96 tok, real confidence signal):**
   - qwen_moe 0.828, bamba_ssm 0.724, **rho -0.077 (decorrelated)**
   - confidence-routed fusion **0.690** — WORSE than best single
   - **fusion_gain -0.138** (routing HURT)
   - oracle ceiling 0.966 (headroom exists) BUT on 11 disagreements confidence picked right only 3/11
   - VERDICT: confidence != correctness for these models; the signal can't exploit the decorrelation.

## Why conclusive (not just another null)
Strongest test yet: no token-budget confound, a real per-answer confidence (z-normed token logprob),
honest scoring. The raw material for fusion EXISTS (rho<0, oracle headroom 0.138) but NO CHEAP SIGNAL
converts it to gain. That is the definitive finding.

## What to build instead (all proven, no emergence needed)
1. **DORADO-stop** — provable pre-brain hard refusal, SIGIL-signed (nobody open ships this).
2. **Governance-makes-cheap-trustworthy** — cheap open base + wrap = better-governed output, cheaper/trustworthy-answer.
3. **Sovereignty/attestation** — your infra, your key, no data leaves (the big labs structurally cannot offer this).

## The ONE honest use of the decorrelation
Escalate-on-DISAGREEMENT (defer to stronger judge / ask) — a SAFETY pattern, not emergence.
Do NOT route-by-confidence to try to beat best-single: measured -0.138, it hurts.
