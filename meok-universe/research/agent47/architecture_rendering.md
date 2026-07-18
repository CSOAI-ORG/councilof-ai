# CSOAI Agent 47 Town - Technical Rendering Architecture

**Version:** 1.0
**Date:** July 2026
**Author:** 3D Architecture Team
**Status:** Draft for Implementation

---

## 1. Executive Summary

This document defines the complete technical rendering architecture for the CSOAI Agent 47 Town browser-based 3D simulation. It specifies the technology stack, performance optimization strategies, avatar rendering pipeline, camera systems, UI overlay architecture, pheromone visualization, multi-world portal system, component hierarchy, state management, and asset loading strategy required to render a smooth 60fps experience with 47 animated agents, 22+ buildings, and rich environmental effects on mid-range consumer hardware.

**Performance Target:** 60 FPS sustained on mid-range laptop (Intel i5 / AMD Ryzen 5, integrated GPU acceptable, dedicated GTX 1060+ recommended) with 47 agents, 22 buildings, particle systems, and post-processing effects active.

---

## 2. Technology Stack

### 2.1 Core Rendering Stack

| Layer | Package | Version | Purpose |
|-------|---------|---------|---------|
| 3D Engine | `three` | ^0.175.0 | Core WebGL rendering engine |
| React Integration | `@react-three/fiber` | ^9.0.0 | Declarative React renderer for Three.js |
| Helpers | `@react-three/drei` | ^10.0.0 | Pre-built components (controls, environment, loaders) |
| VRM Support | `@pixiv/three-vrm` | ^3.0.0 | VRM avatar loading, MToon materials, blend shapes |
| VRM Animation | `@pixiv/three-vrm-animation` | ^3.0.0 | Animation retargeting for VRM models |
| Post-Processing | `@react-three/postprocessing` | ^3.0.0 | Bloom, outline, SSAO, tone mapping |
| PostProcessing Core | `postprocessing` | ^7.0.0 | Underlying post-processing framework |
| Physics (light) | `@react-three/cannon` | ^6.6.0 | Agent-agent and agent-building collision |
| Pathfinding | `three-pathfinding` | ^1.2.0 | Agent navigation mesh for town movement |
| State Management | `zustand` | ^5.0.0 | Game state, agent positions, world state |
| WebSocket | `socket.io-client` | ^4.8.0 | Real-time agent state streaming from backend |
| Text Rendering | `troika-three-text` | ^0.52.0 | Crisp text meshes for labels, signs, HUD |
| GLTF Utils | `@gltf-transform/core` | ^4.1.0 | Runtime GLB optimization |
| Animation | `gsap` | ^3.12.0 | Camera transitions, UI animations, tweening |

### 2.2 Development Tools

| Tool | Purpose |
|------|---------|
| `@react-three/drei` Storybook | Component development and testing |
| `three-inspect` | In-browser scene inspector for debugging |
| `stats.js` | FPS counter, frame time, memory monitoring |
| `r3f-perf` | R3F-specific performance monitoring |
| Vite | Build tooling with fast HMR |
| TypeScript | Type safety across all components |

### 2.3 Why This Stack

**React Three Fiber over raw Three.js:**
- Declarative component model aligns with React's paradigm
- Built-in lifecycle management (mount/unmount cleanup)
- Automatic handling of Three.js object disposal
- Fiber's reconciler optimizes prop diffing for 3D objects
- Access to drei's massive component library
- Proven at scale by Emergence World (50 agents, 15-day simulations)

**VRM over GLB-only avatars:**
- Standardized anime-style avatar format with consistent bone structure
- Built-in MToon material for cel-shaded look (matches our visual style)
- Blend shape system for facial expressions (no custom rigging needed)
- Runtime hair/physics simulation via VRMSpringBone
- Consistent humanoid bone naming for animation retargeting
- Community ecosystem of tools and pre-made assets

**Zustand over Redux/Context:**
- Minimal boilerplate for game state
- No provider wrapper needed (mounts outside React tree)
- Excellent TypeScript support
- Selective subscription prevents unnecessary re-renders
- Middleware support (persist, devtools, immer)
- Battle-tested in production R3F applications

---

## 3. Component Hierarchy

### 3.1 React Component Tree

```
<Canvas>                          // R3F root canvas
  <StrictMode />                  // Development safety checks
  <AdaptiveDpr />                 // Automatic pixel ratio adjustment
  <PerformanceMonitor />          // FPS tracking, quality adjustment
  
  <WorldStateProvider>            // Zustand state integration
    
    {/* ===== ENVIRONMENT ===== */}
    <EnvironmentSystem>
      <SkySystem />               // Day/night cycle, stars, clouds
      <WeatherSystem />           // Rain, snow, wind particles
      <GroundPlane />             // Terrain with material zones
      <AudioAmbient />            // Environmental audio
    </EnvironmentSystem>
    
    {/* ===== WORLD INFRASTRUCTURE ===== */}
    <RoadNetwork />               // All roads, sidewalks, markings
    <StreetLighting />            // Instanced lamp posts with day/night
    <SignageSystem />             // District signs, directional arrows
    <InformationKiosks />         // Interactive info displays
    
    {/* ===== DISTRICTS & BUILDINGS ===== */}
    <CentralDistrict>
      <KingsTower />              // SOV3 sovereign node
      <Marketplace />             // Trading/social plaza
      <ZenGarden />               // Park/green space
    </CentralDistrict>
    
    <GovernanceDistrict>
      <ParliamentBuilding />      // councilof.ai
      <Courthouse />              // proofof.ai
      <EthicsHall />              // ethicalgovernanceof.ai
    </GovernanceDistrict>
    
    <CommerceDistrict>
      <TruckDepot />              // grabhire.ai
      <WasteFacility />           // muckaway.ai
      <EquipmentYard />           // planthire.ai
      <LogisticsHub />            // haulage.app
    </CommerceDistrict>
    
    <WellnessDistrict>
      <Aquarium />                // fishkeeper.ai
      <KoiGardens />              // koikeeper.ai
      <WellnessCenter />          // meok.ai
    </WellnessDistrict>
    
    <InnovationDistrict>
      <AILab />                   // openmoe.ai
      <RetroTechBridge />         // cobolbridge.ai
      <AutomationFactory />       // loopfactory.ai
    </InnovationDistrict>
    
    <SafetyDistrict>
      <SecurityHQ />              // asisecurity.ai
      <SafetyCenter />            // safetyof.ai
      <TrainingAcademy />         // agisafe.ai
    </SafetyDistrict>
    
    <LegalDistrict>
      <LandCourt />               // landlaw.ai
      <DataVault />               // dataprivacyof.ai
      <AuditOffice />             // accountabilityof.ai
    </LegalDistrict>
    
    <MediaDistrict>
      <BroadcastTower />          // socialmediamanger.ai
      <Observatory />             // transparencyof.ai
    </MediaDistrict>
    
    <ResidentialRing>
      <AgentHouse />              // x46 instanced with variation
    </ResidentialRing>
    
    {/* ===== AGENTS ===== */}
    <AgentSystem>
      <Agent key="agent-47">      // Human player (Agent 47)
        <VRMAvatar />
        <AgentController />
        <AgentLabel />
        <PheromoneEmitter />
      </Agent>
      <Agent key="agent-{id}">    // x46 AI agents
        <VRMAvatar />
        <AgentAI />
        <AgentLabel />
        <PheromoneEmitter />
        <SpeechBubble />
      </Agent>
    </AgentSystem>
    
    {/* ===== PARTICLE SYSTEMS ===== */}
    <PheromoneSystem />
    <AmbientParticles />
    <WeatherParticles />
    <BuildingEffects />
    
    {/* ===== CAMERA SYSTEM ===== */}
    <CameraSystem>
      <IsometricCamera />         // Default Townscaper-style view
      <FirstPersonCamera />       // Agent 47 WASD mode
      <CinematicCamera />         // Auto-rotating overview
      <FollowCamera />            // Track any agent
    </CameraSystem>
    
    {/* ===== POST-PROCESSING ===== */}
    <PostProcessingPipeline>
      <BloomEffect />             // Pheromone glow, building lights
      <OutlineEffect />           // Selected agent/building outlines
      <SSAOEffect />              // Ambient occlusion depth
      <ToneMappingEffect />       // ACES filmic tone mapping
    </PostProcessingPipeline>
    
    {/* ===== UI OVERLAY ===== */}
    <UIOverlay>
      <HUD />                     // Top-bar status info
      <AgentLabels />             // Floating name tags
      <Minimap />                 // Top-down position map
      <InteractionPrompt />       // "Press E to interact"
      <Dashboard />               // Full-screen metrics panel
      <ChatLog />                 // Agent conversation history
    </UIOverlay>
    
    {/* ===== PORTAL SYSTEM ===== */}
    <PortalSystem>
      <SubWorldLoader />          // Dynamic sub-world loading
      <TransitionEffect />        // Dissolve/fade transition
    </PortalSystem>
    
  </WorldStateProvider>
</Canvas>
```

### 3.2 Component Architecture Patterns

**Pattern 1: Separation of Concerns**
Each building component contains ONLY visual/rendering logic. All game logic (agent AI, economy, governance) lives in Zustand stores and Web Workers.

**Pattern 2: Instancing Wrapper**
For repeated elements (trees, lamps, houses), use a single InstancedMesh wrapped in a configuration component:

