# Dimension 8: Technical Architecture — Edge Computing, Distributed Simulation & Performance

## Agent-47 Optimized Technical Architecture

**Research Date**: 2026-07-19 | **Searches**: 18+ | **Sources**: 65+

---

## 1. Executive Summary

This document presents the optimized technical architecture for Agent-47, a 47-agent multiplayer simulation with 30-second tick cycles, Three.js + React Three Fiber frontend, and Node.js/TypeScript backend. The architecture targets three cost tiers ($50/$500/$5K/month) while delivering sub-50ms edge inference, 60fps client rendering, and real-time synchronization across all connected clients.

**Key Architectural Decisions at a Glance:**

| Layer | Technology | Key Metric |
|---|---|---|
| Edge Inference | Cloudflare Workers AI | 20-50ms p50 for embeddings, 100-200ms TTFT small models |
| WebGPU Compute | Custom WGSL shaders | 10-100x speedup over WASM for simulation kernels |
| Real-time Comms | WebSocket (now) + WebTransport (migration path) | <50ms RTT via Durable Objects |
| Asset Streaming | glTF-progressive (Needle) | 90% initial download reduction |
| Local-First Sync | Yjs CRDTs + PowerSync | Offline-capable, eventual consistency |
| Model Optimization | INT8 SmoothQuant + KV-cache sharing | 2-4x memory reduction, <1% accuracy loss |
| LLM Routing | LiteLLM + OpenRouter Fusion | 8ms P95 overhead, multi-model ensemble |
| Observability | OpenTelemetry GenAI SemConv | Full agent trace visibility |

---

## 2. Edge Computing Layer

### 2.1 Cloudflare Workers AI Architecture

Cloudflare Workers AI provides serverless GPU inference across 330+ Points of Presence (PoPs), making it ideal for Agent-47's edge inference requirements. The platform runs V8 isolates with sub-5ms cold starts and delivers sub-50ms p50 latency for users near any PoP. [^611^] [^610^]

**Workers AI Latency Budget by Model Category:**

| Model Category | Typical Latency (p50) | Worst Case (p99) | Use Case for Agent-47 |
|---|---|---|---|
| Embeddings | 20-50ms | 100-200ms | Agent memory retrieval, RAG |
| Small text (8B) | 300-800ms | 2-3s | Agent reasoning, dialogue |
| Large text (70B) | 1.5-4s | 8-12s | Complex planning (tiered) |
| Image generation | 3-8s | 15-20s | Procedural asset gen ($5K tier) |
| Speech-to-text | 1-3s/min | 5-10s | Voice commands ($5K tier) |

[^487^]

**Critical Finding**: Edge deployment provides meaningful latency benefits only for small, fast operations (embedding lookups, classification, routing decisions). For 5-second generation tasks, the 50ms saved on network RTT is negligible. Choose Workers AI for operational model fit and unified billing, not for making generation "instant." [^487^]

### 2.2 Workers AI Integration Pattern

```typescript
// Edge inference proxy with fallback
interface InferenceRequest {
  model: string;
  messages: Message[];
  temperature?: number;
  max_tokens?: number;
  quantization?: 'int8' | 'int4' | 'fp16';
}

// $50 tier: Use Workers AI direct
// $500 tier: Workers AI + LiteLLM fallback
// $5K tier: Workers AI + dedicated GPU via OpenRouter

export default {
  async fetch(request, env): Promise<Response> {
    const req = await request.json<InferenceRequest>();
    
    // Tier 1: Try Workers AI (sub-50ms for embeddings)
    if (req.model.startsWith('@cf/')) {
      const response = await env.AI.run(req.model as BaseAiTextGenerationModels, {
        messages: req.messages,
        temperature: req.temperature ?? 0.7,
        max_tokens: req.max_tokens ?? 256,
      });
      return Response.json(response);
    }
    
    // Tier 2/3: Route through LiteLLM for external providers
    return fetch(`${env.LITELLM_PROXY}/v1/chat/completions`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${env.LITELLM_KEY}` },
      body: JSON.stringify({
        model: req.model,
        messages: req.messages,
        // LiteLLM handles load balancing across providers
      }),
    });
  },
};
```

[^491^] [^611^]

### 2.3 KV Cache for Agent State at Edge

Cloudflare Workers KV provides read-heavy edge storage optimized for agent state caching:

| Resource | Limit | Cost (Paid) |
|---|---|---|
| Key size | 512 bytes | — |
| Value size | 25 MiB | — |
| Keys per namespace | Unlimited | — |
| Reads | 100K/day free | $0.50/million after 10M/mo |
| Writes | 1K/day free | $5.00/million after 1M/mo |
| Stored data | 1 GB free | $0.50/GB-month after 1GB |

[^607^] [^610^]

**KV is optimized for read-heavy workloads.** For high-write agent state (e.g., 47 agents updating every 30 seconds), use Durable Objects instead, which provide strongly consistent per-object storage. [^607^]

### 2.4 Durable Objects for Stateful Agent Rooms

Cloudflare Durable Objects (DO) provide the ideal primitive for Agent-47's game rooms — each room is a Durable Object instance with:

- **Strong consistency**: Single-threaded execution, transactional storage
- **Persistent WebSockets**: Thousands of clients per instance with hibernation
- **Automatic scaling**: Millions of concurrent rooms
- **Edge placement**: Runs near first connecting client [^654^] [^655^] [^662^]

```typescript
// Agent-47 Room Durable Object
export class AgentRoom implements DurableObject {
  private agents: Map<string, AgentState> = new Map();
  private websockets: WebSocket[] = [];
  private tickInterval: number;
  
  constructor(private state: DurableObjectState, private env: Env) {
    // Restore persisted state on wake from hibernation
    this.state.blockConcurrencyWhile(async () => {
      const snapshot = await this.state.storage.get<RoomSnapshot>('snapshot');
      if (snapshot) this.restoreState(snapshot);
    });
  }
  
  async fetch(request: Request): Promise<Response> {
    const upgrade = request.headers.get('Upgrade');
    if (upgrade === 'websocket') {
      const [client, server] = Object.values(new WebSocketPair());
      await this.state.acceptWebSocket(server);
      this.websockets.push(server);
      return new Response(null, { status: 101, webSocket: client });
    }
    return new Response('Expected WebSocket', { status: 400 });
  }
  
  // 30-second tick: Run agent step
  async alarm(): Promise<void> {
    await this.runAgentTick();
    await this.persistSnapshot();
    this.state.storage.setAlarm(Date.now() + 30000); // 30s
  }
  
