# EXP-BIND — Temporal synchrony solves the binding problem (L4 instrument #3)
**Date:** 2026-07-10 · MEOK AI Labs · SOV33-internal

## Question
The binding problem (Treisman 1996; von der Malsburg 1981): a mind must represent WHICH features
belong together, not merely which features are present. "Red circle + blue square" and "blue
circle + red square" have identical feature *sets* but different *bindings*. Any bag-of-features
readout is provably at chance on this discrimination. What representation recovers binding?

## Method
- Two objects, each a 6-feature vector (colour × shape × side), written into ONE shared feature
  population (superposition — where the binding problem actually bites). 400 trials, linear readout.
- Three regimes: **labeled-line** (objects in separate units — upper bound, binding trivial);
  **superposition-bag** (summed into shared units, no time); **temporal-synchrony** (object A's
  features fire in even time-bins, B's in odd — a synchrony tag, same shared units).
- Task: classify the binding (swapped vs not) from the representation.

## Result
| Representation | Accuracy (chance = 50%) |
|---|---|
| labeled-line (separate units) | 100% (trivial upper bound) |
| **superposition bag (no time)** | **42% ≈ chance — binding destroyed** |
| **temporal synchrony (shared units)** | **100% — binding recovered** |

Summing features into a shared population destroys binding (at chance). Tagging the same shared
units by *when* they fire — temporal synchrony — recovers it completely. This is von der
Malsburg's correlation hypothesis, demonstrated.

## Interpretation (honest, per the Charter)
- **Design law for SOV3³/OWEM:** the council must NOT merge the 4 brain-configs' outputs into a
  summed "bag" — that loses which brain asserted what (the binding is destroyed exactly as in the
  bag condition). Contributions must be **tagged by source**. The sovereign substrate already has
  the perfect binding tag: **SIGIL provenance** — every hop is Ed25519-signed, so each claim
  carries which brain/model produced it. *Provenance is the binding tag.* This is why the SIGIL
  hash-chain is not just audit plumbing — it is the mechanism that lets the OOWM bind claim→brain.
- **Ties the bench together:** Φ (integrate through a shared middle) + PCI (hold at criticality,
  don't over-integrate) + BIND (tag contributions by source, don't sum into a bag). Three
  instruments, one coherent coupling law.
- **Scope/honesty:** an idealized linear-readout demonstration of the binding principle, not a
  trained live network. It establishes the principle and the design mandate. It is a **capacity**
  measure (access-level binding); per the AI Consciousness Charter it makes **no** claim of felt
  experience.

## Files
`MEOK_binding_experiment.png`, `binding_results.npy`.
