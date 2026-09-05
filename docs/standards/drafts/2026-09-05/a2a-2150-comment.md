# DRAFT — a comment we could post on a2aproject/A2A#2150 (owner decides; not posted)

Status: draft, 2026-09-05. Posting is owner-gated. It only adds something if we say what we
learned from running the card + root + witness chain, not a restatement of the proposal.

---

A short report from the issuer side, since the thread has now had three implementations touch
the same receipt shape (Ed25519 reference, ML-DSA-65, did:wba) and one correction each.

What we changed in the reference after this thread, all merged on `main` of
`CSOAI-ORG/a2a-signed-receipts`:

- `signature.alg` is normative. A verifier reads it before touching a key; an algorithm it does
  not implement is reported **UNCHECKABLE, naming the algorithm**, never INVALID. The earlier
  code went straight to Ed25519 and would have called a valid ML-DSA-65 receipt bad.
- `kid` is any DID URL; the method is the issuer's choice. `did:web` is the reference profile
  only because it needs no registry.
- Register text unchanged: a receipt is evidence of what was claimed and when — not a
  certification or endorsement. If this becomes an extension, that line should be the hardest
  part to change.

Three things from operating this at councilof.ai that the extension text should probably say
out loud, because we got each of them wrong once:

1. **The card and the outcome need different keys, and the card key needs a signing path in
   CI.** Our measurement cards are signed under `did:web:csoai.org#card-attestation-1`; our
   AgentCard is still unsigned because that key is deliberately not in a workflow. §8.4 leaves
   this to the operator; an extension that adds a trust-root convention should at least say
   that a `kid` resolvable via `/.well-known/did.json` implies the DID document is a
   publishing surface with the same change-control as the card.
2. **Signed bytes are never edited.** We broke a signature for five days by silently editing a
   signed JSON file. A receipt format that includes `content_id` catches this before the
   signature check — that is the field's real job, and the spec should say a receipt is
   superseded by a new receipt, never edited in place.
3. **Inclusion is cheap once receipts are content-addressed.** We publish a Merkle root over
   signed cards (`https://councilof.ai/root.json`) and a third-party witness of that root; a
   receipt's `content_id` slots into the same tree without any change to the receipt. If the
   extension wants "durable, portable evidence", an optional `inclusion` pointer (root URL +
   leaf index) is additive and lets a verifier check the receipt existed by a date without
   trusting the issuer's clock. We would rather propose that as a separate additive field than
   fold it into v1.

Nothing above is a conformance claim; the interceptor is a reference, not a product, and the
ML-DSA-65 profile is FIPS-204-standardised code, not a CMVP-validated module.

---

Disclose to those it touches when posting: @johnInarti and @chgaowei are named implicitly;
PR #3 on our repo is theirs and is still open.
