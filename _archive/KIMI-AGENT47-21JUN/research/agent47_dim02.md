# Dimension 2: WebGPU Visual Pipeline — Next-Gen Rendering & Graphics

## Agent-47 Visual System Upgrade Research Brief
**Date**: June 2025
**Status**: WebGPU production-ready (Three.js r171+, Jan 2026 baseline)
**Searches**: 18 independent queries across WebGPU migration, compute shaders, instancing, post-processing, avatars, LOD, procedural generation

---

## 1. Executive Summary

WebGPU has reached universal browser support as of Safari 26 (September 2025), making it the definitive rendering API for next-generation web-based 3D experiences [^300^]. Three.js r171+ provides zero-configuration WebGPU imports with automatic WebGL 2 fallback, reducing migration from a multi-week project to hours in many cases [^337^]. **For Agent-47, the WebGPU migration unlocks four critical capabilities**: (1) compute shaders for GPU-driven pheromone diffusion and agent pathfinding, (2) 10-100x particle count increases for trail rendering, (3) TSL-native post-processing with MRT support for GI/SSR/AO, and (4) GPU instancing for 50+ animated avatars at 60fps.

Key performance benchmarks from primary sources:
- Segments.ai: **100x performance improvement** migrating LiDAR point cloud processing from WebGL to WebGPU [^300^]
- Expo 2025 Osaka: **1 million particles** at 60fps on 4K display with body tracking [^337^]
- Compute shaders: 10,000 CPU particles at 30ms → 100,000 GPU particles at <2ms (**150x improvement**) [^336^]
- Three.js WebGPU: 2.7M weekly npm downloads, 270x more than Babylon.js [^300^]

---

## 2. WebGPU Migration from WebGL (Three.js r171+)

### 2.1 Migration Path: One-Line Renderer Swap

Three.js r171 (September 2025) made WebGPU production-ready. The migration is intentionally minimal [^337^] [^484^]:

```javascript
// Before (WebGL)
import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer({ antialias: true });

// After (WebGPU)
import * as THREE from 'three/webgpu';
const renderer = new THREE.WebGPURenderer({ antialias: true });
await renderer.init(); // MUST await async initialization
```

**Critical migration steps for Agent-47** [^337^]:
1. Update Three.js to r171+ (`npm install three@latest`)
2. Swap import to `three/webgpu` — includes renderer, materials, lights, automatic WebGL 2 fallback
3. Add `await renderer.init()` before rendering — WebGPU initialization is asynchronous
4. Convert custom GLSL shaders to TSL (Three Shading Language) for cross-platform compilation
5. Update post-processing from `EffectComposer` to `PostProcessing` with TSL nodes
6. Implement `navigator.gpu` feature detection for graceful degradation

### 2.2 Browser Support (January 2026)

| Browser | WebGPU Support | Notes |
|---------|---------------|-------|
| Chrome/Edge | v113+ (May 2023) | Full support |
| Firefox | v141+ Windows, v145+ macOS | Enabled by default |
| Safari | v26+ (September 2025) | macOS, iOS, iPadOS, visionOS |

**Global coverage: ~95% WebGPU-capable; remaining 5% gets automatic WebGL 2 fallback** [^337^]

### 2.3 React Three Fiber Integration

R3F supports WebGPU via the async `gl` prop factory pattern [^337^]:

```jsx
import { Canvas } from '@react-three/fiber';
import * as THREE from 'three/webgpu';

<Canvas gl={async (canvas) => {
  const renderer = new THREE.WebGPURenderer({ canvas });
  await renderer.init();
  return renderer;
}}>
  {/* Scene content */}
</Canvas>
```

Most Drei components work unchanged. Key pitfall: must use `three/webgpu` consistently — don't mix `three` (WebGL) and `three/webgpu` imports [^337^].

### 2.4 Performance Decision Matrix

| Scenario | Recommendation |
|----------|---------------|
| New project (Agent-47 v2) | **Start with WebGPU** |
| 50k+ particles / high draw calls | **Migrate** — 10-100x gains |
| Heavy custom GLSL (pheromone shaders) | Evaluate TSL conversion |
| Complex post-processing (GI/SSR/AO) | **Migrate** — native MRT support |
| GPU instancing for 50+ avatars | **Migrate** — more efficient buffer mgmt |

