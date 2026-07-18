# Deep Research — All Businesses + AI/Agent Automation Topology

**Date:** 2026-04-28
**Scope:** every business Nick currently runs, AI/agent automation that actually works for each, calibrated revenue plays, succession order
**Read time:** 30-40 min

---

## 0. Honest topology of every business

| # | Domain | Type | Current state | Realistic 2026 revenue ceiling | Effort to compound |
|---|---|---|---|---|---|
| 1 | **templeman-opticians.com** | Family opticians, Rayleigh Essex | Live, NHS home visits + eye tests | £150-300K turnover existing | Low — already operational |
| 2 | **networknick.co.uk** | Digital marketing agency | Live as agency front | £30-100K MRR if scaled | High — needs sales engine |
| 3 | **iokfarm.co.uk** | Working farm → future MEOK Research Campus | Live farm | £50-150K farming + £0 R&D yet | Med — content + brand |
| 4 | **meok.ai** | MEOK AI Labs (sovereign + EU compliance) | Live, £0 charges | £50K-£500K MRR realistic | High — distribution-bound |
| 5 | **csoai.org** | "FAA for AI" governance brand | Live static site | £20-200K MRR realistic | Med — needs sales |
| 6 | **proofof.ai** | Attestation verification | DNS pending | £10-100K MRR realistic | Low if rails already done |
| 7 | **cobolbridge.ai** | Legacy mainframe migration | Static landing only | £200K-£2M/yr realistic | Very high — enterprise sales |
| 8 | **tree-king.co.uk** | Tree surgery (Network Nick client/property) | Live | £200-800/mo retainer | Very low |
| 9 | **randalls-crane-hire.co.uk** | Crane hire | Vercel queued, not live | £200-500/mo retainer | Low |
| 10 | **wcr-grab-hire.co.uk** | Grab hire | Vercel queued, not live | £200-500/mo retainer | Low |
| 11 | **biasdetectionof.ai** | Bias detection brand | Redirects to /bias-detection | included in MEOK | n/a |
| 12 | **councilof.ai** | Hydra storefront | Live | £0-50K depending on rank | Med |

**Pattern:** four buckets — (1) Family + farm operating businesses with stable income, (2) Network Nick agency front + 3-5 client/property sites, (3) MEOK/CSOAI/proofof/cobolbridge are the AI/regulatory bet, (4) remaining domains are SEO/brand assets.

---

## 1. The single insight Nick is missing

**Network Nick is the distribution arm Nick already owns.**

The hard problem for MEOK isn't building product (done — 31+ MCPs, 100+ pages, 9 Stripe products). It's *getting in front of buyers*. Nick has been hand-rolling cold outreach for 8 months at zero conversion.

But Nick already runs a **digital marketing agency** that talks to UK SMBs every day. That agency's relationship with local mid-market businesses (50-500 employees, £5-50M turnover) is the *exact* ICP for NIS2-UK / UK AI Bill / data protection compliance products at £79-£1,499/mo.

**The play:** every Network Nick client gets a discovery call about their AI/data exposure → upsell to MEOK Pro tier (£79/mo) or Audit-Prep Bundle (£4,950) → 30% commission stays with Network Nick. Even at 10% conversion across 50 existing clients, that's £400/mo to £25K one-time direct.

Cost to wire: 4 hours (script + Stripe Connect + one demo call). Highest-leverage internal move possible.

---

## 2. Universal AI/agent stack for ALL businesses

The same automation toolchain serves every business. Build it once, deploy across 12 brands.

### 2.1 The core 7 tools (≤£200/mo total)