```tsx
// InstancedTrees.tsx
export function InstancedTrees() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const treePositions = useWorldStore((s) => s.treePositions);
  
  useEffect(() => {
    if (!meshRef.current) return;
    const dummy = new THREE.Object3D();
    treePositions.forEach((pos, i) => {
      dummy.position.set(pos.x, pos.y, pos.z);
      dummy.scale.setScalar(pos.scale || 1);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  }, [treePositions]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, treePositions.length]}>
      <boxGeometry args={[1, 3, 1]} /> {/* Low-poly tree trunk */}
      <meshStandardMaterial color="#8B4513" />
    </instancedMesh>
  );
}
```

**Pattern 3: LOD Wrapper**
Use drei `<Detailed>` for per-object LOD:

```tsx
// LODBuilding.tsx
import { Detailed } from '@react-three/drei';

export function LODBuilding({ position, highPolyUrl, medPolyUrl, lowPolyUrl }) {
  return (
    <Detailed distances={[0, 80, 200]} position={position}>
      <GLTFModel url={highPolyUrl} />      {/* Full detail <20m */}
      <GLTFModel url={medPolyUrl} />       {/* Medium 20-80m */}
      <BillboardSprite url={lowPolyUrl} /> {/* Billboard >80m */}
    </Detailed>
  );
}
```

**Pattern 4: Frustum-Culled Group**
Wrap expensive components in a frustum-culled group:

```tsx
// FrustumCulled.tsx
import { useFrustumCull } from './hooks/useFrustumCull';

export function FrustumCulledBuilding({ children, bbox }) {
  const ref = useFrustumCull(bbox);
  return <group ref={ref}>{children}</group>;
}
```

---

## 4. State Management Architecture

### 4.1 Zustand Store Structure

```typescript
// stores/worldStore.ts
import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';

interface AgentState {
  id: string;
  name: string;
  caste: CasteType;
  position: [number, number, number];
  rotation: [number, number, number];
  animationState: AnimationState;
  emotion: EmotionType;
  targetPosition?: [number, number, number];
  pheromoneType: PheromoneType;
  pheromoneIntensity: number;
  currentBuilding?: string;
  isSpeaking: boolean;
  speechText?: string;
}

interface WorldState {
  // Time
  worldTime: number;          // 0-86400 (seconds in day)
  timeScale: number;          // 1 = realtime, 60 = 1 min = 1 hour
  dayCount: number;
  
  // Weather
  weatherState: WeatherState;
  weatherTransition: number;  // 0-1 transition progress
  
  // Agents
  agents: Map<string, AgentState>;
  agent47: AgentState | null; // Human player
  selectedAgent: string | null;
  followedAgent: string | null;
  
  // Buildings
  buildings: Map<string, BuildingState>;
  activePortal: string | null;
  currentSubWorld: string | null;
  
  // Pheromones
  activePheromones: PheromoneParticle[];
  pheromoneZones: Map<string, PheromoneZone>;
  
  // Economy / Governance
  bftBlockHeight: number;
  lastConsensusTime: number;
  activeProposals: Proposal[];
  transactionRate: number;    // x402 txs per minute
  
  // Camera
  cameraMode: CameraMode;
  cameraTarget: [number, number, number] | null;
  
  // Performance
  targetFPS: number;
  currentQuality: QualityLevel;
  particleDensity: number;    // 0-1 multiplier
}

type CameraMode = 'isometric' | 'firstPerson' | 'cinematic' | 'follow';
type QualityLevel = 'ultra' | 'high' | 'medium' | 'low';
type WeatherState = 'clear' | 'cloudy' | 'overcast' | 'rain' | 'heavyRain' | 'snow';
type CasteType = 'worker' | 'scientist' | 'artist' | 'leader' | 'explorer' | 'merchant' | 'mediator';
type AnimationState = 'idle' | 'walk' | 'run' | 'work' | 'sit' | 'talk' | 'sleep' | 'eat';
type EmotionType = 'neutral' | 'happy' | 'sad' | 'angry' | 'surprised' | 'working' | 'talking';
type PheromoneType = 'mcp.queen.gold' | 'mcp.alarm.red' | 'mcp.trail.green' | 'mcp.territory.mark' | 'mcp.cleanup.black' | 'mcp.caste.transform' | 'mcp.gate.guard';

export const useWorldStore = create<WorldState>()(
  subscribeWithSelector((set, get) => ({
    // Initial state
    worldTime: 28800, // Start at 8:00 AM
    timeScale: 60,     // 1 real minute = 1 game hour
    dayCount: 1,
    weatherState: 'clear',
    weatherTransition: 1,
    agents: new Map(),
    agent47: null,
    selectedAgent: null,
    followedAgent: null,
    buildings: new Map(),
    activePortal: null,
    currentSubWorld: null,
    activePheromones: [],
    pheromoneZones: new Map(),
    bftBlockHeight: 0,
    lastConsensusTime: 0,
    activeProposals: [],
    transactionRate: 0,
    cameraMode: 'isometric',
    cameraTarget: null,
    targetFPS: 60,
    currentQuality: 'high',
    particleDensity: 1.0,
    
    // Actions
    setWorldTime: (time) => set({ worldTime: time }),
    setWeather: (state) => set({ weatherState: state, weatherTransition: 0 }),
    updateAgent: (id, updates) => {
      const agents = new Map(get().agents);
      const agent = agents.get(id);
      if (agent) agents.set(id, { ...agent, ...updates });
      set({ agents });
    },
    setCameraMode: (mode) => set({ cameraMode: mode }),
    setQuality: (level) => set({ currentQuality: level }),
  }))
);
```

### 4.2 Selective Subscription Pattern

To prevent unnecessary re-renders, use selector-based subscriptions:

```tsx
// BAD: Re-renders on any state change
const weather = useWorldStore((state) => state.weatherState);

// GOOD: Only re-renders when weather changes
const weather = useWorldStore((state) => state.weatherState);

// BEST: Only subscribes to specific slice
const isRaining = useWorldStore(
  (state) => state.weatherState === 'rain' || state.weatherState === 'heavyRain'
);
```

### 4.3 Web Worker Integration

Agent AI computation runs in Web Workers to avoid blocking the render thread:

```typescript
// workers/agentWorker.ts
self.onmessage = (event) => {
  const { type, agentId, worldState, nearbyAgents } = event.data;
  
  switch (type) {
    case 'DECIDE_ACTION': {
      // Run AI decision logic (LLM call or rule-based)
      const decision = computeAgentDecision(agentId, worldState, nearbyAgents);
      self.postMessage({ type: 'ACTION_DECIDED', agentId, decision });
      break;
    }
    case 'COMPUTE_PATH': {
      // A* pathfinding on navigation mesh
      const path = computePath(worldState.position, worldState.target, worldState.navMesh);
      self.postMessage({ type: 'PATH_COMPUTED', agentId, path });
      break;
    }
  }
};

// hooks/useAgentWorker.ts
export function useAgentWorker() {
  const workerRef = useRef<Worker>();
  
  useEffect(() => {
    workerRef.current = new Worker(
      new URL('../workers/agentWorker.ts', import.meta.url)
    );
    return () => workerRef.current?.terminate();
  }, []);
  
  const sendDecision = useCallback((agentId, worldState) => {
    workerRef.current?.postMessage({
      type: 'DECIDE_ACTION',
      agentId,
      worldState,
    });
  }, []);
  
  return { sendDecision };
}
```

---

## 5. Performance Architecture

### 5.1 LOD (Level of Detail) System

**Three-tier LOD per character:**

```
Distance      Rendering Strategy        Polygon Target     Update Frequency
--------------------------------------------------------------------------------
0-20m         Full VRM + bones + blend   5,000-15,000       Every frame
              shapes + shadows

20-50m        Simplified VRM + reduced   1,000-3,000        Every 2nd frame
              bones + no blend shapes
              + blob shadow

50-100m       Billboard sprite +        2 polygons           Every 5th frame
              positional lerp

100m+         Dot/icon only             1 point sprite       Every 10th frame
```

**Implementation using drei Detailed:**

```tsx
// AgentLOD.tsx
import { Detailed, useGLTF } from '@react-three/drei';
import { memo } from 'react';

interface AgentLODProps {
  agentId: string;
  caste: CasteType;
  archetype: number;
}

export const AgentLOD = memo(function AgentLOD({ agentId, caste, archetype }: AgentLODProps) {
  // Load 3 LOD variants
  const lod0 = useGLTF(`/agents/archetype_${archetype}_lod0.glb`);
  const lod1 = useGLTF(`/agents/archetype_${archetype}_lod1.glb`);
  
  return (
    <Detailed distances={[20, 50, 100]}>
      {/* LOD 0: Full VRM within 20m */}
      <AgentVRM 
        agentId={agentId} 
        caste={caste} 
        archetype={archetype}
        lodUrl={`/agents/archetype_${archetype}_lod0.glb`}
      />
      
      {/* LOD 1: Simplified mesh 20-50m */}
      <primitive object={lod1.scene.clone()} scale={0.95} />
      
      {/* LOD 2: Billboard sprite 50-100m */}
      <BillboardSprite 
        textureUrl={`/agents/archetype_${archetype}_sprite.png`}
        size={4}
      />
      
      {/* LOD 3: Far dot >100m */}
      <mesh>
        <sphereGeometry args={[0.5, 4, 4]} />
        <meshBasicMaterial color={CASTE_COLORS[caste]} />
      </mesh>
    </Detailed>
  );
});
```

### 5.2 Instanced Rendering

**Strategy:** Group identical geometry into single draw calls.

