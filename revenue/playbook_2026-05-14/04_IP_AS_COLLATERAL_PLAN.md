# 04 — IP as Collateral Plan

How Nick's software becomes loan-collateral, tax breaks, grant matching, and eventually equity worth £1M+ for the family.

---

## What "IP as collateral" actually means (plain English)

When Nick writes software, that software is **intellectual property (IP)** — it has economic value even if no one has bought it yet. The UK government and banks have created specific mechanisms that let you convert this IP into:

1. **Cash via R&D tax credits** (HMRC pays you back ~15-27% of R&D spending)
2. **Cash via grants** that match your IP investment (Innovate UK, etc.)
3. **Cash via lower corporation tax** (UK Patent Box — 10% rate instead of 25%)
4. **Loans against the IP** (Innovate UK Innovation Loans, specialist banks)
5. **Eventually equity value** if the business is sold or attracts investors

The Kimi report (April 2026) claimed MEOK's IP was worth £46M and £1.4-3M in non-dilutive funding within 12 months. **That was inflated.** The honest realistic 12-month range is **£100K-£500K** — but that's still a transformational sum for a family business.

---

## What MEOK + CSO AI + CobolBridge actually own

### Verified IP assets (as of May 2026):

| Asset | Real-world value |
|---|---|
| **38 published MCP servers** on PyPI (MIT-licensed) | Each one is a complete software product. Most companies spend £20-50k to build one. Replacement cost: ~£1-2M |
| **HMAC-signed attestation API** (meok-attestation-api.vercel.app) | Production cryptographic infrastructure. Replacement cost: ~£50-100k |
| **38 GitHub repos** under CSOAI-ORG namespace | Source-controlled, public, MIT — generates trust + credibility |
| **38 detail pages** on meok.ai with SEO content | ~5 hours each at £150/hr writer rate = £28k value |
| **3 blog posts pillar content** | ~£3k each at writer rate = £9k |
| **2 widget files** (`meok-trust-bar.js`, `scorecard.html`) | Distribution surface for any partner site |
| **Public manifest API** at meok.ai/api/manifest | Machine-readable directory of all 38 MCPs — CC0 licensed |
| **8 awesome-mcp PRs queued** (~100K combined GitHub stars) | Distribution surface |
| **Glama auto-listings** for all 38 MCPs | Free directory visibility |
| **CobolBridge.ai** working bridge | Solo would cost ~£100-200k to recreate |
| **Optomobile.ai** FHIR-compliant practice management | ~£150-300k to recreate |
| **Templeman family heritage brand** | Priceless — irreplaceable |

**Realistic replacement cost of all IP: £1.5-2.5M**
**Realistic auction value (forced sale): £200-500k**
**Realistic strategic value (acquirer like Drata/Vanta in 5 years): £3-15M+**

---

## The 5 cash routes (in order of how soon Nick can pull them)

### Route 1: R&D Tax Credits (£15-30K — within 12 months)

UK Research and Development tax relief lets companies claim back ~15-27% of qualifying R&D spending. Two routes:

**Standard merged scheme (default for accounting periods after 1 April 2024):**
- 20% Research and Development Expenditure Credit (RDEC)
- Net benefit ~15% of qualifying R&D spend (at 25% Corporation Tax rate)
- Profit OR loss-making companies eligible

**Enhanced R&D Intensive Support (ERIS) — for high-R&D-spend SMEs:**
- For loss-making SMEs where ≥30% of expenditure is on qualifying R&D
- Net benefit up to ~26.97% of qualifying R&D spend
- This is where MEOK lands

**What qualifies:**
- Staff time on R&D (Nick's salary if he's a director)
- Software + cloud (AWS / Anthropic API costs)
- Subcontracted R&D
- Data costs
- Polytunnel as "controlled R&D environment" for ag-robotics trials

**Realistic claim size for MEOK Year 1 with conservative R&D allocation: £15-30K cash refund.**

**Action:**
- Get MEOK incorporated as UK Ltd if not already (Companies House £12)
- Engage a specialist R&D tax credit consultant (e.g., ForrestBrown, RCK Partners — they take 15-20% of refund)
- File first claim in Year 1 of MEOK's first complete accounting period

---

### Route 2: UK Patent Box (corporation tax cut to 10%)

The UK Patent Box reduces Corporation Tax on profits earned from patented IP from 25% to **10%**.

**Catch:** you need to OWN granted patents, not just have published open-source software.

**For MEOK:** worth filing **one strategic patent** that covers a key compliance methodology — even if everything else stays MIT-licensed. The patent itself doesn't have to be revolutionary; it just needs to be valid + enforceable.

**Patent suggestions:**
- "Method and system for HMAC-signed compliance attestation with cross-regulation crosswalking" (covers attestation API)
- "Method for verifiable EU AI Act Article 50 watermarking using C2PA 2.1 + Sigstore + RFC 3161"

