# MEOK.AI "SOVEREIGN OS" — Crown Jewels Report 2026
## The Absolute Latest in 3D Web Visualization, WebGPU, Spatial Computing & Next-Gen UI/UX

---

## 1. Three.js WebGPURenderer — Production-Ready (r171+)
**Links:**
- https://threejs.org/docs/index.html#manual/en/introduction/WebGPU-support
- https://www.utsubo.com/blog/webgpu-threejs-migration-guide

**What it does:**
The zero-config WebGPU renderer for Three.js ships with `import { WebGPURenderer } from 'three/webgpu'`. It automatically falls back to WebGL 2 on unsupported browsers. Since Safari 26 shipped WebGPU in September 2025, ALL major browsers now support WebGPU (Chrome/Edge since v113, Firefox since v141, Safari 26+).

**Why it's a crown jewel for MEOK:**
- Swap one import line to go from WebGL to WebGPU
- 10-100x performance improvement for particle systems (50,000 → 1,000,000+ particles)
- Compute shaders for GPU-side physics, collision detection, real-time data filtering
- TSL (Three Shader Language) compiles to both WGSL (WebGPU) and GLSL (WebGL) — write once
- `BatchedMesh` and enhanced instancing cut draw calls by 90%+
- r184 (March 2026) eliminated per-frame object allocations that were generating 240K-500K unnecessary objects/sec

**Integration recommendation:**
```typescript
import * as THREE from 'three/webgpu';
import { WebGPURenderer } from 'three/webgpu';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init(); // Required before first render
// Auto-falls back to WebGL 2 if WebGPU unavailable
```

**License:** MIT (Three.js core)

---

## 2. TSL (Three Shader Language) — The New Shader Standard
**Links:**
- https://threejs.org/examples/?q=tsl#webgpu_tsl_editor
- https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026

**What it does:**
TSL is a node-based JavaScript shader system. Write shaders as JS function compositions that compile to WGSL (WebGPU) and GLSL (WebGL). Full access to compute shaders, storage buffers, instancedArray for GPU-persistent data.

**Why it's a crown jewel for MEOK:**
- Single codebase for both WebGPU and WebGL shaders — no dual maintenance
- Compute shaders enable 1M+ particle constellations for MEOK's globe
- Storage buffers persist across frames — ideal for real-time data streams
- `instancedArray(count, 'vec3')` creates persistent GPU buffers
- Visual node editor "TSL Graph" emerging for non-engineers

**Integration recommendation:**
```typescript
import { Fn, uv, vec4, time, sin, positionLocal, normalLocal } from 'three/tsl';

// Animated displacement in TSL
const wobble = Fn(() => {
  const t = time.mul(2.0);
  const displacement = sin(positionLocal.x.mul(10.0).add(t)).mul(0.1);
  return positionLocal.add(normalLocal.mul(displacement));
});
```

**License:** MIT

---

## 3. WebGPU RenderPipeline (TSL Post-Processing) — Bloom, DoF, Vignette
**Links:**
- https://threejs.org/docs/index.html#api/en/renderers/common/RenderPipeline
- https://threejsroadmap.com/blog/the-complete-guide-to-threejs-post-processing-in-2026

**What it does:**
Node-based post-processing pipeline built for WebGPURenderer. Effects are composable functions: `bloom()`, `dotScreen()`, `rgbShift()`, `gaussianBlur()`. Chain them like regular function calls. Auto tone mapping, color space conversion, resize handling.

**Why it's a crown jewel for MEOK:**
- MEOK's "particle constellations with bloom" becomes trivial: `bloom(scenePass, { threshold: 0.8, intensity: 1.5 })`
- Chromatic aberration + vignette for Sovereign OS "helmet visor" aesthetic
- PerformanceMonitor for adaptive DPR — maintain 60fps automatically
- Depth-aware compositing (False Earth demonstrated dual-scene depth compositing for sharp beams behind blurred terrain)

**Integration recommendation:**
```typescript
import { bloom, pass } from 'three/tsl';

const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
const bloomPass = bloom(scenePass, { threshold: 0.8, intensity: 1.5 });
postProcessing.outputNode = bloomPass;
```

**License:** MIT

---

## 4. gpu-curtains — WebGPU 3D Engine That Syncs Shaders to DOM
**Links:**
- https://github.com/martinlaxenaire/gpu-curtains
- https://martinlaxenaire.github.io/gpu-curtains/
- https://www.webgpu.com/showcase/gpu-curtains-webgpu-syncs-shaders-dom/

