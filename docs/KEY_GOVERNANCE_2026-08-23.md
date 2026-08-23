# KEY GOVERNANCE — signing-key rotation & transparency policy

**Doc ID:** `csoai-key-governance-v1` · **Revision:** 2026-08-23
**Status:** binding estate note (extends KEY-CONTINUITY.md). Doctrine: the signing key never
travels; the public key is published; rotation appends a `superseded-by` pointer, never erases.

---

## 1. The two signing identities (as published)

| Identity | Public key (hex) | Where used |
|---|---|---|
| Estate chain key (`city_ed25519`) | `33472e02…` (as in KEY-CONTINUITY.md) | Fleet board chains, measurement cards, release proofs |
| Site/release key (`CSOAI_ED25519_SK`) | `03g9l+dV…` | Site deploys, release cards, /verify artifacts |

**Published in:** `did:web:csoai.org` (`#site-release-1`, `#estate-chain-1`,
`#board-attestation-1`, `#card-attestation-1`) and KEY-CONTINUITY.md.

## 2. Known discrepancy (recorded, honest — not hidden)

This session found the **pod** `city_ed25519` currently derives public key `8f9a00a2…`
(`j5oAooz8…`), which matches **neither** the published estate-chain identity (`33472e02…`) **nor**
any key in the live did:web document. Evidence: the key file mtime (2026-08-20) is *after* the
Aug-16 fleet chain that used the published identity. Most likely: an unrecorded key rotation.

**Policy for this state (holds until the owner reconciles):**
- Artifacts signed by the pod key are labeled with the pod key's TRUE pubkey (never dressed as the
  estate-chain identity). Verification is still sound — it verifies against the recorded pubkey.
- The published identity must NOT be claimed for pod-signed artifacts until reconciled
  (add `superseded-by` pointer + republish).
- This document records it so no surface silently implies the wrong signer.

## 3. Rotation procedure (binding, when a key rotates)

1. **New key** generated on the signing node only (never a laptop/QUEUE host).
2. **Old pubkey stays published** with `superseded-by: <new-key-id>` — history is append-only,
   keys are never erased.
3. **did:web document updated** (add the new verification method; keep the old with `superseded-by`).
4. **KEY-CONTINUITY.md updated** (both pubkeys, their dates, superseded-by pointers).
5. **Verify the split**: any artifact signed by the new key must name the new key; artifacts signed
   by the old key keep verifying against the old (still-published) key.
6. **No HMAC-fallback** — a signature that cannot be verified is labeled unverified, never dressed
   as signed.

## 4. Transparency commitments (public)

- The public verify path is published: recompute canonical → content_id → Ed25519 against the
  published key. No trust in us required.
- Every signed artifact names its signing key (date + keyid).
- If a key is suspected compromised: rotate immediately, publish the rotation, and append a
  correction (never silently replace).

## 5. What this unlocks for the plan

- The Article 50 free passport + the signed per-axis leaderboard need a **verifiable, published
  signer identity** — this policy is the governance that makes a public trust story possible.
- Interop (move #3): standard tooling needs to resolve our key deterministically. Policy guarantees
  it: one published key, one rotation rule, no ambiguity.
