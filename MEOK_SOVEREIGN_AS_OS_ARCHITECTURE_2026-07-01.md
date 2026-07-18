# Sovereign = the AI OS — architecture, consolidation & what to absorb (2026-07-01)

Nick's vision: SOV3/Sovereign should **tunnel/bridge/control the whole AI OS as it speaks**, in
sync with the SaaS; **speech shows in the chat UX**; it can **see what's happening** and explain
map nodes/items when the user selects them. This doc = the honest architecture + what to absorb.

## State of the art (researched)
- **AG-UI (Agent-User Interaction Protocol)** — the open, event-based standard for connecting an
  agent to a user-facing app: **stream output, sync state, render UI components, handle approvals,
  keep the human in the loop.** This *is* "Sovereign controls the OS + shows in chat + in sync."
- **Amica** (MIT, semperai) — modular AI-character stack: **three-vrm** rendering, emotion tags in
  LLM output, **pluggable LLM** (llama.cpp/Ollama/OpenAI-compat), **pluggable TTS** (ElevenLabs/
  Coqui/RVC), **Whisper + Silero VAD** for voice, Tauri desktop, plugin/function system.
- **Open-LLM-VTuber** — hands-free voice loop + Live2D, local-first, cross-platform (another
  reference for the always-listening character loop).
- **GUI/computer-use agents (2026)** — models can read screen state + drive GUIs; but the reliable
  layer is **structured state + tool-calling**, not raw pixels. Apple's move: Apple Intelligence →
  Shortcuts as a **programmable AI layer across apps** (the "AI OS" pattern).
- **Agent-UX principles** — show what the agent is doing, explain *why*, allow override, recover
  gracefully. (We already narrate actions + explanations in the chat.)

## The ladder (what "Sovereign sees & controls the OS" really means)
1. **State-sync (DONE today).** `MEOK_CTX` = live OS state (space, open app, selected node) →
   injected into `/api/chat` as persona so the Sovereign answers *in sync* with the screen. Node
   selection (map/globe/graph) → `sovExplainNode()` speaks in the chat. **This is the AG-UI
   state-sync + generative-UI pattern, hand-rolled. It works now.**
2. **Tool-calling actions (NEXT).** Sovereign returns structured actions (open app, switch space,
   sign, validate a bridge msg, fly to a node) → the OS executes + narrates. = AG-UI "render UI /
   run tool" events. Build `/api/orchestrate` that returns `{say, actions:[...]}`; the OS applies.
3. **Event stream (AG-UI proper).** Adopt AG-UI's event schema so any agent (SOV3 local, cloud)
   drives the OS over one protocol — stream tokens, state deltas, UI components, approvals.
4. **Embodiment (Amica-absorbed, OPTIONAL).** Progressive: emergence-egg → three-vrm character →
   voice loop (Whisper/VAD + TTS). Absorb Amica's modular seams (MIT), keep our egg→hatch identity.
5. **Pixel vision (aspirational).** Literal "see the screen" (pixelbuddy) = screen-capture +
   computer-use. Heavy + privacy-heavy. Only after 1-4; state-sync gives 90% of the value safely.

## Sandwich brains → the orchestrator (consolidation)
The left/right/middle "sandwich brains" (`MEOK_BRAINS`, Set-up app) = a **router/orchestrator**:
- **Left** = reasoning/governance (council, compliance, sign). **Right** = perception/creative
  (knowledge, media, presence). **Middle (SOV3)** = the orchestrator that routes + holds memory +
  controls the OS. Best method = one **tool-calling orchestrator** over the fleet (the 377 tools +
  the working products: govern/bridge/sign/nodes), picking the model per side (already wired).
- SOV3 local (`:3101`, 330 tools) is the deep brain; the public serverless (`/api/*`) is the
  always-on brain. Keep ONE contract: `{message, persona:context, model}` → `{say, actions?}`.

## What to absorb (concrete)
- **AG-UI event schema** → model `/api/orchestrate` + the OS message bus (`window.postMessage`
  `meok-node` is our first event; generalise to `meok-agui`).
- **Amica seams** (MIT) → the character/voice ladder (three-vrm dock, VAD loop) as a progressive
  enhancement of the egg→hatch avatar; don't fork the whole app.
- **Shortcuts-as-AI-layer** idea → the Sovereign as a programmable layer across the OS apps.

## Already shipped toward this (today)
Working products (18/18 E2E): `/api/sign`+`/api/verify` (Ed25519), `/api/bridge` (real parse),
`/api/govern`, `/api/nodes`. **State-sync + node→chat** live. Free 3D world (earth3d).
Next: **P-Tool-calling** (`/api/orchestrate` → actions the OS runs) — the biggest single step to
"Sovereign IS the OS."
