# MEOK · MCP & Package Domination Plan — 2026-06-06

## Operating principle
**Revenue-first, not vanity-coverage.** We have ~271 published MCPs and £0 realized. Being on every
directory with 271 servers is worth less than 10 servers that *sell*. Every task is ranked by expected
revenue, not breadth. **Perfect the 10 that can sell; baseline the rest; fix the money-leaks first.**

"100/100" = a single internal rubric (Phase 2) that simultaneously maxes the scores used by Glama,
Smithery, and the Anthropic registry, plus our own revenue-readiness.

---

## Phase 0 — Baseline audit (Day 1) — *measure before optimizing*
Build one scoreboard (Postgres table + render at meok.ai/admin), one row per MCP:
- **PyPI**: name, downloads/mo, version, last publish, gate-check importable (Y/N)
- **Directory presence + score**: Anthropic registry · mcp.so · Smithery · Glama · PulseMCP · cursor.directory · Cline · awesome-lists
- **Quality**: README score, #tools, % tools-with-descriptions, tests (Y/N), license, transports (stdio/http), server.json (Y/N), examples (Y/N)
- **Revenue wiring**: PAYG-enabled, Stripe link present+correct, attestation-enabled, gated tier
- **Output**: the gap map → "distance to 100" per MCP, sorted by downloads.
- Tooling: extend `tools/pypi_check.py` + a directory scraper; store in postgres; nightly refresh.

> Expect Phase 0 to correct assumptions (real download/revenue numbers decide the flagship list).

---

## Phase 1 — Pick the flagship tier (THE 10)
Concentrate 100/100 + full distribution + monetization on revenue-bearing MCPs (finalize from Phase 0 data):
1. eu-ai-act-compliance (flagship, ~320 dl/mo)
2. dora-nis2-crosswalk
3. nis2-de-register (£499 product, deadline-driven)
4. cra-annex-iv-classifier
5. ai-incident-reporting
6. uk-ai-bill
7. ai-bom / watermark-attest
8. csrd / omnibus-tracker
9. gods-eye (civilian)
10. A2A safety pack (prompt-injection-firewall, policy-enforcement, audit-logger)

Everything else (~260): **baseline-good only** (importable + solid README + registry listing). Not 100/100.

---

## Phase 2 — The 100/100 rubric (per flagship) — 10 categories × 10 pts
1. **README** — one-liner, problem→solution, install (uvx/npx/pip), env-var config table, quickstart, security note, badges
2. **Tool design** — every tool a crisp description; all inputSchema fields described; clean names; no dead tools
3. **Examples** — ≥3 real prompt→tool examples + copy-paste client config blocks
4. **Tests + CI** — per-tool unit tests, green GitHub Actions, coverage badge
5. **Transports** — stdio **and** streamable-HTTP; remote-hosted URL; OAuth/API-key for remote
6. **Metadata** — `server.json` (registry schema) + categories + icon + homepage + repo + OSI license
7. **Reliability** — input validation, structured errors, no crash on bad input, timeouts, rate-limit handling
8. **Security** — no secrets (gate harness already enforces), clean dep audit, tool-output injection hardening, SECURITY.md
9. **Docs surface** — per-MCP page on councilof.ai / its domain with usage + pricing
10. **Provenance (our moat)** — signed attestation (HMAC attestation API) + AI-BOM + changelog

---

## Phase 3 — Endpoint / transport completeness
Ship every flagship in **3 forms**:
- (a) **stdio** (pip/uvx) — local/acquisition
- (b) **streamable-HTTP remote** (Vercel/own host) — for URL-based platforms, gated by OAuth/API-key + PAYG meter
- (c) **Smithery-hosted** — free distribution + their billing rails
Each remote: `/health` + `/version`. Provide copy-paste configs for Claude Desktop, Claude Code (`claude mcp add`), Cursor, Cline, VS Code, Windsurf.

---

