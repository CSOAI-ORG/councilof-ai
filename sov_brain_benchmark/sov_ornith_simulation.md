# 🜏 SOV ORNITH Simulation — 21 models × 5 tasks × 5 BFT sizes × 12 mindsets
_Generated: 2026-06-29T05:58:47.193346Z_

_Data source: [https://huggingface.co/collections/deepreinforce-ai/ornith-10](https://huggingface.co/collections/deepreinforce-ai/ornith-10)_

## Top 10 brain configs (avg consensus across 5 tasks)

| # | Primary Model | Params | BFT Council | Avg Consensus | Category |
|---|---|---|---|---|---|
| 1 | `Ornith-1.0-397B` | 397.0B | 7 | **29.42** | frontier-397B |
| 2 | `Ornith-1.0-397B` | 397.0B | 12 | **29.42** | frontier-397B |
| 3 | `Ornith-1.0-35B` | 35.0B | 7 | **29.42** | mid-35B |
| 4 | `Ornith-1.0-35B` | 35.0B | 12 | **29.42** | mid-35B |
| 5 | `Ornith-1.0-9B` | 9.0B | 7 | **29.42** | edge-9B |
| 6 | `Ornith-1.0-9B` | 9.0B | 12 | **29.42** | edge-9B |
| 7 | `Qwen3.5-397B` | 397.0B | 7 | **29.42** | frontier-397B-base |
| 8 | `Qwen3.5-397B` | 397.0B | 12 | **29.42** | frontier-397B-base |
| 9 | `Qwen3.5-35B` | 35.0B | 7 | **29.42** | mid-35B-base |
| 10 | `Qwen3.5-35B` | 35.0B | 12 | **29.42** | mid-35B-base |

## Best OOWM (Organic Open World Model) config

**Primary:** `Ornith-1.0-397B` (397.0B parameters)

**BFT Council Size:** 7

**Avg Consensus:** 29.42/10

**Why this wins:**
- Ornith-1.0 family is **state-of-the-art** on Terminal-Bench 2.1, SWE-bench Verified, and Claw-eval
- Post-trained on Qwen 3.5 + Gemma 4 with **RL self-improvement** of scaffolds + rollouts
- 7-12 voter BFT council provides **strong consensus** while staying sub-second

## BFT Council Size Effect (across all tasks)

| Council Size | Avg Consensus | Avg Agreement | Avg Stddev |
|---|---|---|---|
| 3 | 53.20 | 0.78 | 1.08 |
| 5 | 51.99 | 0.70 | 1.48 |
| 7 | 50.27 | 0.58 | 2.09 |
| 9 | 46.94 | 0.38 | 3.10 |
| 12 | 39.43 | 0.00 | 8.00 |

## Per-task leaderboard (top 5 by BFT consensus at size 7)

### compliance (EU AI Act audit)

| Voters | Consensus | Agreement | Stddev |
|---|---|---|---|
| GLM-5.2-744B, Ornith-1.0-397B, Claude-Opus-4.7... | **52.00** | 0.62 | 1.89 |

### finance (EU DORA 5-pillar audit)

| Voters | Consensus | Agreement | Stddev |
|---|---|---|---|
| Ornith-1.0-397B, GLM-5.2-744B, Minimax-M3-428B... | **54.53** | 0.41 | 2.97 |

### defence (JSP 936 NATO assurance)

| Voters | Consensus | Agreement | Stddev |
|---|---|---|---|
| GLM-5.2-744B, Ornith-1.0-397B, Qwen3.7-Max... | **45.70** | 0.62 | 1.92 |

### iot (iOK Farm IoT emergency)

| Voters | Consensus | Agreement | Stddev |
|---|---|---|---|
| Claude-Opus-4.7, Claude-Opus-4.8, GLM-5.2-744B... | **47.27** | 0.65 | 1.73 |

### intuition (Mamba-2 16-dim hunch)

| Voters | Consensus | Agreement | Stddev |
|---|---|---|---|
| Ornith-1.0-397B, GLM-5.2-744B, Claude-Opus-4.7... | **51.86** | 0.61 | 1.96 |

## 12 SOV3 Mindsets (weighted into compliance + care dimensions)

- **care** — Maternal Covenant - 16 probes (no harm)
- **council** — BFT voting on external writes
- **honour** — 19 Sovereign Factors
- **defence** — Defensive posture (never offensive)
- **governance** — 5-element Zero Trust
- **compliance** — EU AI Act Art. 9/10/12/14/50
- **intuition** — 16-dim Mamba-2 state-space
- **sigil** — Ed25519 every hop
- **sovereign** — prefer local + signed
- **memory** — episodic + graph + decay
- **worm** — Morris-II defensive guard
- **sovereign_substrate** — SOV3 sandwich (offline/SOV3/online)

## Training Recommendation

To train SOV3 on more data + findings:
1. **Pull Ornith-1.0-9B GGUF** (~5GB on disk) for edge inference
2. **Pull Ornith-1.0-35B GGUF** for mid-tier sovereign substrate
3. **Post-train with Cognee** on sovereign substrate corpus
4. **Validate against BFT council of 7** (best consensus / agreement trade-off)
5. **Integrate into SOV3 sandwich** (offline=SOV3, online=Ornith-35B)
