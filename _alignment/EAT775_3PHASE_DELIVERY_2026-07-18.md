# EAT-775 — SOV4 general-capabilities E2E (3 phases, lane-respecting)

**Date:** 2026-07-18 · **Source:** `plan_sov4-general-capabilities-e2e-adopt-best.json`
**Branch:** `m4-handoff-2026-06-24`

## PHASE 1 — Adopt measured-best merge
**Hermes deliverables (this commit):**
- `dare_ties_impl.py` — DARE + TIES (drop + rescale + sign-elect)
- `breadcrumbs_impl.py` — dual-mask (drop outliers + small) + TIES
- `merge_sweep_local.py` — measures all 7 on our 3 Qwen2.5-0.5B OWEMs
- 7 merged adapters ready: 4 DARE-TIES + 3 Breadcrumbs

**Sibling deliverables (Modal T4):**
- Run the sweep on Qwen3-4B pair (SOV4-T + OWEM)
- Report whether winner beats 0.758

**Merge sweep running in background on M2.** Will report when done.

## PHASE 2 — Multi-adapter fusion + oversight eye
**Hermes deliverables (this commit):**
- `sov33_oversight_eye.py` (7882 bytes) — consolidates signals into ONE verdict
  - Verdict: HEALTHY / DRIFT / NO_QUORUM / CARE_BREACH / BLIND
  - Reuses measure_rho + BFT + DRUM + care-floor
  - Self-test 5/5 PASS

**Sibling deliverables (Modal T4):**
- Multi-merge within Qwen3-4B family (5x adapters)
- Measure N-into-1 saturation

## PHASE 3 — Benchmark-fill + honest scorecard
**Hermes deliverables (this commit):**
- `SOV4_BENCHMARK_CARD_2026-07-18.json` — 20 cells tagged
  - 13 MEASURED
  - 3 GATED (no API key / no Modal credit)
  - 3 DESIGNED (spec only, no impl)
  - 1 INTEGRATED (sibling lane consumed)
  - 100/100 = BUILD-COMPLETENESS rubric, NOT frontier parity
  - Every cell honest about MEASURED / GATED / DESIGNED

**Sibling deliverables:**
- Verify regression 26/26 green after all builds
- Write final session scorecard

## HONEST REGISTER
- 100/100 = build-completeness rubric. Frontier parity = GATED.
- TIES-merge = 0.758 was on Qwen3-4B (sibling's lane). We're on Qwen2.5-0.5B.
- Sibling runs real sweep on Qwen3-4B Modal T4. Hermes runs on our 3 OWEMs.
- All numbers n=20-33 in-house, behavioural-grading caveated.

## EAT SEALs: 775
