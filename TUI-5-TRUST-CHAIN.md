# TUI 5 — Signing, Roots and Anchoring
**Generated:** 2026-09-11T13:35:00Z
**Basis:** master (b9e752aa)
**Branch:** trust/anchor-completion-20260911

---

## Trust Chain — 7 Layers (Never Collapsed)

### 1. Card Signature — ✅ VERIFIED

| Item | Value |
|------|-------|
| Algorithm | Ed25519 |
| Pubkey | d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38 |
| Chain positions | 335 |
| Verified valid | 335 |
| Verified invalid | 0 |
| Verifier | public/signed/verify-card.mjs |
| Chain manifest signature | VALID |
| Head | 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da |
| State | **VERIFIED** |

### 2. Merkle Root — ✅ VERIFIED

| Item | Value |
|------|-------|
| Root file | public/root.json |
| Card count | 167 |
| Merkle root | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| as_of | 2026-09-11T08:45:22Z |
| DID | did:web:csoai.org#board-attestation-1 |
| Schema | https://councilof.ai/schema/public-root-v1.json |
| Kind | csoai.public-root/v1 |
| Root SHA-256 | 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6 |
| Root bytes | 14,518 |
| Merkle verification | Node.js verify-card.mjs: VALID 1 · INVALID 0 |
| Root signature | Ed25519 VERIFIED (board-attestation key) |
| State | **VERIFIED** |

### 3. Rekor Witness — ✅ WITNESSED

| Item | Value |
|------|-------|
| Log index | 2791822965 |
| State | WITNESSED |
| URL | https://rekor.sigstore.dev/api/v1/log/entries?logIndex=2791822965 |
| Sidecar | public/interop/rekor-root-62a1931b.json |
| Network verification | TIMEOUT (Rekor API) — sidecar data confirms |
| State | **WITNESSED** |

### 4. OpenTimestamps — ⏳ STAMPED_PENDING_BITCOIN

| Item | Value |
|------|-------|
| State | STAMPED_PENDING_BITCOIN |
| OTS file | public/interop/root-62a1931b.json.ots |
| File size | 770 bytes |
| Bitcoin blocks | [] (none confirmed) |
| Sidecar | public/interop/gsr-ots-pending.json |
| Truth rule | STAMPED_PENDING_BITCOIN is submission evidence, NOT a Bitcoin anchor |
| State | **STAMPED_PENDING_BITCOIN** |

### 5. Bitcoin Confirmation — ❌ NOT_YET

| Item | Value |
|------|-------|
| State | NOT_YET |
| Dependency | OTS calendar must confirm first |
| State | **NOT_YET** |

### 6. Base EAS Attestation — ❌ NOT_YET

| Item | Value |
|------|-------|
| State | NOT_YET |
| Network | Base (eip155:8453) |
| Subject hash | 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6 |
| Merkle root | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| Expected max cost | ~$0.001–0.01 USDC (gas on Base L2) |
| Sidecar | public/interop/gsr-eas-attestation.json |
| **STOPPED** | Requires owner approval for on-chain transaction |
| State | **NOT_YET** |

### 7. XRPL Memo Anchor — ❌ NOT_YET

| Item | Value |
|------|-------|
| State | NOT_YET |
| Network | XRPL mainnet |
| Subject hash | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| Expected max cost | ~0.00001 XRP (~$0.000002) |
| Devnet dry-run | Prepared in tui4/agent-cards-xrpl PR #1884 |
| Sidecar | public/interop/gsr-xrpl-memo.json, gsr-xrpl-evidence.json |
| **STOPPED** | Requires owner approval for on-chain transaction |
| State | **NOT_YET** |

---

## Index Commitment (Stablecoin)

| Item | Value |
|------|-------|
| Commitment card | 7d5ee0d4612ea286f52258847fa77d6ae5dcc776d5328d1da4854968a77c3397 |
| Commitment URL | https://councilof.ai/cards/7d5ee0d4612ea286.json |
| Index SHA-256 | 30a83f220d2e5de7cd56efdc97dad462fbae288743710063c7e9eef1014acb38 |
| Merkle root | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| Root SHA-256 | 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6 |
| Signature | ED25519_VERIFIED_BY_PUBLIC_ROOT_PIPELINE |
| Rekor | log_index 2791822965, WITNESSED |
| OTS | STAMPED_PENDING_BITCOIN |
| State | **SIGNED_ROOT_INCLUDED** |

---

## Witness Artifacts

| Artifact | File | State |
|----------|------|-------|
| Root witness | public/interop/root-witness-latest.json | Present |
| Rekor sidecar | public/interop/rekor-root-62a1931b.json | Present |
| OTS file | public/interop/root-62a1931b.json.ots | Present (770 bytes) |
| EAS placeholder | public/interop/gsr-eas-attestation.json | Placeholder only |
| ETH anchor placeholder | public/interop/gsr-eth-anchor.json | Placeholder only |
| OTS placeholder | public/interop/gsr-ots-pending.json | Placeholder only |
| XRPL memo | public/interop/gsr-xrpl-memo.json | Present |
| XRPL evidence | public/interop/gsr-xrpl-evidence.json | Present |
| Transparency anchors | public/interop/transparency-anchors.json | Present |

---

## Root History

| Item | Value |
|------|-------|
| Total roots | 29 |
| First | 2026-08-31T07:38:20Z |
| Last | 2026-09-06T23:49:21Z |
| Source | public/receipts/root-history.json |
| Method | Every distinct public root from committed index, git history, and build |

---

## Cost Summary

| Transaction | Network | Expected Cost | Status |
|-------------|---------|---------------|--------|
| Card signing | Off-device (OIDC) | $0.00 | DONE |
| Merkle root | Computed | $0.00 | DONE |
| Rekor witness | Sigstore | $0.00 | DONE |
| OTS submission | OpenTimestamps | $0.00 | DONE |
| Bitcoin confirmation | Bitcoin | ~$1-5 (fee) | PENDING |
| Base EAS | Base L2 | ~$0.001-0.01 | NOT_YET |
| XRPL memo | XRPL | ~0.00001 XRP | NOT_YET |
| **Total spent** | | **$0.00** | |

---

## Key Rules

1. **Never collapse the 7 layers** into a single "anchored" status
2. **OTS PENDING ≠ Bitcoin timestamp** — submission evidence only
3. **Card signature ≠ chain inclusion** — PR #1888 cards are signed but not in chain
4. **Root inclusion ≠ external-chain anchor** — Merkle is internal
5. **Never place private keys** in source, artifacts, logs, or browser storage
