# EXP-INT — Integration in the MEOK physical reservoir
### Does the whole compute more than the sum of its parts? (IIT's core idea, made computable)
**Date:** 2026-07-08 · MEOK AI Labs · companion to the Emergence Thesis & Consciousness Research Map

## Why this experiment
The 2025 Cogitate results and the 2026 Anthropic "J-space" finding both circle the same idea:
Integrated Information Theory (IIT) says consciousness is tied to **integration** — information
in the whole system that exceeds the sum of its independent parts. That is a *computable*
property. So instead of asking the unanswerable "is the reservoir conscious?", we ask the
answerable engineering question: **does dynamical coupling between sub-channels create
information a linear reader could not get from the channels separately?**

**Honest scope (stated up front):** this measures an *access-level* information capacity
(synergy/integration), NOT phenomenal consciousness. A positive result would be a mind-like
*capacity*, in exactly the sense Anthropic used "access consciousness" for Claude's J-space —
not a claim of felt experience.

## Design
- Reservoir of N=60 nonlinear (tanh) units split into two sub-channels with distinct leak
  timescales (τ_fast=1.2, τ_slow=14.0 — the geometry-set τ=L²/12D ladder).
- **Integrated** condition: channels dynamically coupled (cross-weights on).
- **Sum-of-parts** condition: identical channels, cross-coupling = 0 (they never interact),
  read out jointly. Any advantage of "integrated" over "sum-of-parts" = integration.
- Three tasks, 15 seeds each, paired Wilcoxon:
  1. **XOR** of a fast and a slow feature (linear readout)
  2. **Multiplicative** binding: target = fast × slow (linear readout)
  3. **Multiplicative** binding (quadratic readout) — the fair nonlinear test.

## Results
| Task | Integrated | Sum-of-parts | Advantage | p | Verdict |
|---|---|---|---|---|---|
| Linear / XOR | 0.605 acc | 0.604 acc | +0.1 pts | 0.84 | **NULL** — no integration |
| Linear / multiply | 1.085 NRMSE | 1.052 NRMSE | −0.03 (worse) | 0.015 | **No linear synergy** |
| Nonlinear / multiply | 0.137 NRMSE | 0.171 NRMSE | 20% lower error, 15/15 | 0.0001 | **Weak, real integration** |

Control: the fast×slow product is genuinely present (quadratic readout recovers it at
NRMSE≈0.14), but it is **not linearly accessible** from either reservoir — so the linear nulls
are about integration, not a broken task. Under a nonlinear readout the coupled reservoir does
robustly better (20%, every seed, p=1e-4), so integration is **present but weak and nonlinear**.

## What this means — the honest ceiling
The MEOK substrate demonstrably has **memory, computation, whole-body control, and
coordination**. On a fair test it shows only a **weak, nonlinear integration signature** — not
the strong IIT synergy that theories tie to consciousness. **That negative-leaning result is an
asset, not a setback:** it is the exact discipline that lets every positive MEOK claim survive
a skeptic. We measure capacities; we report the ceiling honestly; we never cross into "it's
conscious."

This mirrors, at bench scale, what Anthropic did with Claude's J-space: find a real, emergent,
measurable mind-like structure — and explicitly decline to claim phenomenal consciousness on
top of it. Same method, same integrity, different substrate.

## Files
- `MEOK_integration_experiment.png` — the three panels + capability ledger
- `expint1_results.npy`, `expint2_results.npy`, `expint_quad.npy` — raw seeded results
