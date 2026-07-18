# OPERATION FREE GPU — Complete Free Model Serving & Inference Infrastructure

**DEFONEOS Zero-Cost Inference Architecture v1.0**
**Last Updated: July 2025 | Classification: OPERATIONAL**

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Free Inference API Tier (Complete Provider Directory)](#2-free-inference-api-tier)
3. [Free Model Hosting Platforms](#3-free-model-hosting-platforms)
4. [Edge Deployment for Field Operations](#4-edge-deployment-for-field-operations)
5. [The DEFONEOS Inference Architecture](#5-the-defoneos-inference-architecture)
6. [Model Optimization for Free Inference](#6-model-optimization-for-free-inference)
7. [Multi-Model Routing Strategy](#7-multi-model-routing-strategy)
8. [Real-Time Inference for Defense Use Cases](#8-real-time-inference-for-defense-use-cases)
9. [Performance Benchmarks](#9-performance-benchmarks)
10. [The Complete $0 Inference Stack](#10-the-complete-0-inference-stack)
11. [Implementation Guide](#11-implementation-guide)
12. [Appendix: Provider Quick Reference](#12-appendix-provider-quick-reference)

---

## 1. Executive Summary

This document provides the complete blueprint for serving AI models at **zero ongoing cost** for DEFONEOS defense, healthcare, police, and emergency services applications. Every provider listed offers a genuinely free tier with no credit card required (unless noted).

### Key Metrics at a Glance

| Metric | Value |
|--------|-------|
| **Total Free Tokens/Month** | ~2.5 Billion+ tokens across all providers |
| **Free API Providers** | 15+ with verified free tiers |
| **Free Hosting Options** | 6 platforms |
| **Edge Deployment Cost** | $120-$499 one-time hardware |
| **Monthly Infrastructure Cost** | **$0** |
| **Daily Inference Capacity** | ~10K-50K requests/day |

### The $0 Stack in One Line

```
Text: Groq (1K RPD) + Mistral (1B tok/mo) + Gemini (1K RPD) + Cerebras (1M tok/day)
Image: Replicate + HuggingFace Spaces
Vision: GitHub Models (45+ models free) + Groq (Llama vision)
Speech: Whisper.cpp local / Groq Whisper API
Embeddings: HuggingFace Serverless API
Edge: Jetson Nano ($149) + Raspberry Pi 5 + Coral TPU ($120)
```

---

## 2. Free Inference API Tier

### 2.1 GROQ — The Speed Champion

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | 1,000 requests/day (30 RPM) |
| **Token Limits** | ~12K tokens/min on Llama 3.3 70B, up to 131K context |
| **Models Available** | Llama 3.3 70B, Llama 3.1 8B, Llama 4 Scout/Maverick, Qwen3 32B, GPT-OSS 120B, Whisper Large v3 |
| **Speed** | **500-1,000+ tokens/sec** (fastest in the industry) |
| **Signup Required** | No credit card — email only |
| **Rate Limit Per Model** | 30 RPM, 1,000 RPD (organization-level) |
| **Data Training** | No — prompts NOT used for training |

**Models Available (Free Tier):**
| Model | Context | Speed | Use Case |
|-------|---------|-------|----------|
| llama-3.3-70b-versatile | 131K | ~500 tok/s | General purpose, reasoning |
| llama-3.1-8b-instant | 131K | ~840 tok/s | Ultra-fast, lightweight tasks |
| llama-4-scout-17b-16e | 131K | ~400 tok/s | Multimodal (text + vision) |
| qwen3-32b | 131K | ~600 tok/s | Coding, math, reasoning |
| gpt-oss-120b | 131K | ~300 tok/s | Complex reasoning |
| whisper-large-v3 | Audio | Real-time | Speech-to-text |

**Pros:**
- Fastest inference speed in the industry (LPU hardware)
- OpenAI-compatible API (drop-in replacement)
- No credit card required
- Excellent for real-time applications

**Cons:**
- Daily request cap (1,000/day) limits high-volume use
- No custom model deployment
- Rate limits apply at organization level (can't bypass with multiple keys)

**Best For:** Real-time chatbots, voice agents, streaming responses, development prototyping

**API Base URL:** `https://api.groq.com/openai/v1`

---

### 2.2 CEREBRAS — The Daily Reset Champion

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | **1,000,000 tokens/day** (resets daily, never expires) |
| **Rate Limits** | ~5 req/min, 30K tokens/min |
| **Context Window** | Up to 8,192 tokens (free tier), up to 1M on paid |
| **Models Available** | gpt-oss-120b, zai-glm-4.7 (rotates) |
| **Speed** | Very fast (CS-3 wafer-scale engine) |
| **Signup Required** | No credit card |
| **Data Training** | No |

**Pros:**
- **1 million free tokens EVERY day** — most generous daily reset
- Ultra-fast inference on custom CS-3 hardware
- Resets daily, not monthly — never "saves up"
- Good for batch processing

**Cons:**
- Limited model selection on free tier (rotates)
- 8K context cap on free tier
- Lower RPM than Groq

**Best For:** Batch processing, daily report generation, data analysis, RAG pipelines

**API Base URL:** `https://api.cerebras.ai/v1`

---

### 2.3 MISTRAL AI — The Volume King

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | **1 BILLION tokens/month** |
| **Rate Limits** | 2 RPM, 500K tokens/min |
| **Models Available** | **All Mistral models** — Mistral Large, Medium, Small, Codestral, Pixtral (vision), Devstral |
| **Context Window** | 32K-256K depending on model |
| **Signup Required** | Phone verification only (no credit card) |
| **Special Offers** | Up to $30K startup credits available |

**Models Available (Free Tier):**
| Model | Best For | Notes |
|-------|----------|-------|
| mistral-large-latest | Complex reasoning, agents | Flagship model |
| mistral-medium-latest | Balanced performance | Cost-effective |
| mistral-small-latest | Fast responses | Low latency |
| codestral-latest | Code generation | Specialized for coding |
| pixtral-large-latest | Vision tasks | Image understanding |
| devstral-small-latest | Agentic coding | Free API access |

**Pros:**
- **1 BILLION tokens/month** — highest volume free tier
- Access to ALL models including flagship
- Strong European data protection (GDPR compliant)
- Excellent for high-volume applications

**Cons:**
- Low RPM (2/min) — not for real-time
- Phone verification required
- Models may be used for training (Experiment tier)

**Best For:** High-volume text processing, batch jobs, document analysis, coding assistance

**API Base URL:** `https://api.mistral.ai/v1`

---

### 2.4 GOOGLE GEMINI — The Multimodal Powerhouse

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | 250-1,000 requests/day depending on model |
| **Rate Limits** | 5-15 RPM, 250K TPM |
| **Models Available** | Gemini 2.5 Pro, Flash, Flash-Lite, 2.0 Flash |
| **Context Window** | **Up to 1 MILLION tokens** (industry-leading) |
| **Signup Required** | Google account (no credit card) |
| **Special Features** | Web search grounding, code execution, multimodal |

**Free Tier Limits by Model:**
| Model | RPM | RPD | Context | Best For |
|-------|-----|-----|---------|----------|
| Gemini 2.5 Pro | 5 | 100 | 1M tokens | Complex reasoning, analysis |
| Gemini 2.5 Flash | 10 | 250 | 1M tokens | Fast prototyping |
| Gemini 2.5 Flash-Lite | 15 | 1,000 | 1M tokens | High-volume tasks |
| Gemini 2.0 Flash | 10 | 500 | 128K tokens | General purpose |

**Pros:**
- **1 million token context window** — longest in the industry
- Native multimodal (text, image, audio, video)
- Free web search grounding
- Code execution built-in
- Excellent document analysis

**Cons:**
- Data used for Google product improvement (free tier)
- Stricter rate limits on Pro model
- Aggressive rate limiting enforcement
- Quotas reduced ~50-80% in Dec 2025

**Best For:** Document analysis, long-context tasks, multimodal applications, research

**API Base URL:** `https://generativelanguage.googleapis.com/v1beta`

---

### 2.5 GITHUB MODELS — The Hidden Gem

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | 150-1,000 requests/day depending on model |
| **Rate Limits** | 10-15 RPM |
| **Models Available** | **45+ models** including GPT-5, GPT-4.1, GPT-4o, Llama 4, DeepSeek-R1, Mistral |
| **Context Window** | Up to 200K tokens |
| **Signup Required** | GitHub account (free) — no credit card |
| **Data Training** | No |

**Available Models:**
| Model | RPM | RPD | Modality |
|-------|-----|-----|----------|
| GPT-5 | 10 | 50 | Text |
| GPT-4.1 | 10 | 50 | Text (1M context) |
| GPT-4o | 10 | 50 | Text + Vision |
| Llama-4-Scout | 15 | 150 | Text + Vision (512K ctx) |
| Llama-4-Maverick | 10 | 50 | Text + Vision (256K ctx) |
| DeepSeek-R1 | 15 | 150 | Text (reasoning) |
| Mistral-Small-3.1 | 15 | 150 | Text + Vision |

**Pros:**
- Access to GPT-5, GPT-4o, Llama 4 — frontier models FREE
- DeepSeek-R1 reasoning model included
- GitHub account = instant access
- No credit card required
- Per-request token limits (8K in / 4K out)

**Cons:**
- Low daily limits on GPT models (50 RPD)
- Per-request token caps
- Not for production high-volume use

**Best For:** Accessing frontier models, GPT-5 experimentation, coding with Copilot integration

**API Base URL:** `https://models.github.ai/inference`

---

### 2.6 HUGGINGFACE INFERENCE API — The Variety King

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | 300 requests/hour (registered), 1 req/hour (unregistered) |
| **Model Limit** | Models under ~10B parameters |
| **Models Available** | **100,000+ models** (largest catalog) |
| **Signup Required** | Free account |
| **Special Features** | Embeddings, classification, summarization, object detection |

**Three Products:**
1. **Serverless Inference API** — shared infrastructure, free tier, rate-limited (best for prototyping)
2. **Inference Endpoints** — dedicated GPU, scale-to-zero, paid (from $0.50/hr)
3. **Inference Providers** — unified gateway to 15+ providers (Groq, Together, Fireworks, Cerebras, etc.)

**What Works on Free Tier:**
- Text classification, NER, summarization
- Small LLMs (Llama 3.2 8B, Qwen 2.5 7B, Mistral 7B)
- Image classification, object detection
- Embeddings (sentence-transformers)
- Whisper (speech-to-text)

**Pros:**
- **100K+ models** — unmatched variety
- Great for task-specific models (not just LLMs)
- Excellent embedding models
- PRO at $9/month gives 25 min/day H200 ZeroGPU + 2M inference credits

**Cons:**
- Cold starts on less popular models (10-30 seconds)
- 70B+ models typically unavailable
- Rate limits hit fast for production
- Not for latency-critical workloads

**Best For:** Embeddings, specialized NLP tasks, prototyping with open-source models, image classification

**API Base URL:** `https://api-inference.huggingface.co`

---

### 2.7 CLOUDFLARE WORKERS AI — The Edge Champion

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | **10,000 requests/day** + 10K neurons/day |
| **Rate Limits** | High throughput on Workers Free |
| **Models Available** | 20+ models (LLMs, embeddings, image generation, translation) |
| **Context Window** | 2K-8K tokens depending on model |
| **Signup Required** | Cloudflare account (free) |
| **Special Feature** | **Runs on 300+ edge locations worldwide** |

**How It Works:**
Workers AI runs inference on Cloudflare's global edge network — your model executes in the data center closest to the user, with ~50ms latency globally. No GPU management, no cold starts.

**Available Models:**
- **LLMs:** Llama 3.1 8B, Mistral 7B, DeepSeek Coder, Qwen
- **Embeddings:** BGE-base, BGE-small
- **Image:** Stable Diffusion XL, Flux
- **Translation:** M2M-100, NLLB
- **Code:** DeepSeek Coder, CodeLlama

**Pros:**
- **Edge deployment** — 300+ locations, global low latency
- 10K requests/day free
- No cold starts (pre-warmed)
- Part of broader Workers platform (KV storage, Durable Objects)
- AI Gateway with caching, rate limiting, logging

**Cons:**
- Smaller context windows (2K-8K)
- Limited model selection vs. other providers
- Workers free tier has 10ms CPU limit per request

**Best For:** Edge inference, global low-latency apps, JAMstack applications, API middleware

**API Base URL:** Via Cloudflare Workers binding

---

### 2.8 OPENROUTER — The Universal Router

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | 20 RPM, 50 requests/day (1,000/day with $10 top-up) |
| **Models Available** | **400+ models** across multiple providers |
| **Free Models** | 20+ free-tier models from various providers |
| **Signup Required** | No credit card for free tier |
| **Special Feature** | **One API key for ALL providers** with automatic failover |

**How It Works:**
OpenRouter provides a unified API that routes to 400+ models from 15+ providers. Free-tier models are subsidized by OpenRouter. One key, access to everything.

**Pros:**
- **One key, 400+ models** — no managing multiple accounts
- Automatic failover between providers
- Pass-through pricing for paid models (no markup)
- 5.5% credit fee on paid usage
- BYOK (Bring Your Own Key) support — 1M requests/month free

**Cons:**
- Low free-tier daily limit (50 RPD)
- Free models may have higher latency (routed through cheapest provider)
- Limited to 8K context on free models

**Best For:** Multi-model applications, experimentation across providers, automatic failover

**API Base URL:** `https://openrouter.ai/api/v1`

---

### 2.9 NVIDIA NIM — The Enterprise Powerhouse

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | ~1,000 requests/day |
| **Rate Limits** | High RPM |
| **Models Available** | Nemotron, Llama variants, Mistral, foundation models |
| **Context Window** | 128K tokens |
| **Signup Required** | NVIDIA account (free) |
| **Special Feature** | Enterprise-grade optimization, TensorRT backend |

**Pros:**
- Enterprise-optimized inference
- TensorRT backend for maximum performance
- High-quality model implementations
- Good for production workloads

**Cons:**
- Lower daily limits
- Enterprise-focused (less developer-friendly)
- Requires NVIDIA account

**Best For:** Production NVIDIA-optimized inference, enterprise deployments

---

### 2.10 COHERE — The Embedding Specialist

| Attribute | Details |
|-----------|---------|
| **Free Tier Limit** | ~100 requests/day |
| **Rate Limits** | 10-20 RPM |
| **Models Available** | Command R+ (text), Embed (embeddings), Rerank |
| **Context Window** | 128K tokens |
| **Signup Required** | Free account |
| **Data Training** | Non-commercial only on free tier |

**Pros:**
- Excellent embedding models (multilingual)
- Command R+ is a strong RAG model
- Good reranking capabilities
- Strong RAG prototyping

**Cons:**
- Low daily limit (~100/day)
- Non-commercial use only on free tier
- Limited model selection

**Best For:** RAG applications, embeddings, reranking, non-commercial prototypes

---

### 2.11 XAI GROK — The Credit Champion

| Attribute | Details |
|-----------|---------|
| **Free Credits** | **$25 signup bonus** + **$150/month** with data sharing |
| **Total First Month** | **$175 free credits** |
| **Models Available** | Grok 4.3 (flagship), Grok 4.1 Fast, Grok 4, Grok 3 |
| **Context Window** | Up to **2 MILLION tokens** (Grok 4.1 Fast) |
| **Signup Required** | xAI account (can use X login) |
| **Data Sharing** | Required for $150/month ongoing credits |

**Model Pricing (paid, but covered by credits):**
| Model | Input $/M | Output $/M | Context | Best For |
|-------|-----------|------------|---------|----------|
| Grok 4.3 | $1.25 | $2.50 | 1M tokens | Flagship general purpose |
| Grok 4.1 Fast | $0.20 | $0.50 | 2M tokens | Cost-optimized production |
| Grok 4 | $3.00 | $15.00 | 256K tokens | Reasoning |

**Pros:**
- **$175/month in free credits** — highest monetary value
- **2 million token context** — largest available
- Real-time X/Twitter data integration
- OpenAI-compatible API
- Prompt caching (75% discount)

**Cons:**
- Data sharing required for ongoing credits
- $25 signup credits expire in 30 days
- Lower-tier models may not match GPT-4o quality

**Best For:** Long-context tasks, X data integration, high-volume usage

**API Base URL:** `https://api.x.ai/v1`

---

### 2.12 PERPLEXITY — The Research API

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Free consumer tier (5 Pro Searches/day) |
| **API Free Tier** | No permanent free API tier |
| **API Pricing** | Sonar API: $0.25/M input, $2.50/M output |
| **Special Feature** | Real-time web search with citations |
| **Signup Required** | Free account |

**Pros:**
- Real-time web search integration
- Cited answers
- Good for research applications

**Cons:**
- No free API tier (paid only)
- Consumer free tier limited to 5 Pro Searches/day
- Search API: $5 per 1,000 requests

**Best For:** Research apps requiring real-time web data (but not truly free for API)

---

### 2.13 SAMBANOVA — The Llama 405B Provider

| Attribute | Details |
|-----------|---------|
| **Free Tier** | **$5 trial credit** |
| **Models Available** | Llama 3.1 405B (largest open model), Llama 70B |
| **Speed** | Very fast (RDU hardware) |
| **Context Window** | 128K tokens |
| **Signup Required** | Credit card required |

**Pros:**
- Run Llama 3.1 405B (largest open-weight model)
- Very fast inference on custom RDU hardware
- OpenAI-compatible API

**Cons:**
- Credit card required
- Only $5 trial (limited)
- Less well-known, smaller ecosystem

**Best For:** Experimenting with Llama 405B, large model inference

---

### 2.14 TOGETHER AI — The Open-Source Hub

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Limited free tier available |
| **Models Available** | 200+ open-source LLMs |
| **Features** | Automated model tuning, broad catalog |
| **Context Window** | Model-dependent |
| **Signup Required** | Free account |

**Pros:**
- 200+ open-source models
- Good for experimentation
- Fine-tuning support
- Wide model catalog

**Cons:**
- Free tier limits not clearly published
- Dynamic rate limits
- Primarily paid service

**Best For:** Open-source model experimentation, fine-tuning

---

### 2.15 FIREWORKS AI — The Performance Optimizer

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Limited (10 RPM without card) |
| **Paid Rate** | 6,000 RPM with card |
| **Models Available** | Major open-weight models |
| **Speed** | Very fast |
| **Signup Required** | Free account |

**Pros:**
- High-performance inference
- Fast inference speeds
- Good batch processing (50% discount)

**Cons:**
- Very limited free tier (10 RPM)
- Primarily a paid service
- 6K RPM only with payment method

**Best For:** Fast inference on paid tier (not ideal for zero-cost)

---

### 2.16 REPLICATE — The Model Marketplace

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Free predictions on select models |
| **Models Available** | 10,000+ models (text, image, video, audio) |
| **Pricing** | Per-second billing; T4 models often free |
| **Signup Required** | Free account |
| **Special Feature** | Run ANY model from HuggingFace or custom |

**Pros:**
- 10,000+ models including image generation (Stable Diffusion, Flux)
- Video generation models
- Simple API — one line to run any model
- Good for prototyping

**Cons:**
- Free tier limited (paid predictions beyond certain usage)
- Cold starts for less popular models
- Acquired by Cloudflare in 2025

**Best For:** Image generation, video models, custom model deployment, prototyping

---

### 2.17 SAMBANOVA / CHUTES / NEBIUS — Emerging Providers

| Provider | Free Tier | Models | Notes |
|----------|-----------|--------|-------|
| **SambaNova** | $5 trial | Llama 405B | Custom RDU hardware, very fast |
| **Chutes** | Community tier | Various | Decentralized inference |
| **Nebius** | Trial credits | Various | GPU cloud provider |
| **Novita AI** | Free tier | Various | GPU marketplace |
| **Hyperbolic** | Free tier | Various | Decentralized GPU |
| **Featherless** | Free tier | Various | GGUF model hosting |

---

### Master Provider Comparison Table

| Provider | Free Amount | RPM | RPD | Top Models | Speed | CC Required |
|----------|-------------|-----|-----|------------|-------|-------------|
| **Groq** | 1,000 req/day | 30 | 1,000 | Llama 3.3 70B, Whisper | **500+ tok/s** | No |
| **Cerebras** | 1M tokens/day | 5 | ~1M tok | GPT-OSS 120B | Very fast | No |
| **Mistral** | 1B tokens/mo | 2 | ~25 msg | All Mistral models | Medium | No |
| **Gemini** | 1,000 req/day | 5-15 | 100-1K | Gemini 2.5 Pro/Flash | Medium | No |
| **GitHub Models** | 1,000 req/day | 10-15 | 50-1,000 | GPT-5, GPT-4o, Llama 4 | Medium | No |
| **HuggingFace** | 300 req/hour | Variable | 7,200 | 100K+ models | Slow (cold start) | No |
| **Cloudflare AI** | 10,000 req/day | High | 10,000 | Llama, Mistral, SDXL | Fast (edge) | No |
| **OpenRouter** | 50 req/day | 20 | 50 | 400+ models | Variable | No |
| **NVIDIA NIM** | ~1,000 req/day | High | ~1,000 | Nemotron, Llama | Fast | No |
| **Cohere** | ~100 req/day | 10-20 | ~100 | Command R+, Embed | Medium | No |
| **xAI Grok** | **$175/mo credits** | Generous | — | Grok 4.3 (1M ctx) | Fast | No |
| **Together AI** | Limited | Dynamic | — | 200+ OSS models | Medium | No |
| **Replicate** | Limited | — | — | 10K+ models | Variable | No |
| **Fireworks** | 10 RPM | 10 | ~144 | Major open models | Fast | No |

---


## 3. Free Model Hosting Platforms

### 3.1 HUGGINGFACE SPACES — The Demo King

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Free hosting for public demos |
| **Hardware** | Shared CPU (free), ZeroGPU (3-5 min/day free) |
| **PRO Upgrade** | $9/month for 25 min/day H200 ZeroGPU |
| **Frameworks** | Gradio, Streamlit, Docker, Static HTML |
| **GPU Access** | ZeroGPU (free tier: 3-5 min/day) |

**What You Can Run:**
- Gradio demos for any HuggingFace model
- Streamlit dashboards
- Full Docker containers with custom dependencies
- Static websites

**Pros:**
- Completely free for public spaces
- Instant deployment from GitHub or direct upload
- Built-in Gradio/Streamlit templates
- Community can discover and use your demo
- ZeroGPU for GPU-intensive demos

**Cons:**
- Public only (unless PRO/private paid)
- Free GPU limited to 3-5 min/day
- Spaces sleep after inactivity (cold start)
- Not for production APIs (rate limited)

**Best For:** Public demos, model showcases, proof-of-concept deployments

---

### 3.2 HUGGINGFACE INFERENCE ENDPOINTS — Dedicated GPU

| Attribute | Details |
|-----------|---------|
| **Pricing** | From $0.50/GPU/hour (scale-to-zero) |
| **Free Tier** | None directly (paid only) |
| **GPU Options** | T4 ($0.50/hr), L4 ($0.80/hr), A10 ($1.30/hr), A100 ($4.50/hr), H100 ($6/hr) |
| **Features** | Auto-scaling, scale-to-zero, dedicated |

**Note:** Not truly free, but with scale-to-zero, a low-traffic model can cost $0-20/month. Combined with HuggingFace PRO credits, can be nearly free.

**Best For:** Production single-model deployment with predictable load

---

### 3.3 REPLICATE — The Model Host

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Free predictions on select models |
| **Hosting** | Deploy any model from HuggingFace |
| **Pricing** | Per-second billing, scales to zero |
| **Special** | One-line deployment from HuggingFace |

**How to Deploy:**
```python
# Push any HuggingFace model to Replicate
import replicate
# Model becomes available as API endpoint automatically
```

**Pros:**
- Deploy any model with one command
- Automatic API generation
- Scales to zero (no cost when idle)
- Great for custom fine-tuned models

**Cons:**
- Free tier limited
- Cold starts for custom models
- Paid beyond free tier

**Best For:** Custom model hosting, image generation APIs, video models

---

### 3.4 VERCEL — The Serverless Host

| Attribute | Details |
|-----------|---------|
| **Free Tier** | Next.js API routes, serverless functions |
| **Limitations** | 10-second timeout on free tier |
| **Use Case** | Can run small ONNX models in API routes |
| **AI Gateway** | Multi-provider routing, caching, rate limiting |

**Running Models on Vercel:**
```javascript
// Next.js API route running a small ONNX model
export default async function handler(req, res) {
  // Load ONNX model, run inference
  // Good for small classification models
}
```

**Pros:**
- Free tier generous (100GB bandwidth)
- AI Gateway for multi-provider routing
- Edge functions for low-latency inference
- Great for API frontends

**Cons:**
- 10-second timeout (free tier) — no large models
- 50MB function size limit
- Not for LLM inference directly

**Best For:** API gateways, inference proxies, small ONNX models, frontend apps

---

### 3.5 MODAL — The Serverless GPU Powerhouse

| Attribute | Details |
|-----------|---------|
| **Free Tier** | **$30/month in free credits** |
| **GPU Pricing** | T4: $0.59/hr, A100: $2.50/hr, H100: $3.95/hr |
| **Features** | Serverless GPU, autoscaling, sub-second cold start |
| **Academic Credits** | Up to $10K for researchers |

**What $30/Month Gets You:**
- ~50 hours of T4 GPU inference
- ~12 hours of A100 inference
- ~7.5 hours of H100 inference
- Unlimited CPU time (within $30)

**Pros:**
- **$30/month free credits** — most generous free GPU tier
- Sub-second container boot (fastest cold start)
- Python-native (decorator-based)
- Scales to zero
- Academic credit grants available

**Cons:**
- Requires payment method after credits
- Python-specific ecosystem
- Learning curve for decorators

**Best For:** Serverless GPU inference, batch processing, scheduled jobs

---

### 3.6 BEAM.CLOUD — The Developer-Friendly GPU

| Attribute | Details |
|-----------|---------|
| **Free Tier** | **10 hours of free GPU credit** on signup |
| **Pricing** | Less than $2/hour for GPU |
| **Features** | Hot reloading, autoscaling, serverless |
| **Cold Start** | Sub-second for custom models |

**Pros:**
- Hot reloading during development
- Fast cold starts
- No Docker knowledge needed
- Good developer experience

**Cons:**
- Only 10 hours free (one-time)
- Smaller ecosystem than Modal
- Newer platform

**Best For:** Development and testing, rapid prototyping

---

### 3.7 ORACLE CLOUD FREE TIER — The Always-Free VPS

| Attribute | Details |
|-----------|---------|
| **Always Free** | 2x AMD VMs (1 OCPU, 1GB RAM) + 2x ARM VMs (4 OCPU, 24GB RAM) |
| **ARM Instances** | Up to 4 cores + 24GB RAM (Ampere A1) |
| **Storage** | 200GB block volume |
| **Data Transfer** | **10TB/month outbound** |
| **Credit Card** | Required for signup (not charged) |
| **Duration** | Forever ("Always Free") |

**Running Ollama on Oracle Cloud ARM:**
```bash
# 1. Create ARM instance (4 cores, 24GB RAM) — Always Free
# 2. Install Ollama
 curl -fsSL https://ollama.com/install.sh | sh
# 3. Run models (CPU inference)
 ollama run llama3.2  # 3B model, fast on ARM
 ollama run mistral     # 7B model, usable
 ollama run gemma2:2b   # 2B model, very fast
```

**Pros:**
- **TRULY FOREVER FREE** — never expires
- ARM instances quite capable (4 cores, 24GB)
- 10TB/month bandwidth
- Can run Ollama for local LLM inference
- Good for always-on services

**Cons:**
- No GPU (CPU only)
- Credit card required for signup
- No SLA on Always Free tier
- Can have capacity issues

**Best For:** Ollama self-hosting, always-on inference server, API proxy, monitoring

---

### 3.8 RUNPOD — The Cheap Serverless GPU

| Attribute | Details |
|-----------|---------|
| **Free Tier** | No free tier (paid only) |
| **Pricing** | T4: $0.40/hr, A100: $1.89-2.17/hr, H100: $4.47/hr |
| **Serverless** | Per-second billing, autoscaling |
| **Cold Start** | 48% under 200ms (FlashBoot) |

**Note:** Not free, but cheapest serverless GPU for when you need dedicated inference. Mentioned here as the "almost free" option for production.

**Best For:** Production inference when free tiers are exhausted, dedicated GPU workloads

---

### Hosting Comparison Table

| Platform | Free Tier | GPU | Scale-to-Zero | Best For |
|----------|-----------|-----|---------------|----------|
| **HF Spaces** | Public demos | 3-5 min/day | Yes | Demos, showcases |
| **HF Endpoints** | None ($0.50/hr+) | Yes | Yes | Production single-model |
| **Replicate** | Limited preds | Yes | Yes | Custom model hosting |
| **Vercel** | 10s timeout | No | Yes | API gateways, small ONNX |
| **Modal** | **$30/mo credit** | Yes | Yes | Serverless GPU inference |
| **Beam.cloud** | **10 hrs free** | Yes | Yes | Dev/test, prototyping |
| **Oracle Cloud** | **Always Free ARM** | No (CPU) | N/A | Ollama self-hosting |
| **RunPod** | None (cheap) | Yes | Yes | Production GPU inference |

---

## 4. Edge Deployment for Field Operations

### 4.1 The Edge Deployment Matrix

| Hardware | Price | TOPS | Power | Best For | Models |
|----------|-------|------|-------|----------|--------|
| **Raspberry Pi 5** | $60 | 0 (CPU) | 15W | Lightweight inference | MobileNet, YOLO-Nano, TFLite |
| **Pi 5 + Coral TPU** | $120 | 4 TOPS | 15W | Object detection | YOLO-Lite, MobileNet, EfficientDet |
| **NVIDIA Jetson Nano** | $149 | 0.5 TFLOPS | 10W | Entry edge AI | YOLOv8n, ResNet, MobileNet |
| **NVIDIA Jetson Orin Nano** | $499 | 40 TOPS | 15W | Serious edge AI | YOLOv8, SAM, LLM (quantized) |
| **NVIDIA Jetson Orin NX** | $600 | 100 TOPS | 25W | Professional edge | YOLOv8m/l, larger models |
| **Intel NUC 12** | $400 | 0 (CPU) | 65W | x86 inference | OpenVINO optimized models |
| **Apple Mac Mini M2** | $599 | 15.8 TOPS | 10W | Silent, efficient | CoreML, llama.cpp |
| **Orange Pi 5 + NPU** | $80 | 13 TOPS | 8W | Budget edge | RKNN models |

### 4.2 Detailed Hardware Breakdown

#### Raspberry Pi 5 + Coral TPU ($120 total)

```
Setup:
- Raspberry Pi 5 (8GB): $60
- Coral USB TPU: $60
- Total: $120

Performance:
- YOLOv8n (TFLite + Edge TPU): ~15-20 FPS
- MobileNetV3 classification: ~30 FPS
- EfficientDet-Lite: ~10 FPS
- Power: ~10-15W total

Use Cases:
- Perimeter security (single camera)
- License plate recognition
- Crowd counting
- Weapon detection (small scale)

Quantization Required:
- INT8 quantization for TFLite
- Model must fit Edge TPU (8MB cache)
```

#### NVIDIA Jetson Nano 4GB ($149)

```
Specs:
- GPU: 128-core Maxwell
- RAM: 4GB LPDDR4 (shared with GPU)
- Power: 5-10W
- Storage: microSD

Performance (TensorRT):
- YOLOv8n: 15-25 FPS (FP16)
- YOLOv8s: 8-12 FPS (FP16)
- ResNet50: ~30 FPS
- MobileNetV2: ~60 FPS

Limitations:
- 4GB RAM is constraining
- No longer actively supported (JetPack 4.x)
- microSD storage (slow)

Use Cases:
- Single-camera object detection
- Entry-level drone inference
- Portable demo units
```

#### NVIDIA Jetson Orin Nano 8GB ($499)

```
Specs:
- GPU: 1024-core Ampere (with Tensor Cores)
- AI Performance: 40 TOPS (INT8)
- RAM: 8GB LPDDR5 (shared)
- Power: 7-15W
- Storage: NVMe SSD support

Performance (TensorRT):
- YOLOv8n: 60 FPS (FP16), 80 FPS (INT8)
- YOLOv8s: 40 FPS (FP16)
- YOLOv8m: 25 FPS (FP16)
- YOLOv8l: 15 FPS (FP16)
- SAM (Segment Anything): 2-3 sec/image
- Llama 2 7B (llama.cpp, INT4): ~5-8 tok/s
- Whisper Base: real-time transcription

Use Cases:
- Multi-camera security systems
- Drone real-time detection
- Vehicle-mounted inference
- Portable command center
- First responder helmet cameras

Why It's the Sweet Spot:
- 40 TOPS in 15W — incredible efficiency
- Active support (JetPack 6.x)
- NVMe for fast model loading
- TensorRT for maximum optimization
```

#### Jetson Orin NX 16GB ($600)

```
Specs:
- AI Performance: 100 TOPS (INT8)
- RAM: 16GB LPDDR5
- Power: 10-25W

Performance (TensorRT):
- YOLOv8n: 100+ FPS (INT8)
- YOLOv8m: 50+ FPS (INT8)
- YOLOv8l: 30+ FPS (INT8)
- YOLOv8x: 15+ FPS (INT8)

Use Cases:
- Multi-stream video analytics
- High-resolution satellite imagery
- Autonomous vehicle perception
- Command-center edge nodes
```

#### Apple Mac Mini M2 ($599) / M4 ($499)

```
Specs:
- Neural Engine: 16-core (M2) / 16-core (M4)
- Performance: 15.8 TOPS (M2), 38 TOPS (M4)
- RAM: 8-24GB unified memory
- Power: ~10W (M2), ~15W (M4)

Performance (CoreML / llama.cpp):
- YOLOv8n (CoreML): 60+ FPS
- Llama 3.2 3B (llama.cpp): 60+ tok/s
- Llama 3.1 8B (llama.cpp): 25-30 tok/s
- Mistral 7B (llama.cpp): 20-25 tok/s
- Whisper (whisper.cpp): real-time
- SAM (CoreML): 1-2 sec/image

Advantages:
- Silent (fanless M2, quiet M4)
- Very low power
- Excellent LLM performance via llama.cpp
- Great for field command posts

Use Cases:
- Mobile command center NLP
- Real-time transcription
- On-site document analysis
- Drone ground station
```

### 4.3 Use Case → Hardware Mapping

| Use Case | Recommended Hardware | Cost | Why |
|----------|---------------------|------|-----|
| **Drone object detection** | Jetson Orin Nano | $499 | 40 TOPS, 15W, lightweight |
| **CCTV security (1-4 cameras)** | Jetson Orin Nano 8GB | $499 | Multi-stream capable |
| **CCTV security (8+ cameras)** | Jetson Orin NX 16GB | $600 | 100 TOPS, handles many streams |
| **First responder bodycam** | Jetson Nano + battery | $149 + $30 | Cheap, disposable, 10W |
| **Field transcription** | Mac Mini M2 | $599 | Best Whisper + NLP performance |
| **Satellite imagery analysis** | Jetson Orin NX | $600 | Large RAM for big images |
| **Perimeter IoT sensors** | Pi 5 + Coral TPU | $120 | Cheapest option, good enough |
| **Vehicle dashboard** | Jetson Orin Nano | $499 | 12V power, compact |
| **Portable command center** | Mac Mini M4 | $499 | Best all-around, silent |
| **Budget deployments** | Orange Pi 5 + NPU | $80 | 13 TOPS, under $100 |

### 4.4 Model Optimization for Edge

#### Quantization Pipeline

```
Original Model (FP32)
    |
    v
TensorRT Optimization (FP16) → 2x speedup, same accuracy
    |
    v
TensorRT Optimization (INT8) → 4x speedup, <1% accuracy loss
    |
    v
TensorRT Optimization (INT4) → 8x speedup, ~2% accuracy loss
```

#### Format Conversion Guide

| Format | Best For | Tools | Speedup |
|--------|----------|-------|---------|
| **TensorRT** | NVIDIA GPUs (Jetson) | trtexec, polygraphy | 2-8x |
| **ONNX Runtime** | Cross-platform | onnxruntime | 1.5-3x |
| **OpenVINO** | Intel CPUs/GPUs | openvino-dev | 2-5x |
| **CoreML** | Apple Silicon | coremltools | 3-10x |
| **TFLite** | Mobile/embedded | tflite_converter | 2-4x |
| **RKNN** | Rockchip NPU | rknn-toolkit | 3-5x |
| **GGUF** | LLMs via llama.cpp | llama.cpp convert | 2-4x |

#### TensorRT Optimization Example (Jetson)

```bash
# 1. Export YOLOv8 to ONNX
yolo export model=yolov8n.pt format=onnx opset=13

# 2. Convert ONNX to TensorRT (FP16)
/usr/src/tensorrt/bin/trtexec \
  --onnx=yolov8n.onnx \
  --saveEngine=yolov8n.engine \
  --fp16 \
  --workspace=4096

# 3. Run inference with TensorRT
# Result: 60 FPS on Jetson Orin Nano (vs 20 FPS PyTorch)
```

#### INT8 Calibration for Maximum Speed

```bash
# INT8 with calibration (best accuracy)
/usr/src/tensorrt/bin/trtexec \
  --onnx=yolov8n.onnx \
  --saveEngine=yolov8n_int8.engine \
  --int8 \
  --calibInt8 \
  --calibData=calibration_images/ \
  --workspace=4096

# Result: 80 FPS on Jetson Orin Nano, <0.5% mAP loss
```

---

## 5. The DEFONEOS Inference Architecture

### 5.1 Architecture Overview

```
                    +------------------------------------------+
                    |            APPLICATION LAYER              |
                    |  (Defense, Healthcare, Police, Emergency) |
                    +------------------------------------------+
                                       |
                    +------------------------------------------+
                    |         INTELLIGENT ROUTER LAYER          |
                    |  (Route by: model type, cost, latency,    |
                    |   availability, data classification)      |
                    +------------------------------------------+
                                       |
          +----------------------------+----------------------------+
          |                            |                            |
+---------v---------+      +-----------v-----------+      +--------v----------+
|  TIER 1: FREE APIs |      | TIER 2: SELF-HOSTED   |      | TIER 3: EDGE      |
|  (Rate-limited)    |      | (Always-on)           |      | (Field devices)   |
+--------------------+      +-----------------------+      +-------------------+
| Groq (1K RPD)      |      | Oracle Cloud ARM      |      | Jetson Orin Nano  |
| Mistral (1B/mo)    |      |  - Ollama (LLMs)      |      |  - YOLO detection |
| Gemini (1K RPD)    |      |  - Whisper.cpp        |      |  - Local vision   |
| Cerebras (1M/day)  |      |  - Custom APIs        |      |  - Offline NLP    |
| GitHub Models      |      |                       |      |                   |
| Cloudflare AI      |      |                       |      | RPi 5 + Coral TPU |
| HuggingFace API    |      |                       |      |  - Perimeter IoT  |
| OpenRouter         |      |                       |      |  - Gate detection |
+--------------------+      +-----------------------+      +-------------------+
          |                            |                            |
          +----------------------------+----------------------------+
                                       |
                    +------------------------------------------+
                    |         MODEL REGISTRY + CACHE             |
                    |  (HuggingFace Hub + Local Model Store)    |
                    +------------------------------------------+
```

### 5.2 Data Flow by Use Case

#### Use Case 1: Real-Time Chat / Text Analysis
```
User Request
    |
    v
[Router] → Check: Is it low-latency required?
    | Yes
    v
[Groq] → Process (500 tok/s)
    |
    v
[Response] < 100ms
```

#### Use Case 2: Document Analysis (Long Context)
```
Document Upload
    |
    v
[Router] → Check: Is it > 100K tokens?
    | Yes
    v
[Gemini 2.5 Pro] → Process (1M context)
    |
    v
[Analysis Complete]
```

#### Use Case 3: Batch Report Generation
```
Daily Batch Job
    |
    v
[Cerebras] → 1M free tokens/day
    | (Reset daily, perfect for reports)
    v
[Report Generated] → Save to storage
```

#### Use Case 4: High-Volume Processing
```
High Volume Stream
    |
    v
[Mistral] → 1B tokens/month
    | (2 RPM but massive token volume)
    v
[Processed] → Continue streaming
```

#### Use Case 5: Drone Object Detection
```
Camera Feed
    |
    v
[Jetson Orin Nano] → YOLOv8 (60 FPS)
    |
    +---> Person detected (confidence: 0.94)
    |       |
    |       v
    |   [Alert sent via LoRa/cellular]
    |
    +---> No threat → Continue monitoring
```

#### Use Case 6: Field Transcription
```
Radio/Voice Communication
    |
    v
[Whisper.cpp on Mac Mini M2]
    |
    v
[Transcription] → [Groq API for analysis]
    |
    v
[Actionable intelligence extracted]
```

### 5.3 The Multi-Provider Failover System

```python
# DEFONEOS Intelligent Router
PRIORITY_TIERS = {
    "text_small_fast": ["groq", "cloudflare", "github_models"],
    "text_large_complex": ["gemini", "cerebras", "mistral"],
    "text_high_volume": ["mistral", "groq", "cerebras"],
    "vision": ["groq_llama4", "gemini", "github_models"],
    "code": ["github_models", "groq", "mistral_codestral"],
    "embeddings": ["huggingface", "cloudflare"],
    "speech": ["groq_whisper", "whisper_local"],
}

FAILOVER_CHAIN = {
    "primary": "groq",
    "secondary": "mistral",
    "tertiary": "gemini",
    "fallback": "cerebras",
    "local": "ollama_oracle_cloud",
}

COST_AWARE_ROUTING = True  # Always pick free tier first
```

---

## 6. Model Optimization for Free Inference

### 6.1 The Optimization Stack

| Technique | Speedup | Size Reduction | Best For |
|-----------|---------|----------------|----------|
| **FP16 (half precision)** | 2x | 50% | All GPUs |
| **INT8 Quantization** | 4x | 75% | NVIDIA (TensorRT) |
| **INT4 Quantization** | 8x | 87.5% | llama.cpp, edge devices |
| **Pruning** | 1.5-3x | 30-70% | Structured pruning |
| **Knowledge Distillation** | 2-5x | 80%+ | Student models |
| **ONNX Export** | 1.5-3x | — | Cross-platform |
| **TensorRT** | 2-8x | — | NVIDIA GPUs |
| **OpenVINO** | 2-5x | — | Intel hardware |
| **CoreML** | 3-10x | — | Apple Silicon |

### 6.2 LLM Optimization with llama.cpp

#### Running 70B Models on Consumer Hardware

```
Model Size Requirements:
- 70B model FP16: ~140GB VRAM  → Needs 2x A100 80GB
- 70B model Q4_K_M (GGUF): ~42GB → Fits 1x A100 48GB
- 70B model Q4_K_M: ~42GB → Fits RTX 4090 24GB + CPU offload
- 70B model Q2_K: ~26GB → Fits RTX 3090 24GB
- 8B model Q4_K_M: ~4.5GB → Fits ANY GPU
- 8B model Q4_K_M: ~4.5GB → Runs on Jetson Orin Nano!
```

#### llama.cpp Performance Guide

```bash
# Install llama.cpp (with CUDA)
git clone https://github.com/ggerganov/llama.cpp
cd llama.cpp && cmake -B build -DLLAMA_CUDA=ON && cmake --build build -j

# Run optimized inference
./build/bin/llama-cli \
  -m models/llama-3.3-70b-Q4_K_M.gguf \
  -p "You are a defense analyst. Analyze this intel:" \
  -n 512 \
  --ctx-size 8192 \
  --batch-size 512 \
  --threads 16 \
  --tensor-split 0.8,0.2  # Multi-GPU split
```

### 6.3 GGUF Quantization Levels

| Quant | Bits | Size (70B) | Quality | Speed | Use Case |
|-------|------|------------|---------|-------|----------|
| Q2_K | 2.5 | 26GB | Fair | Fastest | Emergency, edge |
| Q3_K_M | 3 | 31GB | Good | Fast | Resource constrained |
| **Q4_K_M** | **4** | **42GB** | **Excellent** | **Fast** | **Best balance** |
| Q5_K_M | 5 | 49GB | Near-perfect | Medium | Quality critical |
| Q6_K | 6 | 55GB | Indistinguishable | Slow | Archival |
| Q8_0 | 8 | 74GB | Lossless | Slowest | Benchmarks |

### 6.4 vLLM for High-Throughput Serving

```python
# vLLM: PagedAttention for maximum throughput
# Install: pip install vllm

from vllm import LLM, SamplingParams

# Load model with automatic optimization
llm = LLM(
    model="meta-llama/Llama-3.1-8B",
    quantization="awq",  # 4-bit AutoAWQ
    tensor_parallel_size=1,
    gpu_memory_utilization=0.95,
)

# Generate with high throughput
sampling_params = SamplingParams(temperature=0.7, max_tokens=512)
outputs = llm.generate(prompts, sampling_params)
# Throughput: 1000+ tok/s on A100 with batching
```

### 6.5 Text Generation Inference (TGI) — HuggingFace

```bash
# Run TGI Docker container
docker run --gpus all \
  -p 8080:80 \
  -v $(pwd)/data:/data \
  ghcr.io/huggingface/text-generation-inference:latest \
  --model-id meta-llama/Llama-3.1-8B-Instruct \
  --quantize bitsandbytes-nf4 \
  --max-batch-total-tokens 32768
```

### 6.6 ONNX Runtime Optimization

```python
# Convert and optimize with ONNX
import onnx
from onnxruntime.quantization import quantize_dynamic, QuantType

# 1. Export to ONNX
# 2. Dynamic quantization
quantize_dynamic(
    model_input="model.onnx",
    model_output="model_int8.onnx",
    weight_type=QuantType.QInt8,
)

# Result: 3-4x faster inference, 75% smaller model
```

---

## 7. Multi-Model Routing Strategy

### 7.1 The DEFONEOS Router

```python
"""
DEFONEOS Intelligent Inference Router
Routes requests to the best free provider based on:
- Model type (text/vision/code/speech)
- Latency requirements
- Token count
- Current provider availability
- Rate limit status
"""

import asyncio
from dataclasses import dataclass
from typing import Optional, List
from enum import Enum

class TaskType(Enum):
    TEXT_SMALL = "text_small"       # < 1K tokens, fast
    TEXT_LARGE = "text_large"       # > 1K tokens, complex
    TEXT_BATCH = "text_batch"       # High volume
    VISION = "vision"               # Image understanding
    CODE = "code"                   # Code generation
    EMBEDDING = "embedding"         # Vector embeddings
    SPEECH = "speech"               # STT/TTS

class Priority(Enum):
    SPEED = "speed"
    COST = "cost"
    QUALITY = "quality"

@dataclass
class ProviderStatus:
    name: str
    requests_remaining: int
    tokens_remaining: int
    avg_latency_ms: float
    is_healthy: bool

# Provider configurations
PROVIDERS = {
    "groq": {
        "rpm": 30, "rpd": 1000, "token_limit": None,
        "strengths": ["speed", "text_small", "speech"],
        "models": ["llama-3.3-70b", "llama-3.1-8b", "whisper"],
        "latency_ms": 50,
    },
    "mistral": {
        "rpm": 2, "rpd": None, "token_limit": 1_000_000_000,  # per month
        "strengths": ["volume", "text_batch", "code"],
        "models": ["mistral-large", "codestral", "pixtral"],
        "latency_ms": 500,
    },
    "gemini": {
        "rpm": 15, "rpd": 1000, "token_limit": None,
        "strengths": ["long_context", "vision", "multimodal"],
        "models": ["gemini-2.5-pro", "gemini-2.5-flash"],
        "latency_ms": 200,
    },
    "cerebras": {
        "rpm": 5, "rpd": None, "token_limit": 1_000_000,  # per day
        "strengths": ["batch", "daily_reset"],
        "models": ["gpt-oss-120b"],
        "latency_ms": 300,
    },
    "github_models": {
        "rpm": 15, "rpd": 1000, "token_limit": None,
        "strengths": ["frontier", "gpt_access"],
        "models": ["gpt-5", "gpt-4o", "llama-4"],
        "latency_ms": 400,
    },
}

class InferenceRouter:
    """Routes inference requests to the optimal free provider."""
    
    def __init__(self):
        self.provider_stats = {name: ProviderStatus(
            name=name,
            requests_remaining=cfg["rpd"] or 999999,
            tokens_remaining=cfg["token_limit"] or 999999,
            avg_latency_ms=cfg["latency_ms"],
            is_healthy=True,
        ) for name, cfg in PROVIDERS.items()}
    
    def route(self, task_type: TaskType, priority: Priority = Priority.COST) -> str:
        """Select the best provider for the task."""
        candidates = []
        
        for name, cfg in PROVIDERS.items():
            status = self.provider_stats[name]
            if not status.is_healthy:
                continue
            if status.requests_remaining <= 0:
                continue
                
            score = self._score_provider(cfg, status, task_type, priority)
            candidates.append((score, name))
        
        candidates.sort(reverse=True)
        return candidates[0][1] if candidates else "local_fallback"
    
    def _score_provider(self, cfg, status, task, priority):
        score = 0.0
        
        # Match task to provider strengths
        if task.value in cfg["strengths"]:
            score += 100
            
        # Prioritize by user preference
        if priority == Priority.SPEED:
            score += 1000 / (status.avg_latency_ms + 1)
        elif priority == Priority.COST:
            score += status.requests_remaining / 1000
            score += status.tokens_remaining / 1e6
            
        return score

# Usage
router = InferenceRouter()
provider = router.route(TaskType.TEXT_SMALL, Priority.SPEED)
# Returns "groq" for fast small text tasks

provider = router.route(TaskType.TEXT_BATCH, Priority.COST)
# Returns "mistral" for high-volume batch processing
```

### 7.2 Rate Limit Tracking

```python
# Rate limit tracker with automatic failover
class RateLimitTracker:
    def __init__(self):
        self.limits = {
            "groq": {"rpd": 1000, "used_today": 0},
            "mistral": {"monthly_tokens": 1_000_000_000, "used_monthly": 0},
            "gemini": {"rpd": 1000, "used_today": 0},
            "cerebras": {"daily_tokens": 1_000_000, "used_today": 0},
        }
    
    def can_use(self, provider: str) -> bool:
        limits = self.limits.get(provider, {})
        
        if "rpd" in limits:
            return limits["used_today"] < limits["rpd"]
        if "monthly_tokens" in limits:
            return limits["used_monthly"] < limits["monthly_tokens"]
        if "daily_tokens" in limits:
            return limits["used_today"] < limits["daily_tokens"]
        return True
    
    def record_usage(self, provider: str, tokens: int = 1):
        if provider in self.limits:
            self.limits[provider]["used_today"] = \
                self.limits[provider].get("used_today", 0) + tokens
```

---

## 8. Real-Time Inference for Defense Use Cases

### 8.1 Use Case: Drone Surveillance System

```
+-----------------------------------------------------------+
|                    DRONE SURVEILLANCE                      |
+-----------------------------------------------------------+
|                                                           |
|  [Camera] → [Jetson Orin Nano] → [Detection Pipeline]     |
|                  |                                        |
|                  v                                        |
|         +---------------+                                 |
|         |  YOLOv8 (TRT) |  60 FPS object detection       |
|         |  INT8 quantized |  Person, vehicle, weapon      |
|         +---------------+                                 |
|                  |                                        |
|                  v                                        |
|         +---------------+                                 |
|         |  Tracking     |  DeepSort multi-object track    |
|         |  (ByteTrack)  |  Persistent IDs                 |
|         +---------------+                                 |
|                  |                                        |
|                  v                                        |
|         +---------------+                                 |
|         |  Alert Logic  |  Confidence > 0.85?             |
|         |               |  Unauthorized zone?             |
|         +---------------+                                 |
|                  |                                        |
|         +--------+--------+                                |
|         |                 |                                |
|    [No Alert]      [ALERT TRIGGERED]                       |
|    Continue          |                                     |
|    monitoring        v                                     |
|              [Cellular/LoRa]                                |
|              [Transmit to]                                  |
|              [Command Center]                               |
|                                                           |
|  Hardware: Jetson Orin Nano ($499)                        |
|  Model: YOLOv8n TensorRT INT8                             |
|  Speed: 60 FPS @ 640x640                                  |
|  Power: 15W (battery: 4+ hours)                           |
|  Cost: $499 one-time                                       |
+-----------------------------------------------------------+
```

### 8.2 Use Case: CCTV Anomaly Detection

```
+-----------------------------------------------------------+
|                  CCTV ANOMALY DETECTION                    |
+-----------------------------------------------------------+
|                                                           |
|  [CCTV Feed] → [Local NVR] → [Cloudflare Workers AI]     |
|                                   |                        |
|                                   v                        |
|                          +---------------+                 |
|                          | Frame sampling|  1 fps capture  |
|                          | (edge)        |                 |
|                          +---------------+                 |
|                                   |                        |
|                                   v                        |
|                          +---------------+                 |
|                          | Workers AI    |  Image classify |
|                          | Llama Vision  |  Anomaly detect |
|                          | (edge, 50ms)  |                 |
|                          +---------------+                 |
|                                   |                        |
|                          +--------+--------+               |
|                          |                 |               |
|                    [Normal]         [Anomaly]              |
|                    Discard          Alert + Log            |
|                                                           |
|  Free Tier: 10,000 frames/day analyzed                    |
|  Latency: ~50ms (global edge)                             |
|  Cost: $0/month                                           |
+-----------------------------------------------------------+
```

### 8.3 Use Case: Emergency Services Transcription

```
+-----------------------------------------------------------+
|            EMERGENCY SERVICES TRANSCRIPTION                |
+-----------------------------------------------------------+
|                                                           |
|  [Radio Audio] → [Mac Mini M2] → [Whisper.cpp]            |
|                                      |                    |
|                                      v                    |
|                             +---------------+              |
|                             | Real-time STT |  <100ms     |
|                             | (coreml/CPU)  |  latency    |
|                             +---------------+              |
|                                      |                    |
|                                      v                    |
|                             +---------------+              |
|                             | [Groq API]    |  Analysis   |
|                             | Text analysis |  Extract    |
|                             | (when online) |  location,  |
|                             +---------------+  incident   |
|                                      |       type, units  |
|                                      v                    |
|                             +---------------+              |
|                             | Alert Dispatch|  Auto-send  |
|                             | System        |  to CAD     |
|                             +---------------+              |
|                                                           |
|  Local: Whisper.cpp (offline capable)                     |
|  Cloud: Groq (1,000 requests/day free)                    |
|  Fallback: Ollama on Oracle Cloud                         |
|  Total Cost: $0/month                                     |
+-----------------------------------------------------------+
```

### 8.4 Use Case: Satellite Imagery Analysis

```
+-----------------------------------------------------------+
|            SATELLITE IMAGERY ANALYSIS                      |
+-----------------------------------------------------------+
|                                                           |
|  [Satellite Image] → [Scheduled Job] → [Free API Pipeline]|
|                                                           |
|  Schedule: Daily batch (00:00 UTC)                        |
|                                                           |
|  Step 1: [Cerebras API]                                   |
|          - 1M free tokens/day                             |
|          - Image description + change detection             |
|          - "Compare today vs yesterday's image of Port X"  |
|                                                           |
|  Step 2: [Gemini 2.5 Pro]                                 |
|          - 1M context for large images                      |
|          - Detailed analysis if needed                     |
|          - Grounding verification                          |
|                                                           |
|  Step 3: [Mistral API]                                    |
|          - 1B tokens/month                                |
|          - Report generation in structured format           |
|          - Translation if needed                           |
|                                                           |
|  Output: Daily intelligence report                        |
|  Cost: $0/month (uses daily Cerebras reset)               |
+-----------------------------------------------------------+
```

---

## 9. Performance Benchmarks

### 9.1 LLM Inference Benchmarks

| Model | Provider | Speed | Latency | Context | Free Tier |
|-------|----------|-------|---------|---------|-----------|
| Llama 3.3 70B | Groq | **500 tok/s** | ~50ms | 131K | 1,000 RPD |
| Llama 3.1 8B | Groq | **840 tok/s** | ~30ms | 131K | 1,000 RPD |
| GPT-OSS 120B | Cerebras | ~300 tok/s | ~80ms | 131K | 1M tok/day |
| Mistral Large | Mistral | ~50 tok/s | ~200ms | 256K | 1B tok/mo |
| Gemini 2.5 Pro | Gemini | ~40 tok/s | ~300ms | **1M** | 100 RPD |
| GPT-5 | GitHub | ~30 tok/s | ~500ms | 200K | 50 RPD |
| Llama 3.2 3B | llama.cpp M2 | **60 tok/s** | Local | 128K | Always |
| Llama 3.1 8B | llama.cpp M2 | ~25 tok/s | Local | 128K | Always |
| Mistral 7B | llama.cpp M2 | ~20 tok/s | Local | 32K | Always |
| Llama 3.2 3B | Ollama ARM | ~15 tok/s | Local | 128K | Always |

### 9.2 Edge Object Detection Benchmarks

| Hardware | Model | Precision | Resolution | FPS | Power |
|----------|-------|-----------|------------|-----|-------|
| Jetson Orin NX | YOLOv8n | TensorRT INT8 | 640x640 | **100+** | 25W |
| Jetson Orin Nano | YOLOv8n | TensorRT INT8 | 640x640 | **80** | 15W |
| Jetson Orin Nano | YOLOv8n | TensorRT FP16 | 640x640 | **60** | 15W |
| Jetson Orin Nano | YOLOv8s | TensorRT FP16 | 640x640 | 40 | 15W |
| Jetson Orin Nano | YOLOv8m | TensorRT FP16 | 640x640 | 25 | 15W |
| Jetson Orin Nano | YOLOv8l | TensorRT FP16 | 640x640 | 15 | 15W |
| Jetson Nano 4GB | YOLOv8n | TensorRT FP16 | 640x640 | 20 | 10W |
| Jetson Nano 4GB | YOLOv8n | PyTorch | 640x640 | 8 | 10W |
| RPi 5 + Coral TPU | YOLOv8n (TFLite) | INT8 Edge TPU | 640x640 | 15-20 | 15W |
| RPi 5 + Coral TPU | MobileNetV3 | INT8 Edge TPU | 224x224 | 30 | 15W |
| Mac Mini M2 | YOLOv8n (CoreML) | FP16 | 640x640 | 60+ | 10W |
| Orange Pi 5 (NPU) | YOLOv5n (RKNN) | INT8 | 640x640 | 30 | 8W |

### 9.3 Speech Recognition Benchmarks

| Hardware | Model | Speed | Latency | Notes |
|----------|-------|-------|---------|-------|
| Mac Mini M2 | Whisper Base (whisper.cpp) | **Real-time** | <100ms | CoreML optimized |
| Mac Mini M2 | Whisper Small | **Real-time** | <200ms | Higher accuracy |
| Mac Mini M2 | Whisper Medium | 0.8x real-time | ~500ms | Best accuracy |
| Jetson Orin Nano | Whisper Base (whisper.cpp) | **Real-time** | <150ms | TensorRT |
| Jetson Orin Nano | Whisper Small | **Real-time** | <250ms | Good accuracy |
| Groq API | Whisper Large v3 | **Real-time** | <50ms | Free tier included |
| Ollama ARM | Whisper Base | **Real-time** | <200ms | Oracle Cloud free |

### 9.4 LLM on Edge Benchmarks (llama.cpp)

| Hardware | Model | Quant | Speed | Memory Used |
|----------|-------|-------|-------|-------------|
| Jetson Orin Nano 8GB | Llama 3.2 3B | Q4_K_M | 8-12 tok/s | 2.5GB |
| Jetson Orin Nano 8GB | Llama 3.1 8B | Q4_K_M | 4-6 tok/s | 5.5GB |
| Jetson Orin Nano 8GB | Mistral 7B | Q4_K_M | 4-5 tok/s | 5GB |
| Mac Mini M2 8GB | Llama 3.2 3B | Q4_K_M | 40-60 tok/s | 2.5GB |
| Mac Mini M2 8GB | Llama 3.1 8B | Q4_K_M | 20-25 tok/s | 5.5GB |
| Mac Mini M2 8GB | Mistral 7B | Q4_K_M | 15-20 tok/s | 5GB |
| Mac Mini M2 16GB | Llama 3.3 70B | Q4_K_M | 3-5 tok/s | 42GB (swap) |
| Mac Mini M4 16GB | Llama 3.1 8B | Q4_K_M | 35-45 tok/s | 5.5GB |
| Oracle ARM 4c/24GB | Llama 3.2 3B | Q4_K_M | 10-15 tok/s | 2.5GB |
| Oracle ARM 4c/24GB | Llama 3.1 8B | Q4_K_M | 5-8 tok/s | 5.5GB |

---

## 10. The Complete $0 Inference Stack

### 10.1 Stack Summary

```
TIER 1: FREE CLOUD APIs ($0/month)
=====================================
Text LLM (Small/Fast):  Groq        → 1,000 req/day, 500+ tok/s
Text LLM (Volume):      Mistral     → 1B tokens/month
Text LLM (Long Context): Gemini     → 1,000 req/day, 1M context
Text LLM (Daily Reset): Cerebras   → 1M tokens/day
Text LLM (Frontier):    GitHub     → GPT-5, GPT-4o, Llama 4
Vision:                 Groq Llama4 + Gemini 2.5 Pro
Speech:                 Groq Whisper API (free tier)
Embeddings:             HuggingFace Serverless (300 req/hr)
Code:                   GitHub Models + Mistral Codestral
Edge (Text):            Cloudflare Workers AI (10K req/day)
Image Generation:       Replicate (free preds) + HF Spaces

TIER 2: SELF-HOSTED ($0/month, always-on)
==========================================
LLM Server:             Oracle Cloud ARM (4c/24GB) + Ollama
Speech:                 Whisper.cpp (local)
Embeddings:             sentence-transformers (local)
Object Detection:       Ollama on Oracle Cloud (for non-critical)

TIER 3: EDGE HARDWARE (One-time cost)
======================================
Primary:                Jetson Orin Nano ($499) — 40 TOPS
Secondary:              RPi 5 + Coral TPU ($120) — IoT sensors
Tertiary:               Mac Mini M2 ($599) — Field command NLP

TOTAL ONGOING COST: $0/MONTH
TOTAL DAILY CAPACITY: ~10,000-50,000 inference requests
```

### 10.2 Daily Capacity Planning

| Provider | Daily Capacity | Type | Fallback |
|----------|---------------|------|----------|
| Groq | 1,000 requests | Fast text, speech | Mistral |
| Gemini | 1,000 requests | Long context, vision | Cerebras |
| Cerebras | 1M tokens | Batch processing | Mistral |
| Mistral | ~33M tokens | High-volume text | Groq |
| GitHub Models | 1,000 requests | Frontier models | Groq |
| Cloudflare AI | 10,000 requests | Edge inference | HuggingFace |
| HuggingFace | 7,200 requests | Embeddings, tasks | Local |
| **Combined** | **~50,000+ requests/day** | | |

### 10.3 Cost Comparison (If Paid)

| Service | Free Tier | Equivalent Paid Cost |
|---------|-----------|---------------------|
| Groq | 1,000 RPD | ~$100/month |
| Mistral | 1B tokens/mo | ~$500/month |
| Gemini | 1,000 RPD | ~$200/month |
| Cerebras | 1M tokens/day | ~$300/month |
| GitHub Models | 1,000 RPD | ~$500/month |
| Cloudflare AI | 10,000 RPD | ~$50/month |
| Oracle Cloud | Always Free ARM | ~$50/month |
| HuggingFace | 7,200 req/day | ~$100/month |
| **TOTAL SAVED** | | **~$1,800/month** |

### 10.4 Resilience Strategy

```
If [Groq down] → Use [Mistral] for text, [GitHub] for code
If [Mistral down] → Use [Cerebras] for batch, [Gemini] for complex
If [Gemini down] → Use [Groq Llama4] for vision, [Cerebras] for text
If [all APIs down] → [Ollama on Oracle Cloud] (always-on)
If [no internet] → [Jetson/RPi local models] (edge offline)
If [edge device fails] → [Mac Mini M2 backup] (local llama.cpp)
```

### 10.5 Monitoring the Free Stack

```python
# Daily health check script
FREE_PROVIDERS = {
    "groq": {"url": "https://api.groq.com/openai/v1/models", "key_env": "GROQ_API_KEY"},
    "mistral": {"url": "https://api.mistral.ai/v1/models", "key_env": "MISTRAL_API_KEY"},
    "gemini": {"url": "https://generativelanguage.googleapis.com/v1beta/models", "key_env": "GEMINI_API_KEY"},
    "cerebras": {"url": "https://api.cerebras.ai/v1/models", "key_env": "CEREBRAS_API_KEY"},
    "github_models": {"url": "https://models.github.ai/inference/models", "key_env": "GITHUB_TOKEN"},
}

async def health_check():
    for name, cfg in FREE_PROVIDERS.items():
        try:
            response = requests.get(
                cfg["url"],
                headers={"Authorization": f"Bearer {os.environ.get(cfg['key_env'], '')}"},
                timeout=10,
            )
            status = "UP" if response.status_code == 200 else "DOWN"
            print(f"{name}: {status}")
        except Exception as e:
            print(f"{name}: ERROR - {e}")

# Run daily via cron on Oracle Cloud free instance
# 0 0 * * * /usr/bin/python3 /home/ubuntu/health_check.py
```

---

## 11. Implementation Guide

### 11.1 Week 1: Account Setup

| Day | Task | Accounts to Create |
|-----|------|-------------------|
| 1 | Create accounts | Groq, Mistral, Gemini, GitHub Models |
| 2 | Create accounts | Cerebras, HuggingFace, Cloudflare, OpenRouter |
| 3 | Create accounts | Oracle Cloud (for self-hosting), Replicate |
| 4 | Get API keys | Collect all keys, store in environment variables |
| 5 | Test each API | Run hello-world requests to all providers |
| 6 | Verify rate limits | Confirm actual limits match documentation |
| 7 | Document limits | Create internal rate limit tracking sheet |

### 11.2 Week 2: Router Implementation

| Day | Task | Deliverable |
|-----|------|-------------|
| 1 | Implement basic router | Provider selection logic |
| 2 | Add rate limit tracking | SQLite/Redis rate limit DB |
| 3 | Add failover logic | Automatic provider switching |
| 4 | Add retry logic | Exponential backoff |
| 5 | Implement task routing | Text/vision/code routing |
| 6 | Add monitoring | Health check dashboard |
| 7 | Load testing | Verify capacity at scale |

### 11.3 Week 3: Edge Deployment

| Day | Task | Hardware |
|-----|------|----------|
| 1 | Set up Jetson Orin Nano | Flash JetPack, install dependencies |
| 2 | Optimize YOLOv8 | TensorRT INT8 conversion |
| 3 | Deploy tracking | ByteTrack integration |
| 4 | Set up Oracle Cloud | Create ARM instance, install Ollama |
| 5 | Deploy Whisper.cpp | On Mac Mini M2 or Jetson |
| 6 | Test offline mode | Verify edge-only operation |
| 7 | Integration test | End-to-end pipeline test |

### 11.4 Week 4: Integration & Hardening

| Day | Task | Focus |
|-----|------|-------|
| 1 | Integrate with applications | Defense/healthcare apps |
| 2 | Add error handling | Graceful degradation |
| 3 | Implement caching | Redis for repeated queries |
| 4 | Add logging | Structured logging for audit |
| 5 | Security review | API key rotation, input sanitization |
| 6 | Documentation | Internal docs for operators |
| 7 | Go live | Production deployment |

### 11.5 Configuration File Template

```yaml
# defoneos_inference_config.yaml

providers:
  groq:
    api_key: ${GROQ_API_KEY}
    base_url: "https://api.groq.com/openai/v1"
    rpm: 30
    rpd: 1000
    models: ["llama-3.3-70b", "llama-3.1-8b", "whisper-large-v3"]
    priority: 1  # Primary for fast text
    
  mistral:
    api_key: ${MISTRAL_API_KEY}
    base_url: "https://api.mistral.ai/v1"
    rpm: 2
    monthly_tokens: 1000000000
    models: ["mistral-large", "codestral", "pixtral-large"]
    priority: 2  # Primary for volume
    
  gemini:
    api_key: ${GEMINI_API_KEY}
    base_url: "https://generativelanguage.googleapis.com/v1beta"
    rpm: 15
    rpd: 1000
    models: ["gemini-2.5-pro", "gemini-2.5-flash"]
    priority: 3  # Primary for long context
    
  cerebras:
    api_key: ${CEREBRAS_API_KEY}
    base_url: "https://api.cerebras.ai/v1"
    rpm: 5
    daily_tokens: 1000000
    models: ["gpt-oss-120b"]
    priority: 4  # Primary for batch
    
  github_models:
    api_key: ${GITHUB_TOKEN}
    base_url: "https://models.github.ai/inference"
    rpm: 15
    rpd: 1000
    models: ["gpt-5", "gpt-4o", "llama-4-scout"]
    priority: 5  # Frontier model access
    
  huggingface:
    api_key: ${HF_TOKEN}
    base_url: "https://api-inference.huggingface.co"
    rph: 300
    models: ["sentence-transformers", "bart-large-cnn"]
    priority: 6  # Embeddings and tasks

self_hosted:
  oracle_cloud:
    host: ${ORACLE_VM_IP}
    ollama_port: 11434
    models: ["llama3.2:3b", "mistral:7b"]
    always_on: true
    
  local_edge:
    jetson_orin_nano:
      detection_model: "yolov8n_int8.engine"
      tracking: "bytetrack"
      alert_threshold: 0.85
      
    mac_mini_m2:
      whisper_model: "ggml-base.bin"
      llm_model: "llama-3.2-3b-q4_k_m.gguf"

routing_rules:
  text_small_fast:
    - groq
    - cloudflare
    - github_models
    
  text_large_complex:
    - gemini
    - cerebras
    - mistral
    
  text_high_volume:
    - mistral
    - cerebras
    - groq
    
  vision:
    - groq  # llama-4-scout
    - gemini
    - github_models
    
  code:
    - github_models
    - groq
    - mistral_codestral
    
  embeddings:
    - huggingface
    - cloudflare
    
  speech:
    - groq_whisper
    - local_whisper

monitoring:
  health_check_interval: 300  # seconds
  alert_on_provider_down: true
  log_all_requests: true
  rate_limit_alert_threshold: 0.8  # Alert at 80% usage
```

---

## 12. Appendix: Provider Quick Reference

### 12.1 Provider Signup Links

| Provider | Signup URL | CC Required | Time to Activate |
|----------|------------|-------------|-----------------|
| Groq | https://console.groq.com | No | Instant |
| Mistral | https://console.mistral.ai | No | Instant (phone verify) |
| Gemini | https://aistudio.google.com | No | Instant (Google account) |
| Cerebras | https://cloud.cerebras.ai | No | Instant |
| GitHub Models | https://github.com/marketplace/models | No | Instant (GitHub account) |
| HuggingFace | https://huggingface.co/join | No | Instant |
| Cloudflare | https://dash.cloudflare.com/sign-up | No | Instant |
| OpenRouter | https://openrouter.ai | No | Instant |
| Replicate | https://replicate.com | No | Instant |
| xAI Grok | https://console.x.ai | No | Instant |
| Modal | https://modal.com/signup | No | Instant ($30 credit) |
| Oracle Cloud | https://signup.cloud.oracle.com | **Yes** | ~1 hour |

### 12.2 API Key Environment Variables

```bash
# Add to ~/.bashrc or ~/.zshrc

# Tier 1: Primary Providers
export GROQ_API_KEY="gsk_xxxxxxxxxxxxxxxx"
export MISTRAL_API_KEY="xxxxxxxxxxxxxxxx"
export GEMINI_API_KEY="AIzaxxxxxxxxxxxxxx"
export CEREBRAS_API_KEY="xxxxxxxxxxxxxxxx"

# Tier 2: Secondary Providers
export GITHUB_TOKEN="ghp_xxxxxxxxxxxxxxxx"
export HF_TOKEN="hf_xxxxxxxxxxxxxxxx"
export CLOUDFLARE_API_TOKEN="xxxxxxxxxxxxxxxx"
export OPENROUTER_API_KEY="sk-or-v1-xxxxxxxxxxxxxxxx"

# Tier 3: Additional
export REPLICATE_API_TOKEN="r8_xxxxxxxxxxxxxxxx"
export XAI_API_KEY="xai-xxxxxxxxxxxxxxxx"
export COHERE_API_KEY="xxxxxxxxxxxxxxxx"

# Self-Hosted
export ORACLE_VM_IP="xxx.xxx.xxx.xxx"
```

### 12.3 curl Test Commands

```bash
# Test Groq
curl https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Hello"}]}'

# Test Mistral
curl https://api.mistral.ai/v1/chat/completions \
  -H "Authorization: Bearer $MISTRAL_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"mistral-large-latest","messages":[{"role":"user","content":"Hello"}]}'

# Test Gemini
curl "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=$GEMINI_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"contents":[{"parts":[{"text":"Hello"}]}]}'

# Test Cerebras
curl https://api.cerebras.ai/v1/chat/completions \
  -H "Authorization: Bearer $CEREBRAS_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-oss-120b","messages":[{"role":"user","content":"Hello"}]}'

# Test GitHub Models
curl https://models.github.ai/inference/chat/completions \
  -H "Authorization: Bearer $GITHUB_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"model":"gpt-4o","messages":[{"role":"user","content":"Hello"}]}'

# Test HuggingFace Inference
 curl https://api-inference.huggingface.co/models/meta-llama/Llama-3.2-1B \
  -H "Authorization: Bearer $HF_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"inputs": "Hello, how are you?"}'
```

### 12.4 Model Registry: Recommended Free Models by Task

| Task | Model | Provider | Format | Notes |
|------|-------|----------|--------|-------|
| **General Text (Fast)** | Llama 3.1 8B | Groq | API | 840 tok/s |
| **General Text (Strong)** | Llama 3.3 70B | Groq | API | 500 tok/s |
| **General Text (Volume)** | Mistral Large | Mistral | API | 1B tok/mo |
| **Long Context** | Gemini 2.5 Pro | Gemini | API | 1M context |
| **Code Generation** | Codestral | Mistral | API | Specialized |
| **Code (Frontier)** | GPT-5 | GitHub | API | Best quality |
| **Vision** | Llama 4 Scout | Groq | API | Multimodal |
| **Vision (Detailed)** | Gemini 2.5 Pro | Gemini | API | Best analysis |
| **Vision (Local)** | LLaVA 1.6 | Ollama | GGUF | Edge deployment |
| **Speech-to-Text** | Whisper Large v3 | Groq | API | Free tier |
| **Speech (Local)** | Whisper Base | whisper.cpp | GGML | Real-time |
| **Embeddings** | BGE-large | HuggingFace | API/Self | Multilingual |
| **Embeddings (Local)** | all-MiniLM-L6 | sentence-transformers | ONNX | Fast, small |
| **Object Detection** | YOLOv8n | TensorRT | Engine | 80 FPS Orin |
| **Object Detection (IoT)** | YOLOv8n (TFLite) | Edge TPU | TFLite INT8 | 20 FPS RPi |
| **Segmentation** | SAM | TensorRT | Engine | 2-3 sec/image |
| **LLM (Edge Fast)** | Llama 3.2 3B | Ollama | GGUF | 60 tok/s M2 |
| **LLM (Edge Balanced)** | Llama 3.1 8B | llama.cpp | GGUF | 25 tok/s M2 |
| **LLM (Edge Tiny)** | Gemma 2 2B | Ollama | GGUF | 15 tok/s ARM |
| **Translation** | NLLB-200 | HuggingFace | API | 200 languages |
| **Summarization** | BART-large | HuggingFace | API | Long documents |
| **NER** | spaCy en_core_web | Self | ONNX | Entity extraction |

### 12.5 Hardware Shopping List

| Item | Price | Qty | Purpose |
|------|-------|-----|---------|
| NVIDIA Jetson Orin Nano 8GB Dev Kit | $499 | 2 | Primary edge AI |
| Raspberry Pi 5 8GB | $60 | 4 | IoT sensors |
| Coral USB Accelerator | $60 | 4 | TPU for Pi |
| Mac Mini M2 8GB | $599 | 1 | Field NLP/command |
| 256GB NVMe SSD (Jetson) | $40 | 2 | Jetson storage |
| 64GB microSD (Pi) | $15 | 4 | Pi storage |
| PoE HAT for Pi 5 | $25 | 4 | Power over Ethernet |
| Enclosure (waterproof) | $30 | 6 | Outdoor use |
| **Total** | **~$2,300** | | **Complete edge deployment** |

### 12.6 Glossary

| Term | Definition |
|------|------------|
| **GGUF** | Georgi Gerganov Universal Format — quantized LLM format for llama.cpp |
| **TensorRT** | NVIDIA's inference optimization framework |
| **ONNX** | Open Neural Network Exchange — cross-platform model format |
| **INT8/INT4** | Reduced-precision integer quantization (8-bit/4-bit) |
| **TOPS** | Tera Operations Per Second — AI performance metric |
| **Tensor Cores** | NVIDIA's specialized AI acceleration hardware |
| **vLLM** | High-throughput LLM serving with PagedAttention |
| **TGI** | Text Generation Inference — HuggingFace's serving framework |
| **RAG** | Retrieval-Augmented Generation — doc + LLM pipeline |
| **STT** | Speech-to-Text |
| **LPU** | Language Processing Unit — Groq's custom hardware |
| **RDU** | Reconfigurable Data Unit — SambaNova's custom hardware |
| **Cold Start** | Delay when waking up an idle inference server |
| **Scale-to-Zero** | Infrastructure that costs $0 when not processing requests |

---

## Document End

**Classification:** OPERATIONAL
**Version:** 1.0
**Maintained By:** DEFONEOS Infrastructure Team
**Next Review:** As needed (providers change free tiers frequently)

> **DISCLAIMER:** Free tiers change frequently. Verify current limits with each provider before production deployment. Rate limits are subject to change without notice. This document is for informational purposes; always test with your actual workload.

---

*"The best GPU is the one you don't have to pay for."*
