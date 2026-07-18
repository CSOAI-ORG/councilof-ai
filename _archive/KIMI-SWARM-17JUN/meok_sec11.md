## 11. Technology Stack & Integration Matrix

Every sovereign system is the sum of its component choices. For MEOK, those choices must satisfy a trilemma that breaks most architectures: local-first deployment on consumer hardware, billion-scale vector search, and Byzantine-grade security — all fully open source. This chapter catalogs every technology in the MEOK ecosystem, classified by deployment confidence: Tier 1 components are in production, Tier 2 are validated through prototyping, and Tier 3 are under active evaluation.

### 11.1 Tier 1 Technologies (Confirmed)

Tier 1 components form the operational backbone of MEOK. Each has been selected for production readiness, open-source licensing, and demonstrated compatibility with the fractal hive architecture. These are not experiments — they are the engines running in the keystone right now.

| Component | Role | Version / Spec | License | Hardware Target | Citation |
|-----------|------|---------------|---------|----------------|----------|
| **Tauri V2** | Desktop overlay shell, transparent HUD | 2.0+ | MIT / Apache-2.0 | macOS (M4/M2) | [^7^] |
| **BLS12-381** | BFT Council threshold signatures | EIP-2537 compatible | Public domain | CPU / any | [^301^] |
| **Ed25519 (BIP32-Ed25519)** | Hierarchical identity, Sigil protocol | RFC 8032 / IOHK spec | Public domain | CPU / any | [^239^][^306^] |
| **LangGraph** | Multi-agent orchestration, supervisor pattern | 0.2+ | MIT | M4 King / cloud | [^250^] |
| **Firecracker** | MCP tool sandboxing (microVMs) | 1.0+ | Apache-2.0 | Linux x86_64 / ARM | [^217^][^271^] |
| **Qdrant** | Product-layer vector database | 1.8+ | Apache-2.0 | Docker / K8s | [^263^] |
| **Ollama** | Local LLM inference (llama.cpp/Metal) | 0.19+ | MIT | Apple Silicon | [^232^][^235^] |
| **LiteLLM** | Multi-model API gateway, failover routing | 1.0+ | MIT | M4 King (port 4000) | [^225^][^310^] |
| **Tailscale** | Encrypted mesh networking (WireGuard) | 1.60+ | BSD-3 | All nodes | [^252^][^263^] |
| **Framer Motion** | MMO UI animations, staggerChildren | 11.0+ | MIT | React / WebGPU | [^3^][^4^][^5^] |
| **Croissant 1.1** | ML dataset provenance, metadata standard | W3C / MLCommons | CC0 / open | All layers | [^450^][^451^] |

The dual-brain keystone — M4 King (12GB) at 33–48 tok/s and M2 Queen (8GB) at 15–25 tok/s — demands memory-constrained components [^292^][^301^]. Ollama loads one 8B model at Q4_K_M (~4.7GB), keeping 2GB headroom for macOS [^232^]. LiteLLM routes via latency-based failover: M4 stalls trigger M2 diversion in under 60 seconds [^310^].

