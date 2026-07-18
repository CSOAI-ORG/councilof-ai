# MEOK AI LABS — Shared Workspace for All Agents
## Single Source of Truth | M2 MacBook | May 31 2026

**This file is read by ALL agents:** Kilo, Kimi, Gemini, Claude, Hermes.
**Work here:** `/Users/iokfarm/workspace_for_ai/`
**Shared GitHub:** https://github.com/CSOAI-ORG/clawd-workspace

---

## RULES

1. **ONE workspace.** All agents work in `~/workspace_for_ai/`. No scattered dirs.
2. **ONE git repo.** `clawd-workspace/` is the source of truth. Commit/push regularly.
3. **No duplication.** Before starting any task, check `clawd-workspace/` for existing plans/docs.
4. **Tag your work.** When creating files, prefix with agent name: `KILO_<topic>.md`, `KIMI_<topic>.md`, etc.
5. **Update this file.** When you discover something important, add it here.
6. **Git discipline.** Pull before starting work. Push when done. Leave a commit message with your agent name.

---

## CURRENT STATE (2026-05-31)

### Architecture
- **M2** (this machine, iokfarm) — Safety/AI domain controller, Kilo coding, mesh node
- **M4** (192.168.50.105, nicholas) — Meok work, sov3 consciousness engine, CLAWD orchestrator
- **Full alignment doc**: `/Users/iokfarm/ECOSYSTEM-ALIGNMENT.md`
- **Master plan**: `/Users/iokfarm/MASTER-PLAN-ALL-DOMAINS.md`

### Access
- **M4 source**: SMB mount (down) / rsync copies at `/Users/iokfarm/domains/`
- **Lovable projects**: 36 projects in workspace "Nick's Lovable" — MCP authenticated via session token
- **GitHub**: CSOAI-ORG org, 50 repos, token in env
- **Vercel**: Token available but limited permissions

### Domain Status
| Status | Count | Notes |
|--------|-------|-------|
| Live (200) | 11 | councilof.ai, csoai.org, proofof.ai, safetyof.ai, suicidestop.ai, planthire.ai, muckaway.ai, haulage.app, grabhire.ai, templeman-opticians.com, fishkeeper.ai (redirect), koikeeper.ai (redirect) |
| Dead (000) | 7 | diyhelp.ai, loopfactory.ai, pokerhud.ai, industrial-hire-ai.com, industrial-domains.com, asisecurity-portal.com, optomobile.ai |
| Lovable source | 36 projects | Source lives only in Lovable — need GitHub export |

---

## SHARED FILES

| File | Purpose |
|------|---------|
| `AGENTS.md` | This file — coordination for all agents |
| `~/ECOSYSTEM-ALIGNMENT.md` | Full M2/M4 architecture map |
| `~/MASTER-PLAN-ALL-DOMAINS.md` | Domain-by-domain deployment plan |
| `~/m4-archives/` | 14 key architecture docs from M4 |
| `~/domains/` | Rsynced domain source code from M4 |
| `clawd-workspace/` | GitHub repo — plan docs + all MCPs + strategy |
| `clawd-workspace/LOVABLE_TAKEOVER_PLAN_2026-05-30.md` | Lovable export plan |
| `clawd-workspace/MEOK_GROUNDED_TODO_2026-05-31.md` | Today's grounded TODO |
| `clawd-workspace/MEOK_MASTER_PLAN_FULL_STEAM_2026-05-29.md` | Full execution plan |

---

## PRIORITY WORKSTREAMS

### 1. Export Lovable Source → GitHub
Lovable projects have the editable source. Need to export each to CSOAI-ORG/* repos.
- Open each project in Lovable Desktop → GitHub → Connect → Export
- Then clone to `~/workspace_for_ai/domains/`

### 2. Align Domains with lib2b/ACP/MCP
Once source is on GitHub, align all domains with:
- `CSOAI-ORG/lib2b` — The protocol layer (npm `@csoai/lib2b`)
- ACP gateway (WebSocket + SIGIL agent communication)
- MCP marketplace (345+ servers)
- A2A governance bridge

### 3. Deploy Dead Domains
7 domains with source code but not serving. Need Vercel deploy permissions or Lovable import.

### 4. Free M4 Disk Space
M4 at 89% capacity (2.2GB free). Run cleanup: clear zips, .docx, npm cache, Docker.

---

## LOVABLE MCP API

Authenticated with session cookie. Tools available:
- `list_workspaces`, `list_projects`, `get_project`
- `create_project`, `deploy_project`, `send_message`
- `list_files`, `read_file`, `get_diff`, `list_edits`
- `get_workspace_knowledge`, `set_workspace_knowledge`

Workspace ID: `Q8zXDuXsBAjGrVq3Kv8q` ("Nick's Lovable")
Plan: Pro, 36 projects

---

## GITHUB ACCESS

- Org: CSOAI-ORG
- Token: `<REDACTED-ROTATE-2026-06-07>`
- 50 repos including: clawd-workspace, lib2b, csoai-dashboard, csoai-org, awesome-meok
- Key repo: clawd-workspace — all strategy docs, MCP marketplace, domain sites

---

## AGENTS ON M2

| Agent | Terminal | Role |
|-------|----------|------|
| Kilo | Current | Coding, domain control, MCP orchestration |
| Kimi | Active | Mesh orchestrator, research |
| Gemini | Active | General assistant |
| Claude | Active | Code/agent work |
| Hermes | Active | Task planner |

---

*All agents: read this file before starting work. Update when you find something new.*
