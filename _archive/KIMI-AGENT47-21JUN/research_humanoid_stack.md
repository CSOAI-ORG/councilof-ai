# Deep Research: Humanoid Agent Stack + MoE Models

## Comprehensive Technology Research for 46 AI Agents with 3D Humanoid Avatars

**Research Date:** July 2026
**Scope:** Model Selection, 3D Avatar Pipeline, Voice/Personality Layer, Cost Modeling

---

## Table of Contents

1. [Model Comparison Matrix](#1-model-comparison-matrix)
2. [Cost Model: Monthly API Bill Estimates](#2-cost-model-monthly-api-bill-estimates)
3. [Avatar System Comparison](#3-avatar-system-comparison)
4. [Recommended Avatar Pipeline](#4-recommended-avatar-pipeline)
5. [Recommended Model Configuration](#5-recommended-model-configuration)
6. [Visual Style Recommendation](#6-visual-style-recommendation)
7. [Voice & Personality Strategy](#7-voice--personality-strategy)
8. [OpenRouter Fusion Analysis](#8-openrouter-fusion-analysis)

---

## 1. Model Comparison Matrix

### 1.1 Core Model Candidates (OpenRouter Pricing)

| Model | Input $/M | Output $/M | Context | Tool Use | License | Speed | Best For |
|-------|-----------|------------|---------|----------|---------|-------|----------|
| **Kimi K2.6** (Moonshot) | $0.68 | $3.41 | 262K | Yes | Modified MIT | 29 tok/s | Agent orchestration, coding |
| **DeepSeek V3.2** | $0.23 | $0.34 | 131K | Yes | MIT | ~40 tok/s | General purpose, CHEAPEST |
| **DeepSeek V4** | $0.30 | $0.50 | 1M | Yes | MIT | Fast | Best value frontier-class |
| **MiniMax M3** | $0.30 | $1.20 | 1M | Yes | Open weights (conditional) | Good | Long-horizon agents, coding |
| **Qwen3 235B A22B** (Instruct) | $0.09 | $0.10 | 262K | Yes | Open weights | Good | Best value MoE |
| **Qwen3 235B A22B** (Thinking) | $0.10 | $0.10 | 262K | Yes | Open weights | Slower | Complex reasoning |
| **Mixtral 8x22B** | $0.65-$2.00 | $0.65-$6.00 | 65K | No | Apache 2.0 | 173 tok/s | NOT RECOMMENDED (no tool use) |
| **Command R+** (Cohere) | $2.50 | $10.00 | 128K | Yes | Proprietary | Medium | RAG + multi-step tool use |
| **GLM-5.1** (Z.ai) | ~$1.20 | ~$4.00 | 200K | Yes | MIT | Good | Coding, agentic tasks |
| **Cohere North Mini Code** | $0 | $0 | 256K | Yes | Apache 2.0 | Fast | FREE coding model |

*Sources: [OpenRouter Kimi K2.6](https://openrouter.ai/moonshotai/kimi-k2.6), [OpenRouter DeepSeek V3.2](https://openrouter.ai/deepseek/deepseek-v3.2), [OpenRouter Qwen3 235B](https://openrouter.ai/qwen/qwen3-235b-a22b-2507), [OpenRouter MiniMax M3](https://openrouter.ai/minimax/minimax-m3), [OpenRouter Mixtral 8x22B](https://openrouter.ai/mistralai/mixtral-8x22b-instruct), [Cohere Command R+ Docs](https://docs.cohere.com/docs/command-r-plus)*

### 1.2 Detailed Model Analysis

#### DeepSeek V3.2 / V4 — TOP RECOMMENDATION

**Architecture:** Mixture-of-Experts (MoE) with 671B total parameters (37B active per token). V4 upgrades to 1.6T total with enhanced agent training on 1,800+ environments and 85,000+ agent tasks. [^58^](https://github.com/deepseek-ai/deepseek-v3) [^55^](https://api-docs.deepseek.com/news/news251201)

**Key Strengths:**
- Native tool calling with "thinking in tool-use" — DeepSeek V3.2 is their first model to integrate reasoning directly into tool use [^50^](https://api-docs.deepseek.com/guides/tool_calls)
- MIT license (fully commercial use) [^58^](https://github.com/deepseek-ai/deepseek-v3)
- 128K context window (1M for V4)
- Supports both thinking and non-thinking modes
- Multi-head Latent Attention (MLA) for efficient inference
- Extremely cheap: $0.23 input / $0.34 output per million tokens on OpenRouter
- 90% cache discount on DeepSeek direct API ($0.028/M cached)

**Limitations:** Not great at multi-turn function calling; performs best with single user message triggering function calls [^48^](https://fireworks.ai/blog/function-calling-deepseekv3)

**Rate Limits:** OpenRouter free tier available; paid tier very generous. DeepSeek direct API has variable availability during peak hours.

---

#### Kimi K2.6 (Moonshot AI) — BEST FOR AGENT ORCHESTRATION

**Architecture:** 1T total parameters, 32B active per forward pass. Native multimodal MoE. [^39^](https://kilo.ai/open-source-models)

**Key Strengths:**
- SWARM-NATIVE — explicitly designed for multi-agent orchestration
- 262K context window with 262K max output
- Modified MIT license (self-hostable)
- 80.2% on SWE-Bench Verified, 66.7% Terminal-Bench, 89.6% LiveCodeBench [^39^](https://kilo.ai/open-source-models)
- Excellent tool use and agentic capabilities
- Good speed: ~29 tok/s throughput, 1.56s latency

**Limitations:** More expensive than DeepSeek; output tokens cost $3.41/M vs DeepSeek's $0.34/M

**Best Use:** One "orchestrator" agent that coordinates the other 45 agents.

---

#### MiniMax M3 — BEST FOR LONG-HORIZON AGENTS

**Architecture:** Sparse MoE with MiniMax Sparse Attention (MSA), replaces full attention with KV-block selection. 1M context window. [^150^](https://openrouter.ai/minimax/minimax-m3) [^164^](https://www.minimax.io/blog/minimax-m3)

**Key Strengths:**
- 1 MILLION token context window (512K guaranteed)
- Native multimodal: text, image, video in; text out
- 59.0% SWE-Bench Pro (surpasses GPT-5.5 and Gemini 3.1 Pro on coding)
- Promo pricing: $0.30/M input, $1.20/M output
- ~1/20 the cost of previous generation at 1M tokens
- 9x faster prefill, 15x faster decode at 1M tokens vs prior gen

**Limitations:**
- License has commercial restrictions — read carefully before commercial deployment [^151^](https://lushbinary.com/blog/minimax-m3-developer-guide-benchmarks-pricing-msa-architecture/)
- Promo pricing is temporary; standard rate is $0.60/$2.40
- Newer model with less production track record

**Best Use:** Specialized "deep work" agents that need to process large codebases, documents, or long conversation history.

---

#### Qwen3 235B A22B — BEST VALUE MoE

**Architecture:** 235B parameter MoE, 22B active per forward pass. Built by Alibaba. [^75^](https://openrouter.ai/qwen/qwen3-235b-a22b-thinking-2507) [^78^](https://openrouter.ai/qwen/qwen3-235b-a22b-2507)

**Key Strengths:**
- CHEAPEST capable MoE: $0.09/M input, $0.10/M output (Instruct)
- 262K context window
- Strong tool use and agentic workflows
- Excellent multilingual support
- Multiple variants: Instruct (fast), Thinking (reasoning), VL (vision)
- Apache 2.0 license for most variants

**Limitations:**
- Pricing varies significantly by provider on OpenRouter
- Thinking variant is slower but same price
- Less benchmark data than DeepSeek/Kimi

**Best Use:** Bulk of the 46 agents — the "workhorse" model.

---

#### Mixtral 8x22B — NOT RECOMMENDED

**Why Not:** Despite being open source (Apache 2.0) and having 65K context, **it does NOT support function/tool calling** according to OpenRouter capability listings. [^125^](https://futureagi.com/llm-cost-calculator/openrouter/mistralai-mixtral-8x22b-instruct/) This is a dealbreaker for MCP/A2A agent workflows. Additionally, pricing is no longer competitive ($0.65-$2.00/M).

---

#### Command R+ — SPECIALIZED RAG AGENT ONLY

**Why Limited:** At $2.50/M input and $10.00/M output, this is 10-40x more expensive than DeepSeek/Qwen alternatives. Cohere themselves recommend Command A for most use cases. [^136^](https://docs.cohere.com/docs/command-r-plus) Good for complex RAG + multi-step tool use but prohibitively expensive at 46-agent scale.

---

### 1.3 FREE Models on OpenRouter (For Cost Optimization)

OpenRouter offers **27 free models** with rate limits of 20 requests/minute, 200 requests/day. [^153^](https://costgoat.com/pricing/openrouter-free-models) [^154^](https://openrouter.ai/collections/free-models)

| Free Model | Context | Best For |
|------------|---------|----------|
| Cohere North Mini Code | 256K | Coding agents |
| DeepSeek V4 Flash | 1M+ | General reasoning |
| Llama 3.3 70B Instruct | 128K | General chat |
| Qwen3 Coder variants | Various | Code generation |
| Gemma 4 31B | 128K | Vision + multimodal |

**Strategy:** Use free models for low-stakes agents with fallback to paid models.

---

## 2. Cost Model: Monthly API Bill Estimates

### 2.1 Scenario Parameters

- **46 agents** running simultaneously
- Each agent makes **~100 API calls/day**
- Average **2,000 input tokens** and **400 output tokens** per call
- **30 days/month** operation
- Some calls use longer context (10,000 input / 2,000 output) for complex reasoning

### 2.2 Call Mix Assumptions

| Call Type | % of Calls | Input Tokens | Output Tokens | Purpose |
|-----------|-----------|-------------|---------------|---------|
| Simple chat | 60% | 1,500 | 300 | Basic dialogue, status updates |
| Tool use | 25% | 3,000 | 500 | MCP/A2A function calls |
| Deep reasoning | 10% | 10,000 | 2,000 | Complex planning, coding |
| Long context | 5% | 50,000 | 5,000 | Document analysis, memory |

**Daily totals per agent:** ~100 calls = ~325K input + ~65K output tokens
**System-wide daily:** ~46 agents = ~15M input + ~3M output tokens

### 2.3 Monthly Cost by Model Strategy

#### Option A: "Budget First" (All Qwen3 235B + DeepSeek V3.2)

| Component | Monthly Cost |
|-----------|-------------|
| 40 agents x Qwen3 235B Instruct @ $0.09/$0.10/M | ~$50 + $9 = **$59** |
| 6 "smart" agents x DeepSeek V3.2 @ $0.23/$0.34/M | ~$95 + $20 = **$115** |
| **TOTAL** | **~$174/month** |

#### Option B: "Balanced" (Recommended)

| Component | Monthly Cost |
|-----------|-------------|
| 35 worker agents x Qwen3 235B @ $0.09/$0.10/M | ~$43 + $8 = **$51** |
| 8 specialist agents x DeepSeek V4 @ $0.30/$0.50/M | ~$112 + $46 = **$158** |
| 2 orchestrator agents x Kimi K2.6 @ $0.68/$3.41/M | ~$63 + $126 = **$189** |
| 1 memory/reasoning agent x MiniMax M3 @ $0.30/$1.20/M | ~$14 + $11 = **$25** |
| **TOTAL** | **~$423/month** |

#### Option C: "Premium" (Best Quality)

| Component | Monthly Cost |
|-----------|-------------|
| 30 agents x DeepSeek V4 @ $0.30/$0.50/M | ~$405 + $135 = **$540** |
| 10 agent leads x Kimi K2.6 @ $0.68/$3.41/M | ~$313 + $627 = **$940** |
| 4 deep agents x MiniMax M3 @ $0.30/$1.20/M | ~$55 + $44 = **$99** |
| 2 orchestrators x Kimi K2.7 Code @ $0.74/$3.50/M | ~$68 + $161 = **$229** |
| **TOTAL** | **~$1,808/month** |

#### Option D: "Ultra Budget" (Free Models + Fallback)

| Component | Monthly Cost |
|-----------|-------------|
| 20 low-stakes agents using free tier | **$0** |
| 26 remaining agents x Qwen3 235B @ $0.09/$0.10/M | ~$32 + $6 = **$38** |
| Occasional fallback to paid for free-tier failures | ~$20 |
| **TOTAL** | **~$58/month** |

*Note: Free tier limits (200 req/day/model) may constrain high-activity agents.*

### 2.4 Cost Optimization Strategies

1. **Prompt caching:** DeepSeek offers 90% cache discounts. Reusing system prompts can cut costs by 60-80%. [^160^](https://www.nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)
2. **Model routing:** Use Qwen3 for 80% of calls, DeepSeek/Kimi only for complex reasoning
3. **Free tier rotation:** Rotate between free models for non-critical agents
4. **Off-peak scheduling:** DeepSeek offers 50-75% discounts during off-peak hours (16:30-00:30 GMT) [^160^](https://www.nxcode.io/resources/news/deepseek-api-pricing-complete-guide-2026)
5. **Batch processing:** Group non-urgent agent tasks into batch calls

---

## 3. Avatar System Comparison

### 3.1 Option Comparison Matrix

| System | Browser | Cost | Unique Avatars | Animations | Lip Sync | Performance | License |
|--------|---------|------|----------------|------------|----------|-------------|---------|
| **ReadyPlayerMe** | Yes | $0 (dev tier) | 46+ via API | Idle, walk, talk | No | Medium | Proprietary |
| **Three.js + Mixamo** | Yes | Free | Unlimited (procedural) | 2,000+ free anims | Manual | Good | Open source |
| **VRoid Studio + VRM** | Yes | Free | 46+ (manual creation) | Shareable rigs | Blend shapes | Good | Custom per model |
| **Mozilla Hubs** | Yes | Free (self-hosted) | Community models | Basic | No | Medium | MPL2 |
| **Webaverse** | Yes | Free (open source) | Runtime uploads | VRM compatible | Via VRM | Medium | MIT-like |
| **Inworld AI** | Yes | $0.002/interaction | Configurable | Expressive | Yes | Cloud-rendered | Proprietary |
| **Custom Low-Poly** | Yes | Free | Unlimited | Hand-crafted | Simple | **Excellent** | Full control |

### 3.2 Detailed Analysis

#### ReadyPlayerMe — STATUS: SERVICE DISCONTINUED FOR DEVELOPERS

**CRITICAL UPDATE:** ReadyPlayerMe shut down independent consumer/developer-facing services effective **January 31, 2026**. [^41^](https://streamoji.com/blog/ready-player-me-alternatives-2026) They pivoted to enterprise-only partnerships. **Not a viable option for new projects.** Alternatives like Streamoji have emerged for teams needing similar functionality.

---

#### Three.js + Mixamo + VRoid — RECOMMENDED APPROACH

**Stack Components:**

1. **Avatar Creation:** VRoid Studio (free) → Export VRM → Convert to GLB
   - Anime-style 3D characters with rich customization
   - 10+ parameters for face, hair, body, clothing
   - Export as VRM (which is GLB-based) [^184^](https://vroid.com/en/studio)

2. **Animation:** Mixamo (free, Adobe account required)
   - 2,000+ free animations: idle, walk, run, sit, work, talk, sleep, gesture
   - Auto-rigging: upload any humanoid model, get rigged skeleton
   - Export as FBX → Convert to GLB/GLTF [^183^](https://www.donmccurdy.com/2017/11/06/creating-animated-gltf-characters-with-mixamo-and-blender/)

3. **Rendering:** Three.js with @pixiv/three-vrm
   - VRM loader plugin for Three.js [^185^](https://github.com/pixiv/three-vrm)
   - MToon material for cel-shaded anime look
   - Blend shape support for facial expressions
   - WebGPU renderer support (Three.js r167+)

**Performance Targets:**
- Each VRM avatar: ~5-15MB (can be optimized to ~2-5MB with Draco)
- 46 characters on screen: 30-60 FPS with LOD on modern GPU
- AnimationMixer overhead: ~0.1ms per character (throttled updates)

**Pros:**
- Completely free
- 46 unique characters: YES — each created individually in VRoid
- Full animation library via Mixamo
- Lip sync: Via VRM blend shapes (mouth open/close)
- Runs entirely in browser
- MIT license

**Cons:**
- Manual character creation (1-2 hours per character in VRoid)
- Anime style only (VRoid limitation)
- Need to convert VRM → GLB for optimal Three.js performance
- No automatic LOD generation

---

#### VRoid Studio Pipeline — STEP BY STEP

1. **Download VRoid Studio** (free, Windows/macOS/iPad) [^184^](https://vroid.com/en/studio)
2. **Create base character** using sliders (face, body, hair, clothing)
3. **Customize textures** with built-in pen tool
4. **Export as VRM 1.0** file
5. **Load in Three.js:**
   ```javascript
   import { VRMLoaderPlugin } from '@pixiv/three-vrm';
   const loader = new GLTFLoader();
   loader.register((parser) => new VRMLoaderPlugin(parser));
   loader.load('character.vrm', (gltf) => {
     const vrm = gltf.userData.vrm;
     scene.add(vrm.scene);
   });
   ```
6. **Apply Mixamo animations** by retargeting to VRM humanoid skeleton
7. **Control expressions** via VRM blend shape proxies:
   ```javascript
   vrm.expressionManager.setValue('aa', 0.5); // mouth open
   vrm.expressionManager.setValue('happy', 0.8); // smile
   ```

---

#### Inworld AI — For Voice/Personality Only

**Not recommended for 3D rendering** but excellent for character personality backend:
- Pricing: ~$0.002 per API interaction [^135^](https://www.eesel.ai/blog/inworld-ai-pricing)
- Built-in memory, emotion, goals system
- Multi-agent conversation support
- Overkill for our use case (we need 46 agents, not thousands)
- Better to build personality layer ourselves

---

#### Webaverse — Reference Architecture

Open source metaverse engine with Three.js. [^141^](https://github.com/webaverse-studios/webaverse)

**Relevant Features:**
- Expressive, vocal and emotive avatars
- AI-powered NPCs
- Multiplayer with voice
- Completely self-hostable
- Runtime user uploads

**Use:** Study their avatar system implementation, but it's a full engine — too heavy for our use case.

---

## 4. Recommended Avatar Pipeline

### 4.1 Final Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    BROWSER (Client)                          │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Three.js │  │ @pixiv/  │  │ React Three Fiber (opt.) │  │
│  │ (r167+)  │  │ three-vrm│  │                          │  │
│  └────┬─────┘  └────┬─────┘  └──────────────────────────┘  │
│       │             │                                       │
│  ┌────▼─────────────▼──────┐  ┌──────────────────────────┐  │
│  │    VRM Character Set     │  │   Animation Mixer        │  │
│  │  (46 unique avatars)     │  │   (idle/walk/work/sit)   │  │
│  └─────────────────────────┘  └──────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐   │
│  │         LOD System (3 levels per character)           │   │
│  │  Level 0: Full mesh + bones (close)                  │   │
│  │  Level 1: Reduced vertices + fewer bones (medium)    │   │
│  │  Level 2: Billboard/impostor (far)                   │   │
│  └──────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│                    SERVER (API)                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │ OpenRouter│  │ Agent    │  │Personality│  │  Voice   │   │
│  │ (MoE LLM)│  │ State    │  │  System   │  │  Synthesis│  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Implementation Steps

#### Phase 1: Character Asset Creation (1-2 weeks)

1. **Install VRoid Studio** [^184^](https://vroid.com/en/studio)
2. **Create 5-8 "archetype" base characters** (different body types, clothing styles)
3. **Export each as VRM**, then convert to optimized GLB using:
   ```bash
   # Using gltf-transform CLI
   npx @gltf-transform/cli optimize input.vrm output.glb \
     --compress draco --texture-compress ktx2
   ```
4. **Use gltf-transform to generate 3 LOD levels** per character [^186^](https://www.utsubo.com/blog/threejs-best-practices-100-tips)
   ```bash
   npx @gltf-transform/cli simplify input.glb lod1.glb --ratio 0.5
   npx @gltf-transform/cli simplify input.glb lod2.glb --ratio 0.2
   ```
5. **Batch process** all 46 characters with a Node.js script

#### Phase 2: Animation Setup (1 week)

1. **Download core Mixamo animations:**
   - Idle (looping, ~10 variants)
   - Walk (forward, backward, strafe)
   - Run
   - Sit (start, loop, end)
   - Work (typing, writing, building)
   - Talk (gesturing, listening)
   - Sleep (lying down)
   - Wave, point, celebrate

2. **Convert Mixamo FBX → GLB** using Blender:
   ```bash
   # Import FBX, export as glTF binary with animations
   ```
   Detailed workflow: [^183^](https://www.donmccurdy.com/2017/11/06/creating-animated-gltf-characters-with-mixamo-and-blender/)

3. **Retarget animations to VRM skeleton** using @pixiv/three-vrm animation plugin

4. **Create AnimationState machine:**
   ```javascript
   const states = {
     idle: { clip: 'idle', loop: true },
     walk: { clip: 'walk', loop: true, speed: 1.0 },
     work: { clip: 'typing', loop: true },
     talk: { clip: 'gesturing', loop: true },
     sit: { clip: 'sit_loop', loop: true },
     sleep: { clip: 'lie_down', loop: true }
   };
   ```

#### Phase 3: Runtime Performance Optimization (1 week)

1. **Implement LOD with React Three Fiber's `<Detailed>`:**
   ```jsx
   import { Detailed } from '@react-three/drei';
   
   <Detailed distances={[0, 30, 80]}>
     <HighPolyVRM url="char_lod0.glb" />
     <MediumPolyVRM url="char_lod1.glb" />
     <BillboardSprite url="char_sprite.png" />
   </Detailed>
   ```
   [^59^](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

2. **Animation throttling** — don't update every frame:
   ```javascript
   // Update distant characters every 3 frames
   const throttle = distance > 50 ? 3 : 1;
   if (frameCount % throttle === 0) {
     mixer.update(delta);
   }
   ```
   [^88^](https://discourse.threejs.org/t/optimization-of-large-amounts-100-1000-of-skinned-meshes-cpu-bottlenecks/58196)

3. **Frustum culling** — don't animate off-screen characters
   ```javascript
   if (!frustum.intersectsObject(character)) return;
   ```

4. **Instancing for background crowds** — use `InstancedMesh` for distant characters with simple vertex animation (no skeleton). [^151^](https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/)

5. **GPU-driven rendering** (WebGPU):
   ```javascript
   // Use compute shaders for animation on GPU
   // Three.js WebGPU renderer: import { WebGPURenderer } from 'three/webgpu'
   ```
   [^186^](https://www.utsubo.com/blog/threejs-best-practices-100-tips)

6. **Asset compression:**
   - Draco for geometry: 90-95% size reduction
   - KTX2 for textures: ~10x VRAM reduction
   - Total per character: <2MB optimized

#### Phase 4: Expression & Lip Sync (1 week)

1. **Facial expressions via VRM blend shapes:**
   ```javascript
   // Emotion mapping
   const emotions = {
     happy:  { happy: 1.0, relaxed: 0.5 },
     sad:    { sad: 1.0, angry: 0.0 },
     angry:  { angry: 1.0, serious: 0.8 },
     surprised: { surprised: 1.0 },
     neutral: {}
   };
   ```

2. **Simple lip sync:** Map phonemes to blend shapes:
   - A/I sounds → `aa` blend shape
   - O sounds → `oh` blend shape
   - U sounds → `ou` blend shape
   - Closed → `nn` blend shape

3. **Body language:** Map personality traits to animation modifiers:
   - Confidence → animation speed multiplier
   - Energy → movement amplitude
   - Sociability → gesture frequency

---

## 5. Recommended Model Configuration

### 5.1 Agent Tier Assignment

| Tier | Count | Model | Purpose | Est. Monthly Cost |
|------|-------|-------|---------|-------------------|
| **Tier 1: Orchestrator** | 1 | Kimi K2.6 | System coordinator, assigns tasks, resolves conflicts | ~$95 |
| **Tier 2: Specialist Leads** | 5 | DeepSeek V4 | Domain experts: coding, research, creative, analysis, planning | ~$198 each |
| **Tier 3: Long-Context** | 2 | MiniMax M3 | Document processors, code reviewers, memory agents | ~$25 each |
| **Tier 4: Workers** | 30 | Qwen3 235B Instruct | General-purpose agents, dialogue, simple tasks | ~$1.30 each |
| **Tier 5: Simple Bots** | 8 | DeepSeek V3.2 or Free Tier | Background agents, status reporters, simple monitors | ~$0.50 each |
| **TOTAL** | **46** | | | **~$423/month (Balanced)** |

### 5.2 Model Selection Rationale

**Why Kimi K2.6 for Orchestrator:**
- Explicitly swarm-native architecture
- Highest coding benchmarks (80.2% SWE-Bench)
- 262K context for system-wide state
- Self-hosted option available for cost control

**Why DeepSeek V4 for Specialists:**
- Frontier-class performance at 1/10th the cost of GPT-4
- Best-in-class tool use with thinking-in-tool
- MIT license (fully commercial)
- 1M context window
- Most cost-efficient "smart" model

**Why MiniMax M3 for Long-Context:**
- 1M token window at usable price
- Excellent coding benchmarks
- Sparse attention = cheap long context
- Native multimodal for document + image processing

**Why Qwen3 235B for Workers:**
- CHEAPEST capable MoE ($0.09/$0.10/M)
- Strong enough for 80% of agent tasks
- Apache 2.0 license
- 262K context

**Why DeepSeek V3.2 for Simple Bots:**
- Cheapest overall ($0.23/$0.34/M)
- Fast, direct responses (non-thinking)
- Good enough for status updates, simple chat

### 5.3 Dynamic Model Routing

Implement a simple router that selects models based on task complexity:

```javascript
function selectModel(task) {
  if (task.type === 'orchestrate') return 'moonshotai/kimi-k2.6';
  if (task.contextLength > 200000) return 'minimax/minimax-m3';
  if (task.complexity > 0.8) return 'deepseek/deepseek-v4';
  if (task.complexity > 0.5) return 'deepseek/deepseek-v3.2';
  return 'qwen/qwen3-235b-a22b-2507';
}
```

---

## 6. Visual Style Recommendation

### 6.1 Style Decision: Stylized Low-Poly / Toon Shaded

**Recommended Style:** "Clean Stylized" — low-poly geometry with flat/cel-shaded materials, similar to:

- **Townscaper** — clean, procedural, calming
- **The Sims** — stylized humans, readable at distance
- **Animal Crossing** — charming, approachable
- **emergence.ai** — if available, their aesthetic

### 6.2 Why This Style

| Factor | Realistic | Low-Poly Stylized | Pixel Art |
|--------|-----------|-------------------|-----------|
| Performance | Poor (high poly) | **Excellent** | Good |
| 46 characters readability | Cluttered | **Clear silhouettes** | OK |
| Emotional expression | Uncanny valley | **Expressive, safe** | Limited |
| Development time | Weeks per character | **Hours per character** | Moderate |
| Browser performance | Struggles at 46 | **60 FPS achievable** | Good |
| "CSOAI superorganism" feel | No | **Emergent, organic** | Retro |
| Token/bandwidth cost | High textures | **Low asset size** | Low |

### 6.3 Style Guidelines

**Character Design:**
- **Silhouette-first:** Each agent type must be recognizable by outline
- **Color coding:** Different roles = different accent colors (visible from afar)
- **Proportions:** 3-4 heads tall (chibi-lite) for cuteness + readability
- **Face:** Simple dot eyes + line mouth (animated via blend shapes)

**Environment:**
- Clean flat colors with slight gradient
- Minimal texture detail
- Procedural elements where possible
- Isometric or 3/4 perspective

**UI Overlay:**
- Speech bubbles above characters (text, not voice)
- Status indicators (working, talking, idle)
- Agent name + role tags

### 6.4 Technical Implementation

Use **MToon material** from @pixiv/three-vrm for cel-shaded look:
```javascript
// Cel shading parameters
material.shadeColor = new THREE.Color(0.5, 0.5, 0.5);
material.shadeToony = 0.8; // Sharp shadow transition
material.matcapFactor = 0.5; // Specular highlight
```

**Outline rendering:** Three.js post-processing OutlinePass or MToon built-in outlines.

---

## 7. Voice & Personality Strategy

### 7.1 Voice System Architecture

**Tiered approach based on importance:**

| Agent Tier | Voice Solution | Cost | Quality |
|------------|---------------|------|---------|
| Orchestrator + Specialists (6) | Kokoro TTS (local) | **$0** | Good, unique voices |
| Workers (30) | Kokoro TTS (local) | **$0** | Good, shared voices |
| Simple Bots (10) | Web Speech API (browser built-in) | **$0** | Basic, no cost |

### 7.2 Kokoro TTS — PRIMARY RECOMMENDATION

**Why Kokoro:**
- **82M parameters** — tiny, runs on CPU [^84^](https://huggingface.co/hexgrad/Kokoro-82M)
- **Apache 2.0 license** — fully commercial [^86^](https://github.com/hexgrad/kokoro)
- **<2GB VRAM** — runs on any GPU, even CPU-only [^74^](https://docs.clore.ai/guides/audio-and-voice/kokoro-tts)
- **Multiple voices:** 54+ voice packs in 8+ languages [^83^](https://replicate.com/jaaari/kokoro-82m)
- **Voice combination:** Mix voices to create unique blends [^85^](https://medium.com/prompt-engineering/building-low-cost-text-to-speech-applications-with-kokoro-82m-and-streamlit-64861b52cdc6)
- **Real-time:** Synthesis faster than real-time on modern hardware
- **Runs in browser:** WebGPU/WASM support [^76^](https://kokoroweb.app/en/blog/best-browser-text-to-speech-tools-2025)
- **API cost if hosted:** ~$0.06/hour of audio (Replicate: $0.00088/run) [^83^](https://replicate.com/jaaari/kokoro-82m)

**Installation:**
```bash
pip install kokoro>=0.9.4 soundfile torch
# Install espeak-ng system dependency
```

**Usage:**
```python
from kokoro import KPipeline
pipeline = KPipeline(lang_code='a')  # American English

# Available voices: af_bella, af_sarah, am_adam, am_michael, 
#   bf_emma, bf_isabella, bm_george, bm_lewis, etc.
generator = pipeline(text, voice='af_bella', speed=1)
for i, (gs, ps, audio) in enumerate(generator):
    sf.write(f'output_{i}.wav', audio, 24000)
```

### 7.3 Voice Assignment Strategy

**Create 8 voice "profiles" by combining base voices:**

```python
voice_profiles = {
  'leader':    'af_bella',      # Warm, authoritative female
  'analyst':   'am_adam',       # Clear, neutral male
  'creative':  'bf_isabella',   # Soft British female
  'tech':      'am_michael',    # Deep, technical male
  'social':    'af_sarah',      # Friendly, outgoing female
  'planner':   'bm_george',     # Mature British male
  'worker':    'af_sky',        # Youthful, energetic
  'support':   'bm_lewis',      # Kind, patient male
}
```

**Speed/pitch modifiers per personality:**
- Fast talker: `speed=1.2`
- Slow thinker: `speed=0.8`
- Volume variations via post-processing

### 7.4 ElevenLabs — NOT RECOMMENDED AT SCALE

**Why Not:** At 46 agents, ElevenLabs is prohibitively expensive:
- Pro plan ($99/mo) = 500K characters = ~500 minutes [^70^](https://pxlpeak.com/blog/ai-tools/elevenlabs-pricing-guide)
- 46 agents each speaking ~100 messages/day (~50 chars each) = 230K chars/day = **6.9M chars/month**
- **Estimated cost: ~$1,200+/month** just for TTS [^68^](https://flexprice.io/blog/elevenlabs-pricing-breakdown)

Use ElevenLabs ONLY if you need premium voice cloning for a single "host" character.

### 7.5 Free Alternative: Piper TTS

Piper is another excellent free option: [^46^](https://sourceforge.net/projects/piper-tts.mirror/)
- MIT license
- Optimized for Raspberry Pi (very lightweight)
- 30+ languages
- ONNX models
- Good quality but less natural than Kokoro

### 7.6 Personality System

**Personality Matrix (per agent):**

```javascript
const personality = {
  // Big Five traits (-1 to +1)
  openness: 0.5,          // Curiosity, creativity
  conscientiousness: 0.3, // Organization, diligence
  extraversion: -0.2,     // Sociability, talkativeness
  agreeableness: 0.7,     // Cooperation, kindness
  neuroticism: -0.1,      // Anxiety, emotional stability
  
  // Derived properties
  talkSpeed: 1.0 + (extraversion * 0.3),
  gestureFrequency: 0.5 + (extraversion * 0.5),
  animationEnergy: 0.7 + (openness * 0.3),
  
  // Voice mapping
  voice: voiceProfiles['analyst'],
  speechRate: 1.0,
  
  // Emotional state (dynamic)
  currentEmotion: 'neutral',
  emotionIntensity: 0.5
};
```

**Emotional Expression Mapping:**

| Emotion | Blend Shapes | Animation Modifier | Color Tint |
|---------|-------------|-------------------|------------|
| Happy | smile=1.0, blink=0.5 | Bounce in walk | Warm yellow |
| Sad | sad=1.0, browDown=0.5 | Slow walk, slouch | Blue-gray |
| Angry | angry=1.0, serious=0.8 | Fast, jerky movements | Red tint |
| Surprised | surprised=1.0, aa=0.5 | Freeze then quick move | None |
| Working | neutral, focused | Typing animation | None |
| Talking | aa=0.5 (mouth open) | Gesturing | None |

---

## 8. OpenRouter Fusion Analysis

### 8.1 What is Fusion?

OpenRouter Fusion is a **multi-model compound API** that:
1. Fans out your prompt to multiple models in parallel
2. Collects their individual responses
3. Uses a "judge" model to synthesize the best answer

[^35^](https://www.mindstudio.ai/blog/what-is-openrouter-fusion-multi-model-api) [^40^](https://openrouter.ai/docs/guides/features/server-tools/fusion)

### 8.2 How It Works

```
User Prompt → Fusion Router
    ├── Model A (reasoning) → Response A
    ├── Model B (factual)   → Response B
    ├── Model C (creative)  → Response C
    └── Judge Model → Synthesized Final Response
```

**Two presets:**
- **Quality preset:** 3 expensive models → ~2x cost of single premium model
- **Budget preset:** 3 cheaper models → ~0.5x cost of Claude Fable 5, similar quality [^35^](https://www.mindstudio.ai/blog/what-is-openrouter-fusion-multi-model-api)

### 8.3 Fusion for Our Use Case

**Recommendation:** Use Fusion SPARINGLY, not as default.

**Best Uses:**
- Complex agent planning decisions (the orchestrator agent)
- Disagreement resolution between agents
- Critical code generation (rare)
- Research/analysis tasks

**NOT for:**
- Simple chat (wastes tokens)
- Status updates
- Tool calls with clear schemas
- Real-time responses (adds 5-15s latency)

### 8.4 Fusion Cost Comparison

| Approach | Cost per 1K calls | Quality | Latency |
|----------|-------------------|---------|---------|
| Single Qwen3 235B | ~$2.80 | Good | ~2s |
| Single DeepSeek V4 | ~$10.50 | Better | ~3s |
| Fusion Budget | ~$15.00 | Best-of-3 | ~8s |
| Fusion Quality | ~$45.00 | Frontier | ~15s |

### 8.5 Implementation

```javascript
// Use Fusion for complex decisions only
const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
  method: 'POST',
  headers: { Authorization: `Bearer ${API_KEY}` },
  body: JSON.stringify({
    model: 'openrouter/fusion',
    messages: [{ role: 'user', content: complexTask }],
    plugins: [{ id: 'fusion', quality: 'budget' }]
  })
});
```

---

## 9. Summary & Final Recommendations

### 9.1 Total Monthly Cost Estimate

| Component | Monthly Cost (Balanced) |
|-----------|------------------------|
| LLM APIs (46 agents) | ~$423 |
| Voice (Kokoro TTS, local) | $0 |
| 3D Assets (created once) | $0 (VRoid + Mixamo free) |
| Hosting (infrastructure) | ~$50-100 (Hetzner/DO) |
| **TOTAL** | **~$473-523/month** |

### 9.2 Architecture Summary

```
┌──────────────────────────────────────────────────────────────┐
│                         AGENT TOWN                             │
│                                                                │
│  46 AI Agents                                                  │
│  ├── 1 Orchestrator (Kimi K2.6) ──────── $95/mo              │
│  ├── 5 Specialists (DeepSeek V4) ─────── $198/mo             │
│  ├── 2 Long-Context (MiniMax M3) ─────── $25/mo              │
│  ├── 30 Workers (Qwen3 235B) ─────────── $39/mo              │
│  └── 8 Simple Bots (DeepSeek V3.2/Free) ─ $4/mo              │
│                                                                │
│  46 3D Avatars (VRoid Studio + Mixamo) ─── $0 (one-time)     │
│  Voice (Kokoro TTS, local server) ───────── $0                │
│  Rendering (Three.js + WebGPU) ──────────── Browser           │
│                                                                │
│  TOTAL: ~$523/month                                            │
└──────────────────────────────────────────────────────────────┘
```

### 9.3 Key Citations & Sources

| Source | URL | What |
|--------|-----|------|
| OpenRouter Models | https://openrouter.ai/models | Pricing for all models |
| OpenRouter Fusion | https://openrouter.ai/docs/guides/features/server-tools/fusion | Multi-model API docs |
| DeepSeek V3 GitHub | https://github.com/deepseek-ai/deepseek-v3 | Architecture & license |
| DeepSeek Tool Calls | https://api-docs.deepseek.com/guides/tool_calls | Function calling docs |
| DeepSeek V3.2 Release | https://api-docs.deepseek.com/news/news251201 | Release notes |
| MiniMax M3 on OpenRouter | https://openrouter.ai/minimax/minimax-m3 | Pricing & specs |
| MiniMax M3 Blog | https://www.minimax.io/blog/minimax-m3 | Architecture details |
| Qwen3 235B OpenRouter | https://openrouter.ai/qwen/qwen3-235b-a22b-2507 | Pricing & benchmarks |
| Kokoro TTS GitHub | https://github.com/hexgrad/kokoro | 82M parameter TTS |
| Kokoro HuggingFace | https://huggingface.co/hexgrad/Kokoro-82M | Model card |
| ElevenLabs Pricing | https://elevenlabs.io/pricing | TTS pricing tiers |
| Piper TTS | https://sourceforge.net/projects/piper-tts.mirror/ | Alternative local TTS |
| VRoid Studio | https://vroid.com/en/studio | Free avatar creator |
| @pixiv/three-vrm | https://github.com/pixiv/three-vrm | Three.js VRM loader |
| Mixamo | https://www.mixamo.com/ | Free animation library |
| Mixamo→glTF Guide | https://www.donmccurdy.com/2017/11/06/creating-animated-gltf-characters-with-mixamo-and-blender/ | Workflow tutorial |
| Webaverse | https://github.com/webaverse-studios/webaverse | Open metaverse engine |
| ReadyPlayerMe Alternatives | https://streamoji.com/blog/ready-player-me-alternatives-2026 | Status update |
| Three.js Performance Tips | https://www.utsubo.com/blog/threejs-best-practices-100-tips | 100 optimization tips |
| GPU Skinning Instancing | https://discourse.threejs.org/t/animated-instanced-skinned-meshes-gltf/41958 | Technical discussion |
| OpenRouter Free Models | https://openrouter.ai/collections/free-models | Free tier access |
| Inworld AI Pricing | https://inworld.ai/pricing | Character AI pricing |
| Three.js Instancing | https://tympanus.net/codrops/2025/07/10/three-js-instances-rendering-multiple-objects-simultaneously/ | Instancing tutorial |

---

*Research compiled July 2026. Pricing and model availability change frequently. Verify current rates on OpenRouter before deployment.*