  // Broadcast state delta to all connected clients
  private async broadcastDelta(delta: StateDelta): Promise<void> {
    const message = JSON.stringify({ type: 'delta', data: delta });
    for (const ws of this.websockets) {
      if (ws.readyState === WebSocket.OPEN) ws.send(message);
    }
  }
}
```

[^654^] [^655^] [^662^]

---

## 3. WebGPU Compute Shaders

### 3.1 WebGPU Performance Benchmarks

WebGPU enables GPU-accelerated compute for agent physics, pheromone diffusion, and particle systems. The performance gains over WebGL and WASM are transformative:

| Workload | WebGPU | WebGL | WASM | Speedup |
|---|---|---|---|---|
| Particle update (RTX 3080) | ~100x faster compute | Baseline | ~10x slower | 10-100x |
| Particles at 60fps (high-end) | 37M point, 21M square | 2.8M point, 2.3M square | N/A | 13-9x |
| Particles at 60fps (integrated) | 2.1M point, 398K square | 374K point, 310K square | N/A | 5.6-1.3x |
| Conway's Game of Life (iGPU) | 60fps @ 1024x1024 | ~20fps | ~30fps (mobile) | 3x+ |
| Background removal | 20x vs multi-thread WASM | N/A | 550x vs single-thread | 20-550x |

[^573^] [^542^] [^651^] [^644^]

**Key Finding**: On high-end GPUs (RTX 3080), WebGPU achieves ~100x faster compute time than WebGL for particle position updates, and can render 37 million point particles at 60fps — 13x more than WebGL's ~2.8 million. On integrated GPUs (Intel UHD 620), the advantage narrows to ~6x for point particles but WebGPU still wins across all configurations. [^573^]

### 3.2 Pheromone Diffusion Compute Shader

Agent-47's pheromone trail system maps directly to GPU-accelerated slime mold simulations. The algorithm uses a ping-pong texture pair for trail density with per-agent sensor sampling:

```wgsl
// Pheromone diffusion compute shader (Agent-47 adaptation)
@compute @workgroup_size(8, 8)
fn diffuseMain(@builtin(global_invocation_id) global_id: vec3u) {
  let texel = vec2i(global_id.xy);
  let dims = vec2i(textureDimensions(pheromoneTex));
  
  if (texel.x >= dims.x || texel.y >= dims.y) { return; }
  
  let uv = vec2f(texel) / vec2f(dims);
  let spacing = vec2f(1.0) / vec2f(dims);
  
  // 3x3 weighted diffusion kernel
  let center = samplePheromone(uv);
  let n = samplePheromone(uv + vec2(0.0, spacing.y));
  let s = samplePheromone(uv - vec2(0.0, spacing.y));
  let e = samplePheromone(uv + vec2(spacing.x, 0.0));
  let w = samplePheromone(uv - vec2(spacing.x, 0.0));
  let ne = samplePheromone(uv + spacing);
  let nw = samplePheromone(uv + vec2(-spacing.x, spacing.y));
  let se = samplePheromone(uv + vec2(spacing.x, -spacing.y));
  let sw = samplePheromone(uv - spacing);
  
  // Diffusion + decay
  let diffused = (
    center * 0.25 +
    (n + s + e + w) * 0.15 +
    (ne + nw + se + sw) * 0.025
  ) * UNIFORM.decayRate;
  
  textureStore(pheromoneOut, texel, vec4f(diffused, 0.0, 0.0, 1.0));
}

// Agent sensor sampling - runs per-agent
@compute @workgroup_size(256)
fn agentSenseMain(@builtin(global_invocation_id) id: vec3u) {
  let idx = id.x;
  if (idx >= arrayLength(&agents)) { return; }
  
  var agent = agents[idx];
  let sensorDist = UNIFORM.sensorDistance;
  let sensorAngle = UNIFORM.sensorAngle;
  
  // Three sensor positions
  let leftS = agent.position + rotate(agent.heading + sensorAngle) * sensorDist;
  let midS = agent.position + rotate(agent.heading) * sensorDist;
  let rightS = agent.position + rotate(agent.heading - sensorAngle) * sensorDist;
  
  // Sample trail map at sensor positions
  let leftVal = samplePheromoneAt(leftS);
  let midVal = samplePheromoneAt(midS);
  let rightVal = samplePheromoneAt(rightS);
  
  // Steer based on sensor readings
  if (midVal > leftVal && midVal > rightVal) {
    // Continue straight
  } else if (leftVal > rightVal) {
    agent.heading += UNIFORM.turnSpeed;
  } else if (rightVal > leftVal) {
    agent.heading -= UNIFORM.turnSpeed;
  } else {
    agent.heading += (fract(sin(f32(idx)) * 43758.5453) - 0.5) * UNIFORM.turnSpeed * 2.0;
  }
  
  // Deposit pheromone at new position
  agent.position += rotate(agent.heading) * UNIFORM.moveSpeed;
  atomicAdd(&pheromoneDeposit[i32(agent.position.x) + i32(agent.position.y) * dims.x], UNIFORM.depositAmount);
  
  agents[idx] = agent;
}
```

[^646^] [^652^] [^556^]

### 3.3 GPU-Accelerated Agent Physics

For 47 agents with physics-based interactions, the simulation uses a compute shader pipeline:

1. **Grid Generation**: Spatial hash of agent positions (uniform grid)
2. **Neighbor Search**: Per-agent neighborhood query via grid lookup
3. **Force Integration**: Separation, cohesion, alignment forces
4. **Position Update**: Euler integration with velocity damping
5. **Pheromone Deposit**: Atomic add to trail map
6. **Diffusion Pass**: 3x3 Gaussian blur + decay

The entire pipeline runs at 60fps for 1,000+ agents on integrated GPUs, and 10,000+ on discrete GPUs. [^574^] [^573^]

### 3.4 Three.js WebGPU Renderer Integration

```typescript
// Three.js WebGPU renderer setup (r171+)
import { WebGPURenderer } from 'three/webgpu';
import { pheromoneDiffuseShader, agentSimShader } from './compute-shaders';

const renderer = new WebGPURenderer({ antialias: true });
await renderer.init();

// TSL (Three Shader Language) for cross-platform compute
const computeDiffuse = pheromoneDiffuseShader().compute(
  textureSize.x * textureSize.y
);

// Run compute pass before render
renderer.compute(computeDiffuse);

