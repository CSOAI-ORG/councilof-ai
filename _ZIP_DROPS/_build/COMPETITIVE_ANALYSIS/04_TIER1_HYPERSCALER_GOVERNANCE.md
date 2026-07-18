# 04 — Tier 1: Hyperscaler Governance Offerings

These are the AI governance surfaces built into the hyperscalers' clouds. They are **not direct competitors** — they are *adjacent* — but they capture budget for "AI governance on the cloud we already pay for". CSOAI's stance: be cloud-agnostic, be sovereign, be open artifacts, be MCP/A2A-native, be per-call.

---

## 4.1 Microsoft Purview AI Hub

**Website / hq:** learn.microsoft.com/purview · Redmond, WA. Public company (MSFT).
**Form:** Part of Microsoft Purview (compliance portfolio). Available as a Microsoft 365 E5 add-on or as a Purview standalone SKU.
**Positioning:** "AI governance and security posture for Copilot + custom AI applications". Maps Purview DLP + Information Protection + Insider Risk to AI workloads.
**Modules:** AI Hub inventory (Copilot, custom Azure AI, third-party models) · Risk assessments · Prompt + response capture (with privacy controls) · Compliance Manager mapping (EU AI Act, NIST AI RMF, ISO/IEC 42001 templates) · SharePoint + Teams + Outlook AI coverage · Data Loss Prevention for AI prompts · Sensitivity-label propagation.
**Pricing:** **Part of Microsoft 365 E5 Compliance add-on** (~$12/seat/mo list, typical enterprise effective price 5–10x higher with negotiated EA). Purview standalone available. AI Hub itself does not have a separate SKU — it ships inside E5 Compliance / E5 eDiscovery & Audit.
**USP:**
- **Free with the licence 90% of Fortune 500 already pay.** Distribution is unmatched.
- **Native to Microsoft Copilot adoption** — every Microsoft 365 tenant has an AI footprint overnight.
- **Strong compliance mapping library** — Compliance Manager has hundreds of templates including EU AI Act and ISO/IEC 42001.
**Weaknesses / vulnerabilities:**
- **Microsoft-cloud-only.** Purview cannot govern Anthropic / Google / Mistral / open-source models in a sovereign-on-prem deployment. [Microsoft has partial coverage of AWS via connectors but native governance is Azure-first.]
- **US-default data residency.** EU Data Boundary exists but is widely considered incomplete; customer-managed keys for EU/UK sovereign cloud requires Azure Germany / Azure Government, which has a smaller feature set. **needs primary research on Azure Sovereign / Germany availability of Purview AI Hub features.**
- **Black-box internals.** No public API for "did the policy run". No signed manifest. No per-call billing.
- **Bias / model evaluation is not native** — Purview AI Hub captures and routes, but doesn't evaluate model bias/robustness at the depth of Holistic AI / Fiddler / Arize.
- **No MCP / A2A surface.** [no public evidence]
- **No Article 4 SME literacy tooling.**
- **Not portable** — leaving Azure loses the entire governance surface.
**Exploitable gaps:**
- **Sovereignty + portability + open artifacts** — CSOAI can be the "above-Azure" layer, capturing evidence from Purview and exporting to signed manifests.
- **Article 4 SME literacy** — Purview is enterprise-priced; the EU SME compliance market is huge and uncontested.
- **MCP/A2A interop** — Purview has no agent-discoverable surface; CSOAI does.

---

## 4.2 IBM watsonx.governance