```tsx
// InstancedRenderers.tsx
import { useMemo, useRef, useEffect } from 'react';
import * as THREE from 'three';

// Instanced street lamps
export function InstancedStreetLamps({ positions }: { positions: THREE.Vector3[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const lightRef = useRef<THREE.InstancedMesh>(null);
  
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const color = useMemo(() => new THREE.Color(), []);
  
  useEffect(() => {
    if (!meshRef.current) return;
    
    positions.forEach((pos, i) => {
      dummy.position.copy(pos);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Vary light color slightly for realism
      color.setHSL(0.1, 0.2, 0.5 + Math.random() * 0.3);
      meshRef.current!.setColorAt(i, color);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  }, [positions, dummy, color]);
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, positions.length]}>
      <cylinderGeometry args={[0.1, 0.15, 5, 8]} />
      <meshStandardMaterial color="#555555" metalness={0.8} roughness={0.3} />
    </instancedMesh>
  );
}

// Instanced trees with wind animation
export function InstancedTrees({ count = 150 }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  // Custom shader for wind animation
  const shaderData = useMemo(() => ({
    uniforms: {
      uTime: { value: 0 },
      uWindStrength: { value: 0.3 },
    },
    vertexShader: `
      uniform float uTime;
      uniform float uWindStrength;
      varying vec2 vUv;
      
      void main() {
        vUv = uv;
        vec3 pos = position;
        
        // Wind sway based on height (y) and time
        float heightFactor = max(0.0, pos.y - 1.0) * 0.1;
        float windX = sin(uTime * 1.5 + instanceMatrix[3][0] * 0.5) * uWindStrength * heightFactor;
        float windZ = cos(uTime * 1.2 + instanceMatrix[3][2] * 0.5) * uWindStrength * heightFactor * 0.5;
        
        pos.x += windX;
        pos.z += windZ;
        
        gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(pos, 1.0);
      }
    `,
    fragmentShader: `
      varying vec2 vUv;
      uniform vec3 uColor;
      
      void main() {
        vec3 color = uColor * (0.8 + vUv.y * 0.4);
        gl_FragColor = vec4(color, 1.0);
      }
    `,
  }), []);
  
  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = clock.elapsedTime;
    }
  });
  
  // Initialize tree positions...
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, count]}>
      <cylinderGeometry args={[0.3, 0.5, 4, 6]} />
      <shaderMaterial
        ref={materialRef}
        {...shaderData}
        uniforms-uColor-value="#2d5a1e"
      />
    </instancedMesh>
  );
}
```

### 5.3 Frustum Culling

```tsx
// hooks/useFrustumCull.ts
import { useRef, useEffect } from 'react';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function useFrustumCull(boundingRadius: number = 10) {
  const ref = useRef<THREE.Group>(null);
  const { camera } = useThree();
  const frustum = useMemo(() => new THREE.Frustum(), []);
  const projScreenMatrix = useMemo(() => new THREE.Matrix4(), []);
  
  useFrame(() => {
    if (!ref.current) return;
    
    projScreenMatrix.multiplyMatrices(
      camera.projectionMatrix,
      camera.matrixWorldInverse
    );
    frustum.setFromProjectionMatrix(projScreenMatrix);
    
    const position = ref.current.position;
    const sphere = new THREE.Sphere(position, boundingRadius);
    
    ref.current.visible = frustum.intersectsSphere(sphere);
  });
  
  return ref;
}
```

### 5.4 Animation Throttling

```tsx
// hooks/useThrottledAnimation.ts
import { useRef } from 'react';

export function useThrottledAnimation(distance: number) {
  const frameCounter = useRef(0);
  
  // Determine update frequency based on distance
  const throttle = distance < 20 ? 1 : distance < 50 ? 2 : distance < 100 ? 5 : 10;
  
  return {
    shouldUpdate: (frameCount: number) => frameCount % throttle === 0,
    throttle,
  };
}

// Usage in Agent component
function Agent({ agentState }) {
  const { camera } = useThree();
  const distance = agentState.position.distanceTo(camera.position);
  const { shouldUpdate } = useThrottledAnimation(distance);
  const frameCount = useRef(0);
  
  useFrame((state, delta) => {
    frameCount.current++;
    if (!shouldUpdate(frameCount.current)) return;
    
    // Only update animation mixer every Nth frame
    mixer.update(delta * throttle); // Scale delta to maintain speed
  });
}
```

### 5.5 Adaptive Quality System

```tsx
// systems/PerformanceManager.tsx
import { useEffect } from 'react';
import { useWorldStore } from '../stores/worldStore';

export function PerformanceManager() {
  const setQuality = useWorldStore((s) => s.setQuality);
  const targetFPS = useWorldStore((s) => s.targetFPS);
  
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let fpsHistory: number[] = [];
    
    const checkPerformance = () => {
      frameCount++;
      const now = performance.now();
      
      if (now - lastTime >= 1000) {
        const fps = frameCount;
        frameCount = 0;
        lastTime = now;
        
        fpsHistory.push(fps);
        if (fpsHistory.length > 5) fpsHistory.shift();
        
        const avgFPS = fpsHistory.reduce((a, b) => a + b) / fpsHistory.length;
        
        // Auto-adjust quality
        if (avgFPS < targetFPS * 0.7) {
          setQuality('low');
        } else if (avgFPS < targetFPS * 0.85) {
          setQuality('medium');
        } else if (avgFPS > targetFPS * 1.1) {
          setQuality('high');
        }
      }
      
      requestAnimationFrame(checkPerformance);
    };
    
    const id = requestAnimationFrame(checkPerformance);
    return () => cancelAnimationFrame(id);
  }, [setQuality, targetFPS]);
  
  return null;
}
```

### 5.6 Performance Budget

| Resource | Target | Max |
|----------|--------|-----|
| Draw calls | <100 | 200 |
| Triangles per frame | <500K | 1M |
| Textures in memory | <200MB | 512MB |
| Active particles | <10K | 20K |
| Shadow-casting lights | <4 | 8 |
| Bone animations per frame | <20 | 47 |
| Shader compilations | 0 after load | At startup only |
| Frame time (16.6ms budget) | <12ms | <16ms |

---

## 6. Avatar Rendering Pipeline

### 6.1 VRoid Archetype System

**5-8 Base Archetypes created in VRoid Studio:**

```typescript
// config/archetypes.ts
export const ARCHETYPES = {
  // Male archetypes
  M_WORKER:    { id: 0,  body: 'average',   style: 'practical', defaultOutfit: 'work_jumpsuit' },
  M_SLIM:      { id: 1,  body: 'slim',      style: 'intellectual', defaultOutfit: 'lab_coat' },
  M_HEAVY:     { id: 2,  body: 'heavy',     style: 'industrial', defaultOutfit: 'safety_gear' },
  M_ATHLETIC:  { id: 3,  body: 'athletic',  style: 'security', defaultOutfit: 'uniform' },
  
  // Female archetypes
  F_AVERAGE:   { id: 4,  body: 'average',   style: 'professional', defaultOutfit: 'business_suit' },
  F_SLIM:      { id: 5,  body: 'slim',      style: 'creative', defaultOutfit: 'artistic_dress' },
  F_PETITE:    { id: 6,  body: 'petite',    style: 'youthful', defaultOutfit: 'casual_wear' },
  F_TALL:      { id: 7,  body: 'tall',      style: 'leader', defaultOutfit: 'formal_gown' },
} as const;

// Runtime variation parameters
export interface AgentVariation {
  skinTone: number;        // 0-1 hue shift
  hairColor: [number, number, number]; // RGB
  hairStyle: number;       // 0-20 style index
  eyeColor: [number, number, number];
  outfitColor: [number, number, number];
  height: number;          // 0.9-1.1 scale
  accessories: string[];   // Glasses, hat, etc.
}
```

**Generating 46 Unique Agents from 8 Archetypes:**

```tsx
// components/VRMAvatar.tsx
import { useMemo } from 'react';
import { useGLTF } from '@react-three/drei';
import { VRM } from '@pixiv/three-vrm';

interface VRMAvatarProps {
  agentId: string;
  archetypeId: number;
  variation: AgentVariation;
  animationState: AnimationState;
  emotion: EmotionType;
}

export function VRMAvatar({ agentId, archetypeId, variation, animationState, emotion }: VRMAvatarProps) {
  // Load base archetype VRM
  const { scene } = useGLTF(`/archetypes/archetype_${archetypeId}.vrm`);
  
  const vrm = useMemo(() => {
    const vrm = scene.userData.vrm as VRM;
    if (!vrm) return null;
    
    // Apply runtime variation
    applyVariation(vrm, variation);
    
    // Setup MToon cel-shading
    setupCelShading(vrm);
    
    return vrm;
  }, [scene, variation]);
  
  // Apply facial expression
  useEffect(() => {
    if (!vrm?.expressionManager) return;
    
    // Reset all expressions
    vrm.expressionManager.clearExpressions();
    
    // Apply emotion blend shapes
    const blendShapes = EMOTION_BLEND_SHAPES[emotion];
    if (blendShapes) {
      Object.entries(blendShapes).forEach(([key, value]) => {
        vrm.expressionManager!.setValue(key as VRMExpressionPresetName, value);
      });
    }
  }, [vrm, emotion]);
  
  return (
    <group scale={[variation.height, variation.height, variation.height]}>
      <primitive object={scene} />
    </group>
  );
}

function applyVariation(vrm: VRM, variation: AgentVariation) {
  // Modify materials for outfit color
  vrm.scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      const mat = child.material as THREE.MeshStandardMaterial;
      
      // Tint outfit materials
      if (child.name.includes('outfit') || child.name.includes('clothes')) {
        mat.color.setRGB(...variation.outfitColor);
      }
      
      // Tint hair
      if (child.name.includes('hair')) {
        mat.color.setRGB(...variation.hairColor);
      }
    }
  });
}

function setupCelShading(vrm: VRM) {
  vrm.scene.traverse((child) => {
    if (child instanceof THREE.Mesh && child.material) {
      // MToon parameters for cel-shaded look
      if (child.material.userData?.isMToonMaterial) {
        const mtoon = child.material as any;
        mtoon.shadeToony = 0.85;        // Sharp shadow edge
        mtoon.shadeShift = -0.3;        // Shadow position
        mtoon.parametricRimColor = new THREE.Color(0.3, 0.3, 0.4);
        mtoon.parametricRimFresnelPower = 3.0;
        mtoon.outlineWidth = 0.002;     // Subtle outline
        mtoon.outlineColor = new THREE.Color(0.1, 0.1, 0.15);
      }
    }
  });
}

// Emotion to VRM blend shape mapping
const EMOTION_BLEND_SHAPES: Record<EmotionType, Record<string, number>> = {
  neutral: {},
  happy: { happy: 1.0, relaxed: 0.5, blinkLeft: 0.0, blinkRight: 0.0 },
  sad: { sad: 1.0, angry: 0.0, relaxed: 0.3 },
  angry: { angry: 1.0, serious: 0.8, browInnerUp: 0.5 },
  surprised: { surprised: 1.0, aa: 0.5, browInnerUp: 0.8 },
  working: { neutral: 1.0, blinkLeft: 0.2, blinkRight: 0.2 },
  talking: { aa: 0.4, ih: 0.2, ou: 0.1 },
};
```