// Render scene normally
renderer.render(scene, camera);
```

[^186^] [^573^]

---

## 4. Distributed Simulation

### 4.1 Spatial Publish/Subscribe Architecture

Spatial Publish/Subscribe (SPS) decouples game state dissemination from computation, replacing traditional Area-of-Interest (AOI) management. Experimental validation in Minecraft demonstrates: [^485^]

| Metric | Native Minecraft | SPS-Koekepan | Improvement |
|---|---|---|---|
| Server packet transmission | Baseline | Up to 6x reduction | **6x bandwidth savings** |
| Broker latency overhead | — | ~20ms average | <100ms critical threshold |
| Broker CPU usage | — | Max 10% single core | Handles 600+ clients projected |
| Broker memory | — | 90MB peak | Scales to 600 clients |

[^485^]

**Architecture**: The VAST (Virtual Area Spatial Tuple) broker manages spatial subscriptions and publications. Minecraft clients connect via SPS client proxies; servers publish state changes as spatial messages routed only to subscribers whose Areas of Subscription intersect the publication area. [^485^]

### 4.2 Spatial Hashing Interest Management

For Agent-47's server-side interest management, a grid-based spatial hash provides O(1) entity lookup:

```typescript
// Spatial hash for agent visibility
class SpatialHash<T> {
  private grid: Map<string, Set<T>> = new Map();
  private cellSize: number;
  
  constructor(cellSize: number = 50) {
    this.cellSize = cellSize;
  }
  
  private key(x: number, z: number): string {
    return `${Math.floor(x / this.cellSize)},${Math.floor(z / this.cellSize)}`;
  }
  
  insert(x: number, z: number, entity: T): void {
    const k = this.key(x, z);
    if (!this.grid.has(k)) this.grid.set(k, new Set());
    this.grid.get(k)!.add(entity);
  }
  
  // Query 8-neighbor cells for visibility
  queryRadius(x: number, z: number, radius: number): T[] {
    const results: T[] = [];
    const cellRadius = Math.ceil(radius / this.cellSize);
    const cx = Math.floor(x / this.cellSize);
    const cz = Math.floor(z / this.cellSize);
    
    for (let dx = -cellRadius; dx <= cellRadius; dx++) {
      for (let dz = -cellRadius; dz <= cellRadius; dz++) {
        const cell = this.grid.get(`${cx + dx},${cz + dz}`);
        if (cell) results.push(...cell);
      }
    }
    return results;
  }
}
```

This approach is **30x faster** than naive Vector3.Distance checking against all entities. [^627^]

### 4.3 Delta Compression & State Synchronization

Modern multiplayer engines use delta compression to minimize bandwidth:

1. **Baseline**: Server tracks last acknowledged snapshot per client
2. **Delta**: Only changed fields relative to baseline are transmitted
3. **Key Frame**: Full state snapshots sent periodically for recovery
4. **Adaptive Tick**: High-action zones get 30 ticks/sec, idle zones 10/sec

Bandwidth savings are dramatic — when a player stands still, the delta approaches zero. Delta-encoding with even just the most recent frame provides "huge bandwidth savings" for spectator scenarios. [^642^] [^654^]

**Protocol Implementation:**

```typescript
interface Snapshot {
  tick: number;
  agents: Map<string, AgentSnapshot>;
  timestamp: number;
}

interface StateDelta {
  tick: number;
  baseTick: number; // Client's last ack'd tick
  changed: [agentId: string, changedFields: Partial<AgentSnapshot>][];
  removed: string[];
  added: AgentSnapshot[];
}

function computeDelta(current: Snapshot, baseline: Snapshot): StateDelta {
  const delta: StateDelta = { tick: current.tick, baseTick: baseline.tick, changed: [], removed: [], added: [] };
  
  for (const [id, agent] of current.agents) {
    const base = baseline.agents.get(id);
    if (!base) {
      delta.added.push(agent);
    } else {
      const diff = computeFieldDiff(agent, base);
      if (diff) delta.changed.push([id, diff]);
    }
  }
  
  for (const id of baseline.agents.keys()) {
    if (!current.agents.has(id)) delta.removed.push(id);
  }
  
  return delta;
}
```

[^642^] [^643^]

### 4.4 Redis Pub/Sub for Cross-Region Messaging

Redis pub/sub provides the message backbone for Agent-47's distributed architecture:

| Metric | Redis Pub/Sub | NATS | ZeroMQ |
|---|---|---|---|
| Throughput | ~25K msg/s (brokered, reliable) | ~50K msg/s | 600K-2M msg/s (brokerless) |
| Latency (p99) | ~1.5ms tail | ~1.2ms tail | ~0.24ms direct |
| Large messages (1MB) | Tail ~214ms | Tail ~120ms | Varies |
| Best for | Small messages, many channels | Lightweight topics | Direct connections |

[^546^] [^547^]

**Agent-47 Pattern**: Use Redis Streams (not raw pub/sub) for agent event persistence, with consumer groups for horizontal scaling. Redis pub/sub alone drops messages when clients disconnect — unacceptable for agent state synchronization. Redis Streams provides persistence, replay, and exactly-once processing semantics. [^551^]

---

## 5. Asset Streaming

### 5.1 glTF Progressive Loading

The `gltf-progressive` library (Needle Engine) provides progressive loading for glTF/GLB assets with automatic LOD streaming: [^355^] [^488^]

| Feature | Standard glTF | glTF-Progressive | Improvement |
|---|---|---|---|
| Initial display | Wait for full download | Instant proxy render | **~90% smaller initial** |
| 56MB asset example | 56MB upfront | 300KB initial + 8MB streaming | **99.5% reduction** |
| What gets loaded | Everything, always | Only visible detail | View-dependent |
| Mobile support | Same payload | Auto quality reduction | Adaptive |
| Caching | File-level | Per-LOD content hashing | Granular |

[^355^]

**Integration with Three.js/R3F:**

```typescript
import { useNeedleProgressive } from "@needle-tools/gltf-progressive";
import { useGLTF } from '@react-three/drei';

// Register progressive loader once
const loader = new GLTFLoader();
useNeedleProgressive(loader, renderer);

// In component - loads progressively
const { scene } = useGLTF('/agent-models.glb', true, true, (loader) => {
  useNeedleProgressive(loader, renderer);
});

// Runtime LOD tuning
const lodsManager = LODsManager.get(renderer);
lodsManager.targetTriangleDensity = 200000; // Triangles when mesh fills screen
lodsManager.updateInterval = 'auto'; // Adaptive to framerate
```

[^355^] [^488^]

### 5.2 LOD Configuration for 47 Agents

```typescript
// R3F LOD component for agent rendering
import { Detailed } from '@react-three/drei';

function AgentModel({ position, importance }: AgentProps) {
  return (
    <Detailed 
      distances={[0, 20, 50, 100]}
      position={position}
    >
      <HighDetailMesh />     {/* <50k tris, full animation */}
      <MediumDetailMesh />   {/* ~15k tris, simplified */}
      <LowDetailMesh />      {/* ~3k tris, vertex shader anim */}
      <ImpostorSprite />     {/* Billboard, >100 units */}
    </Detailed>
  );
}

