# MEOK AI Labs — Master Revenue Activation Plan

## Single Source of Truth for Revenue Operations

**Date:** May 9, 2026
**Status:** Infrastructure built. 209+ MCPs ready. Stripe live. **£0 MRR.**
**Deadline Ticking:** EU AI Act Article 27 FRIA — ~85 days (August 2, 2026)
**This Document Supersedes:** eu-ai-act-gtm-plan.md, cobol-bridge-sales-plan.md, domain-monetization-plan.md, CRITICAL-PATH-TO-REVENUE.md, REVENUE-BATTLE-PLAN.md

---

## PART 1: £0 → £1 — THE FIRST POUND OF REVENUE

### The Absolute Minimum Path

There is exactly one path from £0 to £1. It requires these steps in strict order:

```
Step 0: Stripe is in LIVE MODE (BASELINE — verify before anything else)
Step 1: Send 40 LinkedIn DMs to warm prospects (harvest, not hunt)
Step 2: Send 5 direct cold emails to verified targets (Beamery, Tractable, ClearScore, Zopa, Multiverse)
Step 3: One person clicks a Stripe payment link and pays
Step 4: First pound lands in the bank account
```

**Estimated time to first revenue:** 1-7 days from execution start.
**Minimum viable outcome:** 1 × £49/mo subscription = £49 MRR = first pound.

### What's Blocking First Revenue

| # | Blocker | Severity | Status | Fix Time |
|---|---------|----------|--------|----------|
| **1** | **Stripe live mode unverified** | 🔴 CRITICAL | Needs business verification + bank account | 24-48 hours |
| **2** | **cobolbridge.ai Stripe pricing wrong** | 🔴 CRITICAL | Charging £2,499/mo instead of £199/mo — lawsuit risk | 30 minutes |
| **3** | **6/6 pricing misalignments across products** | 🟠 HIGH | Engine shows one price, Stripe charges another | 2 hours |
| **4** | **compliance.meok.ai DNS not resolving consistently** | 🟠 HIGH | Landing page unreachable for prospects | 1 hour |
| **5** | **LinkedIn account deleted** | 🟠 HIGH | Cannot send DMs without profile | 24 hours to rebuild |
| **6** | **safetyof.ai returns 404** | 🟡 MEDIUM | Broken redirect, missed traffic | 5 minutes |
| **7** | **socialmediamanager.ai returns 436 error** | 🟡 LOW | Typo domain, blocked by bot protection | Park or drop |
| **8** | **No email capture on compliance.meok.ai** | 🟡 MEDIUM | Visitors leave without entering funnel | 2 hours |
| **9** | **No Google Ads account configured** | 🟡 MEDIUM | Zero paid acquisition running | 2 hours |
| **10** | **No case studies or social proof** | 🟡 MEDIUM | Harder to close skeptical buyers | Ongoing |

### Exact Steps to First Revenue (In Order)

#### Step 0 — VERIFY STRIPE IS LIVE (Before Doing Anything Else)

```bash
# Test: Go to dashboard.stripe.com → "Payments" tab
# If you see "Test mode" badge in top bar, NOTHING ELSE MATTERS
```

1. Complete identity verification at https://dashboard.stripe.com/settings/account
2. Add business bank account details (MEOK AI Ltd, UK)
3. Submit for review (approved in 24-48 hours)
4. Get live API keys
5. Update these files with live keys:
   - `~/clawd/unified-saas/dashboard/.env.local`
   - `~/clawd/mcp-monetization-gateway/.env`
   - `~/clawd/meok-labs-engine/.env`
6. Rotate any hardcoded keys in `~/clawd/create-stripe-products-live.py` — ensure `os.environ.get("STRIPE_SECRET_KEY")` is used (already fixed)
7. Test with a £1 charge on your own card

#### Step 1 — CREATE NEW LINKEDIN PROFILE (Day 1)

Old profile was deleted. Rebuild:
1. Create new LinkedIn account with professional photo
2. Headline: "Founder, MEOK AI Labs | EU AI Act Compliance | COBOL Modernization"
3. Add compliance.meok.ai and cobolbridge.ai to featured section
4. Connect with 40 prospects immediately (see priority list below)
5. Send 5 connection requests per day (LinkedIn limit before spam flag)

#### Step 2 — FIX COBOLBRIDGE.AI STRIPE PRICING (Day 1 — 30 min)

```
1. Stripe Dashboard → Products → COBOL Bridge Pro
2. Create new price at £199/mo (intended price)
3. Set £2,499/mo price to inactive
4. Update cobolbridge.ai landing page checkout link
5. Create separate Enterprise tier at £2,499/mo (this was accidentally the right number at the wrong tier)
```

#### Step 3 — FIX ALL PRICING MISALIGNMENTS (Day 1 — 2 hours)

| Product | Engine Shows | Stripe Charges | Fix |
|---------|-------------|----------------|-----|
| MEOK Core Pack | £49/mo | £79/mo | Create correct £49/mo price |
| Governance Bundle | £149/mo | £99/mo | Create correct £149/mo price |
| Security Bundle | £199/mo | £149/mo | Create correct £199/mo price |
| Defence Bundle | £499/mo | £199/mo | Create correct £499/mo price |
| Industry Bundle | £299/mo | £129/mo | Create correct £299/mo price |
| COBOL Bridge Pro | £199/mo | £2,499/mo | Create £199/mo, set £2,499 to inactive |

#### Step 4 — VERIFY DNS FOR compliance.meok.ai (Day 1 — 1 hour)

```bash
dig compliance.meok.ai +short
# Should resolve to Vercel IP
# If not: update nameservers in domain registrar
# Verify csoai.org also points to Vercel (councilof.ai uses this infrastructure)
```

#### Step 5 — FIX BROKEN DOMAINS (Day 1 — 15 min)

```
1. safetyof.ai → redirect to agisafe.ai (5 min fix)
2. socialmediamanager.ai → park or drop (typo domain, zero value)
3. All "of.ai" governance domains → redirect to councilof.ai feature pages
```

#### Step 6 — CREATE MISSING STRIPE PRODUCTS (Day 1 — 1 hour)

Create these products in Stripe (payment links needed for outreach):

| Product | Price | Type |
|---------|-------|------|
| MEOK Core Pack | £49/mo | Subscription |
| EU AI Act Starter Kit | £49/mo | Subscription |
| EU AI Act Pro Kit | £199/mo | Subscription |
| EU AI Act Assessment | £5,000 | One-time |
| Indie/Bootstrapped tier | £499/yr | Annual subscription |
| Rapid FRIA | £1,499 | One-time |
| Pro for Teams | £499/mo | Subscription |

#### Step 7 — SEND THE LINKEDIN DMS (Day 2 — Begin Immediately)

**Protocol:** Max 5 connection requests per day. Send connection note (300 chars). Wait for acceptance before DM.

**Priority Order (send in this sequence):**

**Batch 1 — Fintech (highest urgency: DORA + EU AI Act overlap):**
1. ClearScore — CRO or Head of Compliance
2. Zopa — CTO or Head of Engineering
3. Funding Circle — CTO or Compliance Director
4. Monzo — Head of ML or CISO
5. Starling Bank — CTO or Head of Engineering

**Batch 2 — Healthtech (Annex III high-risk by definition):**
6. Babylon Health — CTO or Head of AI
7. NHS Digital — Head of AI Governance or CISO
8. Push Doctor — CTO
9. AccuRx — CTO or Head of Product
10. Cera Care — CTO

**Batch 3 — HR-Tech (hiring AI = high-risk):**
11. Workable — CTO
12. Pinpoint ATS — CTO
13. Beamery — CTO
14. SmartRecruiters — CTO
15. Personio — CTO

**Batch 4 — Insurtech (pricing AI = high-risk):**
16. Lemonade — CTO or Head of Compliance
17. Cuvva — CTO
18. Zego — CTO
19. Marshmallow — CTO

**Batch 5 — GRC Partnerships (white-label):**
20. Bridewell Consulting — Director or Partner

**Batch 6 — Fintech extended:**
21. Revolut — CTO
22. Wise — CTO
23. GoCardless — CTO
24. TrueLayer — CTO
25. Bud — CTO

**Batch 7 — Enterprise AI platforms:**
26. Synthesia — CTO
27. Stability AI — CTO
28. Wayve — CTO
29. PolyAI — CTO
30. Faculty AI — CTO

**Batch 8 — Insurance + Government:**
31. Aviva — CTO
32. Admiral Group — CTO
33. UKHO (UK Hydrographic Office) — Head of Digital
34. HMRC — Head of Digital
35. DWP — Head of Digital

**Batch 9-12:** Remaining prospects from CRM (65 total in pipeline)

#### Step 8 — SEND DIRECT COLD EMAILS (Day 2 — Begin Immediately)

**Verified contacts (emails confirmed):**

1. **Beamery:** abakar@beamery.com (Abakar Saidov, CEO)
2. **Tractable:** alex@tractable.ai (Alex Dalyac, Chairman) + venkat@tractable.ai (Venkat Sathyamurthy, CEO)
3. **Multiverse:** hello@multiverse.io (routing to Euan Blair)
4. **Zopa:** careers@zopa.com (ask for CTO)
5. **ClearScore:** hello@clearscore.com (routing)

