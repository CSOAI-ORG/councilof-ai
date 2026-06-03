# MEOK AI LABS — LIVING TOPOLOGY & AGENT COORDINATION
## SINGLE SOURCE OF TRUTH | ALL AGENTS (Kilo, Kimi, Gemini, Claude, Hermes)
**Updated:** 2026-05-31 | **Repository:** https://github.com/CSOAI-ORG/clawd-workspace

---

## RULES OF THE ROAD

1. **ONE workspace:** `~/workspace_for_ai/` on M2. No scattered directories.
2. **ONE repo:** `CSOAI-ORG/clawd-workspace`. Pull before work, push when done.
3. **Tag your files:** Prefix with agent name: `KILO_`, `KIMI_`, `GEMINI_`, `CLAUDE_`, `HERMES_`
4. **No duplication.** Check existing plans before starting anything.
5. **Update AGENTS.md** when you discover something important.
6. **Git discipline:** `git pull` → work → `git add -A && git commit -m "Agent: description"` → `git push`

---

## MACHINE ARCHITECTURE

```
M2 (THIS MACHINE)                     M4 (192.168.50.105)
IOKs-MacBook-Air                      NICHOLAS's MacBook Air
iokfarm@192.168.50.176                nicholas@192.168.50.105
─────────────────────────────────────────────────────────────
SAFETY/AI DOMAINS ← YOU ARE HERE      MEOK WORK ONLY
Kilo / Kimi / Gemini / Claude         sov3 consciousness (:3101)
Kilo Code (lead coder)                PostgreSQL / Weaviate / Neo4j
OpenClaw (memory + gateway)           NATS JetStream event bus
Ollama 6 models (mesh pool)           345 MCP marketplace servers
16 cron jobs + watchdog               CLAWD orchestrator
9 domains rsynced to ~/domains/       Character factory / neural training
```

Every M4 file accessible via SSH: `ssh nicholas@192.168.50.105` (key-based, passwordless)

---

## REPOSITORY STRUCTURE

```
clawd-workspace/                    ← GitHub source of truth
├── AGENTS.md                       ← THIS FILE — read first
├── m2/                             ← M2 Mac work (this machine)
│   ├── AGENTS.md                   ← Coordination doc for agents
│   ├── docs/                       ← Strategy & architecture docs
│   │   ├── ECOSYSTEM-ALIGNMENT.md  ← Full M2/M4 architecture map
│   │   ├── MASTER-PLAN-ALL-DOMAINS.md
│   │   ├── M2-PRODUCTIVITY-MANIFESTO.md
│   │   └── clawd-*.md             ← Identity, memory, soul
│   ├── m4-archives/                ← 14 key docs from M4
│   ├── configs/                    ← Kilo config, Claude config
│   ├── scripts/                    ← mesh-*, mount-m4.sh
│   ├── mesh/                       ← Mesh node config
│   ├── sovereign/                  ← Quantum/care experiments
│   └── desktop/                    ← Desktop docs & grants
│
├── M2-ECOSYSTEM-ALIGNMENT.md       ← Alignment doc (top level)
├── M2-MASTER-PLAN-ALL-DOMAINS.md   ← Master plan (top level)
├── M2-WORKSPACE-RULES.md           ← Workspace rules (top level)
│
├── sovereign-temple/               ← SOV3 consciousness engine
├── mcp-marketplace/                ← 345 MCP servers
├── strategy/                       ← Business strategy
├── revenue/                        ← Revenue plans
├── domains/                        ← Domain source projects
└── ...                             ← Everything else
```

---

## DOMAIN ECOSYSTEM

### LIVE (11 domains — all 200 OK)
| Domain | Type | Notes |
|--------|------|-------|
| councilof.ai | AI governance | Needs Stripe (£499-4,990/mo) |
| csoai.org | Governance institution | "FAA for AI" |
| proofof.ai | Deepfake detection | Monetized |
| safetyof.ai | Safety posture | Live |
| suicidestop.ai | Crisis page | Non-commercial trust |
| planthire.ai | Construction | Lead gen |
| muckaway.ai | Waste mgmt | Lead gen |
| haulage.app | Trade hub | Live |
| grabhire.ai | Labour hire | Live |
| templeman-opticians.com | Real business | £2.5-5K/mo |
| fishkeeper.ai | Redirect | → meok.ai |
| koikeeper.ai | Redirect | → meok.ai |

### DEAD (7 domains — need deploy)
| Domain | M4 Dir | GH Repo |
|--------|--------|---------|
| diyhelp.ai | ~/diyhelp.ai | CSOAI-ORG/diyhelp |
| loopfactory.ai | ~/loopfactory.ai | CSOAI-ORG/loopfactory |
| pokerhud.ai | ~/pokerhud.ai | CSOAI-ORG/pokerhud |
| industrial-hire-ai | ~/industrial-hire-ai | ❌ create |
| industrial-domains | ~/industrial-domains | CSOAI-ORG/industrial-domains |
| asisecurity-portal | ~/asisecurity-portal | CSOAI-ORG/asisecurity-portal |
| optomobile.ai | TBD | ❌ create |

---

## GITHUB CREDENTIALS

