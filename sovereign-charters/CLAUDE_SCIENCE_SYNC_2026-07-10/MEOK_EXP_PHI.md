# EXP-PHI — Real integrated information (Φ) on the SOV3³ motif
**Date:** 2026-07-08 · MEOK AI Labs · SOV33-internal

## Question
Integrated Information Theory (IIT, Tononi) makes integration — Φ, the information a system
generates beyond its minimum-information bipartition — the formal core of consciousness. It is a
*computable* quantity on small systems. EXP-INT used a synergy proxy; this experiment computes a
transparent integrated-information measure (KL over the minimum-information bipartition — an
approximation to IIT's exact Φ) on the SOV3³ architectural motif (4 brain-configs, one shared
OOWM).

## Method
- 4-node binary network, exact enumeration of the transition-probability matrix.
- Φ = min over all bipartitions of the (normalized) KL divergence between the whole system's
  next-state distribution and the product of the parts' distributions (effective-information over
  the minimum-information partition). Max-entropy input perturbation.
- Three couplings: **integrated** (each node = majority of the whole → shared-OOWM analog),
  **pairs** (two isolated dyads), **disconnected** (each node self-copies).
- PyPhi was attempted but its pinned release is incompatible with Python 3.11
  (`collections.Iterable`); Φ was therefore implemented directly and transparently.

## Result
| Configuration | Φ (bits, normalized) |
|---|---|
| **integrated** (1 shared OOWM) | **0.448** |
| two pairs | 0.000 |
| disconnected | 0.000 |

Only the integrated configuration carries irreducible whole-system information. Partitioning the
system into independent parts (pairs or singletons) drops Φ to exactly zero — the theoretically
correct result, and the point of the experiment.

## Interpretation (honest, per the Charter)
- **The SOV3³ topology is architecturally validated:** four brains sharing one OOWM is the
  configuration with Φ>0; four independent brains voting at the output would have Φ=0. The shared
  middle is what makes the ensemble more than the sum of its brains.
- **This is a transparent integrated-information measure (KL over the minimum-information
  bipartition), not canonical PyPhi Φ.** PyPhi's pinned release failed to import under Python
  3.11, so Φ was implemented directly; the measure captures the *same principle* (irreducibility
  of the whole to its parts) but is an approximation to IIT's exact Φ, not the reference
  algorithm. It measures an access-level *capacity* (integration) and makes **no** claim about
  phenomenal/felt experience.
- **Ceiling:** a 4-node toy graph, not SOV3³'s real coupling. The next step is a Φ-proxy on the
  live coupling graph from an actual trace. Stated as direction, not production benchmark.

## Files
`MEOK_phi_experiment.png`, `phi_results.npy`. Design law drawn out in
`MEOK_Integration_Transfer_to_Sovereign.md`.
