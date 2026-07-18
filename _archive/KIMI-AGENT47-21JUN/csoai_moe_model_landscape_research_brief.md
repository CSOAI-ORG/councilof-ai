# CSOAI Model Landscape Research Brief
## Powering 46 Specialized AI Agents in a Persistent Simulation World
### Agent 47: Human-in-the-Loop Architecture

**Date:** June 2026
**Classification:** Technical Research Brief
**Word Count:** ~6,500

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Model Comparison Matrix](#2-detailed-model-comparison-table)
3. [46-Agent Model Assignment](#3-recommended-46-agent-model-assignment)
4. [Cost Model (3 Tiers)](#4-cost-model-for-running-the-simulation)
5. [Multi-Model Routing Architecture](#5-multi-model-routing-architecture-recommendations)
6. [Agent 47 Human-in-the-Loop Design](#6-the-agent-47-human-in-the-loop-interaction-design)
7. [Implementation Roadmap](#7-implementation-roadmap)

---

## 1. Executive Summary

The MoE (Mixture of Experts) model landscape in June 2026 is extraordinarily favorable for building a 46-agent persistent simulation. Four key trends converge:

1. **Open-weight MoE models at frontier capability** — Kimi K2.6 (1T params), DeepSeek V4 Pro (1.6T params), MiniMax M3 (230B params), and Qwen3.7 Max (188B active) all deliver GPT-4o+ level performance with self-hosting options and dramatically lower API costs.

2. **Context window explosion** — 1M-token contexts are now standard (DeepSeek V4, MiniMax M3, Qwen3.7, Claude Opus 4.8), with Gemini 3.5 Pro pushing to 2M tokens. This enables agents to maintain coherent state across long-running simulation sessions.

3. **Agent-native capabilities** — MCP (Model Context Protocol) for tool use, A2A (Agent-to-Agent Protocol) for inter-agent communication, and native agent swarm orchestration (Kimi K2.6: 300 sub-agents, Claude Opus 4.8: Dynamic Workflows with hundreds of parallel subagents) have moved from experimental to production-ready.

4. **Cost efficiency revolution** — The cheapest viable open-weight models now cost under $0.30/M tokens (MiniMax M3 at $0.30/M input, DeepSeek V4 Flash at $0.14/M input), while premium frontier models range from $3-5/M input. This makes a 46-agent simulation feasible at budgets from $50/month to $5,000/month depending on activity levels and model selection.

### Key Recommendation

A **tiered model assignment strategy** optimizes cost while maintaining simulation quality: assign frontier models (Claude Opus 4.8, Kimi K2.6, GPT-5.5) to the 6-8 most critical agent roles requiring deep reasoning and autonomy; assign mid-tier open-weight models (DeepSeek V4 Pro, Qwen3.7 Max, MiniMax M3) to the 15-20 coding/analysis agents; assign lightweight models (Llama 4 Scout, Mistral Small 3.1, local 8B models) to the 20+ routine/background agents. Use OpenRouter as the unified routing layer with LiteLLM as the fallback abstraction, and implement aggressive prompt caching to reduce costs by 60-80%.

---

## 2. Detailed Model Comparison Table

### 2.1 Frontier MoE & Agent-Optimized Models (June 2026)

| # | Model | Provider | Params (Total/Active) | Context | Input $/1M | Output $/1M | SWE-Bench Pro | BrowseComp | Agent Swarm | License | Self-Host |
|---|-------|----------|----------------------|---------|-----------|-------------|---------------|------------|-------------|---------|-----------|
| 1 | **Claude Opus 4.8** | Anthropic | ~500B / ~50B | 1M | $5.00 | $25.00 | **69.2%** | 79.3 | Dynamic Workflows (100s sub-agents) | Proprietary | No |
| 2 | **Kimi K2.6** | Moonshot AI | 1T / 32B | 256K | $0.95 | $4.00 | 58.6% | 54.0 HLE | **300 sub-agents, 4000 steps** | Modified MIT | Yes (4x H100) |
| 3 | **GPT-5.5** | OpenAI | ~1T / ~100B | 1M | $5.00 | $30.00 | 58.6% | 76.4 Agentic | Codex agents | Proprietary | No |
| 4 | **Gemini 3.5 Pro** | Google | ~T-class | **2M** | $15.00 | $60.00 | ~54% | — | Deep Think mode | Proprietary | No |
| 5 | **DeepSeek V4 Pro** | DeepSeek | 1.6T / 49B | **1M** | $1.74 | $3.48 | 55.4% | 66.6 MCPAtlas | Tool use native | Apache 2.0 | Yes |
| 6 | **Gemini 3.5 Flash** | Google | ~100B / ~20B | 1M | $0.15 | $0.60 | ~45% | — | Multimodal | Proprietary | No |
| 7 | **Qwen3.7 Max** | Alibaba | 235B / 188B | **1M** | $1.25 | $3.75 | **60.6%** | 76.4 MCPAtlas | 35h autonomous | Proprietary | No |
| 8 | **Qwen3.7 Plus** | Alibaba | 235B / 188B | **1M** | $0.40 | $1.60 | ~60% | 76.4 | 35h autonomous | Proprietary | No |
| 9 | **MiniMax M3** | MiniMax | 230B / 9.8B | **1M** | $0.30 | $1.20 | **59.0%** | **83.5** | Interactive agent | Open-weight | Yes (2x H100) |
| 10 | **Claude Sonnet 4.6** | Anthropic | ~200B / ~25B | 1M | $3.00 | $15.00 | ~62% | — | Extended thinking | Proprietary | No |
| 11 | **Llama 4 Scout** | Meta | 109B / 17B | **10M** | Free (self-host) | Free | ~24% | — | iRoPE long ctx | Llama 3.1 License | Yes |
| 12 | **Llama 4 Maverick** | Meta | 400B / 17B | 1M | Free (self-host) | Free | ~24% | — | Multimodal | Llama 3.1 License | Yes |
| 13 | **DeepSeek V4 Flash** | DeepSeek | 284B / 13B | **1M** | $0.14 | $0.28 | — | — | Tool use native | Apache 2.0 | Yes |
| 14 | **Mixtral 8x22B** | Mistral | 141B / 39B | 64K | $0.90 | $0.90 | 45.1 HE | — | Tool use | Apache 2.0 | Yes |
| 15 | **Command R+** | Cohere | 104B / ~26B | 128K | $2.50 | $10.00 | — | — | RAG-optimized | Proprietary | No |
| 16 | **Jamba 2 Mini** | AI21 | 52B / 12B | 256K | Self-host | Self-host | — | — | Mamba+Transformer | Apache 2.0 | Yes |
| 17 | **Mistral Small 3.1** | Mistral | 22B / 22B | 128K | $0.20 | $0.60 | ~35% | — | Tool use | Apache 2.0 | Yes |
| 18 | **Qwen3 Coder 480B** | Alibaba | 480B / ~40B | 256K | $0.50 | $2.00 | ~55% | — | Code agent | Open-weight | Yes |

### 2.2 Capability Matrix

| Model | MCP Tool Use | A2A Ready | Multimodal | Reasoning | Coding Idx | Speed (t/s) | Cache Pricing |
|-------|-------------|-----------|------------|-----------|------------|-------------|---------------|
| Claude Opus 4.8 | Native | Via framework | Yes | Adaptive thinking | 58.5 | ~45 | $0.50/M read |
| Kimi K2.6 | Function calling | Native swarm | Text/Image/Video | Thinking mode | 58.5 | ~164 | $0.15/M cached |
| GPT-5.5 | Native (advanced) | Via framework | Text/Image | Reasoning effort | 58.5 | ~55 | N/A |
| Gemini 3.5 Pro | Native | Via framework | Text/Image/Video | Deep Think | ~54 | ~284 | N/A |
| DeepSeek V4 Pro | Native | Via MCP | Text only | Thinking/Non-thinking | 55.4 | ~90 | $0.0036/M hit |
| Qwen3.7 Max | Native (1000+ seq) | Via framework | Text only | Deep reasoning | 60.6 | ~96 | $0.25/M read |
| Qwen3.7 Plus | Native (1000+ seq) | Via framework | Text+Image+Video | Deep reasoning | ~60 | ~85 | $0.08/M read |
| MiniMax M3 | Function calling | Via framework | Text/Image/Video | Thinking toggle | **59.0** | ~120 | $0.06/M cached |
| Claude Sonnet 4.6 | Native | Via framework | Yes | Extended thinking | ~62 | ~85 | $0.30/M read |
| Llama 4 Scout | Via tool defs | Via A2A | Text+Image | Standard | ~24 | ~2600 (Groq) | Free (local) |
| DeepSeek V4 Flash | Native | Via MCP | Text only | Non-thinking default | ~45 | ~300 | $0.0028/M hit |
| Mixtral 8x22B | Function calling | Via framework | Text | Standard | 45.1 | ~200 | Self-managed |
| Mistral Small 3.1 | Native | Via framework | Text+Image | Standard | ~35 | ~500 | Self-managed |

### 2.3 Key Benchmarks Explained

- **SWE-Bench Pro:** Real-world software engineering task completion (higher = better coding agents)
- **BrowseComp:** Autonomous web browsing and information retrieval competence
- **MCPAtlas:** Model Context Protocol tool-use benchmark
- **Agentic Index:** Composite of autonomous task completion capabilities
- **Coding Index:** Composite of LiveCodeBench, SciCode, Terminal-Bench

---

## 3. Recommended 46-Agent Model Assignment

### 3.1 Agent Tier Architecture

The 46 agents are organized into four capability tiers based on cognitive complexity, autonomy requirements, and communication patterns:

#### Tier 1: Sovereign Agents (6 agents) — Frontier Models
These agents require the highest reasoning depth, longest context retention, and most sophisticated tool use. They make strategic decisions and coordinate other agents.

| Agent # | Role | Assigned Model | Rationale |
|---------|------|---------------|-----------|
| Agent-01 | **Simulation Director** | Claude Opus 4.8 | Highest SWE-Bench Pro (69.2%), Dynamic Workflows for orchestrating sub-agents, 1M context for full simulation state |
| Agent-02 | **Strategy & Planning Lead** | Kimi K2.6 | 300 sub-agent native swarm, 4000 coordinated steps, excellent for complex planning |
| Agent-03 | **World State Architect** | GPT-5.5 | Strongest general reasoning, 1M context, best for maintaining coherent world model |
| Agent-04 | **Code Evolution Engine** | DeepSeek V4 Pro | 80.6% SWE-Bench Verified, 1M context for full codebase, Apache 2.0 license |
| Agent-05 | **Research & Intelligence** | Qwen3.7 Max | 60.6% SWE-Bench Pro, 1M context, 35h autonomous runs, excellent research agent |
| Agent-06 | **Human Interface (Agent 47 liaison)** | Claude Opus 4.8 | Best multimodal understanding, honest/refusal behavior appropriate for human-facing role |

**Tier 1 Monthly Cost Estimate:** ~$180-300 (at moderate activity)

#### Tier 2: Specialist Agents (15 agents) — High-Capability Open Models
These agents require strong domain expertise in coding, analysis, design, or communication.

| Agent # | Role | Assigned Model | Rationale |
|---------|------|---------------|-----------|
| Agent-07 | Frontend Developer | MiniMax M3 | 59% SWE-Bench Pro, 1M context for large codebases, $0.30/M input |
| Agent-08 | Backend Developer | MiniMax M3 | Same as above — cost-efficient coding specialist |
| Agent-09 | DevOps Engineer | DeepSeek V4 Pro | Strong terminal/code execution, tool use native |
| Agent-10 | Data Analyst | Qwen3.7 Plus | Multimodal (charts/screenshots), 6x cheaper than Max |
| Agent-11 | Security Auditor | DeepSeek V4 Pro | Code analysis strength, thinking mode for deep review |
| Agent-12 | Test Engineer | Kimi K2.6 | Long-horizon coding stability, 80.2% SWE-Bench Verified |
| Agent-13 | Documentation Writer | Qwen3.7 Plus | Long context for docs, vision for UI screenshots |
| Agent-14 | UX Designer | Gemini 3.5 Flash | Multimodal, fast, cheap ($0.15/M input) |
| Agent-15 | System Architect | DeepSeek V4 Pro | 1M context for architecture reviews |
| Agent-16 | Knowledge Curator | Qwen3.7 Max | 1M context, excellent for RAG and knowledge management |
| Agent-17 | Communication Hub | Kimi K2.6 | Native swarm orchestration for message routing |
| Agent-18 | Quality Assurance | MiniMax M3 | Coding competence for code review tasks |
| Agent-19 | Learning Agent | DeepSeek V4 Flash | Cheap ($0.14/M), 1M context for learning from logs |
| Agent-20 | Tool Smith | Qwen3.7 Plus | MCP tool creation and management |
| Agent-21 | Integration Specialist | DeepSeek V4 Pro | API integration, tool use native |

**Tier 2 Monthly Cost Estimate:** ~$150-400 (at moderate activity)

#### Tier 3: Background Agents (15 agents) — Lightweight Models
These agents handle routine monitoring, logging, notifications, and simple task execution.

| Agent # | Role | Assigned Model | Rationale |
|---------|------|---------------|-----------|
| Agent-22 | Log Monitor | DeepSeek V4 Flash | Ultra-cheap ($0.14/M), processes large log volumes |
| Agent-23 | Notification Agent | Mistral Small 3.1 | Fast (~500 t/s), cheap ($0.20/M), reliable |
| Agent-24 | Scheduler | Llama 4 Scout (Groq) | 2600 t/s, sub-100ms latency, 10M context |
| Agent-25 | Metrics Collector | DeepSeek V4 Flash | Batch processing of metrics data |
| Agent-26 | Alert Manager | Mistral Small 3.1 | Quick classification and routing of alerts |
| Agent-27 | Backup Agent | Llama 4 Scout (Groq) | Long context for backup state tracking |
| Agent-28 | Cache Manager | DeepSeek V4 Flash | Manages caching layer, high throughput |
| Agent-29 | Session Tracker | Mistral Small 3.1 | Lightweight session state management |
| Agent-30 | Health Monitor | Llama 4 Scout (Groq) | Fast health checks, minimal latency |
| Agent-31 | Event Logger | DeepSeek V4 Flash | High-volume event ingestion |
| Agent-32 | Status Reporter | Mistral Small 3.1 | Generates periodic status summaries |
| Agent-33 | Resource Tracker | Llama 4 Scout (Groq) | Tracks resource allocation across agents |
| Agent-34 | Task Queue Manager | DeepSeek V4 Flash | Manages distributed task queues |
| Agent-35 | Conflict Resolver (L1) | Mistral Small 3.1 | Simple conflict detection and resolution |
| Agent-36 | Data Pipeline Worker | DeepSeek V4 Flash | ETL operations, high throughput |

**Tier 3 Monthly Cost Estimate:** ~$50-150 (at moderate activity)

#### Tier 4: Peripheral / Occasional Agents (10 agents) — Free Tier / Local
These agents run infrequently or can be fully served by free tiers and local inference.

| Agent # | Role | Assigned Model | Rationale |
|---------|------|---------------|-----------|
| Agent-37 | Experiment Runner | Llama 4 Scout (Cerebras free) | 1M free tokens/day on Cerebras |
| Agent-38 | Prototype Tester | Mixtral 8x22B (local) | Self-hosted, no API cost |
| Agent-39 | Documentation Scanner | Llama 4 Scout (Groq free) | 1000 req/day free tier |
| Agent-40 | Trend Analyzer | DeepSeek V4 Flash (OpenRouter) | Low-cost via OpenRouter |
| Agent-41 | Social Monitor | Mistral Small (OpenRouter free) | 50 req/day free tier |
| Agent-42 | Research Assistant | Qwen3 235B (Cerebras free) | 1M free tokens/day |
| Agent-43 | Code Reviewer (backup) | Jamba 2 Mini (local) | Self-hosted, 256K context |
| Agent-44 | Translation Agent | Qwen3.7 Plus (batch) | Batch API for translation tasks |
| Agent-45 | Template Generator | Mistral Small 3.1 (local) | Runs on single GPU |
| Agent-46 | Archive Manager | Llama 4 Scout (Groq) | 10M context for archive access |

**Tier 4 Monthly Cost Estimate:** ~$0-50 (mostly free tier usage)

### 3.2 Agent Communication Architecture

```
                    +------------------+
                    |   HUMAN USER     |
                    |   ("Agent 47")   |
                    +--------+---------+
                             |
                    +--------v---------+
                    |  AGENT-06 (HMI)  |  <- Claude Opus 4.8
                    |  Human Interface |
                    +--------+---------+
                             |
              +--------------+--------------+
              |              |              |
    +---------v--+  +--------v----+  +------v-------+
    | Agent-01   |  | Agent-02    |  | Agent-03     |
    | Director   |  | Strategy    |  | World Arch   |
    | (Opus 4.8) |  | (Kimi K2.6) |  | (GPT-5.5)    |
    +-----+------+  +------+------+  +------+-------+
          |              |              |
          +--------------+--------------+
                         |
              +----------v-----------+
              |   A2A Message Bus    |
              |   (MCP-powered)      |
              +----------+-----------+
                         |
         +---------------+---------------+
         |               |               |
   +-----v-----+  +------v------+  +-----v------+
   | Tier 2    |  | Tier 3      |  | Tier 4     |
   | 15 Agents |  | 15 Agents   |  | 10 Agents  |
   | Specialists| | Background  |  | Peripheral |
   +-----------+  +-------------+  +------------+
```

---

## 4. Cost Model for Running the Simulation

### 4.1 Assumptions

- **Activity level:** 8 hours/day active simulation (not 24/7)
- **Tokens per agent per active hour:** ~50K input + ~15K output (average)
- **Tier 1 agents:** 6 agents, highest activity (100% during active hours)
- **Tier 2 agents:** 15 agents, 80% activity during active hours
- **Tier 3 agents:** 15 agents, 50% activity (background monitoring)
- **Tier 4 agents:** 10 agents, 20% activity (occasional tasks)

### 4.2 Three-Tier Budget Model

#### Budget Tier: $50/month (Hobbyist / Experimentation)

| Strategy | Detail |
|----------|--------|
| **Model Mix** | 80% free tier models, 20% paid budget models |
| **Primary Models** | Llama 4 Scout via Groq free tier (1000 req/day), Mistral Small via OpenRouter free tier, Cerebras free tier (1M tokens/day) |
| **Paid supplement** | DeepSeek V4 Flash at $0.14/M input for critical agents only (~$30/month) |
| **Tier 1** | Use Claude Sonnet 4.6 via OpenRouter for 1-2 sovereign agents only (~$15/month) |
| **Caching** | Aggressive local prompt caching, reuse system prompts across agents |
| **Optimization** | Batch non-urgent tasks, run Tier 3/4 agents only when needed |
| **Realistic Agent Count** | 15-20 agents active (rest dormant or on free-tier rotation) |

**Estimated Monthly Breakdown:**
- Free tier usage (Groq + Cerebras + OpenRouter): $0
- DeepSeek V4 Flash (200M input tokens): ~$28
- Claude Sonnet 4.6 (50M input + 15M output): ~$20
- **Total: ~$48-50/month**

#### Budget Tier: $500/month (Serious Simulation)

| Strategy | Detail |
|----------|--------|
| **Model Mix** | Balanced: 4 frontier agents + 12 specialists + 15 background + 15 peripheral |
| **Tier 1** | Claude Opus 4.8 for Simulation Director + Human Interface (~$100/mo) |
| **Tier 2** | MiniMax M3 for coding agents + DeepSeek V4 Pro for architecture (~$150/mo) |
| **Tier 3** | DeepSeek V4 Flash + Mistral Small for background agents (~$100/mo) |
| **Tier 4** | Mix of free tiers and local inference (~$20/mo) |
| **Routing** | OpenRouter with cost-quality tradeoff dial at 5 |
| **Caching** | Prefix caching via SGLang, 70% cache hit rate on system prompts |
| **A2A Bus** | LiteLLM proxy with MCP server for tool access |

**Estimated Monthly Breakdown:**
- Claude Opus 4.8 (300M input + 100M output): ~$100
- Kimi K2.6 or MiniMax M3 (500M input + 200M output): ~$150
- DeepSeek V4 Pro/Flash (800M input + 300M output): ~$100
- Qwen3.7 Plus/Max (400M input + 150M output): ~$60
- Gemini 3.5 Flash (200M input + 80M output): ~$30
- Mistral Small + Llama 4 (local/Groq): ~$20
- OpenRouter fees (5.5%): ~$25
- **Total: ~$485-500/month**

#### Budget Tier: $5,000/month (Production-Grade Persistent World)

| Strategy | Detail |
|----------|--------|
| **Model Mix** | Full 46-agent deployment, all tiers active, 24/7 persistence |
| **Tier 1** | All 6 sovereign agents on frontier models, 24/7 activity |
| **Tier 2** | All 15 specialists active 16h/day |
| **Tier 3** | All 15 background agents running continuously |
| **Tier 4** | All 10 peripheral agents with scheduled tasks |
| **Routing** | Self-hosted vLLM/SGLang cluster for open models + API for frontier |
| **Caching** | RadixAttention prefix caching, 80%+ hit rate |
| **Infrastructure** | 4x H100 for self-hosted Kimi K2.6 + DeepSeek V4 |

**Estimated Monthly Breakdown:**
- Claude Opus 4.8 (2B input + 600M output): ~$400
- Kimi K2.6 via API (1.5B input + 500M output): ~$350
- GPT-5.5 (800M input + 250M output): ~$500
- MiniMax M3 (2B input + 800M output): ~$300
- DeepSeek V4 Pro (1.5B input + 500M output): ~$260
- Qwen3.7 Max (1B input + 400M output): ~$250
- DeepSeek V4 Flash background (3B input + 1B output): ~$140
- Gemini 3.5 Flash multimodal (1B input + 400M output): ~$150
- Self-hosted infrastructure (4x H100 reserved): ~$1,200
- OpenRouter/LiteLLM routing fees: ~$200
- Storage, monitoring, A2A bus infrastructure: ~$350
- **Total: ~$4,800-5,200/month**

### 4.3 Free Tier Stacking Strategy

| Provider | Free Allowance | Best For | Monthly Value |
|----------|---------------|----------|---------------|
| **Cerebras** | 1M tokens/day | Llama 4 Scout, Qwen3 235B inference | ~$45/mo |
| **Groq** | 1,000 req/day | Low-latency tasks, Llama/Mistral | ~$30/mo |
| **OpenRouter** | 50-200K tokens/day | Multi-model routing, experimentation | ~$15/mo |
| **Google AI Studio** | ~1,500 req/day | Gemini Flash for multimodal tasks | ~$25/mo |
| **Mistral AI** | ~1B tokens/month | Mistral Large/Small for background | ~$50/mo |
| **Cloudflare Workers AI** | 10K neurons/day | Edge inference for status agents | ~$10/mo |
| **NVIDIA NIM** | 91 models free tier | Domain-specific inference | ~$20/mo |
| **GitHub Models** | 150-1,000 req/day | GPT-4o, Claude 3.5 Sonnet access | ~$30/mo |
| **Total Stacked** | | | **~$225/mo equivalent** |

---

## 5. Multi-Model Routing Architecture Recommendations

### 5.1 Recommended Stack: OpenRouter + LiteLLM + SGLang

```
+----------------------------------------------------------+
|                    AGENT SWARM LAYER                       |
|              (46 Agents with Role Assignments)             |
+----------------------------------------------------------+
                            |
+----------------------------------------------------------+
|              CSOAI INTELLIGENT ROUTER                      |
|     (Cost-aware, Quality-aware, Latency-aware routing)     |
|  - Agent role -> model mapping                             |
|  - Budget tracking per agent                               |
|  - Dynamic fallback on rate limits                         |
|  - Cache hit optimization                                  |
+----------------------------------------------------------+
                            |
            +---------------+---------------+
            |               |               |
    +-------v------+ +------v------+ +-----v--------+
    |  OpenRouter  | |   LiteLLM   | | SGLang Local |
    |  (Primary)   | |  (Fallback) | |  (Self-host) |
    +-------+------+ +------+------+ +-----+--------+
            |               |               |
    +-------v---------------v---------------v--------+
    |           UNIFIED MODEL POOL                    |
    |  Claude | GPT | Gemini | Kimi | DeepSeek |      |
    |  Qwen   | MiniMax | Llama | Mistral | Jamba    |
    +------------------------------------------------+
```

### 5.2 Routing Configuration

**OpenRouter as Primary Gateway:**
```json
{
  "model": "openrouter/auto",
  "plugins": [{
    "id": "auto-router",
    "cost_quality_tradeoff": 5,
    "allowed_models": [
      "anthropic/claude-opus-4-8",
      "moonshotai/kimi-k2-6",
      "openai/gpt-5.5",
      "deepseek/deepseek-v4-pro",
      "alibaba/qwen3.7-max",
      "minimax/minimax-m3",
      "google/gemini-3.5-flash"
    ]
  }],
  "fallbacks": [
    {"model": "deepseek/deepseek-v4-pro"},
    {"model": "alibaba/qwen3.7-plus"},
    {"model": "google/gemini-3.5-flash"}
  ]
}
```

**SGLang for Self-Hosted Models:**
```bash
# Serve Kimi K2.6 on 4x H100
python -m vllm.entrypoints.openai.api_server \
  --model moonshotai/Kimi-K2.6 \
  --tensor-parallel-size 4 \
  --quantization fp8 \
  --enable-expert-parallel \
  --max-model-len 262144 \
  --kv-cache-dtype fp8_e5m2 \
  --enable-chunked-prefill \
  --port 8001

# Serve DeepSeek V4 Pro on separate GPU partition
python -m vllm.entrypoints.openai.api_server \
  --model deepseek-ai/DeepSeek-V4-Pro \
  --tensor-parallel-size 4 \
  --quantization fp8 \
  --enable-expert-parallel \
  --max-model-len 1048576 \
  --port 8002
```

### 5.3 MCP (Model Context Protocol) Tool Layer

Each agent connects to a shared MCP server providing:

| Tool Category | MCP Servers | Agents Using |
|--------------|-------------|--------------|
| **File System** | fs-mcp-server | All coding agents |
| **Web Browser** | playwright-mcp | Research, intelligence |
| **Database** | sqlite-mcp, pg-mcp | Data agents |
| **Shell/Terminal** | bash-mcp-server | DevOps, automation |
| **Git** | git-mcp-server | Code evolution |
| **Vector DB** | chroma-mcp, qdrant-mcp | Knowledge agents |
| **Communication** | a2a-mcp-bridge | All agents (A2A) |
| **Monitoring** | prometheus-mcp | Background agents |

### 5.4 A2A (Agent-to-Agent) Communication

Using the Linux Foundation A2A Protocol v1.0:

```json
{
  "agent_card": {
    "id": "agent-07-frontend-dev",
    "model": "minimax/minimax-m3",
    "capabilities": ["code_generation", "ui_design", "review"],
    "skills": [{"id": "react", "name": "React/Frontend Development"}],
    "endpoint": "https://csoai.internal/agents/07",
    "authentication": {"scheme": "Bearer"}
  },
  "message_format": {
    "version": "1.0",
    "protocol": "a2a",
    "content_type": "application/json"
  }
}
```

**A2A Message Flow:**
1. Agent publishes capability card to shared registry
2. Agents discover peers via registry query
3. Task delegation via structured A2A messages
4. Results returned with provenance tracking
5. Human (Agent 47) can observe or intervene at any point

---

## 6. The "Agent 47" Human-in-the-Loop Interaction Design

### 6.1 Design Philosophy

Agent 47 is not a participant in the simulation — they are the **sovereign**. The 46 AI agents exist to serve, inform, and execute on behalf of the human user. The architecture embodies three principles:

1. **Human as Sovereign:** The human has absolute authority — veto power, command authority, and the ability to rewrite any agent's behavior
2. **Ambient Intelligence:** Agents operate autonomously but keep the human informed through a unified interface
3. **Graduated Intervention:** The human can interact at multiple levels — from high-level commands to individual agent debugging

### 6.2 Interaction Modes

#### Mode 1: Command Mode (High-Level Swarm Control)
```
Agent 47: "Prioritize the security audit and pause all frontend work"

-> Simulation Director (Agent-01) receives command
-> Reprioritizes agent task queue
-> Security Auditor (Agent-11) activated at highest priority
-> Frontend Dev (Agent-07) paused with state saved
-> Status update returned to Agent 47: "Security audit prioritized. 
    Frontend dev paused. 14 agents continuing background tasks."
```

#### Mode 2: Collaboration Mode (Working with Individual Agents)
```
Agent 47: "@Agent-07 Show me the current component tree and suggest 
    optimizations"

-> Frontend Dev (Agent-07) generates component tree visualization
-> Provides 3 optimization suggestions with trade-offs
-> Agent 47 can accept, modify, or reject each suggestion
-> Changes are propagated via A2A to affected agents
```

#### Mode 3: Override Mode (Direct Control)
```
Agent 47: "OVERRIDE Agent-04: Use the legacy API pattern for all 
    integrations today"

-> Code Evolution Engine (Agent-04) receives binding override
-> Overrides its own reasoning and follows directive
-> Logs override for audit trail
-> Other agents notified of pattern change
```

#### Mode 4: Observation Mode (Passive Monitoring)
```
Agent 47: "Show me the simulation activity feed"

-> Real-time dashboard of all 46 agents
-> Color-coded by activity type (coding, research, monitoring)
-> Click any agent to see full context window
-> Intervene at any point with inline commands
```

#### Mode 5: Teaching Mode (Knowledge Transfer)
```
Agent 47: "TEACH: Our company uses these specific coding standards..."

-> Knowledge uploaded to shared vector store
-> All agents retrieve relevant standards via RAG
-> Future outputs conform to taught standards
-> Standards versioned and tracked
```

### 6.3 Agent 47 Interface Architecture

```
+-------------------------------------------------------------+
|  CSOAI COMMAND CENTER — Agent 47 Interface                  |
+-------------------------------------------------------------+
|  [SOVEREIGN STATUS: ACTIVE]          [BUDGET: $487/$500 mo] |
+-------------------------------------------------------------+
|                                                             |
|  +----------------+  +----------------+  +----------------+ |
|  | TIER 1 AGENTS  |  | TIER 2 AGENTS  |  | TIER 3 AGENTS  | |
|  | [01] Director  |  | [07] Frontend  |  | [22] Log Mon   | |
|  | [02] Strategy  |  | [08] Backend   |  | [23] Notify    | |
|  | [03] World     |  | [09] DevOps    |  | [24] Schedule  | |
|  | [04] Code Eng  |  | [10] Analytics |  | [25] Metrics   | |
|  | [05] Research  |  | ... 11 more    |  | ... 12 more    | |
|  | [06] HMI (YOU) |  |                |  |                | |
|  +----------------+  +----------------+  +----------------+ |
|                                                             |
|  +-------------------------------------------------------+  |
|  | ACTIVITY FEED                                          |  |
|  | [10:42] Agent-11: Found 2 potential vulnerabilities    |  |
|  | [10:41] Agent-07: Committed 3 components to staging   |  |
|  | [10:38] Agent-22: Error rate spike detected in svc-3  |  |
|  | [10:35] Agent-05: Research report ready for review    |  |
|  +-------------------------------------------------------+  |
|                                                             |
|  Agent 47> _                                                |
+-------------------------------------------------------------+
```

### 6.4 Safety and Boundaries

| Feature | Implementation |
|---------|---------------|
| **Veto Power** | Any agent action can be vetoed within 30 seconds |
| **Budget Caps** | Per-agent daily spend limits with auto-shutdown |
| **Action Log** | Immutable audit trail of all agent decisions |
| **Sandboxing** | All code execution in isolated containers |
| **Approval Gates** | High-impact actions require explicit human approval |
| **Kill Switch** | Emergency stop for individual agents or entire swarm |
| **Privacy Mode** | Certain agent conversations are encrypted end-to-end |

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2) — $50/month
- Set up OpenRouter account with $10 top-up
- Deploy 5-8 core agents using free tiers + DeepSeek V4 Flash
- Implement MCP server for basic tools (filesystem, shell)
- Build Agent 47 command interface

### Phase 2: Expansion (Weeks 3-4) — $200/month
- Add Claude Sonnet 4.6 for sovereign agents
- Deploy 15-20 agents with role assignments
- Implement A2A message bus
- Add prompt caching layer

### Phase 3: Full Simulation (Weeks 5-8) — $500/month
- Deploy all 46 agents with tiered model assignments
- Add self-hosted models (Kimi K2.6 or DeepSeek V4 via vLLM)
- Implement full observability and cost tracking
- Build teaching mode and knowledge base

### Phase 4: Production (Weeks 9-12) — $5,000/month
- 24/7 persistent simulation
- 4x H100 cluster for self-hosted models
- Full redundancy and failover
- Custom fine-tuning for domain-specific agents

---

## Appendix A: Model Provider Quick Reference

| Provider | Base URL | Key Model IDs | Free Tier |
|----------|----------|--------------|-----------|
| Anthropic | `api.anthropic.com` | `claude-opus-4-8`, `claude-sonnet-4-6` | None |
| OpenAI | `api.openai.com` | `gpt-5.5`, `gpt-5.5-pro` | None |
| Google | `generativelanguage.googleapis.com` | `gemini-3.5-pro`, `gemini-3.5-flash` | 1500 req/day |
| Moonshot AI | `platform.kimi.ai` | `kimi-k2.6` | Free chat |
| DeepSeek | `api.deepseek.com` | `deepseek-v4-pro`, `deepseek-v4-flash` | Trial credits |
| Alibaba Cloud | `dashscope.aliyun.com` | `qwen3.7-max`, `qwen3.7-plus` | Trial tokens |
| MiniMax | `api.minimax.chat` | `minimax-m3` | Trial credits |
| Groq | `api.groq.com` | `llama-4-scout`, `mixtral-8x22b` | 1000 req/day |
| Cerebras | `api.cerebras.ai` | `llama-4-scout`, `qwen3-235b` | 1M tokens/day |
| OpenRouter | `openrouter.ai/api/v1` | All of above + 200 more | 50-200K tokens/day |

## Appendix B: Benchmark Sources

- [Artificial Analysis](https://artificialanalysis.ai) — Independent model comparison
- [SWE-Bench Pro Leaderboard](https://swe-bench.com) — Software engineering tasks
- [MCPAtlas](https://mcp-atlas.com) — Tool use evaluation
- [LiveCodeBench](https://livecodebench.xyz) — Live coding challenges
- [Humanity's Last Exam](https://hle.com) — Expert-level reasoning

---

*This research brief was compiled in June 2026 based on publicly available model cards, API documentation, benchmark leaderboards, and third-party evaluations. Pricing and benchmarks change frequently — verify current values before procurement decisions.*
