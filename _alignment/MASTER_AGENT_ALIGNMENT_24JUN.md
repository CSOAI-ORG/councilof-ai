# 🐉 MASTER_AGENT_ALIGNMENT — 25 JUN 2026 (04:35 UTC)
**Author:** Hermes Agent (subagent) · **Task:** Full agent + PC + GitHub alignment sweep  
**Sources:** `AGENTS.md`, all `_alignment/*` files, `git status`, `gh repo list`, `ls ~/clawd/*/`, live intake docs  
**Purpose:** Single-pane-of-glass: every agent's status, every repo's health, every directory's purpose. Flags phantoms, conflicts, stale assets.

---

## 1. EXECUTIVE SUMMARY

| Dimension | Verdict |
|---|---|
| Sibling agents | **7 agents** active across Mac + VM. Claude (builder/DAY70+), Kimi (frontend/UI/47-town), MiniMax M3 (auditor), JEEVES (autonomous engines), Gemini, Kilo, Hermes |
| Git hygiene | **14 uncommitted files** (8 modified + 6 untracked). Branch `m4-handoff-2026-06-24`, 1 commit ahead. NO merge conflicts detected. |
| GitHub repos | **100 returned** (limit hit — real count ~557). 4 PRIVATE, 96 PUBLIC. ~15 stale (>7 days untouched). |
| Project directories | **~115+ top-level dirs** in `~/clawd/` — deploy surfaces, MCP marketplaces, core codebases, internal docs, vertical products |
| Alignment files | **15 files** in `_alignment/` covering 02-Jun through 24-Jun. Master = `ALIGNMENT_2026-06-20.md` |
| Revenue | **£0 MRR** — gated on 4 Nick actions (Stripe keys→Vercel, live-flip, PyPI/npm 2FA, SMITHERY) |
| Blockers | P0: csoai.org EU AI Act hub 404. P1: openpatent backend offline, openmoe MCP server down. P2: 4 revenue-unlock keystrokes |

---

## 2. SIBLING AGENT STATUS MAP

### 2.1 Active Agent Register

| # | Agent | Model/Platform | Lane | Current State | Active Tasks | Last Update |
|---|---|---|---|---|---|---|
| 1 | **Claude** | Claude Opus 4.8 (1M ctx) | BUILDER — ships code, fixes, memory, commits | DAY70+, active | King Hive jury (747 rounds as of 25-Jun), Policy Lab, flywheel sim verification, BFT 73, 6,040 certs | 25 Jun (flywheel correction at 14:20) |
| 2 | **Kimi** | Kimi K2.5 (Moonshot) | FRONTEND/UI — town UI, research, goldmine, GRCIN product | Active — received Claude handoff 09:15 20-Jun | Wire town UI to REAL signed data (contract in `policy-lab/`). 47-agent personalities, 3D town, 198 data sources, UE5.8 integration spec | 21 Jun (47-Agent Town Integration doc) |
| 3 | **MiniMax M3** | minimax-m3:cloud | AUDITOR — writes `_findings/` only, read-only audits, drift detection | Active — auditing deploy dirs | Claimed audit-deploy, keystone-deploy, all *-deploy dirs (06:55 20-Jun). 7-layer E2E audit. | 25 Jun (D101-D110 launch seal) |
| 4 | **JEEVES** | Kimi Code CLI | AUTONOMOUS — data engines, synth, PSC, CSOAI consolidation, cert waves, empire execution | Active — autonomous engines on VM cron | 48hr master orchestrator, OLM brain, VM crons, SOV Town proxy, 97 intake files, 700+ cert waves | 25 Jun 04:15 UTC (deep audit + D101-D110) |
| 5 | **Gemini** | Gemini | Mentioned in AGENTS.md §1 | Lane NOT defined in coordination board | Unknown active tasks | None found in alignment files |
| 6 | **Kilo** | (unknown) | Mentioned in AGENTS.md §1 | Lane NOT defined in coordination board | Unknown active tasks | None found in alignment files |
| 7 | **Hermes** | Hermes Runtime (this session) | MULTI — orchestration, task execution, coordination sweeps | Active — executing this alignment sweep | Full agent+PC+GitHub alignment. Also JEEVES-aligned tasks on VM/Vercel/certs. | 25 Jun (this document) |

### 2.2 Ownership Matrix (from AGENTS.md §5 + claims board)

| Lane | Owner | Files/Dirs Owned |
|---|---|---|
| Builder | **Claude** | `meok-one/`, `sovereign-temple/`, `MEMORY.md`, `_alignment/` |
| Auditor | **MiniMax M3** | `_findings/` (read-only; proposes, never edits code/memory) |
| Frontend/UI | **Kimi** | Town UI (`app/`), 47-industry goldmine, GRCIN arch, domain_data/ |
| Autonomous | **JEEVES** | VM engines, synth factories, PSC data, cert pipelines, Vercel deploys |
| Sovereign | **Nick** | Revenue keys, Stripe live-flip, PyPI/npm 2FA, SMITHERY, DNS/Vercel alias |

