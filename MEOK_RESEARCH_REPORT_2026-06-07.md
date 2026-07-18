# MEOK / Haulage.app — Deep Research Report (2026-06-07)

Derived from a fan-out research workflow: 113 agents, 6 angles, 30 sources fetched, 132 claims extracted, 25 adversarially verified (3-vote each), **15 confirmed / 10 refuted / 8 after synthesis**.

---

## 🟢 8 CONFIRMED FINDINGS (with concrete next moves)

### 1. Vanta sets the 2026 compliance-automation bar — copyable patterns for MEOK
**Confidence: HIGH** · sources: vanta.com/products/eu-ai-act, vanta.com/integrations, siliconangle.com

- 400+ tool integrations for evidence auto-pull (deepest in category)
- 150+ pre-built EU AI Act controls mapped to ISO 42001 / NIST AI RMF / CPS 234
- Scope → classify → map → evidence workflow (industry standard)

**Direct moves for haulage.app:**
1. Build a Vanta-style **integration directory page** listing every MEOK MCP as an "integration" with auto-pull capability
2. Ship a **controls library** mapping UK Operator Licence + DVSA ER + Working Time Directive + tachograph rules → ISO 42001 / EU AI Act / NIST AI RMF (reuse evidence across frameworks)
3. **Adaptive scoping wizard** as onboarding step 1 (which vehicles / depots / drivers fall under each obligation)

### 2. Trust Center is the procurement UX pattern that converts enterprise buyers
**Confidence: HIGH** · sources: vanta.com/products/trust-center, help.vanta.com

- Real-time passing-control display
- AI-powered chatbot for security questionnaires (Vendor AI Answers, GA Jan 2026)
- CRM/NDA-gated docs
- Branded customization

**Moves:**
1. Build **haulage.app/trust** with live DVSA ER status + Operator Licence ref + last audit date + signed attestation hash chain (reuses existing HMAC infra)
2. Embed a chatbot answering haulier procurement Qs ("do you support Brigade camera?" "are you on DVSA Approved Software?")
3. **Gate deeper artifacts** (SOC 2 report, pen test, DPIA) behind email capture
4. Display **partner badges** from FTA / Logistics UK, RHA, FORS above the fold

### 3. UK fleet table-stakes — Mandata + Truckfile + DVSA ER define the floor
**Confidence: HIGH** · sources: mandata.co.uk, truckfile.co.uk, gov.uk DVSA ER software list

Confirmed feature floor:
- ePOD app with digital capture
- Driver walkaround vehicle defect reporting
- Tachograph downloads
- AI-powered load building + route planning (Mandata claims "up to 30% cost reduction")
- **DVSA Earned Recognition accreditation** = the UK trust signal (listed at .gov.uk)

**Moves:**
1. **Pursue DVSA ER IT-vendor accreditation in next 90 days** — non-negotiable; lives on .gov.uk alongside Truckfile, FleetCheck, Convey, Distinctive Systems, CheckedSafe, Chevin, Vehocheck, Prolius
2. Ship **ePOD signed-attestation app** — wrap HMAC infra as driver mobile PWA; every POD = signed evidence chain entry
3. Build **daily walkaround check tool** that auto-generates signed defect-report attestation (differentiates from FleetCheck/CheckedSafe by signing every check)
4. Add a **"savings calculator"** with same 30% framing Mandata uses — quantified ROI = the conversion lever
5. Add **/vs/truckfile** to existing /vs/{mandata,microlise,fleetcheck,vanta} set

### 4. 🌟 MCP Apps (SEP-1865, ratified 26 Jan 2026) — THE biggest architectural unlock
**Confidence: HIGH** · sources: blog.modelcontextprotocol.io, github.com/modelcontextprotocol/PR-1865, workos.com, modelcontextprotocol.io/extensions/apps

> MCP servers declaratively advertise a UI Resource via `_meta.ui.resourceUri` on each tool, serve bundled HTML/JS via the `ui://` URI scheme, render in sandboxed iframes inside Claude (web+desktop), ChatGPT, VS Code Copilot/Insiders, and Goose — no per-client custom integration required.

