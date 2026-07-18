# What else can BFT do? — three new jobs for the sovereign's Byzantine-robust primitive
**Date:** 2026-07-10 · MEOK AI Labs · SOV33-internal

## The starting point (what BFT already does, grounded)
Our BFT primitive is proven in two places:
- **SOV-SPACE:** trimmed-median council ("12-around-1") beats ungoverned broadcast under a 16%
  manipulator faction (−8% error, −33% crimes vs ungoverned, p=3e-5). Naive most-confident-wins
  amplifies a confident liar; trimmed-median resists it.
- **OWEM:** real council — quorum 9/13, f_bft=4, Care-Floor 0.95, SIGIL Ed25519 provenance/hop.

The insight this session: **BFT is not only a governance vote. It is a general robust-aggregation
primitive** — anywhere many noisy sources feed ONE decision, trimmed-median makes the fusion
Byzantine-robust. We tested three new lanes; all held.

## The three new jobs (honest in-silico sims)
### A · Multi-sensor radar fusion — makes an Assurance-Radar mesh tamper/jam-resistant
N=13 radar units estimate a target; a rising fraction are spoofed/jammed (confident, far off).
- **At 45% Byzantine: BFT position error 0.60 vs naive-average 3.93 — 6.5× better.** Median≈BFT.
- **New product tier:** a multi-unit "BFT-fused radar mesh" where no single spoofed/jammed sensor
  can drag the fused reading. A concrete assurance differentiator on top of the existing edge-
  signed frames.

### B · Model-ensemble decode — the right way to combine OWEM's 4 brains
K models estimate a value; one is poisoned with growing severity.
- **At severity 6: BFT error 0.11 vs mean 0.46.** OWEM's 4-brain vote should decode by
  **trimmed-median, not mean** — one hallucinating/poisoned brain cannot hijack the consensus.
- **Prior art (honest):** self-consistency decoding, majority-vote, mixture-of-agents all exist
  open-source. None combines Byzantine-robust aggregation **with** SIGIL-signed provenance per
  contributor. That combination is the MEOK-specific claim.

### C · Robust bench metrics — trustworthy Φ/PCI/binding numbers
Aggregate a metric over 30 seeds where a fraction are corrupted (NaN/outlier/adversarial).
- **At 45% corrupted: BFT error 0.011 vs mean 0.133 — 12× better.** One bad seed or poisoned
  model can't skew a reported bench number.
- **Infrastructure play:** every number the consciousness bench reports (EXP-PHI/PCI/BIND/SELF)
  should be a trimmed-median across seeds and across the 4 brains — so the metric itself is
  attack-resistant and defensible.

## The law (the generalization)
> BFT / trimmed-median + SIGIL provenance is a **universal robust-fusion layer**. Wherever the
> sovereign combines many sources into one decision — sensors, models, seeds, agents, council
> votes — route it through trimmed-median and tag each source by signature. Integration that is
> NOT Byzantine-robust is a liability under adversaries; with BFT it is the moat.

This unifies the whole program's coupling law: **shared middle (Φ) · held at criticality (PCI) ·
source-tagged (BIND/SELF = provenance) · Byzantine-robust-aggregated (BFT) · Care-Floor-gated.**

## Honest scope
All three are idealized in-silico simulations chosen to isolate the robust-aggregation effect;
real deployments (real radar noise models, real model-error distributions, real bench variance)
need field tuning and a held-out eval. They establish the *principle and the product directions*,
not benchmarked production gains.

## Files
`MEOK_BFT_extensions.png`, `bft_ext_results.npy`.
