# MEOK ONE — the Thought Layer (SIGIL + Thought bus)

**This is a connector doc, not a new architecture.** MEOK ONE already exists:
`MEOK_ONEOS_MASTER_STRATEGY.md` (CLAW / BRIDGE / EI3), `meok-oneos/`, and
`bridge/unified_bridge.py` (the multi-provider nervous system on :3114). This doc
slots SIGIL + the Thought bus in as **the missing primitive underneath all of it**,
and maps the real old↔new sync gaps that still need bridging.

---

## 1. Where SIGIL fits in the existing MEOK ONE stack

```
MEOK ONE | CLAW   (control surface — the meokclaw TUI)        ← renders thoughts (text/visual)
MEOK ONE | BRIDGE (nervous system — bridge/unified_bridge.py) ← routes thoughts between providers/agents
MEOK ONE | EI3    (emotional intelligence — care substrate)   ← scores thoughts (care dims)
        └────────────────── all three move the SAME object ──────────────────┘
                         ▼
        ┌───────────────────────────────────────────────┐
        │  THE THOUGHT LAYER  (meok-sigil — NEW, built)   │
        │  one canonical Thought → projects into:          │
        │    sigil (lossless spine) · text · latent (NN)   │
        │    · visual (mermaid) · audit (signed digest)    │
        └───────────────────────────────────────────────┘
```

The insight: CLAW, BRIDGE and EI3 currently each pass around **their own shape** of
a message (JSON blobs, prompt strings, vectors). The Thought layer gives them **one
canonical object** to move, so a council vote is the *same thing* whether it's shown
in the TUI, routed through the bridge, scored by EI3, or signed for an auditor.
"Think in all ways" = one Thought, five projections. **Built + tested today.**

---

## 2. The old↔new bridges that still need syncing (the CobolBridge instinct, applied inward)

You were right that your own stack has the same legacy/modern split CobolBridge
solves for COBOL. Here are the REAL ones, confirmed against live state today:

| # | Old | New | Drift (verified 2026-05-29) | Bridge |
|---|-----|-----|------------------------------|--------|
| **B1** | SOV3 Postgres `consciousness_state` mirror | live MCP `get_consciousness_state` | Postgres last-wrote weeks ago; **live = 0.788, 76 agents, 9256 episodes, 6 NNs** (just read). Postgres is stale. | One-way sync job: live MCP → Postgres (already half-built as `sov3_scheduler.py` consciousness sync). Treat **live MCP as source of truth**; Postgres = read replica only. |
| **B2** | `meok/db/characters.json` (file) | postgres `characters` table | Two character stores; prior count drift (140→27 corrected). | Designate Postgres canonical; regenerate JSON from it on change (don't hand-edit both). |
| **B3** | verbose JSON tool payloads | SIGIL thoughts | Agents pass full JSON. **Measured via `sov3_adapter --live` against the running MCP: raw `get_system_status` is 81% heavier than SIGIL (5.25×), all lossless.** | **Thought bus + sov3_adapter** — encode agent-to-agent messages as SIGIL, gloss() for humans, JSON only at tool boundaries. Adapter built ✅ (projection); native emission still ahead. |
| **B4** | per-MCP `api_key` param (legacy) | OAuth2.1 Bearer (MCP 2025 spec) | Verified in security pass: keys passed as tool params → logged. | Auth at transport, not param (security task, separate). |
| **B5** | HMAC attestations (symmetric) | Ed25519 (asymmetric, offline-verifiable) | Verified: `/verify` re-signs server-side → not truly third-party. | Task #43. The Thought bus's `audit` projection feeds straight into whichever signer wins. |
| **B6** | 12+ scattered "unified" attempts (`unified-saas`, `meok-oneos`, `bridge/`, `unified-portfolio-catalog`…) | **one** MEOK ONE | Multiple parallel unification starts — the real macro-drift. | Pick `meok-oneos/` as the canonical shell; everything else either folds in or is archived. **This is the actual "macro into one" decision — and it's yours, not mine to force.** |

---

## 3. What's BUILT and TESTED today (no deploy)

- `sigil/` — core language: encode/parse/gloss/digest, registry (emergent opcodes), 11/11 tests pass.
- `sigil/thought.py` — **Thought + ThoughtStream**: one canonical thought → sigil / text / latent / visual(mermaid) / audit-chain.
- `sigil/benchmark.py` — real tiktoken BPE: **1.37× / 27%** on synthetic council corpus.
- `sigil/sov3_live_capture.py` — **A-LIVE: real live SOV3 state → 1.45× / 31% fewer tokens** (verified against the running MCP).
- `sigil/emergent_demo.py` — agents mint new opcodes at runtime; language persists via JSON export.
- `sigil/cli.py` — `sigil gloss|parse|digest|manifest|bench` (the human translator on the CLI).
- `dist/meok_sigil-0.1.0` — wheel + sdist built, **publish-ready (not published)**.

## 4. The honest gap (what "native emit" really needs)

The benchmark proves the **channel** is cheaper and the bus is real. What's NOT done:
SOV3's agents currently **think in English/JSON** and SIGIL is applied as a projection.
**Native emission** — agents generating SIGIL as their primary inter-agent message —
is a real SOV3-side change: wire `bridge/unified_bridge.py` + the council MCP to
speak Thoughts natively. That's the next deepening, and it's not faked here.

## 5. The business line (why this isn't just internal plumbing)

Gibberlink/Droidspeak make agents fast but **opaque** — regulators reject that.
The Thought layer is fast **+ human-readable (gloss) + signed (audit)**. Pipe the
`audit` projection into Ed25519 (B5/#43) and MEOK ONE produces a **tamper-evident,
auditor-readable transcript of how a multi-agent system decided** — EU AI Act Art
12 (logs) + Art 14 (oversight), as a native byproduct of how agents talk. No
competitor pairs a fast agent protocol with a signed, readable record. That's the
moat, expressed as infrastructure.

---

## 6. Decisions that are yours (I won't force these)
1. **B6 — which shell is canonical?** `meok-oneos/` looks furthest along. Confirm, and I'll map everything else to fold in or archive.
2. **Publish `meok-sigil` to PyPI?** Build is ready. Per our own security finding, do it via **Trusted Publishing (OIDC)**, not a twine token — so this is a "set up the GitHub repo + OIDC" step, your call.
3. **`csoai.org/sigil` spec page?** SPEC.md is ready to become it — that's a Vercel deploy, your go.
4. **Native emission (deepen B)?** The real SOV3 integration — bigger, separate piece.
