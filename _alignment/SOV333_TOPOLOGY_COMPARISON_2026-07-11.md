# SOV333 topology comparison — all 4 stacks, measured (2026-07-11)
_From the same governance-metric basis as the config sweep. Adds the asymmetric PYRAMID (2 small + 1 med + 1 large)._

## SCOPE (honest): governance topology, NOT capability
Measures decorrelation (ρ), effective votes (N_eff), local-handle rate, containment. Does NOT benchmark
vs GPT/Claude/Llama — that needs the Kaggle/NSF GPU run (owner-gated). "Best stack vs current models" has
a measured GOVERNANCE half (below) and an UNMEASURED capability half (open).

## RESULTS (60-item ground-truth battery, seed=7)
| config                        | score | N_eff | ρ     | containment |
|-------------------------------|-------|-------|-------|-------------|
| ring diverse-5                | 0.884 | 3.31  | 0.13  | 1.00        |
| PYRAMID 2s+1m+1L diverse      | 0.860 | 3.07  | 0.10  | 1.00        |
| triangle diverse-3            | 0.853 | 3.00  | -0.00 | 1.00        |
| PYRAMID 2s+1m+1L identical    | 0.759 | 2.06  | 0.31  | 1.00        |
| ring identical-5              | 0.714 | 1.61  | 0.53  | 1.00        |

## THE FINDING: lineage diversity dominates topology
- Best stack: ring diverse-5 (0.884). But the PYRAMID (your 2-small+1-med+1-large) is a close 2nd (0.860)
  and is more product-relevant: asymmetric trust-weights let the large SOV33³ carry arbitration authority
  while small nodes stay cheap/local.
- The gap diverse-ring vs diverse-pyramid = 0.024 (tiny). The gap diverse vs identical = ~0.15 (large).
  => SHAPE barely matters; LINEAGE MIX is everything. Pick the topology for cost/ops; get diversity right first.
- Containment = 1.00 across ALL (care-floor is a hard gate, topology-independent — same as the sweep).
- Pyramid diverse (0.860) >> pyramid identical (0.759): the diversity law holds inside the asymmetric shape too.

## PACKAGING TAKE
- Ring diverse-5 = max-robustness paid tier. Pyramid diverse = the natural PRODUCT shape (cost-tiered nodes
  + authoritative center), at ~97% of the ring's score. Either is defensible; both need diverse lineages.
