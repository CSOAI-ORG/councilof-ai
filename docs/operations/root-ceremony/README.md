# Root Ceremony — ROOT-α / ROOT-β / genesis card #0

G4.1 of the TUI-4 "ROOTS & IDENTITY" V3 brief. This directory plus
`scripts/ceremony/` is everything Nick needs to run a 90-minute offline
ceremony that establishes the estate's root-of-trust tier:

- **ROOT-α** — offline root key. Seed from ≥100 physical d6 rolls, custody via
  Shamir 2-of-3 across three separate media/holders (holders named by ROLE on
  the public card, by name only on the paper custody record).
- **ROOT-β** — operational signing key, attested by ROOT-α inside **card #0**
  (`card0-genesis.template.json`, schema `csoai.root-genesis/0.1`).

Scope, stated where a reader hits it: this tier anchors and attests
operational keys only. **Measurement, never certification.** Measurement
cards under the public root (`scripts/publish_public_root.py`) remain the
only measured surface. Nothing here touches the board key
(`did:web:csoai.org#board-attestation-1`), which stays in GHA/Pages.

## Files

| Path | Role |
|---|---|
| `scripts/ceremony/entropy_from_dice.py` | d6 rolls → 32-byte seed. Fixed fail-closed floor of 100 rolls; the CLI cannot weaken it. Never prints the seed. |
| `scripts/ceremony/shamir_2of3.py` | Shamir 2-of-3 over GF(2^8)/0x11B. `split` / `combine` / `selftest`. Share files carry `secret_sha256`; combine fails closed on mismatch. |
| `scripts/ceremony/ed25519_from_seed.py` | seed → Ed25519 (RFC 8032). `derive` / `sign-file` / `verify`. Prints pubkey hex + RFC 7638 thumbprint only. |
| `scripts/ceremony/ceremony_selftest.py` | End-to-end dry run on SIMULATED material. Must pass 3× before the real run. |
| `scripts/ceremony/genesis_card.py` | Requires the independent Shamir record, fills, signs, verifies, and atomically creates card #0. No manual signature paste. |
| `scripts/ceremony/verify_offline_bundle.py` | Fails closed unless the exact pinned wheelhouse and installed dependency versions match. |
| `card0-genesis.template.json` | Genesis card #0 template. Null placeholders; self-signed by ROOT-α over the canonical card minus `sig_ed25519`. |
| `requirements-macos-arm64-py39.lock` + `wheelhouse-macos-arm64-py39.SHA256` | Exact dependency versions and wheel hashes for the designated macOS arm64/Python 3.9 ceremony host. |
| `ROOT-CEREMONY-CHECKLIST-2026-09-12.md` | The 90-minute runbook: phases, abort conditions, NEVER list, verification gates. |

Canonical payload rule (the estate canon, identical to
`scripts/publish_public_root.py::canonical_bytes`): UTF-8 JSON, sorted keys,
separators `(',',':')`, `ensure_ascii=False`. Card #0's preimage is the card
with `sig_ed25519` **removed entirely**, not null.

## Honest limits

- **The native Shamir implementation is fresh and unaudited.** Its selftest is
  necessary but insufficient. A separately sourced implementation must
  reconstruct the same share pair, and `shamir_2of3.py crosscheck` must emit a
  matching PASS record. `genesis_card.py` refuses to finalize card #0 without
  that record. This is a mandatory gate, not a recommendation.
- **The ceremony's security rests on Nick's physical/airgap procedure, not
  on these scripts.** The scripts can only fail closed and keep secrets off
  stdout. Dice fairness, room privacy, media custody, and secure erase are
  human and physical.
- The fixed floor of 100 fair d6 rolls carries about 258.50 input bits before
  SHA-256 produces the 256-bit seed. The production CLI has no lower-floor or
  weak-output option.
- The roll transcript and physical roll sheet are **seed-equivalent secrets**.
  They are never custody records and must be destroyed after the independent
  cross-check. Retaining either defeats the intended 2-of-3 custody boundary.
- APFS, SSDs, and flash media cannot promise per-file secure erasure because of
  copy-on-write and wear levelling. Secret files must never touch the internal
  disk. Use the approved disposable encrypted ceremony medium and physically
  destroy it after handoff, or an approved RAM-backed environment with swap
  disabled and a full power-off afterward.
- Byte-wise Shamir shares are information-theoretically silent individually,
  but the scheme is malleable if k−1 colluding shares are tampered with and
  the digest check is skipped — `combine` never skips it.
- Card #0 proves only that the holder of ROOT-α signed those bytes at
  `created_at`. It is not a certificate, not an audit, not an endorsement.

## Verify-before-trust checklist (short form)

1. Install the exact wheelhouse with the committed hash lock; run
   `verify_offline_bundle.py` — VERIFIED.
2. `python3 scripts/ceremony/shamir_2of3.py selftest` and
   `python3 scripts/ceremony/ceremony_selftest.py` — each 3× PASS offline.
3. **Mandatory:** independent Shamir implementation reconstructs from a share
   pair; `shamir_2of3.py crosscheck` writes a PASS record bound to its binary
   hash and the same `secret_sha256`.
4. `genesis_card.py finalize` accepts that PASS record and atomically emits the
   signed card; `genesis_card.py verify` validates it from the embedded pubkey
   alone.
