# MEOK OS — Unified Operating System Architecture

## Current State (April 5, 2026)

### What's Built (UI Layer)

| OS Module | Path | Status |
|-----------|------|--------|
| **/os** | Main OS hub | ✅ Working |
| Work OS | /work | ✅ Orion, Riri, Hourman agents |
| Characters | /characters | ✅ 140+ characters |
| Guardian 24/7 | /guardian | ✅ Family safety |
| Gaming | /gaming | ✅ Performance |
| Sovereign Data | /os/sovereign | ✅ Encrypted memory |
| Consciousness | /os/consciousness | ✅ Live status |
| Tasks | /os/tasks | ✅ Task management |
| Computer Use | /os/computer-use | ✅ AI computer control |
| Fly Eye | /os/fly-eye | ✅ Vision mode |
| Dream | /os/dream | ✅ Dream state |

---

## What Needs to Be Built (The "New OS Layer")

### 1. MCP Registry & Tool Router
**Purpose:** Unified interface to ALL MCP tools (SOV3, external APIs)

```
MCP Registry should expose:
- 75+ SOV3 tools (memory, consciousness, agents)
- External APIs (Stripe, Clerk, Ollama)
- Future tools (Vapi, Bland.ai for sales)
```

### 2. LLM Router (Smart Routing)
**Purpose:** Route requests to best model based on:
- Task type (reasoning, creative, code, vision)
- Cost constraints
- Latency requirements

**Current:** Already exists in `/lib/llm-router.ts`

### 3. Agent Orchestrator
**Purpose:** CEO agent coordinates department agents

```
CEO Agent
├── Content Dept (blog, social, PR)
├── Sales Dept (outreach, calls, demos)
├── Finance Dept (accounting, invoicing)
├── Support Dept (tickets, escalation)
├── Research Dept (market, competitors)
└── Operations Dept (scheduling, tasks)
```

### 4. Unified Memory Layer
**Purpose:** All agents share memory via pgvector

```
- Episodic: Daily conversations
- Semantic: Extracted knowledge  
- Procedural: Skills & capabilities
- Working: Current context
```

### 5. Voice/Video Pipeline
**Purpose:** Unified input/output

```
Input: Whisper STT → Text
Output: Kokoro TTS → Audio
Video: HeyGen/Synthesia (future)
```

---

## Research from Kimi Brief

### Priority Integrations (from research doc)

| Category | Tools | Priority |
|----------|-------|----------|
| **Agent Orchestration** | LangGraph, CrewAI, AutoGen | P0 |
| **AI Sales Calling** | Vapi.ai, Bland.ai | P1 |
| **Video Generation** | Runway, Kling, HeyGen | P2 |
| **Customer Support** | Sierra AI, Intercom Fin | P1 |
| **Accounting** | Xero, Mercury, Brex | P2 |
| **SEO/AEO** | Ahrefs, Profound, Otterly | P1 |

---

## Next Build Priorities

### Phase 1: Core OS (NOW)
- [x] UI framework (/os)
- [x] Character system
- [x] Memory layer
- [x] Basic agents (Orion, Riri)

### Phase 2: Unified API Layer
- [ ] MCP registry UI
- [ ] Tool discovery dashboard
- [ ] API key management

### Phase 3: Autonomous Business
- [ ] CEO agent (Ralph Mode)
- [ ] Department agents
- [ ] Self-training loops

### Phase 4: External Integrations
- [ ] Vapi.ai (sales calls)
- [ ] Video generation pipeline
- [ ] Accounting sync

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    MEOK OS UI (localhost:3000)              │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────┐  ┌─────────┐  ┌─────────┐  ┌─────────┐         │
│  │ Work OS │  │Guardian │  │ Gaming  │  │ Sovereign│        │
│  └────┬────┘  └────┬────┘  └────┬────┘  └────┬────┘         │
│       │           │           │           │                │
│  ┌────▼───────────▼───────────▼───────────▼────┐          │
│  │         AGENT ORCHESTRATOR (Ralph)          │          │
│  └────────────────────┬───────────────────────┘          │
│                       │                                    │
│  ┌────────────────────▼───────────────────────┐          │
│  │         LLM ROUTER (smart routing)          │          │
│  └──────┬──────────┬──────────┬────────────┬────┘          │
│         │          │          │            │                │
│    ┌────▼────┐ ┌───▼────┐ ┌──▼────┐ ┌───▼────┐          │
│    │ Claude  │ │ DeepSeek│ │ Qwen  │ │ Cloud  │          │
│    └────────┘ └────────┘ └───────┘ └────────┘          │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │              MCP TOOL REGISTRY                    │   │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ │   │
│  │  │ SOV3   │ │ Ollama  │ │Stripe   │ │ Clerk  │ │   │
│  │  │(75tool)│ │(models)│ │(payment)│ │(auth)  │ │   │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │         UNIFIED MEMORY (PostgreSQL + pgvector)    │   │
│  └──────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

---

## Action Items

### Phase 1: Core OS (NOW)
- [x] UI framework (/os)
- [x] Character system
- [x] Memory layer
- [x] Basic agents (Orion, Riri)

### Phase 2: Unified API Layer
- [x] MCP registry UI (/os/control-room)
- [x] Tool discovery dashboard
- [x] API key management

### Phase 3: Autonomous Business
- [x] Department agents UI
- [ ] CEO agent (Ralph Mode) - needs more work
- [ ] Department agent implementation
- [ ] Self-training loops

### Phase 4: External Integrations
- [ ] Vapi.ai (sales calls)
- [ ] Video generation pipeline
- [ ] Accounting sync

---

## Latest Updates (April 5, 2026)

### Control Room Built
- `/os/control-room` - New unified dashboard
- 100 MCP tools from SOV3 listed
- Real-time health data from /api/health and /api/sov3/status
- LLM provider status with real latency
- Agent orchestration overview
- External API integrations (25+ APIs from Kimi research)
- Department agents UI (6 departments)

---

*Created: 2026-04-05*
