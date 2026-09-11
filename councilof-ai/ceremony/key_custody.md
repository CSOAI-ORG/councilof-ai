# CSOAI Key Custody & Ceremony Receipt
## TUI 5 — Signing, Roots and Anchoring
**Date:** 2026-09-11

---

## 1. Signing Key Architecture

### Active Keys

| Key ID | Purpose | Algorithm | Location | DID Fragment |
|--------|---------|-----------|----------|--------------|
| `board-attestation-1` | Root envelope + card compact envelope signing | Ed25519 | Off-device (cold) | `did:web:csoai.org#board-attestation-1` |
| `card-attestation-1` | Historical corpus (335 cards) signing | Ed25519 | Off-device (cold) | `did:web:csoai.org#card-attestation-1` |

### Key Material (PUBLIC ONLY — private keys NEVER in source)

**board-attestation-1:**
- JWK x-coordinate: `k2fPWb6ctyu8l5at8FYgHsHFit_qoT-DssW3VNbCAXA`
- Raw hex: `9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170`

**card-attestation-1:**
- Raw hex: `d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38`

### DID Document
- URL: https://csoai.org/.well-known/did.json
- Verification methods: 2 (board-attestation-1, card-attestation-1)

---

## 2. Ceremony Status

### Completed Ceremonies

| Ceremony | Date | Operator | Result |
|----------|------|----------|--------|
| Root signing (167 cards) | 2026-09-11 | Off-device (OIDC/GitHub) | VALID |
| Card signing (335 corpus) | Pre-2026-08-28 | Off-device (M2) | VALID |
| Rekor inclusion | 2026-09-11 | Automated | WITNESSED (logIndex 2791822965) |
| OTS submission (alice+bob) | 2026-09-11 | Automated | STAMPED_PENDING_BITCOIN |

### Pending Ceremonies

| Ceremony | Status | Blocker | Cost |
|----------|--------|---------|------|
| Base EAS attestation | PREPARED_NOT_SUBMITTED | Owner wallet + gas | ~$0.01 |
| XRPL memo anchor | PREPARED_NOT_SUBMITTED | Owner XRPL account + XRP | ~$0.00001 |
| Ethereum EAS attestation | PREPARED_NOT_SUBMITTED | Owner wallet + gas | ~$0.50-2 |
| OTS Bitcoin confirmation | PENDING | Bitcoin block inclusion (automatic) | $0 |
| Cold key ceremony receipt | NOT_STARTED | OCI Vault or 2-of-3 MPC | $0 |

---

## 3. Security Invariants

1. **Private keys NEVER in source, artifacts, logs, or browser storage**
2. **Signing is off-device** — the Mac/browser never holds the private key
3. **GitHub OIDC route** for automated signing — the key is in a secrets vault, not in the repo
4. **DID document is the single source of truth** for public key pinning
5. **Every card carries its own pubkey** — a verifier must pin against DID.json first

---

## 4. Root Pipeline Determinism

The Merkle root is deterministic:
```
parent = sha256(left || right)
```
- Pairs are positional (left, right), NOT sorted
- Odd nodes at any level are paired with themselves (not promoted)
- No domain-separation prefix (v1; v2 should adopt RFC 6962)
- Same leaf set → same root, always

### CVE-2012-2459 Note
Pairing an odd node with itself makes the tree collidable: appending duplicates of the tail produces a different leaf set with an identical merkle_root. The `card_count` inside the signed preimage is the only field that distinguishes them. A verifier that recomputes the root and stops has NOT finished — check `len(card_sha256) == card_count`.

---

## 5. Costs Summary

| Chain | Method | Cost | Status | Owner Action |
|-------|--------|------|--------|--------------|
| Rekor (Sigstore) | rekord entry | $0 | WITNESSED | None needed |
| Bitcoin (OTS) | Calendar submission | $0 | STAMPED_PENDING | Wait for BTC block |
| Base | EAS attestation | ~$0.01 | PREPARED | Fund wallet + sign |
| XRPL | Memo transaction | ~$0.00001 | PREPARED | Fund account + sign |
| Ethereum | EAS attestation | ~$0.50-2 | PREPARED | Fund wallet + sign |

**Total remaining cost to complete all 5 chains: ~$0.52-2.01**
