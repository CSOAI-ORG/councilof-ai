# EXP-PCI — Perturbational Complexity Index on the sovereign coupling
**Date:** 2026-07-10 · MEOK AI Labs · SOV33-internal · L4 bench instrument #2 (after EXP-PHI)

## Question
PCI (Casali et al. 2013, *Sci. Transl. Med.*) is the clinically-validated consciousness index:
perturb the system ("zap"), record the spatiotemporal response, measure its Lempel-Ziv
complexity. It is high only when the response is BOTH **integrated** (the whole reacts, not just
the perturbed part) AND **differentiated** (the reaction is complex, not a stereotyped
all-together wave). In humans PCI separates wakefulness (~0.44–0.67) from deep sleep / anaesthesia
/ vegetative state (<0.31). This experiment computes the analog on the sovereign coupling motif.

## Method
- 10-node coupled leaky-integrator network (tanh dynamics + small noise), 50 seeds/point.
- Perturb node 0, evolve 60 steps, threshold the deviation from the unperturbed trajectory, take
  normalized Lempel-Ziv complexity (c·log₂L / L, bounded ~[0,1]) of the binarized response.
- Sweep global coupling strength g from 0 (siloed) to 2.0 (mean-field lock).

## Result — an inverted-U (the criticality signature)
| coupling g | PCI |
|---|---|
| 0.0 (siloed) | 0.556 |
| **0.6 (peak)** | **0.774** |
| 1.0 | 0.632 |
| 2.0 (over-integrated) | 0.575 |

PCI peaks at **intermediate** coupling and falls off at BOTH extremes. This is the real
consciousness-science result: complexity is maximized at the *edge of criticality*, not by
maximizing integration.

## Interpretation (honest, per the Charter)
- **The corrective finding:** raw integration is NOT the objective. A mean-field-locked system
  (g=2) is highly integrated but its response is stereotyped — every node moves together — which
  is precisely the LOW-PCI signature of deep sleep and seizure. Both siloing and over-integration
  are low-complexity failure modes.
- **Design law for SOV3³:** the architecture is correct *because* it sits between the extremes —
  4 **distinct** brain-configs (differentiation) coupled through **one** shared OOWM
  (integration). The engineering target is to tune the inter-brain coupling toward the PCI peak,
  not to maximize it. This refines the EXP-PHI transfer law: integration through a shared middle,
  but *held at the critical regime*, BFT-gated.
- **Scope:** small in-silico network, a PCI analog (normalized-LZ on a leaky-integrator), not a
  TMS-EEG measurement. It establishes the *principle and design direction*. It is a **capacity**
  measure (access-level complexity); per the AI Consciousness Charter it makes **no** claim of
  felt experience.

## Files
`MEOK_pci_experiment.png`, `pci_sweep.npy`, `pci_results.npy`.
