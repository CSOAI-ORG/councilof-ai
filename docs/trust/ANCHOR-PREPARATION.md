# Anchor Transaction Preparation

**Date:** 2026-09-11
**Status:** DOCUMENTATION ONLY — no transactions executed
**STOP gate:** All steps below prepare exact parameters. No paid signature or transaction is submitted.

## Exact Hash to Anchor

The hash to anchor is the SHA-256 of the **exact server response bytes** of `/root.json`:

```
SHA-256(root.json bytes): 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6
Bytes:                     14,518
Merkle root (inside):      78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5
Card count:                167
As of:                     2026-09-11T08:45:22Z
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
| `sha256` | `bytes32` | `0x62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6` |
| `as_of` | `string` | `2026-09-11T08:45:22Z` |
| `did` | `string` | `did:web:csoai.org#board-attestation-1` |

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
MemoData:   62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6
             (SHA-256 of root.json bytes, hex-encoded)
MemoFormat: "application/octet-stream" (hex-encoded)
```

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

| Rail | Proof Type | Verifiable By | Status |
|------|-----------|--------------|--------|
| Ed25519 envelope | Integrity + authorship | Anyone with DID doc | **VERIFIED** |
| Rekor (Sigstore) | Transparency log inclusion | Public API | **WITNESSED** |
| OpenTimestamps | Calendar stamp | OTS client | **STAMPED_PENDING_BITCOIN** |
| Bitcoin (via OTS) | Existence no later than block | OTS verify + block explorer | **NOT_YET** |
| Base EAS | On-chain attestation | base.easscan.org | **NOT_YET** (owner gate) |
| XRPL memo | On-chain memo | XRPL explorer | **NOT_YET** (owner gate) |

**Key principle:** Each rail proves something different. No single rail proves everything.
- Ed25519 proves integrity and authorship, not time or independence
- Rekor proves log inclusion, not claim truth
- OTS+Bitcoin proves bytes existed by a block time, not correctness
- EAS/XRPL provide additional independent anchors, not stronger signatures