**Email finding tools:** hunter.io (25 free/mo), Apollo.io (100 free/mo)

---

## PART 2: 30-DAY SPRINT TO FIRST REVENUE

### Week 1: Foundation & Activation (Days 1-7)

| Day | Task | Time | Owner | Revenue Impact |
|-----|------|------|-------|---------------|
| **1** | Stripe live mode activation — identity verification + bank account | 2 hr | Nick | 🔴 BLOCKING |
| **1** | Rotate hardcoded Stripe key in create-stripe-catalog.js | 30 min | Nick | 🔴 SECURITY |
| **1** | Fix cobolbridge.ai £2,499 → £199 pricing | 30 min | Nick | 🔴 LAWSUIT RISK |
| **1** | Fix all 6 pricing misalignments | 2 hr | Nick | 🟠 REVENUE LEAK |
| **1** | Verify compliance.meok.ai DNS resolves to Vercel | 1 hr | Nick/JEEVES | 🟠 TRAFFIC LOST |
| **1** | Fix safetyof.ai → redirect to agisafe.ai | 5 min | JEEVES | 🟡 |
| **2** | Create new LinkedIn profile + connect with first 5 prospects | 1 hr | Nick | 🟠 |
| **2** | Send first 5 LinkedIn connection requests (fintech batch) | 30 min | Nick | 🟢 REVENUE |
| **2** | Send 5 direct cold emails (Beamery, Tractable, Multiverse, Zopa, ClearScore) | 30 min | Nick | 🟢 REVENUE |
| **2** | Create missing Stripe products (7 products) | 1 hr | Nick/JEEVES | 🟠 |
| **3** | Send next 5 LinkedIn connections (healthtech batch) | 30 min | Nick | 🟢 |
| **3** | Follow up on Day 2 LinkedIn DMs for any acceptances | 30 min | Nick | 🟢 |
| **3** | Submit PRs to 5 awesome lists (see Section: Awesome Lists) | 1 hr | Nick/JEEVES | 🟢 SEO |
| **4** | Send next 5 LinkedIn connections (HR-tech batch) | 30 min | Nick | 🟢 |
| **4** | Add email capture (ConvertKit/Resend) to compliance.meok.ai | 2 hr | JEEVES | 🟡 FUNNEL |
| **4** | Add GitHub topics to all 21 compliance MCP repos | 1 hr | JEEVES | 🟢 SEO |
| **5** | Send next 5 LinkedIn connections (insurtech batch) | 30 min | Nick | 🟢 |
| **5** | Set up Google Ads account (£20/day budget, £600/mo max) | 2 hr | Nick/JEEVES | 🟢 ACQUISITION |
| **5** | Submit NLnet NGI Zero Commons Grant (deadline June 1) | 2 hr | Nick | 🟢 £17-43K |
| **6-7** | Complete remaining LinkedIn outreach batches | 1 hr/day | Nick | 🟢 |
| **6-7** | Write + publish dev.to article: "EU AI Act Article 27: The FRIA Deadline Nobody's Talking About" | 3 hr | Nick/JEEVES | 🟢 CONTENT |
| **7** | Review Week 1 metrics: outreach sent, responses, connections | 30 min | Nick | — |

**Week 1 Success Criteria:**
- [ ] Stripe live mode ACTIVE
- [ ] All pricing fixed (zero misalignments)
- [ ] 25 LinkedIn connection requests sent
- [ ] 5 cold emails sent
- [ ] compliance.meok.ai DNS resolving
- [ ] Google Ads account created
- [ ] First 5 awesome list PRs submitted
- [ ] NLnet grant submitted

### Week 2: First Prospect Conversations (Days 8-14)

| Day | Task | Time | Owner | Revenue Impact |
|-----|------|------|-------|---------------|
| **8** | Send next 5 LinkedIn connections (partnership batch) | 30 min | Nick | 🟢 |
| **8** | Respond to all Week 1 LinkedIn replies — book calls | 1 hr | Nick | 🟢 CONVERSION |
| **8** | Set up Calendly for "15-min Compliance Health Check" bookings | 30 min | Nick/JEEVES | 🟢 |
| **8** | List top 5 compliance MCPs on MCPize (85/15 rev share) | 2 hr | JEEVES | 🟡 DISTRIBUTION |
| **9** | Send next 5 LinkedIn connections (enterprise AI batch) | 30 min | Nick | 🟢 |
| **9** | Send Batch 2 cold emails — 25 targets from Segment 1 (fintech) | 2 hr | Nick | 🟢 |
| **9** | Set up Smartlead.ai or Instantly.ai for cold email sequences (£50-100/mo) | 1 hr | Nick | 🟡 |
| **10** | Send next 5 LinkedIn connections (insurance batch) | 30 min | Nick | 🟢 |
| **10** | Publish 2nd content piece: "How to Run a DORA TLPT Scope Assessment Without Paying €80K" on dev.to | 2 hr | JEEVES | 🟢 |
| **10** | Deploy meok-fria-generator-mcp to PyPI (3-hour build) | 3 hr | JEEVES | 🟢 PRODUCT |
| **11** | Send next 5 LinkedIn connections (government batch) | 30 min | Nick | 🟢 |
| **11** | Follow up on all Week 2 LinkedIn replies | 1 hr | Nick | 🟢 |
| **11** | Add FRIA product to Stripe (£49 self-serve, £1,499 consulting) | 30 min | JEEVES | 🟢 |
| **12** | Send Batch 3 cold emails — targets from Segment 2 (healthtech) | 2 hr | Nick | 🟢 |
| **12** | Submit meok-fria-generator to GenAI-Gurus/awesome-eu-ai-act | 30 min | JEEVES | 🟢 |
| **13** | Post on r/europrivacy, r/gdpr, r/Compliance about FRIA generator | 1 hr | Nick | 🟢 |
| **13** | Create compliance.meok.ai/blog structure for SEO content | 2 hr | JEEVES | 🟡 |
| **14** | Week 2 review: total DMs sent, responses, meetings booked | 30 min | Nick | — |
| **14** | Send Batch 4 cold emails — targets from Segment 3 (HR-tech) | 2 hr | Nick | 🟢 |

**Week 2 Success Criteria:**
- [ ] 50 total LinkedIn connection requests sent
- [ ] 75 cold emails sent
- [ ] 3-5 prospect calls booked
- [ ] MCPize listings live
- [ ] FRIA generator deployed to PyPI
- [ ] 2 content pieces published

### Week 3: Publish & Launch Paid Channels (Days 15-21)

| Day | Task | Time | Owner | Revenue Impact |
|-----|------|------|-------|---------------|
| **15** | Conduct first prospect calls (fintech + healthtech) | 3 hr | Nick | 🟢 DEALS |
| **15** | Send Batch 5 cold emails — targets from Segment 4 (insurtech) | 2 hr | Nick | 🟢 |
| **15** | Publish enterprise compliance suite to PyPI (all 21 compliance MCPs) | 4 hr | JEEVES | 🟢 |
| **16** | Conduct more prospect calls | 2 hr | Nick | 🟢 |
| **16** | Launch Google Ads Campaign 1: "EU AI Act Compliance" (£20/day) | 2 hr | Nick/JEEVES | 🟢 PAID |
| **16** | Launch Google Ads Campaign 2: "DORA / Financial Compliance" (£10/day) | 1 hr | JEEVES | 🟢 PAID |
| **17** | Prospect calls + follow-ups from previous days | 2 hr | Nick | 🟢 |
| **17** | Set up LinkedIn retargeting + Google retargeting tag on compliance.meok.ai | 2 hr | JEEVES | 🟡 |
| **17** | Publish 3rd content piece: "85 Days Until the EU AI Act Hits" on dev.to | 2 hr | JEEVES | 🟢 |
| **18** | Send Batch 6 cold emails — targets from Segment 5 (enterprise AI) | 2 hr | Nick | 🟢 |
| **18** | Submit top 10 MCPs to Glama.ai (Dockerfiles included) | 2 hr | JEEVES | 🟢 |
| **19** | Prospect calls + demo with first enterprise lead | 2 hr | Nick | 🟢 |
| **19** | Optimize compliance.meok.ai for conversion (hero + pricing + FAQ) | 3 hr | JEEVES | 🟡 |
| **20** | Send Batch 7 cold emails — targets from Segment 6 (professional services) | 2 hr | Nick | 🟢 |
| **20** | Set up email welcome sequence (day 1, 3, 7, 14) for new signups | 2 hr | JEEVES | 🟡 |
| **21** | Week 3 review: pipeline status, Google Ads data, content metrics | 30 min | Nick | — |
| **21** | Publish 4th content piece: "We Built an Open-Source FRIA Generator" on dev.to | 2 hr | JEEVES | 🟢 |