**What it does:**
A full WebGPU 3D engine that turns HTML `<div>` elements into shader-driven 3D meshes. DOM elements automatically become textured planes with CSS-style transforms. Includes lights, shadows, glTF, raycasting, deferred rendering, compute shaders, render bundles, instancing.

**Why it's a crown jewel for MEOK:**
- MEOK's Liquid Glass UI panels can be actual DOM elements with WebGPU shaders applied
- No coordinate math — DOM elements automatically map to 3D geometry
- Ornament toolbars (visionOS-style) become `<div>` elements with glass shaders
- Full engine underneath if MEOK needs standalone 3D rendering
- Martin's portfolio (built on gpu-curtains) is a playable WebGPU experience

**Integration recommendation:**
```typescript
import { GPUCurtains } from 'gpu-curtains';

const gpuCurtains = new GPUCurtains({ container: '#canvas' });
await gpuCurtains.setDevice();
// Point at DOM elements — they become 3D automatically
```

**License:** MIT

---

## 5. deck.gl v9.3 (April 2026) — 3D Tiles & Terrain Controller
**Links:**
- https://deck.gl/docs/whats-new
- https://deck.gl/docs/api-reference/geo-layers/terrain-layer

**What it does:**
Major release with TerrainController (auto-adjusts camera for 3D tilesets), `pickable: '3d'` for depth picking, CSS-style view layouts (`calc(50% - 10px)`), GlobeController fixes, 3D Tiles integration guide. All widgets have React wrappers from `@deck.gl/react`.

**Why it's a crown jewel for MEOK:**
- MEOK's conspiracy map (ArcLayer, HexagonLayer) gets terrain-aware navigation
- `pickable: '3d'` returns actual 3D coordinates on picked geometry — essential for globe interactions
- TimelineWidget, StatsWidget, ThemeWidget all support controlled/uncontrolled patterns
- SplitterWidget for dividing canvas (left/right panel layouts)
- Works seamlessly with CesiumJS for the 350M buildings globe

**Integration recommendation:**
```typescript
import { ArcLayer, HexagonLayer } from '@deck.gl/layers';
import { TerrainController } from '@deck.gl/core';

// Enable 3D picking on all layers
new ArcLayer({ pickable: '3d', ... });
```

**License:** MIT

---

## 6. Gaussian Splatting Web Viewers — Photorealistic 3D in Browser
**Links:**
- https://swyvl.io/blog/best-gaussian-splat-viewers/
- https://github.com/BladeTransformerLLC/gauzilla (MIT)
- https://github.com/dylanebert/gsplat

**What it does:**
Multiple production-ready Gaussian Splatting renderers for web: **Spark** (React/Three.js, best .spz support, iPhone 14+ 60fps), **mkkellogg/GaussianSplats3D** (best .kslat, multi-splat scenes), **Gauzilla Pro** (Rust/WASM, AI segmentation, 4D time-lapse), **gsplat** (by Luma AI, WebGL/WebGPU).

**Why it's a crown jewel for MEOK:**
- MEOK's globe can overlay photorealistic 3D buildings/landmarks via Gaussian Splats
- Real-time 60fps rendering of millions of Gaussian primitives
- KHR_gaussian_splatting glTF extension being ratified in 2026 — universal format
- 4D Gaussian Splatting for dynamic scenes (concerts, events)
- CesiumJS supports GS viewing through 3D Tiles

**Integration recommendation:**
```typescript
// For Three.js: mkkellogg/GaussianSplats3D
import { GaussianSplats3D } from '@mkkellogg/gaussian-splats-3d';

// For React/Three.js: Spark
import { SplatLoader } from '@sparkjs/core';
const splat = await new SplatLoader().loadAsync('scene.ply');
scene.add(splat);
```

**License:** MIT (varies by viewer)

---

## 7. False Earth — Procedural Planet (WebGPU + TSL + R3F)
**Links:**
- https://github.com/momentchan/false-earth
- https://tympanus.net/codrops/2026/04/21/false-earth-from-webgl-limits-to-a-webgpu-driven-world/
- https://www.webgpu.com/showcase/false-earth-procedural-planet-webgpu/

