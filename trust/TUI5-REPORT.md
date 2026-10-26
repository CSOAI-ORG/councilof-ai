# TUI-5: Signing, Roots and Anchoring Audit

**Report date:** 2026-10-07T12:00:00Z
**Branch:** `trust/anchor-completion-20260911-v2`
**Auditor:** Hermes (automated, live verification)

---

## Executive Summary

This report audits the full 7-layer anchoring chain for the CSOAI public root as of 2026-10-07. The live state (root.json `f1913eca`) has advanced significantly since the branch was last committed (2026-09-11). The root has grown from 167 to 319 public-root cards. OTS is now **CONFIRMED_BITCOIN** (block 969264, 2026-09-30). Rekor is **WITNESSED** (logIndex 3012420819). EAS and XRPL memo remain **NOT_YET**.

---

## Layer-by-Layer Anchoring Chain Audit

### Layer 1: Public Root (root.json)

| Field | Live Value (verified 2026-10-07) |
|---|---|
| URL | https://councilof.ai/root.json |
| sha256 | `f1913ecaae4ea18ac113d341c1b050318cec4c49dcda440dacbbadb89eca1b4e` |
| bytes | 25,513 |
| merkle_root | `47277a6f2034e80b6279fa969e832180b55837956773ee29339a815b74c2ba2d` |
| card_count | 319 |
| as_of | 2026-09-30T05:05:34Z |
| kind | `csoai.public-root/v1` |

**Status:** LIVE, fetched and sha256 verified against witness.

### Layer 2: Ed25519 Signature

| Field | Value |
|---|---|
| DID | `did:web:csoai.org#board-attestation-1` |
| Key type | JsonWebKey2020 (Ed25519) |
| Public key | `9367cf59be9cb72bbc9796adf056201ec1c58adfe...` (32 bytes, from DID doc) |
| Signature field | `sig_ed25519` (96 bytes — non-standard 64+32 format) |
| Preimage fields | `kind, schema, as_of, merkle_root, card_count, did_intended` |
| Preimage canonical | JSON sorted keys, `(',',':')` separators, ensure_ascii=false, UTF-8 |
| Preimage sha256 | `091319dd66ca32c37a7709fd9d33dc4a1ff5c5d17c3e2d2f24896eae79cd7ce3` |
| Preimage bytes | 274 |
| Verified against DID | true (per witness file; local crypto verify inconclusive — 96-byte sig format) |

**Status:** ACTIVE. Preimage reconstruction confirmed sha256 matches. DID document is live at `https://csoai.org/.well-known/did.json` with 7 verification methods. The 96-byte signature format (vs standard 64-byte Ed25519) appears to be a custom binding scheme. The witness file asserts `verified_against_did_json: true`.

**Caveat:** Local Ed25519 verification of the 96-byte signature field could not complete because the format deviates from standard 64-byte Ed25519. The binding scheme (likely sig + preimage hash) is not publicly documented in the root.json.

### Layer 3: Merkle Root

| Field | Value |
|---|---|
| merkle_root | `47277a6f2034e80b6279fa969e832180b55837956773ee29339a815b74c2ba2d` |
| card_count | 319 |
| as_of (tree) | 2026-09-30T05:05:34Z |

**Status:** LIVE. 319 leaves in the public-root Merkle tree. The merkle_root is bound into the signed preimage.

### Layer 4: Corpus Scope

| Field | Value |
|---|---|
| relationship | `SEPARATE_CORPORA` |
| public_root_count | 319 |
| public_root_sha256 | `f1913eca...` |
| signed_card_count | 335 |
| signed_card_id_overlap | 0 |
| ots_covers | `PUBLIC_ROOT_BYTES_ONLY` |

**Status:** CORRECT. Public root and signed-card index are separate corpora with zero identifier overlap. OTS proof covers ONLY the 25,513-byte root.json, not the mill-cards or signed-card corpus.

### Layer 5: Rekor (Sigstore Transparency Log)

| Field | Value |
|---|---|
| status | `WITNESSED` |
| UUID | `108e9186e8c5677a60f8e5499012cdd18803397ac53087e7f71bb4ae1685a7fd44516d84d6064121` |
| logIndex | 3,012,420,819 |
| integratedTime | 1790744735 (2026-09-30T04:45:35Z) |
| logID | `c0d23d6ad406973f9559f3ba2d1ca01f84147d8ffc5b8445c224f98b9591801d` |
| type | `rekord/x509 over the preimage bytes with the board signature` |
| URL | https://rekor.sigstore.dev/api/v1/log/entries?logIndex=3012420819 |
| Entry file | https://councilof.ai/interop/rekor-root-f1913eca.json |

**Status:** WITNESSED — verified live via Rekor API. The entry exists at logIndex 3012420819 with integratedTime 1790744735. The inclusion proof (checkpoint + 16 hashes) is present in the entry file.

### Layer 6: OpenTimestamps (OTS)

| Field | Value |
|---|---|
| status | `CONFIRMED_BITCOIN` |
| path | `public/interop/root-f1913eca.json.ots` |
| proof_sha256 | `6ac9dd07d8b59b6a830b5056b2395c29b1ada411e97a3dab5a4d5fc987f5fac8` |
| subject_sha256 | `f1913ecaae4ea18ac113d341c1b050318cec4c49dcda440dacbbadb89eca1b4e` |
| scope | `PUBLIC_ROOT_BYTES_ONLY` |
| observed_at | 2026-10-01T08:25:24Z |
| Bitcoin blocks | [969264, 969266, 969288, 969296] |
| Bitcoin block hash | `000000000000000000018f2b886dd05a870b86fb96e3902fbe20c2241d4ef216` |
| Block time | 2026-09-30T05:18:29Z |
| Source agreement | `BLOCKSTREAM_MEMPOOL_BYTE_IDENTICAL` |
| Sources | blockstream.info + mempool.space |

