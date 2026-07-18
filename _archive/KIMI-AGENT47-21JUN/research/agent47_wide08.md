# Facet 8: Technical Architecture Optimization & Edge Computing
## CSOAI Agent-47 Research Brief

**Date**: 2025-07-16  
**Scope**: Deep technical architecture for running 47 AI agents in real-time in a browser-based 3D world with sub-50ms agent responses and 60fps rendering.  
**Searches Conducted**: 13 independent search batches, 40+ queries, 60+ sources analyzed  

---

## Executive Summary

Running 47 AI agents in real-time within a browser-based 3D world is a multi-dimensional optimization problem that spans edge inference, GPU compute, distributed simulation, asset streaming, model optimization, real-time networking, and observability. This research brief synthesizes findings across 10 critical technical domains, providing evidence-based recommendations with specific benchmarks and implementation paths.

**Key Conclusions**:
1. **Hybrid AI inference** is essential: use small models (SLMs) at the edge for fast agent decisions (<100ms), route complex reasoning to centralized GPU infrastructure. Raw LLM inference cannot meet sub-50ms targets at the edge for frontier models [^1^][^2^].
2. **WebGPU compute shaders** enable GPU-accelerated agent simulation (10K+ boids at 60fps), neural network inference in browser, and physics simulation -- but require careful async pipeline design (WeInfer achieves 3.76x speedup over naive approaches) [^3^][^4^].
3. **Spatial interest management** (Spatial Pub/Sub) reduces server bandwidth by 6x; CRDTs enable local-first state synchronization with offline capability [^5^][^6^].
4. **Model quantization + KV-cache sharing** (DroidSpeak) achieves 3.1x prefill speedup and 4x throughput improvement for multi-agent inference with negligible quality loss [^7^].
5. **WebTransport + QUIC** outperforms WebSocket in latency and packet loss resilience, making it the preferred transport for real-time agent updates [^8^].

---

## 1. Edge Computing for AI Inference

### 1.1 The Edge Latency Reality

A critical finding from production deployments is that **edge computing does NOT automatically deliver sub-50ms inference for large models**. The latency breakdown reveals why [^1^]:

| Component | Typical Latency |
|-----------|----------------|
| Network round-trip (user to edge) | 10-30ms |
| Network round-trip (edge to centralized inference) | 50-100ms |
| Inference: 8B parameter model | 500-2,000ms |
| Inference: 70B parameter model | 2,000-8,000ms |

> "Edge deployment saves perhaps 50ms of network time, but inference takes 5 seconds, meaning you're optimising the rounding error." [^1^]

**For Agent-47, this means**: Edge inference works for embeddings, classification, routing, and small SLM inference (<100ms), but frontier LLM inference must use centralized GPU clusters with intelligent routing.

### 1.2 Tiered AI Architecture (Recommended)

Production evidence from Anthropic, Cloudflare, and industry benchmarks supports a three-tier architecture [^1^][^9^][^10^]:

**Tier 1: Edge (Sub-50ms for specific workloads)**
- **Use**: Embeddings (SentenceTransformers), TinyLlama routing models, classification, moderation, pheromone diffusion queries
- **Models**: BGE embeddings, DistilBERT classifiers, 135M-360M parameter SLMs
- **Latency**: <100ms for embeddings, 20-50ms typical
- **Cost**: $0.10-$0.30 per 1M tokens (V8 isolate overhead)
- **Platform**: Cloudflare Workers AI (V8 Isolates, <5ms cold start) [^10^]

**Tier 2: Regional Cloud (100-500ms)**
- **Use**: RAG augmentation, local context processing, agent reasoning for standard queries
- **Models**: Llama 3.1/3.2 8B, Mistral 7B, Qwen2 1.5B
- **Latency**: 100-500ms
- **Cost**: $0.01-$0.05 per 1M tokens
- **Platform**: GPU clusters with vLLM/SGLang serving

**Tier 3: Global Cloud (500-5,000ms)**
- **Use**: High-quality generation, complex reasoning, agent planning
- **Models**: GPT-4-class, Llama 3.1 70B, Claude-class
- **Latency**: 500ms-5s
- **Cost**: $0.001-$0.01 per 1M tokens (batched)
- **Platform**: Centralized GPU infrastructure

### 1.3 Cloudflare Workers AI: Practical Details

Cloudflare Workers AI provides production edge inference with these characteristics [^10^][^11^]:

- **Infrastructure**: 330+ cities, ~50ms p50 to 95% of internet users [^10^]
- **Runtime**: V8 Isolates (not containers) -- <5ms cold start vs hundreds of ms for containers [^11^]
- **GPU Utilization**: Industry average 5%; Workers AI bills per-inference, not per-idle-GPU [^10^]
- **Observed Latencies** [^11^]:
  - Embeddings: p50 20-50ms, p99 100-200ms
  - Small text (8B): p50 300-800ms, p99 2-3s
  - Large text (70B): p50 1.5-4s, p99 8-12s
- **No fine-tuning available** -- base models only [^1^]
- **No latency guarantees** -- shared infrastructure, variable performance [^1^]

### 1.4 Deno Deploy

Deno Deploy offers an alternative edge runtime using V8 isolates with WebGPU support and native TypeScript execution. While specific AI inference benchmarks were limited in our research, Deno's architecture enables similar edge compute patterns with lower-level GPU access for custom inference pipelines.

### 1.5 Implementation Pattern: Confidence-Based Routing

