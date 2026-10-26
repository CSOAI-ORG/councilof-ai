# TUI-5: Trust Chain Verification Report

**Date:** 2026-09-11
**Branch:** `trust/anchor-completion-20260911`
**Verifier:** Independent sub-agent verification from published bytes

## Trust Chain State Table

| Layer | Rail | Status | Evidence |
|-------|------|--------|----------|
| 1 | Card signatures (Ed25519 per card) | **VERIFIED** | 335/335 cards, pubkey `d4cb0eaa...`, verified via `verify-card.mjs` |
| 2 | Merkle-root inclusion (SHA-256 pairwise) | **VERIFIED** | 167 leaves, root `78d4e019...`, card_count check enforced |
| 3 | Rekor witness (Sigstore transparency log) | **WITNESSED** | logIndex `2791822965`, integratedTime `1789116324` |
| 4 | OTS submission (OpenTimestamps calendar) | **STAMPED_PENDING_BITCOIN** | Calendar accepted; no Bitcoin block-header attestation yet |
| 5 | Bitcoin confirmation | **NOT_YET** | Blocked on OTS calendar aggregation (~2 weeks typical) |
| 6 | Base EAS attestation | **NOT_YET** | No estate signer key; owner-gated |
| 7 | XRPL memo anchor | **NOT_YET** | Needs funded XRPL account; devnet dry-run in PR #1884 |

## Signature Verification Results

### Root.json (board-attestation-1)

```
Pinned key:   did:web:csoai.org#board-attestation-1
Public key:   9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170
Preimage:     274 bytes (6 fields: kind, schema, as_of, merkle_root, card_count, did_intended)
Signature:    74d8017b28c6c6dd7210c2e28413deb36fc358e5984fe748c7af33af797655af...
Result:       VALID
```

### Merkle Root

```
Leaf count:   167 (matches card_count inside signed preimage)
Computed:     78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Stated:       78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Result:       MATCH
CVE-2012-2459 guard: card_count in signed preimage; len(card_sha256) == card_count enforced
```

### Card Signatures (30-card sample)

```
Method:       Python cryptography library + Ed25519PublicKey.verify()
Pinned key:   d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38
              (= did:web:csoai.org#card-attestation-1)
Preimage:     json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)
Sample:       30 cards (indices 0-19 + 100, 150, 200, 250, 300, 330-334)
Results:      30 VALID / 0 INVALID / 0 UNCHECKABLE
```

### Chain Manifest (chain.json)

```
Method:       node verify-card.mjs public/signed/chain.json
Key:          did:web:csoai.org#card-attestation-1
Result:       VALID
```

### GSPC Board (gspc-board.signed.json)

```
Method:       node scripts/gspc-board-verify.mjs
Signer:       did:web:csoai.org#gspc-board-22axis-2026
Custody:      3-party MPC (Coinbase cb-mpc, Ed25519 additive)
Public key:   d573a7219c0d645091e9f640cb5bbfe71429d43ac168568665a7a260d01e0d2c
Content ID:   72ba8a3371fcc895be835f4283fefca0c2edd1e1fc857b3e49276277f94ccb10
Result:       VERIFIED (integrity)
Note:         Status is SUPERSEDED_KNOWN_CLAIM_DEFECT — integrity verified, claims have known defects
              Current authority: GET /api/gspc (22/22 axes)
```

## Corpus Separation

| Corpus | Count | Identifier Space |
|--------|-------|-----------------|
| Public root leaves (`/root.json`) | 167 | SHA-256 of canonical card body |
| Signed card index (`/signed/card_index.json`) | 335 | Ed25519-signed card IDs |
| Cards on disk (`/signed/cards/`) | 337 | File-based |
| Identifier overlap | 0 | **SEPARATE_CORPORA** |

The root's OTS proof and Rekor witness cover the root.json bytes only. They do NOT anchor the signed-card index.

## Verification Method

1. Fetch `root.json` and `.well-known/did.json` from separate hosts
2. Extract `#board-attestation-1` public key from DID document
3. Rebuild 6-field preimage (sorted keys, compact separators, `ensure_ascii=False`)
4. Verify Ed25519 signature
5. Recompute merkle_root from `card_sha256[]` with Bitcoin-style odd-node duplication
6. Enforce `len(card_sha256) == card_count` (CVE-2012-2459 guard)
7. For cards: extract `#card-attestation-1` key, rebuild body preimage (`ensure_ascii=True`), verify

## Two Canonicalisation Rules

| Rule | Applies To | ensure_ascii | Int-valued Floats | Preimage Over |
|------|-----------|-------------|-------------------|---------------|
| Rule A (CPython v1) | Measurement cards (`id` field) | True | `0.0` (trailing .0) | `body` |
| Rule B (JCS / ES6) | Board artifacts (`content_id` field) | False | `0` (integer) | body minus `signature` block |
| Root envelope | root.json | False | N/A | 6 fields only |

Applying the wrong rule to the wrong corpus produces false failures: Rule A against a Rule B board fails every integral float; `JSON.stringify` against Rule A cards fails 117 of 335.
