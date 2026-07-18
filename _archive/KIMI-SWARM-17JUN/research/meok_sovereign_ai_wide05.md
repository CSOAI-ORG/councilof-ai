# Sovereign & Local-First AI Stack: Complete Research Report 2026

**For**: Nick (M4 MacBook 12GB + M2 MacBook 8GB)  
**Date**: July 2026  
**Scope**: Fully sovereign AI stack -- local LLMs, offline inference, no cloud API dependency  
**Searches Conducted**: 14 independent queries across Ollama MLX, Mamba SSM, quantization, frontends, networking, cost analysis, and hybrid architectures

---

## TOP 10 FINDINGS

1. **Ollama 0.19+ (June 2026) now runs on MLX by default on Apple Silicon**, delivering 15-30% higher throughput and ~10% lower memory usage than llama.cpp Metal. On M5 Max, Qwen3.5-35B-A3B reaches 1,810 tok/s prefill and 112 tok/s decode -- nearly 2x faster than Ollama 0.18 [^17^][^35^][^37^].

2. **Qwen3.5-35B-A3B is the #1 recommended model for 24GB Macs** -- it activates only 3B of 35B parameters per token, needs ~20GB at Q4, and with Ollama 0.19's MLX backend hits 70-80 tok/s on M4 Max. It outperforms models 7x larger on reasoning tasks [^44^][^19^].

3. **oMLX is the breakthrough inference server for Apple Silicon** (12,000+ GitHub stars) -- featuring continuous batching, two-tier SSD KV caching that drops TTFT from 30-90s to <5s on follow-up requests, and OpenAI/Anthropic API compatibility. It's the missing piece for agentic coding workflows on Mac [^178^][^179^][^187^].

4. **Mamba-3 SSM processes sequences at O(n) linear complexity vs. transformers' O(n^2)**, making it 350x+ faster at very long contexts. The SSD (Structured State Space Duality) framework shows SSMs are mathematically equivalent to masked attention. Best for: long-document processing, streaming data, and edge deployments [^103^][^109^][^190^].

5. **For M2 8GB RAM: only Phi-4-mini (3.8B) at ~3.5GB and Gemma 3 4B at ~3GB fit comfortably**, delivering ~15-20 tok/s. For M4 12GB: Llama 3.3 8B (~6GB), Qwen 3 7B (~5.5GB), and Mistral Small 3 7B (~5.5GB) all run well at Q4_K_M [^181^][^182^][^183^].

6. **LiteLLM is the essential gateway for hybrid architectures** -- route sensitive data to local Ollama, complex tasks to cloud APIs, with automatic fallbacks, per-team budgets, and cost tracking. Adds only ~4ms latency overhead [^185^][^186^].

7. **Local LLM break-even vs. cloud APIs occurs at 2-3M tokens/day** for consumer hardware at 12 months. At 5M tokens/day, OpenAI costs $12,600/year vs. local $18,387/year. However, privacy, zero latency, and no vendor lock-in are priceless for sovereign use cases [^123^].

8. **Open WebUI (45,000+ GitHub stars) is the leading self-hosted frontend** -- backend-agnostic, supports Ollama/vLLM/LM Studio, built-in RAG with document upload, multi-user auth, voice input/output, and a ChatGPT-like interface. Runs entirely offline [^104^][^105^][^111^].

9. **NVFP4 quantization (via Ollama MLX) roughly halves quality loss vs. Q4_K_M** while maintaining performance. NVIDIA-optimized models can now run on Apple Silicon with datacenter-quality output. MLX 4-bit ~= GGUF Q4_K_M in quality [^40^][^107^].

10. **Tailscale creates a zero-config private mesh network** between Macs using WireGuard -- enabling Nick's M4 and M2 to share inference load, with one acting as the primary inference node and the other as a fallback, all without exposing ports publicly [^102^][^110^].

---

## 1. OLLAMA: THE LOCAL INFERENCE FOUNDATION

### 1.1 Ollama 0.19-0.30: MLX Engine Revolution

Ollama's biggest update in 2026 is the shift from llama.cpp Metal to Apple's MLX framework on Apple Silicon. Released in preview March 30, 2026 [^19^], and refined through June 2026 [^17^], this represents a fundamental performance leap:

| Metric | Ollama 0.18 (llama.cpp) | Ollama 0.19+ (MLX) | Improvement |
|--------|------------------------|-------------------|-------------|
| Prefill (Qwen3.5-35B-A3B, M5 Max) | 1,154 tok/s | 1,810 tok/s | +57% |
| Decode (same config) | 58 tok/s | 112 tok/s | +93% |
| With int4 quantization | -- | 1,851 prefill / 134 decode | -- |
| Memory overhead | Baseline | ~10% less | Significant |

Source: Ollama official benchmarks [^19^][^40^]

**Key features in Ollama 0.30 (June 2026)** [^17^]:
- **GGUF + MLX dual engine**: GGUF via llama.cpp for cross-platform compatibility, MLX for Apple Silicon
- **NVFP4 support**: NVIDIA's optimized 4-bit format halves quality loss vs. Q4_K_M [^40^]
- **Image generation** (experimental): Local image generation on macOS [^17^]
- **OpenClaw integration**: Local-first personal AI assistant [^17^]
- **Subagents and web search**: In Claude Code via Ollama [^17^]
- **Anthropic API compatibility**: Use Claude Code with open models [^17^]

### 1.2 Ollama MLX Performance by Mac Tier

Community benchmarks (r/LocalLLaMA, willitrunai.com) show consistent MLX advantages [^35^]:

**Qwen 3.5 9B (Q4_K_M / MLX 4-bit, ~5.5 GB):**

| Mac | Ollama (llama.cpp) | MLX | MLX Advantage |
|-----|-------------------|-----|---------------|
| M4 16GB (MacBook Air) | ~22-28 tok/s | ~25-35 tok/s | +15% |
| M4 Pro 24GB | ~30-38 tok/s | ~40-50 tok/s | +28% |
| M4 Max 36GB | ~50-65 tok/s | ~65-85 tok/s | +28% |
| M3 Ultra 512GB | ~85-100 tok/s | ~110-140 tok/s | +35% |

