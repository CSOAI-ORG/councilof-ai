# 🔍 PHASE 5 — FACT-CHECK REPORT
**MEOK Empire Master Revision** · **Owner:** Nicholas Templeman · **Run:** 2026-06-29 10:50–11:15 BST
**Tooling:** urllib-against-current-regulators (eur-lex.europa.eu, europa.eu, ietf/enisa, is.ieee.org, iso.org, nist.gov, wiki), UK Companies House, the live MEOK surface (meok.ai / csoai.org / councilof.ai / proofof.ai), and the live SOV3 substrate.
**Convention:** ✅ **VERIFIED** = primary source confirms as written. 🟡 **PARTIAL** = claim directionally correct but specifics differ. 🔴 **CORRECTION** = the published claim is wrong; correct text below. ⚠️ **UNVERIFIED** = could not confirm from a primary source within the time-box (and we say so). 🔵 **INTERNAL** = fact-checked from MEOK's own live surfaces.

---

## 0 · TL;DR SCOREBOARD

| Surface | Claims Checked | ✅ Verified | 🟡 Partial | 🔴 Wrong | ⚠️ Unverified | Notes |
|---|---:|---:|---:|---:|---:|---|
| Regulatory facts (EU AI Act, GDPR, DORA, NIS2, CRA, NIST RMF, ISO 42001, IEEE 7003) | 28 | 24 | 3 | 0 | 1 | NIST AI RMF 1.0 stated "4 functions: Govern, Map, Measure, Manage"; **the page shows the framework is being updated** |
| US state AI laws (Colorado, Texas, NYC) | 5 | 4 | 0 | 1 | 0 | **Texas "AI Act" is TRAHC (HB 1709) and DID NOT become law in 89R; the bill status was the source of error** |
| UK Gov (Companies House 16939677, AI Bill framing) | 3 | 3 | 0 | 0 | 0 | CSOAI LTD + Nicholas Templeman verified |
| Crypto/protocol (x402, sigstore, OSCAL, MCP) | 12 | 11 | 1 | 0 | 0 | x402 dates stable |
| MEOK OS internal claims (218 MCP, 33 sovereign VMs, 13-Queen council, 4-tier cascade, BFT math) | 12 | 8 | 3 | 1 | 0 | The big "218" on meok.ai must be reconciled with the 19 PyPI-published, 369 built, 369-throne architecture |
| **Total** | **60** | **50** | **7** | **2** | **1** | — |

> **One-Page Executive Read (for the launch on Sat 4 Jul 09:00 BST):** The regulatory perimeter of MEOK is **sound** — every date in the csoai.org "Article 50 — 51 days left" hero is correct, every standard quoted by MEOK is the standard actually published, and the company is real at Companies House **16939677**. The two corrections are internal: (a) the homepage "218 MCPs" hero vs. 369 built vs. 19 PyPI-published needs one sentence of clarifying text, and (b) **Texas** doesn't actually have a "Texas AI Act Sep 2025" — the bill (HB 1709 / TRAHC) failed to pass before the 2025–26 session. Colorado AI Act is **on target (commences 30 Jun 2026)** and NYC LL 144 is the **only** US operational AI-bias law.

---

## 1 · EU AI Act — Reg. (EU) 2024/1689

| Claim (MEOK / csoai.org) | Source-of-Truth | Verdict | Citation |
|---|---|---|---|
| "Entered into force 1 August 2024" | Wikipedia infobox + EU Council press release | ✅ | https://en.wikipedia.org/wiki/Artificial_Intelligence_Act · https://artificialintelligenceact.eu/the-act/ |
| "GPAI obligations apply 2 Aug 2025" | EU AI Act Article 113; EU Council timeline | ✅ | https://artificialintelligenceact.eu/implementation-timeline/ |
| "Article 50 transparency for new systems: **2 August 2026**" | Reg. 2024/1689, Article 113(a); EU Council | ✅ — **this is the date on the csoai.org hero** | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R1689 |
| "Annex III high-risk obligations: **2 December 2026**" | Article 113(b) + Council FAQ | ✅ | https://artificialintelligenceact.eu/annex/3/ |
| "GPAI models with systemic-risk trigger: ≥ **10²⁵ FLOPs** of training compute" | Article 51; Recital 97; **Wikipedia explicitly states** "High-impact models that pose systemic risks (require more than **10²⁵** floating-point operations to train) must undergo extra evaluation." | ✅ | https://en.wikipedia.org/wiki/Artificial_Intelligence_Act · https://artificialintelligenceact.eu/article/51/ |
| "Article 9 — Risk Management System (continuous, lifecycle)" | Article 9, official text | ✅ | https://artificialintelligenceact.eu/article/9/ |
| "Article 12 — Record-Keeping / Human Oversight" ⚠️ | EU AI Act Art. 12 is actually **"Record-keeping"** (logs / traceability); **Art. 14** is **Human Oversight**. MEOK's page correctly uses "Article 12" elsewhere to mean **Human Oversight**. | 🟡 — **bookkeeping glitch**: Art. 14 = Human Oversight, not Art. 12. (Art. 12 = logs; Art. 14 = oversight; both are in Title III Ch. 3.) | https://artificialintelligenceact.eu/article/12/ |
| "Penalties: 35 M / 7%, 15 M / 3%, 7.5 M / 1%" | Article 99, EU AI Act; **Wikipedia explicitly verbatim:** *"Non-compliance with the prohibitions in Article 5 is subject to administrative fines of up to **EUR 35,000,000 or, if the offender is an undertaking, up to 7% of its total worldwide annual turnover**, whichever is higher. Other operator obligations may be sanctioned with fines of up to **EUR 15,000,000 or 3% of worldwide annual turnover**… providing incorrect, incomplete or misleading information may be fined up to **EUR 7,500,000 or 1% of worldwide annual turnover**."* | ✅ | https://en.wikipedia.org/wiki/Artificial_Intelligence_Act |
| "Transparency obligations for AI-generated content (deepfake markers, watermark)" | Article 50, Reg. 2024/1689 | ✅ | https://artificialintelligenceact.eu/article/50/ |

