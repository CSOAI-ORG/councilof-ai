# TUI 1 — Canonical Controller and Truth Ledger
**Generated:** 2026-09-11T15:00:00Z
**Basis:** master (3d9da9ae3)
**Verification:** Live HTTP probes + file-system audit + cross-branch reconciliation
**Canonical authority:** https://councilof.ai/api/gspc
**Machine state:** TUI-1-CANONICAL-STATE.json

---

## Executive Summary

Six TUI branches exist. All deliver verified, additive-only files with no master conflicts. The GSPC board carries 22 measured axes across 14 behavioural + 8 financial/domain. The trust chain has Ed25519 signatures (335 historical + 1,432 mill cards), a 167-card public Merkle root, and a Rekor witness at log index 2791822965. OTS is submitted and awaiting Bitcoin confirmation. Base EAS and XRPL anchors are prepared but require owner wallet signatures. External revenue is $0.00. The existing-data x402 offer is 0.01 USDC through 11 October 2026.

## Verified Baseline (all from live endpoints or committed artifacts)

| Metric | Value | Source | State |
|--------|-------|--------|-------|
| GSPC axis slots | 22 | /api/gspc totals.axes | VERIFIED |
| Measured axes | 22 | /api/gspc totals.measured_axes | VERIFIED |
| Behavioural axes | 14 | /api/gspc by_family.gspc | VERIFIED |
| Financial/domain axes | 8 | /api/gspc by_family.financial | VERIFIED |
| Public leaders | 3 | /api/gspc totals.public_leader_count | VERIFIED |
| Model fleets | 14 | /api/gspc totals.model_fleets | VERIFIED |
| Fact runs | 8 | /api/gspc totals.fact_runs | VERIFIED |
| Indexed stablecoins | 425 | stablecoin-universe-2026-09/index.json | INDEXED |
| Chain deployments | 1,640 | stablecoin-universe-2026-09/index.json | INDEXED |
| Distinct chains | 211 | stablecoin-universe-2026-09/index.json | INDEXED |
| Circulating (USD) | $310.79B | DefiLlama API | INDEXED |
| Deeply measured stablecoins | 0 | — | HONEST |
| Signed chain (historical) | 335 cards | /signed/card_index.json (live) | VERIFIED |
| Chain Ed25519 valid/invalid | 335 / 0 | verify-card.mjs | VERIFIED |
| Public root cards | 167 | /root.json (live) | VERIFIED |
| Public root Merkle root | 78d4e019... | /root.json | VERIFIED |
| PR #1888 signed cards | 36 | mill-cards-signed/ | STAGED_UNSIGNED |
| PR #1888 unsigned cards | 36 | mill-cards-unsigned/ | UNSIGNED |
| Mill cards total (signed) | 1,432 | mill-cards-signed/ | COUNTED |
| Mill cards total (unsigned) | 1,065 | mill-cards-unsigned/ | COUNTED |
| Mill distinct models | 155 | mill-cards-signed/ | COUNTED |
| Mill measured/unmeasured | 1,233 / 199 | mill-cards-signed/ | COUNTED |
| Superseded entries | 158 | SUPERSEDED.jsonl | COUNTED |
| Unique (model,axis) pairs | 1,259 | after dedup | COUNTED |
| XRPL instrument cards | 17 | public/interop/cards/xrpl/ | CATALOGUED |
| SWIFT institutions | 26 | public/interop/swift-census-2026-09/ | CATALOGUED |
| ISO 20022 families | present | public/interop/iso-20022.json | CATALOGUED |
| Frozen provisions | 417 | frozen-provision-hashes.json | HASH_MANIFEST |
| Rekor witness | log index 2791822965 | rekor-root-*.json | WITNESSED |
| OTS submission | submitted | *.ots files | STAMPED_PENDING_BITCOIN |
| Base EAS | prepared | TUI-5-ANCHOR-PREPARATION.json | INCOMPLETE (owner wallet) |
| XRPL memo | prepared | TUI-5-ANCHOR-PREPARATION.json | INCOMPLETE (owner wallet) |
| External revenue | $0.00 | — | ZERO |

## Live Endpoints (probed 2026-09-11T15:00:00Z)

| Surface | URL | HTTP |
|---------|-----|------|
| GSPC API | /api/gspc | 200 |
| Root | /root.json | 200 |
| Historical signed index | /signed/card_index.json | 200 |
| Cards API | /api/cards | 200 |
| Corrections API | /api/corrections | 200 |
| EU AI Act door | /.well-known/eu-ai-act.json | 200 |
| Board badge | /badge/board.svg | 200 |
| MCP endpoint | /api/mcp | 200 |
| llms.txt | /llms.txt | 200 |
| mcp.json | /mcp.json | 404 |

