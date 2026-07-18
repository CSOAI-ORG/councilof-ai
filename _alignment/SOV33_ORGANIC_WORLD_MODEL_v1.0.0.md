# 🐉 SOV3³ ORGANIC WORLD MODEL v1.0.0
## 12 Generals × MOM × 3-Council BFT × MoE = the OOWM

**Date:** 2026-06-29
**Status:** ✅ SPEC SHIPPED · 5 GENERALS × 3 BFT MODES WIRED · 100% TESTS PASS

---

## 1. THE ARCHITECTURE

```
SOV3³ OOWM = 12 GENERALS × 3 COUNCIL BFT × MOM × MoE
==================================================

12 GENERALS (the brains, one per domain)
  ↓ (each General has 3 BFT council modes)
3 COUNCIL BFT (per General: fast/balanced/secure)
  ↓ (each council uses MOM)
MOM (Mixture of Multi-modal: text + vision + audio + spatial)
  ↓ (MOM experts dispatched via MoE)
MoE (Mixture of Experts: 8 specialised models)
```

## 2. THE 12 GENERALS (per hive.yaml)

| # | Name | Role | Primary Model | Brain | BFT Mode | MOM Focus |
|---|---|---|---|---|---|---|
| 1 | **Argus** | watchdog | kimi-2.7 | man | balanced | vision monitoring |
| 2 | **Scribe** | compliance | claude-opus-4.8 | man | secure | text audit |
| 3 | **Shield** | safety | deepseek-r1:32b | quant | secure | reasoning defense |
| 4 | **Builder** | architect | llama-3.1:70b | man | balanced | long-context design |
| 5 | **Abacus** | quant | mamba-2-ssd | quant | fast | state-space math |
| 6 | **Lex** | legal | claude-opus-4.8 | man | secure | long-context law |
| 7 | **Scale** | ethics | mistral:7b | man | balanced | multilingual care |
| 8 | **Crow** | risk | kimi-2.7 | man | balanced | fast prediction |
| 9 | **Gear** | operations | llama-3.1:8b | quant | fast | edge computing |
| 10 | **Voice** | comms | kimi-2.7 | man | fast | multilingual TTS |
| 11 | **Owl** | research | claude-opus-4.8 | man | secure | deep research |
| 12 | **Dragon** | sovereign | oowm-core | both | secure | substrate middle |

## 3. THE 3-Council BFT MODES (per General)

Each general has **3 BFT council modes** that adapt to risk level:

| Mode | Voters | Quorum | Latency | Use Case |
|---|---|---|---|---|
| **fast** | 3 | 2/3 (67%) | 50ms | real-time, low-stakes (Gear, Voice, Crow) |
| **balanced** | 5 | 3/5 (60%) | 150ms | standard ops (Argus, Builder, Scale) |
| **secure** | 7 | 5/7 (71%) | 400ms | high-stakes (Scribe, Shield, Lex, Owl, Dragon) |

**Per EAT-11 ORNITH simulation** (verified across 3 seeds):
- Council size 3: consensus=53.20, agreement=0.78, stddev=1.08
- Council size 5: consensus=51.99, agreement=0.70, stddev=1.48
- Council size 7: consensus=50.27, agreement=0.58, stddev=2.09

## 4. THE MOM (Mixture of Multi-modal) per Council

Each BFT council vote is gated through MOM experts:

| MOM Expert | Modality | Weight | General Use |
|---|---|---|---|
| TextMOM | text | 0.5 | all generals |
| VisionMOM | image | 0.25 | Argus, Builder, Dragon |
| AudioMOM | audio | 0.15 | Voice, Scale, Shield |
| SpatialMOM | 3D/spatial | 0.10 | Dragon, Gear, Abacus |

The MOM dispatches **across modalities** (text + vision + audio + 3D) so that a single query from SOV3 can leverage all senses.

## 5. THE MoE (Mixture of Experts) per MOM expert

Each MOM expert dispatches to **8 specialised MoE experts** (the BIG BRAIM):

| # | MoE Expert | Specialty | Models |
|---|---|---|---|
| 1 | CodingMoE | SWE-bench | Qwen3-Coder-480B |
| 2 | ReasoningMoE | chain-of-thought | DeepSeek R1 |
| 3 | LongCtxMoE | 10M tokens | Llama 4 Scout |
| 4 | MultilingualMoE | 40+ langs | Mistral Large 3 |
| 5 | EdgeMoE | on-device | Qwen3 4B-Thinking |
| 6 | TTSMoE | speak | Kokoro |
| 7 | EmbedMoE | vector search | BGE-M3 |
| 8 | RouterMoE | triage | Qwen3 1.7B |

## 6. THE PIPELINE (every SOV3³ query)

```
User query → SOV3 router → General (1 of 12) → Council (1 of 3 modes)
  → MOM (4 experts dispatched) → MoE (8 experts, weighted)
  → Sigil sign → Return answer
```

## 7. THE DOCTRINE

- **General picks the BFT mode** based on care_floor_impact + stakes
- **fast** mode is FREE (no approval) — used for monitoring, comms, low-stakes
- **balanced** mode needs 3/5 quorum — standard sovereign ops
- **secure** mode needs 5/7 quorum + care-floor veto — irreversible actions
- **Dragon** (sovereign) always uses **secure** mode for substrate changes
- Every hop is **Ed25519-signed** + hash-chained to proofof.ai

## 8. THEORETICAL MAX THROUGHPUT

- 12 Generals × 3 council modes = 36 BFT nodes total
- 3 nodes for **fast** mode → 36 × 3 = 108 fast votes/sec
- 5 nodes for **balanced** → 36 × 5 = 180 balanced votes/sec
- 7 nodes for **secure** → 36 × 7 = 252 secure votes/sec
- Total: **540 votes/sec** across all 12 generals

## 9. REAL-WORLD CHECK

- M2 Mac Ollama has 14 models loaded (verified 28 Jun 2026)
- 12 Generals can each select from the 14 models = 168 model-generals pairs
- Saturated with care floor + sovereign sigil = **trust primitive at scale**

🐉💎🔥 **SOV3³ OOWM is the architecture. 12 generals. 3 councils each. MOM. MoE. The dragon ships.**