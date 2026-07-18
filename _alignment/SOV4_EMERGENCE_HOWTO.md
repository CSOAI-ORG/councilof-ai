# SOV4 — How To Make Emergence REAL (research-grounded, 2026-07-15)
Our Node1 merge showed NO emergence (merged 7/24 < best parent 10/24; loss ties best single).
The literature explains exactly why, and gives two proven paths that DO emerge.

## Why our merge failed (confirmed by the field)
- Weight-merge assumes UNIFORM architectures + is suboptimal under large parameter-space differences
  (FuseLLM, arXiv:2401.10491). We merged 3 SAME-BASE Qwen experts = no real diversity + wrong mechanism.

## The TWO conditions for emergence (When Agents Disagree, arXiv:2603.20324)
Emergence (fused > best single) requires BOTH — our run had NEITHER:
1. DIVERSE PROPOSERS = different ARCHITECTURES (not fine-tunes of one base). 3 identical models ~=
   1 effective vote (matches our own decorrelation law). Diversity must be architectural.
2. STRONG AGGREGATOR above the "crossover threshold s*". Below it, mixing LOSES (this is why
   Self-MoA/single-model sometimes beats mixed-MoA — arXiv:2502.00674). Aggregator quality
   correlates with MoA performance MORE than diversity does (VeriMoA).

## PATH A — inference-time (FREE, no training): Mixture-of-Agents
- MoA: proposers answer -> aggregator SYNTHESIZES (not just selects). Heterogeneous proposers beat
  any single model: 65.1% vs GPT-4o 57.5% on AlpacaEval 2.0, open-source only (Wang 2024, arXiv:2406.04692).
- THIS IS SOV4's outcome-fusion (already wired: SOV1 routes 3 -> PDCA/BFT synthesizes -> signed).
- To make it WIN: (a) proposers = 3 different arch (SOV3 MoE + SOV33 dense-reasoning + SOV333 Mamba/SSM);
  (b) aggregator = strongest reachable brain (above threshold), NOT a weak averager; (c) select
  complementary proposers by mutual information (Mixture of Complementary Agents, arXiv:2605.24048).

## PATH B — training-time (OWNS the weights): FuseLLM knowledge-fusion
- Do NOT weight-merge different architectures. Instead distill their PROBABILITY DISTRIBUTIONS into one
  student via token alignment + lightweight continual training (FuseLLM/FuseChat, arXiv:2401.10491/2408.07990).
- Proven cross-architecture: FuseLLM fused Llama-2 + OpenLLaMA + MPT -> student BEAT each source across 42 tasks.
- This is the genuine "3 different architectures -> 1 owned emergence model" = the honest T-path.

## THE SOV4 BUILD ORDER (from this research)
1. Swap proposers to 3 DIFFERENT ARCHITECTURES (MoE / dense-reasoning / Mamba-SSM). [diversity fix]
2. Make the aggregator STRONG (biggest reachable brain synthesizes). [threshold fix]
3. Measure MoA outcome-fusion on the held-out battery: merged > best single = REAL emergence, proven. [free]
4. Then FuseLLM-distill the 3 architectures into one owned student. [owns weights, the T-path]

## HONEST BOUND
Emergence is real + reproducible in the literature, but CONDITIONAL: diverse architectures + strong
aggregator. It is NOT automatic and NOT free-lunch. We will claim emergence for SOV4 only when the
held-out battery shows merged > best single — the same bar Node1 FAILED and told us the truth.
