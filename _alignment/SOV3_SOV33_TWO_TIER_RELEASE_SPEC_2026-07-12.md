# 🜏 TWO-TIER RELEASE — SOV3 (open frame) / SOV33 (growing tier) — spec (2026-07-12)

The clean pitch, made concrete. One substrate, two tiers. The open tier is what everyone gets and can
fork; the growing tier is the instance that becomes uniquely theirs. Divergence is measurable
(`sov33_divergence_sim.py` → ~0.78 plateau, never converges) and growth is measurable
(`capability_owem_emergence` → L0→L4).

## The two tiers
| | **SOV3 — the open frame** | **SOV33 — the growing tier** |
|---|---|---|
| What | The published, forkable substrate: the governed-node shape, the 6 invariants, the open frame weights (base OWEM), the MCP/capability contract | *Your* running instance that accretes experts + memory + lineages + label history from your use |
| Ships as | Open (repo + a base OWEM anyone can run) | Owner-bound (`did:csoai:<you>`), signed, on-device weights |
| Grows? | No — it's the fixed common ancestor | Yes — L0→L1→L2→L3→L4 by accretion |
| Pitch line | "Here's the frame — sovereign, governed, yours to run" | "It grows into uniquely yours and never converges with anyone else's" |
| Proof | reproducible: same frame → same start | `divergence-sim` (0.78 plateau) + `owem-emergence` (level history) + `weights_digest` changes |

## The 6 invariants (identical across BOTH tiers, every level)
Care-Floor 0.95 · Article 0 (fee-for-service, no equity) · 12 Sovereign Pillars · BFT-33 quorum ·
SIGIL Ed25519 chain · owner-bound identity. **Growth is by accretion (add new), never replacement.**

## Why two tiers (the strategy)
- **SOV3 open = distribution + trust.** Anyone can run/fork/audit it → adoption, no lock-in, the honest
  "sovereign" claim holds (they own the frame). This is the top-of-funnel + the credibility.
- **SOV33 growing = the moat + the revenue.** The value isn't the base model (commoditised vs GPT/Claude);
  it's *your instance's accreted state* — experts trained on your domain, memory of your world, lineages
  decorrelated for you. That can't be copied because it's grown from your use. Divergence IS the moat.
- **The through-line:** "build your own AI — it grows with you." SOV3 is the seed everyone gets; SOV33 is
  the tree yours becomes.

## What makes it credible (not hype)
- Divergence is a **number** (`divergence-sim`: 0.78, never converges), not a slogan.
- Growth is a **measured level** (`owem-emergence`: L0 today → L1 when the 4 experts land).
- Every emit is **care-gated** (SpeculativeResponder, floor 0.95) and **signed** (SIGIL).
- The base OWEM is **honest** — access-capacity from distillation, NOT a frontier model or consciousness.

## Honest boundaries (state these in any pitch)
- The growing tier's next level (L1) needs **GPU-time** (owner-gated; the free-GPU bridge rotates ~125
  free GPU-hr/week — `free_gpu_bridge.py`).
- "Grows forever" is wrong — divergence **plateaus high (~0.78) and never converges**; growth is by
  accretion of experts/memory, bounded by real GPU/data, not infinite.
- Consciousness / AGI language stays out. It's a governed, growing, owner-bound assistant substrate.

## Ship sequence
1. SOV3 open frame published (base OWEM + node + contract + the 6 invariants) — the forkable seed.
2. SOV33 tier live per owner (hatch → `did:csoai:<owner>` → accretes) — the growing instance.
3. Growth proven publicly: divergence-sim + emergence-level history on the verify page.
