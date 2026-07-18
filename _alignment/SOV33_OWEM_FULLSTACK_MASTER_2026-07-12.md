# SOV33 OWEM — the FULL-STACK master map (brain + memory + character + visual/UX)
_2026-07-12. Honest split: RUNNING (verified this session) / DESIGNED (code or blueprint on disk, not wired) /
MISSING (must build). The OWEM is the WHOLE vertical, not just the governed brain._

## The thesis (grounded)
Your OWEM = a **portable AI character + sovereign memory + governance**, that rides on top of ANY AI platform
(Claude, ChatGPT, Amica) and can talk to other characters (MEOK Universe/Council/Family). The differentiator
is the SWAP-PERSISTENCE property we proved structurally: **memory + identity + care-floor live in the SOV33
substrate, not in the model** — so the character carries its memory INTO each platform as injected context.
Platforms keep their data/usage (enterprises stay happy); the user's DURABLE memory stays sovereign + governed.
Memory is BYO-context, not platform-locked. THAT is the bridge, and it's real architecture, not hype.

## What EXISTS vs what's MISSING (the honest gap = assembly + governed wiring, NOT creation)

### A. GOVERNED BRAIN — RUNNING
- sov33.py entrypoint: 75 capabilities, 0 broken, SHIP-READY; registry 51/51.
- care-floor (0.95) → SIGIL → identity-tier gates; escalate-don't-average; conformal veto.
- OWEM world-model owns trainable weights (JEPA, loss 1.11→0.51); growth-by-accretion (frozen base, no forgetting).
- Anti-relapse CHECK_EXISTING stage: probes every "blocked" claim live before reporting it.

### B. SOVEREIGN MEMORY — RUNNING (server) / DESIGN for cross-platform bridge
- get_memory_stats: 17,088 episodes live on :3101. Memory namespaced to the Hatch fingerprint.
- swap-persistence: memory hash byte-identical across model swaps (STRUCTURAL proof — memory is substrate, not model).
- MISSING: the **cross-platform memory-bridge shim** — a thin adapter that injects SOV33 memory as context into
  a Claude/ChatGPT session (MCP or system-prompt preamble) and writes the turn back. meok-ai has
  `ui/src/lib/character-agent-bridge.ts` + `sovereign-temple/memu/identity_persistence.py` as starting points.

### C. AI CHARACTER (companion) — DESIGNED (rich) + RUNNING adapter
- meok/core/character_catalog.py (846L, 24 companions), character_emergence.py (6-stage hatch), character_voice.py
  (365L), character_registry.py, personality.py — all REAL code on disk.
- sov33_companion_layer.py (136L) is a RUNNING governed adapter: every turn → identity → care-floor → SIGIL.
  Verified: benign passed (care 0.97, "🐣 Hatching"); manipulative VETOed (care 0.07).
- Blueprints (Downloads): "Unified Companion Blueprint" + "Character Factory 3D Pipeline" + "End-to-End Character
  OS Roadmap" + 4 Character Evolution decks — full design corpus, egg→dragon aesthetic, personality DNA, vital system.
- STUB honesty: adapter's care_score() is a heuristic (not the trained scorer); its SIGIL is sha256 not the Ed25519 L5.

