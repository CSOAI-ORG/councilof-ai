# 🐝 Cross-Hive E2E Enhancement Plan
**Date:** 2026-06-15 | **Author:** JEEVES  
**Source:** `HIVE_E2E_AUDIT_2026-06-15.json/md` + SOV3 MCP discovery  
**Goal:** Audit every .ai hive end-to-end as partner, enterprise, end-user, and industry buyer; then enhance each one toward SaaS conversion.

---

## 📊 Audit Summary

| Metric | Value |
|---|---|
| Domains audited | 27 |
| Live (200/307/308) | 23 |
| Dead | 4 |
| Average hive score | 42.0/100 |
| MCP servers mapped | 339 |
| MCP servers with hive relevance | ~102 |

---

## 🏆 Hive Rankings

| Rank | Hive | Score | Live/Total | Biggest Win |
|---|---|---|---|---|
| 1 | Construction | 55.0 | 3/3 | Add Stripe checkout to GrabHire |
| 1 | Agriculture | 55.0 | 2/2 | Add pricing + signup to FishKeeper/KoiKeeper |
| 3 | Governance | 45.8 | 6/6 | Unify all under meok.ai auth + checkout |
| 4 | Compliance | 40.0 | 6/6 | Bundle 6 domains into one compliance suite |
| 5 | Verticals / Other | 39.3 | 5/7 | Revive diyhelp.ai + pokerhud.ai |
| 6 | Productivity | 16.7 | 1/3 | Fix loopfactory.ai + socialmediamanager.ai DNS |

---

## 🧠 Persona Lenses Used

| Persona | What they need | How we tested |
|---|---|---|
| **End user** | Clear value, pricing, signup | `/`, `/pricing`, `/signup` journeys |
| **Enterprise buyer** | Security, demo, contact, procurement | `/enterprise`, `/demo`, `/contact` |
| **Partner / reseller** | Partner program, margins, co-sell | `/partner`, `/partners` |
| **Industry buyer** | Vertical-specific proof | `/industry/*`, `/solutions` |

---

## 🔧 Per-Hive Enhancement Plan

### 1. 🏗️ Construction Hive (score 55.0)
**Domains:** grabhire.ai, muckaway.ai, planthire.ai  
**MCP servers:** construction-iso-19650-mcp, muckaway-ai-mcp, planthire-ai-mcp

**Current state:**
- All 3 domains live
- grabhire.ai has pricing but no signup/contact
- muckaway.ai has Stripe but no pricing page
- planthire.ai is a static TR8 site with no SaaS conversion

**Enhancements (priority order):**
1. **grabhire.ai** — Add `/signup` + `/contact` + Stripe checkout linked from pricing
2. **muckaway.ai** — Add `/pricing` page that surfaces the existing Stripe product
3. **planthire.ai** — Either redirect to grabhire.ai or rebuild as SaaS booking portal
4. **All 3** — Add `/partner` page for plant-hire brokers/resellers
5. **MCP integration** — Surface "Book via MCP" widget: `muckaway-ai-mcp.quote_job`, `planthire-ai-mcp.book_equipment`

**Persona fixes:**
- End user: instant quote → book → pay
- Enterprise (construction firms): `/enterprise` with fleet-management pricing
- Partner: `/partner` with commission structure
- Industry: `/industry/construction` case studies

---

### 2. 🌾 Agriculture Hive (score 55.0)
**Domains:** fishkeeper.ai, koikeeper.ai  
**MCP servers:** fishkeeper-ai-mcp, meok-koikeeper-ai-mcp, meok-aquaponics-monitor-mcp, agriculture-robotics-mcp, meok-laia-aquatic-mcp, meok-rspca-aquaculture-mcp

**Current state:**
- Both domains live
- Both have pricing signals but no signup flow
- Strong MCP foundation (6 servers)

**Enhancements:**
1. **Unified aquaculture portal** — Merge fishkeeper + koikeeper into `aqua.meok.ai` or keep brands but shared auth
2. **Add `/signup`** with free trial + paid tiers
3. **Add `/partner`** for aquaculture suppliers/vets
4. **Live MCP demo** — Embed `fishkeeper-ai-mcp.diagnose_disease` on the homepage
5. **Enterprise** — `/enterprise` for fish farms with multi-pond monitoring

