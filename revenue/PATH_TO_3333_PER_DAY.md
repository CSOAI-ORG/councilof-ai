# The Path to £3,333/day MRR
## Brutally honest math + concrete 90-day playbook

**Date:** 2026-05-13 · **Current MRR:** £0 · **Target:** £100,770/mo (£1.21M ARR)

---

## THE MATH (no fluff)

| Tier | Price | Customers needed for £100k/mo |
|------|-------|-------------------------------|
| Starter | £29/mo | 3,475 (impossible solo) |
| Pro | £79/mo | 1,275 (very hard) |
| Enterprise | £1,499/mo | 67 (hard but doable) |
| Gap Analysis | £5,000 one-time | 20/month (hard) |
| Notified Body partner | £2,500 setup + £500/mo per case | 30 cases (medium) |
| White-label | £4,999/mo flat | 20 (medium-hard) |

### Realistic mix targeting £100k/mo

```
  150 Pro customers      × £79     = £11,850
   45 Enterprise         × £1,499  = £67,455
    6 Gap Analyses/mo    × £5,000  = £30,000
   ────────────────────────────────────────
                                     £109,305/mo
```

This works IF you land:
- 1.5 enterprise deals/week (a stretch but not crazy in compliance)
- 12-15 new Pro signups/week (achievable with directory + content)
- 1.5 gap analyses/week (achievable with outbound + speaker positioning)

---

## CURRENT STATE → BRUTAL HONEST ASSESSMENT

### What's actually working
- ✅ Infrastructure 100% functional (44 MCPs, attestation API, Stripe webhook verified)
- ✅ 11 of 24 sites have visible monetization paths
- ✅ ~1,500 real human PyPI installs/month (small but real audience)
- ✅ Hermes runs 24/7 daily intelligence
- ✅ SOV3 healthy, neural nets retraining

### What's not working
- ❌ **£0 MRR after 3 weeks live** — proof: nobody's converting
- ❌ Stripe profile incomplete (Nick must finish — see `STRIPE_COMPLETE_PROFILE_NICK.md`)
- ❌ Zero customer testimonials
- ❌ LinkedIn account suspended (lost top channel)
- ❌ No paid outreach running (no Smartlead, no Apollo)
- ❌ No press coverage
- ❌ 13 .ai domains were leaking traffic (Trust Bar deployed today; needs more)

### The brutal truth about £3,333/day in 90 days

**It's a stretch goal, not a forecast.** Realistic 90-day trajectory:

| Month | MRR target | Confidence |
|-------|------------|-----------|
| Month 1 (June 2026) | £500-2,000 | 75% — needs Stripe done + 5 enterprise outbound emails |
| Month 2 (July 2026) | £3,000-8,000 | 60% — needs first enterprise close |
| Month 3 (August 2026) | £8,000-20,000 | 50% — needs Article 50 deadline urgency to land |
| Month 6 (November 2026) | £30,000-60,000 | 35% — needs partnership + scale |
| Month 12 (May 2027) | £80,000-120,000 | 25% — needs everything to compound |

**£3,333/day by 90 days is 5-10% probable.** £3,333/day by month 12 is 25-30% probable. £100/day in 30 days is 80% probable if Nick does the Stripe + outbound work.

---

## 90-DAY PLAYBOOK — 5 PARALLEL PLAYS

Each play targets a different revenue source. Run all 5 in parallel.

### PLAY 1: Enterprise outbound (target: 6 closes in 90 days = £9k/mo)

**Buyer profile:** UK or EU enterprise with EU AI Act exposure + £40k+/yr compliance budget.

**Channels:**
- 200 targeted cold emails per week via Smartlead (£99/mo tool)
- LinkedIn DM (once Nick recovers account)
- Trade press features (PR pitches at `revenue/PRESS_PITCHES_2026-04-29.md`)
- Hermes auto-drafted personalised emails (cron already running)

**Math:** 200/week × 12 weeks = 2,400 emails. At 1% positive reply (industry baseline for compliance B2B), 24 conversations. At 25% close rate (cold-to-customer), 6 enterprise wins = £9k MRR.

**Single biggest unlock:** the Stripe profile being complete (otherwise leads click and bounce). And rebuild LinkedIn.

### PLAY 2: PyPI → SaaS funnel (target: 100 Pro at £79 = £7.9k/mo)

**Buyer profile:** developers + compliance leads at AI startups who install MEOK MCPs from PyPI.

**Conversion mechanism:**
- Free tier hits 10 calls/day limit
- Rate limit error includes Stripe upgrade URL
- Welcome email on signup (drafted, not wired)
- 4-email onboarding drip (drafted, not wired)
- In-tool upgrade CTA visible from message 1

**Math:** 1,500 real human installs/mo. Industry conversion: 1-2% free-to-paid = 15-30 Pro customers/mo. Compounds to 100 in 4-6 months. = £7,900 MRR.