---

## 3. Compute Shaders: Pheromone Diffusion & Agent Pathfinding

### 3.1 Compute Shader Architecture

Compute shaders are the single most transformative feature of WebGPU for Agent-47. They run on the GPU without rendering anything — processing data in parallel across thousands of GPU cores [^482^]. The pattern is [^340^]:

```javascript
import { Fn, instancedArray, instanceIndex, deltaTime } from 'three/tsl';

// 1. Create GPU storage buffer
const count = 100000; // 100k pheromone particles
const positionArray = instancedArray(count, 'vec3');

// 2. Define compute shader in TSL
const computeShader = Fn(() => {
  const position = positionArray.element(instanceIndex);
  // Diffusion + decay logic
  position.addAssign(velocity.mul(deltaTime));
  // Pheromone trail decay
  intensityArray.element(instanceIndex).mulAssign(decayRate);
})().compute(count);

// 3. Dispatch
renderer.compute(computeShader);
```

**Key principle**: Data that stays on the GPU avoids CPU-GPU transfer bottleneck. If compute output is used only for rendering, keep it in GPU buffers and bind directly to the render pipeline [^482^].

### 3.2 Pheromone Trail Implementation

For Agent-47's pheromone trails, compute shaders enable:

1. **Trail deposition**: Each agent deposits pheromone intensity via compute shader atomic adds to a grid texture
2. **Diffusion**: Parallel Gaussian blur / reaction-diffusion on the GPU each frame
3. **Decay**: Exponential decay per-cell via simple multiplication
4. **Pathfinding queries**: Agents sample pheromone grid via texture reads in their movement compute shader

Relevant implementation pattern from reaction-diffusion compute shaders in WebGPU [^653^]:

```wgsl
@compute @workgroup_size(8, 8, 1) fn compute() {
  let id = globalId.xy;
  // Sample neighbors for diffusion
  let center = textureLoad(inputTex, id, 0);
  let north = textureLoad(inputTex, id + vec2(0, 1), 0);
  let south = textureLoad(inputTex, id + vec2(0, -1), 0);
  let east = textureLoad(inputTex, id + vec2(1, 0), 0);
  let west = textureLoad(inputTex, id + vec2(-1, 0), 0);
  // Diffusion + decay
  let diffused = (center + north + south + east + west) * 0.2 * decayFactor;
  textureStore(outputTex, id, diffused);
}
```

### 3.3 Agent Pathfinding on GPU

For 47+ agents, GPU-based pathfinding follows the boids/flocking pattern [^603^]:

- **Separation**: Each agent reads neighbor positions from spatial hash grid, applies repulsion force
- **Alignment**: Average velocity of neighbors, steer toward match
- **Cohesion**: Average position of neighbors, steer toward center
- **Pheromone following**: Sample trail intensity in forward arc, steer toward strongest
- **Obstacle avoidance**: Ray-cast against BVH (via three-mesh-bvh compute) [^526^]

All five rules execute in a single compute dispatch per frame, with results staying in GPU buffers for direct rendering.

### 3.4 Performance Projections

| Workload | WebGL (CPU) | WebGPU (GPU Compute) | Speedup |
|----------|------------|---------------------|---------|
| 10,000 particles update | 30ms/frame | <2ms/frame | **150x** [^336^] |
| 100,000 pheromone cells | Not feasible | <1ms/frame | **N/A** |
| 1M particle system | ~5 FPS | 60 FPS | **12x+** [^300^] |
| 47 agent pathfinding | CPU-bound | GPU parallel | **10-50x** |

---

## 4. GPU Instancing for 50+ Avatars

### 4.1 InstancedMesh for Static Crowds

For non-animated background elements, `InstancedMesh` reduces draw calls by 90%+ [^336^]:

