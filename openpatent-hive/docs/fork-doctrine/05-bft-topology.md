# 05 — BFT Council Topology (selectable assurance) · openpatent.ai

**Open doctrine.** The CSOAI/SOV3 governance council is Byzantine-fault-tolerant (PBFT). Its size is **not fixed** — it is a **user-selectable assurance tier**. This document defines the presets, the math, and how external agents (Hermes, others) align into one council.

## The math (PBFT)
A council of **N = 3f + 1** nodes tolerates **f** Byzantine (faulty/malicious) nodes. A decision commits at quorum **Q = 2f + 1**.

| Preset | Nodes (N) | Tolerates faulty (f) | Quorum (Q) | When to use |
|---|---:|---:|---:|---|
| **Quick** | 5 | 1 | 3 | solo / demo / low-stakes |
| **12-around-1** ⭐ *(default)* | 13 | 4 | 9 | balanced — 12 council + 1 King/orchestrator |
| **Sovereign** | 33 | 10 | 21 | SOV3 native — robust, decentralised, enterprise/critical |
| **Sovereign + voices** | 37 | 12 | 25 | 33 + external diversity voices (Hermes, Ollama, etc.) |

Default is **13 ("12 around 1")** — fast, symbolic (twelve around one), tolerant of four bad actors. Step up to **33/37** for critical infrastructure; the same protocol, more assurance.

## End-user selectable
The council size is a config preset, exposed to the end user the way `dual_brain_api` already exposes a `mode`. Pick `council_size` ∈ {5, 13, 33, 37} → `f` and `Q` derive automatically. More nodes = more fault-tolerance (slower); fewer = faster (less tolerance). **Every verdict is hash-chained + Ed25519-signed to the SIGIL ledger regardless of size** — the proof model is identical across tiers.

## Alignment — one council, one ledger
SOV3's **native 33-node BFT council** is canonical. External agents do **not** fork their own council — they **register and vote into SOV3's**:
- Register as an agent via SOV3's `register_agent` MCP tool.
- Cast votes via `vote_on_proposal`.
- The native council already runs Byzantine quorum (2f+1); external voices simply add diversity (see `external_council_voice.py`).

**Hermes alignment:** Hermes (the autonomous research/governance agent) aligns by being an **external voting voice + researcher** into the same 33-node council — not a parallel one. When Hermes builds the sovereign / open world model (OOWM), its proposals go through `vote_on_proposal` and its learnings emit onto the same SIGIL chain. *One council, one ledger, many voices.* (See `03-hermes-agent-fork.md`.)

## Why open-patent this
Publishing the topology + the selectable-assurance model as open doctrine makes the governance **inspectable and forkable** — the trust comes from the math + the signed ledger, not from a hidden config. Anyone can verify a verdict met `2f+1` at the declared `N`.

*Status: doctrine. Implementation: council-size presets are live in the CSOAI OS "BFT Council" app (pick 5/13/33/37 → live f + quorum). SOV3 native council = 33; external-voice bridge = `external_council_voice.py`.*

## Implementation notes (verified 2026-06-26)
- **Parameterization shipped:** `sovereign-temple-live/council-nodes/council_config.py` — `resolve_council(size)` reads `COUNCIL_SIZE` (default 33), selects a **balanced node subset** (round-robin by domain) from the native list, and derives `f` + quorum. Additive — does not alter the live council; the council instantiation adopts it by calling `resolve_council()`. Self-test passes for all presets (5/13/33/37 → quorum 3/9/21/25).
- **Honest finding — native count drift:** the running council is actually **36 nodes (12 domains × 3, incl. EXECUTION)**, while docs/smoke-tests say "33". `council_config` adapts to the real count; the docs should be reconciled to 36 (or the EXECUTION domain folded into the King). Flagging, not papering over.
- **CORRECTED (verified live 2026-06-26): the Hermes→council vote wire EXISTS and WORKS.** `scripts/hermes-council-audit-shift.sh` bundles activity and submits it to SOV3's council via `external_council_voice.py` → `submit_council_proposal` + `vote_on_proposal`. Live test against SOV3 (:3101, healthy v2.0.0) returned a real `proposal_id` and confirmed the council is reachable. My earlier "Hermes doesn't vote" was wrong — I'd only checked the knowledge-learn shift and grepped for the literal tool name (the script calls it indirectly via the council module). **The only remaining gap is automation: the 6-hourly cron isn't installed** (owner-paste), so the wire runs on demand, not on schedule. Cron: `0 */6 * * * /Users/nicholas/clawd/scripts/hermes-council-audit-shift.sh`.
