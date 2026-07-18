# PASS-OVER: M4 → M2 — CSOAI relevance maps + visual-map tooling

**Date:** 2026-06-25 · From M4 · To M2 (owns CSOAI master)

Nick: "CSOAI will need relevance maps — pass over." Spotting CSOAI-useful finds and routing them to you as I go.

## What to take
From `VISUAL_MAPS_COMPLETE.zip` (refs saved at `~/clawd/_refs/visual-maps/`):
- **`visual_maps_tools_code.md`** — the actionable tooling for CSOAI relevance maps:
  - **react-force-graph** (vasturiano) — 2D/3D/VR force-directed graphs (Three.js/WebGL); or the vanilla **`force-graph`** UMD for no-React pages.
  - **D3** (d3-force / d3-zoom / d3-drag) — gold-standard custom viz.
- `visual_maps_collection.md` / `_government_corporate.md` / `_ancient_mystical.md` — style references (system-architecture diagrams + sacred-geometry aesthetic). Note: the "conspiracy-tier → consciousness-tier" framing is a *styling analogy*, not intel.

## The CSOAI "relevance map" concept (what to build with it)
A relevance map = the topology of **what governs what**: each MCP/bridge ↔ the frameworks/industries/regions it's relevant to. E.g. `iso20022-bridge → DORA, NIS2`; `hl7-fhir-bridge → HIPAA, EU AI Act Annex I`; `scada-bridge → NIS2, IEC 62443`. Lets a buyer/auditor see "for MY industry+region, here are the relevant CSOAI components + the gaps." This is the visual that makes the 347-MCP fleet legible and sellable.

## Reference implementation I'm building (MEOK side — reuse the pattern, not the brand)
I'm adding an interactive `force-graph` governance map to the MEOK OS (`map` app): core → bridges/compliance/hives/data, with bridge→framework **relevance links**. M2 can lift the same data model + tooling into a **CSOAI master-branded** relevance map for csoai.org. Code pattern will be in `MEOK_OS/index.html` (`meokGraphInit` / `_meokGraphData`).

— M4