```javascript
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshStandardMaterial();
const mesh = new THREE.InstancedMesh(geometry, material, 1000);

// Set per-instance transforms
const matrix = new THREE.Matrix4();
for (let i = 0; i < 1000; i++) {
  matrix.setPosition(Math.random() * 100, 0, Math.random() * 100);
  mesh.setMatrixAt(i, matrix);
}
```

### 4.2 Animated Crowd Rendering (Skinned Instancing)

For 47 animated humanoid avatars, two approaches exist:

**Approach A: GPU Skinning with Animation Texture (GPU Gems 3)** [^552^]
- Encode all animation frames into a texture (bone matrices per frame)
- Vertex shader reads bone matrices from texture using `SV_InstanceID`
- Achieved 10,000 independently animating characters at 30fps on 2008 hardware
- Extended to 100,000+ characters with modern ECS approaches [^558^]

**Approach B: InstancedSkinnedMesh with LOD (Community Implementation)** [^52^]
- Each instance has individual animation state via bone texture atlas
- LOD system reduces bone count for distant instances
- LOD 0: 67 bones, 1MB texture → LOD 1: 14 bones, 0.06MB texture
- Automatic bone remapping — lower LOD skips finger/foot bones

### 4.3 Avatar Instancing Strategy for Agent-47

Recommended hybrid approach for 47 humanoid avatars:

1. **Shared base skeleton**: All 47 agents use same 50-60 bone rig
2. **Animation texture atlas**: All walk/run/idle animations packed into single texture
3. **Per-instance animation state**: Each agent stores current animation + frame offset in instance buffer
4. **GPU skinning in vertex shader**: Bone matrices sampled from animation texture
5. **Frustum culling + LOD**: CPU-side culling; GPU-side LOD selection

Expected performance: **47 skinned avatars easily achievable at 60fps** — well within WebGPU capabilities. Modern approaches handle 10,000+ [^552^].

### 4.4 BatchedMesh for Draw Call Reduction

`BatchedMesh` (Three.js built-in) provides another path for reducing draw calls when avatars share geometry but have different materials [^534^]:

```javascript
const batchedMesh = new THREE.BatchedMesh(maxCount, maxVertexCount, maxIndexCount);
const geometryId = batchedMesh.addGeometry(baseGeometry);
const instanceId = batchedMesh.addInstance(geometryId);
```

Note: `BatchedMesh` is newer and may have edge cases with complex scenes [^532^]. For Agent-47's 47 avatars, `InstancedMesh` with custom GPU skinning is the proven path.

---

## 5. Real-Time Effects: GI, SSR, SSAO/GTAO

### 5.1 Ground Truth Ambient Occlusion (GTAO)

Three.js WebGPU includes native GTAO post-processing node [^597^] [^629^]:

```javascript
import { ao, denoise, bloom, pass, mrt, output, normalView } from 'three/tsl';

const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({
  output: output,
  normal: normalView
}));

const sceneDepth = scenePass.getTextureNode('depth');
const sceneNormal = scenePass.getTextureNode('normal');
const sceneColor = scenePass.getTextureNode('output');

// GTAO with denoise
const aoPass = ao(sceneDepth, sceneNormal, camera);
aoPass.resolutionScale = 1.0;
const aoDenoise = denoise(aoPass.getTextureNode(), sceneDepth, sceneNormal, camera).mul(sceneColor);
```

**GTAO characteristics** (from Intel XeGTAO implementation) [^602^]:
- Based on Jimenez et al., 2016 "Practical Realtime Strategies for Accurate Indirect Occlusion"
- Slice-based sampling with horizon angle computation
- Supports bent normals (directional component) — 25% performance cost
- Denoising: 5x5 depth-aware spatial filter + optional TAA
- Auto-tuning against ray-traced reference for accuracy

### 5.2 Screen Space Reflections (SSR)

Three.js WebGPU includes native SSR example [^561^]:

```javascript
// SSR via TSL with MRT
const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({
  output: output,
  normal: normalView,
  metalrough: vec2(metalness, roughness)
}));

// SSR reads depth, normal, metalness/roughness
const ssrPass = ssr(sceneColor, sceneDepth, sceneNormal, metalRough, camera);
```