**Moves (this is the big one):**
1. **Ship MCP Apps UI Resources** for every customer-facing MCP in the 32-tool catalogue (e.g., EU AI Act compliance MCP returns interactive risk-classification wizard rendered in-chat)
2. Build the **haulage.app dashboard ALSO as a UI Resource** — customers open their MEOK compliance dashboard from inside Claude/ChatGPT/VS Code without context-switching
3. Use **bidirectional postMessage JSON-RPC** to let in-chat UI fire signed tool calls ("sign this attestation" button inside ChatGPT)
4. Publish **haulage.app/mcp-apps** showcase page — first-mover SEO + recruiter signal

### 5. MCP Apps security = real consent surface for AI-on-your-behalf actions
**Confidence: HIGH** · sources: spec PR + blog

- Mandatory iframe sandboxing
- Pre-declared UI templates reviewable by host
- Optional explicit user approval for UI-initiated tool calls

**Moves:**
1. For every destructive/signed MCP tool call (DVSA filing, sign attestation, invoice), require **explicit user approval** via the MCP Apps consent flow — surface as dry-run preview before commit
2. Build an **audit-log UI Resource** showing every signed action an AI agent took on user's behalf with full HMAC chain
3. Ship **one-click undo** where possible
4. Publish **haulage.app/agent-consent** as trust-signal page — preempts "autonomous AI" liability concerns

### 6. OAuth 2.1 + RFC 8707 + CIMD = unified SaaS↔MCP identity
**Confidence: HIGH** · sources: modelcontextprotocol.io/specification/2025-11-25, workos.com, auth0.com

- OAuth 2.1 required (MUST)
- RFC 8707 Resource Indicators required (MUST)
- CIMD (Client ID Metadata Documents) > DCR (Dynamic Client Registration) as default
- Streamable HTTP transport (replaces deprecated HTTP+SSE) for remote MCPs

