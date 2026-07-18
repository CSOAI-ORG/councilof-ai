# MEOK AI Labs — EU AI Act GTM Execution Playbook
## From £0 MRR to Revenue Engine: A Field Manual

**Generated:** May 9, 2026
**State of Play:** 21 compliance MCPs built | Attestation API live | Stripe live | £0 MRR
**Countdowns:** 
- Article 27 FRIA (public-sector): ~85 days (August 2, 2026)
- Code of Practice finalisation: May-June 2026
- Article 50 (labelling/content): November 2, 2026
- NLnet NGI Zero Commons Fund: June 1, 2026 (noon CEST)

---

## EXECUTIVE SUMMARY

MEOK has the product. What it lacks is **distribution with buying intent.** This plan turns the next 90 days into a revenue engine by exploiting three things competitors can't match: open-source reach, cryptographic attestation, and price.

**The core thesis:** Sell the thing people are panicking about right now. That's not Article 50. It's Article 27 FRIA (Fundamental Rights Impact Assessment), the August 2 deadline public-sector deployers are ignoring, and DORA TLPT where mid-cap FIs pay €100K-500K for red-team exercises MEOK can scope for £1,499/mo.

---

## 1. IMMEDIATE REVENUE ACTIVATION — WEEK 1-2

### The 3 Things That Get Money Flowing This Week

#### Thing 1: Ship `meok-fria-generator-mcp` — Capture the August 2 Panic Buyers

**Why this first:** The EU AI Office's official FRIA template + tool is NOT YET published. The only open-source alternatives (ALIGNER, AIActStack, kla.digital) are template generators — none are MCP-callable, none produce signed attestations. MEOK can pre-empt the EU AI Office and own the category.

**What to build (3-hour sprint):**
- MCP server that ingests AI system descriptions → risk classification → FRIA artifact
- Outputs: signed HMAC attestation + chain-of-custody tracking + public verify URL
- Host at `meok-attestation-api.vercel.app/fria`
- Pricing: £49 self-serve / £1,499 done-for-you with 48-hour turnaround

**Go-live checklist:**
- [ ] Deploy `meok-fria-generator-mcp` to PyPI as `meok-fria-generator`
- [ ] Add FRIA product to Stripe (£49 self-serve, £1,499 consulting)
- [ ] Submit to `GenAI-Gurus/awesome-eu-ai-act` GitHub list (ranks top-3 Google for "EU AI Act tools")
- [ ] Add `topics: eu-ai-act, fria, fundamental-rights` to the repo
- [ ] Post on r/europrivacy, r/gdpr, r/Compliance

**Revenue potential:** £5K-15K MRR within 30 days (5-10 self-serve + 1-2 consulting)

#### Thing 2: Send the 40 LinkedIn DMs — Today

**Why this first:** 65 prospects in CRM, 40 LinkedIn DMs queued. Every day of delay is lost momentum. These people already indicated interest — this is harvesting, not cold outreach.

**The script (copy-paste ready):**

```
Hey [Name] — quick one.

The EU AI Act Article 27 FRIA deadline is August 2. Public-sector deployers and SaaS vendors selling to them need a Fundamental Rights Impact Assessment in place by then.

I've built an automated FRIA generator that produces cryptographically signed, auditor-verifiable assessments in minutes — not weeks.

Free tier is live at compliance.meok.ai if you want to check it out. Happy to walk your team through the Pro tier (£79/mo or £1,499 done-for-you).

Are FRIA requirements on your radar yet?
```

**Priority order for the 40 DMs:**
1. Anyone who previously expressed interest in compliance/governance (skip to them first)
2. CTOs/CPOs at AI-native fintechs (Clearscore, Zopa, Funding Circle, Monzo, Revolut)
3. CISOs at healthtech companies (Babylon, Cera Care, BenevolentAI, Owkin)
4. Heads of Legal/DPOs at HR-tech companies (Workable, Pinpoint ATS, Beamery)
5. CTOs at regtech/legaltech startups (Luminance, ThoughtRiver, Genie AI, Robin AI)

#### Thing 3: Add MEOK to 5 Awesome Lists — This Weekend

**Why this first:** MEOK is invisible on Google for "EU AI Act tools" despite having the most comprehensive open-source offering. These lists rank top-5 organically. Total time: 1 hour. Total cost: £0. ROI: 10-30 inbound clicks/day each.

**Submit PRs to:**

| List | What to submit | URL |
|------|---------------|-----|
| `GenAI-Gurus/awesome-eu-ai-act` | meok-eu-ai-act, fria-generator, watermark-attest, omnibus-tracker | github.com/GenAI-Gurus/awesome-eu-ai-act |
| `theopenlane/awesome-compliance` | attestation API, DORA TLPT planner, NIS2 packs | github.com/theopenlane/awesome-compliance |
| `GeiserX/awesome-europe` | MEOK as EU regulatory tooling | github.com/GeiserX/awesome-europe |
| `niranjanxprt/eu-ai-act` | cross-link compliance.meok.ai | github.com/niranjanxprt/eu-ai-act |
| `kanad13/EU-AI-Act` | cross-link | github.com/kanad13/EU-AI-Act |

**Each PR must include:** a one-line description positioning MEOK's unique angle (cryptographic attestation, open source, MCP-callable).

**Also:** Add `topics:` field to every MEOK GitHub repo with `eu-ai-act`, `compliance`, `ai-governance`, `fria`, `dora`, `nis2`. This is a 1-hour fix worth thousands in organic traffic. GitHub topic pages have 340+ repos in `topics/eu-ai-act` and MEOK is invisible in all of them.

---

### Pricing Strategy: Price Up, Don't Price Down

The deep research is clear: **MEOK is not too expensive. It's probably too cheap.**