| Tool | Cost | Use | What it replaces |
|---|---|---|---|
| **Cal.com self-host or Calendly** | £0 (self-host) or £8/mo | Booking page per business | Phone-tag with customers |
| **Buttondown** | £9/mo first 1K subs | Newsletter for each brand | Mailchimp at £30+ |
| **Smartlead.ai** | £39/mo | AI-personalised cold email | Manual outreach |
| **Clay.com** | £100/mo (skip if budget) | Lead enrichment from LinkedIn/Apollo | Hours of research |
| **n8n self-host** | £0 (Docker) | Workflow automation | Zapier £30+/mo |
| **Crisp.chat** | £0 free tier | Live chat across all sites | Custom chatbot dev |
| **Ahrefs / Semrush** | £83-99/mo (1 only) | SEO + backlink audit | Hours per site |

**Total: £140-160/mo across the entire portfolio if Nick self-hosts n8n + Cal.com.**

### 2.2 Open-source self-hosted stack (best for Nick)

Nick already runs everything on Vercel + has Docker + has SOV3 backend. Self-host stack:

| Self-hosted | Replaces | Where to run |
|---|---|---|
| **n8n** | Zapier, Make.com | Docker on iokfarm server or Vercel cron jobs |
| **Cal.com** | Calendly | Vercel free tier |
| **PocketBase** or Supabase free | Mailchimp DB layer | Vercel/Supabase free |
| **Plausible** or Umami | Google Analytics | Vercel-self-host |
| **Sentry self-host** | Bug tracking | Docker on iokfarm |
| **Crisp self-host** | Intercom | Docker on iokfarm |

If Nick stands up a **single Docker host on iokfarm** running n8n + PocketBase + Plausible + Crisp, ALL 12 businesses share one workflow + analytics + chat + DB infrastructure. Cost: zero ongoing, ~£20-30 of compute.

### 2.3 AI agents for each business function

| Function | Agent stack | Build effort | Cost |
|---|---|---|---|
| **Outbound sales** | n8n + LinkedIn scraper + GPT-4-mini for personalisation + Smartlead for delivery | 8h | £39/mo |
| **Inbound qualification** | Crisp + Claude Haiku 4.7 for triage + Cal.com for booking | 6h | £15/mo (Anthropic API) |
| **Customer support** | Claude Sonnet 4.7 + RAG over docs + Crisp routing | 12h | £30-50/mo per business |
| **Content production** | Claude Opus 4.7 + Surfer SEO checker + Buttondown delivery | 4h | £40/mo |
| **SEO + competitive intel** | Ahrefs MCP + Claude analysis (weekly cron) | 4h | £83/mo (1 Ahrefs seat shared) |
| **Lead intel + ICP matching** | Apollo + Clay + Claude scoring | 6h | £100/mo |
| **Review + NPS automation** | n8n + Twilio SMS + Claude reply suggestions | 4h | £15/mo |
| **Appointment recall (opticians)** | n8n + SMS + email scheduled by patient last-visit-date | 4h | £15/mo |

---

## 3. Per-business playbooks

### 3.1 Templeman Opticians (family business — £150-300K turnover, mature)

**Reality:** family opticians in Rayleigh Essex doing NHS home visits. Stable cash flow. Not a growth play — an automation play. Goal is reduce admin burden, increase margin.

**Highest-ROI automation moves:**

1. **GBP (Google Business Profile) optimization** — single biggest local-SEO lever
   - Verify ownership, complete every field, add 50+ photos
   - Reply to every review within 24h (use Claude to draft replies)
   - Post weekly updates (offers, hours, services, photos)
   - **Effect:** 30-60% increase in "near me" search visibility within 90 days

2. **Recall workflow automation**
   - Patient database export → n8n cron → 12-month/24-month recall SMS
   - Template: "Hi {name}, it's been {months} since your last eye exam at Templeman Opticians. Book online: cal.com/templeman or call 01268 777729."
   - **Effect:** 15-30% recall rate uplift = ~£8K-£20K/yr extra revenue at typical exam pricing

3. **NHS home visit lead capture**
   - Hero of templeman-opticians.com is "Are you eligible for a home eye test?"
   - Add 3-question form (age, mobility, postcode) → auto-eligibility check → instant booking
   - **Effect:** 2-5x form conversion rate for the home visit segment

