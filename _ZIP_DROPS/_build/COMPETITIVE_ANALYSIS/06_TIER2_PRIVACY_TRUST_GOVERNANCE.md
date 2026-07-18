# 06 — Tier 2: Privacy, Trust & Data Governance Adjacencies

These platforms have strong positions in privacy / consent / data subject rights, and are extending into AI. They compete for *privacy budget*; CSOAI's sovereign + per-call + open-artifact stance can both absorb and extend them.

---

## 6.1 OneTrust AI Governance

**Website / hq:** onetrust.com · Atlanta + London. Founded 2016.
**Form:** Largest dedicated privacy / trust software vendor. $1B+ raised. **needs primary research** for current ARR (publicly reported at ~$300M+ in 2024).
**Positioning:** "Trust intelligence platform" — privacy, security, governance, ESG, ethics, AI.
**Modules:**
- **Privacy & Data Governance** — DSARs, consent, ROPA.
- **GRC** — risk register, vendor risk.
- **Ethics & Compliance** — code of conduct, training.
- **ESG** — sustainability reporting.
- **AI Governance** — launched 2023. AI Use Case inventory, model cards, vendor risk for AI, mapping to NIST AI RMF, ISO/IEC 42001, EU AI Act. **needs primary research for depth**.
**Pricing:** Enterprise only. **needs primary research** — typical six-figure annual contracts.
**USP:**
- **Massive install base** — privacy programmes everywhere.
- **Single pane of glass** for privacy + AI governance.
- **Mature consent + DSAR operations.**
**Weaknesses / vulnerabilities:**
- **AI Governance is younger than the privacy suite.** The privacy module has 8+ years of maturity; AI Governance is 2–3 years old. **needs primary research**.
- **US-headquartered, US-default cloud.** Sovereignty gap.
- **No MCP / A2A surface.**
- **No per-call x402.**
- **No Article 4 SME literacy tooling.** (OneTrust is enterprise-only.)
- **Pricing is opaque.** "Contact sales" for everything.
- **No native model evaluation / drift monitoring** — OneTrust routes to partners (Holistic AI, Monitaur).
**Exploitable gaps:**
- **OneTrust customers have AI inventory holes.** CSOAI can sell *into* the install base as the model-risk engine.
- **Sovereignty + Article 4 SME + per-call** — OneTrust cannot serve these.
- **MCP/A2A interop** — OneTrust has none; CSOAI can route evidence from OneTrust to signed CSOAI artifacts.

---

## 6.2 Securiti

**Website / hq:** securiti.ai · San Jose, CA. Founded 2018 by Rehan Jalil (ex-CloudLock / Cisco).
**Form:** Series C, $100M+ raised. **needs primary research** for ARR.
**Positioning:** "Data security & AI governance" — combined data security posture management (DSPM) + AI governance.
**Modules:** DSPM · Data Access Governance · Privacy Operations · Consent · AI Governance · Model Risk · Data Lineage for AI.
**Pricing:** Enterprise. **needs primary research**.
**USP:**
- **Combined DSPM + AI governance** — strong narrative for CISOs who want one vendor.
- **Strong data lineage for AI** — can show training-data → model-output lineage.
**Weaknesses:**
- US-default cloud.
- AI Governance depth thinner than Holistic AI.
- No MCP / A2A surface.
- No per-call x402.
- No Article 4 SME.
**Exploitable gaps:** same.

---

## 6.3 TrustArc

**Website / hq:** trustarc.com · San Francisco + London. Founded 1997.
**Form:** Mature privacy vendor. **needs primary research** for current revenue.
**Positioning:** Privacy management platform. AI Governance nascent.
**Weaknesses:** AI Governance depth thin; US-default cloud; no MCP/A2A.

---

## 6.4 Didomi

**Website / hq:** didomi.io · Paris. Founded 2017.
**Form:** Series B, ~$40M raised. **needs primary research**.
**Positioning:** Consent management + privacy operations. Strong in EU.
**Modules:** Consent Management Platform (CMP) · Preference Management · Privacy Operations.
**Weaknesses:**
- **No AI Governance module.** [needs primary research on 2026 roadmap]
- No MCP / A2A surface.
- EU-native is a positive; CSOAI can partner with Didomi to handle consent → model training data provenance.

---

## 6.5 Cookiebot (now part of Usercentrics group)

**Website / hq:** cookiebot.com · Copenhagen. Founded 2011.
**Form:** Acquired by Usercentrics in 2022.
**Positioning:** CMP. AI module nascent.
**Weaknesses:** Same pattern.

---

## Summary — Tier 2 Privacy Map

| Competitor | EU AI Act depth | Sovereignty | MCP/A2A | x402 / per-call | Article 4 SME |
|---|---|---|---|---|---|
| OneTrust | Mid | Weak (US-default cloud) | None | None | None |
| Securiti | Mid | Weak | None | None | None |
| TrustArc | Thin | Weak | None | None | None |
| Didomi | None | EU-native (CMP) | None | None | None |
| Cookiebot | None | EU-native (CMP) | None | None | None |

**Strategic note:** OneTrust is the privacy-version-of-Vanta — a huge install base, a thin AI module, and a customer relationship that would benefit from CSOAI's deep AI model-risk engine as a complement. Same GTM logic: partner-into, don't compete.

---

## What this means for CSOAI's data-provenance story

The **single largest gap** in the market — across every Tier 2 catalog, observability, and privacy platform — is **consent → model-training data → model-output → audit-trail** lineage. None of them closes the loop. CSOAI's signed manifest can be the *closing artifact* every platform above is missing.
