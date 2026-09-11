# draft-templeman-scitt-framing-space-01 — DRAFT NOTES (implementation report)

> **DRAFT NOTES for the -01 revision — this is not the draft itself.**
> Prepared 2026-09-11 from a working implementation (councilof-ai repo,
> `tui4/scitt-wrap` lane). IETF last-call / draft-status claims in this file must
> be verified by Nick before anything is posted to the list.

We implemented the -00 framing against the CSOAI estate's public-root cards:
`scripts/cose_wrap.py` (dual-issuer: canonical JSON card → COSE_Sign1, CBOR tag
18), `scripts/cose_verify.py` (client-side verifier, three-state verdicts), and
committed test vectors under `test/vectors/cose-wrap/`. This note is the "we
implemented -00; here's what breaks" report, grounded in what we actually built
and where we actually got burned.

## 1. The framing space is real: 64 serializations, one Sig_structure

The -00 finding — 64 distinct serializations of the same logical envelope, but
exactly one Sig_structure — is why the wrap **pins canonical payload bytes**:

- The COSE payload is the repo's one canonical form
  (`json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False)`),
  so the dual-issued card's bytes are fixed before they enter the envelope.
- The verifier must verify the **Sig_structure**, never a hash of the received
  envelope bytes. Two transports may deliver byte-different envelopes (tagged vs
  untagged, map-ordering variance in re-encoders, unprotected header as map vs
  serialised bstr) that decode to the *same* Sig_structure and the *same* valid
  signature. Verifying an envelope hash would call three of those six
  re-serializations forgeries.

Recommendation for -01: state explicitly that envelope-byte equality is **not**
a validity criterion; only Sig_structure reconstruction is.

## 2. kid: RFC 9679 thumbprint vs resolvable did-string

We carry the **RFC 9679 JWK thumbprint** of the signing key's public half as the
kid (per draft-csoai-scitt-measurement-card-00), and resolve
thumbprint → did:web identity via the published `did.json`. What implementation
taught us:

- **Stock verifiers must not require network.** Our verifier embeds the four
  published did:web:csoai.org identities and computes thumbprints locally;
  `--fetch-did` is an optional refresh with an explicit fallback notice. A
  verifier that must phone the issuer to check the issuer's signature verifies
  nothing — the network dependency converts "offline-verifiable" into
  "online-attributable", which is a different (weaker) product.
- A thumbprint kid survives DID-document rotation of *service* entries and URL
  moves; a resolvable did-string kid survives key *renumbering* but breaks on
  fragment renames. We accept legacy did-string kids on read for continuity but
  never mint them.
- Edge case we had to handle: kid present but resolvable to **no** published
  identity is a third verdict (UNCHECKABLE / self-consistent-only), not a failed
  verification. Collapsing "could not check" into INVALID manufactures forgery
  findings; collapsing it into VALID manufactures trust. -01 should make the
  three-state outcome explicit for unresolvable kids.

## 3. Tag 18 vs untagged arrays in the wild

We mint **tagged** COSE_Sign1 (CBOR tag 18). Our decoder also *accepts* bare
4-element arrays on read, because untagged arrays circulate (inside COSE_Sign
wrappers, in hand-rolled emitters, and in at least one estate incident artifact).
The asymmetry is deliberate: **mint strictly, read leniently** — but -01 should
warn that lenient readers must not re-export the untagged form as if it were
tagged, or the framing ambiguity propagates downstream with a valid signature
attached.

## 4. Deterministic encoding is a reproducibility requirement, not a style

Dual-issue (one card existing as canonical JSON **and** COSE) only stays
auditable if the same card + same key reproduces the envelope byte-for-byte:

- Ed25519 is deterministic, so the only variance source is the CBOR encoder.
- We build the protected header map with **integer keys ascending** (1 alg,
  3 content type, 4 kid) and depend on insertion-ordered emission.
- The determinism property is **tested** (build twice, byte-identical) because
  dual-issue that is not reproducible cannot be diffed against a committed
  artifact — and an undiffable artifact is where downgrade attacks live.

Recommendation for -01: profiles that claim reproducible artifacts should
mandate canonical CBOR (RFC 8949 §4.2.1) for the protected header, not merely
permit it.

## 5. Case study: the Sep-4 quarantine incident

On 2026-09-04 we quarantined an internal generator
(`scripts/badger/csoai-cose-wrap.py`) that produced **self-consistent-looking
envelopes that were not COSE_Sign1**: its Sig_structure omitted the RFC 9052
§4.4 `"Signature1"` context string, and it reused a card signature computed over
different bytes. Every envelope it minted "verified" against its own decoder —
the generator and checker shared the bug, so nothing independent ever caught it.

Two lessons -01 can cite:

1. **The context string is load-bearing.** Omitting it does not weaken the
   signature in an obvious way; it produces an object that parses, self-verifies,
   and silently fails every standards-conformant verifier. Interop failure with
   a valid-looking artifact is the worst failure mode for a trust format.
2. **Published test vectors are the fix.** We now ship committed vectors —
   untampered (valid against a pinned expected key), tampered by one payload
   byte (must be INVALID), and an expectation that an unpinned test key is
   UNCHECKABLE against the production identity set — verified in CI on every
   change to the lane. A format without public vectors leaves every implementer
   one shared-bug away from our incident.

## Pointers

- Implementation: `scripts/cose_wrap.py`, `scripts/cose_verify.py`,
  `scripts/cose_wrap_selftest.py`, `test/vectors/cose-wrap/` in the councilof-ai
  repository.
- Register, as everywhere in the estate: a verified envelope proves the key
  signed these exact bytes — **measurement, never certification**.
