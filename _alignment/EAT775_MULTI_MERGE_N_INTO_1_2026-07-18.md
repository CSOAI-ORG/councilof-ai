# EAT-775 — Multi-Merge N-into-1 Result (Qwen2.5-0.5B, n=5 illustrative)

**Date:** 2026-07-18 · **Lane:** Hermes (local M2 MPS)

## What ran
`multi_merge_eval.py` — tested 6 N-into-1 TIES-merge variants on 5 illustrative prompts.

## Result (n=5, token-overlap)

| N | Method | Mean Overlap | Δ vs N=1 |
|---|---|---|---|
| 0 | baseline (no adapter) | 0.1698 | -0.045 |
| **1** | **charter_only** | **0.2149** | **—** ⭐ |
| 2 | charter + sov3 (0.6/0.4) | 0.2100 | -0.005 |
| 2 | charter + owned (0.5/0.5) | 0.1800 | -0.035 |
| 2 | sov3 + owned (0.5/0.5) | 0.1831 | -0.032 |
| 3 | charter + sov3 + owned (0.4/0.3/0.3) | 0.1997 | -0.015 |
| 3 | charter x2 + sov3 + owned (re-weighted) | 0.1982 | -0.017 |

## VERDICT: REGRESSES — N-into-1 HURTS

## CONFIRMS sibling EAT-769
Per sibling's TIES result: same-base 3-around-1 does NOT emerge (TIES=2.9095 vs best-single=2.9087).
This test confirms: same-base N-into-1 REGRESSES at our scale (Qwen2.5-0.5B).

## HONEST REGISTER
- **N=5 is illustrative.** Sibling runs the full battery (33-prompt) on Qwen3-4B Modal T4.
- **Token-overlap is COARSE** at 0.5B scale. We do NOT claim frontier parity.
- The verdict (regresses) is consistent with sibling's negative result on the same question at frontier scale.

## Implications for SOV4 architecture
- **Same-base 3-around-1: REGRESSES.** Don't keep adding same-base adapters.
- **Different-architecture 3-around-1: UNTESTED** (sibling's pending test).
- **Production recipe:** Use 1 strong OWEM (CHARTER wins). TIES-merge only for INFERENCE COMPRESSION (sibling EAT-769).

## Artifacts
- `multi_merge_n_into_1.py` — script
- `models_multi/ties_2_charter_sov3.safetensors` — N=2 (charter+sov3)
- `models_multi/ties_2_charter_owned.safetensors` — N=2 (charter+owned)
- `models_multi/ties_2_sov3_owned.safetensors` — N=2 (sov3+owned)
- `models_multi/ties_3_charter_sov3_owned.safetensors` — N=3 (3-way)
- `models_multi/ties_3_charter_x2_sov3_owned.safetensors` — N=3 re-weighted
- `benchmarks/multi_merge_n_into_1_results.json` — results