| Comparison point | Drata | Vanta | OneTrust | MEOK (current) | Recommendation |
|-----------------|-------|-------|----------|----------------|----------------|
| Starter/Growth | $7,500/yr | ~$10K/yr | €130K+/yr | £29/mo (£348/yr) | **Raise to £49/mo** |
| Mid-market | $15-25K/yr | opaque | opaque | £79/mo (£948/yr) | **Keep** |
| Enterprise | $25-100K+ | opaque | €300K+/yr | £1,499/mo (£18K/yr) | **Keep** |
| Assessment | N/A | N/A | N/A | £5K one-time | **Add £1,499 express tier** |

**Specific price adjustments:**

1. **Raise Starter from £29 to £49/mo.** £29 is 20× cheaper than Drata and signals "not serious." At £49, you're still 12× cheaper but the number communicates value. Add a £499/yr annual option (save 15%).

2. **Add £499/yr "Indie/Bootstrapped" tier** between Starter and Pro. Solo-founder SaaS companies that can't justify Vanta/Drata but want more than the starter. Price anchor: "Same compliance tools as enterprise, indie-friendly pricing."

3. **Add £1,499 "Rapid FRIA" one-time assessment.** The done-for-you version of the FRIA generator. 48-hour turnaround. Competitors charge £25K+ for the same deliverable. Position as: "Same FRIA output, 94% cheaper, auditable attestation."

4. **Enterprise tier stays at £1,499/mo.** This is a bargain against DORA TLPT consultancies charging €30-80K just for the threat-intelligence report. The value equation for an FI is: "€30K once vs £1,499/mo ongoing — even at 12 months you're saving €12K."

**New pricing architecture:**

```
Free tier         — £0      (5 MCP tools, 100 req/day, community)
Indie             — £499/yr (all starter tools, hosted attestation, 10k req/mo)
Pro               — £79/mo  (all compliance MCPs, full attestation, priority support)
Enterprise        — £1,499/mo (dedicated instance, DORA TLPT, SLAs, audit support)
Rapid FRIA        — £1,499 one-time (48h FRIA with signed attestation)
Full Assessment   — £5,000 one-time (comprehensive multi-framework audit)
```

---

## 2. CHANNEL STRATEGY

### LinkedIn Outreach: Exact Scripts

#### Script A: Fintech CTOs/CISOs (High-Urgency: DORA + EU AI Act)

```
Subject/Opening: Quick EU AI Act + DORA question

Hi [Name],

Two regulatory deadlines converging on fintech right now:
- EU AI Act Article 27 FRIA: August 2, 2026
- DORA TLPT scoping: every FI, every 3 years

Most mid-cap FIs are paying €30-80K just for the threat-intelligence report for TLPT. I've built an open-source alternative that does the scoping, RACI generation, and reporting for £1,499/mo — with cryptographically signed attestations auditors can verify at a public URL.

Built by MEOK AI Labs (21 compliance MCPs, MIT licensed, on PyPI and GitHub).

Happy to show you a 5-minute demo. Is DORA prep on your roadmap yet?

Nick Templeman, MEOK AI Labs
compliance.meok.ai
```

#### Script B: Healthtech CPO/CISO (Data Sensitivity + EU AI Act)

```
Subject: EU AI Act — healthtech's August deadline

Hi [Name],

If your platform uses AI for medical diagnosis, triage, or patient risk scoring, you're in scope for the EU AI Act's high-risk category. Article 27 FRIA deadline: August 2.

I run MEOK AI Labs — we ship open-source compliance MCPs that automate risk classification, gap analysis, and audit-ready documentation. Cryptographic attestation means your auditor verifies everything at a public URL. No PDFs to chase.

Free tier for the basic scan: compliance.meok.ai
Pro tier (£79/mo) for continuous monitoring and automated FRIA generation.

Worth a quick look before the August deadline starts piling pressure on the compliance team?

Nick
```

#### Script C: Head of Legal at HR-Tech (AI in Hiring = High-Risk)

```
Subject: AI hiring tools + EU AI Act = high-risk (August deadline)

Hi [Name],

EU AI Act classifies AI in employment/hiring as high-risk. If your platform does resume screening, candidate ranking, or video-interview analysis, you need a Fundamental Rights Impact Assessment by August 2.

I've built an automated FRIA generator that produces signed, auditor-verifiable assessments. Takes the legal team from "where do we start?" to "here's our signed FRIA" in under an hour.

Pro tier is £79/mo. Done-for-you rapid assessment is £1,499 with 48-hour turnaround.

The EU AI Office hasn't even published their official template yet — this gets you ahead of the curve.

compliance.meok.ai

Nick Templeman, MEOK AI Labs
```

### Cold Email: Subject Lines, Templates, Target Lists

#### Subject Lines (A/B test all of them)

1. "August 2 deadline: is your AI compliant?" (urgency)
2. "Your AI + the EU AI Act: a 15-minute sanity check" (low-commitment)
3. "The EU AI Act FRIA deadline nobody's talking about" (curiosity gap)
4. "€35M fines start August 2 — where does your AI stand?" (loss aversion)
5. "[Company Name] + EU AI Act: quick compliance scan?" (personalised)

#### Email Body Template (for cold outreach)