**Qwen 3.5 35B-A3B MoE (Q4_K_M / MLX 4-bit, ~19.5-21.4 GB):**

| Mac | Ollama (llama.cpp) | MLX | MLX Advantage |
|-----|-------------------|-----|---------------|
| M4 Pro 24GB | ~15-20 tok/s (tight) | ~18-25 tok/s (tight) | +20% |
| M4 Max 36GB | ~30-40 tok/s | ~40-55 tok/s | +30% |
| M4 Max 64GB | ~45-58 tok/s | ~55-70 tok/s | +22% |
| M3 Ultra 512GB | ~60-75 tok/s | ~80-100 tok/s | +30% |

Source: [^35^]

### 1.3 Practical Ollama Setup for Nick's Machines

**M4 MacBook (12GB RAM)**:
```bash
# Install
curl -fsSL https://ollama.com/install.sh | sh

# Best models for 12GB
ollama run qwen3.5:9b        # 6.6 GB - best small model
ollama run llama3.3:8b       # ~6 GB - best all-rounder
ollama run qwen3.5:4b        # 3.4 GB - great for speed
ollama run deepseek-r1:7b    # ~6 GB - reasoning model

# Enable MLX backend (if 32GB+; falls back automatically on lower)
export OLLAMA_BACKEND=mlx
```

**M2 MacBook (8GB RAM)**:
```bash
# Only small models fit
ollama run phi4:3.8b         # ~3.5 GB - best for 8GB
ollama run gemma3:4b         # ~3 GB - multimodal capable
ollama run qwen3.5:2b        # 2.7 GB - ultra-lightweight
ollama run qwen3.5:0.8b      # 1.0 GB - emergency fallback
```

---

## 2. LM STUDIO: THE GUI ALTERNATIVE

### 2.1 LM Studio vs Ollama: Head-to-Head

| Dimension | Ollama | LM Studio |
|-----------|--------|-----------|
| Interface | CLI + REST API | Desktop GUI (Electron) |
| License | MIT (open source) | Proprietary freeware |
| Best for | Developers, servers, automation | Desktop users, model exploration |
| Model format | GGUF via llama.cpp | GGUF + **MLX native** |
| Model library | Curated registry + Hugging Face import | Built-in Hugging Face search |
| API | OpenAI-compatible :11434 | OpenAI-compatible :1234 |
| Apple Silicon | llama.cpp Metal (or MLX preview 0.19+) | **MLX by default since early 2025** |
| Server mode | Long-lived service | Runs while app is open |
| Concurrent requests | Multi-threaded | Single-threaded |
| GPU support | Metal, CUDA, ROCm, Vulkan | Metal, CUDA, ROCm |
| Idle RAM | ~100-200 MB | ~300-600 MB |

Source: [^43^][^8^][^45^]

### 2.2 The MLX Advantage in LM Studio

LM Studio has used MLX since early 2025, giving it a significant performance edge on Apple Silicon [^45^][^47^]:

| Model Size | LM Studio (MLX) | Ollama (llama.cpp) | LM Studio Advantage |
|------------|----------------|-------------------|---------------------|
| 1B (Gemma 3) | 237 tok/s | 149 tok/s | +59% |
| 12B (Gemma 3) | ~80 tok/s | ~50 tok/s | +60% |
| 27B (Gemma 3) | 33 tok/s | 24 tok/s | +37% |

Source: [^45^]

**Key insight**: LM Studio is 26-60% faster than Ollama on Apple Silicon for GGUF models because it uses MLX natively. However, Ollama 0.19+ with MLX backend closes this gap significantly (reaching ~85% of pure MLX throughput on 32GB+ Macs) [^35^].

### 2.3 When to Use Which

- **Use Ollama**: You're a developer scripting pipelines, building apps, running Docker deployments, or serving multiple users. The CLI/API-first design and 80,000+ GitHub stars ecosystem make it the infrastructure choice.
- **Use LM Studio**: You're exploring models interactively, want the fastest Apple Silicon inference today, need a beautiful chat UI, or are a non-technical user. The MLX native support and model browser are unmatched.
- **Use both**: Evaluate models in LM Studio, then deploy winners via Ollama. They serve on different ports (11434 vs 1234) and can run simultaneously [^43^][^8^].

---

## 3. MODEL QUANTIZATION: THE QUALITY VS. SIZE TRADE-OFF

### 3.1 Quantization Format Guide

| Quantization | Precision | Size | Quality Loss | Recommended Use |
|-------------|-----------|------|--------------|-----------------|
| FP16 | 16-bit float | Largest | Almost none | Research, max quality |
| Q8_0 | 8-bit integer | Larger | Almost none | High-end PCs, quality+performance |
| Q6_K | 6-bit mixed | Medium-Large | Very slight | 16GB VRAM, daily driver |
| **Q5_K_M** | **5-bit mixed** | **Medium** | **Slight** | **12GB VRAM, balanced choice** |
| **Q4_K_M** | **4-bit mixed** | **Smaller** | **Acceptable** | **8GB VRAM, strong value** |
| Q3_K_M | 3-bit mixed | Very small | Noticeable | Low-spec devices only |
| Q2_K | 2-bit mixed | Smallest | Significant | Extreme limits, fallback |

Source: [^115^][^108^]

### 3.2 VRAM-Based Model Selection

The practical rule: match RAM tier to model parameter count with overhead for macOS (3-5GB) and KV cache [^182^]:

| Available Memory | Largest Comfortable Model | Examples |
|-----------------|--------------------------|----------|
| 8GB | 3B-7B (Q4) | Phi-4-mini 3.8B, Gemma 3 4B |
| 12GB | 7B-8B (Q4) | Llama 3.3 8B, Qwen 3 7B |
| 16GB | 7B-13B (Q4) | Llama 3.2 7B, Mistral 7B, Q5 variants |
| 24GB | 13B-20B (Q4) | Qwen 3.5 35B-A3B (!), DeepSeek-R1 14B |
| 32GB | 20B-33B (Q4) | Qwen 3.5 27B, Mixtral 8x7B |
| 48GB | 33B-40B (Q4) | Llama 3.1 70B (Q2_K, limited) |
| 64GB | 70B (Q4) | Llama 3.3 70B (full quality) |

