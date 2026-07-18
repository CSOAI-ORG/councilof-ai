# NLnet NGI Zero Commons Fund — application draft

**Deadline:** 1 June 2026, 12:00 CET
**Funding:** €5,000 – €50,000 (typical NGI Zero grant)
**Apply at:** https://nlnet.nl/propose/

**Project name:** MEOK Open Trust Center — verifiable signed compliance attestations as open infrastructure for the EU AI Act + DORA + NIS2 era

**Lead applicant:** Nicholas Templeman (sole proprietor, MEOK AI Labs)

---

## Abstract (200 words max)

The EU AI Act (Aug 2026 → Dec 2027 post-Omnibus), DORA (live since Jan 2025), NIS2 (rolling national transposition) and the Cyber Resilience Act (Dec 2027) are shifting compliance from policy documents to evidence artefacts. Today, the only way to issue verifiable compliance evidence is to pay €10K-€80K/year for a proprietary "Trust Center" SaaS (Vanta, Drata, Secureframe). This locks SMEs out of the regulatory evidence layer and concentrates trust in three US vendors.

MEOK Open Trust Center is an open-source alternative. A self-hosted Next.js + Python stack that any organisation can deploy on Vercel / Cloudflare / their own infrastructure to issue cryptographically signed compliance attestations (HMAC-SHA256 + planned migration to Ed25519 / Sigstore). Every attestation carries a public verify URL that auditors and procurement teams validate without contacting the issuer. Specifically supports EU AI Act, DORA, NIS2, CRA, CSRD, GDPR and the UK AI Regulation framework via 230+ MCP-compatible audit servers already published on PyPI.

The grant funds the migration from symmetric HMAC to Ed25519 + Sigstore so attestations can be verified offline using only a published public key — removing operational dependency on MEOK's infrastructure entirely. This is a real public good: any organisation, anywhere, can run their own trust layer.

---

## Project description (1500 words max — paste into NLnet's web form)

### Problem

The EU regulatory wave (AI Act, DORA, NIS2, CRA, CSRD) shifts compliance from documents that sit in folders to **evidence artefacts that procurement teams, auditors, and competent authorities can independently verify**. The market response has been three US-headquartered SaaS vendors — Vanta, Drata, Secureframe — selling "Trust Centers" at €10K-€80K/year. Each runs proprietary infrastructure; each requires the buyer to trust the vendor; none generates cryptographically signed evidence the auditor can verify offline.

For SMEs, the cost is prohibitive: a £49M-revenue UK fintech facing the EU AI Act + DORA cannot justify €30K/year on a Trust Center subscription. Their compliance team falls back to PDFs in SharePoint — exactly what the regulators are trying to move beyond. For larger organisations, the concentration of trust in three vendors is a single-point-of-failure risk that GDPR's "data sovereignty" rhetoric has not extended to compliance evidence sovereignty.

### Solution

MEOK Open Trust Center is a self-hostable open-source stack:

1. **Signing API** — already deployed at `meok-attestation-api.vercel.app` (Vercel Python serverless function, MIT-licensed). Issues HMAC-SHA256 signed attestations carrying a public verify URL. Today: serves the proprietary MEOK signing key. Post-grant: migrates to Ed25519 keypair where the public key is published openly + offline verification needs zero infrastructure.

2. **MCP audit servers** — 230 Python packages already on PyPI under MEOK_AI_Labs covering EU AI Act, DORA, NIS2, CRA, CSRD, GDPR, UK AI Regulation, HIPAA, SOC 2, ISO 42001, NIST AI RMF + 5 A2A governance MCPs. Each is MIT-licensed and pip-installable. Drives audits via the Anthropic Model Context Protocol (governed by the Linux Foundation, ~97M monthly SDK downloads).

3. **Verify infrastructure** — `meok-attestation-verify` (zero-dependency Python CLI on PyPI) + `meok-verify.vercel.app` (browser interface). Any cert can be validated by anyone without an account.

