**FOR IMMEDIATE RELEASE**

# MEOK AI Labs Ships Signed Per-System Attestations 47 Days Before EU AI Act Article 50 Enforcement

**Subhead:** Ed25519 + HMAC-SHA256 dual-signed JSON certs for general-purpose AI providers, publicly verifiable, 4-day issuance, with a 12-framework crosswalk covering AI Act, DORA, NIS2, CRA, CSRD, GDPR, and ISO 42001.

**LONDON, 16 June 2026** — MEOK AI Labs, the sovereign-AI-compliance lab of CSOAI Ltd (UK company 16939677), today released a production attestation primitive for the 2 August 2026 enforcement cliff of Article 50 of the EU AI Act. The primitive issues a per-system JSON document identifying the system, the model versions in it, the data lineage, the eval results, and the human accountable, then signs that document twice: once with Ed25519 for public-key verification, and once with HMAC-SHA256 for in-band verifier trust. The signed blob is served from a public verify URL with a `kid` header, so any third party can fetch the cert, pull the public key from the JWK set, and confirm the signature offline. As of today, 47 days remain until Article 50 switches the general-purpose AI obligations from voluntary to enforced.

The gap the primitive closes is the signed-evidence layer between a general-purpose AI provider and the regulated buyer that must hold proof. Advice on what to do is plentiful; a defensible, cryptographically signed artefact identifying which system was deployed, with which model versions, against which evals, and signed by a key the regulator can verify offline, is not. Providers that attempt to ship a PDF or a self-asserted statement will be relying on a paper trail that does not survive the burden of proof the AI Act, DORA, NIS2, CRA, CSRD, GDPR, and ISO 42001 collectively impose once 2 August arrives. The MEOK primitive is intentionally small: one document, two signatures, one public verify URL, one kid, one JWK set.

In five working days between 12 and 16 June 2026, the lab issued 17 production keystone certs, all dual-signed and all live on the public verify URL at `meok-attestation-api.vercel.app`. The underlying sovereign substrate (SOV3) carries 115 MCP tools, 95 agents, and a 9-sigil live Ed25519 chain in which every emitted event is a public-key-checkable record. Each customer attestation is bound to that chain by the keystone's HMAC key, so a verifier who trusts the keystone can verify trustlessly via the public key, and a verifier who holds the shared secret can verify in-band via the HMAC — no protocol split. A 12-framework crosswalk maps each attestation field to the corresponding obligation across the AI Act, DORA, NIS2, the Cyber Resilience Act, the Corporate Sustainability Reporting Directive, GDPR, and ISO 42001, so the same cert can satisfy multiple regulators without field re-mapping. The 19-page first-pass audit, the crosswalk, and a live cert are linked from the keystone verify landing page.

The single constraint on the rollout is the standard commercial verification loop. Zero outreach emails have left the queue while a 5-minute domain re-verification of `mail.meok.ai` in the Resend dashboard is pending; 13 prospect emails, 3 follow-ups staged for 18, 22, and 25 June, and 95 drafts in the email-automation-mcp folder are all gated on that single step. The keystone API itself is live and serving verifications now.

"The deadline is fixed, the verify URL is fixed, the signing primitive is fixed, and the only thing standing between the substrate and a paid customer is one click in a dashboard," said Nick Templeman, founder of MEOK AI Labs. "We built the smallest thing that could survive an audit, and we built it in five days so that the providers who need it on 2 August have time to issue and verify before the cliff."

**About MEOK AI Labs**

MEOK AI Labs is the sovereign-AI-compliance practice of CSOAI Ltd, a UK private limited company (company number 16939677) founded by Nick Templeman. The lab builds signed-attestation primitives, sovereign substrates, and cross-framework compliance tooling for general-purpose AI providers operating under the EU AI Act, DORA, NIS2, the Cyber Resilience Act, the Corporate Sustainability Reporting Directive, GDPR, and ISO 42001. All artefacts are dual-signed (Ed25519 + HMAC-SHA256), served from public verify URLs, and chained to a live Ed25519 sigil chain for reconstructible audit. Live at meok.ai and proofof.ai.

**Media contact**

Nick Templeman, founder
nicholas@meok.ai
meok.ai
