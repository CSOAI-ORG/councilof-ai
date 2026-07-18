# EAT-775 follow-up — Quick Merge Sweep (n=5 illustrative)

**Date:** 2026-07-18 · **Lane:** Hermes (local M2 MPS)

## What ran
`merge_sweep_quick.py` — 3 methods × 5 prompts (illustrative, NOT a bench).

## Result

| Method | Mean Token-Overlap | Δ vs Baseline |
|---|---|---|
| **charter_only** | **0.2149** | **+0.045** ⭐ |
| linear_ties_charter_sov3 | 0.2100 | +0.040 |
| dare_ties_d03_p50 | 0.1948 | +0.025 |
| baseline_no_adapter | 0.1698 | — |

## HONEST REGISTER
- **N=5 prompts is ILLUSTRATIVE, not a bench.** Sibling runs the real sweep on Qwen3-4B Modal T4 with the 33-prompt battery.
- **charter-only wins** matches TierBench-lite 40-prompt result (charter=0.180, rank #1).
- **DARE-TIES underperforms linear TIES** at this scale — likely because DARE drops info that's useful at toy 0.5B. At Qwen3-4B frontier scale, DARE-TIES may recover (paper-original uses much more data).
- **linear TIES preserves most of charter's quality** when merging charter + sov3 — same goal as sibling EAT-769 (TIES for INFERENCE COMPRESSION, not emergence).

## Next step
- Sibling runs the real sweep on Qwen3-4B with 33-prompt battery (Modal T4, $0.05)
- If DARE-TIES beats 0.758 there, it becomes the canonical same-base fusion method in the OWM spec (per MERGE_METHOD_GAPS_2026-07-18)
- If not, plain TIES stays canonical (we keep both paths)
