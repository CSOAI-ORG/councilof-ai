# ZIP 1 — COMPETITIVE_ANALYSIS
## The 2026 AI Governance, EU AI Act & Sovereign Compliance Landscape

> **Deliverable owner:** csoai.org strategy workstream
> **Prepared:** 2026-06-21
> **Source policy:** No fabricated numbers. Anything not verifiable from primary sources is flagged **"needs primary research"** with a description of what to research and where. Customer names are flagged `[CLAIMED — needs verification]` unless publicly documented.
> **Scope:** AI governance / EU AI Act / model-risk / sovereign-AI / GRC-AI platforms and adjacencies (data observability, catalog, compliance automation) that compete for the same buyer, the same RFP, or the same wall-budget.

---

## How to read this ZIP

This ZIP is organised into 13 files. Read `INDEX.md` (root) for the full map. The order:

| # | File | Purpose |
|---|---|---|
| 01 | `01_OVERVIEW_AND_METHODOLOGY.md` | This file — frame, scoring rubric, "what's a competitor" definition |
| 02 | `02_TIER1_PURE_PLAY_AI_GOVERNANCE.md` | Holistic AI, Trustible, FairNow, Credo AI, Monitaur, 7AI, Modulos, Resolved, RAI Institute |
| 03 | `03_TIER1_GRC_AND_COMPLIANCE_AUTOMATION.md` | Vanta, Drata, Scrut, Secureframe, Sprinto, AuditBoard, Hyperproof, Laika |
| 04 | `04_TIER1_HYPERSCALER_GOVERNANCE.md` | Microsoft Purview AI Hub, IBM watsonx.governance, AWS SageMaker + Bedrock Guardrails, Google Vertex AI Model Registry, Oracle AI Governance |
| 05 | `05_TIER2_DATA_CATALOG_AND_OBSERVABILITY.md` | Collibra, Atlan, Alation, Monte Carlo, Bigeye, Soda, Great Expectations, Datafold, Anomalo |
| 06 | `06_TIER2_PRIVACY_TRUST_GOVERNANCE.md` | OneTrust AI Governance, Securiti, TrustArc, Didomi, Cookiebot + AI module |
| 07 | `07_TIER2_MODEL_LLM_OBSERVABILITY.md` | WhyLabs, Fiddler, Arize, Langfuse, Helicone, Patronus, Confident AI (DeepEval), Arthur AI |
| 08 | `08_TIER3_EMERGING_AND_EU_NATIVE.md` | Apheris, Synthesia-safe, Vaultree, MOSTLY AI (synthetic + governance), Tonic.ai, Sardine (synthetic), Private AI, Akkio-internal |
| 09 | `09_CONSULTANCIES_AND_SYSTEM_INTEGRATORS.md` | Big 4 AI governance practices, Baringa, Paragon, Holistic-as-service, TÜV SÜD, KPMG EU AI Act practice, EY.ai |
| 10 | `10_PRICING_TABLE_AND_TAM_NOTES.md` | Public + leaked pricing, bundle structures, who charges per-asset vs per-seat vs per-call |
| 11 | `11_CROSSCUT_VULNERABILITIES.md` | Cross-cutting weaknesses no one has closed yet |
| 12 | `12_CROSSCUT_DIFFERENTIATION_AND_GAPS.md` | Where CSOAI can land cleanly |
| 13 | `13_SOURCES_AND_OPEN_QUESTIONS.md` | Bibliography of public sources and a numbered list of "needs primary research" items |

**Total competitors profiled in depth: 47.** Eight additional European-native and adjacent players are listed in `08_TIER3_EMERGING_AND_EU_NATIVE.md`. Five are profiled in `09_CONSULTANCIES_AND_SYSTEM_INTEGRATORS.md`.

---

## Methodology — what counts as a competitor

A "competitor" to csoai.org is any platform that satisfies **at least two** of these four conditions:

1. **Same buyer** — CISOs, Chief AI Officers, Heads of AI Governance, GRC leads, Data Protection Officers, Risk & Compliance, internal-audit, RegTech procurement, EU AI safety institutes, sovereign-tech procurement.
2. **Same RFP line item** — appears in EU AI Act readiness RFPs, ISO/IEC 42001 (AIMS) implementations, NIST AI RMF / RAI assessments, model-risk-management (MRM) programmes, sectoral Annex III packages (biometric, education, employment, critical infrastructure, law enforcement, migration, justice/democracy).
3. **Same protocol surface** — speaks MCP, OpenAI/Anthropic function-calling, A2A agent cards, x402, Agent-to-Agent, signed manifest, model card, dataset card, system card, post-deployment monitoring telemetry.
4. **Same regulator adjacencies** — works with EU AI Office, national competent authorities (NCAs), notified bodies, CEN-CENELEC JTC 21 standards work, ISO/IEC SC 42, GPAI Code of Practice signatories.

