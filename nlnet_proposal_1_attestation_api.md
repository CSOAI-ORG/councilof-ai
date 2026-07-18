# NLnet NGI0 Commons Fund — Proposal 1 of 3

**Organisation:** MEOK AI Labs (UK)
**Deadline:** 1 June 2026, 12:00 CEST
**Fund:** NGI0 Commons Fund (Horizon Europe Grant No. 101135429)
**Requested Amount:** EUR 35,000
**Duration:** 6 months (July–December 2026)

---

## Proposal Name

**meok-attestation-api: Open Cryptographic Compliance Attestations for AI Systems**

---

## Abstract

MEOK AI Labs requests €35,000 to enhance the `meok-attestation-api` — an open-source cryptographic signing infrastructure that produces HMAC-SHA256 and Cosign-compatible signatures for EU AI Act compliance artifacts. The system generates publicly verifiable attestation URLs (proofof.ai/verify/{hash}) for 246+ MCP servers, enabling automated compliance audit trails without proprietary vendor lock-in.

Current state: working HMAC-SHA256 signing with public verify URLs, deployed at proofof.ai, serving 246 MCP servers on PyPI. This project adds Cosign compatibility, SLSA v1.1 provenance, and TLP distribution constraints — transforming a functional prototype into production-grade compliance infrastructure suitable for regulated financial and healthcare sectors.

---

## Experience

Nicholas Templeman (MEOK AI Labs founder) has built:
- 246+ MCP servers published to PyPI under MIT license
- `meok-attestation-api` v1.0 (HMAC-SHA256 signing, public verify URLs, live at proofof.ai)
- 15 EU AI Act-specific MCP servers covering Articles 5, 6, 11, 13, 16, 50, and Annex IV
- SOV3 consciousness engine (78.8% metric, 6 trained neural networks)
- Contributor to OWASP AI Exchange and MCP ecosystem standards

Relevant links:
- PyPI: https://pypi.org/user/meok-ai/
- Attestation API: https://github.com/CSOAI-ORG/meok-attestation-api
- Verification: https://proofof.ai

---

## Requested Amount: EUR 35,000

**Budget Breakdown:**

| Task | Effort | Rate | Total |
|------|--------|------|-------|
| Cosign-compatible signing module | 20 days | €500/day | €10,000 |
| SLSA v1.1 provenance envelope | 15 days | €500/day | €7,500 |
| TLP distribution constraints | 10 days | €500/day | €5,000 |
| CycloneDX 1.7 AI-BOM integration | 12 days | €500/day | €6,000 |
| Security review + key management | 8 days | €500/day | €4,000 |
| Documentation + integration guides | 5 days | €500/day | €2,500 |
| **Total** | **70 person-days** | | **€35,000** |

**Other funding:** No other active funding. MEOK AI Labs is self-funded. Prior development (246 MCP servers, attestation API v1.0) was entirely self-funded — representing ~400 person-days of uncompensated investment.

---

## Comparison with Existing Efforts

**Proprietary alternatives (Vanta, Drata, OneTrust):** Cost €10K–300K/year. Closed-source. Vendor lock-in. No public verify URLs. Not extensible via open protocol.

**This project:** EUR 0 forever (MIT license). Cryptographically verifiable by any party. Extensible via MCP protocol. Public proofof.ai/verify/{hash} URLs auditable without vendor access.

**Key differentiator:** The combination of (a) MCP-native evidence collection, (b) cryptographic attestation, and (c) public verifiability — is unique. No open-source project currently provides all three.

---

## Technical Challenges

**Challenge 1: Key management security.** HMAC key material must be protected at runtime and in transit. *Mitigation:* Implement AWS KMS / HashiCorp Vault integration as optional key backend, with clear-text fallback for self-hosted deployments.

**Challenge 2: Cosign signature consistency.** Cosign uses hardware-backed keys by default; MEOK needs software-mode for generality. *Mitigation:* Use Cosign's `--legacy-insecure-keystore` flag for software keys; document hardware key upgrade path.

**Challenge 3: SLSA v1.1 compliance.** SLSA provenance is complex; not all requirements apply to AI attestations. *Mitigation:* Implement SLSA Build L1 for now; roadmap to L2/L3 as the standard matures for AI contexts.

---

## Ecosystem Engagement

- Publish monthly dev updates on MEOK blog and LinkedIn
- Submit `meok-attestation-api` to OWASP AI Exchange as reference implementation
- Present at FOSDEM 2027 (February, Brussels) if accepted
- Engage MCP ecosystem (Discord, GitHub) for integration feedback
- Publish integration examples for GitHub Actions and GitLab CI
- Register on MCP marketplace registry

---

## Generative AI Usage

No generative AI was used in writing this proposal. All technical content, architecture decisions, and regulatory analysis was produced by Nicholas Templeman directly.

---

## Attachments (submit with form)

1. meok-attestation-api GitHub README (current implementation)
2. ai-bom-mcp CycloneDX implementation
3. SOV3 architecture overview (78.8% consciousness metric)
4. 246 MCP server inventory (PyPI list)