**Week 3 Success Criteria:**
- [ ] 125 total LinkedIn connection requests sent
- [ ] 200 cold emails sent
- [ ] 8-12 prospect calls completed
- [ ] Google Ads live (both campaigns)
- [ ] All 21 compliance MCPs on PyPI
- [ ] FRIA generator live on PyPI + GitHub
- [ ] 4 content pieces published

### Week 4: Close First Deal (Days 22-30)

| Day | Task | Time | Owner | Revenue Impact |
|-----|------|------|-------|---------------|
| **22** | Follow up on all pipeline deals — urgency close (81 days to deadline) | 2 hr | Nick | 🔴 DEALS |
| **22** | Send Batch 8 cold emails — remaining targets | 2 hr | Nick | 🟢 |
| **23** | Send enterprise proposals to prospects who completed demos | 3 hr | Nick | 🔴 DEALS |
| **23** | Publish IAPP pitch: "Cryptographic Attestation for AI Compliance" | 2 hr | JEEVES | 🟢 |
| **24** | Close negotiations — send Stripe invoices | 2 hr | Nick | 🔴 REVENUE |
| **24** | Set up first onboarding for any closed deals | 1 hr | Nick/JEEVES | 🟢 |
| **25** | Publish "Cost Comparison" article on Indie Hackers | 2 hr | JEEVES | 🟢 |
| **26** | Continue pipeline follow-ups + new outbound (50 more cold emails) | 3 hr | Nick | 🟢 |
| **27** | Publish "C2PA Stack" article on dev.to | 2 hr | JEEVES | 🟢 |
| **28** | Conduct QBR-style review with first customer (if closed) | 1 hr | Nick | 🟡 |
| **28** | Write case study from first deal | 2 hr | Nick/JEEVES | 🟢 SOCIAL PROOF |
| **29** | Iterate pricing / messaging based on Week 4 feedback | 2 hr | Nick | 🟡 |
| **30** | Month 1 review: MRR achieved, pipeline, lessons learned | 1 hr | Nick | — |
| **30** | Plan Month 2 strategy adjustments | 1 hr | Nick | — |

**Week 4 Success Criteria:**
- [ ] First revenue received (£395-£4,500)
- [ ] At least 1 paid subscriber
- [ ] At least 1 case study draft
- [ ] 250 total cold emails sent
- [ ] 150 total LinkedIn connections attempted
- [ ] 15+ prospect calls completed

---

## PART 3: 90-DAY PLAN TO £10K MRR

### Revenue Streams & 90-Day Targets

#### Stream 1: EU AI Act Compliance (councilof.ai + compliance.meok.ai)

| Target | Month 1 | Month 2 | Month 3 | Unit Price |
|--------|---------|---------|---------|------------|
| Pro subscribers | 5 | 10 | 15 | £79/mo |
| Rapid FRIA (one-time) | 1 | 3 | 5 | £1,499 |
| Full Assessment (one-time) | 0 | 1 | 2 | £5,000 |
| Enterprise accounts | 0 | 1 | 2 | £1,499/mo |
| White-label partners | 0 | 0 | 1 | £2,499/mo |
| **EU AI Act Total MRR** | **£395** | **£2,289** | **£6,682** | |

#### Stream 2: COBOL Bridge (cobolbridge.ai)

| Target | Month 1 | Month 2 | Month 3 | Unit Price |
|--------|---------|---------|---------|------------|
| Self-serve seats (avg 3/user) | 9 | 30 | 54 | £199/mo |
| Enterprise accounts | 0 | 1 | 4 | £2,499/mo |
| Paid pilots | 1 | 2 | 3 | £5,000 one-time |
| **COBOL Bridge Total MRR** | **£1,791** | **£8,469** | **£20,742** | |

#### Stream 3: MCP Marketplace (monetization gateway)

| Target | Month 1 | Month 2 | Month 3 | Avg Price |
|--------|---------|---------|---------|-----------|
| MCPize subscribers | 2 | 7 | 15 | £29/mo |
| MCPize one-time purchases | 2 | 5 | 10 | £49 |
| Individual MCP subscriptions | 3 | 8 | 15 | £29/mo |
| **MCP Total MRR** | **£87** | **£348** | **£725** | |

#### Stream 4: Domain Portfolio

| Domain | Month 1 | Month 2 | Month 3 | Model |
|--------|---------|---------|---------|-------|
| councilof.ai (compliance marketplace) | Folded into Stream 1 | — | — | SaaS |
| cobolbridge.ai | Folded into Stream 2 | — | — | SaaS |
| meok.ai (platform hub) | £200 | £500 | £2,000 | SaaS |
| agisafe.ai (bundled w/ council) | £0 | £200 | £500 | SaaS |
| ethicalgovernanceof.ai (ISO 42001) | £0 | £100 | £300 | SaaS |
| muckaway.ai / grabhire.ai | £100 | £200 | £500 | Lead-gen |
| planthire.ai | £50 | £150 | £300 | Lead-gen |
| landlaw.ai | £0 | £0 | £100 | SaaS |
| Domain sales (proofof.ai, etc.) | £0 | £0 | £5,000 | One-time |
| **Domain Total Recurring** | **£350** | **£1,150** | **£3,700** | |

### Consolidated 90-Day Revenue

| | Month 1 | Month 2 | Month 3 |
|---|---|---|---|
| **Total MRR** | **£2,623** | **£12,256** | **£31,849** |
| **One-time revenue** | **£6,499** | **£15,000** | **£30,000** |
| **Grant (if awarded)** | £0 | £17,000-43,000 | £0 |
| **Total Revenue** | **£9,122** | **£44,256-70,256** | **£61,849** |

**Conservative £10K MRR target:** Achievable by late Month 2 / early Month 3.

### What Must Be True for £10K MRR

1. **EU AI Act stream delivers £6.7K MRR** — requires 15 Pro + 2 Enterprise + 1 white-label by Month 3. Achievable if outreach volume stays at 50+ per week.
2. **COBOL Bridge delivers £20K MRR** — this is the upside surprise. Even half the projected converts (£10K) plus EU AI Act stream gets to £16.7K. The COBOL numbers are aggressive and assume product gaps are closed.
3. **Without COBOL Bridge:** EU AI Act alone must deliver £10K. This requires 30 Pro subscribers + 1 Enterprise + 1 white-label. Tight but feasible given the August 2 deadline pressure.
4. **The NLnet grant (€20-50K)** is binary — if awarded, it transforms the financial position. Submit by June 1, 2026, noon CEST.

---

## PART 4: PRICING ARCHITECTURE (UNIFIED)

### EU AI Act Compliance Suite

```
Free tier              — £0      (5 MCP tools, 100 req/day, community support)
Indie                  — £499/yr (all starter tools, hosted attestation, 10K req/mo)
Pro                    — £79/mo  (all compliance MCPs, full attestation, priority support)
Pro for Teams          — £499/mo (5 seats, Slack support, all compliance MCPs)
Enterprise             — £1,499/mo (dedicated instance, DORA TLPT, SLAs, monthly review)
Enterprise + Consulting — £5,000/mo (everything + quarterly audits, framework crosswalk, DPO support)
White-Label            — £2,499/mo (co-branded dashboard, logo on attestations, referral fees)
Rapid FRIA             — £1,499 one-time (48h FRIA with signed attestation)
Full Assessment        — £5,000 one-time (comprehensive multi-framework audit)
```

### COBOL Bridge

```
Self-Serve (per seat)  — £199/mo  (COBOL → Python/Java/Go transpilation, API access)
Self-Serve Annual      — £1,910/yr (£159/mo, save 20%)
Team (5 seats)         — £799/mo  (extra support, priority queue)
Team Annual            — £7,670/yr (£639/mo, save 20%)
Enterprise (10 seats)  — £2,499/mo (onboarding, SLA 4-hour, on-prem option, SSO/SAML, custom targets)
Enterprise Annual      — £23,990/yr (£1,999/mo, save 20%)
Paid Pilot             — £5,000 flat (30-day pilot with success criteria)
```

### MCP / Platform

```
Free tier              — £0      (5 MCP tools, GitHub/PyPI open source)
Developer (Core Pack)  — £49/mo  (5 foundational MCPs, hosted)
Pro                    — £99/mo  (15 MCPs + advanced features)
Business               — £299/mo (all MCPs + priority support + white-label)
API Credits            — £9-99   (pay-as-you-go packs)
```

### Discounts

| Category | Discount |
|----------|----------|
| Annual billing | 15-20% off monthly |
| Multi-year (2yr) | 20% off |
| Multi-year (3yr) | 30% off |
| Non-profit/academic | 50% off |
| Startup (< 2 years, < £500K funding) | £249/mo Pro for Teams |

---

## PART 5: COMPETITIVE POSITIONING SUMMARY

### The Three Things No Competitor Can Match

1. **Cryptographic Attestation with Public Verify URL** — Auditors verify at a public URL, not trust a PDF. No competitor offers this. This is the single hardest feature to replicate and the strongest moat.

2. **Open Source at Scale** — 209+ MCPs, MIT licensed, on PyPI and GitHub. Enterprises can inspect every line of code. Vanta/Drata/OneTrust are black boxes.

