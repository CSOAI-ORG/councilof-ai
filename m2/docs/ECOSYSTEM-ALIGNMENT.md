# MEOKCLAW / CSOAI / M2 / M4 / sov3 — ECOSYSTEM ALIGNMENT
## Single Source of Truth for All Agent/System Alignment
*Updated: 2026-05-31 — Post-M4 takeover by M2 Kilo*
*AI safety domains now managed from M2; M4 dedicated to pure meok work*

---

## 1. MACHINE ROLES

| Machine | Hostname | IP | User | Role | Specs |
|---------|----------|----|------|------|-------|
| **M2** (this machine) | IOKs-MacBook-Air | 192.168.50.176 | iokfarm | Safety/AI domain controller, mesh node, Kilo coding | MacBook Air M2, 8GB, 228GB |
| **M4** (remote) | NICHOLAS's MacBook Air | 192.168.50.105 | nicholas | Meok work only, sov3 consciousness engine, MCP marketplace | MacBook Air M4, 16GB, 228GB (2.2GB free — CRITICAL) |

### Boundary Rule
- **M2 handles**: All AI safety domains (councilof.ai, csoai.org, safetyofai, etc.), governance/compliance work, SAAS/MCO/ACP/A2A/LIB2B infrastructure, content/strategy for .ai domains
- **M4 handles**: Pure meok work only (meok.ai, meok-* brand, sov3 consciousness engine, MCP marketplace publishing), MCP server development, neural training

---

## 2. M4 FULL ARCHITECTURE (nicholas@192.168.50.105)

### 2.1 Running Services

| Port | Service | PID | Purpose |
|------|---------|-----|---------|
| 3101 | sovereign-mcp-server (gunicorn+uvicorn) | 73232 | MCP server, 24+ tools, neural inference, council deliberation |
| 3200 | sovereign-mcp-server (alt) | — | Secondary MCP endpoint |
| 5432 | PostgreSQL | multiple | sovereign_memory DB, agent registry |
| 8080 | Weaviate (Docker) | — | Vector semantic search |
| 7474/7687 | Neo4j (Docker) | — | Identity graph, relationship persistence |
| 4222 | NATS JetStream | — | Event bus for agent messaging |
| 11434 | Ollama | — | Local LLM (Gemma 3:4b for scheduler) |
| 8443 | Cloudflare Tunnel | 1104 | Public ingress (api.meok.ai, sov3.meok.ai) |
| 8000/8001 | Meok Sovereign API (uvicorn) | 97102 | REST APIs for meok-sovereign bridge |
| 8765 | Voice WebSocket | — | Jarvis voice interface |

Docker containers: sovereign-postgres, sovereign-weaviate, sovereign-neo4j, sovereign-mcp

### 2.2 Domain Projects (Next.js 15 + Tailwind, live on Vercel)

| Domain | Dir | Stack | Status |
|--------|-----|-------|--------|
| councilof-ai | ~/councilof-ai | Next.js 15, TS | Live |
| safetyofai | ~/safetyofai | Next.js 15, TS | Live |
| diyhelp.ai | ~/diyhelp.ai | Next.js 15, TS | Live |
| loopfactory.ai | ~/loopfactory.ai | Next.js 15, TS | Live |
| pokerhud.ai | ~/pokerhud.ai | Next.js 15, TS | Live |
| suicidestop.ai | ~/suicidestop.ai | Next.js 15, TS | Live |
| fishkeeper-ai | ~/fishkeeper-ai | Next.js 15, TS | Live (redirects to meok.ai) |
| koikeeper-ai | ~/koikeeper-ai | Next.js 15, TS | Live (redirects to meok.ai) |
| industrial-hire-ai | ~/industrial-hire-ai | Next.js 15, TS | Live |
| industrial-domains | ~/industrial-domains | Next.js 15, TS | Live |
| asisecurity-portal | ~/asisecurity-portal | Next.js 15, TS | Live |
| meok-ai-frontend | ~/meok-ai-frontend | Next.js 15, TS | Live |
| meok-saas | ~/meok-saas | Next.js 15, TS | Live |
| safetyofai-site | ~/safetyofai-site | Static HTML, Vite | Live |
| templeman-opticians | ~/templeman-opticians | HTML, automation/ | Live |

