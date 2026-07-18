# 05 — Tier 2: Data Catalog & Observability Adjacencies

These platforms govern *data* or *data pipelines*; their AI governance surface is either thin or absent. They compete for the buyer's *data-platform* budget but not (yet) for the AI-governance line item. CSOAI can partner with most of them — and capture the AI governance surface above their data surfaces.

---

## 5.1 Collibra

**Website / hq:** collibra.com · Brussels, Belgium. Founded 2008.
**Form:** Public company (since 2021, ticker CLBR). Reported FY2024 revenue ~$330M (publicly disclosed).
**Positioning:** "Data intelligence platform" — data catalog, data quality, data governance, lineage, AI governance.
**Modules:**
- **Data Catalog** — assets, glossary, business terms.
- **Data Quality & Observability** — rule-based + ML-driven.
- **Data Lineage** — column-level lineage.
- **Data Privacy & Governance** — privacy ops, GDPR / CCPA, lineage for personal data.
- **AI Governance** — launched 2023–2024. Maps Collibra's catalog entries to AI Use Cases. Tracks model lineage (data → features → model → deployment). Maps to EU AI Act, NIST AI RMF, ISO/IEC 42001. **needs primary research for depth**.
**Pricing:** Enterprise only — published list **starts at ~$100k/yr**, typical deals **$300k–$2M+/yr** based on assets, seats, and modules. AI Governance is an add-on module.
**USP:**
- **Brussels-headquartered.** EU-native. Strong EU customer base in banking, insurance, pharmaceuticals, telco.
- **Mature catalog.** 10+ years of catalog UX; customers are deep.
- **EU regulatory bench.**
**Weaknesses / vulnerabilities:**
- **AI Governance is newer / shallower than Holistic AI / Trustible / Credo AI** — model evaluation, drift monitoring, post-market monitoring are not native. Collibra's AI Governance is mostly *lineage + inventory + mapping*. **needs primary research**.
- **Heavy to deploy.** Onboarding cycle is months, not weeks. **needs primary research on current time-to-value**.
- **Per-asset / per-seat pricing punishes scale.** A 10,000-asset customer can pay $1M+/yr.
- **No MCP / A2A surface.**
- **No per-call x402.**
- **No Article 4 SME literacy tooling** (Collibra is enterprise-only).
**Exploitable gaps:**
- **Deep model-risk + post-market-monitoring above Collibra's catalog** — CSOAI is the engine; Collibra is the catalog.
- **Sovereignty + Article 4 SME + per-call** — Collibra cannot serve the long tail.

---

## 5.2 Atlan

**Website / hq:** atlan.com · San Francisco + Singapore. Founded 2019.
**Form:** Series C, ~$105M raised. **needs primary research** for ARR.
**Positioning:** "Active metadata platform" — modern data catalog with strong collaboration UX.
**Modules:** Data Catalog · Lineage · Data Quality (via partners: Soda, Great Expectations, Bigeye, Monte Carlo). **AI Governance nascent.**
**Pricing:** **needs primary research** — public-facing pricing shows **Free** for up to 5 users, **Team** at **$850/user/yr**, **Business** at **$1,750/user/yr** (publicly listed). **needs primary research for AI module pricing**.
**USP:**
- **Modern UX** — strong adoption among data teams at high-growth SaaS.
- **Active metadata** — extends catalog with usage signals.
- **Strong partner catalogue** — pre-built connectors to Soda, Great Expectations, Bigeye, Monte Carlo, dbt, Airflow.
**Weaknesses:**
- AI Governance is thin. **needs primary research**.
- US-east-1 default. No sovereign plane.
- No MCP / A2A surface.
- No per-call x402.
**Exploitable gaps:**
- **Atlan's customers have a catalog; CSOAI can be the AI governance engine that reads from Atlan.** Strong partnership sell.
- **Sovereignty + Article 4 SME + per-call** — Atlan cannot serve these.

---

## 5.3 Alation

**Website / hq:** alation.com · Redwood City, CA. Founded 2012.
**Form:** Series E, $300M+ raised. **needs primary research** for ARR.
**Positioning:** "Data catalog for the enterprise". Strong in Fortune 500.
**Modules:** Data Catalog · Data Lineage · Data Quality (via partners) · Data Governance · AI Documentation. **AI Governance nascent.**
**Pricing:** Enterprise. **needs primary research**.
**Weaknesses:** Same pattern. AI depth shallow; sovereignty gap; no MCP/A2A.

---

