# OPERATION EAT: The $0 AI Inference Stack - Complete Free Catalog

**Date:** June 2026  
**Mission:** Find EVERY free way to run powerful AI models. No credit card required.

---

## TABLE OF CONTENTS

1. [Free Inference APIs](#1-free-inference-apis)
2. [Free Model Hosting](#2-free-model-hosting)
3. [Local Inference Tools](#3-local-inference-tools)
4. [Best Free Models to Run Locally](#4-best-free-models-to-run-locally)
5. [Free GPU Cloud](#5-free-gpu-cloud)
6. [Free Image/Video Generation](#6-free-imagevideo-generation)
7. [Free Voice/Speech](#7-free-voicespeech)
8. [Free Embedding Models](#8-free-embedding-models)
9. [Best Option Recommendation Matrix](#9-best-option-recommendation-matrix)
10. [The $0 Stacking Strategy](#10-the-0-stacking-strategy)

---

## 1. FREE INFERENCE APIs

### 1.1 Groq (THE SPEED KING)
| Detail | Value |
|--------|-------|
| **Free Tier** | All models, no credit card, rate-limited |
| **Rate Limits** | 30 RPM (varies by model), 6K-30K TPM, 1,000-14,400 RPD |
| **Best Model for Free** | `llama-3.1-8b-instant` (14,400 RPD) |
| **70B Model Limit** | `llama-3.3-70b-versatile`: 30 RPM, 1,000 RPD, 12K TPM |
| **Llama 4 Scout** | 30 RPM, 1,000 RPD, 30K TPM (highest TPM!) |
| **Speed** | 500+ tok/s on 70B models (sub-100ms TTFT) |
| **Credit Card Required** | No |
| **Signup** | console.groq.com (email or Google) |
| **Developer Tier** | Add card for ~10x limits + 25% discount (no min spend) |

**Available Models (Free):** Llama 3.3 70B, Llama 4 Scout/Maverick, Llama 3.1 8B, GPT-OSS 120B/20B, Qwen3-32B, Moonshot Kimi K2, Whisper Large v3, Allam-2-7B

**Pros:** Fastest inference on the planet (LPU hardware), all models free, no credit card needed  
**Cons:** Per-organization rate limits (not per key), daily caps can be tight for production  
**Best For:** Real-time chat, voice agents, latency-sensitive applications, prototyping

---

### 1.2 Cerebras (THE VOLUME KING)
| Detail | Value |
|--------|-------|
| **Free Tier** | 1,000,000 tokens/day (resets daily, no expiry) |
| **Rate Limits** | 5 RPM, 30K TPM, 8,192-token context cap |
| **Models** | gpt-oss-120b, zai-glm-4.7 (lineup rotates) |
| **Credit Card Required** | No |
| **Signup** | cloud.cerebras.ai |
| **Hardware** | CS-3 wafer-scale chips (up to 15x faster than NVIDIA) |

**Pros:** Highest daily free token volume (1M/day), no credit card, wafer-scale speed  
**Cons:** Limited model selection, 8K context cap on free tier, 5 RPM is restrictive  
**Best For:** Long-context tasks, batch processing, RAG pipelines, document analysis

---

### 1.3 HuggingFace Inference API (THE GATEWAY)
| Detail | Value |
|--------|-------|
| **Serverless (Free)** | Hundreds of req/hour, models under ~10B params |
| **Inference Providers** | Unified API to 15+ providers (Groq, Together, Fireworks, Replicate, Cohere, etc.) |
| **PRO ($9/mo)** | 20x quota, 25min daily H200 ZeroGPU, 2M provider credits/month |
| **Credit Card Required** | No (free tier) |
| **Signup** | huggingface.co |

**Three Products:**
- **Serverless Inference API:** Shared infra, free tier, rate-limited (prototyping)
- **Inference Endpoints:** Dedicated GPU, $0.50+/hr, scale-to-zero (production)
- **Inference Providers:** One API key, 15+ providers, pass-through pricing

**Pros:** 500K+ models available, single auth token for multiple providers, great for exploration  
**Cons:** Cold starts on less popular models (10-30s), 70B+ models often unavailable on free  
**Best For:** Trying new open-source models, prototyping, spaces/demos

---

### 1.4 Google Gemini API (THE MOST ACCESSIBLE)
| Detail | Value |
|--------|-------|
| **Free Tier** | 1,500 requests/day (Gemini 2.5 Flash), 10 RPM |
| **Models** | Gemini 2.5 Flash, Flash-Lite, various Gemma models |
| **Context Window** | Up to 1M tokens |
| **Credit Card Required** | No (Google account only) |
| **Signup** | ai.google.dev |

**Pros:** Most accessible free baseline, Flash-Lite has highest free RPM, no card needed  
**Cons:** Free tier quotas reduced in late 2025, data may be used for training outside EU  
**Best For:** Sustained workloads, prototyping, multimodal tasks

---

### 1.5 OpenRouter (THE UNIVERSAL ADAPTER)
| Detail | Value |
|--------|-------|
| **Free Tier** | 20+ free models, 20 RPM, 50 requests/day |
| **With $10 Top-Up** | 1,000 requests/day |
| **Models** | DeepSeek R1, Llama 3.3 70B, Qwen3 Coder, Gemma 3, and more |
| **Total Catalog** | 300+ models from 60+ providers |
| **Credit Card Required** | No (for free models) |
| **Signup** | openrouter.ai |

**Pros:** One API key for 300+ models, automatic failover, OpenAI-compatible, no markup  
**Cons:** 5.5% credit purchase fee, adds latency hop, free tier is limited  
**Best For:** Multi-model applications, failover routing, experimentation

---

### 1.6 Mistral AI (THE EUROPEAN POWERHOUSE)
| Detail | Value |
|--------|-------|
| **Free Tier (Experiment)** | All models, 2 RPM, 500K TPM, 1 BILLION tokens/month |
| **Models** | Mistral Large, Small, Codestral, Pixtral, Medium |
| **Credit Card Required** | No (phone verification required) |
| **Signup** | mistral.ai |

**Pros:** Extremely generous 1B token/month free limit, all models included, EU data residency  
**Cons:** Only 2 RPM, data may be used for training (experiment tier)  
**Best For:** High-volume prototyping, EU compliance needs, coding with Codestral

---

### 1.7 SambaNova
| Detail | Value |
|--------|-------|
| **Free Tier** | ~100K initial credit, 20 RPM, 20 RPD, 200K TPD |
| **Models** | DeepSeek-V3.1, Llama 3.3 70B, GPT-OSS-120B, Gemma-4-31B |
| **Developer Tier** | Add payment method for 240 RPM, 48K RPD, 20M tokens/day |
| **Credit Card Required** | No (free tier) |

**Pros:** Good model selection, developer tier is generous, competitive pricing  
**Cons:** Strict daily limits on free (20 RPD), credit expires  
**Best For:** Testing SambaNova hardware, short prototyping sessions

---

### 1.8 Fireworks AI
| Detail | Value |
|--------|-------|
| **Free Tier** | $1 starter credit (no card), 10 RPM |
| **With Card** | 6,000 RPM ceiling |
| **Models** | Llama 3.3 70B, Llama 4, DeepSeek, Qwen, Kimi K2.6, GPT-OSS (50+ models) |
| **Credit Card Required** | No for $1 credit |

**Pros:** Full serverless catalog on free credit, competitive pricing, batch at 50% off  
**Cons:** $1 credit is tiny, card needed for meaningful usage  
**Best For:** Quick evaluation of their catalog, testing Kimi K2.6

---

### 1.9 Replicate
| Detail | Value |
|--------|-------|
| **Free Tier** | Limited free runs on curated models (FLUX, Imagen 4, video upscaling) |
| **Referral Credit** | $10 promotional credit (expires 12 months) |
| **Models** | 25,000+ models (LLMs, image, video, audio, etc.) |
| **Credit Card Required** | No (for free tier) |
| **Scaling** | Auto scale-to-zero |

**Pros:** Massive model variety, per-second billing, easy model publishing  
**Cons:** No permanent free tier, cold starts can be minutes for large models  
**Best For:** Experimenting with niche models, image/video generation

---

### 1.10 Together AI
| Detail | Value |
|--------|-------|
| **Free Tier** | Up to $100 trial credits for new accounts |
| **Models** | 100+ open-source models (Llama 4, DeepSeek V3, Qwen, Mixtral) |
| **Credit Card Required** | Yes (minimum $5 to activate) |
| **Free for Startups** | Together AI Accelerator: $15K-$50K credits |

**Pros:** Largest sign-up credit ($100), excellent for fine-tuning, dedicated endpoints  
**Cons:** Credit card required, no permanent free tier  
**Best For:** Open-source model exploration, fine-tuning, production serving

---

### 1.11 AI21 Labs
| Detail | Value |
|--------|-------|
| **Free Tier** | $10 trial credits |
| **Models** | Jamba models (hybrid SSM-Transformer) |
| **Credit Card Required** | No (for trial) |
| **Signup** | studio.ai21.com |

**Pros:** Unique Jamba architecture (256K context), good for long documents  
**Cons:** Small trial credit, limited model selection  
**Best For:** Long-context tasks, testing Jamba models

---

### 1.12 NVIDIA NIM
| Detail | Value |
|--------|-------|
| **Free Tier** | Free prototyping via Developer Program, ~40 RPM |
| **Models** | 90+ models (DeepSeek V4, Nemotron 3, Llama, Qwen, GLM 5.1, Phi) |
| **90-Day Eval** | Free NVIDIA AI Enterprise evaluation (production-grade) |
| **Credit Card Required** | No (Developer Program) |
| **Signup** | build.nvidia.com |

**Pros:** NVIDIA-optimized inference, downloadable containers, great for trying new models  
**Cons:** ~40 RPM is a hard ceiling, no published per-token pricing, production requires license  
**Best For:** Model evaluation, NVIDIA ecosystem integration, prototyping

---

### 1.13 Cloudflare Workers AI
| Detail | Value |
|--------|-------|
| **Free Tier** | 10K Neurons/day (generous for small apps) |
| **Models** | 20+ models (Llama 3.3 70B, Kimi K2.5, embeddings, image) |
| **Credit Card Required** | No |
| **Signup** | Workers account |

**Pros:** Edge deployment (global), no cold starts, generous free tier  
**Cons:** Limited model selection, context windows smaller (2K-8K)  
**Best For:** Edge deployment, global apps, low-latency inference

---

### 1.14 GitHub Models
| Detail | Value |
|--------|-------|
| **Free Tier** | Rate-limited access: 15 RPM, 150-1,000 RPD |
| **Models** | GPT-4o, Claude 3.5 Sonnet, Llama, Phi, Mistral (playground + API) |
| **Credit Card Required** | No |
| **Signup** | github.com (any GitHub account) |

**Pros:** Access to frontier models (GPT-4o, Claude), playground UI, no card needed  
**Cons:** Strict rate limits, not for production, limited to evaluation  
**Best For:** Testing frontier models, learning, prototyping

---

### 1.15 xAI Grok
| Detail | Value |
|--------|-------|
| **Free Tier** | $25 sign-up credit + $150/month via data-sharing program |
| **Models** | Grok 4.1 Fast (2M context window) |
| **Credit Card Required** | No (credit-based) |

**Pros:** Most generous dollar amount ($175 first month), 2M context window  
**Cons:** Data sharing required for monthly $150, limited to xAI models  
**Best For:** Long-context tasks, Grok-specific features

---

### 1.16 Perplexity API
| Detail | Value |
|--------|-------|
| **Free Tier** | API not free; Pro subscribers get API access (no free API tier) |
| **Search API** | $5 per 1,000 requests |
| **Sonar API** | $0.25/M input, $2.50/M output |
| **Chat App Free Tier** | Unlimited basic searches, 5 Pro Searches/day |
| **Credit Card Required** | No (for chat app) |

**Note:** The API is not free, but the chat app has a generous free tier. Use Puter.js for zero-cost API integration (user-pays model).

---

### 1.17 DeepSeek API
| Detail | Value |
|--------|-------|
| **Free Tier** | 5M tokens free credit for new users |
| **Models** | DeepSeek V4, DeepSeek R1 |
| **Paid Pricing** | Extremely cheap: V3.2 at $0.028/M input (cached) |
| **Credit Card Required** | Yes |

**Pros:** One of the cheapest APIs on the planet, excellent reasoning models  
**Cons:** Credit card required even for free credits  
**Best For:** Cost-sensitive production, reasoning tasks

---

### 1.18 Hyperbolic
| Detail | Value |
|--------|-------|
| **Free Tier** | $1 promo credit, 60 RPM basic |
| **Models** | Llama 3.1 405B, and more |
| **Pro Unlock** | $5 unlocks Pro tier |
| **Credit Card Required** | No ($5 unlocks Pro) |

---

### 1.19 Chutes
| Detail | Value |
|--------|-------|
| **Free Tier** | Community tier, various OSS models |
| **Credit Card Required** | No |

---

### 1.20 Novita AI
| Detail | Value |
|--------|-------|
| **Free Tier** | Starter credits for testing 200+ models |
| **Models** | DeepSeek V4 Pro, MiniMax M3, GLM-5.1, Kimi K2.6 |
| **Credit Card Required** | No (for starter credits) |

---

### 1.21 Anakin.ai
| Detail | Value |
|--------|-------|
| **Free Tier** | 30 daily free credits |
| **Models** | GPT-4, Claude, DeepSeek, open-weight models |
| **Credit Card Required** | No |

---

### 1.22 Model Router
| Detail | Value |
|--------|-------|
| **Free Tier** | Intent-based routing across Groq + Cerebras |
| **Models** | Llama 4 Scout, DeepSeek, Qwen, Nemotron |
| **Credit Card Required** | No |

---

## 2. FREE MODEL HOSTING

### 2.1 HuggingFace Spaces
| Detail | Value |
|--------|-------|
| **Free Tier** | Basic CPU, community quota for GPU |
| **ZeroGPU (Free)** | ~3-5 min/day GPU time |
| **PRO ($9/mo)** | 25 min/day H200 ZeroGPU, 20x inference quota |
| **Persistent Storage** | 5GB free (PRO: 1TB private + 10TB public) |
| **Scaling** | Manual restart required |

**Pros:** Free hosting for ML demos, massive community, 500K+ models available  
**Cons:** Free GPU time very limited, sleeps after inactivity  
**Best For:** ML demos, model showcases, prototyping spaces

---

### 2.2 Modal Labs (THE BEST FREE TIER FOR HOSTING)
| Detail | Value |
|--------|-------|
| **Free Tier** | $30/month compute credits, 3 workspace seats |
| **No Card** | $5/month (without payment method) |
| **With Card** | $30/month |
| **Academic Grants** | Up to $10,000 credits |
| **Startup Grants** | Up to $25,000 credits |
| **GPU Pricing** | T4 $0.59/hr, A100 $2.50/hr, H100 $3.95/hr |
| **Scaling** | Auto scale-to-zero, sub-second cold starts |
| **Python-First** | Define functions with GPU decorators |

**Pros:** Best free tier ($30/mo), no cold starts, serverless, Python-native  
**Cons:** Python-first (beta JS/TS/Go), serverless model not ideal for continuous training  
**Best For:** Inference endpoints, scheduled batch jobs, variable-demand applications

---

### 2.3 Replicate
| Detail | Value |
|--------|-------|
| **Free Tier** | Limited free runs on curated collection |
| **Referral Credit** | $10 (12-month expiry) |
| **Scaling** | Auto scale-to-zero |
| **Model Publishing** | Deploy any model from GitHub |

**Pros:** 25,000+ models, easy model publishing, per-second billing  
**Cons:** Cold starts can take minutes, no permanent free tier  
**Best For:** Image/video generation, model publishing, bursty workloads

---

### 2.4 Baseten
| Detail | Value |
|--------|-------|
| **Free Tier** | Limited (paid-first model) |
| **GPU Pricing** | H100 $6.50/hr, B200 $9.98/hr, A100 $4.00/hr |
| **Scaling** | Scale-to-zero (cold starts warned "can take minutes") |
| **Compliance** | SOC 2, HIPAA |

---

### 2.5 Beam.cloud
| Detail | Value |
|--------|-------|
| **Free Tier** | Limited serverless GPU |
| **Scaling** | Auto scale-to-zero |

---

### 2.6 RunPod
| Detail | Value |
|--------|-------|
| **Free Tier** | None (pay-per-use) |
| **Pricing** | A40 $0.44/hr, A100 $1.39/hr (serverless available) |
| **FlashBoot** | Sub-200ms cold starts |
| **Scaling** | 0 to thousands of workers in 250ms |

**Pros:** Broadest GPU selection (30+ types), serverless platform, community cloud for budget  
**Cons:** No free tier, community cloud has reliability tradeoffs  
**Best For:** Serverless inference at scale, GPU variety needs

---

### 2.7 Vast.ai (THE CHEAPEST GPU RENTAL)
| Detail | Value |
|--------|-------|
| **Free Tier** | None (marketplace model) |
| **Pricing** | From $0.02/hr (Tesla P4) to $2-4/hr (H100) |
| **Average** | $0.08/hr across configs |
| **GPU Types** | 68+ GPU types |
| **Options** | On-Demand / Interruptible (50% cheaper) / Reserved (up to 50% off) |

**Pros:** Often cheapest GPU option, massive variety, per-second billing, no lock-in  
**Cons:** Marketplace = variable reliability, no SLA, security considerations  
**Best For:** Budget GPU rental, fault-tolerant batch jobs, experimentation

---

### 2.8 Lambda Labs
| Detail | Value |
|--------|-------|
| **Free Tier** | None for general users |
| **Research Grant** | Up to $5,000 for qualifying academic researchers |
| **GPU Pricing** | Starting at $0.50/hr (Quadro RTX 6000) |
| **Reserved Clusters** | 16-2,000+ interconnected GPUs |

**Pros:** Excellent for researchers, reserved clusters, 1-click setup  
**Cons:** No general free tier, academic-only grants  
**Best For:** Research, multi-node training, enterprise clusters

---

### 2.9 Ollama Cloud
| Detail | Value |
|--------|-------|
| **Free Tier** | Light usage, 1 concurrent model |
| **Pro** | $20/mo |
| **Max** | $100/mo |
| **Data Retention** | Zero data retention |

---

### 2.10 Spheron
| Detail | Value |
|--------|-------|
| **Free Tier** | No subscription fee, pay-per-minute |
| **Pricing** | A100 80GB $0.76/hr, H100 $1.33/hr |
| **GPU Types** | Full VM access |

**Pros:** Best overall value, no subscription, decentralized  
**Cons:** Availability varies by demand, newer platform  

---

## 3. LOCAL INFERENCE TOOLS

### 3.1 llama.cpp (THE FOUNDATION)
| Detail | Value |
|--------|-------|
| **What** | C/C++ inference engine for GGUF models |
| **Platforms** | Windows, macOS, Linux, Android, iOS, WebAssembly |
| **GPU Support** | NVIDIA (CUDA), AMD (ROCm), Apple (Metal), Intel (SYCL) |
| **Quantization** | 1.5-bit to 8-bit (Q4_K_M recommended) |
| **Speed** | Optimized CPU inference with GPU offloading |
| **License** | MIT |

**Best For:** Cross-platform deployment, CPU inference, embedded systems

---

### 3.2 Ollama (EASIEST SETUP)
| Detail | Value |
|--------|-------|
| **What** | Download-and-run tool for local LLMs |
| **Command** | `ollama run llama3.1` |
| **Platforms** | macOS, Linux, Windows |
| **Model Library** | 100+ models (Llama, Mistral, Qwen, Phi, Gemma, DeepSeek, etc.) |
| **API** | OpenAI-compatible REST API built-in |
| **License** | MIT |

**Best For:** Beginners, quick local setup, development and testing

---

### 3.3 LM Studio (BEST GUI)
| Detail | Value |
|--------|-------|
| **What** | Desktop app for running local LLMs |
| **Platforms** | macOS, Linux, Windows |
| **Features** | Model browser, chat UI, server mode (OpenAI-compatible) |
| **GPU Acceleration** | Metal (Apple), CUDA (NVIDIA), Vulkan |
| **Model Formats** | GGUF, MLX (Apple) |
| **License** | Free (closed source) |

**Best For:** GUI users, model exploration, chat interface

---

### 3.4 ExLlamaV2 + TabbyAPI (FASTEST SINGLE-GPU)
| Detail | Value |
|--------|-------|
| **What** | Fastest INT4 inference for consumer NVIDIA GPUs |
| **Format** | EXL2 (mixed-bit-width quantization) |
| **Speed** | 165 tok/s (Llama 3.1 8B on RTX 4090) vs 127 (Ollama), 178 (TensorRT-LLM) |
| **API** | OpenAI-compatible HTTP server |
| **Multi-GPU** | Layer splitting supported |
| **VRAM Efficiency** | 70B model at 22 tok/s on single RTX 4090 (24GB) |
| **License** | MIT |

**Benchmarks (RTX 4090, Llama 3.1 8B Q4):**
| Framework | tok/s |
|-----------|-------|
| Ollama (Q4_K_M) | 127 |
| llama.cpp (Q4_K_M) | 130 |
| vLLM (AWQ-INT4) | 155 |
| **TabbyAPI / ExLlamaV2** | **165** |
| TensorRT-LLM (AWQ) | 178 |

**Best For:** Maximum speed on single NVIDIA GPU, local serving

---

### 3.5 vLLM (PRODUCTION SERVING)
| Detail | Value |
|--------|-------|
| **What** | High-throughput serving for local and cloud |
| **Features** | PagedAttention, continuous batching, tensor parallelism |
| **API** | OpenAI-compatible server |
| **Quantization** | AWQ, GPTQ, FP8, INT8 |
| **Best For** | Multi-user concurrent serving |

**Best For:** Production serving, high throughput, multi-user scenarios

---

### 3.6 TensorRT-LLM (NVIDIA OPTIMIZED)
| Detail | Value |
|--------|-------|
| **What** | NVIDIA's optimized inference framework |
| **Speed** | Up to 4x speedups via quantization, plugins, speculative decoding |
| **GPU** | NVIDIA only (Ampere+) |
| **Best For** | Maximum performance on NVIDIA hardware |

---

### 3.7 kobold.cpp (CREATIVE WRITING)
| Detail | Value |
|--------|-------|
| **What** | Fork of llama.cpp optimized for creative writing |
| **Features** | Rich story generation UI, lorebook, memory management |
| **Best For** | Novel writing, roleplay, creative fiction |

---

### 3.8 text-generation-webui (Oobabooga)
| Detail | Value |
|--------|-------|
| **What** | Web UI for running local LLMs (Gradio-based) |
| **Features** | Model switching, extensions, training tab, API mode |
| **Best For** | Power users who want a web interface |

---

### 3.9 TabbyAPI
| Detail | Value |
|--------|-------|
| **What** | OpenAI-compatible API server (works with ExLlamaV2, etc.) |
| **Features** | Streaming, auth, sampling presets, model hot-swapping |
| **Best For** | API layer for local inference engines |

---

### 3.10 ONNX Runtime
| Detail | Value |
|--------|-------|
| **What** | Cross-platform inference engine |
| **Platforms** | Windows, Linux, macOS, mobile, web |
| **Best For** | Cross-platform deployment, edge devices |

---

### 3.11 LocalAI
| Detail | Value |
|--------|-------|
| **What** | Self-hosted OpenAI-compatible API |
| **Features** | Runs GGUF models, image generation, embeddings, speech |
| **Best For** | Drop-in OpenAI API replacement |

---

## 4. BEST FREE MODELS TO RUN LOCALLY

### 4.1 By Hardware Tier

#### 4GB VRAM (Minimum - Laptops, Entry GPUs)
| Model | Size | VRAM (Q4) | Best For |
|-------|------|-----------|----------|
| **Llama 3.2 1B** | 1B | ~1.5GB | Chat, quick tasks, always-on assistant |
| **Qwen 2.5 1.5B** | 1.5B | ~2GB | Reasoning, multilingual, coding basics |
| **Phi-4-mini** | 3.8B | ~2.5GB | Best small model for reasoning |
| **TinyLlama 1.1B** | 1.1B | ~1GB | Ultra-fast, embedded systems |

#### 8GB VRAM (Budget GPUs: GTX 1060, RTX 3060, Laptop GPUs)
| Model | Size | VRAM (Q4) | Best For |
|-------|------|-----------|----------|
| **Llama 3.3 8B** | 8B | ~6GB | General-purpose, best all-around |
| **Mistral Small 3 7B** | 7B | ~5.5GB | Fast autocomplete, iteration |
| **Qwen 3 7B** | 7B | ~5.5GB | Code generation, multilingual |
| **Phi-4 (14B)** | 14B | ~11GB | STEM reasoning (need Q3 for 8GB) |

#### 16GB VRAM (Mid GPUs: RTX 4060 Ti, RTX 3080, RX 7800 XT)
| Model | Size | VRAM (Q4) | Best For |
|-------|------|-----------|----------|
| **Llama 3.3 13B** | 13B | ~8-12GB | Better quality, general purpose |
| **Phi-4 (14B)** | 14B | ~11GB | STEM reasoning, debugging |
| **Qwen 3.5 27B** | 27B | ~16GB (IQ3_XXS) | Outperforms 70B models on some tasks |
| **Gemma 4 4B/9B/26B** | 4-26B | Varies | Google's latest, safety-focused |

#### 24GB VRAM (High-End: RTX 3090, RTX 4090, RTX 5090)
| Model | Size | VRAM (Q4) | Best For |
|-------|------|-----------|----------|
| **Llama 3.3 70B** | 70B | ~35GB (Q4) | Complex reasoning (with offloading) |
| **Qwen 3.5 27B** | 27B | ~16GB | Sweet spot for 24GB, excellent quality |
| **Qwen 3.5 35B-A3B (MoE)** | 35B active ~3B | ~19GB (Q4) | 58-62 tok/s on 12GB with expert pinning |
| **Mixtral 8x7B** | 46.7B active ~13B | ~26GB | Quality via MoE |
| **Llama 4 Scout** | 17B active | ~12-16GB | 10M context window! |
| **DeepSeek V3** | 671B active ~37B | ~24GB (Q4) | Best coding/reasoning |

#### 48GB+ VRAM (Workstation: RTX A6000, L40S, Dual GPUs)
| Model | Size | VRAM (Q4) | Best For |
|-------|------|-----------|----------|
| **Llama 3.3 70B** | 70B | ~40GB (Q4) | Fits entirely in 48GB |
| **Qwen 3 72B** | 72B | ~42GB (Q4) | Polyglot code, long context |
| **Mixtral 8x22B** | 141B active ~39B | ~80GB | High-quality MoE |
| **DeepSeek R1** | 671B | ~2x 48GB (Q4) | Best reasoning model |

---

### 4.2 Model Quick Reference

| Model Family | Best At | License | Sizes Available |
|-------------|---------|---------|-----------------|
| **Llama 4** | General chat, 10M context | Llama license | Scout (17B), Maverick |
| **DeepSeek V3/R1** | Coding, reasoning | DeepSeek license | 671B MoE |
| **Qwen 3** | Multilingual, code | Apache 2.0 | 0.5B to 72B |
| **Mistral Small 3** | Fast inference | Apache 2.0 | 7B |
| **Phi-4** | STEM, small hardware | MIT | 3.8B, 14B |
| **Gemma 4** | Safety, Google ecosystem | Gemma license | 2B, 4B, 9B, 26B |
| **GPT-OSS** | Open weights by OpenAI | Open license | 20B, 120B |

---

## 5. FREE GPU CLOUD

### 5.1 Always-Free Tiers

| Provider | GPU | Hours/Month | Session Limit | Storage | Card Required |
|----------|-----|-------------|---------------|---------|---------------|
| **Google Colab** | T4 (16GB) | ~30 hrs/week | 12hr/session | Variable | No |
| **Kaggle** | T4 (16GB) | 30 hrs/week | 9hr/session | 20GB | No |
| **Lightning.ai** | Various | 80 hrs/month | 4hr restart | 50GB | No |
| **Paperspace** | M4000 (8GB) | Limited | 6hr/session | 5GB | No |
| **AWS SageMaker Studio Lab** | T4 (16GB) | Limited | 4hr/session | 15GB | No |

### 5.2 Free Credits (Sign-up)

| Provider | Free Credits | Valid For | Card Required | Best For |
|----------|-------------|-----------|---------------|----------|
| **Google Cloud** | $300 | 90 days | Yes (not charged) | 100+ hrs T4 GPU |
| **Modal** | $30/month | Recurring | No ($5) / Yes ($30) | Serverless GPU |
| **Azure** | $200 | 30 days | No (students $100) | Testing |
| **xAI Grok** | $25 + $150/mo | Ongoing | No | API credits |
| **Together AI** | Up to $100 | One-time | Yes ($5 min) | Open models |
| **Novita AI** | Starter credits | One-time | No | 200+ models |

### 5.3 Free for Students/Researchers

| Provider | What | Requirements |
|----------|------|-------------|
| **Modal Academic** | Up to $10,000 credits | Graduate students, labs |
| **Lambda Research** | Up to $5,000 credits | Academic researchers |
| **Modal Startups** | Up to $25,000 credits | Early-stage startups |
| **AWS Educate** | Varying credits | Students at participating schools |
| **GitHub Student Pack** | Multiple cloud credits | Verified students |
| **NVIDIA Inception** | Various benefits | Startups |
| **Google for Startups** | $1,000-$25,000 | Startups |
| **Together AI Accelerator** | $15,000-$50,000 | Accelerator-backed startups |

### 5.4 Developer Environment Free Hours

| Provider | Free Hours | Details |
|----------|-----------|---------|
| **GitHub Codespaces** | 120 core-hours/mo | ~60 clock hours on 2-core |
| **Gitpod** | 50 free hours | Standard 4-core machines |
| **CodeSandbox** | Limited | Free tier available |
| **Replit** | Basic | Limited compute |

### 5.5 Cheap GPU Rental (Pay-Per-Use)

| Provider | Cheapest GPU | H100 Price | Billing | Notes |
|----------|-------------|------------|---------|-------|
| **Vast.ai** | $0.02/hr (Tesla P4) | $2.00-4.00/hr | Per-second | Marketplace, cheapest |
| **JarvisLabs** | RTX 3090 $0.29/hr | $2.69/hr | Per-minute | Fastest startup (90s) |
| **RunPod** | Varies | $2.49-3.89/hr | Per-second | 30+ GPU types |
| **Lambda** | $0.50/hr (RTX 6000) | $2.49/hr | Per-hour | Reserved clusters |
| **Nebius** | A100 $1.00/hr | $2.00/hr | Pay-as-you-go | Good availability |
| **Spheron** | A100 $0.76/hr | $1.33/hr | Per-minute | Best value |
| **Thunder Compute** | A100 $0.66/hr | N/A | Pay-as-you-go | Budget A100 |

---

## 6. FREE IMAGE/VIDEO GENERATION

### 6.1 Local (Free, Runs on Your Hardware)

| Model | VRAM Required | License | Best For |
|-------|--------------|---------|----------|
| **Stable Diffusion 3.5** | 4-8GB | Mixed | General creative, community LoRAs |
| **FLUX.1 [schnell]** | ~12GB | Apache 2.0 | Fast prototyping, local inference |
| **FLUX.1 [dev]** | ~24GB | Non-commercial | Development, fine-tuning |
| **FLUX.2 [klein] 4B** | ~13GB | Apache 2.0 | Real-time, edge, commercial |
| **Z-Image-Turbo** | 16GB | Apache 2.0 | Fastest commercial deployment |
| **Qwen-Image** | ~24GB | Apache 2.0 | Versatile generation + editing |
| **HunyuanImage 3.0** | ~40GB+ | Open weights | Complex prompts, anime |

### 6.2 Free Cloud Tiers

| Provider | Free Tier | Daily Images | Best Feature |
|----------|-----------|-------------|-------------|
| **Leonardo.ai** | 150 tokens/day | ~8-10 images | Best daily volume |
| **Playground AI** | 10 per 3hr rolling | ~80/day | Design canvas + editing |
| **Ideogram** | ~10/day | ~10/day | Best text-in-image accuracy |
| **Adobe Firefly** | Limited | Varies | Copyright-safe training |
| **Bing/DALL-E 3** | Free via Bing | Varies | Best quality for free |
| **Google Gemini** | Limited image gen | Varies | Integrated with chat |
| **Replicate** | Free on select models | Limited | FLUX, Imagen 4 |
| **HuggingFace Spaces** | CPU free | Varies | Community spaces |

### 6.3 FLUX Model Comparison

| Model | Resolution | Speed | Open Weights | Cost/API |
|-------|-----------|-------|-------------|----------|
| FLUX.2 [max] | 2048x2048 | ~10s | No | $0.10/image |
| FLUX.2 [pro] | 2048x2048 | ~5s | No | $0.05/image |
| FLUX.2 [klein] 4B | 1024x1024 | <1s | Yes (Apache 2.0) | $0.01/image |
| FLUX.1 [dev] | 1024x1024 | ~10s | Yes (non-commercial) | Free |
| FLUX.1 [schnell] | 1024x1024 | ~2s | Yes (Apache 2.0) | Free |

### 6.4 Video Generation (Free/Open Source)

| Model | Type | Hardware | Status |
|-------|------|----------|--------|
| **AnimateDiff** | Animation | 8GB+ VRAM | Open source, local |
| **ModelScope T2V** | Text-to-video | 16GB+ VRAM | Open weights |
| **LaVie** | Text-to-video | 16GB+ VRAM | Research |
| **VideoCrafter** | Text-to-video | 16GB+ VRAM | Open source |
| **CogVideo** | Text-to-video | 16GB+ VRAM | Open source |

---

## 7. FREE VOICE/SPEECH

### 7.1 Text-to-Speech (TTS)

| Model | Params | VRAM | Voice Cloning | License | Best For |
|-------|--------|------|---------------|---------|----------|
| **Kokoro-82M** | 82M | 2-3GB (CPU!) | No (54 voices) | Apache 2.0 | Fast narration, anywhere |
| **Chatterbox** | 350M-0.5B | 4-6GB | Yes (7-10s sample) | MIT | Best quality + commercial |
| **Piper TTS** | Tiny | <1GB (CPU/RPi) | No | GPL-3.0 | Raspberry Pi, edge, offline |
| **XTTS v2** | ~0.5B | 4-6GB | Yes (6s, 17 langs) | CPML (non-commercial) | Multilingual cloning (personal) |
| **Orpheus 3B** | 3B | 8-12GB | Yes + emotion tags | Apache 2.0 | Expressive, emotional speech |
| **Qwen3-TTS** | 0.6B-1.7B | 4-8GB | Yes (3s sample) | Apache 2.0 | Best permissive cloning |
| **F5-TTS** | ~336M | ~4GB | Yes (few seconds) | MIT (code) / CC-BY-NC (weights) | Research-grade cloning |
| **Fish Speech** | 0.5B-4B | 4-24GB | Yes (10-30s) | CC-BY-NC-SA (non-commercial) | Multilingual (80+ langs) |
| **Bark** | ~1B | 6-12GB | Limited | MIT | Sound effects, creative audio |

### 7.2 Speech-to-Text (ASR / Transcription)

| Tool | Type | Hardware | Speed | License | Best For |
|------|------|----------|-------|---------|----------|
| **Whisper (OpenAI)** | Local model | 4GB+ VRAM | Real-time | MIT | General transcription |
| **Whisper.cpp** | Optimized | CPU/GPU | Faster than Whisper | MIT | Edge devices, speed |
| **Faster-Whisper** | CTranslate2 | 4GB+ VRAM | 4x faster | MIT | Production transcription |
| **WhisperX** | Aligned | 4GB+ VRAM | Fast | MIT | Word-level timestamps |
| **Distil-Whisper** | Distilled | 2GB+ VRAM | 6x faster | Apache 2.0 | Real-time applications |
| **NVIDIA Canary** | Local | NVIDIA GPU | Fast | NVIDIA license | Multilingual |

### 7.3 TTS Quick Pick Guide

| Your Need | Best Model | Why |
|-----------|-----------|-----|
| Fast narration on any machine | **Kokoro-82M** | 82M params, runs on CPU, Apache 2.0 |
| Best quality + commercial | **Chatterbox** | Beat ElevenLabs in blind test, MIT |
| Clone a voice (personal) | **XTTS v2** | 17 languages, 6s sample |
| Clone a voice (commercial) | **Qwen3-TTS** | 3s sample, Apache 2.0 |
| Raspberry Pi / edge | **Piper** | <1GB, real-time on Pi 5 |
| Emotional / expressive | **Orpheus 3B** | Emotion tags, real-time |
| Sound effects / creative | **Bark** | Music, laughter, non-speech |

---

## 8. FREE EMBEDDING MODELS

### 8.1 Top Open-Source Embedding Models (All Free)

| Model | Size | Dimensions | Context | Languages | Best For |
|-------|------|------------|---------|-----------|----------|
| **BGE-M3** | ~0.3B | 1024 | 8192 | 100+ | Best overall open-source |
| **Nomic Embed v2** | 137M | 768 | 8192 | Multilingual | Local/edge, CPU-friendly |
| **Jina Embeddings v3** | 0.3B | 1024 | 8192 | 100+ | Long documents |
| **GTE-multilingual-base** | 0.3B | 768 | 8192 | 70+ | Multilingual, efficient |
| **GTE-base-en-v1.5** | 137M | 768 | 8192 | English | English retrieval |
| **Qwen3 8B Embedding** | 8B | 4096 | 8192 | 100+ | Highest accuracy |
| **EmbeddingGemma** | 300M | 768 | 8192 | 100+ | Under 1B params |
| **E5-base-v2** | 110M | 768 | 512 | English | General English |
| **all-MiniLM-L6-v2** | 22M | 384 | 256 | English | Ultra-lightweight |
| **Nomic Embed Code** | 7B | 768 | 8192 | Code | Code-specific |

### 8.2 Via Ollama (One Command)
```bash
ollama pull nomic-embed-text
ollama pull mxbai-embed-large
ollama pull bge-m3
```

### 8.3 Embedding Quick Pick

| Use Case | Best Model | Why |
|----------|-----------|-----|
| Self-hosted production | **BGE-M3** | Dense+sparse+multi-vector, 100+ langs |
| CPU/edge deployment | **Nomic Embed v2** | 137M params, runs on CPU |
| Long documents | **Jina v3** | Late chunking, 8K context |
| Multilingual RAG | **GTE-multilingual** | 70+ langs, elastic dimensions |
| Highest accuracy | **Qwen3 8B Embedding** | Apache 2.0, best benchmarks |
| Code search | **Nomic Embed Code** | Code-optimized |

---

## 9. BEST OPTION RECOMMENDATION MATRIX

### "What Should I Use For...?"

| Use Case | Best Free Option | Runner-Up | Notes |
|----------|-----------------|-----------|-------|
| **General chat (free API)** | Groq (Llama 3.1 8B) | Google Gemini | Groq: 14,400 RPD |
| **Fastest inference** | Groq (LPU hardware) | Cerebras | 500+ tok/s on 70B |
| **Highest daily tokens** | Cerebras (1M/day) | Mistral (1B/mo) | Cerebras resets daily |
| **Long context RAG** | Cerebras (8K free) | Google Gemini (1M) | Gemini: 1,500 req/day |
| **Real-time voice agent** | Groq (sub-100ms TTFT) | Cloudflare Workers AI | Groq is fastest |
| **70B model for free** | Groq (Llama 3.3 70B) | OpenRouter (Llama 70B) | Groq: 1,000 RPD |
| **No credit card needed** | Groq + Cerebras + Gemini | Add Mistral (phone only) | Stack them all |
| **Production serving** | Modal ($30/mo free) | RunPod serverless | Modal: no cold starts |
| **Local 8GB GPU** | Ollama + Llama 3.3 8B | Qwen 3 7B | Both ~6GB at Q4 |
| **Local 16GB GPU** | ExLlamaV2 + Qwen 3.5 27B | Llama 3.3 13B | 27B in 16GB with IQ3 |
| **Local 24GB GPU** | ExLlamaV2 + Qwen 3.5 27B | Llama 3.3 70B (offload) | 27B fully in VRAM |
| **Local 48GB GPU** | ExLlamaV2 + Llama 3.3 70B | DeepSeek V3 | 70B fully in VRAM |
| **CPU-only inference** | llama.cpp + Llama 3.2 1B | Ollama + Phi-4-mini | Both run on any CPU |
| **Image generation (free)** | FLUX.1 schnell (local) | Leonardo.ai (150 tokens/day) | FLUX: unlimited local |
| **Text-to-speech (free)** | Kokoro-82M (2-3GB) | Piper (Raspberry Pi) | Kokoro: best quality/size |
| **Voice cloning (free)** | Qwen3-TTS (Apache 2.0) | Chatterbox (MIT) | Qwen3: 3s sample |
| **Transcription (free)** | Whisper.cpp | Faster-Whisper | Whisper.cpp: fastest |
| **Embeddings (free)** | BGE-M3 (self-hosted) | Nomic Embed v2 (CPU) | BGE-M3: best quality |
| **Free GPU hours** | Kaggle (30hr/wk) + Colab (30hr/wk) | Lightning.ai (80hr/mo) | 60 hrs/wk combined |
| **Student/research** | Modal ($10K academic) | Lambda ($5K research) | Apply for grants |
| **EU data residency** | Mistral AI | Self-host anything | Mistral: EU-based |
| **Multi-model routing** | OpenRouter (300+ models) | HuggingFace Providers | OpenRouter: failover |
| **Edge deployment** | Cloudflare Workers AI | Ollama (local) | Workers: global edge |
| **Best coding model free** | Groq (Qwen3-32B) | GitHub Models (GPT-4o) | Qwen3: best HumanEval |
| **Creative writing** | Kobold.cpp + Llama 70B | LM Studio + any model | Kobold: designed for fiction |

---

## 10. THE $0 STACKING STRATEGY

### The "Zero Dollar Inference Stack" - Maximum Free AI

**Week 1: Get Everything Set Up**
1. Sign up for Groq (console.groq.com) - No card, instant access
2. Sign up for Cerebras (cloud.cerebras.ai) - No card, 1M tokens/day
3. Sign up for Google AI Studio (ai.google.dev) - 1,500 req/day
4. Sign up for Mistral (mistral.ai) - Phone verify, 1B tokens/month
5. Sign up for OpenRouter (openrouter.ai) - 50 free requests/day
6. Sign up for HuggingFace (huggingface.co) - Inference API
7. Install Ollama locally - `curl -fsSL https://ollama.com/install.sh | sh`
8. Install LM Studio for GUI model browsing

**Week 2: Get Free GPU Cloud**
1. Kaggle Notebooks - 30 hrs/week T4 GPU
2. Google Colab - 30 hrs/week T4 GPU
3. Lightning.ai - 80 hrs/month
4. Paperspace - Free M4000 tier
5. Sign up for Modal - $30/month free credits

**Week 3: Get Free Voice & Image**
1. Install Kokoro TTS locally - `pip install kokoro`
2. Install Whisper.cpp for transcription
3. Set up FLUX.1 schnell for local image generation
4. Sign up for Leonardo.ai - 150 tokens/day

**Total Free Capacity When Stacked:**
- **Text Generation:** ~3-4M tokens/day across all providers
- **GPU Compute:** 60+ hours/week of T4 GPU
- **Image Generation:** Unlimited local + ~10/day cloud
- **Speech:** Unlimited local TTS + transcription
- **Embeddings:** Unlimited local
- **Monthly recurring free credits:** $30 Modal, potentially $150 xAI

### Production Fallback Strategy
When free tiers hit limits:
1. Route to OpenRouter free models (automatic failover)
2. Switch to local Ollama instance
3. Use Modal $30 credits for burst GPU compute
4. Fall back to cheapest paid: DeepSeek API ($0.028/M cached)

### Startup Credit Stacking (Potentially $50K-$200K+)
1. Modal Startup Grant: up to $25,000
2. Together AI Accelerator: $15,000-$50,000
3. Google for Startups: $1,000-$25,000
4. AWS Activate: $1,000-$100,000
5. NVIDIA Inception: Various benefits
6. Lambda Research Grant: up to $5,000

---

## APPENDIX A: FREE TIER COMPARISON TABLE

| Provider | Free Tokens/Day | Req/Day | Card Required? | Models | OpenAI Compatible |
|----------|----------------|---------|----------------|--------|-------------------|
| **Google Gemini** | ~1,500 req | 1,500 | No | Gemini 2.5 Flash, Gemma | Partial |
| **Cerebras** | 1,000,000 | ~14,400 | No | gpt-oss-120b, glm-4.7 | Yes |
| **Groq** | 500K-1M | 1,000-14,400 | No | Llama 4, GPT-OSS, Qwen | Yes |
| **Mistral** | 1B/month | ~500K | No (phone) | All Mistral models | Yes |
| **NVIDIA NIM** | Prototyping | ~1,000 | No | 90+ models | Partial |
| **Cloudflare Workers AI** | 10K neurons | Unlimited | No | 20+ models | Partial |
| **HuggingFace** | ~2M (PRO) | ~1,000+/hr | No | 100K+ models | Partial |
| **OpenRouter** | 200K-1M | 50-1,000 | No ($10 unlocks) | 20+ free models | Yes |
| **SambaNova** | ~100K | 20 | No | Llama 70B, DeepSeek | Yes |
| **Fireworks AI** | $1 credit | ~500 | No | 50+ models | Yes |
| **GitHub Models** | Rate-limited | 150-1,000 | No | GPT-4o, Claude, Llama | Yes |
| **xAI Grok** | $175/mo | Tier-based | No | Grok 4.1 | Yes |

---

## APPENDIX B: LOCAL MODEL VRAM CHEAT SHEET

| GPU VRAM | Best Models (Q4_K_M) | Expected Speed |
|----------|---------------------|----------------|
| 4GB | Llama 3.2 1B, TinyLlama | 40-60 tok/s |
| 8GB | Llama 3.3 8B, Qwen 3 7B, Mistral 7B | 40-80 tok/s |
| 12GB | Llama 3.3 8B, Qwen 2.5 Coder 32B (Q3) | 30-50 tok/s |
| 16GB | Qwen 3.5 27B (IQ3), Llama 3.3 13B, Phi-4 14B | 28-40 tok/s |
| 24GB | Qwen 3.5 27B (Q4), Llama 4 Scout, Mixtral 8x7B | 20-40 tok/s |
| 32GB | Llama 3.3 70B (Q2), Qwen 3 72B (Q3) | 15-25 tok/s |
| 48GB | Llama 3.3 70B (Q4), DeepSeek V3 (Q4) | 20-35 tok/s |
| 96GB | Llama 3.3 70B (FP16), 120B+ MoE (Q4) | 30+ tok/s |

---

## APPENDIX C: QUICK SETUP COMMANDS

### Install Ollama (One Line)
```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama run llama3.1          # 8B model
ollama run llama3.1:70b      # 70B model (needs 48GB+)
ollama run qwen3:7b          # Best 7B for coding
ollama run phi4-mini         # Best tiny model
```

### Install vLLM for Serving
```bash
pip install vllm
python -m vllm.entrypoints.openai.api_server --model meta-llama/Llama-3.1-8B-Instruct
```

### Install Kokoro TTS
```bash
pip install kokoro>=0.8 soundfile
# Run: see model card at huggingface.co/hexgrad/Kokoro-82M
```

### Run Whisper.cpp
```bash
git clone https://github.com/ggerganov/whisper.cpp.git
cd whisper.cpp
make
./main -m models/ggml-base.en.bin -f audio.wav
```

### Run FLUX Locally (ComfyUI)
```bash
# Install ComfyUI + Flux models
# See: https://github.com/comfyanonymous/ComfyUI
# Models: FLUX.1 schnell (Apache 2.0) from Black Forest Labs
```

### Start ExLlamaV2 + TabbyAPI
```bash
git clone https://github.com/theroyallab/tabbyAPI.git
cd tabbyAPI
pip install -r requirements.txt
# Edit config.yml with model path
python main.py --config config.yml
# OpenAI-compatible API at http://localhost:5000
```

---

## DISCLAIMER

**All information verified as of June 2026.** Free tiers change frequently. Rate limits are subject to provider modification. Always check current provider documentation before building production workloads. Some providers listed as "no credit card required" may change their policies. GPU pricing is approximate and subject to market fluctuations. Model availability varies by platform.

**License Notice:** Models referenced carry various licenses (Apache 2.0, MIT, Llama License, DeepSeek License, etc.). Always verify licensing terms match your intended use (commercial vs. research vs. personal) before deployment.

---

*OPERATION EAT: Every AI Tool - $0 Edition*
*Compiled with obsessive detail for the AI infrastructure hunter.*