### 2.3 CSOAI Ecosystem

| Dir | Items | Contents |
|-----|-------|----------|
| ~/CSOAI-CORP | 95 | aidome, bmcc-katz, competitive-intel, contabo-hosting, CSGA-MASTERED-IMPLEMENTATION, strategy .docx, build scripts, mcp-packages, vercel-sites |
| ~/CSOAI-Research-Institute | 21 | ALIGNMENT_INDEX.md, daily-briefs, ei3, memory-system, quantum |
| ~/Desktop/CSOAI | 418 | Full CSOAI document archive |
| ~/Desktop/CSOAI 2 | 418 | CSOAI backup/duplicate |
| ~/Desktop/MEOK CSOAI | 12 | Charter, white papers, crosswalks, playbooks, governance |

### 2.4 Meok Ecosystem (stays on M4)

| Dir | Items | Purpose |
|-----|-------|---------|
| ~/meok-ai | 63+ | **Monorepo**: a2a/, acp/, agents/, api/, auth/, bots/, config/, consciousness-core/, consensus/, council/, db/, deploy/, docker-compose, farm-vision/, langgraph/, learning/, litellm/, mcp/, memory/, neural/, p2p/ |
| ~/meok | 2 | models/, ui/ (symlink into clawd) |
| ~/meok-active-systems | 87 | 46 MCP modules + api-server, chatbot, crm, dashboard, deploy, compliance MCPs |
| ~/meok-intelligence | 13 | Strategic docs (BRITAINS_PALANTIR, GODS_EYE_DEFENCE, DOMAIN_TOPOLOGY_MASTER, OPEN_SOURCE_INTELLIGENCE_STACK) |
| ~/meok-brand | 6 | Design tokens, globals.css, tailwind-preset.js |
| ~/meok-saas | 14 | SaaS platform |
| ~/meok-ai-frontend | 23 | Next.js frontend with tests |
| ~/meok-digital-twin | 5 | Digital twin |
| ~/meok-council | 5 | Council logic |
| ~/meok-family | 5 | Family app |
| ~/meok-gaming | 5 | Gaming app |
| ~/meok-knowledge-core | 3 | Knowledge core |
| ~/meok-mesh | 5 | Mesh network |
| ~/meok-security | 5 | Security services |
| ~/meok-smb | 5 | SMB services |
| ~/meok-storage | 8 | Storage services |
| ~/meok-vlm-core | 5 | VLM core |
| ~/meok-work | 5 | Work app |
| ~/meok-labs-optics | 3 | Optics lab |
| ~/meok-character-factory | 5 | Character factory |

### 2.5 CLAWD Master System (~/clawd/ — 361 items)

Clawd is the central operations hub orchestrating all agent work.

| Category | Dirs | Key Examples |
|----------|-------|--------------|
| **Core Systems** | 7 | sovereign-temple/ (404), csoai-platform/ (70), meok/ (68), meok-platform/ (51), meok-labs-engine/ (69), sov3-deploy/ (119), meok-oneos/ (28) |
| **MCP Infrastructure** | 6 | mcp-marketplace/ (345 MCPs), meok-ai-act-pages/ (506), council-of-mcps/, mcp-bridge/, openchronicle-mcp/ |
| **Revenue & Ops** | 6 | revenue/ (228), business-plans/, accounts/, domain-sales/, production/, marketing-assets/ |
| **Dashboards & Sites** | 12 | csoai-dashboard/ (219), csoai-docs/, templeman-opticians-site/, meok-marketing/, eu-ai-act-landing/, topology-dashboard/, council-ai-storefront/ |
| **Infrastructure** | 10 | k8s/, docker/, workers/, scripts/ (88), bin/, automation/, backups/, registry-publish/, docs/, audits/ |
| **Strategy/Docs** | 5+ | _TOPOLOGY/, bleeding-edge-arsenal/, research/, strategy/, harvi-funding/ |