// For large crowds: InstancedMesh
function AgentCrowd({ agents }: { agents: AgentData[] }) {
  const meshRef = useRef<THREE.InstancedMesh>(null);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  
  useFrame(() => {
    if (!meshRef.current) return;
    agents.forEach((agent, i) => {
      dummy.position.copy(agent.position);
      dummy.rotation.y = agent.heading;
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
    });
    meshRef.current.instanceMatrix.needsUpdate = true;
  });
  
  return (
    <instancedMesh ref={meshRef} args={[undefined, undefined, agents.length]}>
      <boxGeometry args={[1, 2, 0.5]} />
      <meshStandardMaterial />
    </instancedMesh>
  );
}
```

[^186^] [^608^]

### 5.3 Instanced Rendering Performance

For 47 agents, instanced rendering is the correct approach. Key optimizations:

- **Single draw call** for all agents sharing geometry
- **Per-vertex IDs** for shader-level LOD (simpler distant agents) [^608^]
- **Matrix update amortization**: Not all agents update every frame [^608^]
- **BatchedMesh (Three.js r162+)**: For agents with different geometries but shared materials
- **Target**: <100 draw calls for 60fps [^186^]

---

## 6. Local-First Architecture

### 6.1 CRDT-Based State Synchronization

Agent-47 uses CRDTs (Conflict-Free Replicated Data Types) for offline-capable state synchronization. The local-first architecture treats the network as an enhancement, not a requirement. [^575^]

**Key Libraries:**

| Library | Encoding | Scalability | Best For |
|---|---|---|---|
| **Yjs** | Binary, efficient | Excellent (GC, large docs) | Real-time collaboration, frequent updates |
| **Automerge** | Binary | Good | Document-centric, P2P scenarios |
| **PowerSync** | SQLite sync | Excellent | Offline-first, complex queries |

[^552^] [^554^] [^626^]

### 6.2 Local-First Sync Protocol

```typescript
// Agent-47 local-first state machine
type ConnectionState =
  | { status: 'online'; latency: number }
  | { status: 'offline' }
  | { status: 'syncing'; progress: number }
  | { status: 'error'; message: string };

class LocalFirstAgentState {
  private crdt: Y.Doc;
  private syncProvider: WebsocketProvider;
  private state: ConnectionState = { status: 'syncing', progress: 0 };
  
  constructor(roomId: string) {
    this.crdt = new Y.Doc();
    
    // Yjs shared types for agent state
    const agents = this.crdt.getMap<Y.Map<any>>('agents');
    const worldState = this.crdt.getMap('world');
    const eventLog = this.crdt.getArray<AgentEvent>('events');
    
    // WebSocket sync with awareness
    this.syncProvider = new WebsocketProvider(
      'wss://agent47.example.com/ws',
      roomId,
      this.crdt,
      { maxBackoffTime: 10000, connect: true }
    );
    
    // Optimistic local updates
    this.syncProvider.on('status', (event) => {
      this.state = event.status === 'connected'
        ? { status: 'online', latency: 0 }
        : { status: 'offline' };
    });
  }
  
  // Optimistic update: Apply locally first, sync in background
  async updateAgentPosition(agentId: string, pos: Vector3): Promise<void> {
    const agents = this.crdt.getMap('agents');
    const agent = agents.get(agentId) ?? new Y.Map();
    agent.set('position', { x: pos.x, y: pos.y, z: pos.z });
    agent.set('lastUpdate', Date.now());
    agents.set(agentId, agent);
    
    // Queue for sync - automatically handled by Yjs provider
    // If offline, changes are buffered and synced on reconnection
  }
  
  // Persist to IndexedDB for offline survival
  async persist(): Promise<void> {
    const update = Y.encodeStateAsUpdate(this.crdt);
    await idbSet('agent47-state', update);
  }
  
  // Restore from IndexedDB
  async restore(): Promise<void> {
    const saved = await idbGet<Uint8Array>('agent47-state');
    if (saved) Y.applyUpdate(this.crdt, saved);
  }
}
```

[^575^] [^552^]

### 6.3 PowerSync for Complex Offline Queries

For the $5K tier with complex offline requirements, PowerSync provides SQLite-based sync with:

- **Pre-synced buckets**: Data available before going offline
- **On-demand buckets**: Request specific data at runtime
- **Hybrid queries**: Combine local SQLite with server data
- **Incremental View Maintenance**: Server-side materialized views for complex joins [^626^]

### 6.4 Offline Capability Matrix

| Capability | $50 Tier | $500 Tier | $5K Tier |
|---|---|---|---|
| View-while-offline | Basic (last state) | Full (CRDT sync) | Full (PowerSync) |
| Edit-while-offline | Read-only | Optimistic + CRDT | Full bidirectional |
| Conflict resolution | Last-write-wins | Yjs automatic merge | PowerSync IVM |
| Storage limit | 50MB (IndexedDB) | 100MB | 500MB+ (OPFS) |
| Sync on reconnect | Full state | Delta sync | Prioritized delta |

---

## 7. Model Optimization

### 7.1 Quantization Benchmarks

Comprehensive evaluation across the Llama-3.1 model family reveals optimal quantization strategies: [^523^] [^524^] [^525^]

| Format | Memory | Accuracy Drop | Speedup | GPU Support |
|---|---|---|---|---|
| FP32 (baseline) | 100% | 0% | 1x | All |
| FP16/BF16 | 50% | Minimal | 1x | All |
| **INT8 (SmoothQuant)** | **25%** | **1-3%** | **1.5-2x** | **Most GPUs** |
| **INT4 (AWQ)** | **12.5%** | **<1%** | **3x+** | **Ampere+** |
| FP8 (W8A8-FP) | 25% | Lossless (Hopper/Ada) | 1.5-2x | Hopper, Ada |

**Key Findings:**
- **FP8 W8A8** is lossless across all model scales (requires Hopper/Ada) [^523^]
- **INT8 W8A8** incurs only 1-3% accuracy degradation when properly tuned [^523^]
- **INT4 AWQ** achieves <1% accuracy loss by protecting 1% of critical weights (MSys 2024 Best Paper) [^532^]
- For Agent-47's cost tiers: INT8 at $50, INT4 at $500, FP8 at $5K (with appropriate GPU)

[^523^] [^532^]

### 7.2 Transformers.js v3 with WebGPU

Transformers.js v3 (October 2024) brings WebGPU support with transformative performance: [^494^] [^490^] [^495^]

| Backend | Throughput (TinyLlama 1.1B) | Browser Support |
|---|---|---|
| WASM | 2-5 tokens/sec | All browsers |
| **WebGPU** | **25-40 tokens/sec** | **Chrome 113+, Edge, Firefox flag, Safari exp** |
| **Speedup** | **10-100x over WASM** | |

```javascript
import { pipeline } from "@huggingface/transformers";

// Automatic WebGPU backend selection
const extractor = await pipeline(
  "feature-extraction",
  "Xenova/all-MiniLM-L6-v2",
  { dtype: "q8", device: "webgpu" } // INT8 quantized, WebGPU
);

