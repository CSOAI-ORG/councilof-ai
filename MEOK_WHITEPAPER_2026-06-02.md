# MEOK — the governed, immersive AI operating layer (working white paper, 2026-06-02)

_By Claude (Opus 4.8), synthesising Nick's vision + 3 research sweeps + what's already shipped.
Honest by construction: every claim is tagged **[live]**, **[scaffolded]**, **[designed]**, or
**[research]**. The fiction-spec problem is over — nothing here is dressed up._

---

## 1. Thesis
MEOK turns any computer into a **living, governed AI world**. Your AI character is always present
(a HUD over the OS), it **sees your screen and remembers** (perception→SIGIL→memory), it works
across every AI platform and tool, and — the differentiator — **every agent lives under a
Partnership Charter + care bond, with a hash-chained audit trail.** The simulated-town experiments
proved ungoverned agents descend into chaos; MEOK is the governed cure, made consumer-delightful.

---

## 2. The form factor: gamification of the OS  **[live: /hud · designed: native overlay]**
A WoW-style HUD that wraps Windows/macOS: **minimap** (top-left, your agents/characters as live
blips), **character + chat + TUI** (right rail), **action bar** (bottom-center, hotkeys 1–7).
- **[live]** `/hud` web skin — 27 character blips, click-to-focus, gated chat in each character's
  voice, 👁 perceive button. Transparent body = overlay-ready.
- **[live]** `meok-desktop` Tauri shell is a transparent, always-on-top, game-detecting FAB (~80%
  of the overlay).
- **[designed]** the last 20%: load `/hud` into that window + **click-through** (`set_ignore_cursor_events`)
  + screen-recording entitlement → the real overlay floating over your desktop/app/game.
- **Web → app** is a packaging step (Tauri shells exist), not a rewrite; iOS/Android via Tauri-mobile.

## 3. The DOME: a real-world, governed agent world  **[live, world-class roadmap]**
- **[live]** MapLibre real-world map; characters as living agents (drift, emotes, speech bubbles),
  archetype-tinted, your creations gold-ringed; "fly to my region" (timezone, never GPS); a live
  **Governance HUD** (per-agent gate verdict, 12-around-1 tally, tool-tier, care_score).
- **World-class next [designed]:** zoom-to-street 3D (the openclawworld feel on real geography),
  live presence for agents/robots/digital-twin, region detail, multiplayer.
- **Edge vs the fictional towns:** ours is *real-world* AND *governed* — two moats they don't have.

## 4. Perception → memory: the AI sees + remembers  **[live on the VM]**
- **[live]** `/api/perceive`: a frame description → SIGIL `F`(frame)/`D`(detect) → **recorded into
  SOV3 memory** (`remembered:True` on the VM) → logged as a salience training-pair. The 👁 HUD
  button drives it (browser-consent each capture — privacy-clear).
- **[designed]** swap the placeholder scene for **step3.7 Flash** vision (Apache-2.0, image+video,
  400 tok/s) when its key lands → rich "what's on your screen" understanding, gated by the Sovereign.
