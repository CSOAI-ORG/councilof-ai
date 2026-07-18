# 12 — Cross-vendor Differentiation & CSOAI Gap Analysis

This file scores every profiled competitor on the seven-axis rubric and identifies the gaps CSOAI must close to win.

---

## 12.1 Scoring methodology

Each competitor is scored 0–5 on seven axes (see `01_OVERVIEW_AND_METHODOLOGY.md`):

| Axis | Description |
|---|---|
| **EU** | EU AI Act + DORA + NIS2 + EU CRA + GDPR + ISO/IEC 42001, updated within 90 days of legal text |
| **SOV** | EU/UK/Gulf data residency, EU sovereign cloud, customer-managed keys |
| **MRM** | Full NIST AI RMF + ISO/IEC 42001 + EU AI Act Article 9 / 13 / 14 / 15 / 17, implemented not narrated |
| **OPEN** | Open API, signed manifests, MCP server, A2A agent card, public SDK, runnable in customer VPC |
| **INT** | Reads/writes Collibra / Atlan / Unity / Databricks / Snowflake / Hugging Face / OpenAI / Anthropic / Bedrock |
| **PRC** | Public price book OR credible analyst-published per-asset price |
| **PRF** | Externally audited, signed attestations, regulator-readable artifacts |

Maximum score: 35. Current observed ceiling: 22 (Holistic AI enterprise tier, indicative).

---

## 12.2 Tier 1 — Pure-play AI Governance

| Vendor | EU | SOV | MRM | OPEN | INT | PRC | PRF | Total |
|---|---|---|---|---|---|---|---|---|
| Holistic AI | 5 | 1 | 4 | 2 | 3 | 1 | 2 | **18** |
| Trustible | 4 | 1 | 3 | 2 | 2 | 2 | 2 | **16** |
| FairNow | 4 (HR only) | 1 | 3 | 1 | 1 | 3 | 1 | **14** |
| Credo AI | 4 | 1 | 3 | 2 | 3 | 1 | 2 | **16** |
| Monitaur | 2 | 1 | 3 | 1 | 2 | 1 | 2 | **12** |
| 7AI | 2 | 1 | 3 | 1 | 1 | 1 | 1 | **10** |
| Modulos | 3 | 4 (CH) | 2 | 2 | 1 | 1 | 1 | **14** |
| RAI Institute | n/a (cert body) | n/a | n/a | n/a | n/a | n/a | n/a | n/a |

---

## 12.3 Tier 1 — GRC & Compliance Automation

| Vendor | EU | SOV | MRM | OPEN | INT | PRC | PRF | Total |
|---|---|---|---|---|---|---|---|---|
| Vanta | 3 | 1 | 2 | 1 | 3 | 4 | 1 | **15** |
| Drata | 3 | 1 | 2 | 1 | 3 | 4 | 1 | **15** |
| Scrut | 3 | 1 | 2 | 1 | 2 | 4 | 1 | **14** |
| Secureframe | 2 | 1 | 1 | 1 | 2 | 4 | 1 | **12** |
| Sprinto | 2 | 1 | 1 | 1 | 2 | 4 | 1 | **12** |
| AuditBoard | 2 | 1 | 2 | 1 | 2 | 1 | 2 | **11** |
| Hyperproof | 2 | 1 | 1 | 1 | 2 | 1 | 1 | **9** |
| Laika | 2 | 1 | 1 | 1 | 2 | 1 | 1 | **9** |

---

## 12.4 Tier 1 — Hyperscalers

| Vendor | EU | SOV | MRM | OPEN | INT | PRC | PRF | Total |
|---|---|---|---|---|---|---|---|---|
| Microsoft Purview AI Hub | 3 | 2 | 3 | 2 | 5 | 3 | 2 | **20** |
| IBM watsonx.governance | 4 | 3 | 4 | 2 | 4 | 2 | 2 | **21** |
| AWS (Bedrock + SageMaker + Audit Manager + Guardrails) | 3 | 2 (European Sovereign Cloud rolling out) | 3 | 3 | 5 | 4 (unit-priced) | 2 | **22** |
| Google Vertex AI | 2 | 2 | 2 | 3 | 5 | 3 | 1 | **18** |
| Oracle OCI AI | 2 | 2 | 2 | 1 | 3 | 2 | 1 | **13** |

---

## 12.5 Tier 2 — Data Catalog & Observability

| Vendor | EU | SOV | MRM | OPEN | INT | PRC | PRF | Total |
|---|---|---|---|---|---|---|---|---|
| Collibra | 4 | 3 | 2 | 2 | 5 | 2 | 2 | **20** |
| Atlan | 2 | 1 | 1 | 3 | 5 | 4 | 1 | **17** |
| Alation | 2 | 1 | 1 | 2 | 5 | 1 | 1 | **13** |
| Monte Carlo | 1 | 1 | 1 | 3 | 5 | 1 | 1 | **13** |
| Bigeye | 1 | 1 | 1 | 3 | 4 | 1 | 1 | **12** |
| Soda | 2 | 1 | 1 | 4 | 4 | 5 | 1 | **18** |
| Great Expectations | 2 | 1 | 1 | 5 | 4 | 5 | 1 | **19** |
| Datafold | 1 | 1 | 1 | 3 | 3 | 1 | 1 | **11** |
| Anomalo | 1 | 1 | 1 | 2 | 4 | 1 | 1 | **11** |

