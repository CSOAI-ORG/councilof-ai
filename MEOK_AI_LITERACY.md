# MEOK AI Labs — Article 4 AI Literacy

**Required by:** EU AI Act Article 4 (in force since 2 February 2025)
**Scope:** Everyone operating MEOK MCPs and the meok-attestation-api on behalf of MEOK AI Labs Ltd.
**Last reviewed:** 2026-06-07
**Owner:** Nicholas Templeman (nicholas@meok.ai)
**Companies House:** 16939677

---

## 1. Article 4 in plain English

> Providers and deployers of AI systems must take measures to ensure, to their best extent, a sufficient level of AI literacy of their staff and other persons dealing with the operation and use of AI systems on their behalf.

"Sufficient" is contextual: a 1-person operation maintaining 14 compliance MCPs needs deep domain literacy. A 1000-person SaaS using ChatGPT for sales emails needs broad literacy.

## 2. MEOK headcount + roles

| Role | Person | Article 4 burden |
|---|---|---|
| Provider, developer, operator | Nicholas Templeman | Deep — covers all MCPs + the attestation API |

(MEOK has no other staff. Any future hire is added to this register on day one.)

## 3. Required literacy areas

| Area | Why | Evidence of MEOK competence |
|---|---|---|
| EU AI Act articles + recitals | Provider of EU AI Act compliance tools | 14 MCPs cite specific articles in tool docstrings; 404 EUR-Lex articles indexed locally; FTS5 lookup proves familiarity with the text |
| DORA, NIS2, CRA, CSRD, GDPR, ISO 42001, NIST AI RMF | Cross-regulation crosswalks shipped | One MCP per regulation + cross-references graph (`cross_references_for_article`) |
| HMAC-SHA256 + cryptographic attestations | Every audit output is signed | meok-attestation-api/api/index.py — full implementation |
| Stripe webhook signature verification | PAYG security | `_verify_stripe_signature()` implemented per Stripe's recommended pattern |
| C2PA + watermarking + Article 50 | meok-watermark-attest-mcp shipped | Tool covers C2PA + invisible watermark + perceptual fingerprint |
| Fairness metrics + EEOC 4/5ths | bias-detection-mcp `analyze_demographic_parity` | Closed warm GH issue #1 with shipped tool |
| Notified Body process (ISO 42001) | Pre-certification gap analysis at £5,000 | Council of AI storefront productises this |

## 4. Training log

| Date | Topic | Evidence |
|---|---|---|
| 2026-05-13 | EUR-Lex Cellar SPARQL ontology mastery | eu-ai-act-compliance-mcp v1.4 EUR-Lex sync ships |
| 2026-05-17 | 7 May 2026 Digital Omnibus political agreement | Timeline updated in eu-ai-act-compliance-mcp v1.5.1; landing pages reanchored to 2 Aug 2026 Article 50 cliff |
| 2026-06-02 | DORA RTS-compliant incident reporting templates | dora-compliance-mcp v1.4.0 ships `generate_incident_report` |
| 2026-06-02 | ISO 42001 ↔ EU AI Act crosswalk | eu-ai-act-compliance-mcp v1.7.0 ships `iso_42001_crosswalk` |
| 2026-06-03 | Stripe webhook + customer metadata as PAYG database | meok-attestation-api ships `/payg/*` endpoints |
| 2026-06-07 | EU AI Act Article 10 / Recital 72 EEOC 4/5ths rule | bias-detection-mcp v1.2.0 ships `analyze_demographic_parity` |

(This log is appended-only. New training entries land via commit + the audit verifier will detect tampering.)

## 5. Continuing education mechanism

- **Daily** — automated EUR-Lex sync detects regulatory changes; GH issue auto-created if anything material moves.
- **Daily** — `payg-smoke.yml` runs the PAYG contract test; failure auto-opens an issue.
- **Weekly** — review of MCP downloads (`pypistats` API) + open GH issues.
- **Monthly** — review of this literacy doc + the risk register; bump dates; add new entries.
- **Quarterly** — full self-audit (this very doc set) re-run.

## 6. External signals of literacy

- 12 of 14 MEOK MCPs are published to PyPI with passing CI; ~16,300 monthly installs as of June 2026.
- GH Actions show 7+ consecutive successful daily EUR-Lex syncs.
- Public technical writing: origin story, EU AI Act for legal tech / fintech / healthcare / HR, DORA Belgium late-fee recovery, UK AI Bill 2026 commentary.
- NLnet grant proposals (attestation-api, prompt-firewall, AI-BOM) — peer-reviewed proof of subject competence.

## 7. Signed attestation

Cert ID: `meok-ai-literacy-2026-06-07`. Verify via meok-attestation-api `/verify` endpoint. If MEOK silently rewrites this doc, the signature breaks.