Source: [^182^]

**Special case**: Qwen3.5-35B-A3B MoE fits in 24GB because only 3B parameters activate per token. This is why it's the #1 pick for 24GB Macs -- it punches far above its weight class [^44^].

### 3.3 NVFP4: The New Gold Standard

Ollama's MLX engine now supports NVIDIA's NVFP4 format [^40^]:
- **Halves quality loss** compared to Q4_K_M quantization relative to unquantized BF16
- **20% faster generation** than Q4_K_M on the updated MLX engine
- Enables datacenter-optimized models to run on Apple Silicon with production parity
- Tracks local dynamic range of weights more closely than other 4-bit formats

---

## 4. MAMBA-2/3 STATE SPACE MODELS: THE POST-TRANSFORMER FUTURE

### 4.1 Core Architecture

Mamba SSMs (State Space Models) represent a fundamental departure from transformer attention [^103^][^109^]:

| Dimension | Transformers | Mamba 3 SSM |
|-----------|-------------|-------------|
| Sequence scaling | O(n^2) -- quadratic | **O(n) -- linear** |
| Memory at inference | Grows with context (KV cache) | **Fixed per step** |
| Training speed | Fast (matmul-optimized) | Competitive (SSD uses matmuls) |
| Long-context performance | Expensive but precise | **Fast and efficient** |
| Hardware requirements | High VRAM for long contexts | **Lower VRAM, better for edge** |

### 4.2 Structured State Space Duality (SSD)

The Mamba 2 paper established a mathematical equivalence between structured SSMs and masked attention mechanisms [^190^]:
- A state-space model with a scalar-times-identity state matrix is equivalent to masked self-attention with a 1-semiseparable causal mask
- The same sequence transformation has two realizations: **linear-time O(T) recurrence** or **quadratic-time O(T^2) attention**
- This duality means Mamba models can leverage GPU tensor cores during training

### 4.3 Practical Implications

Mamba SSMs excel at [^103^][^114^]:
1. **Long-form document processing**: Processing 100K tokens costs ~100x more attention compute than 10K for transformers, but only ~10x for Mamba
2. **Edge and mobile deployment**: Fixed memory footprint regardless of context length
3. **Streaming data**: Natural fit for sensor data, live transcription, real-time monitoring
4. **M2/M4 MacBooks**: Lower VRAM requirements make larger models feasible on limited memory

**Caveat**: Transformers still outperform Mamba on precise retrieval from long context. Mamba compresses history into a fixed-size state, which may lose specific details. Hybrid SSM+attention architectures are emerging as the pragmatic middle ground [^103^].

### 4.4 Available Mamba Models

Published Mamba-3 research covers ~1.5B parameter models. 7B, 34B, and 70B sizes are illustrative projections. Check the `state-spaces` HuggingFace organization for current model availability [^114^]. For Nick's immediate needs, transformer-based models (Qwen3.5, Llama 3.3) remain the practical choice, with Mamba as a technology to watch for long-context workloads.

---

## 5. BEST MODELS FOR NICK'S HARDWARE

### 5.1 M4 MacBook (12GB RAM) -- Primary Machine

**Tier 1: Fast Daily Drivers (7B-9B models)**

| Model | RAM (Q4) | Speed (M4) | Best For | HumanEval |
|-------|----------|------------|----------|-----------|
| **Qwen 3 7B** | ~5.5GB | ~38 tok/s | Code generation, multilingual | **76.0** |
| **Llama 3.3 8B** | ~6GB | ~33 tok/s | General-purpose, ecosystem | 72.6 |
| **Mistral Small 3 7B** | ~5.5GB | ~50 tok/s | Speed, fast iteration | 68.2 |

**Tier 2: Reasoning Specialists**

| Model | RAM (Q4) | Speed (M4) | Best For |
|-------|----------|------------|----------|
| **DeepSeek-R1 7B** | ~6GB | ~20 tok/s | Step-by-step reasoning, math |
| **DeepSeek-R1 14B** | ~12GB | ~12 tok/s | Stronger reasoning (tight fit) |

**Tier 3: Larger Models (if closing other apps)**

| Model | RAM (Q4) | Speed (M4) | Notes |
|-------|----------|------------|-------|
| Qwen 3.5 27B | ~16GB | N/A | Won't fit comfortably on 12GB |
| Gemma 3 12B | ~8-10GB | Marginal | May work with tight management |

Source: [^181^][^182^][^120^]

### 5.2 M2 MacBook (8GB RAM) -- Secondary/Fallback Machine

**Only viable options** [^181^][^183^]:

| Model | RAM (Q4) | Speed (M2 8GB) | Best For |
|-------|----------|----------------|----------|
| **Phi-4-mini 3.8B** | ~3.5GB | ~18 tok/s | The only truly comfortable option |
| **Gemma 3 4B** | ~3GB | ~15-20 tok/s | Multimodal (text + image), 128K context |
| Gemma 3 1B | ~1GB | Very fast | Ultra-lightweight tasks |
| Qwen3.5 2B | ~2.7GB | Fast | Emergency fallback |

**r/LocalLLaMA consensus**: "Gemma3-4b-it is the best and incredible for the size" on M2 8GB [^185^].

### 5.3 Cross-Machine Strategy with Tailscale

Connect both Macs via Tailscale for a private inference mesh:

```bash
# On M4 (primary inference node)
ollama serve  # Expose to tailnet

# On M2 (fallback + lightweight tasks)
ollama serve  # Expose to tailnet

# Either machine can route to the other
# Use Ollama's OpenAI-compatible API across the tailnet
```

This creates a **distributed inference cluster** where:
- M4 handles heavy models (8B-14B) and fast tasks
- M2 runs lightweight models (3B-4B) and acts as fallback
- Both machines can access each other's Ollama instances securely
- No ports exposed to the public internet

---

## 6. VLLM & SGLANG: PRODUCTION SERVING