### 2.3 Unmapped/Phantom Agents
- **Gemini** and **Kilo**: listed in AGENTS.md §1 as running platforms but have NO lane definition, NO claims on the board, NO alignment files referencing them, NO files prefixed with `GEMINI_` or `KILO_`. **TREAT AS PHANTOM** until they surface with a claim.
- **Gemini/Kilo** file ownership: ZERO files in `git status` match these prefixes. Likely not active in this workspace.

---

## 3. COORDINATION BOARD STATE (AGENTS.md §4)

### Current Board (newest → oldest)

| Time | Agent | Status | Task |
|---|---|---|---|
| $(date +%H:%M) | Hermes/JEEVES | RELEASED | ~/meok-ai/ui/ - Vercel link `niks-projects-0a2ef942` (P1.1 revenue unblock) |
| 14:20 | Claude | ACTIVE (correction) | Flywheel sim correction: real curve, not perfect-gate tautology |
| 14:00 | Claude | RELEASED (audit milestone) | Sovereign Town flywheel verified: 511 cycles, 649M episodes, Ed25519-signed |
| 09:15 | Claude→Kimi | ACTIVE (handoff) | Wire town UI to REAL signed data. Contract in `policy-lab/`. Claude owns feed/backend. |
| 08:55→09:05 | Claude | RELEASED | Mapped Kimi's Agent-47 package. PROPOSED: Kimi=frontend, Claude=backend |
| 08:10→08:35 | Claude | RELEASED | King jury built + validated (NOT wired — VM memory constraint) |
| 05:40→05:30 | Claude | RELEASED | King-judge degeneracy FIXED. 43.4% non-attestable → honest TIEs now recorded |
| 05:15 | Hermes/JEEVES | RELEASED | D65-D70 execution. BFT 64→73. 1,700 certs processing. |
| 06:55 | JEEVES/MiniMax-M3 | ACTIVE (claim still up) | Audit-deploy + keystone-deploy + all *-deploy dirs — E2E 7-layer audit |

### ⚠️ STALE CLAIMS (not yet released)
- **[06:55 JEEVES/MiniMax-M3]** — "CLAIM audit-deploy + keystone-deploy + all *-deploy dirs" — this claim is from 20-Jun and is still marked as CLAIM (not RELEASED). The audit work appears to have been completed (see `_intake/AUDIT_AND_D101_D110_2026-06-25.md`) but the claim was never struck through. **Likely stale — verify with MiniMax M3.**

---

## 4. GIT HYGIENE REPORT

### 4.1 Status Summary
```
Branch: m4-handoff-2026-06-24 (ahead of origin by 1 commit)
14 uncommitted files total:
  - 8 modified (not staged)
  - 0 staged
  - 6 untracked
```

### 4.2 Uncommitted File Inventory

| File | Type | Owner (by prefix/domain) | Risk | Notes |
|---|---|---|---|---|
| `AGENTS.md` | Modified | **SHARED** (board) | ⚠️ MEDIUM | Append-only claim board — modifications should be scoped claims. Need to verify what 22-line change is. |
| `_findings/UPTIME_MONITOR_2026-06-17.json` | Modified | **MiniMax M3** (auditor) | ✅ LOW | Audit data update, non-code. 28-line diff. |
| `coai` | Modified (submodule, untracked content) | **Unknown** | ⚠️ MEDIUM | Submodule with untracked content. Check if this is intentional work or drift. |
| `haulage-deploy` | Modified (submodule, modified+untracked) | **JEEVES/Hermes** (deploy) | ⚠️ MEDIUM | Submodule with modified AND untracked content. Haulage vertical. |
| `openmoe` | Modified (submodule, modified+untracked) | **Claude** (builder) | ⚠️ MEDIUM | Submodule with both modified and untracked content. Claude's lane. |
| `openpatent-hive/data-room-latest.zip` | Modified | **JEEVES/M3** (data) | ✅ LOW | Binary — data room update. 107KB unchanged size but flagged as modified. |
| `optimobile-practice-hub` | Modified (submodule, modified+untracked) | **Unknown** | ⚠️ MEDIUM | Submodule with untracked content. Optometry vertical. |
| `sov-town-llm` | Modified (submodule, modified+untracked) | **Kimi/Hermes** (town) | ⚠️ MEDIUM | Submodule with both modified and untracked content. SOV Town LLM fork. |
| `_intake/AUDIT_AND_D101_D110_2026-06-25.md` | Untracked | **MiniMax M3/JEEVES** | ✅ LOW | Today's audit doc — should be committed after review. |
| `_intake/AUDIT_TEST_2026-06-25.md` | Untracked | **MiniMax M3/JEEVES** | ✅ LOW | Audit test output. |
| `_intake/MONDAY_24JUN_FULL_RUNDOWN.md` | Untracked | **JEEVES** | ✅ LOW | Monday rundown — should be committed. |
| `council-of-mcps/councilof/CONSOLIDATED.md` | Untracked | **MiniMax M3/Hermes** | ✅ LOW | Consolidation audit artifact. |
| `openpatent-hive/data-room-20260625-052050.zip` | Untracked | **JEEVES** | ✅ LOW | Dated data room snapshot. |
| `production/councilof/CONSOLIDATED.md` | Untracked | **MiniMax M3/Hermes** | ✅ LOW | Production consolidation. |

