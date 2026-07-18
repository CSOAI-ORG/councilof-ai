# MEOK — Grounded TODO (single source of truth)
**Date:** 2026-05-31 · Reconciles 3 agent reports (Topology / GitHub-Mac inventory / Character-Code inventory) against AUDITED numbers. Inflation stripped.

> Rule: numbers below are what I can stand behind. Where an agent report disagreed, the audited value wins and the inflated one is struck.

## Number corrections (use these, not the agent reports')
| Claim in reports | Grounded truth |
|---|---|
| 509 repos / 313 MCPs / 294 npm / 247 PyPI | **264 published to PyPI** (323 built). "509 repos" = repo count incl. forks/stubs, ≠ products. |
| 6,798 monthly downloads | **Unverified** — no source pulled. Treat as marketing until checked on PyPI stats. |
| 47 generals / 160 tests | SOV3 inner tools live = **110** on :3101. "47 generals" unverified. |
| consciousness 0.788 | **0.525** (live MCP get_consciousness_state; 0.788 is the stale postgres mirror). |
| 140 / "27 but some multi" characters | **27** aligned (postgres `characters` + db/characters.json). |
| "35+ pages 404 on meok.ai" | Plausible but UNVERIFIED by me this session — confirm before quoting. |

## The one-sentence truth (all 3 reports agree, once stripped)
**Capability is enormous; the gap to revenue is the user-facing surface** — and the single most-requested surface (a character that actually renders & talks) is the active build.

---

## NOW (this session — the character, verified by screenshot)
1. ✅ **3D VRM character renders** at `localhost:4173/avatar` — Aria, arms down, blinking, looking at camera, 27 in picker. Eyes-on verified. (commit c6c47a1)
2. ⏳ Polish standalone: fix greeting bubble overlapping face; real audio-stream TTS (SOV3 Kokoro) for true lip-sync; council/voice flow.
3. ⏳ Fix `meok/ui` Clerk error (blocks the REAL app) → port this VRM engine in beside hatch/chat/27-chars/voice.
4. ⏳ Track B: MEOK-brand the Amica fork + embed OpenCode TUI + Step-3.5 (A/B vs Track A).

## NEXT (revenue surface — Nick/other-agents lane, not this session unless asked)
5. Verify which meok.ai routes actually 404 (don't trust the list — crawl it). Fix /checkout → Stripe direct.
6. Build static product pages for the real 404s (/os /characters /work /guardian /gaming /birth).
7. Broken domains: confirm status, fix DNS/alias (proofof.ai, safetyof.ai). NOTE: fishkeeper/koikeeper already 301→aquaponics.app (done per memory) — agent reports calling them "DOWN" are stale.

## LATER (north-star, 6–9mo, £15–40K — the gaming zip)
8. Emergene 3D gaming: Godot 4.6 + Beehave (BT) + GOAP + local LLM. Maps onto existing left/right/council brains. Park until the consumer character ships.
9. Character Factory → game pipeline (FLUX→TRELLIS→Wan) needs RunPod A100. Real but capital/time-heavy.

## DON'T (de-prioritised / proven-wrong)
- Don't quote 509/313/6798/0.788/47 anywhere external. Use audited numbers.
- Don't add more agents/MCPs — throughput problem, not capability shortage (SOV3 is idling: 0 tasks recorded).
- Don't context-switch the character build into 35 website todos mid-flow.

## SOV3 real issue (from the deep-pull, grounded)
- Memory healthy (~9.7k episodes) but **80% self-generated insight noise** ("self_stimulation"/"curiosity"); only ~973 interactions. Task counters at **0** — orchestration not recording completed work. Fix = wire task-execution logging (Orion/coord exist), then prune the insight-noise tag class to relieve RAM. Separate workstream.
