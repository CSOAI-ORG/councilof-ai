# NLnet NGI0 Commons Fund — Proposal 3 of 3

**Organisation:** MEOK AI Labs (UK)
**Deadline:** 1 June 2026, 12:00 CEST
**Fund:** NGI0 Commons Fund (Horizon Europe Grant No. 101135429)
**Requested Amount:** EUR 38,000
**Duration:** 7 months (July 2026–January 2027)

---

## Proposal Name

**ai-bom-mcp: Machine-Readable AI Bill of Materials with Cryptographic Provenance**

---

## Abstract

`ai-bom-mcp` is an open-source MCP server that generates AI Bill of Materials (AI-BOMs) in CycloneDX 1.7 format, augmented with cryptographic provenance signatures and publicly verifiable attestation URLs. An AI-BOM documents the components of an AI system — model weights, training data, dependencies, fine-tuning datasets, deployed infrastructure — enabling transparency, supply-chain security, and regulatory compliance for AI systems.

The EU AI Act (Article 11), the Cyber Resilience Act (Annex IV), and the US EO 14110 all require some form of AI component disclosure. There is no open-source tool that generates machine-readable AI-BOMs with cryptographic signatures. Commercial solutions (FOSSA, Revenera) are SaaS-only, proprietary, and do not cover AI-specific components (training data provenance, model cards, inference metadata). This project delivers the first MIT-licensed, MCP-native AI-BOM generator suitable for any AI system deployed via MCP.

---

## Experience

MEOK AI Labs has:
- Published `ai-bom-mcp` v0.1 to PyPI (CycloneDX 1.4 format, basic metadata)
- Built `proofof-ai-mcp` for blockchain-anchored certificate generation
- Integrated with `meok-attestation-api` for HMAC-SHA256 signing
- 246 MCP servers on PyPI providing evidence collection pipeline

Existing implementation:
- `ai-bom-mcp` v0.1: https://pypi.org/user/meok-ai/ (246 packages)
- CycloneDX 1.4 format currently emitted
- Provenance URLs via proofof.ai

---

## Requested Amount: EUR 38,000

**Budget Breakdown:**

| Task | Effort | Rate | Total |
|------|--------|------|-------|
| CycloneDX 1.7 upgrade (data provenance fields) | 15 days | €500/day | €7,500 |
| Training data provenance + citations (EU AI Act Article 11) | 15 days | €500/day | €7,500 |
| Cryptographic signing + attestation URL attachment | 10 days | €500/day | €5,000 |
| CBOM (Cryptographic BOM) for CRA Annex IV | 12 days | €500/day | €6,000 |
| MCP introspection data collection | 10 days | €500/day | €5,000 |
| Integration tests + CBOM/CycloneDX conformance | 8 days | €500/day | €4,000 |
| Documentation + worked examples | 6 days | €500/day | €3,000 |
| **Total** | **76 person-days** | | **€38,000** |

**Other funding:** None. Prior development (v0.1, basic CBOM structure) was self-funded.

---

## Comparison with Existing Efforts

| Tool | Format | Signing | MCP-Native | License |
|------|--------|---------|------------|---------|
| FOSSA SBOM | SPDX/CycloneDX | No | No | Proprietary |
| Revenera | SPDX only | No | No | Proprietary |
| Syft | SPDX/CycloneDX | No | No | Apache 2.0 |
| This project | CycloneDX 1.7 + CBOM | **Yes (HMAC + Cosign)** | **Yes** | **MIT** |

**Key differentiator:** Only open-source AI-BOM tool that combines (a) AI-specific metadata fields (training data, model cards, inference metrics), (b) cryptographic signing, (c) public verifiability, and (d) MCP-native introspection — in a single MIT-licensed package.

---

## Technical Challenges

**Challenge 1: Training data provenance.** Training datasets are often proprietary. *Mitigation:* Allow provenance assertions (signed statements about data sources) rather than requiring raw data disclosure; align with EU AI Act Article 11(1) which requires summary rather than full disclosure.

**Challenge 2: CycloneDX 1.7 schema maturity.** The 1.7 spec includes AI-BOM extensions but they're still draft. *Mitigation:* Implement 1.7 as opt-in; default to 1.4 for stability; contribute back any schema issues to CycloneDX project.

**Challenge 3: CBOM vs CRA.** The Cyber Resilience Act requires CBOM for cryptoprocessing features. *Mitigation:* Implement CBOM as separate profile; detect cryptoprocessing features via MCP introspection.

---

## Ecosystem Engagement

- Submit to CycloneDX project as reference implementation for AI-BOM profile
- Contribute `ai-bom-mcp` mapping to OWASP AI Exchange
- Present at OpenSource Politics / EUFSCAI workshops on AI transparency
- Engage CEN/CENELEC JTC 21 on AI standards
- Publish worked examples for common AI deployment patterns (Hugging Face, Ollama, vLLM)
- Register on MCP marketplace as compliance/preference tool

---

## Alignment with NGI0 Commons Fund

This project fills the AI supply-chain transparency gap in the open internet stack:
- **Full-stack digital commons:** Model development (Hugging Face), deployment (Ollama, vLLM), and orchestration (LangChain, MCP) are open. Compliance tooling is not. AI-BOM fills this gap.
- **Open AI models and open data:** AI-BOM makes training data and model components auditable by regulators without proprietary tooling.
- **Open standards:** CycloneDX 1.7 is an OWASP-maintained open standard. This project advances it.
- **European dimension:** EU AI Act and CRA enforcement begins 2026–2027. Open compliance tooling serves EU SMEs excluded by proprietary solutions.

---

## Generative AI Usage

No generative AI was used in writing this proposal. All technical content was produced by Nicholas Templeman directly.

---

## Attachments (submit with form)

1. ai-bom-mcp current implementation (GitHub README)
2. meok-attestation-api architecture (HMAC signing + verify URL)
3. SOV3 MCP introspection pipeline (how 246 servers collect evidence)
4. CycloneDX 1.7 AI-BOM schema notes (draft extension proposals)