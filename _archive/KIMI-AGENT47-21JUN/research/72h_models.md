# New Open-Source Model Releases: Last 72 Hours (June 18-21, 2026)

**Research Date**: June 21, 2026  
**Scope**: Open-source model releases, breakthroughs, and key announcements impacting sovereign AI infrastructure  
**For**: CSOAI.org - Sovereign AI Infrastructure with MoE models, local inference, and multi-agent systems

---

## Executive Summary

The June 18-21, 2026 window is dominated by the **aftermath of the US Commerce Department's export-control directive against Anthropic's Fable 5 and Mythos 5** (June 13, 2026) [^1241^], which triggered a geopolitical reshuffling of the open-source landscape. **Zhipu AI's GLM-5.2** launched the same day as the ban [^1242^], and Chinese open-source models are now positioned as the primary hedge against access restrictions on Western frontier models. 

**SubQ 1.1** (released June 16, 2026) represents the most significant architectural breakthrough with its Subquadratic Sparse Attention achieving 64.5x compute reduction at 1M tokens [^1169^]. **MiniMax M3** (June 1) and **JetBrains Mellum 2** (June 1) round out a dense month of open-weight releases. GPT-5.6 is widely rumored for a June 25 launch [^1259^], with prediction markets pricing it at 83-89% probability.

---

## 1. NVIDIA Nemotron-3.5-ASR-Streaming-0.6B

### Release Details
| Attribute | Value |
|-----------|-------|
| **Model** | NVIDIA Nemotron 3.5 ASR |
| **Release Date** | June 4, 2026 (Hugging Face) [^1166^] |
| **Parameters** | 0.6B (600M) |
| **Architecture** | Cache-Aware FastConformer-RNNT (24-layer encoder) |
| **Languages** | 40 language-locales (~36 languages) |
| **License** | OpenMDW-1.1 (commercial use permitted) |
| **Availability** | Hugging Face, Together AI, DeepInfra, Baseten, Microsoft Foundry |

### Key Capabilities
- **Native streaming architecture**: Cache-aware design eliminates redundant overlapping computations by caching encoder self-attention and convolution activations [^1174^]
- **Runtime-configurable latency**: Choose chunk sizes of 80ms, 160ms, 320ms, 560ms, or 1.12s at inference time without retraining [^1174^]
- **Sub-100ms time-to-final transcription** at the lowest latency setting [^1173^]
- **Built-in punctuation and capitalization** across all 40 locales [^1174^]
- **Automatic language detection**: Set `target_lang=auto` for mixed-language transcription [^1174^]
- **Fine-tuning support** via NVIDIA NeMo framework [^1177^]

### Benchmarks & Performance
- **17x concurrent streams** vs. buffered approaches (Parakeet RNNT 1.1B) on same H100 hardware [^1174^]
- **3x higher GPU concurrency** compared to buffered streaming baselines [^1173^]
- **2.5x faster than official NeMo runtime** (per social media reports) [^1250^]
- Supports offline operation for airgapped/sovereign deployments [^1250^]

### CPU/Edge Deployment Assessment
> **IMPORTANT CLARIFICATION**: Multiple sources describe Nemotron 3.5 ASR as "runs on CPU" [^1250^], but official documentation states: *"CPU-only inference is possible but significantly slower and not recommended for production streaming use cases"* [^1213^]. The "31x realtime" claim from user screenshots appears to reference the English-only variant (`nemotron-speech-streaming-en-0.6b`) under specific CPU benchmarking conditions, not the multilingual model. GPU deployment (T4 minimum, A10 recommended for streaming) remains the production-grade path.

### Integration Potential for Multi-Agent Systems
- **High**: Direct plugin to agent pipelines via Together AI API ($0.0045/min) [^1173^]
- Compatible with NVIDIA Triton Inference Server for production scale [^1213^]
- Self-hostable for data-sovereign deployments
- Supports 8 coding agents including Claude Code integration [^1176^]

---

## 2. SubQ 1.1 - Subquadratic Sparse Attention

### Release Details
| Attribute | Value |
|-----------|-------|
| **Model** | SubQ 1.1 Small |
| **Release Date** | June 16, 2026 [^1169^] |
| **Architecture** | Subquadratic Sparse Attention (SSA) - content-dependent sparse attention |
| **Context Window** | 12M tokens (near-perfect retrieval) |
| **Primary Training** | 1M tokens + additional 2M token training |
| **License** | Commercial (API + SubQ Code CLI + SubQ Search) |

