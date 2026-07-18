# MASTER HYDRA STRATEGY v1.0
## MEOK AI Labs -- AI Governance MCP Competitive Domination Plan
**Date:** 2026-05-13 | **Status:** ACTIVE | **Revenue:** £0 MRR (target: £3,333/day within 90 days)

---

## EXECUTIVE SUMMARY

This document synthesizes intelligence from four deep research sources:
1. **120+ governance MD files** across the MEOK codebase
2. **Competitor open source code analysis** (Ansvar 276 repos, ArkForge scanner, ARSIA Protocol, Context7 55K stars, FastMCP 25K stars)
3. **councilof.ai + meok.ai live site audit** (72 URLs, 26 MCP products listed, 4 pricing tiers)
4. **Bleeding-edge tech scan** (EUR-Lex Cellar API, C2PA 2.1, MCPize, streamable HTTP, .mcpb extensions)

**The Hydra thesis:** No single competitor combines all three layers -- regulatory data depth, active codebase scanning, and cryptographic attestation. MEOK already has the attestation layer and broadest regulation coverage. By stacking the other two layers and executing distribution ruthlessly, MEOK becomes the only end-to-end AI governance platform in the MCP ecosystem.

---

## PART 1: COMPETITIVE LANDSCAPE (TRUTH)

### 1.1 Market Map

| Competitor | Strength | Scale | Weakness | Threat Level |
|-----------|----------|-------|----------|-------------|
| **Ansvar Systems** (Stockholm) | 61 EU regs, 4,095 articles, daily EUR-Lex sync, hosted endpoint, 195 repos | 276 MCP servers, 119 jurisdictions | No scanning, no attestation, no monetization, 11 stars | **HIGH** -- data moat |
| **ArkForge** | EU AI Act codebase scanner, 22 frameworks, Trust Layer crypto proofs | 10 tools, EUR 29-99/mo tiers | Single regulation, 13 articles, monolithic 4.5K-line server.py | **MEDIUM** -- scanning niche |
| **ARSIA Protocol** (Portugal) | Wire protocol spec, 31 JSON schemas, 613 test vectors, 7 compliance profiles | 2,086 requirement traceability rows | 1 star, zero adoption, BSL license, protocol not product | **LOW** -- too academic |
| **Context7** (Upstash) | 55K stars, ~1M daily npm downloads, zero-friction setup | 33K+ library index | Not governance -- docs fetching. Model for distribution only | **NONE** -- distribution role model |
| **FastMCP** (Prefect) | 25K stars, de facto Python MCP framework | Powers ~70% Python MCPs | Framework not product. Already using their patterns | **NONE** -- our tooling base |
| **scimorph/eur-lex-mcp** | EUR-Lex SOAP wrapper | Single-purpose | No compliance logic, just raw API access | **LOW** |
| **eurlex-mcp-server** (npm) | EUR-Lex Cellar API wrapper | TypeScript | Same -- raw access, no value-add | **LOW** |
| **CIS MCP Companion Guide** | Enterprise governance framework for agentic AI | Guidance only | No tooling | **LOW** |
| **MintMCP** | First SOC 2 Type II certified MCP platform | Platform play | Hosting not governance tooling | **LOW** |

### 1.2 Ansvar Deep Dive (Primary Threat)

**What they have that we don't:**
- SQLite FTS5 database with 4,095 articles + 4,970 recitals + 1,448 definitions
- 709 control mappings (ISO 27001:2022, NIST CSF 2.0)
- 407 evidence requirements (audit artifacts)
- 323 sector/jurisdiction applicability rules
- Daily EUR-Lex auto-sync via GitHub Actions (RSS feed polling + CELEX ID matching)
- Hosted endpoint at `mcp.ansvar.eu` (Cloudflare Worker)
- Dual database adapter (SQLite local + PostgreSQL remote)
- 16 country-specific law MCPs (Germany, Netherlands, UK, Belgium, France, Italy, Norway, etc.)
- 16 supplementary regulation guides (pitfalls, proportionality, cross-reg mapping)
- 12 CI/CD workflows including Semgrep, Trivy, Socket, OSSF Scorecard

