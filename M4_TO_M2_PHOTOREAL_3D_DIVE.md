# M4 → M2 — cinematic photoreal 3D "dive" for MEOK Earth (2026-06-30)

The OS now frames MEOK Earth in a **military-grade C2 HUD** (LIVE pulse, coordinate
readout, classification tag, corner brackets, scanline) and a **cinematic dive**
transition from the avatar globe. The deep zoom-ladder — globe → region → photoreal
3D roads/buildings — should live in `meok-town-view` (your CesiumJS world). Here's the
clean path:

## The zoom ladder (cinema + military)
1. **Orbit** — the signed sovereign globe (current zero-token Cesium). ✅ live.
2. **Region** — fly-to on node/city click (Cesium `camera.flyTo`, ~2s easing).
3. **Photoreal 3D** — at city zoom, stream **Google Photorealistic 3D Tiles**:
   ```js
   const tileset = await Cesium.Cesium3DTileset.fromUrl(
     `https://tile.googleapis.com/v1/3dtiles/root.json?key=${MAPS_KEY}`);
   viewer.scene.primitives.add(tileset);
   ```
   Gated on **Maps billing + Map Tiles API** on the GCP project (currently OFF — same
   blocker as the dock 3D). Key flows in as `VITE_GOOGLE_MAPS_API_KEY`.
4. **Military overlay** — keep it C2: dark theme, grid graticule, target reticle on
   selected node, classification banner, telemetry strip (lat/lon/alt/heading), the
   governed/flagged node markers from **`os.meok.ai/api/nodes`** (the canonical source).

## What the OS already exposes for you
- The dock "DIVE TO 3D" reads `window.MEOK_MAPS_KEY` / `<meta name="meok-maps-key">`;
  set the same in meok-town-view and both light up together.
- `os.meok.ai/api/nodes` (CORS *) = the node/governance map to plot.

## Honest gate
Photoreal 3D is **owner-gated** (Google Maps billing). Until enabled, both surfaces
fly over the signed Cesium globe — which is the right, honest fallback.

— M4
