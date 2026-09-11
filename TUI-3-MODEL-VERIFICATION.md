# TUI 3 — Model and Benchmark Measurement Verification
**Generated:** 2026-09-11T14:30:00Z
**Basis:** master (b284d3cc)
**Branch:** models/verified-expansion-20260911

---

## Card Corpus Counts (Verified from Committed Artifacts)

| Corpus | Count | Location | State |
|--------|-------|----------|-------|
| Signed chain positions | 335 | public/signed/chain.json → body.length | VERIFIED |
| Chain published bodies | 313 | chain.json → body.bodies_published | VERIFIED |
| Chain withheld bodies | 22 | chain.json → body.bodies_withheld | VERIFIED |
| Signed cards on disk | 337 | public/signed/cards/ | COUNTED |
| Public root cards | 167 | public/root.json → card_count | VERIFIED |
| Public root Merkle root | — | public/root.json → merkle_root: 78d4e019... | VERIFIED |
| Public root card SHA-256 entries | 167 | public/root.json → card_sha256.length | VERIFIED |
| Root history entries | 29 | public/receipts/root-history.json | VERIFIED |
| Mill signed cards | 1,066 | public/interop/mill-cards-signed/ (signed-*) | COUNTED |
| Mill unsigned cards | 366 | public/interop/mill-cards-signed/ (unsigned-*) | COUNTED |
| Mill total | 1,432 | public/interop/mill-cards-signed/ | COUNTED |
| Public cards (SHA-256 named) | 1,680 | public/cards/ | INDEXED |

## Chain Verification

| Item | Value |
|------|-------|
| Algorithm | Ed25519 |
| Pubkey | d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38 |
| Chain ID | f154f67cd2db8b2800adf4bb3722c7780c009324d6c87cd277cac030c5ecc2bb |
| Head | 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da |
| Genesis prev | GSPC-CARD-FACTORY-GENESIS |
| Kind | gspc.card-chain |
| Preimage rule | SHA-256 of canonical JSON body |
| Verifier | public/signed/verify-card.mjs |
| Valid / Invalid | 335 / 0 |
| State | **VERIFIED** |

## PR #1888 Verification (36 Enriched GSPC Receipts)

| Item | Value |
|------|-------|
| Commit | df1e6d0bba957940e3a75e3ec1edb3a80e21be05 |
| Merged | 2026-09-11T07:54:05Z |
| Signed cards added | 36 (to mill-cards-signed/) |
| Unsigned cards added | 36 (to mill-cards-signed/) |
| In 335-card chain | NO (0 of 36 found in chain) |
| In public root (167) | NO |
| In public/cards/ | YES (1,680 files include mill cards) |
| Card format | Ed25519-signed, gspc.measurement-card kind |
| Axes covered | affect, art5-saf, care, conformance, cross-reality, detector, governance, jail, machinery, openness, provenance, safety, swarm |
| Outer signature | VALID (Ed25519) |
| Inner state | STAGED_UNSIGNED |
| State | **STAGED_UNSIGNED** |

### Key Finding: PR #1888 Cards Are Staged, Not Anchored

The 36 cards from PR #1888:
1. Have valid outer Ed25519 signatures
2. Are NOT in the 335-position signed chain
3. Are NOT in the 167-card public root
4. Are in the mill-cards-signed/ directory as STAGED_UNSIGNED
5. Their axes are measured but not yet integrated into the canonical chain

To integrate: the36 cards need to be added to the signed chain (via MPC ceremony) and included in the next Merkle root generation.

## Reconciliation: Three Corpora

| Corpus | Count | Signed | In Chain | In Root | Status |
|--------|-------|--------|----------|---------|--------|
| Historical signed corpus | 335 | ✅ Ed25519 | ✅ 335 positions | Partial (167) | VERIFIED |
| Public Merkle root | 167 | ✅ Ed25519 | ✅ Subset | ✅ 167 cards | VERIFIED |
| PR #1888 enriched | 36 | ✅ Outer Ed25519 | ❌ Not in chain | ❌ Not in root | STAGED |

## Regulatory Crosswalk

| Item | Location | State |
|------|----------|-------|
| NIST AI RMF crosswalk | public/interop/nist-airmf-gspc-crosswalk.json | PREPARED (0 mapped entries) |
| EU AI Act crosswalk | public/interop/crosswalk/ | PREPARED |
| Regulation-linked cards | — | 5 linked (from prior sessions) |
| Unlinked cards | — | 31 unlinked |

### Regulatory Mapping Status

- 5 model cards have regulation links (EU AI Act provisions)
- 31 cards remain unlinked — no regulation score assigned
- Unlinked rows receive no regulation score (honest)
- NIST material prepared for 16 September deadline (not yet submitted)

## Trust Chain State

| Layer | State | Evidence |
|-------|-------|----------|
| 1. Card signature | ✅ VERIFIED | Ed25519, 335/335 valid |
| 2. Merkle root | ✅ VERIFIED | 78d4e019..., 167 cards |
| 3. Rekor witness | ✅ WITNESSED | log index 2791822965 |
| 4. OTS submission | ⏳ STAMPED_PENDING_BITCOIN | Submitted |
| 5. Bitcoin confirmation | ❌ NOT_YET | Waiting |
| 6. Base EAS | ❌ INCOMPLETE | Requires owner approval |
| 7. XRPL memo | ❌ INCOMPLETE | Devnet prepared |

## What This Does NOT Claim

1. **NOT "36 new cards fully verified"** — Outer Ed25519 valid, inner STAGED_UNSIGNED
2. **NOT "all cards in public root"** — 167/335 in root (the root is a subset)
3. **NOT "Bitcoin-anchored"** — OTS pending, not confirmed
4. **NOT "regulatory compliant"** — Crosswalk is informational mapping, not compliance

## Remaining Blockers

1. 36 PR #1888 cards need chain integration (MPC ceremony)
2. Chain→root gap: 335 chain positions vs 167 root cards
3. 31 unlinked cards need regulation mapping
4. NIST submission blocked on final communication gate
5. OTS Bitcoin confirmation timeline unknown