**What they DON'T have that we DO:**
- HMAC-SHA256 cryptographic attestations with verification API
- Active compliance checking (not just reference lookup)
- Codebase scanning capability
- Monetization infrastructure (Stripe tiers, payment links)
- Consumer-facing product (meok.ai companion)
- 52-article Partnership Charter framework
- 25+ regulatory crosswalks (CSOAI ↔ ISO 42001, NIST, EU AI Act, etc.)
- Bias detection tooling
- Watermark/C2PA compliance tooling
- DORA × NIS2 crosswalk with dual-compliance scoring
- Care ethics governance layer

### 1.3 ArkForge Deep Dive (Scanner Niche)

**Their scanning architecture:**
- Import/dependency pattern matching across Python, JS, TS, Go, Java, Rust
- 22 AI framework detection (OpenAI, Anthropic, Google, PyTorch, TensorFlow, etc.)
- Per-article compliance scoring (0-100) against 13 EU AI Act articles
- GDPR PII pattern scanning (email, phone, SSN, cookie ops, analytics)
- Trust Layer crypto proofs with verification at `trust.arkforge.tech/verify/`

**Their revenue model:**
- Free: EUR 0 (5 scans/day, 2 tools)
- Pro: EUR 29/mo (unlimited scans, all 10 tools)
- Certified: EUR 99/mo (Trust Layer on every report, 500 free proofs/mo then EUR 0.10/proof)

**What we can improve:**
- Multi-regulation scanning (not just EU AI Act)
- Runtime behavior analysis (not just static imports)
- Integration with our attestation API for signed scan results
- 30+ framework detection (expand beyond their 22)
- Combined scan + remediation roadmap with deadline awareness

---

## PART 2: WHAT WE HAVE (HONEST INVENTORY)

### 2.1 Charter & Crosswalks (Unique IP)

**52-Article Partnership Charter** -- 8 parts covering:
- Part I: Definitions & Scope (Articles 1-7) -- risk classification, certification levels
- Part II: Governance Structure (Articles 8-14) -- Byzantine Council (33 evaluators, 22/33 consensus)
- Part III: Certification Standards (Articles 15-21) -- documentation, risk, fairness, explainability
- Part IV: Security & Testing (Articles 22-28) -- adversarial testing, vulnerability disclosure
- Part V: Data & Privacy (Articles 29-35) -- consent, minimization, breach response
- Part VI: Compliance & Enforcement (Articles 36-42) -- audit rights, incident reporting, remediation
- Part VII: International Cooperation (Articles 43-49) -- cross-border certification, capacity building
- Part VIII: Amendments (Articles 50-52)

**25+ Regulatory Crosswalks** (12 complete, 13+ identified gaps):
| Status | Framework | Coverage |
|--------|-----------|----------|
| Complete | ISO 42001 | 88% |
| Complete | NIST AI RMF | 90% |
| Complete | EU AI Act | 92% |
| Complete | IEEE 7000 | 78% |
| Complete | SOC 2 Type II | 92% |
| Complete | UK AISI | 88% |
| Complete | CMMC 2.0 (48 CFR) | -- |
| Complete | Anthropic Constitutional AI | -- |
| Complete | OpenAI Model Spec | -- |
| Complete | UNESCO AI Ethics | -- |
| Complete | OECD AI Principles | -- |
| Complete | Singapore Agentic AI | -- |
| Complete | Asilomar, Montreal, G7/G20 | -- |
| **GAP** | **ISO 27001** | **Critical for enterprise** |
| **GAP** | **GDPR** | **Non-negotiable for EU** |
| **GAP** | **HIPAA** | **US healthcare** |
| **GAP** | **Canada AIDA** | **Strategic** |
| **GAP** | **PCI DSS** | **Finance** |

### 2.2 MCP Package Portfolio

**Top 15 packages (7,505 dl/mo combined):**

