# Key Custody Documentation

**Date:** 2026-09-11 · custody wording corrected 2026-10-29

**Current custody record:** [`council-os/custody-ceremonies.json`](../../council-os/custody-ceremonies.json)
records no performed split-custody ceremony. The dated correction
[`C-2026-0925-01`](../corrections/2026-09-25-custody-wording.md) supersedes the
original custody claims below. Key and artifact counts in this document describe
the dated inventory; they are not a current production census.
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
| Purpose | Historical MPC-protocol key for `gspc-board.signed.json` freeze snapshot |
| Held in | Three additive-share files in one directory on one host; one failure domain |
| Role in DID | `assertionMethod` |
| Signs | `public/signed/gspc-board.signed.json` |
| Custody | A single process uses all three shares. The helper's non-reconstruction property is an unaudited design claim; separated custody was never performed. |
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

## Historical MPC protocol and actual custody

- **Protocol:** Coinbase cb-mpc Ed25519 additive.
- **Actual custody:** All three additive-share files were in one directory on one
  host, used by one process. They did not provide independent holders or failure
  domains.
- **Signature:** A stock RFC 8032 Ed25519 signature can be checked with a standard
  verifier. That check does not establish the signing protocol or separated custody.
- **Unaudited property:** The helper is designed not to reconstruct a whole private
  scalar. This is a design claim, not an audited custody guarantee.
- **Current corrected freeze:** `public/signed/gspc-board.2026-09-25.signed.json`
  is signed by the single `#board-attestation-1` key held in Cloudflare Pages.
- **Planned:** A physical 2-of-3 split across separate holders/media has not been
  performed. Update the ceremony registry only after execution, with a dated
  ceremony record. Do not describe the plan as current custody.
- **Replay limits:** A content digest binds bytes; it does not enforce freshness,
  prevent reuse, or establish present authorization or revocation status.

## Security Invariants

1. **No private keys in this document or any public file.**
2. DID document contains only public keys (JWK `x` parameter = public key bytes).
3. PKCS8 private keys stay on their respective infrastructure (Pages, pod, Mac, Oracle).
4. `#board-attestation-1` private half never leaves Cloudflare.
5. The historical MPC protocol does not establish independent custody. The
   ceremony registry and dated custody correction govern those claims.
6. ML-DSA-65 (PQC) is roadmap only — no `#board-pqc-1` in the DID document.
7. Any key rotation is published in the DID document and noted at `/api/corrections`.
8. Offline verification establishes validity as of the parameters held; it says nothing
   about the current state of the key (revocation is a present-tense fact).