The cryptographic stack unifies identity and consensus. BLS12-381 aggregates 7-of-12 BFT votes in ~7.7ms [^301^]. BIP32-Ed25519 hierarchical derivation powers Sigil, where each agent derives a deterministic key from a master seed [^239^][^306^]. The critical insight: each General's BLS key share derives from their Sigil path (`m/44'/1729'/0'/0/Gi/bls_share`), collapsing identity and consensus into one tree.

Tauri V2's transparent overlay (`macOSPrivateApi`) and `setAlwaysOnTop` create the persistent HUD [^7^][^8^]. Framer Motion animates RPG ability bars and inventory grids with spring physics [^4^][^5^]. Croissant 1.1 (MLCommons / W3C) captures dataset provenance for EU AI Act Article 10 compliance [^450^][^451^].

### 11.2 Tier 2 Technologies (Validated)

Tier 2 components have completed proof-of-concept integration and are in active staging. They carry higher operational complexity than Tier 1 selections.

| Component | Role | Validation Status | Open Source | Key Constraint |
|-----------|------|------------------|-------------|----------------|
| **Cosmos 3 Nano** | OOWM base model (16B MoT) | SFT recipe tested, HuggingFace export verified | OpenMDW-1.1 [^321^] | Requires 32GB VRAM for full precision; 9GB via QLoRA 4-bit [^171^][^309^] |
| **ChromaDB** | Feature-layer vector memory | PersistentClient + HNSW tested on M4 | Apache-2.0 | Single-process; ~500MB RAM [^248^] |
| **LanceDB** | User-layer embedded vectors | IVF-PQ indexing, >RAM datasets verified | Apache-2.0 | ~50MB RAM embedded [^219^][^258^] |
| **Sigstore** | Supply-chain attestation for MCP tools | Cosign + Rekor transparency log tested | Apache-2.0 | Requires OIDC identity provider [^384^][^387^] |
| **GrowthBook** | Feature flags for product-hive A/B testing | SDK integration with Next.js verified | MIT | Self-hosted via Docker |
| **Traefik** | Edge router, API gateway, LetsEncrypt | Dynamic config via Docker labels tested | MIT | Replaces nginx for service discovery |

The sovereignty-capability tradeoff is sharpest with Cosmos 3 Nano. The 16B model, trained on Nick's 15 years of SME data across 25 domains, runs on cloud RTX PRO 6000 (96GB), while a distilled 8B QLoRA "Keystone edition" handles local inference [^171^][^309^]. The CDC pipeline syncs compressed insights from cloud to keystone.

ChromaDB and LanceDB complement across layers. ChromaDB serves the Feature layer with persistent HNSW and a four-function API [^248^]. LanceDB handles the User layer in embedded mode at ~50MB RAM — critical for the M2 Queen [^258^]. Qdrant anchors the Product layer with TurboQuant 1.5-bit quantization at 24x compression and ~94% recall [^263^].

Sigstore addresses the MCP supply-chain crisis where 9 of 11 registries accepted malicious packages without review [^296^]. Cosign signs tools with keyless OIDC; Rekor's transparency log provides tamper-evident attestation [^384^][^387^]. Combined with SHA-256 tool pinning, Sigstore transforms the registry from liability to trust anchor.

### 11.3 Tier 3 Technologies (Emerging)

Tier 3 components are under active research and prototyping. They represent strategic bets on architectural directions that could redefine MEOK's capabilities, but each carries significant integration risk or immaturity.

| Component | Role | Maturity | Risk | Expected Stabilization |
|-----------|------|----------|------|----------------------|
| **Mamba-2 SSD** | Long-context layers, O(n) complexity | Pre-print validated; 5x throughput vs transformers | CUDA-only; no Apple Silicon | Q1 2027 |
| **Persona Engine** | Adaptive AI character generation for MMO UX | Prototype stage; emotional state graphs | No open-source reference | Q2 2027 |
| **Venturalitica SDK** | OSCAL compliance-as-code, ML-BOM generation | v0.4; 7-probe TraceCollector working | API churn pre-1.0 | Q4 2026 |
| **AIR Blackbox** | CLI scanner for EU AI Act trust layers | Beta; HMAC-SHA256 audit chain functional | Limited coverage vs Giskard | Q3 2026 |

Mamba-2's Selective State Space Design (SSD) is the highest-impact architectural bet. Replacing attention with O(n) state space operations yields 5x throughput on long-context sequences [^385^]. For the OOWM, which must process Nick's entire 15-year data corpus, this could unlock million-token context windows on current hardware. The risk is CUDA exclusivity: Mamba-2 kernels do not yet run on Apple Silicon, restricting integration to cloud until MLX ports mature.

Venturalitica SDK and AIR Blackbox form the compliance membrane. Venturalitica's TraceCollector activates seven probes — AST analysis, integrity hashing, CycloneDX ML-BOM, environment fingerprinting, hardware telemetry, carbon tracking, policy enforcement — producing OSCAL evidence for every training run [^253^][^254^]. AIR Blackbox generates HMAC-SHA256 audit chains for EU AI Act Article 50 [^251^]. Neither has reached 1.0, but both are essential for the December 2027 Annex III enforcement cliff [^227^].

The following matrix maps each vector database to its memory layer. This mapping is enforced by the CDC sync protocol.

| Memory Layer | Vector Database | Quantization | Compression | Query Latency | Scale | Citation |
|-------------|----------------|--------------|-------------|---------------|-------|----------|
| **User (Layer 0)** | LanceDB (embedded) | IVF-PQ, scalar | 4x (PQ) | 1–5ms | >RAM (disk) | [^219^] |
| **Feature (Layer 1)** | ChromaDB (persistent) | HNSW (in-memory) | 1x (native) | 2–10ms | Millions | [^248^] |
| **Product (Layer 2)** | Qdrant (Docker/K8s) | TurboQuant 1.5-bit | 24x | 1–20ms | Billions | [^263^] |
| **Keystone (Layer 3)** | Milvus (K8s/GPU) | RaBitQ | 32x | Sub-ms (GPU) | 10B+ | [^239^][^279^] |
| **Supreme (Layer 4)** | Qdrant + Neo4j hybrid | Vector + graph | N/A | 5–50ms | Unbounded | [^227^][^230^] |

Each memory layer applies heavier quantization as data propagates upward — 4x (LanceDB), 24x (Qdrant), 32x (Milvus) — maintaining >94% recall [^263^][^279^]. MEOK's storage cost per insight *decreases* as data accumulates because higher-level summaries replace detail. Competitors without hierarchical compression face linear cost growth.

### 11.4 Infrastructure

#### 11.4.1 DevOps & Tooling Stack

The infrastructure layer keeps 25+ product hives, 12 BFT generals, and 5 memory layers running in concert. MEOK's DevOps philosophy is infrastructure-as-code and GitOps-native.

| Layer | Technology | Role | Status |
|-------|-----------|------|--------|
| **Container Runtime** | OrbStack (macOS) / Docker (Linux) | 2s startup, ~400MB idle, Apple Silicon native | Production [^323^][^335^] |
| **Orchestration** | Docker Compose (single-keystone) / Kubernetes (multi-keystone) | Service discovery, health checks, rolling updates | Production |
| **Infrastructure as Code** | Terraform + Ansible | Cloud resource provisioning, keystone configuration | Production |
| **CI/CD** | GitHub Actions | Build, test, Sigstore sign, deploy to keystone | Production |
| **API Specification** | OpenAPI 3.1 | LiteLLM gateway, MCP router, product-hive endpoints | Production |
| **Observability** | JSON structured logging + Redis pub/sub | Request tracing, BFT vote logs, memory sync events | Production |
| **Secret Management** | Mozilla SOPS + age encryption | Git-encrypted secrets for Tailscale keys, API tokens | Production |

OrbStack starts in 2 seconds, idles at ~400MB RAM (~180mW), versus Docker Desktop's ~726mW — a 4x power advantage for 24/7 operation [^335^]. The critical setting is `power.pause_in_sleep false`, preventing container suspension during display sleep [^264^].

#### 11.4.2 Single-Keystone Deployment (docker-compose.yml)

The following deploys a complete single-keystone stack via `docker-compose`: LiteLLM proxy (4000), Qdrant (6333), Redis (6379), and Open WebUI (3000). Ollama runs natively on macOS to preserve Metal GPU access.

```yaml
# docker-compose.yml — Single Keystone Stack
# Deploy: docker compose up -d
version: "3.8"

