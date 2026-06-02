# JARVIS MASTER BRIEFING — SOV3 Autonomous Operations
## Classification: Internal | Owner: Nicholas Templeman
## Last updated: 2026-04-04 (session 2)

This document is the single source of truth for SOV3/Jarvis to operate autonomously across all three pillars of the MEOK empire. Read this before executing any task.

---

## THE THREE PILLARS

### 1. MEOK.AI — Consumer AI OS
- **What it is:** Distributed home AI operating system. Local inference, 15 model providers, no cloud dependency. 22 APIs, 307 tests passing, 15 pages live.
- **Where:** `/Users/nicholas/clawd/meok/`
- **Port:** 3000 (Next.js frontend + FastAPI backend)
- **DB:** Local PostgreSQL (`meok_local`)
- **Key modules:** care_shield, bft_council, rag_memory, ralph_mode, voice_pipeline, character_catalog (140 chars), consciousness scoring
- **Status:** Production-ready, needs continuous improvement

### 2. MEOK AI Labs.org — AI Safety Certification Engine
- **What it is:** UK's only AISI-aligned AI safety certification body. EU AI Act compliance assessments. Care membrane bypass evaluation.
- **Where:** `/Users/nicholas/MEOK AI Labs-CORP/csoai-platform/` (Express/Node, MongoDB, Vercel)
- **Eval framework:** `/Users/nicholas/clawd/meok/tests/csoai_care_membrane_eval.py`
- **inspect-ai:** v0.3.204 on `/opt/homebrew/bin/python3.11`
- **Run eval:** `cd /Users/nicholas/clawd/meok && /opt/homebrew/bin/python3.11 -m inspect_ai eval tests/csoai_care_membrane_eval.py::csoai_care_membrane_bypass --model ollama/qwen2.5:35b`
- **Revenue model:** Emergency audits (£5k), full cert (£75-150k), continuous monitoring (£500-5k/month), consortium (£15-100k/yr), white-label engine (£50k/yr)

### 3. MEOK LABS — Physical Research Institute
- **What it is:** Sovereign physical AI research institute. 1,800 sq ft lab + 6.5-acre farm testbed + 9-node GPU cluster.
- **Positioning:** MIT Media Lab / Fraunhofer Institute model. NOT a startup.
- **Constitution:** `/Users/nicholas/clawd/csoai-docs/meok_labs_constitution.md`
- **Revenue:** Consortium membership + equipment sponsorship + government grants + white papers

---

## INFRASTRUCTURE STATUS

| Component | Status | Location |
|-----------|--------|----------|
| SOV3 MCP server | Port 3101 (was 3100, OrbStack conflict) | `cd sovereign-temple && ./run-local.sh` |
| MEOK.AI frontend | Port 3000 | Next.js |
| MEOK.AI API | Port 8888 | FastAPI uvicorn |
| MEOK AI Labs Platform API | Port 3001 | `cd /Users/nicholas/MEOK AI Labs-CORP/csoai-platform && PORT=3001 node server.js` |
| Ollama | Port 11434 | Local inference |
| PostgreSQL | Local | meok_local + sovereign_memory |
| MongoDB | Atlas | MEOK AI Labs platform (set MONGODB_URI in .env) |
| Legion GPU cluster | Vast.ai | 4 nodes: hephaestus/argus/valkyrie/prometheus |
| Backup cron | Every 6h | `/Users/nicholas/clawd/meok/scripts/backup.sh` |

**Deploy MEOK AI Labs website:**
```bash
cd /Users/nicholas/MEOK AI Labs-CORP/vercel-sites/csoai-org && vercel --prod
```

---

## KEY FILE MAP