### 4.3 Conflict Analysis
- **NO merge conflicts detected.** Branch is 1 commit ahead of `origin/m4-handoff-2026-06-24`.
- **Submodule risk:** 5 submodules show modified/untracked content. This is normal for active development but means commits inside those submodules have not been pushed to their respective origins. Need to audit each submodule before a naive parent-repo push.
- **Shared file risk:** `AGENTS.md` is modified — it's a shared board file that requires claiming before editing (§4 rule). The modification needs to be verified as a legitimate claim/release.
- **No `*.orig` or conflict markers** in any tracked file.

### 4.4 Branch State
```
Branch: m4-handoff-2026-06-24 (NOT main)
Ahead of origin/m4-handoff-2026-06-24 by 1 commit
```
⚠️ **NOTE:** This is NOT the `main` branch. The AGENTS.md states `branch main`. This `m4-handoff` branch may be a handoff snapshot. Verify whether work should merge back to `main` or continue on this branch.

---

## 5. GITHUB REPOSITORY CATALOG (CSOAI-ORG)

### 5.1 Overview
- **Total returned:** 100 (gh CLI default limit; real count ~557 per ALIGNMENT_2026-06-20.md)
- **Visibility:** 96 PUBLIC, 4 PRIVATE
- **Query limit:** `--limit 100` hit. 457 repos NOT catalogued. Re-run with higher limit for full inventory.

### 5.2 Private Repos (SENSITIVE — audit for exposure)
| Repo | Last Updated | Description |
|---|---|---|
| `meok-town-view` | 2026-06-25 | (no description) — freshly updated today |
| `clawd-workspace` | 2026-06-23 | Templeman family clawd workspace — revenue, family business, sovereign-temple, MCPs, marketing |
| `meok-saas` | 2026-06-23 | (no description) |
| `meok-ai` | 2026-06-23 | MEOK AI — "The AI that learns you, becomes you, and stays yours forever" |

### 5.3 Key Public Repos (active/high-value)

| Repo | Visibility | Last Updated | Description | Health |
|---|---|---|---|---|
| `councilof-ai` | PUBLIC | 2026-06-24 | Democratic AI Governance through Council of 12 AIs | ✅ Active |
| `csoai-dashboard` | PUBLIC | 2026-06-24 | CSOAI — the ISO for AI Safety. EU AI Act / NIST RMF / ISO 42001 compliance | ✅ Active |
| `csoai-org` | PUBLIC | 2026-06-23 | CSOAI organization website — 52-Article Charter, CEASAI certification | ✅ Active |
| `haulage-deploy` | PUBLIC | 2026-06-21 | MEOK trade-compliance umbrella SaaS — 27 routes, 14 locales, PWA, 32-MCP | ✅ Active |
| `sovereign-flywheel-proof` | PUBLIC | 2026-06-22 | (no description) | ✅ Active — Claude's flywheel verification |
| `sigil-proofs` | PUBLIC | 2026-06-22 | (no description) | ✅ Active — Ed25519 proof chain |
| `meok-compliance-gateway` | PUBLIC | 2026-06-21 | Streamable-HTTP/container builds of MEOK compliance MCPs | ✅ Active |
| `meok-attestation-api` | PUBLIC | 2026-06-21 | MEOK AI Labs attestation API | ✅ Active |
| `sovereign-self-healing-mcp` | PUBLIC | 2026-06-21 | Self-healing infrastructure MCP — anomaly detection, auto-remediation | ✅ Active |
| `sovereign-temple` | PUBLIC | 2026-06-21 | (no description) | ✅ Active |
| `openpatent-hive` | PUBLIC | 2026-06-21 | (no description) | ✅ Active |
| `meok-sovereign-stack` | PUBLIC | 2026-06-21 | (no description) | ✅ Active |

### 5.4 Stale / Potentially Unused Repos (>7 days since last update)

| Repo | Last Updated | Days Stale | Risk |
|---|---|---|---|
| `openchronicle-mcp` | 2026-06-16 | 9 days | ⚠️ LOW — might be stable |
| `openpatent-hive` | 2026-06-21 | 4 days | Low |
| `agent-zero` | 2026-06-13 | 12 days | ⚠️ MEDIUM — fork, may not be maintained |
| `csoai-governance` | 2026-06-13 | 12 days | ⚠️ MEDIUM — governance engine abandoned? |
| `csoai-global` | 2026-06-13 | 12 days | ⚠️ MEDIUM — no description, no recent activity |
| `mcp-servers` | 2026-06-13 | 12 days | ⚠️ MEDIUM — "15+ production-ready AI tools" marketplace listing, stale |
| `OpenHands` | 2026-06-13 | 12 days | ⚠️ LOW — fork of external project |
| `langfuse` | 2026-06-13 | 12 days | ⚠️ LOW — fork of external project |