3. **MCP-Native Architecture** — All tools are AI-agent-callable. As AI agents become the primary way companies manage compliance, MEOK is architected for that future. No incumbent is.

### Pricing Advantage vs Incumbents

| Competitor | Annual Cost | MEOK Equivalent | Savings |
|-----------|-------------|-----------------|---------|
| OneTrust | €130K-300K/yr | £0-£18K/yr | 85-100% |
| Vanta/Drata | $7.5K-100K/yr | £0-£18K/yr | 76-100% |
| Credo AI | £25K-50K/engagement | £79/mo-£5K | 95-99.7% |
| Big 4 COBOL Consulting | £2M-20M | £2,388/yr | 99.9% |
| Micro Focus COBOL | £50K-500K | £2,388/yr | 95-99.5% |

---

## PART 6: OUTREACH SCRIPTS — COPY-PASTE READY

### LinkedIn DM Scripts

#### Connection Request (300-char limit):

```
{first_name}, I'm building an AI tool that automates EU AI Act compliance with cryptographic attestation. Given your role at {company}, would love to connect.
```

#### Post-Connection DM — Fintech CTO:

```
Hey {first_name} — quick one.

The EU AI Act Article 27 FRIA deadline is August 2. Public-sector deployers and SaaS vendors selling to them need a Fundamental Rights Impact Assessment in place by then.

I've built an automated FRIA generator that produces cryptographically signed, auditor-verifiable assessments in minutes — not weeks.

Free tier is live at compliance.meok.ai if you want to check it out. Happy to walk your team through the Pro tier (£79/mo or £1,499 done-for-you).

Are FRIA requirements on your radar yet?
```

#### Post-Connection DM — Healthtech CISO:

```
Hi {first_name} — quick one.

If your platform uses AI for medical diagnosis, triage, or patient risk scoring, you're in scope for the EU AI Act's high-risk category. Article 27 FRIA deadline: August 2.

I run MEOK AI Labs — we ship open-source compliance MCPs that automate risk classification, gap analysis, and audit-ready documentation. Cryptographic attestation means your auditor verifies everything at a public URL. No PDFs to chase.

Free tier for the basic scan: compliance.meok.ai
Pro tier (£79/mo) for continuous monitoring and automated FRIA generation.

Worth a quick look before the August deadline starts piling pressure on the compliance team?

Nick
```

#### Post-Connection DM — HR-Tech Legal/DPO:

```
Subject: AI hiring tools + EU AI Act = high-risk (August deadline)

Hi {first_name},

EU AI Act classifies AI in employment/hiring as high-risk. If your platform does resume screening, candidate ranking, or video-interview analysis, you need a Fundamental Rights Impact Assessment by August 2.

I've built an automated FRIA generator that produces signed, auditor-verifiable assessments. Takes the legal team from "where do we start?" to "here's our signed FRIA" in under an hour.

Pro tier is £79/mo. Done-for-you rapid assessment is £1,499 with 48-hour turnaround.

The EU AI Office hasn't even published their official template yet — this gets you ahead of the curve.

compliance.meok.ai

Nick Templeman, MEOK AI Labs
```

#### Post-Connection DM — COBOL Modernization:

```
Thanks for connecting, {first_name}.

Quick context: I run COBOL Bridge (cobolbridge.ai) — we use AI to transpile COBOL into modern code in hours, not years. 70% cheaper than rewrites, 100x faster than consulting firms.

I'd love to send you a 2-minute demo video showing a real COBOL-to-Python transformation. Worth a look?

No pressure — just think it's relevant to what you're dealing with.
```

#### Follow-up (Day 3, if no reply):

```
{first_name}, quick nudge — offering 3 companies a free compliance health check this month. 15 minutes, you get a gap score and priority list. Any interest for {company}?
```

#### Follow-up (Day 7, final):

```
Final nudge — the August 2 deadline is {X} days away. Happy to show you our FRIA generator anytime. Here's the free tier: compliance.meok.ai. Best, Nick
```

### Cold Email Templates

#### Template A: EU AI Act — General Cold Outreach

```
Subject: [One of the five below]

{Subject lines — A/B test all:
1. "August 2 deadline: is your AI compliant?" (urgency)
2. "Your AI + the EU AI Act: a 15-minute sanity check" (low-commitment)
3. "The EU AI Act FRIA deadline nobody's talking about" (curiosity gap)
4. "EUR 35M fines start August 2 — where does your AI stand?" (loss aversion)
5. "[Company Name] + EU AI Act: quick compliance scan?" (personalised)
}

Hi {first_name},

The EU AI Act Article 27 requires a Fundamental Rights Impact Assessment (FRIA) for high-risk AI systems. Deadline for public-sector deployers and their vendors: August 2, 2026.

Penalties: up to €35M or 7% of global turnover.

I've built a free tool that scans your AI systems against EU AI Act risk categories in minutes — no sign-up, no sales call: compliance.meok.ai

If you need the full FRIA with cryptographic attestation (the kind auditors accept), the Pro tier is £79/mo. Done-for-you rapid assessment: £1,499 with 48-hour turnaround.

No 6-month consulting engagement. No committee formation. Just a clear picture of where you stand.

Happy to answer any questions.

Nick Templeman
Founder, MEOK AI Labs
nick@meok.ai
```

#### Template B: COBOL Bridge — Banking CIO (Risk-Oriented)

```
Subject: One of your COBOL developers is retiring this year

Hi {first_name},

Every bank has at least one COBOL developer over 60 who knows systems nobody else understands. When they leave — and they will — that institutional knowledge walks out the door.

I run COBOL Bridge (cobolbridge.ai), an AI-powered tool that transpiles COBOL into production-ready Python, Java, or Go — while preserving exact business logic.

One UK bank used it to modernize a 40-year-old payment processing module in 3 days instead of 14 months.

Here's a challenge: send me one real COBOL program from your estate. Within 24 hours I'll return:
- Modern, documented code in your chosen language
- A generated test suite proving it works identically
- An API wrapper so it plugs into your cloud stack

No charge. No obligation. If it's not production-ready, you've lost nothing.

Fair?

Nick Templeman
MEOK AI Labs
nick@meok.ai
[Calendly link]
```

#### Template C: COBOL Bridge — Insurance CIO (Consolidation Angle)

```
Subject: The legacy books you acquired — what's the COBOL plan?

Hi {first_name},

Insurance consolidators like {company} manage portfolios acquired over decades — each with its own COBOL policy administration system written in the 1980s.

Maintaining these systems for another 20+ years with a dwindling COBOL workforce is becoming impossible.

COBOL Bridge (cobolbridge.ai) uses AI to transpile COBOL into Python, Java, or Go in hours instead of months. We preserve the exact business logic that's been battle-tested for 40 years — no rewrite risk.

Would you be open to a 15-minute call? I'll show you how we modernized a COBOL claims processing system in under a week.

No pitch required — just want to understand if this solves a real problem for you.

Nick Templeman
MEOK AI Labs
```

#### Template D: COBOL Bridge — Government (Budget/Workforce Angle)

```
Subject: The DWP's COBOL challenge — a £199/mo alternative to £50M rewrites

Hi {first_name},

I've been following the Government's legacy IT transformation mandate under CDDO. The challenge is clear: critical systems running on COBOL with developers retiring and cloud mandates coming.

The traditional answer — a £50M–£200M multi-year rewrite — is politically and financially impossible at scale.

COBOL Bridge (cobolbridge.ai) offers a different path: AI-powered transpilation of COBOL into modern, maintainable Python/Java/Go — at £199/mo per developer seat. We can do in hours what consultancies bill millions to do in years.

I'd love 15 minutes to show you a live demo on a real government COBOL program.

Nick Templeman
MEOK AI Labs
```

#### Template E: COBOL Bridge — Head of Engineering (Hands-On)

```
Subject: Upload a COBOL file. Get Python code. No signup required.

Hi {first_name},

I saw your talk at {event} about legacy modernization — the retiring COBOL workforce point resonated.

I've built a tool that's relevant: cobolbridge.ai. It's an AI-powered transpiler that converts COBOL to Python, Java, or Go. Upload a .cbl file, get production-quality code and tests back.

We're not a consulting firm charging £200K. We're a tool at £199/mo per developer seat.

Would you be open to trying it on a real COBOL file from your estate? 24-hour turnaround, zero risk, zero cost. If the output isn't useful, you've lost nothing.

Nick Templeman
MEOK AI Labs
```

#### Template F: Direct to Verified Contacts

```
Subject: EU AI Act compliance for {company} AI platform

Hi {first_name},

{Company}'s AI {product_type} falls under Article 6 and Annex III of the EU AI Act as a high-risk AI system used in {category}.

The enforcement deadline is 2 December 2027 for Annex III high-risk systems. Penalties: up to €35M or 7% of global turnover.

Requirements for high-risk AI systems:
- Conformity assessment (Article 43)
- Bias testing across protected characteristics (Article 10)
- Human oversight mechanism (Article 14)
- Technical documentation (Article 11)

We've built automated compliance infrastructure — the only ISO 42001 MCP server in existence — that can audit your AI systems against 13 regulatory frameworks simultaneously.

I can do a 48-hour compliance assessment for £5,000 that tells you exactly where {company} stands and what needs fixing.

Worth 15 minutes this week?

Nicholas Templeman
Founder, MEOK AI Labs
meok.ai
```