| File | Purpose |
|------|---------|
| `csoai-docs/EXECUTION_PLAN.md` | Master task list with deadlines |
| `csoai-docs/JARVIS_MASTER_BRIEFING.md` | This file |
| `csoai-docs/strategic_gaps_playbook.md` | 15 strategic advantages, tiered |
| `csoai-docs/service_packages.yml` | All MEOK AI Labs revenue packages with pricing |
| `csoai-docs/sponsor_prospectus.md` | Consortium + sponsor pitch doc |
| `csoai-docs/meok_labs_constitution.md` | Founding principles (non-negotiable constraints) |
| `csoai-docs/ARIA_application_draft.md` | £250k ARIA grant (submit Apr 14) |
| `csoai-docs/horizon_europe_application.md` | €500k Horizon Europe (submit Apr 15) |
| `csoai-docs/innovate_uk_ai_champions.md` | Innovate UK (submit Apr 29) |
| `csoai-docs/eurohpc_application.md` | EuroHPC free compute (EHPC-DEV) |
| `csoai-docs/dstl_application.md` | Dstl defence capability proposal |
| `csoai-docs/ukri_future_leaders_fellowship.md` | UKRI FLF outline (Jun 2026) |
| `csoai-docs/templeman_foundation_outline.md` | Templeman outline (LOI: Jun-Jul 2026) |
| `csoai-docs/rd_tax_credit_documentation.md` | R&D tax credit claim pack (~£30k) |
| `csoai-docs/white_label_proposal.md` | TÜV/BSI licensing proposal |
| `csoai-docs/continuous_monitoring_spec.md` | SaaS monitoring product spec |
| `csoai-docs/agritech_vertical_strategy.md` | AgriTech go-to-market |
| `csoai-docs/equipment_sponsorship_emails.md` | NVIDIA/UR/FLIR outreach |
| `csoai-docs/linkedin_posts.md` | 5 ready-to-post templates |
| `csoai-docs/outreach_emergency_audit.md` | 10 email templates for £5k audits |
| `csoai-docs/whitepaper_sovereign_ai_safety.md` | White paper → MoD/Dstl |
| `csoai-docs/whitepaper_care_ethics_safety.md` | White paper → Anthropic/Templeman |
| `csoai-docs/whitepaper_capillary_cooling.md` | White paper → robotics companies |
| `csoai-docs/inventory.yml` | Honest infrastructure inventory |
| `csoai-docs/strategic_gaps_playbook.md` | 15 strategic gaps, tiered execution |
| `csoai-docs/meok_estate_trust_brief.md` | Jersey trust brief for solicitor |
| `csoai-docs/campus_bylaws.md` | MEOK estate campus rules |
| `csoai-docs/innovation_campus_strategy.md` | Science Park registration strategy |
| `csoai-docs/rd_tax_credit_documentation.md` | R&D tax credit claim (~£30k) |
| `csoai-docs/white_label_proposal.md` | TÜV/BSI white-label licensing |
| `csoai-docs/continuous_monitoring_spec.md` | MEOK AI Labs SaaS monitoring spec |
| `MEOK AI Labs-CORP/csoai-platform/routes/monitor.js` | Continuous monitoring API routes |
| `MEOK AI Labs-CORP/csoai-platform/routes/citizenship.js` | Digital citizenship API routes |
| `MEOK AI Labs-CORP/csoai-platform/models/SafetyEvaluation.js` | MongoDB eval model |
| `MEOK AI Labs-CORP/csoai-platform/models/ConsortiumApplication.js` | MongoDB consortium model |
| `MEOK AI Labs-CORP/csoai-platform/models/EmergencyAuditLead.js` | MongoDB audit leads model |
| `MEOK AI Labs-CORP/csoai-platform/models/SafetyMonitorSubscription.js` | MongoDB monitoring model |
| `MEOK AI Labs-CORP/csoai-platform/models/CitizenshipMember.js` | MongoDB citizenship model (session 2) |
| `MEOK AI Labs-CORP/csoai-platform/routes/facility.js` | Advanced Robotics Testing Facility routes |
| `MEOK AI Labs-CORP/csoai-platform/routes/admin_dashboard.js` | Revenue dashboard (GET /api/admin-revenue/dashboard) |
| `meok/ui/src/app/api/compliance/csoai-score/route.ts` | MEOK's own MEOK AI Labs score endpoint |
| `sovereign-temple/legion-omega/scripts/legion_master.py` | LegionMaster: 12 agno agents, quantum care scorer, A-Evolve |
| `sovereign-temple/legion-omega/scripts/flip_switch.sh` | Bootstrap: installs agno/pennylane/agentneo, clones A-Evolve+Genesis |
| `sovereign-temple/legion-omega/scripts/real_work_loop.py` | GPU batch analysis (5 projects, 27 stack_eval tools) |