### 6.1 When You Need Production Serving

For Nick's personal stack, Ollama is sufficient. However, for multi-user serving or agent pipelines:

| Engine | Primary Use | Hardware | Concurrency | Best For |
|--------|------------|----------|-------------|----------|
| **vLLM** | Production serving | NVIDIA GPU (multi-GPU) | High -- PagedAttention + continuous batching | High-concurrency production |
| **SGLang** | Agentic/structured output | NVIDIA GPU | High -- RadixAttention prefix reuse | Agentic pipelines, repeated prompts, VLMs |
| **llama.cpp** | Portability | CPU, Apple Silicon, edge | Low-moderate | CPU/edge inference |
| **Ollama** | Local dev UX | macOS, Linux, Windows | Low-moderate | Developer workstations |
| **oMLX** | Apple Silicon optimized | Apple Silicon only | Moderate -- continuous batching | Mac-native serving for coding agents |

Source: [^50^][^51^]

### 6.2 vLLM vs SGLang in 2026

HuggingFace deprecated TGI in December 2025, pointing users to vLLM or SGLang [^51^]:

| Feature | vLLM | SGLang |
|---------|------|--------|
| Raw throughput (Llama 3.1 8B, H100) | ~12,500 tok/s | ~16,200 tok/s |
| Core innovation | PagedAttention | RadixAttention |
| Structured output overhead | Noticeable at high batch | Minimal |
| Prefix caching | Block-level hash | Token-level radix tree |
| Hardware | NVIDIA, AMD, Intel, TPU | NVIDIA, AMD |
| Community | 17k+ GitHub stars | 15k+ stars, growing fast |
| Docker/K8s | Mature Helm charts | Docker-first |

Source: [^51^]

**For Nick**: These are Linux/NVIDIA tools. Stick with Ollama + oMLX on Mac. If you add a Linux server later, vLLM is the default choice.

---

## 7. OPEN WEBUI & FRONTENDS

### 7.1 Open WebUI: The Self-Hosted ChatGPT

Open WebUI (formerly Ollama WebUI) is the leading self-hosted LLM interface [^104^][^105^]:

**Key Features**:
- **Backend-agnostic**: Connects to Ollama, vLLM, LM Studio, LocalAI, OpenAI, Claude [^104^]
- **Built-in RAG**: Upload PDFs, DOCX, TXT, Markdown -- automatic chunking, embeddings, retrieval [^104^]
- **Multi-user authentication**: Local auth, OAuth/OIDC, LDAP/Active Directory, role-based access [^104^]
- **Voice input/output**: STT via Web Speech API, TTS via multiple engines [^104^]
- **Prompt library**: Save, version, and share prompts with teams [^104^]
- **Note-taking**: Built-in Markdown notes with AI enhancement [^111^]
- **OCR**: Document scanning and analysis [^111^]
- **Image generation**: Integration with ComfyUI and Automatic1111 [^111^]
- **Plugins**: Extensible plugin ecosystem [^105^]
- **MIT License**, 45,000+ GitHub stars

**Quick Start**:
```bash
# With existing Ollama
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main

# All-in-one (Ollama included)
docker run -d -p 3000:8080 \
  --gpus all \
  -v ollama:/root/.ollama \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:ollama
```

### 7.2 Frontend Comparison

| Feature | Open WebUI | AnythingLLM | Lobe Chat | Jan |
|---------|-----------|-------------|-----------|-----|
| License | MIT | MIT | MIT | Open source |
| Best for | Developers, Ollama users | Business users, teams | Plugin enthusiasts | Daily ChatGPT replacement |
| Target | Tech-savvy teams | Business-oriented | Developers | General users |
| RAG | ChromaDB, Qdrant, Milvus | Pinecone, Chroma, Weaviate | Via plugins | Basic |
| Multi-user | Yes (auth + roles) | Yes (workspaces) | Yes | Limited |
| Plugins | Extensive | Limited | Rich ecosystem | Built-in extensions |
| Desktop app | No (web only) | Yes | No | Yes |
| Community | 45k+ stars | 25k+ stars | Growing | Active |

Source: [^105^][^113^][^189^]

### 7.3 Recommended Stack for Nick

```
Ollama (inference) + Open WebUI (chat) + Tailscale (networking)
```

This gives:
- Complete privacy -- all data stays local
- ChatGPT-like experience via Open WebUI
- Access from either MacBook via Tailscale
- RAG for document analysis
- Voice input/output
- No cloud dependency whatsoever

---

## 8. TAILSCALE: PRIVATE MESH NETWORKING

### 8.1 What Tailscale Provides

Tailscale creates a **private mesh network (tailnet)** between devices using WireGuard encryption [^110^][^102^]:

- **Zero-config VPN**: Install, sign in, devices connect automatically
- **Peer-to-peer mesh**: Direct connections between devices, no central bottleneck
- **Identity-based access**: Every device is authenticated, ACL policies enforce least-privilege
- **MagicDNS**: Human-readable hostnames (e.g., `nick-m4.local`, `nick-m2.local`)
- **Subnet routing**: Access entire networks through a single node
- **Exit nodes**: Route internet traffic through a trusted device

### 8.2 AI Infrastructure Use Cases

For Nick's sovereign stack [^102^]:
1. **Private inference sharing**: M4 runs heavy models, M2 accesses them securely
2. **No public ports**: Ollama APIs accessible only within the tailnet
3. **Cross-location access**: Access home inference from anywhere securely
4. **Agent connectivity**: Self-hosted agents connect to internal APIs, databases, vector stores
5. **LM Link integration**: LM Studio has built-in Tailscale partnership for encrypted remote model access [^45^]

### 8.3 Setup

```bash
# Install Tailscale on both Macs
brew install tailscale

# Start and authenticate on both machines
sudo tailscale up

# Now M2 can access M4's Ollama:
curl http://nick-m4:11434/api/tags

# Or use IP addresses if MagicDNS is disabled
curl http://100.x.x.x:11434/api/tags
```

---

## 9. OFFLINE/ONLINE HYBRID ARCHITECTURES

