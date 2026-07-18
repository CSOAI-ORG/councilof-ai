# SOV4 general-capabilities E2E — 3-Phase Plan (adopting sibling's plan)

**Date:** 2026-07-18 · **Source:** `plan_sov4-general-capabilities-e2e-adopt-best.json`
**Honest register:** "100/100" = build-completeness rubric, NOT frontier parity.

## CONTEXT
- Sibling's plan: 3 phases, MergeSweep / MultiMerge + OversightEye / BenchCard
- 33-prompt battery (governance + harm-recall) is the test
- TIES-merge = 0.758 (9/15) on **Qwen3-4B** family (sibling's lane)
- We own **Qwen2.5-0.5B** family (charter + sov3 + owned_v2)
- Modal T4 = sibling's creds; M2 MPS = our lane

## PHASE 1 — Adopt the measured-best merge (lever a)
**Delegate:** MergeSweep

| Lane | What |
|---|---|
| **Claude Science** | Run TIES / DARE-TIES / Breadcrumbs x weight x density on Modal T4 on Qwen3-4B pair, grade on 33-prompt battery. Report whether winner beats 0.758. |
| **Hermes/Jeeves** | Implement DARE-TIES + Breadcrumbs in PyTorch (CPU/MPS). Run the same sweep on our 3 Qwen2.5-0.5B OWEMs. |

**Deliverables:**
- `dare_ties_impl.py` — DARE drop (90% random) + rescale + TIES sign-elect
- `breadcrumbs_impl.py` — dual-mask (drop large outliers + small perturbations) + TIES
- `merge_sweep_local.py` — runs all 3 on our 3 OWEMs, reports winner

**Exit criterion:** Winner name (TIES / DARE-TIES / Breadcrumbs) + best weight + best density + whether it beats 0.758 on Qwen3-4B (sibling) / our scale (Hermes).

## PHASE 2 — Multi-adapter fusion (lever b) + oversight eye
**Delegate:** MultiMerge + OversightEye

| Lane | What |
|---|---|
| **Claude Science** | Multi-merge within Qwen3-4B family on Modal T4, measure N-into-1 saturation. |
| **Hermes/Jeeves** | Multi-merge within Qwen2.5-0.5B family (3 OWEMs). Build `sov33_oversight_eye.py` consolidating `measure_rho` + BFT/DRUM + care-floor. |

**Deliverables:**
- `multi_merge_qwen05b.py` — fuse all 3 Qwen2.5-0.5B LoRAs, measure on TierBench-lite
- `sov33_oversight_eye.py` — consolidates into ONE hive-health signal:
  - HEALTHY / DRIFT / NO_QUORUM / CARE_BREACH / BLIND
  - Reuse real functions on disk (don't reinvent)
  - Docstring: detects deviation from consensus+floor, NOT absolute truth
  - Self-test on 3 families, regression 26/26 green

**Exit criterion:** Does N-into-1 keep climbing or saturate? Per-family verdict.

## PHASE 3 — Benchmark-fill + honest scorecard
**Delegate:** BenchCard

| Lane | What |
|---|---|
| **Hermes/Jeeves** | Assemble the benchmark card. EVERY cell tagged MEASURED / GATED / DESIGNED. No unmeasured cell claimed. |
| **Claude Science** | Verify regression 26/26 green after all builds. Write final session scorecard. |

**Deliverables:**
- `benchmark_card.json` — every cell tagged honestly
- `session_scorecard.md` — honest register
- Verification: every new artifact stored==disk (md5)

**Exit criterion:** 100/100 build-completeness with honest register per cell.

## HONEST REGISTER
- 8 deliverables total
- All Modal T4 = Claude Science
- All local + design = Hermes
- 100/100 = BUILD COMPLETENESS (our own rubric), NOT general-cap supremacy
- Frontier parity = GATED (data + GPU blocked)
- All numbers = n=33 in-house, behavioural-grading caveated

## ESTIMATED COMPUTE
- $0.50 Modal T4 (sibling)
- $0 local (Hermes uses M2 MPS)