```python
async def infer_with_routing(query: str, complexity_score: float) -> dict:
    """Route queries based on complexity assessment."""
    if complexity_score < 0.3 and query_type == "classification":
        return await edge_service.infer(query)  # <50ms
    elif complexity_score < 0.7:
        return await regional_service.infer(query)  # <200ms
    else:
        return await central_service.infer(query)  # <2s
```

---

## 2. WebGPU Compute Shaders

### 2.1 Current Browser Support (2025)

WebGPU has reached critical deployment maturity [^3^][^12^]:

- **Chrome/Edge**: Stable since v113 (April 2023)
- **Firefox**: Stable since v141 (July 2025)
- **Safari**: Stable since v26 (June 2025)
- **Android**: Supported since Chrome 121
- **Status**: W3C Candidate Recommendation

### 2.2 WebGPU for Agent Simulation

A comprehensive WebGPU compute exploration project demonstrates GPU-accelerated capabilities directly relevant to Agent-47 [^4^]:

| Simulation | Agents/Elements | Performance |
|------------|----------------|-------------|
| Boids flocking | 10,000 agents | 60 FPS, fully GPU-parallelized |
| SPH Fluid dynamics | 2,000 particles | 60 FPS, 3-pass compute |
| Molecular dynamics | 5,000 atoms | 60 FPS with O(N^2) forces |
| Cellular automata | 30,000 cells | 60 FPS with zero CPU overhead |
| N-body gravity | 1,000+ bodies | Real-time |

**Key insight**: Compute shaders handle separation, alignment, cohesion, predator/prey, scatter, and vortex behaviors -- exactly the primitives needed for emergent multi-agent coordination in Agent-47 [^4^].

### 2.3 WebGPU for Neural Network Inference

**WeInfer** (ACM Web Conference 2025) is the most significant advancement in browser-based LLM inference [^13^][^14^]:

**Problem Identified**: Existing WebGPU inference frameworks (WebLLM, MediaPipe LLM) exhibit poor GPU utilization:
- MediaPipe LLM: only 30% GPU utilization
- WebLLM: ~70% GPU utilization but suffers synchronous blocking
- Preparation overhead: 5.41-11.01ms per prediction
- Fetching overhead: 4.45-20.53ms per token

**WeInfer Solutions**:
1. **Uniform buffer reuse**: Cache static buffers across decode steps, eliminating redundant creation
2. **Asynchronous pipeline**: Decouple resource preparation from GPU execution, enabling parallel CPU/GPU work

**Performance Results** [^13^]:

| Model | Device | WebLLM | WeInfer | Speedup |
|-------|--------|--------|---------|---------|
| SmolLM-135M-q4f16 | RTX 3060 | 27.72 ms/token | 10.17 ms/token | **2.73x** |
| Qwen2-1.5B-q4f16 | RTX 3060 | 24.57 ms/token | 14.88 ms/token | **1.65x** |
| Qwen2-1.5B | RTX 4090 | 31.72 ms/token | 8.43 ms/token | **3.76x** |
| Qwen2-1.5B-q4f32 | RTX 3060 | 24.18 ms/token | 18.07 ms/token | **1.34x** |

### 2.4 Transformers.js + WebGPU for Browser AI

Transformers.js v3 (late 2024) added full WebGPU support, achieving **10x+ speedup** over WASM for certain models on capable GPUs [^15^][^16^]:

```javascript
import { pipeline } from '@huggingface/transformers';

// Sentiment analysis with WebGPU
const classifier = await pipeline(
  'sentiment-analysis',
  'Xenova/distilbert-base-uncased-finetuned-sst-2-english',
  { device: 'webgpu' }
);
// Typical inference: tens of milliseconds on GPU
```

**Available Models**: 1200+ ONNX models supported, including [^17^]:
- `onnx-community/Llama-3.2-1B-Instruct-q4f16` -- browser-runnable LLM
- `HuggingFaceTB/SmolLM2-360M-Instruct` / `SmolLM2-135M-Instruct` [^18^]
- Whisper variants for speech-to-text with q4 quantization [^15^]
- BGE embeddings for semantic search

**Key configuration**:
```javascript
const generator = await pipeline('text-generation', model, {
  device: 'webgpu',
  dtype: 'q4f16',  // 4-bit quantization
});
```

### 2.5 Recommendations for Agent-47 WebGPU Architecture

1. **Use compute shaders for**: agent flocking behaviors, pheromone diffusion, spatial queries, particle systems
2. **Use WeInfer-style inference** for per-agent LLM decisions in browser (with SLMs)
3. **Offload heavy simulation to GPU** to maintain 60fps on main thread
4. **Implement async pipeline** to parallelize resource prep with GPU execution
5. **Maintain WASM fallback** for browsers without WebGPU support

---

## 3. Distributed Simulation Architecture

### 3.1 Spatial Interest Management

For 47 agents in a shared 3D world, **Spatial Publish/Subscribe (SPS)** provides a proven architecture pattern [^5^]:

**How SPS Works**:
- Agents subscribe to spatial regions (Area of Interest / AOI)
- State updates are published only to subscribers within the relevant spatial area
- Decouples game state computation from state dissemination

**Key Results from Minecraft Implementation** [^5^]:
- **6x reduction** in server packet transmission compared to native server
- **20ms average latency** added by SPS broker (below 100ms critical threshold)
- **10% CPU** usage of single core, 90MB memory for 6 clients
- Theoretical capacity: ~600 clients per broker (linear scaling)

