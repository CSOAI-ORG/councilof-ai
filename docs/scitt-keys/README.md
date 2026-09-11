# scitt-keys — proposed well-known content (STAGED, NOT PUBLISHED)

**Hand-off to TUI-1** (owner of `.well-known` plumbing) — 2026-09-11, TUI-4 lane.

## What to deploy

`scitt-keys.proposed.json` (this directory) is the proposed content for:

    https://csoai.org/.well-known/scitt-keys

Deploy it verbatim, at that exact path, with `Content-Type: application/json`, via
the normal PR path only — no side-channel publishes. Do not deploy it from this
branch; this is staged content awaiting the TUI-1 well-known lane.

## Why — the doctrine reversal, recorded explicitly

The estate **deliberately 404s** `/.well-known/scitt-keys` today, on the honest
ground that *we are not a Transparency Service*. That posture is now wrong in the
other direction: Nick's directive (2026-09-11) and the estate's own citation of the
IETF SCITT drafts (draft-csoai-scitt-measurement-card-00 carries a kid that
verifiers must be able to resolve) require the path to resolve.

The honest resolution is **discovery, not operation**: publish the keys we SIGN
with, while explicitly disclaiming TS operation. So the reversal is:

- **Before:** deliberate 404 — "we are not a TS, so there is nothing here."
- **After:** published key discovery — `"we_operate_a_ts": false`, JWKS-style key
  list, expiry/rotation policy, and a note stating the estate anchors to others'
  transparency services (Rekor, OpenTimestamps/Bitcoin, EAS on Base) rather than
  running one.

The **TS disclaimer is retained** — it moves from an absence (404) into the
document itself, where a reader can actually see it.

## Content summary

- `issuer`: `did:web:csoai.org`
- `we_operate_a_ts`: `false`
- `keys`: the four published Ed25519 OKP JWKs (x values match
  `public/.well-known/did.json` exactly), `kid` = full did:web id, `use: "sig"`.
- `expiry_policy`: valid until superseded; rotations announced append-only in
  did.json; superseded keys stay published for historical verification.
- `as_of`: `2026-09-11` — refresh on each key rotation.

## Invariants for whoever deploys it

1. The x values must stay byte-identical to did.json — drift between the two is a
   trust-root split and must fail review.
2. Never add a key here that is not in did.json.
3. Never remove the `we_operate_a_ts: false` field or the disclaimer note.
4. Register: measurement, never certification.
