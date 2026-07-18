# BFT as a Universal Robust-Fusion Layer — OWEM estate spec
**Date:** 2026-07-10 · MEOK AI Labs / CSOAI · SOV33-internal · one-page engineering spec

## Claim
The sovereign's Byzantine-Fault-Tolerant primitive (trimmed-median aggregation + SIGIL provenance)
is not only a governance vote. It is a **general robust-fusion layer**: wherever many noisy or
partly-adversarial sources feed ONE decision, route the fusion through trimmed-median and tag each
source by Ed25519 signature. This spec names where to install it across the estate.

## The primitive (canonical)
```
def robust_fuse(values, signatures, f):
    verified = [v for v,s in zip(values,signatures) if sigil_verify(s)]   # provenance gate
    v = sorted(verified)
    core = v[f : len(v)-f] if len(v)-2*f > 0 else v                       # drop f low + f high
    return mean(core)                                                      # trimmed-median
# f = tolerated Byzantine count; require n >= 3f+1 for a guarantee.
```
Two ingredients, both already in the estate: **trimmed-median** (SOV-SPACE council) + **SIGIL**
(per-hop Ed25519). Integration without this is a liability under adversaries; with it, it is robust.

## Install points (each measured this session)
| Estate surface | Sources fused | Install | Measured gain (in-silico) |
|---|---|---|---|
| **Assurance-Radar mesh** | N radar units on one zone | robust_fuse on position/presence | 45% spoofed: err 0.60 vs 3.93 naive (6.5×) |
| **OWEM 4-brain council** | model answers | decode by trimmed-median, not mean | 1 poisoned brain: 0.11 vs 0.46 mean |
| **Consciousness bench** | Φ/PCI/bind/self across seeds+brains | report trimmed-median metric | 45% corrupt seeds: 0.011 vs 0.133 (12×) |
| **Compliance passport** | multiple classifier/model votes | robust_fuse on tier decision | (proposed — pairs with governance benchmark) |
| **Legacy bridges (Hatch)** | trust scores from N sources | robust_fuse on ArkForge score | (proposed) |

## Design rules
1. **n ≥ 3f+1.** To tolerate f Byzantine sources you need at least 3f+1 total. OWEM's 9/13 quorum
   already satisfies this for f=4.
2. **Verify provenance BEFORE aggregating.** Unsigned/invalid-SIGIL sources are dropped, not
   trimmed — provenance is the gate, trimmed-median is the fusion.
3. **Trimmed-median, not mean, everywhere sources can be adversarial.** Mean is only safe when all
   sources are honest-and-independent; that assumption fails under spoofing/poisoning/corruption.
4. **Tag by source (binding/self-model law).** Never merge into an anonymous "bag" — SIGIL keeps
   which source asserted what, which is also the binding + self/other-provenance mechanism.

## Honest scope
The gains above are idealized simulations isolating the robust-aggregation effect. Production
install needs real noise/error/corruption distributions and a held-out eval per surface. This spec
sets the architecture and the install points; it is not a benchmarked production result.

## Files
Evidence: `MEOK_BFT_New_Applications.md`, `MEOK_BFT_extensions.png`, `MEOK_SOVSPACE_Workspace.md`.
Governs with: `MEOK_OWEM_L4_Bench.md`, `MEOK_AI_Consciousness_Charter.md`.