**What it does:**
An astronaut walks an infinite procedural planet with 1M+ GPU-computed grass blades, Voronoi clumping, wind simulation, FBM terrain, VAT-animated flowers. Built with React Three Fiber + WebGPU compute shaders + TSL. Features indirect drawing, async compilation, depth-aware post-processing.

**Why it's a crown jewel for MEOK:**
- The EXACT blueprint for MEOK's globe: procedural infinite terrain, GPU compute, LOD
- Indirect drawing architecture: GPU decides what to render via compute shader output
- AsyncCompile wrapper prevents startup freezes — compiles in parallel, uploads FIFO
- PCG hashing for tile-free patterns (no visible grid)
- PerformanceMonitor for adaptive DPR

**Integration recommendation:**
Study the architecture for MEOK's globe rendering pipeline. Copy the grass/terrain compute shader patterns for the 350M buildings dataset.

**License:** N/A (reference study — author: Ming-Jyun Hung)

---

## 8. Liquid Glass CSS/SVG Implementation — iOS 26 Design Language
**Links:**
- https://freefrontend.com/css-liquid-glass/
- https://hiredigital.com/tools/liquid-glass-css-generator
- https://github.com/naughtyduk/liquidGL
- https://kube.io/blog/liquid-glass-css-svg

**What it does:**
Apple's Liquid Glass design system (iOS 26, WWDC 2025) replicated for web using CSS `backdrop-filter` + SVG filters (`feTurbulence`, `feDisplacementMap`, `feSpecularLighting`). Includes real-time refraction, specular highlights, lens effects. Multiple generators and code snippets available.

**Why it's a crown jewel for MEOK:**
- MEOK's "Liquid Glass Sovereign" design system maps directly to Apple's Liquid Glass
- `backdrop-filter: url(#liquidGlassFilterId)` applies true refraction in Chrome
- Glass cards, floating CTAs, ornament toolbars all achievable
- `glasscn-ui` library provides glassmorphism variants for shadcn/ui components
- `liquidGL` is an ultra-light WebGL glassmorphism library (~2KB)

**Integration recommendation:**
```css
/* Pure CSS + SVG Liquid Glass */
.glass-panel {
  background: rgba(255, 255, 255, 0.12);
  backdrop-filter: blur(1px) url(#lg-filter) blur(2px) saturate(1.5) brightness(1.1);
  -webkit-backdrop-filter: blur(8px) saturate(1.8) brightness(1.15);
  box-shadow:
    inset 0 0 0 1px rgba(255, 255, 255, 0.15),
    inset 1.5px 1.5px 0 rgba(255, 255, 255, 0.5),
    inset 0 0 12px rgba(255, 255, 255, 0.2),
    0 8px 32px rgba(0, 0, 0, 0.2);
}
```

**License:** MIT (varies)

---

## 9. @pixiv/three-vrm v3 — WebGPU VRM Avatar Support
**Links:**
- https://github.com/pixiv/three-vrm
- https://pixiv.github.io/three-vrm/docs/modules/three-vrm-materials-mtoon.html

**What it does:**
VRM (Virtual Avatar) loader for Three.js. v3.0 adds WebGPU support via `MToonNodeMaterial`. Supports MToon toon shading, outline rendering, expression morphs, bone animation, spring physics. Works with `WebGPURenderer` via the `materialType` option.

**Why it's a crown jewel for MEOK:**
- MEOK's VRM avatar (Virtual Avatar SDK) now works with WebGPU renderer
- `MToonNodeMaterial` — WebGPU-compatible toon shader for anime-style avatars
- Full expression morph support (emotions, lip sync)
- Spring bone physics for hair/clothing
- Drag-and-drop VRM loading with auto-rigging

**Integration recommendation:**
```typescript
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { VRMLoaderPlugin, MToonMaterialLoaderPlugin } from '@pixiv/three-vrm';
import { MToonNodeMaterial } from '@pixiv/three-vrm/nodes';

const loader = new GLTFLoader();
loader.register((parser) => {
  const mtoonPlugin = new MToonMaterialLoaderPlugin(parser, {
    materialType: MToonNodeMaterial, // WebGPU compatible
  });
  return new VRMLoaderPlugin(parser, { mtoonMaterialPlugin: mtoonPlugin });
});
```

**License:** MIT

---

## 10. LFM2-MoE via WebGPU — 8.3B Parameter AI in Browser
**Links:**
- https://huggingface.co/LiquidAI
- https://www.webgpu.com/showcase/false-earth-procedural-planet-webgpu/
- https://betterstack.com/community/guides/ai/liquid-ai-lfm2/

