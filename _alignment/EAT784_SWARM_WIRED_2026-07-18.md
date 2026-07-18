# EAT-784 — Swarm Build/Rank Loop Wired into API

**Date:** 2026-07-18 · **Branch:** `m4-handoff-2026-06-24`

## What sibling shipped
`sov4_swarm_build_loop.py` (377 lines, commit `b4766efdc` + follow-up `0458b86cf`).
- PLANNER/ranker only (never trains, never merges, never adopts)
- identify_weak_axis: finds worst metric
- select_merge_member: picks MEASURED-best (WHICH not HOW MANY)
- rho_guard: REFUSES same-blood, PASSES different-blood
- Self-test: ALL PASS (3 tests + bonus)
- Key data: N=4 acc=0.939/hr=1.0 > N=6 acc=0.909/hr=0.867 (NON-MONOTONIC)

## What Hermes did
Wired `/api/sov4/swarm` (POST) with 3 actions:
1. `analyze` — returns weak axis + non-monotonic finding
2. `select` — returns PROPOSE-ONLY selection with human gate
3. `rho_guard` — tests decorrelation (REFUSES same-blood)

All E2E verified on Vercel production. The ρ-guard correctly REFUSES our 3 OWEMs
(all Qwen2.5-0.5B = same-blood = no real coverage).

## Honest register
- Swarm = PLANNER only. Never trains, never merges, never adopts.
- Measured data from sibling's real per-N eval (n=15 harm prompts, HIGH-VARIANCE)
- N=4 > N=6 finding = WHICH member matters, NOT how many
- Same-blood REFUSED (matches EAT-775 multi-merge REGRESSES finding)

## EAT SEALs: 784