Key SSR parameters [^559^]:
- `steps`: Max ray march steps (default: 30)
- `refineSteps`: Binary search refinement steps
- `thickness`: Surface thickness for intersection
- `resolutionScale`: Render at lower res for performance
- Jittering for roughness-aware blurry reflections

### 5.3 Surfel-Based Global Illumination

A cutting-edge approach for WebGPU global illumination uses surfels (surface elements) with BVH ray tracing via `three-mesh-bvh` [^526^]:

- **Surfel generation**: Points sampled on scene surfaces store irradiance
- **Ray tracing**: `three-mesh-bvh` emulates ray tracing with compute shaders
- **Bounce accumulation**: Indirect lighting accumulated over frames
- **Denoising**: Spatial + temporal filtering

This approach enables "AAA-level" GI in the browser, built entirely on WebGPU compute [^533^].

### 5.4 Multiple Render Targets (MRT)

MRT is the foundation for efficient post-processing in WebGPU. It captures color, depth, normals, and material properties in a single geometry pass [^431^]:

```javascript
import { pass, mrt, output, normalView, metalness, roughness, directionToColor, vec2 } from 'three/tsl';

const scenePass = pass(scene, camera);
scenePass.setMRT(mrt({
  output: output,           // Color
  normal: directionToColor(normalView),  // Normals
  metalrough: vec2(metalness, roughness), // Material props
}));

// Access individual buffers
const color = scenePass.getTextureNode('output');
const depth = scenePass.getTextureNode('depth'); // Always available
const normal = scenePass.getTextureNode('normal');
const metalRough = scenePass.getTextureNode('metalrough');
```

**Performance impact**: Without MRT, each post-processing effect requires re-rendering the scene. With MRT, geometry is processed once and all effects sample the cached buffers — **2-3x faster for multi-effect pipelines** [^431^].

---

## 6. Post-Processing Pipeline

### 6.1 TSL-Native Post-Processing

The new `PostProcessing` class replaces `EffectComposer` for WebGPU [^431^] [^337^]:

```javascript
import { bloom, pass, denoise, ao } from 'three/tsl';

const postProcessing = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);
const sceneColor = scenePass.getTextureNode('output');

// Bloom
const bloomPass = bloom(sceneColor, {
  threshold: 0.8,
  intensity: 1.5
});

// Combine
postProcessing.outputNode = sceneColor.add(bloomPass);
```

### 6.2 Agent-47 Recommended Pipeline

Based on TSL examples [^629^] [^431^], the recommended post-processing stack:

```javascript
const composer = new THREE.PostProcessing(renderer);
const scenePass = pass(scene, camera);

// MRT: capture normals for AO
scenePass.setMRT(mrt({
  output: output,
  normal: normalView
}));

const sceneColor = scenePass.getTextureNode('output');
const sceneDepth = scenePass.getTextureNode('depth');
const sceneNormal = scenePass.getTextureNode('normal');

// 1. GTAO (Ground Truth Ambient Occlusion)
const aoPass = ao(sceneDepth, sceneNormal, camera);
aoPass.resolutionScale = 1.0;
const aoDenoise = denoise(aoPass.getTextureNode(), sceneDepth, sceneNormal, camera).mul(sceneColor);

// 2. Screen Space Reflections (for metallic hive structures)
const ssrPass = ssr(aoDenoise, sceneDepth, sceneNormal, camera);

// 3. Bloom (for pheromone trail glow)
const bloomPass = bloom(ssrPass, 0.3, 0.2, 0.1);

// 4. Film grain (for stylized look)
const postNoise = mx_noise_float(vec3(uv(), time.mul(0.1)).mul(sizes.width), 0.03).mul(0.5);

composer.outputNode = bloomPass.add(postNoise);
```

### 6.3 Key Post-Processing Effects Available

| Effect | TSL Function | Use Case for Agent-47 |
|--------|-------------|----------------------|
| Bloom | `bloom()` | Pheromone trail glow, district aura |
| GTAO | `ao()` + `denoise()` | Contact shadows, hive depth |
| SSR | `ssr()` | Reflective surfaces, water |
| Depth of Field | `dof()` | Focus on selected agent |
| Motion Blur | `motionBlur()` | Fast agent movement |
| Film Grain | `noise()` | Stylized realism aesthetic |
| Color Grading | `colorGrade()` | Per-district color palette |
| Vignette | `vignette()` | Cinematic framing |