**What it does:**
Liquid AI's LFM2-MoE loads 8.3B parameters (1.5B active per token) and runs entirely in-browser via WebGPU using Transformers.js. Hybrid convolution-attention architecture. 32K context window. 10-100x faster than WASM fallback.

**Why it's a crown jewel for MEOK:**
- MEOK's Sovereign AI can run client-side — zero server dependency
- 8.3B parameter model generates text, answers queries, processes data locally
- WebGPU-accelerated inference on consumer hardware
- Vision-language models (LFM2-VL) for image understanding
- Audio models for speech recognition/synthesis

**Integration recommendation:**
```typescript
import { pipeline } from '@huggingface/transformers';

const generator = await pipeline('text-generation', 'LiquidAI/LFM2-8B-A1B', {
  device: 'webgpu',
  dtype: 'q4', // 4-bit quantized for browser
});
const result = await generator('Sovereign OS command: ', { max_new_tokens: 100 });
```

**License:** Model license varies (typically Apache 2.0 / MIT for runtime)

---

## 11. Transformers.js v4 — Browser AI with WebGPU
**Links:**
- https://huggingface.co/docs/transformers.js
- https://github.com/huggingface/transformers.js

**What it does:**
Hugging Face's library runs 150+ model architectures entirely in-browser via WebAssembly or WebGPU. 1,200+ pre-converted ONNX models. Tasks: text generation, sentiment analysis, translation, image segmentation, speech recognition, embeddings, object detection.

**Why it's a crown jewel for MEOK:**
- MEOK can process data (globe analytics, conspiracy maps) client-side with AI
- Semantic search across the 3D force graph — search by meaning, not keywords
- Speech recognition for voice commands ("Navigate to Sector 7")
- Zero API costs, total privacy, offline capable
- `device: 'webgpu'` for 10-100x speedup over WASM

**Integration recommendation:**
```typescript
import { pipeline } from '@huggingface/transformers';

// Semantic search for MEOK's conspiracy map
const extractor = await pipeline('feature-extraction', 'mixedbread-ai/mxbai-embed-xsmall-v1', {
  device: 'webgpu',
});
const embeddings = await extractor(documents, { pooling: 'mean', normalize: true });
```

**License:** Apache 2.0

---

## 12. stats-gl — WebGPU Performance Monitoring
**Links:**
- https://github.com/RenaudRohlinger/stats-gl

**What it does:**
Real-time FPS, CPU, GPU timing for WebGL and WebGPU. TSL node capture for live preview of render targets, MRT outputs, post-processing passes. Works in main thread and Web Workers. Texture preview panels.

**Why it's a crown jewel for MEOK:**
- Monitor MEOK's complex scene (globe + particles + UI) performance in real-time
- TSL `.toStatsGL()` captures any node for live debugging
- GPU timing queries for WebGPU — identify bottlenecks
- Track compute shader timing (WebGPU only) — essential for particle systems

**Integration recommendation:**
```typescript
import Stats from 'stats-gl';

const stats = new Stats({ trackGPU: true, trackCPT: true });
stats.init(renderer);
document.body.appendChild(stats.dom);

// In render loop
stats.begin();
renderer.render(scene, camera);
stats.end();
```

**License:** MIT

---

## 13. 3d-force-graph v1.80 — 3D Conspiracy Map
**Links:**
- https://github.com/vasturiano/3d-force-graph
- https://vasturiano.github.io/3d-force-graph/

**What it does:**
3D force-directed graph using Three.js and d3-force-3d. Supports 10K+ nodes, custom node/link rendering, bloom effects, particle trails, directional arrows, clustering. VR mode built-in. Latest v1.80 (April 2026) with latest Three.js compatibility.

**Why it's a crown jewel for MEOK:**
- MEOK's "conspiracy map of domains" is this library's exact use case
- Supports custom node geometries (avatars, icons, 3D models)
- Link particles for data flow visualization
- Force-directed layout naturally organizes domain relationships
- VR mode for immersive conspiracy map exploration

**Integration recommendation:**
```typescript
import ForceGraph3D from '3d-force-graph';

const graph = ForceGraph3D()(document.getElementById('graph'))
  .graphData(data)
  .nodeAutoColorBy('group')
  .linkDirectionalParticles(2)
  .linkDirectionalParticleSpeed(0.01);
```