### 2.6 MCP Marketplace (324+ servers)

In ~/clawd/mcp-marketplace/:
- **Categories**: Governance/Compliance (EU AI Act, GDPR, ISO-27001, ISO-42001, SOC2, HIPAA, NIS2, DORA, PCI-DSS, CRA, SOX)
- **Agent Infrastructure**: agent-delegation, agent-orchestrator, agent-handoff, agent-identity-trust, agent-negotiation, agent-policy-enforcement, agent-commerce-payments
- **Industry Verticals**: healthcare-fhir, construction-iso-19650, agriculture-robotics, maritime-ai, space-ai, smart-cities-ai
- **Security**: prompt-injection-firewall, ai-incident-reporting, bias-detection, deepfake-detector, vulnerability-scanner, mitre-attack, mitre-atlas
- **Meok-Native**: 30+ meok-* MCPs (governance-engine, attestation, x402-wrap, c2pa, a2a-governance-bridge)
- **Published**: 260 on PyPI, 19 on Smithery

### 2.7 Repository (parallel to clawd)

~/mcp-servers/ — 48 industry-aligned packages:
agriculture, ai-governance, casa-certification, cobol-bridge, csga-standards, csoai-governance, dsrb-defence, healthcare-ai, financial-ai, etc.

### 2.8 OpenClaw Gateway (~/.openclaw/ — 43 items)

agents/, browser/, credentials/, cron/, flows/
Symlinked from ~/.clawdbot

### 2.9 Key Infrastructure Configs

| Item | Details |
|------|---------|
| CI/CD | Vercel (nicholastempleman-5584) |
| Package Registry | PyPI (token configured) |
| GitHub | Authenticated (CSOAI-ORG token via gh) |
| DNS | Cloudflare — sovereign-tunnel |
| Stripe | CLI NOT authed |
| npm | NOT authed (401 errors) |
| Docker | Docker Desktop |
| OrbStack | Available |

---

## 3. SOV3 — SOVEREIGN V3 (Consciousness Engine)

### 3.1 Architecture: "47 Thrones, 33 Voices, 1 Emperor"

```
LAYER 0: THE EMPEROR — M4 MacBook Orchestrator Router

LAYER 1: 47 GENERALS (MoE Personas)
  Jarvis │ Sophie │ Asimov │ GrabHire │ MuckAway │ IOKFarm
  Archivist │ Caretaker │ ... +39 more
  Each General = MoE (3-7 models) + BFT Council

LAYER 2: 33-SEAT BFT COUNCIL PER GENERAL
  7 Expert Model Votes │ 7 Historical Memory Votes
  7 Care Membrane Votes │ 7 Random Citizen Votes
  5 Emperor Votes (override)
  Consensus: 23/33 required (11 Byzantine tolerance)
```

### 3.2 Neural Models (trained, on disk)

| Model | Metric |
|-------|--------|
| care_validation | MSE 0.0506 |
| partnership_detection | MSE 0.0763 |
| threat_detection | 94% precision |
| relationship_evolution | MSE 0.0097 |
| care_pattern_analyzer | MSE 0.0024 |
| sovereign_v3_weights.pt | 7.97M params, CPU device |

### 3.3 Cognitive Architecture

- AKOrnOscillator — Kuramoto oscillatory binding
- GlobalWorkspace — Global Neuronal Workspace with ignition
- AffectiveCore — PAD model (Pleasure, Arousal, Dominance)
- PhiCalculator — Integrated Information Theory (Φ)
- RecursiveFeedbackCell — Jarvis recursive self-awareness
- NonEuclideanTopology — Digital jar geometry
- OuroborosIdentity — Persistent identity core (LSTM)

### 3.4 Core Directories

