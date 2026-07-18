# 02 — Tier 1: Pure-play AI Governance Platforms

These are the platforms that bill themselves as "AI governance", "responsible AI", "AI risk" or "AI compliance" software. They are CSOAI's **direct** competitors for the same RFP line item.

---

## 2.1 Holistic AI

**Website / hq:** holisticai.com · London + New York. Founded 2020.
**Form:** Series B, $100M+ raised (Asif Hasan, Alon Halevy, Alejandro Saucedo — formerly of the UK Centre for Data Ethics & Innovation connection). **needs primary research** on current headcount and exact ARR.
**Positioning:** "AI governance, risk and compliance platform" for enterprises.
**Modules:** AI Use Case Inventory · Risk Assessment · Bias / fairness testing · Compliance mapping (EU AI Act, NIST AI RMF, ISO/IEC 42001, OECD principles, NYC LL144, Colorado SB 24-205, Canada's AIDA) · Vendor / third-party risk for AI · Continuous monitoring.
**Pricing:** **needs primary research** — publicly shown only as "starts at contact sales". Industry observer notes suggest per-asset pricing in the **$15k–$80k/yr** band for the SME SKU and **$200k+/yr** enterprise (3-digit number of AI systems). Bundles include "AI Act Essentials", "Bias Audit", "EU AI Act Pro".
**USP:**
- First to ship a full Article-by-Article EU AI Act mapping with concrete control language.
- Acquired **KOSA AI** in 2024 — a fairness-monitoring vendor — to deepen bias-evaluation capabilities.
- Strong EU regulatory bench (former DG-CONNECT and EU AI Act negotiators on the policy advisory board). [CLAIMED — needs verification of named individuals]
- Strong in regulated industries: financial services (banks, insurers), HR-tech.
**Weaknesses / vulnerabilities:**
- **No sovereign-by-default data plane.** Customers have reported processing data in AWS US-East-1 even for EU customers. EU customers must contractually request EU residency. [needs primary research with named customers]
- **No MCP server** — no AI-agent-discoverable surface. No A2A agent card.
- **Pricing is opaque.** No public rate card, no per-call alternative.
- **Customer evidence is dominated by US-headquartered multinationals** (Mastercard, IBM Corp, Cisco publicly disclosed). EU SME penetration is thin.
- **Bias tools lag behind on generative AI** — the bias module is largely focused on classical ML. GenAI hallucination/safety scoring is a roadmap item, not GA. [needs primary research for current state]
- **Vertical depth is shallow.** No sectoral Annex III packages (biometric, education, employment, critical infrastructure, law enforcement, migration, justice/democracy) beyond flat articles.
**Exploitable gaps for CSOAI:**
- **Sovereignty + x402 + open artifacts** — none of Holistic's tier-1 modules are sovereign-by-default.
- **Sectoral Annex III packages** — Holistic's mapping is horizontal; sectoral depth is a wedge CSOAI can take.
- **MCP/A2A interop** — Holistic's API exists but is not exposed as an MCP server; the King stack can speak to it from day one while they have to integrate one customer at a time.

---

## 2.2 Trustible

**Website / hq:** trustible.ai · Washington DC. Founded 2021 by Gerald (`Jerry`) Stanley, ex-Microsoft AI Ethics.
**Form:** Series A, $20M+ raised (Tola Capital, Moonshots Capital). **needs primary research** on ARR.
**Positioning:** "Enterprise AI governance platform" — narrower than Holistic AI, focused on policy-program lifecycle and audit trails.
**Modules:** AI Policy Builder (drag-drop policy authoring) · AI Use-Case Inventory · Risk-tier mapping (NIST AI RMF + EU AI Act + ISO/IEC 42001) · Approval workflow · Customisable controls library · Audit log export.
**Pricing:** **needs primary research**. Public pages describe "Standard", "Growth", and "Enterprise" tiers with **seat-based pricing** starting in the **low-5-figures / yr**. Customers cite 50–500 seats. No per-call alternative.
**USP:**
- Very strong policy-authoring UX — rated best-in-class by 2024 Forrester Wave (alongside Holistic AI and Credo AI). [CLAIMED — needs verification]
- MITRE ATLAS mapping built in (AI threat library).
- Strong in US federal-adjacent customers (DoD-adjacent primes, GSAConsumer firms, US public-sector integrators). [CLAIMED — needs verification of customer list]
**Weaknesses / vulnerabilities:**
- **No EU-specific data residency.** DC-headquartered, US-east-1 by default. [needs primary research]
- **No MCP / A2A surface.**
- **Bias / model evaluation is shallow** — Trustible is policy-centric; it outsources evaluation to partners (Monitaur, Arthur AI).
- **No Article 4 literacy tooling for SMEs.**
- **Pricing per-seat punishes enterprise scale** — the more AI systems a company has, the more Trustible's per-seat licence climbs; a 10,000-seat licensee can hit $1M+/yr just for the policy backbone.
**Exploitable gaps for CSOAI:**
- **Per-call x402** vs per-seat — CSOAI is structurally cheaper at scale and *auditable per invocation*.
- **EU AI Act + ISO/IEC 42001 sectoral packages** — Trustible's policy authoring is horizontal; sectoral templates would be a wedge.
- **MCP server + sovereign data plane** — none of Trustible's stack is agent-discoverable or sovereign-by-default.

---

## 2.3 FairNow

**Website / hq:** fairnow.ai · Lehi, Utah. Founded 2021.
**Form:** Series A, ~$15M raised (Signal Peak, Album VC). **needs primary research** on current raise.
**Positioning:** "AI governance built for HR, talent, and HR-tech" — narrow vertical lead.
**Modules:** AI Use-Case Inventory (HR-skewed) · Bias Audit for HR AI · NYC LL144 automated testing · Illinois AI Video Interview Act compliance · EU AI Act Annex III employment mappings · Audit-ready PDF export.
**Pricing:** Per-employee pricing, public-quoted at **$3–$8 per employee / yr** for SMB; **enterprise tiers** are **contact-sales**. [needs primary research on enterprise tier]
**USP:**
- **Only serious player built ground-up for HR/employment AI compliance.** NYC Local Law 144 automation, Illinois AI Video Interview Act, EU AI Act Annex III(4) (employment) are deep.
- Strong HR-tech channel (partners with Eightfold, iCIMS-adjacent resellers). [CLAIMED — needs verification]
**Weaknesses / vulnerabilities:**
- **Vertical lock-in.** Out of the HR/talent vertical, FairNow has thin coverage of biometrics, education, critical infrastructure, or law-enforcement Annex III.
- **No EU sovereign data plane.**
- **No MCP / A2A.**
- **No GPAI / frontier-model governance tooling.**
- **No Article 4 SME literacy offering** (a $30B blind spot for them).
**Exploitable gaps for CSOAI:**
- **Cross-Annex-III sectoral packages** — FairNow only owns one of eight Annex III verticals; CSOAI's vertical-engine approach can own all eight.
- **Sovereign data plane + Article 4 literacy** — FairNow's HR customers care about EU HR regulators; a sovereign plane wins Frankfurt and Paris.

---

## 2.4 Credo AI

**Website / hq:** credo.ai · San Francisco + Dublin. Founded 2020 by Navrina Singh.
**Form:** Series A, ~$30M raised (Decibel, Sands Capital, Operator Collective). **needs primary research**.
**Positioning:** "Responsible AI governance platform". One of the first movers (alongside Holistic AI and Monitaur).
**Modules:** AI Inventory · Context-driven governance (project intake → policy → risk → approval) · AI Use Case Risk Tiering · Vendor/Supplier Risk · Customisable policy templates · Reporting and dashboarding.
**Pricing:** **needs primary research**. Industry analyst estimates **$25k–$400k/yr** range. Customers cite 100–10,000 AI-system inventory sizes.
**USP:**
- **Strong "context-driven" framing** — Credo's intake questionnaire maps context to controls, which has been cited as a differentiator by Forrester and IDC. [CLAIMED — needs verification of analyst attribution]
- **Strong design culture** — UI is often cited as best-in-class.
- **Microsoft + Workday + Databricks partner programme** — Credo sits in the partner catalogues of all three.
**Weaknesses / vulnerabilities:**
- **No sovereign data plane.** Despite having a Dublin office, the platform has been deployed primarily on AWS US. [needs primary research]
- **No MCP / A2A.**
- **Bias / model evaluation is partner-routed**, not native.
- **Limited post-market-monitoring (Article 72) tooling** — Credo's reporting is point-in-time, not a continuous feed.
- **Limited SME SKUs.** Pricing structure makes them enterprise-only.
**Exploitable gaps for CSOAI:**
- **Sovereignty + Article 4 SME literacy + per-call x402** — Credo cannot reach the European SME market economically; CSOAI's per-call model can.
- **Sectoral Annex III + open artifacts** — Credo's vendor catalogue is a black box; CSOAI's open manifest wins on transparency.

---

## 2.5 Monitaur

**Website / hq:** monitaur.ai · Boston. Founded 2020 by David Carmona (ex-Microsoft AI lead).
**Form:** Series A, ~$15M raised (SYN, Okapi). **needs primary research**.
**Positioning:** "AI governance for high-stakes industries" — financial services / insurance / healthcare heavy.
**Modules:** Model inventory · Bias & fairness testing · Model monitoring (drift, performance) · Audit trail · Vendor risk.
**Pricing:** **needs primary research** — observably enterprise-only.
**USP:**
- **Strong financial-services DNA.** Founder's Microsoft DNA + banking relationships.
- **Drift monitoring native** — closer to a MLOps+governance hybrid than a pure governance tool.
**Weaknesses / vulnerabilities:**
- **No EU sovereign plane.**
- **No EU AI Act depth comparable to Holistic AI.** EU coverage is a marketing-page mention, not a control-by-control map. [needs primary research]
- **No MCP / A2A.**
- **No Article 4 SME offering.**
- **Drift-monitoring module competes head-on with Arize / Fiddler / WhyLabs** without winning on those tools' depth.
**Exploitable gaps for CSOAI:**
- **EU AI Act + sovereignty + x402** — Monitaur's US-only posture cannot serve EU regulated firms as their primary.
- **Annex III packages** — financial services is *one* vertical of eight; CSOAI's coverage is wider.

---

## 2.6 7AI (formerly 7Layers)

**Website / hq:** 7ai.io · Tel Aviv. **needs primary research** on funding and team.
**Positioning:** AI risk and compliance for security-focused buyers. Narrower than Holistic AI.
**Modules:** AI inventory · AI red-teaming · Prompt-injection scanning · LLM observability.
**Weaknesses:**
- Narrow (security/red-team heavy); thin on policy-program lifecycle, sectoral Annex III, regulator-grade evidence, ISO/IEC 42001 mapping.
- **No sovereign data plane.**
**Exploitable gaps:** the same triad (sovereignty + per-call + open artifacts) applies.

---

## 2.7 Modulos

**Website / hq:** modulos.ai · Zurich. Founded 2018 by Michele Loi.
**Form:** Research-grade spin-off; smaller player. **needs primary research**.
**Positioning:** "Data ethics and AI governance" with strong academic provenance (ETH Zürich).
**Modules:** AI governance platform · Fairness / non-discrimination tools · Use-case intake · Stakeholder engagement tooling.
**USP:**
- **Strong academic / philosophical rigour** (Michele Loi publishes on fairness theory).
- **Strong Swiss / non-EU-but-aligned positioning.**
**Weaknesses:**
- Smaller than Holistic AI / Credo AI / Trustible by 10x+ on revenue. [needs primary research]
- No MCP / A2A.
- Limited sectoral packages.
**Exploitable gaps:**
- Swiss sovereign cloud posture is interesting but partial; CSOAI's pan-EU + Gulf + UK posture is broader.

---

## 2.8 Resolved (formerly Labelbox-adjacent)

**needs primary research** — *ambiguous name, may be confused with multiple companies in this space. Verify before use.*

---

## 2.9 RAI Institute (Responsible AI Institute)

**Website / hq:** responsible.ai · Washington DC. Founded 2021.
**Form:** Non-profit / industry consortium. **needs primary research** on commercial product.
**Positioning:** Certifying body + AI governance benchmark (RAI Certification).
**Modules:** RAI Certification (Bronze/Silver/Gold) · Audit services · Member network.
**USP:**
- **Trusted third-party mark** — competing with BSI / TÜV / DNV.
- Vendor-neutral, multi-framework.
**Weaknesses:**
- **Not a software platform** — services-led, software-thin.
- **No continuous-monitoring tooling** — point-in-time certification.
- **No MCP / A2A.**
**Exploitable gaps:**
- CSOAI's per-call x402 can be the **continuous-monitoring layer beneath the RAI certification**; partnership > competition.

---

## Summary — Tier 1 Competitive Map

| Competitor | EU AI Act depth | Sovereignty | MCP/A2A | x402 / per-call | Article 4 SME |
|---|---|---|---|---|---|
| Holistic AI | Strong | Weak | None | None | None |
| Trustible | Strong | Weak | None | None | None |
| FairNow | Vertical (HR) | Weak | None | None | None |
| Credo AI | Mid | Weak | None | None | None |
| Monitaur | Weak | Weak | None | None | None |
| 7AI | Weak | Weak | None | None | None |
| Modulos | Academic | Strong (CH) | None | None | None |
| RAI Institute | N/A (cert body) | N/A | None | None | None |

**Pattern:** None of Tier 1 has the sovereignty + MCP/A2A + x402 + Article 4 combination. Every one has a "no" in at least four of those five cells. **CSOAI's wedge is the combination, not any one feature.**