---

## 12.6 Tier 2 — Privacy & Trust

| Vendor | EU | SOV | MRM | OPEN | INT | PRC | PRF | Total |
|---|---|---|---|---|---|---|---|---|
| OneTrust | 3 | 1 | 2 | 2 | 4 | 1 | 2 | **15** |
| Securiti | 3 | 1 | 2 | 2 | 4 | 1 | 2 | **15** |
| TrustArc | 2 | 1 | 1 | 1 | 3 | 1 | 1 | **10** |
| Didomi | 2 | 4 (EU-native) | 0 | 2 | 2 | 1 | 1 | **12** |
| Cookiebot | 1 | 2 (EU-native) | 0 | 2 | 1 | 4 | 1 | **11** |

---

## 12.7 Tier 2 — Model & LLM Observability

| Vendor | EU | SOV | MRM | OPEN | INT | PRC | PRF | Total |
|---|---|---|---|---|---|---|---|---|
| Arize AI | 2 | 1 | 2 | 3 | 5 | 2 | 1 | **16** |
| Fiddler AI | 2 | 1 | 2 | 3 | 4 | 1 | 1 | **14** |
| WhyLabs | 2 | 1 | 1 | 4 | 4 | 3 | 1 | **16** |
| Langfuse | 2 | 4 (EU, self-host) | 1 | 5 | 4 | 5 | 1 | **22** |
| Helicone | 1 | 1 | 1 | 5 | 4 | 3 | 1 | **16** |
| Patronus AI | 1 | 1 | 1 | 3 | 4 | 1 | 1 | **12** |
| Confident AI / DeepEval | 1 | 1 | 1 | 5 | 4 | 3 | 1 | **16** |
| Arthur AI | 2 | 1 | 2 | 3 | 4 | 1 | 1 | **14** |
| Datadog AI Monitoring | 1 | 1 | 1 | 3 | 5 | 4 | 1 | **16** |
| New Relic AI Monitoring | 1 | 1 | 1 | 3 | 5 | 4 | 1 | **16** |
| Dynatrace AI Observability | 2 | 1 | 1 | 3 | 5 | 3 | 1 | **16** |
| Splunk AI | 2 | 1 | 1 | 3 | 5 | 3 | 1 | **16** |

---

## 12.8 CSOAI (current) and CSOAI (v2 spec)

| Axis | CSOAI current (2026-06) | CSOAI v2 (target 2027) |
|---|---|---|
| EU | 3 (horizontal, partial sectoral) | **5** (Annex III 8 verticals, NIS2 + DORA + CRA + GDPR + ISO/IEC 42001) |
| SOV | 4 (EU-native, sovereign-by-default) | **5** (EU + UK + Gulf + Switzerland + Iceland + Norway) |
| MRM | 3 (Kimi research framework, partial) | **5** (Article 9/13/14/15/17 fully implemented, continuous monitoring) |
| OPEN | 4 (MIT, MCP, A2A, signed manifests, x402) | **5** (full MCP/A2A, public agent card directory, signed manifests, JSON-LD outputs) |
| INT | 3 (Collibra, Databricks, Hugging Face, OpenAI, Anthropic, Bedrock via MCPs) | **5** (Collibra, Atlan, Alation, Unity, Databricks, Snowflake, Hugging Face, OpenAI, Anthropic, Bedrock, Vertex AI, OCI, SageMaker, Kafka, Pulsar, Kinesis) |
| PRC | 4 (per-call x402 + per-asset) | **5** (public price book, EU + UK + Gulf price differential, public rate card per tool) |
| PRF | 3 (Ed25519 sigils, BFT council, partial regulator portal) | **5** (full RegTech-as-a-Service for national regulators, signed JSON-LD, public-key verification portal) |
| **Total** | **24** | **35 (perfect score)** |

---

## 12.9 The v2 spec gaps (where CSOAI v2 must improve)

For each axis where CSOAI current < CSOAI v2, the v2 spec in `CSOAI_V2_SPEC.zip` must include:

| Gap | v2 spec requirement |
|---|---|
| EU | 8 vertical Annex III packages, each with named sectoral advisor (placeholder: TÜV SÜD, BSI Germany, CNIL France, EDPB, EBA, etc. — **CLAIMED — needs verification of partner commitments**) |
| SOV | UK / Switzerland / Gulf / Iceland / Norway data-residency, customer-VPC deploy |
| MRM | Continuous Article 9/13/14/15/17 monitoring, signed event stream |
| OPEN | Full MCP/A2A surface, public agent card directory, JSON-LD signed outputs |
| INT | Catalogue of pre-built connectors to Collibra / Atlan / Alation / Unity / Databricks / Snowflake / Hugging Face / OpenAI / Anthropic / Bedrock / Vertex AI / OCI / SageMaker / Kafka / Pulsar / Kinesis |
| PRC | Public rate card per tool, public per-asset pricing, public enterprise tier |
| PRF | RegTech-as-a-Service for national regulators, public-key verification portal |