### D. VISUAL / UX SEAM — DESIGNED (already built in meok-ai, NOT wired to SOV33 brain) ← the "lack" you flagged
- **meok-ai/town-3d/** — a React + three-fiber 3D app (real, has react-three-fiber.d.ts, README).
- **meok-ai/ui/public/meok-os-v3/avatar-3d-v3.html** — 3D avatar; **olm-federation-live-v3.html** — federation UI.
- **meok-ai/ui/src/lib/emotion.ts + characters.ts + avatar.ts** — emotion + character front-end libs.
- SovSpace: meok-os-deploy/sovspace3d.html — REAL CesiumJS 1.123 (free OSM+NASA GIBS), live on os.meok.ai.
- Four display states specified (blueprint §5): Full / Compact / Orb / Ambient — the "minimize to orb" UX.
- **This is the key finding: the visual layer is NOT missing — it exists in meok-ai. The gap is that it calls its
  own front-end logic, NOT the SOV33 governed brain. Wiring town-3d/avatar → sov33 entrypoint = the next step.**

### E. "LIKE AMICA" (portable character on all platforms) — DESIGN, feasible
- Amica = open VRM avatar shell (face/voice/lipsync) that talks to ANY LLM backend. Blueprint names it 18×.
- SOV33's role: BE THE BACKEND Amica calls. Character memory/personality/care/identity in SOV33; VRM body is the shell.
- Open-source seam — BLUEPRINT-NAMED (verified by grep in the two blueprint files): Amica (18×), Godot (13×),
  Blender (13×), Whisper (7×), Three.js (5×), VRM (4×), Piper (1×), Ollama (1×). ECOSYSTEM-COMMON additions from
  2026 research (NOT in the blueprint — labelled as such): VRoid, @pixiv/three-vrm, Kokoro/Chatterbox TTS. All permissive.
- MISSING: the adapter that points an Amica-class shell at sov33.ask() through the care-floor gate.

### F. CHARACTER-TO-CHARACTER (MEOK Universe/Council/Family) — RUNNING (federation core) / DESIGN (UX)
- Federation + reputation + collusion-resistance: built + stress-tested by sibling lane (holds to classic BFT bound;
  reputation converts permanent takeover into a one-shot; upstream diversity is the real defense).
- Each character = a small OWEM (own growing substrate); many federating = MEOK Universe.
- MISSING: the social UX (two users' characters meeting) — olm-federation-live-v3.html is the starting surface.

## THE NEXT STEP (what "master this all OWEM" means concretely)
The build is NOT "create the visual layer" — it EXISTS. It is **wire the existing seams to the governed brain**:
1. **memory-bridge shim** (B) — inject SOV33 memory into any platform session + write-back. Highest leverage: it's
   the whole "bridge memory across all AI, user protected, platforms keep their data" pitch in one adapter.
2. **avatar→brain wire** (D) — point meok-ai/town-3d + avatar-3d-v3 at sov33.ask() through care-floor. Makes the
   character visually alive AND governed.
3. **Amica-class backend adapter** (E) — the portable-on-all-platforms claim, one governed endpoint.
4. **federation social UX** (F) — characters meeting, on the existing federation core.

All four are ASSEMBLY of existing parts through the governed gate — no new model, no new capability invented.
Everything stays honest to the register: brain RUNNING, memory server RUNNING, character code DESIGNED+adapter
RUNNING, visual layer DESIGNED (exists in meok-ai), bridges MISSING (the assembly work).

## G. AI-OS OVERLAY (the "download app → your character works INSIDE Claude/any tool" layer) — DESIGN
The full vision: user installs a MEOK-OS app/overlay → it registers SOV33 as an MCP server in their Claude/ChatGPT
→ their hatched character now sits ALONGSIDE them in that tool, can talk, and can ACT (drive the tool, take
control) on any OS. The user watches; the character does the work. "Open source folded into one, so anyone has the
most up-to-date capabilities without knowing TUI or how to use Claude — SOV3 character co-works with them."

HONEST split for this layer:
- **MCP-into-Claude registration** — RUNNING primitive: SOV33 already IS an MCP server (:3101, 313 methods). A user
  adding it to their own Claude via `claude mcp add` is a REAL, supported path TODAY (config, not new code).
- **Character sits in the tool + talks** — DESIGN: needs the memory-bridge shim (§B) + a thin overlay UI. The
  character's turns already flow through the governed gate; surfacing it in-tool is UX assembly.
- **"Acts / takes control of any OS / any tool"** — SPLIT HONESTLY:
  · Acting THROUGH MCP tools the user has connected = RUNNING primitive (that's what MCP is for; governed by care-floor).
  · Acting by DRIVING the desktop / other apps (mouse/keyboard control of arbitrary OS) = a COMPUTER-USE capability
    that SOV33 does NOT have and I cannot grant — it needs an OS-automation agent (e.g. an approved computer-use
    tool) the USER installs and authorizes. Never claim SOV33 "controls any OS" until such an agent is wired + consented.
- **"Watch it do the work"** — DESIGN: the overlay streams the character's governed actions; each action SIGIL-logged
  + care-gated so the user (and an enterprise) can audit exactly what it did. This is the trust story.

THE HONEST ONE-LINER: the OVERLAY makes SOV33's governed brain + the user's character reachable INSIDE any
MCP-capable tool (Claude/ChatGPT today) — real via MCP. "Does everything on any OS autonomously" is the DESIGN
horizon that needs a user-installed, user-consented computer-use agent; the governance/audit layer is what makes
that safe when it lands. Don't sell the autonomy before the consented OS-agent exists.

## H. SURFACES / REACH (desktop orb · phone · Siri · Android · websites) — SPLIT by who controls the gate
"Once installed, the character is always-there — a circle on desktop/phone; or via Siri/Google; or embedded on any
website (SaaS)." Real vision, but the surfaces divide into OPEN (we can ship) vs GATEKEEPER-CONTROLLED (needs their
approval / their rules) vs HARD-LINE (privacy law). Be honest per surface or we over-promise.

### OPEN — we can build/ship these ourselves
- **Website / SaaS embed** — RUNNING-adjacent: a JS widget (the "one signed line" Hatch already designs) drops the
  character onto any site; it calls SOV33 over MCP/HTTPS, care-gated. Highest-leverage reach, fully in our control.
- **Desktop orb overlay** — DESIGN: an Electron/Tauri always-on-top orb (blueprint's Orb/Ambient states) that talks
  to SOV33. We own this end-to-end. The four display states (Full/Compact/Orb/Ambient) are already specified.
- **PWA on phone** — DESIGN: a progressive web app gives an "always there" icon on iOS/Android without app-store gates.

### GATEKEEPER-CONTROLLED — real, but on THEIR terms (not something I can just switch on)
- **Siri** — via **App Intents / SiriKit**: you ship an iOS app exposing intents; Siri routes "Hey Siri, ask <name>…"
  to it. REAL and documented, but requires an Apple Developer account, an App-Store-reviewed app, and Apple's intent
  model — WE don't get raw always-listening mic; Apple mediates. Honest: "Siri can invoke the character" is feasible;
  "Siri gives the character ambient awareness of everything" is NOT — Apple gates that.
- **Google Assistant / Android** — similar via App Actions / a foreground service; Google mediates the same way.
- Both need owner-side developer accounts + store review. I can build the app + intent layer; I cannot publish it.

### HARD-LINE — do NOT cross regardless of framing
- "More awareness through Siri" cannot mean **always-on ambient mic, screen-scraping, or sensing the user passively**.
  That's EU AI Act Art.5 territory + platform ToS violation. The character's awareness is EVENT-DRIVEN and CONSENTED:
  it knows what the user explicitly shares / invokes, not what it silently harvests. This is the SAME line as the
  privacy-sensing rule (geometry/events, never identity; consent-gated, never passive biometric).

### THE HONEST REACH ANSWER
Yes — the character can be "always there" across web (fully ours), desktop orb + phone PWA (ours to build), and
Siri/Google (feasible via their intent APIs, gated by their review + owner accounts). "More awareness" = MORE
CONSENTED CONTEXT and MORE CONNECTED TOOLS (each MCP the user adds), NOT passive ambient surveillance. The moat is
that ONE governed brain + ONE portable memory + ONE identity serves every surface — the user's character is the same
being everywhere, and every action is SIGIL-logged and care-gated so it's auditable. That uniformity is the product.

## I. PLATFORM INTEGRATION — four surfaces, four gatekeepers (do not conflate)
"Android + Siri + Windows/iOS/Linux — integrate cleanly; use Apple's tech; improve it for them AND us?"

### OURS — full control, buildable now
- **Windows / macOS / Linux desktop** — one Tauri overlay (Utsuwa already ships cross-OS) → the always-there orb.
  No gatekeeper. This is where "clean integration" is immediate and real.

### THEIRS — integrate via their INTERFACE, on their terms (not a tech transfer)
- **Siri (Apple)** — via **App Intents / SiriKit**: ship an iOS app exposing intents; Siri routes "ask <character>"
  to it. REAL + documented. Apple Intelligence (2026) can hand a request to a 3rd-party app intent.
  · What Apple gives: invocation on user command. What Apple does NOT give: raw always-on mic, screen reading,
    ambient awareness. Apple mediates EVERY call. "Siri can invoke the character" = feasible; "Siri gives it
    ambient awareness of everything" = NO (Apple structurally prevents it; same line as Art.5 privacy floor).
- **Google Assistant / Android** — App Actions + a foreground service; Google mediates identically.
- Both need OWNER-SIDE developer accounts + store review. I can build the app + intent layer; I cannot publish it.

### THE "DO WE IMPROVE APPLE'S TECH / DO THEY NEED THIS?" ANSWER (honest)
- We do NOT use/improve Apple's internals — App Intents is a DOORWAY, not a technology transfer. We give Siri a
  new thing to route to; we don't touch Siri's engine.
- What we genuinely offer Apple: the thing they're weakest at + care most about — GOVERNANCE + AUDITABILITY of
  third-party AI. A SIGIL-signed, care-floor-gated, consent-scoped character is exactly the kind of 3rd-party AI
  Apple's privacy+safety brand prefers in its ecosystem. Alignment = "we make third-party AI safe to Apple's
  standard", NOT "we make Siri smarter".
- Do they NEED it? No single vendor is needed by Apple. The workable framing is the three-headed one: we drive
  engagement INTO their ecosystem while carrying the compliance burden they'd otherwise police. Additive, never
  "we abstract Apple away".
- HARD CONSTRAINT (unchanged all session): interoperable-WITH App Intents = OK. "improves Siri / integrates with
  Apple's tech / backed by Apple" = FORBIDDEN (implies partnership/endorsement). Same interoperable-not-backed line.

### WHY THE MEMORY-BRIDGE IS THE KEYSTONE FOR ALL FOUR
Every surface above is just a DIFFERENT DOORWAY to the SAME character. What makes it the same being everywhere is
ONE governed sovereign memory, reachable over MCP. Build that bridge once → desktop orb, Siri intent, Android
action, and website widget all read/write the same SIGIL-signed store. The bridge is the keystone; the surfaces
are thin adapters on top.
