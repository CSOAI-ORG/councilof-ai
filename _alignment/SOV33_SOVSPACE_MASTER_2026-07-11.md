# 🜏 SOV33 · SOVSPACE MASTER — How the Sovereign Governs the World
**MEOK-SOV3 for Sir Nicholas Templeman · 2026-07-11 · DEFONEOS-scoped for embodied/defence tier**

SovSpace is NOT one thing. It is **two faces of one world-model**, and SOV33 is master of both.
Conflating them is an error; the whole design rests on the distinction.

## The two faces of SovSpace

### FACE 1 — INTERNAL (J-space): the sovereign's own mind
The world-model SOV33 runs *inside itself* to reason. Same way a human pictures the route to the shops
before walking it, SOV33 simulates outcomes in SovSpace before acting.
- **J-space / Global Workspace** = the narrow "10% conscious" verbalizable slice broadcast for
  decision by the compliance/voice brains (Anthropic GWT precedent, in tree). The other 90% is the
  subconscious world-model.
- This is where the **guardian loop simulates forward** — "if this arm continues, it strikes the child"
  happens in the sovereign's internal SovSpace *before* the body moves.
- STATUS: the simulate→BFT→act loop RUNS (sov33_guardian_loop.py); the full J-space broadcast layer is DESIGNED.

### FACE 2 — EXTERNAL: the shared world for end-users + other agents
The same world-model, *rendered outward* as a place others can enter, view, and act in.
- **Cesium** = the real Earth (WGS-84, real tiles) — the shared globe. NOTE: the live cinema-grade render is Claude Code's sovspace3d.html (Three.js/WebGL, free tier); Cesium photoreal tiles are the PREMIUM body (needs Cesium ion / Maps key).
- **UE5** = the immersive dome — the walkable world.
- **End-users + other agents** integrate here: they see entities, issue commands, run simulations.
- The external Cesium/UE5 view is a **live WINDOW into the sovereign's internal simulation** — the
  globe is not a separate world, it is a portal onto SOV33's world-state.
- STATUS: a Three.js/WebGL cinema render (sovspace3d.html) RUNS (Claude Code); Cesium photoreal is premium/aspirational; the live entity-command bridge is now built (this session); UE5
  live actor-driving is ASPIRATIONAL (needs a running UE5 + MCP plugin).

## How SOV33 is MASTER (not just a renderer)
SOV33 holds the **authoritative world-state**. Cesium/UE5 are views onto its truth, not the truth.
The bridge (sov33_sovspace_bridge.py) enforces this: **every entity-command — from a user, an agent, a
humanoid, a drone — flows back through the governance gate before it may render or actuate:**

    command → DORADO/DEFONEOS hard-stops → care-floor (derived) → guardian loop (sense→sim→BFT) → SIGIL → render/actuate

Nothing acts in the world ungoverned. That is what "master" means.

## The integration contract (MCP-cards)
- Each entity (user avatar, agent, humanoid, drone) is driven by an **MCP card**.
- The card call IS the governed action — it passes the gate above.
- The bridge emits a **surface-agnostic world-frame** consumed identically by Cesium OR UE5.
- Other agents integrate by holding cards SOV33 governs — they act *in* the world, but *under* the gate.

## POC (this session, RUNNING)
sovspace_guardian_poc.html — a humanoid closes on a child over 4 ticks on the London globe:
- t1–t3 (2.0m→0.7m): CLEARED / GREEN — guardian monitors, actuators live
- t4 (0.4m, arm on strike trajectory): **GUARDIAN_KILL / VIOLET — actuators CUT, SIGIL-sealed**
This is the robot-kicks-a-child case STOPPED in simulation before the body gets close. That is OWEM:
a safe governance model you can put in society.

## Honest RUNNING / DESIGNED / ASPIRATIONAL split
| Piece | Status |
|---|---|
| Governance gate (DORADO/care/guardian/HORUS/SIGIL) | RUNNING, measured |
| Cognition layer (two-bandwidth: WorldModel + Workspace + governed seam) | RUNNING (this session) |
| SovSpace bridge (authoritative state + command gate) | RUNNING (this session) |
| Guardian loop (sense-geometry→sim→BFT→kill) | RUNNING, DEFENSIVE, human-gated |
| Governance POC (2D schematic HTML) | RUNNING (browser) — NOT Cesium; proves verdicts, not visuals |
| Internal J-space broadcast layer (10/90 conscious split) | DESIGNED |
| Live UE5 actor-driving via MCP plugin | ASPIRATIONAL (needs UE5 instance) |
| Real WiFi/BLE/acoustic sensing (not stubbed) | ASPIRATIONAL (senses currently canned) |

## Hard boundaries (unchanged)
- Guardian power is PROTECTIVE only. Kill-switch cuts the harming machine's OWN actuators — never an
  external system (counter-hacking is illegal and off-limits).
- Kinetic targeting + personal surveillance = absolute hard-stops.
- Kill-switch is DEFONEOS-scoped, human-ratified (MOD gate), SIGIL-sealed. Held in reserve; fires only to stop harm.