| # | Package | DL/mo | Tools | Key Differentiator |
|---|---------|-------|-------|-------------------|
| 1 | eu-ai-act-compliance | 1,327 | 11 | Flagship. Article-by-article compliance check |
| 2 | bias-detection | 1,196 | 5 | Quick scan + regulatory check |
| 3 | ai-bom | 1,034 | 4 | Bill of Materials generation |
| 4 | dora-compliance | 842 | 9 | DORA Article 5-45 coverage |
| 5 | nis2-compliance | 812 | 7 | NIS2 Article 21-23 measures |
| 6 | cra-compliance | 765 | 7 | CRA essential requirements |
| 7 | ai-incident-reporting | 251 | 3 | Multi-regime incident routing |
| 8 | dora-nis2-crosswalk | 228 | 4 | Dual-compliance mapping |
| 9 | prompt-injection-firewall | 168 | 5 | Injection detection |
| 10 | handoff-certified | 151 | 5 | Agent handoff safety |
| 11 | policy-enforcement | 150 | 6 | Policy gate checks |
| 12 | audit-logger | 148 | 5 | Immutable audit trails |
| 13 | uk-ai-bill | 146 | 5 | UK AI Bill compliance |
| 14 | rate-limiter | 144 | 6 | Tier-aware rate limiting |
| 15 | watermarking-authenticity | 143 | 5 | C2PA + watermark checks |

**Extended portfolio:** 234 total MCP packages on PyPI (most are generic utility MCPs, not governance)

**Critical weaknesses across all 15:**
- 0 Pydantic input/output models
- 0 functional tests
- 0 MCP resources or prompts
- Hardcoded regulation summaries (no real regulatory text)
- No automated regulatory updates
- No FTS5 or search capability
- No codebase scanning
- No hosted endpoint (pip-install only)

### 2.3 Infrastructure

| Asset | Status | Notes |
|-------|--------|-------|
| Attestation API | LIVE | meok-attestation-api.vercel.app -- sign/verify/provision |
| Verification page | LIVE | meok-verify.vercel.app |
| councilof.ai | LIVE | 4 pricing tiers, 26 MCP products listed |
| meok.ai | LIVE | 72 URLs, scorecard, pricing, 9 competitor pages |
| Stripe | CONFIGURED | 81 products, 100 payment links, £0 revenue |
| MCP Registry | PARTIAL | 8/15 listed |
| Hermes (cron) | RUNNING | 5 cron jobs, WhatsApp bridge |
| GitHub org | ACTIVE | meok-ai-labs (needs auth refresh for cross-org PRs) |

### 2.4 Content Assets

- 100+ blog posts (bulk-generated, mostly wellbeing/companion -- NOT governance-focused)
- 9 competitor comparison pages (/vs-vanta, /vs-drata, etc.)
- EU AI Act pillar page with 10 article guides
- Partner program (30% lifetime recurring)
- Scorecard lead magnet (10-question, embeddable)
- EU AI Act Kit (7 templates, ZIP download)
- 3 blog articles on governance topics

---

## PART 3: THE HYDRA STRATEGY (HOW WE WIN)

### 3.1 The Three-Layer Stack

Nobody combines all three. We will be the first.

```
LAYER 3: ATTESTATION & CERTIFICATION (WE OWN THIS)
  ├── HMAC-SHA256 signed compliance certificates
  ├── Public verification URLs
  ├── Board-ready PDF reports
  └── Cryptographic audit chain

LAYER 2: ACTIVE COMPLIANCE SCANNING (BUILD THIS)
  ├── Codebase scanner (30+ AI frameworks)
  ├── GDPR PII pattern detection
  ├── Dependency vulnerability mapping
  ├── Runtime behavior analysis
  └── Multi-regulation scoring (EU AI Act + GDPR + DORA + NIS2 + CRA)

LAYER 1: DEEP REGULATORY DATA (BUILD THIS)
  ├── EUR-Lex Cellar API auto-sync (daily GitHub Actions)
  ├── SQLite FTS5 with verbatim regulation text
  ├── Article-level search with 64-token snippets
  ├── Control mappings (ISO 27001 + NIST CSF 2.0)
  ├── Cross-regulation requirement tracing
  └── Country-specific law databases (DE, FR, UK, NL, BE)
```

### 3.2 Execution Phases

#### PHASE 1: FIX & SHIP (This Week -- May 13-17)

