# RFC 8785 (JCS) adoption — status (2026-08-28)

Roadmap #1 (canonicalization). Decision: v2 preimage `canon: "jcs-rfc8785"`; verifier
dispatches on the field; legacy = absent field; NEVER re-sign v1 cards.

**Cut-over gate (the decision's own): cross-language corpus agreement must hit 100%,
including the 0.0/-0.0 float cases, before any verifier dispatches on the field.**

Current state (honest):
- `harness/interop/canon-agreement-test.py` ships the gate (Python-JCS vs JS-JCS over the
  signed corpus + edge floats). FIRST RUN: **12.2% agreement (5/41)** — the gate is
  WORKING AS DESIGNED and correctly BLOCKS the cut-over.
- Root cause: hand-rolled JCS divergences in float/exponent formatting (e.g. `1e-07` vs
  `1e-7`, ES6 number semantics) and string escaping. Per the roadmap, the fix is the
  reference libraries — Python `rfc8785` (Trail of Bits, Apache-2.0), JS `canonicalize`
  (MIT) — NOT hand-rolled code.
- NEXT (queued): library-based re-run of the same gate → target 100% → then the
  dispatch (`canon` field) lands in verify_signed.py + action-verify-attestation +
  verify-card.mjs. Until then: no JCS dispatch, no re-signs, v1 preimage unchanged.