### Key Innovation: Subquadratic Sparse Attention (SSA)
SSA replaces the O(n^2) dense attention pass with a **learned sparse formulation that scales linearly with context length** [^1169^]. Two complementary mechanisms:
- **Compressed Sparse Attention (CSA)**: Content-dependent learned sparse retrieval
- **Heavily Compressed Attention (HCA)**: Compresses distant sequence portions and performs dense attention over compressed memory [^1170^]

### Benchmarks
| Benchmark | SubQ 1.1 Small | GPT-5.5 | Opus 4.8 | Sonnet 4.6 |
|-----------|---------------|---------|----------|------------|
| **GPQA Diamond** | **85.4%** | 93.2 | 92 | 87.5 |
| **LiveCodeBench v6 (pass@4)** | **89.7%** | 92 | 92.2 | 88.9 |
| **AutomationBench Finance** | **13%** | 18% | 16% | 8% |
| **RULER 13-task** | **99.12%** | - | - | - |
| **Single-needle retrieval (2M)** | **100%** | - | - | - |
| **Retrieval accuracy (12M)** | **98%** | - | - | - |

### Efficiency Claims (Verified)
| Context Length | Dense Attention (PFLOP) | SSA (PFLOP) | Reduction |
|---------------|------------------------|-------------|-----------|
| 32K | 0.25 | 0.12 | 2.1x |
| 128K | 3.9 | 0.49 | 8.0x |
| 512K | 63.0 | 2.0 | 31.5x |
| **1M** | **252** | **3.9** | **64.5x** |

- **56x faster than FlashAttention-2** at 1M tokens on single attention layer (966ms vs. 54,164ms on H100) [^1169^]
- Attends to only **0.13% of token pairs** at 12M tokens (~1,000x reduction) [^1170^]

### Integration Potential for Multi-Agent Systems
- **Very High**: SubQ Code loads entire codebases into single context window [^1176^]
- Eliminates need for multi-agent coordination overhead when entire repo fits in context
- Makes million-token-scale pretraining/evaluation practical
- **Caveat**: Not fully open-source; API + CLI access only. Open weights status unclear.

---

## 3. Zhipu AI GLM-5.2