**Agent-47 Application**: Use spatial partitioning to only send nearby agent updates. With 47 agents, each agent only needs state from agents within its AOI, dramatically reducing bandwidth.

### 3.2 Spatial Partitioning Strategies

**Voronoi-based Partitioning** [^5^][^19^]:
- World divided into Voronoi cells around server nodes
- Each server manages agents in its cell
- Agents migrate between servers without mirroring
- Supports up to 120 nodes in Koekepan architecture

**Triangular Partitioning with Obstacle Awareness** [^19^]:
- Reduces inter-server communication by accounting for line-of-sight
- Can be extended for dynamic load balancing
- Applicable to Agent-47's complex 3D environments

**AOI (Area of Interest) Management** [^5^]:
- Static radius around player/agent
- Dynamic expression-of-interest (zoom levels, directional awareness)
- Tile-based algorithms for efficient subscription management

### 3.3 Interest Management Implementation

```
Client ──AOI sub──> SPS Broker <──spatial pub── Simulation Server
                         |
                    [VAST Matcher]
                         |
              ┌─────────┼─────────┐
              |         |         |
           Agent1    Agent2    Agent3
```

Key insight from production systems: Pre-fetch objects along anticipated agent paths to reduce latency spikes when agents move [^19^].

---

## 4. Asset Streaming & Level-of-Detail Systems

### 4.1 glTF Progressive Streaming

The **Needle Engine gltf-progressive** system provides production-grade streaming LOD [^20^]:

**Mesh LODs**:
- Up to 6 mesh LOD levels via progressive simplification
- Each level ~50% triangle count of previous
- Lowest quality embedded in main file for instant display
- Higher levels stream on demand based on **screen-space density**
- Default target: 200,000 triangles when mesh fills view

**Texture LODs**:
- Small preview (128px) embedded in main file
- Full-resolution versions stream progressively
- Each texture LOD is half resolution of previous
- Mobile: 8K textures auto-skipped; data-saving mode: above 2K skipped

**Compression Support**: KTX2, WebP, Draco, Meshopt -- all handled automatically [^20^]

### 4.2 Three.js Performance Best Practices

For Agent-47's rendering pipeline [^21^]:

1. **Lazy load below-fold 3D content** with IntersectionObserver
2. **Code-split Three.js modules** to reduce initial bundle
3. **Preload critical assets**: `<link rel="preload" href="/model.glb" as="fetch">`
4. **Progressive loading**: show low-resolution first, load high-res in background
5. **Web Workers for physics** and procedural generation off main thread
6. **Stream large scenes**: load chunks dynamically based on camera position

```javascript
// Progressive loading pattern
const lowRes = await loadModel('low.glb');
scene.add(lowRes);
loadModel('high.glb').then(highRes => {
  scene.remove(lowRes);
  scene.add(highRes);
});
```

### 4.3 Babylon.js vs Three.js for Complex Scenes

For Agent-47's 47-agent simulation with complex environments [^22^][^23^]:

| Feature | Three.js | Babylon.js |
|---------|----------|------------|
| Camera controls | Requires OrbitControls | Built-in ArcRotateCamera |
| GLB loading | GLTFLoader (manual) | SceneLoader.ImportMeshAsync |
| Asset Manager | Manual Promise.all | AssetsManager (parallel, deps) |
| PBR | Manual setup | PBR-ready by default |
| Scene setup | More code, more flexible | Less code, more automatic |
| Documentation | Large ecosystem | Built-in playground |
| LOD support | Basic | MSFT_lod extension + discrete LODs |

**Recommendation**: Three.js for maximum flexibility and ecosystem; Babylon.js for built-in game engine features (physics, particle systems, asset management).

### 4.4 Streaming Architecture for Agent-47

```
1. Main glTF loads with low-quality proxies → scene appears immediately
2. Runtime evaluates visibility and screen-space size
3. Higher-quality LOD files fetched on-demand as camera moves
4. Geometry/textures swapped seamlessly (no visual disruption)
5. Previously loaded LODs cached and reused
6. Off-screen agents use lowest LOD; nearby agents use highest
```

---

## 5. Local-First Architecture

### 5.1 CRDTs for Game State Synchronization

**BrickSync** (2025) demonstrates CRDT-based game state sync in VR using WebRTC P2P connections [^6^]. Key findings for Agent-47:

**State-Based CRDTs (MV-Transformer)**:
- Encapsulates GameObject Transform state (position, rotation, scale)
- Local-space mode (offset-based updates inspired by PN-Counters)
- World-space mode (Last-Writer-Wins for absolute position)
- Register tracks which replica is manipulating each object

**Conflict Resolution Strategies** [^6^]:
1. **Last-Writer-Wins**: Simple, predictable, loses collaboration nuance
2. **Heuristic reconciliation**: Align with shared goals (e.g., building straight wall)
3. **Averaging**: Object stands in middle when two agents manipulate differently
4. **Constraint-based**: Prevent simultaneous manipulations (last resort)
5. **Dynamic Strategy Switching**: CRDT adapts strategy based on context

**Key Production Libraries** [^24^]:

| Library | Maturity | Self-Host | Offline Support | Scale |
|---------|----------|-----------|----------------|-------|
| Yjs | Production | Yes | Yes | Widely used |
| Automerge | Production (v2) | Yes | Yes (local-first) | Growing |
| Loro | Production (1.0) | Yes | Yes (local-first) | Early |
| Liveblocks | Production | No (SaaS) | Partial | Millions of users |
| Fluid Framework | Production | Limited (Azure) | Partial | Microsoft ecosystem |