| # | Action | Owner | Time | Impact |
|---|--------|-------|------|--------|
| 1 | ~~Fix syntax errors in 10 packages~~ | Claude | DONE | ~~Confusing errors~~ |
| 2 | ~~Remove dead structured_output code~~ | Claude | DONE | ~~40 lines polluting LLM context~~ |
| 3 | ~~Fix watermarking NameError~~ | Claude | DONE | ~~Runtime crash~~ |
| 4 | ~~Scrub CSOAI-ORG from 75+ files~~ | Claude | DONE | ~~Brand leaking~~ |
| 5 | ~~Version bump + republish all 15~~ | Claude | DONE | ~~Stale PyPI~~ |
| 6 | Register MCPize founding member | Nick | 30 min | **85% revenue share (DEADLINE JUNE 10)** |
| 7 | Submit to Smithery (`smithery mcp publish`) | Claude | 1h | 6,000+ server directory |
| 8 | Submit to PulseMCP, mcp.so, Glama | Claude | 1h | 14K+ / 20K+ / 21K+ directories |
| 9 | Fix www.councilof.ai redirect | Nick | 5 min | ECONNREFUSED on www subdomain |
| 10 | Add councilof.ai/sitemap.xml | Claude | 15 min | Currently 404 |
| 11 | Commit all uncommitted work | Claude | 10 min | 66 files uncommitted |

#### PHASE 2: QUALITY UPGRADE (May 18-24)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 12 | Add Pydantic models to eu-ai-act-compliance | 4h | Type-safe I/O, better LLM schemas |
| 13 | Write 1 functional test per tool (top 5 packages) | 6h | 55 tests, from 0 |
| 14 | Rebuild READMEs with badges, GIFs, copy-paste install | 4h | First-impression fix |
| 15 | Audit tool descriptions for token efficiency (<200 chars) | 2h | LLM context savings |
| 16 | Build .mcpb desktop extension for eu-ai-act | 2h | One-click Claude Desktop install |
| 17 | Add `llms.txt` to every MCP package | 2h | LLM-friendly docs (FastMCP pattern) |
| 18 | Add agent rule files (.cursorrules, CLAUDE.md snippets) | 2h | Auto-trigger on compliance queries |

#### PHASE 3: LAYER 1 -- DEEP REGULATORY DATA (May 25 - June 7)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 19 | Build EUR-Lex Cellar API sync pipeline | 8h | **Match Ansvar's core advantage** |
| 20 | Create SQLite FTS5 database with regulation text | 6h | 4,000+ articles searchable |
| 21 | Build GitHub Actions daily sync workflow | 4h | Always-current regulatory data |
| 22 | Add control mappings (ISO 27001 + NIST CSF 2.0) | 6h | Enterprise cross-reference |
| 23 | Add evidence requirements database | 4h | Audit artifact templates |
| 24 | Add sector applicability rules | 4h | Who needs what |
| 25 | Build `meok-eu-governance` mega-MCP (consolidated) | 8h | One MCP = all regulations |
| 26 | Deploy hosted endpoint on Cloudflare Workers | 4h | Zero-install access |

**EUR-Lex Sync Architecture (copy + improve on Ansvar):**
```
GitHub Actions (daily 6 AM UTC)
  ↓
EUR-Lex Atom Feed: publications.europa.eu/webapi/notification/
  ↓
SPARQL Query: publications.europa.eu/webapi/rdf/sparql (no auth needed)
  ↓
ELI Content Negotiation → XHTML with Akoma Ntoso eId attributes
  ↓
Parse article-level elements → SQLite FTS5 upsert
  ↓
Commit updated DB → auto-publish to PyPI
```

#### PHASE 4: LAYER 2 -- ACTIVE SCANNING (June 8-21)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 27 | Build codebase scanner (30+ AI framework detection) | 12h | Compete with ArkForge |
| 28 | Add GDPR PII pattern scanning | 6h | Email, phone, SSN, cookie ops |
| 29 | Add multi-regulation compliance scoring | 8h | EU AI Act + GDPR + DORA + NIS2 + CRA |
| 30 | Add compliance roadmap generation (deadline-aware) | 4h | Week-by-week remediation plan |
| 31 | Add Annex IV package generation | 4h | Auditor-ready ZIP |
| 32 | Integrate scanner output with attestation API | 4h | Signed scan results |