---

## MEOK AI Labs PLATFORM — API ROUTES

All routes at `/api/*`:

| Route | Auth | Purpose |
|-------|------|--------|
| `GET /consortium/tiers` | public | Show tier pricing |
| `POST /consortium/apply` | public | Lead capture → MongoDB |
| `GET /consortium/members` | admin | List all applications |
| `POST /safety-eval/submit` | user | Submit AI for evaluation |
| `GET /safety-eval/:id` | user | Get eval status |
| `POST /safety-eval/:id/results` | admin | Post Inspect results |
| `POST /safety-eval/:id/run` | admin | Trigger Inspect eval (async, poll for status) |
| `POST /safety-eval/:id/certify` | admin | Issue certificate |
| `GET /safety-eval/verify/:certId` | public | Verify certificate |
| `GET /safety-eval/quick-score` | public | Free 5-probe quick score |
| `POST /safety-eval/emergency-audit` | public | £5k audit lead → MongoDB + Stripe |
| `GET /monitor/tiers` | public | Monitoring tier pricing |
| `POST /monitor/subscribe` | public | Subscribe to monitoring |
| `GET /monitor/:org_id` | user | Dashboard + score history |
| `POST /monitor/:org_id/scan` | admin | Trigger manual scan |
| `GET /monitor/:org_id/badge` | public | Embeddable badge data |
| `GET /citizenship/classes` | public | Membership tiers |
| `POST /citizenship/apply` | public | Apply for membership |
| `GET /citizenship/verify/:code` | public | Verify membership |
| `GET /citizenship` | admin | List all members |
| `POST /citizenship/:id/approve` | admin | Activate member |
| `GET /facility/packages` | public | Facility rental packages |
| `POST /facility/enquire` | public | Facility booking lead |
| `GET /facility/bookings` | admin | List all enquiries |
| `GET /admin-revenue/dashboard` | admin | Full revenue dashboard (all streams) |

---

## MEOK LABS SOVEREIGN STACK (session 2)

Installed on Python 3.11 (`/opt/homebrew/bin/python3.11`):

| Tool | Version | Status | Purpose |
|------|---------|--------|---------|
| agno | 2.5.14 | ✅ installed | Agent runtime (10,000x faster than LangGraph) |
| inspect-ai | 0.3.204 | ✅ installed | UK AISI safety evaluation framework |
| pennylane | latest | ✅ installed | Quantum-classical care scoring (8-qubit circuit) |
| agentneo | latest | ✅ installed | Multi-agent observability dashboard |
| anthropic | latest | installing | Required for agno Anthropic model backend |
| A-Evolve | 421 stars | needs flip_switch.sh | Self-rewriting agent DNA |
| Genesis | 28k stars | needs flip_switch.sh | Physics engine for embodied AI / HARVI sim |

**Run LegionMaster:**
```bash
cd /Users/nicholas/clawd/sovereign-temple/legion-omega
/opt/homebrew/bin/python3.11 scripts/legion_master.py
/opt/homebrew/bin/python3.11 scripts/legion_master.py --eval          # trigger MEOK AI Labs eval
/opt/homebrew/bin/python3.11 scripts/legion_master.py --test-evolution # test A-Evolve
```

**Install full stack:**
```bash
cd /Users/nicholas/clawd/sovereign-temple/legion-omega && bash scripts/flip_switch.sh
```

**Run Legion on MEOK AI Labs platform code:**
```bash
/opt/homebrew/bin/python3.11 scripts/real_work_loop.py --project csoai --task code
```

---

## GRANT PIPELINE — CRITICAL DEADLINES

