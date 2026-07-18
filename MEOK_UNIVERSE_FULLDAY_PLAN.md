# MEOK Universe — full-day "make the products actually WORK" plan (2026-07-01)

Goal: MEOK's products & tooling function end-to-end and demoably — **as good as DEFONEOS** —
not listed, but *working*. Every claim provable by a real request. Verified by an E2E suite,
not screenshots.

## The DEFONEOS bar (what "working" means)
DEFONEOS feels alive because its capabilities *do* things: agentic sovereign, live data,
entity search, real outputs. MEOK must match: the tools invoke, the bridges transform real
messages, governance actually signs & verifies, the universe reflects real state.

## Phases
**P1 — Governance that really signs (the moat, working).** `/api/sign` + `/api/verify` — real
Ed25519 (Node crypto, seed-stable sovereign key). Sign any governed action → signature +
public key; verify offline. Wire the Verify page to actually verify. ← *building now*

**P2 — Legacy bridges that really transform.** `/api/bridge` — validate/parse real messages:
IBAN (mod-97), ISO 20022 (pain/camt), HL7 v2 (MSH), ISO 8583 (MTI/bitmap), SWIFT MT. Wire the
Bridges app to paste-a-message → live validation. ← *building now*

**P3 — Tools that really run.** `/api/tool` router executes safe real tools (govern, framework
lookup, IBAN check, hash/sign, gematria) and returns real output; SOV Space "Run" calls it.

**P4 — MEOK Universe live.** Nodes carry real status; entity search across nodes/frameworks/
tools/industries; click a node → its governance profile. 3D world already free (earth3d).

**P5 — E2E product test suite.** `test/e2e-products.mjs` — functional assertions on every
endpoint (not just 200): govern returns right frameworks, bridge passes good / fails bad,
sign→verify round-trips + tamper fails, nodes shape, knowledge live. Run → report. ← *building now*

**P6 — Capability matrix vs DEFONEOS.** Gap table; close the gaps.

## Verification discipline
Everything provable with `curl`/`node` (works headless). WebGL visuals (earth3d) render for a
real viewer — the automation browser backgrounds the tab and throttles rAF, so those are
user-verified, everything else machine-verified.

Building P1 + P2 + P5 now.
