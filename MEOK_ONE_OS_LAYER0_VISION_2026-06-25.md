# 🧬 MEOK — The ONE OS (Layer 0 interface) · honest vision + buildable ladder
2026-06-25. The north-star Nick described: **download → your sovereign AI character loads on screen → you drop into the real world where you are → the character walks you around, does things for you, keeps you safe → the bridge to that same character living inside a humanoid.** No more typing. A new interface that *eats all* — synergises with Windows/iOS/Android rather than fighting them.

This doc is the honest map: **what's real, what's buildable now, what's aspirational** — and the **open-source tool for each** (no hype, verify-before-build).

---

## The thesis (one line)
MEOK OS is **not** a new kernel. It's a **sovereign companion layer** that rides on top of whatever OS the user has, fluid to them (the pond), with a talking AI character as the primary interface — the stepping stone to the same character embodied in a humanoid.

## Capability ladder — status + the OSS tool
| # | Capability (Nick's words) | Status | The tool (mostly already here) |
|---|---|---|---|
| 1 | **Pond OS — fluid to each user** (different user → different water; CSOAI vs MEOK currents) | ✅ **BUILT** | MEOK_OS/index.html (pond canvas + MODE_ORDER + archetype signature) |
| 2 | **Epic emergence boot** (marble→egg→fish→dragon) | ✅ **BUILT** | inline SVG (this session) |
| 3 | **AI character loads on screen** (VRM, talks) | 🟡 **HAVE PARTS** | `meok-amica` (local VRM-1.0 talking-head: three-vrm WebGPU + amica emotion + Piper/Coqui TTS) + `@pixiv/three-vrm` already in meok-town-view |
| 4 | **Drop into the real world where you are** (IP → your location) | ✅ **BUILT (this session)** | Cesium `flyTo` + `ipwho.is` geolocation (meok-town-view) |
| 5 | **RH sidebar character + chat + TUI** (the "Amico" interface; small char in a circle when minimised) | 🟡 **DESIGNED** | meok-amica HUD slot pattern → port into the OS shell as a docked panel |
| 6 | **Talk to AI, no typing** (voice in/out) | 🔲 **BUILDABLE** | Whisper / faster-whisper (STT) + Piper or Coqui (TTS) + VRM visemes — all OSS, all local |
| 7 | **OpenHands-style agent UI for SOV3** (login → pick left/right brain → it acts) | 🟡 **HAVE IT** | **OpenHands IS installed** (`~/.openhands`, `meok-platform/openhands-ui`) → learn its workspace UI; SOV3 already has `olm_route_query` + left/right/council brains (meok-one bridge) |
| 8 | **Character walks you around the world / shows tools / learns you — like a game** | 🔲 **BUILDABLE** | VRM avatar (have) + waypoints over the Cesium/town scene + the OLM brain narrating; "guided tour" state machine |
| 9 | **Eats all OSes — overlay/tunnel on Windows, fluid on iOS/Android** | ⚠️ **PARTIAL — be honest** | Desktop overlay/companion = **Tauri** (Rust+web, tiny, real). **iOS forbids true system overlays; Android allows limited ones.** So: a *companion app + web*, not a literal OS takeover on mobile. The "catapult/synergise" framing is right; "replace the OS" is not. |
| 10 | **Humanoid bridge** (same character → inside a robot) | 🔵 **ASPIRATIONAL (the win)** | The *interface abstraction* is real and is the moat: one sovereign-AI-character API drives screen today, humanoid later (Berkeley Humanoid Lite / SO-101 are the cheap bodies). Hardware = future. |

## What's already on this machine (don't rebuild — wire in)
- **meok-amica** — local VRM talking-head (the character + voice + emotion). The single biggest unlock for #3/#5/#6.
- **OpenHands** (multiple installs) — the agent-workspace UI for #7.
- **@pixiv/three-vrm + meok-town-view** — the world + avatar + now the geolocation drop.
- **OLM brain + SOV3 bridge** — `olm_route_query`, left/right/council brains = the "select your brain" flow already exists as tools; needs a UI.

## Cinema quality — honest options
- **World:** Cesium (have, zero-token). Truly photoreal "Google Earth" street level needs **Google Photorealistic 3D Tiles = PAID**; free path = OSM/MapTiler imagery (stylised, not photoreal). For hero cinema shots: pre-baked GLB scenes (already the meok-town-view approach).
- **Character:** VRM + **three.js post-processing** (UnrealBloom, DoF, tone-mapping) — OSS, gives the "cinematic" glow cheaply.
- **Voice:** Piper (fast, local, free) for the character's voice.
- Verdict: **cinematic-stylised is free and achievable now; photoreal-everywhere costs money** — lead with stylised hero quality.

## 🔴 For the CSOAI hive (flagged, needs hive/verify)
- **CSOAI is missing Map + Dome** — and we already have the pieces: `god-eye` / `gods-eye-geospatial-mcp` (Map) + the MEOK Earth dome (`meok-town-view`). **Action: embed the dome + a geospatial map panel into csoai-org/councilof-ai.** (Same component, two brands — the fluid principle.)
- **Sov-town learning/accumulating/spawning?** Honest status: the **flywheel ledger accumulates** (583M signed episodes, real) and there's a `WHITEPAPER.md` + `RESEARCH_ALIGNMENT.md`, BUT I have **not** verified a live self-learning/spawning loop — the "universe multiplication" is documented intent, not confirmed running. **Needs a hive check before claiming it.**

## Sequenced buildable next steps (all non-gated)
1. **Port meok-amica's VRM talking-head into the OS as the RH character dock** (#3+#5) — the character that's always there.
2. **Wire voice** (Whisper + Piper) so you talk to it (#6).
3. **Guided-tour state machine** — the character walks you to each app/tool and explains it (#8).
4. **Embed the dome + Map into CSOAI** (hive item).
5. **Tauri shell** — bundle the OS into a downloadable desktop companion (#9 desktop).
6. Wire create-AI signature → pond hue (the self-driving fluid, still outstanding).

**Honest summary:** the *interface* (pond OS, emergence, world, geolocation drop, fluid modes) is real and shipping. The *character-as-primary-interface* (talk, walk-the-world, no typing) is **assembly of parts we already own** (amica + VRM + OLM + voice) — not new invention. The *overlay-eats-all-OSes* is true on desktop (Tauri), limited on mobile (be honest). The *humanoid* is the aspirational payoff the clean bridge is built toward.
