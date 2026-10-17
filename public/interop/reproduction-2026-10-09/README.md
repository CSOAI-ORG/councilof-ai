# GSPC card verification — reproduction package (2026-10-09)

Reproduce a **GSPC measurement-card** signature verification end-to-end from public
bytes: fetch the live `did:web:csoai.org` document, resolve the signing `kid`,
base64url-decode the JWK `x` to an Ed25519 key, rebuild the canonical preimage of the card
body, and verify the signature **over the preimage bytes**. Stdlib-only — the Ed25519
implementation lives in `verify.py` and self-tests against RFC 8032 TEST 1 on every run.

**Measurement, never certification.** A VALID verdict means: *these bytes verify under
this published key over this stated rule*. Nothing more.

## Quick start

```
python3 verify.py --card-url https://councilof.ai/signed/cards/8b3d291763561e3f66adf6a9941f2ade8adf7b2fd856f237241354d3b4e1aed7.json
python3 verify.py --fixture fixtures/valid-card.json
python3 verify.py --fixture fixtures/tampered-card.json
python3 verify.py --fixture fixtures/unreachable-fetch.json
```

Exits: **0** VALID · **2** INVALID (a check ran and failed) · **3** UNCHECKABLE (the check
could not run — fetch failure, kid unresolved, unsupported rule). A fetch failure is never
INVALID and never 0. UNCHECKABLE is a first-class answer.

## Fixtures

| Fixture | What it is | Expected |
| --- | --- | --- |
| `fixtures/valid-card.json` | real card from the live card registry (model `qwen2.5:3b`), committed byte-for-byte | VALID, exit 0 |
| `fixtures/tampered-card.json` | the same card with one field changed | INVALID, exit 2 |
| `fixtures/unreachable-fetch.json` | fetch spec on the RFC 6761 `.invalid` TLD (never resolves) | UNCHECKABLE, exit 3 |

All inputs are sha256-pinned in `EXPECTED-OUTPUTS.txt`, including the two live inputs
(DID document, card URL) as observed at run time. Real runs with verbatim output:
`RUN-LOG.txt`. Method, message-form measurements, verdict semantics and scope:
`METHOD.md`.

Trust root: `https://councilof.ai/.well-known/did.json` (`did:web:csoai.org`,
`#card-attestation-1`). Claims in this family supersede with dated provenance in
`public/interop/claim-feed-2026-10-09/`.