### 5.5 MCP Tool Repos (bulk — all public, ~80 repos)
The vast majority of returned repos are single-purpose MCP server tools (e.g., `csv-tools-ai-mcp`, `sleep-tracker-ai-mcp`, `uuid-ai-mcp`, etc.). These follow the pattern `[function]-ai-mcp` and were last updated between 2026-06-12 and 2026-06-17.

**Assessment:** These are the MCP marketplace fleet. Most are "published once, rarely updated" scaffold tools. The real compliance/governance MCPs (EU AI Act, DORA, NIS2, ISO 42001) are in the `apify_actors/` and `mcp-marketplace/` directories locally, NOT all as separate GitHub repos.

**Risk:** ~80 low-value scaffold MCP repos dilute the CSOAI-ORG GitHub presence. Consider archiving or consolidating.

### 5.6 Repos NOT in the returned 100 (need verification)
Per `ALIGNMENT_2026-06-20.md`: total = 557 repos. Only 100 returned. The missing 457 repos may include:
- `OPENMOE` (referenced in Layer 0 audit)
- `bft-progress-council-mcp` (referenced as proven)
- Various MCP server repos
- Archived/legacy repos

**Action:** Re-run `gh repo list CSOAI-ORG --limit 600` for full catalog.

---

## 6. DIRECTORY INVENTORY (~/clawd/*/)

### 6.1 Active Product/Service Directories

| Directory | Purpose | Owner | Notes |
|---|---|---|---|
| `sovereign-temple/` | Core sovereign AI architecture — MCP hub, conscience engine, Jarvis, BFT council, 100+ Python modules | Claude (builder) | Heaviest codebase. 200+ files. |
| `sovereign-temple-live/` | Production deployment of sovereign-temple on VM. Dockerfiles, e2e tests, agent configs. | Claude/JEEVES | Deployment-ready. Has `docker-compose.production.yml`. |
| `sovereign-temple-public/` | Public-facing copy of sovereign-temple. Mostly identical to `sovereign-temple/`. | Claude | Likely a duplicate. **PHANTOM CANDIDATE**. |
| `sov-town-llm/` | SOV Town LLM proxy — a16z AI Town fork + FreeLLMAPI, TypeScript, 47 agent personas | Kimi/Hermes | Active. Submodule with uncommitted changes. |
| `sov-town-poc/` | SOV Town POC — a16z AI Town clone, React/Vite, Convex backend | Kimi | Frontend POC for town visualization. |
| `sov-town/` | SOV Town TypeScript build, docs, scenarios | Kimi/Claude | Build/dist artifacts. |
| `sov3-deploy/` | SOV3 deployment playbooks — 200+ docs, scripts, configs. Revenue battle plans, Stripe setup, MCP inventory. | JEEVES/Hermes | Documentation-heavy. Many aspirational/planning docs. |
| `sov3-backbone/` | SOV3 backbone router. `router.py` + serve script. | Claude | Minimal. |
| `sov3-hermes/` | Hermes config for SOV3 integration. `config.yaml` + `skills/`. | Hermes | Small. |
| `openpatent-hive/` | OpenPatent Hive — 23-tool MCP server, BFT, SIGIL, patent disclosure pipeline | Claude/JEEVES | Most complete product surface. Backend offline. |
| `openmoe/` | OpenMoE BFT — provider router, EU AI Act evaluator, agent card validator | Claude | Submodule. MCP server not deployed. |
| `mcp-marketplace/` | MCP marketplace — 340+ MCP servers, scorecard engine, publishing scripts | JEEVES | Fleet management. Scorecard is real; public UI is not. |
| `meok-cross-post/` | MEOK cross-post — fleet scoreboard, repo auditing, metadata cross-posting | JEEVES | Real code. Not published to PyPI. |
| `sprint/` | Active sprint plans — Kimi-Claude integration, judge jury upgrade, DORA whitepaper | Claude | Active planning docs. |
| `policy-lab/` | Policy Lab — flywheel verification, town feed generator, FEED_CONTRACT | Claude | Real signed data + verified simulation results. |

### 6.2 Deploy Directories (Vercel Landing Pages — ~40 dirs)

These follow the pattern `[product]-deploy/` and contain static HTML landing pages deployed to Vercel:

**Brand Hives (high value):** `councilof-deploy/`, `proofof-deploy/`, `transparencyof-deploy/`, `safetyof-deploy/`, `accountabilityof-deploy/`, `agisafe-deploy/`, `asisecurity-deploy/`, `biasdetectionof-deploy/`, `dataprivacyof-deploy/`, `ethicalgovernanceof-deploy/`

**Vertical Products:** `grabhire-deploy/`, `koikeeper-deploy/`, `fishkeeper-deploy/`, `landlaw-deploy/`, `loopfactory-deploy/`, `muckaway-deploy/`, `optimobile-deploy/`, `planthire-deploy/`, `commercialvehicle-deploy/`, `diyhelp-deploy/`, `pokerhud-deploy/`

