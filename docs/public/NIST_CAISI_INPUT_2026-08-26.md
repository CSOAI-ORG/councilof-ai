# NIST CAISI / AI standards — measurement & reporting input (draft 2026-08-26)

**Route:** respond to NIST AI standard zero-drafts / listening sessions (ARC precedent:
benchmark provider to CAISI). Contribution-grade, one page.

1. **Verifiability primitive.** Two labs reporting "acc 0.7" are not comparable without:
   the exact frozen instrument (public), the interval (not the point estimate), the
   version/hash of the prompt set, and an attestation that the reported result is the
   measured one. Proposal: minimal signed-attestation card (SHA-256 content addressing
   + Ed25519, did:web identity, append-only corrections) as the reporting layer.
2. **Three-state vocabulary** (measured / unmeasured / refused) — UNMEASURED is
   first-class; absence of evidence is never read as evidence of failure.
3. **Anti-contamination/anti-gaming** as a reporting requirement: event core property
   (identical evidence cannot mint multiple verdicts) + supersession/correction history
   (the field's live-benchmark migration already converges here).
4. **Interoperability:** IETF SCITT (RFC 9942/9943) receipts + reference-implementation
   registration (our offline verifier: github.com/CSOAI-ORG/action-verify-attestation).

As offered by ARC to CAISI: we are available to host a listening session on AI
benchmarking, measurement, and reporting. (Measurement body; we certify nothing.)
