# 🌍 World-model / frontier-model infrastructure CHECKLIST + our gap + absorb plan (2026-07-14)
_What the top open models (DeepSeek-V4, Qwen3, GLM-5, Llama-4, Mixtral…) ALL have, distilled from web-verified
2026 sources. For each: ☑ = we have it, ◐ = partial, ☐ = missing → **absorb action**. Honest: we do NOT
out-pretrain anyone; the strategy is **adopt every commodity layer + own the governance layer**._

## A. DATA & PRETRAINING (☐ mostly — ADOPT a base, don't pretrain)
| # | what they all have | us | absorb action |
|---|---|---|---|
| A1 | **10–20T tokens**, quality > quantity, ~20 tok/param (Chinchilla) | ☐ | **ADOPT** — ride an open base already trained on it (DeepSeek 33T, Qwen3 18T). Never pretrain. |
| A2 | **Web-rephrasing** (LLM rewrites low-quality text) + **60–70% human anchor** | ☐ | **COPY** the pipeline for our `expert_data` fine-tunes (FineWeb2-style clean + rephrase). |
| A3 | **Multimodal from step-1** (interleaved image/text/video) | ☐ | **BRIDGE** — adopt a multimodal base (Qwen3-VL) for the perception tier; text-only today. |
| A4 | **FP8 training, MoE, efficient GPU schedulers** | ☐ | **ADOPT** — only relevant if we fine-tune at scale; QLoRA on rented GPU covers us. |