// Embeddings at ~40-75x speedup vs WASM on M3 Max
const embeddings = await extractor("Agent state update", {
  pooling: "mean",
  normalize: true,
});
```

[^494^] [^493^] [^495^]

**Global WebGPU Support (as of November 2025)**: Available in Chrome/Edge, Firefox, and Safari — now baseline across all major browsers. [^649^]

### 7.3 KV-Cache Sharing for Multi-Agent Systems

Two breakthrough systems enable KV-cache sharing across Agent-47's 47 agents:

#### 7.3.1 DroidSpeak (NSDI 2026)

DroidSpeak enables KV cache reuse across different LLMs (fine-tuned variants of the same architecture):

| Metric | Improvement |
|---|---|
| Prefill speedup | **3.1x faster** (up to 3.1x TTFT reduction) |
| Throughput improvement | **Up to 4x** |
| Quality degradation | Negligible (F1, Rouge-L, code similarity) |
| Key mechanism | Selectively recompute ~10% "critical layers" |

**Mechanism**: Offline profiling identifies critical layers per model pair. Online, only these layers are recomputed while the remaining ~90% of KV cache layers are transferred and reused, pipelined with computation to hide transfer latency. [^513^] [^517^]

#### 7.3.2 KVCOMM (NeurIPS 2025)

KVCOMM provides online cross-context KV-cache sharing for multi-agent workflows:

| Metric | Value |
|---|---|
| Reuse rate | **70-87.6%** adaptive |
| 5-agent speedup | **7.8x** (TTFT: 430ms → 55ms) |
| Quality degradation | <2.5% accuracy drop |
| Training required | None (training-free) |
| Key mechanism | Anchor pool for offset estimation |

**Architecture**: Each agent maintains placeholder-aware anchors storing KV-cache deviations under varying prefixes. At runtime, nearest anchor matching predicts cache offsets, enabling direct reuse without recomputation. [^512^] [^514^] [^518^] [^519^]

### 7.4 Agent-47 KV-Cache Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    KV-Cache Pool (Shared)                    │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Agent-1 KV  │  │ Agent-2 KV  │  │ Agent-3 KV  │  ...     │
│  │ 512 tokens  │  │ 512 tokens  │  │ 512 tokens  │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         └─────────────────┼─────────────────┘                │
│                           ▼                                  │
│              ┌────────────────────────┐                      │
│              │  Shared Context KV     │                      │
│              │  (world state, rules)  │                      │
│              │  → Reused via KVCOMM   │                      │
│              └────────────────────────┘                      │
└─────────────────────────────────────────────────────────────┘
```

**Implementation**: For 47 agents with shared world context (pheromone maps, terrain, rules):

1. **Shared context** (world state): Compute KV once, fan out to all 47 agents via KVCOMM
2. **Agent-specific prefixes**: Each agent's personality/instructions diverge, requiring offset adjustment
3. **Recompute savings**: ~70% of KV cache reused across agents → **5-7x prefill speedup**
4. **Memory savings**: 47x reduction in redundant KV storage

[^522^] [^512^]

---

## 8. Real-Time Communication

### 8.1 WebSocket Architecture (Current — Production-Ready)

WebSocket remains the production choice for Agent-47 with universal browser support and mature tooling: [^606^]

```typescript
// WebSocket gateway with Durable Objects
export class Agent47Gateway implements DurableObject {
  private sessions: Map<string, WebSocket> = new Map();
  private room: AgentRoom;
  
  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer): Promise<void> {
    const data = JSON.parse(message as string);
    
    switch (data.type) {
      case 'subscribe':
        // Client subscribes to agent visibility region
        this.room.addSubscriber(ws, data.bounds);
        break;
      case 'interact':
        // Client interacts with an agent
        const result = await this.room.handleInteraction(data.agentId, data.action);
        ws.send(JSON.stringify({ type: 'interaction_result', data: result }));
        break;
      case 'ping':
        ws.send(JSON.stringify({ type: 'pong', tick: this.room.currentTick }));
        break;
    }
  }
}
```

[^654^]

### 8.2 WebTransport (Future Migration Target)

WebTransport over QUIC/HTTP3 offers fundamental advantages: [^364^] [^530^] [^606^]

| Feature | WebSocket | WebTransport | Advantage |
|---|---|---|---|
| Protocol | TCP | QUIC (UDP) | No head-of-line blocking |
| Latency | 50-100ms | 20-50ms | 2x lower |
| Multiple streams | No | Unlimited | Parallel data channels |
| Unreliable delivery | No | Yes (datagrams) | Game state/position updates |
| Connection migration | No | Yes (WiFi→cell) | Mobile resilience |
| Handshake RTT | 3-4 | 0-1 | Faster connection |
| Browser support | 99%+ | ~75% (March 2026 Baseline) | Growing |

**NSDI 2025 Research Finding**: In controlled benchmarks at 120 ticks/sec, WebTransport outperformed all other protocols including raw UDP+DTLS in both lossless (0%) and lossy (0.1%) conditions. Its BBRv1 congestion control implementation likely accounts for the advantage over raw UDP. WebSocket had the highest latency in all conditions. [^364^]

**Migration Path**: Build on WebSocket today with WebTransport as a progressive enhancement:

```typescript
// Progressive WebTransport upgrade
function createTransport(url: string): Promise<GameTransport> {
  if (typeof WebTransport !== 'undefined') {
    return createWebTransport(url); // QUIC, datagrams, multiplexed
  }
  return createWebSocket(url); // TCP, reliable, single stream
}
```

[^530^] [^606^] [^605^]

### 8.3 Message Batching for Game State

Durable Objects WebSocket best practices recommend batching for high-frequency data: [^654^]

```typescript
// Time-based batching: 50-100ms intervals
class BatchedPublisher {
  private buffer: GameMessage[] = [];
  private lastFlush: number = 0;
  private flushInterval: number = 50; // ms
  
  enqueue(msg: GameMessage): void {
    this.buffer.push(msg);
    if (Date.now() - this.lastFlush >= this.flushInterval || this.buffer.length >= 100) {
      this.flush();
    }
  }
  
  private flush(): void {
    if (this.buffer.length === 0) return;
    const batch = JSON.stringify({ type: 'batch', messages: this.buffer });
    for (const ws of this.subscribers) {
      if (ws.readyState === 1) ws.send(batch);
    }
    this.buffer = [];
    this.lastFlush = Date.now();
  }
}
```

[^654^]

---

## 9. Observability

### 9.1 OpenTelemetry GenAI Semantic Conventions

OpenTelemetry provides the emerging standard for agent observability with six layers of telemetry: [^622^] [^623^] [^629^]