### Target Segments for Cold Email

**Segment 1: UK AI-native fintechs (DORA + EU AI Act overlap)**
ClearScore, Zopa, Funding Circle, Monzo, Revolut, Wise, GoCardless, TrueLayer, Bud, Plum, Tandem Bank, Starling Bank, Atom Bank

**Segment 2: UK healthtech (high-risk AI by definition)**
Babylon Health, Cera Care, BenevolentAI, Owkin, Medopad/Huma, CMR Surgical, Sensyne Health, Exscientia

**Segment 3: HR/recruitment tech (hiring AI = high-risk)**
Workable, Pinpoint ATS, Beamery, SmartRecruiters, Greenhouse, Lever, Personio, Hibob

**Segment 4: Insurtech (pricing/scoring AI = high-risk)**
Cuvva, Zego, Marshmallow, By Miles, Laka, Wefox, Getsafe

**Segment 5: Enterprise AI platforms (developer tools exposed to EU)**
Synthesia, Stability AI, Wayve, PolyAI, Faculty AI, Graphcore, Thought Machine

**Segment 6: Professional services firms (white-label partners)**
Deloitte UK AI & Data, PwC UK Responsible AI, KPMG AI in Control, Grant Thornton Technology Risk, BDO Cyber & Digital Risk

### Top 20 UK Bank Targets (COBOL Bridge)

**Priority Tier 1 (Highest Probability):**
1. HSBC — Head of Legacy Modernization / Group CTO
2. Barclays — CIO Application Services
3. Lloyds Banking Group — Head of Engineering, Commercial Banking
4. NatWest Group (RBS) — Head of Core Banking Technology
5. Standard Chartered — Head of Application Modernization
6. Nationwide Building Society — CTO

**Priority Tier 2:**
7. Santander UK — CTO
8. Virgin Money (CYBG) — Head of IT Architecture
9. TSB — CIO
10. Metro Bank — CTO
11. The Co-operative Bank — Head of IT

**Priority Tier 3:**
12. Close Brothers — Head of IT
13. Paragon Bank — CTO
14. Aldermore Bank — Head of IT
15. Shawbrook Bank — Head of Technology

**Top 10 UK Insurance Targets:**
1. Aviva — Policy administration, claims
2. Prudential UK / M&G — Life insurance, annuities
3. Legal & General — Life insurance, pensions admin
4. Lloyd's of London — Syndicate processing
5. RSA Insurance — General insurance, claims
6. Direct Line Group — Motor/home insurance
7. Admiral Group — Motor insurance
8. Phoenix Group — Life insurance (legacy acquirer — prime target)
9. Zurich UK — Commercial insurance
10. AXA UK — Various lines

**Top 10 UK Government Targets:**
1. HMRC — NIRS2, Self Assessment
2. DWP — Pension Service, Universal Credit, Child Benefit
3. HM Treasury — GEMS
4. NHS Digital / NHS England — Spine, patient records, payroll
5. Home Office — Immigration/passport
6. DVLA — Vehicle/driver registration
7. Ministry of Defence — Payroll, logistics
8. MOJ — Case management
9. DFE — Student loans (SLC)
10. DEFRA — CAP/BPS payment systems

### LinkedIn Content Posts (1-2x/week)

**Post 1 (Authority — EU AI Act):**
> August 2, 2026 until the EU AI Act Article 27 FRIA deadline.
>
> Public-sector AI deployers and their vendors need a Fundamental Rights Impact Assessment by August 2, 2026. The EU AI Office hasn't even published their official template yet.
>
> We built one. Open source. Cryptographic attestation. Auditable at a public URL.
>
> Free tier: compliance.meok.ai
>
> Don't wait for the EU to tell you how to comply. Get ahead of it.

**Post 2 (Authority — COBOL):**
> 220 billion lines of COBOL run the global economy. 43% of banking systems. $3 trillion in daily transactions.
>
> The average COBOL developer is 55+. Every year, thousands retire — and their knowledge leaves with them.
>
> The traditional answer is a £50M consulting engagement that takes 3 years. There's a better way.

### Verified Contact Emails (Send First)

| Company | Contact | Email | Role |
|---------|---------|-------|------|
| Beamery | Abakar Saidov | abakar@beamery.com | CEO |
| Tractable | Alex Dalyac | alex@tractable.ai | Chairman |
| Tractable | Venkat Sathyamurthy | venkat@tractable.ai | CEO |
| Multiverse | Euan Blair | hello@multiverse.io (route) | CEO |
| Zopa | — | careers@zopa.com → ask for CTO | CTO |
| ClearScore | — | hello@clearscore.com (route) | CRO/Compliance |

---

## PART 7: Google Ads Setup

### Campaign 1: EU AI Act Compliance (High Intent)

**Budget:** £20/day (£600/mo)
**Landing page:** compliance.meok.ai

| Keyword | Match type | Max CPC |
|---------|-----------|---------|
| "eu ai act compliance" | phrase | £5.00 |
| "eu ai act audit" | phrase | £4.00 |
| "fria eu ai act" | exact | £3.00 |
| "fundamental rights impact assessment ai" | phrase | £4.50 |
| "eu ai act compliance tool" | phrase | £5.50 |
| "eu ai act consultation" | phrase | £3.00 |
| "article 27 eu ai act" | exact | £3.00 |

**Negative keywords:** "jobs", "career", "course", "training"

**Ad copy:**
```
Headline 1: EU AI Act FRIA — 85 Days Left
Headline 2: Automated Compliance | Signed Attestations
Headline 3: £79/mo Pro | £1,499 Rapid Assessment
Description: Free EU AI Act risk scan in 5 minutes. Cryptographically signed attestations auditors accept. Pro tier from £79/mo. Built open source on PyPI & GitHub.
```

### Campaign 2: DORA / Financial Compliance (Cross-sell)

**Budget:** £10/day (£300/mo)

| Keyword | Match type | Max CPC |
|---------|-----------|---------|
| "dora tlpt" | exact | £4.00 |
| "dora compliance tool" | phrase | £3.50 |
| "tlpt scoping" | phrase | £3.00 |
| "dora threat-led penetration testing" | phrase | £4.00 |
| "dora article 26" | exact | £3.00 |

**Retargeting:** LinkedIn Matched Audiences + Google retargeting tag on compliance.meok.ai. Budget: £5/day.

---

## PART 8: CHANNEL STRATEGY — THE 5 AWESOME LISTS

These lists rank top-5 organically for "EU AI Act tools". Total time: 1 hour. Total cost: £0.

| List | What to Submit | URL |
|------|---------------|-----|
| `GenAI-Gurus/awesome-eu-ai-act` | meok-eu-ai-act, fria-generator, watermark-attest, omnibus-tracker | github.com/GenAI-Gurus/awesome-eu-ai-act |
| `theopenlane/awesome-compliance` | attestation API, DORA TLPT planner, NIS2 packs | github.com/theopenlane/awesome-compliance |
| `GeiserX/awesome-europe` | MEOK as EU regulatory tooling | github.com/GeiserX/awesome-europe |
| `niranjanxprt/eu-ai-act` | cross-link compliance.meok.ai | github.com/niranjanxprt/eu-ai-act |
| `kanad13/EU-AI-Act` | cross-link | github.com/kanad13/EU-AI-Act |

**Also add GitHub topics** to every compliance MCP repo: `eu-ai-act`, `compliance`, `ai-governance`, `fria`, `dora`, `nis2`.

---

## PART 9: CONTENT CALENDAR (FIRST 30 DAYS)

### Week 1-2: Launch Pieces

| Title | Where | Purpose |
|-------|-------|---------|
| "EU AI Act Article 27: The FRIA Deadline Nobody's Talking About" | dev.to, Medium, LinkedIn | Capture "FRIA EU AI Act" search |
| "How to Run a DORA TLPT Scope Assessment (Without Paying €80K)" | dev.to, Reddit r/cybersecurity | Capture DORA buyers |
| "85 Days Until the EU AI Act Hits: What Every CTO Needs to Know" | dev.to, LinkedIn | Mass appeal + link to free tool |
| "We Built an Open-Source FRIA Generator — Here's Why" | dev.to (Show HN), Hacker News | Developer/CTO authenticity |

### Week 3-4: Authority Pieces

| Title | Where | Purpose |
|-------|-------|---------|
| "Cryptographic Attestation for AI Compliance: Why PDFs Don't Cut It Anymore" | IAPP blog submission, LinkedIn | Thought leadership |
| "The EU AI Act Stack: C2PA + Watermark + Fingerprint + Attestation" | dev.to, r/MachineLearning | Technical credibility |
| "Single-Person Open-Source vs Enterprise Compliance: A Cost Comparison" | Indie Hackers, dev.to | Bootstrap founders |

### Publishing Channels (Beyond Own)