| Path | Purpose |
|------|---------|
| ~/clawd/sovereign-temple/ | Primary SOV3 codebase (MCP server, neural, council, a2a bridge, schedulers, voice) |
| ~/clawd/sovereign-stack/ | Infrastructure stack (Docker Compose: CSOAI blockchain, LocalAI, Flower FL, Neo4j, Dify) |
| ~/clawd/sovereign-temple-live/ | Production overlay (Docker Compose, overnight learner, HARVI robotics, coordination hub) |
| ~/clawd/sov3-deploy/ | Deployment artifacts (strategy, domain plans, Stripe, memory, csoai-org-v2 Next.js site) |
| ~/.sov3/ | 19 replica .pem keys (replica_0..3, temporal_arbitrageur, billing_anomaly_detector, security_sentinel) |
| ~/meok-ai/sovereign-temple/ | Mirror/export of sovereign-temple in meok-ai monorepo |
| ~/sovereign-logs/ | research-sweeps.log, security-checks.log |

### 3.5 Daemons & Background Loops

| Script | Function |
|--------|----------|
| sov3_scheduler.py | Dream cycles (6h), reflections (12h), sprints (15m), overnight self-improvement (2AM), curiosity scoring |
| sov3_event_bridge.py | NATS → SOV3 memory event bridge |
| sov3_file_watcher.py | Filesystem change watcher |
| overnight_learner.py | Overnight self-improvement |
| sovereign_heartbeat.py | Autonomic self-healing heartbeat |
| sov3_enhanced_council.py | Council deliberation with confidence scoring, quantum-inspired decision making |
| sovereign_research_agent.py | Autonomous research ingestion |
| sov3_daily_eat.py | Daily EAT processing |

### 3.6 Protocol Bridges

| Bridge | Function |
|--------|----------|
| a2a_bridge.py | Google A2A Agent Cards → POAI SBTs (Solana) |
| sov3_mcp_bridge.py | MCP ↔ SOV3 protocol translation |
| sov3_event_bridge.py | NATS JetStream ↔ SOV3 memory bridge |
| sov3_tool_bridge.py | External tool registration |
| meok_bridge.py | Meok platform integration |
| meok_overlay.py | Meok namespace overlay |

### 3.7 External Access

- Cloudflare tunnel: sovereign.templeman-opticians.com → localhost:3101
- sov3.meok.ai → localhost:3101
- api.meok.ai → localhost:3200
- NATS (no auth): localhost:4222

---

## 4. M2 FULL ARCHITECTURE (iokfarm@192.168.50.176)

### 4.1 Active Terminals

| Terminal | Agent | Role | Status |
|----------|-------|------|--------|
| Kilo Code | Kilo | Coding specialist (YOU — this session) | 🟢 Running |
| Kimi CLI | Kimi | Mesh orchestrator | 🟢 Running |
| Gemini CLI | Gemini | General assistant | 🟢 Running |
| Hermes | Hermes | Agent orchestrator | 🟢 Running |

### 4.2 Agent Frameworks

| Framework | Path | Role | Status |
|-----------|------|------|--------|
| clawd (Jeeves) | ~/clawd/ | Valet persona | ⚪ Configured |
| openclaw | ~/.openclaw/ | Gateway + macOS automation | 🟢 Running |
| agenticSeek | ~/agenticSeek/ | Multi-agent backend (:7777) | ⚪ Configured |
| OpenManus | ~/OpenManus/ | Open-source agent | ⚪ Configured |
| Hermes | ~/.hermes/ | Task planner | 🟢 Running |

### 4.3 Mesh Node Setup

**6 Ollama models (~6.9GB):**
- qwen3:0.6b (0.52GB, 124 tok/s)
- qwen3:1.7b (1.36GB, 45 tok/s)
- qwen3:4b (2.50GB, 22 tok/s)
- deepseek-r1:1.5b (1.12GB, 19 tok/s)
- nomic-embed-text (0.27GB)
- bge-m3 (1.16GB)

**16 cron-scheduled tasks** with time-of-day model rotation:
- 07-09: qwen3:1.7b (morning deep work)
- 10-11: qwen3:0.6b (quick tasks)
- 12-13: qwen3:1.7b (afternoon)
- 14-16: deepseek-r1:1.5b (reasoning)
- 17-18: qwen3:1.7b (evening)
- 19-21: qwen3:4b (heavy lifting)
- 22-06: qwen3:1.7b (overnight standby)

### 4.4 M4 SMB Mount