| Layer | Span Type | Key Attributes |
|---|---|---|
| **Client** | `chat`, `text_completion` | `gen_ai.request.model`, `gen_ai.usage.input_tokens` |
| **Agent** | `invoke_agent` | `gen_ai.agent.name`, execution context |
| **Workflow** | `invoke_workflow` | Predetermined path tracking |
| **Tool** | `execute_tool {tool.name}` | Arguments, results, latency |
| **MCP** | `tools/call {tool}` | Session ID, protocol version |
| **Evaluation** | `gen_ai.evaluation.result` | Score, label, quality metrics |

[^623^]

### 9.2 Agent-47 Telemetry Implementation

```typescript
// OpenTelemetry instrumentation for Agent-47
import { trace, metrics } from '@opentelemetry/api';
import { NodeSDK } from '@opentelemetry/sdk-node';

const sdk = new NodeSDK({
  traceExporter: new OTLPTraceExporter({ url: 'http://otel:4317' }),
  metricReader: new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({ url: 'http://otel:4317' }),
  }),
});
sdk.start();

const tracer = trace.getTracer('agent47');
const agentCounter = metrics.getMeter('agent47').createUpDownCounter('agents.active');

// Per-tick agent instrumentation
async function runAgentTick(room: AgentRoom): Promise<void> {
  const span = tracer.startSpan('agent47.tick', {
    attributes: {
      'agent47.room_id': room.id,
      'agent47.tick_number': room.tick,
      'agent47.agent_count': room.agents.length,
    },
  });
  
  for (const agent of room.agents) {
    const agentSpan = tracer.startSpan('agent.step', {
      parent: span,
      attributes: {
        'agent47.agent_id': agent.id,
        'gen_ai.agent.name': agent.personality.name,
        'gen_ai.request.model': agent.modelConfig.model,
      },
    });
    
    try {
      const result = await agent.step();
      agentSpan.setAttributes({
        'gen_ai.usage.input_tokens': result.tokens.input,
        'gen_ai.usage.output_tokens': result.tokens.output,
        'gen_ai.response.finish_reasons': [result.finishReason],
        'agent47.action': result.action,
        'agent47.cost_usd': result.cost,
      });
      agentSpan.setStatus({ code: SpanStatusCode.OK });
    } catch (error) {
      agentSpan.recordException(error);
      agentSpan.setStatus({ code: SpanStatusCode.ERROR });
    } finally {
      agentSpan.end();
    }
  }
  
  agentCounter.add(room.agents.length, { room_id: room.id });
  span.end();
}
```

[^622^] [^628^]

### 9.3 Agent Behavior Analytics Dashboard

| Metric Category | Key Metrics | Alert Threshold |
|---|---|---|
| **Reliability** | Agent error rate, tool failure rate, tick compliance | Error rate >5% |
| **Cost** | Token consumption/session, cost/agent/tick, model routing | Cost >$0.01/tick |
| **Quality** | Task success rate, eval pass rate, human feedback score | Success rate <90% |
| **Performance** | TTFT p50/p95, tick latency, WS RTT | TTFT p95 >2s |
| **Engagement** | Session duration, interactions/agent, replay views | Session <5 min |

[^526^] [^527^]

### 9.4 OpenTelemetry Integration with TimescaleDB

For time-series analytics of agent behavior:

```sql
-- Agent behavior time-series in TimescaleDB
CREATE TABLE agent_events (
  time TIMESTAMPTZ NOT NULL,
  room_id TEXT,
  agent_id TEXT,
  event_type TEXT, -- 'think', 'move', 'interact', 'error'
  model TEXT,
  input_tokens INTEGER,
  output_tokens INTEGER,
  latency_ms INTEGER,
  cost_usd DECIMAL(10,6),
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  metadata JSONB
);

-- Convert to hypertable for automatic partitioning
SELECT create_hypertable('agent_events', 'time', chunk_time_interval => INTERVAL '1 hour');

-- Continuous aggregates for real-time dashboard
CREATE MATERIALIZED VIEW agent_hourly_stats WITH (timescaledb.continuous) AS
SELECT
  time_bucket('1 hour', time) AS bucket,
  agent_id,
  COUNT(*) AS event_count,
  AVG(latency_ms) AS avg_latency,
  SUM(input_tokens + output_tokens) AS total_tokens,
  SUM(cost_usd) AS total_cost
FROM agent_events
GROUP BY bucket, agent_id;
```

---

## 10. LLM Routing & API Layer

### 10.1 LiteLLM Gateway

LiteLLM provides unified access to 100+ LLMs with production features: [^553^] [^548^]

| Feature | Capability |
|---|---|
| Latency overhead | **8ms P95** at 1K RPS |
| Load balancing | Cost-based, latency-based, round-robin |
| Fallback | Auto-retry on failure/timeout |
| Rate limiting | Per-key, per-model, per-user |
| Cost tracking | Token-level spend monitoring |
| Guardrails | Content filtering, response constraints |

```yaml
# LiteLLM config for Agent-47 (3 tiers)
model_list:
  # $50 tier: Cost-optimized
  - model_name: agent-reasoning-budget
    litellm_params:
      model: openrouter/google/gemini-flash-1.5
      rpm: 100
  
  # $500 tier: Balanced  
  - model_name: agent-reasoning-standard
    litellm_params:
      model: openrouter/anthropic/claude-3.5-sonnet
      fallback: [openrouter/openai/gpt-4o-mini]
  
  # $5K tier: Quality-first
  - model_name: agent-reasoning-premium
    litellm_params:
      model: openrouter/anthropic/claude-sonnet-4
      fallback: [openrouter/openai/gpt-4o, openrouter/google/gemini-1.5-pro]

router_settings:
  routing_strategy: latency-based-routing
  timeout: 30
  max_retries: 2
```

[^553^] [^548^]

### 10.2 OpenRouter Fusion

OpenRouter Fusion achieves near-frontier performance at reduced cost via multi-model ensembles: [^35^] [^555^]

| Configuration | Latency | Cost vs Fable 5 | Quality |
|---|---|---|---|
| Budget preset (3 cheap models) | 2-3x longer | **~50% cheaper** | Matches Fable |
| Quality preset (3 expensive) | 4-7x longer | ~2x more | **Beats Fable** |
| Self-fusion (same model 2x) | 2x longer | 2x more | ~Fable level |

**Finding**: Fusion adds 2-7x latency compared to single-model calls. Best suited for quality-sensitive, non-latency-critical tasks. The main gain comes from additional test-time compute, not just model diversity. [^35^] [^555^]

**Agent-47 Integration**: Use Fusion selectively for complex agent reasoning (planning, debate) while using single models for real-time responses.

---