**Persona fixes:**
- End user: upload fish photo → AI diagnosis → buy treatment
- Enterprise: pond sensor integration + SLA
- Partner: vet/supplier referral program
- Industry: aquaculture compliance (RSPCA, welfare) content

---

### 3. 🏛️ Governance Hive (score 45.8)
**Domains:** meok.ai, councilof.ai, proofof.ai, csoai.org, agisafe.ai, asisecurity.ai  
**MCP servers:** 55 governance-related (csoai-governance-crosswalk-mcp, bft-progress-council-mcp, meok-abci-bridge-mcp, etc.)

**Current state:**
- All 6 domains live
- proofof.ai is the strongest (pricing, contact, Stripe)
- meok.ai title missing in audit (likely JS-rendered)
- agisafe/asisecurity have strong content but no conversion

**Enhancements:**
1. **meok.ai** — Fix title/meta; add `/signup`, `/pricing`, `/partner`, `/enterprise`
2. **proofof.ai** — Add `/partner` + `/enterprise`; link to meok.ai checkout
3. **councilof.ai** — Add BFT council demo + `/join-council` signup
4. **agisafe.ai / asisecurity.ai** — Add `/demo` + `/contact`; bundle as "Frontier AI Safety Suite"
5. **csoai.org** — Add donation/sponsorship `/support` + `/membership`
6. **Cross-hive** — Unified Clerk auth across all 6 domains

**Persona fixes:**
- End user: free AI safety scan → paid report
- Enterprise: governance-as-a-service procurement page
- Partner: reseller + co-sell program
- Industry: sector-specific safety templates

---

### 4. ⚖️ Compliance Hive (score 40.0)
**Domains:** safetyof.ai, transparencyof.ai, accountabilityof.ai, biasdetectionof.ai, dataprivacyof.ai, ethicalgovernanceof.ai  
**MCP servers:** 36 compliance servers (eu-ai-act, dora, nis2, gdpr, cra, csrd, etc.)

**Current state:**
- All 6 domains live but thin
- All redirect/branded as CouncilOf.AI
- No pricing, signup, or Stripe
- Massive MCP arsenal underused

**Enhancements:**
1. **Bundle into Compliance Suite** — Landing at `compliance.meok.ai` or keep domains but shared cart
2. **Per-domain quick-scan tool** — Embed the relevant MCP server on each homepage:
   - safetyof.ai → `ai-self-audit-mcp`
   - transparencyof.ai → `agent-content-watermark-mcp`
   - dataprivacyof.ai → `gdpr-ai-mcp`
3. **Add `/pricing`** with tiered bundles: Starter (£79), Pro (£199), Enterprise
4. **Add `/signup`** + `/demo` on each domain
5. **Add `/partner`** for GRC boutiques/resellers
6. **Industry pages** — `/industry/finance`, `/industry/legal`, `/industry/healthcare`

**Persona fixes:**
- End user: free 5-min scan → paid full audit
- Enterprise: `/enterprise` with audit trail + API access
- Partner: white-label GRC partner program
- Industry: sector-specific obligation mapping

---

### 5. 📦 Productivity Hive (score 16.7)
**Domains:** loopfactory.ai, socialmediamanager.ai, optimobile.ai  
**MCP servers:** social-media-ai-mcp, meok-vehicle-handover-mcp

**Current state:**
- loopfactory.ai: 404
- socialmediamanager.ai: DNS failure
- optimobile.ai: live but no conversion

**Enhancements:**
1. **loopfactory.ai** — Deploy static landing + waitlist; fix DNS/A-record
2. **socialmediamanager.ai** — Fix DNS; deploy MVP with `/signup`
3. **optimobile.ai** — Add `/pricing`, `/signup`, `/partner`
4. **MCP integration** — Add "Connect via MCP" for social-media-ai-mcp scheduling

**Persona fixes:**
- End user: sign up → connect accounts → schedule posts
- Enterprise: `/enterprise` with team seats + analytics
- Partner: agency reseller pricing
- Industry: `/industry/ecommerce`, `/industry/agency`

---

### 6. 🌐 Verticals / Other (score 39.3)
**Domains:** landlaw.ai, diyhelp.ai, pokerhud.ai, cobolbridge.ai, suicidestop.ai, commercialvehicle.ai, openmoe.ai

