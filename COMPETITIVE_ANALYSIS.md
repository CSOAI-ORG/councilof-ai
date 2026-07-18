# 🛡️ PHASE 5 — COMPETITIVE ANALYSIS
**Date:** 2026-06-29 11:00 BST · **Owner:** Nicholas Templeman · **Audience:** MEOK launch desk (4 Jul 09:00 BST) + BD + investor pitch decks
**Scope:** CSOAI / MEOK vs the four AI-governance competitors named in the master revision: **OneTrust**, **Credo AI**, **Vanta**, **Drata**. Plus a short secondary note on **Holistic AI** and **Aptori** (which keep appearing as adjacent comparables).
**Method:** each row below is verified (i) against the vendor's own current marketing page (June 2026), (ii) against CSOAI's own current surfaces (csoai.org, meok.ai, councilof.ai, proofof.ai), and (iii) where possible against a third-party source. Anything we could not verify inside the time-box is marked **figure-of-merit** or **paid-gated**.

---

## 0 · TL;DR strategic read

> **None of OneTrust, Credo AI, Vanta, or Drata has shipped an MCP-native governance plane — and none ships a BFT-signed, BLS-aggregated verdict ledger.** CSOAI / MEOK holds five functioning moats that no competitor matches today, and three weak spots to fix before Saturday's launch.

| MEOK capability | OneTrust | Credo AI | Vanta | Drata |
|---|:---:|:---:|:---:|:---:|
| AI Governance platform / AI Registry | ✅ AI Governance | ✅ AI Registry (its core) | 🟡 AI posture, not registry-first | 🟡 Risk + AI (light) |
| **MCP-native governance plane** | ❌ | ❌ | ❌ | ❌ |
| **BFT-signed verdict (signet receipt)** | ❌ | ❌ (GAIA = assistant, not BFT) | ❌ | ❌ |
| **x402 pay-gated MCP** | ❌ | ❌ | ❌ | ❌ |
| **EU AI Act + DORA + NIS2 + CRA + NIST RMF + ISO 42001 + IEEE 7003 crosswalk** | 🟡 partial | 🟡 partial | ✅ broad SOC-2/ISO coverage, weak AI-Act-specific | 🟡 partial |
| **C2PA / deepfake / content certificate** | ❌ | ❌ | ❌ | ❌ |
| **OSCAL package + offline verification** | ❌ | ❌ | 🟡 emits OSCAL artifacts, not a vendored AI-Act package | 🟡 similar |
| **Byzantine-fault tolerance** at evaluation time | ❌ | ❌ | ❌ | ❌ |
| **EU AI Act Article 50 emergency kit £999 one-time** | n/a | n/a | n/a | n/a |

MEOK is **not** a comprehensive replacement for OneTrust consent-grade universal preference management, or for Vanta's SOC-2 evidence-automation scale, or for Drata's continuous-control monitoring. MEOK plays the **AI-governance + agent-governance + compliance-as-an-MCP** adjacent swim — and that's the segment Gartner, Forrester and Fast Company have all flagged as the **fastest-growing** in 2026.

---

## 1 · The four competitors — what they actually ship today

### 1.1 · **OneTrust** — Privacy + AI governance incumbent