4. **Review collection**
   - Post-appointment: SMS asks for Google review with direct link
   - n8n workflow: 24h after appointment → SMS → if 5-star intent, send Google review link / if <5, send private feedback form first
   - **Effect:** GBP review count + average rating both compound; reviews drive more local rank

5. **Glasses/contacts reorder**
   - 12-month-after-purchase SMS: "Time for new lenses? Reorder online: ..."
   - **Effect:** 10-20% reorder rate at full price vs walk-back-in expectation

**Tools to wire:** n8n + Twilio (£15/mo) + Claude Haiku for personalisation (£5/mo) + Cal.com (free)

**Effort:** 12 hours one-time setup. Ongoing: 1h/week monitoring.

**12-month uplift estimate:** £15-50K annual revenue increase, £5-15K admin time saved.

---

### 3.2 Network Nick (digital marketing agency — £30-100K MRR potential)

**Reality:** this is Nick's most under-leveraged asset. Digital marketing agency front. Lots of UK SMBs need basic websites + SEO + Google Ads. Unit economics: £500-2K/mo retainer per client × 30-50 clients = £15-100K MRR.

**Existing client base (inferred from Vercel projects):**
- tree-king.co.uk (live)
- randalls-crane-hire.co.uk (queued)
- wcr-grab-hire.co.uk (queued)
- + likely others

**The agency-as-MEOK-distribution play:**

UK SMBs are now in scope for:
- UK AI Bill (passed 2026) — light disclosure obligations
- NIS2-UK transposition (in progress) — for medium businesses
- UK GDPR Article 22 (AI decision-making) — automated processing rules
- Potentially DORA-equivalent for fintech-adjacent

These aren't enterprise-grade obligations BUT they are confused-SMB-buyer-with-budget territory.

**Productized service: "AI Compliance Lite" at £150/mo per client:**

- Pre-built templates: AI Use Policy, Data Processing Record, Privacy Notice update for AI
- Quarterly self-attestation (signed cert from MEOK attestation API)
- 30 min/quarter live consult
- Cost to deliver: £30/mo of MEOK API + £30 of Nick's time = £60 cost
- Margin: £90/mo per client × 30 clients = £2,700/mo MRR

**To execute:**

1. **Email blast to existing Network Nick clients:**
   "Hi {name}, quick heads-up — UK GDPR + AI Bill changes mean you need updated documentation. We've productised it: £150/mo, includes signed attestation, quarterly review, all template updates. First month free if you sign by {date}. Reply YES or book at cal.com/networknick-ai-lite"

2. **Outbound to local-business directories** (UK Chamber of Commerce, Better Business UK, FSB):
   Same offer, cold-emailed. Smartlead at 50 sends/day.

3. **Wire MEOK rev-share through Network Nick**: every NN client converted to MEOK product = 30% to NN.

**Tools to wire:** Smartlead (£39/mo) + Apollo (£0 free tier) + Cal.com + n8n.

**Effort:** 16 hours setup + 4 hours/week ongoing.

**12-month projection:** 20-50 client conversions = £3-7.5K MRR added.

---

### 3.3 iokfarm.co.uk (farm + future MEOK Research Campus)

**Reality:** working farm. Future research campus for MEOK + Asimov robotics + AI testing.

**Two phases:**

**Phase 1 (now — Q3 2026): farm runs as farm + content brand**

- Document the farm-to-AI journey: weekly blog posts ("Building MEOK from a working farm in Essex")
- High-quality photo / video content from the farm + lab + caravan-as-office
- This is THE narrative differentiator from every other AI startup
- Each post → newsletter, Twitter thread, LinkedIn (when account back)
- Authenticity drives compounding trust at zero distribution cost

**Phase 2 (Q4 2026 — Q2 2027): MEOK Research Campus**

- Physical workshop for Asimov V8 / WOLF gears / robotics
- Open invite to AI/robotics community for 1-day visits (paid £200/day)
- "Building in public" → drives MEOK customer acquisition
- Innovate UK + Horizon Europe grant evidence (UK AI Sandbox project)
- Potentially apply for DSIT AI Research Resource (AIRR) facility designation

