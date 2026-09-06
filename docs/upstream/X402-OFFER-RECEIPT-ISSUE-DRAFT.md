# DRAFT ONLY — an issue for x402-foundation/x402. Not filed.

**Doctrine:** we do not push to other people's repositories, and we do not open issues on them
without an owner ruling. This file is text. Posting it is decision **OWNER-W2-1**; until that is
recorded, nothing here has been sent.

**If it is posted**, disclose it in the same message to anyone it touches — per
`disclose-filings-to-the-people-they-touch`. That means: the estate's own interop rows, and anyone
we have cited to (the Interop report rows 1–3).

**Where:** <https://github.com/x402-foundation/x402/issues> — the extension lives at
`specs/extensions/extension-offer-and-receipt.md`, currently
`69652a69798f0b08f95bef33318896e36e210f7e` (v0.6, 2026-02-04; commit 2026-07-23).

**Tone check before posting:** this is a report of an implementation and three concrete questions.
It is not a promotion, it makes no claim about anyone else's conformance, and it asks for nothing
except an answer. If any of that stops being true in editing, do not post it.

---

## Title

`offer-and-receipt: three questions from a JWS/EdDSA implementation (did:web authorization)`

## Body

We implemented the Offer & Receipt extension at
`69652a69798f0b08f95bef33318896e36e210f7e` as a resource server: signed offers on every 402,
signed receipts on every settled response, `format: "jws"`, `alg: "EdDSA"`, `kid` a `did:web` URL
resolved at `/.well-known/did.json` per §4.5.1.

The text was clear enough to implement against without guessing, which is worth saying — §3.1.1's
rule that `payload` is omitted for JWS, and §3.2.1's insistence that the EIP-712 schema is normative
though untransmitted, both removed ambiguities we would otherwise have had to invent answers to.
Three things we did have to make a judgement call on, in case they are worth pinning in the text.

**1. §5.3's empty-string rule and the JWS branch.** §5.3 says: "For the optional `transaction`
field, implementations MUST set unused fields to empty string `""`. This rule applies only to
EIP-712 signing…". We read the second sentence as governing, and for JWS we **omit** `transaction`
from the payload entirely rather than sign `"transaction": ""`. §4.3 has the parallel rule for
`validUntil` and `0`. Two readings are possible and they produce different signed bytes, so a
verifier written against one will reject the other's receipts. Would it be worth one sentence in
§3.1.1 saying that for `format: "jws"`, absent optional fields are absent from the payload rather
than present-and-empty?

**2. JCS and the header.** §10 requires JCS for JWS payloads. It does not say anything about the
protected header. We canonicalise the header with JCS too, which makes the signing input fully
determined by `{alg, kid}` and lets a verifier reproduce it byte-for-byte from the decoded header.
That is not required as written, and a verifier is not supposed to need it — but an implementation
that emits an unordered header makes header round-tripping impossible for anything that reconstructs
rather than echoes. Is the intent that verifiers always operate on the transmitted bytes?

**3. §4.5.1's last paragraph, in practice.** The paragraph asking implementations to preserve
temporally-immutable authorization evidence, so a receipt can be checked against the key set as it
stood at `issuedAt`, is the hardest part of the extension to satisfy and the easiest to skip. We
have not solved it: we verify against the current DID document and we say so. If there is appetite,
we would be glad to contribute a worked non-normative example of one way to do it (a signed
append-only key-set log with an inclusion proof referenced from the receipt), for discussion — not
as a proposed normative change.

For whatever it is worth as an interop data point: an independent verifier that reads only
`/.well-known/did.json` and the compact JWS is about sixty lines of Python, with no x402 library
and no contact with the issuing server. We think that property — a buyer can check a seller without
the seller's cooperation — is the extension's most valuable feature and is under-sold in §8.

Happy to supply test vectors (a fixed-seed keypair, a signed offer, a signed receipt, and a tampered
pair) if a conformance corpus would be useful.

---

## What this draft deliberately does NOT do

- It does not claim we are the first, the only, or the reference implementation.
- It does not name or grade any other implementation.
- It does not offer to push a PR to their repository.
- It does not ask them to link to us, list us, or validate us.
- It does not mention pricing, the board, or anything we sell.