**Single biggest unlock:** wire Resend transactional email (drafted at `customer-success-ping.sh`, needs Nick's Resend API key)

### PLAY 3: Notified Body partnerships (target: 2 partnerships = £30k upfront + £20k/mo)

**Buyer profile:** UK/EU Notified Bodies (TÜV, BSI, DNV, SGS, DEKRA) that need to scale AI conformity assessments.

**Pitch:** MEOK provides white-label tools their assessors use to speed gap analysis 30-50%. They sell the cert; MEOK shares revenue.

**Channels:**
- 5 NB conversations active per the prior strategy doc
- Lead with the FTS5 verbatim text + signed attestation moat
- Offer £2,500 setup + £500/mo per assessment (vs DIY £40k assessment)

**Math:** 2 NB partnerships at £4,999/mo white-label = £10k MRR + setup fees.

**Single biggest unlock:** book 2 NB meetings (warm intros from LinkedIn, or via UK AI Safety Institute network).

### PLAY 4: Compliance content + AEO (target: 200 inbound Pro at £79 = £15.8k/mo over 6 months)

**Buyer profile:** anyone searching "EU AI Act compliance tool" / "DORA reporting MCP" / "NIS2 audit AI" on Google, Perplexity, ChatGPT.

**Mechanism:**
- Daily governance digest published (Hermes draft cron exists — wire to meok.ai/blog)
- 2 blog posts shipped today: 38-MCPs in 3 weeks + Article 50/C2PA/Sigstore moat
- 410 verbatim EU regulation articles in FTS5 (every search hits MEOK first)
- 16 of 24 site robots.txt now allow GPTBot/ClaudeBot/PerplexityBot
- 52 HTML pages got Trust Bar widget for cross-promo
- Schema.org FAQ added to 10 flagship READMEs

**Math:** Content compounds slowly. 30 posts in 90 days × 200 organic visits each = 6,000 visits. 3% sign up for free tier = 180 signups. 5% convert in 6 months = 9 Pro customers. By month 12: 200 Pro = £15.8k MRR.

**Single biggest unlock:** ship 30 posts in 90 days. Hermes drafts; Nick polishes; auto-publish.

### PLAY 5: Industry vertical micro-SaaS (target: 50 customers across 5 verticals = £15k/mo)

Plays per domain:

| Domain | Product | Price | Target | Month-12 MRR |
|--------|---------|-------|--------|--------------|
| haulage.app | Pack of 3 trade MCPs + dashboard | £49/mo | UK trade operators | £1,500 |
| optimobile.ai | UK optician practice mgmt | £99/mo | Independent opticians | £4,000 |
| fishkeeper.ai + koikeeper.ai | Disease diagnosis SaaS | £9/mo | Aquarium hobbyists | £900 |
| landlaw.ai | Per-question £9.99 | per-use | UK property buyers | £500 |
| councilof.ai/cobolbridge.ai | Enterprise gov + COBOL audits | £1,499-5K | Banks, government | £8k+ |
| **Total** | | | | **£15k+** |

**Single biggest unlock:** wire Stripe products for each (currently zero products for these). 1 day of work per domain.

---

## SUM-OF-PLAYS PROJECTION

| Play | 90-day MRR | 12-month MRR |
|------|-----------|--------------|
| Enterprise outbound | £4-9k | £30-50k |
| PyPI funnel | £1-4k | £8-16k |
| NB partnerships | £5-10k | £20-30k |
| Content/AEO | £0.5-2k | £8-16k |
| Vertical micro-SaaS | £1-3k | £10-20k |
| **Total range** | **£11-28k** | **£76-132k** |

**At the upper bound of the 12-month estimate, this reaches £100k+/mo.**

90-day midpoint: ~£15k MRR. Year-1 midpoint: ~£100k MRR.

**This is mathematically achievable. Probability depends on execution, not infrastructure (infrastructure is already done).**

---

## CAPABILITY UPGRADES (CLAUDE'S OWN)

Based on the capabilities research that just landed, here's what I should be doing differently:

### 1. Build `meok-revenue-state-agent` MCP
A FastMCP server with:
- `track_lead_status(email, stage, next_action, due_date)` → PostgreSQL state
- `fetch_leads_by_stage(stage)` → overdue + hot prospects
- `calculate_weighted_ev()` → revenue forecast based on real pipeline
- `record_stripe_event(event)` → auto-logged via PostToolUse hook on Stripe MCP

This is the missing piece between Hermes cron jobs and "what action does Nick take TODAY".

### 2. Parallel tool orchestration in attestation API
Build a `POST /compliance-bundle-card` endpoint that uses Claude API's `tool_choice: "auto"` to call ~16 MCPs in parallel (omnibus tracker + NIS2-DE + Stripe + Vercel + Companies House) and return a single "buyer card" with deadlines, pricing, docs links.

### 3. Stripe MCP automation
Build `POST /agent/create-product` that programmatically creates Pro/Enterprise/Annual Stripe products from code. Version-controlled pricing instead of dashboard clicks.

### 4. Prompt caching for cert generation
The attestation API generates HMAC certs today. When we add Claude API for content generation (FRIA drafts, Annex IV docs, audit reports), use ephemeral prompt caching. 61% cost reduction at 100 certs/day.

### 5. Managed Agent customer sessions
Customers POST `/create-agent` → get a session_id → embed iframe with their own compliance advisor agent. Pre-loaded with their industry MCPs + read-only Stripe + memory store.

**Revenue impact:** managed agents = "MEOK Compliance Advisor" white-label product. £499-2,499/mo per customer. Differentiated from anyone else.

---

## TACTICAL — WHAT TO DO IN NEXT 7 DAYS

### Nick's hands (3-4h total)
1. **Stripe profile** (30 min — non-negotiable)
2. **Resend account + API key** (5 min — enables transactional email)
3. **LinkedIn recovery** (10 min)
4. **Namecheap haulage.app DNS** (5 min)
5. **MCPize founding member registration** (30 min — June 10 deadline)
6. **Send 50 cold emails** (2h)

### Claude autonomous (next session)
7. Build `meok-revenue-state-agent` MCP (4h work)
8. Wire Resend welcome email + 4-email drip (2h, needs Nick's API key)
9. Build `/compliance-bundle-card` endpoint with parallel MCP calls (3h)
10. Add prompt caching to attestation API for any LLM-driven cert generation (1h)
11. Stripe Annual product (£790/yr) via Stripe MCP (5 min, MASSIVE LTV boost)
12. Submit all 38 MCPs to MCPize once Nick signs up (2h batch)
13. Submit to Smithery (2h batch, currently 0/38 listed)

### Revenue infrastructure to ship this week
- `revenue-state.db` (PostgreSQL) — persists pipeline state across cron runs
- `/compliance-bundle-card` — single-call buyer journey
- Stripe Annual product
- Resend wired in attestation API
- Smithery + MCPize listings

---

## WHY THIS WILL WORK (steelman)

1. **The infrastructure is unusual.** 38 MCPs covering every major regime + signed attestations + verbatim regulation text + npx setup CLI is not normal. Competitors have 1-3 MCPs or pure SaaS — not the breadth.

2. **EU AI Act Article 50 cliff is real and 173 days away.** Deadline-driven urgency exists. C2PA support via watermarking-authenticity-mcp v1.1.0 is rare.

3. **MCP marketplace is early.** Smithery has ~6k servers; mcp.so has 20k. Getting featured = 1-5K monthly impressions for free. Founding-member status on MCPize (June 10) = 80% rev share — huge.

4. **DORA + NIS2 in-scope organizations are tens of thousands across EU.** Total addressable market for £79/mo product = £500M+. Capturing 0.1% = £500K/yr.

5. **The verbatim-text-FTS5 moat is defensible.** Daily EUR-Lex sync means MEOK quotes the regulation directly — auditor-defensible. Competitors with LLM-summary citations break the audit chain.

## WHY THIS MIGHT NOT WORK (anti-steelman)

1. **Solo founder bottleneck.** Hitting £100k/mo solo requires every play to compound; one weak link kills it. Vanta hit £100k MRR with 3 founders and seed funding.

2. **Compliance buyers are slow.** Average sales cycle 3-6 months. Even with perfect execution, first enterprise close is 60-90 days away.

3. **No first customer = no testimonials = no social proof flywheel.** The first 3 customers are the hardest.

4. **MCP is still niche.** "Get an MCP" is not yet a normal compliance team request. Education-selling = expensive (long sales cycles).

5. **Nick's bandwidth.** Building, marketing, selling, supporting, and content-creating solo. Hermes helps but isn't a sales team.

---

## THE ASK: WHAT NICK SHOULD COMMIT TO

To hit £15k MRR in 90 days, Nick needs to commit:
- **5 hours/week** on outbound (cold email + LinkedIn DM)
- **3 hours/week** on content (one blog post per week, edit Hermes drafts)
- **2 hours/week** on customer success (reply to every signup, ask for feedback)
- **1 hour/week** on financials (Stripe dashboard, MRR review)
- **Total: 11 hours/week** dedicated to revenue activities

Plus the one-time Stripe + DNS + LinkedIn setup (3 hours).

That's 11h/week × 12 weeks = 132 hours of Nick's commercial work.

In exchange: realistic £15k MRR exit (50%), stretch £30k MRR exit (25%), home-run £50k MRR exit (10%).

**The infrastructure is built. The 90-day window is execution-bound, not technology-bound.**

---

*MEOK AI Labs · 2026-05-13 · Nick + Claude · Goal: £3,333/day*
