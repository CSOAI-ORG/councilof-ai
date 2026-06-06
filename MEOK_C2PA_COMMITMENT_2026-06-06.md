# MEOK Article-50 marking layer — commit to C2PA (multi-layer)

*2026-06-06. Decision doc closing the "#3 product" half of "do all 3". Source: compass_tiktok_verification_2026-06-06.md §1/§4 recs + Caveats; cross-checked against what we already ship (attestation engine, watermark-attest MCP).*

## Decision
**Commit to C2PA Content Credentials v2.2 as the machine-readable marking layer for MEOK's EU AI Act Article 50 product — but ship it as a MULTI-LAYER product, never a thin C2PA wrapper.** C2PA alone does **not** satisfy Article 50; the Commission's draft Code of Practice treats it as *an example* technical solution, not a mandate.

## The four layers (this is the product)
1. **C2PA manifest** (machine-readable provenance) — v2.2 (stable, May 2025; v2.3 is an active draft). Use the Rust-backed `c2pa` library for real signing, not a hand-rolled JSON.
2. **Imperceptible watermark** (survives metadata stripping) — license SynthID-style / Truepic, or build on Bria. This is the layer that matters because **C2PA metadata is routinely stripped by CDNs and social platforms** (a known C2PA limitation — see Caveats).
3. **Human-readable disclosure** (visible label / overlay) — the Article 50(4) "clearly and distinguishably" requirement for deepfakes / AI text published as fact.
4. **Audit log** (when was what marked) — Article 12 logging. **We already have this**: SOV3's `monitoring/audit_logger.py` hash-chain. Wire the marking events into it.

## Verified dates / framing (don't drift)
- **Article 50 transparency applies 2 Aug 2026** (new systems); **watermarking grace to 2 Dec 2026** for pre-existing generative systems (Digital Omnibus). NOT "November 2026."
- **SME penalty cap = "whichever is LOWER"** (Art 99(6)) — proportionate. Never quote the €15M headline to a micro-business.
- C2PA is a **Joint Development Foundation / Linux Foundation** project, **not formally ISO-ratified** (despite some marketing implying otherwise). Don't claim ISO.
- EU Code of Practice on AI-generated content: 2nd draft feedback closed 30 Mar 2026; **final expected ~early June 2026**. **TRIGGER: if the final names a watermarking standard other than C2PA, revisit this immediately.**

## Why this beats what we have now (honesty thread continues)
- Our attestations currently use **HMAC-SHA256 = internal tamper-evidence only**. For external/audit defensibility, C2PA's **X.509-based asymmetric signing** is what an auditor expects. This is the same honesty reframe already in the 24h queue (A2) — C2PA *is* the answer to "HMAC isn't externally verifiable."
- It converts the **£999 from a commoditised "watermarking kit"** (ProofSnap/Complyance sell that at $9-29/mo) **into a done-with-you Article-50 readiness package**: AI-content-flow inventory + C2PA marking implementation + signed attestation + disclosure playbook + audit-ready evidence folder. The marking *engine* is the moat; the *service* is the revenue.

## Build plan (real, staged — not today's blast)
1. **Spike (½ day):** `pip install c2pa-python`; sign a test image with a self-signed cert; verify it round-trips VALID through our existing `meok-attestation-verify`. Proves the engine.
2. **Engine (2-3 days):** a `c2pa_sign(asset) -> manifest` + `c2pa_verify(asset) -> report` module (mirror the `worm_guard.py` standalone+tested pattern), wired to emit a marking event into the SOV3 audit hash-chain.
3. **Validate before platform (Sukh-Sroay gate):** the report's one useful kernel — ship ONE £29/mo tool ("drop image → C2PA manifest + visible disclosure + audit entry"), get **10 EU AI-content agency LOIs or pre-pays** before building the full suite.
4. **Conformance:** enrol in the **C2PA Conformance Programme** when open — that's the auditor-verifiable evidence Art 50 is measured against, and a differentiator vs label-only competitors.

## Caveats to design around (don't ship naive)
- Metadata stripping by CDNs/social → **the watermark layer (2) is mandatory**, not optional.
- C2PA signer-identity assertions create **surveillance/location-exposure risks** (auto-embedded GPS/timestamps) for some users → make identity assertions opt-in, strip location by default.
- "Not legal advice" on every output; flag where counsel sign-off is needed.

## Ties to existing assets
- `worm_guard.py` pattern (standalone + self-test) = the template for the c2pa module.
- `meok-attestation-verify` (live) = the verifier to extend for C2PA.
- `watermark-attest` MCP (shipped 1.1.0 w/ C2PA per memory) = check what it already does before rebuilding.
- Article-50 mini-audit (`revenue/ARTICLE50_MINI_AUDIT_OFFER.md`) = the £350 diagnostic that qualifies buyers for the £4,950 done-with-you bundle this engine powers.
