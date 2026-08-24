# VERIFY-BADGE SPEC v0.1 — client-side verification badge (EXP 137)

**Doc ID:** `csoai-verify-badge-spec-v0.1` · **Revision:** 2026-08-24
**Purpose:** a shields.io-style badge **that verifies, never asserts**. The badge recomputes the
signature client-side (or via a keyless read of the signed artifact); it never hosts a score and
never phones home key material.

## The rule (binding)

- The badge renders **only** one of:
  - `verified` (recompute → content_id → Ed25519 verifies), or
  - `unverified` (any check fails or the artifact is missing).
- It **never** renders a score, a rank, or a "good/bad" verdict on the measurement's value.
- It **never** fetches a hosted score endpoint; it verifies the artifact the badge sits beside.

## The badge contract

```
GET <artifact>                          # the signed JSON (card / signal / leaderboard)
  -> recompute canonical body
  -> derive content_id (sha256)
  -> verify Ed25519 signature (embedded pubkey)
  -> render "verified" if match, "unverified" otherwise
```

## Reference implementation (client-side, no tracking)

1. Fetch the artifact JSON.
2. Recompute (sorted keys canonical form) → content_id.
3. `await crypto.subtle.verify("Ed25519", key, sig, contentIdBytes)`.
4. Render the badge: `✓ verified` (emerald) or `✗ unverified` (gray).

## Anti-abuse (binding)

- A badge-embedding page may NOT claim "CSOAI verified" for a score — only "the signature
  recomputes" — the wording is the contract, and the takedown path is documented.
- No telemetry: the badge sends nothing; it reads the artifact like any static file.

## Why this matters

Adoption → dependency by value: a site that embeds the badge can be confident the measurement
it points at is the signed one — and the badge verifies it, so there is nothing to trust from us.