If a platform matches only one criterion (e.g. a pure data-quality tool with no governance framing), it lands in Tier 2 (adjacent) and is treated as a *competitor for budget* but not for *primary mission*.

---

## Scoring rubric (used in each profile)

Each profile scores the competitor on seven axes, 0–5 each:

| Axis | What 5 looks like | What 0 looks like |
|---|---|---|
| **EUCoverage** | Native EU AI Act + GDPR + DORA + NIS2 + EU CRA + ISO/IEC 42001, all updated within 90 days of legal text | US-only, ISO/IEC 42001 roadmap "Q4 2026", GDPR treated as checkbox |
| **Sovereignty** | EU/UK/Gulf data residency, EU sovereign cloud (Gaia-X labelled or equivalent), customer-managed keys (CMK), no US CLOUD Act exposure | Single AWS region, no CMK, US-only legal entity |
| **ModelRiskDepth** | Full NIST AI RMF + ISO/IEC 42001 + EU AI Act Article 9 (risk-management), 13 (transparency), 14 (human oversight), 15 (accuracy/robustness/cybersec), 17 (QMS) — implemented not narrated | Marketing copy; "AI risk dashboard" with no controls mapped |
| **OpenSurface** | Open API, signed manifests, MCP server, A2A agent card, public SDK, export-to-CSV/JSON-LD, runnable in customer VPC | Black box; "talk to sales" for any export |
| **Interop** | Reads/writes Collibra / Atlan / Unity / Databricks / Snowflake / Hugging Face / OpenAI / Anthropic / Bedrock without a custom connector | Custom-engineering-required for every system of record |
| **PricingTransparency** | Public price book OR credible analyst-published per-asset price | "Contact sales" for everything; per-customer opaque |
| **ComplianceProof** | Externally audited, signed attestations, regulator-readable artifacts (not just PDFs) | Self-attested PDF reports |

A "perfect score" competitor would be 35/35. The current ceiling observed in this ZIP is **22/35** (Holistic AI enterprise tier). Detailed score tables are in `12_CROSSCUT_DIFFERENTIATION_AND_GAPS.md`.

---

## Definitions of terms used throughout

- **AI governance platform** — software that maps AI systems to obligations, gathers evidence, routes approvals, and produces auditable artifacts.
- **AI Act readiness** — the operational ability to demonstrate conformity for one or more risk tiers defined in Regulation (EU) 2024/1689 (the "AI Act").
- **Model risk management (MRM)** — the inherited practice from banking SR 11-7 / SS 1/2023, adapted to ML and generative AI.
- **Sovereign AI** — a deployment posture where data, models, weights, and inference stay inside a jurisdiction the buyer controls (EU, UK, Switzerland, Gulf, India, etc.).
- **Conformity assessment** — the formal procedure in Article 43 AI Act (internal control, third-party by notified body, or third-party for certain biometrics).
- **Post-market monitoring** — Article 72 obligation for high-risk providers.
- **Serious incident reporting** — Article 73 obligation to national competent authority.
- **GPAI Code of Practice** — voluntary instrument the AI Office is using to operationalise Articles 53–55 for general-purpose AI models.
- **x402** — the HTTP-402 micropayment protocol CSOAI uses for per-call billing.
- **MCP** — Model Context Protocol; the standard the King/SOV3 stack speaks.

---

## What this ZIP is NOT

- It is **not** a public PR comparison. Every vulnerability and weakness listed is documented either in public sources (linked in `13_SOURCES_AND_OPEN_QUESTIONS.md`) or in the form "needs primary research".
- It is **not** a security-audit-grade threat model. That belongs in `VULNERABILITY_SCAN.zip`.
- It is **not** a buyer's guide. It is a **seller's map**: where CSOAI can win, where it cannot, and why.

---

## The one-line takeaway

**No competitor in the 2026 market combines (a) EU AI Act + NIS2 + DORA + CRA + GDPR-native mapping, (b) sovereign-by-default data plane, (c) signed open artifacts, (d) per-call x402 pricing, (e) A2A/MCP interop, (f) regulator-readable evidence, and (g) Article 4 literacy tooling for SMEs — in one product.** Every competitor covers 2–4 of those axes well, the rest with gaps. The map of *which axis each competitor covers* is the strategic surface for CSOAI.