**License:** MIT

---

## 14. Gauzilla Pro — Rust/WASM Gaussian Splatting
**Links:**
- https://github.com/BladeTransformerLLC/gauzilla
- https://www.gauzilla.xyz
- https://www.webgpu.com/showcase/gauzilla-rust-gaussian-splatting-digital-twins/

**What it does:**
Browser-based Gaussian Splatting platform built in Rust compiling to WebAssembly. No CUDA/PyTorch dependencies. AI-powered segmentation isolates complex geometry. 4D time-lapse for construction progress tracking. Open-source renderer.

**Why it's a crown jewel for MEOK:**
- Photorealistic 3D reconstructions of real-world locations for MEOK's globe
- AI segmentation to isolate buildings, infrastructure, terrain
- 4D time-lapse — watch cities evolve over time
- Rust/WASM means high performance without WebGPU requirement
- MIT-licensed core renderer

**Integration recommendation:**
Study the open-source renderer for integration with MEOK's CesiumJS globe. Use the platform for 3D content creation pipeline.

**License:** MIT (core renderer)

---

## 15. Spatial UI / IWSDK — Meta's 3D UI Framework
**Links:**
- https://developers.meta.com/horizon/documentation/web/iwsdk-concept-spatial-ui/
- https://webspatial.dev/

**What it does:**
Meta's IWSDK combines HTML/CSS authoring (Camp 1) with native 3D UI execution (Camp 2). UIKit uses Flexbox (Yoga) for layout with MSDF text and instanced panels. UIKitML provides HTML/CSS-like DSL. Vite plugin for zero-friction compilation.

**Why it's a crown jewel for MEOK:**
- MEOK's ornament toolbars (visionOS-style) can use Flexbox layout in 3D space
- Write UI in familiar HTML/CSS, render as native 3D panels
- Ray/grab/hand input support for WebXR
- DOM-like APIs: `getElementById()`, `querySelector()`
- webspatial.dev provides HTML/CSS 3D spatial capabilities

**Integration recommendation:**
Use for MEOK's WebXR mode — convert existing shadcn/ui components to spatial UI panels.

**License:** Varies (Meta SDK terms)

---

## 16. shadcn/ui Ecosystem 2026 — Glassmorphism & Animation
**Links:**
- https://github.com/birobirobiro/awesome-shadcn-ui
- https://adminlte.io/blog/shadcn-ui-block-libraries/

**What it does:**
The shadcn ecosystem has exploded in 2026. Key additions for MEOK:
- **glasscn-ui**: shadcn components with glassmorphism variants
- **fluid-functionalism**: Spring physics, proximity hover, font weight transitions
- **dotmatrix**: 55+ free loaders built with React/TypeScript/Tailwind/shadcn
- **trophy-ui**: Gamification components (streaks, achievements, leaderboards)
- **agents-ui**: LiveKit's voice agent interfaces

**Why it's a crown jewel for MEOK:**
- **glasscn-ui**: Direct Liquid Glass component variants for MEOK's UI
- **fluid-functionalism**: "Every animation serves a functional purpose" — matches MEOK's push navigation philosophy
- **dotmatrix**: Animated loaders for the sovereign OS boot sequence
- **trophy-ui**: Gamification for user engagement with the conspiracy map

**Integration recommendation:**
```bash
# Install glasscn-ui for Liquid Glass components
npx shadcn add glasscn-ui

# Install fluid-functionalism for physics-based animations
npx shadcn add fluid-functionalism

# Install dotmatrix for animated loaders
npx shadcn add dotmatrix
```

**License:** MIT (varies by library)

---

## 17. Three.js WebGPU Compute Physics — GPU-Side Simulation
**Links:**
- https://www.webgpu.com/showcase/threejs-webgpu-compute-physics/
- https://github.com/klevron/test-webgpu

**What it does:**
Thousands of instanced bodies tumble and collide with the ENTIRE physics step running on GPU through WebGPU compute and TSL. No CPU round trip. Velocities and positions update in parallel, rendered as single instanced mesh.

**Why it's a crown jewel for MEOK:**
- MEOK's particle constellations can have physics (gravity, collision, attraction)
- GPU-side simulation = zero CPU overhead for 100K+ bodies
- TSL compute shaders for particle behavior rules
- Pattern applies to any GPU-simulation: flow fields, boids, particle systems