#### PHASE 5: DISTRIBUTION BLITZ (June 22 - July 5)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 33 | Build `npx meok-setup` CLI (Context7 pattern) | 6h | Zero-friction onboarding |
| 34 | Submit to ALL 11+ MCP directories | 4h | Maximum discoverability |
| 35 | Apply to MCP-Hive Founding Provider program | 2h | Priority exposure |
| 36 | Show HN + Reddit (r/compliance, r/cybersecurity) | 2h | Launch PR |
| 37 | Product Hunt launch | 2h | Consumer visibility |
| 38 | Weekly governance content (not companion blog posts) | 4h/wk | SEO for compliance keywords |
| 39 | 5 trade press pitches | 2h | PR + backlinks |
| 40 | 50 cold emails to GRC consultancies | 4h | Partner channel |
| 41 | Build country-specific law MCPs (UK, DE, FR, NL) | 16h | Match Ansvar's geographic moat |

#### PHASE 6: CONSOLIDATION (July 6 - August 2)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 42 | Integrate C2PA via c2pa-python bindings | 8h | Article 50 watermark compliance |
| 43 | Build Trust Center with public attestation dashboard | 8h | Enterprise sales tool |
| 44 | Add compliance profiles (ARSIA pattern) | 4h | Preset configs per regulation |
| 45 | Build partner API for white-label attestations | 8h | Channel revenue |
| 46 | Prepare for Aug 2 2026 Article 50 enforcement deadline | -- | **HARD DEADLINE** |

### 3.3 Revenue Model

**Current pricing (councilof.ai):**
| Tier | Price | Target |
|------|-------|--------|
| Starter | £29/mo | Solo consultants, small compliance teams |
| Pro | £79/mo | Mid-market, internal compliance teams |
| Enterprise | £1,499/mo | Banks, insurers, CTPPs |
| 48-Hour Gap Analysis | £5,000 one-off | Urgent compliance needs |
| Consulting | £950/day | Hands-on implementation |

**Revenue targets:**

| Milestone | MRR | How |
|-----------|-----|-----|
| Month 1 (June) | £500 | 5 Pro + 2 Starter + 1 consulting day |
| Month 2 (July) | £2,000 | 15 Pro + 5 Starter + 1 Enterprise trial |
| Month 3 (August) | £5,000 | 1 Enterprise + 20 Pro + Article 50 urgency wave |
| Month 6 (November) | £15,000 | 3 Enterprise + 50 Pro + partner revenue share |

**Revenue channels:**
1. **Direct SaaS** -- Stripe subscriptions via councilof.ai
2. **Marketplace** -- MCPize (80/20 split), MCP-Hive, MCP Marketplace (85/15)
3. **Partner** -- 30% lifetime commissions to GRC consultancies
4. **Consulting** -- £950/day for hands-on implementation
5. **One-off products** -- Gap Analysis (£5K), Article 50 Kit (£999), NIS2-DE Kit (£999)

### 3.4 Content Strategy (Pivot from Companion to Governance)

**Current problem:** 100+ blog posts are wellbeing/companion content. Zero governance SEO.

**Target keywords (governance):**
| Keyword | Search Intent | Content |
|---------|--------------|---------|
| eu ai act compliance tools | Buy | /eu-ai-act (pillar -- exists) |
| eu ai act article 50 watermarking | Learn | /blog/article-50-watermarking-guide (exists) |
| dora nis2 dual compliance | Buy | /blog/dora-nis2-crosswalk (NEW) |
| ai governance mcp | Buy | /labs/mcp (exists, improve) |
| eu ai act risk classification | Learn | /blog/risk-classification-guide (NEW) |
| digital omnibus delay 2027 | News | /blog/digital-omnibus-delay-2026 (exists) |
| iso 42001 ai management | Learn | /blog/iso-42001-guide (NEW) |
| ai bias detection tool | Buy | /bias-detection (exists) |
| nis2 germany bsi registration | Buy | /nis2-de-kit (exists) |
| ai compliance attestation | Buy | /trust (exists) |

**Weekly content cadence:**
- 1 governance deep-dive blog post per week
- 1 LinkedIn post (once account recovered)
- 1 newsletter issue (Buttondown)
- 1 dev.to / Medium cross-post

### 3.5 Competitive Moat Building

