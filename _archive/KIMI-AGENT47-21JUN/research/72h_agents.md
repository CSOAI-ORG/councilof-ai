# AI Agent Frameworks & Orchestration Research: Last 72 Hours

**Research Period:** June 18-21, 2026  
**Context:** CSOAI.org 47-agent sovereign town simulation (BFT Council, SOV3 King orchestrator, pheromone-based agent communication)  
**Searches Performed:** 14 independent search queries across 50+ sources  
**Sources Cited:** 40+ with [^N^] format

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Vercel EVE: Filesystem-First Durable Agent Framework](#1-vercel-eve-filesystem-first-durable-agent-framework)
3. [CrewAI: Role-Based Multi-Agent Orchestration](#2-crewai-role-based-multi-agent-orchestration)
4. [Anthropic Cybersecurity Skills: 754 Production-Grade Skills](#3-anthropic-cybersecurity-skills-754-production-grade-skills)
5. [OpenHuman: Local AI Revolution](#4-openhuman-local-ai-revolution)
6. [Andrej Karpathy: Agentic Engineering Philosophy](#5-andrej-karpathy-agentic-engineering-philosophy)
7. [Agent Communication Protocols (MCP, A2A, ACP, ANP)](#6-agent-communication-protocols)
8. [Multi-Agent Simulation & NPC Frameworks](#7-multi-agent-simulation--npc-frameworks)
9. [Durable Execution & Agent Memory](#8-durable-execution--agent-memory)
10. [Agent Skill Marketplaces](#9-agent-skill-marketplaces)
11. [Other Major Frameworks (OpenClaw, Hermes, Mastra, Google ADK, Microsoft AF)](#10-other-major-frameworks)
12. [Framework Comparison Matrix](#11-framework-comparison-matrix)
13. [Applicability to CSOAI Architecture](#12-applicability-to-csoai-architecture)
14. [Integration Recommendations](#13-integration-recommendations)

---

## Executive Summary

The AI agent framework landscape has undergone a major inflection in the last 72 hours, anchored by **Vercel's launch of EVE** at their Ship 2026 conference in London (June 17) [^1168^]. This "Next.js for agents" framework introduces a filesystem-first paradigm where each agent is a directory of files mapped to capabilities, with built-in durable execution, sandboxed compute, and human-in-the-loop approvals [^1166^].

Key developments across the research period:

| Framework/Tool | Status | Key Metric |
|---|---|---|
| **Vercel EVE** | Launched June 17, 2026 | Apache 2.0, public preview |
| **CrewAI** | Active development | 44,300+ GitHub stars, standalone framework [^1163^] |
| **Anthropic Cybersecurity Skills** | Community project | 754 skills, 5-framework mapping [^1157^] |
| **OpenHuman** | v0.54.0 shipped | 20k+ stars, #1 Product Hunt [^1158^] |
| **OpenClaw** | Mature | 345,000+ GitHub stars [^1280^] |
| **Hermes Agent** | v0.16.0 (June 2026) | 110,000+ GitHub stars [^1283^] |
| **Mastra** | 1.0 stable (Jan 2026) | 22,000+ stars, 300k weekly npm downloads [^1273^] |
| **Microsoft Agent Framework** | 1.0 GA (April 2026) | AutoGen + Semantic Kernel merger [^1209^] |
| **LangGraph** | v1.2.6 (June 18) | Production leader, checkpointing [^1266^] |
| **Google ADK** | 2.0 released | Multi-language (Python, Java, Go, TS) [^1275^] |

**Andrej Karpathy's** paradigm shift from "vibe coding" to **"agentic engineering"** defines the philosophical backdrop: developers now function as supervisors orchestrating fleets of AI agents, with the potential for 100x productivity multipliers [^1208^].

---

## 1. Vercel EVE: Filesystem-First Durable Agent Framework

### Overview

**EVE** is Vercel's new open-source (Apache 2.0) framework for building durable backend AI agents, launched at Vercel Ship 2026 in London on **June 17, 2026** [^1168^] [^1167^]. It is described as "Next.js for agents" -- a filesystem-first framework where each agent is a directory of files mapped to capabilities [^1169^].

### Core Architecture

The directory layout maps each capability to a folder. The framework discovers files at build time and wires them in automatically -- no boilerplate registration needed [^1166^]:

| Path | Role | Format |
|---|---|---|
| `agent.ts` | Model config + runtime | TypeScript |
| `instructions.md` | System prompt | Markdown |
| `tools/` | Agent capabilities | TypeScript (Zod schema) |
| `skills/` | Knowledge (lazy-loaded) | Markdown |
| `connections/` | MCP servers, OpenAPI APIs | TypeScript |
| `sandbox/` | Isolated workspace | Directory |
| `subagents/` | Specialist child agents | Directory |
| `channels/` | Surfaces (Slack, HTTP, etc.) | TypeScript |
| `schedules/` | Cron triggers | TypeScript |
| `lib/` | Shared code | TypeScript |

### Six Production Capabilities

1. **Durable Execution**: Every conversation is a checkpointed durable workflow built on the open-source Workflow SDK. Sessions survive crashes and deploys [^1166^].
2. **Sandboxed Compute**: Per-agent sandbox via swappable adapter (Vercel Sandbox when deployed, Docker/microsandbox locally) [^1167^].
3. **Human-in-the-Loop**: `needsApproval` field on any action. Agents pause indefinitely without consuming compute [^1166^].
4. **Secure Connections**: MCP servers and OpenAPI APIs with auth brokering -- model never sees credentials [^1166^].
5. **Multi-Channel**: HTTP (default), Slack, Discord, Teams, Telegram, Twilio, GitHub, Linear -- one adapter file per channel [^1167^].
6. **Tracing & Evals**: OpenTelemetry spans exportable to Braintrust, Honeycomb, Datadog, Jaeger [^1166^].

### Internal Production Use at Vercel

Vercel runs **100+ agents internally** on EVE [^1167^]:

- **d0 (Data Analyst)**: 30,000+ questions/month, permission-scoped queries [^1166^]
- **Lead Agent (Autonomous SDR)**: ~$5,000/year cost, 32x ROI, maintained by 1 engineer part-time [^1166^]
- **Athena (Sales Cockpit)**: RevOps built in 6 weeks without engineers [^1166^]
- **Vertex (Support Engineer)**: Solves 92% of tickets autonomously [^1166^]
- **V (Routing Agent)**: Routes Slack tasks to the appropriate agent [^1166^]

### Agent Stack Ecosystem

EVE launched alongside the broader **Agent Stack** [^1206^]:
- **AI SDK**: Unified API for any model
- **AI Gateway**: Provider fallback routing
- **Workflow SDK**: Durable execution with retries
- **Vercel Sandbox**: Isolated microVMs
- **Chat SDK**: Multi-channel deployment
- **Vercel Connect**: Short-lived, task-scoped credentials replacing long-lived tokens [^1207^]
- **Vercel Agent** (Private Beta): Intelligence layer for shipping on Vercel [^1206^]

### Relevance to CSOAI

EVE's **durable execution** and **filesystem-first architecture** align with CSOAI's need for persistent agent state. The `subagents/` directory pattern maps naturally to CSOAI's 47-agent architecture. However, EVE is Vercel-only currently, with "support for other platforms coming" [^1167^].

---

## 2. CrewAI: Role-Based Multi-Agent Orchestration

### Overview

**CrewAI** is a standalone, lean Python framework for orchestrating autonomous AI agents through role-based "crews." It explicitly **does not depend on LangChain** -- built entirely from the ground up [^1163^].

### Key Metrics (June 2026)

- **GitHub Stars**: 44,300+ [^1214^]
- **Monthly Downloads**: 5.2 million [^1214^]
- **Philosophy**: Role-based DSL, fastest prototyping path
- **Learning Curve**: Lowest among major frameworks [^1160^]

### Architecture

CrewAI uses a **role-based orchestration model** rather than graph-based [^1160^]:
- Agents defined with roles, goals, and backstories
- Organized into "crews" with process types (sequential, hierarchical)
- Task outputs passed sequentially between agents
- YAML configuration for non-technical editing [^1161^]

### Production Readiness

- **Strengths**: Fastest time-to-working-prototype (2-4 hours) [^1214^], growing ecosystem, native MCP and A2A support [^1214^]
- **Limitations**: Medium production readiness -- limited checkpointing, "Pending Run" delays of ~20 minutes on enterprise platform, less deterministic than LangGraph [^1214^]
- **Best For**: Research, writing, planning, task-delegation, 3-5 agent collaborations [^1214^]

### Comparison with EVE

| Dimension | CrewAI | Vercel EVE |
|---|---|---|
| Language | Python | TypeScript |
| Orchestration | Role-based crews | Filesystem directories |
| State Management | Task outputs sequential | Checkpointed durable workflows |
| Deployment | Any Python runtime | Vercel-only (for now) |
| Learning Curve | Lowest | Low |
| Multi-Agent | 3-5 agents well | Subagent delegation |

---

## 3. Anthropic Cybersecurity Skills: 754 Production-Grade Skills

### Overview

The **Anthropic Cybersecurity Skills** repository (by mukul975, community project -- not affiliated with Anthropic PBC) contains **754 structured cybersecurity skills** spanning **26 security domains**, following the **agentskills.io** open standard [^1157^]. It is the only open-source skills library with unified cross-framework coverage of five major security frameworks.

### Five-Framework Mapping

Every skill maps to all five frameworks simultaneously [^1157^]:

| Framework | Version | Coverage |
|---|---|---|
| MITRE ATT&CK | v19.1 | 15 tactics, 286 techniques |
| NIST CSF 2.0 | 2.0 | 6 functions, 22 categories |
| MITRE ATLAS | v5.4 | 16 tactics, 84 techniques |
| MITRE D3FEND | v1.3 | 7 categories, 267 techniques |
| NIST AI RMF | 1.0 | 4 functions, 72 subcategories |

### Skill Anatomy

Each skill follows a consistent directory structure [^1157^]:
```
skills/<skill-name>/
  SKILL.md              # YAML frontmatter + Markdown body
  references/
    standards.md        # Framework mappings
    workflows.md        # Technical procedures
  scripts/
    process.py          # Helper scripts
  assets/
    template.md         # Checklists and report templates
```

### Token-Efficient Design

- **~30 tokens** to scan frontmatter (all 754 skills in one pass)
- **500-2,000 tokens** to fully load a complete workflow [^1157^]
- Progressive disclosure: agents scan frontmatter first, load full content only when needed

### Compatible Platforms

Works with Claude Code, GitHub Copilot, Cursor, Windsurf, Cline, Aider, OpenAI Codex CLI, Devin, Replit Agent, LangChain, CrewAI, AutoGen, Vercel AI SDK, and any MCP-compatible agent [^1157^].

### Relevance to CSOAI

The **agentskills.io standard** and structured skill format provide a blueprint for CSOAI's own agent skill definitions. The progressive disclosure architecture (frontmatter scanning before full load) is particularly relevant for a 47-agent system where not all skills are needed simultaneously.

---

## 4. OpenHuman: Local AI Revolution

### Overview

**OpenHuman** is an open-source (GPL-3.0) desktop AI agent from **TinyHumans AI**, written in **Rust (65.2%)** with a **TypeScript + React 19** frontend, packaged as a native **Tauri v2** desktop app [^1158^]. It reached **20,000+ GitHub stars** and **#1 on Product Hunt** (daily, weekly, monthly) in May 2026 [^1158^].

### Core Differentiator

Most agents start cold -- OpenHuman walks your tools every 20 minutes and writes memory into **Markdown files you can open and edit** [^1158^]. The Memory Tree uses a deterministic pipeline:

`source adapters -> canonicalize -> chunker -> content_store -> store -> score -> source/topic/global trees -> retrieval` [^1158^]

### Key Features

- **118+ Composio toolkit** catalog for one-click OAuth integrations (Gmail, Notion, Slack native) [^1158^]
- **Memory Tree** + Obsidian-compatible Markdown vault as local knowledge base [^1158^]
- **TokenJuice**: Token compression layer (70-80% compression) [^1158^]
- **Neocortex**: Memory engine handling 1B+ tokens with entity/relationship understanding [^1278^]
- **Subconscious loop**: Proactive recall surfacing insights without explicit queries [^1278^]
- **Local AI support**: Three presets (embeddings only, memory+reflection, everything local) [^1158^]
- **Google Meet integration**: Mascot joins as real participant [^1158^]

### Latest Release

**v0.54.0** (shipped June 2026): Fully-local voice, shared-memory bridge to Claude Code, Cursor, Codex, and OpenCode [^1158^].

### Architecture

- **Backend**: Rust with background workers, semaphore-based concurrency
- **Frontend**: TypeScript + React 19 + Tauri v2
- **Memory**: Local SQLite with indexed chunks, rolling summary trees
- **Model Routing**: 10 hint types (reasoning, fast, vision, summarize, code, reaction, classify, sentiment, medium, tool_lite) [^1158^]

### Relevance to CSOAI

OpenHuman's **Memory Tree architecture** and **deterministic memory pipeline** are directly applicable to CSOAI's pheromone-based communication. The token compression approach (TokenJuice) could optimize context window usage for 47 agents.

---

## 5. Andrej Karpathy: Agentic Engineering Philosophy

### The Paradigm Shift

Andrej Karpathy (OpenAI co-founder, Tesla AI director, Eureka Labs founder) officially declared "vibe coding" passe in early 2026, introducing **"Agentic Engineering"** [^1208^].

### Key Tenets

1. **Vibe coding raises the floor; Agentic engineering preserves the ceiling** [^1198^]
2. **Software 3.0**: Your context window is the program; the LLM is the interpreter [^1198^]
3. **The developer is now Supervisor-in-Chief**: Strategic planning, agent orchestration, code review [^1208^]
4. **December 2025 was the inflection point**: Agentic coding "actually started to work" [^1198^]

### Vibe Coding vs Agentic Engineering

| Dimension | Vibe Coding | Agentic Engineering |
|---|---|---|
| Goal | Raise the floor | Preserve the ceiling |
| Output | Prototype | Production system |
| Workflow | Single agent, single thread | Multi-agent orchestration, specs, evals |
| Human Role | Imagination, prompt fluency | Spec writing, oversight, eval design |
| Quality Bar | Whatever the model produces | The bar you set before agents start |
| Speed-up | 5-10x on greenfield | Far beyond 10x on existing systems |

### Software 1.0 / 2.0 / 3.0

- **Software 1.0**: Explicit rules written by humans (code)
- **Software 2.0**: Learned weights from training neural networks
- **Software 3.0**: Prompting as programming -- context window is code, LLM is interpreter [^1198^]

### The 100x Engineer

Karpathy notes that at top tiers, technical mastery is **"even more of a multiplier than before"** -- a developer who deeply understands system architecture can leverage agents for **10x or 100x productivity**, while novices "merely generate broken code faster" [^1208^].

### Relevance to CSOAI

CSOAI's 47-agent BFT Council architecture embodies Karpathy's agentic engineering vision. The shift from "coding agents" to "supervising agents" aligns with CSOAI's SOV3 King orchestrator pattern.

---

## 6. Agent Communication Protocols

The AI agent ecosystem in 2025-2026 converges on four complementary interoperability protocols [^1173^]:

### MCP (Model Context Protocol)

- **Origin**: Anthropic (Nov 2024), now Linux Foundation
- **Purpose**: Agent-to-tool communication ("USB-C of AI")
- **Architecture**: JSON-RPC 2.0 client-server
- **Use When**: Building agents with many data sources, security-critical, maximum ecosystem support [^1170^]

### A2A (Agent-to-Agent Protocol)

- **Origin**: Google (April 2025), donated to Linux Foundation (June 2025)
- **Purpose**: Peer-to-peer agent communication and task delegation
- **Architecture**: Agent Cards (JSON manifests), HTTP/HTTPS + SSE, OAuth 2.0
- **Partners**: 50+ including Salesforce, SAP, ServiceNow, Atlassian, MongoDB [^1170^]
- **Use When**: Multi-agent workflows, cross-organizational communication, dynamic discovery [^1172^]

### ACP (Agent Communication Protocol)

- **Origin**: IBM (2024), now Linux Foundation
- **Purpose**: REST-native messaging for cross-framework interoperability
- **Architecture**: Brokered, multipart MIME, asynchronous streaming
- **Use When**: Rapid deployment, legacy systems, REST preferences [^1170^]

### ANP (Agent Network Protocol)

- **Origin**: Community (2024-2025)
- **Purpose**: Decentralized agent discovery and open-internet collaboration
- **Architecture**: W3C DIDs, JSON-LD graphs, trustless authentication
- **Use When**: Decentralized marketplaces, open agent ecosystems [^1173^]

### Phased Adoption Roadmap

Based on the comparative analysis [^1165^]:

1. **Stage 1**: MCP for tool invocation
2. **Stage 2**: ACP for rich multimodal interaction
3. **Stage 3**: A2A for enterprise multi-agent collaboration
4. **Stage 4**: ANP for decentralized agent marketplaces

### Relevance to CSOAI

CSOAI's **pheromone-based agent communication** maps conceptually to A2A's peer-to-peer pattern. The MCP protocol should be adopted for CSOAI agent tool access. A2A could standardize agent-to-agent delegation within the BFT Council.

---

## 7. Multi-Agent Simulation & NPC Frameworks

### AIvilization v0

**AIvilization v0** is the largest publicly deployed AI social simulation, launched by HKUST and Bauhinia AI. It features **100,000 AI agents** in a resource-constrained sandbox economy [^1269^] [^1278^].

#### Unified Agent Architecture

1. **Hierarchical Branch-Thinking Planner**: Decomposes life goals into parallel objective branches [^1268^]
2. **Dual-Process Memory**: Separates short-term execution traces from long-term semantic consolidation [^1268^]
3. **Adaptive Agent Profile**: MBTI personality types, evolving identity through social interaction [^1268^]
4. **Action Simulator**: Validates proposed actions against physical/economic constraints before execution [^1268^]
5. **Human-in-the-Loop Steering**: Long-horizon objectives + temporary commands at appropriate abstraction levels [^1268^]

#### Key Simulation Features

- Physiological survival constraints (energy, satiety, health)
- Automated Market Maker (AMM) economy
- Gated education-occupation hierarchy
- Agents establish cultural norms and societal structures organically [^1278^]
- Cost: ~$2/agent/month (95% reduction vs comparable platforms) [^1278^]

### Game-Specific NPC Frameworks

| Tool | Best For | Key Feature |
|---|---|---|
| **Unity ML-Agents** | Unity games | Reinforcement learning toolkit, multi-agent [^1200^] |
| **Inworld AI** | Story-driven games | Conversational NPCs, emotional behavior |
| **Kythera AI** | AAA open-world | Procedural decision-making, group behavior [^1200^] |
| **GameSim AI** | Strategy/simulation | Emergent multi-agent behavior [^1200^] |
| **Spirit AI** | Narrative games | Emotional, story-driven NPC behavior [^1200^] |

### Self-Evolving Multi-Agent Framework (2026)

Recent research (March 2026) presents a **Self-Evolving Multi-Agent Framework** for real-time strategy scenarios, featuring memory and multi-agent coordination [^1204^].

### Relevance to CSOAI

AIvilization's **branch-thinking planner**, **dual-process memory**, and **action simulator** provide direct architectural patterns for CSOAI's sovereign town simulation. The $2/agent/month cost model demonstrates economic viability at scale.

---

## 8. Durable Execution & Agent Memory

### The Durable Execution Pattern

Most agent implementations use a simple loop that runs synchronously in memory. If anything interrupts it, state disappears [^1271^]. **Durable execution** solves this by checkpointing every step.

### Checkpoint Anatomy

A complete agent checkpoint includes [^1271^]:
- **Conversation history**: All messages including tool calls and results
- **Agent memory**: Explicitly stored information for later reference
- **Plan state**: Progress through multi-step tasks
- **Sub-agent state**: Pending/completed delegations
- **Execution context**: Timing, config, auth tokens

### Workflow Engine Comparison

| Engine | Approach | Best For |
|---|---|---|
| **Temporal** | History-based replay | Complex enterprise workflows |
| **Inngest** | Step journaling | Simple step functions |
| **Restate** | Virtual objects + journal | Exactly-once semantics |
| **Vercel Workflow SDK** | Built into EVE | Vercel-deployed agents |
| **LangGraph** | Built-in checkpointing | Graph-based agent workflows [^1266^] |

### Mastra's Observational Memory (February 2026)

Mastra's novel **observational memory** uses two background agents (Observer + Reflector) to compress old conversations into dense observations. Achieved **94.87% on LongMemEval benchmark** (state-of-the-art), requires no vector database, and is prompt-cacheable [^1273^].

### Relevance to CSOAI

CSOAI's 47-agent simulation **must** implement durable execution. LangGraph's built-in checkpointing or a custom temporal checkpointing system should be adopted. Mastra's observational memory pattern could optimize context window usage.

---

## 9. Agent Skill Marketplaces

### The Skills Ecosystem

The agent skills ecosystem grew from one registry (December 2025) to **eight major marketplaces** by Q2 2026 [^1198^]. Over **31,000 skills** are now in circulation [^1201^].

### Major Marketplaces (April 2026)

| Marketplace | Skills | Curation | Security Review |
|---|---|---|---|
| **Skills.sh** (Vercel) | ~2,000 | Community | None |
| **SkillsMP** | 800,000+ | Scraped (2+ stars) | None |
| **LobeHub** | 169,000+ | Scraped | None |
| **ClaudeSkills.info** | 658 | Community + official | None |
| **SkillsLLM** | 3,129+ | Mixed | None |
| **Agensi** | 200+ | Manual + automated | 8-point scan |
| **Anthropic Official** | ~20 | Anthropic-verified | Internal audit |

### agentskills.io Standard

The open standard defines skills as directories with:
- `SKILL.md` (YAML frontmatter + Markdown body)
- `scripts/` (optional executables)
- `references/` (documentation)
- `assets/` (templates, configs)

**Progressive disclosure**: Only `name` and `description` loaded at startup; full content loaded on-demand [^1202^].

### Security Concerns

Snyk's **ToxicSkills** research found **prompt injection in 36% of skills tested** [^1198^]. An audit of 22,511 skills found **140,963 issues** (6.3 per skill on average) [^1198^].

### Relevance to CSOAI

CSOAI should adopt the **agentskills.io standard** for agent skill definitions. A curated internal marketplace with security scanning (following Agensi's 8-point model) should be established.

---

## 10. Other Major Frameworks

### OpenClaw (Open Source Agent Harness)

- **GitHub Stars**: 345,000+ (fastest-growing agent framework) [^1280^]
- **License**: MIT
- **Philosophy**: Multi-channel gateway across 20+ messaging surfaces
- **Architecture**: Central gateway connecting 50+ channels (WhatsApp, Telegram, Slack, Discord, iMessage)
- **Weakness**: Security -- Koi Security audit found 341 malicious skills in ClawHub; CVE-2026-25253 (CVSS 8.8) [^1283^]

### Hermes Agent (NousResearch)

- **GitHub Stars**: 110,000+ in 10 weeks [^1283^]
- **License**: MIT
- **Philosophy**: Self-improving runtime with learning loop
- **Key Feature**: Autonomous skill creation -- agent writes reusable skills after completing complex tasks
- **Memory**: Honcho dialectic user modeling builds evolving user profile
- **Desktop App**: Native macOS, Linux, Windows (v0.16.0, June 2026) [^1274^]

### Mastra (TypeScript Framework)

- **GitHub Stars**: 22,000+ [^1273^]
- **Weekly Downloads**: 300,000+ npm [^1273^]
- **License**: Apache 2.0 (core), Enterprise License (RBAC/SSO)
- **Latest**: Mastra Harness (June 18, 2026), Agent Builder (May 28), Agent Signals (June 3) [^1281^]
- **Key Features**: Workflows, RAG, observational memory, Mastra Studio, MCP support [^1273^]

### Microsoft Agent Framework (MAF)

- **Status**: 1.0 GA (April 2, 2026) [^1209^]
- **License**: MIT
- **Origin**: Convergence of AutoGen + Semantic Kernel
- **AutoGen Status**: Maintenance mode (bug fixes only since February 2026) [^1210^]
- **Key Features**: Graph-based workflows, DevUI inspector, Azure AI Foundry integration, MCP + A2A support [^1213^]

### Google ADK (Agent Development Kit)

- **Latest**: v2.0 with Workflow Runtime (graph-based execution), Task API (structured A2A delegation) [^1275^]
- **Languages**: Python, Java, Go, TypeScript
- **Key Features**: Google Maps grounding, container code execution, HITL, session/memory services, A2A [^1270^]

### LangGraph

- **Latest**: v1.2.6 (released June 18, 2026) [^1266^]
- **Status**: Production leader -- deployments at Uber, JPMorgan, LinkedIn, Klarna [^1212^]
- **Downloads**: 34.5M monthly [^1214^]
- **Key Feature**: Stateful orchestration with time-travel debugging, checkpointing, streaming [^1214^]

---

## 11. Framework Comparison Matrix

| Framework | Language | Stars | Orchestration | State | MCP | A2A | Best For |
|---|---|---|---|---|---|---|---|
| **Vercel EVE** | TypeScript | New | Filesystem | Durable | Yes | Via channels | Vercel-deployed agents |
| **CrewAI** | Python | 44.3k | Role-based | Sequential | Yes | Yes | Fast prototyping |
| **LangGraph** | Python/TS | 34.5M DL | Graph | Checkpointed | Yes | Yes | Production workflows |
| **Mastra** | TypeScript | 22k | Workflow | Observational | Yes | Yes | TypeScript teams |
| **MS Agent Framework** | Python/.NET | N/A | Conversation | Persistent | Native | Beta | Microsoft/Azure shops |
| **Google ADK** | Python/Java/Go | N/A | Hierarchical | Session + Memory | Yes | Native | GCP-native teams |
| **OpenAI Agents SDK** | Python/TS | N/A | Handoff | Ephemeral | Yes | No | OpenAI-only teams |
| **OpenClaw** | TypeScript | 345k | Gateway | File-based | Yes | No | Multi-channel routing |
| **Hermes Agent** | Python | 110k | Learning loop | FTS5 search | Yes | No | Self-improving agents |
| **OpenHuman** | Rust/TS | 20k | Memory Tree | SQLite + MD | Yes | No | Local personal agents |

---

## 12. Applicability to CSOAI Architecture

### Direct Mappings

| CSOAI Component | Best Framework Match | Rationale |
|---|---|---|
| **47-Agent Town Simulation** | AIvilization architecture | 100k-agent proven pattern |
| **BFT Council governance** | A2A protocol | Peer-to-peer agent delegation |
| **SOV3 King orchestrator** | EVE subagents/ | Hierarchical delegation |
| **Pheromone communication** | ANP (decentralized) | Stigmergic indirect communication |
| **Agent memory** | Mastra observational memory | 94.87% LongMemEval, no vector DB |
| **Skill definitions** | agentskills.io standard | Progressive disclosure, cross-platform |
| **Durable state** | LangGraph checkpointing | Production-proven, time-travel debug |
| **Agent sandboxing** | Vercel Sandbox pattern | Per-agent isolation |
| **HITL approvals** | EVE `needsApproval` | Pause without compute cost |

### Architecture Recommendations

1. **Adopt agentskills.io standard** for all agent skill definitions, with CSOAI-specific extensions
2. **Implement A2A protocol** for inter-agent communication within the BFT Council
3. **Use MCP** for agent-to-tool connections (external APIs, databases)
4. **Adopt durable execution pattern** via LangGraph-style checkpointing
5. **Implement dual-process memory** (short-term execution + long-term consolidation) per AIvilization
6. **Use hierarchical branch-thinking planner** for agent goal decomposition
7. **Add action simulator** for pre-execution validation of agent actions
8. **Establish internal skill marketplace** with Agensi-style security scanning

---

## 13. Integration Recommendations

### Immediate Actions (Next 30 Days)

1. **Prototype EVE integration** for a subset of CSOAI agents (TypeScript-friendly)
2. **Adopt agentskills.io** as the skill definition standard
3. **Implement MCP servers** for external tool access
4. **Design A2A Agent Cards** for each of the 47 agents

### Medium-Term (60-90 Days)

1. **Build durable execution layer** with checkpointing
2. **Implement observational memory** compression (Mastra pattern)
3. **Create internal skill marketplace** with security scanning
4. **Add human-in-the-loop approval gates** for high-stakes actions

### Long-Term (3-6 Months)

1. **Full A2A protocol adoption** for agent-to-agent delegation
2. **Branch-thinking planner** for complex multi-objective agent behavior
3. **Action simulator** for pre-execution validation
4. **Consider ANP** for open agent marketplace participation

---

## Source Index

| Citation | Source | Date |
|---|---|---|
| [^1157^] | github.com/mukul975/Anthropic-Cybersecurity-Skills | April 2026 |
| [^1158^] | alphasignalai.substack.com - OpenHuman setup guide | May 20, 2026 |
| [^1159^] | producthunt.com/products/openhuman | May 2026 |
| [^1160^] | gurusup.com - Best Multi-Agent Frameworks 2026 | May 2, 2026 |
| [^1161^] | firecrawl.dev - CrewAI tutorial | May 17, 2025 |
| [^1162^] | spreaker.com - Anthropic Cybersecurity Skills podcast | May 24, 2026 |
| [^1163^] | github.com/crewaiinc/crewai | June 11, 2026 |
| [^1164^] | medium.com - OpenHuman memory article | May 15, 2026 |
| [^1165^] | arxiv.org - Agent Interoperability Protocols survey | April 24, 2025 |
| [^1166^] | marktechpost.com - Vercel Releases EVE | June 17, 2026 |
| [^1167^] | thenewstack.io - Vercel launches EVE | June 17, 2026 |
| [^1168^] | vercel.com/changelog/introducing-eve | June 17, 2026 |
| [^1169^] | vercel.com/blog/introducing-eve | June 17, 2026 |
| [^1170^] | ruh.ai - AI Agent Protocols 2026 Guide | May 6, 2026 |
| [^1171^] | vercel.com/docs/eve | 2026 |
| [^1172^] | a2a-protocol.org | 2026 |
| [^1173^] | zylos.ai - A2A, MCP, ACP, ANP comparison | Feb 15, 2026 |
| [^1174^] | getstream.io - Guide to AI Agent Protocols | Jan 13, 2026 |
| [^1198^] | agensi.io - Best AI Agent Skills Marketplaces | April 20, 2026 |
| [^1199^] | skillsllm.com | 2026 |
| [^1200^] | devopsschool.com - Top 10 AI Game NPC Tools | June 20, 2026 |
| [^1201^] | o-mega.ai - Top 10 AI Agent Skills 2026 | Jan 22, 2026 |
| [^1202^] | serenitiesai.com - Agent Skills Guide 2026 | March 5, 2026 |
| [^1203^] | fundsforngos.org - Swarm Intelligence in MAS | 2026 |
| [^1204^] | github.com/git-disl/awesome-LLM-game-agent-papers | 2026 |
| [^1206^] | vercel.com/blog/vercel-ship-2026-recap | June 17, 2026 |
| [^1207^] | vercel.com/ship/london | 2026 |
| [^1208^] | buttondown.com - Karpathy Agentic Engineering | March 26, 2026 |
| [^1209^] | devblogs.microsoft.com - MAF at BUILD 2026 | June 8, 2026 |
| [^1210^] | dextralabs.com - Top 10 Agentic AI Frameworks | June 15, 2026 |
| [^1211^] | github.com/Zijian-Ni/awesome-ai-agents-2026 | June 9, 2026 |
| [^1212^] | oreilly.com - AI Agents Stack 2026 | June 8, 2026 |
| [^1213^] | langchain.com - Best AI Agent Frameworks 2026 | June 6, 2026 |
| [^1214^] | alphacorp.ai - 8 Best AI Agent Frameworks | March 18, 2026 |
| [^1266^] | github.com/langchain-ai/langgraph/releases | June 18, 2026 |
| [^1267^] | pub.towardsai.net - Durable AI Agents | May 21, 2026 |
| [^1268^] | arxiv.org/pdf/2602.10429 - AIvilization v0 | Feb 2026 |
| [^1269^] | arxiv.org/abs/2602.10429 - AIvilization v0 abstract | Feb 11, 2026 |
| [^1270^] | developers.googleblog.com - ADK for Java 1.0 | March 30, 2026 |
| [^1271^] | inference.sh - Durable Execution for AI Agents | Feb 16, 2026 |
| [^1272^] | researchgate.net - AIvilization v0 paper | Feb 14, 2026 |
| [^1273^] | generative.inc - Mastra AI Complete Guide | June 20, 2026 |
| [^1274^] | flowtivity.ai - OpenClaw vs Hermes comparison | June 14, 2026 |
| [^1275^] | noqta.tn - Mastra TypeScript Guide | May 10, 2026 |
| [^1276^] | arahi.ai - AI Agent Frameworks 2026 | May 18, 2026 |
| [^1277^] | medium.com - Hermes vs OpenClaw | May 22, 2026 |
| [^1278^] | pub.towardsai.net - OpenHuman deep dive | May 13, 2026 |
| [^1280^] | composio.dev - OpenClaw vs Hermes | 2026 |
| [^1281^] | mastra.ai - Announcements | 2026 |
| [^1283^] | hubbvee.com - OpenClaw vs Hermes 2026 | May 25, 2026 |
| [^1284^] | mastra.ai - Changelog Feb 26, 2026 | Feb 26, 2026 |
| [^1285^] | buildfastwithai.com - AI News June 2, 2026 | June 2, 2026 |

---

*Research compiled June 21, 2026. All information sourced from publicly available documentation, GitHub repositories, blog posts, and technical papers. GitHub star counts and download metrics are approximate and subject to rapid change.*
