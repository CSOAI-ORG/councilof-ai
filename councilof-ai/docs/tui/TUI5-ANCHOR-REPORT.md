# TUI 5 — Signing, Roots and Anchoring — REPORT
## Branch: `trust/anchor-completion-20260911`
## Date: 2026-09-11

---

## Executive Summary

**TUI 5 completed the evidence chain verification and prepared all remaining anchor transactions.**

The signing infrastructure is **sound and independently verified**. The root signature, Merkle tree, card signatures, and inclusion proofs all validate against the pinned DID key. Two of five chains are anchored (Rekor + OTS). Three chains are prepared and awaiting owner approval for submission.

---

## 0. RE-VERIFICATION — 2026-10-07 (full sweep; supersedes date-stamped states below)

Observation window `2026-10-07T03:59:47Z → 04:12:00Z`. Source: live `councilof.ai`, `csoai.org`, `rekor.sigstore.dev`, Blockstream + mempool.space. Verifier: `anchoring/verify_all.py` (keys pinned from DID, never from card bytes). Machine receipt: `anchoring/full-verification-receipt.json` + `anchoring/tui5-evidence.json`. **Actual spend: $0.**

### Subject (immutable version)

| Field | Value |
|-------|-------|
| root.json sha256 | `f1913ecaae4ea18ac113d341c1b050318cec4c49dcda440dacbbadb89eca1b4e` (25,513 bytes) |
| root as_of | `2026-09-30T05:05:34Z` (kind `csoai.public-root/v1`) |
| merkle root | `47277a6f2034e80b6279fa969e832180b55837956773ee29339a815b74c2ba2d` |
| card_count | **319** (the 2026-09-11 baseline of 167 was true then, stale now — always cite `as_of`) |

### The seven layers — verified separately, never collapsed

| # | Layer | State (2026-10-07) | Evidence |
|---|-------|--------------------|----------|
| 1 | Card signature | ✅ **317 VALID / 2 EXPLICITLY UNSIGNED / 0 INVALID** (corpus A, 319 cards); ✅ 335/335 (corpus B) | Ed25519 compact envelope vs DID-pinned `board-attestation-1`; null `sig_ed25519` on `617122cb45ba83ab`, `747a510c1d3c618f` counted UNSIGNED, not valid |
| 2 | Merkle-root inclusion | ✅ **319/319** | exact leaf membership + index-aware directional walks reach the published root; digests 319/319 (191 cards `ensure_ascii=False`, 128 `True`); `319 leaves == card_count` |
| 3 | Rekor witness | ✅ **WITNESSED @ logIndex 3012420819** | live `rekord` entry retrieved 2026-10-07, integratedTime 1790744735, treeSize 3,001,319,956. *(2791822965 was the 167-card root's witness — report both with their own root digest)* |
| 4 | OTS submission | ✅ proof parsed | `root-f1913eca.json.ots`, 4,845 bytes, sha256 `6ac9dd07…` matches sidecar; target == sha256(live root.json) confirmed by `ots info` |
| 5 | Bitcoin confirmation | ✅ **CONFIRMED_BITCOIN** | reference client `opentimestamps-client 0.7.2` parses `BitcoinBlockHeaderAttestation` at blocks **969264, 969266, 969288, 969296**; all 4 headers byte-identical across Blockstream + mempool.space, `sha256d(header)==block_hash`, 76–84 leading zero bits |
| 6 | Base EAS | 🔲 **NOT_YET** | sidecar: no attestation matches this root sha256; spec `anchoring/base-eas-spec.json`, max ~$0.01, owner-gated |
| 7 | XRPL memo | 🔲 **NOT_YET** | needs funded XRPL account; spec `anchoring/xrpl-memo-spec.json`, max ~$0.00001, owner-gated |

**The 167-card root's OTS is now also Bitcoin-confirmed** (blocks 966483/966485/967122; its proof bytes changed since 11 Sep — old digest `4a118e96…` superseded by `ff0776e0…`). On 2026-09-11 the state was `STAMPED_PENDING_BITCOIN`; each state is date-stamped, never back-dated.

**Scope:** the Bitcoin timestamp proves these exact root.json bytes existed no later than the named block — not correctness, not certification, and it does not cover the separate 335-card index (0 identifier overlap; OTS scope `PUBLIC_ROOT_BYTES_ONLY`).

**Residual uncertainty:** no local bitcoind, so `ots verify`'s full-node leg could not run; substituted by reference-client parse + dual-source header re-verification. Reorg depth beyond the two explorers not tested.

### Prepared transactions refreshed against the live root (same window)

The 2026-09-11 specs carried the retired 167-card hash — a prepared transaction naming a dead root would anchor history by accident. All three regenerated:

| Spec | Datum | Contract verified on-chain | Live cost observed | Max authorised | Replay verification |
|------|-------|---------------------------|--------------------|----------------|---------------------|
| `base-eas-spec.json` v0.2 | `f1913eca…` | EAS `0x4200…0021` 2,055 B + registry `0x4200…0002` 2,055 B @ block 52278957 | 0.006 gwei → ~$0.0005–0.003 | $0.05 | 6-step read-back in spec |
| `xrpl-memo-spec.json` v0.2 | `f1913eca…` (MemoData hex, roundtrip-verified) | n/a (protocol) | 10 drops open-ledger via `xrpl.ws` | 1000 drops | 8-step read-back in spec |
| `eth-eas-spec.json` v0.1 **NEW** | `f1913eca…` | **corrected** EAS `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` 19,971 B + registry `0xA7b392…7BDF` 1,976 B @ block 26138114 | 0.1213 gwei → ~$0.0001–0.001 | $2.00 | 6-step read-back in spec |

**All three anchor one identical subject:** `sha256(root.json) = f1913eca…` — the same value as the OTS subject, the Rekor content and the sidecar `artifact.sha256`. Each spec stops at `PREPARED_NOT_SUBMITTED`; nothing signed, nothing submitted, **$0 spent**.

### Blocker-resolution round (same day, owner instructed "fix all those")

| Blocker | Action taken | State |
|---|---|---|
| Base EAS has no attester key | Dedicated hot wallet `0x65910f9827e2a87c4acb961b35f33c09ee0c94f2` created; key → `gh secret set EAS_ATTESTER_PRIVATE_KEY` via stdin, then shredded from disk (never in chat/logs/repo). The `eas-root-attestations.json` reason `no attester key in GitHub secrets` is now obsolete. | ✅ key live · ⏳ needs 0.00002 ETH dust on Base, then the hourly `public-root` publish auto-attests (schema, relay and log-write all pre-existing) |
| XRPL memo has no account | Dedicated standard account generated with `xrpl-py` (roundtrip-verified): **`rJJYvRPDPyGCa3jfCGCEGRccrk7S1bPLCk`**; seed in `~/.sovereign/keystore/xrpl_anchor_account_seed.txt` (0600), never printed | ⏳ needs ≥10 XRP activation, then prepared memo tx fires |
| 2 unsigned root cards (USDQ/EURQ) | Root cause: `publish_public_root.py` skipped signing for the 2026-08-31 grandfather set *even when a signer was available* (`will_sign = is_new and have_key`). Fix: `will_sign = have_key` + semantics comment. | ✅ **PR #2869** (CSOAI-ORG/councilof-ai), 3 commits, MERGEABLE — next `public-root` publish signs them automatically |
| Ethereum EAS L1 | `scripts/eas_attest_root_eth.mjs` (official v0.26 contracts, on-chain-verified; fail-closed `NOT_YET`/`NOT_FUNDED`/`WAITING_GAS`, ≤$2 cap) + `.github/workflows/eas-eth-attest.yml` (`confirm=attest-l1` gate, PR-only) | ✅ in **PR #2869** (commit `2d682927`) |
| Base script would crash on empty wallet | Adding the attester key activated `eas_attest_root.mjs`'s spend path for the first time — it had no balance/gas guard, so the first publish after candidate promotion would revert and fail the publish step. Added `NOT_FUNDED`/`WAITING_GAS` fail-closed guards (state written only on change, so the log's `.ots` stays valid). | ✅ in **PR #2869** (commit `8e3b898a`, `node --check` green) |
| Cold-key ceremony receipt | Reconstructed from runtime evidence ONLY: run `32266562512` (2026-08-19T14:51:53Z, actor `CSOAI-ORG`, success), workflow bytes, secret inventory, relay allowlist. Unverifiable links `UNVERIFIED`, missing witness `MISSING` | ✅ `ceremony/board-attestation-ceremony-receipt.md` + `ceremony/OWNER-ACTIONS-STAGED.md` (committed, pushed) |