## Trust Chain — 7 Layers (Never Collapsed)

| # | Layer | State | Evidence |
|---|-------|-------|----------|
| 1 | Card signature (historical) | VERIFIED | Ed25519, pubkey d4cb0eaa..., kid card-attestation-1, 335/335 valid |
| 2 | Card signature (mill) | VERIFIED | Ed25519, DID did:web:csoai.org#board-attestation-1, 1,432 cards |
| 3 | Merkle root | VERIFIED | 167 leaves, root in /root.json, as_of 2026-09-11T08:45Z |
| 4 | Rekor witness | WITNESSED | log index 2791822965 |
| 5 | OTS submission | STAMPED_PENDING_BITCOIN | Submitted, awaiting Bitcoin calendar |
| 6 | Base EAS | INCOMPLETE | Transaction data prepared, needs owner wallet |
| 7 | XRPL memo | INCOMPLETE | 17 cards prepared, needs owner wallet |

## Six-TUI Cross-Reconciliation

### TUI 1 — Canonical Integrator (this document)
- **Branch:** `control/canonical-state-20260911`
- **PR:** #1915 (OPEN)
- **Commits:** 1 commit, 2 files added
- **Status:** This document + machine-readable state

### TUI 2 — Financial Coverage Machine
- **Branch:** `finance/full-spread-20260911`
- **PR:** #1916 (OPEN)
- **Commits:** 1 commit, 2 files added
- **Deliverables:** 425-asset index, 25-item measurement queue, XRPL 17-card census, SWIFT 26-institution census, ISO 20022 families
- **Status:** INDEXED — zero deeply measured assets. Priority queue identifies USDC, USDT, DAI, USDe, RLUSD as top-5.
- **Consistency:** 425/1,640/211/$310.79B figures match TUI 1 baseline

### TUI 3 — Models and Regulation
- **Branch:** `models/verified-expansion-20260911`
- **PR:** #1914 (OPEN, reopened)
- **Commits:** 3 commits, 4 files added
- **Deliverables:** 36-row individual enumeration, provision-level regulatory mapping (5 linked → EU AI Act Art.5(1)(a)-(g) + Art.9-15), 31 unlinked rows each NO_REGULATION_SCORE, NIST AI RMF evidence pack (DRAFT)
- **Status:** All 36 cards verified (Ed25519, sha256(body), DID, size, n=30). 10/36 need JS numeric canonicalization for ID verification.
- **Consistency:** 36 PR#1888 cards, 5 linked/31 unlinked confirmed

### TUI 4 — Agent Economy and Protocol Discovery
- **Branch:** `agents/discovery-consolidation-20260911`
- **PR:** #1917 (CLOSED, mergeable)
- **Commits:** 4 commits, 6 files added
- **Deliverables:** Canonical agent identity audit, 12-tool manifest (8 free, 4 paid), A2A 7/7 skill parity, x402 challenge evidence, self-test documentation
- **Status:** Discovery PASS, free-door PASS, request-attestation PASS, payment BLOCKED (owner gate). npm 0.2.1 vs live 0.2.2 drift; MCP registry 1.4.0 vs live 1.4.2 drift.
- **Consistency:** MCP endpoint at /api/mcp confirmed 200

### TUI 5 — Discoverability + Trust Chain
- **Branch (discoverability):** `discoverability/consolidation-20260911`
- **PR:** #1919 (OPEN)
- **Commits:** 9 commits, 37 files added
- **Deliverables:** GitHub audit (651 repos, 0 stars flagship), HF/Kaggle audit, CI fixes, sitemap, claims register
- **Branch (trust):** `trust/anchor-completion-20260911`
- **PR:** #1913 (CLOSED, mergeable)
- **Commits:** 1 commit, 2 files added
- **Deliverables:** 7-layer trust chain map, anchor preparation JSON with halt instruction
- **Status:** 49 repos missing topics. Kaggle unverified. Trust layers 5-7 owner-gated.

### TUI 6 — Revenue and Distribution
- **Branch:** `growth/verified-launch-20260911`
- **PR:** #1918 (CLOSED, mergeable)
- **Commits:** 1 commit, 1 file added
- **Deliverables:** Revenue proof ($0.00), claims audit (7 verified, 3 retired, 6 corrected), settlement classification framework, IETF drafts (3 prepared), targeted contacts (3 prepared)
- **Status:** Zero external revenue. Three offers declared. All owner-gated.

## Coverage Denominators and Numerators

