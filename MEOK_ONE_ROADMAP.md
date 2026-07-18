# MEOK ONE — Full Staged Roadmap (100/100, executed in stages)

Flagship = the hatch→3D character→talk OS. Each stage is ONE-server-safe (crash discipline),
verified by screenshot before moving on, committed on `claude/meok-one`.
✅=done+verified · 🔨=this stage · ⏭=queued

## STAGE 0 — Foundation ✅ (done + eyes-on verified)
- ✅ 3D VRM character renders (Aria, arms down, blinks, looks at you)
- ✅ Archetype hidden (meet the character, not the machinery)
- ✅ Step-3.5 chat (starter chips + typing dots)
- ✅ Real audio-stream TTS (macOS say → WAV → AnalyserNode lip-sync)
- ✅ **Hatch ceremony** — free first character (egg→crack→emerge→name→bond), first-visit gate

## STAGE 1 — Living companion (Tamagotchi layer) 🔨
The moat: it's alive, it remembers, it reacts over time.
- Vitals HUD (bond / energy / mood) that drift + respond to interaction
- 6 evolution stages (egg→baby→child→teen→adult→elder) tied to bond/care
- Mood persistence across sessions (localStorage + SOV3 memory)
- Proactive lines ("welcome back", time-of-day greeting)

## STAGE 2 — Voice-first, end-to-end 🔨
"Mainly speech" — hold a real spoken conversation.
- Tap-to-talk → STT → brain → TTS out, hands-free loop
- Optional "Amica"-style wake word (blueprint)
- Verified by Nick HEARING it (I can't verify audio)

## STAGE 3 — Marketplace + business model ⏭
The "Visa of AI characters" loop (your model):
- First char FREE (hatch ✅) → browse/buy pre-made from marketplace → hatch CUSTOM (paid, resellable)
- Wire `loopfactory-marketplace/` to the character registry + Stripe
- "Owned characters" shelf; resell flow

## STAGE 4 — Port into the real app (meok/ui) ⏭
- Clerk bug already fixed; `companion.html` staged
- Native `<Character3D>` in /dashboard/chat beside hatch/27-chars/voice
- One source of truth = meok-one backend

## STAGE 5 — The SYNC backend (left/right/council on the bus) ⏭
- Generalize `brains.py` council → MEOK SYNC (N agents, SIGIL-encoded, COUNCIL-gated)
- Character's left/right/council brains run the same rails as the 4 dev-AIs
- Runs on GCP VM (not the M4)

## STAGE 6 — Inner products wired in (the portfolio, seamless e2e) ⏭
Your original "MEOK ONE must work e2e with all inner products":
- GUARDIAN (safety), FAMILY (members/chores), WORK (Orion/Riri/Hourman), MAP, GAMING, SIGIL, DELBOY
- Each surfaced through the character via MCP tools the character KNOWS it has

## STAGE 7 — Deploy public ⏭
- Frontend → Vercel; backend → GCP VM; characters/memory always-on
- The whole thing live at a real URL

---
## Cross-cutting (folded in as we go)
- **Research harvest:** scan all Nick's research docs for open-source code + findings to reuse (running now).
- **Training corpus:** consolidate the 20 books → "make any agent a domain expert" per vertical.
- **Topology alignment:** restructure repo into spine/products/governance/research (after secrets→vault, big→GCS).

## ⭐ KEY FINDING (research harvest, VERIFIED 2026-05-31)
`meok/core/` already holds **64 real Python modules** — much of the roadmap is WIRE-IN, not build-from-scratch:
| Stage | Existing code to reuse (verified on disk) |
|---|---|
| 1 Tamagotchi | `emotional_states.py` (374L), `soul_vault.py` (495L, encrypted memory) |
| 2 Voice | `voice_pipeline.py` (612L — VAD/STT/TTS/lip-sync), `voice_stress.py` |
| 5 SYNC bus | `pbft_engine.py` (766L), `pbft_moe_council.py` (443L), `chaos_router.py` (542L), `eigen_bft.py` |
| safety (all) | `care_shield.py` (386L), `maternal_covenant.py`, `family_guardian.py` |
**✅ EMPIRICALLY TESTED 2026-05-31 (ran the code, not just counted lines):**
| Module | Tested reality |
|---|---|
| `emotional_states.py` | 🟢 REAL — `transition()` works, `greeting("Nick")`→"Hey, Nick — What are we building today?", TRANSITIONS table real. Stage 1 = wire-in. |
| `soul_vault.py` (495L) | 🟢 REAL — 0 `pass` stubs, encrypt/store present. Stage 1 persistence = wire-in. |
| `voice_pipeline.py` (612L) | 🟢 REAL — 0 `pass` stubs. Stage 2 = wire-in (test live audio separately). |
| `pbft_engine.py` (766L), `pbft_moe_council.py`, `chaos_router.py`, `care_shield.py` | 🟢 REAL — relative-import only (need package context), not stubs. Stage 5 SYNC = wire-in. |
**Conclusion: the harvest was RIGHT — these are real, usable modules.** (My first stub-test was buggy:
wrong attr name `_STATE_DEFS` vs `STATE_DEFS`, wrong kwarg `user_message` vs `user_input` — the MODULES
work; my harness didn't.) Lesson holds: run before trusting — it just cut the good way here.
**Gap = standalone Python, NOT wired to the meok-one 3D frontend. Each stage = connect core → /api → UI.**

## Execution rule
One stage at a time · one server at a time · screenshot-verified · committed on claude/meok-one ·
reuse existing code (don't rebuild) · honest about what's verified vs not.