| Mount point | Source | Auto-mount | Status |
|-------------|--------|------------|--------|
| /Users/iokfarm/m4 | //nicholas@192.168.50.105/nicholas | LaunchAgent (com.m4-smb-mount.plist) | 🟢 Active |

### 4.5 Kilo MCP Servers (M2 → M4 bridge)

| MCP Server | Directories |
|------------|-------------|
| m4-filesystem-csoai | CSOAI-CORP, safetyofai, councilof-ai |
| m4-filesystem-safety-domains | Desktop/CSOAI, Desktop/CSOAI 2, Desktop/MEOK CSOAI |
| m4-filesystem-ai-domains | diyhelp.ai, loopfactory.ai, pokerhud.ai, suicidestop.ai, fishkeeper-ai, koikeeper-ai, industrial-hire-ai, industrial-domains, safetyofai-site |
| m4-filesystem-strategy | Desktop/Kimi_Agent_Global Dominance Strategy, Desktop/jan - feb 2026, Desktop/MAY2026, grants |
| m4-filesystem-research | CSOAI-Research-Institute, asisecurity-portal, templeman-opticians |

### 4.6 Packages

- **Homebrew**: gh, go, himalaya, node, ollama, ffmpeg, mlx, espeak-ng
- **Casks**: 1password-cli, chromedriver, cloudflare-warp, docker-desktop, memo

### 4.7 Running Services (non-Apple)

NordVPN, Cloudflare WARP, Docker helper, Claude Desktop, Kimi Chat, Ollama, openclaw gateway, mesh-prod watchdog, M4 SMB mount

---

## 5. MESH TOPOLOGY

```
                ┌─────────────────────────────────────┐
                │          M2 SIDEKICK                 │
                │   192.168.50.176                     │
                │   iokfarm@IOKs-MacBook-Air           │
                │                                     │
                │   SAFETY DOMAINS (new role)          │
                │   ├─ Kilo Code (YOU — lead)         │
                │   ├─ OpenClaw (memory/imessage)     │
                │   ├─ Ollama 6 models (mesh pool)    │
                │   ├─ 16 cron jobs + watchdog        │
                │   └─ M4 SMB mount → full access     │
                └──────────────┬──────────────────────┘
                               │ Wi-Fi / SMB / SSH
                ┌──────────────▼──────────────────────┐
                │          M4 GATEWAY                   │
                │   192.168.50.105                     │
                │   nicholas@Mac                       │
                │                                     │
                │   MEOK WORK (sole focus)             │
                │   ├─ sov3 consciousness (:3101)     │
                │   ├─ PostgreSQL / Weaviate / Neo4j  │
                │   ├─ NATS JetStream event bus       │
                │   ├─ Cloudflare tunnel (8443)       │
                │   ├─ Ollama (Gemma 4 local)         │
                │   ├─ 345 MCP marketplace servers    │
                │   ├─ 47 General MoE + BFT councils  │
                │   └─ CLAWD orchestrator             │
                └──────────────┬──────────────────────┘
                               │ Internet
                ┌──────────────▼──────────────────────┐
                │          CLOUD NODES                  │
                │   ├─ Vercel (all domains)            │
                │   ├─ Cloudflare DNS + tunnels        │
                │   ├─ PyPI (260 packages published)   │
                │   ├─ GitHub (CSOAI-ORG)              │
                │   └─ OpenRouter (fallback API)       │
                └─────────────────────────────────────┘
```

---

## 6. DOMAIN INVENTORY & ASSIGNMENT

