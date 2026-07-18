# OPERATION EAT — The Complete Agent Framework Catalog
## EVERY AI Agent Framework, Tool, Platform, and Protocol for MEOK's 33 Hives
### Version 1.0 | June 2026 | 80+ Tools Cataloged

---

## Table of Contents

1. [Major Agent Frameworks](#1-major-agent-frameworks)
2. [Multi-Agent Orchestration](#2-multi-agent-orchestration)
3. [Agent Memory Systems](#3-agent-memory-systems)
4. [Agent Communication Protocols](#4-agent-communication-protocols)
5. [Agent Security](#5-agent-security)
6. [Agent Observability](#6-agent-observability)
7. [Agent Deployment](#7-agent-deployment)
8. [Hidden Gems](#8-hidden-gems)
9. [MEOK Stack Integration Matrix](#9-meok-stack-integration-matrix)

---

## 1. Major Agent Frameworks

### 1.1 LangChain / LangGraph
| Field | Details |
|-------|---------|
| **GitHub** | [langchain-ai/langchain](https://github.com/langchain-ai/langchain) / [langgraph](https://github.com/langchain-ai/langgraph) |
| **Stars** | LangChain ~140K / LangGraph ~34K |
| **What it does** | The most widely adopted framework for building LLM-powered applications. LangChain provides modular components for chains, agents, and retrieval. LangGraph adds stateful, cyclic multi-agent orchestration with graph-based workflows. |
| **Maturity** | **Production** — used by Cisco, Uber, LinkedIn, BlackRock, JPMorgan, Klarna |
| **License** | MIT |
| **MEOK Integration** | **Core compatibility.** LangGraph works with Mem0 for memory, E2B for sandboxing, and supports MCP for tool access. Excellent fit for MEOK Hives. |
| **Notes** | 34.5M monthly downloads. 400+ companies use LangGraph Platform in production. Can be complex due to abstraction layers. |

### 1.2 CrewAI
| Field | Details |
|-------|---------|
| **GitHub** | [crewAIInc/crewAI](https://github.com/crewAIInc/crewAI) |
| **Stars** | ~52K (growing fast) |
| **What it does** | Role-based multi-agent orchestration framework. Agents collaborate like human teams with defined roles (Researcher, Writer, Critic, etc.). Supports self-organizing crews and explicit flows. |
| **Maturity** | **Production** — 1.4B+ agentic executions, 60% of Fortune 500 using it |
| **License** | MIT |
| **MEOK Integration** | **Strong.** Works with Mem0 for memory persistence, supports MCP protocol, broad tool integrations (Qdrant, Weaviate, PostgreSQL). |
| **Notes** | 1.8M monthly downloads. 115 OSS releases. CrewAI AMP Suite adds enterprise control plane. Andrew Ng invested. |

### 1.3 Dify.ai
| Field | Details |
|-------|---------|
| **GitHub** | [langgenius/dify](https://github.com/langgenius/dify) |
| **Stars** | ~146K |
| **What it does** | Low-code/no-code platform for building AI agents and workflows. Visual drag-and-drop interface with built-in RAG, Function Calling, and ReAct strategies. |
| **Maturity** | **Production** — top 100 open-source projects globally |
| **License** | AGPL + MIT (mixed) |
| **MEOK Integration** | **Moderate.** Supports 100+ LLMs. Can integrate with Mem0 via API. Visual builder reduces dev overhead for MEOK. |
| **Notes** | Used by enterprises for LLM gateways and rapid prototyping. Document generation and financial report analysis capabilities. |

### 1.4 AutoGPT
| Field | Details |
|-------|---------|
| **GitHub** | [Significant-Gravitas/AutoGPT](https://github.com/Significant-Gravitas/AutoGPT) |
| **Stars** | ~185K (the original) |
| **What it does** | The project that started the modern AI agent movement. Loop architecture (think → act → observe → repeat). Has been rewritten as a visual workflow builder with modular "blocks." |
| **Maturity** | **Stable/Rewritten** — pivoted from recursive agent to low-code visual composition |
| **License** | MIT |
| **MEOK Integration** | **Historical interest.** The stars reflect the original project. Current version is a different product. Consider for reference but not core stack. |
| **Notes** | Raised $12M from GitHub Ventures and Redpoint. Original recursive-LLM model gave way to visual blocks. Competitors have "largely eclipsed" it for production use. |

### 1.5 MetaGPT
| Field | Details |
|-------|---------|
| **GitHub** | [FoundationAgents/MetaGPT](https://github.com/FoundationAgents/MetaGPT) |
| **Stars** | ~64K |
| **What it does** | Multi-agent framework simulating a software company. Agents take roles like Product Manager, Architect, Developer, QA. Follows waterfall model across design, coding, testing, documentation. |
| **Maturity** | **Stable/Research** — active development, strong academic backing |
| **License** | MIT |
| **MEOK Integration** | **Specialized use.** Excellent for software development automation within MEOK Hives. Can generate codebases from natural language specs. |
| **Notes** | Inspired 42+ academic papers. Unique dual-agent design with role reversal for clarifying questions. Mixture-of-experts coordination. |

### 1.6 BabyAGI
| Field | Details |
|-------|---------|
| **GitHub** | [yoheinakajima/babyagi](https://github.com/yoheinakajima/babyagi) |
| **Stars** | ~21K |
| **What it does** | Minimalist Python framework simulating an autonomous AI agent. Task creation, prioritization, and execution loop. Spawned the agent category. |
| **Maturity** | **Archived/Research Sandbox** — archived Sept 2024, relaunched as research tool |
| **License** | MIT |
| **MEOK Integration** | **Educational reference.** Not for production. Good for understanding agent fundamentals. |
| **Notes** | Spawned 42+ academic papers. Now described as "a research tool and sandbox, not production software." Educational value remains high. |

### 1.7 Flowise
| Field | Details |
|-------|---------|
| **GitHub** | [FlowiseAI/Flowise](https://github.com/FlowiseAI/Flowise) |
| **Stars** | ~54K |
| **What it does** | Visual drag-and-drop tool for building LLM and agent workflows. Like Figma for AI backends. Supports LangChain, LlamaIndex, Hugging Face integrations. |
| **Maturity** | **Production** — widely adopted for no-code agent building |
| **License** | Apache 2.0 (with commercial offerings) |
| **MEOK Integration** | **Good for rapid prototyping.** Can export flows as APIs. Integrates with major vector DBs and models. |
| **Notes** | Originally ~12K stars when YC-backed. Built on LangChain. Strong community with Discord. Supports conversational agents with memory, RAG pipelines. |

### 1.8 n8n (with AI)
| Field | Details |
|-------|---------|
| **GitHub** | [n8n-io/n8n](https://github.com/n8n-io/n8n) |
| **Stars** | ~187K (the most starred workflow automation tool) |
| **What it does** | Open-source workflow automation platform with extensive AI integration. AI nodes for calling LLMs, agent-style automation with decision-making. 400+ integrations. |
| **Maturity** | **Production** — enterprise-grade workflow automation |
| **License** | Sustainable Use License (fair-code) |
| **MEOK Integration** | **Strong orchestration layer.** Can trigger MEOK agents, connect to databases, APIs, and AI services. Ideal for business process automation across Hives. |
| **Notes** | Node-based visual builder. AI nodes support OpenAI, Anthropic, and open-source models. Can serve as the "glue" between MEOK Hives. |

### 1.9 OpenHands (formerly OpenDevin)
| Field | Details |
|-------|---------|
| **GitHub** | [OpenHands/OpenHands](https://github.com/OpenHands/OpenHands) |
| **Stars** | ~45K |
| **What it does** | Open-source autonomous coding agent. Software development tasks — writing code, fixing bugs, navigating codebases. The open-source alternative to Devin by Cognition AI. |
| **Maturity** | **Active Development** — strong on SWE-Bench benchmarks |
| **License** | MIT |
| **MEOK Integration** | **Specialized Hive use.** Purpose-built for coding tasks. Sandboxed execution. Can serve as the software engineering Hive within MEOK. |
| **Notes** | Active research backing from academic institutions. Multi-agent system with batch API support being developed. |

### 1.10 Agno (formerly Phidata)
| Field | Details |
|-------|---------|
| **GitHub** | [agno-agi/agno](https://github.com/agno-agi/agno) |
| **Stars** | ~31K |
| **What it does** | Lightning-fast framework for building multi-modal agents. 5000x faster agent instantiation than LangGraph, 50x less memory. Multi-modal (text, image, audio) by default. |
| **Maturity** | **Production** — strong performance claims, growing adoption |
| **License** | MIT |
| **MEOK Integration** | **Excellent for high-concurrency Hives.** Auto-generates FastAPI routes for agents. Teams of agents with knowledge stores. |
| **Notes** | Rebranded from Phidata. Claims 5000x faster than LangGraph. Supports any model, any provider, any modality. |

### 1.11 SmolAgents (Hugging Face)
| Field | Details |
|-------|---------|
| **GitHub** | [huggingface/smolagents](https://github.com/huggingface/smolagents) |
| **Stars** | ~27.7K |
| **What it does** | Minimalist agent framework where LLM writes Python code to complete tasks. Core logic in ~1,000 lines. Code-first "CodeAgent" loop with sandboxed execution. |
| **Maturity** | **Production** — actively maintained by Hugging Face |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Great for simple agents.** Works with Hugging Face models, OpenAI, Anthropic. Fastest path from zero to working agent loop. |
| **Notes** | Released Jan 2025. Not designed for complex multi-agent orchestration. ToolCallingAgent variant for JSON function calling. |

### 1.12 Pydantic AI
| Field | Details |
|-------|---------|
| **GitHub** | [pydantic/pydantic-ai](https://github.com/pydantic/pydantic-ai) |
| **Stars** | ~8.4K |
| **What it does** | Typed Python agent framework built on Pydantic. Type-safe agent inputs and outputs. Structured data validation for agent responses. |
| **Maturity** | **Stable** — from the Pydantic team |
| **License** | MIT |
| **MEOK Integration** | **Good for typed Python Hives.** When type safety and validation are paramount. Minimal abstraction overhead. |
| **Notes** | Supports OpenAI, Anthropic, Gemini, Ollama, Groq. Graph and dependency injection support. |

### 1.13 Devika
| Field | Details |
|-------|---------|
| **GitHub** | [stitionai/devika](https://github.com/stitionai/devika) |
| **Stars** | ~17K |
| **What it does** | Agentic AI software engineer that understands high-level human instructions, breaks them down into steps, researches, and writes code. Alternative to Devin. |
| **Maturity** | **Experimental** — ambitious but less mature than OpenHands |
| **License** | MIT |
| **MEOK Integration** | **Alternative coding agent.** Less mature than OpenHands. Monitor development progress. |
| **Notes** | Open-source alternative to Cognition AI's Devin ($2B valuation). Strong initial interest. |

### 1.14 Google ADK (Agent Development Kit)
| Field | Details |
|-------|---------|
| **GitHub** | [google/adk-python](https://github.com/google/adk-python) |
| **Stars** | ~20K |
| **What it does** | Modular framework for building agents on Google Cloud. Hierarchical agent compositions, custom tools, deep GCP integration (Gemini, Vertex AI). |
| **Maturity** | **Production** — announced April 2025, 3.3M monthly downloads |
| **License** | Apache 2.0 |
| **MEOK Integration** | **GCP-specific.** Best for teams on Google Cloud. Supports MCP, A2A protocols. |
| **Notes** | Used in Google's Agentspace platform. Less than 100 lines for basic agents. Steep learning curve for non-GCP users. |

### 1.15 Mastra
| Field | Details |
|-------|---------|
| **GitHub** | [mastra-ai/mastra](https://github.com/mastra-ai/mastra) |
| **Stars** | ~23K |
| **What it does** | TypeScript-first agent framework. Strong on workflow primitives, integrations with TS observability. The pick for Node.js codebases. |
| **Maturity** | **Production** — growing TypeScript ecosystem |
| **License** | MIT |
| **MEOK Integration** | **TypeScript Hives.** Best for Node.js teams that don't want Python dependencies. |
| **Notes** | TS-only. Growing integration ecosystem. Supports OpenAI, Anthropic, Google, 90+ providers. |

---

## 2. Multi-Agent Orchestration

### 2.1 Microsoft AutoGen
| Field | Details |
|-------|---------|
| **GitHub** | [microsoft/autogen](https://github.com/microsoft/autogen) |
| **Stars** | ~58K |
| **What it does** | Conversational multi-agent framework with event-driven architecture. Group chat between agents with roles. Customizable agent behaviors, error recovery, conversation management. |
| **Maturity** | **Production / Maintenance Mode** — merged into Microsoft Agent Framework |
| **License** | CC-BY-4.0 |
| **MEOK Integration** | **Good but being superseded.** Use Microsoft Agent Framework for new projects. AutoGen in maintenance mode (bug fixes only). |
| **Notes** | 856K monthly downloads. Novo Nordisk uses it for data science. Outperforms single-agent on GAIA benchmarks. |

### 2.2 Microsoft Agent Framework (Unified)
| Field | Details |
|-------|---------|
| **GitHub** | [microsoft/agent-framework](https://github.com/microsoft/agent-framework) |
| **Stars** | ~9.6K |
| **What it does** | Unified successor to AutoGen and Semantic Kernel. Combines conversational multi-agent abstractions with enterprise features. Graph-based workflows, .NET and Python bindings. |
| **Maturity** | **Production** — announced Oct 2025, Microsoft's single orchestration SDK |
| **License** | MIT |
| **MEOK Integration** | **Best for Microsoft-stack Hives.** Azure AI Foundry integration, OpenTelemetry observability, responsible AI guardrails. |
| **Notes** | Supports Python (`pip install agent-framework`) and .NET. Migration assistants from AutoGen and Semantic Kernel included. |

### 2.3 Semantic Kernel
| Field | Details |
|-------|---------|
| **GitHub** | [microsoft/semantic-kernel](https://github.com/microsoft/semantic-kernel) |
| **Stars** | ~27K |
| **What it does** | Enterprise-oriented SDK for building AI agents. "Skills" architecture combining AI prompts with code functions. Multi-language: C#, Python, Java. |
| **Maturity** | **Production** — being merged into Microsoft Agent Framework |
| **License** | MIT |
| **MEOK Integration** | **Azure-native Hives.** Deep Azure OpenAI integration. Enterprise security, compliance, access control. |
| **Notes** | The only framework with first-class C#, Python, and Java support. Will be maintained with bug fixes for 1 year after MAF GA. |

### 2.4 CAMEL-AI / OWL
| Field | Details |
|-------|---------|
| **GitHub** | [camel-ai/camel](https://github.com/camel-ai/camel) / OWL |
| **Stars** | OWL: 11.2K in 5 days (explosive growth) |
| **What it does** | Multi-agent role-play framework with synthetic data generation. OWL is an autonomous general AI agent built on CAMEL. Ranked #1 on GAIA among open-source agents. |
| **Maturity** | **Active Development** — rapidly growing |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Strong for research Hives.** Multi-agent orchestration through browsers, terminals, function calls, MCP tools. |
| **Notes** | Released March 2025. 11.2K stars in 5 days. Supports Docker deployment. |

### 2.5 BeeAI Framework (IBM)
| Field | Details |
|-------|---------|
| **GitHub** | [i-am-bee/beeai-framework](https://github.com/i-am-bee/beeai-framework) |
| **Stars** | Growing (Linux Foundation project) |
| **What it does** | Comprehensive toolkit for building intelligent agents and multi-agent systems. Agents with constraints (rule enforcement). Python and TypeScript. MCP and A2A native. |
| **Maturity** | **Production** — backed by IBM Research, Linux Foundation |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Excellent for MEOK.** Native MCP and A2A support, multi-agent workflows, pluggable observability, works with any LLM provider. |
| **Notes** | Agent Stack platform for deployment. Requirement Agent for predictable behavior. Supports watsonx, Llama, Granite models. |

### 2.6 OpenAI Agents SDK
| Field | Details |
|-------|---------|
| **GitHub** | [openai/openai-agents-python](https://github.com/openai/openai-agents-python) |
| **Stars** | ~22.2K |
| **What it does** | Lightweight, low-abstraction framework for multi-agent workflows using OpenAI APIs. Agent handoffs, tool calling, delegation. Built-in tracing. |
| **Maturity** | **Production** — 10.3M monthly downloads |
| **License** | MIT |
| **MEOK Integration** | **OpenAI-specific Hives.** Minimal API surface, fast prototyping. Integrates with MCP for tool access. |
| **Notes** | Provider-agnostic (supports 100+ LLMs via adapters). Session primitives with SQLite, Redis backends. Pair with Temporal for durability. |

### 2.7 LlamaIndex Workflows
| Field | Details |
|-------|---------|
| **GitHub** | [run-llama/llama-agents](https://github.com/run-llama/llama-agents) |
| **Stars** | ~347 (workflows component) |
| **What it does** | Event-driven orchestration layer for multi-agent systems. Graph of event handlers with typed events. Nested/parallel agent pipelines. |
| **Maturity** | **Production** — strong for document-centric agents |
| **License** | MIT |
| **MEOK Integration** | **Good for RAG-heavy Hives.** Excellent document loading, parsing, retrieval capabilities feeding into orchestrated agent steps. |
| **Notes** | Python-focused. TypeScript workflows deprecated. Deployment via Llama Cloud or containerized self-hosting. |

### 2.8 ChatDev
| Field | Details |
|-------|---------|
| **GitHub** | [OpenBMB/ChatDev](https://github.com/OpenBMB/ChatDev) |
| **Stars** | ~26.7K |
| **What it does** | Multi-agent collaboration framework for automated software development. Simulates a virtual software company (CEO, CTO, Engineer, Designer, Tester). |
| **Maturity** | **Stable** — academic/research focused |
| **License** | MIT |
| **MEOK Integration** | **Software dev Hive.** Waterfall model automation across design, coding, testing, documentation. |
| **Notes** | Uses inception prompting for role fidelity. Dual-agent design for collaboration. Supports natural language and code-based communication. |

### 2.9 Swarms
| Field | Details |
|-------|---------|
| **Description** | Decentralized multi-agent AI and LLM orchestration framework. "Swarm economy" concept for automating large-scale real-world activities. |
| **Maturity** | **Emerging** — ambitious decentralized approach |
| **License** | Varies |
| **MEOK Integration** | **Future consideration.** Decentralized agent coordination aligns with MEOK's distributed Hive architecture. |
| **Notes** | Enterprise-grade scalability claims. Less established than centralized alternatives. |

### 2.10 Evolving Agents Framework
| Field | Details |
|-------|---------|
| **GitHub** | [matiasmolinas/evolving-agents](https://github.com/matiasmolinas/evolving-agents) |
| **Stars** | ~139 HN points (Show HN March 2025) |
| **What it does** | Agents that evolve, communicate, and collaborate. Reuse/evolve/create agents dynamically based on semantic similarity. Continuous improvement from past executions. |
| **Maturity** | **Experimental/POC** — proof of concept stage |
| **License** | Open Source |
| **MEOK Integration** | **Watch closely.** Dynamic agent evolution aligns with MEOK's adaptive Hive concept. |
| **Notes** | HN: "Most agent frameworks require manual orchestration. This allows agents to decide and adapt." Still a draft/POC. |

---

## 3. Agent Memory Systems

### 3.1 Mem0 (THE MEOK STACK)
| Field | Details |
|-------|---------|
| **GitHub** | [mem0ai/mem0](https://github.com/mem0ai/mem0) |
| **Stars** | ~52K |
| **What it does** | Three-tier memory system: user, session, and agent scopes. Hybrid vector + graph + key-value store. Self-editing memory that resolves conflicts (ADD, UPDATE, DELETE, NOOP). |
| **Maturity** | **Production** — $24M Series A (Oct 2025, YC-backed), SOC 2 Type II, HIPAA |
| **License** | Apache 2.0 |
| **MEOK Integration** | **CORE STACK COMPONENT.** This is MEOK's memory layer. 20 vector store backends supported. MCP server integration. 14M+ Python downloads. |
| **Notes** | Extraction pipeline distills conversation into atomic facts. ~48K stars. 67.13% on LOCOMO benchmark. 20 vector store backends (Qdrant, Chroma, Weaviate, Milvus, pgvector, Redis, etc.). |

### 3.2 Zep / Graphiti
| Field | Details |
|-------|---------|
| **GitHub** | [getzep/graphiti](https://github.com/getzep/graphiti) |
| **Stars** | ~5K (Graphiti) |
| **What it does** | Temporal knowledge graph for agent memory. Every fact stored as a knowledge graph node with a validity window. "Kendra loves Adidas (as of March 2026)" — facts have temporal bounds. |
| **Maturity** | **Production** — outperforms MemGPT on DMR benchmark (94.8% vs 93.4%) |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Strong alternative/complement.** Best temporal reasoning. P95 retrieval latency ~300ms with no LLM calls at query time. |
| **Notes** | Invalidates old facts without discarding historical record. 63.8% on LongMemEval vs Mem0's 49.0%. Graphiti open-source for self-hosting. |

### 3.3 Letta (formerly MemGPT)
| Field | Details |
|-------|---------|
| **GitHub** | [letta-ai/letta](https://github.com/letta-ai/letta) |
| **Stars** | ~15.9K |
| **What it does** | Agents as active memory managers. Three memory tiers: core (always in-context), archival (external searchable), recall (conversation history). OS memory management-inspired architecture. |
| **Maturity** | **Production** — $10M seed from Felicis Ventures (Sept 2024), UC Berkeley research |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Alternative agent platform with memory.** Full agent runtime with state management, tool calling, multi-agent coordination. |
| **Notes** | MemGPT paper spent 48 hours atop HN. White-box, model-agnostic. Letta Code (March 2026): memory-first coding agent. |

### 3.4 Hindsight
| Field | Details |
|-------|---------|
| **GitHub** | [vectorize-io/hindsight](https://github.com/vectorize-io/hindsight) |
| **Stars** | ~10K (reached in 4.5 months) |
| **What it does** | Agent memory focused on learning, not just remembering. `reflect` operation synthesizes across memories. Multi-strategy retrieval (semantic + keyword + entity matching). |
| **Maturity** | **Production** — 94.6% retrieval accuracy on LongMemEval (top officially reproduced result) |
| **License** | MIT |
| **MEOK Integration** | **Excellent for learning Hives.** 2-line integration via LLM Wrapper. Embedded PostgreSQL + pgvector. MCP-first design. |
| **Notes** | 10K stars in 4.5 months. Independent benchmark leadership. Built for institutional knowledge. |

### 3.5 Cognee
| Field | Details |
|-------|---------|
| **GitHub** | [topoteretes/cognee](https://github.com/topoteretes/cognee) |
| **Stars** | ~7K |
| **What it does** | Local-first, privacy-critical memory with graph reasoning. Poly-store design: vector search + graph DB (Neo4j, FalkorDB, KuzuDB) + relational metadata. Runs entirely offline via Ollama. |
| **Maturity** | **Stable** — GitHub Secure Open Source program graduate (2025) |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Privacy-focused Hives.** 100% local deployment. 6 lines of code to start. Background Memify Pipeline for enrichment. |
| **Notes** | No managed cloud — self-hosting only. No SOC 2/HIPAA yet. Not for regulated industries without additional work. |

### 3.6 SuperMemory
| Field | Details |
|-------|---------|
| **GitHub** | [supermemoryai/supermemory](https://github.com/supermemoryai/supermemory) |
| **Stars** | Growing |
| **What it does** | Single memory API covering fact extraction, user profile building, contradiction resolution, and selective forgetting. MCP-native integrations with Claude Code, OpenCode. |
| **Maturity** | **Emerging** — younger product, fewer production deployments |
| **License** | Open Source |
| **MEOK Integration** | **Coding agent memory.** Purpose-built for coding agent workflows. Browser extension for personal knowledge. |
| **Notes** | Claims benchmark leadership (self-reported, not independently verified). Explicit forgetting mechanism is genuinely notable. |

### 3.7 Vector Databases for Agent Memory
| Database | GitHub | Stars | Best For |
|----------|--------|-------|----------|
| **Qdrant** | [qdrant/qdrant](https://github.com/qdrant/qdrant) | ~25.7K | High-performance vector search, Rust-based |
| **Chroma** | [chroma-core/chroma](https://github.com/chroma-core/chroma) | ~22.4K | Developer-friendly, embeddings-native |
| **Weaviate** | [weaviate/weaviate](https://github.com/weaviate/weaviate) | ~11K | Graph+vector hybrid, semantic search |
| **Milvus** | [milvus-io/milvus](https://github.com/milvus-io/milvus) | ~40.7K | Enterprise scale, billion-vector datasets |
| **pgvector** | [pgvector/pgvector](https://github.com/pgvector/pgvector) | ~15K | Postgres extension, ACID compliance |
| **Redis** | [redis/redis](https://github.com/redis/redis) | N/A | Real-time caching + vector search |

---

## 4. Agent Communication Protocols

### 4.1 MCP (Model Context Protocol)
| Field | Details |
|-------|---------|
| **GitHub** | [modelcontextprotocol](https://github.com/modelcontextprotocol) (various servers) |
| **Created by** | Anthropic (November 2024) |
| **Governance** | Linux Foundation Agentic AI Foundation (December 2025) |
| **What it does** | Open standard for connecting AI agents to external tools, data sources, and APIs. JSON-RPC 2.0 messaging. "USB-C for AI" — universal plug-and-play for context. |
| **Adoption** | 10,000+ active MCP servers globally, 97M monthly SDK downloads |
| **MEOK Integration** | **CORE PROTOCOL.** Every MEOK Hive should expose tools via MCP. Supports stdio, SSE, HTTP transports. |
| **Key Servers** | GitHub, Slack, Linear, Postgres, SQLite, BigQuery, Filesystem, Cloudflare Workers AI |
| **Notes** | Supported by OpenAI, Google, Microsoft, Anthropic. OAuth 2.0 with RFC 8707 resource binding. Version: 2025-06-18. |

### 4.2 A2A (Agent-to-Agent Protocol)
| Field | Details |
|-------|---------|
| **GitHub** | [google/A2A](https://github.com/google/A2A) |
| **Created by** | Google Cloud (April 2025) |
| **Governance** | Linux Foundation (June 2025) |
| **What it does** | Peer-to-peer protocol for agent discovery and task coordination. Agent Cards (JSON manifests) for capability discovery. HTTP/SSE for communication. |
| **Adoption** | 50+ technology partners: Atlassian, Box, Cohere, MongoDB, PayPal, Salesforce, SAP, ServiceNow |
| **MEOK Integration** | **CORE PROTOCOL for Hive-to-Hive communication.** Enables MEOK Hives to discover and delegate to each other. |
| **Notes** | Complementary to MCP (MCP = agent-to-tool, A2A = agent-to-agent). Supports long-running tasks with progress streaming. Version: 0.3.x trending to 1.0. |

### 4.3 AG-UI (Agent-User Interaction Protocol)
| Field | Details |
|-------|---------|
| **Website** | [docs.ag-ui.com](https://docs.ag-ui.com) |
| **Created by** | CopilotKit partnership with LangGraph and CrewAI |
| **What it does** | Open, event-based protocol standardizing how AI agents connect to user-facing applications. 16 standardized event types. Bidirectional streaming. |
| **MEOK Integration** | **Frontend protocol.** Standardize how MEOK agents connect to web/mobile UIs. Transport agnostic (SSE, WebSockets, webhooks). |
| **Notes** | Partners: LangGraph, CrewAI, OpenAI Agent SDK, Cloudflare Agents, Amazon Bedrock AgentCore. Multi-language SDKs: Kotlin, Go, Dart, Java, Rust, .NET. |

### 4.4 ACP (Agent Communication Protocol)
| Field | Details |
|-------|---------|
| **Created by** | IBM BeeAI (early 2025) |
| **Governance** | Linux Foundation |
| **What it does** | Lightweight REST-based agent messaging. No SDK required. Standard HTTP verbs (GET, POST, PUT, DELETE). MIME-type extensible messages. |
| **MEOK Integration** | **Simple integrations.** Best for quick prototyping, legacy system integration, IoT device management. |
| **Notes** | Merged into A2A under Linux Foundation (Aug 2025). Co-developed with BeeAI platform. Works with curl/Postman. |

### 4.5 ANP (Agent Network Protocol)
| Field | Details |
|-------|---------|
| **Governance** | W3C AI Agent Protocol Community Group |
| **What it does** | "HTTP for the agentic web era." Decentralized identity (W3C DID), end-to-end encryption, JSON-LD graphs. |
| **MEOK Integration** | **Future protocol.** For open-internet agent marketplaces and cross-organization collaboration. |
| **Notes** | Expected W3C specifications: 2026-2027. Post-quantum cryptography support planned. |

### 4.6 OASF (Open Agentic Schema Framework)
| Field | Details |
|-------|---------|
| **What it does** | Standardized schemas for agent capabilities. Uniform data representation across vendors. |
| **MEOK Integration** | **Metadata standardization.** For agent discovery and marketplace ecosystems. |

---

## 5. Agent Security

### 5.1 NeMo Guardrails (NVIDIA)
| Field | Details |
|-------|---------|
| **GitHub** | [NVIDIA/NeMo-Guardrails](https://github.com/NVIDIA/NeMo-Guardrails) |
| **Stars** | ~6.5K |
| **What it does** | Open-source toolkit for adding programmable guardrails to LLM applications. Five rail types: input, dialog, retrieval, execution, output. Colang DSL for defining policies. |
| **Maturity** | **Production** — from NVIDIA, Apache 2.0 |
| **License** | Apache 2.0 |
| **MEOK Integration** | **Essential for production Hives.** Dialog management across conversation flows. Works with LangChain, LangGraph. |
| **Notes** | Supports OpenAI, Azure, Anthropic, HuggingFace, NVIDIA NIM. Colang 1.0 and 2.0. Published at EMNLP 2023. |

### 5.2 Rebuff
| Field | Details |
|-------|---------|
| **GitHub** | [protectai/rebuff](https://github.com/protectai/rebuff) |
| **Stars** | Growing |
| **What it does** | Self-hardening prompt injection detector. 4 layers: heuristics filtering, LLM-based detection, VectorDB of previous attacks, canary tokens for leak detection. |
| **Maturity** | **Alpha/Prototype** — from Protect AI |
| **License** | Open Source |
| **MEOK Integration** | **First line of defense.** Install at API gateway for all MEOK Hives. Learns from attacks over time. |
| **Notes** | Still prototype stage. No complete solution to prompt injection exists. Treat outputs as untrusted regardless. |

### 5.3 LLM Guard
| Field | Details |
|-------|---------|
| **By** | Protect AI |
| **What it does** | Input/Output security for LLM applications. Sanitization, harmful language detection, data leakage prevention, prompt injection resistance. |
| **Maturity** | **Production** |
| **MEOK Integration** | **Security layer for all Hives.** Run on all LLM inputs/outputs. |

### 5.4 Guardrails AI
| Field | Details |
|-------|---------|
| **GitHub** | [guardrails-ai/guardrails](https://github.com/guardrails-ai/guardrails) |
| **What it does** | Input/Output guards that detect, quantify, and mitigate specific risk types. Structured output validation. |
| **Maturity** | **Production** |
| **MEOK Integration** | **Output validation.** Ensure agent outputs conform to expected schemas and safety policies. |

### 5.5 AgentPoison
| Field | Details |
|-------|---------|
| **GitHub** | [AI-secure/AgentPoison](https://github.com/AI-secure/AgentPoison) |
| **What it does** | Research framework for red-teaming LLM agents via memory/knowledge base backdoor poisoning. NeurIPS 2024 paper. |
| **Maturity** | **Research** — academic project |
| **MEOK Integration** | **Security testing.** Use to red-team MEOK Hives. Test memory poisoning defenses. |
| **Notes** | From UC Berkeley, University of Chicago, UIUC. Attack implementation for testing defenses. |

### 5.6 OWASP ASI (Agent Security Initiative)
| Field | Details |
|-------|---------|
| **Resources** | [OWASP AI Security](https://owasp.org/www-project-ai-security/) |
| **What it does** | Industry-standard security framework for AI agents. Covers prompt injection, data poisoning, model extraction, supply chain attacks. |
| **MEOK Integration** | **Compliance baseline.** Align all MEOK Hives with OWASP AI security standards. |

### 5.7 Additional Security Tools
| Tool | What it Does | Maturity |
|------|-------------|----------|
| **Llama Guard** | LLM-based input/output safeguard for human-AI conversations | Production (Meta) |
| **InjecGuard** | Prompt injection guardrail with MOF training strategy | Research |
| **Task Shield** | Test-time defense verifying tool calls against user goals | Research |
| **Taint Tracking** | Monitor untrusted data flow through LLM systems | Research |
| **Dual LLM Pattern** | Privileged + Quarantined LLM instances for security | Pattern |
| **Signed-Prompt** | Cryptographically sign sensitive instructions | Research |
| **Granite Guardian** | IBM's input/output guardrail for agentic workflows | Production (IBM) |

---

## 6. Agent Observability

### 6.1 LangSmith
| Field | Details |
|-------|---------|
| **By** | LangChain team |
| **What it does** | Official observability platform for LangChain/LangGraph. Native integration, comprehensive tracing, evaluation framework, prompt playground, real-time monitoring. |
| **Maturity** | **Production** |
| **MEOK Integration** | **Primary observability for LangGraph Hives.** Single env var setup. Step-level cost attribution. LangGraph Studio v2 for debugging. |
| **Pricing** | Free tier (5K traces/mo); Plus: $39/seat/mo; Enterprise: custom |
| **Notes** | Framework-agnostic via OpenTelemetry. MCP Server for querying traces. AI trace analysis for root cause identification. |

### 6.2 Langfuse
| Field | Details |
|-------|---------|
| **GitHub** | [langfuse/langfuse](https://github.com/langfuse/langfuse) |
| **Stars** | Thousands of deployments |
| **What it does** | Open-source LLM engineering platform. Comprehensive tracing, flexible evaluations, self-hosting, cost tracking, dataset creation. |
| **Maturity** | **Production** — open-source, self-hostable |
| **License** | MIT |
| **MEOK Integration** | **Open-source observability.** Self-host for data governance. Native LangGraph, LlamaIndex, OpenAI Agents SDK support. |
| **Notes** | Free tier. Strong for teams requiring self-hosted solutions. Active community. |

### 6.3 Arize Phoenix
| Field | Details |
|-------|---------|
| **GitHub** | [arize-ai/phoenix](https://github.com/arize-ai/phoenix) |
| **Stars** | Strong enterprise adoption |
| **What it does** | Open-source AI observability platform. OpenTelemetry-native tracing, evaluation, datasets, experiments, playground, prompt management. |
| **Maturity** | **Production** — open-source + commercial (Arize AX) |
| **License** | Apache 2.0 |
| **MEOK Integration** | **OTel-native observability.** 7 span types for agent workflows. Framework-agnostic via OpenInference. |
| **Notes** | Supports 10 span kinds: CHAIN, LLM, TOOL, RETRIEVER, EMBEDDING, AGENT, RERANKER, GUARDRAIL, EVALUATOR. Auto-instrumentation for major frameworks. |

### 6.4 AgentOps
| Field | Details |
|-------|---------|
| **What it does** | Agent monitoring and observability. Track agent sessions, API calls, tokens. Performance metrics and debugging. |
| **Maturity** | **Production** |
| **MEOK Integration** | **Agent-specific monitoring.** Purpose-built for agent workflows rather than general LLM observability. |

### 6.5 Galileo
| Field | Details |
|-------|---------|
| **What it does** | AI reliability platform with proprietary Evaluation Foundation Models (EFMs). Agent-specific metrics: tool selection quality, error detection, session success. Luna-2 guardrails. |
| **Maturity** | **Production** — acquired by Cisco/Splunk (May 2026) |
| **MEOK Integration** | **Evaluation + guardrails.** Research-backed metrics achieving 93-97% accuracy. |
| **Notes** | Founded by Google AI, Apple Siri, Google Brain veterans. $68M raised. Agentic Evaluations launched Jan 2025. |

### 6.6 Helicone
| Field | Details |
|-------|---------|
| **What it does** | Minimal-friction observability. One-line integration (change API base URL). LLM gateway with routing, caching (20-30% cost reduction), automatic failover. |
| **Maturity** | **Production** — generous free tier |
| **MEOK Integration** | **Quick-start observability.** Up and running in under 30 minutes. |
| **Notes** | Also functions as LLM gateway. 300+ model pricing database. Maintenance mode as of 2026. |

### 6.7 Maxim AI
| Field | Details |
|-------|---------|
| **What it does** | End-to-end platform: simulation + evaluation + observability. Agent simulation for pre-release testing, production monitoring, cross-functional collaboration. |
| **Maturity** | **Production** — SOC2, HIPAA, GDPR |
| **MEOK Integration** | **Full lifecycle management.** Simulation for testing MEOK Hives before deployment. |
| **Notes** | Includes Bifrost (open-source LLM gateway). $29/seat/mo starting price. |

### 6.8 Fiddler
| Field | Details |
|-------|---------|
| **What it does** | Enterprise AI observability with real-time guardrails. Sub-100ms safety scoring for hallucinations, toxicity, PII leakage, prompt injection. |
| **Maturity** | **Enterprise** — Gartner recognized |
| **MEOK Integration** | **Regulated industry Hives.** Real-time safety evaluation of 100% of traffic. |
| **Notes** | Gartner Market Guide for AI Evaluation. IDC ProductScape 2025. Enterprise pricing. |

---

## 7. Agent Deployment

### 7.1 E2B (THE MEOK STACK)
| Field | Details |
|-------|---------|
| **GitHub** | [e2b-dev/E2B](https://github.com/e2b-dev/E2B) |
| **Stars** | ~8.9K |
| **What it does** | Open-source secure cloud runtime for AI agents. Sandboxed cloud environments powered by Firecracker microVMs. Safe execution of AI-generated code. |
| **Maturity** | **Production** — Apache 2.0, SOC 2 |
| **License** | Apache 2.0 |
| **MEOK Integration** | **CORE STACK COMPONENT.** Every MEOK agent runs in an E2B sandbox. Secure code execution, filesystem isolation, network policies. |
| **Notes** | Custom Sandboxes feature launched Nov 2023. Partnership with Groq (April 2025). Self-hosting guide and Terraform scripts available. Supports GCP, AWS in progress. |

### 7.2 Daytona
| Field | Details |
|-------|---------|
| **Website** | [daytona.io](https://daytona.io) |
| **What it does** | Secure, elastic infrastructure for AI-generated code. Full composable computers (sandboxes) with complete isolation. Spin up in under 90ms. Unlimited persistence. |
| **Maturity** | **Production** — OCI/Docker compatible |
| **MEOK Integration** | **Alternative to E2B.** Persistent agent operations across sessions. Multi-language SDKs (TypeScript, Python, Ruby, Go, Java). |
| **Notes** | Stateless environment snapshots for persistent agents. RESTful API + Toolbox API. Ideal for long-running agent architectures. |

### 7.3 Modal
| Field | Details |
|-------|---------|
| **What it does** | Serverless compute for ML/AI workloads. Deploy Python functions as serverless endpoints. GPU support, instant cold starts, persistent volumes. |
| **Maturity** | **Production** — popular for AI deployment |
| **MEOK Integration** | **Serverless agent hosting.** Deploy agent functions as serverless endpoints with GPU access when needed. |
| **Notes** | Python-native. Strong for ML inference and agent task execution. Pay-per-use pricing. |

### 7.4 AWS Bedrock AgentCore
| Field | Details |
|-------|---------|
| **What it does** | Serverless compute built for agent workloads. AgentCore Runtime + Gateway + Identity. Managed code interpreter, policy controls (CEDAR language). |
| **Maturity** | **GA (re:Invent 2025)** |
| **MEOK Integration** | **AWS-native deployment.** Identity propagates OAuth2 scopes through MCP calls. Quality evaluations built-in. |
| **Notes** | Accepts zip and container artifacts. Long-term episodic memory. Bidirectional streaming for voice. |

### 7.5 Fly.io
| Field | Details |
|-------|---------|
| **What it does** | Platform for running applications close to users. Docker containers, instant deploy, global edge network. |
| **Maturity** | **Production** |
| **MEOK Integration** | **Agent hosting.** Deploy persistent agents globally. Good for low-latency agent responses. |

### 7.6 Agent Stack (BeeAI)
| Field | Details |
|-------|---------|
| **GitHub** | [i-am-bee/agentstack](https://github.com/i-am-bee/agentstack) |
| **What it does** | Open infrastructure for deploying and sharing agents. Instant agent UI, effortless deployment (container to production), multi-provider playground. |
| **Maturity** | **Production** — Linux Foundation project |
| **MEOK Integration** | **Framework-agnostic deployment.** Run agents from LangChain, CrewAI, BeeAI on single platform. |
| **Notes** | Framework-agnostic. Database, storage, scaling, RAG handled by platform. |

### 7.7 Vercel AI SDK
| Field | Details |
|-------|---------|
| **What it does** | SDK for building AI applications on Vercel/Next.js. Streaming, caching, model abstraction. Edge deployment. |
| **Maturity** | **Production** — $863M funded |
| **MEOK Integration** | **Frontend + agent hosting.** Build AI apps that interact with MEOK Hives. Edge-cached inference. |

### 7.8 AWS Lambda + Fargate for Agents
| Field | Details |
|-------|---------|
| **What it does** | Three deployment patterns: Lambda (lowest barrier), Fargate (container workflows), AgentCore (purpose-built for agents). |
| **Maturity** | **Production** |
| **MEOK Integration** | **AWS deployment options.** Lambda for simple agents, Fargate for containerized workflows, AgentCore for agent-native deployment. |

---

## 8. Hidden Gems

### 8.1 Browser-Use
| Field | Details |
|-------|---------|
| **GitHub** | [browser-use/browser-use](https://github.com/browser-use/browser-use) |
| **Stars** | ~93K (category leader for browser automation) |
| **What it does** | Make websites accessible for AI agents. Browser automation framework. Rust core + browser harness. |
| **Maturity** | **Production** — explosive growth (66K in first month) |
| **MEOK Integration** | **Web-interacting Hives.** Enable MEOK agents to navigate websites, fill forms, extract data. |
| **Notes** | Released June 2025. 93K stars. Frontier model action space. Persistent tools and recovery loops. |

### 8.2 OpenAI Computer Use
| Field | Details |
|-------|---------|
| **GitHub** | [anthropics/anthropic-quickstarts](https://github.com/anthropics/anthropic-quickstarts) (computer-use-demo) |
| **What it does** | Claude can control computers: look at screen, move cursor, click, type. First frontier model with computer use in public beta. |
| **Maturity** | **Production** — available via API, Bedrock, Vertex AI |
| **MEOK Integration** | **Computer-control Hives.** Agents that can interact with desktop applications and UIs. |
| **Notes** | Used by Asana, Canva, Cognition, DoorDash, Replit. Docker container with VNC. Requires sandboxing for safety. |

### 8.3 OWL (CAMEL-AI)
| Field | Details |
|-------|---------|
| **GitHub** | [camel-ai/owl](https://github.com/camel-ai/owl) |
| **Stars** | 11.2K in 5 days |
| **What it does** | Autonomous general AI agent. Ranked #1 on GAIA benchmark among open source (58.18%). Multi-agent collaboration through browsers, terminals, MCP tools. |
| **Maturity** | **Active/Explosive Growth** |
| **MEOK Integration** | **High-potential general agent.** Watch for production readiness. |

### 8.4 fast-agent
| Field | Details |
|-------|---------|
| **GitHub** | MCP-native agent framework |
| **What it does** | First MCP-native agent framework. Compose MCP-enabled agents and workflows in minutes. Parallel model usage. |
| **Maturity** | **Emerging** — launched March 2025 |
| **MEOK Integration** | **MCP-native development.** Purpose-built for the MCP ecosystem. |
| **Notes** | Show HN March 2025. Featured in DEV.to "50 Just-Released GitHub Repos." CLI + Python setup. |

### 8.5 TinyAgent / Tiny Agent
| Field | Details |
|-------|---------|
| **What it does** | Production-ready LLM Agent SDK. Minimal but complete. "Tiny but mighty" approach. |
| **Maturity** | **Emerging** |
| **MEOK Integration** | **Lightweight agents.** For simple, focused agent tasks with minimal overhead. |

### 8.6 Multi-GPT
| Field | Details |
|-------|---------|
| **What it does** | Multi-agent framework with shared memory and coordination patterns. |
| **Maturity** | **Experimental** |
| **MEOK Integration** | **Alternative orchestration.** Lightweight multi-agent without heavy framework dependencies. |

### 8.7 Sim.ai
| Field | Details |
|-------|---------|
| **GitHub** | ~17K stars |
| **What it does** | Visual agent workflow builder. Drag-and-drop interface for connecting models, APIs, databases. |
| **Maturity** | **Stable** — open-source, self-hostable |
| **MEOK Integration** | **No-code agent building.** For non-technical team members to build MEOK workflows. |

### 8.8 Coze Studio (ByteDance)
| Field | Details |
|-------|---------|
| **GitHub** | ~17.9K stars |
| **What it does** | Visual agent builder from ByteDance. Multi-model support, one-click deployment, local and cloud. |
| **Maturity** | **Production** — from ByteDance |
| **MEOK Integration** | **Alternative to Flowise.** Good for teams wanting visual agent building with Chinese language support. |

### 8.9 Anything-LLM
| Field | Details |
|-------|---------|
| **GitHub** | ~50K stars |
| **What it does** | Full-featured AI platform: chatbots, retrieval, agents, RAG. Document-based chat, multi-model flexibility, plugin system. |
| **Maturity** | **Production** — strong for private/local deployment |
| **MEOK Integration** | **Private AI deployment.** Ideal for data-sensitive environments. Local model support via Ollama. |

### 8.10 GPT-Researcher
| Field | Details |
|-------|---------|
| **GitHub** | [assafelovic/gpt-researcher](https://github.com/assafelovic/gpt-researcher) |
| **Stars** | ~27K |
| **What it does** | Autonomous agent conducting deep research on any topic using any LLM. Iterative research with source aggregation. |
| **Maturity** | **Production** |
| **MEOK Integration** | **Research Hive.** Deep research automation with cited sources. |

### 8.11 Khoj
| Field | Details |
|-------|---------|
| **GitHub** | [khoj-ai/khoj](https://github.com/khoj-ai/khoj) |
| **Stars** | ~34K |
| **What it does** | Self-hostable AI second brain. Get answers from the web or your documents. Open-source. |
| **Maturity** | **Production** — strong self-hosting story |
| **MEOK Integration** | **Personal knowledge management.** Self-hostable alternative to commercial knowledge bases. |

### 8.12 auto-deep-researcher-24x7
| Field | Details |
|-------|---------|
| **GitHub** | [Xiangyue-Zhang/auto-deep-researcher-24x7](https://github.com/Xiangyue-Zhang/auto-deep-researcher-24x7) |
| **What it does** | Autonomous AI agent running deep learning experiments 24/7. Zero-cost monitoring, leader-worker architecture. |
| **Maturity** | **Research/Experimental** |
| **MEOK Integration** | **Autonomous research Hive.** Runs experiments while you sleep. ~$0.08/day LLM cost. |
| **Notes** | 500+ autonomous experiment cycles completed. 52% improvement over baseline across 200+ experiments. |

### 8.13 BeeAI Agent Stack (IBM)
| Field | Details |
|-------|---------|
| **GitHub** | [i-am-bee/agentstack](https://github.com/i-am-bee/agentstack) |
| **What it does** | Open infrastructure for deploying and sharing agents. Framework-agnostic, instant UI, effortless deployment. |
| **Maturity** | **Production** — Linux Foundation |
| **MEOK Integration** | **Multi-framework deployment.** Deploy agents from different frameworks on one platform. |

### 8.14 Lyzr
| Field | Details |
|-------|---------|
| **What it does** | Multi-agent orchestration and observability. Connect specialized agents, track performance, manage context memory. |
| **Maturity** | **Production** — $8M funded |
| **MEOK Integration** | **Enterprise multi-agent management.** For large companies managing multi-agent systems. |

### 8.15 Ratine
| Field | Details |
|-------|---------|
| **What it does** | Agent memory poisoning detector. Scans persistent memory for injected instructions, hidden payloads, credential leakage, belief drift. |
| **Maturity** | **Emerging** — zero dependencies |
| **MEOK Integration** | **Memory security.** Protect MEOK agent memory from poisoning attacks. Fits Mem0, LangChain, custom memory. |

### 8.16 Memory Defense Tools
| Tool | What it Does |
|------|-------------|
| **memdef** | Memory defense for AI agents — stops MINJA, AgentPoison, MemoryGraft attacks |
| **AARF Detector** | Agentic AI Request Forgery detection — planner→memory→plugin chaining vulnerability scanner |
| **OpenMemory MCP** | mem0's open standard for universal, portable memory across AI applications |

---

## 9. MEOK Stack Integration Matrix

### Core MEOK Stack Components
| Layer | Technology | Role in MEOK |
|-------|-----------|--------------|
| **Memory** | Mem0 | Core memory layer — all Hives use this |
| **Sandbox** | E2B | Code execution isolation — all agents run here |
| **Orchestration** | LangGraph + CrewAI | Agent workflow orchestration |
| **Protocols** | MCP + A2A | Tool access + Hive-to-Hive communication |
| **Observability** | Arize Phoenix + LangSmith | Tracing, evaluation, monitoring |
| **Security** | NeMo Guardrails + Rebuff | Guardrails + prompt injection defense |
| **Deployment** | E2B + Daytona | Persistent, secure agent environments |

### Integration Priority Map

**Tier 1 — Essential (Deploy First)**
- LangGraph / CrewAI (orchestration)
- Mem0 (memory)
- E2B (sandbox)
- MCP (tool protocol)
- A2A (agent protocol)
- Arize Phoenix (observability)
- NeMo Guardrails (security)

**Tier 2 — Important (Deploy Within 30 Days)**
- Rebuff (prompt injection defense)
- LangSmith (LangChain-specific observability)
- Zep / Graphiti (temporal memory for time-sensitive Hives)
- Daytona (persistent agent environments)
- LLM Guard (input/output security)

**Tier 3 — Specialized (Deploy As Needed)**
- Letta (self-managing agent memory)
- Hindsight (learning-focused memory)
- Cognee (privacy-critical, local-first memory)
- OpenHands (coding agent)
- Browser-Use (web automation)
- Computer Use (desktop control)

**Tier 4 — Watch List (Monitor for Maturity)**
- Evolving Agents Framework
- ANP (Agent Network Protocol)
- Ratine (memory poisoning detection)
- fast-agent (MCP-native framework)
- auto-deep-researcher-24x7

### MEOK 33 Hives — Recommended Framework Mapping

| Hive Category | Primary Framework | Memory | Sandbox | Protocol |
|--------------|------------------|--------|---------|----------|
| Software Engineering | OpenHands + MetaGPT | Mem0 | E2B | MCP |
| Research | GPT-Researcher + OWL | Mem0 + Hindsight | E2B | MCP + A2A |
| Data Analysis | Agno + SmolAgents | Mem0 | E2B | MCP |
| Content Creation | CrewAI | Mem0 | E2B | MCP |
| DevOps | LangGraph + AutoGen | Mem0 | E2B | A2A |
| Security | Custom + NeMo Guardrails | Mem0 | E2B | MCP |
| Web Automation | Browser-Use | Mem0 | E2B | MCP |
| Desktop Automation | Computer Use | Mem0 | Daytona | MCP |
| General Purpose | CrewAI + LangGraph | Mem0 | E2B | MCP + A2A |

---

## Appendix: Market Statistics

| Metric | Value |
|--------|-------|
| Global AI Agent Market (2025) | $7.84 billion |
| Projected Market (2030) | $52.62 billion |
| CAGR (2025-2030) | 46.3% |
| Enterprise apps with AI agents (2026) | 40% (Gartner) |
| Companies running agents in production | 51% (LangChain 2025 report) |
| Companies planning to scale agents | 78% |
| CrewAI agentic executions | 1.4 billion+ |
| MCP monthly SDK downloads | 97 million |
| Active MCP servers globally | 10,000+ |
| A2A technology partners | 50+ |

---

## Appendix: Research Methodology

This catalog was compiled using:
- GitHub API data (stars, forks, downloads, commit activity)
- Framework documentation and official websites
- Industry reports (Gartner, Markets and Markets, LangChain State of AI Agents)
- Hacker News, Reddit r/LocalLLaMA, and developer community discussions
- Academic papers (NeurIPS, EMNLP, arXiv)
- Official blog posts and release announcements
- Commercial platform evaluations and benchmarks

**Last Updated:** June 2026
**Tools Cataloged:** 80+
**Categories:** 8

---

*OPERATION EAT — The Complete Agent Framework Hunt*
*Built for MEOK's 33 Hives*
*"We miss NOTHING."*
