# NLnet NGI Zero Commons Fund — MEOK AI Labs Application
# UPDATED: 2026-05-14 — v1.4.0 with 38 governance MCPs, 7,505 downloads/mo

**Apply at:** https://nlnet.nl/propose
**Deadline:** Round 2026-Jun-01 (apply by 1 June 2026 — 18 DAYS LEFT)
**Funding range:** €5,000 — €50,000 (with optional scale-up)
**Fit:** NGI Zero Commons priorities — open-source compliance tooling, EU AI Act ecosystem, digital sovereignty

---

## Project name
**MEOK Attestation Engine — Open-Source HMAC-Signed Compliance Attestations for the EU AI Act, DORA, NIS2, CRA & GDPR**

## One-line description
A free open-source MCP-server toolkit that generates cryptographically signed compliance attestations for every major EU digital regulation, with verifiable HMAC signatures against a public attestation API.

## Project description (NLnet asks for a few paragraphs)

The European AI ecosystem is approaching seven concurrent regulatory cliff dates between November 2026 and December 2027. The EU AI Act (Article 50 transparency obligations Nov 2026, high-risk systems Dec 2027 post-Omnibus delay), DORA (already in effect Jan 2025), NIS2 (Member State transposition deadlines), the EU Cyber Resilience Act (Reg 2024/2847 — Annex IV essential security requirements), and the GDPR-AI Act intersection (EDPB harmonised DPIA template published 14 April 2026) all require organisations to produce, retain, and present cryptographically attestable compliance evidence.

Today, that evidence is fragmented across PDF binders, screenshots, and manual checklists — none of which scale, and none of which are interoperable between regulators, auditors, or AI-system operators. Commercial compliance platforms (Vanta, Drata, Secureframe) cost £30K-£200K per year, lock evidence behind their proprietary formats, and don't cover EU-specific frameworks.

MEOK AI Labs is building the open-source alternative: a fleet of [Model Context Protocol](https://modelcontextprotocol.io) servers, each focused on one regulatory framework, that an AI agent (Claude, GPT-5, Llama, etc.) can call directly to:

1. **Classify** an AI system or piece of infrastructure against the regulation's risk taxonomy (e.g. EU AI Act Article 6 prohibited / high-risk / limited / minimal)
2. **Generate** the regulatory artifact (DPIA, FRIA, CRA Annex IV declaration, NIS2 BSI register entry, etc.)
3. **Sign** the artifact with HMAC-SHA256 against a public attestation API, producing a verification URL anyone can hit to confirm the document hasn't been tampered with

The signed-attestation infrastructure is already running at https://meok-attestation-api.vercel.app and is verifiable end-to-end. The MCP-server fleet has 240+ packages on PyPI (7,505 monthly downloads), 38 governance-specific MCP servers, and 251+ public repos. All are MIT-licensed.

## What NLnet funding would unlock

This grant would fund the **digital-commons productisation** of the toolkit: extracting the verification core into a standalone, self-hostable module that any organisation can deploy on their own infrastructure (no dependence on the Vercel hosted API). Specifically:

1. **Containerise the attestation API** as a single Docker / Podman image with PostgreSQL backing. Currently it is bound to a Vercel deployment.
2. **Document the wire format** (a small JSON schema) so attestations from one MEOK server can be verified by any other implementation, including future non-MEOK forks.
3. **Add 4 more EU framework MCPs**: ePrivacy Directive 2002/58, NIS2 sector-specific RTS, AI-Liability-Directive (AILD), and the post-Omnibus FRIA amendment.
4. **Internationalise** the documentation into French, German, Italian, and Spanish (4 of the 24 EU official languages, prioritising the largest digital-economy member states).
5. **Run a public bounty** for security audits of the attestation crypto chain (currently HMAC; goal is to move to Ed25519 with a transparent rotating-key registry).

## Open-source posture
- **License:** MIT (already in effect across all 217 repos)
- **Code:** github.com/CSOAI-ORG (will migrate to github.com/meok-ai-labs as the org grows)
- **Issue tracker:** GitHub Issues, public
- **Governance:** BDFL (Nicholas Templeman) initially; transition to a multi-maintainer governance model once funded

## Why MEOK is the right grantee
- **Working software in production today** — not a slideware proposal
- **240+ PyPI packages, 7,505 monthly downloads, 38 governance MCP servers**, all MIT-licensed and downloadable today
- **Public attestation API live** at meok-attestation-api.vercel.app — anyone can verify a MEOK-signed document right now
- **Solo founder, UK-incorporated** (CSOAI LTD, UK Companies House 16939677, London EC2A 4NE) — no big-tech corporate dependency
- **EU-focused** — every MCP targets a specific EU regulation, with cliff dates pinned to the EU regulatory calendar
- **No revenue yet** — at £0 ARR, NLnet's funding is genuinely catalytic and will not displace commercial revenue

## Budget request
**€20,000** (mid-range, scoped to ship the 5 deliverables above in 6 months)
- Containerisation + wire-format docs: €4,000
- 4 new framework MCPs: €8,000
- 4-language i18n: €4,000
- Security audit bounty + Ed25519 migration: €4,000

## Timeline
- **Month 1-2 (Jul-Aug 2026):** Container + wire format
- **Month 3-4 (Sep-Oct 2026):** 4 new framework MCPs
- **Month 5 (Nov 2026):** i18n
- **Month 6 (Dec 2026):** Security bounty + Ed25519 — ship by end of year

## Contact
- **Name:** Nicholas Templeman
- **Email:** nicholas@csoai.org
- **Org:** CSOAI LTD (UK Companies House 16939677)
- **Website:** https://meok.ai
- **GitHub:** https://github.com/CSOAI-ORG

## Reference URLs (for the application form)
- Attestation API health: https://meok-attestation-api.vercel.app/health
- Verifier UI: https://meok-verify.vercel.app
- EU AI Act pillar page: https://meok-eu-ai-act.vercel.app
- Council of AI: https://councilof.ai
- Compliance landing: https://meok-compliance.vercel.app
- Public monorepo: https://github.com/CSOAI-ORG/MEOK-LABS

---

**Action for Nick:**
1. Visit https://nlnet.nl/propose
2. Copy-paste the sections above into the form
3. Submit by 1 June 2026
4. Expected response: 4-6 weeks after deadline