**Moves:**
1. Ship OAuth 2.1 + RFC 8707 + CIMD on meok-attestation-api so a customer signs in once on web dashboard and the same identity authorizes their locally-installed MCP servers — **token-on-checkout flow** tied to Stripe webhook
2. Host all 32 catalogue MCPs as **remote Streamable HTTP servers** behind haulage.app/mcp/* in addition to PyPI local install
3. **Per-tool scope grants** in OAuth consent ("this MCP can read your DVSA filings but not submit them")
4. Publish **freshness/availability badges** on haulage.app/catalogue — last-updated + uptime per MCP, fed by public /status JSON

### 7. ⚠️ AI Overviews killed organic clicks 50-60% — SEO strategy must pivot
**Confidence: VERY HIGH** · 7 independent studies: BrightEdge, Ahrefs (300K kws), Seer (25.1M imps), Pew (68K queries / 900 adults), Semrush (10M+ kws), Kevin Indig, Authoritas

- 50-60% click drop on queries with AI Overviews
- +49% impressions but no clicks
- Compliance/informational queries heavily hit

**Pivot moves:**
1. **Invest hardest in being CITED by LLMs** — Anthropic, OpenAI, Perplexity, Google AIO. Every MCP server's README needs factual, citable claims with named regulations
2. Treat **haulage.app/catalogue.json as a primary content asset** — submit to MCP registries (mcp.so, modelcontextprotocol.io official, Smithery, Anthropic registry)
3. Add **schema.org SoftwareApplication + Organization + FAQ** structured data on every comparison/landing page
4. Build **/glossary as schema.org DefinedTermSet** (DVSA terms, EU AI Act terms, FORS levels) — wins AI Overviews when no commercial intent
5. **Keep BOFU pages** (/vs/*, /pricing, ROI calculator) — these still convert (users with commercial intent click past AIO)
6. Publish a **regulator changelog** ("this week in UK haulier compliance") as authoritative citation-ready feed

### 8. Multi-vertical strategy — weakly supported, treat as hypotheses
**Confidence: LOW** · only 1 surviving source (Bessemer Atlas); strong claims got REFUTED

**Hypotheses to test (not proven):**
1. **Shared design system + Tailwind config + component library** across all 4 vertical sites — fastest to ship, all 4 are "trade compliance"
2. **Shared auth via OAuth 2.1** on meok-attestation-api so customer buys haulage.app and accesses planthire.ai with same login — **measure cross-vertical buyer overlap first**
3. **Shared 32-MCP catalogue** but vertical-filtered subsets per site (haulage.app = tachograph+DVSA; planthire.ai = lifting+LOLER)
4. Discreet **"Powered by MEOK"** footer badge — Vanta sub-brand pattern
5. **DO NOT yet commit to unified vs per-vertical pricing** — A/B test on smallest vertical (muckaway.ai?) first
6. Reserve **meok.ai for the trust-signal mothership** — vertical sites point to it for procurement credibility

---

## 🔴 10 REFUTED CLAIMS — what we should NOT believe

| Claim | Vote | Source |
|---|---|---|
| "Support is #1 fleet buying factor (85%)" | 1-2 | Samsara PDF |
| "Top fleet features rank-ordered: Support > Asset Tracking > Driver App > Insurance > Safety > Fuel > Predictive Maint" | 0-3 | Samsara PDF |
| "Compliance ranks LOW (15%) in fleet challenges" | 0-3 | Samsara PDF |
| "Truckfile bundles workshop management with compliance" | 1-2 | Truckfile site |
| "Vertical SaaS can hit 50%+ market penetration via depth" | 1-2 | Bessemer Atlas |
| "Pricing/packaging is biggest under-optimised lever in vertical SaaS" | 0-3 | Bessemer Atlas |
| "SaaS onboarding has 6 recurring pattern types" | 0-3 | SaaSFrame |
| "96.5% of pages get zero Google traffic" | 0-3 | TheRankMasters |
| "B2B SaaS content takes 2-6 months to first-page rank" | 0-3 | TheRankMasters |
| "BOFU content hits 50%+ CTR vs 20% TOFU" | 0-3 | TheRankMasters |

**Implication:** Don't lead positioning with refuted fleet-buyer rankings. Don't assume per-vertical pricing is the right lever. Don't quote those SEO benchmarks.

---

## ❓ 6 OPEN QUESTIONS — primary research still needed

1. **What's the actual UK fleet-buyer priority ranking?** Samsara PDF didn't survive verification — need FTA/Logistics UK, RHA, or Frost & Sullivan UK primary source.
2. **Is MEOK in the major MCP registries today?** Audit needed: mcp.so, modelcontextprotocol.io official registry, Smithery, Cline marketplace, Continue.dev marketplace — submit any missing.
3. **What's the cross-vertical buyer overlap?** Run 30-day Plausible/PostHog study on signup overlap before committing umbrella investment.
4. **Build vs buy OAuth?** WorkOS, Auth0, Clerk, Stytch all offer OAuth 2.1 + Resource Indicators + CIMD — needs spike given meok-attestation-api exists.
5. **DVSA ER vendor accreditation path?** Application process + timeline + cost not in public docs — direct DVSA contact + FOI request.
6. **What's competitor 2026 content strategy?** FleetCheck/CheckedSafe/Convey/Distinctive face same AIO pressure — competitive teardown reveals what works.

---

## 🎯 NEXT 10 FEATURES TO SHIP (derived priority order)

Based on impact × evidence-strength × build-cost:

| # | Feature | Why | Effort |
|---|---|---|---|
| **1** | **MCP Apps UI Resources** for top 5 customer-facing MCPs | First-mover on Jan 2026 spec, ships dashboards into Claude/ChatGPT/VS Code without per-client work | M (1-2 wks) |
| **2** | **DVSA Earned Recognition vendor application** | Non-negotiable UK trust signal — listed at .gov.uk | S (apply now, 90-day SLA TBC) |
| **3** | **OAuth 2.1 + RFC 8707 + CIMD on meok-attestation-api** | Unified SaaS↔MCP identity, token-on-Stripe-checkout | M (build-vs-buy WorkOS spike first) |
| **4** | **Trust Center at haulage.app/trust** (already have stub) | Live DVSA ER status + signed attestation chain + AI chatbot for procurement Qs + gated SOC 2 report | M (Vanta pattern direct copy) |
| **5** | **Integration directory page** at haulage.app/integrations | Lists every MEOK MCP + linked SaaS adapters — Vanta-style | S |
| **6** | **Controls library + cross-framework mapping** | UK Op Licence + DVSA + WTD → ISO 42001 / EU AI Act / NIST AI RMF — evidence reused across frameworks | L (content-heavy) |
| **7** | **ePOD signed-attestation driver PWA** | Mandata table-stakes + signed-by-default = unique angle. Existing HMAC infra. | M (1 wk PWA build) |
| **8** | **Daily walkaround check tool** with signed defect attestations | Mandata + Truckfile table-stakes. Differentiator: every check signed on-chain | S (small PWA) |
| **9** | **Glossary as schema.org DefinedTermSet** | Wins AI Overviews on no-commercial-intent informational queries (DVSA terms, EU AI Act, FORS) | S (1-2 days, 50-100 terms) |
| **10** | **Status page + freshness API at haulage.app/status + /catalogue.json status field** | OAuth/MCP coverage + uptime + last-updated per tool — fed by public JSON | S (1 day) |

---

## 📅 90-DAY CONTENT + SEO ROADMAP

**Premise (from finding #7):** AI Overviews mean we're not chasing keyword rankings — we're chasing **LLM citation surface** + **registry presence** + **structured-data discoverability** + **BOFU conversion clicks**.

### Days 1-30: Foundation
- [ ] **Audit MCP registry presence** (open question #2) — submit to every: mcp.so, modelcontextprotocol.io, Smithery, Cline, Continue.dev, Anthropic
- [ ] **Publish /glossary** with 50-100 DVSA / EU AI Act / FORS / Operator Licence terms as schema.org DefinedTermSet
- [ ] **Add structured data** (SoftwareApplication + Organization + FAQ) to / + /pricing + /vs/* + /trust + each /mcps/[slug]
- [ ] **Stand up regulator changelog** — weekly "this week in UK haulier compliance" feed (RSS + /changelog HTML)
- [ ] **DVSA ER application** submitted

### Days 31-60: Trust + comparison
- [ ] **Trust Center v1 live** at /trust with HMAC-chain visualiser + procurement chatbot + gated SOC 2 stub
- [ ] **Add /vs/truckfile + /vs/convey + /vs/checkedsafe + /vs/chevin + /vs/vehocheck + /vs/prolius** (UK DVSA ER vendor competitor set)
- [ ] **Savings calculator** at /roi with the "up to 30% cost reduction" framing Mandata uses (named comparison)
- [ ] **ROI calculator** schema.org Calculator + interactive React component
- [ ] **3-5 case study pages** (even synthetic if no customers yet — Mandata uses "400-500 jobs/day" testimonial format)

### Days 61-90: Authority + LLM citation
- [ ] **MCP Apps showcase page** at /mcp-apps — first-mover SEO + LLM crawl bait
- [ ] **Long-form "EU AI Act for UK Hauliers" guide** — citation-ready, named regulations, Anthropic/OpenAI will crawl it
- [ ] **Long-form "Smart Tachograph 2 migration guide"** (deadline July 2026 — high intent)
- [ ] **Comparison-vs-Vanta page** for the compliance-as-product angle (B2B procurement reads Vanta)
- [ ] **Submit to Logistics UK + RHA + FORS + Brigade integration directories** if exist
- [ ] **Backlink campaign** to /glossary + /changelog from regulator-adjacent sources

---

## ⚠️ CAVEATS

- **Source quality varies.** MCP technical findings (#4-6) exceptionally well-sourced. Vanta findings (#1-2) rely on Vanta's own product pages. AIO finding (#7) has 7-study triangulation. Multi-vertical (#8) is weak — the strongest claims got refuted.
- **Time-sensitivity.** MCP Apps spec is 5 months old; client list expanding monthly. Recheck before committing engineering. AIO data continues to evolve.
- **Don't quote refuted claims** in positioning copy. Specifically: avoid the Samsara fleet-buyer rankings, the Bessemer Atlas vertical-SaaS depth-vs-breadth framing, and the TheRankMasters SEO benchmarks.

---

## 📊 RESEARCH PROVENANCE

- 113 agents, 6.9M subagent tokens, 591 tool uses, 17 min wall-clock
- 6 angles decomposed from the input question
- 30 sources fetched after URL dedup
- 132 claims extracted, 25 verified (top-priority subset), 15 confirmed / 10 killed via 3-vote adversarial rounds
- 8 findings after semantic-dupe synthesis
- Full source list with quality ratings + claim counts in workflow output JSON
