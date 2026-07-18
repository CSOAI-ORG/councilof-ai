# 07 — Tier 2: Model & LLM Observability

These platforms observe models in production. They overlap with CSOAI on **post-market monitoring (Article 72)** but do not own the EU AI Act mapping, risk-tier classification, or sovereign data plane. Most are US-headquartered.

---

## 7.1 Arize AI

**Website / hq:** arize.com · Berkeley, CA. Founded 2020.
**Form:** Series C, $130M+ raised. **needs primary research** for ARR.
**Positioning:** "AI observability" — drift, performance, bias, hallucination, evaluation. Strong LLM focus.
**Modules:** Tracing (OpenTelemetry-compatible) · LLM Eval (LLM-as-judge, custom evals) · Drift monitoring · Bias & fairness · Embedding drift · Prompt engineering IDE · Agent tracing.
**Pricing:** **needs primary research**. Public-facing: **Free** tier (small); **Enterprise** contact-sales. Industry estimates **$30k–$500k+/yr**.
**USP:**
- Strong LLM observability / tracing.
- Strong agent observability (recent launches).
**Weaknesses:**
- US-default cloud.
- AI Act mapping is thin. **needs primary research**.
- No sovereign plane.
- No MCP / A2A surface.
- No per-call x402 (pricing is per-seat or per-hosted-volume).
- No Article 4 SME.

---

## 7.2 Fiddler AI

**Website / hq:** fiddler.ai · Palo Alto, CA. Founded 2018 by Krishna Gade (ex-Facebook).
**Form:** Series B, ~$50M raised. **needs primary research**.
**Positioning:** "Responsible AI observability" — bias, drift, explainability, performance.
**Modules:** Model monitoring · Explainability · Bias monitoring · Drift · Fairness.
**Pricing:** Enterprise. **needs primary research**.
**USP:**
- Strong explainability (SHAP-style attributions).
- Strong bank/insurance references.
**Weaknesses:**
- US-default.
- AI Act depth thin.
- No MCP / A2A.
- No per-call x402.

---

## 7.3 WhyLabs

**Website / hq:** whylabs.ai · Seattle, WA. Founded 2020 by the creators of the open-source WhyLogs / whylogs library.
**Form:** Series A, ~$25M raised. **needs primary research**.
**Positioning:** "AI observability with privacy" — data + model observability with differential privacy primitives.
**Modules:** Data + model observability · Privacy-preserving monitoring (LLM Guard, LangKit). Open-source core (whylogs).
**USP:**
- Open-source core — strong developer adoption.
- Privacy-preserving observability primitives.
**Weaknesses:**
- AI Act mapping thin.
- US-default cloud.
- No MCP / A2A.
- No per-call x402.
- No Article 4 SME.

---

## 7.4 Langfuse

**Website / hq:** langfuse.com · Berlin, Germany. Founded 2023 (Y Combinator).
**Form:** Open-source core + paid cloud. Series A, ~$30M raised. **needs primary research**.
**Positioning:** "LLM engineering platform" — tracing, evaluation, prompt management, datasets.
**Modules:** Tracing · Prompt management · Datasets · Evaluations · LLM Playground. Self-hostable.
**USP:**
- **EU-native (Berlin).** Self-hostable.
- Open-source core (MIT).
- Strong developer adoption in the EU AI ecosystem.
**Weaknesses:**
- AI Act mapping thin.
- AI governance framing nascent.
- No signed manifests.
- No Article 4 SME tooling.

---

## 7.5 Helicone

**Website / hq:** helicone.ai · San Francisco. Founded 2022 (YC).
**Form:** Series A, ~$10M raised. **needs primary research**.
**Positioning:** "Open-source LLM observability".
**Modules:** Observability · Cost tracking · Prompt management · Evaluations. Open-source core.
**USP:**
- Open-source core.
- Cost tracking is strong.
**Weaknesses:**
- AI Act mapping thin.
- US-default cloud.
- No signed manifests.

---

## 7.6 Patronus AI