### 6.4 Runtime Pipeline Switching

TSL post-processing enables dynamic effect changes without rebuild [^431^]:

```javascript
// Toggle bloom on/off
renderPipeline.outputNode = enableBloom
  ? scenePassColor.add(bloomPass)
  : scenePassColor;
renderPipeline.needsUpdate = true; // Only rebuilds graph, no shader recompile
```

---

## 7. Avatar Quality Upgrades

### 7.1 NVIDIA ACE (Open-Sourced September 2025)

NVIDIA ACE is a suite of technologies for digital human creation, now open-sourced under MIT license [^521^]. Key components:

**Animation & Speech**:
- **Audio2Face-3D SDK**: Converts streaming audio to facial blendshapes for real-time lip-sync. C++/Python source, MIT license [^521^]
- **Nemotron ASR**: 140M parameter automatic speech recognition, multilingual (EN/ZH/KR/FR/DE/IT/JA)
- **Chatterbox TTS**: 350M-500M parameter text-to-speech with emotional control

**Integration options for Agent-47**:
- Audio2Face-3D SDK can be integrated into the Three.js pipeline
- Facial blendshapes drive morph targets on glTF avatars
- On-device inference compatible with multi-vendor GPUs

### 7.2 Avatar Platforms Comparison

| Platform | Web Rendering | Quality | AI Integration | Pricing |
|----------|--------------|---------|---------------|---------|
| **Ready Player Me** | GLB/GLTF, Draco compressed | Medium | SDK available | Free tier |
| **Convai** | Three.js/PlayCanvas SDK | Medium-High | Full NPC AI pipeline | Usage-based |
| **Inworld AI** | Proprietary SDK | High | Full cognition engine | Enterprise |
| **NVIDIA ACE** | Self-hosted | Very High | Open-source models | Free (open) |

### 7.3 Convai Web SDK for Agent-47

Convai provides a JavaScript SDK for web-based AI characters [^554^]:

```javascript
import { ConvaiClient } from 'convai-web-sdk';

const client = new ConvaiClient({
  characterId: '...',
  apiKey: '...',
  enableAudio: true,
  enableFace: true
});

// Integrates with Three.js avatars
client.setAvatar(avatarMesh); // Applies lip-sync blendshapes
```

### 7.4 Recommended Avatar Architecture

For Agent-47's stylized realism with 47 humanoid agents:

1. **Base avatars**: Custom low-poly stylized humanoids (consistent with current aesthetic)
2. **NVIDIA ACE Audio2Face-3D**: Generate facial blendshapes from TTS audio in real-time
3. **GPU instancing**: Shared base geometry with per-instance morph target weights
4. **Per-district variation**: Color palette swaps via instance attributes + TSL shader
5. **Animation LOD**: 
   - Close: Full skeletal animation + facial blendshapes
   - Medium: Reduced bone count (no fingers)
   - Far: Simple vertex animation (VAT) or impostors

### 7.5 Vertex Animation Texture (VAT) for Distant Agents

For agents far from camera, VAT provides zero-CPU-cost animation [^648^] [^651^]:
- Pre-bake all animation frames into a texture (position + normal per frame per vertex)
- Single instanced draw call plays animation by sampling texture
- Used in False Earth for hundreds of flowers with individual lifecycle
- 1M+ grass blades each with unique animation via VAT

---

## 8. LOD & Asset Streaming

### 8.1 Progressive glTF Loading with Needle

`@needle-tools/gltf-progressive` provides single-line progressive loading for Three.js [^355^] [^632^]:

```javascript
import { useNeedleProgressive } from '@needle-tools/gltf-progressive';

const gltfLoader = new GLTFLoader();
useNeedleProgressive(gltfLoader, renderer);

gltfLoader.load(url, (gltf) => scene.add(gltf.scene));
```

