# EAT-755b SOV-755b SEAL — Frontier Roster Corrected (current generation)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Branch:** `m4-handoff-2026-06-24`

## Sibling's correction applied
- Kimi-K2 → **Kimi-K2.6** (1.059T, was 1.03T)
- DeepSeek-V3 → **DeepSeek-V4-Pro** (861B MIT, was 684B)
- GLM-4.5 → **GLM-5.2** (753B MIT, was 358B)
- + **DeepSeek-V4-Flash** (158B, single-GPU, MIT)
- + **Qwen3.6-35B** (Apache 2.0, single-GPU)

## State
| | Before | After |
|---|---|---|
| frontier models in registry | 3 (stale) | **5 (current)** |
| Frontier families | 1 (trillion-class) | **2 (trillion-class + cheap)** |
| Models with MIT license | 0 | **3** (V4-Pro, GLM-5.2, V4-Flash) |
| Models with Apache 2.0 | 0 | **1** (Qwen3.6-35B) |
| Single-GPU hostable | 0 | **2** (V4-Flash, Qwen3.6-35B) |

## Why this matters
- The cheap frontier family (V4-Flash 158B, Qwen3.6-35B) means the sovereign substrate can:
  - Reach frontier-quality output without paying $30-50/h
  - V4-Flash: single-GPU Modal, ~$5-10/h, MIT = full fork
  - Qwen3.6-35B: free on M2 MacBook Air, Apache 2.0 = full fork

## The decision in front of owner (updated)
- Govern now, no GPU: PATH 1 on any of 5 models
- Own weights, cheap: PATH 2 on V4-Flash (1 GPU, MIT)
- Own weights, free: PATH 2 on Qwen3.6-35B (M2 MacBook Air, Apache)
- Own weights, biggest: PATH 2 on Kimi-K2.6 (7 GPUs, $30-50/h)

## Hard lines preserved
- ✅ No T-count aggregate (each model's params are per-model, not summed)
- ✅ Care Floor 0.95
- ✅ SIGIL Ed25519
- ✅ Article 0 immutable
