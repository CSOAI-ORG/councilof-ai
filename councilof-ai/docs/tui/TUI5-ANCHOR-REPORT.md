# TUI 5 — Signing, Roots and Anchoring — REPORT
## Branch: `trust/anchor-completion-20260911`
## Date: 2026-09-11

---

## Executive Summary

**TUI 5 completed the evidence chain verification and prepared all remaining anchor transactions.**

The signing infrastructure is **sound and independently verified**. The root signature, Merkle tree, card signatures, and inclusion proofs all validate against the pinned DID key. Two of five chains are anchored (Rekor + OTS). Three chains are prepared and awaiting owner approval for submission.

### Verified Baseline

| Component | Status | Evidence |
|-----------|--------|----------|
| Root signature | ✅ VALID | Ed25519 over 6-field preimage, verified against `did:web:csoai.org#board-attestation-1` |
| Merkle root | ✅ VALID | 167 leaves, positional `sha256(left‖right)`, recomputed matches published |
| Card signatures | ✅ VALID | Compact envelope `{did,schema,surface,as_of,sha256}`, `ensure_ascii=False` |
| Inclusion proofs | ✅ VALID | 8-level Merkle path from card to root |
| Rekor witness | ✅ WITNESSED | logIndex 2791822965, type rekord/x509 |
| OTS (Bitcoin) | ⏳ STAMPED_PENDING_BITCOIN | Alice+bob calendars accepted, awaiting BTC block |
| Base EAS | 🔲 PREPARED | Transaction spec ready, ~$0.01 |
| XRPL memo | 🔲 PREPARED | Transaction spec ready, ~$0.00001 |
| Ethereum EAS | 🔲 PREPARED | Transaction spec ready, ~$0.50-2 |

---

## 1. Independent Verification Results

### 1.1 Root Envelope Signature

```
Preimage: canonical JSON of {kind, schema, as_of, merkle_root, card_count, did_intended}
Preimage bytes: 274
Algorithm: Ed25519
Key: did:web:csoai.org#board-attestation-1
Key hex: 9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170
Result: VALID
```

### 1.2 Merkle Root Recomputation

```
Leaf count: 167 (declared: 167) — count match confirmed
Algorithm: sha256(left || right), positional pairs, odd-leaf self-duplication
Computed root: 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Published root: 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Result: MATCH
```

### 1.3 Card Signature (sample card `7ecb4c3e...`)

```
Digest: sha256(whole-card-except-sha256-and-sig_ed25519) → matches card.sha256
Signature: Ed25519 over compact envelope {did, schema, surface, as_of, sha256}
ensure_ascii: False
Key: d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38
Result: VALID
```

### 1.4 Merkle Inclusion Proof

```
Card: 7ecb4c3e15e1fa75...
Proof depth: 8 levels
Computed root from proof: 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Published root: 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Result: VALID
```

### 1.5 Infrastructure Status (live check)

| Service | Status | Detail |
|---------|--------|--------|
| Rekor API | LIVE | Tree size 2,670,683,164 |
| OTS Alice calendar | 200 OK | alice.btc.calendar.opentimestamps.org |
| OTS Bob calendar | 200 OK | bob.btc.calendar.opentimestamps.org |
| DID document | LIVE | 5 verification methods |
| Root.json | LIVE | 14,518 bytes, 167 cards |
| Signed card index | LIVE | 335 cards (separate corpus) |
| Card store | LIVE | 336 signed cards via /api/cards |

---

## 2. Two Corpora — Never Conflated

| Corpus | Count | Source | Signing Key | Anchor Coverage |
|--------|-------|--------|-------------|-----------------|
| Public root leaves | 167 | root.json `card_sha256[]` | board-attestation-1 | Rekor ✅ + OTS ⏳ |
| Signed card index | 335 | signed/card_index.json | card-attestation-1 | None (separate) |

**Identifier overlap: 0.** The two corpora are separate. The root's Merkle tree and the card index serve different purposes. Never sum them.

---

## 3. Rekor Witness (Sigstore)

- **Status:** WITNESSED
- **logIndex:** 2791822965
- **UUID:** 108e9186e8c5677a745e131404b16562b3698b099d3c32b8f93e5a38745fe73ebb5a2350cca83598
- **integratedTime:** 1789116324 (Unix timestamp)
- **Type:** rekord/x509 (pure Ed25519 rejected by hashedrekord)
- **Entry file:** https://councilof.ai/interop/rekor-root-62a1931b.json
- **Next push:** Not needed until root changes

---

## 4. OTS (Bitcoin) Status

- **Status:** STAMPED_PENDING_BITCOIN
- **Calendars:** alice + bob both accepted submission
- **Subject SHA-256:** 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6
- **Proof file:** https://councilof.ai/interop/root-62a1931b.json.ots
- **Bitcoin blocks observed:** [] (none yet)
- **Note:** "Pending is not a Bitcoin timestamp." The calendar accepted the digest; Bitcoin confirmation is automatic when the calendar's next notarization lands on-chain.

---

## 5. Prepared Anchor Transactions

### 5.1 Base EAS (eip155:8453)

| Field | Value |
|-------|-------|
| Network | Base L2 (chain_id 8453) |
| Contract | 0x4200000000000000000000000000000000000021 |
| Root hash | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| Cost | ~$0.01 |
| Status | PREPARED_NOT_SUBMITTED |
| Owner action | Fund Base wallet + sign + submit |
| Spec file | anchoring/base-eas-spec.json |

### 5.2 XRPL Memo (mainnet)