**Revenue paths:**
- Existing farm income (livestock/crops) — keep as is
- Visitor/workshop fees (£200/day × 50 days/yr = £10K)
- Robotics kit sales from on-site builds (WOLF gears £500-2K each)
- Grant income via the campus narrative
- Long-term: bookable AI/robotics testing facility

**Effort:** Low ongoing. Mostly content + occasional event hosting.

**Tools to wire:** Cal.com for visitor bookings, Stripe £200/day product, weekly blog post automation.

---

### 3.4 MEOK AI Labs (covered in DEEP_RESEARCH_NEXT_LEVEL_2026-04-28)

Refer to that doc. Key untouched: send the LinkedIn DMs already drafted, post Show HN, submit GSC sitemap. £0 ARR until execution catches up to inventory.

**New additions from this analysis:**

1. **Network Nick channel** (above) — fastest path to first paying customers because warm intros via existing agency clients
2. **Farm narrative** — content moat that no VC-backed competitor can replicate
3. **Multi-business knowledge base** — every page across 12 domains links back to MEOK MCPs as the underlying tech, building topical authority

---

### 3.5 CSOAI.org (governance brand)

**Reality:** static site, "FAA for AI" framing, no current revenue.

**The right play:** position as the **research + advisory front** for MEOK AI Labs, NOT another product surface. CSOAI publishes white papers + research; MEOK sells the implementation.

**Concrete moves:**

1. **One white paper per month** — long-form research (e.g., "The State of EU AI Act Implementation: 100 Companies Audited"). Free PDF download → email capture.
2. **CSOAI Advisory Board** — recruit 3-5 named advisors (UK AI Office alumni, regulatory consultants, GRC vets). Pay zero, give them a logo on the site.
3. **Quarterly "State of AI Compliance" report** — branded research that news outlets quote. Generates inbound press calls.
4. **Free council assessments** — 3 free per month, reserved for case-study eligible companies. Outcome: testimonials.

**Effort:** 6 hours/month for content + 2 hours/quarter for reports.

**Revenue:** indirect — CSOAI doesn't sell directly; it generates leads for MEOK products at higher trust level.

---

### 3.6 cobolbridge.ai (legacy mainframe migration)

**Reality:** static landing only. Massive TAM ($2B+ COBOL modernization market) but enterprise-grade sales cycles (6-18 months).

**Why Nick should NOT push hard right now:**
- Enterprise procurement requires SOC 2, references, and case studies — all currently zero
- Sales cycle exceeds Nick's 12-month cash runway
- Big4 + Accenture already own the buyers Nick wants

**Why Nick SHOULD keep it warm:**
- DORA Reg 2022/2554 + NIS2 force banks to modernize critical-function ICT (incl. COBOL)
- One enterprise contract = £200K-£2M
- Asymmetric upside — could be a £10M business if any one bank converts

**Right move:** maintain landing page + waitlist, post 1 blog post/month, do NOT spend cycles on outbound. Wait for inbound or for an MEOK reference customer (who might mention COBOL pain).

**Tools to wire:** waitlist form + automated 30-day nurture (1 email/week, Buttondown).

---

### 3.7 proofof.ai (attestation verification)

**Reality:** DNS pending Cloudflare access from Nick. Backend fully built. Static landings deployed but not aliased.

**The fastest revenue path:** flip the script — instead of selling proofof.ai as a separate product, position it as the FREE auditor verification surface for every other MEOK product. Each compliance attestation links to `proofof.ai/v/<cert_id>` for verification.

**Once DNS is live, the play:**
- Every signed cert from MEOK = link back to proofof.ai
- Each verification page = SEO surface for "verify [company] EU AI Act compliance"
- Generate hundreds of indexed pages over time = compounding SEO authority

**Premium tier (later):** "Verified by proofof.ai" badge for company websites — £49/mo for the badge embed + verification page.

