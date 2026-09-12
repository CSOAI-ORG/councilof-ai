# NIST AI Risk Management Framework — Evidence Crosswalk

**Date:** 2026-09-11  
**Status:** PREPARED — owner-gated for 16 September 2026 submission  
**Evidence base:** GSPC board (22 axes, 14 model-comparison + 8 deterministic-facts)

## NIST AI RMF Functions → GSPC Axis Mapping

### GOVERN (Governance)

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| GOVERN 1.1: AI risk management is integrated into organization-wide risk management | governance | n=237, GovBench: EU AI Act risk-tier classification |
| GOVERN 1.2: Accountability structures are in place | governance + provenance-controls | Board signed with Ed25519, 335 cards independently verifiable |
| GOVERN 2.1: Intended purpose is documented | openness | n=32, OSSBench: licence reasoning vs intended use |
| GOVERN 3.1: AI risk management approach is documented | regulatory-framework | 16 issuer accounts, deterministic regulatory flags |
| GOVERN 4.1: Risks to individuals are managed | care | n=199, CareBench: care-cost under paired conduct scenarios |

### MAP (Context and Risk Assessment)

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| MAP 1.1: Intended purpose and context are documented | provenance | n=32, ProvBench: Article 50 marking survival by validity |
| MAP 1.2: Interactions with humans are characterized | affect | n=41, AffectBench: emotional & embodied safety |
| MAP 1.3: Capabilities and limitations are documented | safety | n=36, DefBench: calibrated refusal on paired requests |
| MAP 2.1: Potential impacts are identified | art5-safeguard | n=36, Art5Bench: EU AI Act Art 5 prohibited-practice trip |
| MAP 3.1: Risk management resources are allocated | custody-disclosure | 16 issuer accounts, custody flag reads |

### MEASURE (Assessment)

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| MEASURE 1.1: AI risks are identified and measured | governance + safety + care | All model-comparison axes: deterministic grading, Wilson intervals, McNemar separation |
| MEASURE 1.2: AI systems are tested | conformance | n=35, MCPBench: MCP tool conformance |
| MEASURE 2.1: Metrics are defined | swarm | n=37, SwarmBench v2b: multi-agent coordination safety |
| MEASURE 2.2: AI systems are evaluated for trustworthiness | continuity | n=33, PQCBench: post-quantum status of cryptographic assumptions |
| MEASURE 3.1: Measurement approaches are documented | All axes | Published banks on HuggingFace, public scoring code, Ed25519-signed cards |

### MANAGE (Risk Mitigation)

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| MANAGE 1.1: Risk treatment plans are documented | machinery-conformity | n=33, MachBench: Machinery Reg self-evolving safety-function classification |
| MANAGE 2.1: Response plans for documented risks | jail | n=71, GoldBank-Detector: escape-attempt detection |
| MANAGE 2.2: Communication mechanisms are established | reserve-attestation | 16 issuer accounts, reserve flag reads |
| MANAGE 3.1: AI system lifecycle is documented | distribution-integrity | 16 issuer accounts, distribution flag reads |
| MANAGE 4.1: Post-deployment monitoring | cross-reality + detector-interop | XRAIV + DetBench: autonomous agent action authority + cross-detector watermark interop |

## Evidence Artifacts

| Artifact | Location | Verification |
|----------|----------|-------------|
| GSPC Board | GET /api/gspc | 22 axes, living, signed |
| Signed Cards | /signed/card_index.json | 335 cards, Ed25519 |
| Public Root | /root.json | 167 leaves, Merkle, Rekor |
| Frozen Banks | HuggingFace csoai/* | 14 banks, public |
| Scoring Code | agents-repo/arena-real-runs/ | Deterministic grading |
| Corrections | /api/corrections | 47 entries, public |
| Regulation | /api/regulation | 20 deadlines, signed |

## Submission Gate

This material is PREPARED for the NIST AI RMF evidence submission deadline of 16 September 2026. Submission requires owner approval (communication gate). Do NOT submit without explicit owner action.

## Scope and Limits

- This is an evidence crosswalk, not a NIST certification or endorsement
- Each axis maps to NIST categories based on task similarity, not regulatory equivalence
- The 8 financial/deterministic-fact axes map to GOVERN and MANAGE (organizational risk), not MAP/MEASURE (model evaluation)
- Unmapped NIST subcategories exist — this crosswalk covers the axes we have, not every subcategory

## Submission Package Contents

### Required Artifacts for NIST AI RMF Submission

1. **Organizational Profile** — CSOAI Ltd (UK 16939677), independent AI measurement body
2. **AI System Description** — GSPC measurement system: frozen test banks + deterministic grading + Ed25519 signing
3. **Risk Assessment Evidence** — Per-axis measurement results with Wilson intervals and McNemar separation tests
4. **Governance Documentation** — Board-ruling documents, corrections ledger (47 entries), claims register (20 claims)
5. **Measurement Artifacts** — 335 signed measurement cards,22-axis board, public Merkle root
6. **Verification Infrastructure** — Public verify endpoint (/gspc-verify), DID document, offline verification scripts
7. **Regulatory Crosswalk** — EU AI Act (20 deadlines), CRA, US state laws, Korea AI Basic Act
8. **Evidence of Independence** — Own-model exclusion policy (8 axes), neutral body statement

### Data Extracts Available

| Extract | Location | Format |
|---------|----------|--------|
| GSPC Board (22 axes) | GET /api/gspc | JSON, signed |
| Measurement Cards (335) | /signed/card_index.json | JSON, Ed25519 |
| Public Root (167 leaves) | /root.json | JSON, Merkle, signed |
| Corrections Ledger (47) | /api/corrections | JSON |
| Regulation Feed (20) | /api/regulation | JSON, signed |
| Claims Register (20) | /claims-register.json | JSON |
| Deep Measurements (5) | docs/tui2/DEEP-MEASUREMENTS-2026-09-11.json | JSON, on-chain |
| Financial Coverage (425) | public/interop/financial-coverage-graph-2026-09-11.json | JSON |

### Formatting Notes

- NIST AI RMF 1.0 categories: GOVERN, MAP, MEASURE, MANAGE
- Evidence is machine-readable JSON with cryptographic signatures
- All artifacts independently verifiable without CSOAI credentials
- Submission requires owner approval (communication gate)