**How it works**:
1. Main file embeds low-quality proxy geometry (~300KB for 56MB asset)
2. Scene appears instantly with proxy
3. Higher-quality LODs stream in based on screen-space density
4. Per-LOD caching with content hashing

**Features**:
- Up to 6 mesh LOD levels (each ~half triangle count of previous)
- Texture LODs stream from 128px to full resolution
- Supports KTX2, WebP, Draco, Meshopt compression
- Smart density-based selection (not just distance)

### 8.2 Three.js LOD System

Built-in `THREE.LOD` object for simple distance-based switching [^186^]:

```jsx
// React Three Fiber with drei
import { Detailed } from '@react-three/drei';

<Detailed distances={[0, 20, 50]}>
  <HighDetailMesh />   {/* 0-20 units */}
  <MediumDetailMesh /> {/* 20-50 units */}
  <LowDetailMesh />    {/* 50+ units */}
</Detailed>
```

### 8.3 Streaming Architecture for Agent-47 World

Recommended streaming strategy for 5 hive districts:

1. **District LOD**: Load current district at full quality, neighboring districts at medium, distant at low
2. **Avatar LOD**: 
   - 0-10m: Full skeletal + facial animation
   - 10-30m: Reduced bones (no fingers)
   - 30m+: VAT or impostor sprites
3. **Texture streaming**: KTX2 compressed textures, progressive loading
4. **Procedural fallback**: Generate placeholder geometry procedurally while assets stream

### 8.4 R3F Performance Best Practices [^186^]

```javascript
// Preload critical assets
useGLTF.preload('/models/agent.glb');

// Toggle visibility instead of remounting (prevents buffer recreation)
<Agent visible={isVisible} />

// Code-split non-critical modules
const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');

// Stream chunks based on camera position
function updateVisibleChunks(cameraPos) {
  const visible = getChunksNear(cameraPos);
  visible.forEach(chunk => { if (!chunk.loaded) loadChunk(chunk); });
}
```

---

## 9. Procedural World Generation

### 9.1 Compute Shader Terrain Generation

WebGPU enables real-time procedural terrain via compute shaders [^524^]:

```wgsl
// Terrain compute shader
@compute @workgroup_size(8, 8, 1)
fn computeTerrain(@builtin(global_invocation_id) id: vec3<u32>) {
  let uv = vec2<f32>(id.xy) / vec2<f32>(uniforms.gridSize);
  let worldPos = uniforms.origin + vec3<f32>(uv.x * uniforms.chunkSize, 0.0, uv.y * uniforms.chunkSize);
  
  // FBM noise for height
  var height: f32 = 0.0;
  var amplitude: f32 = 1.0;
  var frequency: f32 = 1.0;
  for (var i: i32 = 0; i < 8; i = i + 1) {
    height += amplitude * simplexNoise(worldPos.xz * frequency);
    amplitude *= 0.5;
    frequency *= 2.0;
  }
  
  // Domain warping for interesting features
  let warp = vec2(
    simplexNoise(worldPos.xz * 0.5 + vec2(0.0, 0.0)),
    simplexNoise(worldPos.xz * 0.5 + vec2(5.2, 1.3))
  );
  height += simplexNoise((worldPos.xz + warp * 2.0) * 0.25) * 4.0;
  
  textureStore(heightMap, id.xy, vec4<f32>(height, 0.0, 0.0, 0.0));
}
```

### 9.2 Chunked World Streaming

False Earth implementation demonstrates production-quality chunked streaming [^524^] [^648^]:

- **Chunk size**: 64x64 vertices per chunk
- **View distance**: 33x33 chunks (~2km radius)
- **Generation**: Simplex noise with configurable octaves + domain warping
- **Chunk pool**: 1089 pre-allocated chunks with LRU recycling
- **WebGPU compute**: Heightmap computed entirely on GPU via WGSL compute shaders

### 9.3 Procedural Grass System (False Earth Case Study) [^651^]

1 million+ grass blades rendered via WebGPU compute:

**Data packing** (64 bytes per blade, 4x vec4):
- Position + type index (xyz + w)
- Width, height, bend curvature, wind strength
- Pre-computed rotation (sin/cos), clump seed, per-blade hash
- Compressed normal (2 components) + interaction push vector

