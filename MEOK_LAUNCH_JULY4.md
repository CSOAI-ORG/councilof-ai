# MEOK — Mass Launch Plan → JULY 4 2026 (Independence Day + Nick's birthday 🎂)

**Today:** 2026-05-31 (last day of May). **Target:** 2026-07-04. **Runway: 34 days.**
**One-line goal:** MEOK ONE live, public, and genuinely great — the hero of the launch — with the
portfolio aligned behind it on the private GitHub living topology.

---

## 🎯 The honest scope call (read first)
34 days, one founder + 4 AIs, a 16GB M4. We **cannot** "mass launch" 18 products well at once —
that's how you get 18 half-things. **Launch = ONE hero done brilliantly + the rest aligned/credible behind it.**
- **HERO:** MEOK ONE (hatch → 3D character → talk → Tamagotchi life → marketplace). It showcases the
  whole stack (SOVEREIGN+MCP+SIGIL+EI3 behind it). This is what the world sees July 4.
- **SUPPORTING (must be credible, not perfect):** the topology aligned on GitHub, the spine working,
  revenue surfaces live (already are), portfolio pages not 404.
- **BACKSTAGE (keep running, don't relaunch):** the 264 MCPs, compliance suite, SOV3.

If you want a *different* hero (or truly all-at-once), say so — it reshapes the whole 34 days.

---

## The 5 weeks

### WEEK 1 (Jun 1–7) — CLEAN + ALIGN the foundation
Theme: stop the bleeding, get the house in order so the build is fast + safe.
- [ ] **Secrets → vault** (task #44): rotate the 12 flagged keys → 1Password. MANDATORY before anything else.
- [ ] **GCP Spot VM up** (~£20/mo): SOV3 + Ollama qwen3:0.6b off the M4 → no more crashes, always-on backend.
- [ ] **Topology restructure** (per MEOK_TOPOLOGY): spine/ products/ governance/ research/ — agents read one tree.
- [ ] **Coordination live**: Kimi/Gemini/DeepSeek each on own branch + identity (COORDINATION.md). Stop clobbering.
- [ ] **MEOK ONE Stage 1 — Tamagotchi life**: wire `meok/core/emotional_states.py` + `soul_vault.py` into the
      character so Aria's bond/mood/memory persist + grow. (Code exists — wire-in.) **← STARTING NOW.**

### WEEK 2 (Jun 8–14) — MEOK ONE comes ALIVE
- [ ] **Stage 2 — Voice e2e**: wire `meok/core/voice_pipeline.py` → hold a real spoken conversation with Aria.
- [ ] Evolution stages (egg→…→elder) visible; proactive lines; mood-driven 3D.
- [ ] **Port into meok/ui** (real Next app; Clerk fixed) — the 3D character lives with hatch/chat/27-chars.

### WEEK 3 (Jun 15–21) — MARKETPLACE + the money loop
- [ ] **Stage 3 — Visa-of-characters**: free hatch ✅ → buy pre-made → hatch CUSTOM (paid, resellable).
- [ ] Wire `loopfactory-marketplace/` → registry + Stripe. "Owned characters" shelf + resell.
- [ ] Pricing surfaces, checkout works end-to-end (no 404s).

### WEEK 4 (Jun 22–28) — INNER PRODUCTS + polish
- [ ] **Stage 6 — wire inner products** the character can actually USE (it KNOWS its tools):
      GUARDIAN, FAMILY, WORK (Orion/Riri/Hourman), MAP, SIGIL, DELBOY — surfaced via MCP through the character.
- [ ] Design pass: top-app quality, mobile-first, the "wow".
- [ ] **Deploy public**: frontend → Vercel, backend → GCP VM. Real URL, real users can hit it.

### WEEK 5 (Jun 29–Jul 4) — HARDEN + LAUNCH
- [ ] Full e2e test on the public URL. Load/abuse test. Fix the launch-blockers only.
- [ ] Launch assets: demo video of the hatch→talk→evolve flow, Show HN, Product Hunt, socials.
- [ ] **Jul 4: MASS LAUNCH.** 🎂🇺🇸

---

## The CLEANUP track (parallel, respects coordination rules)
Runs alongside, mostly Week 1, never blind `git add -A`:
1. Secrets → vault (✅ gitignored already; rotate + move).
2. Big files (6.6GB SOV3 weights, VRMs, CAD) → GCS bucket, referenced not stored.
3. Restructure into spine/products/governance/research.
4. Dedup: 140 plan docs → indexed; 5 duplicate care_validation_nn copies → 1; character defs → one registry.
5. Decide the 509 MCP repos: pull into spine/mcp/ or keep as referenced submodules.

## MEOK SYNC — the multi-agent backbone (Nick's launch+beyond vision)
> "when any TUI / agent / AI platform works within MEOK SYNC, we work with BFT SOV3 inner comms on
> large projects with multiple agents."
This is the dual-use payoff:
- **Build-time (now → launch):** the 4 AIs coordinate building MEOK ONE over SYNC (SIGIL-encoded,
  COUNCIL-gated). `meok/core/pbft_engine.py` (766L) + `pbft_moe_council.py` (443L) = the BFT SOV3 inner
  comms already exist — wire them into the bus so any TUI/agent plugs in and joins the council.
- **Product (post-launch):** the SAME bus runs the character's left/right/council brains, AND lets
  external TUIs/agents/AI platforms join a project's agent-council via BFT. = the moat + the platform play.
- Lives in `bridge/`, runs on the GCP VM. Spec: MEOK_BRIDGE_SPEC.md.

## Launch-day definition of done (MEOK ONE)
A stranger opens the public URL → hatches a free character (ceremony) → it renders in 3D, talks
(voice), remembers them, has a mood that evolves → they can buy/make more from the marketplace →
it works on mobile → checkout takes money. That's the launch.

## What I'm doing RIGHT NOW
Stage 1 — wiring `emotional_states` + `soul_vault` into the character (bond/mood/memory that persists).
One server, screenshot-verified, committed on claude/meok-one. Then up the weeks in order.
