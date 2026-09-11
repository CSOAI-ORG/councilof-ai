# Rekor Witness Tier — product/spec

**Date:** 2026-09-11 · **Status:** proposed · **Register:** measurement, never certification.

## What exists today (and is already free)

`scripts/witness_public_root.py` submits the public-root envelope preimage +
board signature + board public key to Rekor (`rekord` kind, x509 format) at every
publish, and commits the returned entry as `public/interop/rekor-root-*.json`.
Duplicate submissions dedupe (409 → existing entry). No key material leaves the
publisher; Rekor entries are public.

`scripts/rekor_retrieve.py` (new, this lane) is the free read side: given a UUID,
a logIndex, or the latest committed entry file, it fetches the entry from
rekor.sigstore.dev, recomputes sha256 of the embedded preimage and signature, and
checks them against the committed artifact and the locally rebuilt
`public/root.json` preimage. Three-state verdict, always:

- **VALID** — entry retrievable and body hashes match the committed artifact.
- **INVALID** — retrievable but a hash/body mismatch.
- **UNCHECKABLE** — unreachable or no local reference. Never collapsed into
  pass/fail.

## The tier split

### Free tier (everything above, public forever)

- `public/root.json` itself.
- The committed Rekor entry files (`public/interop/rekor-root-*.json`).
- The witness sidecars (`root-witness-latest.json`, dated copies, pointer) with
  drift and conflict state.
- `scripts/rekor_retrieve.py` — anyone can re-run the read side without us.

### Paid tier — timestamped existence PROOFS, packaged

What is sold is **assembly and proof packaging, never the data**. Per root:

- Rekor UUID / logIndex / integratedTime for that exact root.
- A verification bundle: the committed entry file, the preimage bytes, the
  signature, the board public key, and the exact `rekor_retrieve.py` invocation
  that reproduces the three-state verdict — so the buyer's auditor can check the
  proof without trusting the packaging.
- A dated, signed summary tying the bundle to the root's merkle_root and as_of.

Explicitly:

- **Premium sells assembly/proof packaging, never the data.** Every byte in the
  bundle is already public; the product is that it is assembled, bound to one
  root, and reproducible. Data stays free.
- **No seat pricing.** A proof bundle is per-root, not per-reader; charging per
  seat would mean charging again for bytes the buyer already has.
- **Measurement, not certification.** The bundle proves the root's bytes existed
  at integratedTime in a public append-only log. It does not certify, endorse,
  or vouch for what the root says.

## The limit, stated where a buyer will read it

Rekor inclusion ≠ non-equivocation. An entry in the log proves these bytes were
submitted by integratedTime; it does not prove the log showed the same entry to
everyone. That property needs a checkpoint **consistency proof plus an independent
monitor**, which the estate does **not currently claim** — and
`rekor_retrieve.py` deliberately does not verify `signedEntryTimestamp` or
`inclusionProof` (doing so honestly requires Rekor's log key and a signed tree
head). If a paid bundle is ever marketed as stronger than "timestamped existence",
that sentence is the one that must change first, in the docs, before anywhere else.