| Field | Value |
|-------|-------|
| Network | XRP Ledger Mainnet |
| MemoData | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| MemoFormat | csoai-public-root-v1 |
| Cost | ~0.00001 XRP (~$0.00001) |
| Status | PREPARED_NOT_SUBMITTED |
| Owner action | Fund XRPL account + sign + submit |
| Spec file | anchoring/xrpl-memo-spec.json |

### 5.3 Ethereum EAS (eip155:1)

| Field | Value |
|-------|-------|
| Network | Ethereum L1 |
| Root hash | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| Cost | ~$0.50-2 (gas dependent) |
| Status | PREPARED_NOT_SUBMITTED |
| Owner action | Fund ETH wallet + sign + submit |
| Spec file | (same pattern as Base EAS) |

**Total cost to complete all 3 remaining chains: ~$0.52-2.01**

---

## 6. Key Custody

- **Private keys:** NEVER in source, artifacts, logs, or browser storage
- **Signing:** Off-device ceremony (GitHub OIDC / cold storage)
- **DID document:** https://csoai.org/.well-known/did.json (5 verification methods)
- **Board key (public):** 9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170
- **Card key (public):** d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38

Full custody document: `ceremony/key_custody.md`

---

## 7. CVE-2012-2459 Mitigation

The Merkle tree's odd-leaf self-duplication makes it collidable: appending duplicates of the tail produces a different leaf set with an identical merkle_root. The `card_count` inside the signed preimage is the only field that distinguishes them.

**Mitigation applied:** Verifiers MUST check `len(card_sha256) == card_count` in addition to recomputing the root. A future `csoai.public-root/v2` should adopt RFC 6962 domain separation.

---

## 8. Claims Rejected or Corrected

| Claim | Correction |
|-------|------------|
| "OTS Bitcoin proof" | STAMPED_PENDING_BITCOIN — not yet a Bitcoin timestamp |
| "168 cards in root" | 167 (as of 2026-09-11T08:45:22Z) |
| "335 signed cards anchored" | 335 signed cards are a SEPARATE corpus, NOT anchored by the root |
| "5 chains anchored" | 2 of 5 (Rekor + OTS pending BTC). 3 prepared. |
| "Anchoring complete" | Infrastructure ready, 3 transactions need owner approval |
| "DID has 2 verification methods" | 5 methods: site-release-1, estate-chain-1, board-attestation-1, card-attestation-1, gspc-board-22axis-2026 |
| "Inclusion proofs: always hash(current+node)" | Direction-aware: hash(current+node) when sibling is right, hash(node+current) when left |

---

## 9. Deliverables Produced

| File | Purpose |
|------|---------|
| `anchoring/verify_chain.py` | Independent card + root + infrastructure verification |
| `anchoring/test_chain.py` | End-to-end test suite (9 tests, exit 0/1) |
| `anchoring/root_pipeline.py` | Deterministic Merkle root recomputation |
| `anchoring/rekor_push.py` | Rekor state documentation + future push guide |
| `anchoring/xrpl_memo.py` | XRPL memo transaction preparation |
| `anchoring/xrpl-memo-spec.json` | Ready-to-sign XRPL transaction spec |
| `anchoring/base_anchor.py` | Base EAS attestation preparation |
| `anchoring/base-eas-spec.json` | Ready-to-sign Base EAS spec |
| `anchoring/rekor-state.json` | Current Rekor inclusion state |
| `anchoring/root-pipeline-output.json` | Root pipeline verification output |
| `ceremony/key_custody.md` | Key custody + ceremony receipt |

---

## 10. Unresolved Blockers

| Blocker | Severity | Owner Action |
|---------|----------|--------------|
| Base EAS not submitted | P1 | Fund wallet + sign (~$0.01) |
| XRPL memo not submitted | P1 | Fund account + sign (~$0.00001) |
| Ethereum EAS not submitted | P2 | Fund wallet + sign (~$0.50-2) |
| OTS awaiting Bitcoin | P2 | Automatic — wait for next calendar notarization |
| Cold key ceremony receipt | P2 | Document key generation ceremony |

---

## 11. Cost Accounting

| Item | Cost | Funding Source |
|------|------|----------------|
| Root signing | $0 | Off-device ceremony (no on-chain cost) |
| Rekor inclusion | $0 | Free public service |
| OTS submission | $0 | Free calendar service |
| Base EAS (prepared) | ~$0.01 | OWNER (not yet spent) |
| XRPL memo (prepared) | ~$0.00001 | OWNER (not yet spent) |
| Ethereum EAS (prepared) | ~$0.50-2 | OWNER (not yet spent) |
| **Total actual spend** | **$0** | All anchoring to date is free |
| **Total to complete** | **~$0.52-2.01** | Requires owner wallet funding |

---

## 12. Tests Run

1. ✅ Root signature verified independently (PyNaCl, pinned DID key)
2. ✅ Merkle root recomputed from 167 leaves (positional, matches published)
3. ✅ Card digest verified (sha256 of whole-card-except-sha256-and-sig)
4. ✅ Card signature verified (compact envelope, ensure_ascii=False)
5. ✅ Merkle inclusion proof verified (8-level path, card→root)
6. ✅ Rekor entry confirmed (logIndex 2791822965, sidecar verified)
7. ✅ OTS calendars confirmed (alice+bob both 200 OK)
8. ✅ DID document confirmed (5 verification methods, board + card keys present)
9. ✅ Card count match (167 leaves == 167 declared)
10. ✅ Corpus separation confirmed (0 overlap between 167 root + 335 index)

---

*Measurement, not certification. Every number is derived from live tool output, never typed.*