**Website / hq:** patronus.ai · New York. Founded 2023.
**Form:** Series B, ~$30M raised. **needs primary research**.
**Positioning:** "LLM evaluation + safety".
**Modules:** LLM evaluation · Hallucination detection · Safety evals · RAG evals · Compliance-mode evals.
**USP:**
- Strong LLM-as-judge evals.
- Strong compliance-mode (financial services).
**Weaknesses:**
- US-default.
- No sovereign plane.
- No MCP / A2A.
- No AI Act mapping.

---

## 7.7 Confident AI (DeepEval)

**Website / hq:** confident-ai.com · Distributed. Open-source DeepEval framework.
**Form:** Series A. **needs primary research**.
**Positioning:** "DeepEval + Confident AI" — open-source LLM evaluation + paid cloud.
**Modules:** DeepEval (open source) · DeepTeam (red-teaming) · Dashboard.
**USP:** Strong open-source developer community.

---

## 7.8 Arthur AI

**Website / hq:** arthur.ai · New York. Founded 2018 by Adam Wenchel (ex-Capital One).
**Form:** Series B, ~$60M raised. **needs primary research**.
**Positioning:** "AI performance + observability".
**Modules:** Model monitoring · Performance · Drift · Bias · Explainability. Strong in regulated industries (Capital One DNA).
**Weaknesses:**
- US-default.
- AI Act mapping thin.
- No sovereign plane.

---

## 7.9 Datadog AI Monitoring / New Relic AI Monitoring / Dynatrace AI Observability

**Positioning:** Hyperscaler-of-monitoring-style observability surfaces for AI workloads.
**Modules:** LLM tracing · Token cost tracking · Anomaly detection · Latency tracking · Prompt/response capture.
**Pricing:** Per-host or per-GB. **needs primary research** for AI Monitoring SKU.
**USP:**
- Existing install base of 25k+ customers (Datadog alone).
- Strong APM integration.
**Weaknesses:**
- **No AI Act mapping.**
- **No AI governance framing** — observability only.
- **No sovereign plane** (Datadog has US-default + limited EU regions; **needs primary research for sovereign posture**).
- **No MCP / A2A surface** for governance evidence.

---

## 7.10 Splunk AI Features / AppDynamics AI / Cisco ThousandEyes AI

**Positioning:** Network/infra monitoring adding AI surface monitoring.
**Weaknesses:** Same — no governance, no sovereign, no AI Act, no MCP/A2A.

---

## Summary — Tier 2 Observability Map

| Competitor | EU AI Act depth | Sovereignty | MCP/A2A | x402 / per-call | Article 4 SME |
|---|---|---|---|---|---|
| Arize AI | Thin | Weak | None | None | None |
| Fiddler AI | Thin | Weak | None | None | None |
| WhyLabs | Thin | Weak | None | None | None |
| Langfuse | Thin | Mid (EU, self-host) | None | None | None |
| Helicone | None | Weak | None | None | None |
| Patronus AI | Thin | Weak | None | None | None |
| Confident AI / DeepEval | None | Weak | None | None | None |
| Arthur AI | Thin | Weak | None | None | None |
| Datadog AI Monitoring | None | Weak | None | None | None |
| New Relic AI Monitoring | None | Weak | None | None | None |
| Dynatrace AI Observability | None | Weak | None | None | None |
| Splunk AI | None | Weak | None | None | None |

**Strategic note:** Observability platforms are a **partner**, not a competitor. CSOAI's drift / bias / post-market-monitoring engine can **consume** observability signals (Arize, Fiddler, WhyLabs, Datadog) AND **emit** signed compliance artifacts. The integration story is: "Your observability tool detects drift. CSOAI signs the audit trail and routes to EU regulators."

---

## The model-observability hole

Every model observability platform above does **drift detection** but does not produce **regulator-acceptable evidence**. None of them sign artifacts. None of them speak to the EU AI Office's GPAI Code of Practice or Article 72 incident-reporting templates. **CSOAI can be the layer that takes observability signals and turns them into signed Article 72 evidence.**
