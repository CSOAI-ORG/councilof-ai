# cose-wrap test vectors

Test vectors for `scripts/cose_wrap.py` / `scripts/cose_verify.py` — the dual-issue
of a board measurement card as COSE_Sign1 (CBOR tag 18, RFC 9052 / RFC 9943 profile,
Ed25519 alg -19).

## The vector key is TEST-ONLY

`vector-1.expected.json` carries the vector private key (`vector_key.pkcs8_b64`) so
that CI can reproduce the vector byte-for-byte (Ed25519 is deterministic). This key
is **ephemeral/test-only**: it was generated once for these vectors on 2026-09-11,
it is **never a production identity**, it does not appear in
`public/.well-known/did.json`, and no estate artifact outside this directory is or
will ever be signed with it. Its recorded RFC 9679 thumbprint is:

    lOEsfKHAOyLTF6uFCGjq6FWNhP9BKTK44Kl22mYAR8w

x (base64url): `IIU8S325vfgCDQCrtvxqfmGKdG7z_m27eJWb46CcREE`

Committing a test private key next to its vectors is standard practice (RFC test
vectors do the same); the honesty mechanism is that this key can never present a
published identity, and `cose_wrap.py --test-key` marks every artifact
`"test_key": true, "pinned_to": null`.

## Files

- `vector-1.card.json` — a small realistic **synthetic** card (`subject:
  synthetic/example-model`, `status: UNMEASURED`, `sig_ed25519: null` — it was
  never board-signed, and says so in `unmeasured`).
- `vector-1.cose.hex` — the COSE_Sign1 wrap of the canonical bytes of the full card
  object, signed with the vector key, hex-encoded.
- `vector-1.expected.json` — expectations (see below) plus the test-only key.
- `vector-2-tampered.cose.hex` — `vector-1` with one **payload** byte flipped.

## Expected verdicts (three-state — never collapsed)

| vector | against the production pin set | with `--expected-kid` + `--expected-pubkey` |
|---|---|---|
| vector-1 | **UNCHECKABLE** (exit 2) — the vector key is not a published identity; self-consistent only | **VALID** (exit 0) |
| vector-2-tampered | **INVALID** (exit 1) — signature cannot verify over the tampered payload | **INVALID** (exit 1) |

Register: measurement, never certification. A verified COSE proves the key signed
these exact bytes — not that the payload's claims are true, and never a conformity
mark.
