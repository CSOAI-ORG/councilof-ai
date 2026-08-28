# RFC 8785 (JCS) adoption — status (2026-08-28, append-only)

Roadmap #1. Decision: v2 preimage `canon: "jcs-rfc8785"`; verifier dispatches on the
field; legacy = absent field; NEVER re-sign v1 cards.

**Cut-over gate: cross-language corpus agreement must hit 100% (incl. 0.0/-0.0 float
cases) before any dispatch.**

Runs (both shipped in-repo):
- `canon-agreement-test.py` (hand-rolled): 12.2%.
- `canon-agreement-lib-test.py` (Python `rfc8785.dumps` vs JS `canonicalize` ESM): 0/51 —
  divergence classes identified: charset/escape (`\uXXXX` vs raw UTF-8) and
  number-serialization (int-vs-float) — i.e. two conformant libraries disagree on the
  corpus, so the preimage test must PIN one library's bytes as canonical for new cards.
- **Cut-over stays OFF** (the gate is working as designed; no dispatch, no re-signs).
- NEXT (queued): first-diff field diagnosis + pinned canon-bytes decision.