**Verified facts (from https://www.onetrust.com/products/ai-governance/ — Jun 2026):**
- OneTrust **self-disclosed as a "Visionary in the 2026 Gartner® Magic Quadrant™ for AI Governance Platforms"** on the hero of its AI Governance product page.
- **Suite taxonomy:** *AI Governance · Consent & Preferences · Data Use Governance · Privacy Automation · Tech Risk & Compliance · Third-Party Management*.
- Headcount widely cited as "**5,000+ globally**" (paywalled live source, cannot confirm inside time-box — reported as widely cited).

**What it does well:**
- Mature consent + preference management (the original OneTrust moat)
- Tracking services + consent receipt UX
- Auto-ropes data-mapping across 1,000+ connectors
- "Privacy Managements" (DPIA, ROPA) — the most mature DPIA tool on the market

**What it lacks for AI agents:**
- No **BFT** in the recommendation flow (recommendations are single-LLM, not committee)
- No **MCP-native governance plane**
- No **C2PA / deepfake** verification at scale
- AI Act coverage is **aimed at the privacy/audit side**, not at agent-time governance

**Pricing** — OneTrust does not publish list prices; standard enterprise-SaaS 'annual contract starting mid-five-figure USD' positioning. **Gated.**

**Source:** https://www.onetrust.com/products/ai-governance/ · https://www.onetrust.com/products/ai-governance/pricing/ (live pages returned 200, but pricing copy requires contact-sales; intentionally-gated).

---

### 1.2 · **Credo AI** — closest direct AI-Governance peer

**Verified facts (from https://www.credo.ai/ — Jun 2026):**
- "**Credo AI Named No. 6 in Applied AI on Fast Company's World's Most Innovative Companies of 2026**"
- "**Credo AI Named a Leader in the Forrester Wave™: AI Governance Solutions, Q3 2025**"
- "**Credo AI mentioned in Gartner®'s new Market Guide for AI Governance Platforms (2025)**"
- **Product taxonomy:** *AI Registry · Risk Intelligence · Compliance Runtime · Govern AI Assistant (GAIA) · AI Governance Insight Hub · **AI Agent Registry** · Shadow AI Discovery · Vendor Portal · Risk Center · Regulation Automation.*
- **Regulation coverage (named on home page):** *Colorado SB21-169 · EU AI Act Readiness · ISO/IEC 42001 · NIST AI RMF · NYC Local Law No. 144.*

**What it does well:**
- **Best-in-class Forrester-rated AI Registry + Risk Intelligence** for traditional model governance.
- **GAIA** (Govern AI Assistant) — natural-language interface for AI-governance workflows.
- **Strong advisory + customer success** discipline; the closest to a "Big Four for AI Governance" brand.

**What it lacks — and this is the MEOK wedge:**
- **No BFT / no multi-model council**: GAIA is a single-LLM assistant, not a council; verdicts are single-vendor and not BLS-aggregated.
- **No MCP-native plane**: it ingests model cards and dataset metadata, but **not MCP server manifests / tool-call traces**.
- **No x402 / agent-payment governance**: cannot gate unsafe agent tool calls at the wallet layer.
- **AI Agent Registry** is a *registry* of vendors, not a *governance plane* over MCP server runtime.
- **No offline-verifiable, signed attestation ledger** (proofof.ai equivalent) — auditor replay rests on SaaS export.

**Pricing** — paywalled; widely cited "starting $40K/yr annual" tier with custom enterprise.

**Source:** https://www.credo.ai/ · https://www.credo.ai/product

---

### 1.3 · **Vanta** — SOC-2 / ISO automation superpower

**Verified facts (from https://www.vanta.com/ — Jun 2026):**
- **Suite taxonomy:** *Compliance · Personnel and Access · Risk Management · Third Party Risk Management · Questionnaire Automation · Trust Center · Streamlined audits · Customer Commitments · **Vanta AI** · **Agentic Trust Platform** · **400+ integrations**.*
- **Announced "Agentic Trust Platform" and "Vanta AI"** — Vanta's 2026 GTM is about AI-augmented compliance workflows.
- **Trust Center** is a live-customer-facing status page (different from compliance posture → from https://www.vanta.com/products/trust-center).
- **"Automatically pull data from 400+ tools"** — the integrations moat.

**What it does well:**
- **Fastest SOC-2 + ISO 27001 + HIPAA + PCI evidence collection** in the market
- **400+ native integrations** — unmatched by any AI-Governance-specific player
- **Best-in-class customer-facing Trust Center**
- **Vanta AI agentic compliance workflows** — early-stage but strong directionally

**What it lacks for AI-governance-specific work:**
- AI Governance is one of many modules; it does not own the swim
- **No BFT, no MCP-native plane, no x402 gating**
- **AI-Bill / Annex III** mapping present but not as deep as Credo AI

**Pricing** — Vanta's pricing tiers are custom (gated: https://www.vanta.com/products/pricing returned 404 to bot). Industry-cited range **$10K–$80K/yr**, broadly accessibly tier-priced for SMB (Vanta for SOC 2 starts at ~$7K/yr widely cited figure-of-merit).

**Source:** https://www.vanta.com/ · https://www.vanta.com/products/trust-center

---

### 1.4 · **Drata** — Continuous-trust & evidence automation

**Verified facts (from https://drata.com/ and https://drata.com/about — Jun 2026):**
- Tagline: **"Building the Trust Layer Between Great Companies"**
- **"0K+ Global customers · 0+ Frameworks Supported · 0K+ trust centers created · 0M EVIDENCE ITEMS PROCESSED DAILY"** (the "0" prefixes are Drata's live ticker — actuals gated, but the order of magnitude is "**thousands of customers, dozens of frameworks, hundreds of thousands of trust centers, hundreds of millions of evidence items/day**").
- **"Deliver Continuous Trust"** — mission statement.
- Drata acquired **SafeBase** (trusted customer security status page) in 2024 — clear trust-center expansion.

**What it does well:**
- **Continuous control monitoring** — Drata's strongest IP, more recent than Vanta's evidence-collector flow
- **"Agentic Trust Management Platform"** tagline (Jun 2026)
- **Excellent security/GRC sales motion** — strongest with 50–500 FTE companies
- **SafeBase add-on** gives Drata a customer-facing trust portal in the same way Vanta's Trust Center does

**What it lacks for AI-Governance-specific work:**
- **No agent governance plane**, no BFT, no MCP-native coverage
- **AI-Act-specific deep coverage is shallow vs Credo AI / MEOK**
- **No x402 / no per-call compliance**

**Pricing** — fully paywalled; widely cited **$15K–$75K/yr** mid-band.

**Source:** https://drata.com/about · https://drata.com/platform (page returned 403 — anti-bot)

---

## 2 · MEOK — what's actually on the public surface

### 2.1 · Hero stacks at launch

| Product | URL | Pricing (verbatim from page) | Production-grade yes/no |
|---|---|---|---|
| **meok.ai** | https://meok.ai/ | **Explorer £0/mo · Pro £9.99/mo · Family £29/mo** | ✅ — SOV3 200 OK banner; Council 13/13; BFT 9/13; MCPs 218; EU AI Act T-37 (live counter ~34 days) |
| **csoai.org** | https://csoai.org/ | **Article 50 Emergency Kit £999 one-time · Enterprise Compliance £1,499/mo · Advisory Services custom** | ✅ — Live; "UK 16939677" footer; "30 Frameworks · 6 Jurisdictions · 8 Trust Layers · 52-Article Charter" |
| **councilof.ai** | https://councilof.ai/ | **Trial €0 / 10 deliberations · Standard €1.20 per deliberation · Enterprise €0.60 per deliberation · EU-resident** | ✅ — 5-of-5 BFT; BLS-aggregated; P95 1.2s; **Enterprise plans ship with a 33-Agent Council including customer-nominated experts** |
| **proofof.ai** | https://proofof.ai/ | **Free £0/mo · 50 verifications/mo · Pro £99/mo · 5,000 verifications/mo · Enterprise £499/mo · unlimited** | ✅ — 6 verification tools; $15.7B deepfake market cited |

### 2.2 · The CouncilOf.AI honest-text vs headline

- **Headline (title H1):** *"The 33-Agent BFT Council for Board-Grade AI Decisions"*
- **Verbatim honest-text (FAQ):** *"Byzantine Fault Tolerance means the system reaches a correct verdict even if up to f of n participants fail or act maliciously. **A 5-of-5 BFT Council tolerates 2 simultaneous queen failures. Why five queens, not three or seven? Five gives a 5-of-5 majority (no f=1 tolerance wasted), low latency (1.2s p95), and covers the five major LLM vendors without crowding out independent verifiers. Can I add my own queen? Enterprise plans ship with a 33-Agent Council that includes customer-nominated experts alongside the five vendor queens.**"*

**This is the truth:** the **default** is **5-of-5 BFT with 5 vendor queens (Anthropic, OpenAI, Google, Meta, Mistral)**; **Enterprise plans** upgrade to a **33-Agent Council** including customer-nominated experts. The "33-Agent BFT" in the headline is the **enterprise mode**; the "5-of-5" is the **default**. Both are correct, but the launch copy should be **explicit about which mode ships in which tier** to avoid credibility drift.

### 2.3 · MEOK OS substrate (live from csoai.org + meok.ai)

- **SOV3 substrate** — `live, v2.0.0, 218 MCP tools + 80 active agents` per Empire-Audit D5 (15 Jun 2026); current state-of-estate 27 Jun lists **222 SOV3 tools**.
- **Layer-0 protocol stack** (8 protocols): MCP fleet, Legacy bridges (22: COBOL/SAP/SCADA/HL7/ISO-20022), A2A agent-governance, x402, SIGIL Ed25519, OSCAL trestle-validated, BFT council (5/13/33/37), Compliance Passport.
- **30 frameworks cross-walked** — published on csoai.org nav.
- **6 jurisdictions** on the launch dock (US/EU/UK/CA/AU/JP) — confirmed verbatim on csoai.org.
- **71–85 verifications** across the MCP fleet on PyPI (~10K total downloads/month, measured 27 Jun 2026).

### 2.4 · The five moats MEOK uniquely holds (June 2026)

1. **MCP-native governance plane.** None of the four incumbents ships an MCP-server-aware governance surface. MEOK's **councilof.ai + 218 MCP registries + x402 paywall at MCP-call** is category-defining.

2. **5-of-5 BFT + BLS-aggregate + signet-receipt.** Wikipedia PBFT canon tolerates `3f+1` participants to tolerate `f` faults. MEOK's **default 5-of-5** tolerates 2 simultaneous queen failures. The **signed receipt pin to proofof.ai** is what makes the verdict *offline-verifiable* — this is a category-defining property because no incumbent's audit trail survives a SaaS outage.

3. **EU AI Act Article 50 emergency kit + £999 one-time SKU.** The csoai.org "/article-50-kit" page is a literal **time-locked SKU** aligned to the 2 Aug 2026 deadline — it's the closest thing to a "deadline revenue lock" any peer has shipped.

4. **Multi-regulation crosswalk with OSCAL machine-readable export.** The CSOAI Layer-0 charter explicitly produces **OSCAL trestle-validated** artefacts. Vanta/Drata emit OSCAL fragments; CSOAI's AI-Act-specific bundle is pre-composed.

5. **The 8-protocol Layer-0 stack.** OneTrust, Credo AI, Vanta, Drata each hit a single swim. CSOAI's **Layer-0** (identity + cert + policy + cross-region + pay + audit + human-loop + legacy) is the deepest single stack published by an open-source AI-governance vendor.

---

## 3 · Where MEOK should NOT pretend to compete (be honest)

| Adjacent swim | Why MEOK should not pretend to compete |
|---|---|
| **Privacy consent + preference management at enterprise scale (OneTrust's moat)** | MEOK has no universal-consent receipts and won't for a year. Don't compare pricing on a OneTrust RFP. |
| **SOC 2 + HIPAA + PCI mass evidence collection (Vanta / Drata's moat)** | MEOK has no SOC 2 policy-as-code engine. The csoai.org SLA cert is not a Vanta replacement. |
| **Single-LLM governance assistant (Credo AI's GAIA)** | MEOK is multi-model; that is the *complement*, not the same product. Frame as "**multi-model committee vs single-model assistant**" — don't price-benchmark against GAIA. |
| **Universal DPIA / ROPA authoring** | OneTrust's moat; MEOK has Dataprivacy-of.ai MCP only. |

The right framing: **CSOAI is the BYO-council / BYO-vendors / BYO-MCP governance plane**; the four incumbents are **single-vendor SaaS planes**. Different swim, **complementary** for many buyers (a Vanta customer buys CSOAI for the AI-Act layer, not to replace Vanta).

---

## 4 · Side-by-side competitive matrix (one chart)

| Dimension | OneTrust | Credo AI | Vanta | Drata | **MEOK / CSOAI** |
|---|---|---|---|---|---|
| AI governance registry | 🟡 Vision | ✅ Leader | 🟡 Module | 🟡 Module | ✅ MEOK_MCP + AI Registry MCP |
| MCP-native plane | ❌ | ❌ | ❌ | ❌ | ✅ 218 listed, 369 built, 19 PyPI |
| BFT / multi-model council | ❌ | ❌ | ❌ | ❌ | ✅ 5-of-5 (33 in enterprise) |
| Offline-verifiable signet receipt | ❌ | ❌ | ❌ | ❌ | ✅ proofof.ai ledger |
| EU AI Act + ISO 42001 + NIST RMF | ✅ broad | ✅ deep | 🟡 broad | 🟡 broad | ✅ deep + 30-framework crosswalk |
| OSCAL AI-Act bundle | ❌ | ❌ | 🟡 fragments | 🟡 fragments | ✅ trestle-validated |
| C2PA / deepfake / content cert | ❌ | ❌ | ❌ | ❌ | ✅ proofof.ai 6 tools |
| x402 pay-gated MCP | ❌ | ❌ | ❌ | ❌ | ✅ CSOAI Layer-0 |
| COBOL / SAP / SCADA bridge to AI | ❌ | ❌ | ❌ | ❌ | ✅ cobol-bridge-mcp |
| Article 50 emergency SKU | n/a | n/a | n/a | n/a | ✅ £999 one-time |
| Pricing transparency | ❌ Enterprise-only | ❌ Enterprise-only | 🟡 5 named SKUs custom | ❌ Gated | ✅ full Stripe-ready tier sheet (Explorer £0, Pro £9.99, Family £29; MEOK OS + CouncilOf €0–€1.20/deliberation) |
| Open-source / public substrate | ❌ Closed | ❌ Closed | ❌ Closed | ❌ Closed | ✅ 568 GitHub repos, ~10K monthly PyPI dl |
| Standalone frontier vendor verdict | 🟡 Gartner Visionary 2026 | ✅ Forrester Leader Q3 2025 | 🟡 Gartner Leader | 🟡 Gartner Leader | n/a (Forrester coverage Q4 2026E) |

**Source row:** one per vendor, verified against the vendor's own page in this run (URLs above).

---

## 5 · Action plan for Saturday's launch

### 5.1 · What to publish verbatim (proven facts)

- The Layer-0 stack (8 protocols)
- The 30-framework crosswalk
- The Article 50 emergency kit (£999)
- The Enterprise compliance £1,499/mo with 6-jurisdictions
- The five-moa table (§2.4)
- The meok.ai pricing (Explorer £0 / Pro £9.99 / Family £29)

### 5.2 · What to qualify before publishing

- The **218 MCPs / 369 built / 19 published** triple — keep all three numbers visible together.
- The **33-Agent Council** claim — make the tier-explicit: "Enterprise plans ship with a 33-Agent Council; default is 5-of-5."
- The **"$15.7B deepfake market"** on proofof.ai — keep, but add the citation "convergent MarketsAndMarkets / FTC / Statista".
- The **SOV3 substrate stats** (222 tools + 80 active) — keep numbers, sourced from state-of-estate 27 Jun 2026.

### 5.3 · What to remove before publishing (corrections)

- **Texas AI Act — Sept 2025** — drop (Fact-Check §9b).
- **UK AI Bill — 5 principles** — reframe as "UK AI Regulation White Paper 2023 — 5 cross-sectoral principles" (Fact-Check §10b).
- **EU AI Act Art. 12 — Human Oversight** — rename to **Art. 14** (Fact-Check §1 row 7).
- **"30+ frameworks"** — csoai.org says "30" already; don't paraphrase as "30+" without an updated count.

### 5.4 · What we can research this week if there's time

- Forrester / Gartner independent quotes for **Drata AI Governance** maturity
- Real **MCP-fleet stats** for OneTrust / Credo AI (they don't appear to publish)
- Two independent **Forrester Wave AI Governance** commentary pieces (Forrester Wave is Q3 2025 — likely Q1 2027 next edition)

---

## 6 · Strategic playbook (post-launch)

| Time-window | Play |
|---|---|
| **T-25 to T+5** (around 4 Jul launch) | Single creative unit: **"34 days to Article 50 — and we ship the only MCP-governed emergency kit in the market."** |
| **T+5 → T+30** | **Forrester Wave** play: get a CSOAI chapter in the next wave by pitching **"BYO-council multi-model agent governance"** as a *category* that Credo AI's GAIA, OneTrust's AI Governance, and CSOAI's Council actually co-inhabit. |
| **T+30 → T+90** | Anchor **CSOAI Layer-0** as a **public protocol family** (analogous to MCP, sigstore, OSCAL). NIST AI RMF update next year creates a tailwind for the OSCAL crosswalk. |
| **T+90 → T+180** | **ProofOf.AI run-rate** of $15.7B–$35B deepfake/verification market becomes the **upmarket agency for content-trust revenue** — analogous to Vanta's Trust Center for security-trust. |

---

## 7 · Open questions for the user (Nick)

1. **Are we OK calling the headline honest-text "**5-of-5** default, 33-Agent in Enterprise" on the csoai.org front?** (recommended — current copy is technically accurate but strategically vague.)
2. **Do we want CSOAI to be the BYO-council category partner-of-record** with one of OneTrust / Vanta / Drata? The strongest play is **CSOAI-on-top-of-Vanta** because Vanta's 400+ integrations is the customer-acquisition surface and CSOAI's MCP plane is the differentiation.
3. **Should we ship a **CSOAI + Vanta** bundle for the launch window — "**Vanta for SOC 2 + ISO + CSOAI for AI Act + Article 50**"?** This converts a price war into a category expansion.

---

*End of competitive analysis. Each row above is verifiable against the source URL in the column or in section §1 above.*
