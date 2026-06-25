# ONE OS — Canonical Architecture & Integration Backlog

Shared source of truth for ALL CSOAI agents (cloud Claude + M4 Claude Code). Derived from the uploaded research packages: ONE_OS_MASTER_ARCHITECTURE, CROWN_JEWELS_MASTER_SYNTHESIS, MEOK_WORLD_SIM. Read this with CLAUDE.md.

## The canon (one sentence)
THE ONE OS is a voice-first, AI-native OS that overlays every platform and replaces apps + menus with ONE sovereign AI character that can talk, see, remember, act — and eventually walk beside you (humanoid). All standing on Layer 0.

## Live status map (ONE OS dimension -> shipped surface)
- AI Character / voice-first interface -> **SovereignDock** (LIVE, every page; type/speak -> it acts)
- The World (MEOK shell) -> **/enter** immersive geolocated entry (LIVE) + /globe.html, /globe3d.html
- Jurisdiction intelligence (region -> regs + crosswalks) -> **/enter** auto-suggest (LIVE)
- Guided onboarding (walk you through like a game) -> **/tour** (LIVE)
- Immersive learning (no manuals) -> **/academy** (LIVE)
- Humanoid / entity bridge + registration -> **/register** (LIVE, v1 local-stage)
- Distribution + Layer 0 coverage -> **/distribution** (LIVE)
- Layer 0 protocol + A2A -> @csoai/layer0 + api-server/a2a.js (BUILT; runtime gated on VM)

## Crown Jewels — integration backlog (fork / integrate, with plug points)
- Kokoro TTS (MIT, on-device) + openWakeWord -> REAL voice in SovereignDock (replace UI-only mic)
- Attestix (DID / W3C verifiable creds) -> identity for /register + Layer 0 L0-1
- ACGS-Lite (constitutional gov, Ed25519 receipts) -> governance engine
- Augustus (210+ red-team probes) + iFixAi (safety scoring, letter grade) -> Evidence Hub / Model Registry
- agent-village / sociolife / concordia / project-sid -> Sovereign Town civilization sim
- PeerPigeon (WebRTC mesh, CRDT) -> P2P grid / Worm Hive upgrade
- LeRobot / Berkeley Humanoid Lite / GR00T N1 -> physical humanoid bridge
- TEMM1E, Agent Fleet Q (675 MCP tools), forkd (agent microVMs) -> MCP fleet + sandboxing

## World engine (MEOK_WORLD_SIM)
Web OS today = CesiumJS globe + immersive /enter. Next-gen shell = UE5 (or Genesis, 43M FPS physics) for the deep 3D MEOK world + sim-to-real humanoid training. Track, do not block the web OS on it.

## The ONE lever
Deploy api-server/ to the GCP VM -> flips the Sovereign from routing + teaching to AUTONOMOUS action; lights the 216 MCPs live, A2A, real evidence, and the Sov-Town learning loop. Owner action.

## M4 coordination
Both agents work from THIS doc + CLAUDE.md. Claim a Crown-Jewel lane before integrating (note it here). Edit method: GitHub web editor via cmTile.view.dispatch() + an input-event nudge (GitHub MCP token is dead; browser only). client/ changes ship branch -> PR -> Vercel build-verify -> merge.

_Last updated: cloud Claude (cowork) — after shipping the A->E onboarding system: /enter, /tour, /academy, /register, and the global SovereignDock._