**Compute pipeline**:
1. Position generation with Voronoi clumping
2. Terrain height sampling and alignment
3. Wind simulation (multi-frequency sine)
4. Character push interaction
5. LOD selection based on camera distance

**Vertex deformation**: Cubic Bezier curve for blade bending, view-dependent tilt to prevent edge-on disappearance [^651^].

### 9.4 Procedural World for Agent-47

Recommended approach for 5 hive districts:

1. **Base terrain**: FBM noise with district-specific domain warping
2. **Hive structures**: Procedural generation rules per district, GPU-computed placement
3. **Pheromone grid**: 2D texture per district, compute shader diffusion
4. **Vegetation**: Instanced placement via compute, LOD for distant patches
5. **Atmosphere**: Per-district fog color, volumetric effects via TSL

---

## 10. Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
- [ ] Upgrade to Three.js r171+
- [ ] Swap to `WebGPURenderer` with async init
- [ ] Verify WebGL 2 fallback on non-WebGPU browsers
- [ ] Migrate existing materials to `*NodeMaterial`
- [ ] Set up `PostProcessing` with basic pass

### Phase 2: Compute Shaders (Week 3-4)
- [ ] Implement pheromone grid as GPU storage buffer
- [ ] Create diffusion compute shader (reaction-diffusion)
- [ ] Implement agent pathfinding as compute dispatch
- [ ] Benchmark: target 100k pheromone cells at <1ms

### Phase 3: Avatar Instancing (Week 5-6)
- [ ] Implement GPU skinning with animation texture
- [ ] Set up `InstancedMesh` with per-instance animation state
- [ ] Add LOD system (3 levels: full/reduced/VAT)
- [ ] Integrate NVIDIA ACE Audio2Face-3D for lip-sync

### Phase 4: Visual Effects (Week 7-8)
- [ ] Implement MRT pipeline (color + depth + normal)
- [ ] Add GTAO + denoise
- [ ] Add SSR for reflective surfaces
- [ ] Add bloom for pheromone glow
- [ ] District-specific color grading

### Phase 5: World Streaming (Week 9-10)
- [ ] Implement chunk-based world streaming
- [ ] Add progressive glTF loading for district assets
- [ ] Procedural terrain generation via compute
- [ ] Performance optimization pass (target 60fps)

---

## 11. Key Benchmarks & Performance Targets

| Metric | Current (WebGL) | Target (WebGPU) | Source |
|--------|----------------|-----------------|--------|
| Particle count | ~10,000 | 1,000,000 | Expo 2025 [^300^] |
| Pheromone cells | CPU-limited | 100k+ GPU | Compute projection |
| Avatar count | 47 individual | 47 instanced + LOD | GPU Gems 3 [^552^] |
| Draw calls | 100+ | <10 (batched) | Three.js docs |
| Post-processing | Multiple passes | Single MRT pass | TSL [^431^] |
| Frame rate | 45-60fps | Stable 60fps | Target |
| Load time | Full download | Progressive (90% less initial) | gltf-progressive [^355^] |

---

## 12. Risk Assessment & Mitigation

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| WebGPU not available | 5% users | High | Automatic WebGL 2 fallback [^337^] |
| TSL shader complexity | Medium | Medium | Gradual migration; keep GLSL paths |
| Safari quirks | Medium | Low | Feature detection; avoid timestamp queries |
| Memory leaks | Low | High | Explicit `.dispose()` + `storageBuffer.destroy()` |
| Performance regression | Low | High | A/B test; profile with `stats-gl` |

---

## 13. Sources & Citations

### Primary Sources
- [^300^] Utsubo — "What's New in Three.js (2026): WebGPU, New Workflows & Beyond" (2026-01-10)
- [^337^] Utsubo — "WebGPU + Three.js Migration Guide (2026)" (2026-01-21)
- [^336^] AlterSquare — "WebGPU vs Three.js for Construction Viewers" (2026-04-23)
- [^431^] Three.js Roadmap — "The Complete Guide to Three.js Post-Processing in 2026" (2026-04-14)
- [^482^] IGC — "Three.js WebGPU Migration and Architecture"
- [^340^] Three.js Wiki — "Three.js Shading Language (TSL Specification)"
- [^484^] Three.js Wiki — "Migration Guide" (r171+ changes)

