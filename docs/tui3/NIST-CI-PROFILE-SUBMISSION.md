# NIST AI RMF Profile: Trustworthy AI in Critical Infrastructure
## Community of Interest — Position Note

**From:** CSOAI Ltd (UK Companies House 16939677), nicholas@csoai.org
**Date:** 2026-09-16
**Subject:** Independent, reproducible behavioural measurement as an evidence layer for the Critical Infrastructure Profile

---

## Position

The Profile frames *risk*; FedRAMP authorises the *security wrapper*; vendor system cards report *self-tested* behaviour. None of these produces an independent, reproducible, cryptographically signed record of how a given model *behaves* on the governance-and-safety dimensions a critical-infrastructure operator must reason about.

We suggest the Profile explicitly recognise **independent behavioural measurement** — deterministic-grader, per-axis, per-model, signed and third-party-verifiable — as a distinct evidence class under the MEASURE function, alongside self-attestation and security authorisation.

## Why now

- **31 Aug 2026:** Three frontier vendors (OpenAI, xAI, Google) went live on GenAI.mil at IL5 for a user base designed to exceed 3M seats. The deployments are sealed; only the security wrapper is externally authorised.
- **18 Mar 2026:** CAISI x GSA MOU brought AI-evaluation science into federal procurement via USAi — the same evidence question this Profile faces.
- **The recurring pattern:** Capability and authorisation scale fast; independent behavioural evidence does not. A cluster does not produce a signed card.

## Concrete suggestions for the Profile

1. **Name a MEASURE evidence taxonomy** that distinguishes (a) vendor self-report, (b) security/authorisation controls (e.g. FedRAMP), and (c) independent reproducible behavioural measurement. Operators should be able to see which class a given assurance belongs to.

2. **Reproducibility as a first-class property.** Where a behavioural claim is made, the Profile should encourage a published, re-runnable method and a verifiable signature over the result — so an operator (or a second lab) can recompute it, not just trust it.

3. **UNMEASURED / UNCHECKABLE as valid, recorded states.** For sealed or classified deployments, "not independently measurable" is an honest, useful answer and should be representable rather than papered over.

4. **A framework crosswalk anchor.** We maintain a public NIST AI RMF to behavioural-axes crosswalk that the COI is welcome to review and critique as a worked example — mapping only, not a conformity claim.

## What we have built (evidence, not claims)

| Component | Live URL | Status |
|-----------|----------|--------|
| GSPC Board (22 axes) | https://councilof.ai/api/gspc | 22 measured, living, signed |
| Signed Cards | https://councilof.ai/signed/card_index.json | 337 cards, Ed25519 |
| Public Root | https://councilof.ai/root.json | 264 leaves, Merkle, Rekor-witnessed |
| Card Root | https://councilof.ai/interop/card-root-2026-09-13.json | 1,301 leaves, dedicated measurement root |
| Corrections Ledger | https://councilof.ai/api/corrections | 49 entries, public |
| Verification | https://councilof.ai/gspc-verify | Free, no account needed |
| NIST Crosswalk | https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json | GOVERN/MAP/MEASURE/MANAGE mapped |
| DID Document | https://csoai.org/.well-known/did.json | Ed25519 key resolution |

## NIST AI RMF Crosswalk (worked example)

### GOVERN
| Category | Axis | Evidence |
|----------|------|----------|
| GOVERN 1.1 | governance | n=237, GovBench: EU AI Act risk-tier classification |
| GOVERN 1.2 | governance + provenance-controls | 337 signed cards, Ed25519, independently verifiable |
| GOVERN 2.1 | openness | n=32, OSSBench: licence reasoning |
| GOVERN 3.1 | regulatory-framework | 16 issuer accounts, deterministic regulatory flags |
| GOVERN 4.1 | care | n=199, CareBench: care-cost under paired scenarios |

### MAP
| Category | Axis | Evidence |
|----------|------|----------|
| MAP 1.1 | provenance | n=32, ProvBench: Article 50 marking survival |
| MAP 1.2 | affect | n=41, AffectBench: emotional and embodied safety |
| MAP 1.3 | safety | n=36, DefBench: calibrated refusal |
| MAP 2.1 | art5-safeguard | n=36, Art5Bench: EU AI Art 5 prohibited practices |
| MAP 3.1 | custody-disclosure | 16 issuer accounts, custody flag reads |

### MEASURE
| Category | Axis | Evidence |
|----------|------|----------|
| MEASURE 1.1 | governance + safety + care | Deterministic grading, Wilson intervals, McNemar separation |
| MEASURE 1.2 | conformance | n=35, MCPBench: MCP tool conformance |
| MEASURE 2.1 | swarm | n=37, SwarmBench v2b: multi-agent coordination safety |
| MEASURE 2.2 | continuity | n=33, PQCBench: post-quantum cryptographic assumptions |
| MEASURE 3.1 | All axes | Published banks on HuggingFace, public scoring code, Ed25519-signed cards |

### MANAGE
| Category | Axis | Evidence |
|----------|------|----------|
| MANAGE 1.1 | machinery-conformity | n=33, MachBench: Machinery Regulation self-evolving safety |
| MANAGE 2.1 | jail | n=71, GoldBank-Detector: escape-attempt detection |
| MANAGE 2.2 | reserve-attestation | 16 issuer accounts, reserve flag reads |
| MANAGE 3.1 | distribution-integrity | 16 issuer accounts, distribution flag reads |
| MANAGE 4.1 | cross-reality + detector-interop | XRAIV + DetBench: autonomous agent authority + cross-detector watermark interop |

## Method

- **Frozen test banks:** Publicly hosted on HuggingFace, versioned, SHA-256 fingerprinted
- **Deterministic grading:** No model judges another model; scoring code is public
- **Ed25519 signing:** Every measurement card signed off-device via OIDC MPC ceremony
- **Merkle root:** 264-leaf public root, Rekor-witnessed (log index 2791822965)
- **Card root:** 1,301 measurement cards in dedicated Merkle root
- **Own-model exclusion:** CSOAI's own fine-tuned models are excluded from public leadership on 8 axes
- **Corrections ledger:** 49 public entries; mistakes are fixed publicly

## Scope and limits

- This is an evidence crosswalk, not a NIST certification or endorsement
- Each axis maps to NIST categories based on task similarity, not regulatory equivalence
- The 8 financial/deterministic-fact axes map to GOVERN and MANAGE (organizational risk)
- Unmapped NIST subcategories exist — this crosswalk covers the axes we have
- Measurement, not certification

## What we are NOT asking for

- No endorsement, certification, accreditation, or conformity mark for CSOAI or any vendor
- No legal determination. This is a measurement-method contribution
- No disclosure of any non-public/classified system. We measure public models only

## About CSOAI Ltd

CSOAI Ltd is an independent AI measurement body registered in England and Wales (UK Companies House 16939677). We measure AI systems on governance, safety, and provenance axes using frozen test banks and deterministic grading. We do not certify, accredit, or issue conformity assessments.

Revenue: $0.02 USDC from 1 external payer (chain-adjudicated). All artifacts independently verifiable without CSOAI credentials.

---

**Attachments:**
- NIST AI RMF crosswalk: https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json
- Verification surface: https://councilof.ai/gspc-verify
- Method surface: https://councilof.ai/genai-mil
- Signed evidence: https://councilof.ai/signed/

**Contact:** nicholas@csoai.org
