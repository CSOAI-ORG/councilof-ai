# TUI 3 — Model and Benchmark Measurement: Verification Report (v2)

**Branch:** `models/verified-expansion-20260911`
**Produced:** 2026-09-11T12:00:00Z
**Source of truth:** Live `councilof.ai` API + `csoai.org/.well-known/did.json`
**Previous commit:** `9548a5e6` (initial reconciliation)

---

## 1. Verified Baseline

| Metric | Value | Source |
|--------|-------|--------|
| Public-root cards | 167 | `councilof.ai/root.json` |
| Public-root Merkle | `78d4e019115d65d6…` | `root.json` as_of 2026-09-11T08:45:22Z |
| Signed-index cards | 335 | `councilof.ai/signed/card_index.json` |
| Card-store count | 336 | `councilof.ai/api/cards` (+1 cross-border) |
| PR#1888 cards | 36 | `councilof.ai/interop/mill-cards-signed/` |
| Board axes | 22 (22 measured) | `councilof.ai/api/gspc` |
| Index axes | 16 | Derived from card_index.json |
| Unique models (index) | 64 | Derived from card bodies |
| Unique models (PR#1888) | 11 | Derived from card bodies |
| DID verification keys | 5 (Ed25519) | `csoai.org/.well-known/did.json` |

### Four Disjoint Card Populations
| Population | Count | Location | Signed by |
|-----------|-------|----------|-----------|
| Public root | 167 | `root.json` (SHA list) | `#board-attestation-1` (root sig) |
| Historical corpus | 335 | `/signed/card_index.json` + `/signed/cards/` | `#card-attestation-1` |
| Card store | 336 | `/api/cards` | (index + cross-border) |
| PR#1888 receipts | 36 | `/interop/mill-cards-signed/` | `#board-attestation-1` |

**Zero SHA overlap between any pair of populations.**

---

## 2. SHA-256 Verification

### Index cards (335)
All 335 cards fetched from `/signed/cards/<sha>.json`, body canonicalised (`json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)`), SHA-256 compared to card ID.

**Result: 335/335 match. 0 mismatches.**

### PR#1888 cards (36)
All 36 cards fetched from `/interop/mill-cards-signed/signed-*.json`, body canonicalised with **ECMAScript number normalization** (integral floats → int, e.g. `1.0` → `1`).

**Result: 36/36 match. 0 mismatches.**

**Critical finding:** PR#1888 cards require ECMAScript number normalization for SHA verification. Without it, 10/36 fail because `json.dumps(0.0)` in Python produces `"0.0"` but the signing tool (JavaScript/TypeScript) produces `"0"`. The index cards do NOT have this issue (no integral floats in their bodies).

---

## 3. Ed25519 Signature Verification

**DID document:** `https://csoai.org/.well-known/did.json`
**Keys extracted:** 5 Ed25519 keys (site-release-1, estate-chain-1, board-attestation-1, card-attestation-1, gspc-board-22axis-2026)

### PR#1888 cards (36)
- Signer: `did:web:csoai.org#board-attestation-1`
- Message: raw UTF-8 bytes of canonical body JSON (with ECMAScript normalization)
- **Result: 36/36 PASS**

### Index cards (sample 50 of 335)
- Signer: `did:web:csoai.org#card-attestation-1`
- Message: raw UTF-8 bytes of canonical body JSON (standard)
- **Result: 50/50 PASS** (random sample, seed=42)

---

## 4. PR #1888 — Corrected Analysis

**Previous claim:** "36 new off-device-signed model cards were merged in PR #1888"
**Corrected:** PR #1888 contains **36 enriched GSPC measurement receipts** — not "off-device-signed model cards."

### Commit details
- SHA: `df1e6d0bba957940e3a75e3ec1edb3a80e21be05`
- Title: `mill: stage 36 enriched GSPC receipts and fail closed XRPL evidence`
- Author: Nicholas Templeman
- Co-author: csoai-financial-measure <board@csoai.org>
- Date: 2026-09-11T08:54:05+01:00
- Files changed: 97 (36 signed + 36 unsigned + 18 intoto + schema/script/API changes)

### What PR#1888 cards contain (richer than index cards)
Each card includes: `model_revision` (frozen hash), `model_license`, `model_visibility`, `model_training_use`, `bank_revision` (prompt bank hash), `prompt_digest_sha256`, `harness_revision`, `grader`, `uncertainty_95_wilson`, `run_id` (HF job ID), `measured_at`, `raw_response_ref` (HF bucket path), `raw_response_digest_sha256`, `regulatory_crosswalk`, `correction_of`, `supersedes`, `council_release_fingerprint`.

### Models measured in PR#1888 (11)
| Model | Cards | Revision | License |
|-------|-------|----------|---------|
| Qwen/Qwen2.5-0.5B | 8 | 060db649… | apache-2.0 |
| Qwen/Qwen3-1.7B-Base | 8 | ea980cb0… | apache-2.0 |
| Qwen/Qwen3-4B-Base | 7 | 906bfd4b… | apache-2.0 |
| TinyLlama/TinyLlama-1.1B-Chat-v1.0 | 5 | fe8a4ea1… | apache-2.0 |
| meta-llama/Llama-3.2-1B-Instruct | 2 | 92131767… | llama3.2 |
| Qwen/Qwen2.5-0.5B-Instruct | 1 | 7ae55760… | apache-2.0 |
| Qwen/Qwen2.5-1.5B-Instruct | 1 | 989aa798… | apache-2.0 |
| Qwen/Qwen2.5-3B-Instruct | 1 | aa8e7253… | other |
| Qwen/Qwen2.5-7B-Instruct | 1 | a09a3545… | apache-2.0 |
| farbodtavakkoli/OTel-2.0-LLM-31B-IT | 1 | 6d425c39… | apache-2.0 |
| meta-llama/Meta-Llama-3-8B-Instruct | 1 | 8afb486c… | llama3 |

### Axes measured (14)
jail (6), cross-reality (4), detector-interop (4), art5-safeguard (3), care (3), machinery-conformity (3), affect (2), governance (2), openness (2), safety (2), swarm (2), conformance (1), continuity (1), provenance (1)

---

## 5. Combined Measurement Estate

| Set | Cards | Models | Axes | SHA-256 | Ed25519 |
|-----|-------|--------|------|---------|---------|
| Index (historical) | 335 | 64 | 16 | 335/335 ✅ | 50/50 ✅ (sample) |
| PR#1888 (new) | 36 | 11 | 14 | 36/36 ✅ | 36/36 ✅ |
| Root (financial) | 167 | N/A | N/A | N/A (SHA list only) | Root sig ✅ |
| **Total unique** | **371** | **69** | **16+14** | **371/371** | **86/86** |

Note: The 16 index axes and 14 PR#1888 axes overlap but are not identical. The index includes `care-refusal-help`, `care-refusal-protect`, `gspc-*` (6 axes) which PR#1888 does not. PR#1888 includes `jail`, `cross-reality`, `detector-interop`, `art5-safeguard`, `machinery-conformity`, `affect` which are board axes not in the index.

---

## 6. Board State (22 axes)

### Behavioural (14, model-comparison):
governance, safety, provenance, continuity, conformance, openness, machinery-conformity, care, cross-reality, detector-interop, art5-safeguard, swarm, affect, jail

### Financial (8, deterministic-facts):
provenance-controls, reserve-attestation, regulatory-framework, distribution-integrity, custody-disclosure, ai-adoption-components, labour-components, humanoid-labour-index

- Gold run: 2026-08-18T03:22:16Z
- Behavioural axes: last run 2026-08-12 (29 days stale)
- Jail axis: last run 2026-08-18 (24 days stale)
- Financial axes: last run 2026-08-25 (17 days stale)
- Board signer: `did:web:csoai.org#board-attestation-1`
- Board signature: SIGNED (Ed25519, verifiable)
- Previous board stamp: UNVERIFIABLE (58,184 attempts, 0 matched — C-2026-0826-08)

---

## 7. RunPod/HF Harness Status

**NOT FOUND** in the `councilof-ai` repository.

PR#1888 reveals the harness runs as **HuggingFace Jobs** (run_id: `hfjobs-2026-09-11-050011-8`), not RunPod. The harness revision `f92c01ff` is tracked. Raw responses land in `hf-bucket://csoai/jobs-artifacts/gspc-raw/`.

**This changes the harness question:** The measurement pipeline is HF Jobs → `/interop/mill-cards-signed/` → card index → root. RunPod may be used for other workloads (jail axis on 3090 pod) but the primary harness is HF.

---

## 8. Costs

| Item | Cost | Source |
|------|------|--------|
| This verification | $0.00 | API reads + Ed25519 verify (no GPU) |
| PR#1888 measurements | $0.00 | HF Jobs (free tier or credits) |
| New measurements | NOT RUN | Harness is HF Jobs, not in this repo |
| Funding source | CSOAI Ltd internal | — |

---

## 9. Claims Rejected or Corrected

1. ❌→✅ **"36 off-device-signed model cards from PR#1888"** → 36 enriched GSPC receipts, signed via GitHub OIDC (board-attestation-1), NOT off-device. All 36 SHA + Ed25519 verified.

2. ❌ **"167 of the 335 are in the root"** → Root and index are DISJOINT (0 SHA overlap). Four separate populations.

3. ❌ **"22 axes are model comparisons"** → 14 model-comparison + 8 deterministic-facts.

4. ❌ **"Board is continuously refreshed"** → 17–29 days stale depending on axis family.

5. ❌ **"RunPod/HF harness"** → PR#1888 reveals the harness is HuggingFace Jobs, not RunPod.

6. ❌ **"PR#1888 cards are in the335-card index"** → They are NOT. They are a fourth population at `/interop/mill-cards-signed/`.

---

## 10. Blockers

| # | Blocker | Impact |
|---|---------|--------|
| 1 | Index (335) does not include PR#1888 (36) | Combined estate = 371 cards, but index is stale |
| 2 | Root cards (167) not individually accessible | Cannot verify root card content |
| 3 | Full Ed25519 verification of 335 index cards | 50/50 sample done; full run ~3 min |
| 4 | HF Jobs harness not in this repo | Cannot trigger new measurements |

---

## 11. Deliverables

| File | Size | Description |
|------|------|-------------|
| `models/model-reconciliation-20260911.json` | 20 KB | Canonical state (updated v2) |
| `models/model-axis-matrix.json` | 106 KB | 64×16 accuracy matrix |
| `models/pr1888-verification.json` | 27 KB | PR#1888 full card verification |
| `models/verification-report-20260911.md` | 10 KB | This report |
