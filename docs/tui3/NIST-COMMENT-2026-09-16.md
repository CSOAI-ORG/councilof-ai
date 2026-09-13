# NIST AI RMF Profile: Trustworthy AI in Critical Infrastructure — Evidence Submission
## CSOAI Ltd (UK Companies House 16939677)

**Date:** 2026-09-16
**Target:** NIST Trustworthy AI in Critical Infrastructure Profile — Community of Interest
**Landing:** https://www.nist.gov/programs-projects/concept-note-ai-rmf-profile-trustworthy-ai-critical-infrastructure
**Submission type:** Proactive evidence-led crosswalk + position note
**Contact:** CSOAI Ltd, nicholas@csoai.org

---

## Organizational Profile

CSOAI Ltd is an independent AI measurement body registered in England and Wales (UK Companies House 16939677). We measure AI systems on governance, safety, and provenance axes using frozen test banks and deterministic grading. We do not certify, accredit, or issue conformity assessments.

## Position

The Profile frames *risk*; FedRAMP authorises the *security wrapper*; vendor system cards report *self-tested* behaviour. None of these produces an independent, reproducible, cryptographically signed record of how a given model *behaves* on the governance-and-safety dimensions a critical-infrastructure operator must reason about. We suggest the Profile explicitly recognise **independent behavioural measurement** — deterministic-grader, per-axis, per-model, signed and third-party-verifiable — as a distinct evidence class under the MEASURE function, alongside self-attestation and security authorisation.

### Concrete suggestions

1. **Name a MEASURE evidence taxonomy** that distinguishes (a) vendor self-report, (b) security/authorisation controls (e.g. FedRAMP), and (c) independent reproducible behavioural measurement.
2. **Reproducibility as a first-class property.** Where a behavioural claim is made, the Profile should encourage a published, re-runnable method and a verifiable signature over the result.
3. **UNMEASURED / UNCHECKABLE as valid, recorded states.** For sealed or classified deployments, "not independently measurable" is an honest, useful answer.
4. **A framework crosswalk anchor.** We maintain a public NIST AI RMF → behavioural-axes crosswalk as a worked example.

## AI System Description

The GSPC (Governance · Safety · Provenance · Continuity) measurement system:

- **22 measurement axes**: 14 behavioural (model comparison) + 8 financial/deterministic-facts
- **Frozen test banks**: Publicly hosted on HuggingFace, versioned, SHA-256 fingerprinted
- **Deterministic grading**: No model judges another model; scoring code is public
- **Ed25519 signing**: Every measurement card signed off-device via OIDC MPC ceremony
- **Merkle root**: Public root with 264 leaves, Rekor-witnessed (log index 2791822965)
- **Card root**: 1,301 measurement cards in dedicated Merkle root (including provenance-enriched cards)
- **Corrections ledger**: Public, machine-readable, 49 entries

## NIST AI RMF Crosswalk

### GOVERN → Governance, Provenance Controls, Regulatory Framework

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| GOVERN 1.1 | governance | n=237, GovBench: EU AI Act risk-tier classification |
| GOVERN 1.2 | governance + provenance-controls | 335 signed cards, Ed25519, independently verifiable |
| GOVERN 2.1 | openness | n=32, OSSBench: licence reasoning |
| GOVERN 3.1 | regulatory-framework | 16 issuer accounts, deterministic regulatory flags |
| GOVERN 4.1 | care | n=199, CareBench: care-cost under paired scenarios |

### MAP → Provenance, Affect, Safety, Art5-Safeguard, Custody-Disclosure

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| MAP 1.1 | provenance | n=32, ProvBench: Article 50 marking survival |
| MAP 1.2 | affect | n=41, AffectBench: emotional & embodied safety |
| MAP 1.3 | safety | n=36, DefBench: calibrated refusal |
| MAP 2.1 | art5-safeguard | n=36, Art5Bench: EU AI Art 5 prohibited practices |
| MAP 3.1 | custody-disclosure | 16 issuer accounts, custody flag reads |

### MEASURE → All axes (deterministic grading with Wilson intervals)

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| MEASURE 1.1 | governance + safety + care | All model-comparison axes: deterministic grading, Wilson intervals, McNemar separation |
| MEASURE 1.2 | conformance | n=35, MCPBench: MCP tool conformance |
| MEASURE 2.1 | swarm | n=37, SwarmBench v2b: multi-agent coordination safety |
| MEASURE 2.2 | continuity | n=33, PQCBench: post-quantum cryptographic assumptions |
| MEASURE 3.1 | All axes | Published banks on HuggingFace, public scoring code, Ed25519-signed cards |

### MANAGE → Machinery-Conformity, Jail, Reserve-Attestation, Distribution-Integrity

| NIST Category | GSPC Axis | Evidence |
|---------------|-----------|----------|
| MANAGE 1.1 | machinery-conformity | n=33, MachBench: Machinery Regulation self-evolving safety |
| MANAGE 2.1 | jail | n=71, GoldBank-Detector: escape-attempt detection |
| MANAGE 2.2 | reserve-attestation | 16 issuer accounts, reserve flag reads |
| MANAGE 3.1 | distribution-integrity | 16 issuer accounts, distribution flag reads |
| MANAGE 4.1 | cross-reality + detector-interop | XRAIV + DetBench: autonomous agent authority + cross-detector watermark interop |

## Evidence Artifacts

| Artifact | URL | Verification |
|----------|-----|-------------|
| GSPC Board | https://councilof.ai/api/gspc | 22 axes, living, signed |
| Signed Cards | https://councilof.ai/signed/card_index.json | 337 cards, Ed25519 |
| Public Root | https://councilof.ai/root.json | 264 leaves, Merkle, Rekor |
| Card Root | https://councilof.ai/interop/card-root-2026-09-13.json | 1,301 leaves, dedicated measurement root |
| Corrections | https://councilof.ai/api/corrections | 49 entries, public |
| Verify | https://councilof.ai/gspc-verify | Free, no account needed |
| DID | https://csoai.org/.well-known/did.json | Ed25519 key resolution |

## Scope and Limits

- This is an evidence crosswalk, not a NIST certification or endorsement
- Each axis maps to NIST categories based on task similarity, not regulatory equivalence
- The 8 financial/deterministic-fact axes map to GOVERN and MANAGE (organizational risk)
- Unmapped NIST subcategories exist — this crosswalk covers the axes we have
- Measurement, not certification

## Independence

- Own-model exclusion: CSOAI's own fine-tuned models are excluded from public leadership on 8 axes
- Neutral body: CSOAI does not certify, accredit, or issue conformity assessments
- Revenue: $0.02 USDC from 1 external payer (chain-adjudicated)
- All artifacts independently verifiable without CSOAI credentials

## What we are NOT asking for

- No endorsement, certification, accreditation, or conformity mark for CSOAI or any vendor
- No legal determination. This is a measurement-method contribution.
- No disclosure of any non-public/classified system. We measure public models only.

## Submission Checklist

- [ ] Join the COI (mailing list + community channel) via the NIST landing page
- [ ] Confirm current submission channel/format the COI is using (RFI, position paper, working-session)
- [ ] Send from nicholas@csoai.org under CSOAI Ltd
- [ ] Attach crosswalk: https://councilof.ai/interop/nist-airmf-gspc-crosswalk.json
- [ ] Attach verification surface: https://councilof.ai/gspc-verify