4. **Trust Center generator** — Next.js template (planned within grant scope) that any org can deploy in 60 seconds to host their own signed attestations, branded under their domain.

### What the grant funds

**Scope: 6-month delivery, €30,000 requested (€5K reserve).**

| Workstream | Hours | Deliverable | Open-source licence |
|---|---|---|---|
| Ed25519 migration of signing API | 60 | `meok-attestation-api` v2.0 with backwards-compat HMAC verification + new Ed25519 path | MIT |
| `meok-attestation-verify` v2.0 with offline Ed25519 + Sigstore Cosign integration | 40 | Verify any cert with only the public key — no network call | MIT |
| Sigstore / SLSA provenance integration for the 230 MCP packages | 80 | Every PyPI release signed with cosign keyless OIDC, `attestations.intoto.jsonl` per release | Apache-2.0 |
| Self-hostable Trust Center Next.js template | 120 | Deploy-to-Vercel button, brand-customisable, HMAC + Ed25519 dual-mode | AGPL-3.0 with commercial-use exception |
| Documentation + reference deployments | 40 | Step-by-step docs, GitHub Pages site, 3 reference deployments (UK SME, EU bank pre-cert, US healthcare) | CC-BY-4.0 |
| Conference talks + community building | 40 | 3 talks at FOSDEM, EOSS, OWASP AppSec EU; community Discord; monthly office hours | — |

### Why this matters for the NGI ecosystem

NGI Zero Commons funds the open infrastructure of the next-generation internet. Compliance evidence is becoming infrastructure. Today it's locked to three US vendors. After this grant, any organisation can:

- Publish a Trust Center under their own domain (Vercel-style 60-second deploy)
- Sign attestations with their own Ed25519 keypair
- Have any third party (auditor, customer, regulator) verify those attestations using only the public key
- No subscription, no vendor lock-in, no data-residency concerns

This aligns with NGI Zero's mission: the building blocks of the next-generation internet should be open, decentralised, and verifiable.

### Track record

- 230 MCP packages published on PyPI under MEOK_AI_Labs (April 2025-April 2026) covering 14 regulatory frameworks
- ~3,000 monthly downloads across the catalogue
- Live signing infrastructure: `meok-attestation-api.vercel.app`
- Verifier on PyPI: `pip install meok-attestation-verify`
- Storefront: `councilof.ai`
- Public catalogue: `meok-attestation-api.vercel.app/catalogue`
- All code MIT-licensed; nothing in the catalogue depends on a proprietary backend (free tiers work fully offline)
- Solo founder, 100% ownership, no investors, no exit pressure

### Existing matching investment

I have invested ~£0 in cash (bootstrapped from contracting income) and ~600 hours of personal time over the last 12 months building the MCP catalogue + signing infrastructure. The grant accelerates the open-infrastructure migration that I would otherwise complete on a 12-18 month bootstrap timeline.

### Risks + mitigations

- **Sigstore project velocity**: Sigstore is mature (used by PyPI for attestations since 2024) but the Python tooling has rough edges. Mitigation: I have already integrated `sigstore-python` for one prototype MCP; the code paths exist.
- **Ed25519 backwards-compat**: existing HMAC certs must remain verifiable for their 365-day life. Mitigation: dual-stack verify path with explicit `signature_algorithm` field.
- **Solo developer bus factor**: I am a single-point-of-failure today. Mitigation: the grant funds adoption / community building; I will recruit 2 co-maintainers within 6 months.
- **Conflict-of-interest with MEOK Pro tier**: MEOK currently sells a £199/mo Pro tier built on the same infrastructure. Open-sourcing the Trust Center generator will reduce my Pro-tier ARR for SME customers. Mitigation: I commit explicitly to this trade-off because the public-good upside (any SME can deploy) exceeds the lost ARR.

### Public goods commitments

- All code MIT (libraries) or AGPL-3.0 (Trust Center template, with commercial-use exception for organisations <€10M revenue)
- All documentation CC-BY-4.0
- Public roadmap on GitHub (CSOAI-ORG/meok-open-trust-center)
- Monthly office hours on Discord
- No telemetry, no analytics phone-home, no required account for any verifier function