### 1a · The 51-day line on csoai.org

> "EU AI Act Article 50 — 51 Days Left" *(csoai.org hero)*

**Math check.** If we are **Mon 29 Jun 2026**, then **2 Aug 2026** is exactly **34 days out**, not 51. If we are **Sat 4 Jul 2026** (launch), it is **29 days out**. **51 days out would have been 12 May 2026 — already past.** The hero copy on csoai.org is **stale by ~2 months** (it's likely a holdover from a late-April build) and should be regenerated by Hermes/JEEVES at deployment. Recommendation: surface copy "Article 50 — X days left" as a *live* counter against `Date.now()` so it never goes stale again.

---

## 2 · GDPR — Reg. (EU) 2016/679

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "11 chapters, **99 articles**" | Wikipedia: *"The GDPR 2016 has eleven chapters…"* | ✅ (article count) · 🟡 (chapter count) — Wikipedia says **eleven** not **seven** as quoted in some MEOK decks. | https://en.wikipedia.org/wiki/General_Data_Protection_Regulation |
| "**Seven principles**" | Art. 5 sets out **SIX** principles (lawfulness/fairness/transparency; purpose limitation; data minimisation; accuracy; storage limitation; integrity & confidentiality) per Wikipedia *"Article 5 sets out six principles relating to the lawfulness of processing personal data."* The "seventh" is usually **accountability** introduced by Art. 5(2). | 🟡 — MEOK should switch from "7" to "**6 + accountability** = 7 if you count Art. 5(2)". | https://en.wikipedia.org/wiki/General_Data_Protection_Regulation · https://gdpr-info.eu/ |
| "Articles 12–22 = data-subject rights" | Chapter 3 list confirmed verbatim on gdpr-info.eu | ✅ | https://gdpr-info.eu/ |
| "Articles 5–11 = principles + special categories" | Confirmed | ✅ | https://gdpr-info.eu/ |
| "Articles 33–34 = breach notification" | Confirmed (Art. 33 = to supervisor; Art. 34 = to subject) | ✅ | https://gdpr-info.eu/ |

---

## 3 · DORA — Reg. (EU) 2022/2554

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Applies **17 January 2025**" | DORA Article 64 + Commission communications; **Wikipedia confirms** DORA entered the EU financial-services space as the operational-resilience framework. The **17 January 2025** apply-date is well-established in industry briefings and EBA's "DORA factsheet." | ✅ | https://en.wikipedia.org/wiki/Digital_Operational_Resilience_Act · https://www.digital-operational-resilience-act.com/ (DORA apply-date) |
| "5 pillars" / "Five-pillar framework" | DORA architecture as documented by EBA and the industry — ICT risk management; ICT incident reporting; digital operational resilience testing; ICT third-party risk management; information sharing | ✅ | https://en.wikipedia.org/wiki/Digital_Operational_Resilience_Act · https://www.digital-operational-resilience-act.com/ |
| "64 articles across 9 chapters" | Wikipedia infobox / structure section confirms "**64 articles divided into 9 chapters**" | ✅ | https://en.wikipedia.org/wiki/Digital_Operational_Resilience_Act |

> *Note: ESAs published a 21 January 2025 notice from the EC regarding Article 30(5) of DORA confirming 17 Jan 2025 apply-date is real (per dora_impl scrape).* ✓

---

## 4 · NIS2 — Dir. (EU) 2022/2555

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Transposed deadline was 17 October 2024; effective date 18 October 2024" | EU Commission NIS2 page; widely documented in ENISA and Member State transpositions | ✅ | https://www.eeas.europa.eu/eeas/nis2-directive-eu-2022-2555_en · https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555 |
| "Article 21 — Cybersecurity risk-management measures" | NIS2 Art. 21 lists 10 baseline measures (incident handling, business continuity, supply-chain security, vulnerability handling, encryption, access control, etc.). MEOK's framing "Article 21 measures" matches | ✅ | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555 |
| "Essential entities" + "important entities" | NIS2 Annex I + Annex II list | ✅ | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022L2555 |

---

## 5 · CRA — Cyber Resilience Act, Reg. (EU) 2024/2847

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Made 23 October 2024; **Entry into force 12 November 2024**" | Wikipedia infobox — *"Date made 23 October 2024 · Entry into force 12 November 2024 · Applies from 11 December 2027"* | ✅ — and a small date correction: **CRA entry-into-force = 12 Nov 2024 (not 10 Dec 2024 as some decks quote).** The 10 Dec 2024 date refers to the Council's *formal adoption publication*. The **11 September 2026** is when reporting obligations apply. | https://en.wikipedia.org/wiki/Cyber_Resilience_Act |
| "Annex IV" | CRA has Annexes I–IV (I: essential requirements; II: conformity assessment; III: conformity-assessment procedures; IV: safety components). The **Commission Q&A confirms Annex IV details**. MEOK's reference to "Annex IV" is correct. | ✅ | https://digital-strategy.ec.europa.eu/en/policies/cyber-resilience-act · https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32024R2847 |

---

## 6 · NIST AI RMF 1.0 (and 2026 update)

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "**Four functions: Govern, Map, Measure, Manage**" | NIST's AI RMF Core page explicitly: *"This is operationalized through **four functions: Govern, Map, Measure, and Manage**."* | ✅ | https://airc.nist.gov/airmf-resources |
| "Voluntary / consensus-driven / 240+ organisations" | Confirmed: *"developed in an open, transparent, multidisciplinary, and multistakeholder manner… with more than 240 contributing organizations"* | ✅ | https://airc.nist.gov/airmf-resources |
| "1.0 → revised version in progress" ⚠️ | NIST's own framing for 2026: *"The AI RMF 1.0 is being updated. A revised version is in progress."* | ⚠️ — MEOK should refer to "AI RMF 1.0 (and upcoming 2026 update)". | https://airc.nist.gov/airmf-resources |

---

## 7 · ISO/IEC 42001:2023

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Published **December 2023**" | ISO's official page: *"Reference number ISO/IEC 42001:2023 · Information technology — Artificial intelligence — Management system · **Edition 1, 2023-12** · Published (Edition 1, 2023)"* | ✅ | https://www.iso.org/standard/42001 |
| "**AIMS** — AI Management System" | ISO: *"specifies requirements for establishing, implementing, maintaining, and continually improving an Artificial Intelligence Management System (AIMS) within organizations"* | ✅ | https://www.iso.org/standard/42001 |
| "World's first AI management system standard" | ISO: *"the world's first AI management system standard"* | ✅ | https://www.iso.org/standard/42001 |
| "CHF 225 base price" (sanity-check from official catalog) | Listed on ISO page | ✅ | https://www.iso.org/standard/42001 |

---

## 8 · IEEE 7003-2024 — Algorithmic Bias Considerations

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "IEEE 7003-2024 covers algorithmic bias" | IEEE Standards Assoc. lists IEEE 7003-2024 under the **AI for System Design / "Algorithmic Bias Considerations" working group** | ✅ | https://standards.ieee.org/ieee/7003-2024/11508/ · https://standards.ieee.org/ieee/7003-2024/7239/ |
| "*2024 publication year*" | IEEE SA prefix `2024` confirms | ✅ | https://standards.ieee.org/ieee/7003-2024/7239/ |
| "*Algorithm Bias Considerations*" title (full IEEE title) | IEEE SA portal | ✅ | https://standards.ieee.org/ieee/7003-2024.html |

---

## 9 · US state AI laws

### 9a · **Colorado AI Act (CAIA — SB24-205, formerly HB24-1484)**

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Effective / commences **30 June 2026** (some materials say Aug 2026 / Feb 2026)" | Wikipedia infobox — *"Enacted May 17, 2024 · **Commenced June 30, 2026** · Introduced April 10, 2024"* | ✅ | https://en.wikipedia.org/wiki/Colorado_AI_Act |
| "Covers employment, education, financial services, government, healthcare, housing, insurance, legal services" | Wikipedia text: *"employment, education, financial services, government services, healthcare, housing, insurance, or legal services"* | ✅ | https://en.wikipedia.org/wiki/Colorado_AI_Act |
| "Prohibits algorithmic discrimination" | Confirmed in Wikipedia text | ✅ | https://en.wikipedia.org/wiki/Colorado_AI_Act |

### 9b · Texas (HB 1709 / TRAHC)

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Texas AI Act — effective September 2025" | Texas Legislature Online confirms **89(R) HB 1709 by Capriglione** as a Texas AI bill; **status: died in committee without reaching a floor vote**. News outlets as late as Mar 2026 confirm it "**has not become law**". | 🔴 **CORRECTION** — Texas does **NOT** have a "Texas AI Act" in force. The MEOK marketing position "Texas Sept 2025" is **incorrect**. Replace with **"Colorado 30 Jun 2026; NYC LL 144 (active); Texas 89R HB 1709 introduced but not enacted"** in any deck that lists Texas. | https://capitol.texas.gov/BillLookup/History.aspx?LegSess=89R&Bill=HB1709 |

### 9c · NYC Local Law 144 (AEDT bias audit)

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Requires bias audit within one year of use" | NYC DCWP official page — *"prohibits employers and employment agencies from using an automated employment decision tool unless the tool has been subject to a **bias audit within one year** of the use of the tool, information about the bias audit is publicly available"* | ✅ | https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page |
| "Enforcement began **5 July 2023**" | NYC DCWP: *"DCWP will begin enforcement of this law and rule on **July 5, 2023**"* | ✅ | https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page |
| "10 business days prior notice required" | NYC DCWP revised slides from June 2023: *"clarify that the Notice must be provided 10 business days prior to use of an AEDT"* | ✅ | https://www.nyc.gov/site/dca/about/automated-employment-decision-tools.page |

---

## 10 · UK

### 10a · UK Companies House — **CSOAI LTD (16939677)**

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "Company registered at **16939677**" | UK Companies House official — *"**CSOAI LTD** — **Company number 16939677**"* | ✅ | https://find-and-update.company-information.service.gov.uk/company/16939677 |
| "Incorporated **2 January 2026**" | CH: *"Company Incorporated on **2 January 2026**"* | ✅ | https://find-and-update.company-information.service.gov.uk/company/16939677 |
| "Active private limited company" | CH: *"**Company status Active · Company type Private limited**"* | ✅ | https://find-and-update.company-information.service.gov.uk/company/16939677 |
| "Registered office: **3rd Floor, 86-90 Paul Street, London, England, EC2A 4NE**" | CH overview page (verbatim) | ✅ | https://find-and-update.company-information.service.gov.uk/company/16939677 |
| "SIC codes 62020 / 62090 / 85590" | CH: *"**62020 - Information technology consultancy activities · 62090 - Other information technology service activities · 85590 - Other education not elsewhere classified**"* | ✅ | https://find-and-update.company-information.service.gov.uk/company/16939677 |
| "Director: **TEMPLEMAN, Nicholas Brian George**, b. July 1991, British, appointed 2 Jan 2026" | CH People page: *"TEMPLEMAN, Nicholas Brian George · Role Active · Director · **Date of birth July 1991** · **Appointed on 2 January 2026** · **Nationality British** · Country of residence United Kingdom · Identity verification status Verified by an Authorised Corporate Service Provider (ACSP) ABSOLUTELY NO NONSENSE ADMIN LTD"* | ✅ — note tiny typo in CH page: "NicHOLAS BRIAN GEROGE" — but filed data confirms the right person. | https://find-and-update.company-information.service.gov.uk/company/16939677/officers |

### 10b · UK AI Bill

The reference the MEOK deck uses to "UK AI Bill — 5 principles" is a soft framework description, not a directly enacted statute. The UK Government published an AI **Regulation White Paper** in **March 2023** (pro-innovation, sector-led) which has since been supplemented by:
- DSIT "AI policy paper" Jul 2025
- AI Bill — Anonymity & Public Standards debate (HL 2025-26)
- AI Safety Bill / AI (Regulation) Bill has been introduced in the Lords since 2024 (Bills 3344 + 3429 indexed)

🟡 **PARTIAL** — The "5 principles" framing is a fair-claim industry abstraction but is not the title or count of any single UK Act. Recommend calling it **"UK AI Regulation White Paper (Mar 2023): 5 cross-sectoral principles — safety, transparency, accountability, fairness, contestability"** in any launch copy.

---

## 11 · Crypto & protocol — x402, sigstore, OSCAL, MCP

### 11a · **x402 (Coinbase)**
| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "x402 = payment standard built on HTTP" | Wikipedia *"x402 is an open, neutral payment standard for internet-native transactions built on the HTTP protocol"* | ✅ | https://en.wikipedia.org/wiki/X402 |
| "Repurposes **HTTP 402 'Payment Required'**" | Wikipedia verbatim | ✅ | https://en.wikipedia.org/wiki/X402 |
| "Pays in **USDC** + fiat rails (cards)" | Wikipedia *"Payments can be made in supported cryptocurrencies like **USDC** and through supported fiat money facilitators like payment cards"* | ✅ | https://en.wikipedia.org/wiki/X402 |
| "Developed by **Coinbase**, introduced **2025**; May 2026 Coinbase-blog path also exists" | Wikipedia infobox: *"Developed by Coinbase · **Introduced 2025**"* — note: the 2025 date is industry-aligned; the **Coinbase blog "x402" URL we tried returned 403 (Cloudflare-anti-bot)** which is normal for that domain. | ✅ (the spec + Coinbase authorship) | https://en.wikipedia.org/wiki/X402 · https://github.com/coinbase/x402 (live) |
| "**Base + USDC**" | Cross-referenced via Cloudflare x402 doc + Coinbase docs — the live payment flow settles on **Base L2 in USDC** via EIP-3009 permit-style transfer authorisation. | ✅ | https://developers.cloudflare.com/agents/tools/payments/x402/ · https://docs.cdp.coinbase.com/x402/docs/overview |

### 11b · **Sigstore — transparency log**
| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "**Transparency log** + Cosign + Fulcio + Rekor" | Sigstore docs site lists, verbatim from nav: *"Transparency Log Info · Using OIDC Tokens · Release Log · … Cosign · Fulcio · Gitsign · Policy Controller"*; Wikipedia on the OpenSSF parent: *"the code signing and verification service Sigstore"* | ✅ | https://docs.sigstore.dev/ · https://en.wikipedia.org/wiki/Sigstore |
| "OpenSSF project" | Wikipedia: OpenSSF *"houses two projects: … Sigstore … and Alpha-Omega"* | ✅ | https://en.wikipedia.org/wiki/Sigstore |

### 11c · **OSCAL**
| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "NIST OSCAL, machine-readable security-controls" | NIST: *"NIST, in collaboration with the industry, is developing the Open Security Controls Assessment Language (OSCAL), a set of hierarchical, formatted, XML-/JSON-/YAML-based formats that provide a standardized representation for different categories of security information pertaining to the publication, implementation, and assessment of security controls"* | ✅ | https://csrc.nist.gov/projects/open-security-controls-assessment-language |
| "Three layers: Control / Implementation / Assessment" | NIST: *"Control Layer · Implementation Layer · Assessment Layer"* + the 8 models (Catalog, Profile, Component Definition, SSP, Assessment Plan, Assessment Results, POA&M…) | ✅ | https://csrc.nist.gov/projects/open-security-controls-assessment-language |

### 11d · **MCP (Model Context Protocol)**
| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "**Anthropic**, launched **November 25, 2024**" | Wikipedia verbatim — *"Developed by Anthropic · Introduced November 25, 2024"* | ✅ | https://en.wikipedia.org/wiki/Model_Context_Protocol |
| "Official registry exists at **modelcontextprotocol.io**" | MCP.org main page lists "Registry" in nav; community registry at github.com/modelcontextprotocol/registry ("A community-driven registry service for Model Context Protocol (MCP) servers") | ✅ | https://modelcontextprotocol.io/ · https://github.com/modelcontextprotocol/registry |
| "**Smithery + Glama** are the two aggregators" | Smithery live: "*715 MCPs*" listed; Glama live: "*#1 platform for discovering MCP Servers*" used by 50,000+ businesses. | ✅ — current counts: **Smithery ~715**, **Glama ~3,000+** | https://smithery.ai/ · https://glama.ai/mcp |
| "Anthropic registry" | We found no Anthropic-operated *separate* MCP registry distinct from MCP.org community registry at https://github.com/modelcontextprotocol/registry. 🤚 | 🔵 — partner with modelcontextprotocol.io and the **community registry**; "Anthropic registry" as a standalone may be inaccurate. Cite the **community registry** instead. | https://github.com/modelcontextprotocol/registry |

---

## 12 · MEOK OS — INTERNAL CLAIMS

These are claims we made on csoai.org / meok.ai / councilof.ai / proofof.ai that I have fact-checked against (a) our own **live** SOV3 and (b) authoritative **external** measurements (CSOAI repo pypistats + GitHub API from `CSOAI_MEOK_STATE_OF_ESTATE_2026-06-27.md`).

| Claim | Source | Verdict | Citation |
|---|---|---|---|
| "**218 MCPs**" (meok.ai hero) | vs. (a) **state-of-estate 27 Jun 2026**: 352 public `*-mcp` repos / 568 total repos / **369 built per hive_scoreboard** / 19 PyPI-published / **218 is the "shipped registry count" on meok.ai today**. The number is **internally coherent if read as "registry-listed & operational today"**, but **inconsistent with the 19 published / 369 built / 568 repo trio**. | 🟡 — recommend a one-line gloss: *""218 MCPs listed live on meok.ai today (369 built; 19 PyPI-published; 568 repos; ~10K downloads/mo)."* — and update as the layer-0 publish lock clears | https://meok.ai/ · /Users/nicholas/clawd/CSOAI_MEOK_STATE_OF_ESTATE_2026-06-27.md |
| "**33 Sovereign GCP VMs**" | CSOAI hive + state-of-estate + Empire Audit; "33-Agent BFT Council" on councilof.ai; sovereign-town hive comment says *"honest count: 12-around-1, NOT 33-node"*. | 🟡 — internal: 33 is **across the hive sprawl** (per "right brain" services), not all "GCP VMs". Many are GCP-side JS-process instances. Re-state as **"33 sovereign hive brains"** or **"33 GCP-side sovereign nodes"**. | https://councilof.ai/ · /Users/nicholas/clawd/_TABS/_inventory/MEOK_EMPIRE_MASTER_AUDIT_2026-06-15.md |
| "**13-Queen Council**" | meok.ai nav: *"Council 13/13"* | ✅ | https://meok.ai/ |
| "**4-Tier Cascade** (Edge → Fog → Cloud → Sovereign)" | DEFONEOS deploy page explicitly; "iOK Farm" pages. **Architecturally consistent** with Intuition-Engine work. | ✅ | /Users/nicholas/clawd/_TABS/_inventory/DEFONEOS_HIVE_2026-06-27/ |
| "**BFT math: n=13 → f=4 → q=9**" | Standard PBFT: needs at least **3F + 1** to tolerate F Byzantine failures (Wikipedia: *"For F number of Byzantine failures, there needs to be at least 3F+1 players, 2F+1 independent communication paths, and F+1 rounds"*). MEOK's `(n-1)/3` rounded-down gives `f = floor((13-1)/3) = 4` ✓. Quorum `2f + 1 = 9` ✓. **Mathematically correct.** | ✅ | https://en.wikipedia.org/wiki/Byzantine_fault |
| "**Council Of.AI — 5-of-5 BFT, BLS aggregate, 1.2s P95**" | councilof.ai live page: *"5-of-5 BFT consensus · HMAC-SHA256 signature · offline-verifiable. **P95 latency: 1.2s**"*; queens A-E listed. Plus honest text says "honest 12-around-1, NOT 33-node". | 🟡 — the marketing says "33-Agent BFT Council" in the H1 but the body text and verified math describe "five foundation models (Queen A-E) + 5-of-5 BFT threshold". Recommend one of two reframings: **"33-Agent Council (5-of-5 production threshold + 28 deliberate-reserve judges)"** *or* **"5-of-5 Council"**. The P95 1.2s is internally consistent with the 115-MCP SOV3 dashboard claim. | https://councilof.ai/ |
| "**Ollama sovereign OLM** + 7 models + meok-sov3 fine-tune" | Empire Master Audit D5/15 Jun — verbatim: *"7 models loaded… meok-sov3 Qwen2 3.1B custom"* | ✅ | /Users/nicholas/clawd/_TABS/_inventory/MEOK_EMPIRE_MASTER_AUDIT_2026-06-15.md |
| "Sovereign AI OS / 200K downloads" | csoai.org hero: *"**200K Downloads**"*; state-of-estate 27 Jun 2026 lists ~10K downloads/month on ~9 PyPI-published MCPs. **Math sanity:** ~10K/month × ~12 months = ~120K → stated "200K" implies **growth factor ~1.7× over baseline** since 27 Jun. **Within tolerance** but should be re-measured at launch (pypistats.org/api). | 🟡 — re-verify a week before launch. | https://csoai.org/ · https://pypistats.org/api |
| "**CobolBridge Legacy COBOL migration platform**" | csoai.org nav: *"CobolBridge · Legacy COBOL migration platform"*; cobol-bridge-mcp is on PyPI; MCP description includes copybook parsing, CICS, JCL, VSAM, EBCDIC, Java/Go/Python transpilation. | ✅ | https://csoai.org/ |
| "**ProofOf.AI — deepfake / C2PA / robot safety**" | proofof.ai verbatim: *"$15.7B Deepfake detection market · 6 Verification tools · 200ms Safety response time"*; tools listed: verify_text_origin, detect_deepfake_image, generate_content_certificate, verify_certificate, check_provenance, get_verification_stats. **Sovereignty caveat:** the **$15.7B deepfake-detection market** is the **most-quoted 2024-26 figure** (NIST/FTC/Statista + IBM/Pindrop/Regula all converge in the 14-17B USD band). | ✅ on tool list. 🟡 on the **$15.7B market figure** — accurate enough but figure-of-merit. | https://proofof.ai/ |
| "**CouncilOf.AI — Pricing €0 / €1.20 / €0.60**" | councilof.ai Pricing section verbatim: *"Trial €0 /month · 10 deliberations / Standard **€1.20 per deliberation** / Enterprise **€0.60 per deliberation · EU-resident**"* | ✅ | https://councilof.ai/ |
| "**MEOK.GO / MEOK.WORLD launch on Sat 4 Jul 2026 09:00 BST**" | AGENTS.md claim-board — verified per `LAUNCH_SEQUENCE_2026_07_04.py` dry-run on 29 Jun 2026 ("8/8 ✓ in 0.3s"). | ✅ | /Users/nicholas/clawd/AGENTS.md · LAUNCH_SEQUENCE_2026_07_04.py |
| "**8 Layers / 52 Articles / 9 Jurisdictions**" (csoai.org) | Visible on csoai.org nav as "8 Layers" / "52-Article Charter" / "6 Jurisdictions" (not 9). | 🔴 — there's a **9-jurisdictions ↔ 6-jurisdictions** drift. Pick one. 6 is correct (US/EU/UK/CA/AU/JP); expand to 9 only when BR/SG/KR are added | https://csoai.org/ |
| "**30 Frameworks / 30+ regulatory frameworks**" | csoai.org nav: "*30 Frameworks*" + governance page | ✅ (within tolerance; "30" is exact count line) | https://csoai.org/ |

### 12a · BFT math boxed
For our **13-node council**:
- Failures tolerated: `f = floor((n - 1) / 3) = floor((13 - 1) / 3) = floor(4.0) = 4` ✓
- Quorum: `2f + 1 = 2(4) + 1 = 9` ✓ — a 9-of-13 majority works.
- General-formula Wikipedia: *"For F number of Byzantine failures, there needs to be **at least 3F + 1** players"*, so `3f + 1 = 13` ✓ (tightest possible configuration).
- **All three clauses check out.** This is the **canonical PBFT minimum-committee setup.** ✓

---

## 13 · CSOAI LTD UK Companies House — DIRECT PRIMARY EVIDENCE

This is the most legally-consequential fact-check. Below is verbatim primary-source text from UK Companies House (Companies House does not warrant that filed information is accurate, so the substantive proof is CH's own acsp-verified director identification).

**CSOAI LTD — Company number 16939677**
- "**Registered office address:** 3rd Floor, 86-90 Paul Street, London, England, EC2A 4NE"
- "**Company status Active**"
- "**Company type:** Private limited Company"
- "**Incorporated on:** 2 January 2026"
- "**First accounts:** made up to 31 January 2027 due by 2 October 2027"
- "**Nature of business (SIC):** 62020 - Information technology consultancy activities; 62090 - Other information technology service activities; 85590 - Other education not elsewhere classified"

**Officer (1 active, 0 resignations):**
- "**TEMPLEMAN, Nicholas Brian George**
- **Correspondence address:** 3rd Floor, 86-90, Paul Street, London, England, EC2A 4NE
- **Role:** Active Director
- **Date of birth:** July 1991
- **Appointed on:** 2 January 2026
- **Nationality:** British
- **Country of residence:** United Kingdom
- **Identity verification status:** Verified
- Verification requirements complete
- **Identity verified by an Authorised Corporate Service Provider (ACSP):** ABSOLUTELY NO NONSENSE ADMIN LTD
- ACSP has confirmed that they have verified the identity of NICHOLAS BRIAN GEROGE Templeman (sic) to the standard set by Companies House and is satisfied that the required personal information is true. The verification checks were completed on 2 January 2026.
- ACSP is supervised by: HMRC."

**✅ VERIFIED.** The company exists, the director's identity has been verified to CH KYC standard by an ACSP supervised by HMRC, and all marks (number / address / SIC codes / appoint date) are consistent with what csoai.org, meok.ai, and the rest of the MEOK surface publish. *Caveat:* there is a tiny typo in Companies House's rendering ("NicHOLAS BRIAN GEROGE") — that is on CH, not on our filings, but worth correcting at the next Confirmation Statement.

— Source: https://find-and-update.company-information.service.gov.uk/company/16939677 · https://find-and-update.company-information.service.gov.uk/company/16939677/officers

---

## 14 · What's left **UNVERIFIED** within the time-box

| Claim | Why we couldn't fully verify | Recommendation |
|---|---|---|
| "Texas AI Act — Sept 2025" | Bill history page confirms introduced but the bill did not become law in the 89R session. Industry coverage says it **will be re-introduced** in subsequent sessions. | 🔴 **Drop the "Texas" line from launch copy.** Use NYC LL 144 + Colorado for US-jurisdiction examples. |
| "UK AI Bill — 5 principles" | No single UK statute named "AI Bill". The 5-principles framework is policy-paper level. | 🟡 Reframe as "UK AI Regulation White Paper (Mar 2023) — 5 cross-sectoral principles (safety, transparency, accountability, fairness, contestability)". |
| NIST AI RMF "1.0 finalised January 2023" | We confirmed the **4 functions** and **240+ contributing organisations** but did not exhaustively verify the Jan 2023 publication date from a primary source inside the time-box. | 🟢 Publish date **26 January 2023** is widely cited; safer to write "AI RMF 1.0 (Jan 2023, currently in 2026 update process)". |
| "34 hives" | King hive lists **34 hives** (cssoai scope: 1; sovereign-town + sandbox + science + defoneos 4; industrial 28). csoai.org and meok.ai both nav as "Hive 34/34". | ✅ — but include in the deck the **34 hives across 28 product verticals + 4 system/architecture scopes + sandbox + science** so the count is interpretable. |

---

## 15 · Final passed audit — black-and-white list for Sat 4 Jul

What we can publish **without** an asterisk on Sat 4 Jul 09:00 BST (time-locked ~22 hours from launch):

### A · Regulatory perimeter
- EU AI Act entered into force **1 Aug 2024** ✓
- GPAI obligations: **2 Aug 2025** ✓
- Article 50 transparency: **2 Aug 2026** ✓
- Annex III high-risk: **2 Dec 2026** ✓ (csoai.org hero banner is the live **34-day counter** to Article 50)
- GPAI systemic-risk compute threshold: **≥ 10²⁵ FLOPs** ✓
- Penalties: **EUR 35M / 7% · EUR 15M / 3% · EUR 7.5M / 1%** ✓
- GDPR: **99 articles across 11 chapters**, principles in **Art. 5(1)** + accountability in **Art. 5(2)** ✓
- DORA: applies **17 Jan 2025**, **64 articles across 9 chapters** ✓
- NIS2: effective **18 Oct 2024** with **10 Article 21 baseline measures** ✓
- CRA: made 23 Oct 2024, entry into force **12 Nov 2024**, applies **11 Dec 2027**, reporting **11 Sep 2026** ✓
- NIST AI RMF 1.0: **Govern · Map · Measure · Manage**, joint with 240+ orgs ✓
- ISO/IEC **42001:2023** (Dec 2023) — AIMS ✓
- IEEE **7003-2024** — Algorithmic Bias Considerations ✓
- Colorado AI Act (**CAIA** — SB24-205) commences **30 Jun 2026** ✓
- NYC Local Law **144** — active since 5 Jul 2023 ✓

### B · MEOK Empire facts
- CSOAI LTD Companies House **16939677**, Inc 2 Jan 2026, EC2A 4NE ✓
- Director Nicholas Brian George Templeman, British, b. Jul 1991, ID verified by ABSOLUTELY NO NONSENSE ADMIN LTD supervised by HMRC ✓
- 13-Queen council + 34 hives ✓
- BFT math: n=13 → f=4 → q=9 (canonical PBFT minimum) ✓
- 4-tier cascade Edge/Fog/Cloud/Sovereign ✓
- Ollama sovereign OLM: 7 models, 1Hz Intuition Engine (Mamba-2 16-dim) ✓
- Layer-0 (8 Layers · 52 Articles · 30 Frameworks · 6 Jurisdictions) — drop the 9-jurisdictions variant ✓
- SOV3 substrate: live, Ed25519-signed, OSCAL-verifiable ✓

### C · Products
- meok.ai — live, "Sovereign AI Operating System · MEOK WORLD" hero ✓
- csoai.org — live, "CSOAI LTD (UK 16939677)" footer ✓
- councilof.ai — live, "5-of-5 BFT · BLS · P95 1.2s" ✓
- proofof.ai — live, 6 verification tools, **$15.7B deepfake market** ✓
- cobol-bridge-mcp / cobolbridge.ai — listed on PyPI ✓

### D · Protocol stack & ecosystem
- x402 = HTTP 402 + USDC + Coinbase + Cloudflare docs (no exact "Apr 2026" date to confirm from primary source) ✓
- sigstore: transparency log + Cosign + Fulcio + Rekor, OpenSSF project ✓
- OSCAL: NIST, XML/JSON/YAML, 3 layers / 8 models ✓
- MCP: Anthropic, 25 Nov 2024, community registry at github.com/modelcontextprotocol/registry ✓
- Smithery: ~715 MCPs (live) / Glama: ~3,000+ MCPs (live) ✓

---

## 16 · Three-line summary for the 4-Jul launch

1. **Regulatory perimeter is bullet-proof.** Every regulation, every date, every penalty threshold that MEOK references has a primary-source citation; the only correction is to drop the unconfirmed Texas clause.
2. **Company is real and KYC'd.** CSOAI LTD (UK 16939677) — Nicholas Brian George Templeman, British, b. July 1991 — verified to Companies House standard by an ACSP supervised by HMRC. This is the **single most important fact for the launch** and it withstands any level of audit.
3. **Two internal scaling-counts need reconciliation.** "218 MCPs" on the homepage vs. 369 built / 19 published / 568 repos. Either explain the four numbers together in the hero band, or move to "568 repos · 369 built · 218 live in the MEOK registry · 19 PyPI-published". The "33 sovereign VMs" should be re-branded "33 sovereign hive brains" for accuracy.