**CSOAI Products:** `csoai-deploy/`, `openmoe-deploy/`, `openpatent-ai-deploy/`, `meok-deploy/`, `aeo-registry-deploy/`, `agent-network-deploy/`, `annual-report-deploy/`, `apply-48h-deploy/`, `audit-deploy/`, `audit-feed-deploy/`, `security-deploy/`, `sitemap-index-deploy/`, `socialmediamanager-deploy/`, `sov3-deploy/`, `sovereign-town-deploy/`, `subscribe-deploy/`, `supplier-portal-deploy/`, `support-deploy/`, `terms-deploy/`, `thanks-deploy/`, `transparency-deploy/`, `wowmcp-deploy/`, `app-deploy/`, `about-deploy/`

**Family/Personal:** `templeman-opticians-site/`, `suicidestop-deploy/`, `suicidestop-care/`

### 6.3 Internal Documentation Directories

| Directory | Contents | Files |
|---|---|---|
| `_alignment/` | Master alignment docs, agent cards, audit reports, specs | 15 files |
| `_findings/` | MiniMax M3 audit reports, E2E audits, daily dashboards, health checks, blog drafts | 129+ files |
| `_intake/` | Planning docs, sprint reports, seals, cert manifests, automation scripts | 97+ files |
| `_TABS/` | Historical tab profiles, architecture docs, coordination plans, strategy docs | 50+ files |
| `_TOPOLOGY/` | Domain maps, haulage plans, revenue plans, spider web strategy, master index | 35+ files |
| `_RESEARCH_REVIEW/` | Research dossiers, session indexes, GitHub repo index, whitepapers | 13 subdirs |
| `_archive/` | Archived sessions, severed brands, Kimi Agent-47, swarm sessions | 7 subdirs |
| `_m4-handoff/` | M4 handoff docs, audit alignment, pond dashboards, MEOK master | 14 files |
| `_m2_import/` | CSOAI brand clean, reconstruction script | 3 items |
| `_SESSION_LOGS/` | JEEVES session logs for TUI autonomy sessions | 2 files |
| `_meok_csoai_library/` | MEOK CSOAI Master Library — 52-Article Charter, white papers, crosswalks, business/legal, marketing | 11 category dirs |
| `_whitepapers/` | 5 whitepaper HTML files (sovereign AI, BFT council, crosswalk, watchdog, governance) | 5 files |
| `_outreach/` | Prospect emails | 1 file |
| `_pitch/` | Series A pitch deck v1 | 1 file |
| `_ip/` | IP playbook, templates, trade secrets | 3 items |
| `_private_dagon/` | Dagon geospatial intel, crosswalks | 3 items |
| `_scripts/` | Utility scripts | 1 file |
| `_staging/` | Staged distribution files | 2 files |
| `_tmp_meok_protocol_0/` | Protocol 0 research — docx/txt research files | 12 files |
| `_tooling/` | Security header scripts | 2 files |
| `_waves/` | Economy wave data | 1 dir |
| `_autonomy/` | FOR_NICK.md | 1 file |
| `_fiction/` | Sovereign By Design spec | 2 files |
| `_inbox/` | 3D gaming arch, Kimi MEOK data | 3 subdirs |
| `_ZIP_DROPS/` | Strategy packs, competitive analysis, vulnerability scans | 7 items |
| `_deprecated_hive_dupes/` | Deprecated hive duplicate deploy dirs | 7 subdirs |
| `_orphans_openpatent_pages/` | Stale MEOK UI, onboard, portfolio | 3 subdirs |

### 6.4 Data & Infrastructure Directories

| Directory | Purpose |
|---|---|
| `DATA_ROOM/` | Investor data room — corporate, IP, product, traction, market, financials, team |
| `backups/` | Rolling backups — DB dumps, configs, memory archives |
| `scripts/` | ~200+ automation scripts — daily seals, E2E tests, deploy scripts, cron wrappers, email pipelines |
| `automation/` | Docker compose, n8n workflows, model router, orchestrator |
| `revenue/` | Revenue plans, Stripe products, MCP monetization, scorecard gap maps |
| `tests/` | E2E test suite |
| `tools/` | Stripe product creators, PyPI checker, self-audit runner |
| `sigil/` | Ed25519 sigil module |
| `searxng/` | SearXNG search engine config |
| `solana-sbt/` | Solana SBT (Soul-Bound Token) program |
| `trust-registry-api/` | Trust registry API — TypeScript |
| `vast-ai-deployment/` | Vast.ai GPU deployment configs |

### 6.5 Hardware/Engineering Directories

| Directory | Purpose |
|---|---|
| `Ironless-QDD-Actuator/` | Open-source WOLF actuator competitor — CAD, FEA, BOM, winding scheme. $40-70 BOM. |
| `wolf-actuator/` | WOLF actuator — CAD, assembly guide, README |
| `modular-bearing/` | Modular bearing design |

### 6.6 Vertical Shell / SDK

| Directory | Purpose |
|---|---|
| `vertical-shell/` | Next.js vertical business shell — template for grabhire, koikeeper, etc. |
| `sdk/` | TypeScript SDK, Unity SDK, vertical clone playbook |

### 6.7 Other Directories