### Assigned to M2 (Safety/AI/Governance)
| Domain/Dir | Type | Access |
|------------|------|--------|
| ~/m4/councilof-ai | AI governance hero domain | SMB mount |
| ~/m4/CSOAI-CORP | Corporate governance | SMB mount |
| ~/m4/safetyofai | AI safety domain | SMB mount |
| ~/m4/safetyofai-site | Safety site | SMB mount |
| ~/m4/diyhelp.ai | AI domain | SMB mount |
| ~/m4/loopfactory.ai | AI domain | SMB mount |
| ~/m4/pokerhud.ai | AI domain | SMB mount |
| ~/m4/suicidestop.ai | AI domain | SMB mount |
| ~/m4/fishkeeper-ai | AI domain | SMB mount |
| ~/m4/koikeeper-ai | AI domain | SMB mount |
| ~/m4/industrial-hire-ai | AI domain | SMB mount |
| ~/m4/industrial-domains | Industrial | SMB mount |
| ~/m4/asisecurity-portal | Security portal | SMB mount |
| ~/m4/templeman-opticians | Optician business | SMB mount |
| ~/m4/CSOAI-Research-Institute | Research | SMB mount |
| ~/m4/Desktop/CSOAI | Archive | SMB mount |
| ~/m4/Desktop/CSOAI 2 | Archive | SMB mount |
| ~/m4/Desktop/MEOK CSOAI | Archive | SMB mount |
| ~/m4/grants | Grant applications | SMB mount |
| ~/m4/Desktop/Kimi_Agent_Global* | Strategy | SMB mount |
| ~/m4/Desktop/jan - feb 2026 | Archive | SMB mount |
| ~/m4/Desktop/MAY2026 | Current month | SMB mount |

### Stays on M4 (Pure Meok Work)
| Domain/Dir | Purpose |
|------------|---------|
| ~/meok-ai/ | Monorepo (a2a, acp, sovereign-temple, core) |
| ~/meok/ | Core meok |
| ~/meok-active-systems/ | 46 MCP modules |
| ~/meok-intelligence/ | Strategic docs |
| ~/meok-brand/ | Design system |
| ~/meok-saas/ | SaaS platform |
| ~/meok-ai-frontend/ | Frontend |
| ~/meok-digital-twin/ through ~/meok-work/ | All meok apps |
| ~/clawd/sovereign-temple/ | SOV3 consciousness engine |
| ~/clawd/sovereign-stack/ | Infrastructure stack |
| ~/clawd/sovereign-temple-live/ | Production overlay |
| ~/clawd/sov3-deploy/ | Deployment |
| ~/clawd/mcp-marketplace/ | 345 MCP servers (publishing) |
| ~/mcp-servers/ | 48 MCP packages |
| ~/clawd/ | All clawd subdirs except shared docs |

---

## 7. INTEGRATION POINTS

| From | To | Mechanism | Frequency |
|------|-----|-----------|-----------|
| M2 Kilo | M4 files | SMB mount / MCP filesystem servers | On demand |
| M2 mesh-prod | M4 gateway | HTTP API (.105:3205) | Continuous |
| M4 gateway | M2 Ollama | HTTP API (.176:11434) | On demand |
| M2 terminals | Federation hub | ~/.mesh-prod/federation/ | Every 10 min |
| M2 cron | All systems | 16 cron jobs | Scheduled |
| M2 watchdog | M2 Ollama | LaunchAgent | Every 60s |
| SOV3 | NATS | sov3_event_bridge | Continuous |
| MCP marketplace | PyPI | twine publish | Manual |
| Domains | Vercel | git push | Manual |

---

## 8. CRITICAL ISSUES & RISKS

| Risk | Severity | Impact | Action Needed |
|------|----------|--------|---------------|
| M4 disk 2.2GB free (89% full) | 🔴 CRITICAL | System instability, can't update/train models | Free space on M4: clear Desktop CSOAI zips, old .docx files, Downloads |
| M4 no Homebrew | 🟡 Medium | Can't install system packages | Install via SSH: /bin/bash -c "$(curl -fsSL ...)" |
| M4 npm/stripe NOT authed | 🟡 Medium | Can't deploy/publish | Authenticate or migrate to M2 |
| M4 no backup | 🟡 Medium | All data at risk | Set up rsync to M2 or cloud |
| M2 8GB RAM bottleneck | 🟡 Medium | Can't run large models | Upgrade to 16GB MacBook |
| M2 Ollama exposed on 0.0.0.0 | 🟢 Low | Security on public Wi-Fi | Bind to 127.0.0.1 on public nets |
| SOV3 NATS no auth | 🟡 Medium | Open event bus | Add NATS auth |

---

