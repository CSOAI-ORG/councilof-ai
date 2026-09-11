# TUI 5 — Signing, Roots and Anchoring
**Generated:** 2026-09-11T14:30:00Z
**Basis:** master (b284d3cc)
**Branch:** trust/anchor-completion-20260911

---

## Trust Chain — 7 Layers (Never Collapsed)

### 1. Card Signature — ✅ VERIFIED

| Item | Value |
|------|-------|
| Algorithm | Ed25519 |
| Pubkey | d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38 |
| DID resolution | https://councilof.ai/.well-known/did.json → #card-attestation-1 |
| Chain positions | 335 |
| Published bodies | 313 |
| Withheld bodies | 22 |
| Verified valid | 335 |
| Verified invalid | 0 |
| Verifier | public/signed/verify-card.mjs |
| Verification instructions | public/signed/HOW-TO-VERIFY.md |
| Preimage rule | id == sha256(json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True)).hexdigest() |
| Chain head | 66856aca4a1f9390f0f51d89b8b96d984ab902852ed77b0254730758260ad1da |
| Genesis prev | GSPC-CARD-FACTORY-GENESIS |
| State | **VERIFIED** |

### 2. Merkle Root — ✅ VERIFIED

| Item | Value |
|------|-------|
| Root file | public/root.json |
| Card count | 167 |
| Merkle root | 78d4e019115d65d6ea7075587e3c14337bf0120928ae5cbe9b6b0a8e0e1e7bb5 |
| as_of | 2026-09-11T08:45:22Z |
| Schema | https://councilof.ai/schema/public-root-v1.json |
| Kind | csoai.public-root/v1 |
| Root file SHA-256 | 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6 |
| Root file bytes | 14,518 |
| Card SHA-256 entries | 167 |
| Verification | verify-card.mjs: VALID 1 · INVALID 0 |
| Verification instructions | public/signed/HOW-TO-VERIFY-ROOT.md |
| State | **VERIFIED** |

### 3. Rekor Witness — ✅ WITNESSED

| Item | Value |
|------|-------|
| Rekor instance | rekor.sigstore.dev |
| Log index | 2791822965 |
| Rekor root files | 21 (public/interop/rekor-root-*.json) |
| Root witness files | 23 (public/interop/root-witness-*.json) |
| Latest witness | root-witness-latest.json (as_of: 2026-09-11T08:45:26Z) |
| Artifact SHA-256 | 62a1931b4fdfd7351b3baa14354ccef068a9996592b199d2a862149a7dfaedc6 |
| State | **WITNESSED** |

### 4. OTS Submission — ⏳ STAMPED_PENDING_BITCOIN

| Item | Value |
|------|-------|
| OTS files | 22 (public/interop/*.ots) |
| Submission status | Submitted to OTS calendar |
| Bitcoin confirmation | NOT_YET |
| Note | OTS creates a commitment that will be included in a future Bitcoin block. Timeline depends on calendar server batching. |
| State | **STAMPED_PENDING_BITCOIN** |

### 5. Bitcoin Confirmation — ❌ NOT_YET

| Item | Value |
|------|-------|
| Status | Waiting for OTS calendar to anchor in a Bitcoin block |
| Expected | Once OTS calendar commits, the proof can be verified against Bitcoin block headers |
| State | **NOT_YET** |

### 6. Base EAS Attestation — ❌ INCOMPLETE

| Item | Value |
|------|-------|
| Network | Base mainnet (eip155:8453) |
| Attestation schema | Prepared (public/interop/eas-base-root-2026-09/) |
| Root attestations | Prepared (public/interop/eas-root-attestations.json) |
| Required action | Owner wallet signature (gas cost ~$0.01-0.05 USDC) |
| State | **INCOMPLETE** |

### 7. XRPL Memo Anchor — ❌ INCOMPLETE

| Item | Value |
|------|-------|
| Network | XRPL mainnet |
| Instruments | 17 cards prepared (public/interop/cards/xrpl/) |
| Devnet dry-run | Prepared |
| Required action | Owner wallet signature (transaction cost 0.00001 XRP) |
| State | **INCOMPLETE** |

## Anchor Preparation Files

| Artifact | Location | State |
|----------|----------|-------|
| EAS base root | public/interop/eas-base-root-2026-09/ | PREPARED |
| EAS root attestations | public/interop/eas-root-attestations.json | PREPARED |
| XRPL asset cards | public/interop/cards/xrpl/ (17 files) | PREPARED |
| XRPL attestation run | public/interop/xrpl-attest-run.json | PREPARED |
| Transparency anchors | public/interop/transparency-anchors.json | ATTEMPTED |
| Layer0 ceremony | public/interop/layer0-ceremony-2026-09-03.json | PREPARED |

## Signing Ceremony Infrastructure

| Component | Location | State |
|-----------|----------|-------|
| Card verification | public/signed/verify-card.mjs | LIVE |
| Root verification | public/signed/HOW-TO-VERIFY-ROOT.md | LIVE |
| DID document | https://councilof.ai/.well-known/did.json | LIVE |
| Board key | did:web:csoai.org#board-attestation-1 | CONFIGURED |
| MPC custody | 3-party (Coinbase cb-mpc, Ed25519 additive) | CONFIGURED |
| OIDC board-sign | GitHub Actions OIDC | CONFIGURED |
| Off-device signing | Oracle tenancy | CONFIGURED |

## Transparency Anchor Attempts

| Subject | Status | Note |
|---------|--------|------|
| board_living.json | UNANCHORED-ATTEMPTED | Rekor API returned 400 (schema drift 2026-08-28) |
| Public root | WITNESSED | Rekor log index 2791822965 |

## What This Does NOT Claim

1. **NOT "Bitcoin-anchored"** — OTS submitted, NOT confirmed
2. **NOT "Base EAS attested"** — Prepared, NOT submitted
3. **NOT "XRPL anchored"** — Cards prepared, NOT anchored on mainnet
4. **NOT "Rekor certified"** — Rekor witnesses existence/time, not correctness
5. **NOT "all layers complete"** — 3/7 complete, 2 pending, 2 incomplete

## Remaining Blockers

1. **Base EAS**: Requires owner wallet signature (gas ~$0.01-0.05). Transaction data prepared.
2. **XRPL memo**: Requires owner wallet signature (0.00001 XRP). Devnet dry-run prepared.
3. **Bitcoin confirmation**: Depends on OTS calendar batching timeline. Cannot be accelerated.
4. **Rekor board_living.json**: API schema drift — needs Rekor v2 or self-hosted Trillian-Tessera.
5. **36 PR #1888 cards**: Need MPC ceremony to integrate into signed chain.