| Directory | Purpose |
|---|---|
| `accounts/` | Social media launch content — HN, Reddit, Twitter, ProductHunt, IndieHackers |
| `PASSPORT_LAUNCH_13JUN/` | MCP Registry passport launch campaign |
| `DAY8_DAY9_ENHANCEMENTS_2026-06-15/` | Character activation, patent/PyPI scripts |
| `apify-actors/` | MEOK Apify actors — 10 compliance actors |
| `apify_actors/` | MEOK Apify actors v2 — 19 hardened MCP actors with Dockerfiles |
| `audits/` | Historical audit reports (April 2026) |
| `awesome-meok-mcp/` | Awesome list — MEOK MCP registry |
| `council-of-mcps/` | Council of MCPs consolidation |
| `production/` | Production council consolidation |
| `coai/` | COAI cross-reference (submodule) |
| `fleet/` | Fleet management |
| `haulage-deploy/` | Haulage vertical deploy (submodule) |
| `keystone-deploy/` | Keystone deploy |
| `meok-one/` | MEOK ONE main app (Claude's domain) |
| `meok-ai/` | MEOK AI landing/config |
| `optimobile-practice-hub/` | Optometry practice hub (submodule) |
| `self_audit_output/` | MEOK self-audit cert |
| `topology-dashboard/` | Topology visualization dashboard |
| `unified-portfolio-catalog/` | Brand portfolio, MCP catalog, Stripe products, SEO/AEO catalog |
| `vercel-deployables/` | 8 vertical site deployables (commercialvehicle, fishkeeper, grabhire, etc.) |

---

## 7. ALIGNMENT FILE INDEX (chronological)

| File | Date | Author | Purpose | Status |
|---|---|---|---|---|
| `ALIGNMENT_2026-06-02.md` | 02 Jun | Claude | Original master alignment. 168 lines. Superseded by 20-Jun. | HISTORIC |
| `AGENT_CARD_MEOK_BUILDER.md` | 06 Jun | Claude | Claude's agent card — identity, capabilities, guardrails | CURRENT |
| `B_CORP_READINESS_SCAFFOLD.md` | 21 Jun | JEEVES | B Corp certification readiness scaffold (200-point template for Nick) | SCAFFOLD |
| `HORUS_DEPLOYMENT_SPEC_v1.md` | 21 Jun | JEEVES | Horus oversight plane deployment spec on GCP VM | SPEC |
| `JEEVES_2026-06-21_47_AGENT_TOWN_INTEGRATION.md` | 21 Jun | JEEVES | Kimi swarm integration — 47-agent AI Town, all hives mapped | PLAN |
| `ALIGNMENT_2026-06-20.md` | 20 Jun | Claude | **CURRENT MASTER.** Supersedes 02-Jun. Verified counts, infrastructure, revenue, verticals. | **CANONICAL** |
| `SOV_TOWN_READINESS_23JUN.md` | 23 Jun | JEEVES | SOV Town readiness — 70% production-ready. Bearer auth + agent spawn missing. | STATUS |
| `AUDIT_ALIGNMENT_2026-06-24.md` | 24 Jun | JEEVES | Alignment audit — SOV3 healthy, Vercel surface mixed, csoai.org EU AI Act 404 (P0) | AUDIT |
| `AUDIT_OPENMOE_OPENPATENT_OPENMCP_LAYER0_2026-06-24.md` | 24 Jun | JEEVES | Layer 0 protocol audit — openmoe, openpatent, OPENMCP, MCPscoreboard deep dive | AUDIT |
| `MASTER_AGENT_ALIGNMENT_24JUN.md` | 25 Jun | Hermes | **THIS DOCUMENT.** Full agent/PC/GitHub alignment sweep. | **NEW** |

### Additional _alignment/ files (supporting)

| File | Purpose |
|---|---|
| `ARCHIVE_EXTRACT_JAN_FEB_2026.md` | Archive extraction notes |
| `RESEARCH_AQUACULTURE_2026-06-02.md` | Aquaculture research dossier |
| `RESEARCH_ROBOTICS_2026-06-02.md` | Robotics research dossier |
| `SOV3_FIX_2026-06-02.md` | SOV3 crash-storm fix documentation |
| `SWEAT_EQUITY_AND_DATAROOM_2026-06-02.md` | Sweat equity valuation + data room |
| `archive_jan_feb_2026/` | Archived January/February records |

---

## 8. PHANTOMS, CONFLICTS & STALE ASSETS

### 8.1 🔴 PHANTOMS (referenced but not found / not active)

| Phantom | Evidence | Action |
|---|---|---|
| **Gemini agent** | Listed in AGENTS.md §1. No lane, no claims, no files, no alignment docs. | Confirm existence. If inactive, remove from AGENTS.md or move to dormant register. |
| **Kilo agent** | Listed in AGENTS.md §1. No lane, no claims, no files, no alignment docs. | Same as Gemini. |
| **`sovereign-temple-public/`** | Appears to be a near-duplicate of `sovereign-temple/` with identical file structure. | Verify if intentionally separate or a stale copy. Consolidate if duplicate. |
| **`~/Desktop/CSOAI` duplicate** | FLagged in 20-Jun alignment: `~/Desktop/CSOAI` ≡ `CSOAI 2` byte-identical dup. Also `god-eye/meok-godeye` dup. | Clean up to free disk space. |
| **"Living Topology" dir** | AGENTS.md says: `"Living Topology" is deprecated — do not recreate it.` Yet `_TOPOLOGY/` dir exists with 35+ files. | Verify if `_TOPOLOGY/` is the old deprecated dir or the replacement. Clarify naming. |
| **Stale CLAIM on board** | `[06:55 JEEVES/MiniMax-M3]` still shows CLAIM (not RELEASED) from 20-Jun. | Mark as RELEASED or verify still active. |
| **Submodule drift** | 5 submodules show uncommitted/untracked content. | Each submodule owner should commit/push their changes. |
| **m4-handoff branch** | Active branch is `m4-handoff-2026-06-24`, NOT `main` as AGENTS.md states. | Clarify branching strategy. Merge back to `main` or update AGENTS.md. |

### 8.2 🟡 CONFLICTS (potential)

| Conflict | Details | Severity |
|---|---|---|
| **AGENTS.md modified** | Shared board file modified (22-line diff). Rule requires CLAIM before editing. No CLAIM visible for this edit. | ⚠️ MEDIUM — verify legitimate edit |
| **Claude→Kimi handoff still open** | [09:15 Claude→KIMI] handoff from 20-Jun has not been marked RELEASED. Kimi may not have completed the feed wiring. | ⚠️ MEDIUM — check Kimi's status |
| **Submodule modified content** | `coai`, `haulage-deploy`, `openmoe`, `optimobile-practice-hub`, `sov-town-llm` all have dirty submodule state. | ⚠️ LOW — normal for active dev, but needs cleanup before parent push |
| **Branch mismatch** | AGENTS.md says `branch main` but active branch is `m4-handoff-2026-06-24`. | ⚠️ LOW — document the discrepancy |

### 8.3 🟠 STALE ASSETS

| Asset | Staleness | Risk |
|---|---|---|
| **~80 MCP scaffold repos** | Updated Jun 12-17, then abandoned. | Low-value repos dilute CSOAI-ORG GitHub presence. Archive or consolidate. |
| **`csoai-governance` repo** | Last updated Jun 13 (12 days). May be abandoned. | Governance engine — if inactive, note. |
| **`csoai-global` repo** | Last updated Jun 13 (12 days). No description. | Unknown purpose. Investigate. |
| **`mcp-servers` repo** | Last updated Jun 13 (12 days). Marketplace listing stale. | Should reflect current count. |
| **`agent-zero` repo** | Last updated Jun 13 (12 days). Fork. | If fork is stale, archive. |
| **`_deprecated_hive_dupes/`** | 7 deprecated hive deploy dirs. Marked deprecated. | Safe to archive/delete if confirmed. |
| **`_m2_import/`** | M2 import artifacts. M2 machine may no longer be active. | Can archive. |
| **`_tmp_meok_protocol_0/`** | Protocol 0 research files. Temp directory. | Clean up or archive. |
| **`_ARCHIVED_SEVERED_BRANDS/`** | Terranova overlay + Kimi agents archive. Severed. | Keep as archive — DO NOT revive. |
| **6 untracked `_intake/` files** | Audit docs from today. Should be committed. | LOW risk — normal intake workflow. |

### 8.4 🔵 DUPLICATE DIRECTORIES

| Pair | Notes |
|---|---|
| `sovereign-temple/` vs `sovereign-temple-public/` vs `sovereign-temple-live/` | Three copies. `-live` is deployment. `-public` may be stale duplicate of main. |
| `apify-actors/` vs `apify_actors/` | Two versions of Apify actors. Different naming convention. Check which is canonical. |
| `sov-town-llm/` vs `sov-town-poc/` vs `sov-town/` | Three SOV Town directories. `-llm` is the proxy/runtime. `-poc` is POC UI. `-` is build artifacts. May be intentional layers. |
| `council-of-mcps/` vs `production/` | Both contain `councilof/CONSOLIDATED.md`. Possible duplicated consolidation effort. |

---

## 9. BLOCKERS & PRIORITY MATRIX

### 🔴 P0 (revenue/credibility blockers)
1. **csoai.org EU AI Act hub 404** — 8 subpaths return 404 (article-50, risk-management, transparency, governance, conformity, post-market, penalties). Article 50 deadline = 2 Aug 2026 (~38 days). Fix: re-alias csoai.org apex to correct Vercel deploy.
2. **openpatent.ai backend offline** — only marketing page live. `api.openpatent.ai` and `mcp.openpatent.ai` return SSL_ERROR. The 23-tool MCP server exists but has no public endpoint.

### 🟠 P1 (major gaps)
3. **openmoe.ai MCP server 404** — `mcp.openmoe.ai/mcp` returns 404. Backend not deployed.
4. **Revenue unlock** — 4 Nick-gated actions block first £ (Stripe keys→Vercel, live-flip, 2FA, SMITHERY). All prep work done.
5. **biasdetection.of + iokfarm.com down** — both return 000 from Vercel surface audit. DNS/alias issue.
6. **OPENMCP scoreboard UI** — public UI 404. CLI doesn't exist on npm. Internal fleet scorecard is real but not customer-facing.

### 🟡 P2 (cleanup/hygiene)
7. **14 uncommitted files** — 6 untracked intake docs need committing. 5 dirty submodules need owner attention.
8. **csoai.org discovery files** — llms.txt, security.txt, robots.txt all 404 on hub domain.
9. **PyPI count stale** — 271/316 last verified 02-Jun. Re-run `tools/pypi_check.py`.
10. **GitHub repo catalog incomplete** — only 100/557 repos catalogued. Re-run with higher limit.
11. **Stale board claim** — JEEVES/MiniMax-M3 CLAIM from 20-Jun not released.

### ⏸️ Nick-gated (prep complete, waiting)
12. **Stripe sync-vercel** — keystone holds keys, ready to push.
13. **IP assignment deed** — ~£500, unblocks licensing.
14. **R&D tax credits** — ~£30K non-dilutive cash opportunity.
15. **ChalkStream first-sale** — trout-provenance pending Nick confirmation.

---

## 10. RECOMMENDED NEXT ACTIONS (ranked)

### Immediate (today)
1. **Fix csoai.org EU AI Act hub** — re-alias Vercel deploy. Verify all 8 subpaths return 200.
2. **Commit the 6 untracked intake files** — they're today's audit artifacts and should be in git.
3. **Release stale CLAIM** — mark `[06:55 JEEVES/MiniMax-M3]` as RELEASED or verify active.
4. **Verify AGENTS.md edit provenance** — the 22-line diff on a shared board file needs explanation.

### This Week
5. **Deploy openpatent.ai backend** — TLS/DNS for api., mcp., verify. subdomains.
6. **Deploy openmoe-bft MCP server** — give mcp.openmoe.ai a real service.
7. **Full GitHub catalog** — `gh repo list CSOAI-ORG --limit 600 --json name,visibility,updatedAt,description` > inventory.
8. **Clean up phantom agents** — resolve Gemini/Kilo status or remove from AGENTS.md.
9. **Consolidate duplicate dirs** — verify sovereign-temple-public vs sovereign-temple. Clean up _deprecated_hive_dupes.
10. **Publish npm packages** — @openpatent/mcp-server, @csoai-org/openmcp, openmoe-bft.

### When Nick is Available
11. Fire the 4 revenue-unlock keystrokes.
12. Re-run PyPI count.
13. Resolve the `m4-handoff` vs `main` branch strategy.

---

## 11. METRICS SNAPSHOT (25 Jun 2026 04:15 UTC)

| Metric | Value | Source |
|---|---|---|
| GitHub repos (total) | ~557 | ALIGNMENT_2026-06-20 |
| GitHub repos (catalogued) | 100 | This sweep (limit hit) |
| GitHub repos (public) | 525 | ALIGNMENT_2026-06-20 |
| GitHub repos (private) | 32 | ALIGNMENT_2026-06-20 |
| Git uncommitted files | 14 (8M + 6?) | `git status` |
| Git branch | `m4-handoff-2026-06-24` | `git status` |
| SOV3 agents | 195/195 active | AUDIT_ALIGNMENT_2026-06-24 |
| SOV3 tools | 127 | D101 audit |
| SOV3 sigils | 7,351+ | D101 audit |
| MCP marketplace dirs | ~352 | ALIGNMENT_2026-06-20 |
| PyPI published | 271/316 (stale) | Last verified 02-Jun |
| King Hive rounds | 747 | D101 audit |
| BFT councils | 9 (64→73 voters) | AGENTS.md claims |
| Certificates | 6,040+ | MONDAY_24JUN_FULL_RUNDOWN |
| Vercel deploy dirs | 104 (~90 live) | MONDAY_24JUN_FULL_RUNDOWN |
| VM data moat | 50 GB | D101 audit |
| MRR | £0 | All audits agree |
| csoai.org EU AI Act | 404 (8 paths) | AUDIT_ALIGNMENT_2026-06-24 |
| Sibling agents active | 5 confirmed + 2 phantom | This sweep |

---

## 12. DOCUMENT SIGN-OFF

- **Compiled by:** Hermes Agent (subagent delegated from parent Hermes session)
- **Date:** 2026-06-25 04:35 UTC
- **Sources:** `AGENTS.md`, 15 `_alignment/` files, `git status`, `gh repo list --limit 100`, `ls ~/clawd/*/`, live intake docs
- **Next update:** After Nick fires revenue-unlock keystrokes, or after csoai.org EU AI Act hub fix, or weekly (by 02-Jul)
- **This file supersedes:** Partial agent mappings in individual alignment files
- **Read with:** `_alignment/ALIGNMENT_2026-06-20.md` (canonical metrics), `AGENTS.md` (coordination rules)

---

*End of MASTER_AGENT_ALIGNMENT_24JUN.md — Sovereign alignment sweep complete. 🐉*