**What makes us defensible:**

1. **Attestation network effect** -- Every attestation creates a public verification URL. More verifications = more trust signals = more customers. Ansvar can't replicate this without building an entire attestation infrastructure.

2. **Multi-regulation coverage** -- We cover EU AI Act + DORA + NIS2 + CRA + GDPR + UK AI Bill + CSRD + ISO 42001 + more. ArkForge only does EU AI Act. Ansvar has breadth but no active compliance tooling.

3. **Three-layer stack** -- Deep data + active scanning + cryptographic attestation. Nobody else combines all three.

4. **Partner ecosystem** -- 30% lifetime commissions create a referral flywheel that compounds over time.

5. **Article 50 urgency** -- August 2, 2026 enforcement deadline for watermarking creates a forcing function for adoption. Our watermark-attest MCP + C2PA integration is uniquely positioned.

6. **Regulatory churn moat** -- The Digital Omnibus delays, ongoing delegated acts, and national transpositions create constant demand for updated tools. EUR-Lex auto-sync keeps us current automatically.

---

## PART 4: IMMEDIATE ACTIONS (THIS WEEK)

### Priority 1: Revenue-Generating (Nick Required)

| # | Action | Time | Expected Revenue |
|---|--------|------|-----------------|
| 1 | MCPize founding member registration | 30 min | 80% revenue share on marketplace sales |
| 2 | 50 care home cold emails via Apollo/Smartlead | 2h | ~£150-300 MRR from first batch |
| 3 | 5 trade press pitches | 30 min | Backlinks + awareness |
| 4 | Buttondown newsletter signup + Issue #1 | 10 min | Lead nurture channel |
| 5 | Stripe end-to-end test (buy £1 product, verify webhook) | 15 min | Validate entire funnel |
| 6 | LinkedIn account recovery | 10 min | Unlocks 80+ drafted DMs |

### Priority 2: Distribution (Claude Autonomous)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 7 | Publish remaining 7 packages to MCP Registry | 2h | 15/15 listed |
| 8 | Submit to Smithery, PulseMCP, mcp.so, Glama | 2h | 4 new directories |
| 9 | Submit PRs to awesome-mcp-servers lists | 1h | 3 GitHub directories |
| 10 | Add sitemap.xml to councilof.ai | 30 min | SEO for council domain |
| 11 | Commit all uncommitted code | 15 min | Clean git state |

### Priority 3: Quality (Claude Autonomous)

| # | Action | Time | Impact |
|---|--------|------|--------|
| 12 | Add Pydantic models to eu-ai-act-compliance-mcp | 4h | Type-safe tools |
| 13 | Write tests for top 5 packages (1 per tool) | 6h | 55 tests from 0 |
| 14 | Rebuild eu-ai-act README with badges + install commands | 1h | First impressions |

---

## PART 5: METRICS & TRACKING

### Key Performance Indicators

| Metric | Current | Target (30d) | Target (90d) | Target (180d) |
|--------|---------|-------------|-------------|---------------|
| PyPI downloads/month | 7,505 | 15,000 | 50,000 | 150,000 |
| GitHub stars (total) | 0 | 200 | 1,000 | 5,000 |
| MRR | £0 | £500 | £5,000 | £15,000 |
| Directory listings | 1 (partial) | 8+ | All 11+ | All + featured |
| Functional tests | 0 | 55 | 200 | 500 |
| Pydantic models | 0 | 10 | 50 | 100 |
| Regulations in FTS5 DB | 0 | 15 | 61 (match Ansvar) | 80+ |
| Country law MCPs | 0 | 2 (UK, DE) | 5 | 10 |
| Hosted endpoint uptime | N/A | 99.5% | 99.9% | 99.9% |
| Partner signups | 0 | 5 | 20 | 50 |
| Newsletter subscribers | 0 | 200 | 1,000 | 5,000 |

### Weekly Check-in Template

```
WEEK OF: [date]
- Downloads this week: [PyPI stats]
- New Stripe customers: [count]
- MRR change: [£X → £Y]
- Tests added: [count]
- Packages updated: [list]
- Directory submissions: [list]
- Content published: [list]
- Partner conversations: [count]
- Blockers: [list]
```