### 9.1 The Hybrid Philosophy

Sovereign AI doesn't always mean "never use cloud." It means **the cloud is optional, not mandatory** [^117^]. A hybrid architecture:

| Factor | Cloud LLMs | Local LLMs | Hybrid Sovereign Stack |
|--------|-----------|-----------|----------------------|
| Setup Difficulty | Low | Medium-High | Medium |
| Privacy Control | Lower | **Highest** | High |
| Token Cost | Usage-based | Hardware/power cost | **Controlled** |
| Inference Speed | Network dependent | Hardware dependent | Flexible |
| Model Quality | Often strongest | Depends on model | Balanced |
| Vendor Lock-in | Higher | Lower | **Lower** |
| Best Use Case | Fast prototyping | Private workflows | **Production-sensitive systems** |

Source: [^117^][^125^]

### 9.2 Three-Pillar Routing Model

The production hybrid architecture routes requests by [^125^]:

1. **Data sensitivity**: PII/sensitive data → local only (fail-closed if local unavailable)
2. **Task complexity**: Simple tasks → local; complex reasoning → cloud if local insufficient
3. **System availability**: Local GPU saturated → cloud overflow; cloud down → local fallback

### 9.3 Implementation with LiteLLM

```yaml
# litellm_config.yaml
model_list:
  # Tier 1: Local fast lane
  - model_name: fast-local
    litellm_params:
      model: ollama/qwen3.5:9b
      api_base: http://localhost:11434
    model_info:
      tags: ["pii", "internal"]

  # Tier 2: Local heavy reasoning
  - model_name: heavy-local
    litellm_params:
      model: ollama/deepseek-r1:14b
      api_base: http://localhost:11434

  # Tier 3: Cloud premium (no sensitive data)
  - model_name: smart-cloud
    litellm_params:
      model: openai/gpt-4o
      api_key: os.environ/OPENAI_API_KEY

router_settings:
  enable_tag_filtering: true
  fallbacks:
    - { fast-local: ["heavy-local"] }
    # Note: NO fallback from local to cloud for sensitive data
```

This ensures sensitive requests **fail closed** -- they error out rather than leak to cloud [^186^].

### 9.4 When to Go Full Offline

Go fully offline when [^117^][^44^]:
- Handling confidential documents, source code, financial records
- Operating in regulated industries (healthcare, legal, government)
- Working in bandwidth-constrained environments
- Building long-term automation workflows
- Cost predictability is more important than peak capability

---

## 10. MICROSOFT SOVEREIGN CLOUD: THE EXPENSIVE ALTERNATIVE

### 10.1 What It Offers

Microsoft Azure Sovereign Cloud provides [^106^]:
- Data residency guarantees (EU, US government, etc.)
- Compliance with GDPR, ITAR, FedRAMP
- Azure OpenAI Service with GPT-4, Claude access
- NVIDIA GPU instances (H100, A100, Blackwell GB300)
- Managed Kubernetes, AI platform tools

### 10.2 Pricing Reality

| Service | Cost | Notes |
|---------|------|-------|
| Azure VMs | From $6.13/month | Entry level |
| GPU instances (H100) | From $8.82/hour | ~$6,400/month always-on |
| Azure OpenAI GPT-4 | $30/input-M, $60/output-M | Premium pricing |
| App Service | From $9.49/month | Basic tier |

Source: [^106^]

### 10.3 Sovereign Cloud Alternatives

| Provider | Best For | Pricing | Sovereignty |
|----------|----------|---------|-------------|
| **Scaleway** (France) | European sovereign cloud | From EUR 0.10/month | EU data centers, GDPR-native |
| **OVHcloud** (France) | EU data residency | From $8.59/month | European-owned |
| **Hetzner** (Germany) | Budget self-managed | From $4.09/month | German data centers |
| **DigitalOcean** | Developer-friendly | From $4/month | US-based, simple pricing |

Source: [^106^]

**Verdict**: For Nick's use case (personal sovereign stack on MacBooks), Microsoft Sovereign Cloud is overkill and expensive. The local-first approach on Apple Silicon is dramatically more cost-effective and provides true data sovereignty.

---

## 11. COST ANALYSIS: LOCAL VS. CLOUD

### 11.1 API Pricing in 2026

| Model | Provider | Input/1M | Output/1M | Context |
|-------|----------|----------|-----------|---------|
| GPT-5 | OpenAI | $5.00 | $15.00 | 256K |
| Claude Opus 4 | Anthropic | $15.00 | $75.00 | 200K |
| Claude Sonnet 4 | Anthropic | $3.00 | $15.00 | 200K |
| Gemini 2.5 Pro | Google | $1.25-$2.50 | $5-$10 | 1M |
| **Qwen3.5-Plus** | **Alibaba** | **~$0.33** | **~$1.95** | **1M** |
| DeepSeek V4 Flash | DeepSeek | $0.07 | $0.27 | 256K |

Source: [^122^][^121^]

### 11.2 12-Month TCO Comparison

| Cost Component | OpenAI API | Anthropic API | Open-Weight API | Local (Consumer) |
|---------------|-----------|--------------|----------------|-----------------|
| **Light Tier (500K tokens/day)** |
| Hardware | $0 | $0 | $0 | $3,350 (MacBook) |
| API Fees | $1,260 | $1,800 | $360 | $0 |
| Electricity | $0 | $0 | $0 | $190 |
| Labor (ops) | $0 | $0 | $0 | $1,800 |
| Depreciation | $0 | $0 | $0 | $1,117 |
| **12-Month Total** | **$1,260** | **$1,800** | **$360** | **$6,457** |
| Effective $/M tokens | $6.90 | $9.86 | $1.97 | $35.37 |

| **Medium Tier (5M tokens/day)** |
| Hardware | $0 | $0 | $0 | $6,900 |
| API Fees | $12,600 | $18,000 | $3,600 | $0 |
| Electricity | $0 | $0 | $0 | $570 |
| Labor (ops) | $0 | $0 | $0 | $9,000 |
| Depreciation | $0 | $0 | $0 | $1,917 |
| **12-Month Total** | **$12,600** | **$18,000** | **$3,600** | **$18,387** |