**Cost of filing UK patent:**
- DIY: ~£300-£500
- Patent attorney: £4-8k for filing, £2-4k for examination
- Total over 3 years: ~£8-15k
- Result: 15% corporation tax saving on related IP profits = **£15-50k+/yr** once revenue hits £100k+

**Action:**
- Pick 1-2 strategic patent candidates
- File initial application via UKIPO (UK Intellectual Property Office)
- After 18 months, decide whether to pursue grant or let lapse
- This is a 3-year horizon, not Year 1

---

### Route 3: Innovate UK Innovation Loans (£100k-£5M IP-backed)

Innovate UK Innovation Loans are non-equity loans of £100k-£5m for late-stage R&D, using IP as collateral. Rounds 25 + 26 in 2026.

**Eligibility:**
- UK SME
- Trading
- Innovation project with clear commercialisation
- Existing IP (which MEOK has — 38 published packages + attestation API)

**Realistic Year 1 loan size for MEOK:** £100-250k

**Catch:** It's a loan, not a grant. Must be repaid. But:
- Generous payment holidays
- Below-market interest rates
- Can be deferred until revenue reached
- Uses IP as primary collateral (not personal guarantees)

**Action:**
- Wait until MEOK has 12 months trading + some MRR
- Apply Innovation Loans Round 26 (opens 5 March 2026, closes 29 April 2026)
- Or wait for Round 27 (likely autumn 2026)

---

### Route 4: Non-dilutive grants matching IP value (£100-500k+)

The full grant landscape is in Section 3 of the master grants doc. Key IP-relevant ones:

| Grant | £ | Why it matches MEOK's IP |
|---|---|---|
| **NLnet NGI Zero Commons** | €30-60k (3 sub-proposals stacked) | Open-source MIT requirement met by every MEOK MCP |
| **AI Assurance Innovation Fund (DSIT)** | £200-500k | Designed for tools like the 38-MCP suite |
| **Defra ADOPT** | £100k | Ag-robotics on-farm trials |
| **Innovate UK AgriScale** | £250-750k | Robotics + intelligent sensing |
| **EIC Accelerator (EU)** | €17.5M (grant + equity) | Open-source compliance automation at SME prices |
| **LTFF + SFF Speculation** | $50-150k | CSO AI alignment research framing |
| **NHS AAC AI Award** | £100k-£1m | Clinical AI partnership grants (Templeman = pilot) |
| **MHRA AI Airlock** | £1.2m/yr programme | Clinical AI sandbox |
| **Sovereign Tech Fund (Germany)** | €100-500k | Open-source critical infrastructure |
| **KTP with University of Lincoln** | £75-600k | Academic partnership for ag-robotics |

**Realistic 12-month grant capture: £150-500k.**

---

### Route 5: Eventual equity value

If MEOK + CSO AI + Optomobile.ai + CobolBridge.ai scale to:
- £500k MRR
- 50+ enterprise customers
- 3-5 NHS deployments

...then realistic acquirer interest emerges from:
- **Drata** (US $200M Series C compliance automation)
- **Vanta** (US $2.45B valuation compliance automation)
- **OneTrust** ($5.3B valuation privacy + governance)
- **BigID** ($1.25B valuation data discovery)
- **Securiti** (mid-stage data + AI governance)

**Realistic acquisition valuation in 5 years at £5M ARR: £30-75M (6-15× ARR multiple typical for compliance SaaS).**

This is speculative. But the structural moat is real because:
- 38 MCPs is hard to replicate (each takes weeks)
- HMAC-signed attestation is a defensible architecture
- Templeman Opticians as real clinical reference site
- UK + EU positioning ahead of US incumbents

---

## How this protects the family

The family asset stack should be structured so that:

1. **MEOK Operating Ltd** owns the trading business + has the R&D credit + Patent Box optimisation
2. **MEOK IP Holdco Ltd** owns the trademarks + commercial-only code + future patents
3. **Templeman Family Trust** holds the farm + family heritage IP (Templeman name, optomobile.ai brand)
4. **Templeman Opticians Ltd** is a separate Ltd with clinical PI insurance

**If MEOK gets sued for a faulty compliance MCP:**
- Operating Ltd takes the hit
- IP Holdco preserves the IP value
- Family Trust + Templeman Opticians are untouched
- The farm is safe

**If MEOK becomes worth £20M:**
- IP Holdco can be sold or spun out
- Family Trust holds the residual stake
- Substantial Shareholding Exemption (UK CT) means 0% CGT on qualifying disposal
- Net to family after IHT planning: £15-18M

**If MEOK becomes worth £0:**
- Operating Ltd files dormant
- Family loses ~£20-50k of fixed costs incurred
- Templeman Opticians + farm + family wealth untouched