**Website / hq:** ibm.com/watsonx · Armonk, NY.
**Form:** Part of IBM watsonx.ai + watsonx.data + watsonx.governance. Public company (IBM).
**Positioning:** "AI governance toolkit for generative AI and machine learning models". Strongest in regulated industries (financial services, healthcare) where IBM has deep relationships.
**Modules:** AI Use Case Inventory · Model Risk Management (inherits from IBM OpenPages MRM) · Lifecycle governance · Bias / fairness / drift monitoring · Factsheets (model cards) · Regulatory mapping (EU AI Act, NIST AI RMF, ISO/IEC 42001) · OpenPages integration (GRC surface) · watsonx.ai / watsonx.data integration.
**Pricing:** **needs primary research**. watsonx.governance is sold as a separate SKU; published-list pricing starts at **~$5,000/mo per environment** ($60k/yr) with enterprise packages at **$200k+/yr**. **needs primary research for current 2026 pricing**.
**USP:**
- **Strong regulated-industry DNA.** IBM's banking / insurance / government relationships give watsonx.governance an immediate install base.
- **OpenPages integration** — OpenPages is IBM's mature GRC platform; watsonx.governance ships with OpenPages connectors.
- **Open Factsheets** — model cards are first-class.
- **Hybrid / on-prem capable** — stronger than Microsoft Purview here. IBM Cloud Satellite, on-prem Red Hat OpenShift.
**Weaknesses / vulnerabilities:**
- **IBM-cloud / Red Hat biased.** watsonx.governance works on AWS, Azure, and GCP via connectors but the experience is uneven. **needs primary research on third-party-cloud parity**.
- **UI is dated** — IBM has a long history of building for compliance officers, not engineers; the UX is rated below Holistic AI / Credo AI / Trustible. **CLAIMED — needs verification**.
- **No sovereign-by-default.** EU Data Boundary exists but sovereign cloud (Gaia-X-labelled equivalents) is not native; **needs primary research on EU sovereign cloud posture**.
- **No MCP / A2A surface.**
- **No per-call x402.**
- **No Article 4 SME literacy.**
**Exploitable gaps:**
- **Sectoral Annex III + Article 4 SME + per-call x402** — watsonx.governance is enterprise-only; the long tail of EU SMEs and the public sector are untouched.
- **MCP/A2A + signed artifacts** — IBM's export is a PDF, not a signed manifest.
- **Cloud-agnostic sovereignty** — watsonx.governance assumes IBM Cloud or on-prem Red Hat; CSOAI runs on the buyer's choice.

---

## 4.3 AWS — SageMaker Role Manager + Bedrock Guardrails + Bedrock Model Evaluation + Audit Manager

**Website / hq:** aws.amazon.com · Seattle, WA. Public company (AMZN).
**Positioning:** Multi-product AI governance surface.
**Modules:**
- **SageMaker Role Manager** — IAM for AI workflows.
- **SageMaker Model Cards + Model Dashboard** — model cards + bias / drift / feature attribution monitoring.
- **Bedrock Guardrails** — content filtering, topic denial, PII redaction, contextual grounding checks.
- **Bedrock Model Evaluation** — LLM-as-judge evals, RAG eval, human eval.
- **Audit Manager** — AI Use Case mapping (incl. ISO AI管理体系 mappings).
- **Bedrock AgentCore + AgentCore Evaluations** — agent governance (observability + evaluation). [needs primary research on current 2026 feature set]
- **AWS Compliance Center + Artifact** — evidence collection.
**Pricing:**
- **Bedrock Guardrails** is per-policy per-invocation (cheap). **needs primary research on current unit price**.
- **SageMaker Model Dashboard** is included with SageMaker.
- **Audit Manager** is per-resource per-assessment.
- **Bedrock Model Evaluation** is per-invocation or per-task depending on the model.
- **Bedrock AgentCore** pricing **needs primary research** for 2026.
**USP:**
- **Bedrock is multi-model** — Anthropic, Meta Llama, Mistral, Cohere, Stability, Amazon Titan, AI21 — so AWS has the broadest model coverage of any hyperscaler.
- **The deepest MLOps tooling** in the market (SageMaker has been around since 2017).
- **Bedrock AgentCore** is an early mover on **agent governance** — observability + eval for AI agents.
**Weaknesses / vulnerabilities:**
- **AWS-default residency.** EU customers can pick eu-central-1, eu-west-1, eu-south-1, eu-south-2, eu-central-2 — but sovereign-by-default (Gaia-X labelled equivalents, AWS European Sovereign Cloud announced 2023 — still rolling out as of 2026) **needs primary research on 2026 status**. AWS European Sovereign Cloud targets operational availability **mid-2025 to 2026** per public AWS announcements.
- **AI Act mapping is partial.** Audit Manager has AI-relevant frameworks but the EU AI Act mapping is *thinner* than Holistic AI / Trustible. **needs primary research**.
- **No MCP / A2A surface.**
- **Bedrock Guardrails is not an "AI Act Article 9 risk management system"** — it is content-safety / PII redaction. Categorically different from Holistic AI / Trustible's risk-management framing.
- **No Article 4 SME literacy.**
**Exploitable gaps:**
- **AWS European Sovereign Cloud is incomplete.** CSOAI's sovereignty plane can be the *complete* sovereign plane beneath or alongside AWS.
- **Signed manifests + A2A + x402** — AWS has none of those primitives.
- **Sectoral Annex III + Article 4 SME** — AWS is enterprise-priced; the SME wedge is open.

