# AI Town Projects & Reverse-Engineerable Architectures -- Deep Research Report

**Prepared for**: CSOAI.org -- 47-Agent Sovereign AI Town Simulation in Unreal Engine 5.8
**Date**: July 2025
**Research scope**: 15 independent search queries, 50+ sources analyzed

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Stanford Smallville (Generative Agents)](#2-stanford-smallville-generative-agents)
3. [AI Town by a16z](#3-ai-town-by-a16z)
4. [Emergence World (emergence.ai)](#4-emergence-world-emergenceai)
5. [OASIS -- Open Agent Social Interaction Simulations](#5-oasis-open-agent-social-interaction-simulations)
6. [AgentSociety (Tsinghua)](#6-agentsociety-tsinghua)
7. [CitySim -- Urban Behavior Simulation](#7-citysim-urban-behavior-simulation)
8. [GenSim -- General Social Simulation Platform](#8-gensim-general-social-simulation-platform)
9. [Light Society -- One Billion Agents](#9-light-society-one-billion-agents)
10. [CAMEL-AI Framework](#10-camel-ai-framework)
11. [Meta AI Habitat](#11-meta-ai-habitat)
12. [Google DeepMind AndroidEnv](#12-google-deepmind-androidenv)
13. [Microsoft AutoGen / Agent Framework](#13-microsoft-autogen--agent-framework)
14. [Agent-Based Modeling Platforms](#14-agent-based-modeling-platforms)
15. [Other Notable Projects](#15-other-notable-projects)
16. [Research Paper Landscape 2024-2026](#16-research-paper-landscape-2024-2026)
17. [Architecture Comparison Matrix](#17-architecture-comparison-matrix)
18. [Recommendations for CSOAI 47-Agent Architecture](#18-recommendations-for-csoai-47-agent-architecture)

---

## 1. Executive Summary

This report surveys the landscape of AI town simulations, multi-agent social worlds, and open-source architectures relevant to CSOAI.org's planned 47-agent sovereign AI town in Unreal Engine 5.8. We analyzed 15+ major projects across academia and industry, identifying key architectural patterns, memory systems, planning frameworks, and social interaction models.

### Key Findings

| # | Finding | Impact |
|---|---------|--------|
| 1 | **Stanford Smallville** remains the foundational reference architecture with memory stream + reflection + planning | High -- direct reverse-engineerable |
| 2 | **a16z AI Town** is the most production-ready open-source implementation (MIT license, TypeScript/Convex) | Critical -- can be forked and extended |
| 3 | **Emergence World** represents the most advanced commercial implementation with 120+ tool architecture | High -- architecture patterns extractable |
| 4 | **OASIS** scales to 1M agents for social media simulation | Medium -- scalability patterns useful |
| 5 | **AgentSociety** provides city-scale urban simulation with sociological theory foundations | High -- urban dynamics model applicable |
| 6 | **CitySim** introduces recursive value-driven planning with belief/needs modules | High -- planning architecture directly applicable |
| 7 | **Light Society** demonstrates billion-agent simulation (ICML 2025) | Medium -- event queue architecture useful |
| 8 | **Habitat 3.0** (Meta) is the premier embodied AI 3D simulator but no longer officially maintained | Medium -- 3D simulation patterns |
| 9 | Most projects converge on: **memory stream + LLM reasoning + vector retrieval + planning loop** | Critical -- validates CSOAI approach |
| 10 | No existing project directly supports 47 agents in UE5.8 -- CSOAI would be the first | Opportunity -- first-mover advantage |

### Top 3 Projects to Reverse-Engineer
1. **a16z AI Town** -- MIT license, full TypeScript source, Convex backend, memory architecture
2. **Stanford Smallville (generative_agents repo)** -- full Python source, the original memory/planning/reflection architecture
3. **AgentSociety v2** -- Apache 2.0, modern LLM-native design, Ray-based distributed execution

---

## 2. Stanford Smallville (Generative Agents)

**Paper**: "Generative Agents: Interactive Simulacra of Human Behavior" (Park et al., 2023) [^1295^] [^59^] [^1299^]
**GitHub**: https://github.com/joonspk-research/generative_agents
**Demo**: https://reverie.herokuapp.com/arXiv_Demo/
**Paper**: https://arxiv.org/abs/2304.03442

### Open Source: YES (Full)
- Complete Python implementation of the Smallville simulation
- Includes two base simulations: `base_the_ville_n25` (25 agents) and `base_the_ville_isabella_maria_klaus` (3 agents)
- Pre-computed replay available online
- Java server implementation also available: https://github.com/nmatter1/smallville [^60^]

### Architecture Breakdown

The Generative Agent architecture is the foundational pattern that most subsequent AI town projects are based on:

```
Perception --> Memory Stream --> Retrieval --> Reflection --> Planning --> Action
                    ^__________________________________________|
```

**Memory Stream** [^1295^]:
- Comprehensive record of agent's experiences (observations)
- Each observation is a natural language description of an event
- Observations are tagged with timestamp and importance score

**Retrieval Function** (3 components):
1. **Recency**: Higher score to recently accessed memories
2. **Importance**: Distinguishes mundane from core memories (scored 1-10 via LLM)
3. **Relevance**: Score based on similarity to current situation (vector similarity)

**Reflection** [^67^]:
- Recursive synthesis of observations into higher-level insights
- Reflection tree structure: leaf nodes = observations, inner nodes = synthesized insights
- Enables agents to form self-notions (e.g., "I am highly dedicated to my research")
- Reflections are stored back into the memory stream

**Planning**:
- Plans are hierarchical: daily plan --> hourly chunks --> specific actions
- Plans are recursively revised based on current context and memory retrieval
- Agents can form multi-step plans (e.g., organizing a Valentine's Day party)

**Action & Social**:
- Agents perceive environment, retrieve memories, reflect, plan, then act
- Social interactions happen when agents are in proximity
- Natural language conversations are generated via LLM with retrieved context

### Number of Agents Supported
- 25 agents in the published paper (Smallville)
- 3-agent variant for testing
- Designed for small-town scale (tens of agents)

### What Can Be Reverse-Engineered
- **Memory stream + retrieval scoring formula**: The complete combination of recency, importance, and relevance scoring [^1295^]
- **Reflection tree algorithm**: Recursive synthesis of observations into higher-level insights
- **Planning hierarchy**: Daily/hourly/action-level planning decomposition
- **Proximity-based interaction system**: How agents decide to talk to each other
- **Interview mechanism**: How to probe agent state and verify believability
- **Full Python implementation**: All source code is available

### Mapping to CSOAI 47-Agent Architecture
| Smallville Component | CSOAI Mapping |
|---------------------|---------------|
| Memory Stream | UE5 persistent memory database (PostgreSQL/JSON) |
| Retrieval (3-component) | Vector search + recency scoring service |
| Reflection | Background reflection worker (async LLM calls) |
| Planning | UE5 behavior tree + LLM plan generator |
| Action | UE5 character controller + animation system |
| Perception | UE5 perception system (sight, hearing) |
| Social (proximity) | UE5 spatial triggers + conversation system |

### Integration Priority: **CRITICAL**
This is the foundational architecture. The memory stream + retrieval + reflection + planning loop should be the core of CSOAI's agent system.

---

## 3. AI Town by a16z

**Project**: AI Town -- "A MIT-licensed, deployable starter kit for building and customizing your own version of AI town"
**GitHub**: https://github.com/a16z-infra/ai-town [^63^] [^1294^]
**Live Demo**: https://convex.dev/ai-town
**Stack Post**: https://stack.convex.dev/ai-town-v2

### Open Source: YES (Full, MIT License)
- Complete TypeScript/JavaScript implementation
- Full frontend + backend + game engine
- MIT license permits commercial use
- 5000+ GitHub stars
- Active community with clones: AI Silicon Valley, Cat Town, Zaranova

### Architecture Breakdown

**Stack** [^63^]:
- **Game engine + database + vector search**: Convex (reactive backend)
- **Authentication**: Clerk (optional)
- **Default LLM**: llama3 via Ollama (local inference)
- **Embeddings**: mxbai-embed-large
- **Alternative LLMs**: OpenAI, Together.ai, any OpenAI-compatible API
- **Rendering**: PixiJS (2D pixel art)
- **Background Music**: Replicate (MusicGen)
- **Pixel Art**: Replicate, Fal.ai

**Key Components**:

1. **Serverless Game Engine**: Built on Convex with shared global state, transactions, simulation engine
2. **Agent System**: Each agent has identity, memory, planning, and social capabilities
3. **Memory Architecture**: Vector-based memory search with embedding model integration
4. **Interaction System**: Proximity-based conversations, rumor spreading, relationship formation
5. **Map System**: Tile-based world using Tiled editor for customization
6. **Character System**: Spritesheet-based characters with customizable appearances

**Memory & Planning** [^1305^]:
- Uses vector embeddings for memory retrieval
- `NUM_MEMORIES_TO_SEARCH` configurable (default ~top-k memories)
- Agents have persistent memory across simulation sessions
- Planning is LLM-driven with retrieved context

**Extensibility** [^1294^]:
- Characters defined in `characters.ts`
- Map loaded from `convex/init.ts` via `data/gentle.js`
- Tiled editor support for custom maps
- Agent data editable in Dashboard `agents` table
- Character sprites in `public/assets/characters`

### Number of Agents Supported
- 50-100 concurrent agents on modest server
- Convex backend scales horizontally for thousands
- Local Ollama limited by GPU memory
- The a16z team notes the backend can scale to "thousands by optimizing update frequencies"

### What Can Be Reverse-Engineered
- **Convex backend architecture**: How reactive state management works for multi-agent simulation
- **Vector memory integration**: Complete embedding-based memory retrieval system
- **TypeScript agent framework**: Full source code for agent reasoning loop
- **Game engine integration**: How simulation engine ties to rendering (PixiJS)
- **Map system**: Tile-based world representation and agent navigation
- **Character system**: How agent identity/persona drives behavior
- **LLM abstraction layer**: How to switch between Ollama, OpenAI, Together.ai
- **Docker deployment**: Complete containerization setup

### Mapping to CSOAI 47-Agent Architecture
| AI Town Component | CSOAI Mapping |
|------------------|---------------|
| Convex backend | UE5 GameInstance + dedicated server |
| PixiJS rendering | UE5 Nanite/Lumen rendering |
| TypeScript agents | C++ UE5 agents or Python middleware |
| Vector memory | ChromaDB/Pinecone + UE5 integration |
| Tile-based map | UE5 World Partition + custom map |
| Character system | UE5 MetaHuman/character system |
| LLM abstraction | CSOAI LLM gateway (local + cloud) |

### Integration Priority: **CRITICAL**
This is the most production-ready open-source AI town implementation. The full TypeScript source can be studied, the memory architecture ported to C++/Python, and the Convex backend patterns replicated in UE5's server architecture.

---

## 4. Emergence World (emergence.ai)

**Project**: Emergence World -- "A Laboratory for Evaluating Long-horizon Agent Autonomy"
**Blog**: https://www.emergence.ai/blog/emergence-world-a-laboratory-for-evaluating-long-horizon-agent-autonomy [^13^]
**Platform**: https://world.emergence.ai
**GitHub**: https://github.com/EmergenceAI/Emergence-World

### Open Source: YES (Emergence-World repo, plus Emergence-Agents repo with 5.6k stars)

### Architecture Breakdown

**Technology Stack** [^13^]:
- **Frontend**: React 18 + React Three Fiber (3D rendering)
- **Backend**: Python 3.11+ + FastAPI
- **Database**: PostgreSQL (structured data)
- **Agent Framework**: em-agent-framework (internal multi-agent framework)
- **Storage**: Google Cloud Storage (media/assets)
- **Time**: Synchronized to NYC time zone with dynamic weather and day/night cycles
- **Model**: Model-agnostic at reasoning layer

**Three-Layer Tool Architecture** (120+ tools):

1. **Core Tools (~30)** -- Persistently available:
   - Navigation: `go_to_place`, `get_nearby`, `list_landmarks`
   - Memory: `add_to_memory`, `write_diary`, `read_diary`
   - Planning: `add_todo`, `check_calendar`, `create_routine`
   - Communication: `send_message`, `create_event`, `invite_to_event`
   - Creative: `dance`, `execute_python_code_tool`

2. **Complementary Tools (~40)** -- Context-dependent:
   - Social: `say_to_character`, `hug`, `kiss`, `punch`, `intimidate`, `wave`, `commit_arson`
   - Billboard: `add_to_billboard`, `read_billboard`, `react`

3. **Adaptive Access Tools (up to 50)** -- Dynamically available:
   - Location-gated: voting at Town Hall, research at Library, complaints at Police Station
   - Event-gated: invitation acceptance, event actions
   - Social-gated: collaborative tools when partners agree

**Key Design Insight**: "This design forces agents to discover tools dynamically, plan movement to unlock capabilities, and chain sequences of tools to achieve complex objectives"

### Number of Agents Supported
- Not explicitly stated, but designed for "continuous multi-agent simulation at scale"
- Persistent state (memory, conversations, relationships) enables long-horizon studies

### What Can Be Reverse-Engineered
- **Three-layer tool architecture**: The classification of core/context-dependent/adaptive tools
- **Location-gated capability system**: How physical location unlocks agent abilities
- **Memory persistence design**: PostgreSQL-based persistent memory architecture
- **React Three Fiber 3D integration**: How 3D frontend connects to agent backend
- **em-agent-framework patterns**: Agent orchestration at scale
- **Day/night + weather cycle**: Environmental simulation tied to real-world time

### Mapping to CSOAI 47-Agent Architecture
| Emergence Component | CSOAI Mapping |
|-------------------|---------------|
| React Three Fiber | UE5 Lumen/Nanite (built-in) |
| 120+ tool architecture | UE5 Blueprint tool system |
| Location-gated tools | UE5 trigger volumes + capability system |
| PostgreSQL persistence | UE5 + PostgreSQL middleware |
| em-agent-framework | CSOAI agent framework (custom) |
| Day/night cycle | UE5 Sky Atmosphere system |

### Integration Priority: **HIGH**
The 120+ tool architecture and location-gated capability system are directly applicable to CSOAI's UE5 implementation. The open-source repo provides implementation patterns.

---

## 5. OASIS -- Open Agent Social Interaction Simulations

**Paper**: "OASIS: Open Agent Social Interaction Simulations with One Million Agents" (2024)
**GitHub**: https://github.com/camel-ai/oasis [^1321^]
**PyPI**: `pip install camel-oasis`
**Paper**: https://arxiv.org/abs/2411.11581
**Project Page**: https://oasis.camel-ai.org/
**Organization**: CAMEL-AI

### Open Source: YES (Apache 2.0)
- 4,800+ GitHub stars
- Part of the CAMEL-AI ecosystem (17k+ stars)
- Active development with frequent updates

### Architecture Breakdown

**Core Design** [^1321^]:
- Scalable social media simulator integrating LLM agents with rule-based agents
- Models behavior on platforms like Twitter/X and Reddit
- Event queue-driven simulation engine

**Key Features**:
1. **Scalability**: Up to 1,000,000 agents
2. **Dynamic Environments**: Real-time changes in social networks and content
3. **23 Agent Actions**: following, commenting, reposting, liking, searching, etc.
4. **Recommendation Systems**: Interest-based and hot-score-based algorithms

**Architecture**:
- Agent graph structure for social network modeling
- Environment (`oasis.make()`) with platform configuration
- Action system with `ManualAction` and `LLMAction`
- PettingZoo-style interface (refactored in 2025)

**Token Consumption** (reference for 100 agents, 1 timestep):
- Input: 335,600 tokens
- Output: 16,750 tokens
- Model: QWEN_TURBO

### Number of Agents Supported
- 1,000,000 agents (claimed)
- Realistic testing at 100-10,000 agent scale
- Cost scales linearly with agent count

### What Can Be Reverse-Engineered
- **Scalable agent graph architecture**: How to manage 1M agent social networks
- **Event queue simulation engine**: Efficient timestep-based simulation
- **Recommendation system integration**: How content feeds drive agent behavior
- **PettingZoo-style agent interface**: Standardized agent environment API
- **Cost optimization strategies**: Token consumption at scale

### Mapping to CSOAI 47-Agent Architecture
| OASIS Component | CSOAI Mapping |
|----------------|---------------|
| Agent graph | UE5 actor references + social network graph |
| Environment | UE5 game world + rules engine |
| Action system | UE5 Blueprint action library |
| Recommendation | CSOAI information dissemination system |

### Integration Priority: **MEDIUM**
The scalability patterns and social network dynamics are useful, but the social media focus is less directly applicable than physical-town simulations.

---

## 6. AgentSociety (Tsinghua FIB Lab)

**Paper**: "AgentSociety: Large-Scale Simulation of LLM-Driven Generative Agents Advances Understanding of Human Behaviors and Society" (2025)
**GitHub**: https://github.com/tsinghua-fib-lab/agentsociety/ [^1323^]
**PyPI**: `pip install agentsociety2` (v2) / `pip install agentsociety` (v1)
**Docs**: https://agentsociety2.readthedocs.io/
**Paper**: https://arxiv.org/abs/2502.08691

### Open Source: YES (Apache 2.0, except commercial folder)
- Two versions: AgentSociety 2 (modern, recommended) and AgentSociety 1.x (legacy)
- Active development by Tsinghua FIB Lab
- WWW'25 AgentSociety Challenge associated

### Architecture Breakdown

**AgentSociety 2 (Modern)** [^1323^]:
- **Design**: LLM-native from ground up
- **Environment**: Modular environment components with hot-pluggable tools
- **Reasoning Patterns**: CodeGen (default), ReAct, Plan-Execute, Two-Tier, Search routers
- **Execution**: Ray Tasks-based distributed execution, stateless agents
- **Research Skills**: Literature search, hypothesis generation, experiment design, paper writing
- **Experiment Replay**: Catalog-driven JSONL replay with DuckDB-powered reads
- **MCP Support**: Model Context Protocol integration

**AgentSociety 1.x (Legacy)**:
- City-scale simulation with Ray distributed computing
- Urban environment modules (mobility, economy, social)
- gRPC-based environment integration

**Agent Cognition Model** [^1325^]:
- "Human-like minds" based on sociological theory
- Emotions, needs, motivations, cognitive abilities
- Complex social behaviors: movement, employment, consumption, social interaction
- Custom agent support

**Urban Environment**:
- Realistic urban spaces: transportation, infrastructure, public resources
- Real-world constraints for agent interaction
- Vivid social ecosystem formation

**Simulation Engine**:
- Asynchronous simulation architecture
- Ray distributed computing framework
- Efficient interaction and social behavior simulation

**Research Toolkit**:
- Sociological research methods
- Intervention techniques
- Data collection and analysis capabilities
- Qualitative and quantitative analysis support

### Number of Agents Supported
- 10,000+ agents demonstrated
- Distributed via Ray framework
- Scales horizontally

### What Can Be Reverse-Engineered
- **LLM-native agent architecture**: Modern patterns for LLM-driven agents
- **Ray distributed execution**: How to scale agents across compute nodes
- **Sociological theory integration**: How to ground agent behavior in social science
- **Urban environment modeling**: City-scale environment representation
- **MCP (Model Context Protocol) integration**: Standardized tool interface
- **Experiment replay system**: DuckDB-powered simulation replay
- **Research workflow integration**: End-to-end social science research pipeline

### Mapping to CSOAI 47-Agent Architecture
| AgentSociety Component | CSOAI Mapping |
|----------------------|---------------|
| Ray distributed execution | UE5 dedicated server + actor distribution |
| Urban environment | UE5 world streaming + urban assets |
| Sociological agent model | CSOAI agent personality system |
| MCP tools | UE5 Blueprint tool system |
| Async simulation | UE5 tick-based async processing |

### Integration Priority: **HIGH**
The sociological foundation of AgentSociety is directly applicable to CSOAI's goal of realistic social dynamics. The v2 architecture's LLM-native design and MCP support represent modern best practices.

---

## 7. CitySim -- Urban Behavior Simulation

**Paper**: "CitySim: Modeling Urban Behaviors and City Dynamics with Large-Scale LLM-Driven Agent Simulation" (2025)
**arXiv**: https://arxiv.org/abs/2506.21805 [^1318^]
**Demo**: https://huggingface.co/spaces/Msk7000/city_sim_demo
**Published**: EMNLP 2025 Industry Track

### Open Source: Partial (paper + HuggingFace demo)

### Architecture Breakdown

**Agent Cognition Modules** [^1317^]:

1. **Persona Module**: Demographic, psychographic, habit-based attributes from real-world survey data
2. **Temporal Memory**: Chronologically ordered experiences
3. **Reflective Memory**: Higher-level insights and attitudes (synthesized)
4. **Spatial Memory**: Beliefs about Points of Interest (POIs) -- price, atmosphere, satisfaction, convenience
   - Updated via Kalman filter
   - Subject to decay
5. **Belief Module**: Updated after each POI visit using LLM-generated appraisals
6. **Needs Module**: Hunger, energy, safety, social -- dynamically tracked and prioritized
   - Explicit thresholds trigger plan adaptation
7. **Long-Term Goal Module**: Periodic revision informed by Maslow's hierarchy, financial status, social connectivity

**Recursive Value-Driven Planning**:
- Daily schedules constructed by recursively filling time blocks
- Mandatory activities first, then medium/low priority tasks
- LLM generates and evaluates candidate activities for each leisure block
- Value-driven: balances current needs, goals, and situational context

**Mobility & Social**:
- Belief-weighted gravity model for place selection
- LLM-based vehicle choice
- Dynamic social network (face-to-face + online interactions)
- Relationship strength evolution

**Evaluation** (Tokyo, up to 1,000 agents):
- Macro-level time use matches Japanese national time use survey
- Human-likeness: highest win rate vs baselines (GeAn, AGA, HumanoidAgent, MobileCity, AgentSociety)
- Mobility patterns: accurate commuting peaks and weekend leisure
- POI popularity prediction: positive Spearman correlation in Shibuya
- Crowd density: matches smartphone location data heatmaps
- Scalability tested from 10^3 to 10^6 agents

### Number of Agents Supported
- 1,000 agents in primary evaluation (Tokyo)
- Scalability tested to 1,000,000 agents
- Efficient step times at all scales

### What Can Be Reverse-Engineered
- **Recursive value-driven planning**: Sophisticated planning algorithm balancing multiple factors
- **Multi-dimensional memory system**: Temporal + reflective + spatial memory architecture
- **Kalman filter belief updating**: Mathematical approach to belief revision
- **Needs-driven behavior**: Explicit needs thresholds for adaptive behavior
- **Gravity model for place selection**: Physics-inspired location choice
- **Long-term goal module**: Maslow hierarchy integration for agent motivation

### Mapping to CSOAI 47-Agent Architecture
| CitySim Component | CSOAI Mapping |
|------------------|---------------|
| Persona module | CSOAI agent profile system |
| Temporal memory | Time-stamped event log |
| Reflective memory | LLM synthesis of experiences |
| Spatial memory | UE5 world knowledge + POI database |
| Kalman filter beliefs | Probabilistic belief updating system |
| Needs module | Agent state machine (hunger, energy, etc.) |
| Recursive planning | Hierarchical planning in UE5 |
| Gravity model | Location selection algorithm |

### Integration Priority: **HIGH**
The recursive value-driven planning and multi-dimensional memory system are among the most sophisticated in the field. The needs-driven behavior model directly applies to CSOAI's agents.

---

## 8. GenSim -- General Social Simulation Platform

**Paper**: "GenSim: A General Social Simulation Platform with Large Language Model based Agents" (NAACL 2025 Demo Track)
**GitHub**: https://github.com/TangJiakai/GenSim [^1326^]
**Paper**: https://arxiv.org/abs/2410.04360

### Open Source: YES (Full)
- Complete implementation with GUI
- Three default scenarios: job market, recommender system, group discussion

### Architecture Breakdown

**Three-Module Framework** [^1324^] [^1325^]:

1. **Single-Agent Module**:
   - Profile: public (gender, name, birthplace) + private (income, health)
   - Memory: short-term, long-term, reflection mechanism (configurable)
   - Actions: LLM prompt-driven, configurable with profile + memory context

2. **Multi-Agent Module**:
   - Script mode: LLM as meta-agent generates entire interactions in one call
   - Agent mode: Each agent generates from first-person perspective (multi-call)

3. **Environment Module**:
   - Stores all external information (recommendation algorithms, etc.)
   - Global user intervention for counterfactual analysis
   - Interviewing, searching, storing agents

**Error-Correction Mechanisms**:
- Self-evaluation via GPT-4o
- Manual human feedback
- Fine-tuning via PPO and SFT on corrected outcomes
- Iterative improvement across simulation rounds

**Scalability**:
- Supports up to 100,000 agents
- Distributed parallel technology
- Stabilization of results with larger populations

### Number of Agents Supported
- 100,000 agents (claimed)
- Realistic testing at various scales

### What Can Be Reverse-Engineered
- **General simulation framework**: Three-module design pattern
- **Script vs. agent interaction modes**: Two approaches to multi-agent interaction
- **Error-correction via PPO/SFT**: How to iteratively improve simulation quality
- **Platform interface**: GUI design for simulation management

### Mapping to CSOAI 47-Agent Architecture
| GenSim Component | CSOAI Mapping |
|-----------------|---------------|
| Single-agent module | CSOAI agent builder |
| Multi-agent module | UE5 agent interaction system |
| Environment module | UE5 world state + rules |
| Error-correction | Simulation quality assurance pipeline |

### Integration Priority: **MEDIUM**
The general framework and error-correction mechanisms are valuable, but the paper-focused scenarios are less directly applicable than physical-town simulations.

---

## 9. Light Society -- One Billion Agents

**Paper**: "Modeling Earth-Scale Human-Like Societies with One Billion Agents" (ICML 2025)
**arXiv**: https://arxiv.org/abs/2506.12078 [^1355^]
**Conference**: ICML 2025

### Open Source: Partial (paper only)

### Architecture Breakdown

**Core Innovation** [^1355^]:
- Simulates **one billion agents** efficiently
- Formalizes social processes as structured transitions of agent/environment states
- Event queue-driven execution
- Modular design supporting independent and joint component optimization

**Key Design Patterns**:
- **State transitions**: Agent and environment states governed by LLM-powered simulation operations
- **Event queue**: Ordered execution of simulation events
- **Component optimization**: Independent modules can be optimized separately
- **Scaling laws**: Larger simulations yield more stable and realistic emergent behaviors

**Demonstrated Simulations**:
- Trust games (up to 1B agents)
- Opinion propagation (up to 1B agents)
- Social trust modeling
- Information diffusion

### Number of Agents Supported
- 1,000,000,000 (one billion) agents
- Uses efficient data structures and event-driven architecture

### What Can Be Reverse-Engineered
- **Event queue simulation engine**: How to manage billions of agent state transitions
- **Component optimization strategy**: Modular architecture for scalability
- **Scaling law insights**: Relationship between simulation size and behavior stability
- **State transition formalization**: Mathematical framework for social processes

### Mapping to CSOAI 47-Agent Architecture
| Light Society Component | CSOAI Mapping |
|------------------------|---------------|
| Event queue | UE5 event system + custom queue |
| State transitions | Agent state machine |
| Component optimization | Modular agent system design |

### Integration Priority: **MEDIUM**
The billion-agent scale is impressive but overkill for 47 agents. However, the event queue architecture and component optimization patterns are valuable.

---

## 10. CAMEL-AI Framework

**Project**: CAMEL -- "Communicative Agents for 'Mind' Exploration of Large Language Model Society"
**GitHub**: https://github.com/camel-ai/camel [^1333^]
**Website**: https://www.camel-ai.org
**Paper**: https://arxiv.org/abs/2303.17760

### Open Source: YES (Apache 2.0)
- 17,000+ GitHub stars
- Large ecosystem: OASIS, CRAB, OWL, Loong, and more
- Active development with frequent updates

### Architecture Breakdown

**Design Principles** [^1333^]:
1. **Evolvability**: Continuous evolution via data generation and environment interaction
2. **Scalability**: Millions of agents with efficient coordination
3. **Statefulness**: Stateful memory for multi-step interactions
4. **Code-as-Prompt**: Code is both human and agent readable

**Core Components**:
- **ChatAgent**: Basic conversational agent with tool use
- **Role-playing**: Agents take roles (user/assistant) for task-solving
- **Task-solving framework**: Benchmark-driven agent evaluation
- **World simulation**: OASIS and other simulators
- **Tool system**: Extensible toolkit (SearchToolkit, etc.)

**Supported Models**:
- OpenAI GPT series
- vLLM (local models)
- Any litellm-supported provider

### Number of Agents Supported
- Framework designed for millions
- OASIS (part of CAMEL) supports 1M

### What Can Be Reverse-Engineered
- **Role-playing architecture**: How agent roles drive behavior
- **Communication protocols**: Agent-to-agent message passing
- **Tool integration patterns**: Extensible tool system design
- **Scalable coordination**: How to manage large agent populations

### Mapping to CSOAI 47-Agent Architecture
| CAMEL Component | CSOAI Mapping |
|----------------|---------------|
| ChatAgent | CSOAI agent base class |
| Role-playing | Agent persona system |
| Tool system | UE5 Blueprint tool integration |
| Communication | UE5 message passing between agents |

### Integration Priority: **MEDIUM**
The CAMEL ecosystem is valuable but more focused on task-solving than town simulation. OASIS (its simulation component) is more directly relevant.

---

## 11. Meta AI Habitat

**Project**: AI Habitat -- "A simulation platform for research in Embodied AI"
**GitHub**: https://github.com/facebookresearch/habitat-sim [^1321^] and https://github.com/facebookresearch/habitat-lab [^1326^]
**Website**: https://aihabitat.org/
**Papers**: Habitat 1.0 (ICCV 2019), Habitat 2.0 (NeurIPS 2021), Habitat 3.0 (2023)

### Open Source: YES (MIT License) -- BUT NO LONGER OFFICIALLY MAINTAINED
- **Warning**: Beyond v0.3.4, no longer receiving official active development from Meta
- Community forks encouraged
- Large existing codebase and datasets

### Architecture Breakdown

**Habitat-Sim** (3D Simulator) [^1321^]:
- High-performance physics-enabled 3D simulator
- 3D scans: HM3D, MatterPort3D, Gibson, Replica, HSSD
- CAD models: ReplicaCAD, YCB, Google Scanned Objects
- Sensors: RGB-D cameras, egomotion sensing
- Robots: Fetch, Franka, AlienGo (URDF-based)
- Physics: Bullet rigid-body mechanics
- Performance: 10,000+ FPS multi-process on single GPU
- 8,000+ SPS for Fetch robot in ReplicaCAD

**Habitat-Lab** (Agent Training) [^1326^]:
- Modular high-level library for embodied AI
- Task definitions: navigation, rearrangement, instruction following, QA
- Agent training: imitation learning, RL (PPO), SensePlanAct
- Multi-agent support
- Human-in-the-loop interaction
- Habitat-PyRobot integration for physical robot deployment

**Habitat 3.0**:
- Co-habitat for humans, avatars, and robots
- Social navigation and interaction

### Number of Agents Supported
- Single or multi-agent configurations
- Primarily designed for 1-10 embodied agents
- Not designed for large social simulations

### What Can Be Reverse-Engineered
- **3D simulation engine**: Photorealistic environment rendering
- **Embodied agent architecture**: How agents perceive and act in 3D space
- **Sensor configuration**: Camera and sensor setup for agents
- **Task definition framework**: How to specify agent goals and rewards
- **Navigation algorithms**: Pathfinding and obstacle avoidance
- **URDF robot integration**: Physics-based robot simulation

### Mapping to CSOAI 47-Agent Architecture
| Habitat Component | CSOAI Mapping |
|------------------|---------------|
| Habitat-Sim | UE5 (replacement) |
| Habitat-Lab | CSOAI agent training pipeline |
| Task definitions | CSOAI goal/action specification |
| Sensors | UE5 perception components |
| Navigation | UE5 Navigation System |

### Integration Priority: **MEDIUM**
Habitat is primarily an embodied AI research platform, not a social simulation. However, the embodied agent patterns and 3D simulation approaches are relevant for UE5 implementation. The lack of official maintenance reduces its value.

---

## 12. Google DeepMind AndroidEnv

**Paper**: "AndroidEnv: A Reinforcement Learning Platform for Android"
**arXiv**: https://arxiv.org/abs/2105.13231 [^1329^]
**Status**: Research platform, limited open-source availability

### Open Source: Partial (paper + limited code)

### Architecture Breakdown

AndroidEnv is a reinforcement learning platform that treats Android OS as an environment for training agents:
- RL agents interact with Android apps through the Android Emulator
- Observation: screenshot + view hierarchy
- Action: tap, swipe, type, etc.
- Reward: task-specific (app-defined)
- Multi-task learning across different apps

### Number of Agents Supported
- Single agent per Android instance
- Multiple instances can run in parallel
- Not designed for multi-agent social simulation

### What Can Be Reverse-Engineered
- **Environment abstraction**: How to wrap a complex OS as an RL environment
- **Action space design**: UI interaction primitives
- **Observation processing**: Screen-based perception
- **Task definition**: How to specify goals in an open-ended environment

### Mapping to CSOAI 47-Agent Architecture
| AndroidEnv Component | CSOAI Mapping |
|---------------------|---------------|
| Environment wrapper | UE5 environment abstraction |
| Action primitives | UE5 input system |
| Observation | UE5 perception components |
| Task definition | CSOAI goal system |

### Integration Priority: **LOW**
AndroidEnv is primarily a single-agent RL platform for mobile apps, not directly applicable to multi-agent social simulation. The environment abstraction patterns are the main takeaway.

---

## 13. Microsoft AutoGen / Agent Framework

**Project**: AutoGen -- open-source programming framework for agentic AI
**GitHub**: https://github.com/microsoft/autogen [^1365^]
**Docs**: https://microsoft.github.io/autogen/
**Status**: Now in maintenance mode; superseded by Microsoft Agent Framework

### Open Source: YES (MIT License)
- 30,000+ GitHub stars
- v0.4 complete redesign with async, event-driven architecture
- Now community-managed

### Architecture Breakdown

**Layered Architecture** [^1356^] [^1365^]:

1. **Core API**:
   - Message passing between agents
   - Event-driven agents
   - Local and distributed runtime
   - Cross-language support (Python + .NET)

2. **AgentChat API**:
   - High-level API for rapid prototyping
   - `AssistantAgent`: LLM-based reasoning
   - `UserProxyAgent`: Human-in-the-loop + code execution
   - `GroupChatManager`: Multi-agent group coordination

3. **Extensions API**:
   - LLM client implementations (OpenAI, Azure, etc.)
   - Code execution tools
   - Third-party extensions

**Key Features**:
- Asynchronous messaging
- Pluggable components (agents, tools, memory, models)
- OpenTelemetry observability
- Scalable distributed networks
- Human-in-the-loop workflows

**Successor**: Microsoft Agent Framework (combines AutoGen + Semantic Kernel) [^1357^]
- Session-based state management
- Type safety, middleware, telemetry
- Graph-based workflows for multi-agent orchestration

### Number of Agents Supported
- Framework supports many agents
- Practical limit depends on LLM API rate limits
- Group chat pattern for multi-agent collaboration

### What Can Be Reverse-Engineered
- **Multi-agent messaging system**: Async message passing between agents
- **Conversation patterns**: Two-agent chat, group chat, nested chats
- **Human-in-the-loop integration**: How to involve humans in agent workflows
- **Agent tool system**: How agents discover and use tools
- **Observability framework**: OpenTelemetry integration for agent monitoring
- **Distributed runtime**: How to run agents across multiple servers

### Mapping to CSOAI 47-Agent Architecture
| AutoGen Component | CSOAI Mapping |
|------------------|---------------|
| Core messaging | UE5 actor communication |
| AgentChat API | CSOAI conversation system |
| GroupChatManager | UE5 group interaction coordinator |
| Tool system | UE5 Blueprint tool library |
| Observability | CSOAI monitoring dashboard |

### Integration Priority: **MEDIUM**
AutoGen's messaging and conversation patterns are directly applicable. The move to Microsoft Agent Framework indicates the industry direction toward graph-based orchestration.

---

## 14. Agent-Based Modeling Platforms

### 14.1 Mesa (Python)

**GitHub**: https://github.com/projectmesa/mesa
**Docs**: https://mesa.readthedocs.io/
**License**: Apache 2.0
**Latest**: Mesa 3.2 (2025), Mesa 4.0 in development

**Features** [^1353^] [^1358^]:
- Python's leading ABM framework
- Built-in spatial grids, agent schedulers
- Browser-based Solara visualization
- Data collection and analysis tools
- Extensive example model library
- Active development (Google Summer of Code participant)

**Integration for CSOAI**:
- Can be used for rapid prototyping of agent behaviors before UE5 implementation
- Good for validating social dynamics models
- Not suitable for production 3D simulation

### 14.2 NetLogo

**Website**: https://ccl.northwestern.edu/netlogo/
**License**: Free, open-source

**Features** [^1362^] [^1363^]:
- Multi-agent programmable modeling environment
- Based on Logo programming language
- Four agent types: turtles (mobile), patches (static), links (connections), observer
- Extensive model library
- Educational focus

**Integration for CSOAI**:
- Useful for teaching and rapid concept validation
- Not suitable for production with 47 agents in 3D

### 14.3 Unity ML-Agents

**GitHub**: https://github.com/Unity-Technologies/ml-agents
**Stars**: 18,800+
**Status**: Actively maintained (Release 23, Aug 2025)

**Features** [^1300^]:
- Unity game engine environments for RL
- 17+ example environments
- Deep RL algorithms (PPO, SAC, MA-POCA)
- Self-play for multi-agent training
- PettingZoo/Gym interfaces
- C# + Python architecture

**Integration for CSOAI**:
- **Directly relevant**: Unity ML-Agents is the closest parallel to UE5-based agent simulation
- Can study how agents are trained in game engines
- The Gym interface pattern can be replicated in UE5
- Multi-agent training patterns (MA-POCA) are directly applicable

---

## 15. Other Notable Projects

### 15.1 AgentVerse (OpenBMB)
- **GitHub**: https://github.com/OpenBMB/AgentVerse [^1298^]
- Task-solving and simulation frameworks
- Classroom simulation scenarios (9 agents: 1 professor, 8 students)
- Supports tool-using agents

### 15.2 nmatter1/smallville (Java)
- **GitHub**: https://github.com/nmatter1/smallville [^60^]
- Java 17 server for Smallville simulation
- Dashboard at `/dashboard` showing memory streams, activities, locations
- Interview agents via dashboard

### 15.3 CrewAI
- Multi-agent collaboration framework
- Role-based agent assignments
- Good for task-oriented multi-agent systems

### 15.4 MetaGPT
- **GitHub**: https://github.com/geekan/MetaGPT [^1337^]
- 17,000+ stars
- Software company simulation (PM, architect, engineer, QA)
- SOP-based agent workflows
- ICLR 2024 oral presentation

### 15.5 BookWorld
- "From Novels to Interactive Agent Societies for Creative Story Generation" (2025)
- Transforms novels into interactive agent societies

### 15.6 SocioVerse
- "A World Model for Social Simulation Powered by LLM Agents and A Pool of 10 Million Real-World Users"
- Uses real-world user data to ground agent behavior

---

## 16. Research Paper Landscape 2024-2026

### 16.1 Survey Papers

| Paper | Year | Key Insight |
|-------|------|-------------|
| "From Individual to Society: A Survey on Social Simulation Driven by LLM-based Agents" | 2024 | Comprehensive survey of LLM social simulation [^1304^] |
| "A Survey on LLM-based Multi-Agent System" | 2024 | Multi-agent system taxonomy and advances |
| "Beyond Self-Talk: A Communication-Centric Survey of LLM-Based Multi-Agent Systems" | 2025 | Communication patterns in multi-agent systems |
| "Beyond Static Responses: Multi-Agent LLM Systems as a New Paradigm for Social Science Research" | 2025 | Framework for LLM agents in social science (6 levels) [^1306^] |

### 16.2 Key Research Directions

1. **Scaling**: From 25 agents (Smallville) to 1B agents (Light Society)
2. **Memory architectures**: Vector retrieval, temporal memory, reflective memory, spatial memory
3. **Planning**: Hierarchical, recursive value-driven, error-correction
4. **Social dynamics**: Trust, opinion propagation, polarization, cooperation
5. **Evaluation**: Human-likeness metrics, behavioral realism, emergent behavior detection
6. **Applications**: Urban planning, public health, economic modeling, policy evaluation
7. **Ethics**: Bias, reproducibility, LLM-as-judge limitations

### 16.3 Notable 2025-2026 Papers

| Paper | Venue | Key Contribution |
|-------|-------|-----------------|
| "CitySim: Modeling Urban Behaviors and City Dynamics" | EMNLP 2025 | Recursive value-driven planning, belief modules [^1318^] |
| "AgentSociety: Large-Scale Simulation of LLM-Driven Generative Agents" | arXiv 2025 | City-scale simulation with sociological theory [^1323^] |
| "OASIS: Open Agent Social Interaction Simulations with One Million Agents" | arXiv 2024 | 1M agent social media simulation [^1321^] |
| "Modeling Earth-Scale Human-Like Societies with One Billion Agents" | ICML 2025 | 1B agent simulation, scaling laws [^1355^] |
| "GenSim: A General Social Simulation Platform" | NAACL 2025 | 100K agents, error-correction [^1326^] |
| "Can A Society of Generative Agents Simulate Human Behavior and Inform Public Health Policy?" | 2025 | Vaccine hesitancy simulation |
| "LLM-Based Social Simulations Require a Boundary" | 2025 | Ethical boundaries for social simulation |

---

## 17. Architecture Comparison Matrix

| Project | Open Source | Agents | Memory | Planning | Reflection | Social | 3D | LLM |
|---------|------------|--------|--------|----------|------------|--------|-----|-----|
| **Stanford Smallville** | YES (Full) | 25 | Stream + 3-component retrieval | Hierarchical daily/hourly/action | Reflection tree | Proximity-based | 2D (Phaser) | GPT-3.5 |
| **a16z AI Town** | YES (MIT) | 50-100+ | Vector embeddings | LLM-driven | Basic | Proximity + chat | 2D (PixiJS) | llama3/OAI |
| **Emergence World** | YES | Scale | Diary + memory | Calendar + todo + routine | Write/read diary | Rich (120+ tools) | 3D (R3F) | Any |
| **OASIS** | YES (Apache) | 1M | Action history | LLM action selection | None | Social network | None | GPT-4o/Qwen |
| **AgentSociety** | YES (Apache) | 10K+ | Temporal + reflective + spatial | Recursive value-driven | Belief updating | Urban dynamics | 2D map | GPT-4o |
| **CitySim** | Partial | 1K (tested to 1M) | Multi-dimensional + Kalman | Recursive value-driven | Belief module | Gravity model | Urban map | GPT-4o-mini |
| **GenSim** | YES | 100K | Short + long + reflection | LLM prompt-driven | Error-correction | Script + agent mode | None | Any |
| **Light Society** | Partial | 1B | State transitions | Event queue | Component opt | Trust + opinion | None | LLM-powered |
| **Habitat 3.0** | YES (MIT, unmaintained) | 1-10 | Observations | RL + classical | None | Social nav | 3D (custom) | N/A |
| **Mesa** | YES (Apache) | Any | Custom | Custom | Custom | Custom | 2D browser | Optional |
| **Unity ML-Agents** | YES (MIT) | 1-100s | Observations | RL (PPO, SAC) | None | Self-play | 3D (Unity) | N/A |

---

## 18. Recommendations for CSOAI 47-Agent Architecture

### 18.1 Recommended Architecture (Synthesis of Best Practices)

Based on analysis of all projects, CSOAI's 47-agent UE5 architecture should incorporate:

```
+--------------------+     +--------------------+     +--------------------+
|   PERCEPTION LAYER | --> |   MEMORY LAYER     | --> |   REASONING LAYER  |
|  (UE5 Senses)      |     |  (Multi-dimensional)|     |  (LLM + Planning)  |
+--------------------+     +--------------------+     +--------------------+
                              |       |       |              |
                              v       v       v              v
                         [Temporal] [Reflective] [Spatial] [Planning]
                         Memory    Memory     Memory    Engine
                              \       |       /              |
                               \      |      /               |
                                \     |     /                |
                                 \    |    /                 |
                                  v   v   v                  v
                              +--------------------+     +--------------------+
                              |   RETRIEVAL ENGINE | --> |   ACTION LAYER     |
                              |  (Vector + Scoring) |     |  (UE5 Controllers) |
                              +--------------------+     +--------------------+
```

### 18.2 Specific Recommendations

#### A. Memory Architecture (from Smallville + CitySim + Emergence World)
- **Implement a 3-component retrieval scoring**: recency + importance + relevance (Smallville) [^1295^]
- **Add multi-dimensional memory**: temporal + reflective + spatial (CitySim) [^1317^]
- **Include diary/journal system**: agents write and read diaries (Emergence World) [^13^]
- **Use vector embeddings**: for semantic similarity search (AI Town) [^63^]
- **Database**: PostgreSQL for structured data + vector store (ChromaDB/Pinecone)

#### B. Planning Architecture (from CitySim + Smallville)
- **Recursive value-driven planning**: Daily schedule -> hourly blocks -> actions (CitySim)
- **Hierarchical planning**: High-level goals -> medium-term plans -> immediate actions (Smallville)
- **Needs-driven adaptation**: Hunger, energy, social needs trigger plan changes (CitySim)
- **Long-term goals**: Maslow hierarchy + financial + social goals (CitySim)
- **Calendar/routine system**: Weekly patterns with exceptions (Emergence World)

#### C. Social Architecture (from Emergence World + Smallville)
- **Proximity-based interactions**: UE5 trigger volumes for nearby conversations
- **Rich action space**: 50+ social actions (hug, talk, trade, argue, etc.)
- **Location-gated capabilities**: Certain actions only available at certain places
- **Dynamic relationships**: Relationship strength evolves through interactions
- **Information spreading**: Rumors and news propagate through social network

#### D. Tool Architecture (from Emergence World)
- **Three-layer tool system**: Core (~30) + Complementary (~40) + Adaptive (~50)
- **Dynamic tool discovery**: Agents discover tools based on context
- **Location-gated tools**: Physical location unlocks capabilities
- **Tool chaining**: Sequences of tool calls for complex objectives

#### E. UE5 Integration
- **Use UE5's AI systems**: Behavior Trees, Environment Query System, Mass AI
- **Navigation System**: For pathfinding and obstacle avoidance
- **Perception System**: AI Perception component for sight/hearing
- **World Partition**: For streaming large worlds
- **Dedicated Server**: For authoritative simulation state
- **PostgreSQL integration**: Via UE5 Database Support plugin or REST API

### 18.3 Implementation Roadmap

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| 1 | 2 weeks | Port Smallville memory architecture to Python/C++ |
| 2 | 2 weeks | Implement vector memory retrieval with ChromaDB |
| 3 | 3 weeks | Build UE5 agent controller with perception + navigation |
| 4 | 3 weeks | Implement planning engine (hierarchical + needs-driven) |
| 5 | 2 weeks | Build social interaction system (proximity + conversation) |
| 6 | 2 weeks | Add reflection and long-term goal systems |
| 7 | 2 weeks | Integrate LLM gateway (local + cloud) |
| 8 | 2 weeks | Build monitoring dashboard and debugging tools |
| 9 | 3 weeks | Scale test with 10 -> 25 -> 47 agents |
| 10 | Ongoing | Iterate based on emergent behavior observation |

### 18.4 Open-Source Code to Fork/Study

| Priority | Repository | What to Extract |
|----------|-----------|----------------|
| 1 | `a16z-infra/ai-town` | Full TypeScript memory + agent architecture |
| 2 | `joonspk-research/generative_agents` | Python memory stream + retrieval + reflection |
| 3 | `tsinghua-fib-lab/agentsociety` | Modern LLM-native agent patterns + Ray distribution |
| 4 | `camel-ai/oasis` | Scalable agent graph + social network modeling |
| 5 | `TangJiakai/GenSim` | General simulation framework + error-correction |
| 6 | `EmergenceAI/Emergence-World` | Tool architecture + 3D integration patterns |

### 18.5 Critical Success Factors

1. **Memory system quality**: The retrieval function determines agent coherence
2. **Planning sophistication**: Hierarchical, adaptive planning drives believability
3. **Social interaction richness**: Diverse actions and natural conversations
4. **UE5 performance**: 47 agents with LLM calls requires careful optimization
5. **LLM latency**: Use local models (Ollama) for real-time, cloud for quality
6. **Debugging tools**: Dashboard to monitor all agent states, memories, plans
7. **Iterative refinement**: Start with 5 agents, scale up, observe, iterate

---

## Appendix A: All Sources

| # | Source | URL | Type |
|---|--------|-----|------|
| 1 | Stanford Generative Agents GitHub | https://github.com/joonspk-research/generative_agents | Code |
| 2 | a16z AI Town GitHub | https://github.com/a16z-infra/ai-town | Code |
| 3 | Emergence World Blog | https://www.emergence.ai/blog/emergence-world-a-laboratory-for-evaluating-long-horizon-agent-autonomy | Blog |
| 4 | Emergence World GitHub | https://github.com/EmergenceAI/Emergence-World | Code |
| 5 | OASIS GitHub | https://github.com/camel-ai/oasis | Code |
| 6 | AgentSociety GitHub | https://github.com/tsinghua-fib-lab/agentsociety/ | Code |
| 7 | CitySim Paper | https://arxiv.org/abs/2506.21805 | Paper |
| 8 | GenSim GitHub | https://github.com/TangJiakai/GenSim | Code |
| 9 | Light Society Paper | https://arxiv.org/abs/2506.12078 | Paper |
| 10 | CAMEL-AI GitHub | https://github.com/camel-ai/camel | Code |
| 11 | Habitat-Sim GitHub | https://github.com/facebookresearch/habitat-sim | Code |
| 12 | Habitat-Lab GitHub | https://github.com/facebookresearch/habitat-lab | Code |
| 13 | AutoGen GitHub | https://github.com/microsoft/autogen | Code |
| 14 | Mesa GitHub | https://github.com/projectmesa/mesa | Code |
| 15 | Smallville Java | https://github.com/nmatter1/smallville | Code |
| 16 | AgentVerse GitHub | https://github.com/OpenBMB/AgentVerse | Code |
| 17 | MetaGPT GitHub | https://github.com/geekan/MetaGPT | Code |
| 18 | LLM-Agents-Papers List | https://github.com/AGI-Edgerunners/LLM-Agents-Papers | Resource |
| 19 | AI Town v2 Blog | https://stack.convex.dev/ai-town-v2 | Blog |
| 20 | AgentSociety Docs | https://agentsociety2.readthedocs.io/ | Docs |
| 21 | Smallville is Open Source Article | https://rikiphukon.medium.com/stanford-smallville-is-officially-open-source-9882e3fbc981 | Article |
| 22 | Stanford HAI Article | https://hai.stanford.edu/news/computational-agents-exhibit-believable-humanlike-behavior | Article |
| 23 | Multi-Agent MARL Platforms | https://medium.com/@gwrx2005/top-10-github-repositories-for-multi-agent-reinforcement-learning-marl-platforms-05cc8d21a6c1 | Article |
| 24 | AI Town Tutorial | https://prompts.brightcoding.dev/blog/ai-town-build-your-own-autonomous-ai-agent-society | Tutorial |
| 25 | Social Science with LLM Agents | https://arxiv.org/html/2506.01839v1 | Paper |

---

*Report prepared for CSOAI.org -- 47-Agent Sovereign AI Town Simulation*
*All cited sources use [^N^] format referencing original search results*
