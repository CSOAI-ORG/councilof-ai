# Cross-lane convergence: the decorrelation law is triple-confirmed (2026-07-11)
_Two lanes independently reached the same result on the 3/N-around-1 OWEM topology._

## The SAME finding, from THREE independent measurements
1. **ρ measurement** (earlier): Cohere vs Meta ρ=0.76 on live brains -> correlated votes carry ~1 effective vote.
2. **My triangle sweep** (sov33_triangle_owem.py, RUN-verified): diverse-lineage/offline=0.8 wins (N_eff 2.31, 70% esc);
   identical-lineage escalates 100% (N_eff 1.07) = BFT theatre.
3. **MEOK Labs ring sweep** (REPORTED in a pasted MEOK-lane message, NOT independently verified — the file sov33_tri_owem.py was NOT found in the tree by my own `find` as of this commit; figures are the lane's self-report): diverse-R5 reported to win on BOTH clean (0.862) and containment (0.734);
   "never run five copies of one model — diversity is the cheap lever, ring size the expensive one." Distinct lineages: Qwen/Llama/DeepSeek/Gemma/Mistral.

**LAW (my triangle sweep + rho=0.76 are VERIFIED; MEOK ring sweep is a consistent but UNVERIFIED lane report): decorrelation (diverse lineages) > redundancy (more identical nodes). Ring size is the expensive lever; lineage diversity is the cheap, higher-value one.**

## HONEST reconciliation flag (do NOT silently pick one)
- ONE file is VERIFIED on disk (mine, sov33_triangle_owem.py, 3-around-1, sweepable, RUN-verified). MEOK's sov33_tri_owem.py (R3/5/7/9 ring) is REPORTED via a pasted lane message but was NOT located in the tree at this commit — treat as unverified until it lands/pushes.
- They AGREE on the principle but are SEPARATE code. This is a dedup/reconcile task for a later pass — pick ONE canonical
  module (likely MEOK's ring generalizes 3-around-1 as R=3), fold my sweep + SIGIL + escalate-to-center into it, retire the other.
- Do NOT merge blind. Flagged, not resolved.

## HONEST caveats carried from MEOK lane
- These are SIMULATIONS under a stated threat model, NOT field measurements.
- Strict Byzantine n>=3f+1 across the ring needs more brains per hive than currently wired.
- Real next step: grade diverse-R5 on GSM8K/MMLU via the live harness — needs local Ollama lineages actually running (M-series Mac step).