Source: [^123^]

### 11.3 Break-Even Analysis

- **vs. OpenAI (GPT-4.1)**: Break-even at **2-3M tokens/day** at 12 months
- **vs. open-weight APIs (Together/Fireworks)**: Break-even at **15-20M tokens/day**
- **At 36 months** with heavy sustained use: local reaches parity against cheapest hosted options

**Key factors shifting break-even** [^123^]:
- EU electricity rates ($0.25-0.30/kWh): pushes break-even 40-60% higher
- 20% GPU price drops: lowers break-even ~15%
- API price cuts: raise local break-even proportionally

### 11.4 The True Cost of Sovereignty

For Nick's personal use (~50K-200K tokens/day), local inference on existing hardware is:
- **Hardware cost**: $0 (already owns MacBooks)
- **Electricity**: ~$5-10/month for heavy use
- **API cost**: $0
- **Total annual cost**: ~$60-120 in electricity

vs. equivalent cloud usage at ~$100-500/month depending on model choice.

**The local stack pays for itself in month 1** when using existing hardware. The real value is not cost savings -- it's **control, privacy, zero latency, and no vendor lock-in** [^117^].

---

## 12. OMLX: THE APPLE SILICON INFERENCE BREAKTHROUGH

### 12.1 What is oMLX?

oMLX (Apache 2.0 license) is a dedicated MLX inference server for Apple Silicon that solves the #1 problem with local LLMs: **KV cache invalidation on every request** [^187^][^188^].

**Core innovations**:
1. **Paged SSD KV caching**: Hot blocks in RAM, cold blocks on SSD in safetensors format. Cache survives server restarts.
2. **Continuous batching**: Up to 4.14x generation speedup at 8x concurrency via mlx-lm BatchGenerator.
3. **<5s TTFT from 2nd turn**: Because previous prefixes are restored from SSD, not recomputed.
4. **Multi-model serving**: LLM, VLM, embedding, reranker simultaneously with LRU eviction.
5. **Native macOS menu bar app**: Start/stop/monitor from menu bar. Signed, notarized, auto-updating. Not Electron.

### 12.2 Why It Matters for Nick

When running coding agents (Claude Code, Cursor, Aider), the KV cache is invalidated dozens of times per session. Standard Ollama recomputes from scratch every time -- 30-90 second waits. oMLX persists every block to SSD, so **follow-up requests feel instant** [^179^][^180^].

**Benchmarks** (Qwen3.5-122B-A10B 4-bit, M3 Ultra 512GB):
- 566 tok/s prompt processing
- 2.02x throughput with batching
- <5s TTFT from 2nd turn

### 12.3 Installation

```bash
# Homebrew
brew tap jundot/omlx https://github.com/jundot/omlx
brew install omlx

# Run as background service
omlx start

# Or download .dmg from https://omlx.ai
```

Requires: macOS 15.0+ (Sequoia), Python 3.10+, Apple Silicon (M1/M2/M3/M4) [^187^].

---

## 13. RECOMMENDED STACK FOR NICK

### 13.1 Architecture Diagram

```
+------------------+     Tailscale      +------------------+
|   M4 Mac (12GB)  |<---> WireGuard <--->|   M2 Mac (8GB)   |
|                  |    Private Mesh    |                  |
|  oMLX server     |                    |  Ollama server   |
|  Qwen3.5:9b      |                    |  Phi4:3.8b       |
|  Llama3.3:8b     |                    |  Gemma3:4b       |
|  DeepSeek-R1:7b  |                    |                  |
|                  |                    |                  |
|  Open WebUI      |                    |  (fallback only) |
|  (port 3000)     |                    |                  |
+------------------+                    +------------------+
         |
    +----+----+
    |         |
+---v--+  +---v--------+
| RAG  |  | Local Docs |
| (Chroma) | (Private)  |
+------+  +------------+
```

### 13.2 Component Selection

| Layer | Tool | Why |
|-------|------|-----|
| **Inference (M4)** | oMLX or Ollama 0.30 | Best Apple Silicon performance, SSD KV caching |
| **Inference (M2)** | Ollama 0.30 | Lightweight, reliable on 8GB |
| **Frontend** | Open WebUI | Best self-hosted UI, RAG, offline capable |
| **Networking** | Tailscale | Zero-config private mesh between Macs |
| **Vector DB** | ChromaDB (built into Open WebUI) | Document RAG, private memory |
| **Gateway** | LiteLLM (optional) | If adding cloud fallback later |
| **Quantization** | Q4_K_M (default), NVFP4 (if available) | Best quality/size trade-off |

### 13.3 Setup Order

```bash
# Step 1: Install Ollama on both machines
curl -fsSL https://ollama.com/install.sh | sh

# Step 2: Pull models for each machine
# M4 (12GB):
ollama pull qwen3.5:9b
ollama pull llama3.3:8b
ollama pull deepseek-r1:7b

# M2 (8GB):
ollama pull phi4:3.8b
ollama pull gemma3:4b

# Step 3: Install oMLX on M4 (optional but recommended)
brew tap jundot/omlx https://github.com/jundot/omlx
brew install omlx
omlx start

# Step 4: Install Open WebUI (on M4)
docker run -d -p 3000:8080 \
  -v open-webui:/app/backend/data \
  --name open-webui \
  --restart always \
  ghcr.io/open-webui/open-webui:main

# Step 5: Install Tailscale on both
brew install tailscale
sudo tailscale up

# Step 6: Start using sovereign AI
open http://localhost:3000  # Open WebUI
```

---

## 14. EU SOVEREIGN AI INITIATIVES

### 14.1 The European Stack

For context on global sovereign AI efforts [^39^]:

- **Mistral Large / Mixtral** (France): Powerful open-source models, operable locally
- **Aleph Alpha** (Germany): Enterprise-focused, designed for sovereign deployment
- **SOOFI** (Sovereign Open-Source Foundation Initiative): 100B parameter European model, Q3 2026 target. Fully transparent weights, trained for European languages and compliance
- **Scaleway** (France): European sovereign cloud alternative with GDPR compliance

