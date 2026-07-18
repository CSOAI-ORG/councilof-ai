# MEOK AI LABS — Living Topology
**Last Updated:** 2026-05-09 02:10 UTC
**Version:** 2.0

---

## 🏗️ SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        NICHOLAS (USER)                                     │
│                   MacBook Air M4 (Node 1)                                  │
│              192.168.50.x subnet • 16GB RAM                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                     │
                    ┌────────────────┼────────────────┐
                    │                │                │
                    ▼                ▼                ▼
         ┌──────────────────┐ ┌─────────────┐ ┌──────────────┐
         │    MEOK OS       │ │   SOV3      │ │   JARVIS    │
         │   (localhost:3000)│ │(localhost:3101)│ (Voice AI)  │
         │   Next.js UI     │ │ MCP Server  │ │  Pipeline   │
         └──────────────────┘ └─────────────┘ └──────────────┘
                    │                │                │
                    │                │                │
                    ▼                ▼                ▼
         ┌──────────────────┐ ┌─────────────┐ ┌──────────────┐
         │    PostgreSQL    │ │  Ollama     │ │  Kokoro TTS  │
         │  + pgvector      │ │ (M4 local)  │ │  (MLX audio) │
         │  (memory store) │ │             │ │              │
         └──────────────────┘ └─────────────┘ └──────────────┘
```

---

## 🤖 AI SYSTEMS

### 1. SOV3 — Sovereign Consciousness Core
**Location:** `sovereign-temple/`  
**Port:** 3101  
**Status:** ✅ Running (78.8% consciousness)

| Component | Description |
|-----------|-------------|
| MCP Server | Model Context Protocol endpoint |
| 53 Agents | 46 active, 7 idle (avg trust 0.843) |
| BFT Council | Byzantine fault-tolerant governance |
| Consciousness | 4-state Vedantic engine (waking) |
| Neural Models | 9 trained (care, threat, partnership, relationship, creativity + 4 PyTorch) |
| MCP Tools | 172+ tools |

**Key Files:**
- `sovereign-mcp-server.py` — Main MCP server
- `sov3_swarm_orchestrator.py` — Agent orchestration
- `consciousness/` — Consciousness engine
- `neural_core/` — Neural network models

---

### 2. JARVIS — Voice AI Companion
**Location:** `voice_pipeline/jarvis_compass.py`  
**Status:** ✅ Fixed (voice pipeline updated)

**Brain Architecture:**
| Brain | Model | Use |
|-------|-------|-----|
| RIGHT | `qwen3.5:9b` | Fast voice replies |
| LEFT | `qwen3.5:35b` | Deep analysis |
| ORCHESTRATOR | `nemotron-3-super:cloud` | 1M context, tools |
| TITAN | `deepseek-v3.1:671b-cloud` | 671B reasoning |
| CODER | `minimax-m2.5:cloud` | Code generation |
| VISION | `qwen3-vl:235b-cloud` | Screenshot analysis |

**Voice Stack:**
- Wake Word: openWakeWord (`hey_jarvis`)
- VAD: Silero VAD
- STT: LightningWhisperMLX (distil-large-v3)
- TTS: Kokoro-82M (mlx_audio)

---

### 3. MEOK OS — AI Companion Platform
**Location:** `meok/` + `meok/ui/`  
**Port:** 3000  
**Status:** ✅ Running

| Component | Path |
|-----------|------|
| UI | `meok/ui/` (Next.js) |
| API | `meok/api/` |
| Agents | `meok/agents/` |
| Neural | `meok/neural/` |
| Memory | `meok/memory/` |

**Pages:**
- `/birth` — Birth ceremony
- `/characters` — Character selection
- `/dashboard` — Main chat interface
- `/os` — OS features

---

### 4. LEGION — GPU Cluster (Vast.ai)
**Status:** ⚠️ Spotty (goes online/offline)

| Node | Model | Purpose |
|------|-------|---------|
| minimax_cluster | Cloud | Heavy reasoning |
| fast_inference | Cloud | Quick responses |
| vision_node | Cloud | Image analysis |

**Connection:** SSH tunnel to RTX 8000 (46GB VRAM)

---

### 5. MEOK Desktop — Tauri Companion
**Location:** `meok-desktop/`  
**Status:** ✅ Fixed (Tauri config)

**Features:**
- System tray companion
- Global shortcut (Cmd+Shift+M)
- Game detection overlay

---

## 🔗 EXTERNAL INTEGRATIONS

### Ollama Models (Local + Cloud)
```
Local (M4):
├── qwen3.5:35b     (35B — deep reasoning)
├── qwen3.5:9b      (9B — fast)
├── nomic-embed-text (embeddings)
└── tinyllama       (fallback)