### Why now

The EU AI Act deadline shift (Parliament vote 569-45 on 23 March 2026 delaying high-risk to Dec 2027) means organisations now have 16 extra months to do compliance properly — i.e. with verifiable evidence rather than PDF-in-folder hand-waving. The window for open Trust Center adoption is exactly NOW: incumbents (Vanta, Drata) raised series-B/C rounds at $1B+ valuations on the assumption of regulatory-driven proprietary lock-in. An open alternative this year reshapes that incumbent position.

---

## NLnet form fields (their specific structure)

**Title:** MEOK Open Trust Center

**Synopsis (one paragraph):**
Open-source self-hostable Trust Center for cryptographically signed regulatory compliance attestations (EU AI Act, DORA, NIS2, CRA, CSRD, UK AI Regulation, GDPR). Migrates the existing MEOK signing infrastructure from proprietary HMAC to Ed25519 + Sigstore so any organisation can issue verifiable evidence under their own keypair with offline verification, breaking the €10K-€80K/year proprietary Trust Center vendor lock-in (Vanta, Drata, Secureframe).

**Have you been involved with projects or organisations relevant to this project before? And if so, can you tell us a bit about your contributions?**
Sole maintainer of MEOK AI Labs (`pypi.org/user/MEOK_AI_Labs`) — 230 MIT-licensed Python MCP packages for regulatory compliance audits, ~3,000 monthly PyPI downloads. Live signing infrastructure at `meok-attestation-api.vercel.app`. Open-source verifier `meok-attestation-verify` on PyPI. All work bootstrapped from contracting income, no external funding, no investors.

**Requested amount:** €30,000

**Explain what the requested budget will be used for:**
- 60h Ed25519 migration of signing API (€7,200 @ €120/h)
- 40h `meok-attestation-verify` v2.0 with offline Ed25519 + Sigstore (€4,800)
- 80h Sigstore / SLSA provenance integration for 230 MCP packages (€9,600)
- 120h self-hostable Trust Center Next.js template (€14,400 — under-resourced; will draw from existing reserves)
- 40h documentation + reference deployments (€4,800)
- 40h community building + conference talks (€4,800)

**Compare your own project with existing or historical efforts:**
Vanta (Series-C, $2.45B valuation, ~$200M ARR, proprietary closed-source), Drata (~$2B valuation), Secureframe (~$130M raised) — all closed-source proprietary SaaS at €10K-€80K/year. Open-source efforts: AI Verify Foundation (Singapore, focus on AI testing not Trust Center evidence), OWASP AI Exchange (advisory framework, no signing infrastructure), Hyperproof (commercial open-core but no signing). Closest analogue is Sigstore for software supply chain — but Sigstore signs binaries, not regulatory attestations. MEOK Open Trust Center fills the regulatory-evidence-signing gap that Sigstore explicitly does not address.

**What are significant technical challenges you expect to solve during the project?**
1. Backwards-compatible signature scheme migration (HMAC → Ed25519) preserving validity of certs already in the wild
2. Sigstore integration for Python packages with reproducible builds + cosign keyless OIDC under PyPI's existing trusted-publisher infrastructure
3. Trust Center template that deploys in 60s on Vercel / Cloudflare Pages but also self-hostable on a Raspberry Pi
4. UX for non-cryptographers — auditors must be able to verify a cert without understanding what HMAC or Ed25519 is

---

## Submission steps for Nick

1. Go to https://nlnet.nl/propose/
2. Pick "NGI Zero Commons" stream
3. Paste the synopsis + project description above
4. Attach the budget breakdown
5. Reference: `meok-attestation-api.vercel.app/catalogue` for the existing artefacts
6. Submit by 1 June 2026 12:00 CET
7. Decision typically 90 days; money lands within 30 days of approval

**You will hear back ~1 September 2026. Money lands ~1 October 2026.**
