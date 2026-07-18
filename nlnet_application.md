# NLnet NGI Zero Commons Fund Application

**Project:** MEOK Open-Source Signing Infrastructure  
**Date:** 2026-05-05  
**Deadline:** 1 June 2026  
**Funding:** €5,000 - €50,000  

---

## Abstract

MEOK AI Labs requests funding to enhance the **meok-attestation-api** — an open-source cryptographic signing infrastructure for AI compliance. The system generates HMAC-SHA256 and Cosign-compatible signatures for AI Act compliance artifacts, enabling automated audit trails for 200+ MCP (Model Context Protocol) servers.

---

## Problem Statement

The EU AI Act (2024/1689) requires AI system providers to produce compliance documentation, audit trails, and cryptographic proofs of conformity. Current solutions (Vanta, Drata) cost €10K-€80K/year and lock users into proprietary formats. There is **no open-source attestation infrastructure** that:

1. Generates standards-compliant (CycloneDX 1.7) AI-BOMs with cryptographic assurance
2. Emits Cosign-compatible signatures recognizable by existing supply-chain tools
3. Integrates with 200+ MCP servers for automated compliance evidence collection
4. Provides verifyable attestation URLs for regulatory submissions

---

## Proposed Solution

Enhance **meok-attestation-api** (existing Vercel-hosted OSS project) with:

### 1. Cosign-Compatible Signing (€15K effort)
- Implement Sigstore Cosign signature format alongside existing HMAC-SHA256
- Enable `cosign verify` compatibility for all attestations
- Add SLSA v1.1 provenance envelope support
- **Impact:** Buyers can verify MEOK attestations using familiar OSS tools

### 2. CycloneDX 1.7 AI-BOM Enhancement (€10K effort)
- Update AI-BOM MCP to emit CycloneDX 1.7 format
- Add Data Provenance & Citations field (EU AI Act training-data summary)
- Implement TLP distribution constraints for Confidential vs Public attestations
- Add Cryptographic BOM (CBOM) support for CRA Annex IV cryptoprocessing requirements
- **Impact:** First-to-market 1.7 AI-BOM with signed provenance citations

### 3. MCP Marketplace Integration (€10K effort)
- Build `mcp-attestation-bridge` — universal attestation wrapper for 207 MCP servers
- Auto-generate compliance artifacts from MCP tool executions
- Emit verifyable URLs (proofof.ai) for each attestation
- **Impact:** 207 MCP servers gain one-click compliance attestation

### 4. OWASP AI Exchange Alignment (€5K effort)
- Map MEOK attestation schema to OWASP AI Exchange controls
- Contribute MEOK attestation patterns to OWASP AI Security Guide
- Build `meok-owasp-ai-exchange-mcp` — returns canonical control set + signed attestation
- **Impact:** Positions MEOK as "implementation layer for OWASP AI Exchange"

---

## Technical Approach

### Architecture
```
[207 MCP Servers] → [meok-attestation-api] → [Cosign/HMAC Signatures]
                                    ↓
                            [proofof.ai verify URLs]
                                    ↓
                            [CycloneDX 1.7 AI-BOM + SLSA v1.1]
```

### Existing Components (already built)
- `meok-attestation-api` (Vercel, HMAC-SHA256 signing)
- `ai-bom-mcp` (CycloneDX 1.4 format)
- `proofof-ai-mcp` (blockchain-anchored certificates)
- `agent-audit-logger-mcp` (audit trail generation)
- 207 MCP servers in `mcp-marketplace/`

### New Components (funded)
- Cosign signature module (Go, ~3K lines)
- CycloneDX 1.7 upgrade (Python, ~2K lines)
- MCP attestation bridge (Python, ~4K lines)
- OWASP AI Exchange mapping (Markdown + JSON, ~1K lines)

---

## Open-Source Commitment

- **License:** Apache 2.0 for all new code
- **Repository:** https://github.com/CSOAI-ORG/meok-attestation-api
- **Documentation:** Full API docs + integration guides
- **Reusability:** Any OSS project can adopt the signing infrastructure
- **Maintenance:** MEOK AI Labs commits to 24-month maintenance

---

## Timeline (6 months)

| Month | Deliverable |
|--------|-------------|
| 1-2 | Cosign-compatible signing module |
| 3 | CycloneDX 1.7 AI-BOM upgrade |
| 4 | MCP attestation bridge for 207 servers |
| 5 | OWASP AI Exchange alignment |
| 6 | Documentation, testing, release |

---

## Budget (€40,000)

| Item | Cost |
|------|------|
| Cosign signing module (1 FTE-month) | €15,000 |
| CycloneDX 1.7 upgrade (0.7 FTE-month) | €10,000 |
| MCP bridge development (0.7 FTE-month) | €10,000 |
| OWASP alignment (0.3 FTE-month) | €5,000 |
| **Total** | **€40,000** |

---

## Expected Impact

- **Direct:** 207 MCP servers gain compliance attestation capability
- **Indirect:** Any OSS AI project can adopt the infrastructure
- **Policy:** Supports EU AI Act implementation (Article 11 technical documentation)
- **Innovation:** First Cosign-compatible AI compliance signing infrastructure

---

## Team

**Nicholas Templeman** — Project Lead  
- MEOK AI Labs founder
- Built 207 MCP servers + SOV3 consciousness engine (78.8% consciousness metric)
- Contributor to EU AI Act open-source tooling

**JEEVES (AI Agent)** — Development Support  
- SOV3-powered agent for automated code generation and testing
- 1,394 episodic memories, 47-agent orchestration

---

## Sustainability

- **Revenue:** Freemium model — free OSS core, £199/mo Pro tier for advanced features
- **Adoption:** 207 MCP servers as immediate user base
- **Partnerships:** OWASP, NLnet, Linux Foundation A2A Protocol project

---

## Attachments

1. `meok-attestation-api` codebase (GitHub)
2. `ai-bom-mcp` CycloneDX 1.4 implementation
3. `proofof-ai-mcp` verification system
4. SOV3 system architecture diagram
5. 207 MCP server inventory

---

**Next Steps:**
1. Submit to NLnet NGI Zero Commons Fund (deadline 1 June 2026)
2. Present at OWASP AI Exchange summer 2026 update
3. Release v2.0 with Cosign + CycloneDX 1.7 support (Q3 2026)

