# 03 — Tier 1: GRC + Compliance Automation Platforms

These are the platforms that started in SOC 2 / ISO 27001 / HIPAA and are now extending into AI. They compete with CSOAI for the same GRC budget even if their AI modules are thin.

---

## 3.1 Vanta

**Website / hq:** vanta.com · San Francisco. Founded 2018 by Christina Cacioppo.
**Form:** Series C, $300M+ raised, **reported** $10k+ customers, $100M+ ARR (2024 reports — **needs primary research for 2026**).
**Positioning:** "Trust management platform" — automated evidence collection for SOC 2, ISO 27001, HIPAA, GDPR, and now AI.
**AI modules:** Vanta AI / AI TRiM (Trust Readiness for AI Management) — launched 2024. Maps AI systems to NIST AI RMF + EU AI Act + ISO/IEC 42001. AI Use-Case Inventory. **needs primary research for current feature depth**.
**Pricing:** **Publicly quoted:** **$7,500/yr** Essentials, **$12,000/yr** Growth, **$25,000+/yr** Scale (per-org, not per-AI-system). Custom enterprise >$50k/yr. [publicly visible but **needs primary research for AI add-on pricing**]
**USP:**
- **Massive install base** — Vanta is the SOC 2 default at thousands of US SaaS startups.
- **Customer success + automation UX is mature** — high NPS, fast time-to-value.
- **Wide framework coverage** — now ~30 frameworks.
**Weaknesses / vulnerabilities:**
- **AI module is shallow vs purpose-built competitors.** Vanta's AI TRiM is a mapping layer, not a model-risk engine. No bias-testing, no drift-monitoring, no Article 15 accuracy/robustness controls natively. [needs primary research]
- **No sovereign data plane.** Vanta runs primarily on AWS US. EU customers must contractually request EU residency; **requires Vanta engineering**, not a self-service toggle.
- **No MCP / A2A surface.**
- **No per-call x402 alternative.**
- **No Article 4 literacy tooling.**
- **Per-org pricing becomes punitive for very large inventories.** A 500-system-org may pay more than purpose-built competitors for the *same* depth.
**Exploitable gaps:**
- **Vanta customers have an "AI module hole"** — they have AI inventory but no bias/drift/post-market-monitoring. CSOAI can sell *into* the Vanta install base as the model-risk engine behind Vanta's mapping layer.
- **Sovereignty wedge** — Vanta cannot serve EU customers as their primary; CSOAI can.
- **Article 4 SME literacy** — Vanta's per-org pricing excludes 95% of EU SMEs (Article 4 obligates AI literacy for *all* deployers, including SMEs).

---

## 3.2 Drata

**Website / hq:** drata.com · San Diego. Founded 2020.
**Form:** Series C, $300M+ raised, **reported** 5k+ customers. **needs primary research** for 2026 ARR.
**Positioning:** Similar to Vanta — automated SOC 2 / ISO 27001 / HIPAA / GDPR / now AI compliance.
**AI modules:** AI Compliance (2024). NIST AI RMF + EU AI Act mapping. **needs primary research for depth**.
**Pricing:** Similar to Vanta — **$7,500–$25,000+/yr per org** in published tiers. AI module is **add-on pricing**, not bundled. [needs primary research on AI SKU]
**Weaknesses:** essentially the same as Vanta — same install base, same per-org pricing model, same sovereignty gap, same MCP/A2A gap, same Article 4 gap. **The Drata vs Vanta contest is orthogonal to CSOAI.**
**Exploitable gaps:** identical to Vanta. The Vanta-vs-Drata contest is winner-take-most; CSOAI's wedge is **adjacent** to both.

---

## 3.3 Scrut Automation

**Website / hq:** scrutinize.ai · Bangalore + San Francisco. Founded 2022.
**Form:** Series A, ~$30M raised. **needs primary research** on customer count.
**Positioning:** "Risk and compliance automation" with an early AI module.
**AI modules:** AI Governance + AI Risk Management module. Less depth than Vanta/Drata. **needs primary research**.
**Pricing:** **$8,000–$20,000+/yr per org** in published tiers. **needs primary research**.
**USP:** India-based cost structure → lower list price than US-headquartered rivals.
**Weaknesses:**
- AI module depth is shallow.
- Sovereignty gap (US-east-1 by default).
- No MCP / A2A.
**Exploitable gaps:** Same — sovereignty + per-call + Article 4 SME + MCP/A2A.

---

## 3.4 Secureframe