**Effort:** 30 min once DNS unblocks.

---

### 3.8 Tree-King / Randalls Crane Hire / WCR Grab Hire

**Reality:** Network Nick agency clients (or properties Nick uses for SEO juice). Local UK service businesses.

**Per-site automation playbook (template):**

1. **Schema.org local-business markup** — name, address, phone, opening hours, service area
2. **GBP profile + 20+ reviews** — outreach existing customers
3. **Click-to-call mobile button + WhatsApp Business**
4. **Quote request form with auto-reply** (Claude-drafted email back within 60 seconds)
5. **Lead-capture chatbot** (Crisp + Claude Haiku — "What service do you need?" → routes to right callback page)
6. **Review automation** — same template as opticians

Each site: 4 hours setup, then auto-pilot. Network Nick charges £200-500/mo retainer for ongoing maintenance + content.

**Total effort:** 4-8 hours per site × 5 sites = 20-40 hours.

**Revenue:** £1K-£2.5K MRR if Network Nick scales to 10-15 such clients.

---

## 4. Master automation topology — single n8n instance, 12 brands

**Build one self-hosted n8n on iokfarm Docker host. All workflows below run from this single instance.**

```
[ Lead source ] → [ n8n ingest ] → [ Claude triage ] → [ CRM (PocketBase) ] → [ Action ]
```

### Workflow inventory (build once, deploy across all brands)

| Workflow | Brand | Trigger | Action | Build time |
|---|---|---|---|---|
| GBP review → Claude reply draft | All local biz | new review | drafted reply in inbox | 2h |
| Form submission → instant Claude email reply | All sites | form submit | Claude-drafted email + Cal.com link | 3h |
| Recall reminder (12-month) | Templeman Opticians | cron daily | SMS/email if patient overdue | 4h |
| Cold email sequence | Network Nick agency | once-off list import | 7-touch email + LinkedIn over 14 days | 6h |
| Newsletter scheduling | All brands | cron weekly | Claude drafts → human review → Buttondown send | 3h |
| GBP weekly post | All local biz | cron weekly | Claude drafts post → manual approve → publish | 4h |
| New customer welcome | All brands | Stripe new sub | 5-email onboarding sequence | 3h |
| Churn detection | All brands | Stripe cancellation | win-back email + 50% discount offer | 2h |
| Compliance attestation refresh | MEOK customers | quarterly cron | regenerate signed cert + email customer | 4h |
| Lead enrichment | All outbound | new contact | Apollo + Clay + Claude scoring | 4h |
| Calendar prep | All meetings | 30 min before call | Claude generates briefing doc from CRM | 2h |
| Post-call follow-up | All meetings | 1 hr after call | Claude drafts follow-up email + next steps | 2h |

**Total workflow build effort:** 39 hours one-time.

**Ongoing maintenance:** 2 hours/week.

**Output:** every brand has full sales + marketing + support automation running 24/7.

---

## 5. Specific stack recommendations (calibrated)

### What to build first (10-day sprint)

**Day 1-2: Infrastructure**
- Docker host on iokfarm (or Hetzner cloud £5/mo if no farm internet)
- n8n + PocketBase + Plausible + Crisp self-hosted
- Cal.com self-host on Vercel

**Day 3-4: Templeman Opticians**
- GBP optimization (one-off)
- Recall workflow live
- Form chatbot
- Review automation

**Day 5-6: Network Nick agency front**
- Productize "AI Compliance Lite" service
- Outbound sequence to existing clients
- Outbound to UK Chamber lists

**Day 7-8: MEOK distribution wire**
- Network Nick → MEOK rev-share via Stripe Connect
- Cross-link Network Nick clients to MEOK products

**Day 9-10: Multi-brand newsletter + content engine**
- Buttondown account per brand (or shared CSOAI)
- Claude content workflow in n8n
- First newsletter issue across all brands

### What to NOT build first