### 6.2 Animation System

**Animation State Machine:**

```tsx
// hooks/useAgentAnimation.ts
import { useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const ANIMATION_URLS = {
  idle: '/animations/idle.glb',
  walk: '/animations/walk.glb',
  run: '/animations/run.glb',
  work: '/animations/typing.glb',
  sit: '/animations/sit.glb',
  talk: '/animations/talking.glb',
  sleep: '/animations/sleep.glb',
  eat: '/animations/eat.glb',
};

export function useAgentAnimation(vrm: VRM | null, currentState: AnimationState) {
  const mixerRef = useRef<THREE.AnimationMixer | null>(null);
  const currentActionRef = useRef<THREE.AnimationAction | null>(null);
  const animationsRef = useRef<Map<AnimationState, THREE.AnimationClip>>(new Map());
  
  // Load all animation clips
  useEffect(() => {
    if (!vrm) return;
    
    const loader = new GLTFLoader();
    mixerRef.current = new THREE.AnimationMixer(vrm.scene);
    
    // Load animation clips
    Object.entries(ANIMATION_URLS).forEach(async ([state, url]) => {
      const gltf = await loader.loadAsync(url);
      const clip = gltf.animations[0];
      if (clip) {
        // Retarget to VRM humanoid
        const vrmClip = await convertToVRMClip(clip, vrm);
        animationsRef.current.set(state as AnimationState, vrmClip);
      }
    });
    
    return () => {
      mixerRef.current?.stopAllAction();
    };
  }, [vrm]);
  
  // Transition between animation states
  useEffect(() => {
    if (!mixerRef.current) return;
    
    const clip = animationsRef.current.get(currentState);
    if (!clip) return;
    
    const newAction = mixerRef.current.clipAction(clip);
    const oldAction = currentActionRef.current;
    
    if (oldAction && oldAction !== newAction) {
      // Cross-fade over 0.3 seconds
      oldAction.fadeOut(0.3);
      newAction.reset().fadeIn(0.3).play();
    } else {
      newAction.play();
    }
    
    currentActionRef.current = newAction;
  }, [currentState]);
  
  // Update mixer
  useFrame((_, delta) => {
    if (mixerRef.current) {
      mixerRef.current.update(delta);
    }
  });
  
  return mixerRef;
}
```

### 6.3 Outfit/Accessory Differentiation

```tsx
// components/AgentOutfit.tsx
const CASTE_OUTFITS: Record<CasteType, { color: string; accessory?: string }> = {
  worker:    { color: '#E8732E', accessory: 'tool_belt' },
  scientist: { color: '#FFFFFF', accessory: 'lab_goggles' },
  artist:    { color: '#E2725B', accessory: 'paint_palette' },
  leader:    { color: '#FFD700', accessory: 'medal' },
  explorer:  { color: '#228B22', accessory: 'compass' },
  merchant:  { color: '#1B3A5C', accessory: 'coin_pouch' },
  mediator:  { color: '#E6E6FA', accessory: 'balance_scale' },
};

export function AgentAccessories({ caste }: { caste: CasteType }) {
  const outfit = CASTE_OUTFITS[caste];
  
  return (
    <group>
      {/* Caste emblem floating above head */}
      <mesh position={[0, 2.2, 0]}>
        <sphereGeometry args={[0.15, 8, 8]} />
        <meshBasicMaterial color={outfit.color} />
      </mesh>
      
      {/* Job title tag */}
      <AgentLabel caste={caste} color={outfit.color} />
    </group>
  );
}
```

---

## 7. Camera System

### 7.1 Camera Mode Implementations

```tsx
// systems/CameraSystem.tsx
import { useRef, useEffect, useCallback } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../stores/worldStore';

export function CameraSystem() {
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const cameraTarget = useWorldStore((s) => s.cameraTarget);
  const followedAgent = useWorldStore((s) => s.followedAgent);
  const agents = useWorldStore((s) => s.agents);
  const agent47 = useWorldStore((s) => s.agent47);
  
  const { camera } = useThree();
  const controlsRef = useRef<any>(null);
  
  // Smooth camera transition
  const targetPos = useRef(new THREE.Vector3(100, 80, 100));
  const targetLook = useRef(new THREE.Vector3(0, 0, 0));
  
  useFrame(() => {
    // Lerp camera position
    camera.position.lerp(targetPos.current, 0.05);
    
    // Lerp look target
    const currentLook = new THREE.Vector3();
    camera.getWorldDirection(currentLook);
    const newLook = targetLook.current.clone().sub(camera.position).normalize();
    camera.lookAt(camera.position.clone().add(currentLook.lerp(newLook, 0.05)));
  });
  
  // Update targets based on mode
  useEffect(() => {
    switch (cameraMode) {
      case 'isometric': {
        targetPos.current.set(120, 100, 120);
        targetLook.current.set(0, 0, 0);
        break;
      }
      case 'firstPerson': {
        const agent = agent47;
        if (agent) {
          const [x, y, z] = agent.position;
          targetPos.current.set(x, y + 1.6, z); // Eye height
          // Look direction based on WASD input
        }
        break;
      }
      case 'cinematic': {
        // Auto-rotating overview
        const angle = Date.now() * 0.0001;
        const radius = 200;
        targetPos.current.set(
          Math.sin(angle) * radius,
          80,
          Math.cos(angle) * radius
        );
        targetLook.current.set(0, 10, 0);
        break;
      }
      case 'follow': {
        const targetAgent = followedAgent ? agents.get(followedAgent) : null;
        if (targetAgent) {
          const [x, y, z] = targetAgent.position;
          targetPos.current.set(x - 10, y + 10, z - 10);
          targetLook.current.set(x, y + 1.5, z);
        }
        break;
      }
    }
  }, [cameraMode, cameraTarget, followedAgent, agents, agent47]);
  
  return (
    <PerspectiveCamera
      makeDefault
      fov={cameraMode === 'firstPerson' ? 75 : 45}
      near={0.1}
      far={1000}
      position={[120, 100, 120]}
    />
  );
}
```

### 7.2 Input Controls

```tsx
// hooks/useCameraControls.ts
import { useEffect, useRef } from 'react';
import { useWorldStore } from '../stores/worldStore';

export function useCameraControls() {
  const keys = useRef<Set<string>>(new Set());
  const setCameraMode = useWorldStore((s) => s.setCameraMode);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.key.toLowerCase());
      
      // Camera mode switching
      switch (e.key.toLowerCase()) {
        case '1': setCameraMode('isometric'); break;
        case '2': setCameraMode('firstPerson'); break;
        case '3': setCameraMode('cinematic'); break;
        case '4': setCameraMode('follow'); break;
        case 'f': {
          // Follow clicked agent
          const selected = useWorldStore.getState().selectedAgent;
          if (selected) {
            useWorldStore.setState({ followedAgent: selected, cameraMode: 'follow' });
          }
          break;
        }
      }
    };
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.key.toLowerCase());
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [setCameraMode]);
  
  return keys;
}
```

### 7.3 First-Person Controls (Agent 47)