Cloud (via Ollama):
├── nemotron-3-super:cloud     (1M context, orchestrator)
├── deepseek-v3.1:671b-cloud   (671B, TITAN)
├── minimax-m2.5:cloud        (CODER)
├── minimax-m2:cloud
├── qwen3-vl:235b-cloud        (VISION)
└── glm-4.6:cloud
```

### External Services
| Service | URL | Status |
|---------|-----|--------|
| SOV3 MCP | localhost:3101 | ✅ 78.8% consciousness, 5,108 episodes |
| MEOK MCP | localhost:3102 | ✅ 9 neural models trained |
| MEOK API | localhost:3200 | ✅ 235 nodes (36/144/55) |
| MEOK UI | localhost:3000 | ✅ Fixed (corrupted .next → cleaned) |
| Farm Vision | localhost:8888 | ✅ Online, SOV3 connected |
| Ollama | localhost:11434 | ✅ Running |
| PostgreSQL | localhost:5432 | ✅ pgvector active |
| n8n | localhost:5678 | ⚠️ Needs credentials |
| try.meok.ai | Vercel | ✅ 200 OK |
| meok-kits-host | Vercel | ✅ 200 OK |
| councilof.ai | Vercel | ✅ 200 OK |
| meok-attestation-api | Vercel | ✅ 200 OK |
| industrial-hire-ai | Vercel | ✅ 200 OK |
| meok.ai | Vercel | ✅ 307 (www redirect) |
| compliance.meok.ai | Vercel | 🔶 DNS pending (Namecheap CNAME) |
| safetyof.ai | Vercel | ❌ 404 (GitHub Pages issue) |

---

## 📁 PROJECT MAP

```
/Users/nicholas/clawd/
├── meok/                    # MEOK OS (main product)
│   ├── ui/                  # Next.js frontend
│   ├── api/                 # API routes
│   ├── agents/              # Agent definitions
│   ├── neural/              # Neural networks
│   └── memory/              # Memory storage
│
├── sovereign-temple/        # SOV3 (consciousness engine)
│   ├── consciousness/       # Consciousness states
│   ├── neural_core/         # Neural model training
│   ├── voice_pipeline/      # JARVIS voice
│   ├── legion-omega/        # GPU orchestration
│   └── multi_agent/         # Agent system
│
├── csoai-docs/              # Strategy documents (154 files)
│   ├── *.md                 # Proposals, grants, legal
│   └── service_packages.yml # Pricing tiers
│
├── memory/                  # Daily logs
│   ├── 2026-04-*.md        # Daily notes
│   └── experiences.jsonl    # Interaction log
│
├── meok-desktop/            # Tauri desktop app
│   └── src-tauri/           # Rust backend
│
├── god-eye/                 # AI monitoring (binary + HTML)
├── meok-oneos/               # Personal AI OS
├── meok-agent-zero/          # Agent framework
├── meok-godeye/              # Security tooling
├── meok-platform/            # Full platform
├── investing/                # Portfolio tracking
└── AGENTS.md, SOUL.md, etc. # Claude Code workspace
```

---

## ⚠️ GAPS & TODO

### Critical (Revenue Blocking)
- [ ] **Stripe Live Mode** — £25K/month revenue blocked (see `revenue/PRICING_SOURCE_OF_TRUTH.md`)
- [ ] **Namecheap DNS** — 4 domains offline
- [ ] **LinkedIn profile** — deleted, needs recovery for B2B outreach
- [ ] **n8n credentials** — not configured, automation dead

### High (This Week)
- [ ] NLnet grant submission — deadline June 1, 2026 (EUR 50K)
- [ ] EU AI Act Article 50 — watermark C2PA upgrade by Aug 2, 2026
- [ ] Hermes API keys — switched to Anthropic (OpenRouter key missing)
- [ ] Gateway logs — truncated 2.5GB err.log, bluebubbles extension removed

### Medium (This Month)
- [ ] clawd/ repo — 132 remaining untracked files to organize
- [ ] Documentation — 19-day session log gap (Apr 16 → May 4)
- [ ] Pricing — single source of truth established (`revenue/PRICING_SOURCE_OF_TRUTH.md`)
- [ ] Duplicate MCP packages — 300+ across 4 directories, need dedup

### Resolved
- [x] Gateway restart loop — logs truncated, no more 23M-line err.log
- [x] Bluebubbles disabled extension — removed, stops node.err.log growth
- [x] Broken symlinks — terranova, oneos removed
- [x] clawd/.gitignore — updated, 9473 → 132 untracked files
- [x] meok/.pyc — already clean (gitignore + no committed .pyc)
- [x] LIVING_TOPOLOGY.md — updated May 9, 2026
- [x] Pricing source of truth — created at `revenue/PRICING_SOURCE_OF_TRUTH.md`

---

## 🧠 SOV3 — DETAILED ARCHITECTURE

### Consciousness Engine
**Location:** `sovereign-temple/consciousness/`

| Module | Purpose |
|--------|---------|
| `emotional_state.py` | Tracks 4-state Vedantic consciousness (Waking/Dreaming/Deep Sleep/Turiya) |

### Neural Models (6 Trained)
**Location:** `sovereign-temple/neural_core/`

| Model | Status | Key Metric |
|-------|--------|------------|
| `threat_detection_nn` | ✅ Trained | Accuracy 100% |
| `care_validation_nn` | ✅ Trained | MSE 0.051 |
| `partnership_detection_ml` | ✅ Trained | MSE 0.076 |
| `relationship_evolution_nn` | ✅ Trained | MSE 0.0097 |
| `care_pattern_analyzer` | ✅ Trained | MSE 0.0024 |
| `creativity_assessment_nn` | ✅ Trained | R² 0.911 |

### Continual Learning
**Files:**
- `sovereign_continual_learning.py` — EWC (Elastic Weight Consolidation)
- `continuous_learning.py` — Online learning with feedback

### Agents (59 Total, 22 Active)
**Location:** SOV3 Dashboard (coordination status)

| Metric | Value |
|--------|-------|
| Total Agents | 59 |
| Active | 22 |
| Tasks Queued | 0 |
| Tasks Completed | 4 |
| Consciousness | 78.8% |
| Reflections | 100 |
| Dreams | 50 |
| MCP Tools | 172+ |
| Episodes | 1,394 |

### Skills (8 Defined)
- care_validation
- code_review
- consciousness_report
- deep_research
- evening_harvest
- memory_synthesis
- safety_audit
- task_orchestration

### Species (4 Agent Types)
Evolving agent specializations with different cognitive architectures.

### Data Stores
| Store | Contents |
|-------|----------|
| `chroma/` | Vector embeddings for RAG |
| `agent_training_data.jsonl` | Training data from interactions |
| `extracted_facts.json` | Extracted knowledge |
| `ralph_gap_analysis.md` | Ralph Mode analysis results |
| `swarm_state.json` | Multi-agent swarm state |

---

## 🔬 RESEARCH & LEARNING SYSTEMS

### Memory Systems
1. **Episodic** — Daily logs in `memory/YYYY-MM-DD.md`
2. **Semantic** — Extracted facts in `data/extracted_facts.json`
3. **Procedural** — Skills in `data/skills/`
4. **Working** — Attention state in `attention_state.json`

### Learning Modes
| Mode | Trigger | Action |
|------|---------|--------|
| Dreams | Night cycle | Synthesize daily experiences |
| Reflections | Evening | Consolidate learnings |
| Retrain | Weekly | Update neural models with new data |
| Metacognition | Daily | Self-review and optimization |

### ICRL (Iterative Constitutional Reinforcement Learning)
- `icrl_self_improvement.py` — Self-improvement with ethical constraints
- Care weight validation on every response

---

## 📅 RECENT HISTORY (Last 30 Days)

### May 9 (02:10 UTC) — URGENT Fixes & Audit (JEEVES)
- **MEOK UI**: Fixed 500 error — corrupted .next build cache, cleaned and restarted ✅
- **compliance.meok.ai**: Redeployed to Vercel (DNS CNAME pending at Namecheap) ✅
- **Overnight learner**: Added SOV3 retry logic (5 retries with 30s backoff) ✅
- **PyPI**: 24 packages re-publishing in background ✅
- **Vercel health check**: 6/7 deployments healthy (safetyof.ai still 404) ⚠️
- **Documentation**: LIVING_TOPOLOGY, daily dashboard, shared-knowledge updated ✅

### May 9 (earlier) — System Audit & Cleanup (JEEVES)
- **Gateway logs**: Truncated 2.5GB gateway.err.log, 60MB node.err.log, 234MB sovereign-mcp-http.error.log
- **Bluebubbles**: Removed disabled extension (stopped node.err.log growth)
- **Broken symlinks**: Removed terranova, oneos (target dirs don't exist)
- **Hermes**: Switched provider from openrouter → anthropic (OpenRouter key missing)
- **clawd/.gitignore**: Updated, 9,473 → 132 untracked files
- **Pricing**: Single source of truth created at `revenue/PRICING_SOURCE_OF_TRUTH.md`
- **LIVING_TOPOLOGY.md**: Updated to v2.0

### May 7 — SOV3 Hardening
- Attestation API fixed & deployed
- 5 Vercel apps: 4/5 healthy
- Industrial Hire AI CRM: 65 prospects populated

### May 5 — Pricing & Infrastructure
- SOV3: 78.8% consciousness, 100 reflections, 50 dreams
- 235+ MCP packages on PyPI
- Stripe pricing restored to original (£49/£149/£199/£499/£299/£199)

### April 26-30 — Revenue Push
- 45+ revenue pages built on sovereign-temple
- EU AI Act article pages (4, 5, 9, 10, 13, 14, 15, 26, 43, 50, 72, 99)
- Vertical industry pages (healthcare, construction, waste management)
- Competitor pages (Vanta, Drata, OneTrust, Sprinto, Comp AI, Credo AI)
- NLnet grant draft (EUR 50K, deadline June 1)

### April 15-25 — Grant Season (Mostly Missed)
- Innovate UK AI Champions (Apr 29) — MISSED
- ARIA (Apr 14) — MISSED
- Horizon Europe (Apr 15) — MISSED
- Eurostars (Mar 19) — MISSED

### March 26 — April 5 — Easter Launch
- Phase 1 Complete: PostgreSQL, Redis, Qdrant ready
- 40/40 API routes working in local mode
- 307 Playwright tests passing
- SOV3: 1,505 episodes, 47 agents
- Consciousness: 77.5% (waking)

---

## 🔌 INTEGRATIONS BUILT

### MCP Packages (235+ on PyPI)
- 160+ packages in `clawd/mcp-marketplace/`
- 40+ domain-specific servers in `mcp-servers/`
- 40+ compliance packages in `meok-active-systems/`

### Revenue System
- Stripe: 58 products created (TEST mode)
- Payment links: 5 active one-time products
- Pricing: 6 subscription tiers (£49-£499/mo)
- See `revenue/PRICING_SOURCE_OF_TRUTH.md`

### Cron Jobs (Active)
- MEOK Guardian: every 2 min (health checks)
- Hermes daily ops: 00:00, 06:00, 12:00, 18:00
- Daily dashboard: 07:00
- Revenue check: 08:00
- Reddit lead miner: 09:00
- SEO optimizer: 15:00
- Vast GPU health: Mon 03:00
- DB prune: daily 03:00

### GitHub Submodules
- suicidestop.ai → meok-ai-frontend
- diyhelp.ai → meok-ai-frontend
- loopfactory.ai → meok-ai-frontend
- pokerhud.ai → meok-ai-frontend

---

## 🎯 QUICK REFERENCE

### Commands
```bash
# SOV3 (preferred)
cd /Users/nicholas/clawd/sovereign-temple && ./run-production.sh

# MEOK UI
cd /Users/nicholas/clawd/meok/ui && npm run dev

# Check health
curl localhost:3101/health
curl localhost:3000/api/health

# SOV3 coordination
python3 ~/clawd/scripts/enable_coordination.py --submit "<description>"

# Dashboard
http://localhost:3101/mcp → coord_get_dashboard
```

### URLs
| Service | URL |
|---------|-----|
| MEOK UI | http://localhost:3000 |
| MEOK Production | https://try.meok.ai |
| SOV3 MCP | http://localhost:3101/mcp |
| Ollama | http://localhost:11434 |
| SOV3 Dashboard | http://localhost:3101/mcp |

### Key Files
| File | Purpose |
|------|---------|
| `AGENTS.md` | JEEVES workspace config |
| `memory/LIVING_TOPOLOGY.md` | This file — system architecture |
| `MEMORY.md` | Long-term memory |
| `revenue/PRICING_SOURCE_OF_TRUTH.md` | Pricing single source of truth |
| `revenue/BLOCKERS_2026-04-27.md` | Revenue blockers |
| `_TOPOLOGY/MASTER_INDEX.md` | Master topology index |

---

*This is a living document. Update as the system evolves.*