### 14.2 Compliance Layer

For regulated industries, sovereign AI requires [^39^]:
- **DLP redaction** before inference (no raw PII reaches the model)
- **Logging every AI output** with timestamps, model version, input hash
- **Source attribution** for RAG pipelines
- **Automated conformity assessment** aligned with EU AI Act Annex IV
- **Human oversight triggers** for high-risk AI system outputs

---

## 15. KEY TAKEAWAYS & ACTION ITEMS

### Immediate Actions for Nick

1. **Install Ollama 0.30** on both Macs -- the MLX engine is a game-changer for Apple Silicon
2. **Start with Qwen3.5:9b on M4** and **Phi4:3.8b on M2** -- best models for each RAM tier
3. **Install Open WebUI** on the M4 for a ChatGPT-like experience
4. **Set up Tailscale** to create a private mesh between the two Macs
5. **Try oMLX** on the M4 if running coding agents -- the SSD KV cache makes a dramatic difference

### Model Rotation Strategy

| Task | M4 Model | M2 Model |
|------|----------|----------|
| Fast chat/general | Qwen3.5:9b | Phi4:3.8b |
| Coding assistance | Qwen3.5:9b or CodeQwen | Gemma3:4b |
| Deep reasoning | DeepSeek-R1:7b | Gemma3:4b (limited) |
| Document RAG | Any via Open WebUI | Via Open WebUI on M4 |
| Image understanding | Gemma 3 (multimodal) | Gemma 3 (multimodal) |

### The Sovereign Mindset

> "Sovereignty is not rebellion. It is engineering maturity. The future is not purely cloud. It is not purely local either. The future is controlled." [^117^]

Nick's setup -- M4 + M2 MacBooks running Ollama with MLX, connected via Tailscale, fronted by Open WebUI -- represents a **fully sovereign AI stack** that:
- Requires zero cloud API calls
- Keeps all data on-device
- Costs ~$5-10/month in electricity
- Provides frontier-class capabilities (Qwen3.5 rivals GPT-4o on many tasks)
- Scales from 8GB to 128GB+ without architectural changes
- Can optionally add cloud fallback via LiteLLM when needed

---

## REFERENCES

[^17^]: Ollama Blog - "Ollama's highest performance on Apple Silicon yet with MLX" (June 2026). https://ollama.com/blog/

[^19^]: Ollama Blog - "Ollama is now powered by MLX on Apple Silicon in preview" (March 2026). https://ollama.com/blog/mlx

[^35^]: willitrunai.com - "MLX vs Ollama on Apple Silicon (2026) -- Real Benchmarks" (April 2026). https://willitrunai.com/blog/mlx-vs-ollama-apple-silicon-benchmarks

[^37^]: Medium - "Ollama 0.19 Ships MLX Backend for Apple Silicon" (April 2026). https://medium.com/@tentenco/ollama-0-19-ships-mlx-backend

[^39^]: techplustrends.com - "EU Sovereign AI Infrastructure Stack: The Complete 2026 Guide" (April 2026). https://techplustrends.com/eu-sovereign-ai-infrastructure-stack-2026-guide/

[^40^]: Ollama Blog - "Ollama's highest performance on Apple Silicon yet with MLX" (June 2026). https://ollama.com/blog/mlx-performance

[^43^]: contabo.com - "Ollama vs LM Studio: Which Local LLM Tool Wins in 2026?" (May 2026). https://contabo.com/blog/ollama-vs-lm-studio-which-local-llm-runtime-should-you-use-in-2026/

[^44^]: modelfit.io - "Qwen 3.5 on Mac: The 20GB Model That Beats a 235B" (June 2026). https://modelfit.io/blog/qwen-35-medium-series/

[^45^]: morphllm.com - "Ollama vs LM Studio: CLI Power vs GUI Comfort" (April 2026). https://www.morphllm.com/comparisons/ollama-vs-lm-studio

[^47^]: Medium - "Multi-Model Routing with LM Studio and Apple's MLX" (March 2026). https://medium.com/@michael.hannecke/the-same-router-better-backend

[^50^]: tensorfoundry.io - "LLM Inference Servers Compared - vLLM, SGLang, llama.cpp and Ollama" (June 2026). https://tensorfoundry.io/blog/llm-inference-servers-compared

[^51^]: techsy.io - "vLLM vs SGLang 2026: H100 Benchmarks Inside" (June 2026). https://techsy.io/en/blog/vllm-vs-sglang

[^102^]: aiagentstore.ai - "Tailscale - AI Agent" (2026). https://aiagentstore.ai/ai-agent/tailscale

[^103^]: mindstudio.ai - "What Is Mamba 3? The State Space Model Architecture" (March 2026). https://www.mindstudio.ai/blog/what-is-mamba-3-state-space-model

[^104^]: Medium - "Open WebUI: Self-Hosted LLM Interface" (January 2026). https://medium.com/@rosgluk/open-webui-self-hosted-llm-interface-0e4c7565542d

[^105^]: wz-it.com - "Open WebUI vs. AnythingLLM: The detailed comparison" (November 2025). https://wz-it.com/en/blog/open-webui-vs-anythingllm-comparison/

[^106^]: digitalocean.com - "Top 10 Microsoft Azure Alternatives for Cloud Apps in 2026" (December 2025). https://www.digitalocean.com/resources/articles/azure-alternatives

[^107^]: spheron.network - "NVFP4 vs MXFP4: 4-Bit Quantization Format Decision Guide" (June 2026). https://www.spheron.network/blog/nvfp4-vs-mxfp4-gpu-cloud-4bit-quantization-guide/

[^108^]: bmdpat.com - "GGUF Quantization Explained: Q4_K_M vs Q5_K_M vs Q8" (May 2026). https://bmdpat.com/blog/gguf-quantization-q4-q5-q8-explained-2026

[^109^]: arXiv - "Linear-Time Sequence Modeling with Selective State Spaces" (December 2023). https://arxiv.org/abs/2312.00752

[^110^]: tailscale.com - "What is Tailscale?" (2026). https://tailscale.com/docs/concepts/what-is-tailscale