services:
  litellm:
    image: ghcr.io/berriai/litellm:main-latest
    ports:
      - "4000:4000"
    volumes:
      - ./litellm-config.yaml:/app/config.yaml
      - litellm-db:/app/litellm.db
    environment:
      - LITELLM_MASTER_KEY=${LITELLM_MASTER_KEY}
    command: --config /app/config.yaml --port 4000 --host 0.0.0.0
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:4000/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  qdrant:
    image: qdrant/qdrant:latest
    ports:
      - "6333:6333"
      - "6334:6334"
    volumes:
      - qdrant-data:/qdrant/storage
    environment:
      - QDRANT__SERVICE__GRPC_PORT=6334
      - QDRANT__STORAGE__PERFORMANCE__OPTIMIZER_CPU_BUDGET=2
    restart: unless-stopped
    deploy:
      resources:
        limits:
          memory: 2G

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    restart: unless-stopped

  open-webui:
    image: ghcr.io/open-webui/open-webui:main
    ports:
      - "3000:8080"
    environment:
      - OLLAMA_BASE_URL=http://host.docker.internal:11434
      - OPENAI_API_BASE_URL=http://litellm:4000
      - OPENAI_API_KEY=${LITELLM_MASTER_KEY}
    volumes:
      - open-webui-data:/app/backend/data
    restart: unless-stopped
    depends_on:
      - litellm

  traefik:
    image: traefik:v3.1
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik.yml:/etc/traefik/traefik.yml
    labels:
      - "traefik.enable=true"
    restart: unless-stopped

