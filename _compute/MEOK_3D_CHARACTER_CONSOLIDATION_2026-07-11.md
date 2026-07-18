# 🐉 MEOK 3D character / Hatch / world — consolidation (Claude Code, 2026-07-11)

"We've done a lot for MEOK on this ages ago" — true. This absorbs the scattered prior work into one
map so the new Chinese-world-model capability **plugs into what exists** instead of rebuilding. Nothing
here is new design; it's reconciliation + the one real gap now fillable.

## What already exists (absorbed)
**Framework / canonical:**
- **MEOK Hatch** = the signed portable AI-OS artifact (`os.meok.ai/api/hatch`) — dual-brain + governance +
  A2A card + MCP + Letta .af + **"bootable 3D-OS body."** Docs: `MEOK_HATCH_AI_OS_MASTER_MAP_2026-07-01.md`,
  `MEOK_HATCH_CONSOLIDATION_2026-07-01.md`, `MEOK_HATCH_M4_CONTRIBUTION_2026-07-02.md`, `..._AS_MCP_AGENT`.

**The 3D body (live surfaces in `meok-os-deploy/`):**
- `character.html` — the three.js character stage. Skins: **emergence** (procedural orb) · **vrm**
  (`@pixiv/three-vrm`) · **rpm** (ReadyPlayerMe GLB via `GLTFLoader.load(url)`) · **creature**.
- `hatch-demo.html` — the `sovereign-embed.js` one-line embed. `sovspace3d.html` / `earth3d-photoreal.html` —
  the Cesium world body. `sovspace.html` — the space.

**Prior 3D-pipeline design (May 31, in `meok-3d-characters/`):**
- `meokai_character_factory_3d_production_pipeline.md`, `meokai_emergene_3d_gaming_architecture.md`,
  `meokai_os_unified_companion_blueprint.md` + architecture PNGs. A full character-factory design already drawn.

**MCPs:** `mcp-marketplace/meok-sovereign-avatar-mcp`, `meok-sovereign-vrm-mcp`; `csoai-os/meok_avatar_connector.py`.

## The ONE real gap (and it's now fillable)
Every character surface **loads externally-authored meshes** (RPM/VRM from third parties) or draws a
procedural orb. There are **zero sovereign-generated 3D mesh assets on disk** (`.glb/.vrm/.gltf` = none).
So the "3D-OS body" is real plumbing with **borrowed bodies**. That's the exact gap the Chinese world
models close — sovereign-*generated* assets:

| Gap | Fills it | Route (from CHINESE_WORLD_MODELS_SCOUT) |
|---|---|---|
| No sovereign character mesh | **Hunyuan3D-2.1** | ✅ `_compute/sov33_hunyuan3d_hatch.ipynb` (Colab T4, free) — ref art → `.glb` |
| No sovereign 3D world | **HY-World 2.0** | rented A100 → export 3DGS → serve in `sovspace3d.html` |

## The wiring (closes the loop — no rebuild)
1. Run **`sov33_hunyuan3d_hatch.ipynb`** on Colab T4 (built today). Input: the existing reference art
   `meok-3d-characters/*` (or a text→image). Output: `hatch.glb` (textured) + signed provenance.
2. Commit `hatch.glb` → `meok-os-deploy/models/hatch.glb`.
3. **`character.html` already has `GLTFLoader.load(url)`** (the RPM path) — add a `hatch` skin pointing at
   `/models/hatch.glb`. One function, reuses the existing loader. The sovereign now wears a
   **sovereign-generated** body, served free (client-GPU WebGL), verifiable (signed asset).

## Honest state
- The framework (Hatch), the body surfaces (character.html/sovspace3d), and the design (character factory)
  all **already exist and are live** — the prior work stands.
- What was missing = **generated assets**, which was GPU-gated. The notebook unblocks the character mesh
  now (free Colab); worlds stay A100-gated (generate-once-serve-free pattern).
- Don't rebuild character.html or the Hatch framework — **feed them.** The new capability is one `.glb`
  drop + one loader line away from live.

## Next concrete steps
1. Run the Hunyuan3D notebook (browser/Colab) → first sovereign `hatch.glb`.
2. Add the `hatch` skin to `character.html` (1 function) + commit `models/hatch.glb`.
3. Later: batch HY-World 2.0 worlds on a rented A100 for `sovspace3d.html`.