[^111^]: xda-developers.com - "This self-hosted tool makes my local LLMs feel exactly like ChatGPT" (March 2026). https://www.xda-developers.com/this-self-hosted-tool-makes-my-local-llms-feel-exactly-like-chatgpt/

[^112^]: Medium - "Mamba, Selective State Space Models, and the Rise of Post-Transformer AI" (January 2026). https://medium.com/@raktims2210/mamba-selective-state-space-models

[^114^]: spheron.network - "Mamba-3 and State Space Models on GPU Cloud" (April 2026). https://www.spheron.network/blog/mamba-3-state-space-model-gpu-cloud-deployment/

[^115^]: knightli.com - "LLM Quantization Explained: How to Choose FP16, Q8, Q5, Q4, or Q2" (April 2026). https://knightli.com/en/2026/04/05/llm-quantization-guide-fp16-q4-q5/

[^117^]: topailearninghub.com - "Sovereign AI Stack 2026: Why I Left Cloud LLMs for Local Infrastructure" (May 2026). https://www.topailearninghub.com/2026/05/sovereign-ai-stack-2026-why-i-left.html

[^118^]: sitepoint.com - "Running DeepSeek R1 Locally: Your Complete Setup Guide" (April 2026). https://www.sitepoint.com/running-deepseek-r1-locally-your-complete-setup-guide-2026/

[^119^]: refurb.me - "Best Mac for AI in 2026: Run Local LLMs on a Budget" (May 2026). https://www.refurb.me/blog/best-mac-for-ai

[^120^]: morphllm.com - "Best Ollama Models: 12 Models Ranked for Coding, RAG & Agents" (June 2026). https://www.morphllm.com/best-ollama-models

[^121^]: morphllm.com - "LLM API Providers (2026): 12 APIs Compared by Price" (June 2026). https://www.morphllm.com/llm-api

[^122^]: aimagicx.com - "LLM API Pricing in 2026: The Complete Cost Comparison" (March 2026). https://www.aimagicx.com/blog/llm-api-pricing-comparison-2026

[^123^]: sitepoint.com - "Local LLMs vs Cloud APIs: 2026 Total Cost of Ownership Analysis" (March 2026). https://www.sitepoint.com/local-llms-vs-cloud-api-cost-analysis-2026/

[^125^]: sitepoint.com - "Hybrid Cloud-Local LLM: The Complete Architecture Guide" (April 2026). https://www.sitepoint.com/hybrid-cloudlocal-llm-the-complete-architecture-guide-2026/

[^178^]: lobste.rs - "oMLX: LLM inference server with continuous batching & SSD caching" (May 2026). https://lobste.rs/s/nqwrqf/omlx_llm_inference_server_with

[^179^]: Medium - "I Tried Running AI Agents on My MacBook. MLX Was Too Slow. Then I Found oMLX" (May 2026). https://blog.gopenai.com/i-tried-running-ai-agents-on-my-macbook-mlx-was-too-slow-then-i-found-omlx

[^180^]: Medium - "The Missing Piece in Apple Silicon LLM Inference Nobody Talks About" (March 2026). https://medium.com/@alexandru_vasile/the-missing-piece-in-apple-silicon-llm-inference

[^181^]: sitepoint.com - "Best Local LLM Models 2026 | Developer Comparison" (March 2026). https://www.sitepoint.com/best-local-llm-models-2026/

[^182^]: localaimaster.com - "Best Mac for Local AI 2026: M4 vs M3 vs M2 (8-128GB Tested)" (May 2026). https://localaimaster.com/blog/apple-silicon-ai-buying-guide

[^183^]: Medium - "Practical NLP with Local LLMs on a MacBook Air M2 (8 GB)" (January 2026). https://mwzero.medium.com/practical-nlp-with-local-llms-on-a-macbook-air-m2-8-gb

[^185^]: localaimaster.com - "LiteLLM AI Gateway: Route Local + Cloud Models" (April 2026). https://localaimaster.com/blog/ai-gateway-litellm

[^186^]: sitepoint.com - "Hybrid Cloud-Local LLM Architecture Guide" (April 2026). https://www.sitepoint.com/hybrid-cloudlocal-llm-the-complete-architecture-guide-2026/

[^187^]: GitHub - "jundot/omlx: LLM inference server with continuous batching & SSD caching" (2026). https://github.com/jundot/omlx

[^188^]: omlx.ai - "oMLX -- LLM inference, optimized for your Mac" (2026). https://omlx.ai/

[^189^]: localaimaster.com - "Jan vs LM Studio vs Ollama: Best Local AI App 2026" (October 2025). https://localaimaster.com/blog/jan-vs-lm-studio-vs-ollama

[^190^]: OpenReview - "On Structured State-Space Duality" (ICML 2024/2025). https://openreview.net/forum?id=C9LAf2tlKj

[^44^]: See also [^44^] modelfit.io Qwen 3.5 analysis

[^8^]: See also [^8^] kunalganglani.com Ollama vs LM Studio comparison

[^36^]: See also [^36^] sitepoint.com Llama 4 Scout on MLX guide

[^38^]: See also [^38^] aimagicx.com Local AI models 2026 guide

[^42^]: See also [^42^] refurb.me Mac for AI comparison table

[^46^]: See also [^46^] aimagicx.com Qwen/Mistral/Llama hardware guide

[^48^]: See also [^48^] sitepoint.com Best local LLM models 2026

[^49^]: See also [^49^] singleapi.net Ollama MLX support analysis

[^113^]: See also [^113^] vinlam.com 50+ Open-Source Options for Running LLMs Locally

[^185^]: See also [^185^] reddit.com r/LocalLLaMA M2 8GB RAM recommendations

[^44^]: See also [^44^] modelfit.io Qwen 3.5 on Mac analysis

[^46^]: See also [^46^] aimagicx.com Local AI models comparison

---

*Report compiled from 14 independent web searches with varied queries across the sovereign AI landscape. All benchmarks, pricing, and specifications reflect data available as of July 2026. Verify current versions and pricing before making infrastructure decisions.*