- **Token:** `[REDACTED-SECRET-GH-PUSH-PROTECTION]`
- **User:** CSOAI-ORG
- **Email:** nicholas@meok.ai
- **300+ repos**, 50 public, 250+ private
- **Library repo:** https://github.com/CSOAI-ORG/lib2b (npm `@csoai/lib2b`)
- **Package published:** 264 PyPI MCPs, 50 npm packages

---

## LOVABLE MCP ACCESS

- **Endpoint:** `https://mcp.lovable.dev`
- **Workspace:** "Nick's Lovable" (ID: `Q8zXDuXsBAjGrVq3Kv8q`)
- **Plan:** Pro, 36 projects
- **Auth:** Session JWT (in `~/workspace_for_ai/access/lovable-session.txt`)
- Requires Lovable GitHub App installed on CSOAI-ORG for file read/write

---

## ACTIVE AGENTS ON M2

| Agent | Terminal | Role | Last Activity |
|-------|----------|------|---------------|
| Kilo | Current | Lead coder, domain orchestration | Now |
| Kimi | ttys007 | Mesh orchestrator | Active |
| Gemini | ttys004 | General assistant | Active |
| Claude | — | Code/agent work | Active |
| Hermes | ttys006 | Task planner | Active |

---

## PRIORITY WORKSTREAMS (ordered)

1. **Install Lovable GitHub App** on CSOAI-ORG → Connect repos to Lovable projects
2. **Align 9 domains** with lib2b/ACP/MCP (use `@csoai/lib2b`)
3. **Deploy 7 dead domains** (Vercel or Lovable)
4. **Free M4 disk space** (2.2GB free — critical risk)
5. **Process grant pipeline** (adopt, agriscale, dsit, nlnet)
6. **SEO & content** (sitemaps, JSON-LD, structured data on all domains)

---

## COMMAND CHEAT SHEET

```bash
# M4 access (SSH)
ssh nicholas@192.168.50.105
rsync -av nicholas@192.168.50.105:~/path/ ~/local/path/

# M4 disk check
ssh nicholas@192.168.50.105 'df -h /'

# M4 urgent cleanup
ssh nicholas@192.168.50.105 'rm -f ~/Desktop/*.zip ~/*.docx; docker system prune -af'

# GitHub workflow
export GH_TOKEN="[REDACTED-SECRET-GH-PUSH-PROTECTION]"
curl -s -H "Authorization: token $GH_TOKEN" "https://api.github.com/users/CSOAI-ORG/repos"

# Lovable MCP (via Python)
python3 /tmp/lovable_client.py list_workspaces

# Check domain status
curl -s -o /dev/null -w "%{http_code}\n" https://diyhelp.ai

# M2 mesh status
mesh-status | mesh-prod status

# Pull latest workspace
cd ~/workspace_for_ai/clawd-workspace && git pull

# Commit and push
cd ~/workspace_for_ai/clawd-workspace && git add -A && git commit -m "Agent: message" && git push
```

---

## KEY FILES REFERENCE

| File | Path | Purpose |
|------|------|---------|
| AGENTS.md | `~/workspace_for_ai/clawd-workspace/AGENTS.md` | **THIS FILE — living topology** |
| ECOSYSTEM-ALIGNMENT.md | `m2/docs/ECOSYSTEM-ALIGNMENT.md` | Full architecture map |
| MASTER-PLAN-ALL-DOMAINS.md | `m2/docs/MASTER-PLAN-ALL-DOMAINS.md` | Domain deployment plan |
| M2-PRODUCTIVITY-MANIFESTO.md | `m2/docs/M2-PRODUCTIVITY-MANIFESTO.md` | Mesh node schedule |
| LIVING_TOPOLOGY_v2.md | `m2/m4-archives/LIVING_TOPOLOGY_v2.md` | MEOKCLAW OS topology |
| MEOKCLAW_OS_MASTER_PLAN.md | `m2/m4-archives/MEOKCLAW_OS_MASTER_PLAN.md` | OS phase plan |
| Kilo config | `m2/configs/kilo.jsonc` | MCP server config |
| Mesh scripts | `m2/scripts/mesh-*` | Production automation |

---

## DISK & RESOURCE MONITORING

| Resource | M2 | M4 |
|----------|-----|-----|
| RAM | 8GB (bottleneck) | 16GB |
| Disk | ~80% | 89% (2.2GB FREE — CRITICAL) |
| Ollama | 6 models | Gemma 4 |
| Services | mesh-prod, openclaw, ollama | sov3, postgres, nats, weaviate, neo4j |
| Cron | 16 jobs | sov3 schedulers |

---

*This is the LIVING TOPOLOGY. Every agent updates this as the ecosystem evolves.*
*commit: `git add -A && git commit -m "Agent: <what changed>" && git push`*

## LIVE CHECKOUT (ACCEPTING PAYMENTS)

**Main checkout:** https://www.csoai.org/checkout — £79/mo Pro, £299/mo Enterprise
**Backup URL:** https://checkout-deploy-three.vercel.app
**Stripe:** LIVE, verified, ready to charge

**Revenue:** £0. First sale = £79/mo. Send traffic to the checkout URL.
