# SOV-SPACE-WS — Global Workspace at the sovereign-town scale
### Does broadcasting one agent's insight to all (gated by governance) create collective intelligence?
**Date:** 2026-07-08 · MEOK AI Labs · sovereign-space experiment · companion to the Emergence Thesis

## Why this experiment
Global Workspace Theory (Baars, Dehaene) is the leading *functional* theory of consciousness:
a mind is conscious of what it "broadcasts" widely across its sub-systems. This experiment runs
that idea at the **society scale** — N agents, each with a partial noisy view of a hidden state.
A "salience competition" each step selects an estimate to broadcast to all. This is the
access-consciousness question for a whole town: does a shared workspace produce collective
intelligence the siloed agents cannot reach — and what governance keeps it safe?

**Honest scope:** this is a model of *collective information integration and governance*, not a
claim that the town is sentient.

## Setup
- N=12 agents, T=200 steps, 20 seeds, paired Wilcoxon.
- Each agent tracks a hidden signal from a biased, noisy partial view.
- Conditions: **siloed** (no broadcast) · **ungoverned broadcast** (most-confident agent wins) ·
  **BFT-governed broadcast** (trimmed-median aggregation = the 12-around-1 primitive).
- Adversarial variant: 2 of 12 agents (16%) are **manipulators** — confident but wrong, faking
  high salience to hijack the workspace.

## Results
**Benign town:** broadcast alone cuts tracking error **37%** (1.162 → 0.727) and crimes **70%**
(135 → 41), p<1e-5. A shared workspace is a large, real collective-intelligence gain. The naive
care-floor gate made **no difference** here — in a benign town the winning proposal rarely harms
anyone, so the gate never fires. (Honest null, and diagnostic.)

**Adversarial town (2 manipulators):**
| Condition | Honest-agent error | Crimes | |
|---|---|---|---|
| Siloed | 1.156 | 113 | baseline |
| Ungoverned broadcast | 0.825 | 57 | helps, but **amplifies the manipulator** |
| **BFT-governed broadcast** | **0.763** | **38** | **8% lower error, 33% fewer crimes than ungoverned, p=3e-5** |

## The honest, defensible findings
1. **A shared workspace is a real collective-intelligence gain** — broadcast beats siloed
   everywhere (37% lower error). This is Global-Workspace "ignition" at the town scale.
2. **Ungoverned broadcast is dangerous** — it faithfully amplifies a confident liar. This is the
   failure mode of an ungoverned collective mind.
3. **The governance primitive that works is Byzantine-robust aggregation** (trimmed median),
   which maps directly onto your sovereign substrate's **12-around-1 BFT**. It resists a 16%
   manipulator faction where a naive worst-case "care-floor veto" did not.
4. **Governance earns its keep under adversaries, not in the benign case** — an important design
   truth: don't sell the care-floor as a universal gate; sell it as *robustness under attack*,
   which is exactly when it measurably wins.

## Connection to the program
This is the **coordination** strand of the Emergence Thesis, now grounded in a named theory
(Global Workspace) and a named primitive (BFT). Together with EXP-INT (integration) and the
capillary/reservoir work (memory, computation), MEOK now has one measured result mapped onto
each leg of the mainstream consciousness-science map — every one stated as a *capacity*, none as
a claim of felt experience.

## Files
- `MEOK_sovspace_workspace.png` — four panels: benign, adversarial, crimes, theory mapping
- `sovspace_ws.npy`, `sovspace_bft.npy` — raw seeded results
