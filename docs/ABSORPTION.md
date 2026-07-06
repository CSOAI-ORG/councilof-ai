# CSOAI — Org-Wide Absorption Ledger

> The single source of truth for pulling the best of every CSOAI project into **master** (the live `csoai.org`), deduping the rest. Read with `ALIGNMENT.md`. Owner: master lane. Updated 2026-07-06.

**Rule:** master (`councilof-ai`) is the front door — the public Sovereign OS + marketing + globe + working Tool Runner + 280 SEO routes + legacy site. Everything below is judged against it: *absorb the unique value, dedup the overlap, keep backends as services.*

---

## Decisions at a glance

| Project | What it uniquely has | Decision |
|---|---|---|
| **councilof-ai** (this repo) | Live `csoai.org`: Sovereign OS, globe3d, governance graph, BFT council demo, **working ToolRunner**, /workbench, 280 SEO routes, legacy site | **MASTER — the superset target** |
| **csoai-dashboard** | Deep **authenticated SaaS**: CEASAI certification + LMS/courses/exams, admin + analytics dashboards, EU AI Act classifier, **Stripe checkout**, Byzantine-voting visualizations, incident-report form, i18n | **ABSORB (staged)** — see below |
| **csoai-org / csoai-org-v2 / csoai-global** | Older org sites (Charter, CEASAI, Byzantine Council) | **DEDUP** — superseded by master; legacy already ported to `/legacy/*`. Archive. |
| **sov3-beat / sov3-arch / sov3-live** | Real **UE5 + Cesium 3D** SOV3 demos | **REFERENCE** — master's `globe3d.html` covers the web globe; mine these for a future 3D upgrade only |
| **defoneos / defoneos-com** | Defence COP + landing (private) | **KEEP SEPARATE** — distinct product surface; cross-link |
| **meok-ai / sovereign-temple** | MEOK persona landing / temple | **REFERENCE** — fold best copy into master marketing; no code merge |
| **MCP repos** (governance, crosswalk, oscal-generator, eu-ai-act-compliance, bias-detection, dora-nis2, mica, mifid, omnibus-tracker, c2pa-watermark, credential-manager, compliance-gateway, mcp-servers, planthire, muckaway) | **The Layer-0 fleet** — the 300–900 governed MCP protocols | **KEEP AS SERVICES** — already surfaced via `os.meok.ai/api/mcp` + ToolRunner + catalogue. Do NOT copy into the frontend. Ensure each is in the catalogue. |
| **awesome-\*** (forks) | Curated compliance/MCP/EU-AI-Act lists | **CROSS-LINK** only (external content) |
| **OpenHands / langfuse** | Upstream tooling forks | **INFRA** — not product; leave |
| **networknick-\* / aksteel / dmt / wcr** | Unrelated client/business sites | **SKIP** — not CSOAI product |

---

## The one real architecture decision (needs Nick)

`csoai-dashboard` is a **logged-in SaaS** (auth, LMS, exams, admin, payments). Master is the **public** OS + marketing site. Two clean options:

- **A — Two apps, one brand (recommended):** master stays `csoai.org` (public OS/marketing/globe/tools); `csoai-dashboard` becomes **`app.csoai.org`** (the authenticated CEASAI product). Cross-linked, shared brand + brain. *Lowest risk, fastest, no 2040-file merge, both keep working.*
- **B — One monorepo:** absorb `csoai-dashboard`'s surfaces into master. Higher value long-term, but a real integration project (auth context, routing, deps, Stripe) — must be staged, not bulk-copied, or it breaks the live site.

Until decided, treat **A** as the working plan and absorb only self-contained bits (below) into master natively.

---

## Concrete "good bits missing" — the absorb backlog (from `csoai-dashboard`)

Ranked by value ÷ integration risk. Port as **native, self-contained** surfaces on master (rebuild against master's context, don't copy-paste fork code):

1. **CEASAI certification front door** — `AboutCEASAI`, `CertificationHowItWorks`, `CEASAIPricing` → master has no certification surface; this is a core revenue product. *(build native landing + link to app.csoai.org for the exam)*
2. **Incident report form** — `IncidentReportForm` + `WatchdogIncidentsPanel` → master's `/watchdog-map` shows signals but can't *submit* one. High-value, self-contained.
3. **EU AI Act classifier** — `EUAIActClassifier` → interactive risk-tier classifier; complements the existing guides. Wire to `/api/mcp meok_govern`.
4. **Live Byzantine voting viz** — `LiveVoteSimulation` / `RealtimeByzantineVoting` → make the 33-agent council *visual* on `/try`.
5. **i18n** — `LanguageSelector` (124-country list exists) → master is English-only; big reach unlock.
6. **Onboarding tour** — `OnboardingTour` → complements the refreshed DemoTour.

Strategy docs to pull into `docs/absorbed/` (dedup the brain): `CORE_USP_MESSAGING.md`, `33_AGENT_COUNCIL_TECHNICAL_SPEC.md`, `DESIGN_SYSTEM.md`, `GAP_ANALYSIS.md`, `COMPETITOR_ANALYSIS.md`.

**Already absorbed into master this program:** original 311-page site → `/legacy/*`; `security.txt` + agent-card; the live **ToolRunner** (turns the 300+ MCP fleet into working tools); one canonical globe (`globe3d.html`); USP-first demo + tour.

---

*Method: absorb unique value, dedup overlap, keep backends as services, rebuild-native over blind-merge. Track every pull here so master stays the coherent superset — not a pile of forks.*
