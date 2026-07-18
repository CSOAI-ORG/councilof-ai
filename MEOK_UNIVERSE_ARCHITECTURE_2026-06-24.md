# 🌐 MEOK Universe — immersive architecture (2026-06-24)
**Vision:** any end user creates their **sovereign AI** and navigates a **real-world-mapped MEOK dome/universe**.
> 🌐 **It already has a live home: `meok.ai/dome`** (browser-verified 2026-06-24) — "The Sovereign World Simulation, five layers, claim your plot, explore the map, 47+ agents, 1,240/10,000 pioneer plots." My MEOK Earth globe = its missing **"Explore the Map"**; create-AI = **"Claim Your Plot"**. Full finding: `_findings/MEOK_DOME_LIVE_CONSOLIDATION_2026-06-24.md`. **Don't build the dome from scratch — wire MEOK Earth INTO /dome.**
**Binding rule (unchanged):** the society sim stays headless; every renderer/engine READS the Layer-0 ledger, **never** runs the sim (`sovereign-town/ARCHITECTURE_GUARDRAIL.md`).

## The honest engine verdict (read before anyone buys an Unreal license)
- 🔴 **Unreal Engine is NOT open-source.** It's *source-available* under the Epic EULA: **5% royalty on revenue >$1M** + **per-seat enterprise/non-games licensing**. Massive toolchain + GPU + build farm; **cannot be built or verified from this CLI.** Treat UE as an **optional cinematic/flagship-demo layer only — never the substrate.**
- 🟢 **Truly open alternative = Godot (MIT).** No royalty, real 3D + VR, embeddable. The right pick if/when we want a high-fidelity desktop/VR client.
- 🟢 **Already shipping = Web (Cesium Apache-2.0 + Three MIT).** Zero-install, every device, **real-world OSM map**, and the **"Create your Sovereign AI" flow is LIVE today.** This IS the MEOK dome for *any* end user.

## The layers (one identity, one ledger, many renderers — all read L0)
| Layer | Tech | License | Status | Reaches |
|---|---|---|---|---|
| **Identity** | Ed25519 sovereign AI (signed @ gateway) | — | preview live (client) | every entity attested |
| **L0 protocol** | signed flywheel ledger + 233 MCPs | Apache/MIT | LIVE | the substrate everything reads |
| **Web dome** ✅ | **Cesium + Three (MEOK Earth)** | Apache/MIT | **shipping — create-AI flow live** | **anyone, no install** |
| **High-fidelity client** | **Godot** (recommended) | MIT | future | desktop / VR |
| **Cinematic/flagship** | Unreal (optional) | EULA + royalty | future, owner-gated | marketing demos only |

## Why web-first wins for "any end user"
Instant, cross-device, no download, already built + CI-green. UE/Godot are **fidelity upgrades for specific surfaces**, not the mass-adoption path. Don't gate the universe on a heavy engine.

## How it comes together (the bring-it-together)
1. **One identity** — your sovereign AI is Ed25519-signed once (gateway), valid across every renderer.
2. **One world-state** — the L0 signed ledger; renderers subscribe via REST/WS (`VITE_LEDGER_URL` already supported).
3. **Real-world map** — Cesium WGS84 Earth (free OSM now; pre-baked tiles/GLB for hero zones). The **dome = the globe**; the **universe = hives + your sovereign + ledger overlays**.
4. **Navigate** — fly-to, layers, policies; your AI lives at a deterministic home and moves as the ledger says.

## What's live today (verified)
End user → name + archetype → **spawns their signed sovereign AI on the real-world globe** + fly-to. In `meok-town-view/src/MeokEarth.tsx`, build green, screenshot-verified.

## Tooling verdicts (verified — visual-world tools, not robotics-build)
- **map3d** (github.com/cartesiancs/map3d) — ✅ **MIT**, stack = **R3F + three + Vite (same as MEOK Earth)**. "Generate a real-world 3D map." **The usable one** → fork to pre-bake hero-zone 3D city GLBs for the dome.
- **Unreal 5.8 MCP** — real-ish; MCP support would let UE read the L0 ledger, but still source-available + royalty → optional cinematic only.
- **NVIDIA MotionBricks** — real nvlabs project but **CUDA/Linux-only** (+ "15,000 FPS" is creator hype) → future character-motion, not buildable on this Mac.
- **Meta AI4AnimationPy** (Sebastian Starke) — real, animates *skeletons* — ⚠️ **NonCommercial license → AVOID for product** (prototype-only); does NOT "bring agents to life."
All four are visual-world tools; none print a robot or move the Berkeley humanoid (that's MEOK Labs' separate track).

## Next (non-gated): multi-agent presence (your AI + others on the same dome), WS live-sync to the gateway, a Godot VR client reading the same ledger. **Owner-gated:** deploy (`vercel --prod`) so the dome is public for real end users; any UE cinematic.