---

## PART 6: TECHNOLOGY STACK DECISIONS

### EUR-Lex Integration (Critical Path)

**SPARQL Endpoint:** `https://publications.europa.eu/webapi/rdf/sparql`
- Public, no authentication
- 60-second query timeout, max 5 concurrent
- Output: JSON, XML, CSV via Accept header

**Atom Notification Feed:** `https://publications.europa.eu/webapi/notification/`
- Near-real-time document updates
- Use for daily sync trigger

**Content Retrieval via ELI:**
```
GET http://data.europa.eu/eli/reg/2024/1689/oj
Accept: application/xhtml+xml
→ Akoma Ntoso-structured XHTML with article-level eId attributes
```

**Key CELEX IDs for Our Regulations:**
| Regulation | CELEX |
|-----------|-------|
| EU AI Act | 32024R1689 |
| DORA | 32022R2554 |
| NIS2 Directive | 32022L2555 |
| CRA | 32024R2847 |
| CSRD | 32022L2464 |
| GDPR | 32016R0679 |

### C2PA Integration (Article 50)

**Libraries:**
- `c2pa-rs` (Rust, reference) -- manifest creation/validation/signing
- `c2pa-python` -- Python bindings for c2pa-rs
- `c2pa-js` -- WASM wrapper for browser/Node.js
- `contentauth/c2pa-mcp` -- Official C2PA MCP server (2 tools)

**Spec:** C2PA 2.1 (September 2024). Supports JPEG, PNG, WebP, TIFF, GIF, MP4, MOV, PDF.

**EU AI Act Article 50 Requirements:**
- Machine-readable marking of AI-generated synthetic content
- Visible disclosures + machine-readable metadata (C2PA) + invisible watermarking
- Free verification interface (API or UI) with confidence scores
- **Enforcement: August 2, 2026** (unchanged by Digital Omnibus)

### .mcpb Desktop Extension Format

**Spec:** Version 0.3 (December 2025)

**manifest.json structure:**
```json
{
  "manifest_version": "0.3",
  "name": "meok-eu-ai-act",
  "display_name": "EU AI Act Compliance",
  "version": "1.3.1",
  "description": "...",
  "license": "MIT",
  "author": {"name": "MEOK AI Labs", "email": "hello@meok.ai"},
  "server": {
    "type": "python",
    "entry_point": "server.py",
    "mcp_config": {
      "command": "python",
      "args": ["server.py"]
    }
  },
  "tools_generated": true
}
```

**CLI:** `npm install -g @anthropic-ai/mcpb` → `mcpb init` → `mcpb pack`

### Cloudflare Worker Endpoint

**Template:** `npm create cloudflare@latest meok-governance -- --template=cloudflare/ai/demos/remote-mcp-server`

**Deploy:** `npx wrangler deploy` → serves `/mcp` endpoint at `mcp.councilof.ai/mcp`

### Distribution Tooling

| Platform | Method | Notes |
|----------|--------|-------|
| MCP Registry | `mcp-publisher` CLI | Namespace auth via domain verification |
| Smithery | `smithery mcp publish` | 6,000+ servers |
| Glama | Auto-indexed from GitHub | Verify metadata |
| mcp.so | Submit button or GitHub issue | Issue #2170 pending |
| PulseMCP | Submit button in nav | 14,820+ servers |
| MCPize | Registration portal | 80/20 revenue split, register before June 10 |
| MCP-Hive | "Project Ignite" application | Per-request pricing, founding provider |
| npm | `npm publish` (if TypeScript version) | Keywords: mcp, mcp-server, ai-governance |
| awesome-mcp-servers | GitHub PR | 3 lists (punkpeye, wong2, appcypher) |

---

## PART 7: BRAND & POSITIONING

### The Narrative

**Old narrative (councilof.ai):** "One council. Every AI governance framework."
**Problem:** Too abstract. No urgency. No pain point.

**New narrative:** "Compliance infrastructure for AI teams. Scan. Attest. Ship."
**Why better:** Action-oriented. Maps to the three-layer stack. Implies speed.

### Taglines by Audience

