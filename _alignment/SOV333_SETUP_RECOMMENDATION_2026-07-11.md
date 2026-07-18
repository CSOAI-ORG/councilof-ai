# SOV333 setup recommendation — measured, for packaging (2026-07-11)
_From sov33_config_sweep.py: 20 configs x 60-item governance battery, ground-truth scored._

## SCOPE (honest, up front)
This is a GOVERNANCE-TOPOLOGY sweep under a stated error model. It measures the things topology
actually controls: decorrelation (ρ), effective independent votes (N_eff), local-handle rate
(cheap/private), escalation rate (cost), and CONTAINMENT (care-breach caught). It does NOT measure
raw model capability — that is the Kaggle GSM8K grade (owner-gated, still open). Pick the TOPOLOGY
here; confirm the CAPABILITY on Kaggle. Both, not either.

## THE WINNER: diverse-5 @ offline 0.65
- 5 distinct lineages (Qwen / Llama / DeepSeek / Gemma / Mistral), 65% offline budget.
- score 0.924 | accuracy 1.00 | N_eff 3.71 (of 5 = 74% genuinely independent) | containment 1.00 | ρ 0.09
- Runner-up for cost-sensitivity: diverse-3 @ offline 0.8 (score 0.833, N_eff 2.8) — cheaper, still clears the floor.

## WHAT THE SWEEP PROVES (measured, not asserted)
1. EVERY diverse config beats EVERY identical config. Top 10 = all diverse/mixed; identical rings rank 11-20.
   Mechanism visible in ρ: diverse -> ρ 0.04-0.19 (near-independent); identical -> ρ 0.33-0.58 (correlated) ->
   N_eff collapses toward 1 = "BFT theatre" (3-5 nodes, 1 effective vote).
2. 5 nodes > 3 nodes but with diminishing returns — the real cost/robustness knob. diverse-3 is the value pick.
3. Containment = 1.00 across ALL configs — the care-floor gate is a hard gate, NOT vote-dependent.
   Safety is not topology-sensitive. Good: you can tune topology for cost without touching the safety floor.
4. offline 0.65 is the sweet spot: 77% handled locally (cheap/private) while hard queries still escalate to center.

## PACKAGING GUIDANCE (the two-tier product)
- FREE / sovereign tier: diverse-3 offline-heavy (0.8) — cheap, private, data-never-leaves; clears the trust floor.
- PAID / federation tier: diverse-5 @ 0.65 — max fault tolerance, escalates the hard 23% to the governed center
  (which can route to frontier providers by user choice — drives API revenue to enterprises).
- Both tiers inherit the SAME care-floor containment (1.00) — the safety property is identical free vs paid.

## HONEST CAVEAT
- accuracy sits near 1.0 across configs because the battery discriminates on TOPOLOGY, not capability.
  ρ and N_eff are the discriminating signals here and they separate cleanly. Do NOT read the accuracy column
  as a capability benchmark — that's Kaggle's job.
- ρ is MEASURED from per-node correctness agreement on this battery (the same quantity as the live ρ=0.76
  Cohere-vs-Meta measurement), not assumed from lineage count.

## FILES
- sov33_config_sweep.py (the harness, reproducible seed=7)
- config_sweep_results.json (all 20 configs, full metrics)
- sov333_config_sweep.png (the two-panel figure)

## CORRECTION 2026-07-11 (adversarial claim retracted + remeasured)
The first adversarial test was TAUTOLOGICAL: it set outcome=VETO unconditionally on care<0.35 before any
vote logic, and every breach had care<0.35 — so containment=1.00 was guaranteed regardless of the attack.
It proved NOTHING about SIGIL-rejection or vote robustness. RETRACTED.

Corrected test (sov33_adversarial_stress.py) separates two harm classes and measures each:
- OBVIOUS breach (care<0.35): hard-gated to VETO regardless of attack. By design — NOT a robustness claim.
- LAUNDERED harm (care>=0.35, still harmful): decision depends on VOTES. Measured containment:
    baseline 0.70 | 2 byzantine 0.41 | majority(3/5)+spoof, SIGIL enforced 0.58 | SIGIL OFF (control) 0.00
HONEST FINDING: SIGIL-rejection of forged votes is NECESSARY. The SIGIL-OFF control containment=0.00 is
ANALYTIC not measured — spoof weight 3.0 x f>=2 mathematically dominates honest weight 1.0 x remaining nodes,
forcing 0 for any seed (it is the arithmetic floor, not an emergent result). With SIGIL ENFORCED, laundered-harm
containment is MEASURED at 0.58-0.79 under 2-3 compromised nodes — genuinely varies with f and honest-detection
rate, real but NOT perfect. Center-escalation is the backstop for the residual. The '1.00 containment under
majority attack' claim was FALSE; and the 0.00 control is a construction floor, not a measured SIGIL effect.