- Don't add more meok.ai pages
- Don't add more PyPI MCPs
- Don't pursue cobolbridge actively
- Don't attempt iokfarm campus yet (Q4 2026+)
- Don't build new vertical SaaS (LandLaw, KoiKeeper, FishKeeper) until existing portfolio profitable

---

## 6. Calibrated revenue forecast (12 months, conservative)

| Business | M3 MRR | M6 MRR | M12 MRR |
|---|---|---|---|
| Templeman Opticians | +£500 (recall uplift) | +£1.5K | +£2K |
| Network Nick agency | £1K → £3K MRR | £4K | £8K |
| Network Nick → MEOK rev-share | £100 | £400 | £1.5K |
| MEOK direct | £400 | £1.5K | £4K |
| CSOAI advisory deals | £0 | £500 | £2K |
| iokfarm farm + content | £200 (visitor/event) | £500 | £1K |
| Cobolbridge | £0 | £0 | £500 (one waitlist conversion) |
| Tree-King / Crane / Grab retainers | £500 | £1K | £1.5K |
| Other domains | £0 | £100 | £500 |
| **Total MRR** | **£2.7K** | **£12.5K** | **£21K** |
| **Annual run rate (M12)** | | | **£250K** |

**Cash from one-offs (audit bundles, kit sales, grants):** likely £20-80K spread across 12 months.

**12-month total revenue estimate:** £150K-£300K, net of tools costs £2-5K.

---

## 7. The single biggest risk

**Solo founder bandwidth.** 12 brands × 39h n8n setup + 2h/week ongoing = 90+ hours setup + 8 hr/week.

If Nick tries to do all 12 perfectly, none get done. The right sequence:

1. **Week 1:** infrastructure + Templeman Opticians (most cash + lowest risk)
2. **Week 2:** Network Nick agency-as-MEOK-distribution
3. **Week 3-4:** MEOK direct outreach + newsletter discipline
4. **Month 2-3:** scale Network Nick agency client base + iokfarm content
5. **Month 4-6:** CSOAI white papers + advisory + cobolbridge waitlist nurture
6. **Month 7-12:** scale winners, kill losers

**Don't bunch.** Pick one. Do one well. Move to next.

---

## 8. Hire / outsource recommendations

Once Network Nick agency hits £5K MRR (probably month 4-6), hire:

| Role | Pay | Outcome |
|---|---|---|
| **VA in Philippines** (£500-800/mo) | Email triage, calendar, GBP posts | Frees Nick from 15h/week |
| **Junior SEO writer** (£500-1K/mo) | 4 blog posts/week across portfolio | Compounds organic traffic |
| **Sales SDR** (£1K-2K/mo + commission) | LinkedIn DMs + cold email at scale | Frees Nick from outreach |

Total: £2-3.8K/mo headcount to remove the solo-founder ceiling. Pays back at 1-2 retained clients.

---

## 9. The five frameworks Nick should steal from

### A. Justin Welsh model (one-person enterprise)

- Daily LinkedIn educational post → newsletter conversion → £2-9K/mo info products
- Compounds over 18 months from zero to multi-million ARR
- Zero ads, zero VAs (until £30K MRR)
- Reading: justinwelsh.me

### B. Pieter Levels model (small bets, kill fast)

- Build 5-10 small SaaS, give each 4 weeks
- Whatever doesn't pay rent in month 2, kill
- Nomadlist + remoteok.com, both £1M+ ARR
- Reading: levels.io

### C. Dan Andrews / Tropical MBA (process-heavy ops)

- Document everything, hire VAs for repetitive
- Buy/build SAAS that scales without founder time
- 10x via systems not effort
- Reading: tropicalmba.com

### D. Adam Wathan / Tailwind UI (productized expertise)

- Fixed-price digital products (no support burden)
- £40-200 each, sell 10-1000+ /month
- Reading: adamwathan.me

### E. Sahil Lavingia / Gumroad (creator economy)

- Open metrics, charge real money early
- Lifestyle business → optionality not exit pressure
- Reading: sahillavingia.com