---

## 12.10 What the scoring reveals

- **No competitor scores above 22/35.** This means no competitor is "good enough" — every buyer is in a trade-off.
- **The hardest axes to score well on are PRF (regulator-readable evidence) and MRM (full model risk implementation).** Both are capabilities CSOAI has structural advantages in.
- **Hyperscalers (Microsoft, IBM, AWS) lead on INT (integrations) and PRC (pricing transparency).** CSOAI must match or beat on these to be competitive.
- **Open-source observability tools (Langfuse, Great Expectations, Helicone, DeepEval) lead on OPEN (openness).** CSOAI's open-source posture is a competitive must-have, not a nice-to-have.
- **EU-native tools (Modulos, Didomi, Langfuse, Vaultree) lead on SOV (sovereignty).** CSOAI must clearly outflank them on the rest of the axes.

---

## 12.11 Three strategic moves the scoring suggests

### Move 1: The "Open + Sovereign + Per-call" trifecta

CSOAI v2 should explicitly target the intersection of (a) open-source core, (b) sovereign-by-default, (c) x402 per-call. No competitor sits in all three. CSOAI v2 should make this trifecta the **brand** — not the feature list.

**Brand line:** *"Open. Sovereign. Pay per call."*

### Move 2: The Annex III 8-vertical sweep

CSOAI v2 should ship 8 sectoral packages (biometric, critical infrastructure, education, employment, essential services, law enforcement, migration, justice). Each co-developed with a named sectoral advisor. Each available in EU + UK + Gulf variants.

**Brand line:** *"Eight verticals. One platform. Sovereign."*

### Move 3: The RegTech-as-a-Service for national regulators

CSOAI v2 should ship a regulator-side product. National authorities (BSI, CNIL, AP, DSB, Garante, AEPD, AP, DSB, etc.) become customers AND channel partners. This is the **multiplier** — a regulator recommending CSOAI to deployers is the single highest-conversion channel in the market.

**Brand line:** *"From the regulator's desk to the deployer's stack."*

---

## 12.12 The single hardest competitor to beat — and how

**Holistic AI** is the single hardest direct competitor. They have:
- $100M+ raised.
- EU AI Act mapping depth.
- Enterprise install base.
- Strong bias / vendor-risk modules.
- Strong named advisors.

**How CSOAI wins:**

| Holistic AI has | CSOAI has |
|---|---|
| EU AI Act mapping | EU AI Act mapping + sectoral Annex III 8-vertical |
| Customer on US cloud | Sovereign-by-default |
| Black-box API | MCP/A2A / x402 / signed JSON-LD |
| Per-asset opaque pricing | Per-call x402 + public rate card |
| Bias / vendor risk | Bias / vendor risk + post-market monitor |
| US install base | EU-native + UK + Gulf |
| No Article 4 SME literacy | Free Article 4 SME portal |
| No regulator portal | RegTech-as-a-Service for national regulators |
| No GPAI provider toolkit | Full GPAI provider toolkit (CoP-aligned) |
| No sovereign weight registry | Sovereign weight registry |

The Holistic AI vs CSOAI comparison page is the highest-conversion piece of marketing on csoai.org. Build it.

---

## 12.13 The single easiest competitor to absorb — and how

**Langfuse** is the easiest competitor to absorb because:
- Open-source core (MIT, compatible with CSOAI MIT).
- EU-native (Berlin).
- Strong developer adoption.
- AI Act mapping thin → natural fit for CSOAI's mapping layer.

CSOAI could integrate Langfuse's tracing into CSOAI's PostMarket-Monitor and offer CSOAI's signed artifacts as Langfuse's regulator-readable output. **This is a partnership, not an acquisition.** But an acquisition is plausible if Langfuse growth stalls — they're a Series A team with a strong product.

---

## 12.14 The market structure this implies

After profiling 47 competitors, the market resolves into **three layers**:

1. **Mapping layer** — Holism + Trustible + Credo AI + Vanta + Drata. CSOAI overlaps here but is differentiated by sovereignty + per-call + open artifacts.
2. **Sovereignty layer** — Modulos + Didomi + Vaultree + Langfuse + (CSOAI). CSOAI is here naturally.
3. **Machine-readable layer** — Soda + GX + Langfuse + WhyLabs + DeepEval + (CSOAI). CSOAI is here naturally.

CSOAI sits at the intersection of all three. No competitor sits at that intersection. **The intersection is the moat.**

---

## 12.15 The single line to remember

**Every AI governance vendor charges you for the privilege of being opaque. CSOAI signs every artifact, charges per call, runs sovereign-by-default, and ships the source.**

That's the wedge. Ship it.