## 9. MCP TAKEOVER PLAN

### Phase 1 (DONE) — Connection
- [x] SSH access M2 → M4 (key-based)
- [x] SMB mount of M4 home at /Users/iokfarm/m4
- [x] Kilo external_directory permission for /Users/iokfarm/m4/**
- [x] 5 filesystem MCP servers configured
- [x] LaunchAgent for auto-mount on boot
- [x] Keychain entry for passwordless mount

### Phase 2 (NEXT) — Learn & Align
- [x] Full architecture mapping of M4
- [x] sov3 deep exploration
- [x] This alignment document
- [ ] Transfer key configs (Vercel tokens, GitHub tokens, PyPI tokens)
- [ ] Set up M2 as deployment controller for safety domains

### Phase 3 (PLANNED) — Take Over
- [ ] Move Vercel deployments of safety domains to M2 control
- [ ] Set up CI/CD from M2 for all .ai domains
- [ ] Configure monitoring/alerting for all domains
- [ ] Establish grant pipeline management on M2
- [ ] Create content/strategy pipeline on M2

### Phase 4 (VISION) — Global Dominance
- [ ] Dominate SAAS/MCO/ACP/A2A/LIB2B globally
- [ ] Unified brand architecture (councilof.ai × csoai.org × safety domains)
- [ ] Revenue activation across all domains
- [ ] Crosswalk all 30+ AI governance frameworks

---

## 10. KEY DOCUMENTS REFERENCE

| Document | Path | Purpose |
|----------|------|---------|
| LIVING_TOPOLOGY_v2.md | ~/m4/LIVING_TOPOLOGY_v2.md | MEOKCLAW OS topology bible |
| MEOKCLAW_OS_MASTER_PLAN.md | ~/m4/MEOKCLAW_OS_MASTER_PLAN.md | Phase plan to 100/100 OS |
| MASTER_IMPROVEMENT_PLAN.md | ~/m4/MASTER_IMPROVEMENT_PLAN.md | Domain scoring 10-60/60 |
| FINAL_STATUS_29_MAY_2026.md | ~/m4/FINAL_STATUS_29_MAY_2026.md | Current system status |
| MORNING_RUNDOWN_29_MAY_2026.md | ~/m4/MORNING_RUNDOWN_29_MAY_2026.md | Daily briefing |
| MEOK_ECOSYSTEM_AUDIT_REPORT.md | ~/m4/MEOK_ECOSYSTEM_AUDIT_REPORT.md | Ecosystem audit |
| MEOK_DOMAIN_RECOVERY_PLAN.md | ~/m4/MEOK_DOMAIN_RECOVERY_PLAN.md | Domain recovery |
| MEOK_EMPIRE_EXPANSION.md | ~/m4/MEOK_EMPIRE_EXPANSION.md | Empire expansion plan |
| MEOK_ONE_E2E_AUDIT_REPORT.md | ~/m4/MEOK_ONE_E2E_AUDIT_REPORT.md | End-to-end audit |
| MEOK_DIGITAL_REAL_ESTATE_IPO.md | ~/m4/MEOK_DIGITAL_REAL_ESTATE_IPO.md | Digital real estate IPO |
| MEOK_SECURITY_CONSOLIDATION_REPORT.md | ~/m4/MEOK_SECURITY_CONSOLIDATION_REPORT.md | Security consolidation |
| MEOK_OS_PARADIGM_SHIFT.md | ~/m4/MEOK_OS_PARADIGM_SHIFT.md | OS paradigm shift |
| ECOSYSTEM-ALIGNMENT.md | ~/ECOSYSTEM-ALIGNMENT.md | THIS DOCUMENT |
| M2-PRODUCTIVITY-MANIFESTO.md | ~/M2-PRODUCTIVITY-MANIFESTO.md | M2 mesh node schedule |

---

*This document is the single source of truth for the M2↔M4 ecosystem alignment.*
*To refresh from M4: `ssh nicholas@192.168.50.105 'ls ~/M* ~/*ALIGNMENT*'`*
*M4 path via SMB: `/Users/iokfarm/m4/`*