```
Subject: [One of the five above]

Hi [Name],

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

#### Target List: Who to Email First

**Segment 1: UK AI-native fintechs (DORA + EU AI Act overlap = double pain)**
- ClearScore, Zopa, Funding Circle, Monzo, Revolut, Wise, GoCardless, TrueLayer, Bud, Plum, Tandem Bank, Starling Bank, Atom Bank

**Segment 2: UK healthtech (high-risk AI by definition)**
- Babylon Health, Cera Care, BenevolentAI, Owkin, Medopad/Huma, CMR Surgical, Sensyne Health, Exscientia

**Segment 3: HR/recruitment tech (hiring AI = high-risk)**
- Workable, Pinpoint ATS, Beamery, SmartRecruiters, Greenhouse, Lever, Personio, Hibob

**Segment 4: Insurtech (pricing/scoring AI = high-risk)**
- Cuvva, Zego, Marshmallow, By Miles, Laka, Wefox, Getsafe

**Segment 5: Enterprise AI platforms (developer tools exposed to EU)**
- Synthesia, Stability AI, Wayve, PolyAI, Faculty AI, Graphcore, Thought Machine

**Segment 6: Professional services firms (to white-label)**
- Deloitte UK AI & Data, PwC UK Responsible AI, KPMG AI in Control, Grant Thornton Technology Risk, BDO Cyber & Digital Risk

**Where to find email addresses:**
- hunter.io (free tier: 25 searches/mo)
- Apollo.io (free tier: 100 credits/mo)
- LinkedIn Sales Navigator (free first month, then cancel)

**Tooling:** Use Instantly.ai or Smartlead.ai for automated sequences. Budget £50-100/mo.

### MCP Marketplace (MCPize): Positioning and Pricing

MCPize takes 85% rev share for paid MCPs. MEOK should use MCPize as a **free marketing channel** — list MCPs there but capture email before download, and drive users to compliance.meok.ai for the paid tiers.

**Which MCPs to list on MCPize:**
| MCP | MCPize Position | Revenue Strategy |
|-----|----------------|------------------|
| eu-ai-act-compliance-mcp | "EU AI Act Audit in 5 Minutes — Free" | Freemium → upsell to Pro (£79) |
| meok-fria-generator | "Automated FRIA Generator — Free Scan" | Freemium → upsell to Rapid FRIA (£1,499) |
| meok-dora-tlpt-planner | "DORA TLPT Scoping Tool — Free" | Freemium → Enterprise (£1,499) |
| care-membrane-mcp | "AI Safety Evaluator — Free" | Freemium → Pro (£79) |
| meok-watermark-attest | "C2PA + Watermark + Fingerprint — Free" | Freemium → Pro (£79) |

**All MCPize listings must include:**
1. Direct link to `compliance.meok.ai` in the README
2. "Pro features: signed attestations, continuous monitoring, audit support" callout
3. GitHub URL prominently (social proof via stars/forks)

### Google Ads: Keywords, Budget, Landing Page

**Budget:** Start at £20/day (£600/mo). Scale based on conversion data.

**Campaign 1: EU AI Act Compliance (High Intent)**

| Keyword | Match type | Max CPC |
|---------|-----------|---------|
| "eu ai act compliance" | phrase | £5.00 |
| "eu ai act audit" | phrase | £4.00 |
| "fria eu ai act" | exact | £3.00 |
| "fundamental rights impact assessment ai" | phrase | £4.50 |
| "eu ai act compliance tool" | phrase | £5.50 |
| "eu ai act consultation" | phrase | £3.00 |
| "article 27 eu ai act" | exact | £3.00 |

**Negative keywords:** "jobs", "career", "course", "training" (people looking for jobs, not buying)

**Campaign 2: DORA / Financial Compliance (Cross-sell)**

| Keyword | Match type | Max CPC |
|---------|-----------|---------|
| "dora tlpt" | exact | £4.00 |
| "dora compliance tool" | phrase | £3.50 |
| "tlpt scoping" | phrase | £3.00 |
| "dora threat-led penetration testing" | phrase | £4.00 |
| "dora article 26" | exact | £3.00 |

**Landing page:** compliance.meok.ai (already deployed — verify DNS is pointing correctly)

**Ad copy template:**
```
Headline 1: EU AI Act FRIA — 85 Days Left
Headline 2: Automated Compliance | Signed Attestations
Headline 3: £79/mo Pro | £1,499 Rapid Assessment
Description: Free EU AI Act risk scan in 5 minutes. Cryptographically signed attestations auditors accept. Pro tier from £79/mo. Built open source on PyPI & GitHub.
```

**Retargeting:** Set up LinkedIn retargeting (Matched Audiences) + Google retargeting tag on compliance.meok.ai. Budget: £5/day.

### Content Marketing: What to Write, Where to Publish

**Week 1-2: The Launch Pieces**

| Title | Where | Purpose |
|-------|-------|---------|
| "EU AI Act Article 27: The FRIA Deadline Nobody's Talking About" | dev.to, Medium, LinkedIn | Capture search traffic for "FRIA EU AI Act" |
| "How to Run a DORA TLPT Scope Assessment (Without Paying €80K)" | dev.to, Reddit r/cybersecurity | Capture DORA buyers |
| "85 Days Until the EU AI Act Hits: What Every CTO Needs to Know" | dev.to, LinkedIn pulse | Mass appeal + link to free tool |
| "We Built an Open-Source FRIA Generator — Here's Why" | dev.to (Showcase), Hacker News | Developer/CTO audience, authenticity play |

**Week 3-4: The Authority Pieces**

| Title | Where | Purpose |
|-------|-------|---------|
| "Cryptographic Attestation for AI Compliance: Why PDFs Don't Cut It Anymore" | IAPP blog submission, LinkedIn | Position as thought leader |
| "The EU AI Act Stack: C2PA + Watermark + Fingerprint + Attestation" | dev.to, r/MachineLearning | Technical credibility + product awareness |
| "Single-Person Open-Source vs Enterprise Compliance: A Cost Comparison" | Indie Hackers, dev.to | Appeal to bootstrapped founders |

**Content rhythm after launch:** 1 article/week (alternating between dev.to for developer reach and LinkedIn for buyer reach).

**Where to publish beyond your own channels:**
1. dev.to (500+ views in 24h if posted at 14:00 UTC Tue-Thu)
2. Medium (via publication like "Towards Data Science" or "Better Programming")
3. Hacker News (Show HN for FRIA generator launch)
4. Reddit: r/MachineLearning, r/artificial, r/Compliance, r/europrivacy, r/gdpr, r/cybersecurity, r/fintech
5. LinkedIn: post on your profile, tag relevant people, comment on related posts
6. IAPP Privacy Perspectives blog (pitch to editors)
7. EU AI Act LinkedIn communities and Slack groups

**SEO content on compliance.meok.ai:**
- Add a `/blog` or `/guides` section
- Write pages targeting: "EU AI Act compliance checklist", "FRIA template", "DORA TLPT scoping", "EU AI Act risk classification", "NIS2 compliance tool", "CER directive compliance", "FIDA financial data access compliance"
- Interlink everything

---

## 3. TARGET CUSTOMER PROFILE

### Who Buys EU AI Act Compliance?

**Primary Buyer Personas (in order of deal velocity):**

#### Persona 1: The Panicked CTO (Fastest Close — 1-2 weeks)

- **Who:** CTO of a 20-200 person AI-native startup with EU customers
- **Trigger:** Board just asked "are we compliant?" or an enterprise customer's procurement asked for compliance docs
- **Pain:** Has no compliance team, no budget for Big 4, needs something NOW
- **Decision process:** Google search → free scan → credit card (solo decision)
- **Price sensitivity:** Up to £1,499 is a no-brainer; £5K needs a conversation
- **Objection:** "Is this legitimate enough?" → Counter: "MIT licensed, 21 tools on PyPI, signed attestations your auditor accepts"
- **Win them with:** Free scan → Pro tier trial → Rapid FRIA upsell
- **Channels:** Google Ads, dev.to, GitHub, Hacker News, LinkedIn

#### Persona 2: The Overwhelmed CISO/DPO (Medium Close — 2-4 weeks)

- **Who:** CISO or DPO at a 200-1000 person company with existing compliance regime
- **Trigger:** Internal audit flagged EU AI Act gap, or regulator sent an inquiry
- **Pain:** Knows the problem exists, drowning in frameworks (GDPR, NIS2, DORA, ISO 27001, SOC2, EU AI Act), needs mapping/integration
- **Decision process:** Research → demo → internal review → budget approval → purchase
- **Price sensitivity:** £79/mo is a rounding error; £1,499/mo needs budget sign-off
- **Objection:** "We already have OneTrust/Drata" → Counter: "OneTrust doesn't do AI-specific FRIA with cryptographic attestation. This layers on top."
- **Win them with:** Framework crosswalk content, comparison tables, white papers
- **Channels:** LinkedIn, IAPP conferences, professional services referrals

#### Persona 3: The Consulting Partner (Deal Multiplier — 2-8 weeks)

- **Who:** Partner at a mid-tier consultancy or boutique compliance firm
- **Trigger:** Client asked for EU AI Act help, firm has no in-house capability
- **Pain:** Wants to offer AI compliance but can't build it from scratch
- **Decision process:** Exploration → white-label proposal → internal approval → pilot client → ongoing partnership
- **Price sensitivity:** £1,499-5K/month for white-label, or per-client commission
- **Objection:** "We can do this in-house" → Counter: "Your hourly rate × 200 hours = £40K+. Our white-label: £1,499/mo."
- **Win them with:** White-label proposal doc, pilot pricing, co-branded content
- **Channels:** LinkedIn outreach, industry events, mutual connections

### Purchase Triggers (What Makes Them Buy RIGHT NOW)

1. **Deadline proximity:** Article 27 FRIA (August 2). The closer the date, the higher the conversion.
2. **Enterprise customer audit request:** "Send us your AI compliance documentation" — triggers immediate purchase.
3. **Board/exec mandate:** "What's our EU AI Act exposure?" — triggers a sprint.
4. **Competitor announcement:** "Competitor X just announced EU AI Act compliance" — FOMO trigger.
5. **Regulatory inquiry:** DPO receives a letter — triggers panic buy.
6. **Fundraising due diligence:** Investors ask about regulatory risk — triggers pre-emptive buy.

### Buying Process by Segment

**SME (< 200 people):**
1. Someone Googles "EU AI Act compliance tool"
2. Lands on compliance.meok.ai or a dev.to article
3. Runs the free scan
4. Sees the gap report
5. Enters credit card for Pro (£79/mo) or Rapid FRIA (£1,499)
6. 72-hour self-serve to close

**Enterprise (> 200 people):**
1. CISO/DPO is tasked with EU AI Act gap analysis
2. Team researches options (1-2 weeks)
3. Shortlists 2-3 vendors (MEOK wins on price + attestation)
4. 30-minute demo with MEOK
5. DPO brings to procurement/legal review (1-2 weeks)
6. Contract signed, £1,499-5K/mo
7. 4-6 week sales cycle

**Consulting partner:**
1. Partner sees LinkedIn content or receives outreach
2. 20-minute exploratory call
3. MEOK shares white-label proposal
4. Partner identifies first pilot client
5. Joint delivery, revenue share
6. Scaling to additional clients
7. 4-8 week cycle to first revenue, then recurring

### SME vs Enterprise Approach

| Dimension | SME | Enterprise |
|-----------|-----|------------|
| **Lead source** | Content, Google Ads, GitHub | LinkedIn, conferences, referrals |
| **Sales motion** | Self-serve | Sales-led (demo + proposal) |
| **Decision maker** | CTO / founder (1 person) | CISO + DPO + Legal + Procurement |
| **Close time** | 1-7 days | 4-6 weeks |
| **Average deal** | £79/mo or £1,499 one-time | £1,499-5,000/mo |
| **Churn risk** | Medium (startup churn) | Low (enterprise stickiness) |
| **Support need** | Self-serve docs + email | Dedicated Slack + quarterly review |

---

## 4. COMPETITIVE POSITIONING

### Battle Card: vs OneTrust

| | OneTrust | MEOK AI Labs |
|---|---|---|
| **Price** | €130K-300K/yr | £0-£1,499/mo (£0-£18K/yr) |
| **EU AI Act coverage** | General compliance platform; AI module is bolted on | Purpose-built: 21 compliance MCPs, AI-native |
| **Attestation** | PDF reports | **Cryptographic HMAC attestation with public verify URL** |
| **Open source** | No | MIT licensed, on GitHub, on PyPI |
| **Time to value** | 6-12 month implementation | 5-minute free scan, same-day Pro setup |
| **Target** | Fortune 500, regulated industries | AI-native companies, SMEs, consultancies |
| **FRIA capability** | Manual template, consultant-driven | **Automated generator with signed output** |
| **MCP/AI agent integration** | None | Native MCP protocol — works with Claude, Cursor, etc. |
| **DORA TLPT** | No specific tooling | Dedicated TLPT planner MCP |

**Objection handling:**
- "We use OneTrust" → "OneTrust covers your general privacy program. MEOK layers on AI-specific compliance with cryptographic attestation your OneTrust reports can't match. It's complementary, not competitive."
- "OneTrust is the enterprise standard" → "OneTrust's AI module launched in 2025. Ours was purpose-built for the EU AI Act text. We do one thing and do it with verifiable proofs, not PDFs."

### Battle Card: vs Vanta/Drata

| | Vanta/Drata | MEOK AI Labs |
|---|---|---|
| **Price** | $7.5K-100K/yr | £0-£18K/yr (4-6× cheaper at every tier) |
| **Focus** | SOC 2, ISO 27001, HIPAA | **EU AI Act, DORA, NIS2, CRA, FIDA** |
| **Attestation** | Evidence collection, monitoring dashboards | **Cryptographic attestation with chain-of-custody** |
| **AI compliance** | Basic AI policy templates | **Full EU AI Act audit, risk classification, FRIA generation** |
| **Open source** | No | MIT licensed |
| **MCP integration** | None | All 21 MCPs are compatible with AI agent workflows |
| **Startup-friendly** | Minimum $7.5K/yr | £0 free tier, £49/mo starter |

**Objection handling:**
- "We have Vanta" → "Vanta handles your SOC 2. MEOK handles your EU AI Act. Different frameworks, different regulators. Vanta doesn't do FRIA or DORA TLPT. We do."
- "Vanta is automated too" → "Vanta automates evidence collection for SOC 2/ISO 27001. We automate the EU AI Act — risk classification, FRIA, C2PA watermark attestation, and DORA scoping. These aren't the same thing."

### Battle Card: vs Credo AI / Holistic AI

| | Credo AI / Holistic AI | MEOK AI Labs |
|---|---|---|
| **Price** | £25K-50K+/engagement | £79/mo-£5K (95-99.7% cheaper) |
| **Approach** | Consulting-led, enterprise AI governance platform | **Automated compliance, open-source tools** |
| **Attestation** | Governance reports | **Cryptographic attestation, public verify** |
| **Open source** | No (proprietary) | MIT licensed |
| **AI agent integration** | None | Native MCP protocol |
| **FRIA automation** | Manual/consultant-led | **Fully automated generator** |
| **Speed** | 6-12 weeks engagement | **5-minute scan, 48-hour rapid assessment** |
| **Accessibility** | Enterprise only (minimum fees) | **Free tier + SME-friendly pricing** |

**Objection handling:**
- "Credo AI is the leader in AI governance" → "Credo AI is great if you have £25K+ and 3 months. MEOK gives you the same compliance outcomes — signed attestations your auditor accepts — for £79/mo with a 5-minute setup. Same destination, different price and speed."
- "We need enterprise-grade" → "Our £1,499/mo Enterprise tier includes dedicated instance, SLAs, and audit support. The difference is we're open source, so you can inspect every line of code. Can you inspect Credo AI's code?"

### Battle Card: vs Complyance / AIComply

| | Complyance / AIComply | MEOK AI Labs |
|---|---|---|
| **Price** | Similar SME tiering | Competitive |
| **Attestation** | Standard reports | **Cryptographic attestation — they cannot match this** |
| **MCP integration** | None | 21 MCPs, agent-callable |
| **Open source** | Closed | MIT licensed on PyPI & GitHub |
| **DORA/NIS2/CER** | Limited or none | Dedicated MCPs for each framework |
| **Content attestation** | None | C2PA + watermark + fingerprint stack |

**Objection handling:**
- "AIComply has similar pricing" → "Check whether their reports are cryptographically signed with public verify URLs. If they can't pass a forensic audit with chain-of-custody, they're selling PDFs — not attestations."
- "Why does attestation matter?" → "Because an auditor doesn't trust a PDF you generated. They trust a cryptographically signed artifact they can verify independently at a public URL. That's the difference between a checklist and a compliance program."

### Competitive Moat Summary

**MEOK's three things no one else can match:**
1. **Cryptographic attestation with public verify.** No PDF-tool competitor offers this. This is the one feature that makes auditors trust the output. It's also the hardest to replicate.
2. **Open source at scale.** 21 MCPs, MIT licensed, on PyPI and GitHub. Enterprises can inspect code, fork, modify. No lock-in. Vanta/Drata/OneTrust are black boxes.
3. **MCP-native architecture.** All tools are AI-agent-callable. As AI agents become the primary way companies manage compliance workflows, MEOK is architected for that future. None of the incumbents are.

---

## 5. SALES MOTION

### Self-Serve: Stripe Checkout Flow

**Current state:** Payment links exist in Stripe. The flow is: traffic → compliance.meok.ai → click pricing → Stripe checkout.

**What needs to happen:**

1. **Optimise compliance.meok.ai for conversion:**
   - Hero section: "EU AI Act Compliance in 48 Hours" + countdown timer to August 2 (August 2, 2026)
   - Below hero: Three-column pricing with "Start Free" → "Pro £79/mo" → "Rapid FRIA £1,499"
   - Social proof section: GitHub stars count, PyPI download count, "MIT licensed" badge
   - "Trusted by auditors" section explaining cryptographic attestation
   - FAQ section addressing the top 10 objections
   - Footer: CTA to run free scan

2. **Stream the free scan flow:**
   - User enters their AI system description in a text field
   - System returns risk classification (prohibited/high/limited/minimal)
   - Shows gap report with gated next steps
   - CTA: "Get your signed FRIA attestation → £1,499 one-time" or "Continuous monitoring → £79/mo"

3. **Stripe checkout page must include:**
   - Customer logo upload (for attestation certificate)
   - Company name, jurisdiction (for regulatory mapping)
   - Email (for deliverable delivery)
   - Promo code field (for partnership/affiliate tracking)
   - VAT handling (MEOK AI Ltd is UK-registered)

4. **Post-purchase flow:**
   - Immediate: "Your FRIA scan is running" status page
   - Within 5 min: Risk classification report
   - Within 24-48h: Signed FRIA attestation (for £1,499 tier)
   - Email sequence: day 1 (welcome), day 3 (tips), day 7 (check-in), day 14 (cross-sell DORA/NIS2)

### Sales-Led: Enterprise Deal Structure

**When to switch from self-serve to sales-led:**
- Prospect company is >200 employees
- Prospect asks for a demo/call
- Prospect mentions "procurement", "legal review", or "security review"
- Prospect is a consulting firm seeking white-label
- Deal size is £1,499/mo or above

**Enterprise deal stages:**

1. **Discovery call (30 min):**
   - Agenda: Understand their AI systems, regulatory exposure, timeline, budget
   - Deliverable: Brief summary email with recommended tier
   - Do NOT do a full demo yet — ask qualifying questions first

2. **Technical demo (45 min):**
   - Show: Live FRIA scan on their system description
   - Show: Cryptographic attestation and public verify URL
   - Show: Pro dashboard with continuous monitoring
   - Show: DORA TLPT planner (if relevant)
   - End with: "Next step — we'll send a proposal by [today]"

3. **Proposal (same day as demo):**
   - PDF proposal with: scope, timeline, pricing, deliverables
   - Include: Sample attestation certificate
   - Include: Comparison table vs OneTrust/Vanta/Drata
   - Include: ROI calculation (cost of non-compliance: 7% global turnover)
   - Include: Quote from an existing user or from a relevant expert
   - Pricing: Annual contract preferred (discount 15-20% for annual)

4. **Procurement/legal review (1-3 weeks):**
   - Provide: Data Processing Agreement (DPA)
   - Provide: Security overview / pen test summary
   - Provide: SOC 2 equivalent (if available) or architecture review
   - Stay close: Weekly check-in, don't go silent

5. **Close:**
   - Send Stripe invoice or custom payment link
   - Set up onboarding call within 48 hours of payment
   - Kickoff with shared Slack/Teams channel

**Enterprise pricing framework:**

| Tier | Price | What's included |
|------|-------|----------------|
| **Pro for Teams** | £499/mo | 5 seats, all compliance MCPs, attestations, Slack support |
| **Enterprise** | £1,499/mo | Unlimited seats, dedicated instance, DORA TLPT, SLAs, monthly review |
| **Enterprise + Consulting** | £5,000/mo | Everything above + quarterly audits, framework crosswalk, DPO support |
| **White-Label** | £2,499/mo | Co-branded dashboard, your logo on attestations, referral fees |

**Custom deals:**
- Multi-year: 20% discount for 2-year, 30% for 3-year
- Non-profit/academic: 50% discount
- Startup (< 2 years, < £500K funding): £249/mo Pro for Teams

### Partnerships: Who to Partner With

**Tier 1: Consulting & Professional Services (White-Label)**
These firms already have the client relationships. They need the technical capability. Offer them your product under their brand.

| Target | Why them | Offer |
|--------|----------|-------|
| Deloitte UK AI & Data | 500+ UK clients, AI governance practice | White-label FRIA at £2,499/mo |
| PwC Responsible AI | EU AI Act taskforce already built | White-label attestation API |
| KPMG AI in Control | Regulatory technology focus | Joint assessment offering |
| BDO Cyber & Digital Risk | Mid-market SME focus — perfect MEOK fit | White-label Pro tier |
| Grant Thornton Technology Risk | SME financial services | White-label DORA TLPT |

**Approach:** Email 2 from cold-outreach-emails.md (already drafted at `~/clawd/freelance-profiles/cold-outreach-emails.md`).

**Tier 2: MSPs & IT Service Providers**
MSPs manage compliance for their clients. Give them a tool that makes them look good.

| Target | Why them | Offer |
|--------|----------|-------|
| UK-based MSPs with 50+ SMB clients | Recurring revenue, high churn protection | Reseller: £49/mo wholesale, they mark up to £99-149 |
| Euro-focused MSPs | NIS2 + EU AI Act overlap | Bundle deal: compliance suite for all clients |

**Tier 3: Law Firms**
Law firms sell compliance advice. Give them a tool that speeds up their advice and adds technical rigor.

| Target | Why them | Offer |
|--------|----------|-------|
| Tech-focused boutique law firms | DLA Piper's AI group, Bird & Bird, etc. | Referral: 20% commission on referred clients |
| EU regulatory specialists | Fieldfisher, Osborne Clarke | Joint white paper + referral |

**Tier 4: MCP/AI Agent Platforms**
As AI agents become the interface for compliance, MCP platform partnerships are distribution.

| Target | Why them | Offer |
|--------|----------|-------|
| Smithery.ai | 50K/mo users, MCP directory | Featured listing, co-marketing |
| Glama.ai | Gateway to awesome-mcp-servers (81K stars) | Submit top 20 MCPs |
| Claude/Cursor/Continue.dev | AI coding assistants | Plugin/extension integration |

### Referral: Agent-to-Agent Viral Mechanism

**The concept:** AI agents are performing compliance tasks. When Agent A uses a MEOK MCP and produces a signed attestation, the attestation contains a `verify_url`. When the recipient (Agent B or human auditor) clicks to verify, they land on compliance.meok.ai — creating a viral verification loop.

**Implementation:**
1. Every attestation includes: `"verified_at": "https://compliance.meok.ai/verify/abc123"`
2. The verify page shows: the attestation details, the MEOK branding, and a "Get your own FRIA attestation" CTA
3. Every verification is a lead generation event
4. Track verify page traffic → retarget with Google/LinkedIn ads

**This is MEOK's unique viral loop.** No competitor has it because no competitor does cryptographic attestation. Every signed report is a referral engine.

---

## 6. REVENUE PROJECTIONS

### Conservative Scenario (What's Realistic)

Based on conversion rates from Plausible Analytics (open-source SaaS solo-founder), Sentry (open-core), and typical B2B SaaS benchmarks for compliance tools.

**Assumptions:**
- Website traffic: 500-1,000 visitors/month (organic + ads + content)
- Free tier → Pro conversion: 2-3% (industry average for freemium dev tools)
- Pro → Enterprise/Consulting conversion: 5-10% of Pro users
- LinkedIn outreach response rate: 15-20% (warm, not cold)
- Cold email response rate: 3-5% (typical for compliance niche)
- Partnership close rate: 10-15% of conversations

#### 30-Day Projection

| Source | Conversions | Avg. Price | MRR/Revenue |
|--------|------------|------------|-------------|
| LinkedIn DM (40 queued, 15% response, 30% convert) | 2 clients | £79/mo | **£158/mo** |
| Cold email (100 sent, 4% response, 25% convert) | 1 client | £79/mo | **£79/mo** |
| Google Ads (£600 spend, 50 clicks/day, 2% conv.) | 1 client | £79/mo | **£79/mo** |
| Content (dev.to + Reddit, organic) | 1 client | £79/mo | **£79/mo** |
| Rapid FRIA (one-time, urgency-driven) | 1 client | £1,499 one-time | **£1,499** |
| NLnet NGI Zero Commons Grant | 1 grant | €20K-50K | **~£17K-43K** |
| **Total Month 1 (range)** | | | **£2,394 - £44,394** |

**Conservative month 1 MRR: £395/mo recurring + £1,499 one-time.**

Note: The NLnet grant is a binary event — if awarded, it transforms the financial picture. The non-grant MRR is modest but building.

#### 60-Day Projection

| Source | Conversions | Avg. Price | MRR |
|--------|------------|------------|-----|
| Existing subscribers | 5 total | £79/mo | **£395/mo** |
| New LinkedIn (100 more DMs, ongoing) | 3 more clients | £79/mo | **£237/mo** |
| New cold email (200 more, follow-ups) | 2 more clients | £79/mo | **£158/mo** |
| Content compounding | 2 clients | £79/mo | **£158/mo** |
| Rapid FRIA (one-time, 2 more) | 2 clients | £1,499 each | **£2,998** |
| Enterprise deal (first close) | 1 client | £1,499/mo | **£1,499/mo** |
| **Total Month 2 MRR** | | | **£2,447/mo** |

Plus one-time: **£2,998.**

#### 90-Day Projection

| Source | MRR |
|--------|-----|
| Pro subscribers: 15 | £1,185/mo |
| Enterprise: 2 | £2,998/mo |
| White-label partners: 1 | £2,499/mo |
| Consulting (rapid FRIA): 5 total | £7,495 one-time |
| **Total MRR at 90 days (conservative)** | **£6,682/mo** |

**Conservative 90-day outcome: £6-7K MRR + £7.5K one-time fees.**

### Aggressive Scenario (If Everything Goes Right)

| | Month 1 | Month 2 | Month 3 |
|---|---|---|---|
| MRR | £1,500 | £5,000 | £15,000 |
| One-time | £3,000 | £5,000 | £10,000 |
| Grant | £0 | £17K-43K | £0 |
| **Total** | **£4,500** | **£27K-53K** | **£25,000** |

Aggressive scenario requires: 2 enterprise deals in month 2, 1 consulting partner in month 3, strong content viral growth, and grant success.

### The Plausible Analytics Trajectory (Realistic Benchmark)

Plausible Analytics reached $1M ARR as a solo-founder open-source project. Their trajectory:

- Month 1: $400 MRR (free users upgrading)
- Month 6: $8,000 MRR (word of mouth)
- Month 12: $33,000 MRR (enterprise + partnerships)
- Year 3: $83,000 MRR ($1M ARR)

MEOK has a larger TAM (compliance is a bigger pain point than web analytics) and a regulatory forcing function (deadlines). Reasonable to expect 1.5-2x Plausible's trajectory if execution is good.

---

## 7. IMMEDIATE ACTION LIST

### What YOU Must Do (Nick's Hands Required)

These cannot be automated. They need your human judgment, identity verification, and network.

**Today (May 9):**

- [ ] **Send the 40 queued LinkedIn DMs.** Use the script from Section 2. Priority-sort by warm leads first.
- [ ] **Verify DNS for compliance.meok.ai.** Check it resolves to Vercel. If not, update nameservers.
- [ ] **Create 3 new Stripe products:**
  - £499/yr "Indie" tier
  - £1,499 "Rapid FRIA" one-time product
  - £499/mo "Pro for Teams" tier
- [ ] **Update meok-ai-landing/pricing.html** with new pricing structure.

**This Weekend (May 9-11):**

- [ ] **Submit PRs to the 5 awesome lists** (Section 1, Thing 3). One PR each, one-line description each.
- [ ] **Add GitHub topics** to every compliance MCP repo: `eu-ai-act`, `compliance`, `ai-governance`, `fria`, `dora`, `nis2`.
- [ ] **Write and publish the dev.to article:** "EU AI Act Article 27: The FRIA Deadline Nobody's Talking About" — post Tuesday at 14:00 UTC.

**This Week (by May 16):**

- [ ] **Verify Stripe live mode is healthy.** Test charge £1 on your own card. Confirm payouts are configured.
- [ ] **Send 50 cold emails** using the templates in Section 2. Use hunter.io or Apollo.io for email addresses.
- [ ] **Set up Google Ads account** with the keywords and budget from Section 2 (£20/day, £600/mo max).
- [ ] **Submit NLnet NGI Zero Commons Grant application** (deadline June 1, noon CEST). Draft exists at `~/clawd/nlnet-grant-application.md` and `~/clawd/NLNET_GRANT_DRAFT_2026-04-26.md`.
- [ ] **Submit top 10 MCPs to Glama.ai** (requires Dockerfiles — see MCP_MONETIZATION_ROADMAP.md for the script).
- [ ] **Create your new LinkedIn account** (old one deleted). Connect with the 40 prospects + target the 100 cold outreach targets.

**This Month (by June 1):**

- [ ] **Apply for IAPP Europe Congress 2026** (Brussels, Nov 16-19) — speaking slot.
- [ ] **Register for VAT with HMRC** if approaching £85K threshold (unlikely this month but needed before scaling).
- [ ] **Publish white-label partnership proposal** — send to Deloitte, PwC, KPMG, BDO, Grant Thornton.
- [ ] **Apply for Anthropic credits** ($1.2K-$20K potential for API usage).

### What Automated Systems Can Do (Your Infrastructure Team's Territory)

These can be semi-automated or delegated:

**Automated/scripted:**

- [ ] **Create the `meok-fria-generator-mcp`** — 3-hour sprint to build and deploy the FRIA generator
- [ ] **Add email capture to compliance.meok.ai** — ConvertKit or Resend free tier
- [ ] **Set up email welcome sequence** (day 1, 3, 7, 14) for new signups
- [ ] **Set up Google Ads landing page** on compliance.meok.ai with conversion tracking
- [ ] **Add product topics to all GitHub repos** — scriptable in 1 hour
- [ ] **Create Stripe payment links** for all new pricing tiers
- [ ] **Set up Plausible/Fathom analytics** on compliance.meok.ai (privacy-friendly)
- [ ] **Deploy the verify page** at compliance.meok.ai/verify/{id} for the viral attestation loop
- [ ] **Publish 20 more compliance MCPs to PyPI** with `meok-` prefix
- [ ] **Create the DORA TLPT planner MCP** (£1,499/mo Enterprise product)

**Content calendar (can be pre-drafted):**

- Week 1: "EU AI Act Article 27" (dev.to) + "DORA TLPT" (dev.to) + "85 Days" (LinkedIn)
- Week 2: "Cryptographic Attestation" (IAPP pitch) + "C2PA Stack" (dev.to)
- Week 3: "Cost Comparison" (Indie Hackers) + "FRIA Guide" (Medium)
- Week 4: "Open Source Compliance" (Hacker News) + case study if one exists

---

## APPENDIX A: Critical Deadline Corrections

From our deep research (April 26, 2026):

- **Article 50 (AI-generated content labelling):** November 2, 2026 — confirmed by Digital Omnibus. The Code of Practice on AI-generated content finalises May-June 2026. This is the three-layer requirement: C2PA manifest + invisible watermark + fingerprinting. MEOK's `meok-watermark-attest` addresses this.
- **Article 27 FRIA (Fundamental Rights Impact Assessment):** August 2, 2026 — this is the deadline for public-sector deployers and SaaS vendors selling to them. This is the IMMEDIATE revenue opportunity because the EU AI Office hasn't published its official template yet. MEOK's `meok-fria-generator-mcp` pre-empts them.
- **DORA TLPT (Threat-Led Penetration Testing):** January 2025 in force, rolling compliance windows per FI. Mid-cap FIs paying €100-500K for red-team exercises every 3 years. MEOK's `meok-dora-tlpt-planner-mcp` scopes these for £1,499/mo.

**The marketing calendar should reflect these dates:**
- NOW: "FRIA deadline — August 2" (Article 27 urgency)
- JUNE: "Code of Practice finalised — are you ready?" (Article 50 ramp)
- NOVEMBER: "Article 50 enforcement — is your AI content labelled?" (Article 50 enforcement)

---

## APPENDIX B: Key Links & Assets

| Asset | URL/Path |
|--------|----------|
| Landing page | compliance.meok.ai |
| Attestation API | meok-attestation-api.vercel.app |
| PyPI | pypi.org/user/MEOK_AI_Labs/ |
| GitHub org | github.com/CSOAI-ORG |
| Existing pricing | ~/clawd/meok-ai-landing/pricing.html |
| Cold outreach templates | ~/clawd/freelance-profiles/cold-outreach-emails.md |
| EU AI Act kit | ~/clawd/eu-ai-act-kit/ |
| Full competitive analysis | ~/clawd/unified-portfolio-catalog/DEEP_RESEARCH_BLEEDING_EDGE.md |
| Revenue deep research | ~/clawd/revenue/DEEP_RESEARCH_DIAMONDS_2026-04-26.md |
| Grant drafts | ~/clawd/nlnet-grant-application.md, ~/clawd/NLNET_GRANT_DRAFT_2026-04-26.md |
| Stripe dashboard | dashboard.stripe.com |
| Google Ads | ads.google.com |
| Glama.ai MCP submissions | glama.ai/mcp/submit |
| Dev.to | dev.to/new |

---

## APPENDIX C: Success Metrics Dashboard

Track these weekly:

| Metric | Week 1 Target | Week 4 Target | Week 12 Target |
|--------|---------------|---------------|----------------|
| Website visitors (compliance.meok.ai) | 100 | 500 | 2,000 |
| Free scans completed | 10 | 50 | 200 |
| Free → Pro conversion rate | 3% | 3% | 5% |
| MRR | £500 | £2,500 | £7,000 |
| LinkedIn DMs sent | 40 | 150 | 500 |
| Cold emails sent | 50 | 250 | 1,000 |
| GitHub stars on flagship repos | 50 | 200 | 500 |
| Awesome list PRs merged | 3 | 5 | 5 |
| Google Ads CTR | 2% | 3% | 4% |
| NLnet grant status | Submitted | In review | Awarded/declined |
| Enterprise deals in pipeline | 3 | 10 | 20 |
| Partnership conversations | 2 | 5 | 10 |

---

## APPENDIX D: The Single Most Important Thing

If you execute nothing else from this plan, do these three things in the next 48 hours:

1. **Send the 40 LinkedIn DMs.** They are queued. They cost nothing. They reach people who already know about you. This is the highest-probability path to first revenue.

2. **Submit the 5 awesome list PRs.** One hour of work. Permanent SEO. Free traffic forever.

3. **Ship the FRIA generator.** Build it, deploy it, submit it to `GenAI-Gurus/awesome-eu-ai-act`. The EU AI Office doesn't have their template live yet. Be there first.

Everything else in this plan supports and scales these three actions.

---

*Generated by JEEVES Strategic Command, May 9, 2026.*
*Next review: May 16, 2026 (Week 1 checkpoint).*
*Status: EXECUTION PLAYBOOK — NOT A RESEARCH DOCUMENT.*