- **[research→experiment]** a **salience net**: learn *what's worth remembering* from the perception
  stream (the `perception_pairs.jsonl` we're now collecting is its dataset). SOV3 has the retrain infra.

## 5. The intelligence: 12-around-1 + right/left brain + **predictive UX**  **[live council · research-backed plan]**
- **[live]** SOV3 = 12-around-1 BFT-of-MoEs (11 lenses + companion + orchestrator), safety vetoes,
  care floor. Right/left brain = cloud (fast) + local (private, `meok-sov3` on the VM Ollama).
- **[research, recommended BUILD]** the "small-forecasts → large-pre-computes" loop Nick described
  is real and shippable:
  - **PredGen** (arXiv 2506.15556): a small model predicts the user's utterance *as they speak/type*;
    the large model pre-computes in the pauses → **~2× perceived-latency cut**.
  - **SpeQL** (arXiv 2503.00714): pre-compute as-you-type → up to **289× perceived** speedup.
  - **EAGLE-3 speculative decoding**: lossless **2.3–2.8×** on the local batch-1 voice path.
  - **MEOK architecture:** the small model is a *router/pre-warmer* (predict intent + which 1–3
    council members/tools), not the answerer; full 12-way only on the committed input; EAGLE-3 under
    the large model. **Skeptic's caveat (honest):** these win *perceived* latency by spending idle
    GPU; the gains vanish under heavy batching — right for one user on a local box, not a saturated backend.

## 6. SIGIL: wrap everything  **[live protocol · honest limits]**
- **[live]** SIGIL = compact pipe-delimited opcodes (P/V/M/Q/C/H/S/A + multimodal F/D), gloss to
  English, **hash-chained audit** (EU AI Act Art 12). Benchmark (real tiktoken): **−35% vs JSON,
  −31% vs English overall**, lossless round-trip, 4,480 ops/s. Every saved token saved on every hop.
- **[designed]** SIGIL as the **universal wrapper**: any MCP/API/legacy call (incl. COBOL/Windows via
  `cobolbridge`) described in SIGIL → faster, auditable agent comms. It's a *semantic* layer, not a
  pixel/byte codec — it compresses *meaning*, not media.
- **[research, IMPORTANT verdict] "train a fresh model purely on SIGIL, no English" → DON'T (yet).**
  The closest real attempts walked it back: Meta's LCM→**SONAR-LLM** re-added token grounding;
  neurally-compressed-text is *unlearnable* at high density (arXiv 2404.03626); emergent agent
  languages are *anti-efficient* by default (arXiv 1905.12561); and you'd throw away the trillion-token
  English/world prior + lose CoT monitorability (a care-governance dealbreaker). **Density buys
  latency, not intelligence.** SAFE path: SIGIL as a **grammar (constrained decoding) + fine-tune
  target + audit-translatable latent** on a *pretrained* model. Optional cheap falsification probe:
  a ≤100M from-scratch SIGIL model vs a SIGIL+code+NL control — expect the mix to win decisively.

## 7. DefOneOS: governance + audit over all agents/endpoints/robots  **[scaffolded → designed]**
- **[live foundation]** the Sovereign Gate + 12-around-1 + Tool Gateway (read/confirm/**prohibited**)
  + Maternal Covenant + 52-Article Partnership Charter + the SIGIL hash-chained trail.
- **[designed] DefOneOS = that stack as a *platform*:** any agent / MCP / endpoint / humanoid / robot
  registers, gets an identity + care-bond + charter, and **every action it takes leaves a signed
  SIGIL receipt** in the audit chain — global traceability. Ed25519-signed receipts (#43) make it
  independently verifiable + quantum-ready (Ratify-style hybrid). This is the "MEOK Law" layer:
  *agents are legal because they're governed + provable.*

## 8. Connectors: any AI plugs in + gets the characters  **[scaffolded]**
- **[scaffolded]** `MEOK_BRIDGE` (5-layer conductor: SOV3 memory → identity → A2A task bus → handoff
  → loop) routes across Claude/Kimi/Gemini/DeepSeek by capability+cost; embeddable one-line widget;
  Siri bridge (gated); MCP tunnel to the tool catalog.
- **[designed]** the goal Nick stated: *any* AI platform (incl. Claude) connects and can grant the
  **MEOK characters + emergence/hatch** to its users — MEOK as the character+memory+governance layer
  *under* swappable models. (The honest moat: layer ownership, NOT hiding which model runs.)

## 9. Voice-first + privacy  **[live seeds · designed]**
- **[live]** per-character distinct voices, mic→STT→gate→TTS loop, voice/text UI control.
- **[designed]** hands-free 24/7 (wake-word, like Siri/Alexa) + **face-tracking when cam-on** — both
  **opt-in, per-session-consented, and clearly toggled.** Privacy is a first-class, plain-English
  surface (no dark patterns): every capture asks; nothing leaves the device unless the user says so.
- Goal: remove mouse/typing — *speak your goal, the AI acts* (screen/mouse actuation **gated** by the
  Tool Gateway, never silent).

## 10. Honesty register (read before quoting anything externally)
- Live council = **12-around-1**, not "33-node" (that's the Charter spec). · **271** MCPs published
  (not 410). · SIGIL = −35% vs compact JSON (not "81%"). · SBT/chain = scaffolded, Nick-authorized. ·
  No IPO-from-research; no model-hiding; patents are signal not moat. · SIGIL-native-from-scratch is a
  research probe, not a product bet. · The overlay's native bits + step3.7 key are real remaining work.

## 11. Build order (each shippable, verifiable)
1. Overlay native (load /hud in meok-desktop + click-through). 2. step3.7 vision into /api/perceive.
3. Predictive small→large pre-warm loop (PredGen + EAGLE-3). 4. SIGIL grammar/constrained-decoding
(the safe SIGIL-native tier-1). 5. Ed25519-signed SIGIL receipts → DefOneOS registry. 6. Salience-net
training once the perception dataset is big enough. 7. amica 3D face into the HUD character slot.

_Companion docs: MEOK_OVERLAY_VISION · MEOK_SIGIL_BENCH · MEOK_ARCH_STACK_DRAGON · MEOK_DUAL_AGENT_PLAN
· MEOK_EARNINGS_SBT_DESIGN · MEOK_DOME_OPENCLAWWORLD_PLAN._

---

## 12. Bleeding-edge addendum (scan: ~May 26–Jun 2 2026)  **[research]**
_Honest framing: the literal 7-day window was quiet on model drops (the big ones clustered late-Apr/
mid-May); the in-window events are protocol/infra. Benchmark numbers below are vendor-reported._

**Protocol (SIGIL's neighbourhood):**
- **MCP 2026 RC** (stateless core, **MCP Apps**, Tasks, Extensions; final spec ~Jul 28). Stateless =
  friendly to fanning out across the council; **MCP Apps (sandboxed HTML iframes) could render the
  overlay's panels** instead of bespoke UI. → **ADOPT** (align MCP layer; prototype MCP Apps for /hud).
- **"Is MCP dead?" critique (May 30)** — MCP token bloat (e.g. 77 tools ≈ 21k tokens, ~10% of context).
  This is **external validation of SIGIL's whole thesis** (compact agent comms that don't burn context).
  Pair it with our −35%-vs-JSON benchmark as the positioning. → **ADOPT (as ammo)** + adopt lazy tool-loading.
- **A2A v0.3** — signed Agent Cards + skill-scoped auth. Borrow the signed-card pattern for council/BFT
  identity; position SIGIL as the **lightweight on-device layer beneath A2A**. → **ADOPT/WATCH.**

**Overlay / screen-vision (honest course-corrections):**
- ⚠️ **Microsoft Gaming Copilot** (Windows public beta) is essentially our overlay — in-game AI, reads
  your screen on demand, push-to-talk voice, pinnable widget, system-level (full-screen DirectX). **We
  are NOT first to the in-game-overlay idea.** Differentiate hard on **sovereign/local (no cloud screen
  upload), character personas, and governance** — and study their Game-Bar full-screen integration (the
  hard part we'll hit). → **WATCH closely (direct competitor).**
- 🟢 **Gemma 4 E2B/E4B** (Apache-2.0, on-device, runs on a Pi 5) does **screen/UI understanding + OCR +
  bounding-box pointing** — i.e. it may be a **better screen-vision brain than step3.7 for the overlay**:
  sovereign, local, no API key, privacy-first. **Adjusts §4/§11** — benchmark Gemma 4 E4B vs step3.7 for
  the perceive slot before committing. → **ADOPT-eval.** (Also: Nemotron 3 Nano Omni unifies vision+audio+
  language at 3B active — could collapse screen-vision + voice into one local model.)
- **Open Computer Use** (MCP-native desktop control, cross-platform) — a **ready, external, gated execution
  backend** for screen/mouse actions: the council decides, Open Computer Use executes over MCP, the Tool
  Gateway gates it. Lets us avoid building (and unilaterally wielding) mouse-control ourselves. → **ADOPT-eval.**
- **OpenAI Codex desktop agent** — copy its **per-command approve/reject + live session view** UX for our safety-tier overlay. → **WATCH.**

**Sovereign deployment / governance:**
- **Code with Claude London (May 26): self-hosted sandboxes + MCP Tunnels** — expose MEOK's local
  Postgres/MCP to a cloud-routed agent **without opening inbound ports** (one outbound, E2E-encrypted). This
  IS the sovereign + EU-AI-Act-data-residency pattern MEOK sells. → **ADOPT-eval** for the Ollama+cloud hybrid.
- **Agent Skills now cross-vendor** (Anthropic + OpenAI). Express MEOK character capabilities/council roles
  as **Agent Skills** for portability across platforms. → **WATCH/ADOPT.**

**Open models worth routing to (cloud/self-host):** DeepSeek V4-Flash (MIT, 13B-active MoE — cheap "smart"
tier), GLM-5.1 (MIT 754B — heavy reasoner node). Qwen 3.7 Max = API-only, **IGNORE** until weights drop.

**Net adjustment to the plan:** the overlay is now a *race* (MS shipped one) → our edges are sovereign-local
+ characters + governance, and **Gemma 4 may beat step3.7 for on-device screen-vision** (re-evaluate the
vision brain). SIGIL's wedge is externally validated by the MCP-bloat discourse.