**Integration recommendation:**
Study Kevin Levron's test-webgpu repo for compute shader patterns. Adapt for MEOK's particle constellation behaviors.

**License:** MIT (reference)

---

## 18. Evian WebGPU Bicentennial — Advanced Particles & SDF
**Links:**
- https://www.webgpu.com/showcase/evian-bicentennial-webgpu-world/

**What it does:**
Evian's 200th anniversary site: alpine scene with rain that lands on peaks and streaks downhill, wind texture every object obeys, lightning generated fresh on each strike, 20,000 particles colliding against SDF (Signed Distance Field) instead of meshes. All GPU-driven via WebGPU compute.

**Why it's a crown jewel for MEOK:**
- SDF collision for particles — rain/snow/debris that reacts to 3D geometry
- Wind texture as global force field — all particles affected uniformly
- Procedural lightning generation on GPU
- Pattern for MEOK's atmospheric effects on the globe

**Integration recommendation:**
Study SDF collision and wind texture patterns for MEOK's globe atmospheric effects.

**License:** N/A (reference)

---

## 19. Vortex Glass Sphere — TSL Procedural Effects
**Links:**
- https://github.com/MisterPrada/vortex-glass-sphere
- https://tympanus.net/codrops/2025/03/10/rendering-a-procedural-vortex-inside-a-glass-sphere-with-three-js-and-tsl/

**What it does:**
Procedural vortex inside a glass sphere using TSL. FBM noise, fractal Brownian motion, emission effects, `MeshPhysicalNodeMaterial` with dispersion, transmission, specular. Full Codrops tutorial.

**Why it's a crown jewel for MEOK:**
- The vortex pattern can be adapted for MEOK's globe data visualization (data "siphons")
- Glass sphere with `dispersion: 5.0` and `transmission: 1` — pure Liquid Glass in 3D
- `MeshPhysicalNodeMaterial` enables physically accurate glass rendering
- TSL workflow is the blueprint for all custom MEOK shaders

**Integration recommendation:**
```typescript
const material = new THREE.MeshPhysicalNodeMaterial({
  transmission: 1,
  dispersion: 5.0,
  ior: 1.5,
  clearcoat: 0.73,
  thickness: 0.3,
});
```

**License:** MIT

---

## 20. WebGPU Galaxy Simulation — 1M Particle Tutorial
**Links:**
- https://threejsroadmap.com/blog/galaxy-simulation-webgpu-compute-shaders

**What it does:**
Complete tutorial for building an interactive galaxy with 1M particles using WebGPU compute shaders. Storage buffers, deterministic randomness via hash functions, differential rotation, spiral arms, sprite rendering with additive blending.

**Why it's a crown jewel for MEOK:**
- Blueprint for MEOK's "particle constellations" around the globe
- 1M particles at 60fps — no CPU-GPU transfer after initialization
- Deterministic randomness (hash from particle index) = zero memory overhead
- Color mixing based on density (blue dense → orange sparse)
- Compute shader initialization runs in milliseconds

**Integration recommendation:**
Follow the tutorial pattern: `instancedArray(count, 'vec3')` for position/velocity buffers, compute shader for updates, sprite material with additive blending.

**License:** N/A (tutorial)

---

## EXECUTIVE SUMMARY: Top 10 Must-Haves for MEOK.AI

| Priority | Technology | Impact |
|----------|-----------|--------|
| 1 | Three.js WebGPURenderer (r171+) | 10-100x rendering performance, zero-config |
| 2 | TSL (Three Shader Language) | Single shader codebase for WebGPU + WebGL |
| 3 | TSL Post-Processing (bloom, DoF) | Sovereign OS visual effects pipeline |
| 4 | WebGPU Compute Shaders | 1M+ particle constellations, GPU physics |
| 5 | @pixiv/three-vrm v3 | WebGPU avatar rendering |
| 6 | deck.gl v9.3 | Terrain-aware conspiracy map, 3D Tiles |
| 7 | Liquid Glass CSS/SVG | iOS 26 design language for web |
| 8 | gpu-curtains | DOM-synced 3D for ornament toolbars |
| 9 | Transformers.js v4 | Client-side AI for sovereign intelligence |
| 10 | stats-gl | WebGPU performance monitoring |

---

*Report compiled: 2026*
*Sources: Three.js docs, WebGPU community, Codrops, deck.gl release notes, GitHub repos, Apple WWDC 2025*