| Audience | Tagline |
|----------|---------|
| **Developers** | "pip install eu-ai-act-compliance-mcp. Compliance in your IDE." |
| **CTOs** | "Every attestation is cryptographically signed and publicly verifiable." |
| **Compliance Officers** | "Article-by-article gap analysis. Board-ready reports. 48 hours." |
| **GRC Consultancies** | "White-label our 15 MCPs. 30% lifetime commission." |
| **Enterprise Procurement** | "SOC 2 + ISO 42001 + EU AI Act crosswalk. One vendor." |

### Competitive Positioning

**vs. Ansvar:** "They give you regulation text. We give you compliance automation."
**vs. ArkForge:** "They scan one regulation. We scan all of them and sign the results."
**vs. Manual GRC:** "10x faster than spreadsheets. Cryptographic proof vs. checkbox culture."
**vs. Big GRC platforms (Vanta, Drata):** "AI-native from day one. MCP-first. No legacy."

---

## APPENDIX A: CROSSWALK GAP PRIORITY (From CSOAI_CROSSWALK_GAP_ANALYSIS.md)

### Critical (Must Build Immediately)

1. **ISO 27001** -- Most enterprises already hold this. Bridge from existing ISMS to AI governance.
2. **GDPR** -- Non-negotiable for any EU AI system processing personal data.
3. **SOC 2** -- Every US B2B buyer asks for it. Already have crosswalk on councilof.ai.
4. **Canada AIDA** -- Strategic positioning for Canadian market.
5. **HIPAA** -- US healthcare vertical unlock.

### High (Sector-Specific Premium Pricing)

- FDA AI/ML SaMD, MDR/IVDR (Healthcare)
- Basel III AI Overlay, FCA AI Guidelines, MiFID II (Finance)
- DoD/JAIC AI Ethics, NATO NCIA (Defense)
- UNECE WP.29, ISO 26262 (Automotive)

### Medium (Geographic Market Unlock)

- Brazil LGPD + AI Bill
- India DPDPA + AI Framework
- Japan AI Strategy
- South Korea AI Ethics

---

## APPENDIX B: KEY DATES

| Date | Event | Impact |
|------|-------|--------|
| **June 10, 2026** | MCPize founding member deadline | 85% → 80% revenue share |
| **August 2, 2026** | EU AI Act Article 50 enforcement (watermarking) | **HARD DEADLINE** |
| **November 2, 2026** | EU AI Act Article 50 (revised per Omnibus) | Potential revised deadline |
| **December 2, 2027** | EU AI Act Annex III high-risk enforcement (Omnibus delay) | Major compliance wave |
| **August 2, 2028** | EU AI Act Annex I high-risk enforcement (Omnibus delay) | Final wave |
| **January 17, 2025** | DORA enforcement | Already in force |
| **October 18, 2024** | NIS2 transposition deadline | Already in force (varies by country) |
| **2027 Q4** | CRA enforcement expected | Emerging deadline |

---

## APPENDIX C: OPEN DATA SOURCES TO INTEGRATE

| Source | URL | Content | Auth |
|--------|-----|---------|------|
| EUR-Lex Cellar | publications.europa.eu/webapi/rdf/sparql | EU regulation text | None |
| EUR-Lex RSS | eur-lex.europa.eu/EN/RSS/rss_ojl.xml | Official Journal updates | None |
| EUR-Lex ELI | data.europa.eu/eli/... | Individual acts | None |
| legislation.gov.uk | legislation.gov.uk/api | UK legislation (3,243 acts) | None |
| gesetze-im-internet.de | gesetze-im-internet.de | German federal law | None |
| wetten.overheid.nl | wetten.overheid.nl | Dutch legislation | None |
| Justel | justel.be | Belgian law (5,775 acts) | None |
| Lovdata | lovdata.no | Norwegian legislation | None |
| Legifrance | legifrance.gouv.fr/api | French law | API key |
| NIST CSF 2.0 | nist.gov/cyberframework | Cybersecurity framework | None (public domain) |
| NIST AI RMF | airc.nist.gov | AI risk management | None (public domain) |

---

*This document is the single source of truth for MEOK AI Labs' competitive strategy in the AI governance MCP space. Update weekly. Execute daily.*

*Generated: 2026-05-13 | Next review: 2026-05-20*
