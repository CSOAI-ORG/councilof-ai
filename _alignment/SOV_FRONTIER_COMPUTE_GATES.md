# SOV Frontier Compute Gates (settled, in memory, bleeding-edge only, current generation)

**Date:** 2026-07-15 · **Lane:** Hermes/JEEVES · **Status:** IMMUTABLE

## Roster (confirmed from HuggingFace, current generation)
- **Kimi-K2.6** — 1.059T (trillion-param flagship)
- **DeepSeek-V4-Pro** — 861B, **MIT** (cleanest license)
- **GLM-5.2** — 753B, **MIT** (cleanest license)
- **DeepSeek-V4-Flash** — 158B, single-GPU, **MIT** (cheap frontier family)
- **Qwen3.6-35B** — single-GPU, **Apache** (cheap frontier family)

## Two paths (the fork that stops us being lost in time)
- **PATH 1 — CALL (token API)**: govern frontier TODAY, zero GPU. NVIDIA NIM is connected. DeepSeek/Kimi/GLM native APIs. ~$0.15–2 per million tokens. Limit: rent per-call, can't edit inner weights.
- **PATH 2 — HOST (own weights on Modal GPUs)**: per-model GPU count (int4). To LoRA/edit inner weights. Real money, Modal paygo.

## Dead paths (memorized so we never re-ask)
- ❌ SSH-spread across micro boxes (1-2GB RAM can't hold 300GB+, interconnect too slow)
- ❌ Mac hosting (sandbox can't reach, can't hold 300GB+)
- ❌ From-scratch pretrain (tens of millions, dead)

## Decision
- Govern top-3 now, no GPU spend → PATH 1 (NVIDIA NIM + native APIs + care-gate + SIGIL)
- Own/edit weights → PATH 2 (Modal multi-GPU; GLM-5.2 MIT = cleanest fork path)
- Cheap MIT/Apache single-GPU options: DeepSeek-V4-Flash 158B, Qwen3.6-35B

## Corrected history
- Was: Kimi-K2 1.03T / DeepSeek-V3 684B / GLM-4.5 358B (stale 2024-2025 generation)
- Now: Kimi-K2.6 1.059T / DeepSeek-V4-Pro 861B MIT / GLM-5.2 753B MIT (current generation, HF-confirmed)
- Plus: DeepSeek-V4-Flash 158B (MIT, single-GPU) and Qwen3.6-35B (Apache, single-GPU) for cheap frontier family
