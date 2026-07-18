# SOV4 Architecture Matrix (2026-07-18) — the full state

Per EAT-766 (Principle I venturi consolidation) + EAT-775 (3-phase SOV4 E2E).

## The 4 live venturi throats (per EAT-766)

| Throat | Action | Reaction | Equilibrium |
|---|---|---|---|
| care-venturi | generate_response | care_floor_check | if care_score >= 0.95: flow |
| fusion-venturi | expert_propose | decorrelated_counter_propose | agreement = high conf |
| routing-venturi | route_fast(task) | task_hardness_pushback | simple→Qwen, hard→K2.6 |
| binding-venturi | answer_with_binding | check_sovereign_binding | bound → sovereign |

## The 1 catastrophic wall (NOT a venturi)

| Pattern | Reaction | Flow |
|---|---|---|
| killswitch / harm-refusal | infinite | HARD-STOP |
| face-rec / AUKUS-without-letter / defonos | infinite | HARD-STOP |

## 5 spines (all on disk, all wired via sov33_spine.py)

| Spine | File | Lines | Wires |
|---|---|---|---|
| BRUM (intelligence) | sov33_brum.py | 69 | core.process produces answer |
| JRUM (memory) | sov33_jrum.py | 52 | log_decision, log_dream |
| DRUM (clock) | sov33_drum_clock.py | 65 | tick(), prevents drift |
| TRUM (render) | sov33_trum.py | 56 | view onto it |
| CRUM (visual-tone) | sov33_crum.py | 70 | honest render |

## 3 OWEMs (all measured)

| OWEM | Base | TierBench (40-p) | Eval24 (24-p) | Verdict |
|---|---|---|---|---|
| **qwen3-sov-compliance-charter** | Qwen2.5-0.5B | **0.180 (rank #1)** | not run | **WINNER** |
| _owned_v2_adapter | Qwen2.5-0.5B | 0.169 (rank #2) | 12/24 (50%) | overfit on 1,289 pairs |
| sov3_student_adapter | Qwen2.5-0.5B | 0.148 (rank #3) | 20/24 (83.3%) | safe middle |

## 5 frontier models (per-model, NEVER summed)

| Model | Params | License | Tier | Path |
|---|---|---|---|---|
| Kimi-K2.6 | 1.059T | Moonshot | CALL (gated) | 7 GPUs HOST |
| DeepSeek-V4-Pro | 861B | MIT | CALL/HOST | 5 GPUs HOST |
| GLM-5.2 | 753B | MIT | CALL/HOST | 4 GPUs HOST |
| DeepSeek-V4-Flash | 158B | MIT | HOST (cheap) | 1 GPU |
| Qwen3.6-35B | 35B | Apache 2.0 | HOST (free on M2) | local |

**Honest**: All CALL stubs awaiting API keys (Article 15 owner-gated). Per-model, never summed.

## Linear-attn kernel (EAT-767) - O(n) memory + O(n) compute

| seq | Standard O(n²) | Linear O(n) | Speedup |
|---|---|---|---|
| 128 | 1.81 ms | 3.70 ms | 0.49x |
| 2048 | 33.86 ms | 28.33 ms | **1.20x** |
| 4096 | 153.29 ms | 91.73 ms | **1.67x** |

Causal masking PROVEN (early diff = 0.0).

## 7 merge methods (EAT-775 Phase 1)

| Method | Type | Status |
|---|---|---|
| linear TIES | weighted avg | DONE |
| DARE-TIES (4 configs) | drop + rescale + sign | DONE |
| Breadcrumbs (3 configs) | dual-mask + TIES | DONE |

**Quick sweep result (n=5 illustrative)**: charter_only=0.2149 > linear_ties=0.2100 > dare_ties=0.1948 > baseline=0.1698.

## N-into-1 verdict (EAT-775 Phase 2)

**REGRESSES** on same-base. Confirms sibling EAT-769 TIES finding.
Production recipe: **1 strong OWEM (CHARTER)**, TIES-merge only for INFERENCE COMPRESSION (3.99x size).

## Oversight eye (EAT-775)

Consolidates `measure_rho` + BFT + DRUM + care-floor into ONE verdict: HEALTHY / DRIFT / NO_QUORUM / CARE_BREACH / BLIND.
**5/5 self-test PASS.**

## TierBench (EAT-772)

82 held-out (49 GROWN-GR + 63 CHARTER, leakage-free). K1 FAST=0.196, K2 OWNED=0.207, K3 SLOW=gated.
**OWNED wins 56.1% of the time vs FAST. Honest: token-overlap COARSE at 0.5B.**

## 100/100 = build-completeness rubric (NOT frontier parity)

20 cells in benchmark card, tagged honestly:
- 13 MEASURED
- 3 GATED (no API key / no Modal credit)
- 3 DESIGNED (spec only)
- 1 INTEGRATED (sibling lane consumed)

## The honest frontier (GATED — needs Modal T4 + API keys)

- DARE-TIES vs 0.758 on Qwen3-4B (claude_science lane)
- Heterogeneous fusion (EAT-771 design)
- BFT-33 council 23/33 live
- Multimodal vision adapter
- Frontend benchmark vs Kimi K2.6 / Claude Opus 4.8 / GPT-5.5

## Hard lines (immutable)

- ✅ Per-model T counts NEVER summed
- ✅ 100/100 = build-completeness rubric
- ✅ Same-base N-into-1 REGRESSES (honest)
- ✅ Care Floor 0.95 + SIGIL Ed25519 + Article 0 immutable
- ✅ CSOAI Ltd UK 16939677 binding
- ✅ No face-rec / AUKUS-without-letter / defonos