### Technical Implementation Sources
- [^524^] GitHub — "jo56/procedural-terrain: WebGPU compute-based procedural terrain" (2025-12-10)
- [^648^] GitHub — "momentchan/false-earth: WebGPU + TSL procedural world" (2026-01-06)
- [^651^] Codrops — "False Earth: From WebGL Limits to a WebGPU-Driven World" (2026-04-21)
- [^629^] Codrops — "Interactive Text Destruction with Three.js, WebGPU, and TSL" (2025-07-22)
- [^526^] Jure Triglav — "Surfel-based global illumination on the web" (2026-01-29)
- [^597^] Three.js Docs — "GTAONode" official documentation
- [^602^] GitHub — "GameTechDev/XeGTAO" Intel implementation

### Avatar & AI Sources
- [^521^] NVIDIA — "ACE for Games" official (SDKs, Audio2Face-3D, models)
- [^525^] NVIDIA — "Create Digital Avatars With Generative AI"
- [^554^] Convai — "How do I integrate into my web app" developer forum
- [^556^] Convai — "AI Characters to Web Browser Using Convai and PlayCanvas"

### Performance & Instancing Sources
- [^552^] NVIDIA GPU Gems 3 — "Chapter 2: Animated Crowd Rendering"
- [^551^] Chalmers — "Animated Crowd Rendering" (academic paper)
- [^555^] Park & Han — "Fast Rendering of Large Crowds Using GPU" (ICEG 2008)
- [^532^] Three.js Forum — "BatchedMesh Performance Discussion"
- [^52^] Three.js Forum — "Animated Instanced Skinned Meshes (GLTF)"

### Asset Streaming Sources
- [^355^] Needle Engine — "gltf-progressive" documentation (2026-04-21)
- [^632^] GitHub — "needle-tools/gltf-progressive"
- [^186^] Utsubo — "100 Three.js Tips That Actually Improve Performance" (2026-01-12)

### Additional Sources
- [^338^] Three.js Roadmap — "Galaxy Simulation with WebGPU Compute Shaders" (2025-12-08)
- [^339^] Maxime Heckel — "Field Guide to TSL and WebGPU" (2025-10-14)
- [^653^] Codrops — "Reaction-Diffusion Compute Shader in WebGPU" (2024-05-01)
- [^652^] Metavert — "ShaderVine: A WebGPU Shader Editor Built for the Agentic Era" (2026-04-12)
- [^520^] GitHub — "mikbry/awesome-webgpu" (curated resources)
- [^561^] GitHub — Three.js official "webgpu_postprocessing_ssr.html" example
- [^559^] GitHub — "0beqz/screen-space-reflections" Three.js implementation
- [^564^] GitHub — "NewKrok/three-particles" (WebGPU compute particle system)

---

## 14. Conclusion

The WebGPU migration represents the single highest-impact technical upgrade for Agent-47's visual system. With Three.js r171+ providing production-ready, zero-config WebGPU support and automatic WebGL 2 fallback, the migration risk is minimal while the performance upside is transformative.

**The four pillars of the upgraded visual pipeline**:

1. **Compute shaders** move pheromone diffusion and agent pathfinding from CPU to GPU, enabling 100x+ more simulation elements
2. **GPU instancing + skinning** handles 47+ animated avatars effortlessly, with room to scale to 1000+
3. **MRT-based post-processing** delivers cinematic-quality GI, SSR, and GTAO in a single geometry pass
4. **Procedural world generation** via compute enables infinite, streaming worlds with GPU-computed terrain and vegetation

With universal browser support, proven production deployments (Segments.ai, Expo 2025), and a mature ecosystem (Three.js 2.7M weekly downloads), **WebGPU is no longer experimental — it is the standard for next-generation web 3D**. Agent-47 should adopt it as the foundation of its visual architecture.
