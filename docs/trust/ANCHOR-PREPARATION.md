> **⚠️ STALE VALUES BELOW — SUPERSEDED 2026-10-28.**
> A second supersession, dated today. The 2026-10-07 banner below named a "current root, to attest
> instead" — the root as of **2026-09-30** (`f1913eca…`, 25,513 B, 319 cards, merkle `47277a6f…`).
> **That root has itself been superseded. Do not anchor those values either.**
> Root to attest instead: read it live from `https://councilof.ai/root.json` at execution time.
> Observed **2026-10-28**: `sha256 = e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea`,
> **25,925 B**, **325** cards, merkle `a2620ac322c562b64f6b4935b283177d7cb7ada374eee100992f1b68c8539538`,
> `as_of = 2026-10-27T21:20:49Z`.
> Machine-readable current anchor state: `public/interop/root-witness-latest.json` (dated copy
> `public/interop/root-witness-2026-10-27-e9fb00e2.json`), which also carries the Rekor
> (WITNESSED, logIndex 3526124324), OTS (CONFIRMED_BITCOIN, block 973461), EAS and XRPL statuses for
> those exact bytes. `trust/anchor-state-20261007.json` is a dated 2026-10-07 snapshot of the
> 2026-09-30 root; it is kept for its date and is not edited.
> The network/contract/cost sections below remain valid; only the *hash to anchor* is stale. No
> transaction has been signed or sent.

> **⚠️ STALE VALUES BELOW — SUPERSEDED 2026-10-07.**
> *(Superseded again on 2026-10-28 — see the banner above. The root named in this banner is the
> 2026-09-30 root and must not be anchored.)*
> This document's `sha256(root.json)`, byte count, card count, `as_of` and Merkle root describe the
> root as it stood on **2026-09-11** (`62a1931b…`, 14,518 B, 167 cards). That root has since been
> superseded. **Do not anchor these values.**
> Current root, to attest instead: `sha256 = f1913ecaae4ea18ac113d341c1b050318cec4c49dcda440dacbbadb89eca1b4e`,
> 25,513 B, 319 cards, merkle `47277a6f2034e80b6279fa969e832180b55837956773ee29339a815b74c2ba2d`,
> `as_of = 2026-09-30T05:05:34Z`. Read it live from `https://councilof.ai/root.json` at execution time.
> Machine-readable current anchor state: `trust/anchor-state-20261007.json`.
> The network/contract/cost sections below remain valid; only the *hash to anchor* is stale, and the
> document already instructed re-fetching at execution time. No transaction has been signed or sent.

---

# Anchor Transaction Preparation

**Date:** 2026-09-11
**Status:** DOCUMENTATION ONLY — no transactions executed
**STOP gate:** All steps below prepare exact parameters. No paid signature or transaction is submitted.

## Exact Hash to Anchor

The hash to anchor is the SHA-256 of the **exact server response bytes** of `/root.json`.

> ⚠️ **The values below are the superseded 2026-09-11 root**, kept so a reader who saw them can see
> what was published. They are **not** the hash to attest. See the banner at the top of this file for
> the current root, and re-fetch at execution time — as this section already instructs.

```
SHA-256(root.json bytes): 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6   <- superseded
Bytes:                     14,518                                                                 <- superseded
Merkle root (inside):      78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5   <- superseded
Card count:                167                                                                      <- superseded
As of:                     2026-09-11T08:45:22Z                                                    <- superseded
```

**Current root, read live at execution time.** `GET https://councilof.ai/root.json`, SHA-256 over the
served bytes. Observed **2026-10-28**:

```
sha256 = e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea
bytes  = 25925
merkle = a2620ac322c562b64f6b4935b283177d7cb7ada374eee100992f1b68c8539538
cards  = 325
as_of  = 2026-10-27T21:20:49Z
```

**Critical:** Re-fetch and re-hash `root.json` at execution time. If the root has been
superseded since this document was written, attest the CURRENT root, not the one named here.

---

## 1. Base EAS Attestation

### Network

| Parameter | Value |
|-----------|-------|
| Chain | Base (mainnet) |
| Chain ID | 8453 |
| EAS Contract | `0x4200000000000000000000000000000000000021` |
| Schema Registry | `0x4200000000000000000000000000000000000020` |
| Explorer | https://base.easscan.org/ |

### Schema

```
bytes32 sha256, string as_of, string did
```

| Field | Type | Value |
|-------|------|-------|
| `sha256` | `bytes32` | `0x` + the sha256 of the live `root.json` bytes — read at execution time (observed 2026-10-28: `0xe9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea`) |
| `as_of` | `string` | the live root's `as_of` (observed 2026-10-28: `2026-10-27T21:20:49Z`) |
| `did` | `string` | `did:web:csoai.org#board-attestation-1` |

> The `sha256` and `as_of` above were typed as `0x62a1931b…` / `2026-09-11T08:45:22Z` — the 2026-09-11
> root. Those are **superseded**; they are shown here only so a reader who saw them can see what was
> published. Read both from the live root at execution time.