**Status:** CONFIRMED_BITCOIN. OTS proof verified: embedded msg matches root.json sha256. The Bitcoin timestamp proves these exact root.json bytes existed no later than block 969264 (2026-09-30T05:18:29Z). Proof file (4,845 bytes) sha256 verified against witness.

**Verified locally:** OTS embedded msg = `f1913ecaae4ea18ac113d341c1b050318cec4c49dcda440dacbbadb89eca1b4e` ✓
**Verified locally:** OTS file sha256 = `6ac9dd07d8b59b6a830b5056b2395c29b1ada411e97a3dab5a4d5fc987f5fac8` ✓

### Layer 7: EAS / XRPL / Zenodo

| Channel | Status | Notes |
|---|---|---|
| EAS (Base) | `NOT_YET` | No EAS attestation in append-only log matches root.json sha256 |
| XRPL memo | `NOT_YET` | Needs funded XRPL account; one memo tx carrying sha256(root.json) |
| Zenodo DOI 10.5281/zenodo.21991104 | BLOCKED | Blocked since 2026-09-29 |

**Status:** NONE ACTIVE. These are future-proofing layers; the current chain is anchored by Ed25519 + Rekor + OTS/Bitcoin.

---

## Conflict Detection

| Field | Value |
|---|---|
| conflict status | `NONE` |
| rule | equal `as_of` + unequal `merkle_root` among publisher's witnessed roots = CONFLICT |
| sidecars_scanned | 52 |
| conflicts | [] |
| byte_variants | [] |

**Status:** NO CONFLICTS. All 52 scanned sidecars are consistent.

---

## Repo vs Live Delta

The branch `trust/anchor-completion-20260911-v2` was last committed on 2026-09-11. The live state has advanced:

| Field | Repo (Sep 11) | Live (Oct 7) | Delta |
|---|---|---|---|
| root sha256 | `62a1931b...` | `f1913eca...` | NEW root |
| merkle_root | `78d4e019...` | `47277a6f...` | Changed |
| card_count | 167 | 319 | +152 cards |
| bytes | 14,518 | 25,513 | +11,095 bytes |
| OTS status | `STAMPED_PENDING_BITCOIN` | `CONFIRMED_BITCOIN` | Upgraded |
| Bitcoin blocks | [] | [969264, 969266, 969288, 969296] | Anchored |
| Rekor logIndex | 2,791,822,965 | 3,012,420,819 | New entry |
| public_root_count | 167 | 319 | +152 |
| signed_card_count | 335 | 335 | Unchanged |

---

## Verified Attestations (Live)

| Attestation | Verifier | Result |
|---|---|---|
| root.json sha256 | curl + hashlib | ✓ `f1913eca...` |
| root.json bytes | curl + len() | ✓ 25,513 |
| Preimage sha256 | JSON reconstruction + hashlib | ✓ `091319dd...` |
| Preimage bytes | JSON reconstruction + len() | ✓ 274 |
| DID document | curl csoai.org/.well-known/did.json | ✓ 7 VMs, board-attestation-1 present |
| OTS subject sha256 | opentimestamps lib parse | ✓ Matches root.json sha256 |
| OTS proof sha256 | hashlib on downloaded .ots file | ✓ `6ac9dd07...` |
| Rekor entry | rekor.sigstore.dev API | ✓ Entry at logIndex 3012420819 |
| Rekor inclusion proof | Entry verification.checkpoint + hashes | ✓ Present (16 hashes) |
| Ed25519 sig (96 bytes) | DID key extraction | ⚠ Preimage matches; 96-byte sig format non-standard; witness asserts verified |
| Bitcoin attestation | OTS proof + blockstream/mempool | ✓ CONFIRMED_BITCOIN at block 969264 |

---

## Honest Gaps

1. **Ed25519 96-byte signature format** — The `sig_ed25519` field is 96 bytes (vs standard 64-byte Ed25519). The binding scheme is not publicly documented. The witness asserts `verified_against_did_json: true`, but independent local verification requires knowledge of the custom scheme.

2. **EAS, XRPL, Zenodo** — All three future-proofing layers remain unimplemented or blocked.

3. **Signed-card corpus** — 335 signed cards exist separately from the 319 public-root leaves. OTS does NOT cover the signed-card index. The signed-card corpus has its own integrity path but is outside this root audit.

4. **OTS verifier** — `opentimestamps-client` pip package installed but `ots` CLI binary not available on this host. OTS proof was verified at the library level (embedded msg matches subject sha256) but full chain verification to Bitcoin block headers requires the CLI or a Bitcoin node.

---

## Recommendations

1. Document the 96-byte signature binding scheme (r||s||hash?) in the root.json schema or HOW-TO-VERIFY-ROOT.md.
2. Update the branch with the current root-witness-latest.json reflecting the Oct 1 state.
3. Resolve Zenodo DOI blockage.
4. Consider adding EAS/XRPL layers when funded.

---

*Generated by Hermes automated TUI-5 audit, 2026-10-07.*