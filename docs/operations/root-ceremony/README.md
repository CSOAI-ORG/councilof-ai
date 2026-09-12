# Root Ceremony — ROOT-α / ROOT-β / genesis card #0

G4.1 of the TUI-4 "ROOTS & IDENTITY" V3 brief. This directory plus
`scripts/ceremony/` is everything Nick needs to run a 90-minute offline
ceremony that establishes the estate's root-of-trust tier:

- **ROOT-α** — offline root key. Seed from ≥99 physical d6 rolls, custody via
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
| `scripts/ceremony/entropy_from_dice.py` | d6 rolls → 32-byte seed. Fail-closed below 99 rolls (`--allow-weak` for tests, labelled WEAK). Never prints the seed. |
| `scripts/ceremony/shamir_2of3.py` | Shamir 2-of-3 over GF(2^8)/0x11B. `split` / `combine` / `selftest`. Share files carry `secret_sha256`; combine fails closed on mismatch. |
| `scripts/ceremony/ed25519_from_seed.py` | seed → Ed25519 (RFC 8032). `derive` / `sign-file` / `verify`. Prints pubkey hex + RFC 7638 thumbprint only. |
| `scripts/ceremony/ceremony_selftest.py` | End-to-end dry run on SIMULATED material. Must pass 3× before the real run. |
| `card0-genesis.template.json` | Genesis card #0 template. Null placeholders; self-signed by ROOT-α over the canonical card minus `sig_ed25519`. |
| `ROOT-CEREMONY-CHECKLIST-2026-09-12.md` | The 90-minute runbook: phases, abort conditions, NEVER list, verification gates. |

Canonical payload rule (the estate canon, identical to
`scripts/publish_public_root.py::canonical_bytes`): UTF-8 JSON, sorted keys,
separators `(',',':')`, `ensure_ascii=False`. Card #0's preimage is the card
with `sig_ed25519` **removed entirely**, not null.

## Honest limits

- **The Shamir implementation is fresh, single-implementation, and
  unaudited.** Its selftest pins the GF(2^8) field to the FIPS-197 §4.2
  worked examples and proves reconstruction from all three pairs, corruption
  detection, and single-share silence — but one implementation's selftest is
  not an audit. The checklist requires the selftest to pass **3×** on the
  ceremony machine before the real run, and we recommend cross-checking
  reconstruction with an **independent** Shamir implementation (e.g. a
  second, separately-written GF(2^8) tool, fed the same share files and
  checked against `secret_sha256`) before trusting real keys to it.
- **The ceremony's security rests on Nick's physical/airgap procedure, not
  on these scripts.** The scripts can only fail closed and keep secrets off
  stdout. Dice fairness, room privacy, media custody, and secure erase are
  human and physical.
- The dice floor of 99 rolls carries 255.91 bits of entropy — honestly a
  hair under 256 (strict 256 needs 100 rolls). The scripts print the exact
  figure every run; the floor is policy, not a rounding-up.
- Byte-wise Shamir shares are information-theoretically silent individually,
  but the scheme is malleable if k−1 colluding shares are tampered with and
  the digest check is skipped — `combine` never skips it.
- Card #0 proves only that the holder of ROOT-α signed those bytes at
  `created_at`. It is not a certificate, not an audit, not an endorsement.

## Verify-before-trust checklist (short form)

1. `python3 scripts/ceremony/shamir_2of3.py selftest` — 3× PASS.
2. `uv run --with cryptography python3 scripts/ceremony/ceremony_selftest.py` — 3× exit 0.
3. (Recommended) Independent Shamir implementation reconstructs from the
   share files to the same `secret_sha256`.
4. After the real run: card #0 verifies from `root_alpha.pubkey_raw_hex`
   alone.