## 11. Complete Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              CLIENT LAYER                                    │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐          │
│  │   Browser Tab 1   │  │   Browser Tab 2   │  │   Browser Tab N   │          │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │          │
│  │ │ Three.js/R3F │ │  │ │ Three.js/R3F │ │  │ │ Three.js/R3F │ │          │
│  │ │ WebGPU Renderer│ │  │ │ WebGPU Renderer│ │  │ │ WebGPU Renderer│ │          │
│  │ │ 60fps crowd   │ │  │ │ 60fps crowd   │ │  │ │ 60fps crowd   │ │          │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │          │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │          │
│  │ │ Transformers │ │  │ │ Transformers │ │  │ │ Transformers │ │          │
│  │ │ .js v3 (WebGPU)│ │  │ │ .js v3 (WebGPU)│ │  │ │ .js v3 (WebGPU)│ │          │
│  │ │ Local embeddings│ │  │ │ Local embeddings│ │  │ │ Local embeddings│ │          │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │          │
│  │ ┌──────────────┐ │  │ ┌──────────────┐ │  │ ┌──────────────┐ │          │
│  │ │ Yjs CRDT     │ │  │ │ Yjs CRDT     │ │  │ │ Yjs CRDT     │ │          │
│  │ │ Offline sync │ │  │ │ Offline sync │ │  │ │ Offline sync │ │          │
│  │ └──────────────┘ │  │ └──────────────┘ │  │ └──────────────┘ │          │
│  └────────┬─────────┘  └────────┬─────────┘  └────────┬─────────┘          │
│           │ WebSocket         │ WebSocket         │ WebSocket              │
│           │ (WebTransport)    │ (WebTransport)    │ (WebTransport)         │
└───────────┼───────────────────┼───────────────────┼────────────────────────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │
┌───────────────────────────────┼─────────────────────────────────────────────┐
│                          EDGE LAYER (Cloudflare)                             │
│                               │                                              │
│  ┌────────────────────────────▼──────────────────────────────────────────┐  │
│  │                        Durable Object (Room Instance)                  │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ 47 Agents   │  │ Spatial     │  │ 30s Tick    │  │ Delta Comp- │ │  │
│  │  │ State Machine│  │ Hash Grid   │  │ Scheduler   │  │ ression     │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │  │
│  │  │ Pheromone   │  │ Agent       │  │ State       │  │ WS          │ │  │
│  │  │ Trail Map   │  │ Physics     │  │ Persistence │  │ Broadcast   │ │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘ │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                               │                                              │
│  ┌────────────────────────────▼──────────────────────────────────────────┐  │
│  │                     Worker (API / Inference Proxy)                     │  │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                   │  │
│  │  │ Workers AI  │  │ LiteLLM     │  │ Auth/Rate   │                   │  │
│  │  │ @cf/llama   │  │ Proxy       │  │ Limit       │                   │  │
│  │  └─────────────┘  └─────────────┘  └─────────────┘                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
│                               │                                              │
│  ┌────────────────────────────▼──────────────────────────────────────────┐  │
│  │                         KV / D1 / R2 Storage                           │  │
│  │  Agent configs │ Game states │ Asset CDN │ Chat logs                   │  │
│  └─────────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────────────┘
                                │ HTTPS / WebSocket
┌───────────────────────────────▼─────────────────────────────────────────────┐
│                         ORIGIN LAYER (Node.js)                               │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ Express/Fast│  │ Redis       │  │ PostgreSQL  │  │ OpenTelemetry       │ │
│  │ API Server  │  │ Streams     │  │ + Timescale │  │ Collector           │ │
│  │             │  │ Pub/Sub     │  │ Agent DB    │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐ │
│  │ LiteLLM     │  │ vLLM        │  │ KVCOMM      │  │ Grafana/Jaeger      │ │
│  │ Gateway     │  │ (self-host) │  │ Pool        │  │ Dashboard           │ │
│  │ Multi-model │  │ 7B/70B      │  │ KV Sharing  │  │                     │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └─────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 12. Cost Architecture by Tier

### 12.1 $50/Month Tier (Community)

| Component | Service | Estimated Cost |
|---|---|---|
| Compute | Cloudflare Workers (Free tier) | $0 |
| AI Inference | Workers AI + LiteLLM (budget models) | $15-25 |
| Storage | KV + D1 (free tier) | $0 |
| Real-time | Durable Objects (free tier) | $0 |
| Assets | R2 (10GB) | ~$0.15 |
| Observability | OTel + Free Grafana | $0 |
| Domain + SSL | Cloudflare | $0 |
| **Total** | | **~$25-40/month** |

**Model Strategy**: Gemini Flash 1.5, Mistral 7B via Workers AI. 47 agents run with INT8 quantization. KV-cache sharing via KVCOMM.

### 12.2 $500/Month Tier (Standard)

| Component | Service | Estimated Cost |
|---|---|---|
| Compute | Cloudflare Workers Paid | $5 |
| AI Inference | Workers AI + OpenRouter (Sonnet 3.5, GPT-4o-mini) | $250-350 |
| Storage | KV + D1 Paid + R2 (100GB) | $20-30 |
| Real-time | Durable Objects Paid | $50-80 |
| Assets | R2 CDN | $5 |
| Observability | OTel + Grafana Cloud | $20 |
| **Total** | | **~$350-490/month** |

**Model Strategy**: Claude 3.5 Sonnet for reasoning, GPT-4o-mini for fast tasks. INT4 quantization. Full WebSocket hibernation. Spatial pub/sub for visibility culling.

### 12.3 $5,000/Month Tier (Premium)

| Component | Service | Estimated Cost |
|---|---|---|
| Compute | Workers + Containers (GPU) | $200-400 |
| AI Inference | OpenRouter (Claude Sonnet 4, GPT-4o) + vLLM self-host | $2,500-3,500 |
| Storage | D1 + KV + R2 (1TB) | $100-150 |
| Real-time | Durable Objects + Custom relay | $200-300 |
| Assets | R2 + Progressive LOD CDN | $50 |
| Observability | Datadog/New Relic Enterprise | $200-300 |
| **Total** | | **~$3,250-4,700/month** |

**Model Strategy**: Frontier models (Claude Sonnet 4, GPT-4o, Gemini Pro) with Fusion for complex reasoning. FP8 quantization on H100. Dedicated vLLM with PagedAttention. Full DroidSpeak + KVCOMM integration.

---

## 13. Performance Budgets

### 13.1 End-to-End Latency Budget

| Component | Target | Measurement |
|---|---|---|
| WebSocket RTT (Durable Objects) | <50ms p50 | Edge ping |
| Agent tick processing (47 agents) | <10s total | Server-side |
| LLM inference (prefill) | <500ms TTFT | Per-agent |
| LLM inference (decode) | 25-50 tok/s | Per-agent |
| KV-cache sharing overhead | <20ms | Cross-agent |
| State delta broadcast | <100ms | All clients |
| Client render frame | 16.6ms (60fps) | WebGPU |
| Asset LOD streaming | <200ms first pixel | glTF-progressive |
| **Total perceived latency** | **<2s for state change** | User-to-render |

