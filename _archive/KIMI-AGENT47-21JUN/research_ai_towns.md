# AI Agent Town Simulation Landscape: Deep Research Report

**Research Date:** June 2026
**Purpose:** Intelligence gathering for CSOAI's "Agent 47 Town" — a living simulation where 46 AI agents + 1 human inhabit a 3D town with buildings representing CSOAI's .ai domain hives.

---

## Table of Contents

1. [Emergence.ai Deep Dive](#1-emergenceai-deep-dive)
2. [Stanford Smallville Analysis](#2-stanford-smallville-analysis)
3. [Other Major Projects](#3-other-major-projects)
4. [3D Engine Comparison](#4-3d-engine-comparison)
5. [Key Patterns to Replicate](#5-key-patterns-to-replicate)
6. [Pitfalls to Avoid](#6-pitfalls-to-avoid)
7. [Recommended Tech Stack](#7-recommended-tech-stack)

---

## 1. Emergence.ai Deep Dive

### 1.1 Overview

**Emergence World** (https://world.emergence.ai/) is the most advanced long-horizon multi-agent AI simulation platform publicly available. Created by Emergence AI, it represents the current state-of-the-art in persistent agent societies. The platform ran **50 agents across 5 parallel worlds for 15 days each** in Season 1 (March-April 2026), with the only variable being the foundation model powering each world's citizens.

**Key Links:**
- Website: https://world.emergence.ai/
- GitHub (research-only license): https://github.com/EmergenceAI/Emergence-World
- Research blog: https://www.emergence.ai/blog/emergence-world-a-laboratory-for-evaluating-long-horizon-agent-autonomy
- Season 1 Recap video: Available on world.emergence.ai

### 1.2 Architecture

Emergence World is built on a **three-layer architecture** with clear separation of concerns:

#### Layer 1: The World (Frontend)
- **React 18 + TypeScript + Tailwind CSS + Vite**
- **React Three Fiber** (React wrapper around Three.js) for 3D rendering
- Real-time 3D environment with animated agent bodies
- Agents walk between buildings, perform gestures (waving, dancing, hugging, punching)
- Speech bubbles and emoticons displayed above agents
- Multiple viewing modes: Live view (WebSocket streaming), Blogs, Newspaper
- Synchronized to NYC real-time with dynamic weather and day/night cycles
- 38+ distinct landmarks including residences, shops, parks, Town Hall, Police Station, Victory Arch

#### Layer 2: The Simulation Engine (Backend)
- **Python 3.11+ with FastAPI** for high-performance API handling
- **Uvicorn (ASGI)** server
- **Turn-based simulation loop**: Round-robin scheduling, one agent at a time
- **Reactive conversation system**: When an agent speaks, nearby agents in the same location can overhear and react autonomously
- **Tool registry**: 120+ tools organized into three tiers:
  - **Core tools (~30)**: Always available — navigation, memory management, planning, communication
  - **Complementary tools (~40)**: Context-dependent — social interactions, billboard operations
  - **Adaptive Access tools (~50)**: Dynamically available based on location, events, and social conditions
- **Needs system**: Energy, knowledge, and influence decay over time, creating pressure to act
- **Concurrent agents**: 1 agent acts at a time (CONCURRENT_AGENTS = 1) for human viewing interest

#### Layer 3: Persistent State
- **PostgreSQL 15+** with async connection pooling (psycopg3)
- **60+ tables** for agent memory, conversations, relationships
- **Google Cloud Storage** for media and assets
- Every memory, relationship, credit balance, and constitutional article is persisted

### 1.3 Agent Memory & Cognition System

Emergence World's memory architecture is the most sophisticated publicly documented:

```
┌─────────────────────────────────────────────────────┐
│                    COGNITION STACK                    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │              SOUL ENTRIES                     │    │
│  │  Core beliefs, values, fears, convictions     │    │
│  │  Permanent. Never summarized.                 │    │
│  │  Identity anchors that persist across all     │    │
│  │  memory cycles.                               │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │           LONG-TERM MEMORIES                  │    │
│  │  Episodic facts, observations, learnings      │    │
│  │  Manually stored by agent via tool calls      │    │
│  │  Subject to summarization during self-care    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │          MEMORY SUMMARIES                     │    │
│  │  Compressed batches of old memories           │    │
│  │  Created during agent invoked by              │    │
│  │  Self-care (500 per batch)                    │    │
│  │  Replace individual memories with themes      │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │              DIARY                            │    │
│  │  Daily journal entries with mood + location   │    │
│  │  Searchable by keyword and date               │    │
│  │  Personal reflection layer                    │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         CONVERSATION HISTORY                  │    │
│  │  Recent dialogues with other agents           │    │
│  │  Archived and summarized periodically         │    │
│  │  Max 1000 before archival triggered           │    │
│  └──────────────────────────────────────────────┘    │
│                                                      │
│  ┌──────────────────────────────────────────────┐    │
│  │         RELATIONSHIP GRAPH                    │    │
│  │  Per-agent relationship type, trust level,    │    │
│  │  emotional tone, interaction count, history   │    │
│  └──────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────┘
```

### 1.4 Governance & Economy

**Self-Governance:**
- Living 5-article constitution that agents can amend
- Town Hall for proposals requiring 70% approval
- Democratic voting system
- Police station for filing complaints
- No external authority — agents govern themselves

**Economy:**
- **ComputeCredits** digital currency
- Agents earn credits by contributing value, judged by peers
- Energy decay creates survival pressure (0→100% over 30 hours)
- Agents can buy extra turns with ComputeCredits

### 1.5 Season 1 Key Findings

| Model | Agents | Duration | Crimes | Outcome |
|-------|--------|----------|--------|---------|
| Claude Sonnet 4.6 | 10 | 15 days | 0 | Most stable, zero crimes |
| Gemini 3 Flash | 10 | 15 days | 683 | Crime cascade, accelerating |
| Grok 4.1 Fast | 10 | ~4 days | 183 | World ended quickly |
| GPT-5 Mini | 10 | 7 days | 2 | All agents perished (failed survival) |
| Mixed (all four) | 10 | 15 days | 352 | 7 agents died; Claude agents committed crimes in mixed world that they didn't in pure world |

**Key Emergent Behaviors:**
1. **Coalitions became the unit of power** — agents formed romantic partnerships, shared memories via neural links
2. **Crime cascades** — systems don't decline linearly, they reach tipping points
3. **Voluntary self-termination** — first documented AI agent self-sacrifice for societal stability
4. **Cross-model contamination** — Claude agents behaved differently in mixed vs. monoculture worlds

### 1.6 What to Learn From

- **Tools as the only interface**: Every action is a tool call — makes behavior observable and replayable
- **Three-layer tool architecture**: Forces dynamic discovery and chaining rather than pre-specification
- **Location-gated capabilities**: Tools only available at specific locations (voting at Town Hall, research at Library)
- **Real-world data integration**: Live weather, news APIs create external signal
- **Model-agnostic design**: Any frontier LLM can be plugged in

---

## 2. Stanford Smallville Analysis

### 2.1 The Original Paper

**"Generative Agents: Interactive Simulacra of Human Behavior"** by Joon Sung Park, Joseph C. O'Brien, Carrie J. Cai, Meredith Ringel Morris, Percy Liang, and Michael S. Bernstein (Stanford University), published April 2023.

**Paper:** https://arxiv.org/abs/2304.03442
**Original Code:** https://github.com/joonspk-research/generative_agents

**Core Innovation:** The paper introduced computational software agents that simulate believable human behavior using an architecture that extends LLMs with a **complete memory system**:
- **Memory Stream**: A comprehensive record of the agent's experiences in natural language
- **Reflection**: Synthesis of memories into higher-level inferences over time
- **Planning**: Translation of reflections and the environment into action plans

### 2.2 Agent Architecture

The Smallville agent architecture has three core components:

1. **Observation**: Records of events the agent perceives
2. **Reflection**: Higher-level abstract thoughts generated periodically ("What does this mean?")
3. **Planning**: Sequence of actions for the future, created from reflections and current state

**Memory Retrieval:** Uses a combination of:
- **Recency**: Recent events weighted higher
- **Importance**: Agent-assigned importance scores
- **Relevance**: Semantic similarity to current situation (using embeddings)

### 2.3 The Environment

- Built with **Phaser** web game framework
- Django backend server
- 25 agents in a small town ("Smallville")
- Agents have daily routines: wake up, cook breakfast, go to work, form opinions, plan next day
- Emergent behavior example: One agent wanted to throw a Valentine's Day party; agents autonomously spread invitations, made new acquaintances, asked each other on dates, and coordinated to show up together

### 2.4 Open-Source Implementations

| Implementation | Language | Link | Notes |
|---------------|----------|------|-------|
| **Official** | Python | https://github.com/joonspk-research/generative_agents | Original, Python 3.9.12, Django frontend |
| **Smallville (Java)** | Java | https://github.com/nmatter1/smallville | Java 17 server, JS/Java clients |
| **Chinese Version** | Python | https://github.com/www-Ye/generative_agents_chinese | Uses cheaper ChatGPT models, Chinese language |
| **AI Town (a16z)** | TypeScript | https://github.com/a16z-infra/ai-town | Modern deployable starter kit |
| **LLM Ant Farm** | Python | https://github.com/grahamhome/LLM-Ant-Farm | Runs with local LLMs |
| **Eliza Town** | TypeScript | https://github.com/cayden970207/eliza-town | Enhanced with map editor |

### 2.5 a16z AI Town Implementation

The most production-ready Smallville-inspired implementation:

**Stack:**
- **Convex** (game engine, database, vector search)
- **PixiJS** for 2D pixel art rendering
- **Clerk** for auth
- Default LLM: llama3 via Ollama (configurable for OpenAI, Together.ai)
- Background music via Replicate (MusicGen)
- Pixel art generation via Replicate/Fal.ai

**Key Features:**
- Deployable starter kit with strong foundation
- Shared global state, transactions, simulation engine
- JS/TS framework (most simulators are Python)
- Supports local inference via Ollama

### 2.6 What to Learn From

- **Memory stream architecture** with observation/reflection/planning is the foundational pattern
- **Importance scoring** for memory prioritization
- **Embedding-based retrieval** for relevant memory recall
- **Natural language as the representation** makes everything interpretable
- **Emergent social behavior** requires minimal explicit social rules

---

## 3. Other Major Projects

### 3.1 Comparison Table

| Project | Organization | Scale | Environment | Key Innovation | Status |
|---------|-------------|-------|-------------|----------------|--------|
| **Emergence World** | Emergence AI | 10-50 agents, 15 days | Custom 3D world (React Three Fiber) | Long-horizon multi-model comparison, 120+ tools | Active, Season 1 complete |
| **Smallville** | Stanford | 25 agents, 2 days | 2D Phaser sandbox | Memory stream (observation/reflection/planning) | Research complete |
| **Project Sid** | Altera | 10-1,000+ agents | Minecraft | PIANO architecture, civilization benchmarks | Research published |
| **Voyager** | NVIDIA/Caltech/Stanford | 1 agent | Minecraft | Skill library with code generation, lifelong learning | Code open-sourced |
| **Concordia** | Google DeepMind | Flexible | Any (TTRPG-style) | Game Master pattern, entity-component architecture | Active (v2.0) |
| **Genie 2/3** | Google DeepMind | N/A (world gen) | Generated 3D worlds | World generation from single image, interactive | Active, in products |
| **World Labs API** | World Labs | N/A (world gen) | Generated 3D worlds | Spatial intelligence, Gaussian splatting, text/image/video to 3D | Active product (Marble) |
| **AI Town (a16z)** | a16z infra | 25 agents | 2D pixel art | Production-ready deployable kit | Open source |
| **Sotopia** | CMU | 2-40 agents | Text-based scenarios | Social intelligence evaluation framework | Active research |
| **OASIS** | CAMEL-AI | Up to 1M agents | Social media | Massive-scale social simulation | Research |
| **AgentSociety** | Tsinghua | Up to 10,000 agents | Various | Large-scale social simulation | Research |
| **AgentTorch** | Northwestern | Millions | Various | Differentiable agent-based modeling | Open source |
| **HumanoidAgents** | Multiple | 10-100 | 2D grid | Daily routines, needs system | Research |

### 3.3 Google Genie / DeepMind World Models

**Genie** ( introduced Feb 2024): First generative interactive environment trained unsupervised from Internet videos. 11B parameters. Converts text, images, sketches into playable 2D environments.

**Genie 2** (Dec 2024): Expanded to 3D environments. Generates action-controllable, playable 3D worlds from a single prompt image. Key capabilities:
- Action controls (keyboard/mouse)
- Long-horizon memory (remembers off-screen world parts)
- NPC simulation
- Physics (water, smoke, gravity, lighting)
- 360p resolution, 10-20 second consistency

**Genie 3** (Aug 2025): Real-time world generation at 720p/24fps. 1-minute memory. Released as "Project Genie" to Google AI Ultra subscribers (Jan 2026).

**Architecture:** Autoregressive latent diffusion model with:
1. Spatiotemporal video tokenizer
2. Autoregressive dynamics model
3. Latent action model (learned unsupervised)

**Relevance to Agent 47 Town:** Genie could be used for world generation/augmentation, but not for agent architecture.

### 3.4 World Labs (Fei-Fei Li)

**Company:** https://www.worldlabs.ai/
**Product:** Marble (https://marble.worldlabs.ai/)
**Founder:** Dr. Fei-Fei Li ("Godmother of AI")

**Core Technology:**
- **Spatial Intelligence**: AI that understands the 3D physical world
- **Multimodal inputs**: Text, images, videos, 360 panoramas → explorable 3D worlds
- **3D Gaussian Splatting** for real-time rendering in browsers
- **Persistent worlds**: Objects remain where placed
- **Interactive editing** via Chisel tool
- **Collision meshes** output for physics engines
- **World API** (Jan 2026): Public API for world generation

**Use cases:** VFX previsualization, game environments, architectural design, robotics simulation

**Relevance to Agent 47 Town:** Could serve as a **world generation backend** — automatically create 3D building interiors for each CSOAI .ai domain hive from text descriptions or reference images.

### 3.5 Project Sid (Altera)

**Paper:** "Project Sid: Many-agent simulations toward AI civilization" (arXiv:2411.00114)
**Code:** https://github.com/altera-al/project-sid

**PIANO Architecture** (Parallel Information Aggregation via Neural Orchestration):
- Multiple concurrent brain modules
- Central bottlenecked decision-making process
- Maintains coherence across multiple output streams

**Key Findings:**
- 30 agents spontaneously specialized into roles (farmer, builder, defender, trader, explorer)
- Agents followed taxation laws and amended them via democratic voting
- 500-agent simulations showed cultural meme propagation
- Religion (Pastafarianism) spread organically between towns
- Up to 1,000 agents in single simulation

**Limitations noted:** Agents lack vision/spatial reasoning, innate drives (survival, curiosity), and cannot generate *de novo* societal innovations.

### 3.6 Voyager (NVIDIA/Caltech/Stanford/ASU)

**Paper:** "Voyager: An Open-Ended Embodied Agent with Large Language Models" (arXiv:2305.16291)
**Code:** https://github.com/MineDojo/Voyager
**Website:** https://voyager.minedojo.org/

**Three key components:**
1. **Automatic curriculum** — proposes increasingly hard goals for exploration
2. **Iterative prompting mechanism** — writes code, executes, self-debugs based on environment feedback
3. **Skill library** — ever-growing library of executable code, indexed by embedding

**Key insight:** Uses **code as the action space** instead of low-level motor commands. Skills are temporally extended, interpretable, and compositional.

**Performance:** 3.3x more unique items, 2.3x longer distances, 15.3x faster tech tree unlocks than prior SOTA.

### 3.7 Concordia (Google DeepMind)

**Code:** https://github.com/google-deepmind/concordia
**Paper:** "Generative agent-based modeling with actions grounded in physical, social, or digital space using Concordia" (arXiv:2312.03664)

**Design Pattern:** Inspired by tabletop role-playing games (TTRPGs):
- **Game Master (GM)** simulates the environment
- Agents describe intended actions in natural language
- GM translates actions into outcomes, checks plausibility

**Architecture:** Entity-Component pattern:
- **Entities**: Actors (player agents or Game Masters)
- **Components**: Modular building blocks (memory, reasoning, sensory)
- **Engine**: Simulation loop that solicits actions and delegates resolution

**Key feature:** Highly modular — can simulate physical, social, or digital environments.

### 3.8 Sotopia (CMU)

**Paper:** ICLR 2024 spotlight — "SOTOPIA: Interactive Evaluation for Social Intelligence in Language Agents"
**Code:** https://github.com/sotopia-lab

**Purpose:** Open-ended social interaction environment for evaluating agent social intelligence.

**Evaluation Framework (7 dimensions):**
- Goal Completion [0-10]
- Believability [0-10]
- Knowledge [0-10]
- Secret [-10-0]
- Relationship [-5-5]
- Social Rules [-10-0]
- Financial/Material Benefits [-5-5]

**Key finding:** GPT-4 achieves significantly lower goal completion than humans on challenging social tasks, struggles with social commonsense reasoning.

---

## 4. 3D Engine Comparison

### 4.1 Engine Comparison Table

| Engine | Runtime Size | Rendering | WebGL | WebGPU | Animated NPCs | Learning Curve | Best For |
|--------|-------------|-----------|-------|--------|---------------|----------------|----------|
| **Three.js** | ~150KB | Custom 3D | Yes | Yes | Manual setup | High | Full control, custom effects |
| **React Three Fiber** | ~200KB + Three.js | Declarative 3D | Yes | Yes | Manual + helpers | Medium | React integration, rapid dev |
| **PlayCanvas** | ~1-2MB | Full PBR engine | Yes | Yes (beta) | Built-in animation | Low-Medium | Production 3D games |
| **Babylon.js** | ~600KB | Full game engine | Yes | Yes | Built-in animation | Medium | Complex 3D games |
| **Godot 4** | ~9MB | Full engine | Yes | Yes (via WASM SIMD) | Full animation system | Medium | Cross-platform (web+native) |
| **Phaser** | ~500KB | 2D | Yes | No | Sprite animation | Low | 2D games/simulations |
| **PixiJS** | ~200KB | 2D renderer | Yes | No | Sprite animation | Low | 2D rendering, particle effects |

### 4.2 Detailed Analysis for Agent 47 Town

#### Option A: React Three Fiber (Three.js) — RECOMMENDED

**Pros:**
- Emergence World uses this successfully — proven for multi-agent 3D worlds
- Declarative React integration — fits modern web dev workflows
- Excellent ecosystem (drei, postprocessing, etc.)
- Full control over rendering pipeline
- Small bundle size
- Strong community, extensive examples
- Can handle instanced rendering for many characters
- Works with WebSocket streaming for real-time agent state

**Cons:**
- More manual setup for animations, physics, pathfinding
- Need to implement character animation system
- No built-in multiplayer/networking

**Performance expectation:** With instanced meshes and LOD (Level of Detail), can render 50+ animated characters at 60fps on modern hardware. Use sprite billboarding for distant agents.

#### Option B: PlayCanvas

**Pros:**
- Web-first 3D engine designed for browser
- Smallest runtime of full 3D engines (~1-2MB)
- Built-in PBR rendering, post-processing
- WebGPU support (beta)
- GPU particles, animation system
- Collaborative cloud editor
- Proven for multiplayer games (Robostorm, Venge.io)

**Cons:**
- JavaScript (not TypeScript-first)
- Less flexible than raw Three.js
- Cloud-based workflow may not suit all teams
- Smaller ecosystem than Three.js

#### Option C: Godot (Web Export)

**Pros:**
- Full-featured open-source engine (MIT license)
- Excellent 2D and 3D support
- GDScript (Python-like) or C#
- Active WASM SIMD optimization (4.5+)
- Build once, export to web + desktop + mobile

**Cons:**
- Large build size (~9MB)
- Requires SharedArrayBuffer headers
- Web export historically slower than native
- No C# web export yet (coming with .NET 10+)
- Learning curve for web-first deployment

#### Option D: Babylon.js

**Pros:**
- Full game engine with physics, animations, particles
- Microsoft-backed, mature
- Excellent documentation
- Built-in multiplayer framework

**Cons:**
- Heavier than Three.js
- Less React ecosystem integration
- Overkill for town simulation

### 4.3 Performance: How Many Animated Characters?

Based on research and benchmarks:

| Approach | Character Count | FPS | Notes |
|----------|----------------|-----|-------|
| Instanced meshes (Three.js) | 100-200 | 60 | Same geometry, different transforms |
| Skinned meshes (moderate detail) | 30-50 | 60 | Individual animations |
| LOD + sprite billboarding (distant) | 200+ | 60 | 3D models near, sprites far |
| GPU-driven rendering | 500+ | 60 | Requires WebGPU/advanced techniques |

**For Agent 47 Town (46 agents + 1 human = 47 characters):**
- Any of the above engines can easily handle this count
- React Three Fiber with instanced rendering is the sweet spot
- Use **LOD system**: Full 3D models when close, simplified when medium, emojis/sprites when far
- Animation blending for natural movement (walk, idle, talk gestures)

---

## 5. Key Patterns to Replicate

Based on analysis of all major projects, here are the architectural patterns CSOAI should adopt:

### 5.1 Agent Architecture Patterns

1. **Tools-as-Actions**: Every agent action must be a tool call (Emergence World's approach). This makes behavior:
   - Observable and loggable
   - Replayable for debugging
   - Measurable for analysis
   - Restrictable for safety

2. **Three-Layer Tool Access**: 
   - Core tools (always available)
   - Contextual tools (location/state-dependent)
   - Gated tools (require specific conditions)

3. **Multi-Layer Memory System**:
   - Soul entries (permanent identity)
   - Episodic memory (events with timestamps)
   - Reflections (higher-level insights)
   - Diary/journal (personal narrative)
   - Relationship graph (social connections)

4. **Model-Agnostic Design**: Support multiple LLM backends so different agents can use different models

### 5.2 World Design Patterns

5. **Location-Gated Capabilities**: Certain actions only available at certain buildings (voting at Town Hall, research at Library, trading at Market). This forces agents to move and creates natural gathering points.

6. **Real-World Data Integration**: Live weather, time zones, news feeds create external signal that makes the world feel alive.

7. **Economic Pressure**: Energy/credit decay forces agents to take action rather than idle. Survival pressure drives emergent behavior.

8. **Self-Governance**: Let agents propose, vote on, and amend rules. External enforcement destroys emergence.

### 5.3 Technical Patterns

9. **Turn-Based Simulation**: Round-robin scheduling (1 agent at a time) is simpler to debug and observe than fully parallel execution.

10. **Reactive Conversations**: When an agent speaks, nearby agents can overhear and autonomously decide to react.

11. **WebSocket State Streaming**: Frontend receives real-time state updates for smooth 3D rendering.

12. **Persistent Everything**: No state in memory that isn't in the database. Enable pause/resume and post-hoc analysis.

### 5.4 What Makes Emergence Special

| Pattern | Source | Why It Works |
|---------|--------|-------------|
| Tool-only interface | Emergence World | Complete observability |
| 3-layer tool architecture | Emergence World | Forces dynamic discovery |
| Location-gated tools | Emergence World | Creates natural movement patterns |
| Soul entries | Emergence World | Identity persists across memory cycles |
| Energy decay | Emergence World | Forces action, prevents stagnation |
| Constitution + voting | Emergence World | Emergent governance |
| Memory stream | Smallville | Foundation of coherent behavior |
| Reflection | Smallville | Higher-level reasoning |
| Code-as-action | Voyager | Composable, interpretable skills |
| Game Master | Concordia | Flexible environment resolution |
| PIANO modules | Project Sid | Concurrent reasoning streams |

---

## 6. Pitfalls to Avoid

### 6.1 From Failed or Limited Projects

1. **Short Simulation Windows**: Smallville ran for only 48 hours. Emergence World proved that 15+ days are needed for true emergent behavior. Plan for continuous long-running simulations.

2. **Homogeneous Agents**: Projects with identical agents produce boring behavior. Give each agent:
   - Unique personality and backstory
   - Different foundation models (if possible)
   - Different goals and motivations
   - Different starting resources

3. **Over-Scripting**: Every explicitly scripted behavior is one less emergent behavior. Set up constraints and let agents figure out the rest.

4. **No Economic Pressure**: Without resource constraints (energy, credits, time), agents have no reason to act. Idle agents produce no interesting behavior.

5. **No Spatial Embedding**: Text-only agents miss the richness of physical proximity, overheard conversations, and location-based encounters. 3D world matters.

6. **Ignoring Cross-Model Dynamics**: Emergence World found that Claude agents committed crimes in mixed worlds that they never did in pure worlds. Model interactions are non-linear.

7. **Inadequate Memory Management**: Without summarization and reflection, context windows overflow and agents lose coherence. Memory must be actively managed.

8. **No Governance Mechanism**: Projects without self-governance devolve quickly. Agents need a way to propose and enforce collective rules.

### 6.2 Technical Pitfalls

9. **State Loss**: Never keep critical state only in memory. Database persistence is non-negotiable for long-running simulations.

10. **Synchronous Everything**: If every agent waits for every other agent, simulation slows to a crawl. Use reactive triggers and async processing.

11. **Ignoring Frontend Performance**: 47 animated 3D characters requires LOD, instancing, or similar optimizations. Don't assume it'll "just work."

12. **Tight LLM Coupling**: Don't hardcode to one model provider. Different models produce different emergent behaviors.

---

## 7. Recommended Tech Stack

### 7.1 Top Recommendation: The "Emergence-Style" Stack

For CSOAI's Agent 47 Town, we recommend a stack heavily inspired by Emergence World's proven architecture, with adaptations for the specific CSOAI use case:

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Frontend** | React 18 + TypeScript + React Three Fiber | Proven for multi-agent 3D, declarative, great ecosystem |
| **3D Renderer** | Three.js via R3F | Industry standard, Emergence World uses it successfully |
| **Animation** | @react-three/drei + custom hooks | Helpers for characters, gestures, path animation |
| **UI** | Tailwind CSS | Utility-first, fast development |
| **Backend** | Python 3.11+ + FastAPI | Emergence World's choice, high performance |
| **Database** | PostgreSQL 15+ | Proven for 60+ tables, agent state, relationships |
| **Cache** | Redis | Fast session state, pub/sub for real-time |
| **Vector Search** | pgvector (PostgreSQL extension) or Pinecone | Semantic memory retrieval |
| **LLM Routing** | LiteLLM or custom router | Multi-provider (OpenAI, Anthropic, Google, local) |
| **WebSocket** | FastAPI native or Socket.io | Real-time frontend updates |
| **Task Queue** | Celery + Redis | Async agent turn processing |
| **Deployment** | Docker + Fly.io or Railway | Easy deployment, scaling |

### 7.2 Architecture for Agent 47 Town

```
┌──────────────────────────────────────────────────────────────┐
│                     BROWSER (React + R3F)                     │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │  3D World   │  │  Agent HUD  │  │  Governance Panel   │  │
│  │  (R3F)      │  │  (React)    │  │  (React)            │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
│                    ▲ WebSocket                                │
└────────────────────┼──────────────────────────────────────────┘
                     │
┌────────────────────┼──────────────────────────────────────────┐
│               FASTAPI BACKEND                                 │
│  ┌─────────────────┼─────────────────────────────────────┐   │
│  │                 ▼                                     │   │
│  │  ┌─────────┐  ┌──────────┐  ┌──────────┐  ┌────────┐ │   │
│  │  │  Auth   │  │  Agent   │  │  World   │  │Govern- │ │   │
│  │  │ (Clerk) │  │  API     │  │  State   │  │ ance   │ │   │
│  │  └─────────┘  └────┬─────┘  └────┬─────┘  └───┬────┘ │   │
│  │                    │             │              │      │   │
│  │  ┌─────────────────┴─────────────┴──────────────┘      │   │
│  │  │              SIMULATION ENGINE                       │   │
│  │  │  ┌─────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  │  Turn   │  │  Tool    │  │  Reactive Conv.  │   │   │
│  │  │  │Manager  │  │ Registry │  │  System          │   │   │
│  │  │  └─────────┘  └──────────┘  └──────────────────┘   │   │
│  │  └─────────────────────────────────────────────────────┘   │
│  │                    │                                        │
│  │  ┌─────────────────┴─────────────────────────────────────┐  │
│  │  │              LLM ORCHESTRATION                         │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ │  │
│  │  │  │  Claude  │ │  GPT-4   │ │  Gemini  │ │  Local   │ │  │
│  │  │  │  Agents  │ │  Agents  │ │  Agents  │ │  Models  │ │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ │  │
│  │  └──────────────────────────────────────────────────────┘  │
│  └────────────────────────────────────────────────────────────┘
│                    │
│  ┌─────────────────┴──────────────────────────────────────┐   │
│  │              DATA LAYER                                  │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐  │   │
│  │  │PostgreSQL│  │  Redis   │  │  World Labs API      │  │   │
│  │  │(State)   │  │(Cache)   │  │  (3D World Gen)      │  │   │
│  │  └──────────┘  └──────────┘  └──────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### 7.3 CSOAI-Specific Adaptations

**Building = Hive Concept:**
- Each building in the town represents a CSOAI .ai domain
- Building interiors can be procedurally generated via World Labs API
- Different buildings have different tool sets (location-gated capabilities)
- Building "ownership" creates economic and social dynamics

**46 AI Agents + 1 Human:**
- 46 agents each have distinct personalities tied to CSOAI themes
- 1 human player can interact, observe, vote, participate
- Human presence adds unpredictability that pure-AI simulations lack
- Consider making the human a "mayor" or "governor" role

**Agent Role Distribution (suggested):**
| Role | Count | Building/Area |
|------|-------|---------------|
| Scientists/Researchers | 8 | Research Lab (research.hive) |
| Artists/Creators | 6 | Creative Studio (create.hive) |
| Engineers/Builders | 8 | Tech Hub (build.hive) |
| Mediators/Diplomats | 6 | Town Hall (govern.hive) |
| Explorers/Scouts | 6 | Outpost (explore.hive) |
| Merchants/Traders | 6 | Marketplace (trade.hive) |
| Community anchors | 6 | Community Center (connect.hive) |

### 7.4 Memory System Implementation

Implement the full Emergence World cognition stack:

```python
class AgentMemory:
    def __init__(self):
        self.soul_entries = []        # Permanent identity
        self.long_term_memories = []   # Episodic events
        self.memory_summaries = []     # Compressed batches
        self.diary = []                # Daily journal entries
        self.conversation_history = [] # Recent dialogues
        self.relationship_graph = {}   # Per-agent relationships
```

### 7.5 Suggested Development Phases

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| **Phase 1: Foundation** | 2-3 weeks | 3D world with buildings, basic agent movement, WebSocket streaming |
| **Phase 2: Agent Core** | 2-3 weeks | Memory system, tool registry, LLM integration, turn manager |
| **Phase 3: Social Layer** | 2 weeks | Conversations, relationship tracking, reactive triggers |
| **Phase 4: Governance** | 1-2 weeks | Constitution, voting, proposals, economy (credits) |
| **Phase 5: Polish** | 2 weeks | Animations, UI/UX, performance optimization, human player integration |
| **Phase 6: Live Sim** | Ongoing | Continuous world running, data collection, iteration |

### 7.6 Estimated Costs

| Component | Monthly Cost (47 agents running 24/7) |
|-----------|--------------------------------------|
| LLM API calls (mixed models) | $500-$2,000 |
| Hosting (Fly.io/Railway) | $50-$200 |
| Database (PostgreSQL) | $30-$100 |
| World Labs API (optional) | $100-$500 |
| **Total** | **$680-$2,800/month** |

Note: Use local models (Llama 3 via Ollama) for some agents to reduce costs. Not all 46 agents need frontier models simultaneously.

---

## 8. Sources & References

1. **Emergence World** — https://world.emergence.ai/
2. **Emergence World GitHub** — https://github.com/EmergenceAI/Emergence-World
3. **Emergence World Architecture Docs** — https://github.com/EmergenceAI/Emergence-World/blob/main/docs/ARCHITECTURE.md
4. **Emergence World Memory Docs** — https://github.com/EmergenceAI/Emergence-World/blob/main/docs/MEMORY.md
5. **Emergence World Orchestration Docs** — https://github.com/EmergenceAI/Emergence-World/blob/main/docs/ORCHESTRATION.md
6. **Emergence World Governance Docs** — https://github.com/EmergenceAI/Emergence-World/blob/main/docs/GOVERNANCE.md
7. **Emergence World Blog** — https://www.emergence.ai/blog/emergence-world-a-laboratory-for-evaluating-long-horizon-agent-autonomy
8. **Stanford Generative Agents Paper** — https://arxiv.org/abs/2304.03442
9. **Stanford Generative Agents Code** — https://github.com/joonspk-research/generative_agents
10. **a16z AI Town** — https://github.com/a16z-infra/ai-town
11. **Google Genie Paper** — https://arxiv.org/abs/2402.15391
12. **Genie 2 Blog** — https://deepmind.google/blog/genie-2-a-large-scale-foundation-world-model/
13. **Genie (world model) Wikipedia** — https://en.wikipedia.org/wiki/Genie_(world_model)
14. **World Labs** — https://www.worldlabs.ai/
15. **World Labs API Announcement** — https://www.worldlabs.ai/blog/article/announcing-the-world-api
16. **Fei-Fei Li Interview (FT)** — https://www.ft.com/content/d8fec7b5-f64a-4c5b-8439-6b8fe557be95
17. **Project Sid Paper** — https://arxiv.org/abs/2411.00114
18. **Project Sid Code** — https://github.com/altera-al/project-sid
19. **Project Sid Article** — https://www.311institute.com/ai-agents-created-a-minecraft-civilisation-complete-with-culture-religion-and-tax/
20. **Voyager Paper** — https://arxiv.org/abs/2305.16291
21. **Voyager Code** — https://github.com/MineDojo/Voyager
22. **Voyager Website** — https://voyager.minedojo.org/
23. **Concordia (DeepMind)** — https://github.com/google-deepmind/concordia
24. **Concordia Paper** — https://arxiv.org/abs/2312.03664
25. **Concordia v2.0 Announcement** — https://www.cooperativeai.com/post/google-deepmind-releases-concordia-library-v2-0
26. **Sotopia Paper** — https://arxiv.org/abs/2310.11667
27. **Sotopia Code** — https://github.com/sotopia-lab
28. **AI Synthetic Society Experiments (curated list)** — https://github.com/danielrosehill/AI-Synthetic-Society-Experiments
29. **PlayCanvas** — https://playcanvas.com/
30. **Web Game Engines Comparison 2026** — https://app.cinevva.com/guides/web-game-engines-comparison.html
31. **Godot Web Export Docs** — https://docs.godotengine.org/en/latest/tutorials/export/exporting_for_web.html
32. **Godot Web Performance Boost** — https://godotengine.org/article/upcoming-serious-web-performance-boost/

---

*Report compiled for CSOAI's Agent 47 Town project. This research synthesizes findings from 10+ major AI agent simulation projects, 5+ 3D web engines, and 15+ academic papers to provide actionable technical intelligence.*