```tsx
// systems/FirstPersonControls.tsx
import { useRef, useEffect } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';

export function FirstPersonControls({ agentRef }: { agentRef: React.RefObject<THREE.Group> }) {
  const { camera } = useThree();
  const velocity = useRef(new THREE.Vector3());
  const direction = useRef(new THREE.Vector3());
  const moveSpeed = 5; // meters per second
  
  const keys = useRef({
    w: false, a: false, s: false, d: false,
    shift: false, space: false,
  });
  
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = true;
      if (key === 'a' || key === 'arrowleft') keys.current.a = true;
      if (key === 's' || key === 'arrowdown') keys.current.s = true;
      if (key === 'd' || key === 'arrowright') keys.current.d = true;
      if (key === 'shift') keys.current.shift = true;
      if (key === ' ') keys.current.space = true;
    };
    
    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (key === 'w' || key === 'arrowup') keys.current.w = false;
      if (key === 'a' || key === 'arrowleft') keys.current.a = false;
      if (key === 's' || key === 'arrowdown') keys.current.s = false;
      if (key === 'd' || key === 'arrowright') keys.current.d = false;
      if (key === 'shift') keys.current.shift = false;
      if (key === ' ') keys.current.space = false;
    };
    
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, []);
  
  useFrame((_, delta) => {
    if (!agentRef.current) return;
    
    // Compute movement direction from camera
    const forward = new THREE.Vector3();
    camera.getWorldDirection(forward);
    forward.y = 0;
    forward.normalize();
    
    const right = new THREE.Vector3();
    right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
    
    direction.current.set(0, 0, 0);
    if (keys.current.w) direction.current.add(forward);
    if (keys.current.s) direction.current.sub(forward);
    if (keys.current.d) direction.current.add(right);
    if (keys.current.a) direction.current.sub(right);
    
    if (direction.current.length() > 0) {
      direction.current.normalize();
      const speed = keys.current.shift ? moveSpeed * 2 : moveSpeed;
      
      velocity.current.x = direction.current.x * speed;
      velocity.current.z = direction.current.z * speed;
    } else {
      velocity.current.x *= 0.8; // Deceleration
      velocity.current.z *= 0.8;
    }
    
    // Apply movement
    agentRef.current.position.x += velocity.current.x * delta;
    agentRef.current.position.z += velocity.current.z * delta;
    
    // Update camera to follow agent
    const agentPos = agentRef.current.position;
    camera.position.set(agentPos.x, agentPos.y + 1.6, agentPos.z);
  });
  
  return null;
}
```

---

## 8. Pheromone Visualization System

### 8.1 GPU-Instanced Particle System

```tsx
// systems/PheromoneSystem.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../stores/worldStore';

const MAX_PARTICLES = 20000;
const PHEROMONE_TYPES = {
  'mcp.queen.gold':     { color: new THREE.Color(0xFFD700), size: 0.3, fadeRate: 0.3 },
  'mcp.alarm.red':      { color: new THREE.Color(0xFF0000), size: 0.5, fadeRate: 0.8 },
  'mcp.trail.green':    { color: new THREE.Color(0x00FF00), size: 0.2, fadeRate: 0.15 },
  'mcp.territory.mark': { color: new THREE.Color(0x333333), size: 0.4, fadeRate: 0.2 },
  'mcp.cleanup.black':  { color: new THREE.Color(0x666666), size: 0.35, fadeRate: 0.5 },
  'mcp.caste.transform':{ color: new THREE.Color(0x0088FF), size: 0.4, fadeRate: 0.4 },
  'mcp.gate.guard':     { color: new THREE.Color(0x9B59B6), size: 0.45, fadeRate: 0.3 },
};

interface ParticleData {
  position: Float32Array;
  velocity: Float32Array;
  life: Float32Array;
  maxLife: Float32Array;
  type: Int32Array;
  size: Float32Array;
}

export function PheromoneSystem() {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const particleDensity = useWorldStore((s) => s.particleDensity);
  
  // Particle data buffers
  const particles = useMemo<ParticleData>(() => ({
    position: new Float32Array(MAX_PARTICLES * 3),
    velocity: new Float32Array(MAX_PARTICLES * 3),
    life: new Float32Array(MAX_PARTICLES),
    maxLife: new Float32Array(MAX_PARTICLES),
    type: new Int32Array(MAX_PARTICLES),
    size: new Float32Array(MAX_PARTICLES),
  }), []);
  
  const activeCount = useRef(0);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  // Emit particles from agent positions
  const emitParticle = (position: THREE.Vector3, type: PheromoneType, intensity: number) => {
    const count = activeCount.current;
    if (count >= MAX_PARTICLES * particleDensity) return;
    
    const idx = count;
    const pheromoneConfig = PHEROMONE_TYPES[type];
    
    particles.position[idx * 3] = position.x + (Math.random() - 0.5) * 2;
    particles.position[idx * 3 + 1] = position.y + Math.random() * 2;
    particles.position[idx * 3 + 2] = position.z + (Math.random() - 0.5) * 2;
    
    particles.velocity[idx * 3] = (Math.random() - 0.5) * 2;
    particles.velocity[idx * 3 + 1] = Math.random() * 2 + 1;
    particles.velocity[idx * 3 + 2] = (Math.random() - 0.5) * 2;
    
    particles.life[idx] = 1.0;
    particles.maxLife[idx] = 3.0 + Math.random() * 2;
    particles.type[idx] = Object.keys(PHEROMONE_TYPES).indexOf(type);
    particles.size[idx] = pheromoneConfig.size * intensity;
    
    activeCount.current++;
  };
  
  // Update particles every frame
  useFrame((_, delta) => {
    if (!meshRef.current) return;
    
    const count = activeCount.current;
    let writeIdx = 0;
    
    for (let i = 0; i < count; i++) {
      // Update life
      particles.life[i] -= delta / particles.maxLife[i];
      
      if (particles.life[i] <= 0) {
        // Particle dead, skip
        continue;
      }
      
      // Update position with velocity
      particles.position[i * 3] += particles.velocity[i * 3] * delta;
      particles.position[i * 3 + 1] += particles.velocity[i * 3 + 1] * delta;
      particles.position[i * 3 + 2] += particles.velocity[i * 3 + 2] * delta;
      
      // Apply diffusion (random walk)
      particles.velocity[i * 3] += (Math.random() - 0.5) * 0.5 * delta;
      particles.velocity[i * 3 + 1] += (Math.random() - 0.5) * 0.3 * delta;
      particles.velocity[i * 3 + 2] += (Math.random() - 0.5) * 0.5 * delta;
      
      // Gravity/drag
      particles.velocity[i * 3 + 1] -= 0.5 * delta; // Slight gravity
      particles.velocity[i * 3] *= 0.98; // Air resistance
      particles.velocity[i * 3 + 2] *= 0.98;
      
      // Ground collision
      if (particles.position[i * 3 + 1] < 0) {
        particles.position[i * 3 + 1] = 0;
        particles.velocity[i * 3 + 1] *= -0.3; // Bounce
      }
      
      // Write to instance matrix
      dummy.position.set(
        particles.position[i * 3],
        particles.position[i * 3 + 1],
        particles.position[i * 3 + 2]
      );
      
      const scale = particles.size[i] * particles.life[i];
      dummy.scale.setScalar(scale);
      dummy.updateMatrix();
      
      meshRef.current.setMatrixAt(writeIdx, dummy.matrix);
      
      // Set color with alpha based on life
      const typeKeys = Object.keys(PHEROMONE_TYPES);
      const typeConfig = PHEROMONE_TYPES[typeKeys[particles.type[i]] as keyof typeof PHEROMONE_TYPES];
      if (typeConfig) {
        const alpha = particles.life[i];
        meshRef.current.setColorAt(writeIdx, typeConfig.color.clone().multiplyScalar(alpha));
      }
      
      // Copy data to compact array
      if (writeIdx !== i) {
        particles.position[writeIdx * 3] = particles.position[i * 3];
        particles.position[writeIdx * 3 + 1] = particles.position[i * 3 + 1];
        particles.position[writeIdx * 3 + 2] = particles.position[i * 3 + 2];
        particles.velocity[writeIdx * 3] = particles.velocity[i * 3];
        particles.velocity[writeIdx * 3 + 1] = particles.velocity[i * 3 + 1];
        particles.velocity[writeIdx * 3 + 2] = particles.velocity[i * 3 + 2];
        particles.life[writeIdx] = particles.life[i];
        particles.maxLife[writeIdx] = particles.maxLife[i];
        particles.type[writeIdx] = particles.type[i];
        particles.size[writeIdx] = particles.size[i];
      }
      
      writeIdx++;
    }
    
    activeCount.current = writeIdx;
    meshRef.current.count = writeIdx;
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, MAX_PARTICLES]}>
      <sphereGeometry args={[1, 6, 6]} />
      <meshBasicMaterial transparent opacity={0.8} depthWrite={false} />
    </instancedMesh>
  );
}
```

### 8.2 Pheromone Emitter Component

```tsx
// components/PheromoneEmitter.tsx
import { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface PheromoneEmitterProps {
  agentId: string;
  pheromoneType: PheromoneType;
  intensity: number;
  emissionRate: number; // particles per second
  position: THREE.Vector3;
}

export function PheromoneEmitter({
  agentId,
  pheromoneType,
  intensity,
  emissionRate,
  position,
}: PheromoneEmitterProps) {
  const accumulator = useRef(0);
  const emitRef = useRef<(pos: THREE.Vector3, type: PheromoneType, intensity: number) => void>();
  
  // Register emitter with the system
  useEffect(() => {
    const system = pheromoneSystemRef.current;
    if (system) {
      emitRef.current = system.emitParticle;
    }
  }, []);
  
  useFrame((_, delta) => {
    accumulator.current += delta;
    const interval = 1 / emissionRate;
    
    while (accumulator.current >= interval) {
      accumulator.current -= interval;
      emitRef.current?.(position, pheromoneType, intensity);
    }
  });
  
  return null;
}
```

---

## 9. Multi-World Portal System

### 9.1 Portal Component