## Phase 4 — Directory domination (distribution)
Submit + maintain every flagship (then long-tail) on ALL:
- **Anthropic MCP Registry** (registry.modelcontextprotocol.io) — canonical, feeds others
- **mcp.so** (push issue #2170 + self-submit), **Smithery** (+ hosted), **Glama** (auto-indexes GitHub topic `mcp` + server.json — just fix scores)
- **PulseMCP, mcpservers.org, mcp.run, mcp-get, Composio, Docker MCP Catalog**
- **cursor.directory, Cline Marketplace (PR), VS Code MCP gallery**
- **awesome-mcp-servers** (punkpeye/appcypher + wong2) — unblock gh perms (`gh auth refresh -s public_repo,repo`) and land the stuck PRs
- Automate: `tools/registry_submit.py` generates server.json + opens PRs/submissions from the scoreboard; track per-directory state.

---

## Phase 5 — AI-platform coverage
Make each flagship one-click-addable everywhere:
- **Anthropic**: registry + claude.ai custom connector (remote URL) + Claude Code one-liner + Desktop json
- **OpenAI**: ChatGPT Connectors / Apps SDK / Responses-API MCP tool (remote HTTP) — *large untapped buyer pool*
- **Google Gemini** (MCP), **Microsoft Copilot Studio** (MCP connectors)
- **Cursor, Cline, Windsurf, VS Code Copilot agent, Zed, Goose, LibreChat, Open WebUI**
- Deliverable: per-MCP "Add to X" matrix on its domain page (copy configs) — doubles as SEO.

---

## Phase 6 — Revenue integration (the actual point)
Wire **three rails** into every flagship:
1. **PAYG** (already built: £0.05/call, USDC on Base, MEOK_PAYG_KEY → councilof.ai/payg): shared meter decorator on remote tool calls; free N calls → 402/upsell. One-line to add per MCP.
2. **Subscriptions** (Stripe, live): server resolves entitlement from key → Free/Pro/Team/Compliance. Keep the all-access upsell funnel (compliance MCP → meok.ai/pricing, already E2E-verified).
3. **Attestation-as-product** (the moat): compliance calls emit signed, verifiable attestations; sell proofs / audit bundles. This is the premium SKU enterprises pay for.

**Funnel**: free stdio (acquire) → remote PAYG (activate) → subscription/attestation (revenue). Instrument each step.
**Fix first**: audit every flagship page's Stripe/PAYG links — a wrong link = guaranteed £0 regardless of traffic (this has bitten us before).

---

## Phase 7 — Discovery / GEO domination
- Per-MCP domain page: what/why, install matrix, pricing, attestation demo, FAQ + Product JSON-LD.
- `llms.txt` + `/.well-known` on each domain for clean AI/registry ingestion.
- Rank for "<compliance topic> MCP" queries; cross-link storefront ↔ domain pages ↔ registry.

---

## Phase 8 — Automation (do once, apply to 271)
Extend the gate-protected harness (`mcp-marketplace/_tooling/`):
- **generator**: README + server.json + examples + test scaffold from a manifest
- **meter**: shared PAYG/entitlement decorator
- **submitter**: directory submissions + state tracking
- **scorer**: nightly re-score vs rubric → scoreboard
- **Ralph queue**: feed "raise to 100" + "submit to N directories" tasks; grind the long tail autonomously.

---

## Phase 9 — Execution order (EV-ranked, ~4 weeks)
- **Week 1**: Phase 0 scoreboard + fix Stripe/PAYG leaks on flagships (revenue unblock) + lock the 10.
- **Week 2**: top 3 (eu-ai-act, dora-nis2, nis2-de) to 100/100 end-to-end incl. remote + PAYG + attestation; all directories; platform matrix.
- **Week 3**: remaining 7 flagships to 100/100 + full distribution.
- **Week 4**: automation harness + Ralph long-tail sweep (baseline-good for ~260) + GEO pages.

---

## Definition of done / scoreboard
- 10 flagships at **100/100**, on **≥10 directories**, addable on **≥8 platforms**, all **3 revenue rails** wired.
- First £ via PAYG **+** first subscription **+** first attestation sale.
- Nightly scorecard (meok.ai/admin) shows coverage % climbing.

## Honest caveats
- 271 MCPs × every directory × every platform is enormous — the plan deliberately funnels effort to the 10 that pay.
- We've had real revenue leaks (broken Buy links, injection breaking imports). **Plumbing correctness > coverage.** Verify money paths end-to-end before celebrating reach.

---

## Scorecard product — direction (evolving per Nick, 2026-06-06)
Reframe "MCP Scorecard" → **CSOAI Agent Infrastructure Scorecard**: the ratings authority for the whole agentic ecosystem, not just MCP.
- **Domain architecture (3 hubs — consolidate, don't build a frontend per .ai):**
  - **proofof.ai** = the SaaS FRONTEND — submit MCP/agent → scored → verifiable proof + embeddable badge; PAYG/subscription here. URL structure `proofof.ai/<entity>` = a public proof page each (GEO/SEO + viral badges linking back). Best fit because the moat IS the proof/attestation.
  - **csoai.org** = the AUTHORITY — methodology, public rankings/leaderboard (deploy via `meok-kits-host` mirror; csoai.org is in a different Vercel scope so CLI alias fails).
  - **councilof.ai** = the STOREFRONT (the MCPs/agents).
  - **agisafe.ai + the rest of the .ai pile** = 301-redirect into the three hubs (agisafe.ai → csoai.org, or hold as top-of-funnel safety content). Avoid the per-domain-site dilution prior audits flagged.

---

## MoE packs — composite expert routers (Nick idea, 2026-06-06)
Turn *packs* of MCPs into **MoE-style routers**: one server fronts N expert MCPs and routes intent to the right expert(s). NOT a neural MoE — a router/orchestrator over expert tool-packs.
**Why it's the smart monetization architecture (not a distraction):**
- **Wire the rails ONCE at the router** (PAYG + attestation + tier-gating) → fixes the #1 gap (PAYG in 1%, attestation in 24% of packages) in a single place instead of 271×.
- **Beats LLM tool-overload** — lean tool surface (e.g. `ask_compliance`) dispatches internally; better tool-selection = better answers.
- **One remote-HTTP endpoint per pack** → unlocks ChatGPT/claude.ai connectors without exposing 14 servers.
- **Premium bundle SKU** > sum of parts.
**Parts already exist:** `agent-mcp-router-mcp`, the `/moe` page, tool-groups thinking.
**First pack — Compliance MoE:** top ~14 compliance MCPs (eu-ai-act, dora, nis2, cra, gdpr, csrd, iso-42001, ai-bom, bias-detection, governance-engine) behind one router. Then Governance MoE, Agent-Safety MoE (the A2A pack). proofof.ai scores bundles too.
**Sequence:** fix live payment rails first (today-£); build Compliance MoE as the premium tier where the rails get wired cleanly. Context note: ~218k PyPI downloads/mo is real *reach* but includes CI/mirrors/bots — reach, not revenue; conversion (fixed rails) is the proof.

---

## OpenMCP — distribution/listing automation (Nick idea, 2026-06-06)
Open-source MCP that LISTS any MCP to every directory. The **distribution half of the growth stack** (Scorecard *scores* → OpenMCP *distributes*).
- **Input:** an MCP repo → generates per-directory metadata (`server.json`, `smithery.yaml`, `glama.json`, `llms.txt` — our packs already ship these) → submits everywhere.
- **Auto:** Anthropic registry (`mcp-publisher` CLI + server.json) · Glama (GitHub `mcp` topic + server.json auto-index) · awesome-mcp-servers (gh PR) · Smithery (repo-connect). **Assisted/queued:** mcp.so · PulseMCP · mcpservers.org · cursor.directory · Cline (pre-filled forms/PRs + state tracking).
- **Open-source = funnel + authority:** free "list my MCP everywhere" hits the pain of thousands of authors → top-of-funnel → upsell paid Scorecard (proofof.ai) + hosting + PAYG.
- **Double win:** building it ALSO fixes our own distribution gap (Smithery 0/282, Glama missing 12/14 flagships) → more downloads for the 271 → more revenue. Not a side quest.
- It's Phase 4 (directory domination) + Phase 8 (submitter automation) of this plan, productized + open-sourced.

## The full MEOK MCP growth stack (as of 2026-06-06)
| Layer | Surface | Model |
|---|---|---|
| Authority | **csoai.org** | the ratings agency / methodology / leaderboard |
| Score | **proofof.ai** (Scorecard) | paid — rate any MCP/agent, signed attestation moat |
| Distribute | **OpenMCP** | open-source — list to all directories (funnel) |
| Bundle | **MoE packs** | premium — Compliance/Governance/Agent-Safety routers |
| Storefront | **councilof.ai** | the MCPs/agents themselves |
**Build sequence:** revenue rails (homepage + PAYG now LIVE) → finish buy-surface fixes + gap products → per-pack 100/100 → then the growth stack (OpenMCP + Scorecard + MoE), each dogfooded on the 271 before selling.
- **Protocol-agnostic engine — pluggable adapters:** MCP (now, volume) · A2A (next, we already ship A2A MCPs; Google/LF-backed) · ACP (IBM/BeeAI, LF) · AGNTCY · AP2 (Agent Payments Protocol — ties to PAYG) · others as fast-follow. Build the adapter interface from day one so a new protocol = one adapter, not a rebuild.
- **Dual-axis scoring per entity:** (quality 10×10) × (compliance-framework coverage+correctness: EU AI Act / DORA / NIS2 / CRA / CSRD / AI-BOM) + protocol-conformance + security + revenue-readiness.
- **Attestation-backed:** signed, verifiable scores via the attestation API — the moat Glama/Smithery can't match.
- **Funnel:** score any MCP/agent → expose its framework/quality/conformance gaps → sell the MCP that fills them + the signed attestation. Dogfood on our 271 first, publish rankings → become the authority (GEO/SEO moat) → open it as PAYG + subscription SaaS.