**Current state:**
- diyhelp.ai + pokerhud.ai: DNS dead
- cobolbridge.ai, openmoe.ai: live with content but no conversion
- suicidestop.ai: live, charity-style, no monetization needed
- landlaw.ai: live with contact
- commercialvehicle.ai: live with contact

**Enhancements:**
1. **diyhelp.ai + pokerhud.ai** — Revive or redirect to meok.ai/gaming or meok.ai/verticals
2. **cobolbridge.ai** — Add `/pricing` + `/demo`; target enterprise modernization deals
3. **openmoe.ai** — Add `/pricing` for API credits + `/docs` + `/signup`
4. **landlaw.ai** — Add `/pricing` for legal consultations + `/partner` for solicitors
5. **commercialvehicle.ai** — Add fleet SaaS pricing + `/signup`
6. **suicidestop.ai** — Keep non-commercial; add `/partner` for crisis orgs + donation CTA

**Persona fixes:**
- End user: clear value + signup
- Enterprise: demo + procurement
- Partner: referral/integration program
- Industry: vertical landing pages

---

## 🎮 Gaming Hive (not scored — MCP-only)
**MCP servers:** blizzard-wow-mcp, mmoagent-mcp, evergame-hive-mcp

**Enhancements:**
1. Deploy `wowmcp.ai` landing page ($6.79 Namecheap)
2. Add `/signup` for waitlist + `/pricing` for guild/team tiers
3. Add `/partner` for WoW content creators/guild tools
4. Surface MCP tools on landing: `blizzard-wow-mcp.auction_house`, `mmoagent-mcp.quest_help`

---

## 🛠 Cross-Hive Technical Playbook

### SaaS Conversion Checklist (apply to every live domain)
- [ ] `/pricing` → Stripe checkout
- [ ] `/signup` → Clerk/meok central auth
- [ ] `/login` → existing user
- [ ] `/contact` or `/demo` → high-intent lead capture
- [ ] `/partner` → partner program
- [ ] `/enterprise` → procurement page
- [ ] `/industry/*` → vertical proof
- [ ] `/llms.txt` → LLM discoverability
- [ ] `/mcp` → MCP endpoint exposed
- [ ] Footer: Privacy, Terms, Cookie, Status

### MCP Surfacing Checklist
- [ ] Add "Connect via MCP" CTA on homepage
- [ ] Embed 1-2 demo tool calls on landing page
- [ ] Add `.mcp.json` manifest if missing
- [ ] Register on Smithery/Glama/MCP Registry

### Auth Unification
- [ ] Central Clerk app: `auth.meok.ai`
- [ ] All .ai domains use shared session
- [ ] Single `/checkout` endpoint across products

---

## 📅 Suggested Execution Order

### Week 1 (D9-D11): Quick wins
1. Fix DNS for loopfactory.ai + socialmediamanager.ai
2. Add `/pricing` + `/signup` to top 5 live domains (proofof.ai, grabhire.ai, fishkeeper.ai, cobolbridge.ai, openmoe.ai)
3. Add `/partner` + `/enterprise` templates to all live domains
4. Revive diyhelp.ai + pokerhud.ai as redirects

### Week 2 (D12-D14): MCP integration
1. Embed relevant MCP quick-scan on each compliance domain
2. Add MCP demo widgets to construction + agriculture
3. Register all flagship MCPs on Smithery/Glama

### Week 3 (D15-D17): Enterprise + industry
1. Build `/enterprise` pages for meok.ai, proofof.ai, compliance suite
2. Build vertical landing pages for finance, legal, healthcare, construction
3. Launch partner program page on proofof.ai

---

## 🎯 Success Metrics

| Metric | Current | 30-day target |
|---|---|---|
| Avg hive score | 42.0 | 70.0 |
| Live domains with pricing | 6/23 | 18/23 |
| Live domains with signup | 1/23 | 15/23 |
| Live domains with partner page | 0/23 | 12/23 |
| Live domains with MCP CTA | 0/23 | 15/23 |
| Dead domains | 4 | 0 (redirected or live) |
| MCP Registry listings | partial | all flagships |

---

## 🛡 Red Lines

- No domain left dead without decision (redirect or drop)
- No real Stripe charge until checkout flow tested end-to-end
- No partner page with unverified commission terms
- Every change is mobile-responsive and has basic meta/SEO

---

*This plan converts the audit into an actionable backlog. Each hive can be assigned to a separate tab/agent for parallel execution.*