### 5.2 Offline-First Storage Architecture

For Agent-47's world state persistence [^25^][^26^][^27^]:

| Storage | Good For | Limitations |
|---------|----------|-------------|
| **IndexedDB** | Broad compatibility, moderate data | Verbose API, no SQL |
| **OPFS + SQLite WASM** | Complex queries, relational data | Safari quirks, ~400KB bundle |
| **PGlite** | Full Postgres compatibility | Newer, larger bundle |
| **localStorage** | Small config data | 5-10MB limit, blocking |

**Recommended Pattern** [^27^]:
1. Always read from local storage (IndexedDB/SQLite) first
2. Render UI immediately from local state
3. Sync with server in background
4. Use CRDTs for conflict resolution when reconnected
5. Service workers for background sync when tab is closed

### 5.3 Service Workers for Offline Game Capability

```javascript
// Cache-first strategy for 3D assets
self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((cached) => {
      return cached || fetch(event.request).then((response) => {
        caches.open('agent47-v1').then(cache => cache.put(event.request, response));
        return response.clone();
      });
    })
  );
});
```

Key insight: Browser caching works for static assets but requires proper cache headers. For 3D model files (.glb, .gltf), ensure CDN/server is configured to cache these file types [^28^].

---

## 6. Model Optimization for Browser & Server

### 6.1 Quantization Strategies

**ONNX Runtime Web** provides comprehensive quantization support [^29^][^30^]:

| Precision | Memory Reduction | Speedup | Accuracy Impact |
|-----------|-----------------|---------|-----------------|
| FP16 | 2x | ~1.5x | Negligible |
| INT8 | 4x | 1.5-2.5x | <1% top-1 error (vision), <0.3 F1 (NLP) |
| INT4 (GPTQ/AWQ) | 8x | Variable | Task-dependent degradation |

**Key considerations**:
- INT8 requires VNNI (x86), Tensor Core (NVIDIA T4/A100+), or dot-product instructions (Arm) for hardware acceleration [^29^]
- INT4 requires custom kernels; ONNX supports it via `QLinearMatMul` with packing/unpacking [^30^]
- GPU with Tensor Core int8 support (T4, A100, RTX 30-series+) needed for GPU acceleration [^29^]
- Transformers.js v3 supports `q4f16`, `q4` dtypes natively with WebGPU [^15^][^17^]

### 6.2 ONNX Runtime Web Architecture

ONNX Runtime Web sits below Transformers.js in the stack [^16^]:

```
Your Application
    |
Transformers.js (high-level pipeline API)
    |
ONNX Runtime Web (session, tensor, provider control)
    |
WebGPU / WASM / WebNN / WebGL (execution providers)
```

**When to use ONNX Runtime Web directly**: When you own the ONNX file, need provider control (WebGPU first, WASM fallback), or have non-NLP models [^16^].

### 6.3 Speculative Decoding

Speculative decoding uses a small draft model to propose tokens verified in parallel by the target model [^31^][^32^]:

- **Speedup**: 1.5-3.5x on benchmarks, up to 2.5x with QuantSpec
- **How it works**: Draft model generates K tokens; target model verifies all K in one forward pass
- **Mathematical guarantee**: Output distribution is identical to standard autoregressive decoding
- **Best for**: Small-to-medium batch sizes, predictable outputs
- **Production**: vLLM supports EAGLE, n-gram proposals; SGLang supports EAGLE-family drafters

### 6.4 KV-Cache Sharing Across Agents (DroidSpeak)

**DroidSpeak** (NSDI 2026) is the breakthrough for multi-agent KV-cache optimization [^7^][^33^]:

**The Problem**: In multi-agent systems, when agents communicate, the conversation history of one agent is prepended to another's input -- causing redundant prefill computation.

**The Solution**: Share KV cache across different fine-tuned models with the same architecture by:
1. Identifying "critical layers" (~10% of layers) that are sensitive to weight differences
2. Selectively recomputing only critical layers
3. Reusing KV cache for remaining layers
4. Pipelining KV cache transfer with recomputation to hide latency

**Results** [^7^][^33^]:

| Metric | Improvement |
|--------|-------------|
| Prefill latency reduction | **1.7-3.1x** (average 2.1x) |
| Throughput improvement | **Up to 4x** |
| Memory footprint reduction | **1.5x** |
| Quality degradation | Negligible (F1, Rouge-L, code similarity) |

**KVCOMM** (NeurIPS 2025) extends this for multi-agent systems with **70% reuse rate** and **7.8x speedup** for 5-agent workflows, reducing TTFT from ~430ms to ~55ms [^34^].

### 6.5 vLLM Production Serving Stack

For centralized GPU inference [^32^][^35^]:

| Feature | Impact |
|---------|--------|
| PagedAttention | Eliminates 60-80% KV cache fragmentation waste |
| Continuous batching | 3-10x throughput improvement |
| Prefix caching | 80-90% latency reduction for repeated context |
| Speculative decoding | 2-3x speedup (up to 2.8x) |
| Disaggregated serving | 1.9x TTFT improvement, 1.5x throughput |

Stripe reported **73% inference cost reduction** migrating to vLLM, processing 50M daily API calls on 1/3 GPU fleet [^35^].