**Owner-bounded asks (stage, never fire):** three sends staged in `ceremony/OWNER-ACTIONS-STAGED.md` — Base 0.00002 ETH, L1 0.0004 ETH (P2), XRPL ≥10 XRP. **Spend to date: $0.**

---

### Verified Baseline (2026-09-11, date-stamped — superseded states listed in §0)

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
| "OTS is Bitcoin-confirmed" (stated without date) | Only true from the notarisation date: on 2026-09-11 it was `STAMPED_PENDING_BITCOIN`; verified `CONFIRMED_BITCOIN` on 2026-10-07 at blocks 969264/969266/969288/969296 (§0) |
| "Rekor logIndex 2791822965" (as current) | That index witnesses the 167-card root; the 319-card root is witnessed at 3012420819 — each cited with its own root sha256 |
| "167 cards in the current root" | 167 @ 2026-09-11; live root as_of 2026-09-30 carries **319** — always cite `as_of` |
| "All 319 root cards are signed" | 317 valid + **2 null `sig_ed25519`** explicitly counted UNSIGNED (0 invalid) |
| "Ethereum EAS = 0xA1207F3BBa224E2c9c3c6D5b0f0f4c9d8b7c6d5e" | **FABRICATED — `eth_getCode` = 0 bytes.** Corrected to official v0.26 `0xA1207F3BBa224E2c9c3c6D5aF63D0eb1582Ce587` (19,971 B code), re-verified on-chain |
| "Prepared specs target the live root" | v0.1 specs carried the retired 167-card hash `78d4e019…`; all three regenerated 2026-10-07 against `sha256(root.json) f1913eca…` |

---

## 9. Deliverables Produced

| File | Purpose |
|------|---------|
| `anchoring/verify_chain.py` | Independent card + root + infrastructure verification |
| `anchoring/verify_all.py` | **Full sweep: every card in both corpora (502 cards), receipt output** |
| `anchoring/full-verification-receipt.json` | Machine receipt of the 2026-10-07 full sweep |
| `anchoring/tui5-evidence.json` | Seven-layer evidence chain with exact digests, counts, costs, blockers |
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
| ~~OTS awaiting Bitcoin~~ **RESOLVED 2026-10-07** | — | Bitcoin-confirmed at blocks 969264/969266/969288/969296 (§0) |
| 2 root cards unsigned (`617122cb45ba83ab`, `747a510c1d3c618f`) | P2 | Re-sign off-device or exclude from next root — creator lane decision |
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