## 5.4 Monte Carlo

**Website / hq:** montecarlodata.com · New York + Tel Aviv. Founded 2019.
**Form:** Series E, $300M+ raised. **needs primary research**.
**Positioning:** "Data observability" — detects data-quality issues, schema drift, broken pipelines, anomalous values.
**Modules:** Data observability · Lineage · Incident management. **No AI governance.**
**Pricing:** Enterprise. **needs primary research** — typical $100k–$500k+/yr.
**USP:**
- **Best-in-class data observability.** Two co-founders from Barr Moses and Lior Gavish. Strong adoption.
**Weaknesses:**
- **No AI governance.** Out of scope.
- **No sovereign plane.**
**Exploitable gaps:**
- **CSOAI can read Monte Carlo's lineage** as a signal of model data drift (CSOAI's drift monitoring can pull lineage events).
- **Partnership is the right motion, not competition.**

---

## 5.5 Bigeye

**Website / hq:** bigeye.com · San Francisco. Founded 2019.
**Form:** Series B, ~$60M raised. **needs primary research**.
**Positioning:** "Data observability platform".
**Modules:** Data quality monitoring · Anomaly detection · Metric definitions.
**Weaknesses:** Same. **No AI governance.**

---

## 5.6 Soda

**Website / hq:** soda.io · San Francisco + Belgium. Founded 2018.
**Form:** Series B, $50M+ raised. **needs primary research**.
**Positioning:** "Data quality + observability for the modern data stack". Open-source core (Soda Core).
**Modules:** Soda Core (open source) · Soda Cloud (paid) · Soda GPT (NL → checks).
**Weaknesses:**
- **No AI governance.**
- Belgium office but US-default platform. **needs primary research on EU sovereign posture**.

---

## 5.7 Great Expectations

**Website / hq:** greatexpectations.io · New York + Aachen. Founded 2020. (Open-source project launched earlier.)
**Form:** Series C, ~$76M raised. **needs primary research**.
**Positioning:** Open-source data quality framework + paid cloud.
**Modules:** GX Core (open source) · GX Cloud · GX Agent (NL → checks).
**Weaknesses:**
- **No AI governance.**
- Aachen office is a positive for EU stance, but cloud is US-default. **needs primary research**.

---

## 5.8 Datafold

**Website / hq:** datafold.com · San Francisco. Founded 2018.
**Form:** Series A, ~$22M raised. **needs primary research**.
**Positioning:** Data testing + diff + observability.
**Weaknesses:** No AI governance.

---

## 5.9 Anomalo

**Website / hq:** anomalo.com · Palo Alto, CA. Founded 2018.
**Form:** Series B, ~$50M raised. **needs primary research**.
**Positioning:** "Data quality monitoring for the modern data stack" — no-code quality rules, unsupervised anomaly detection.
**Weaknesses:** No AI governance.

---

## Summary — Tier 2 Data Map

| Competitor | EU AI Act depth | Sovereignty | MCP/A2A | x402 / per-call | Article 4 SME |
|---|---|---|---|---|---|
| Collibra | Mid (catalog → AI mapping) | Mid (EU hq, US-default cloud) | None | None | None |
| Atlan | Thin | Weak | None | None | None |
| Alation | Thin | Weak | None | None | None |
| Monte Carlo | None | Weak | None | None | None |
| Bigeye | None | Weak | None | None | None |
| Soda | None | Weak | None | None | None |
| Great Expectations | None | Weak | None | None | None |
| Datafold | None | Weak | None | None | None |
| Anomalo | None | Weak | None | None | None |

**Strategic note:** None of these compete for AI governance, but they all compete for *data budgets*. CSOAI's positioning should be: "We sit *above* your data catalog and *below* your AI applications — the model-risk layer between catalog and AI deployment."

---

## Cross-vendor partnership playbook (CSOAI → Catalog/Observability)

| Vendor | Integration | Win |
|---|---|---|
| Collibra | CSOAI reads Collibra catalog → model risk scoring | Joint enterprise deal |
| Atlan | CSOAI plugin in Atlan marketplace | Joint mid-market deal |
| Alation | CSOAI reads Alation catalog | Joint Fortune 500 deal |
| Monte Carlo | CSOAI reads Monte Carlo lineage events as drift signals | Joint observability+governance deal |
| Soda / GX | CSOAI's data-quality tests can run on Soda/GX | Open-source adjacency |
| Bigeye | Same as Monte Carlo | Joint observability+governance deal |