```tsx
// systems/PortalSystem.tsx
import { useRef, useState, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useWorldStore } from '../stores/worldStore';
import { useGLTF } from '@react-three/drei';

interface PortalProps {
  portalId: string;
  buildingId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  subWorldUrl: string;
  triggerRadius?: number;
}

export function Portal({
  portalId,
  buildingId,
  position,
  rotation,
  subWorldUrl,
  triggerRadius = 5,
}: PortalProps) {
  const groupRef = useRef<THREE.Group>(null);
  const [isNear, setIsNear] = useState(false);
  const [dissolveProgress, setDissolveProgress] = useState(0);
  
  const { camera } = useThree();
  const setSubWorld = useWorldStore((s) => s.setSubWorld);
  const agent47Pos = useWorldStore((s) => s.agent47?.position);
  
  // Check distance to Agent 47
  useFrame(() => {
    if (!agent47Pos) return;
    
    const dx = agent47Pos[0] - position[0];
    const dz = agent47Pos[2] - position[2];
    const distance = Math.sqrt(dx * dx + dz * dz);
    
    const wasNear = isNear;
    const nowNear = distance < triggerRadius;
    
    if (nowNear !== wasNear) {
      setIsNear(nowNear);
    }
    
    if (nowNear) {
      // Progress dissolve 0 to 1 as agent approaches
      const progress = Math.max(0, 1 - distance / triggerRadius);
      setDissolveProgress(progress);
      
      // Trigger portal transition when very close
      if (progress > 0.8) {
        setSubWorld(buildingId, subWorldUrl);
      }
    } else {
      setDissolveProgress(0);
    }
  });
  
  return (
    <group ref={groupRef} position={position} rotation={rotation}>
      {/* Physical doorway */}
      <mesh>
        <boxGeometry args={[3, 4, 0.3]} />
        <meshStandardMaterial color="#4A4A4A" />
      </mesh>
      
      {/* Dissolve shader overlay */}
      <DissolveEffect progress={dissolveProgress} />
      
      {/* Interior preview (visible through dissolving doorway) */}
      {dissolveProgress > 0.1 && (
        <InteriorPreview 
          subWorldUrl={subWorldUrl} 
          opacity={dissolveProgress}
        />
      )}
      
      {/* Interaction prompt */}
      {isNear && (
        <InteractionPrompt text="Press E to Enter" />
      )}
    </group>
  );
}

// Dissolve shader effect
function DissolveEffect({ progress }: { progress: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null);
  
  const uniforms = useMemo(() => ({
    uProgress: { value: 0 },
    uNoiseScale: { value: 15.0 },
    uEdgeWidth: { value: 0.1 },
    uEdgeColor: { value: new THREE.Color(0xFFD700) },
  }), []);
  
  useFrame(() => {
    if (materialRef.current) {
      materialRef.current.uniforms.uProgress.value = progress;
    }
  });
  
  return (
    <mesh position={[0, 2, 0.2]}>
      <planeGeometry args={[3, 4]} />
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={`
          varying vec2 vUv;
          void main() {
            vUv = uv;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `}
        fragmentShader={`
          uniform float uProgress;
          uniform float uNoiseScale;
          uniform float uEdgeWidth;
          uniform vec3 uEdgeColor;
          varying vec2 vUv;
          
          // Simple noise function
          float hash(vec2 p) {
            return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
          }
          
          void main() {
            float noise = hash(vUv * uNoiseScale);
            float threshold = uProgress;
            
            if (noise > threshold) discard;
            
            float edge = smoothstep(threshold - uEdgeWidth, threshold, noise);
            vec3 color = mix(vec3(0.0), uEdgeColor, edge);
            float alpha = 1.0 - smoothstep(threshold - uEdgeWidth * 2.0, threshold, noise);
            
            gl_FragColor = vec4(color, alpha * 0.8);
          }
        `}
        transparent
        side={THREE.DoubleSide}
      />
    </mesh>
  );
}
```

### 9.2 Sub-World Loader

```tsx
// systems/SubWorldLoader.tsx
import { Suspense, useState, useEffect } from 'react';
import { useWorldStore } from '../stores/worldStore';
import { Canvas } from '@react-three/fiber';

export function SubWorldLoader() {
  const currentSubWorld = useWorldStore((s) => s.currentSubWorld);
  const [isLoading, setIsLoading] = useState(false);
  
  if (!currentSubWorld) return null;
  
  return (
    <div className="sub-world-overlay">
      <Suspense fallback={<SubWorldLoadingScreen />}>
        <SubWorldScene worldId={currentSubWorld} />
      </Suspense>
      
      {/* Return portal button */}
      <button 
        className="return-button"
        onClick={() => useWorldStore.setState({ currentSubWorld: null })}
      >
        Return to Town
      </button>
    </div>
  );
}

// Example: FishKeeper sub-world
function FishKeeperWorld() {
  return (
    <group>
      {/* Main aquarium tank */}
      <AquariumTank 
        size={[10, 5, 4]} 
        position={[0, 2.5, 0]}
        fishCount={30}
      />
      
      {/* Monitoring stations */}
      {[0, 1, 2, 3, 4, 5].map((i) => (
        <MonitoringStation
          key={i}
          position={[Math.cos(i * Math.PI / 3) * 6, 1, Math.sin(i * Math.PI / 3) * 6]}
          rotation={[0, -i * Math.PI / 3, 0]}
        />
      ))}
      
      {/* Health dashboard */}
      <HealthDashboard position={[0, 3, -5]} size={[4, 2]} />
      
      {/* Underwater viewing tunnel */}
      <ViewingTunnel position={[0, 0, 3]} length={8} />
      
      {/* Return portal */}
      <ReturnPortal position={[0, 0, -6]} destination="main_town" />
    </group>
  );
}
```

---

## 10. UI Overlay Architecture

### 10.1 HUD Component

```tsx
// ui/HUD.tsx
import { useWorldStore } from '../stores/worldStore';
import { formatGameTime } from '../utils/time';

export function HUD() {
  const worldTime = useWorldStore((s) => s.worldTime);
  const dayCount = useWorldStore((s) => s.dayCount);
  const agents = useWorldStore((s) => s.agents);
  const pheromoneLevel = useWorldStore((s) => s.activePheromones.length);
  const txRate = useWorldStore((s) => s.transactionRate);
  const bftHeight = useWorldStore((s) => s.bftBlockHeight);
  const weather = useWorldStore((s) => s.weatherState);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const currentQuality = useWorldStore((s) => s.currentQuality);
  
  const agentCount = agents.size;
  const timeStr = formatGameTime(worldTime);
  
  return (
    <div className="hud-container">
      {/* Top-left: World info */}
      <div className="hud-panel hud-top-left">
        <div className="hud-item">
          <span className="hud-label">Time</span>
          <span className="hud-value">{timeStr}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Day</span>
          <span className="hud-value">{dayCount}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Weather</span>
          <span className="hud-value">{weather}</span>
        </div>
      </div>
      
      {/* Top-center: BFT Status */}
      <div className="hud-panel hud-top-center">
        <div className="hud-bft">
          <span className="hud-bft-label">BFT Block</span>
          <span className="hud-bft-value">{bftHeight.toLocaleString()}</span>
          <div className="hud-bft-pulse" />
        </div>
      </div>
      
      {/* Top-right: Metrics */}
      <div className="hud-panel hud-top-right">
        <div className="hud-item">
          <span className="hud-label">Agents</span>
          <span className="hud-value">{agentCount}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">Pheromones</span>
          <span className="hud-value">{pheromoneLevel}</span>
        </div>
        <div className="hud-item">
          <span className="hud-label">x402/min</span>
          <span className="hud-value">{txRate}</span>
        </div>
      </div>
      
      {/* Bottom-left: Camera mode */}
      <div className="hud-panel hud-bottom-left">
        <div className="hud-camera">
          <span className="hud-label">Camera</span>
          <span className="hud-value">{cameraMode}</span>
        </div>
        <div className="hud-quality">
          <span className="hud-label">Quality</span>
          <span className={`hud-value hud-quality-${currentQuality}`}>
            {currentQuality}
          </span>
        </div>
      </div>
      
      {/* Bottom-center: Controls hint */}
      <div className="hud-panel hud-bottom-center">
        <div className="hud-controls">
          <span>1-4: Camera | WASD: Move | E: Interact | Tab: Inventory</span>
        </div>
      </div>
      
      {/* FPS Counter (dev only) */}
      {import.meta.env.DEV && <FPSCounter />}
    </div>
  );
}
```

### 10.2 Agent Labels (3D UI)

```tsx
// ui/AgentLabels.tsx
import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { Text } from '@react-three/drei';
import * as THREE from 'three';
import { useWorldStore } from '../stores/worldStore';

export function AgentLabels() {
  const agents = useWorldStore((s) => s.agents);
  const agent47 = useWorldStore((s) => s.agent47);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  
  // Hide labels in first-person mode
  if (cameraMode === 'firstPerson') return null;
  
  const allAgents = useMemo(() => {
    const list = Array.from(agents.values());
    if (agent47) list.push(agent47);
    return list;
  }, [agents, agent47]);
  
  return (
    <group>
      {allAgents.map((agent) => (
        <AgentLabel
          key={agent.id}
          agentId={agent.id}
          name={agent.name}
          caste={agent.caste}
          position={agent.position}
        />
      ))}
    </group>
  );
}

function AgentLabel({ agentId, name, caste, position }: {
  agentId: string;
  name: string;
  caste: CasteType;
  position: [number, number, number];
}) {
  const textRef = useRef<THREE.Mesh>(null);
  
  // Billboard: always face camera
  useFrame(({ camera }) => {
    if (textRef.current) {
      textRef.current.lookAt(camera.position);
    }
  });
  
  const labelPosition: [number, number, number] = [
    position[0],
    position[1] + 2.4, // Above agent head
    position[2],
  ];
  
  const casteColor = CASTE_COLORS[caste];
  
  return (
    <group position={labelPosition}>
      {/* Name plate background */}
      <mesh position={[0, 0, -0.05]}>
        <planeGeometry args={[name.length * 0.12 + 0.2, 0.3]} />
        <meshBasicMaterial color="#1A1A2E" transparent opacity={0.7} />
      </mesh>
      
      {/* Name text */}
      <Text
        ref={textRef}
        fontSize={0.15}
        color="white"
        anchorX="center"
        anchorY="middle"
        font="/fonts/inter-medium.woff"
      >
        {name}
      </Text>
      
      {/* Caste indicator dot */}
      <mesh position={[-name.length * 0.06 - 0.1, 0, 0]}>
        <circleGeometry args={[0.05, 8]} />
        <meshBasicMaterial color={casteColor} />
      </mesh>
    </group>
  );
}
```

### 10.3 Minimap

```tsx
// ui/Minimap.tsx
import { useWorldStore } from '../stores/worldStore';

const WORLD_SIZE = 800;
const MAP_SIZE = 200; // pixels

export function Minimap() {
  const agents = useWorldStore((s) => s.agents);
  const agent47 = useWorldStore((s) => s.agent47);
  const buildings = useWorldStore((s) => s.buildings);
  
  const scale = MAP_SIZE / WORLD_SIZE;
  
  const allAgents = Array.from(agents.values());
  if (agent47) allAgents.push(agent47);
  
  return (
    <div className="minimap-container">
      <div className="minimap-title">Colony Map</div>
      
      <svg 
        width={MAP_SIZE} 
        height={MAP_SIZE} 
        viewBox={`${-WORLD_SIZE/2} ${-WORLD_SIZE/2} ${WORLD_SIZE} ${WORLD_SIZE}`}
        className="minimap-svg"
      >
        {/* District zones */}
        {DISTRICT_ZONES.map((zone) => (
          <polygon
            key={zone.id}
            points={zone.points}
            fill={zone.color}
            opacity={0.2}
            stroke={zone.color}
            strokeWidth={2}
          />
        ))}
        
        {/* Buildings */}
        {Array.from(buildings.values()).map((b) => (
          <rect
            key={b.id}
            x={b.position[0] - b.width / 2}
            y={-b.position[2] - b.depth / 2}
            width={b.width}
            height={b.depth}
            fill={b.color}
            stroke="white"
            strokeWidth={1}
            rx={1}
          />
        ))}
        
        {/* Ring roads */}
        <circle cx={0} cy={0} r={60} fill="none" stroke="#555" strokeWidth={4} />
        <circle cx={0} cy={0} r={120} fill="none" stroke="#555" strokeWidth={6} />
        <circle cx={0} cy={0} r={200} fill="none" stroke="#555" strokeWidth={8} />
        
        {/* Agents */}
        {allAgents.map((agent) => (
          <circle
            key={agent.id}
            cx={agent.position[0]}
            cy={-agent.position[2]}
            r={agent.id === 'agent-47' ? 6 : 4}
            fill={agent.id === 'agent-47' ? '#FFD700' : CASTE_COLORS[agent.caste]}
            stroke={agent.id === 'agent-47' ? '#FFF' : 'none'}
            strokeWidth={2}
            className={agent.id === 'agent-47' ? 'minimap-player' : ''}
          >
            {agent.id === 'agent-47' && (
              <animate
                attributeName="r"
                values="5;7;5"
                dur="1.5s"
                repeatCount="indefinite"
              />
            )}
          </circle>
        ))}
        
        {/* Spoke roads */}
        {[0, 45, 90, 135, 180, 225, 270, 315].map((angle) => {
          const rad = (angle * Math.PI) / 180;
          return (
            <line
              key={angle}
              x1={0}
              y1={0}
              x2={Math.sin(rad) * 200}
              y2={-Math.cos(rad) * 200}
              stroke="#555"
              strokeWidth={4}
            />
          );
        })}
      </svg>
      
      {/* Legend */}
      <div className="minimap-legend">
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#FFD700' }} />
          <span>You (Agent 47)</span>
        </div>
        <div className="legend-item">
          <span className="legend-dot" style={{ background: '#FFF' }} />
          <span>Agents</span>
        </div>
      </div>
    </div>
  );
}
```

### 10.4 Dashboard (Full-Screen Metrics)

```tsx
// ui/Dashboard.tsx
import { useState } from 'react';
import { useWorldStore } from '../stores/worldStore';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer 
} from 'recharts';

export function Dashboard() {
  const [isOpen, setIsOpen] = useState(false);
  const agents = useWorldStore((s) => s.agents);
  const buildings = useWorldStore((s) => s.buildings);
  
  // Toggle with backtick key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === '`') setIsOpen(prev => !prev);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);
  
  if (!isOpen) return null;
  
  // Aggregate metrics
  const agentByCaste = {};
  agents.forEach((a) => {
    agentByCaste[a.caste] = (agentByCaste[a.caste] || 0) + 1;
  });
  
  return (
    <div className="dashboard-overlay">
      <div className="dashboard-panel">
        <h2>Colony Analytics Dashboard</h2>
        
        {/* Agent distribution */}
        <div className="dashboard-section">
          <h3>Agent Distribution by Caste</h3>
          <div className="caste-bars">
            {Object.entries(agentByCaste).map(([caste, count]) => (
              <div key={caste} className="caste-bar">
                <span className="caste-name">{caste}</span>
                <div 
                  className="caste-fill"
                  style={{ 
                    width: `${(count as number / 47) * 100}%`,
                    background: CASTE_COLORS[caste as CasteType]
                  }}
                />
                <span className="caste-count">{count}</span>
              </div>
            ))}
          </div>
        </div>
        
        {/* Building occupancy */}
        <div className="dashboard-section">
          <h3>Building Occupancy</h3>
          <table className="occupancy-table">
            <thead>
              <tr><th>Building</th><th>Occupancy</th><th>Capacity</th><th>%</th></tr>
            </thead>
            <tbody>
              {Array.from(buildings.values()).map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.currentOccupancy}</td>
                  <td>{b.maxOccupancy}</td>
                  <td>{((b.currentOccupancy / b.maxOccupancy) * 100).toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        
        {/* Transaction history chart */}
        <div className="dashboard-section">
          <h3>x402 Transaction Rate (Last Hour)</h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={txHistory}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="txRate" stroke="#FFD700" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        
        {/* Pheromone levels */}
        <div className="dashboard-section">
          <h3>Active Pheromone Levels</h3>
          <div className="pheromone-grid">
            {Object.entries(PHEROMONE_TYPES).map(([type, config]) => (
              <div key={type} className="pheromone-card">
                <div 
                  className="pheromone-swatch"
                  style={{ background: `#${config.color.getHexString()}` }}
                />
                <span className="pheromone-name">{type}</span>
                <span className="pheromone-count">
                  {activePheromones.filter(p => p.type === type).length}
                </span>
              </div>
            ))}
          </div>
        </div>
        
        <button className="dashboard-close" onClick={() => setIsOpen(false)}>
          Close (press `)
        </button>
      </div>
    </div>
  );
}
```

---

## 11. Asset Loading Strategy

### 11.1 Asset Pipeline

```
Source Assets                    Build Step                      Runtime Format
-------------                    ----------                      --------------
VRoid Studio .vrm        →       gltf-transform        →        .glb (Draco compressed)
                                     optimize
                                     --compress draco
                                     --texture-compress ktx2

Mixamo .fbx              →       Blender export        →        .glb (animation clips)
                                     glTF binary

Blender .blend           →       gltf-transform        →        .glb (LOD variants)
                                     simplify --ratio 0.5

Photoshop/AI .png        →       toktx / basisu        →        .ktx2 (GPU textures)

Font .ttf                →       msdf-atlas-gen        →        .png + .json (MSDF)
```

### 11.2 Loading Priority

```tsx
// systems/AssetLoader.tsx
import { useState, useEffect } from 'react';
import { useGLTF, useTexture, preload } from '@react-three/drei';

// Priority loading queues
const CRITICAL_ASSETS = [
  '/archetypes/archetype_0_lod0.glb',
  '/archetypes/archetype_1_lod0.glb',
  '/buildings/kings_tower.glb',
  '/environment/ground.glb',
];

const HIGH_ASSETS = [
  ...Array.from({ length: 8 }, (_, i) => `/archetypes/archetype_${i}_lod0.glb`),
  '/buildings/parliament.glb',
  '/buildings/marketplace.glb',
  '/animations/idle.glb',
  '/animations/walk.glb',
];

const MEDIUM_ASSETS = [
  // Remaining buildings
  ...BUILDING_IDS.map(id => `/buildings/${id}.glb`),
  // LOD variants
  ...Array.from({ length: 8 }, (_, i) => `/archetypes/archetype_${i}_lod1.glb`),
  // Additional animations
  '/animations/run.glb',
  '/animations/work.glb',
  '/animations/sit.glb',
  '/animations/talk.glb',
];

const LOW_ASSETS = [
  // Residential houses
  '/buildings/house_template.glb',
  // Props
  '/props/street_lamp.glb',
  '/props/bench.glb',
  '/props/tree.glb',
  // Weather
  '/textures/rain_particle.png',
  '/textures/snow_particle.png',
];

export function useProgressiveLoader() {
  const [progress, setProgress] = useState({ critical: 0, high: 0, medium: 0, low: 0 });
  const [phase, setPhase] = useState<'critical' | 'high' | 'medium' | 'low' | 'complete'>('critical');
  
  useEffect(() => {
    const loadPhase = async (assets: string[], phaseName: string) => {
      const total = assets.length;
      let loaded = 0;
      
      await Promise.all(
        assets.map(async (url) => {
          await preload(url);
          loaded++;
          setProgress(prev => ({ ...prev, [phaseName]: loaded / total }));
        })
      );
    };
    
    const loadAll = async () => {
      setPhase('critical');
      await loadPhase(CRITICAL_ASSETS, 'critical');
      
      setPhase('high');
      await loadPhase(HIGH_ASSETS, 'high');
      
      setPhase('medium');
      // Start medium priority loading in background
      loadPhase(MEDIUM_ASSETS, 'medium');
      
      setPhase('low');
      // Low priority loads on-demand
    };
    
    loadAll();
  }, []);
  
  return { progress, phase };
}
```

### 11.3 Runtime Loading with React Suspense

```tsx
// App.tsx
import { Suspense } from 'react';
import { Canvas } from '@react-three/fiber';
import { Loader } from '@react-three/drei';

function App() {
  return (
    <>
      <Canvas>
        <Suspense fallback={null}>
          <WorldStateProvider>
            <TownWorld />
          </WorldStateProvider>
        </Suspense>
      </Canvas>
      
      {/* Loading screen */}
      <Loader 
        containerStyles={{ background: '#1A1A2E' }}
        barStyles={{ background: '#FFD700' }}
        dataStyles={{ color: '#FFD700' }}
        dataInterpolation={(p) => `Loading CSOAI Town... ${p.toFixed(0)}%`}
      />
      
      {/* UI overlays */}
      <HUD />
      <Dashboard />
      <ChatLog />
    </>
  );
}
```

---

## 12. Post-Processing Pipeline

```tsx
// systems/PostProcessingPipeline.tsx
import { EffectComposer, Bloom, Outline, SSAO, Vignette } from '@react-three/postprocessing';
import { useWorldStore } from '../stores/worldStore';

export function PostProcessingPipeline() {
  const currentQuality = useWorldStore((s) => s.currentQuality);
  const cameraMode = useWorldStore((s) => s.cameraMode);
  const selectedAgent = useWorldStore((s) => s.selectedAgent);
  
  // Reduce effects in first-person mode for performance
  const isFirstPerson = cameraMode === 'firstPerson';
  
  // Skip post-processing on low quality
  if (currentQuality === 'low') return null;
  
  return (
    <EffectComposer 
      enabled={currentQuality !== 'low'}
      multisampling={currentQuality === 'ultra' ? 4 : 0}
    >
      {/* Bloom for pheromone glow and building lights */}
      <Bloom
        intensity={isFirstPerson ? 0.5 : 1.0}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.9}
        mipmapBlur
      />
      
      {/* SSAO for depth (medium+ only) */}
      {currentQuality !== 'medium' && !isFirstPerson && (
        <SSAO
          samples={16}
          radius={0.5}
          intensity={20}
          color="#000000"
        />
      )}
      
      {/* Vignette for cinematic feel */}
      <Vignette
        offset={0.3}
        darkness={0.5}
        eskil={false}
      />
    </EffectComposer>
  );
}
```

---

## 13. WebSocket Integration

```tsx
// systems/WebSocketClient.tsx
import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { useWorldStore } from '../stores/worldStore';

const WS_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:8000';

export function WebSocketClient() {
  const socketRef = useRef<Socket | null>(null);
  const updateAgent = useWorldStore((s) => s.updateAgent);
  const setAgent47 = useWorldStore((s) => s.setAgent47);
  
  useEffect(() => {
    const socket = io(WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 1000,
    });
    
    socketRef.current = socket;
    
    // Agent position updates (batched)
    socket.on('agent_positions', (positions: AgentPositionUpdate[]) => {
      positions.forEach(({ id, position, rotation, animationState, emotion }) => {
        updateAgent(id, { position, rotation, animationState, emotion });
      });
    });
    
    // Agent 47 position (direct)
    socket.on('agent47_update', (state: AgentState) => {
      setAgent47(state);
    });
    
    // Pheromone events
    socket.on('pheromone_emit', ({ position, type, intensity }) => {
      // Trigger local particle emission
      emitLocalPheromone(position, type, intensity);
    });
    
    // BFT updates
    socket.on('bft_update', ({ blockHeight, timestamp }) => {
      useWorldStore.setState({ 
        bftBlockHeight: blockHeight,
        lastConsensusTime: timestamp 
      });
    });
    
    // Transaction events
    socket.on('x402_transaction', ({ from, to, amount, type }) => {
      // Show transaction particle burst
      showTransactionEffect(from, to, amount, type);
    });
    
    // Governance events
    socket.on('proposal_update', (proposal: Proposal) => {
      useWorldStore.setState((state) => ({
        activeProposals: state.activeProposals.map(p => 
          p.id === proposal.id ? proposal : p
        )
      }));
    });
    
    return () => {
      socket.disconnect();
    };
  }, [updateAgent, setAgent47]);
  
  // Send Agent 47 input to server
  const sendInput = useCallback((input: Agent47Input) => {
    socketRef.current?.emit('agent47_input', input);
  }, []);
  
  return null;
}
```

---

## 14. Implementation Checklist

### Phase 1: Foundation (Weeks 1-3)
- [ ] Set up React + Vite + TypeScript project
- [ ] Install and configure Three.js + R3F + drei
- [ ] Implement Zustand world store
- [ ] Create ground plane with material zones
- [ ] Build Central District (King's Tower, Marketplace, Park)
- [ ] Implement basic camera system (isometric + first-person)
- [ ] Add basic lighting and shadows
- [ ] Set up WebSocket connection
- [ ] Target: Walk around Central District, see basic buildings

### Phase 2: Districts (Weeks 4-6)
- [ ] Build Governance District (3 buildings)
- [ ] Build Commerce District (4 buildings)
- [ ] Build Wellness District (3 buildings)
- [ ] Build Innovation District (3 buildings)
- [ ] Implement road network
- [ ] Add street lighting
- [ ] Add signage system
- [ ] Implement day/night cycle
- [ ] Target: All 8 districts visible with unique architecture

### Phase 3: Agents (Weeks 7-9)
- [ ] Create 8 VRoid archetypes
- [ ] Implement VRM loading + MToon shading
- [ ] Build animation state machine
- [ ] Implement facial expressions
- [ ] Add agent labels (name + caste)
- [ ] Implement LOD system for agents
- [ ] Add basic AI movement (Web Worker pathfinding)
- [ ] Target: 47 agents walking around town

### Phase 4: Polish (Weeks 10-12)
- [ ] Implement pheromone particle system
- [ ] Add weather effects (rain, snow)
- [ ] Implement post-processing (bloom, outline)
- [ ] Build HUD + minimap + dashboard
- [ ] Add ambient particles (fireflies, dust)
- [ ] Performance optimization (instancing, culling)
- [ ] Target: 60 FPS with full effects

### Phase 5: Portals (Weeks 13-15)
- [ ] Implement portal system with dissolve effect
- [ ] Build 3 detailed sub-worlds (FishKeeper, GrabHire, Meok)
- [ ] Create transition animations
- [ ] Add interactive elements in sub-worlds
- [ ] Return portal system
- [ ] Target: Walk into buildings, explore interiors

### Phase 6: Final Polish (Weeks 16-18)
- [ ] Sound effects and ambient audio
- [ ] Loading screen and asset optimization
- [ ] Mobile/touch input support
- [ ] Final performance tuning
- [ ] Documentation and deployment
- [ ] Target: Production-ready release

---

## 15. Reference: Complete Component Props Interfaces

```typescript
// types/components.ts

// Agent
interface AgentProps {
  agentId: string;
  archetypeId: number;
  variation: AgentVariation;
  initialPosition: [number, number, number];
  caste: CasteType;
  name: string;
  isPlayer?: boolean;
}

// Building
interface BuildingProps {
  buildingId: string;
  position: [number, number, number];
  rotation: [number, number, number];
  scale?: [number, number, number];
  lodUrls: [string, string, string]; // high, med, low
  interiorPortal?: PortalConfig;
  emissiveElements?: EmissiveElement[];
}

// Particle System
interface ParticleSystemProps {
  maxParticles: number;
  emissionRate: number;
  particleLifetime: [number, number]; // min, max
  particleSize: [number, number];
  color: THREE.Color | THREE.Color[];
  velocity: [number, number, number]; // base velocity
  velocityRandomness: number;
  gravity?: number;
  fadeRate: number;
  blendMode: 'normal' | 'additive';
}

// Portal
interface PortalProps {
  portalId: string;
  buildingId: string;
  position: [number, number, number];
  subWorldUrl: string;
  triggerRadius: number;
  dissolveDuration: number;
}

// Camera
interface CameraConfig {
  mode: CameraMode;
  fov: number;
  near: number;
  far: number;
  isometricAngle: [number, number, number];
  followOffset: [number, number, number];
  cinematicSpeed: number;
}

// UI
interface HUDConfig {
  showFPS: boolean;
  showAgentCount: boolean;
  showPheromoneLevel: boolean;
  showBFTStatus: boolean;
  minimapSize: number;
  chatHistoryLength: number;
}
```

---

*Document Version 1.0 - CSOAI Agent 47 Town Technical Rendering Architecture*
*Next Review: After Phase 1 implementation*