**Website / hq:** secureframe.com · San Francisco. Founded 2019.
**Form:** Acquired by Cloudflare in 2024 (publicly disclosed). [needs primary research on integration depth]
**Positioning:** GRC automation. AI module nascent.
**Pricing:** **$7,500–$25,000+/yr per org.** Similar to Vanta/Drata.
**Weaknesses / gaps:** Same. **Cloudflare acquisition is significant** — gives Secureframe an edge on data-plane routing but not sovereignty.

---

## 3.5 Sprinto

**Website / hq:** sprinto.com · Bangalore. Founded 2020.
**Form:** Series B, $30M+ raised. **needs primary research** on customer count.
**Positioning:** GRC automation for SaaS, mid-market focus.
**Pricing:** **$5,000–$15,000+/yr per org** (lower than Vanta/Drata).
**Weaknesses:** Same — AI depth shallow; sovereignty gap; no MCP/A2A.
**Exploitable gap:** Mid-market wedge. CSOAI can partner with Sprinto to add the sovereign AI layer.

---

## 3.6 AuditBoard

**Website / hq:** auditboard.com · Manhattan Beach, CA. Founded 2014. Listed on NYSE (since 2021, ticker AUD).
**Form:** Public company. **needs primary research** for current revenue.
**Positioning:** Audit, risk, and compliance management. Strong in internal audit teams, SOX.
**AI modules:** AI Governance module nascent (2024–2025). **needs primary research** for depth.
**Pricing:** Per-user enterprise. **needs primary research** — typically **$30k–$500k+/yr** depending on seats and modules.
**USP:**
- Strong internal-audit fit (SOX-experienced buyers are buying AI governance).
- CrossRisk platform ties operational, IT, and audit risk.
**Weaknesses:** Per-seat pricing for *audit teams* — not for AI engineers. AI governance is an audit-team tool here, not an engineering tool.
**Exploitable gaps:**
- **CSOAI can be the engineering surface; AuditBoard can be the audit-team surface.** Both can win.

---

## 3.7 Hyperproof

**Website / hq:** hyperproof.io · Bellevue, WA. Founded 2018.
**Form:** Series B, ~$50M raised. **needs primary research**.
**Positioning:** Compliance operations. AI module thin.
**Pricing:** Per-seat enterprise. **needs primary research**.

---

## 3.8 Laika (formerly Comply)

**Website / hq:** laika.com · San Francisco. Founded 2019.
**Form:** Series B, ~$50M raised. **needs primary research**.
**Positioning:** GRC + vendor risk + infosec compliance + AI.
**AI modules:** Vendor Risk for AI. Thin on model risk.
**Pricing:** Per-seat. **needs primary research**.

---

## Summary — Tier 1 GRC Map

| Competitor | EU AI Act depth | Sovereignty | MCP/A2A | x402 / per-call | Article 4 SME |
|---|---|---|---|---|---|
| Vanta | Mapping only | Weak | None | None | None |
| Drata | Mapping only | Weak | None | None | None |
| Scrut | Mapping only | Weak | None | None | None |
| Secureframe | Nascent | Weak | None | None | None |
| Sprinto | Nascent | Weak | None | None | None |
| AuditBoard | Audit-team-only | Weak | None | None | None |
| Hyperproof | Thin | Weak | None | None | None |
| Laika | Vendor-risk-only | Weak | None | None | None |

**Pattern:** Tier 1 GRC platforms are large, well-funded, and have the *customer relationships* — but their AI modules are thin. **CSOAI's wedge is the deep AI model-risk engine that runs beneath or alongside these GRC surfaces.** A partnership sell (CSOAI as the "AI module" for Vanta, Drata, etc.) is a credible GTM path — but only if CSOAI also owns the sovereign + per-call + Article 4 SME surface those platforms cannot serve.

---

## Why CSOAI should NOT directly compete head-on with Vanta/Drata

- Both have **>$300M raised** and installed bases in the tens of thousands.
- Their AI modules are getting better every quarter.
- The GRC audit relationship (SOC 2 evidence + AI) is a sticky "land" — Vanta/Drata own the SOC 2 budget; CSOAI would be fighting for share of wallet against a customer they need.

**Instead:** CSOAI's commercial motion should be (a) sovereign + per-call + Article 4 SME surface they cannot serve; (b) MCP/A2A interop so Vanta/Drata can pipe evidence to CSOAI's signed artifacts; (c) sectoral Annex III depth that Vanta/Drata's horizontal mapping lacks.
