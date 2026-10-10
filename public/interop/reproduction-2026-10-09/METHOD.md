# METHOD — how this package reproduces a GSPC measurement-card verification

**Measurement, never certification.** What follows is a reproduction recipe for one
narrow question: *does this card's signature verify under the published trust root, over
the bytes the publisher says it signed?* It is not a certification of the measurement,
the model, or the issuer.

## The chain (every step from public bytes)

1. **Fetch the live DID document** — `https://councilof.ai/.well-known/did.json`
   (`did:web:csoai.org`). Trust root, live: the document is fetched on every run, never
   cached here (its bytes are pinned *as observed* in EXPECTED-OUTPUTS.txt).
2. **Resolve the signing kid.** The card index rows carry `kid` (e.g. `card-attestation-1`).
   Resolution rule implemented: match a `verificationMethod` whose `id` ends `#<kid>`,
   or whose `publicKeyJwk.kid` equals `<kid>` or `csoai-<kid>` (the document publishes
   `jwk.kid` as `csoai-card-attestation-1` while the fragment is `card-attestation-1`).
   Kid unresolved = **UNCHECKABLE** (missing trust-root material is never INVALID).
3. **Rebuild the canonical preimage of `body`**:
   `json.dumps(body, sort_keys=True, separators=(',',':'), ensure_ascii=True).encode('utf-8')`.
   Each card states this rule verbatim in its own `preimage_rule` field; this verifier
   accepts only that exact rule and returns UNCHECKABLE (`unsupported-preimage-rule`)
   for anything else. `card.id == sha256(preimage)` hex. **A naive hash of the card file
   bytes does not match** — the difference is printed by every run as
   `naive-file-bytes-sha256` precisely so the mistake stays visible.
4. **Ed25519-verify the signature over the preimage bytes.** `base64url`-decode the JWK
   `x` to the 32-byte public key; cross-check it against `card.pubkey` (hex); verify the
   signature over the preimage **bytes**.

## Which bytes does the signature cover? (empirically determined, 2026-10-09)

The published `preimage_rule` pins the preimage construction but not the signed message
form. We measured all four candidates against two independent live cards
(`8b3d29176356…` and `66856aca4a1f…`, both under `card-attestation-1`):

| Candidate message | Result |
| --- | --- |
| canonical preimage bytes | **verifies (both cards)** |
| sha256 digest bytes | does not verify |
| sha256 digest hex (ASCII) | does not verify |
| raw card file bytes | does not verify |

So the signed message is the canonical preimage itself. This is exactly the ambiguity the
estate itself flags for the *board stamp*: `GET /api/cards` → `board.signature.sig_input`
says the stamp's own rule "is not a sufficient preimage rule: it does not say … whether
the signature is over the digest bytes, the digest hex or the raw canonical bytes, or how
non-ASCII is encoded", and `board.signature.verification_state` is **UNVERIFIABLE** with
the note "DO NOT TREAT THIS AS A VALID ATTESTATION". This package covers
`gspc.measurement-card` bodies, which carry a sufficient rule and do reproduce.

## Verdict semantics (exits 0 / 2 / 3, parallel to the claim-feed tracker)

| Verdict | Exit | Meaning |
| --- | --- | --- |
| VALID | 0 | id = sha256(preimage), `card.pubkey` = the DID key for the kid, and Ed25519 verifies over the preimage bytes |
| INVALID | 2 | a cryptographic check ran and failed (`id-mismatch`, `pubkey-mismatch`, `signature-mismatch`, `malformed-*`) |
| UNCHECKABLE | 3 | the check could not run: DID fetch failure, card fetch failure, kid unresolved, unsupported preimage rule, or self-test failure |

A fetch failure is **UNCHECKABLE, never INVALID** — "we could not fetch it" and "it does
not verify" are different facts and this package never conflates them.

## Self-test

Before touching any input, `verify.py` verifies RFC 8032 TEST 1 (empty message,
known seed/public/signature vectors) with its own in-file Ed25519 and rejects a tampered
message. Failure aborts the run as UNCHECKABLE (`self-test-failed`) — a broken verifier
must never emit a verdict about someone else's bytes.

## Fixture provenance

- `fixtures/valid-card.json` — a real card from the live card registry
  (`https://councilof.ai/signed/cards/8b3d29176356…json`), fetched 2026-10-09T04:05:46Z and
  committed byte-for-byte. The `/api/cards` index serves a 100-row window of the 336-card
  registry and lists no base-model cards; this card (measured model `qwen2.5:3b`) is
  reachable through the published `body.prev` chain from an indexed card. Choosing a
  base-model card keeps the fixture free of unpublished internal identifiers.
- `fixtures/tampered-card.json` — derived from the valid fixture by body.accuracy 0.0 -> 0.9 (single-character change in the raw card bytes).
  One field changed; everything else byte-identical. Expected: INVALID.
- `fixtures/unreachable-fetch.json` — a fetch spec (`csoai.fixture-fetch/0.1`) pointing at
  the RFC 6761 reserved `.invalid` TLD, which never resolves. Expected: UNCHECKABLE.

## Scope limits

- This reproduces **signature verification** of `gspc.measurement-card` bodies. It does
  not evaluate the measurement, and it is measurement, never certification.
- The board stamp and the `cross-border` card are out of scope: the first is marked
  UNVERIFIABLE by its own publisher, and the second states its signer "is not a
  verificationMethod of did:web:csoai.org". Both facts are printed by `GET /api/cards`.
- No timestamps, freshness policy, retry policy, or budget logic here — see the claim feed
  (`public/interop/claim-feed-2026-10-09/`), which also names those as out of scope.