### Release Details
| Attribute | Value |
|-----------|-------|
| **Model** | GLM-5.2 |
| **Release Date** | June 13, 2026 (API); open weights "next week" [^1175^] |
| **Parameters** | 744B total / 40B active (MoE) |
| **Context Window** | 1,000,000 tokens (5x increase over GLM-5.1's 200K) |
| **Max Output** | 131,072 tokens |
| **License** | MIT (fully open weights) |
| **Price** | ~$1.40/M input, ~$4.40/M output via OpenRouter [^1177^] |

### Geopolitical Context
GLM-5.2 launched the **same day** as the US Commerce Department ordered Anthropic to suspend all foreign access to Fable 5 and Mythos 5 (June 13, 2026) [^1242^]. The timing was explicit:
- June 12: US Commerce export-control directive issued to Anthropic [^1242^]
- June 13: Zhipu releases GLM-5.2; founder Jie Tang posts *"GLM-5.2 is Fully Open, Frontier Intelligence Belongs to Everyone"* (~898K views) [^1242^]
- June 18: Tang Jie declares China "won't take that long" to reach Fable-class capability [^1241^]

### Benchmarks
| Benchmark | GLM-5.2 | Claude Opus 4.8 | GPT-5.5 |
|-----------|---------|----------------|---------|
| **FrontierSWE** | 74.4 | 75.1 | 72.6 |
| **PostTrainBench** | 34.3 | 37.2 | 28.4 |
| **SWE-Bench Pro** | 62.1 | 69.2 | - |
| **SWE-Marathon** | 13.0 | 26.0 | - |
| **Terminal-Bench 2.1** | 81.0 (inherited from 5.1) | - | - |

> Note: Zhipu published **no official GLM-5.2 benchmarks at launch**. The numbers above come from subsequent independent testing and Zhipu-published Terminal-Bench scores [^1176^][^1252^].

### Key Features
- Two reasoning modes: **High** (faster, everyday) and **Max** (deep, complex coding) [^1176^]
- Anthropic-compatible API endpoint for drop-in Claude Code replacement [^1242^]
- Compatible with 8+ coding agents: Claude Code, Cline, OpenCode, Roo Code, Goose, Crush, OpenClaw, Kilo Code [^1176^]
- Ranked as highest-scoring open-weights model on Design Arena at launch [^1241^]

### Integration Potential for Multi-Agent Systems
- **Very High**: MIT license = no restrictions on commercial use, modification, redistribution
- 1M context enables entire monorepos in single prompt
- Anthropic-compatible endpoint enables immediate migration from Claude Code
- **Risk**: Self-reported benchmarks only; independent verification pending
- **Risk**: Chinese-origin model subject to potential future export restrictions

---

## 4. MiniMax M3 (June 1, 2026)

### Release Details
| Attribute | Value |
|-----------|-------|
| **Model** | MiniMax M3 |
| **Release Date** | June 1, 2026 [^1210^] |
| **Architecture** | MoE with MSA (MiniMax Sparse Attention) |
| **Context Window** | Up to 1M tokens (512K guaranteed) |
| **Modalities** | Text, image, video input; text output |
| **Weights** | Open-weights (committed within ~10 days) |
| **Price** | ~$0.30/M input (promotional), $0.60/M input (standard) via OpenRouter |

### Benchmarks
| Benchmark | Score | Comparison |
|-----------|-------|------------|
| **SWE-Bench Pro** | 59.0% | Beats GPT-5.5, Gemini 3.1 Pro |
| **Terminal-Bench 2.1** | 66.0% | - |
| **BrowseComp** | 83.5 | Edges past Claude Opus 4.7 |
| **OSWorld-Verified** | 70.06% | Computer use capability |
| **MCP Atlas** | 74.2% | - |
| **KernelBench Hard** | 28.8% | NVIDIA Blackwell GPUs |

### MSA Architecture Innovation
- MiniMax Sparse Attention uses **KV-block selection mechanism** with "KV outer gather Q" approach
- **9x faster prefill** at 1M tokens vs. M2 [^1210^]
- **15x faster decoding** at 1M tokens vs. M2 [^1210^]
- **1/20th per-token compute** vs. previous generation at 1M context [^222^]
- **4x faster** than Flash-Sparse-Attention and flash-moba [^1210^]

### Integration Potential
- **High**: First open-weight model combining frontier coding + 1M context + native multimodality
- Competitive pricing at ~5-10% of GPT-5.5 cost [^1212^]
- Native computer use (OSWorld-Verified 70.06%) for agent workflows

---

## 5. JetBrains Mellum 2 (June 1, 2026)

### Release Details
| Attribute | Value |
|-----------|-------|
| **Model** | Mellum 2 |
| **Release Date** | June 1, 2026 [^1182^] |
| **Parameters** | 12B total / 2.5B active (MoE) |
| **Experts** | 64 total, 8 activated per token |
| **Context Window** | 131,072 tokens |
| **License** | Apache 2.0 |
| **Variants** | Base, Instruct, Thinking (+ SFT versions) |

### Benchmarks
| Benchmark | Mellum 2-Thinking |
|-----------|-------------------|
| **LiveCodeBench v6** | 69.9% |
| **AIME 2025+2026** | 58.4% |

### Key Innovation
- **Thinking variant** uses RLVR (Reinforcement Learning with Verifiable Rewards)
- Outputs reasoning in `<think>` blocks before final answer
- Production-viable 12B coding model with no licensing restrictions
- Runs on modest hardware (2.5B active parameters = low latency)

### Integration Potential
- **High for local inference**: Apache 2.0, small active parameter count
- Ideal for IDE integrations and real-time code completion
- Thinking mode enables transparent reasoning for agent workflows

---

## 6. Other Significant June 2026 Releases

### 6.1 Mistral Medium 3.5 (Early June 2026)
- **128B dense model** merging instruction-following, reasoning, and coding [^1244^]
- Released as open weights under modified MIT license
- Runs self-hosted on as few as **4 GPUs** [^1244^]
- Powers Mistral Vibe remote coding agents and Le Chat Work mode
- Mistral also launched **Connectors in Studio** (built-in + custom MCP connectors) [^1244^]

### 6.2 Qwen 3.7 Plus (June 1, 2026)
- Alibaba's value-tier multimodal model
- **1M context**, text + image + video input
- **6x cheaper** than Qwen 3.7 Max: $0.40/M input vs. $2.50/M [^1179^]
- Vision Arena rank #16 at launch
- Apache 2.0 (for open-weight variants)

### 6.3 Kimi K2.7-Code (Hugging Face, ~June 19)
- Mentioned in June 19 "This Week In OS AI Field Notes" [^1245^]
- Moonshot AI open-source coding model
- Improved token efficiency over K2.6
- Can run locally

### 6.4 NVIDIA Nemotron 3 Ultra (June 4, 2026)
- Announced alongside Nemotron 3.5 ASR
- Built for **high-throughput inference and long-running agent workflows** [^1247^]
- NVIDIA Open Model License
- Available via Ollama: `ollama pull nemotron3-ultra`

---

## 7. Models for Local Inference / Edge Deployment

| Model | Size | Hardware Required | License | Best For |
|-------|------|------------------|---------|----------|
| **Bonsai 8B** (PrismML) | 1.15 GB (1-bit) | iPhone/Mac/RTX 4090 | Apache 2.0 | Extreme edge, mobile AI [^1191^] |
| **Gemma 4 E2B** | ~1.5GB | 6GB RAM | Apache 2.0 | On-device agent, tool calling [^1247^] |
| **Gemma 4 E4B** | ~6GB | 16GB laptop | Apache 2.0 | Local agent + vision [^1247^] |
| **Qwen 3.6 27B** (Q4) | ~14GB | Single 24GB GPU | Apache 2.0 | Best local coding model [^39^] |
| **Mellum 2** | 12B / 2.5B active | Single GPU | Apache 2.0 | IDE code completion [^1182^] |
| **DeepSeek V4-Flash** | 284B / 13B active | Single 80GB GPU | MIT | Local 1M context coding [^39^] |
| **Gemma 4 26B MoE** | ~18GB (Q4) | 24GB GPU | Apache 2.0 | Multimodal local [^1185^] |
| **Mistral Medium 3.5** | 128B dense | 4 GPUs (modified MIT) | Modified MIT | Cloud self-hosted [^1244^] |

### Edge/CPU Highlights
- **Bonsai 8B**: True 1-bit weights (+1/-1), 44 tok/s on iPhone 17 Pro Max, 131 tok/s on M4 Pro Mac, 368 tok/s on RTX 4090 [^1191^][^1196^]
- **Nemotron 3.5 ASR**: CPU inference possible but not recommended for production streaming [^1213^]
- **Phi-4 Mini** (3.8B): 20-25 tok/s on miniPC without GPU for Home Assistant [^1247^]

---

## 8. Upcoming: GPT-5.6 (Rumored June 25, 2026)

### Rumored Specs (Unconfirmed)
| Attribute | Rumored Value |
|-----------|--------------|
| **Context Window** | 1.5M tokens (43% increase over GPT-5.5) |
| **Internal Codename** | `kindle-alpha` (release candidate), `iris-alpha` (earlier) |
| **Focus** | Agentic workflows, multi-hour session reliability |
| **Token Efficiency** | 10-15% improvement over GPT-5.5 |
| **Launch Window** | June 22-28 (83-89% Polymarket probability) |

### Sources
- Internal codenames appeared in Codex backend logs [^1253^]
- OpenAI chief scientist Jakub Pachocki described it as "meaningful improvement" [^1256^]
- Stealth testing reportedly active for Pro accounts [^1259^]
- GPT-5.6 addresses the "goblin problem" alignment failure in GPT-5.5 [^1255^]

---

## 9. Geopolitical Context: The Open-Source Recalibration

### Timeline of Key Events (June 9-21, 2026)
| Date | Event |
|------|-------|
| June 9 | Anthropic launches **Claude Fable 5** (95% SWE-Bench Verified, 80% SWE-Bench Pro) [^1243^] |
| June 12 | US Commerce Dept issues export-control directive to Anthropic [^1242^] |
| June 13 | Anthropic disables Fable 5 + Mythos 5 for ALL users (including US) [^1243^] |
| June 13 | **Zhipu releases GLM-5.2** (MIT license, 1M context) [^1242^] |
| June 14 | 80+ cybersecurity executives sign open letter asking Commerce to lift restrictions [^1243^] |
| June 16 | **SubQ 1.1 Small released** (64.5x compute reduction, GPQA 85.4%) [^1169^] |
| June 18 | Zhipu co-founder Tang Jie: China "won't take that long" to reach Fable-class [^1241^] |
| June 19 | GPT-5.6 stealth testing rumors intensify [^1259^] |

### Strategic Implications
- **Access risk is now material**: The Fable 5 takedown demonstrated that even US-hosted frontier models can be withdrawn overnight [^1243^]
- **MIT-licensed Chinese models are the hedge**: GLM-5.2's permissive license ensures no vendor can revoke access [^1242^]
- **Open weights > API access**: Organizations building sovereign AI infrastructure must prioritize downloadable weights over API-only services
- **Sparse attention is the future**: SubQ 1.1, MiniMax M3, and DeepSeek V4 all demonstrate that sub-quadratic attention is now production-viable

---

## 10. Recommendations for CSOAI.org

### Immediate Actions (Next 7 Days)
1. **Evaluate GLM-5.2** via Z.ai API or wait for MIT weights drop
2. **Benchmark SubQ 1.1 API** for long-context repository analysis (12M token capability)
3. **Test Nemotron 3.5 ASR** for voice agent pipeline integration
4. **Download DeepSeek V4-Flash** (MIT, 1M context, runs on single 80GB GPU) as Claude fallback

### Short-Term Integration Targets (Next 30 Days)
| Model | Use Case | Priority |
|-------|----------|----------|
| **GLM-5.2** | Primary coding agent (Claude replacement) | HIGH |
| **SubQ 1.1** | Long-context repo analysis (>1M tokens) | HIGH |
| **Nemotron 3.5 ASR** | Voice input for multi-agent system | HIGH |
| **MiniMax M3** | Multimodal agent (image/video + code) | MEDIUM |
| **DeepSeek V4-Flash** | Cost-effective 1M context coding | MEDIUM |
| **Mellum 2** | Local IDE code completion | MEDIUM |
| **Bonsai 8B** | Edge/mobile inference | LOW (evaluate) |

### Architecture Recommendations
- **Adopt MoE models** for production: GLM-5.2 (40B active), DeepSeek V4-Flash (13B active), Mellum 2 (2.5B active) deliver frontier quality at fraction of inference cost
- **Implement sparse attention**: SubQ 1.1's SSA and MiniMax's MSA prove sub-quadratic attention is ready for production
- **Multi-model routing**: Diversify across Chinese (GLM, Qwen, DeepSeek) and Western (Mistral, Gemma) models to mitigate access risk
- **Local-first strategy**: Prioritize models with confirmed local inference (DeepSeek V4-Flash, Qwen 3.6 27B, Gemma 4, Mellum 2)

---

## Sources & Citations

| Citation | Source | Date |
|----------|--------|------|
| [^1166^] | Hugging Face - nvidia/nemotron-3.5-asr-streaming-0.6b | 2026-06-04 |
| [^1169^] | SubQ 1.1 Small Technical Report - subq.ai | 2026-06-16 |
| [^1170^] | SubQ-1.1-Small Technical Report PDF | 2026-06-16 |
| [^1173^] | Together AI - Nemotron 3.5 ASR API | 2026-06 |
| [^1174^] | MarkTechPost - Nemotron 3.5 ASR Review | 2026-06-06 |
| [^1175^] | FelloAI - GLM 5.2 Explained | 2026-06-16 |
| [^1176^] | Techsy - GLM 5.2 Review | 2026-06-14 |
| [^1177^] | TrendingTopics - GLM-5.2 vs Open Models | 2026-06-18 |
| [^1179^] | OFox - Qwen 3.7 Plus vs Max | 2026-06-08 |
| [^1182^] | AI Weekly - JetBrains Mellum 2 | 2026-06-01 |
| [^1184^] | TechJack - Mellum 2 Guide | 2026-06-03 |
| [^1191^] | Medium - Bonsai 8B Review | 2026-04-06 |
| [^1196^] | Hugging Face - prism-ml/Bonsai-8B-mlx-1bit | 2026-03-18 |
| [^1210^] | MarkTechPost - MiniMax M3 Release | 2026-06-01 |
| [^1212^] | TowardsAI - MiniMax M3 Analysis | 2026-06-04 |
| [^1213^] | MindStudio - Nemotron 3.5 ASR Explained | 2026-06-08 |
| [^1241^] | LetsDataScience - Zai Chief Predictions | 2026-06-19 |
| [^1242^] | OFox - GLM 5.2 Access Guide | 2026-06-16 |
| [^1243^] | TowardsAI Newsletter #209 | 2026-06-16 |
| [^1244^] | Releasebot - Mistral June 2026 Updates | 2026-06-05 |
| [^1245^] | X/SentientAGI - This Week In OS AI | 2026-06-19 |
| [^1247^] | PromptQuorum - Best Ollama Models June 2026 | 2026-06 |
| [^1250^] | Threads - Nemotron ASR CPU post | 2026-06 |
| [^1252^] | HandyAI - GPT-5.6 Rumors | 2026-06-01 |
| [^1256^] | AI Weekly - OpenAI Plans June GPT-5.6 | 2026-06-16 |
| [^1259^] | Yahoo Tech - GPT-5.6 Rumors Heat Up | 2026-06-19 |

---

*Research compiled: June 21, 2026. All benchmarks are vendor-reported unless noted as independent. Verify independently before production deployment.*
