# LinkedIn Week 2 — MEOK AI Labs

Rules reminder: no link in post body (60% reach penalty). Link in first comment only. 9am UK Tue-Sat.

---

## Post 1 — Tuesday 9am UK
**Topic:** CRA teardown — "your IoT is now under Annex I"

```
The EU Cyber Resilience Act applies to every product with digital elements you place on the EU market.

Every. Product.

That includes:
— Your IoT toaster
— Your SaaS product
— Your embedded firmware
— Your mobile app
— Your industrial controller

And from 11 December 2027, non-compliance can cost you 2.5% of global turnover.

Annex I has 13 essential requirements. The one everyone misses:

"Delivered with a secure-by-default configuration."

Translation: if your product ships with default passwords, exposed admin interfaces, or unencrypted defaults — you've breached Annex I §1.2 before the product leaves the factory.

I built an MCP that audits your product against all 13 Annex I requirements and generates the SBOM + vulnerability-handling policy the notified body will ask for.

Pro tier now emits an HMAC-signed attestation your auditor can validate at a public URL — no access to our backend needed.

Link in first comment.
```

**Comment:** `pip install cra-compliance-mcp — free 10/day, Pro £79/mo includes signed attestations: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 2 — Wednesday 9am UK
**Topic:** CSRD double materiality — "80% of companies get this wrong"

```
CSRD double materiality is the point where 80% of first-time reporters fall over.

The ESRS requires you to assess materiality in TWO directions:

1. Impact materiality — how does your business impact people + planet
2. Financial materiality — how do sustainability matters impact YOUR financial performance

Most companies do (2) well. Most skip (1) because their CFO doesn't think it applies.

EFRAG ESRS 1 §3.2 says both are required.

The thresholds matter. CNIL-equivalent ANC penalties can hit €3.75M per breach in France. Germany tops out at €2M. And these are just the national fines — separate from the assurance rejection that kills your ESG equity story.

I built a double-materiality MCP that walks you through the 12 ESRS topical standards, runs the impact + financial axis scoring, and flags where your Phase 1 reporters are vulnerable.

Pro tier generates a cryptographically signed readiness attestation that limited-assurance auditors (EY/KPMG/PwC/Deloitte/Mazars) can validate via public verify URL.

Link in first comment.
```

**Comment:** `pip install csrd-compliance-mcp — Free tier, Pro £79/mo signs: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 3 — Thursday 9am UK
**Topic:** AI-BOM — "what EU AI Act Annex IV actually requires vs what vendors ship"

```
If you sell AI to an EU high-risk-system buyer, you need an AI-BOM.

Not a model card. Not a datasheet.

An **AI Bill of Materials** with 10 field categories, all 10 populated, per Article 11 + Annex IV.

The 10 categories:
1. Model identity (version, licence, organisation, hash)
2. Model architecture (params, context window, compute flops)
3. Training data (sources, sizes, provenance, filtering, copyright)
4. Fine-tuning history (base model, method, steps, RLHF)
5. Evaluation (benchmarks, scores, bias results, red team)
6. Dependencies (inference engines, tokenisers, safety filters)
7. Security controls (prompt injection defence, PII scrubbing)
8. Governance (risk class, human oversight, incident contact)
9. Usage restrictions (AUP, prohibited cases, export control)
10. Distribution (channels, update cadence, decommissioning)

Most "AI-BOMs" I see cover 3-4 categories.

CycloneDX ML-BOM 1.6 and SPDX 3.0 AI profile are the two recognised formats. The NTIA/CISA AI Cyber Report 2024 + OMB M-22-18 map both to the EU Annex IV fields.

I built an MCP that generates the full 10-category AI-BOM in either format, audits completeness, and — Pro tier — emits a signed attestation your federal or EU procurement contact can verify.

Link in first comment.
```

**Comment:** `pip install ai-bom-mcp — Free tier, Pro £79/mo signs: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 4 — Friday 9am UK
**Topic:** One incident, five clocks — unified AI incident reporting

```
A single AI incident can trigger five different regulatory clocks.

Here's a lending-bias incident for an EU bank deploying high-risk AI:

— EU AI Act Art 73: 15 days to market-surveillance authority
— DORA Art 19: 4 hours initial, 72 hours intermediate, 1 month final
— NIS2 Art 23: 24 hours early warning, 72 hours notification, 1 month final
— GDPR Art 33: 72 hours to supervisory authority
— ISO 42001 clause 9: 48 hours to internal AIMS committee

Miss the tightest — 4 hours — and you've breached DORA before you've even classified the incident.

Most incident-response runbooks cover one regime. Maybe two.

I built an MCP that takes one incident description + your entity type and emits the full decision tree: every regime that applies, every clock that starts, every authority to notify, every form to file.

Pro tier signs the post-incident response cert so your auditor can validate it via public URL.

Link in first comment.
```

**Comment:** `pip install ai-incident-reporting-mcp — Free 10/day, Pro £79/mo signs: https://buy.stripe.com/00wfZjcgAeUW4c5cyQ8k90K`

---

## Post 5 — Saturday 9am UK
**Topic:** Partnership recap + signed attestations live

```
One week in. Here's what shipped.

20 MCP servers on PyPI. 9 with cryptographically signed HMAC attestations.

One hosted attestation API at meok-attestation-api.vercel.app — public verify for auditors, customer self-serve Pro-key provisioning, Stripe webhook integration.

One tiny verification tool: pip install meok-attestation-verify. Auditors + procurement teams can validate any MEOK cert without touching our backend.

Three new flagship MCPs this week:
— uk-ai-bill-compliance-mcp — UK AI White Paper five principles + upcoming AI Bill readiness
— dora-nis2-crosswalk-mcp — for EU banks in scope for both
— ai-incident-reporting-mcp — one incident, all five regulatory clocks

I'm still looking for 3 GRC consultancies to pilot a partnership. You have:
— Clients racing 2 Nov 2026 Article 50 + 2 Dec 2027 Annex III deadlines
— 3-20 consultants drowning in article-by-article audits

I have:
— 220+ MCP servers that automate the audits
— Signed attestations your clients hand their auditor
— £5k assessments you can white-label at your own pricing
— Revenue share on every Pro subscription (£79/mo)

No exclusivity. No minimum.

Reply here or DM.
```

---

## Metrics to watch — Week 2

- Impressions per post (target: 10k+ as cadence compounds)
- Comments with install command (target: 20+)
- DMs from consultancies (target: 3-5)
- New PyPI installs of new MCPs (target: 200+)
- `meok-attestation-verify` installs (leading indicator of auditor activity)
- Stripe conversions (target: 1-2 Pro signups in week)
