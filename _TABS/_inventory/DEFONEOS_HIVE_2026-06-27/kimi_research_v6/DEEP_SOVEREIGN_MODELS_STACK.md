# OPERATION DEEP: THE SOVEREIGN MODEL STACK
## Complete Open-Weight Intelligence Layer for DEFONEOS (July 2026)

> **CLASSIFICATION: INTERNAL USE**
> **LAST UPDATED: 2026-07-07**
> **STATUS: COMPLETE**

---

## TABLE OF CONTENTS

1. [Executive Summary](#1-executive-summary)
2. [The Complete Model Catalog](#2-the-complete-model-catalog)
   - 2.1 Large Models (70B+)
   - 2.2 Medium Models (13-70B)
   - 2.3 Small Models (1-13B)
   - 2.4 Specialized Models (Code, Vision, Math, Multilingual, Embedding, Speech, TTS)
3. [VRAM Requirements at Every Quantization Level](#3-vram-requirements)
4. [The DEFONEOS Model Assignment Matrix](#4-model-assignment-matrix)
5. [The Sovereign Deployment Architecture](#5-deployment-architecture)
6. [Model Router Design](#6-model-router-design)
7. [The $0 Model Stack](#7-zero-dollar-stack)
8. [Latest Breakthrough Models (Last 60 Days)](#8-latest-breakthroughs)
9. [HuggingFace Model IDs & Download Commands](#9-huggingface-ids)
10. [Quick Reference Cards](#10-quick-reference)

---

## 1. EXECUTIVE SUMMARY

This document defines the complete sovereign model stack for DEFONEOS -- a zero-cloud-dependency, fully open-weight intelligence layer covering every use case across defense, security, offense, and cyber operations.

### KEY PRINCIPLES
- **Zero Cloud Dependency**: All models run locally, no API keys, no data exfiltration
- **Open Weights Only**: Every model downloadable from HuggingFace (free)
- **Optimal Model Per Task**: No single model for everything -- each task gets the best tool
- **Tiered Deployment**: From edge devices (8GB) to strategic clusters (640GB+)
- **Total Cost: $0/month** (after hardware acquisition)

### THE STACK AT A GLANCE

| Tier | Hardware | Primary Models | Use Case |
|------|----------|---------------|----------|
| **Edge** | Jetson Orin Nano (8GB) | Qwen3-1.7B, Llama 3.2 1B, TinyLlama | Field devices, sensors, drones |
| **Tactical** | RTX 4090 (24GB) | Qwen3-7B, Llama 3.1 8B, Qwen3-14B | Single-unit analysis, C2 |
| **Operational** | 2x A100 80GB | Llama 4 Scout (109B Q4), Qwen3-72B, DeepSeek V3 | Battalion-level ops center |
| **Strategic** | 8x A100/H200 | Llama 4 Maverick (400B), DeepSeek V3.2 (671B), Kimi K2.6 | Theater command, strategic planning |

---

## 2. THE COMPLETE MODEL CATALOG (July 2026)

### 2.1 LARGE MODELS (70B+ Parameters)

These are the strategic-grade models requiring datacenter-class hardware. They deliver frontier-level performance on reasoning, coding, analysis, and strategic planning.

#### DeepSeek V3.2 / V4 (671B-1T MoE)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 671B total / 37B active (V3.2); ~1T total / 37B active (V4) |
| **Architecture** | Mixture of Experts (MoE) |
| **Context Window** | 128K tokens |
| **License** | MIT (most permissive) |
| **Best For** | Coding, reasoning, math, scientific analysis |
| **Benchmarks** | SWE-bench Verified ~70%, HumanEval 91.6%, GPQA Diamond 59.1% |
| **VRAM Requirements** | 8x H200 141GB @ FP8 (~$36/hr cloud); INT4: 4x H100 |
| **Speed** | ~33-120 tok/s depending on hardware |
| **Quantization** | FP8 (recommended), INT4, GGUF Q4 |
| **Why Sovereign** | MIT license allows unrestricted commercial use AND distillation |

#### Qwen3 72B (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 72B (dense, all active) |
| **Architecture** | Dense Transformer |
| **Context Window** | 128K tokens (1M via YaRN) |
| **License** | Apache 2.0 |
| **Best For** | General-purpose analysis, multilingual, document processing |
| **Benchmarks** | MMLU 85.3%, MATH 62.1%, Arena-Hard 89.4% |
| **VRAM Requirements** | INT4: 36GB (1x H100); FP16: 144GB (2x H100) |
| **Speed** | ~80-120 tok/s on H100 |
| **Quantization** | INT4, INT8, FP16, GGUF Q4/Q5 |
| **Why Sovereign** | Apache 2.0, exceptional Chinese/English bilingual |

#### Llama 4 Scout (109B MoE)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 109B total / 17B active |
| **Architecture** | MoE, 128 experts |
| **Context Window** | **10M tokens** (industry-leading) |
| **License** | Llama 4 Community License |
| **Best For** | Ultra-long context analysis, RAG, codebase analysis |
| **Benchmarks** | Strong on creative writing, multilingual, image understanding |
| **VRAM Requirements** | INT4: ~55GB (1x H100); FP16: ~218GB (4x H100) |
| **Speed** | 2600 tok/s (sparse inference) |
| **Quantization** | INT4, FP8, FP16 |
| **Why Sovereign** | 10M context window -- unique capability for ISR/log analysis |

#### Llama 4 Maverick (400B MoE)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 400B total / 17B active |
| **Architecture** | MoE, 128 experts |
| **Context Window** | 1M tokens |
| **License** | Llama 4 Community License |
| **Best For** | General-purpose powerhouse -- coding, chat, multimodal |
| **Benchmarks** | MMLU Pro 80.5%, LiveCodeBench 43.4%, outperforms GPT-4o on many tasks |
| **VRAM Requirements** | INT4: ~200GB (4x H100); FP16: ~800GB (8x H200) |
| **Speed** | ~126 tok/s on H100 DGX |
| **Quantization** | INT4, FP8, FP16 |
| **Why Sovereign** | Best long-context open model, native multimodal |

#### Mistral Large 3 (675B MoE)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 675B total / 41B active |
| **Architecture** | Sparse MoE |
| **Context Window** | 256K tokens |
| **License** | Apache 2.0 (most permissive for its class) |
| **Best For** | Instruction following, function calling, multilingual (40+ languages) |
| **Benchmarks** | MMLU Pro 73.1%, MATH-500 93.6%, #2 open-source non-reasoning |
| **VRAM Requirements** | INT4: ~62GB (1x H100); FP16: ~246GB (4x H100) |
| **Speed** | ~38 tok/s |
| **Quantization** | INT4, INT8, FP16 |
| **Why Sovereign** | Apache 2.0 (fully unrestricted), best-in-class multilingual |

#### DeepSeek R1 (671B MoE -- Reasoning Specialist)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 671B total / 37B active |
| **Architecture** | MoE with chain-of-thought |
| **Context Window** | 128K tokens |
| **License** | MIT |
| **Best For** | Step-by-step reasoning, math olympiad problems, strategic analysis |
| **Benchmarks** | Codeforces 2029 Elo (96.3 percentile), LiveCodeBench 65.9%, MATH-500 ~60% |
| **VRAM Requirements** | INT4: ~40GB (1x H100); FP16: ~140GB (2x H100) |
| **Speed** | ~24 tok/s |
| **Quantization** | INT4, FP8, FP16 |
| **Why Sovereign** | MIT license allows distillation -- many small reasoning models derived from R1 |

#### Kimi K2.6 (1T MoE -- Agentic Specialist)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 1T total / 32B active, 384 experts |
| **Architecture** | MoE with MLA attention |
| **Context Window** | 256K tokens |
| **License** | Modified MIT |
| **Best For** | Agentic coding, long-horizon autonomous execution, swarm orchestration |
| **Benchmarks** | SWE-bench Pro 58.6%, Terminal-Bench 66.7%, GPQA 90.5% |
| **VRAM Requirements** | INT4: ~630GB (8x H100); FP16: ~2TB |
| **Speed** | ~45-163 tok/s depending on provider |
| **Quantization** | INT4, FP4 |
| **Why Sovereign** | 300-agent swarm capability, 12-hour autonomous runs |

#### Qwen3.5 397B / Qwen3.6-35B (MoE Flagships)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 397B total / 17B active (Qwen3.5); 35B total / 3B active (Qwen3.6) |
| **Architecture** | MoE |
| **Context Window** | 256K (1M via YaRN) |
| **License** | Apache 2.0 |
| **Best For** | Agentic coding (Qwen3.6 beats 397B MoE on SWE-bench Pro) |
| **Benchmarks** | Qwen3.6-27B: beats Qwen3.5-397B on SWE-bench Pro |
| **VRAM Requirements** | Qwen3.5: 4x H100 (INT4); Qwen3.6-27B: 1x RTX 4090 |
| **Speed** | ~120 tok/s |
| **Quantization** | INT4, FP8, FP16 |
| **Why Sovereign** | Apache 2.0, Qwen3.6-27B = best coding model under 30GB VRAM |

### LARGE MODEL SUMMARY MATRIX

| Model | Size | License | Best At | VRAM (INT4) | Speed | Context |
|-------|------|---------|---------|-------------|-------|---------|
| **DeepSeek V3.2** | 671B/37B | MIT | Coding, reasoning | 4x H100 | 33-120 t/s | 128K |
| **DeepSeek R1** | 671B/37B | MIT | Math, reasoning | 1x H100 | ~24 t/s | 128K |
| **Qwen3 72B** | 72B dense | Apache 2.0 | General, multilingual | 1x H100 | 80-120 t/s | 128K-1M |
| **Llama 4 Scout** | 109B/17B | Llama License | Long context (10M!) | 1x H100 | 2600 t/s | 10M |
| **Llama 4 Maverick** | 400B/17B | Llama License | General powerhouse | 4x H100 | 126 t/s | 1M |
| **Mistral Large 3** | 675B/41B | Apache 2.0 | Multilingual, chat | 1x H100 | 38 t/s | 256K |
| **Kimi K2.6** | 1T/32B | Mod. MIT | Agentic coding, swarms | 8x H100 | 45-163 t/s | 256K |
| **Qwen3.6-27B** | 27B dense | Apache 2.0 | Best coding/VRAM ratio | 1x RTX 4090 | ~100 t/s | 256K-1M |

---

### 2.2 MEDIUM MODELS (13B-70B Parameters)

The workhorse tier -- single-GPU deployment, excellent performance for most operational tasks.

#### Qwen3 32B (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 32B dense |
| **Context Window** | 128K tokens |
| **License** | Apache 2.0 |
| **Best For** | Best single-GPU general-purpose model |
| **Benchmarks** | Superior to Qwen2.5-32B, rivals GPT-4o-mini |
| **VRAM Requirements** | INT4: ~16GB (1x RTX 4090); FP16: ~64GB (1x H100) |
| **Speed** | ~80-100 tok/s on RTX 4090 |
| **Quantization** | INT4, INT8, FP16, GGUF Q4-Q8 |

#### Qwen3 14B (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 14B dense |
| **Context Window** | 128K tokens |
| **License** | Apache 2.0 |
| **Best For** | Strongest 14B-class model for analysis and reasoning |
| **Benchmarks** | MMLU 79.7%, BBH 78.2% -- outperforms larger competitors |
| **VRAM Requirements** | INT4: ~7GB (1x RTX 3060); FP16: ~28GB (1x A100 40GB) |
| **Speed** | ~120+ tok/s on RTX 4090 |

#### Llama 3.3 70B (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 70B dense |
| **Context Window** | 128K tokens |
| **License** | Llama 3 License |
| **Best For** | Reliable instruction following, widely supported |
| **VRAM Requirements** | INT4: ~35GB (1x H100); FP16: ~140GB (2x H100) |
| **Speed** | ~40-60 tok/s on H100 |

#### Mistral Small 4 / Devstral 2
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 123B (Devstral 2) |
| **Context Window** | 256K tokens |
| **License** | Apache 2.0 |
| **Best For** | Cost-efficient coding agent |
| **Benchmarks** | SWE-bench Verified 72.2%, HumanEval 95.3% FIM |
| **VRAM Requirements** | INT4: ~62GB (1x H100) |
| **Speed** | ~137 tok/s |

#### Qwen2.5 32B/72B (Dense -- Battle-Tested)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 32B/72B dense |
| **Context Window** | 128K tokens |
| **License** | Apache 2.0 / Qwen License |
| **Best For** | Proven, stable, widely deployed |
| **Benchmarks** | 72B: MMLU 86.1%, MATH 62.1%, LiveBench 62.2% |
| **VRAM Requirements** | 32B INT4: ~16GB; 72B INT4: ~36GB |
| **Speed** | 32B: ~100 t/s; 72B: ~80 t/s |

#### Gemma 3 27B (Dense -- Google)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 27B dense (all active) |
| **Context Window** | 128K tokens |
| **License** | Gemma License (not OSI-approved, read carefully) |
| **Best For** | Best single-GPU local model (runs on 1 GPU) |
| **Benchmarks** | HumanEval 48.8%, MBPP 65.6% |
| **VRAM Requirements** | INT4: ~13.5GB (1x RTX 4090); FP16: ~54GB (1x A100) |
| **Speed** | ~59 tok/s |
| **Why** | Dense = simpler serving than MoE, runs anywhere |

#### Phi-4 14B (Microsoft -- Reasoning Specialist)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 14B dense |
| **Context Window** | 16K tokens |
| **License** | MIT |
| **Best For** | Math, reasoning, latency-bound applications |
| **Benchmarks** | Beats DeepSeek-R1-Distill-70B on AIME 2025, rivals o1-mini |
| **VRAM Requirements** | INT4: ~7GB; FP16: ~28GB |
| **Speed** | Very fast (small model) |
| **Special** | Phi-4-reasoning and Phi-4-reasoning-plus variants available |

#### DeepSeek Coder V2 (16B MoE)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 16B total / 2.4B active |
| **Context Window** | 128K tokens |
| **License** | DeepSeek License |
| **Best For** | Code completion, infilling (FIM) |
| **Benchmarks** | HumanEval 90.2%, MBPP 80.6% |
| **VRAM Requirements** | INT4: ~8GB (1x RTX 3070) |

### MEDIUM MODEL SUMMARY MATRIX

| Model | Size | License | Best At | VRAM (INT4) | Speed |
|-------|------|---------|---------|-------------|-------|
| **Qwen3.6-27B** | 27B dense | Apache 2.0 | Coding king (local) | 1x RTX 4090 | ~100 t/s |
| **Qwen3 32B** | 32B dense | Apache 2.0 | Best single-GPU general | 1x RTX 4090 | ~80 t/s |
| **Qwen3 14B** | 14B dense | Apache 2.0 | Best 14B class | 1x RTX 3060 | ~120 t/s |
| **Llama 3.3 70B** | 70B dense | Llama License | Reliable, widely supported | 1x H100 | ~50 t/s |
| **Mistral Small 4** | 123B | Apache 2.0 | Coding, function calling | 1x H100 | ~137 t/s |
| **Gemma 3 27B** | 27B dense | Gemma License | Best local single-GPU | 1x RTX 4090 | ~59 t/s |
| **Phi-4 14B** | 14B dense | MIT | Math, reasoning, edge | 1x RTX 3060 | ~150 t/s |
| **DeepSeek Coder V2** | 16B MoE | DeepSeek | Code FIM | 1x RTX 3070 | ~100 t/s |

---

### 2.3 SMALL MODELS (1B-13B Parameters)

The edge deployment tier -- fast, lightweight, runs on anything.

#### Qwen3 7B (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 7B dense |
| **Context Window** | 128K tokens |
| **License** | Apache 2.0 |
| **Best For** | Best 7B model -- beats many 13B competitors |
| **Benchmarks** | MMLU 74.2%, MATH 49.8%, HumanEval 57.9% |
| **VRAM Requirements** | Q4 GGUF: ~4.2GB; FP16: ~14GB |
| **Speed** | ~150+ tok/s on RTX 4090 |

#### Qwen3 4B-Thinking (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 4B dense |
| **Context Window** | 128K tokens |
| **License** | Apache 2.0 |
| **Best For** | Tiny reasoning model -- rivals Qwen2.5-72B on some tasks |
| **VRAM Requirements** | Q4 GGUF: ~2.5GB; FP16: ~8GB |
| **Speed** | ~200+ tok/s |
| **Special** | Hybrid thinking mode -- can reason step-by-step |

#### Qwen3 1.7B (Dense)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 1.7B dense |
| **Context Window** | 128K tokens |
| **License** | Apache 2.0 |
| **Best For** | Ultra-lightweight classification, router, simple tasks |
| **VRAM Requirements** | Q4 GGUF: ~1GB; FP16: ~3.4GB |
| **Speed** | ~300+ tok/s |

#### Llama 3.2 3B (Meta)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 3B dense |
| **Context Window** | 128K tokens |
| **License** | Llama 3 License |
| **Best For** | Edge deployment, vision+text multimodal |
| **VRAM Requirements** | Q4: ~2GB; FP16: ~6GB |
| **Speed** | ~11-18 tok/s (CPU edge device) |

#### Llama 3.2 1B (Meta)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 1B dense |
| **Context Window** | 128K tokens |
| **License** | Llama 3 License |
| **Best For** | Router model, classification, simplest edge tasks |
| **VRAM Requirements** | Q4: ~1.3GB; FP16: ~2GB |
| **Speed** | ~18 tok/s (CPU) |

#### Gemma 3 4B (Google)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 4B dense |
| **Context Window** | 128K tokens |
| **License** | Gemma License |
| **Best For** | Vision tasks at the edge |
| **VRAM Requirements** | Q4: ~2.5GB; FP16: ~8GB |

#### TinyLlama 1.1B
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 1.1B dense |
| **Context Window** | 2K tokens |
| **License** | Apache 2.0 |
| **Best For** | Router model (fast, tiny), classification |
| **VRAM Requirements** | Q4: ~600MB; FP16: ~2.2GB |
| **Speed** | Fastest small model |

#### Hunyuan 7B (Tencent)
| Attribute | Detail |
|-----------|--------|
| **Parameters** | 7B dense |
| **Context Window** | 256K tokens |
| **License** | Hunyuan Community License |
| **Best For** | Long-context edge tasks, hybrid reasoning |
| **VRAM Requirements** | Q4: ~4GB; FP16: ~14GB |

### SMALL MODEL SUMMARY MATRIX

| Model | Size | License | Best At | VRAM (Q4) | Speed |
|-------|------|---------|---------|-----------|-------|
| **Qwen3 7B** | 7B | Apache 2.0 | Best 7B overall | ~4.2GB | ~150 t/s |
| **Qwen3 4B-Thinking** | 4B | Apache 2.0 | Tiny reasoning | ~2.5GB | ~200 t/s |
| **Qwen3 1.7B** | 1.7B | Apache 2.0 | Classification, router | ~1GB | ~300 t/s |
| **Llama 3.2 3B** | 3B | Llama | Edge + vision | ~2GB | ~18 t/s (CPU) |
| **Llama 3.2 1B** | 1B | Llama | Ultra-light router | ~1.3GB | ~18 t/s (CPU) |
| **Gemma 3 4B** | 4B | Gemma | Edge vision | ~2.5GB | ~100 t/s (GPU) |
| **TinyLlama 1.1B** | 1.1B | Apache 2.0 | Fastest router | ~600MB | Fastest |
| **Hunyuan 7B** | 7B | Hunyuan | Long context edge | ~4GB | ~100 t/s |

---

### 2.4 SPECIALIZED MODELS

#### CODE MODELS

| Model | Size | License | Best At | VRAM (Q4) | Key Benchmark |
|-------|------|---------|---------|-----------|---------------|
| **Qwen3-Coder-480B** | 480B/35B MoE | Apache 2.0 | Best overall coding | 4x H100 | 69.6% SWE-bench Verified |
| **DeepSeek V3.2** | 685B MoE | MIT | Permissive license coding | 8x H200 | ~70% SWE-bench Verified |
| **Mistral Codestral 25.01** | Code specialist | Mistral | Code completion (FIM) | 1x H100 | 95.3% HumanEval FIM |
| **Qwen3.6-27B** | 27B dense | Apache 2.0 | Best local coding | 1x RTX 4090 | Beats 397B MoE |
| **gpt-oss-120b** | 117B/5.1B MoE | Apache 2.0 | Competition coding | 2x H100 | 2622 Codeforces Elo |
| **Devstral 2** | 123B | Apache 2.0 | Agentic coding | 1x H100 | 72.2% SWE-bench Verified |
| **GLM-5.1** | 744B/40B MoE | MIT | Long-horizon agentic eng | 4x H100 | Terminal-Bench 2.0 SOTA |
| **MiniMax M3** | MoE (MSA) | Open weights | Frontier + 1M context | 8x H100 | 59% SWE-bench Pro |

#### VISION MODELS

| Model | Size | License | Best At | VRAM (Q4) | Key Benchmark |
|-------|------|---------|---------|-----------|---------------|
| **Qwen2-VL / Qwen3-VL 72B** | 72B | Qwen License | Best open vision model | 2x H100 | DocVQA 96.5% |
| **InternVL 2.5** | Various | Apache 2.0 | General vision-language | 1x H100 | Strong across benchmarks |
| **LLaVA 1.6/1.7** | 7B-34B | Apache 2.0 | Most popular vision model | 1x RTX 4090 (13B) | Good general performance |
| **Florence-2** | 0.23B-0.77B | MIT | Vision tasks at edge | <2GB | OCR, detection, captioning |
| **Qwen3-VL 2B** | 2B | Apache 2.0 | Edge vision | ~1.5GB | Cross-modal retrieval 0.988 |

#### MATH MODELS

| Model | Size | License | Best At | VRAM (Q4) | Key Benchmark |
|-------|------|---------|---------|-----------|---------------|
| **DeepSeek R1** | 671B/37B MoE | MIT | Reasoning, math olympiad | 1x H100 | 2029 Codeforces Elo |
| **Qwen Math 72B** | 72B | Apache 2.0 | Mathematical reasoning | 1x H100 | MATH 62.1% |
| **Phi-4-reasoning-plus** | 14B | MIT | Best small reasoning model | 1x RTX 3060 | Beats R1-Distill-70B |
| **NuminaMath 7B** | 7B | Apache 2.0 | Fine-tuned for math | ~4GB | MATH competition |

#### MULTILINGUAL MODELS

| Model | Size | License | Languages | Best At |
|-------|------|---------|-----------|---------|
| **Mistral Large 3** | 675B/41B MoE | Apache 2.0 | 40+ native | Best multilingual large |
| **Aya 23** | 8B-35B | Apache 2.0 | 23 languages | Research multilingual |
| **Tower Instruct** | 7B | Apache 2.0 | 10 languages | Translation specialist |
| **Qwen3 72B** | 72B | Apache 2.0 | 119 languages | Best Chinese+English |

#### EMBEDDING MODELS

| Model | Size | License | Dimensions | Max Tokens | MTEB Score |
|-------|------|---------|------------|------------|------------|
| **BGE-M3** | 568M | MIT | 1024 | 8192 | 0.940 cross-lingual |
| **GTE-large-en-v1.5** | Large | Apache 2.0 | 1024 | 8192 | 65.4 |
| **E5-large-v2** | Large | MIT | 1024 | 512 | 62.0 |
| **Jina-embeddings-v3/v4** | 3.8B | Apache 2.0 | 1024 | 8192 | 65.5 / 0.985 cross-lingual |
| **nomic-embed-text-v1.5** | 137M | Apache 2.0 | 768 | 8192 | 62.3 |
| **Qwen3-Embedding-8B** | 8B | Apache 2.0 | Various | Various | MMTEB SOTA |

**Recommendation for DEFONEOS**: Use **BGE-M3** as primary embedding model (best cross-lingual for intelligence documents), **Jina v4** for high-accuracy English retrieval.

#### SPEECH MODELS (STT)

| Model | Size | License | Speed | Best At |
|-------|------|---------|-------|---------|
| **Whisper large-v3** | 1.5B | MIT | Baseline | Best accuracy |
| **Faster-Whisper** | 1.5B | MIT | 4x faster | Production STT |
| **Distil-Whisper** | 756M | MIT | 6x faster | Near-Whisper quality, fast |
| **SenseVoice** | Various | MIT | Fast | Multilingual (100+ languages) |
| **Whisper.cpp** | 1.5B | MIT | Edge-optimized | llama.cpp-compatible edge |

**Recommendation for DEFONEOS**: Use **Faster-Whisper** for operational STT, **Whisper.cpp** for edge devices, **SenseVoice** for multilingual/intercept.

#### TEXT-TO-SPEECH (TTS) MODELS

| Model | Size | License | VRAM | Voice Clone | Quality |
|-------|------|---------|------|-------------|---------|
| **Kokoro TTS** | 82M | Apache 2.0 | <1GB | No (presets) | 1424 Elo, 4.48 UTMOS |
| **Fish Speech** | 500M | Apache 2.0 | ~4GB | Yes (10-30s) | 4.1 MOS |
| **Piper** | 6-60M | MIT | <100MB (CPU) | No | 3.5 MOS, fastest |
| **XTTS v2** | 467M | CPML (non-comm) | ~4GB | Yes (6s) | 1388 Elo |
| **StyleTTS 2** | Various | MIT | ~4GB | Yes | High quality |
| **F5-TTS** | 336M | CC-BY-NC 4.0 | ~4GB | Yes (5-15s) | 4.1 MOS |
| **Dia** | 1.6B | Apache 2.0 | ~5GB | Yes (audio prompt) | 4.0 MOS |
| **Mistral Voxtral TTS** | ~4.1B | CC BY-NC 4.0 | 8GB | Yes (3s) | Beats ElevenLabs |
| **Qwen3 TTS** | Various | Commercial | API | No | 1450 Elo |
| **Zonos** | Various | Apache 2.0 | ~4GB | Yes | High quality |

**Recommendation for DEFONEOS**:
- **Field/edge**: Piper (tiny, CPU-only, fast)
- **General**: Kokoro (best Apache 2.0, <1GB)
- **High-quality**: Fish Speech (Apache 2.0, voice cloning)
- **Cloning**: Dia (Apache 2.0, 1.6B, excellent quality)

---

## 3. VRAM REQUIREMENTS AT EVERY QUANTIZATION LEVEL

### 3.1 BY MODEL SIZE (DENSE MODELS)

| Model Size | FP16 | INT8 | GPTQ-4bit | AWQ-4bit | GGUF Q4_K_M | GGUF Q2_K |
|------------|------|------|-----------|----------|-------------|-----------|
| **1B** | 2GB | 1GB | 0.7GB | 0.7GB | 0.6GB | 0.4GB |
| **3B** | 6GB | 3GB | 2GB | 2GB | 1.8GB | 1.1GB |
| **7B** | 14GB | 7GB | 4.5GB | 4.5GB | 4.2GB | 2.5GB |
| **14B** | 28GB | 14GB | 9GB | 9GB | 8.4GB | 5GB |
| **27B** | 54GB | 27GB | 17GB | 17GB | 16GB | 9.5GB |
| **32B** | 64GB | 32GB | 20GB | 20GB | 19GB | 11GB |
| **70B** | 140GB | 70GB | 40GB | 40GB | 42GB | 24GB |
| **72B** | 144GB | 72GB | 41GB | 41GB | 43GB | 25GB |
| **109B** | 218GB | 109GB | 62GB | 62GB | 65GB | 38GB |
| **405B** | 810GB| 405GB| 230GB | 230GB | 240GB | 140GB |

### 3.2 BY MODEL SIZE (MoE MODELS -- Total/Active)

| Model | Total/Active | FP16 (total) | INT4 (total) | Active Params FP16 | Notes |
|-------|-------------|--------------|--------------|-------------------|-------|
| **DeepSeek V3/V3.2** | 671B/37B | 1342GB | ~400GB | 74GB | VRAM for ALL experts loaded |
| **DeepSeek V4** | 1T/37B | 2000GB | ~600GB | 74GB | Requires 8x H200 minimum |
| **DeepSeek R1** | 671B/37B | 1342GB | ~400GB | 74GB | Same architecture as V3 |
| **Llama 4 Scout** | 109B/17B | 218GB | ~55GB | 34GB | Fits on single H100 @ INT4 |
| **Llama 4 Maverick** | 400B/17B | 800GB | ~200GB | 34GB | 4x H100 @ INT4 |
| **Mistral Large 3** | 675B/41B | 1350GB | ~400GB | 82GB | Apache 2.0 advantage |
| **Kimi K2.6** | 1T/32B | 2000GB | ~630GB | 64GB | 8x H100 minimum |
| **Qwen3.5 397B** | 397B/17B | 794GB | ~199GB | 34GB | 4x H100 @ INT4 |
| **Qwen3-Coder-480B** | 480B/35B | 960GB | ~240GB | 70GB | Best coding model |
| **MiniMax M3** | MoE (MSA) | Large | Large | Low | 1M context, sparse attn |

### 3.3 GPU SELECTION GUIDE

| GPU | VRAM | Max Model (INT4) | Models It Can Run |
|-----|------|-----------------|-------------------|
| **Jetson Orin Nano** | 8GB | 7B Q4 (tight) | Qwen3 1.7B, Llama 3.2 1B, TinyLlama, Piper TTS |
| **RTX 3060 12GB** | 12GB | 7B Q8 or 14B Q4 | Qwen3 7B Q8, Phi-4 14B Q4, Whisper.cpp |
| **RTX 4090 24GB** | 24GB | 32B Q4 or 70B Q4 | Qwen3 32B Q4, Llama 3.3 70B Q4, Qwen3.6-27B |
| **A100 40GB** | 40GB | 70B Q4 (with headroom) | Llama 3.3 70B Q4, Qwen3 32B FP16 |
| **A100 80GB** | 80GB | 70B FP8 or 109B Q4 | Llama 4 Scout Q4, Mistral Large 3 Q4, DeepSeek R1 Q4 |
| **H100 80GB** | 80GB | 80GB | Same as A100 80GB but faster (Transformer Engine) |
| **H200 141GB** | 141GB | 141GB | Single-GPU 70B FP16, or larger MoE models |
| **4x H100** | 320GB | 400B+ Q4 | Llama 4 Maverick Q4, Qwen3.5 397B Q4 |
| **8x H200** | 1128GB | 1T+ FP8 | DeepSeek V3.2 FP8, Kimi K2.6, anything |

### 3.4 QUANTIZATION QUALITY GUIDE

| Quant | Size vs FP16 | Quality | Use Case |
|-------|-------------|---------|----------|
| **FP16** | 100% | 100% (baseline) | Training, fine-tuning, best quality |
| **FP8** | 50% | ~99.5% | H100+ optimized, excellent quality |
| **INT8** | 50% | ~99% | Good quality, smaller than FP16 |
| **Q8_0 (GGUF)** | ~50% | ~99% | Near-lossless, llama.cpp |
| **Q6_K (GGUF)** | ~38% | ~98% | Excellent quality, moderate size |
| **Q5_K_M (GGUF)** | ~32% | ~98% | Sweet spot for most use cases |
| **Q4_K_M (GGUF)** | ~28% | ~97% | **Community sweet spot** -- best size/quality |
| **Q3_K_M (GGUF)** | ~22% | ~93% | Acceptable for chat, quality drops |
| **Q2_K (GGUF)** | ~18% | ~85% | **Cliff zone** -- use smaller model + better quant instead |

**Rule of Thumb**: Small model + high quantization > Large model + low quantization.
A 7B Q5_K_M outperforms a 13B Q2_K.

---

## 4. THE DEFONEOS MODEL ASSIGNMENT MATRIX

### 4.1 PRIMARY ASSIGNMENTS

| Use Case | Model | Tier | Why |
|----------|-------|------|-----|
| **Threat intelligence analysis** | Qwen3 72B INT4 | Operational | Best analysis + multilingual for foreign intel |
| **Code generation (security tools)** | Qwen3.6-27B INT4 | Tactical | Best coding/VRAM ratio, Apache 2.0 |
| **Code generation (strategic)** | Qwen3-Coder-480B INT4 | Strategic | Highest SWE-bench score |
| **Malware analysis/reverse engineering** | DeepSeek V3.2 FP8 | Strategic | Best reasoning + code understanding |
| **Document analysis (long)** | Llama 4 Scout INT4 | Operational | 10M context = entire document libraries |
| **Document analysis (standard)** | Qwen3 32B INT4 | Tactical | Best single-GPU for analysis |
| **Chat / command interface** | Mistral Large 3 INT4 | Operational | Apache 2.0, 40+ languages, function calling |
| **Vision / ISR (tactical)** | Qwen2-VL 72B INT4 | Operational | Best open vision model |
| **Vision / ISR (edge/drone)** | Florence-2 | Edge | Tiny, runs on anything, OCR + detection |
| **Vision / ISR (edge, multimodal)** | Qwen3-VL 2B | Edge | 2B, good vision, Apache 2.0 |
| **Speech transcription (ops)** | Faster-Whisper large-v3 | Operational | 4x faster than Whisper |
| **Speech transcription (intercept)** | SenseVoice | Operational | 100+ languages |
| **Speech transcription (edge)** | Whisper.cpp tiny/base | Edge | Runs on CPU |
| **TTS (field comms)** | Piper | Edge | CPU-only, 6-60M params, instant |
| **TTS (general)** | Kokoro | Tactical | 82M, Apache 2.0, best quality/VRAM |
| **TTS (high-fidelity)** | Fish Speech | Operational | Voice cloning, 500M, Apache 2.0 |
| **Router / classification** | Qwen3 1.7B INT4 | Edge | 300 tok/s, ultra-light |
| **Router (simpler)** | TinyLlama 1.1B | Edge | 600MB, fastest routing |
| **Long context analysis** | Llama 4 Scout INT4 | Operational | 10M tokens = unique capability |
| **Strategic planning** | DeepSeek R1 INT4 | Strategic | Best reasoning, math, strategic analysis |
| **Edge inference (drone/UxV)** | Qwen3 4B-Thinking | Edge | 2.5GB, can reason step-by-step |
| **Edge inference (sensor)** | Llama 3.2 1B | Edge | 1.3GB, classification, alerts |
| **Math / crypto analysis** | Phi-4-reasoning-plus | Tactical | Beats 70B models on math |
| **Multilingual intercept** | Mistral Large 3 INT4 | Operational | 40+ native languages |
| **Embedding / RAG** | BGE-M3 | All tiers | Best cross-lingual retrieval |
| **Embedding (high-accuracy)** | Jina v4 | All tiers | 0.985 cross-lingual score |
| **Red team / offensive coding** | DeepSeek V3.2 | Strategic | Best code generation |
| **Blue team / defensive analysis** | Qwen3 72B | Operational | Best analysis + tool use |
| **Network log analysis** | Llama 4 Scout INT4 | Operational | 10M context = all logs at once |
| **Vulnerability research** | Kimi K2.6 INT4 | Strategic | Agentic coding, 300-agent swarms |
| **Autonomous agent systems** | MiniMax M3 | Strategic | 1M context + frontier coding |

### 4.2 USE CASE → HARDWARE MAPPING

| Use Case | Edge (8GB) | Tactical (24GB) | Operational (160GB) | Strategic (640GB+) |
|----------|-----------|-----------------|---------------------|---------------------|
| Classification | Qwen3 1.7B | Qwen3 7B | Qwen3 14B | -- |
| Chat/Command | -- | Qwen3 7B/14B | Mistral Large 3 | Llama 4 Maverick |
| Code Generation | -- | Qwen3.6-27B | Qwen3 72B | Qwen3-Coder-480B |
| Document Analysis | -- | Qwen3 32B | Llama 4 Scout | Llama 4 Maverick |
| Vision/ISR | Florence-2 | LLaVA 13B | Qwen2-VL 72B | -- |
| Speech | Whisper.cpp | Faster-Whisper | Faster-Whisper large | -- |
| TTS | Piper | Kokoro | Fish Speech | -- |
| Reasoning | Qwen3 4B-Thinking | Phi-4-reasoning | DeepSeek R1 | DeepSeek R1 FP16 |
| Embedding | nomic-embed | BGE-M3 | BGE-M3 | Jina v4 |
| Long Context | -- | -- | Llama 4 Scout | Llama 4 Scout FP16 |

---

## 5. THE SOVEREIGN DEPLOYMENT ARCHITECTURE

### 5.1 TIER DEFINITIONS

```
                    ┌──────────────────────────────────────┐
                    │         STRATEGIC TIER                │
                    │    8x H200 141GB = 1,128GB VRAM      │
                    │    or 8x H100 80GB = 640GB VRAM       │
                    │                                       │
                    │  - DeepSeek V3.2/V4 (full precision) │
                    │  - Kimi K2.6 (agentic swarms)        │
                    │  - Llama 4 Maverick (1M context)     │
                    │  - Qwen3-Coder-480B                  │
                    │  - GLM-5.1 (long-horizon agents)     │
                    │  - MiniMax M3 (1M context)           │
                    │                                       │
                    │  Throughput: 10K+ requests/day       │
                    │  Latency: <2s TTFT, >50 tok/s        │
                    └──────────────┬────────────────────────┘
                                   │  100Gbps interconnect
                    ┌──────────────▼────────────────────────┐
                    │         OPERATIONAL TIER              │
                    │    2x A100 80GB = 160GB VRAM          │
                    │    or 2x H100 80GB                    │
                    │                                       │
                    │  - Llama 4 Scout (10M context)       │
                    │  - Mistral Large 3 (multilingual)    │
                    │  - DeepSeek R1 (reasoning)           │
                    │  - Qwen3 72B (general)               │
                    │  - Qwen2-VL 72B (vision)             │
                    │                                       │
                    │  Throughput: 5K requests/day         │
                    │  Latency: <1s TTFT, >80 tok/s        │
                    └──────────────┬────────────────────────┘
                                   │  10Gbps network
                    ┌──────────────▼────────────────────────┐
                    │          TACTICAL TIER                │
                    │    1x RTX 4090 24GB VRAM              │
                    │    or 1x A100 40GB                    │
                    │                                       │
                    │  - Qwen3.6-27B (coding)              │
                    │  - Qwen3 32B (general)               │
                    │  - Phi-4-reasoning (math)            │
                    │  - LLaVA 13B (vision)                │
                    │  - Faster-Whisper (STT)              │
                    │  - Kokoro TTS                        │
                    │                                       │
                    │  Throughput: 1K requests/day         │
                    │  Latency: <500ms TTFT, >100 tok/s    │
                    └──────────────┬────────────────────────┘
                                   │  WiFi/Mesh
                    ┌──────────────▼────────────────────────┐
                    │            EDGE TIER                  │
                    │    Jetson Orin Nano 8GB               │
                    │    or Raspberry Pi + Coral TPU        │
                    │    or LattePanda Mu                   │
                    │                                       │
                    │  - Qwen3 1.7B (classification)       │
                    │  - Llama 3.2 1B/3B (alerts)          │
                    │  - Qwen3 4B-Thinking (reasoning)     │
                    │  - Florence-2 (vision/OCR)           │
                    │  - Whisper.cpp (STT)                 │
                    │  - Piper TTS                         │
                    │                                       │
                    │  Throughput: 100 requests/day        │
                    │  Latency: <200ms (CPU)               │
                    └───────────────────────────────────────┘
```

### 5.2 NETWORK TOPOLOGY

```
┌─────────────────────────────────────────────────────────────────┐
│                      AIR-GAPPED NETWORK                         │
│                    (NO EXTERNAL CONNECTION)                      │
│                                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐      │
│  │  Edge 1  │  │  Edge 2  │  │  Edge 3  │  │  Edge N  │      │
│  │ (Drone)  │  │ (Sensor) │  │ (Field)  │  │ (Relay)  │      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘      │
│       │ Mesh/WiFi    │             │             │             │
│       └──────────────┴─────────────┴─────────────┘             │
│                         │                                       │
│              ┌──────────▼──────────┐                            │
│              │   Tactical Hub      │                            │
│              │   (RTX 4090 24GB)   │                            │
│              └──────────┬──────────┘                            │
│                         │ 10Gbps                                │
│              ┌──────────▼──────────┐                            │
│              │  Operational Center │                            │
│              │ (2x A100 80GB)      │                            │
│              └──────────┬──────────┘                            │
│                         │ 100Gbps                               │
│              ┌──────────▼──────────┐                            │
│              │ Strategic Command   │                            │
│              │ (8x H200 141GB)     │                            │
│              └─────────────────────┘                            │
│                                                                 │
│  Model Registry (internal):                                     │
│  - All models downloaded from HuggingFace pre-deployment        │
│  - Air-gapped after initial download                            │
│  - Internal HF-compatible registry (e.g., Harbor + chartmuseum) │
└─────────────────────────────────────────────────────────────────┘
```

### 5.3 INFERENCE SERVING OPTIONS

| Server | Best For | Quantization | GPU Support | Speed |
|--------|----------|-------------|-------------|-------|
| **vLLM** | Production serving, high throughput | FP8, INT4, GPTQ, AWQ | CUDA, ROCm | Fastest for batched |
| **Ollama** | Easy deployment, development | GGUF (all levels) | CUDA, Metal, CPU | Good for dev |
| **SGLang** | Complex agentic workflows | FP8, INT4 | CUDA | Very fast |
| **llama.cpp** | Edge/CPU, GGUF, maximum compatibility | GGUF (all levels) | CUDA, Metal, Vulkan, CPU | Fastest for CPU |
| **TensorRT-LLM** | NVIDIA-optimized production | FP8, FP4 | CUDA only | Maximum NVIDIA speed |
| **KTransformers** | Ultra-large models (1T+) | Various | CUDA | For 100B+ models |
| **ExLlamaV2** | Local GPTQ/EXL2 | GPTQ, EXL2 | CUDA | Fast local serving |

**Recommended Stack**:
- **Production**: vLLM (dockerized, batched inference)
- **Development**: Ollama (simple, flexible)
- **Edge**: llama.cpp (maximum compatibility)
- **NVIDIA-optimized**: TensorRT-LLM (maximum throughput)

---

## 6. MODEL ROUTER DESIGN

### 6.1 ARCHITECTURE

```
User Query
    │
    ▼
┌──────────────────┐
│  Query Parser    │  ──> Extract intent, length, language, urgency
│  (<1ms)          │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐     NO
│  Rule-Based      │────>┌──────────────────┐
│  Fast Filter     │     │  LLM Router      │
│  (keyword/heur)  │     │  (Qwen3 1.7B)    │
└────────┬─────────┘     │  (<5ms)          │
         │ YES           └────────┬─────────┘
         ▼                        │
┌──────────────────┐              ▼
│  Model Selection │     ┌──────────────────┐
│  (confidence     │     │  Fallback to     │
│   > 0.8)         │     │  Qwen3 32B       │
└────────┬─────────┘     │  (safe default)  │
         │               └──────────────────┘
         ▼
┌──────────────────┐
│  Route to        │
│  Selected Model  │
└──────────────────┘
```

### 6.2 ROUTER CATEGORIES

| Category | Keywords/Patterns | Assigned Model | Hardware Tier |
|----------|-------------------|---------------|---------------|
| **code** | "write", "function", "debug", "python", "rust", "exploit", "payload" | Qwen3.6-27B (tactical) / Qwen3-Coder-480B (strategic) | Tactical/Strategic |
| **analysis** | "analyze", "report", "intelligence", "assess", "evaluate" | Qwen3 72B (ops) / Qwen3 32B (tactical) | Operational/Tactical |
| **chat** | "help", "explain", "what is", "how to", conversation | Mistral Large 3 (ops) / Qwen3 7B (tactical) | Operational/Tactical |
| **vision** | "image", "photo", "video", "ISR", "surveillance", "detect" | Qwen2-VL 72B (ops) / Florence-2 (edge) | Operational/Edge |
| **speech** | "transcribe", "audio", "intercept", "recording" | Faster-Whisper (ops) / Whisper.cpp (edge) | Operational/Edge |
| **math** | "calculate", "encrypt", "decrypt", "statistical", "optimize" | Phi-4-reasoning-plus (tac) / DeepSeek R1 (ops) | Tactical/Operational |
| **creative** | "draft", "write report", "compose", "generate" | Llama 4 Scout (ops) / Qwen3 32B (tac) | Operational/Tactical |
| **classification** | "classify", "label", "sort", "categorize", "threat level" | Qwen3 1.7B (edge) | Edge |
| **long_context** | "document", "entire file", "all logs", "full report" (long input) | Llama 4 Scout (10M context) | Operational |
| **edge** | "urgent", "alert", "sensor", "drone", "field" (low latency) | Qwen3 4B-Thinking / Llama 3.2 1B | Edge |

### 6.3 ROUTER MODEL OPTIONS

| Option | Model | Size | Speed | Accuracy | Notes |
|--------|-------|------|-------|----------|-------|
| **Option A (Recommended)** | Qwen3 1.7B INT4 | ~1GB | <5ms | ~92% | Fast, Apache 2.0, good zero-shot |
| **Option B** | TinyLlama 1.1B Q4 | ~600MB | <3ms | ~88% | Fastest, smallest |
| **Option C** | Custom 0.5B classifier | ~300MB | <2ms | ~95% | Fine-tuned for specific categories |
| **Option D** | Heuristic only | 0MB | <1ms | ~85% | No model needed, keyword-based |

### 6.4 ROUTER TRAINING (OPTIONAL FINE-TUNING)

If fine-tuning a custom router:

```python
# Training data format
router_training_data = [
    {"query": "Analyze this network traffic for anomalies", "category": "analysis"},
    {"query": "Write a Python port scanner", "category": "code"},
    {"query": "Transcribe this radio intercept", "category": "speech"},
    {"query": "Classify threat level: CRITICAL", "category": "classification"},
    {"query": "Review these 500 pages of intelligence reports", "category": "long_context"},
    # ... 1000+ examples per category
]

# Fine-tune Qwen3 1.7B or train custom classifier
# Expected: 95%+ accuracy, <5ms inference
```

### 6.5 FALLBACK LOGIC

```python
def route_query(query: str, context: dict) -> ModelAssignment:
    """
    DEFONEOS Model Router
    Returns optimal model for query with confidence score
    """
    # 1. Fast heuristic filter (<1ms)
    heuristic_match = fast_keyword_match(query)
    if heuristic_match.confidence > 0.95:
        return heuristic_match

    # 2. LLM router (<5ms)
    router_output = router_model.classify(query)
    if router_output.confidence > 0.8:
        return router_output

    # 3. Context-based override
    if context.get("urgency") == "CRITICAL":
        return assign("edge", "Qwen3 4B-Thinking")  # Fastest capable
    if context.get("input_length") > 100000:
        return assign("long_context", "Llama 4 Scout")
    if context.get("hardware_tier") == "edge":
        return assign("edge", "Qwen3 4B-Thinking")

    # 4. Safe fallback
    return assign("general", "Qwen3 32B")  # Never wrong, just potentially overkill
```

### 6.6 ROUTER PERFORMANCE TARGETS

| Metric | Target | Maximum |
|--------|--------|---------|
| Routing latency | <5ms | <10ms |
| Routing accuracy | >95% | -- |
| False positive (wrong category) | <3% | <5% |
| Fallback rate | <10% | <15% |
| End-to-end (query to first token) | <100ms | <200ms |

---

## 7. THE $0 MODEL STACK (COMPLETE)

### 7.1 COST BREAKDOWN

| Component | Tool | Cost | License |
|-----------|------|------|---------|
| **Model downloads** | HuggingFace (all) | $0 | Various (all open) |
| **Inference serving** | vLLM + Ollama | $0 | Apache 2.0 |
| **Router** | Custom Python + Qwen3 1.7B | $0 | Apache 2.0 |
| **Quantization** | llama.cpp (GGUF) + AutoGPTQ | $0 | MIT/Apache 2.0 |
| **Vector DB (RAG)** | Milvus / Qdrant / pgvector | $0 | Apache 2.0 |
| **Monitoring** | Prometheus + Grafana | $0 | Apache 2.0 |
| **Orchestration** | Docker + Kubernetes | $0 | Apache 2.0 |
| **Load balancing** | HAProxy / nginx | $0 | GPL/Apache 2.0 |
| **TOTAL** | | **$0/month** | |

### 7.2 COMPLETE MODEL INVENTORY (Download All)

```bash
#!/bin/bash
# DEFONEOS Model Download Script
# Run once to download entire sovereign stack
# All models: freely available on HuggingFace

# ========== EDGE TIER ==========
# Router / classification
ollama pull qwen3:1.7b
ollama pull tinyllama:latest

# Edge inference
ollama pull qwen3:4b
ollama pull llama3.2:1b
ollama pull llama3.2:3b

# Edge vision
ollama pull gemma3:4b

# ========== TACTICAL TIER ==========
# General purpose
ollama pull qwen3:7b
ollama pull qwen3:14b
ollama pull qwen3:32b

# Coding
ollama pull qwen3.6:27b

# Reasoning
ollama pull phi4:latest

# Vision
ollama pull llava:13b

# TTS
pip install piper-tts
pip install kokoro-onnx

# STT
pip install faster-whisper

# ========== OPERATIONAL TIER ==========
# Large models (requires A100/H100)
ollama pull qwen3:72b
ollama pull llama4:scout
ollama pull mistral-large3:latest
ollama pull deepseek-r1:70b

# Vision
ollama pull qwen2-vl:72b

# Embedding
pip install FlagEmbedding  # BGE-M3

# ========== STRATEGIC TIER ==========
# Requires 4-8x H100/H200
# Download manually from HuggingFace:
# - deepseek-ai/DeepSeek-V3.2
# - deepseek-ai/DeepSeek-R1
# - meta-llama/Llama-4-Maverick
# - Qwen/Qwen3-Coder-480B-A35B
# - minimax/MiniMax-M3
# - moonshotai/Kimi-K2.6

# Run with vLLM:
# vllm serve deepseek-ai/DeepSeek-V3.2 --quantization fp8
# vllm serve meta-llama/Llama-4-Maverick --quantization int4
```

### 7.3 SERVING CONFIGURATION

```yaml
# docker-compose.yml - DEFONEOS Model Stack
version: '3.8'

services:
  # Router service
  router:
    image: defoneos-router:latest
    build: ./router
    ports:
      - "8080:8080"
    environment:
      - ROUTER_MODEL=qwen3:1.7b
      - DEFAULT_MODEL=qwen3:32b
    depends_on:
      - vllm-tactical
      - vllm-operational

  # Tactical tier (RTX 4090 class)
  vllm-tactical:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0
    volumes:
      - /models:/models
    command: >
      --model /models/Qwen3-32B-INT4
      --tensor-parallel-size 1
      --max-num-seqs 256
      --port 8001
    ports:
      - "8001:8001"

  # Operational tier (2x A100)
  vllm-operational:
    image: vllm/vllm-openai:latest
    runtime: nvidia
    environment:
      - CUDA_VISIBLE_DEVICES=0,1
    volumes:
      - /models:/models
    command: >
      --model /models/Qwen3-72B-INT4
      --tensor-parallel-size 2
      --max-num-seqs 128
      --port 8002
    ports:
      - "8002:8002"

  # Ollama (edge/development)
  ollama:
    image: ollama/ollama:latest
    runtime: nvidia
    volumes:
      - ollama-data:/root/.ollama
    ports:
      - "11434:11434"

  # Monitoring
  prometheus:
    image: prom/prometheus:latest
    volumes:
      - ./prometheus.yml:/etc/prometheus/prometheus.yml
    ports:
      - "9090:9090"

  grafana:
    image: grafana/grafana:latest
    ports:
      - "3000:3000"
    depends_on:
      - prometheus

volumes:
  ollama-data:
```

### 7.4 CAPACITY ESTIMATES

| Tier | Hardware | Concurrent Users | Daily Requests | Avg Response Time |
|------|----------|-----------------|----------------|-------------------|
| Edge | Jetson 8GB | 1-2 | 100-500 | <5s (CPU) |
| Tactical | RTX 4090 | 4-8 | 1,000-5,000 | <2s |
| Operational | 2x A100 | 16-32 | 5,000-20,000 | <1s |
| Strategic | 8x H200 | 64-128 | 20,000-100,000 | <500ms |

**Total Stack Capacity**: 50,000+ requests/day across all tiers.

---

## 8. LATEST BREAKTHROUGH MODELS (LAST 60 DAYS)

### 8.1 JUNE 2026 RELEASES

#### MiniMax M3 (June 1, 2026)
- **Architecture**: MoE with MSA (MiniMax Sparse Attention)
- **Context**: 1M tokens (512K guaranteed)
- **Modalities**: Text, image, video in; text out
- **Benchmarks**: 59.0% SWE-bench Pro, 66.0% Terminal-Bench 2.1, 74.2% MCP Atlas
- **Significance**: First open-weight model to combine frontier coding + 1M context + native multimodal
- **Price**: $0.60/$2.40 per 1M tokens (API); weights free
- **License**: Modified MIT (open weights, commercial conditions apply)
- **VRAM**: Requires 8x H100+ for full deployment
- **Impact**: Changes long-context agentic coding -- can process entire codebases + video

#### Voxtral TTS by Mistral (March 23, 2026)
- **Architecture**: 3.4B autoregressive + 390M acoustic + 300M codec = ~4.1B total
- **VRAM**: BF16 = 8GB; quantized = 3GB
- **Languages**: 9 (EN, FR, DE, ES, NL, PT, IT, HI, AR)
- **Features**: Zero-shot voice cloning with 3s reference, cross-lingual
- **Benchmark**: 68.4% win rate vs ElevenLabs Flash v2.5
- **License**: CC BY-NC 4.0 (non-commercial; commercial requires agreement)
- **Impact**: Best open TTS for multilingual applications

#### Qwen3.6-27B (April 22, 2026)
- **Architecture**: Dense, 27B parameters
- **Context**: 262K native (1M with YaRN)
- **Benchmarks**: Beats Qwen3.5-397B MoE on SWE-bench Pro
- **License**: Apache 2.0
- **VRAM**: Fits on single RTX 4090 at Q4
- **Impact**: Best coding model that fits on consumer GPU -- the new local-coding default

#### Kimi K2.6 (April 20, 2026)
- **Architecture**: 1T MoE, 32B active, 384 experts
- **Context**: 256K tokens
- **Benchmarks**: SWE-bench Pro 58.6%, HLE w/tools 54.0%, GPQA 90.5%
- **Special**: 300-agent swarm, 4,000 coordinated steps, 12-hour autonomous runs
- **License**: Modified MIT
- **VRAM**: 8x H100 minimum (INT4)
- **Impact**: Best agentic coding model with swarm orchestration

#### GLM-5.1 (Z.ai, May 2026)
- **Architecture**: 744B total / 40B active MoE
- **Context**: 200K tokens
- **Benchmarks**: Terminal-Bench 2.0 SOTA, SWE-bench Pro leading
- **License**: MIT
- **Impact**: Best for long-horizon agentic engineering tasks

#### gpt-oss-120b (OpenAI, 2026)
- **Architecture**: 117B total / 5.1B active MoE
- **Context**: 128K tokens
- **Benchmarks**: 2622 Codeforces Elo (matches o4-mini), 16.2 SWE-bench Pro
- **License**: Apache 2.0 (!)
- **Impact**: Best open-source competition coder, tiny active parameters = fast inference

### 8.2 KEY TRENDS (2026)

1. **Open weights match proprietary**: Gap between top open and closed models narrowed to <5% on coding benchmarks
2. **1M+ context is standard**: Llama 4 Scout (10M), MiniMax M3 (1M), Nemotron 3 Super (1M) all push context
3. **MoE dominates large models**: All frontier open models use MoE for efficiency
4. **Small models get smarter**: Qwen3-4B rivals previous-gen 72B models; Phi-4 beats 70B models on math
5. **Agentic is the new benchmark**: SWE-bench Pro, Terminal-Bench, OSWorld replace static benchmarks
6. **Chinese labs lead open weights**: DeepSeek, Qwen, MiniMax, Kimi, GLM all outpace Western open releases
7. **Apache 2.0 is winning**: Most new releases use Apache 2.0 or MIT (fully sovereign)

---

## 9. HUGGINGFACE MODEL IDs & DOWNLOAD COMMANDS

### 9.1 COMPLETE MODEL ID REFERENCE

| Model | HuggingFace ID | Size (Q4) |
|-------|---------------|-----------|
| **DeepSeek V3.2** | `deepseek-ai/DeepSeek-V3.2` | ~400GB |
| **DeepSeek R1** | `deepseek-ai/DeepSeek-R1` | ~400GB |
| **DeepSeek Coder V2** | `deepseek-ai/DeepSeek-Coder-V2` | ~8GB |
| **Qwen3 72B** | `Qwen/Qwen3-72B` | ~43GB |
| **Qwen3 32B** | `Qwen/Qwen3-32B` | ~19GB |
| **Qwen3 14B** | `Qwen/Qwen3-14B` | ~8.4GB |
| **Qwen3 7B** | `Qwen/Qwen3-7B` | ~4.2GB |
| **Qwen3 4B** | `Qwen/Qwen3-4B` | ~2.5GB |
| **Qwen3 1.7B** | `Qwen/Qwen3-1.7B` | ~1GB |
| **Qwen3.6-27B** | `Qwen/Qwen3.6-27B` | ~16GB |
| **Qwen3-Coder-480B** | `Qwen/Qwen3-Coder-480B-A35B` | ~240GB |
| **Llama 4 Scout** | `meta-llama/Llama-4-Scout-17B-16E` | ~55GB |
| **Llama 4 Maverick** | `meta-llama/Llama-4-Maverick-17B-128E` | ~200GB |
| **Llama 3.3 70B** | `meta-llama/Llama-3.3-70B-Instruct` | ~42GB |
| **Llama 3.2 3B** | `meta-llama/Llama-3.2-3B-Instruct` | ~1.8GB |
| **Llama 3.2 1B** | `meta-llama/Llama-3.2-1B-Instruct` | ~1.3GB |
| **Mistral Large 3** | `mistralai/Mistral-Large-3` | ~400GB |
| **Mistral Small 4** | `mistralai/Mistral-Small-4` | ~16GB |
| **Mistral Codestral** | `mistralai/Codestral-25.01` | ~62GB |
| **Kimi K2.6** | `moonshotai/Kimi-K2.6` | ~630GB |
| **GLM-5.1** | `THUDM/GLM-5.1` | ~380GB |
| **MiniMax M3** | `MiniMax/MiniMax-M3` | Large |
| **Gemma 3 27B** | `google/gemma-3-27b-it` | ~16GB |
| **Gemma 3 4B** | `google/gemma-3-4b-it` | ~2.5GB |
| **Phi-4** | `microsoft/phi-4` | ~8.4GB |
| **Qwen2-VL 72B** | `Qwen/Qwen2-VL-72B-Instruct` | ~43GB |
| **Florence-2** | `microsoft/Florence-2-large` | ~1.5GB |
| **BGE-M3** | `BAAI/bge-m3` | ~2.5GB |
| **Jina v3** | `jinaai/jina-embeddings-v3` | ~7.5GB |
| **Faster-Whisper** | `Systran/faster-whisper-large-v3` | ~1.5GB |
| **Kokoro TTS** | `hexgrad/kokoro-v0_19` | ~300MB |
| **Fish Speech** | `fishaudio/fish-speech-1.5` | ~1GB |
| **Piper** | `rhasspy/piper-voices` | ~50-500MB |

### 9.2 QUICK DOWNLOAD COMMANDS

```bash
# Install huggingface-cli
pip install huggingface-hub

# Login (optional, for gated models like Llama)
huggingface-cli login

# Download with huggingface-cli (recommended for large models)
huggingface-cli download Qwen/Qwen3-72B-Instruct --local-dir /models/Qwen3-72B
huggingface-cli download meta-llama/Llama-4-Scout-17B-16E --local-dir /models/llama4-scout
huggingface-cli download deepseek-ai/DeepSeek-R1 --local-dir /models/deepseek-r1

# Download GGUF (for Ollama/llama.cpp)
huggingface-cli download bartowski/Qwen3-32B-Instruct-GGUF --local-dir /models/Qwen3-32B-GGUF
huggingface-cli download bartowski/Llama-3.3-70B-Instruct-GGUF --local-dir /models/llama3.3-70b-GGUF

# Pull with Ollama (easiest for small/medium models)
ollama pull qwen3:72b
ollama pull qwen3:32b
ollama pull qwen3:14b
ollama pull qwen3:7b
ollama pull qwen3:4b
ollama pull qwen3:1.7b
ollama pull llama3.3:70b
ollama pull llama3.2:3b
ollama pull llama3.2:1b
ollama pull gemma3:27b
ollama pull gemma3:4b
ollama pull phi4:latest
ollama pull deepseek-r1:70b
ollama pull deepseek-r1:32b
ollama pull nomic-embed-text
```

---

## 10. QUICK REFERENCE CARDS

### 10.1 "WHAT MODEL FOR...?" CHEAT SHEET

| I need to... | Use this model | On this hardware |
|-------------|---------------|------------------|
| Write exploit code | Qwen3.6-27B | RTX 4090 |
| Analyze malware | DeepSeek V3.2 | 8x H200 |
| Transcribe intercepted audio | Faster-Whisper large-v3 | A100 80GB |
| Read 10,000 pages of intel | Llama 4 Scout | A100 80GB |
| Chat in 40 languages | Mistral Large 3 | A100 80GB |
| Solve math/crypto problems | Phi-4-reasoning-plus | RTX 4090 |
| Run on a drone | Qwen3 4B-Thinking | Jetson Orin Nano 8GB |
| Classify threats fast | Qwen3 1.7B | Jetson Orin Nano 8GB |
| Clone a voice | Fish Speech | RTX 4090 |
| Generate field reports | Llama 4 Scout | A100 80GB |
| Search across all documents | BGE-M3 | Any (embedding) |
| Reason through complex strategy | DeepSeek R1 | A100 80GB |
| Code with 300 parallel agents | Kimi K2.6 | 8x H100 |
| Process video from UAV | Qwen2-VL 72B | 2x A100 |
| Read license plates (OCR) | Florence-2 | Jetson Orin Nano |
| Talk to the system (TTS) | Kokoro | Any (82M model) |

### 10.2 ONE-LINE SETUP

```bash
# Complete DEFONEOS stack setup (single command)
curl -fsSL https://defoneos.internal/setup.sh | bash -s -- --tier tactical --models all

# Or manually:
# 1. Install Ollama
curl -fsSL https://ollama.com/install.sh | sh

# 2. Pull all models
for model in qwen3:1.7b qwen3:4b qwen3:7b qwen3:14b qwen3:32b qwen3:72b \
             llama3.2:1b llama3.2:3b llama3.3:70b \
             gemma3:4b gemma3:27b phi4 deepseek-r1:32b \
             nomic-embed-text; do
    ollama pull $model
done

# 3. Install vLLM
pip install vllm

# 4. Start serving
vllm serve Qwen/Qwen3-72B-Instruct --quantization int4 --tensor-parallel-size 2

# 5. Stack is live at localhost:8000
```

### 10.3 PERFORMANCE COMPARISON (SAME HARDWARE)

On a single RTX 4090 (24GB):

| Model | Size | Quant | VRAM | Speed | Best Task |
|-------|------|-------|------|-------|-----------|
| Qwen3.6-27B | 27B | Q4 | 16GB | 100 t/s | **Coding** |
| Qwen3 32B | 32B | Q4 | 19GB | 80 t/s | **General analysis** |
| Gemma 3 27B | 27B | Q4 | 16GB | 59 t/s | **Local reliable** |
| Llama 3.3 70B | 70B | Q4 | 24GB | 25 t/s | **Instruction following** |
| Qwen3 14B | 14B | Q8 | 14GB | 120 t/s | **Fast analysis** |
| Phi-4 14B | 14B | Q8 | 14GB | 150 t/s | **Math/reasoning** |

### 10.4 MODEL SIZE VS CAPABILITY

```
CAPABILITY
    │
  1.0 ┤                                          ████ DeepSeek V3.2
      │                                    ████ Kimi K2.6
      │                              ████ Llama 4 Maverick
      │                        ████ GLM-5.1
      │                  ████ Qwen3-Coder-480B
    │ │            ████ Llama 4 Scout ████ Mistral Large 3
    │ │      ████ Qwen3 72B ████ DeepSeek R1
    0.5 ┤  ████ Qwen3.6-27B ████ Llama 3.3 70B
      │███ Qwen3 32B ████ Gemma 3 27B
      │  ████ Phi-4 ████ Qwen3 14B ████ Mistral Small 4
      │███ Qwen3 7B ████ DeepSeek Coder V2
    0.2 ┤  ████ Qwen3 4B ████ Llama 3.2 3B
      │███ Qwen3 1.7B ████ Llama 3.2 1B
      │███ TinyLlama
    0.0 ┼────┬────┬────┬────┬────┬────┬────┬────┬────┬────┬───
         1B   3B   7B  14B  27B  32B  70B 109B 400B 480B 671B 1T
                           MODEL SIZE (parameters)
```

---

## 11. SECURITY & COMPLIANCE NOTES

### 11.1 LICENSE COMPATIBILITY

| License | Commercial Use | Modify | Distribute | Sublicense | Notes |
|---------|---------------|--------|------------|------------|-------|
| **Apache 2.0** | Yes | Yes | Yes | Yes | **Best for sovereign** |
| **MIT** | Yes | Yes | Yes | Yes | **Best for sovereign** |
| **Llama License** | Yes | Yes | Yes | No | EU restrictions, 700M user limit |
| **Gemma License** | Yes | Yes | Yes | No | Not OSI-approved, read carefully |
| **DeepSeek License** | Yes | Yes | Yes | No | Generally permissive |
| **CC BY-NC 4.0** | **No** | Yes | Yes | No | Non-commercial only |

### 11.2 DATA SOVEREIGNTY

- All models run locally -- zero data exfiltration
- No API keys, no cloud dependency
- Air-gapped network compatible
- Models can be pre-downloaded and distributed offline
- No telemetry in vLLM, Ollama, or llama.cpp (verify builds)

### 11.3 GEOPOLITICAL CONSIDERATIONS

| Model Origin | Model | Consideration |
|-------------|-------|---------------|
| China | DeepSeek, Qwen, MiniMax, Kimi, GLM | Best benchmarks, review license terms |
| USA | Llama, Phi, Gemma | Familiar ecosystem, some license restrictions |
| Europe | Mistral | Apache 2.0, EU data residency compliance |

**Recommendation**: Diversify model origins. Use Mistral (European) for sensitive multilingual work, DeepSeek/Qwen (Chinese) for raw capability, Llama (US) for long-context needs.

---

## 12. MAINTENANCE & UPDATE SCHEDULE

| Task | Frequency | Command |
|------|-----------|---------|
| Check for new models | Weekly | `huggingface-cli scan` |
| Update Ollama models | Weekly | `ollama list && ollama pull <model>` |
| Benchmark new releases | Monthly | Run DEFONEOS eval suite |
| Review license changes | Monthly | Check model cards |
| Update VRAM tables | Quarterly | Re-measure with latest quant methods |
| Full stack review | Quarterly | Review this document |

---

## APPENDIX A: VLLM DEPLOYMENT EXAMPLES

```bash
# DeepSeek V3.2 on 8x H200 (FP8)
vllm serve deepseek-ai/DeepSeek-V3.2 \
  --tensor-parallel-size 8 \
  --quantization fp8 \
  --max-model-len 128000 \
  --port 8000

# Llama 4 Scout on 1x H100 (INT4)
vllm serve meta-llama/Llama-4-Scout-17B-16E \
  --quantization int4 \
  --max-model-len 10000000 \
  --port 8000

# Qwen3 72B on 2x A100 (INT4)
vllm serve Qwen/Qwen3-72B-Instruct \
  --tensor-parallel-size 2 \
  --quantization int4 \
  --max-model-len 128000 \
  --port 8000

# Qwen3.6-27B on RTX 4090 (INT4)
vllm serve Qwen/Qwen3.6-27B \
  --quantization int4 \
  --max-model-len 256000 \
  --gpu-memory-utilization 0.95 \
  --port 8000

# Multiple models on same GPU (using Ollama)
OLLAMA_NUM_PARALLEL=4 ollama serve
```

## APPENDIX B: QUANTIZATION WORKFLOW

```bash
# Convert to GGUF (for llama.cpp / Ollama)
# 1. Clone llama.cpp
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && make -j

# 2. Convert HF model to GGUF
python convert_hf_to_gguf.py /models/Qwen3-7B-Instruct \
  --outfile /models/Qwen3-7B-Instruct-Q4_K_M.gguf \
  --outtype q4_k_m

# 3. Quantize to different levels
./llama-quantize /models/f16.gguf /models/Q4_K_M.gguf Q4_K_M
./llama-quantize /models/f16.gguf /models/Q5_K_M.gguf Q5_K_M
./llama-quantize /models/f16.gguf /models/Q8_0.gguf Q8_0

# GPTQ (for vLLM/AutoGPTQ)
# Pre-quantized models available on HF:
# - TheBloke/ models (GPTQ/GGUF)
# - bartowski/ models (GGUF)
# - unsloth/ models (quantized)
```

## APPENDIX C: EMBEDDING DEPLOYMENT

```python
# BGE-M3 deployment for RAG
from FlagEmbedding import BGEM3FlagModel

model = BGEM3FlagModel('BAAI/bge-m3', use_fp16=True)

# Encode documents
sentences = ["Threat actor APT29 using Cobalt Strike...", "CVE-2024-1234 remote code execution..."]
embeddings = model.encode(sentences, batch_size=12, max_length=8192)['dense_vecs']

# Dimensions: 1024
# Max tokens: 8192
# Supports: English, Chinese, 100+ languages
# MTEB: 0.940 cross-lingual retrieval
```

## APPENDIX D: MONITORING DASHBOARD

```yaml
# Key metrics to track
metrics:
  inference:
    - tokens_per_second
    - time_to_first_token
    - queue_depth
    - batch_size
    - gpu_utilization
    - gpu_memory_used
    - kv_cache_usage
  models:
    - active_model_count
    - model_load_time
    - request_count_by_model
    - error_rate_by_model
  router:
    - routing_accuracy
    - routing_latency_ms
    - fallback_rate
    - category_distribution
  system:
    - gpu_temperature
    - power_consumption
    - network_io
    - disk_io
```

---

> **END OF DOCUMENT**
>
> **NEXT STEPS**:
> 1. Download models per tier using Section 9 commands
> 2. Deploy vLLM + Ollama using Section 7.3 docker-compose
> 3. Configure router using Section 6
> 4. Run benchmark suite to verify performance
> 5. Set up monitoring per Appendix D
>
> **DOCUMENT OWNER**: AI Systems Architecture
> **REVIEW CYCLE**: Quarterly
> **DISTRIBUTION**: Internal Only