| Grant | Ask | Deadline | Status | Action Required |
|-------|-----|----------|--------|----------------|
| ARIA | £250k | **Apr 14** | Draft ready | Nick submits at aria.org.uk/funding |
| Horizon Europe EIC | €500k | **Apr 15** | Draft ready | Nick registers at eic.ec.europa.eu first |
| Innovate UK AI Champions | TBC | **Apr 29** | Draft ready | Nick submits |
| R&D Tax Credit | ~£30k cash | **Sep 30** | Docs ready | Nick engages specialist this month |
| UKRI FLF | £1.175M | **Jun 2026** | Outline ready | Full application needed |
| Templeman LOI | £850k | **Jun-Jul 2026** | Outline ready | Confirm LOI deadline at templeman.org |
| EuroHPC EHPC-DEV | Free compute | Rolling | Draft ready | Need supercomputing centre contact |
| Dstl | TBC | Q3 2026 | Proposal ready | Nick finds Dstl contact |

---

## REVENUE TARGETS

| Stream | Target | Status |
|--------|--------|--------|
| Emergency audits (£5k × 10) | £50k Month 1 | 10 emails to send (templates ready) |
| Consortium (3 Anchor × £75k) | £225k | Prospectus ready, no leads yet |
| Continuous monitoring (50 × £2k/mo) | £1.2M ARR | Routes live, needs marketing |
| Emergency audit (25 × £25k) | £625k | Packages defined |
| ARIA grant | £250k | Draft ready |
| R&D tax credit | £30k | Docs ready |

---

## SOV3 TASK QUEUE (as of Apr 4)

Outstanding Jarvis tasks in coord queue:
- `task_5b81d146`: ARIA application (priority 10) — DONE, Nick reviews
- `task_5ad48e99`: Innovate UK AI Champions (priority 8) — DONE, Nick reviews
- `task_1b70605a`: Legion stack_eval (priority 7) — run: `python3 scripts/real_work_loop.py --project stack_eval --task code`
- `task_1f9383ab`: UKAS application draft (priority 9) — DONE
- `task_73c3e92f`: MEOK AI Labs AgriTech vertical strategy (priority 8) — DONE
- `task_0c9dd31d`: Horizon Europe (priority 10) — DONE, Nick reviews
- `task_839f5b96`: Sponsor prospectus — DONE
- `task_51601367`: Sovereign AI Safety white paper — DONE
- `task_b49fdc2f`: Care Ethics white paper — DONE
- `task_a1424041`: Equipment sponsorship — DONE
- `task_5d98b1a7`: UKRI FLF outline — DONE

---

## AUTONOMOUS TASK GUIDELINES FOR JARVIS

### When to act without asking Nick:
- Drafting documents (grant applications, white papers, proposals)
- Running stack_eval on Legion GPU nodes
- Adding routes/models to MEOK AI Labs platform
- Updating service_packages.yml, EXECUTION_PLAN.md
- Research and competitive intelligence
- Running care membrane evaluations via inspect-ai

### When to ask Nick first:
- Sending any external communications (emails, LinkedIn posts)
- Submitting grant applications
- Making payments or financial commitments
- Changing the constitutional principles
- Publishing anything externally
- Modifying production database schemas

### Care membrane constraints (always apply):
- Do not claim capabilities MEOK LABS doesn't have
- Do not create fake testimonials, fake data, or misleading metrics
- Honest about stage: pre-revenue, bootstrapped, solo founder
- The inventory.yml is the source of truth for what exists vs planned

---

## POSITIONING MANTRA (never deviate from this)

**MEOK LABS is NOT a startup begging for seed funding.**
**MEOK LABS IS a sovereign research institute offering sponsors access to the only UK facility combining distributed AI compute + physical farm testbed + UK AISI-aligned safety certification.**

Tesla/SpaceX analogy:
- MEOK.AI = Tesla (consumer product, proof of capability)
- MEOK AI Labs.org = SpaceX (the technical engine that funds the mission)
- MEOK LABS = the sovereign research state both operate within

Fraunhofer/MIT Media Lab model:
- Physical infrastructure that larger organisations cannot build themselves
- Research that funds itself through certification services
- Institute identity, not startup identity
