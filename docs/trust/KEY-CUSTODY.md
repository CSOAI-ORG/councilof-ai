# Key Custody Documentation

**Date:** 2026-09-11
**Principle:** Private keys are NEVER exposed. This document describes public keys,
their purposes, and custody constraints only.

## DID Document

Published at:
- `https://councilof.ai/.well-known/did.json`
- `https://csoai.org/.well-known/did.json` (MUST be identical for DID resolution)

DID: `did:web:csoai.org`

## The 5 Verification Methods

### 1. `did:web:csoai.org#site-release-1`

| Property | Value |
|----------|-------|
| Type | JsonWebKey2020 (Ed25519) |
| JWK `kid` | `csoai-site-release-1` |
| Public key (x) | `03g9l-dVNGVEAVVWQrJU9aLtkYTN3uARd52P7DEq-8g` |
| Purpose | Signs site deploys, release cards, agent cards |
| Held in | Keystone (internal infrastructure) |
| Role in DID | `assertionMethod` + `authentication` |

### 2. `did:web:csoai.org#estate-chain-1`

| Property | Value |
|----------|-------|
| Type | JsonWebKey2020 (Ed25519) |
| JWK `kid` | `csoai-estate-chain-1` |
| Public key (x) | `M0cuAmhx2yDNvZnnbEdTLr_PhLN6vtWyYNrjWJ31aW0` |
| Purpose | Signs fleet board chains and measurement cards (pod-held) |
| Held in | Estate pod |
| Role in DID | `assertionMethod` |

### 3. `did:web:csoai.org#board-attestation-1`

| Property | Value |
|----------|-------|
| Type | JsonWebKey2020 (Ed25519) |
| JWK `kid` | `csoai-board-attestation-1` |
| Public key (hex) | `9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170` |
| Purpose | Signs the PUBLIC BOARD SNAPSHOT (integrity of `/api/gspc`), signs `root.json` envelope |
| Held in | Cloudflare Pages (never leaves) |
| Role in DID | `assertionMethod` |
| Signs | `root.json` (public-root-v1 envelope), living board stamp |
| Preimage rule | `ensure_ascii=False` (UTF-8), 6 fields: kind, schema, as_of, merkle_root, card_count, did_intended |

### 4. `did:web:csoai.org#card-attestation-1`

| Property | Value |
|----------|-------|
| Type | JsonWebKey2020 (Ed25519) |
| JWK `kid` | `csoai-card-attestation-1` |
| Public key (hex) | `d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38` |
| Purpose | Signs the estate's measurement-card generation |
| Held in | Mac (estate key) |
| Role in DID | `assertionMethod` |
| Signs | 335 measurement cards, `chain.json` manifest, `arena_scoreboard.json`, `eat_compliance_board.json` |
| Cards preimage rule | `ensure_ascii=True` (Rule A / CPython v1) |
| Board preimage rule | `ensure_ascii=False` (Rule B / JCS) |

### 5. `did:web:csoai.org#gspc-board-22axis-2026`

| Property | Value |
|----------|-------|
| Type | JsonWebKey2020 (Ed25519) |
| JWK `kid` | `gspc-board-22axis-2026` |
| Public key (hex) | `d573a7219c0d645091e9f640cb5bbfe71429d43ac168568665a7a260d01e0d2c` |
| Purpose | 3-party MPC key for `gspc-board.signed.json` freeze snapshot |
| Held in | 3 shares on owner's Oracle tenancy (Coinbase cb-mpc Ed25519 additive) |
| Role in DID | `assertionMethod` |
| Signs | `public/signed/gspc-board.signed.json` |
| Custody | Private scalar NEVER exists as a whole number; three MPC shares produce a stock RFC 8032 signature |
| Status | SUPERSEDED_KNOWN_CLAIM_DEFECT (integrity VERIFIED, claims have known defects) |

## Superseded Key

One key was published 2026-08-17 and superseded 2026-08-18:

```
x: 9LQnjdwhbC8GCyc6_P2e8AhWOZNzsjsJd5T-cvs2w0I
status: superseded
reason: Published from a generation script, not from the production keystone;
        no estate artifact was ever validly signed with this key.
```

Any artifact claiming this key and not verifiable against the current keys is not ours.

## sig_input Rules

### Rule A — CPython v1 (measurement cards)

```
preimage = json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')
id       = sha256(preimage).hexdigest()
signature = Ed25519(preimage)
```

- `ensure_ascii=True`: non-ASCII characters become `\uXXXX`
- Int-valued floats: `0.0`, `1.0` (CPython `json.dumps` behavior)
- Applies to: all 335 cards in `card_index.json` (carry `id`, no `content_id`)

### Rule B — JCS / ES6 (board artifacts)

```
body      = document with `signature` member removed
content_id = sha256( canon.cjson(body) )    # sorted keys, compact, ensure_ascii=False
signature  = Ed25519 over content_id AS ASCII HEX STRING
```

- `ensure_ascii=False`: non-ASCII stays literal
- Int-valued floats: `0`, `1` (ES6 `Number.prototype.toString`)
- Applies to: `arena_scoreboard.json`, `eat_compliance_board.json` (carry `content_id`)

### Root Envelope (board-attestation-1)

```
preimage = json.dumps({kind, schema, as_of, merkle_root, card_count, did_intended},
                      sort_keys=True, separators=(',',':'), ensure_ascii=False).encode()
sig      = Ed25519(preimage)
```

- Only 6 fields are in the preimage
- `card_sha256[]` is bound by `merkle_root`, not by the signature directly
- `ensure_ascii=False` (UTF-8, non-ASCII stays literal)

### GSPC Board (gspc-board-22axis-2026)

```
body      = document with `custody_attestation` member removed
canonical = JSON sorted keys, compact separators, UTF-8
content_id = sha256(canonical(body)).hexdigest()
sig_b64   = Ed25519 over canonical(body) bytes, base64-encoded
```

- Standard JCS-like canonicalization (no special float handling needed for this document)
- Verifiable via `scripts/gspc-board-verify.mjs`

## MPC Custody for gspc-board-22axis-2026

- **Protocol:** Coinbase cb-mpc Ed25519 additive
- **Parties:** 3 shares on the owner's Oracle tenancy
- **Threshold:** 2-of-3 (standard cb-mpc)
- **Output:** Stock RFC 8032 Ed25519 signature (indistinguishable from single-key)
- **Key property:** The private scalar NEVER exists as a whole number at any point
- **Verification:** No MPC-specific code needed; any standard Ed25519 verifier works
- **Anti-replay:** `content_id` binds the exact signed bytes; `sig_b64` is the signature

## Security Invariants

1. **No private keys in this document or any public file.**
2. DID document contains only public keys (JWK `x` parameter = public key bytes).
3. PKCS8 private keys stay on their respective infrastructure (Pages, pod, Mac, Oracle).
4. `#board-attestation-1` private half never leaves Cloudflare.
5. `#gspc-board-22axis-2026` private scalar never exists as a whole number (MPC).
6. ML-DSA-65 (PQC) is roadmap only — no `#board-pqc-1` in the DID document.
7. Any key rotation is published in the DID document and noted at `/api/corrections`.
8. Offline verification establishes validity as of the parameters held; it says nothing
   about the current state of the key (revocation is a present-tense fact).