**Nick's natural fit:** B + C + D combo. Multi-brand (B), automation-heavy (C), productized digital (D). Avoid A (depends on personal brand which is currently in LinkedIn-deletion mode).

---

## 10. The ONE thing this doc says

**Network Nick is your secret weapon.** Every existing agency client is a warm-intro to MEOK at 30% rev share. Wire it this week. Nothing else moves the needle as fast at £0 ARR.

Second: Templeman Opticians' recall automation is the easiest £15-50K of revenue uplift Nick can deliver in his portfolio. Two weekends of work.

Third: don't build more product. The product is sufficient. Distribution is the bottleneck. Network Nick + Templeman are the distribution.

---

## Appendix A — Specific tools shortlist with links

### Free / open-source (always start here)
- n8n (workflow): n8n.io
- Cal.com (booking): cal.com
- PocketBase (lightweight DB): pocketbase.io
- Plausible (analytics): plausible.io/self-hosted
- Crisp (chat free tier): crisp.chat
- Apify (scraping): apify.com (free tier 5K credits)
- Make.com / Zapier alternative: make.com (1K ops/mo free)
- Buttondown (newsletter): buttondown.email (100 subs free)
- Cohere / Claude API (LLM): claude.com
- Mistral (cheap LLM): mistral.ai

### Paid (when you have revenue to justify)
- Smartlead.ai £39/mo cold email
- Apollo.io £49/mo lead data
- Clay.com £100/mo enrichment
- Ahrefs £83/mo SEO
- Twilio pay-as-you-go SMS
- Stripe (free tier sufficient until £10K MRR)
- Notion £8/user/mo team docs

### AI agents specifically for outreach (2026 winners)
- **Smartlead.ai** — best value cold email at scale
- **Reply.io** — multichannel sequences
- **Lemlist** — most personalized (video/image-in-email)
- **Outreach.io** — enterprise-tier (skip for now)
- **Lavender** — email writing co-pilot

### AI agents for support
- **Crisp Magic Reply** (uses GPT under hood) — free tier
- **Intercom Fin** — too expensive at £79/mo per resolution
- **Zendesk Answer Bot** — enterprise
- **Custom: Claude Sonnet 4.7 + Pinecone RAG** — best for technical products like MEOK

### AI agents for content
- **Buttondown + Claude** — best newsletter combo
- **Surfer SEO + Claude** — SEO-optimized content
- **Beehiiv** — newsletter with built-in growth tools
- **Captions.ai** — short-form video (not relevant yet)

---

## Appendix B — What to read this week

In priority order:

1. **"The Mom Test" by Rob Fitzpatrick** — how to actually validate problems with customers (1.5 hr read)
2. **"Traction" by Gabriel Weinberg** — 19 distribution channels, pick 3 (4 hr read)
3. **"Obviously Awesome" by April Dunford** — positioning for B2B (3 hr read)
4. **"From Impossible to Inevitable" by Aaron Ross** — cold outreach for B2B (4 hr read)

---

## Appendix C — What I (Claude) can do autonomously next session

If you want me to keep executing instead of researching, here's the priority list:

1. **Build the n8n workflow blueprints** as JSON exports you can import (4 hours)
2. **Templeman Opticians recall workflow** — concrete code (2 hours)
3. **Network Nick agency landing page rebuild** to position productized AI Compliance Lite (3 hours)
4. **iokfarm.co.uk content reset** — first blog post about farm-to-AI narrative (2 hours)
5. **Wire MEOK rev-share via Stripe Connect** so Network Nick agency commissions track automatically (4 hours)
6. **Submit 21 missing PyPI packages to Anthropic MCP Registry** — fixes the gap in RUNDOWN_AUDIT (2 hours)
7. **Draft 4 weekly newsletter issues** (one per brand) ready to send (3 hours)

Pick one. I'll do it. Each one moves a real lever.

**End of deep research. Read it twice. Then pick the one move that compounds.**