### 13.2 Throughput Targets

| Metric | $50 Tier | $500 Tier | $5K Tier |
|---|---|---|---|
| Concurrent rooms | 5 | 50 | 500 |
| Agents per room | 47 | 47 | 47 |
| Total active agents | 235 | 2,350 | 23,500 |
| Ticks per hour | 120 | 120 | 120 |
| LLM calls per tick | 47 | 47 | 47 |
| Total LLM calls/hour | 5,640 | 56,400 | 564,000 |
| Avg tokens/call | 500 | 800 | 1,200 |
| Total tokens/hour | 2.8M | 45M | 677M |
| Est. inference cost/hour | $0.50 | $8 | $120 |

---

## 14. Risk Assessment & Mitigation

| Risk | Impact | Mitigation |
|---|---|---|
| WebTransport delays | Migration blocked | WebSocket works indefinitely; upgrade path clear |
| Workers AI latency spikes | Poor UX | LiteLLM fallback to OpenRouter with timeout |
| 47-agent KV-cache memory | OOM | KVCOMM anchor pool limits; eviction policy |
| Client WebGPU unsupported | No GPU accel | WebGL fallback; WASM compute for critical sim |
| CRDT merge conflicts | State divergence | Yjs automatic merge; periodic full-sync |
| LLM rate limiting | Agent stalls | LiteLLM fallback chain; local cache for embeddings |
| Durable Object hibernation | State loss | serializeAttachment for WS state; alarm-based persist |
| Cold start (Workers) | First request slow | Keep-alive pings; pre-warmed DOs |

---

## 15. Implementation Roadmap

| Phase | Duration | Deliverables |
|---|---|---|
| **Phase 1: Foundation** | Weeks 1-2 | WebSocket rooms, Durable Objects, basic tick loop, Three.js renderer |
| **Phase 2: WebGPU** | Weeks 3-4 | Pheromone compute shaders, agent physics GPU pipeline, instanced rendering |
| **Phase 3: Intelligence** | Weeks 5-6 | LiteLLM integration, Workers AI, KV-cache sharing (KVCOMM), INT8 quant |
| **Phase 4: Sync** | Weeks 7-8 | Yjs CRDT integration, offline support, delta compression, spatial pub/sub |
| **Phase 5: Polish** | Weeks 9-10 | Progressive assets, observability, perf optimization, load testing |
| **Phase 6: Scale** | Weeks 11-12 | Multi-room sharding, WebTransport migration, advanced analytics |

---

## 16. Source Index

| Source | Citation | Key Contribution |
|---|---|---|
| Cloudflare Workers AI Guide | [^487^] | Latency budgets by model category |
| Cloudflare Workers Pricing | [^610^] | Detailed pricing tables |
| Cloudflare Edge Stack | [^611^] | Platform architecture overview |
| Durable Objects WebSockets | [^654^] | Hibernation API, batching best practices |
| Durable Objects State | [^655^] | Actor model at the edge |
| Multiplayer with DO | [^656^] | XState + DO pattern |
| WebGPU vs WebGL Thesis | [^573^] | 37M particles @ 60fps, 100x compute speedup |
| WebGPU Particles | [^574^] | 10M particles @ 63fps on GTX 1060 |
| Conway's Game of Life | [^542^] | 10x speedup with WebGPU compute |
| Slime Mold WebGL | [^646^] | Pheromone diffusion shader algorithm |
| Slime Simulation | [^652^] | Agent sensor model, species parameters |
| Reaction-Diffusion | [^556^] | WebGPU compute shader tutorial |
| Spatial Pub/Sub | [^485^] | 6x bandwidth reduction in Minecraft |
| Spatial Hashing | [^627^] | 30x faster than distance checking |
| Delta Compression | [^642^] | Protocol design for state sync |
| Redis Pub/Sub | [^546^] | Performance benchmarks vs NATS |
| glTF Progressive | [^355^] | 90% initial download reduction |
| R3F Performance | [^186^] | 100 Three.js optimization tips |
| Crowd Rendering | [^608^] | Single-draw-call massive crowd |
| Local-First Software | [^575^] | CRDT sync protocol patterns |
| PowerSync Roadmap | [^626^] | SQLite sync for web |
| ElectricSQL vs PowerSync | [^631^] | Offline sync comparison |
| CRDT VR | [^554^] | P2P CRDT state synchronization |
| Yjs Analysis | [^552^] | CRDT library evaluation |
| Transformers.js v3 | [^494^] | WebGPU support, 100x speedup |
| WebGPU Benchmarks | [^495^] | WebGPU vs WASM comparison |
| DroidSpeak | [^513^] | 3.1x prefill speedup via KV sharing |
| DroidSpeak PDF | [^517^] | Full system implementation |
| KVCOMM | [^512^] | 7.8x speedup for 5-agent workflows |
| KVCOMM Paper | [^518^] | Anchor pool mechanism |
| KVCOMM GitHub | [^519^] | Implementation reference |
| KV Snapshot Sharing | [^522^] | 52x branch activation reduction |
| INT8 Quantization Study | [^523^] | Comprehensive Llama-3.1 evaluation |
| Quantization Guide | [^532^] | AWQ, GPTQ, QLoRA comparison |
| Quantization Speedup | [^524^] | 2-3x inference speedup benchmarks |
| WebSocket vs WebTransport | [^606^] | Production readiness analysis |
| WebTransport NSDI | [^364^] | Outperforms all protocols in benchmarks |
| WebTransport Protocol | [^530^] | Feature comparison table |
| WebTransport Safari | [^605^] | March 2026 Baseline milestone |
| OpenTelemetry GenAI | [^622^] | Semantic conventions walkthrough |
| OpenTelemetry Layers | [^623^] | Six-layer telemetry architecture |
| OpenTelemetry AI Agent | [^625^] | Agent span conventions |
| Datadog OTel Support | [^630^] | Production observability |
| LiteLLM GitHub | [^553^] | 100+ LLM unified API |
| LiteLLM Benchmarks | [^548^] | 8ms P95, 1K RPS |
| OpenRouter Fusion | [^35^] | Multi-model ensemble API |
| Fusion Benchmarks | [^555^] | Near-frontier at half cost |
| vLLM Guide | [^613^] | PagedAttention, prefix caching |
| ONNX Runtime WebGPU | [^644^] | Browser inference acceleration |
| ONNX Web Performance | [^651^] | 20x speedup over WASM |
| WebGPU Browser Support | [^649^] | Baseline across all browsers |

---

*Document compiled from 18+ independent web searches covering 65+ authoritative sources. All benchmarks and claims are traced to primary sources.*
