# MEOK OS / "MEOK Earth" — UI Build Spec
> **🟢 STATUS 2026-06-24: Week-1 "WOW" BUILT + verified.** `~/meok-town-view/src/MeokEarth.tsx` (behind a `🌍 Earth | 🏙️ Town` toggle in `App.tsx`). Zero-token Cesium globe + 12 hive regions + agent markers + King→hive arcs + layer toggles + compliance ring. `npm run build` green, `dist/cesium` copied, preview renders live, 0 console errors / 0 ion 401s. The §"Week-1 WOW plan" below is the spec it was built against; the remaining days (real ledger feed, deck.gl heatmap, label declutter, meok.ai embed) are the open P1 work.

**Integrated 2026-06-24 from `MASSIVE_HUNT_COMPLETE_PACKAGE` (HUNT_01–12).** Distilled to what's worth building.
> Honesty notes: the source was dated **July-2025** (re-check React/Vite/Cesium versions before pinning); the "200+ platforms / 55 repos" framing is marketing — the stack + steal-list below are the sound parts.

## Build target (don't confuse surfaces)
- **MEOK OS desktop** (`SOV3-Launch/MEOK_OS/index.html`) = the 2D grid-world *launcher* (16 apps, boots clean). **Keep as-is.**
- The **3D-globe vision** belongs in **`~/meok-town-view`** (already Vite + React-Three-Fiber) → evolve into **"MEOK Earth"**: a Cesium globe of the 12 hive-civilizations + live governance/agent overlays, embeddable in meok.ai. This is the canonical answer to the recurring "OpenGridWorks-style UI" ask.

## Stack — all permissive, verified license-clean
- React 19 + TypeScript (strict) + Vite 6
- **CesiumJS** — base WGS84 globe, 3D Tiles, terrain, time-dynamic CZML — **Apache-2.0** ✅
- **deck.gl** — data overlays (Scatterplot / Arc / Heatmap / Path / Hexagon, ~10M pts @60fps) — **MIT** ✅
- **Three.js** — custom effects (agent-trail particles, threat/pheromone shaders, bloom) — **MIT** ✅

## ⚠️ License trap (reconciles prior research — do NOT skip)
The CesiumJS **engine** is free (Apache-2.0), but **Cesium ion** (hosted terrain/tiles) is **paid** ($149–524/mo) and **Google Photorealistic 3D Tiles** is **paid** (~$6/1k sessions). My earlier verified research (`intel-2026-06-23-deep-research`, map3d/Unreal) said "skip Cesium" — the honest reconciliation: **keep the CesiumJS engine, but use self-hosted/open terrain or a pre-baked GLB** (the map3d fork-and-export pattern), never ion/Google tiles. Stays zero-cost.

## Steal list → MEOK features (legit UI patterns, not code lifts)
| From | Pattern | MEOK use | P |
|---|---|---|---|
| OpenGridWorks | toggleable layer panel · category node icons · legend · side info panel | hive / agent / data layers | P0 |
| Vanta / Drata | animated compliance progress rings · framework checklists · 4-quadrant risk heatmap | Watchdog + Compliance Fleet apps | P0 |
| Windy | WebGL particle flow · time-slider play/pause | agent/data flow + **ledger replay** | P1 |
| Electricity Maps | choropleth fill · flow arcs · live count badges · clean info cards | jurisdiction / governed-vs-ungoverned | P0 |
| FlightRadar24 | realtime WebSocket tracking · fading trail paths · status colours | live agent / episode tracking | P0 |

## Week-1 "WOW" plan (HUNT_12 §3 — "make the globe spin first")
D1 Cesium dark globe + atmosphere glow → D2 terrain + day/night → D3 **12 hive-civilization GeoJSON regions** + pulsing agent markers → D4 auto camera fly-through + layer-toggle sidebar → D5 first real data layer (power grid) + animated compliance score ring → D6 polish + staging.
Philosophy: ship the 30-second demo before backend completeness — it's the investor/launch visual.

## MEOK Sovereign brand tokens — applied to MEOK OS + MEOK Earth (2026-06-24)
Derived from the MEOK.ai "Sovereign Emergence" decks (cream/spectrum/glass, dark **M** monogram). Reuse across surfaces (OS, Earth, meok.ai):
- **Surfaces (light):** paper `#ece7dd` · cream `#faf7f1` · glass `rgba(255,255,255,.66)` + `1px rgba(255,255,255,.85)` border + blur · hairline `rgba(40,34,24,.12)`
- **Ink/text:** ink `#1d1d22` · dim (warm grey) `#6f6a61`
- **Accent — champagne gold (the through-line):** `#bd9d54` (on light) / `#e0c074` (on dark) · light gold `#d8bf86`
- **Spectrum (hero aurora / character cards):** coral `#e6a07c` · sage `#9dbe9a` · periwinkle `#b4b6e8` · lavender `#cbb7df`
- **Status:** good/sage `#6fae85` · warn/amber `#cf9a3c` · bad/coral `#d9756a`
- **Logo:** dark rounded-square `linear-gradient(150deg,#2a2a31,#15151a)` with light `M` (`#f3ede0`)
- **Type:** `-apple-system, "SF Pro Display", Inter`; tight-tracked bold headings
- **MEOK Earth** keeps the dark "sovereign space" globe but uses the same gold accent (ring/arcs/headers) — gold-on-dark = premium. Governed=green `#39d98a`, flagged=red `#ff5d5d`, King=gold are semantic, kept.

The dark-navy/teal v1 OS theme is retired. `MEOK_OS/index.html` was rethemed in place (every class kept; JS untouched; 17 apps, boots clean).

**meok.ai alignment (2026-06-24):** `meok-ai/ui/src/app/globals.css` was already on the cream/gold sovereign base (`--cream #FAF9F6`, `--gold #c9a84c`, `--accent-sovereign`). Added the missing **Sovereign Emergence spectrum** (`--spectrum-coral/sage/periwinkle/lavender`), `--champagne`, `--aurora` (hero gradient), `--m-mark` — additive only (new vars, no render change). Live Next.js app → visibly applying them + deploy is **owner-gated** (not done here). Now OS + Earth + meok.ai share one token system.

## Honest status
Forward build (a `meok-town-view` sprint), **not owner-key-gated** — but also not a today-thing. Binding rule still holds (`sovereign-town/ARCHITECTURE_GUARDRAIL.md`): the globe **reads** the ledger; it never runs the sim. Full source docs: `/tmp/hunt/` (extracted from the zip) — re-extract from `~/Downloads/MASSIVE_HUNT_COMPLETE_PACKAGE.zip` if needed.