### 6.6 SwiftKV: Optimized Prefill

SwiftKV (ICLR 2025) optimizes prefill by early-computing KV cache for remaining layers during chunked prefill, achieving [^36^]:
- Single fused GEMM operation for all remaining KV projections
- Compatible with vLLM's chunked prefill
- Significant prefill speedup with minimal architectural changes

---

## 7. Real-Time Communication

### 7.1 WebTransport vs WebSocket vs WebRTC

**NSDI 2025 browser networking study** provides definitive benchmarks [^8^]:

| Protocol | Latency (0% loss) | Latency (0.1% loss) | Key Characteristics |
|----------|-------------------|---------------------|---------------------|
| **WebTransport** | **Lowest** | **Lowest** | HTTP/3, QUIC, multiplexed, no head-of-line blocking |
| Raw UDP+DTLS | Higher | Higher | Baseline without QUIC optimizations |
| WebRTC | Higher | Higher | Complex stack, P2P, UDP-based |
| **WebSocket** | **Highest** | **Highest** | TCP head-of-line blocking, single stream |

**Why WebTransport wins**:
- Uses BBRv1 congestion control (better than WebRTC's implementation)
- Multiple streams within single connection (avoids HoL blocking)
- Supports both reliable and unreliable data transfer
- API works in Web Workers (enables multithreading)
- Promise/async-await native API [^37^]

**Recommendation for Agent-47**: Use WebTransport as primary transport for agent state updates, with WebSocket fallback for older browsers.

### 7.2 NATS: Unified Messaging

NATS provides a single binary replacing Kafka + Redis + RabbitMQ for real-time pub/sub [^38^]:

- **Pub/Sub**: Fire-and-forget messaging, zero disk overhead
- **Request/Reply**: Built-in RPC without gRPC ceremony
- **JetStream**: Durable streams for persistence
- **KV Store**: Built-in key-value storage
- **Queue Groups**: Load balancing across subscribers
- **Advantages**: Subject-based routing, no partition management, lightweight temporary inboxes

```javascript
// NATS pub/sub for agent state updates
const nc = await connect({ servers: "nats://localhost:4222" });
const sub = nc.subscribe("agent.>.state");
for await (const m of sub) {
  updateAgentState(m.data);
}
```

### 7.3 Redis for Hot State

Redis remains the industry standard for hot game state caching:
- Sub-millisecond latency for state reads/writes
- Pub/sub for real-time agent update broadcasting
- Sorted sets for leaderboards/rankings
- Streams for event sourcing patterns
- Cluster mode for horizontal scaling

### 7.4 CQRS & Event Sourcing Pattern

For Agent-47's architecture, the Command Query Responsibility Segregation pattern with event sourcing provides:

- **Write model**: Agent actions published as events to NATS/Redis Streams
- **Read model**: Materialized views of agent state in Redis/IndexedDB
- **Event log**: Complete audit trail of all agent decisions
- **Replay capability**: Reconstruct world state from event log
- **Spatial partitioning**: Different read models for different world regions

---

## 8. Container Orchestration

### 8.1 Kubernetes + Agones for Game Servers

**Agones** is the Google-backed Kubernetes operator for game server hosting [^39^][^40^]:

**Fleet Management**:
```yaml
apiVersion: "agones.dev/v1"
kind: Fleet
metadata:
  name: agent47-simulation
spec:
  replicas: 47  # One GameServer per agent type
  scheduling: Packed  # Minimize nodes for auto-scaling
  template:
    spec:
      containers:
      - name: agent-server
        image: agent47/simulation:latest
        resources:
          limits:
            nvidia.com/gpu: 1  # GPU scheduling
```

**Auto-Scaling Features**:
- **Packed scheduling**: Groups GameServers on fewest nodes for easy scale-down
- **Fleet Autoscaler**: Buffer-based or webhook-driven scaling
- **Cluster Autoscaler**: Automatically adds/removes nodes based on demand
- **Distributed scheduling**: Spreads load across cluster for static environments
- **Allocation-aware**: Won't terminate Allocated servers mid-game [^39^]

### 8.2 GPU Scheduling

For Agent-47's AI inference servers:
- Use NVIDIA GPU Operator for Kubernetes
- Time-slicing for sharing GPUs across multiple agent inference pods
- MIG (Multi-Instance GPU) on A100/H100 for hardware-level partitioning
- Node affinity for matching GPU capabilities to model requirements

### 8.3 Multi-Region Deployment

- Deploy simulation servers closest to user clusters
- Use global load balancing with health checks
- Cross-region replication for persistent world state
- Geographic failover with minimal state loss (CRDT convergence)

---

## 9. Caching Strategies

### 9.1 Multi-Layer Caching Architecture

```
Browser Layer          Edge Layer          Origin Layer
─────────────         ───────────         ────────────
Service Worker    →   Cloudflare CDN   →   Object Storage
(3D models,        (static assets,     (source of truth
 game logic)        model weights)      for world state)
    |
IndexedDB/SQLite  →   Redis Cluster    →   PostgreSQL
(agent state,         (hot game state,   (persistent
 user preferences)    session data)      world state)
    |
Model Cache       →   KV Store         →   Model Registry
(ONNX weights,        (NATS JetStream,   (Hugging Face
 WebGPU shaders)      Redis KV)          Model Hub)
```

### 9.2 Browser-Side Model Caching

Critical for Agent-47's first-load experience [^16^][^17^]:

- **Transformers.js caching**: Models downloaded once, cached in browser Cache API
- **IndexedDB for model weights**: Persistent across sessions
- **WebGPU shader caching**: Shaders compiled once, reused
- **Progressive model loading**: Load q4 quantized first, upgrade to higher precision on demand
- **Model size budget**: Keep total model footprint under 500MB for mobile, 2GB for desktop

### 9.3 CDN Configuration for 3D Assets

Best practices for 3D asset delivery [^28^]:
- Configure cache headers for .glb, .gltf, .ktx2, .webp file types
- Use Brotli compression for JSON metadata
- Enable HTTP/2 server push for critical assets
- Implement cache-busting with content hashes
- Use stale-while-revalidate for non-critical LOD assets

---

## 10. Observability

### 10.1 AI Agent Observability Stack

The OpenTelemetry GenAI specification (v1.37+) defines standard attributes for AI agent monitoring [^41^][^42^][^43^]:

**Key Metrics to Track**:

| Metric | Description | Target |
|--------|-------------|--------|
| **TTFT** (Time to First Token) | Latency from request to first response | <50ms for edge, <500ms for cloud |
| **TPOT** (Time Per Output Token) | Decode speed | <20ms/token for real-time |
| **TBT** (Time Between Tokens) | Streaming latency | <100ms for smooth UX |
| **Token Usage** | Input/output tokens per agent run | Track for cost optimization |
| **Tool Call Success Rate** | % successful agent tool invocations | >95% |
| **Agent Loop Iterations** | ReAct cycles before completion | Minimize for efficiency |
| **Context Window Utilization** | % of available context consumed | <80% for headroom |

### 10.2 OpenTelemetry GenAI Conventions

Standard span attributes for AI agent tracing [^41^][^42^]:
```javascript
span.setAttribute("gen_ai.request.model", "Llama-3.2-1B");
span.setAttribute("gen_ai.usage.input_tokens", 1500);
span.setAttribute("gen_ai.usage.output_tokens", 500);
span.setAttribute("gen_ai.usage.cost", 0.045);
span.setAttribute("gen_ai.provider.name", "transformers.js");
span.setAttribute("agent.id", "agent-47-alpha");
span.setAttribute("agent.action", "pheromone_deposit");
```

### 10.3 Agent Behavior Analytics

**Span-per-tick tracing** captures each reasoning step [^41^]:
- LLM call spans: prompt tokens, output tokens, model ID, latency
- Tool invocation spans: tool name, arguments, output, duration
- Memory operation spans: read/write type, cache hit/miss
- Handoff spans: source/target agent ID, context payload

**Production Tools** [^43^]:

| Tool | Traces | Metrics | Logs | Cost Tracking |
|------|--------|---------|------|---------------|
| LangFuse | Yes | Yes | Yes | Yes |
| Arize Phoenix | Yes | Yes | No | Yes |
| MLFlow | Yes | No | Yes | Yes |
| Helicone | Yes | Yes | No | Yes |
| Datadog AI Agent Monitoring | Yes | Yes | Yes | Yes |

### 10.4 Real-Time Performance Profiling

For Agent-47 specifically:
- **Chrome DevTools Performance tab**: Profile main thread, GPU, WebGPU
- **WebGPU-specific profiling**: Buffer creation time, compute pipeline setup, execution time
- **Custom metrics**: Agent decision latency, physics step time, render frame time
- **Alerting**: P95 latency thresholds, error rate thresholds, token cost thresholds

### 10.5 World State Debugging

- **Event log replay**: Reconstruct world state from event stream for debugging
- **Agent state inspector**: Real-time view of each agent's belief state, goals, plans
- **Pheromone visualization**: Overlay pheromone field in 3D view for debugging
- **Performance heatmap**: Identify agents/regions causing performance issues

---

## 11. Integrated Architecture Recommendation for Agent-47

### 11.1 Proposed Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                       BROWSER CLIENT                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  3D Renderer │  │  Agent Brain │  │  WebGPU Compute      │  │
│  │  (Three.js)  │  │  (Transformers│  │  (Boids/Physics/     │  │
│  │              │  │   .js v3)    │  │   Pheromone)         │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│         │                  │                  │                │
│  ┌──────────────────────────────────────────────────────┐       │
│  │              Local-First State Layer                  │       │
│  │  (CRDTs + IndexedDB/SQLite WASM + Service Worker)   │       │
│  └──────────────────────────────────────────────────────┘       │
│         │                                                       │
│  ┌──────────────────────────────────────────────────────┐       │
│  │           WebTransport / WebSocket Client             │       │
│  └──────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴──────────┐
                    │   CDN / Edge Layer  │
                    │  (Cloudflare + NATS) │
                    └─────────┬──────────┘
                              │
┌─────────────────────────────────────────────────────────────────┐
│                    SIMULATION BACKEND                            │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Spatial Pub/│  │  Agent State │  │  LLM Inference       │  │
│  │  Sub Broker  │  │  Manager     │  │  Cluster (vLLM)      │  │
│  │  (VAST)      │  │  (Redis)     │  │  w/ DroidSpeak       │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Game Server │  │  Event Store │  │  Physics Simulation  │  │
│  │  (Agones/K8s)│  │  (NATS JS)   │  │  (GPU-accelerated)   │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │  Observabi-  │  │  Asset Store │  │  World Persistence   │  │
│  │  lity (OTel) │  │  (R2/S3)     │  │  (PostgreSQL)        │  │
│  └──────────────┘  └──────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 Performance Targets

| Component | Target | Method |
|-----------|--------|--------|
| Agent decision latency | <50ms (edge), <200ms (cloud) | SLM at edge + speculative decoding |
| Render frame rate | 60 FPS | WebGPU compute + LOD streaming |
| Physics simulation | 60 FPS (10K particles) | GPU compute shaders |
| State sync latency | <20ms | Spatial pub/sub + WebTransport |
| Model load time | <3s first visit, <500ms repeat | Service worker cache + progressive loading |
| World state persistence | <100ms write | IndexedDB + background sync |

### 11.3 Technology Stack Summary

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| 3D Rendering | Three.js + WebGPU | Largest ecosystem, WebGPU support |
| Browser AI | Transformers.js v3 + ONNX Runtime Web | 1200+ models, WebGPU backend |
| GPU Compute | WGSL compute shaders | Native GPU parallelism for agents |
| State Sync | Yjs/Loro CRDTs | Proven, offline-first, conflict-free |
| Local Storage | IndexedDB + SQLite WASM | Complex queries, relational data |
| Transport | WebTransport (primary) + WebSocket (fallback) | Lowest latency, multiplexed |
| Messaging | NATS + Redis | Unified pub/sub, durable streams |
| Orchestration | Kubernetes + Agones | Auto-scaling, GPU scheduling |
| Inference | vLLM + DroidSpeak | Best throughput, KV-cache sharing |
| Quantization | INT8/INT4 via ONNX Runtime | 4-8x memory reduction |
| Assets | glTF progressive + Needle Engine | Screen-space LOD streaming |
| Offline | Service Workers + Cache API | Browser-native caching |
| Observability | OpenTelemetry + LangFuse/Phoenix | GenAI semantic conventions |

---

## 12. Research Gaps & Open Questions

1. **WebGPU memory management for 47 simultaneous agents**: How does GPU memory scale with agent count? Need empirical testing on consumer GPUs.
2. **CRDT convergence at 47-agent scale**: Current CRDT research tested at 2-6 users; need validation at 47 concurrent agents.
3. **Energy consumption**: WebGPU inference on mobile devices drains battery quickly; need adaptive quality scaling.
4. **WebTransport browser support**: Still limited compared to WebSocket; need fallback strategy.
5. **Model size vs. agent capability**: 135M parameter models may lack reasoning depth; need task-specific evaluation.
6. **Cross-browser WebGPU consistency**: Performance varies significantly between Chrome, Firefox, Safari implementations.

---

## Sources

[^1^]: "The 50ms lie: when edge AI actually matters" - Subhanshumg Blog, 2026. https://blogs.subhanshumg.com/the-50ms-lie

[^2^]: "Chapter 16: Workers AI: Inference at the Edge" - Architecting on Cloudflare, 2026. https://architectingoncloudflare.com/chapter-16

[^3^]: "WebGPU" - Wikipedia, 2025. https://en.wikipedia.org/wiki/WebGPU

[^4^]: "webgpu-compute-exploration" - GitHub, 2025. https://github.com/scttfrdmn/webgpu-compute-exploration

[^5^]: "Spatial Publish/Subscribe - Decoupling Game State Dissemination from State Computation" - MMVE '24. https://scholar.sun.ac.za/server/api/core/bitstreams/afba80cf-fe67-4b40-ad68-aa974c3503c6/content

[^6^]: "CRDT-Based Game State Synchronization in Peer-to-Peer VR" - arXiv:2503.17826v1, 2025. https://arxiv.org/html/2503.17826v1

[^7^]: "DroidSpeak: KV Cache Sharing for Cross-LLM Communication and Multi-LLM Serving" - arXiv:2411.02820, 2024. https://arxiv.org/abs/2411.02820

[^8^]: "Evaluating Browser-Based Networking for Real-Time Multiplayer Games" - NSDI 2025. https://aaron.gember-jacobson.com/docs/nsdi2025browser-networking.pdf

[^9^]: "Cloudflare AI Stack Consulting" - Truvisory, 2025. https://truvisory.com/cloudflare/

[^10^]: "Cloudflare's AI Strategy: Analysis of Dominance" - Klover.ai, 2025. https://www.klover.ai/cloudflare-ai-strategy-analysis-of-dominance-in-cloud-cybersecurity-ai/

[^11^]: "Cloudflare Enhances AI Inference Platform with Powerful GPU Upgrade" - Cloudflare News, 2024. https://www.cloudflare.net/news/news-details/2024/Cloudflare-Enhances-AI-Inference-Platform/

[^12^]: "WebGPU Browser AI: Client-Side Inference in JavaScript" - SitePoint, 2026. https://www.sitepoint.com/webgpu-browser-ai-javascript-inference/

[^13^]: "WeInfer: Unleashing the Power of WebGPU on LLM Inference in Web Browsers" - ACM WWW 2025. https://dl.acm.org/doi/10.1145/3696410.3714553

[^14^]: "WeInfer: Unleashing the Power of WebGPU on LLM Inference" - OpenReview, 2025. https://openreview.net/pdf?id=Qu2itILaoZ

[^15^]: "Local LLMs, 0 cloud cost: is WebGPU key for next-gen browser AI app?" - mehdio.com, 2025. https://blog.mehdio.com/p/local-llms-0-cloud-cost-is-webgpu

[^16^]: "Transformers.js vs ONNX Runtime Web: Browser ML 2026" - PkgPulse, 2026. https://www.pkgpulse.com/guides/transformersjs-vs-onnx-runtime-web-2026

[^17^]: "Running an LLM in the browser with Transformers.js" - blog.rasc.ch, 2024. https://blog.rasc.ch/2024/10/transformers-js-1.html

[^18^]: "Transformers.js + WebGPU: Run a local LLM in your browser" - OpenAI Community, 2025. https://community.openai.com/t/transformers-js-webgpu-run-a-local-llm-in-your-browser-single-page/1370015

[^19^]: "Interest Management for Massively Multiplayer Games" - McGill University Thesis. https://www.cs.mcgill.ca/~jboula2/thesis.pdf

[^20^]: "gltf-progressive | docs" - Needle Engine, 2026. https://engine.needle.tools/docs/gltf-progressive/

[^21^]: "100 Three.js Tips That Actually Improve Performance" - utsubo.com, 2026. https://www.utsubo.com/blog/threejs-best-practices-100-tips

[^22^]: "Which Is Easier for Rendering GLB Models: Three.js or Babylon.js?" - Medium, 2025. https://medium.com/@noryx/which-is-easier-for-rendering-glb-models-three-js-or-babylon-js-bafdb46c9549

[^23^]: "Three.js vs React Three Fiber vs Babylon.js 2026" - PkgPulse, 2026. https://www.pkgpulse.com/guides/threejs-vs-react-three-fiber-vs-babylonjs-3d-webgl-2026

[^24^]: "Best CRDT Libraries 2025 | Real-Time Data Sync Guide" - Velt, 2026. https://velt.dev/blog/top-crdt-libraries-for-real-time-data-sync

[^25^]: "The Architecture Of Local-First Web Development" - Smashing Magazine, 2026. https://www.smashingmagazine.com/2026/05/architecture-local-first-web-development/

[^26^]: "Local-First Web Development" - Medium, 2025. https://medium.com/@arunseetharaman/local-first-web-development-3368e22170e7

[^27^]: "Offline-first frontend apps in 2025: IndexedDB and SQLite in the browser" - LogRocket, 2026. https://blog.logrocket.com/offline-first-frontend-apps-2025-indexeddb-sqlite/

[^28^]: "Is there anyway I can cache models in the user's browser cache?" - three.js forum, 2019. https://discourse.threejs.org/t/is-there-anyway-i-can-cache-models-in-the-users-browser-cache/9132

[^29^]: "Quantize ONNX models" - ONNX Runtime Docs. https://onnxruntime.ai/docs/performance/model-optimizations/quantization.html

[^30^]: "Web Assembly, ONNX Runtime and TVM for Real-Time Inference" - WJARR, 2025. https://wjarr.com/sites/default/files/fulltext_pdf/WJARR-2025-1832.pdf

[^31^]: "LLM Inference Optimization Techniques" - redwerk.com, 2026. https://redwerk.com/blog/llm-inference-optimization-techniques/

[^32^]: "Real-Time AI Inference Systems: Speculative Decoding, KV Cache & Streaming Architecture" - Medium, 2026. https://kumarshivam-66534.medium.com/real-time-ai-inference-systems-speculative-decoding-kv-cache-streaming-architecture-f8812f7e25dd

[^33^]: "DroidSpeak: KV Cache Sharing Across Fine-tuned Model Variants" - USENIX NSDI 2026. https://www.usenix.org/system/files/nsdi26-liu-yuhan.pdf

[^34^]: "Online Cross-context KV-cache Communication for Efficient LLM-based Multi-agent Systems" - NeurIPS 2025. https://neurips.cc/virtual/2025/poster/115164

[^35^]: "vLLM Production Deployment | Inference Serving Architecture Guide" - Introl Blog, 2026. https://introl.com/blog/vllm-production-deployment-inference-serving-architecture-guide

[^36^]: "SWIFTKV: Fast Prefill-Optimized Inference" - ICLR 2025. https://openreview.net/pdf?id=z1ohBxWeL2

[^37^]: "What is WebTransport and can it replace WebSockets?" - Ably, 2022. https://ably.com/blog/can-webtransport-replace-websockets

[^38^]: "I Replaced Kafka, Redis, and RabbitMQ With One Tool" - Medium, 2026. https://medium.com/@jainal/i-replaced-kafka-redis-and-rabbitmq-with-one-tool-heres-what-i-learned-b9f0b5ca94ed

[^39^]: "Scheduling and Autoscaling | Agones" - Agones Docs, 2026. https://agones.dev/site/docs/advanced/scheduling-and-autoscaling/

[^40^]: "The Scale In and Scale Out of the Game Server" - Alibaba Cloud, 2026. https://www.alibabacloud.com/blog/599429

[^41^]: "What Is Agent Observability? A 2026 Developer Guide" - MLflow, 2026. https://mlflow.org/articles/what-is-agent-observability-a-2026-developer-guide/

[^42^]: "AI Agent Observability - Evolving Standards and Best Practices" - OpenTelemetry, 2026. https://opentelemetry.io/blog/2025/ai-agent-observability/

[^43^]: "A Survey on AgentOps: Categorization, Challenges, and Future Directions" - arXiv:2508.02121v1, 2025. https://arxiv.org/html/2508.02121v1

---

*Research compiled from 13 independent search batches covering 40+ queries across academic papers, technical documentation, blog posts, and source code repositories. All benchmarks cited from primary sources where possible.*
