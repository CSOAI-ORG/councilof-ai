# CANONICAL DECISIONS — collapsing the architecture drift
**2026-06-16. One authoritative answer per ambiguity the inventory surfaced. Supersedes scattered claims.**

## The engine
- **Canonical engine:** `~/clawd/meok-one/meok_one/` (live `:3200`). THE brain. One engine, 29 `stack.yml` configs = 29 Queens.
- **App repo:** `meok-ai` (the product). **Engine repo:** `meok-one`.
- King→Queen: the single canonical pair is `meok-one/hive_king.py` + `hive_queen.py`. The 6 dirs in `_deprecated_hive_dupes/` are archived — do not revive.

## BFT / consensus — TWO implementations, one canonical
- **CANONICAL (live, wired):** `meok-one/sovereign.py::sovereign_council` — 1 companion + 11 lens reviewers, safety=veto / quality=vote, reconciled. This runs in production.
- **CHALLENGER (built, NOT wired):** `~/openmoe-bft/` — ShadowArena tournament + BFTLedger + DebateRound (234 tests). A **reference/research library**, never imported by the engine. Do NOT cite it as "the canonical BFT." If its tournament is ever adopted, wire it explicitly into meok-one.
- **Duplicate killed:** `~/clawd/openmoe/openmoe_bft/` is a byte-identical snapshot of `~/openmoe-bft/`. Marked read-only (`NOTICE_SNAPSHOT.md`). Edit only `~/openmoe-bft/`.

## Self-improvement — canonical path (replaces "RLF till 100/100")
- **CANONICAL:** `meok-one/verifier.py` (added 2026-06-16) — external deterministic verifiers + verifier-gated best-of-N + `prove_improvement` (held-out delta). This is the *correct* loop per the research: improvement is measured by an **external** signal, not a self-judge, and stops when a **held-out** metric plateaus — NOT at a self-assigned "100/100".
- `olm_tournament.py` (ICRL A/B with BFT safety gate) is the reinforcement harness; it was INCONCLUSIVE because no episodes were fed — feed it verifier-scored episodes.
- **Drop the "BFT vote = Byzantine" framing for answer-selection** (correlated LLM errors → ~2–3 effective votes, not f<n/3). Reserve "BFT" for the orchestration / anti-prompt-injection layer (`horus_layer0.py`), where it's genuine.

## Council-node count — the real number
- **Runtime truth:** **12-node deliberation** (1 companion + 11 lenses). `quorum` default 3 for cheap calls, 12 for full council.
- "33" = a *synthetic* PBFT-MoE audit layer in `bft_lab.py::bft33` (rule-based, zero model calls). "36" = the server's advertised aggregate on `:3200`. "33×33×33" = nominal/aspirational, maps to nothing runnable. **Use "12-lens council" as the canonical description.**

## Stack layers — declared vs honoured
- `stack.yml` declares **7 layers (L1–L7)**; the engine's `load_hive()` honours **3**: L5 `tools:`, L6 `scope`/`character`, `tier`.
- **L1 drift / L2 history / L3 knowledge-graph / L4 agent-memory / L7 presentation are written but inert.** Either wire them or stop shipping them as if live. (The L4/L5 tool gap is now partially closed — `hive_queen._ground_with_tool` actually calls tools via the gateway as of 2026-06-16.)

## Brand triplets — canonical mapping (site / hive / test are the SAME brand)
Treat each brand as ONE entity with three surfaces: `<brand>` (site, e.g. `councilof-ai`), `<brand>-hive` (the queen config), and any `test-<brand>` (scratch — archive). Known triplets to dedupe in naming: proofof (proofof-ai / proofofai / proofof-hive), councilof (councilof-ai / councilof-hive), fishkeeper (fishkeeper-ai / fishkeeper-hive / test-fishkeeper), koikeeper (koikeeper / koikeeper-ai / koikeeper-hive). Fix the `socialmediamananger-hive` typo at next rename.

## Parked (not Level-0)
Nemesis (Mamba-3 SSM+MoE, 33-agent BFT), Quantum Mirror/Brain — 3–5yr north-star. SSM/Mamba *loses* on citation/recall (the core compliance task); revisit only as a serving-cost lever at >100K context.