### Execution Steps

1. **Register schema** (once, if no matching `schemaUID` exists):
   ```
   SchemaRegistry.register(
     "bytes32 sha256,string as_of,string did",
     resolverAddress = 0x0000000000000000000000000000000000000000,
     revocable = false
   )
   ```
   Record `schemaUID`.

2. **Encode attestation data** with `SchemaEncoder` for the three fields above.

3. **Submit attestation:**
   ```
   EAS.attest({
     schema: schemaUID,
     data: {
       recipient: 0x0 (or CSOAI address),
       expirationTime: 0,
       revocable: false,
       refUID: 0x0,
       data: <encoded>
     }
   })
   ```

4. **Record** attestation UID at `https://base.easscan.org/attestation/view/<UID>`.

### Cost Estimate

| Item | Cost |
|------|------|
| Schema registration | ~$0.01-0.05 (one-time, Base gas) |
| Attestation | ~$0.01-0.03 (per attestation, Base gas) |
| **Total** | **~$0.02-0.08** |

Base has no protocol fee for EAS attestations. Gas-only cost. Permissionless (no KYC).

### Replay Verification

A stranger verifies by:
1. Fetching the attestation UID from `base.easscan.org`
2. Decoding the on-chain data to extract `sha256`, `as_of`, `did`
3. Fetching the named `root.json` and hashing its bytes
4. Confirming `sha256(root.json bytes) == on-chain sha256`

### Blocker

**NO_ESTATE_SIGNER**: No funded Base wallet or private key is held by the estate.
The attestation requires a signing key with Base ETH for gas. This is an **owner gate**.

---

## 2. XRPL Memo Anchor

### Network

| Parameter | Value |
|-----------|-------|
| Network | XRPL Devnet (initially; mainnet when ready) |
| Account | To be provisioned (funded XRPL account) |
| Transaction type | Payment (self-payment with memo) |

### Memo Content

```
MemoType:   "csoai.root.anchor" (hex-encoded)
MemoData:   sha256 of the live root.json bytes, hex-encoded
             (read at execution time; observed 2026-10-28:
              e9fb00e240b11c1d31f138ad1248c8c211b56267360a092550d448903d9ce7ea)
MemoFormat: "application/octet-stream" (hex-encoded)
```

> `MemoData` was typed as `62a1931b…` — the 2026-09-11 root, now **superseded**. Read it from the live
> root at execution time.

### Execution Steps

1. **Provision or identify** a funded XRPL account.
2. **Submit** a self-payment (Account == Destination) with the memo fields above.
3. **Record** the transaction hash.
4. **Verify** by looking up the tx hash on an XRPL explorer and decoding the memo.

### Cost Estimate

| Item | Cost |
|------|------|
| XRPL transaction fee | ~0.00001 XRP (~$0.000003 at $0.30/XRP) |
| Account reserve (if new) | 10 XRP (~$3.00) |
| **Total** | **~$3.00 (first time) or ~$0.00 (existing account)** |

### Replay Verification

A stranger verifies by:
1. Looking up the transaction hash on an XRPL explorer
2. Decoding the memo to extract the SHA-256 hash
3. Fetching and hashing the named `root.json` to confirm match

### Blocker

**Needs funded XRPL account**: Devnet dry-run was in PR #1884. Mainnet requires
a funded account and owner decision on which account to use.

---

## 3. Comparison: All Witness Rails

| Rail | Proof Type | Verifiable By | Status (read 2026-10-28) |
|------|-----------|--------------|--------|
| Ed25519 envelope | Integrity + authorship | Anyone with DID doc | **VERIFIED** |
| Rekor (Sigstore) | Transparency log inclusion | Public API | **WITNESSED** (logIndex 3526124324) |
| OpenTimestamps | Calendar stamp | OTS client | **CONFIRMED_BITCOIN** |
| Bitcoin (via OTS) | Existence no later than block | OTS verify + block explorer | **CONFIRMED** (block 973461) |
| Base EAS | On-chain attestation | base.easscan.org | **NOT_YET** (owner gate) |
| XRPL memo | On-chain memo | XRPL explorer | **NOT_YET** (owner gate) |

Read the rails from `public/interop/root-witness-latest.json` → `witnesses`. This table said
`STAMPED_PENDING_BITCOIN` and Bitcoin `NOT_YET` on 2026-09-11; the root was confirmed in a Bitcoin
block on 2026-09-30, and the current root's OTS proof names block 973461. A rail status is a
statement about particular bytes — re-read it with the root it describes.

**Key principle:** Each rail proves something different. No single rail proves everything.
- Ed25519 proves integrity and authorship, not time or independence
- Rekor proves log inclusion, not claim truth
- OTS+Bitcoin proves bytes existed by a block time, not correctness
- EAS/XRPL provide additional independent anchors, not stronger signatures