volumes:
  litellm-db:
  qdrant-data:
  redis-data:
  open-webui-data:
```

This stack consumes ~3.5GB RAM at idle, leaving ~8GB for Ollama's model residency. LiteLLM's healthcheck ensures recovery from transient failures; Traefik handles TLS termination and dynamic service discovery.

#### 11.4.3 Multi-Keystone Scaling (Kubernetes)

When the ecosystem scales beyond a single keystone, Kubernetes takes over. The following manifest deploys LiteLLM with HPA and Qdrant as a StatefulSet with persistent volume claims.

```yaml
# k8s-multi-keystone.yaml — Kubernetes Multi-Keystone Stack
# Apply: kubectl apply -f k8s-multi-keystone.yaml
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: litellm-gateway
  namespace: meok
spec:
  replicas: 2
  selector:
    matchLabels:
      app: litellm-gateway
  template:
    metadata:
      labels:
        app: litellm-gateway
    spec:
      containers:
        - name: litellm
          image: ghcr.io/berriai/litellm:main-latest
          ports:
            - containerPort: 4000
          env:
            - name: LITELLM_MASTER_KEY
              valueFrom:
                secretKeyRef:
                  name: meok-secrets
                  key: litellm-master-key
            - name: DATABASE_URL
              value: "postgresql://$(DB_USER):$(DB_PASS)@postgres:5432/litellm"
          volumeMounts:
            - name: config
              mountPath: /app/config.yaml
              subPath: litellm-config.yaml
          resources:
            requests:
              memory: "512Mi"
              cpu: "500m"
            limits:
              memory: "1Gi"
              cpu: "1000m"
          livenessProbe:
            httpGet:
              path: /health
              port: 4000
            initialDelaySeconds: 30
            periodSeconds: 15
      volumes:
        - name: config
          configMap:
            name: litellm-config
---
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: litellm-hpa
  namespace: meok
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: litellm-gateway
  minReplicas: 2
  maxReplicas: 10
  metrics:
    - type: Resource
      resource:
        name: cpu
        target:
          type: Utilization
          averageUtilization: 70
---
apiVersion: apps/v1
kind: StatefulSet
metadata:
  name: qdrant-product
  namespace: meok
spec:
  serviceName: qdrant-headless
  replicas: 3
  selector:
    matchLabels:
      app: qdrant-product
  template:
    metadata:
      labels:
        app: qdrant-product
    spec:
      containers:
        - name: qdrant
          image: qdrant/qdrant:latest
          ports:
            - containerPort: 6333
            - containerPort: 6334
          env:
            - name: QDRANT__CLUSTER__ENABLED
              value: "true"
            - name: QDRANT__CLUSTER__P2P__PORT
              value: "6335"
          volumeMounts:
            - name: qdrant-data
              mountPath: /qdrant/storage
          resources:
            requests:
              memory: "2Gi"
              cpu: "1000m"
            limits:
              memory: "4Gi"
              cpu: "2000m"
  volumeClaimTemplates:
    - metadata:
        name: qdrant-data
      spec:
        accessModes: ["ReadWriteOnce"]
        resources:
          requests:
            storage: 50Gi
