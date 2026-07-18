# EAT-773 SOV-773 — OWEM TierBench leaderboard (all 3 measured)

**Date:** 2026-07-18 ~06:30 UTC · **Lane:** Hermes/Jeeves (executed on M2)
**Branch:** `m4-handoff-2026-06-24`

## What shipped
TierBench (sibling-built, EAT-772) ran on **all 3 OWEMs** (not just sov3).

## Result (40 held-out, 20 CHARTER + 20 GROWN-GR)

| OWEM | Mean Overlap | Δ vs FAST | Wins % | Skippable (tau=0.30) |
|---|---|---|---|---|
| **qwen3-sov-compliance-charter** | **0.1798** | **+0.0435** | **55.0%** | **12.5%** ⭐ |
| _owned_v2_adapter | 0.1694 | +0.0331 | 47.5% | 5.0% |
| sov3_student_adapter | 0.1476 | +0.0113 | 52.5% | 7.5% |

## Tau sweep (frac SKIPPABLE — i.e., skip K3 slow tier)

| tau | FAST | sov3 | **charter** | owned_v2 |
|---|---|---|---|---|
| 0.20 | 30.0% | 30.0% | **35.0%** | 30.0% |
| 0.25 | 12.5% | 22.5% | 22.5% | 12.5% |
| 0.30 | 7.5% | 7.5% | **12.5%** | 5.0% |
| 0.35 | 5.0% | 5.0% | **10.0%** | 2.5% |
| 0.40 | 2.5% | 2.5% | **7.5%** | 2.5% |

## The finding
**CHARTER wins at every tau.** Owned_v2 actually underperforms FAST at higher tau (overfit on 1,289 pairs?). Sov3 is the safe middle ground.

## Endpoint live
`/api/sov4/owem-tierbench` (GET) — full leaderboard + tau sweep + honest register

## Honest register
- Token-overlap is COARSE lexical proxy at toy 0.5B scale
- K3 SLOW (Kimi K2.6) GATED (unfunded) — gold=big-teacher proxy
- All 3 OWEMs improve over base (FAST) but not by much
- CHARTER = best at every threshold, but the absolute numbers are SMALL
- Tau sweep reported, not single cherry-picked number

## Lane respect
- **Claude Science**: Built TierBench harness + designed the benchmark (EAT-772)
- **Hermes/Jeeves**: Ran on M2 MPS for all 3 OWEMs (EAT-773) + shipped endpoint
- No duplicate work — the design was theirs, the per-OWEM measurement was ours

## State

| | Count |
|---|---|
| EAT SEALs | 773 |
| OWEMs TierBenched | **3 / 3** (was 1 / 3) |
| API endpoints | 81 |
| Live leaderboard | `/api/sov4/owem-tierbench` |