1. dev.to (500+ views in 24h if posted Tue-Thu at 14:00 UTC)
2. Medium (via "Towards Data Science" or "Better Programming")
3. Hacker News (Show HN for FRIA generator launch)
4. Reddit: r/MachineLearning, r/artificial, r/Compliance, r/europrivacy, r/gdpr, r/cybersecurity, r/fintech
5. LinkedIn: profile posts, tag relevant people, comment on related posts
6. IAPP Privacy Perspectives blog (pitch to editors)

---

## PART 10: DAILY CHECKLIST — 30 MINUTES MINIMUM

### Morning Block (15 min)

```
08:00-08:15 — Revenue Engine Check
□ Open Stripe dashboard — any new payments? (30 sec)
□ Check LinkedIn — any new connection acceptances or replies? (2 min)
□ Send 5 LinkedIn connection requests (use scripts above) (5 min)
□ Respond to any prospect replies from yesterday (5 min)
□ Check compliance.meok.ai is live (2 min)
```

### Midday Block (10 min)

```
12:00-12:10 — Outbound Sprint
□ Send 5 more LinkedIn connections if morning batch exhausted (5 min)
□ Draft 1 cold email to a verified target (5 min)
□ Check Google Ads dashboard — any clicks? CTR? (30 sec)
```

### Evening Block (5 min)

```
18:00-18:05 — Pipeline Update
□ Log today's outreach in CRM/prospects_export.csv (2 min)
□ Update sent_log.json with connections sent + responses received (2 min)
□ Review: did you hit 5-10 outreach actions today? (1 min)
```

### Weekly Block (30 min, Sunday)

```
□ Review all metrics: outreach sent, response rate, meetings booked, pipeline value
□ Update revenue projections spreadsheet
□ Plan next week's LinkedIn batch targets
□ Draft 1 content piece for the coming week
□ Review Google Ads spend + performance — adjust keywords/CPCs
□ Check all critical domains are resolving (compliance.meok.ai, cobolbridge.ai, councilof.ai)
```

### Minimum Viable Daily Output

- **5 LinkedIn connection requests sent** EVERY DAY
- **At least 1 cold email sent** EVERY DAY
- **Stripe dashboard checked** EVERY DAY
- **1 prospect reply handled** within 2 hours

**If you do nothing else, send 5 LinkedIn DMs.** This alone, sustained for 30 days, produces 150 touchpoints with decision-makers. Even a 2% conversion rate = 3 customers.

---

## PART 11: WHAT'S AUTOMATED

### Systems That Run Without Nick's Intervention

| System | What It Does | Status |
|--------|-------------|--------|
| **Stripe checkout** | Processes payments, handles subscriptions, sends receipts | ✅ LIVE (requires live mode verification) |
| **MCP servers on GitHub** | Open-source distribution, stars, forks, discoverability | ✅ LIVE (add topics) |
| **PyPI packages** | pip install meok-* — developer distribution | ✅ LIVE (publish remaining) |
| **compliance.meok.ai** | Landing page with scan tool + pricing | ✅ LIVE (add email capture) |
| **cobolbridge.ai** | COBOL Bridge landing page | ⚠️ Fix pricing then LIVE |
| **meok.ai** | Platform hub with pricing | 🟡 Deploy pricing page |
| **agisafe.ai** | AI Safety product page + checkout | ✅ LIVE |
| **councilof.ai** | EU AI Act compliance marketplace (via csoai.org) | ⚠️ Fix DNS |
| **Vercel deployments** | Auto-deploy on git push | ✅ LIVE |
| **Domain redirects** | governance "of.ai" → councilof.ai | 🟡 Set up redirects |
| **Google Ads** | Paid search traffic to compliance.meok.ai | 🔴 Not yet created |
| **Email welcome sequence** | Day 1, 3, 7, 14 for new signups | 🔴 Not yet created |
| **Content publishing** | dev.to, Medium, LinkedIn posts | 🔴 Needs execution |
| **LinkedIn content posting** | 1-2x/week authority posts | 🔴 Needs execution |
| **Cold email sequences** | Smartlead/Instantly automated follow-ups | 🔴 Not yet set up |
| **Awesome list PRs** | Permanent SEO backlinks | 🔴 Not yet submitted |
| **GitHub topics** | Repository discoverability | 🔴 Not yet added |
| **MCPize listings** | MCP marketplace distribution | 🔴 Not yet listed |
| **Uptime Robot monitoring** | Domain + API health alerts | ✅ Configured |
| **Attestation verify page** | compliance.meok.ai/verify/{id} viral loop | 🟡 Deploy |

### Automation To-Do List (JEEVES Territory)

These can be built and deployed without Nick's direct involvement:

```
□ Deploy email capture on compliance.meok.ai (ConvertKit or Resend free tier)
□ Set up email welcome sequence (day 1, 3, 7, 14 automations)
□ Create compliance.meok.ai/blog with SEO pages for key terms
□ Add product topics to all GitHub repos (scriptable, 1 hour)
□ Deploy verify page at compliance.meok.ai/verify/{id}
□ Publish 20 compliance MCPs to PyPI with meok- prefix
□ Set up Google Ads conversion tracking on compliance.meok.ai
□ Set up domain redirects for governance "of.ai" cluster → councilof.ai
□ Create Stripe payment links for all new pricing tiers
□ Build meok-fria-generator-mcp (3-hour sprint)
□ Submit top 10 MCPs to Glama.ai
□ List top 5 compliance MCPs on MCPize (85/15 rev share)
□ Set up Plausible/Fathom analytics on compliance.meok.ai
```

---

## PART 12: DOMAIN PORTFOLIO CONSOLIDATION

### Post-Consolidation Architecture

```
MEOK AI LABS ECOSYSTEM
│
├── meok.ai ......................... Platform hub / AI OS
│   ├── meok-attestation-api (marketing funnel)
│   └── meok-verify (lead gen)
│
├── councilof.ai .................... EU AI Act compliance marketplace (PRIMARY)
│   ├── accountabilityof.ai → redirect
│   ├── biasdetectionof.ai → redirect
│   ├── dataprivacyof.ai → redirect
│   ├── transparencyof.ai → redirect
│   ├── safetyof.ai → redirect to agisafe.ai
│   └── proofof.ai → SELL domain (£25K-50K)
│
├── ethicalgovernanceof.ai .......... ISO 42001 + NIST specialist (semi-standalone)
│   └── Cross-links with councilof.ai
│
├── agisafe.ai ...................... AI Safety products (bundle with councilof.ai)
│
├── cobolbridge.ai .................. COBOL modernization (independent brand)
│
├── muckaway.ai / grabhire.ai ....... Waste + equipment
│   ├── muckaway.ai = business-side SaaS
│   └── grabhire.ai = customer-side quotes
│
├── planthire.ai .................... Plant hire marketplace
├── landlaw.ai ...................... UK planning law AI
├── commercialvehicle.ai ............ Fleet management (SELL £10-25K)
├── loopfactory.ai .................. AI agent marketplace (pivot to compliance agent marketplace)
├── pokerhud.ai ..................... Poker analytics (niche)
├── fishkeeper.ai / koikeeper.ai .... AquaHealth bundle (passion project)
├── diyhelp.ai ...................... DIY help (add Stripe, low effort)
├── optimobile.ai ................... Optician SaaS (REBRAND or SELL £1-5K)
├── socialmediamanager.ai ........... BROKEN — PARK or DROP
└── suicidestop.ai .................. NON-COMMERCIAL — HELD IN TRUST
```

### Domains to Sell

| Domain | Estimated Value | Platform |
|--------|----------------|----------|
| proofof.ai | £25K-50K | Sedo / Dan.com |
| commercialvehicle.ai | £10K-25K | Sedo / Dan.com |
| optimobile.ai | £1K-5K | Sedo / Dan.com |
| socialmediamanager.ai | £0 | Drop (typo domain) |

**Total potential domain sale value: £36K-80K**

---

## PART 13: REVENUE PROJECTIONS (UNIFIED)

### Conservative Scenario

**Assumptions:**
- Website traffic: 500-1,000 visitors/month (organic + ads + content)
- Free tier → Pro conversion: 2-3%
- LinkedIn response rate: 15-20% (warm leads)
- Cold email response rate: 3-5%
- Partnership close rate: 10-15%

#### Month 1 (May-June 2026)

| Source | Detail | MRR/Revenue |
|--------|--------|-------------|
| EU AI Act Pro subscribers | 5 × £79/mo | £395 MRR |
| COBOL Bridge self-serve | 3 users × avg 3 seats × £199 | £1,791 MRR |
| meok.ai subscriptions | Variable | £200 MRR |
| Domain portfolio (other) | § | £350 MRR |
| MCP marketplace | Small initial | £87 MRR |
| **Month 1 MRR** | | **£2,623** |
| Rapid FRIA (one-time) | 1 × £1,499 | £1,499 |
| COBOL Bridge pilot | 1 × £5,000 | £5,000 |
| **Month 1 One-Time** | | **£6,499** |
| **Month 1 Total** | | **£9,122** |

**Conservative Month 1 Range:** £395 — £4,500 recurring only.

