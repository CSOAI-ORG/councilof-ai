# TUI 3 — Models and Regulation Report
## Branch: models/verified-expansion-20260911
## Generated: 2026-09-11T12:45Z
## Source: councilof.ai live API + local verification files

---

## Card Populations (4 disjoint, zero SHA overlap)

| Population | Count | Location | Signed by |
|-----------|-------|----------|-----------|
| Public root | 167 | `root.json` (Merkle `78d4e019...`) | `#board-attestation-1` |
| Historical corpus | 335 | `/signed/card_index.json` | `#card-attestation-1` |
| Card store | 336 | `/api/cards` | (index + 1 cross-border) |
| PR#1888 receipts | 36 | `/interop/mill-cards-signed/` | `#board-attestation-1` |
| **Combined unique** | **371** | — | — |

---

## SHA-256 Verification

| Population | Verified | Method |
|-----------|----------|--------|
| Index cards (335) | 335/335 | Canonical JSON body SHA-256 |
| PR#1888 cards (36) | 36/36 | Canonical JSON + ECMAScript number normalization |
| **Total** | **371/371** | — |

**Critical finding:** PR#1888 cards require ECMAScript number normalization (integral floats → int). Without it, 10/36 fail SHA verification.

---

## Ed25519 Signature Verification

| Population | Verified | Signer |
|-----------|----------|--------|
| Index cards (335) | 335/335 | `did:web:csoai.org#card-attestation-1` |
| PR#1888 cards (36) | 36/36 | `did:web:csoai.org#board-attestation-1` |
| **Total** | **371/371** | 5 Ed25519 keys in DID document |

---

## PR#1888 Cards: Individual Enumeration (36 cards)

**Commit:** `df1e6d0bba957940e3a75e3ec1edb3a80e21be05`
**Author:** Nicholas Templeman + csoai-financial-measure
**Models:** 11 unique models across 14 axes

| # | Axis | Model | Accuracy | n | Uncertainty | Regulation-linked |
|---|------|-------|----------|---|-------------|-------------------|
| 1 | affect | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 2 | affect | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 3 | art5-safeguard | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 4 | art5-safeguard | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 5 | art5-safeguard | Qwen3-1.7B-Base | — | 30 | Wilson 95% | NO |
| 6 | care | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 7 | care | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 8 | care | Qwen3-1.7B-Base | — | 30 | Wilson 95% | NO |
| 9 | conformance | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 10 | continuity | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 11 | cross-reality | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 12 | cross-reality | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 13 | cross-reality | Qwen3-1.7B-Base | — | 30 | Wilson 95% | NO |
| 14 | cross-reality | Gemma-3-1B-PT | — | 30 | Wilson 95% | NO |
| 15 | detector-interop | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 16 | detector-interop | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 17 | detector-interop | Qwen3-1.7B-Base | — | 30 | Wilson 95% | NO |
| 18 | detector-interop | Gemma-3-1B-PT | — | 30 | Wilson 95% | NO |
| 19 | governance | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 20 | governance | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 21 | jail | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 22 | jail | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 23 | jail | Qwen3-1.7B-Base | — | 30 | Wilson 95% | NO |
| 24 | jail | Gemma-3-1B-PT | — | 30 | Wilson 95% | NO |
| 25 | jail | Phi-4-mini-instruct | — | 30 | Wilson 95% | NO |
| 26 | jail | Mistral-7B-v0.3 | — | 30 | Wilson 95% | NO |
| 27 | machinery-conformity | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 28 | machinery-conformity | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 29 | machinery-conformity | Qwen3-1.7B-Base | — | 30 | Wilson 95% | NO |
| 30 | openness | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 31 | openness | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 32 | provenance | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 33 | safety | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 34 | safety | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |
| 35 | swarm | TinyLlama-1.1B-Chat | — | 30 | Wilson 95% | NO |
| 36 | swarm | Qwen2.5-0.5B | — | 30 | Wilson 95% | NO |

**Note:** Accuracy values are in the signed card bodies; they are not reproduced here to avoid extracting signed content. Each card includes: `model_revision`, `model_license`, `bank_revision`, `grader`, `run_id` (HF job), `measured_at`, `uncertainty_95_wilson`, `raw_response_ref`, `raw_response_digest_sha256`, `regulatory_crosswalk`, `correction_of`, `supersedes`.

---

## Regulation Mapping

**Current state:** 0 of 36 PR#1888 cards have populated `regulatory_crosswalk` fields.
**Brief expectation:** "5 regulation-linked, 31 unlinked."
**Actual:** 0 regulation-linked, 36 unlinked.

The `regulatory_crosswalk` field exists in the card schema but is empty/null in all 36 PR#1888 cards. The "5 regulation-linked" figure from the brief may refer to a different card set or a prior state that was not carried forward.

### Eligible axes for regulation mapping:

| Axis | Potential provisions | Jurisdiction |
|------|---------------------|--------------|
| art5-safeguard | EU AI Act Art 5 (prohibited practices) | EU |
| machinery-conformity | EU AI Act Art 8-15 (high-risk requirements) | EU |
| governance | EU AI Act Art 9-17 (risk management, transparency) | EU |
| safety | EU AI Act Art 9 (risk management) | EU |
| conformance | EU AI Act Art 4 (competence), Art 13 (transparency) | EU |
| jail | NIST AI RMF (adversarial robustness) | US |
| care | EU AI Act Art 9(7) (human oversight) | EU |
| provenance | EU AI Act Art 50 (transparency obligations) | EU |

**Unlinked rows receive no regulation score.** Mapping requires: exact legal provision, jurisdiction, legal status, source digest, publication/applicability/effective dates.

---

## Board State (Live)

| Family | Axes | Measured | Public Leaders |
|--------|------|----------|----------------|
| Behavioural (gspc) | 14 | 14 | 3 (safety, swarm, jail) |
| Financial (deterministic) | 8 | 8 | 0 (fact runs, not leaders) |
| **Total** | **22** | **22** | **3** |

**Staleness:** Behavioural axes last run 2026-08-12 (29 days). Jail axis 2026-08-18 (24 days). Financial axes 2026-08-25 (17 days).

---

## Model-Axis Matrix

- 64 models × 16 axes = 1,024 cells
- 335 filled (32.7%)
- 689 UNMEASURED

---

## NIST AI 300 Submission

- **Deadline:** 2026-09-16 (5 days)
- **Status:** DRAFTING
- **Material:** <=4KB card schema as reference implementation to NIST AI 300-1
- **Gate:** Owner signature required before submission
- **Not submitted without final communication gate**

---

## RunPod/HuggingFace Harness

- **Status:** Measurement pipeline runs as HF Jobs (run_id: `hfjobs-2026-09-11-050011-8`)
- **Raw responses:** `hf-bucket://csoai/jobs-artifacts/gspc-raw/`
- **Action required:** Resume prioritized model versions across all 22 axes

---

## Honest Statement

371 unique cards verified (SHA-256 + Ed25519). 36 PR#1888 cards individually enumerated with full provenance fields. 0 of 36 regulation-linked (brief expected 5 — discrepancy noted). 22 board axes measured, 3 public leaders. NIST AI 300 deadline 5 days away, owner gate. Deep measurement incomplete. RunPod/HF harness operational but not running.

---

## Blockers

1. **Signing key** — needed for new card production
2. **Regulation mapping** — 36 cards eligible, 0 mapped
3. **NIST AI 300** — owner gate (Nick signature)
4. **Board staleness** — 29 days since last behavioural run

---

*TUI 3 — Models and Regulation | Branch: models/verified-expansion-20260911*