---
apiVersion: v1
kind: Service
metadata:
  name: qdrant-product-svc
  namespace: meok
spec:
  selector:
    app: qdrant-product
  ports:
    - port: 6333
      name: http
    - port: 6334
      name: grpc
```

The StatefulSet runs Qdrant clustered with three replicas and 50Gi persistent volumes, enabling Product-layer search to scale across product hives. HPA provisions additional LiteLLM pods at >70% CPU utilization as new keystones join.

### 11.5 Integration Architecture

The following diagram maps how Tier 1, 2, and 3 components interconnect across the fractal hive layers. Arrows indicate data flow; the keystone sits at the center, with the BFT Council governing all cross-layer communication.

```mermaid
graph TB
    subgraph "UX Layer"
        T[Tauri V2 Overlay]
        FM[Framer Motion]
    end

    subgraph "Keystone (M4 King / M2 Queen)"
        O[Ollama llama.cpp/Metal]
        LL[LiteLLM Proxy]
        RED[Redis Pub/Sub]
        TS[Tailscale Mesh]
    end

    subgraph "Memory Layers"
        L[LanceDB User]
        C[ChromaDB Feature]
        Q[Qdrant Product]
        M[Milvus Keystone]
    end

    subgraph "Security & Governance"
        BFT[BFT Council<br/>BLS12-381]
        ED[Sigil Ed25519]
        FC[Firecracker Sandbox]
        SG[Sigstore Attestation]
    end

    subgraph "World Model"
        COS[Cosmos 3 Nano OOWM]
        MB[Mamba-2 SSD]
    end

    subgraph "Compliance"
        VEN[Venturalitica SDK]
        AIR[AIR Blackbox]
        CR[Croissant 1.1]
    end

    T -->|WebSocket| LL
    FM -->|Animate| T
    LL -->|Route| O
    O -->|Embed| L
    L -->|CDC Sync| C
    C -->|CDC Sync| Q
    Q -->|gRPC| M
    LL -->|Gateway| TS
    TS -->|WireGuard| RED
    BFT -->|Threshold Sign| ED
    FC -->|microVM| LL
    SG -->|Cosign| FC
    COS -->|Distill| O
    MB -->|.pipeline| COS
    VEN -->|OSCAL| BFT
    AIR -->|Audit| BFT
    CR -->|Provenance| COS
```

The Mermaid topology reveals MEOK's architectural coherence. The keystone — Ollama, LiteLLM, Redis, Tailscale — routes inference and maintains encrypted mesh connectivity. Memory layers cascade upward via CDC sync, compressing data 24–32x at each transition [^263^][^279^]. Security and governance form a parallel plane: BFT Council signs with BLS12-381, Sigil attests with Ed25519, Firecracker sandboxes MCP tools in ~125ms microVMs [^217^]. Compliance tools wrap the stack in an evidence-generating membrane.

The moat is not in the components — any engineer can install Ollama or Qdrant. The moat is in the integration: LiteLLM plus Tailscale creates a self-healing inference network; BLS12-381 layered on BIP32-Ed25519 unifies consensus and attestation; Croissant provenance feeds Venturalitica's OSCAL collector to automate compliance. These integrations are the product of deliberate architectural decisions, and they form the foundation of the sovereign AI operating system.
artifacts for every decision, every training run, and every data transformation.

What makes this stack defensible is not the individual component choices — any engineer can install Ollama or Qdrant. The moat is in the integration: the way LiteLLM's failover routing combines with Tailscale's mesh to create a self-healing inference netwo