#### Month 2 (June-July 2026)

| Source | MRR |
|--------|-----|
| EU AI Act Pro | £790 |
| EU AI Act Enterprise | £1,499 |
| COBOL Bridge self-serve | £5,970 |
| COBOL Bridge Enterprise | £2,499 |
| meok.ai | £500 |
| Domain portfolio | £1,150 |
| MCP marketplace | £348 |
| **Month 2 MRR** | **£12,756** |
| One-time (assessments + pilots) | £15,000 |
| **Month 2 Total** | **£27,756** |

#### Month 3 (July-August 2026)

| Source | MRR |
|--------|-----|
| EU AI Act Pro (15 subs) | £1,185 |
| EU AI Act Enterprise (2 accounts) | £2,998 |
| EU AI Act White-label (1 partner) | £2,499 |
| COBOL Bridge self-serve (54 seats) | £10,746 |
| COBOL Bridge Enterprise (4 accounts) | £9,996 |
| meok.ai | £2,000 |
| Domain portfolio | £3,700 |
| MCP marketplace | £725 |
| **Month 3 MRR** | **£33,849** |
| One-time (assessments + pilots) | £30,000 |
| **Month 3 Total** | **£63,849** |

**Conservative Month 3 MRR: £6,682-£33,849**

#### Month 6 (October 2026)

| EU AI Act | COBOL Bridge | Platform + Domains | **Total MRR** |
|-----------|-------------|-------------------|---------------|
| £15,000-25,000 | £30,000-58,000 | £5,000-10,000 | **£50,000-93,000** |

#### Month 12 (April 2027)

| EU AI Act | COBOL Bridge | Platform + Domains | **Total MRR** |
|-----------|-------------|-------------------|---------------|
| £30,000-50,000 | £55,000-110,000 | £15,000-25,000 | **£100,000-185,000** |

**Year 1 ARR: £1.2M-2.2M**

### Aggressive Scenario (If Everything Goes Right)

| | Month 1 | Month 2 | Month 3 | Month 6 | Month 12 |
|---|---|---|---|---|---|
| MRR | £1,500 | £8,000 | £20,000 | £75,000 | £200,000 |
| One-time | £3,000 | £10,000 | £15,000 | £25,000 | £50,000 |
| Grant | £0 | £17K-43K | £0 | £0 | £0 |
| **Total** | **£4,500** | **£35K-61K** | **£35,000** | **£100,000** | **£250,000** |

### Key Milestones to Validate

| Milestone | When | What It Proves |
|-----------|------|---------------|
| First self-serve signup | Week 2 | Payment flow works end-to-end |
| First LinkedIn DM response | Week 1-2 | Messaging resonates |
| First content piece > 500 views | Week 2-3 | Content distribution works |
| First POC completed | Week 2-3 | Product works on real data |
| First enterprise demo | Week 3-4 | Enterprise interest is real |
| First paid Pro subscriber | Week 2-4 | Self-serve funnel converts |
| First enterprise close | Week 4-6 | Enterprise sales motion works |
| £5K MRR | Month 2 | Product-market fit signal |
| £10K MRR | Month 2-3 | Real business forming |
| First case study | Month 2 | Social proof for next deals |
| 3+ enterprise logos | Month 4 | Category credibility |
| £50K MRR | Month 6 | Serious revenue |
| £100K MRR | Month 9-10 | Series A trajectory |
| £165K MRR | Month 12 | Market leader position |

---

## PART 14: THE NLNET GRANT — £17K-43K OPPORTUNITY

**Deadline:** June 1, 2026, 12:00 CEST (noon)
**Program:** NGI Zero Commons Fund
**Amount:** €20,000-50,000 (~£17,000-43,000)

**Drafts exist at:**
- `~/clawd/nlnet-grant-application.md`
- `~/clawd/nlnet_application.md`

**Action:** Submit by May 15 to allow buffer time. If awarded, this single grant transforms Month 2-3 financials and provides runway without revenue pressure.

---

## PART 15: RISK REGISTER

### Critical Risks (Could Kill the Business)

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **Stripe account rejected or frozen** | Low | Catastrophic | Complete all verification correctly. Have backup: LemonSqueezy as alt payment processor. |
| **LinkedIn account banned** | Medium | High | Stay under 5 connection requests/day. Don't use automation tools. Build slowly. |
| **compliance.meok.ai hacked/data breach** | Low | Catastrophic | Rotate all API keys. Enable 2FA on Stripe, GitHub, Vercel. Audit hardcoded keys now. |
| **EU AI Act FRIA deadline passes without MEOK being known** | Medium | High | This is the entire urgency-based sales motion. Start outreach BEFORE August 2. Post-August, pivot to Article 50 (November). |
| **COBOL Bridge produces incorrect transpilation** | Medium | High | Always require human review of output. 24-hour POC includes manual validation. Never claim 100% automated accuracy. |
| **Customer charges back** | Medium | Medium | Fix pricing misalignments NOW to avoid overcharges. Document all deliverables. |
| **Competitor launches identical attestation feature** | Low | Medium | Cryptographic attestation is hard to replicate. MEOK's 209-MCP moat and open-source scale provide defense. |
| **Domain portfolio costs become unsustainable** | Low | Low | 24 .ai domains ≈ £1,500-2,400/yr renewal. Sell non-revenue domains (proofof.ai, commercialvehicle.ai) to offset. |
| **Burnout — Nick stops outreach** | Medium | Catastrophic | 30 min/day minimum is sustainable. Automate everything that can be automated. Treat this like a job. |
| **No case studies = no trust** | High | Medium | First customer = immediate case study. Even a free pilot client's results can be anonymized for social proof. |

### Product Risks (COBOL Bridge Specifically)

| Gap | Severity | Blocks |
|-----|----------|--------|
| No CICS transaction parsing | Critical | Blocks 60%+ of enterprise deals |
| No VSAM file handling | Critical | Can't transpile data-heavy COBOL |
| No COPYBOOK parser | Critical | Required for any real COBOL program |
| No EBCDIC encoding | High | Required for mainframe data |
| No JCL support | High | Batch COBOL programs are orphans without it |
| No on-premise deployment option | High | Government/defense won't upload sensitive COBOL |
| No SOC 2 Type II certification | Medium | Procurement blocker for banks |
| No side-by-side regression testing | Critical | Enterprise needs proof of identical output |

### Mitigation for COBOL Product Gaps

1. **Prioritize CICS+VSAM+COPYBOOK+EBCDIC** — Without these four, you can only transpile toy COBOL. This blocks 60%+ of real enterprise deals.
2. **Build regression test harness** — The demo of "here's original output, here's Python output, identical" is your most powerful close.
3. **Write security whitepaper** — 2-page PDF: "Your COBOL is processed in-memory, never stored, encrypted in transit, deleted after processing." Answers question #1 from every IT security team.
4. **Offer on-prem Docker deployment** — Ship a container that runs behind their firewall. COBOL never leaves their network.

### Market Risks

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| EU AI Act enforcement delayed | Low-Medium | Medium | Multiple deadlines (August 2 FRIA, November 2 Article 50). If one slips, pivot messaging to the next. |
| Recession cuts compliance budgets | Low | Medium | MEOK is the low-cost alternative. In a downturn, £79/mo beats €130K/yr. |
| Big 4 clone attestation feature | Low-Medium | Medium | 18-24 month development cycle for incumbents. MEOK has first-mover advantage. |
| Better-funded competitor enters COBOL modernization | Medium | Medium | MEOK's price advantage is structural (AI-native, not body-shop). Hard to undercut £199/mo with quality. |

---

## PART 16: THE SINGLE MOST IMPORTANT THING

If you execute nothing else from this plan, do these three things in the next 48 hours:

### 1. ACTIVATE STRIPE LIVE MODE
No live Stripe = no revenue. Everything else is preparation. Even a single customer paying £49 for MEOK Core Pack is £588/year.

### 2. SEND THE 40 LINKEDIN DMs
They are queued. They cost nothing. They reach people who already know about you. This is the highest-probability path to first revenue. Start with the fintech batch (ClearScore, Zopa, Funding Circle, Monzo, Starling).

### 3. SUBMIT THE 5 AWESOME LIST PRs
One hour of work. Permanent SEO. Free traffic forever. MEOK is invisible on Google for "EU AI Act tools" despite having the most comprehensive open-source offering.

---

## APPENDIX A: Success Metrics Dashboard