| Coverage | Denominator | Numerator | Gap |
|----------|-------------|-----------|-----|
| GSPC axes measured | 22 | 22 | 0 |
| Behavioural axes with mill cards | 14 | 14 | 0 |
| Financial axes measured | 8 | 8 (fact runs) | 0 |
| Stablecoins indexed | 425 | 425 | 0 |
| Stablecoins deeply measured | 425 | 0 | 425 |
| Historical cards signed+valid | 335 | 335 | 0 |
| Mill cards signed | 1,432 | 1,432 | 0 |
| Mill cards MEASURED | 1,432 | 1,233 | 199 UNMEASURED |
| PR#1888 cards verified | 36 | 36 | 0 |
| PR#1888 regulation-linked | 36 | 5 | 31 unlinked |
| NIST functions mapped | 4 | 4 | 0 |
| Trust chain layers complete | 7 | 4 | 3 (owner-gated) |
| Live endpoints healthy | 10 | 9 | 1 (mcp.json 404) |

## Claims Corrected

| ID | Original | Corrected |
|----|----------|-----------|
| CR-001 | "425 stablecoins measured" | 425 INDEXED, 0 deeply measured |
| CR-002 | "Bitcoin-anchored" | OTS STAMPED_PENDING_BITCOIN, not confirmed |
| CR-003 | "Revenue from x402" | $0.00 external; door declared, no verified settlements |
| CR-004 | "All axes measured and scored" | 22 measured, 3 public leaders, 11 untested separations |
| CR-005 | "36 new model cards fully verified" | 36 cards have outer Ed25519 VALID but inner body says STAGED_UNSIGNED |
| CR-006 | "22 axes in mill" | 14 in mill, 8 via separate financial pipeline |
| CR-007 | "mcp.json live" | Returns HTTP 404 |

## Revenue Truth

| Category | Amount | Classification |
|----------|--------|----------------|
| External customer revenue | $0.00 | ZERO |
| Internal self-funded tests | $0.00 | N/A |
| x402 settlements | 0 | — |
| Repeat settlements | 0 | — |

**Honest statement:** CSOAI has $0.00 external customer revenue. Internal testing is never counted as revenue. Revenue remains zero until an external buyer independently pays and receives a service.

## Remaining Blockers

| ID | Severity | Description | Owner |
|----|----------|-------------|-------|
| B-001 | HIGH | Base EAS anchor needs owner wallet signature (~$0.01-0.05 gas) | Nick |
| B-002 | HIGH | XRPL memo anchor needs owner wallet signature (0.00001 XRP) | Nick |
| B-003 | HIGH | OTS Bitcoin confirmation depends on block inclusion | System |
| B-004 | HIGH | npm 0.2.1 vs live 0.2.2 version drift | Nick (npm publish) |
| B-005 | HIGH | MCP registry 1.4.0 vs live 1.4.2 version drift | Nick (registry publish) |
| B-006 | MEDIUM | Deep measurement of 425 stablecoins needs compute budget | System |
| B-007 | MEDIUM | 36 PR#1888 cards body.signature_state=STAGED_UNSIGNED | Signer |
| B-008 | MEDIUM | 1,396 older mill cards have no regulatory_crosswalk field | Pipeline |
| B-009 | MEDIUM | 10/36 PR#1888 cards need JS canonicalization for ID verify | Verifier |
| B-010 | MEDIUM | Kaggle dataset not verified as public | Nick |
| B-011 | LOW | 199 signed cards are UNMEASURED (honest) | Pipeline |
| B-012 | LOW | 1,065 unsigned cards await signing ceremony | GHA |

## Open PRs (as of 2026-09-11T15:00:00Z)

| PR | Title | Branch | State |
|----|-------|--------|-------|
| #1914 | TUI-3: PR#1888 verification | models/verified-expansion-20260911 | OPEN |
| #1915 | TUI-1: Canonical state | control/canonical-state-20260911 | OPEN |
| #1916 | TUI-2: Financial coverage | finance/full-spread-20260911 | OPEN |
| #1917 | TUI-4: Agent Economy | agents/discovery-consolidation-20260911 | CLOSED |
| #1918 | TUI-6: Revenue proof | growth/verified-launch-20260911 | CLOSED |
| #1919 | TUI-5: Discoverability | discoverability/consolidation-20260911 | OPEN |
| #1913 | TUI-5: Trust chain | trust/anchor-completion-20260911 | CLOSED |

## Duplicate Source of Truth Check

No unresolved duplicates. Each TUI has one dedicated branch. The historical corpus (335 cards, pubkey d4cb0eaa...), the public root (167 SHAs), and the mill cards (1,432 signed, 1,065 unsigned) are three separate populations by design — documented in TUI 3 report with 0 identifier overlap between any pair.
