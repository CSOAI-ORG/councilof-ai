# 12-around-1 Council — Benchmark & Verdict (2026-06-01)

_By Claude (Opus 4.8). Empirical test of MEOK's BFT-of-MoEs council (`sovereign.py`) vs single
models. Method: one `sovereign_council` call returns BOTH the companion's solo **draft** and the
post-deliberation **final** — same model, same persona — so the delta is exactly what the
11-lens review + reconcile adds. Objective grading on checkable reasoning traps. 19 frontier
models verified live via OpenRouter (Opus 4.8, GPT-4o, Gemini 2.5 Pro, DeepSeek-V4/R1, Kimi
K2.6, GLM-4.5, Qwen-72B, Llama-4, Step)._

## Results (20 task-runs over 4 rounds)

| Round | Companion | Reconcile | Draft (solo) | Council | Fixed | Broke | Avg latency |
|---|---|---|---|---|---|---|---|
| 1 — easy traps | Opus 4.8 | code (default) | 5/5 | 5/5 | 0 | 0 | 30.2s |
| 2 — hard traps | Opus 4.8 | code | 5/5 | 5/5 | 0 | 0 | 27.8s |
| 3 — weak base | Gemini-lite | code | 4/5 | 4/5 | **0** | 0 | ~38s |
| 4 — weak base | Gemini-lite | **llm** | 4/5 | **5/5** | **1 (bat&ball)** | 0 | ~38s |

The council ran correctly throughout: 11 lenses returned reviews every time, with real PASS/REVISE
votes and the safety-veto path live (1 veto fired in round 3 widgets).

## What it means

1. **`code` reconcile (the current default) does NOT improve answer quality.** Across 15 runs it
   never changed a draft's correctness — it tallies PASS/REVISE/VETO but **keeps the companion's
   draft** unless a safety veto fires. Round 3 "widgets": weak draft wrong, 11 frontier lenses
   disagreed (pass=1, veto=1) — council still returned the wrong answer.
2. **`llm` reconcile DOES improve quality.** An orchestrator (Opus) reads the draft + all 11 lens
   critiques and **synthesizes** a corrected answer. Round 4 "bat&ball": weak draft wrong →
   council **fixed it**. This is the only mode where "12-around-1" actually helps.
3. **With a strong companion, the council neither helps nor hurts** — Opus 4.8 was already 10/10
   solo on these traps, so there was nothing to fix. The council's quality-lift matters for
   **weaker / cheaper base models**, not for an already-frontier one.
4. **Latency/cost:** council ≈ 22–65s and ~12× the model calls vs ≈ 3s for a single frontier.
5. **On the CPU VM with the default *local* (Ollama) lenses, the council is NOT viable** — it
   times out (>120s) or returns empty (deadline shorter than concurrent CPU inference). The
   benchmark above used fast *cloud* lenses to test the architecture fairly.
6. **SOV3 memory substrate (`:3101`) is OFFLINE.** It's wired (`memory.py`, `act.py`, `brain.py`,
   `lens_tools.py` call `record_memory`/`query_memories`) but nothing is running on `:3101`, so
   every memory call degrades gracefully ("unreachable; nothing fabricated"). The council
   deliberates **without** the persistent memory spine, and memory-using lenses run blind.

## Verdict (B5)

**Do not make the council the default brain** — it's 8–20× slower with **zero** correctness gain
in the shipped `code` mode. Keep frontier-single (`brain=right`) as the default for everyday chat.

**The council earns its 30s only when configured as:** `reconcile="llm"` (synthesis) + a **fast
cloud roster** + a **weaker/cheaper companion**. In that config it lifts a cheap base toward
frontier quality and keeps the safety veto — that's its real value (a quality+safety *amplifier*
for cheap models, plus the care membrane), not an upgrade to an already-strong model.

## Actionable changes
1. ✅ Switch the **/api/sovereign default to `reconcile="llm"`** (+ orchestrator Opus) — it's the
   only mode that improves answers. *(applied — see commit)*
2. ✅ Default the deep-think council to a **cloud roster** so it completes on the CPU VM.
3. ⏳ **Bring SOV3 `:3101` up** so the memory spine + memory-using lenses actually work
   (currently graceful-degraded). Needs the sovereign-temple server fixed on the VM.
4. ⏳ For real quality gains, expand the battery (harder, open-ended tasks + an LLM-judge) — the
   reasoning traps here only show error-correction, not nuance/quality lift.