This is the structure Roythornes solicitor + Saffery accountant will set up. See **05_6_MONTH_ROADMAP.md** for the trust setup timeline.

---

## The dual-licensing playbook (this is the Red Hat / GitLab pattern)

MEOK is **open-source MIT** by default. But you can sell:

1. **Support subscriptions** (£79-499/month) — "we'll be on call when your auditor questions an attestation"
2. **Commercial licences** (one-off £5-25k) — "you can use this in your closed-source product without releasing your code"
3. **Indemnity wrappers** (£500-2000/month) — "we'll defend you if a customer sues for a bad compliance result"
4. **Certified builds** (£100-500/month) — "this binary is signed by us and reproducible"
5. **Custom MCPs** (£5-25k one-off) — "build us a custom regulatory crosswalk"

**Red Hat model:** Sell the support + certification + guarantee, not the software.

This is exactly what Anthropic does too — Claude is API-accessed, but the value isn't the bytes; it's the SLA + the safety guarantees + the support.

---

## The CSO AI side — turning open-source research into grant collateral

CSO AI publishes white papers + alignment research. **Each paper is a grant credibility chip.**

Pattern:
1. CSO AI publishes a white paper on (e.g.) "Verifiable AI Act Article 50 watermarking in clinical settings"
2. Templeman Opticians is the case study site mentioned in the paper
3. MEOK is the implementation product mentioned
4. Paper is submitted to relevant grant body (NIHR, NHS AAC, MHRA AI Airlock)
5. Grant decision references the published research as "evidence of capability"
6. £100k-£1m flows in

**3 white papers in 12 months × 30% acceptance rate × £200k average = £180k expected value.**

---

## The Templeman Opticians angle on IP collateral

Wendy and Fred's practice has its OWN IP:
- **30+ years of patient records** (consented for research = research dataset)
- **Optometry workflow knowledge** (the actual practice management knowledge that informs Optomobile.ai)
- **Care-home network relationships**
- **The Templeman name as a regulated practice brand**

In the Optomobile.ai SaaS launch, this matters because:
- Templeman is the **founding customer** (worth strategic positioning)
- The practice's workflow data (consented) informs the product (with proper governance)
- Templeman family endorsement of Optomobile is worth more than 100 customer testimonials

**Practical implication:** Wendy and Fred should consider taking a small equity stake in Optomobile.ai (5-10%) in exchange for being the founding customer + brand endorsers. Even at modest exit, this is meaningful.

---

## The 12-month IP-to-cash conversion target

| Source | Timeline | Realistic £ |
|---|---|---|
| First R&D tax credit claim | Q4 2026 | £10-25k |
| NLnet grants (3 sub-proposals) | June 2026-Q4 | €30-60k (~£26-52k) |
| ADOPT + AgriScale + KTP applications | June 2026 deadlines | £25k (probability-adjusted from £500k+ applied) |
| AI Assurance Innovation Fund | Spring 2026 round | £50k (probability-adjusted) |
| First Pro tier customers (£79/mo × 10) | Q3-Q4 2026 | £790-1,800/mo MRR by end Year 1 |
| First Enterprise customer | Q4 2026 | £6k one-off + £499/mo |
| **TOTAL Year 1 cash + recognised value** | | **£100-200k** |

**Year 2 with NHS AI Award + 1 KTP + initial revenue:**

| Source | £ |
|---|---|
| NHS AI Award Phase 1 win (one of 3-5 applications) | £150-300k |
| KTP with University of Lincoln | £200-500k |
| MRR from 50 customers | £25-50k/mo = £300-600k/yr |
| **TOTAL Year 2** | **£700k-£1.4M** |

**Year 3-5: Series A funding from a UK AI VC OR strategic acquisition path with US compliance incumbent.**

---

## Action checklist (Nick handles these, Wendy + Fred just sign where needed)

- [ ] Incorporate MEOK Operating Ltd at Companies House (£12, 24h)
- [ ] Incorporate MEOK IP Holdco Ltd (£12, 24h)
- [ ] Engage R&D tax credit specialist (ForrestBrown or RCK Partners)
- [ ] File first NLnet sub-proposal (deadline 1 June 2026)
- [ ] File ADOPT + AgriScale + KTP applications (June 2026 deadlines)
- [ ] Engage Roythornes (Spalding) re: Family Trust + Family Investment Company
- [ ] Engage Saffery re: tax structure + IHT projection
- [ ] Pick 1-2 strategic patent candidates + file UKIPO initial applications
- [ ] CSO AI white paper #1 in Q3 2026
- [ ] Templeman Opticians signs LOI as Optomobile founding customer (with 5-10% equity)
- [ ] Templeman Opticians signs as clinical pilot site for MEOK NHS AI Award bid

Read next: **05_6_MONTH_ROADMAP.md**
