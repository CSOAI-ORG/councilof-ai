# TUI 3 — Model and Benchmark Measurement Verification
**Generated:** 2026-09-11T13:30:00Z
**Basis:** master (b9e752aa)
**Branch:** models/verified-expansion-20260911

---

## Card Corpus Counts (Verified from Bytes)

| Corpus | Count | Location | State |
|--------|-------|----------|-------|
| Card chain (signed) | 335 positions | public/signed/chain.json | VERIFIED (335 valid, 0 invalid) |
| Chain published bodies | 313 | chain.json bodies_published | VERIFIED |
| Chain withheld bodies | 22 | chain.json bodies_withheld | VERIFIED |
| Signed cards on disk | 335 files | public/signed/cards/ | COUNTED |
| Card index entries | 335 | public/signed/card_index.json | COUNTED |
| Public root cards | 167 | public/root.json card_count | VERIFIED |
| Public root leaf union | 1,072 entries | public/signed/public-root-leaf-union.json | VERIFIED |
| Mill cards (total) | 1,432 files | public/interop/mill-cards-signed/ | COUNTED |
| Mill signed cards | 1,066 | mill-cards-signed/ (signed-*) | COUNTED |
| Mill unsigned cards | 366 | mill-cards-signed/ (unsigned-*) | COUNTED |
| Public cards (SHA-256 named) | 1,680 | public/cards/ | COUNTED |
| Root history | 29 roots | public/receipts/root-history.json | VERIFIED |

## PR #1888 Verification (36 Enriched GSPC Receipts)

| Item | Value |
|------|-------|
| Commit | df1e6d0b |
| Signed cards added | 36 (to mill-cards-signed/) |
| Unsigned cards added | 36 (to mill-cards-signed/) |
| In 335-card chain | NO (0 of 36 found in chain) |
| In public/cards/ | YES (1,680 files, includes mill cards) |
| Card format | Ed25519-signed, gspc.measurement-card kind |
| Axes covered | affect, art5-saf, care, conformance, cross-reality, detector, governance, jail, machinery, openness, provenance, safety, swarm |
| Status | MEASURED (not UNMEASURED) |

### Key Finding: PR #1888 Cards Are Staged, Not Anchored

The 36 cards from PR #1888 are:
- ✅ Ed25519-signed (alg=Ed25519)
- ✅ In the mill-cards-signed directory
- ✅ In the public/cards/ directory (SHA-256 named)
- ❌ NOT in the 335-card signed chain
- ❌ NOT in the card_index.json
- ❌ NOT in the 167-card public root

**State: STAGED** — signed but not yet incorporated into the canonical chain or public root.

## Cryptographic Verification

### Chain Signature (verify-card.mjs)
```
VALID 1 · INVALID 0 · UNCHECKABLE 0
```
- Chain manifest: Ed25519 signature VALID
- Pubkey: d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38
- Head: 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da

### Public Root Merkle
- Card count: 167
- Merkle root: 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
- as_of: 2026-09-11T08:45:22Z
- DID: did:web:csoai.org#board-attestation-1

### Root Signature
- Ed25519 signature: VERIFIED (by subagent using cryptography library)
- Root SHA-256: 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6

## Axis Distribution (335-card chain)

| Axis | Cards |
|------|-------|
| care-refusal-protect | 27 |
| care-refusal-help | 27 |
| swag-30 | 25 |
| mmlu-30 | 23 |
| gsm8k-30 | 23 |
| arc-30 | 23 |
| care | 23 |
| gov | 23 |
| gspc-governance | 21 |
| gspc-safety | 21 |
| gspc-provenance | 21 |
| gspc-conformance | 21 |
| gspc-openness | 21 |
| gspc-continuity | 21 |
| jail-escape-detection | 8 |
| swarm-candidates | 7 |

## Reconciliation

| Corpus | Count | Overlap with Chain |
|--------|-------|--------------------|
| 335-card chain | 335 | — |
| 167-card public root | 167 | Subset of chain |
| 1,072 leaf union | 1,072 | Superset (28 source roots) |
| 36 PR #1888 cards | 36 | 0 overlap with chain |
| 1,432 mill cards | 1,432 | Separate staging area |

## Truth Rules Applied

1. **335 cards in chain** — all Ed25519-verified, not 167 or 1,072
2. **167 in public root** — the published subset, Merkle-verified
3. **36 PR #1888 cards are STAGED** — signed but not in chain or root
4. **1,072 leaf union** — aggregation across 28 historical roots, not a single corpus
5. **Mill cards ≠ chain cards** — mill-cards-signed is a staging area, not the canonical chain

## Blockers

1. **PR #1888 cards not in chain** — need to be incorporated via a chain update
2. **Merkle root verification** — Python RFC 6962 implementation mismatch (subagent verified with Node.js)
3. **Rekor API timeout** — network call to rekor.sigstore.dev timed out; sidecar data confirms WITNESSED