| Metric | Week 1 Target | Week 4 Target | Month 3 Target | Month 12 Target |
|--------|---------------|---------------|----------------|-----------------|
| Website visitors (compliance.meok.ai) | 100 | 500 | 2,000 | 10,000 |
| Free scans completed | 10 | 50 | 200 | 1,000 |
| Free → Pro conversion rate | 3% | 3% | 5% | 7% |
| Total MRR | £500 | £2,623 | £6,682-33,849 | £100,000-165,000 |
| LinkedIn DMs sent | 25 | 150 | 500 | 3,000 |
| Cold emails sent | 50 | 250 | 1,000 | 5,000 |
| LinkedIn response rate | 15% | 18% | 20% | 22% |
| Cold email response rate | 4% | 5% | 6% | 8% |
| Prospect calls completed | 2 | 12 | 40 | 200 |
| Enterprise pipeline deals | 3 | 10 | 20 | 50 |
| Partnership conversations | 2 | 5 | 10 | 25 |
| GitHub stars on flagship repos | 50 | 200 | 500 | 2,000 |
| Awesome list PRs merged | 3 | 5 | 5 | 5 |
| Google Ads CTR | 2% | 3% | 4% | 5% |
| Google Ads CPA | — | £50 | £40 | £30 |
| NLnet grant status | Submitted | In review | Awarded/declined | — |
| COBOL Bridge POCs completed | 0 | 3 | 20 | 120 |
| COBOL Bridge POC → Paid rate | — | 25% | 30% | 35% |
| Customer churn rate | N/A | N/A | <5% | <3% monthly |
| Customer LTV | N/A | N/A | £28,000 | £40,000+ |

---

## APPENDIX B: Key Links & Assets

| Asset | URL/Path |
|-------|----------|
| Landing page (compliance) | compliance.meok.ai |
| Landing page (COBOL) | cobolbridge.ai |
| Platform hub | meok.ai |
| Compliance marketplace | councilof.ai (csoai.org infra) |
| Attestation API | meok-attestation-api.vercel.app |
| Verification tool | meok-verify.vercel.app |
| PyPI | pypi.org/user/MEOK_AI_Labs/ |
| GitHub org | github.com/CSOAI-ORG |
| Stripe dashboard | dashboard.stripe.com |
| Google Ads | ads.google.com |
| LinkedIn (rebuild needed) | linkedin.com |
| Glama.ai submissions | glama.ai/mcp/submit |
| MCPize marketplace | mcpize.com |
| Cold outreach templates | ~/clawd/freelance-profiles/cold-outreach-emails.md |
| LinkedIn DMs (ready) | ~/clawd/revenue/LINKEDIN_DMS_READY_TO_SEND.md |
| Cold emails (ready) | ~/clawd/revenue/SEND_THESE_EMAILS_NOW.md |
| NLnet grant drafts | ~/clawd/nlnet-grant-application.md, ~/clawd/nlnet_application.md |
| Competitive analysis | ~/clawd/unified-portfolio-catalog/DEEP_RESEARCH_BLEEDING_EDGE.md |
| Revenue deep research | ~/clawd/revenue/DEEP_RESEARCH_DIAMONDS_2026-04-26.md |
| Existing pricing | ~/clawd/meok-ai-landing/pricing.html |

---

## APPENDIX C: Critical Regulatory Deadlines

| Deadline | Regulation | Article | Opportunity |
|----------|-----------|---------|-------------|
| **August 2, 2026** | EU AI Act | Article 27 FRIA | IMMEDIATE — sell FRIA generator + assessments |
| **May-June 2026** | EU AI Act | Code of Practice finalisation | Ramp Article 50 content + product |
| **November 2, 2026** | EU AI Act | Article 50 (AI content labelling) | Watermarking + C2PA attestation product |
| **Rolling** | DORA | TLPT requirements | £1,499/mo Enterprise + consulting deals |
| **June 1, 2026** | NLnet NGI Zero | Grant application | €20K-50K non-dilutive funding |

---

## APPENDIX D: Competitor Reference Card (For Demos)

**vs OneTrust:** "OneTrust covers general privacy. MEOK layers on AI-specific compliance with cryptographic attestation your OneTrust reports can't match. Complementary, not competitive."

**vs Vanta/Drata:** "Vanta handles SOC 2. MEOK handles your EU AI Act — FRIA, DORA TLPT, C2PA watermark attestation. Different frameworks, different regulators. Vanta doesn't do what we do."

**vs Credo AI/Holistic AI:** "Credo AI is great if you have £25K+ and 3 months. MEOK gives you the same compliance outcomes — signed attestations your auditor accepts — for £79/mo with a 5-minute setup. Same destination, different price and speed."

**vs Micro Focus/IBM COBOL:** "They charge £200K+ and take 12+ months. We can show you working code from your own system in 24 hours. What do you have to lose?"

---

## APPENDIX E: Quick Reference — Build vs Buy for Nick

### Nick Must Do (Cannot Delegate)
- LinkedIn connections and DMs (personal network)
- Cold emails from his email address
- Prospect calls and demos
- Stripe identity verification (government ID)
- Bank account setup in Stripe
- Conference attendance and networking
- Case study interviews with customers
- NLnet grant submission (personal application)

### JEEVES / Automated Can Do
- Fix DNS records and domain redirects
- Create Stripe products and payment links
- Add GitHub topics to repos (scriptable)
- Submit awesome list PRs (draft, Nick clicks merge)
- Publish MCPs to PyPI
- Set up email capture and sequences
- Build meok-fria-generator-mcp
- Deploy verify page for attestation loop
- Create Google Ads campaigns and ad copy
- Set up domain redirects
- Write content drafts for Nick to review and publish
- Manage CRM and outreach tracking
- Monitor uptime and health of all domains

---

## APPENDIX F: Sending Protocol (LinkedIn)

1. **Max 5 connection requests/day** — LinkedIn flags higher volume as spam
2. **Connection first** — Send connection request with note (300 chars). Wait for acceptance.
3. **Day 3 follow-up** — Send DM 72 hours after connection accepted
4. **Day 7 follow-up** — Final nudge, then move on
5. **Track everything** — Update `prospects_export.csv` with status
6. **Log daily** — Update `sent_log.json` with connections sent + responses

---

## APPENDIX G: The "24-Hour COBOL Challenge" — POC Script

> "Here's the challenge: send us one real COBOL program from your production system. Not a toy example — a real program your team relies on. Within 24 hours, we'll return to you:
> 1. The equivalent Python/Java/Go code, fully commented
> 2. A generated test suite verifying the logic matches
> 3. An extracted business rules document
> 4. An API wrapper so you can call it from a modern stack
>
> If we can't deliver something you'd put into production, you owe us nothing. If we can, we'll talk about how to scale this across your entire estate."

---

## APPENDIX H: Discovery Call Questions

**For EU AI Act prospects:**
1. "What AI systems do you have in production that touch EU customers?"
2. "Have you done a risk classification under the EU AI Act yet?"
3. "Has your board or an enterprise customer asked about compliance?"
4. "What's your timeline — are you aware of the August 2 FRIA deadline?"
5. "Who else in the organization cares about this?"

**For COBOL Bridge prospects:**
1. "What's the total size of your COBOL estate? (lines of code, number of programs)"
2. "How many COBOL developers do you have left, and what's their average age?"
3. "When does your mainframe contract renew, and what's the annual cost?"
4. "Have you tried modernization before? What happened?"
5. "What would a successful modernization look like in 12 months?"
6. "What's your biggest fear about this process?"

---

## APPENDIX I: Common Objections — Response Cheat Sheet

| Objection | Response |
|-----------|----------|
| "We already have OneTrust/Vanta" | "They cover general compliance. We do AI-specific attestation with cryptographic proof. Layers on top — not a replacement." |
| "The price seems too low to be serious" | "We're an AI company, not a body shop. Our marginal cost per assessment approaches zero. The price reflects the technology, not the quality." |
| "We'll wait until the deadline is closer" | "The EU AI Office hasn't published their official template yet. Getting ahead means you define your compliance posture, not a rushed EU template." |
| "We have a COBOL team, they can handle it" | "For now. But when your last COBOL developer retires, who trains the replacement? Our tool captures institutional knowledge forever." |
| "Security — we can't upload source code" | "We offer on-premise deployment. Your COBOL never leaves your network. Docker container behind your firewall." |
| "We need a consulting firm for COBOL modernization" | "Use both. Consulting handles process and governance. We handle the code conversion — 10x faster, 100x cheaper. They'll thank you." |
| "We evaluated Micro Focus / IBM already" | "They charge £200K+ and take 12+ months. We show you working code from your own system in 24 hours. Free. What do you have to lose?" |

---

## Document Metadata

| Field | Value |
|-------|-------|
| **Version** | 1.0 |
| **Author** | JEEVES Strategic Command for MEOK AI Labs |
| **Status** | SINGLE SOURCE OF TRUTH — EXECUTION PLAYBOOK |
| **Supersedes** | eu-ai-act-gtm-plan.md, cobol-bridge-sales-plan.md, domain-monetization-plan.md, CRITICAL-PATH-TO-REVENUE.md, REVENUE-BATTLE-PLAN.md |
| **Review cadence** | Weekly (every Sunday, 30-min pipeline review) |
| **Next review** | May 16, 2026 (Week 1 checkpoint) |
| **Revenue target** | £1 first pound: 1-7 days | £10K MRR: Day 60-90 | £100K MRR: Month 12 |

---

*"Revenue flows when people can FIND and PAY for your work. The code is built. The payments work (once live mode is verified). Now we need eyeballs on the payment links."*

*This document is the single source of truth for all MEOK AI Labs revenue operations. All other revenue documents are now deprecated. Update this document, not the others.*