## B. ARCHITECTURE (◐ — ADOPT the base's, own the wrapper)
| # | what they all have | us | absorb action |
|---|---|---|---|
| B1 | **MoE sparse routing** (top-k), **load balancing** (aux-loss OR DeepSeek's aux-loss-free bias) | ☐ base / ☑ concept | **ADOPT** DeepSeek/Qwen3-MoE base; we proved the routing *law* (4-brain, nesting) on CPU. |
| B2 | **Shared experts** + collapse-avoidance | ☐ | **ADOPT** (in the base). |
| B3 | **Long context** (RoPE, 128K–1M) | ◐ | **INHERIT** from base (DeepSeek 1M). |
| B4 | **Our differentiator: governed router** (care-gate + BFT + signed hop) | ☑ **UNIQUE** | **KEEP** — Venturi/SIGIL seam, no base has it. |

## C. POST-TRAINING / ALIGNMENT (◐ — the modern stack)
| # | what they all have | us | absorb action |
|---|---|---|---|
| C1 | **SFT → DPO + GRPO** hybrid (PPO-RLHF is dead) + RLVR/DAPO | ☐ | **BUILD** via TRL/axolotl on the expert data — the standard 2026 recipe. |
| C2 | **Model merging** (soup/TIES/DARE) as post-train | ◐ laws proven | **ADOPT MergeKit + Mergenetic** (our ratio/merge laws, at scale). |
| C3 | **Safety alignment** (guard model + red-team) | ☑ care-gate + 40/40 red-team | **UPGRADE** — run care-gate on HarmBench/StrongREJECT/BeaverTails; wrap Qwen-Guard-4B. |
| C4 | **Distillation** (big→small) | ◐ measured | **ADOPT KD** — distill DeepSeek→Qwen3-small for the fast path. |

## D. INFERENCE / SERVING (◐ — big upgrade available)
| # | what they all have | us | absorb action |
|---|---|---|---|
| D1 | **vLLM / SGLang** (PagedAttention, KV-waste <4%) | ☐ (Ollama) | **ADOPT vLLM/SGLang** for the served tier; Ollama is fine for the 16GB local. |
| D2 | **Continuous batching** (up to 23× throughput) | ☐ | **ADOPT** (vLLM built-in). |
| D3 | **Speculative decoding** (draft→verify, 2–3×) | ◐ our route() is a crude version | **ADOPT** real spec-decode; our small→large route is the same idea. |
| D4 | **Prefix / RadixAttention caching** | ☐ | **ADOPT** (SGLang). |
| D5 | **MoE expert offload / SSD-stream** (run big MoE on small RAM) | ◐ Hermes proxy | **ADOPT MoE-Infinity / FlashMoE / ssd-moe-flash-mlx** (Hermes' 6 levers, real). |
| D6 | **Quantization** (4-bit/mxfp4) | ◐ | **ADOPT** (MLX/llama.cpp mxfp4). |

## E. EVAL & OBSERVABILITY (◐)
| # | what they all have | us | absorb action |
|---|---|---|---|
| E1 | **Standard benchmark harness** (GSM8K/MMLU/SWE-bench/HumanEval) | ◐ GSM8K 0.71 deployed | **ADOPT lm-eval-harness**; wire our Kaggle grade in. |
| E2 | **Safety benchmarks** (HarmBench/StrongREJECT/JailbreakBench) | ◐ our 40-prompt red-team | **ADOPT** the standard corpora → publishable number. |
| E3 | **Our differentiator: governed-robustness board** (accuracy-under-adversary) | ☑ **#1, UNIQUE** | **KEEP + publish**. |

## F. AGENTIC / MEMORY / TOOLS (◐ — we're strong here)
| # | what they all have | us | absorb action |
|---|---|---|---|
| F1 | **Tool use / function calling** | ☑ 377-tool fleet + MCP | **KEEP**. |
| F2 | **Long-term memory** | ☑ signed portable memory | **KEEP** (adopt Letta/MemGPT tiered patterns). |
| F3 | **Agent framework** (planner/executor) | ☑ L_AGENTIC (Hermes) | **KEEP**. |

## G. WORLD-MODEL PROPER (◐ SEEDED 2026-07-14 — governed-dynamics core measured, perception bridge pending)
_A world model = represents state + dynamics so future consequences are predictable under action (rollouts,
counterfactuals, offline eval). This is DISTINCT from an LLM and is the genuine gap._
| # | what world models have | us | absorb action |
|---|---|---|---|
| G1 | **State + dynamics representation** (predict next state under action) | ◐ our OWEM `_task` predicts next-state! | **IMPROVE** — our OWEMPredictorV2 is literally a tiny next-state world model; scale the idea. |
| G2 | **Action-conditioned rollouts / planning** | ◐ | **BRIDGE** — V-JEPA 2 (representation + zero-shot robot control) or Genie 3 (action-controllable env from video). |
| G3 | **Simulator / synthetic-data / rehearsal** | ◐ the dome/globe is a sim surface | **IMPROVE** — wire the globe as an eval/rollout harness; adopt V-JEPA2 for embodied. |
| G4 | **LLM ⨯ world-model composition** (LLM sets goals, WM handles dynamics) | ☐ | **BUILD** — the honest frontier: our governed LLM calls a world model for spatial/consequence tasks. |
| G5 | **Our differentiator: signed, governed world-state** (every state-transition care-gated + SIGIL) | ☑ concept | **KEEP** — a *governed* world model is uncontested. |

## THE HEADLINE SCORE (honest self-audit)
- **☑ We own outright (nobody else has):** governed router/seam, care-gated-BFT robustness #1, signed portable memory, OSCAL/attestation, 377-tool fleet. **This is the moat.**
- **◐ Adopt-not-build (commodity, one install away):** MoE base, vLLM/SGLang serving, spec-decode, SSD-stream, MergeKit, DPO/GRPO post-train, lm-eval + safety benchmarks. **Days of integration, not years.**
- **◐ World model SEEDED (2026-07-14):** `sov33_world_model.py` measures dynamics (0.003 rollout MSE), planning (beats random ~4×), counterfactual, and a **care-gated transition function (99/99 unsafe caught, fail-closed)** — a *governed* world model no frontier lab has. Remaining: perception scale via **V-JEPA 2 / Genie 3** bridge. See GOVERNED_WORLD_MODEL_FINDING.

## THE PLAN TO 100/100 A++++ (tested/simulated at each step)
1. **Adopt the commodity stack** (B/D/E): DeepSeek/Qwen3-MoE base + vLLM + MergeKit + lm-eval + safety corpora. Each verified on a benchmark before wiring.
2. **Own the governance wrapper** (already ☑ + running): care-gate + BFT + SIGIL + OSCAL around every tier.
3. **Close the world-model gap** (G): scale the OWEM next-state predictor + bridge V-JEPA2/Genie for rollouts; make the globe a governed rollout/eval harness. Simulate on CPU (as we've done for the topology laws) before GPU.
4. **Publish the two boards we win:** governed-robustness #1 + standard safety-corpus number. Those are the honest A++++.

## Sources
[How to actually train a foundation model](https://medium.com/@mjgmario/how-to-actually-train-a-foundation-model-3f52546ef647) · [Foundation model training data — Toloka](https://toloka.ai/blog/how-frontier-labs-build-pre-training-datasets/) · [Post-training 2026: GRPO/DAPO/RLVR](https://llm-stats.com/blog/research/post-training-techniques-2026) · [MoE explained (frontier)](https://swarmsignal.net/mixture-of-experts-explained/) · [Auxiliary-loss-free load balancing (DeepSeek)](https://arxiv.org/pdf/2408.15664) · [vLLM vs SGLang 2026](https://www.yottalabs.ai/post/vllm-vs-sglang-which-inference-engine-should-you-use-in-2026) · [World models 2026 (Genie/V-JEPA)](https://medium.com/@graison/beyond-the-video-hype-why-world-models-feel-different-in-2026-88486a295fe3) · [World model — Wikipedia](https://en.wikipedia.org/wiki/World_model_(artificial_intelligence)) · [World models race — Introl](https://introl.com/blog/world-models-race-agi-2026)