---

## 4.4 Google — Vertex AI Model Registry + Model Monitoring + Vertex AI Agent Engine

**Website / hq:** cloud.google.com/vertex-ai · Mountain View, CA. Public company (GOOG).
**Modules:** Model Registry · Model Monitoring (drift, skew) · Vertex AI Agent Engine + Agent Development Kit (ADK) · Vertex AI AgentOps (preview as of 2024–2025; **needs primary research for 2026 GA**).
**Pricing:** Per-prediction / per-node-hour. **needs primary research for 2026 unit pricing**.
**USP:** Agent Engine + ADK are an early-mover agent stack.
**Weaknesses:** Same triad — sovereignty (only on eu-west-1, eu-west-2, eu-west-3, eu-west-4, eu-central-2 etc.; **needs primary research on sovereign cloud posture**), no AI Act depth (limited), no MCP/A2A, no x402, no Article 4 SME.
**Exploitable gaps:** Same.

---

## 4.5 Oracle AI Governance (part of OCI AI Services)

**Website / hq:** oracle.com · Austin, TX. Public company (ORCL).
**Modules:** OCI AI Service model cards · OCI Guardrails · OCI Anomaly Detection governance · AI Use Case inventory in Oracle Risk Management & Compliance.
**Pricing:** Bundled with OCI consumption. **needs primary research**.
**USP:** Strong in regulated industries where Oracle is the system of record (financial services, public sector).
**Weaknesses:** Smaller AI footprint than Microsoft/IBM/AWS/Google. Sovereignty limited. No MCP/A2A.

---

## Summary — Hyperscaler Map

| Competitor | EU AI Act depth | Sovereignty | MCP/A2A | x402 / per-call | Article 4 SME |
|---|---|---|---|---|---|
| Microsoft Purview AI Hub | Mid (Compliance Manager) | Mid (EU Data Boundary) | None | None | None |
| IBM watsonx.governance | Mid-Strong | Mid (hybrid) | None | None | None |
| AWS (SageMaker+Bedrock+Audit Mgr) | Partial | Mid (European Sovereign Cloud rolling out) | None | Partial (per-call on Guardrails) | None |
| Google Vertex AI | Thin | Mid | None | Partial | None |
| Oracle OCI AI Governance | Thin | Thin | None | None | None |

**Strategic note:** Hyperscalers are the *table-stakes threat*, not the *active competitor*. Every CSOAI enterprise deal will face "but we already have [Purview / watsonx.governance / Bedrock Audit Manager]". The response is:
1. "Yes — and we'll be the **portable sovereign layer** above it that signs artifacts your hyperscaler cannot."
2. "We'll govern your non-hyperscaler workloads (Anthropic API, Mistral self-hosted, open-weights on your laptop, agents speaking to your bank)."
3. "Article 4 SME literacy is not in your hyperscaler licence — that's the market they cannot serve."
