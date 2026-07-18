# DeFoneos Horus — Palantir-Style Globe View Research (Dimension 03)

## Layer 0 World View: Global Intelligence Interface for CSOAI/MEOK

**Research Date**: 2026-01-18
**Searches Conducted**: 18 independent search queries across 6 categories
**Sources Cited**: 40+ primary and secondary sources

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Palantir Globe View Interface Analysis](#2-palantir-globe-view-interface-analysis)
3. [CesiumJS for 3D Globe](#3-cesiumjs-for-3d-globe)
4. [WebGL Globe Rendering Technologies](#4-webgl-globe-rendering-technologies)
5. [Multi-Industry Data Layer Design](#5-multi-industry-data-layer-design)
6. [Real-Time Data Feed Pipeline](#6-real-time-data-feed-pipeline)
7. [Defense-Grade Visualization Patterns](#7-defense-grade-visualization-patterns)
8. [Recommended Tech Stack](#8-recommended-tech-stack)
9. [Top 10 Globe UI Patterns](#9-top-10-globe-ui-patterns)
10. [Complete Globe Architecture](#10-complete-globe-architecture)
11. [Layer System Specification](#11-layer-system-specification)
12. [Real-Time Pipeline Design](#12-real-time-pipeline-design)
13. [Mobile Adaptation Strategy](#13-mobile-adaptation-strategy)
14. [Security Framework](#14-security-framework)
15. [ASCII Wireframes](#15-ascii-wireframes)

---

## 1. Executive Summary

DeFoneos Horus is the "Layer 0 World View" for CSOAI/MEOK — a Palantir-style 3D globe intelligence interface that visualizes ALL data across ALL industries. This research document synthesizes findings from 18 independent searches across Palantir interface design, CesiumJS capabilities, WebGL rendering technologies, multi-industry data visualization, real-time data streaming, and defense-grade C2 (Command & Control) interface patterns.

### Key Findings at a Glance

- **Best 3D Globe Engine**: CesiumJS is the de facto standard for defense-grade 3D globes, with superior terrain support, 3D Tiles streaming, and time-dynamic visualization [^363^]
- **Performance at Scale**: Cesium Primitive API handles 5,000+ moving objects at 45 FPS; custom WebGL achieves 60 FPS at 10,000+ tracks [^333^]
- **Layer Architecture**: Deck.gl's Primitive-Instancing-Layering (PIL) paradigm provides the optimal composable layer model [^293^]
- **Real-Time Streaming**: WebSocket with 300K data points/second at 60 FPS demonstrated in production [^367^]
- **Defense Patterns**: Role-based filtering, stale-track indication, keyboard-first design, offline-first architecture [^359^]
- **Data Classification**: Four-tier system (Public/Internal/Confidential/Restricted) with UI enforcement [^417^]

---

## 2. Palantir Globe View Interface Analysis

### 2.1 Palantir's Approach to Global Data Visualization

Palantir's platforms (Foundry, Gotham, and AIP) use a data-first approach where the globe serves as the primary spatial canvas for multi-dimensional analysis. While Palantir's exact globe implementation is proprietary, extensive analysis of their design patterns reveals consistent architectural decisions [^424^].

#### Core Palantir Design Patterns:

**Flatten When Entity is Unit of Analysis**
- Palantir Foundry's ontological approach recommends embedding location context directly within entity properties rather than normalizing into separate location objects [^424^]
- For DeFoneos Horus: each data entity (vehicle, server, certificate, facility) should carry its geospatial coordinates as primary properties
- Linked entities should only be used when the related entity has an independent lifecycle (e.g., a fleet that vehicles join/leave) [^424^]

**Model Actions Around Business Verbs, Not CRUD**
- Actions should be business operations: "Flag Anomalous Vehicle", "Issue Compliance Certificate", "Escalate Safety Incident" [^424^]
- Each action encapsulates validation, state transitions, and side effects
- This pattern directly applies to how operators interact with globe data points

**Pipeline Architecture: Snapshot Sources, Incremental Transforms**
- Raw data snapshots at ingestion → deduplication → incremental transforms [^424^]
- For globe visualization: raw telemetry → dedup → cleaned geospatial data → globe layer updates
- Clean separation between ingestion and transform logic enables independent change cadences [^424^]

### 2.2 Palantir-Style UI Patterns for Globe Interfaces

Based on analysis of defense intelligence dashboards and Palantir-adjacent systems:

| Pattern | Description | Application to DeFoneos Horus |
|---------|-------------|-------------------------------|
| **Unified Operational Picture** | Single view combining all data feeds into coherent spatial display | Layer 0: All CSOAI data on one globe |
| **Multi-Layer Toggle** | On/off controls for each data domain | Industry layer panel with 10+ toggles |
| **Time Slider Control** | Temporal navigation across all datasets | Playback, rewind, range selection |
| **Entity Drill-Down** | Click any data point for full detail view | Property panel with related entities |
| **Role-Based Layer Defaults** | Different users see different default layers | Fleet manager sees vehicles; auditor sees compliance |
| **Alert Correlation** | Spatial clustering of anomalies/anomalies | Heatmaps with severity gradients |

### 2.3 Palantir Interface Elements to Replicate

1. **Dark theme with high-contrast accent colors** — SOC analysts work in low-light environments; critical alerts stand out prominently in dark interfaces [^415^]
2. **Collapsible side panels** — Layer controls on left, detail panels on right, both collapsible for maximum globe viewport
3. **Floating metric cards** — Key statistics overlaid on globe corners (total entities, active alerts, system health)
4. **Hierarchical layer organization** — Parent categories (Fleet, Energy, Safety) with child sub-layers
5. **Search with geocoding** — Global search that can jump to locations, entities, or incidents
6. **Bookmarked views** — Save camera positions with active layers for quick return

---

## 3. CesiumJS for 3D Globe

### 3.1 Technical Capabilities

CesiumJS is the de facto standard for Earth-scale 3D visualization in defense and aerospace applications. Key capabilities relevant to DeFoneos Horus [^363^] [^366^]:

- **3D Tiles Streaming**: Hierarchical Level of Detail (HLOD) for massive datasets — 23 million+ buildings streaming efficiently [^339^]
- **Time-Dynamic Visualization**: First-class support for real-time telemetry via CZML format and built-in timeline widget [^363^] [^450^]
- **Terrain & Imagery Layers**: Multiple simultaneous imagery layers with alpha blending [^363^]
- **Vector & Geometry**: Native GeoJSON, KML, CZML support [^363^] [^366^]
- **3D Models**: glTF/GLB model rendering for equipment, vehicles, facilities [^363^]
- **Precision**: WGS84 globe with sub-meter accuracy [^363^]
- **3D/2D/2.5D Columbus View**: Runtime switchable view modes [^363^]

### 3.2 Performance Characteristics

Based on military benchmarks from Corvus Intelligence [^333^]:

| Track Count | Cesium Entity API | Cesium Primitive API (Instanced) | Threshold |
|-------------|-------------------|-----------------------------------|-----------|
| 1,000 | 60 FPS | 60 FPS | Excellent |
| 5,000 | 12 FPS (unacceptable) | 45 FPS (acceptable) | Marginal |
| 10,000 | 4 FPS (unusable) | 28 FPS (marginal) | Needs optimization |

**Key Performance Optimizations** [^448^]:
- Increase `tileCacheSize` (default: 100 → recommend: 1000)
- Adjust `maximumScreenSpaceError` for quality/speed tradeoff
- Use `requestRenderMode` for static scenes
- Use Primitive API with instancing for 5,000+ objects
- Enable `scene3DOnly: true` if 2D mode not needed
- Use `orderIndependentTranslucency: false` for better transparency performance

### 3.3 CesiumJS Timeline Widget

The Cesium Timeline Widget provides temporal control capabilities [^450^] [^447^]:

- **Two Modes**: LIVE (for real-time data) and HISTORIC (for playback)
- **Clock Controls**: Start time, stop time, current time with 500ms tick intervals
- **Time-Dynamic CZML**: JSON format for describing animated scenes with 4D data
- **Playback Controls**: Play, pause, scrub, speed multiplier
- **Range Sliders**: Visualize historical and future positions simultaneously [^451^]

### 3.4 CesiumJS vs Mapbox/MapLibre

| Feature | CesiumJS | Mapbox GL/MapLibre | Recommendation |
|---------|----------|-------------------|----------------|
| 3D Terrain | Native, photorealistic | Extruded vector tiles | Cesium for terrain-rich views |
| Globe Projection | True 3D globe | Flat Web Mercator | Cesium for global overview |
| 2D Map UX | Acceptable | Excellent | Mapbox for 2D-first workflows |
| Track Density (5K+) | Primitive API: 45 FPS | Custom WebGL: 58 FPS | Hybrid approach recommended |
| 3D Tiles | Native, optimized | Via Deck.gl integration | Cesium for 3D city models |
| Mobile Performance | Good | Better | Use Mapbox for mobile 2D |
| Offline Capability | Partial | Better (MBTiles/PMTiles) | Mapbox for tactical edge |

**Verdict**: Use CesiumJS as the primary 3D globe engine for DeFoneos Horus desktop, with MapLibre as fallback for 2D mobile views [^335^] [^339^].

---

## 4. WebGL Globe Rendering Technologies

### 4.1 Technology Comparison Matrix

| Technology | Use Case | Strengths | Limitations | Best For |
|------------|----------|-----------|-------------|----------|
| **CesiumJS** | Full 3D globe | Terrain, 3D Tiles, time-dynamic, precision | Bundle size, learning curve | Primary globe engine |
| **Globe.gl** | Lightweight 3D globe | Simple API, Three.js based, instancing | Less mature, fewer features | Prototyping, focused visualizations |
| **Three.js** | Custom 3D scenes | Full control, extensive ecosystem | Must build globe from scratch | Custom globe implementations |
| **Deck.gl** | Large-scale data viz | GPU-powered, millions of points, layers | GlobeView experimental | Data overlay layers |
| **D3GL** | D3-style 3D globes | D3 paradigm, arcs, points, shapes | Limited development | Academic/prototype use |
| **Mapbox GL** | 2D/3D hybrid | UX polish, vector tiles, mobile | 2D-first, limited 3D | 2D maps, mobile views |

### 4.2 Globe.gl — Lightweight Alternative

Globe.gl (built on Three.js) offers a declarative API for globe visualizations [^334^] [^337^]:

```javascript
// Globe.gl basic usage
const globe = new Globe(domElement)
  .globeImageUrl('//earth-blue-marble.jpg')
  .bumpImageUrl('//earth-topology.png')
  .pointsData(myData)
  .pointLat(d => d.lat)
  .pointLng(d => d.lng)
  .pointColor(d => d.status === 'active' ? '#00ff00' : '#ff0000')
  .pointAltitude(0.1)
  .pointRadius(0.5)
  .arcsData(flightData)
  .arcColor(d => d.color)
  .arcDashLength(0.5)
  .arcDashGap(0.1)
  .arcDashAnimateTime(2000);
```

**Performance Features**:
- Instanced meshes to reduce draw calls [^334^]
- `pointsMerge()` and `hexBinMerge()` for batching [^334^]
- Level-of-detail via `globeCurvatureResolution()` [^334^]
- H3 hexagonal binning for aggregation [^334^]
- Atmospheric glow effect built-in [^337^]

### 4.3 Deck.gl — Large-Scale Data Layer Framework

Deck.gl uses the **Primitive-Instancing-Layering (PIL) paradigm** [^293^]:

- **Primitives**: Circles, rectangles, cuboids, arrows, lines
- **Instancing**: GPU renders thousands of similar elements in single draw call
- **Layering**: Stack layers like a deck of cards for composite visualizations

**GlobeView Status**: Experimental — supports 3D globe projection with known limitations [^393^]:
- No rotation (pitch/bearing) — camera always points to earth center
- No high-precision rendering at zoom > 12
- Aggregation layers (Heatmap, Contour) not supported
- TileLayer and MVTLayer support experimental

**Best Practice**: Use Deck.gl as a **layer system on top of CesiumJS** rather than standalone globe renderer.

### 4.4 Performance at Scale: 100K+ Data Points

Research demonstrates several techniques for handling massive datasets [^419^] [^421^]:

1. **GPU Instancing**: Single draw call for thousands of objects → 60 to 1,500 FPS improvement [^427^]
2. **Level-of-Detail (LOD)**: Coarse summaries at distance, detail on zoom-in
3. **Spatial Binning**: H3 hexagons aggregate points into manageable visual units [^334^]
4. **Density-Aware Filtering**: Filter 90% of overlapping labels while maintaining context [^421^]
5. **Web Workers**: Offload data processing from main thread
6. **Binary Data Formats**: Apache Arrow, flat buffers for efficient transfer
7. **Virtualization**: Only render viewport-visible data

**Performance Benchmarks** [^367^] [^421^]:
- 300,000 data points/second streamed via WebSocket at 60 FPS (LightningChart JS)
- 5,000 nodes: 58.2 FPS maintained with optimized WebGL point-cloud architecture
- 500,000 buildings rendered via 3D Tiles at 60 FPS

---

## 5. Multi-Industry Data Layer Design

### 5.1 Layer Taxonomy for CSOAI/MEOK

Based on analysis of global infrastructure maps [^445^] [^446^], defense C2 patterns [^359^], and multi-layer dashboard design, the following layer system is proposed:

#### Layer Category 1: AI Governance & Compliance (PURPLE)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Compliance Zones | Regional boundaries | Extruded polygons, color-coded by status | Checkbox |
| Certification Status | Facility locations | Pulsing circles (green=certified, amber=pending, red=expired) | Checkbox |
| Framework Coverage | Geographic coverage | Heatmap overlay showing framework adoption | Checkbox |
| Audit Locations | Audit sites | Star markers with last-audit date | Checkbox |
| Policy Boundaries | Regulatory regions | Dashed polygon outlines | Checkbox |

#### Layer Category 2: Fleet & Transport (BLUE)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Vehicle Positions | GPS coordinates | Directional arrows with speed color | Checkbox |
| Active Routes | Route polylines | Arc lines with animated dashes | Checkbox |
| Route History | Historical paths | Faded trail lines with opacity decay | Checkbox |
| Compliance Status | Per-vehicle status | Color halo around vehicle marker | Checkbox |
| Geofenced Zones | Virtual boundaries | Extruded translucent walls | Checkbox |

#### Layer Category 3: Waste Management (GREEN)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Collection Points | Bin/container locations | Small cylinder markers | Checkbox |
| Transfer Stations | Facility locations | Larger building markers with labels | Checkbox |
| Recycling Facilities | Facility locations | Icons with recycling symbol | Checkbox |
| Collection Routes | Route paths | Colored lines with frequency indicators | Checkbox |
| Fill-Level Heatmap | Regional aggregation | Hexagonal bin extrusion height = fill level | Checkbox |

#### Layer Category 4: Energy Infrastructure (ORANGE)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Power Plants | Generation facilities | Scaled markers by capacity (MW) | Checkbox |
| Transmission Lines | Grid connections | Line network with load color-coding | Checkbox |
| Substations | Voltage step points | Transformer icons with voltage labels | Checkbox |
| Grid Load | Real-time flow | Animated flow lines (direction + speed) | Checkbox |
| Renewable Sources | Solar/wind locations | Specific icons with generation metrics | Checkbox |

#### Layer Category 5: Plant Hire & Equipment (YELLOW)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Equipment Locations | Machine positions | Equipment-type icons (3D models) | Checkbox |
| Utilization Status | Active/idle/parked | Color-coded status halos | Checkbox |
| Maintenance Windows | Service locations | Wrench icons with next-service date | Checkbox |
| Equipment Types | Category filter | Toggle groups by machinery type | Checkbox |
| Job Sites | Active work areas | Polygon zones with equipment count | Checkbox |

#### Layer Category 6: Safety & Risk (RED)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Incident Locations | Event coordinates | X-markers with severity rings | Checkbox |
| Risk Heatmaps | Regional risk scores | Density heat overlay | Checkbox |
| Safety Scores | Per-facility ratings | Colored shield icons | Checkbox |
| Near-Miss Reports | Report locations | Triangle warning markers | Checkbox |
| Evacuation Zones | Emergency areas | Pulsing red polygons | Checkbox |

#### Layer Category 7: MCP Server Infrastructure (CYAN)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Server Locations | 294 server nodes | Glowing dot with ring (radius = load) | Checkbox |
| Server Status | Health indicators | Color: green=healthy, amber=warning, red=critical | Checkbox |
| Network Topology | Connections | Animated arc lines between nodes | Checkbox |
| Load Distribution | CPU/memory usage | Bar chart overlays on each node | Checkbox |
| Data Flow | Traffic patterns | Animated particles along connections | Checkbox |

#### Layer Category 8: BFT Council (GOLD)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Validator Nodes | Node positions | Shield icons with validation power | Checkbox |
| Voting Activity | Recent votes | Pulse rings emanating from active nodes | Checkbox |
| Proposal Origins | Source locations | Flag markers for active proposals | Checkbox |
| Network Consensus | Agreement map | Regional color overlay (green=consensus) | Checkbox |

#### Layer Category 9: Certificate Registry (SILVER)
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Issued Certificates | Issue locations | Document icons with count badges | Checkbox |
| Industry Breakdown | Sector distribution | Segmented donut charts per region | Checkbox |
| Framework Distribution | Standard adoption | Stacked bar charts by geography | Checkbox |
| Verification Status | Valid/invalid/expired | Color-coded document markers | Checkbox |

#### Layer Category 10: Base Infrastructure
| Sub-Layer | Data Points | Visualization | Toggle |
|-----------|-------------|---------------|--------|
| Satellite Imagery | Global base map | Optional high-res imagery layer | Toggle |
| Terrain Elevation | Topography | 3D terrain with elevation shading | Toggle |
| Political Boundaries | Country borders | Subtle line overlay | Toggle |
| Population Density | Demographic data | Low-opacity heatmap | Toggle |
| Night Lights | Urban centers | NASA night lights imagery | Toggle |

### 5.2 Layer Organization UI

Based on defense C2 best practices [^359^]:

- **Role-Based Defaults**: Each user role gets pre-configured layer sets
  - Fleet Manager: BLUE + GREEN + YELLOW layers active by default
  - Compliance Officer: PURPLE + SILVER + base layers
  - Security Analyst: RED + CYAN + base layers
  - Executive: Summary overlays only, minimal detail

- **Layer Grouping**: Collapsible categories with master toggles
- **Opacity Sliders**: Per-layer transparency control (0-100%)
- **Layer Priority**: Drag to reorder z-index
- **Quick Presets**: One-click saved configurations ("Fleet Ops", "Audit Mode", "Crisis Response")

---

## 6. Real-Time Data Feed Pipeline

### 6.1 Architecture Overview

The real-time pipeline follows defense C2 patterns with WebSocket streaming [^359^] [^364^] [^365^]:

```
┌─────────────────────────────────────────────────────────────────┐
│                    DATA SOURCES                                  │
│  Fleet GPS    Energy Grid    Safety IoT    MCP Servers          │
│  (MQTT/GPS)   (SCADA/API)    (Sensors)     (Health APIs)       │
└──────────┬──────────┬──────────┬──────────┬─────────────────────┘
           │          │          │          │
           ▼          ▼          ▼          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    INGESTION LAYER                               │
│  Kafka Topics: fleet.telemetry | energy.metrics | safety.events  │
│                 | mcp.health | council.votes | cert.issued       │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                 STREAM PROCESSING (Flink/ksqlDB)                 │
│  - Deduplication          - Enrichment          - Aggregation   │
│  - Anomaly Detection      - Geofencing          - Scoring       │
└──────────┬──────────────────────────────────────────────────────┘
           │
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                  WEBSOCKET GATEWAY                               │
│  Role-based filtering  |  Classification check  |  Rate limit   │
└──────────┬──────────────────────────────────────────────────────┘
           │  WebSocket Protocol (wss://)
           ▼
┌─────────────────────────────────────────────────────────────────┐
│                   GLOBE CLIENT                                   │
│  CesiumJS/Deck.gl Layers  |  Tile Caching  |  Level-of-Detail   │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 WebSocket Integration

**Protocol Design**:
- Binary framing with MessagePack for minimal overhead
- Per-client subscription management (subscribe/unsubscribe per layer)
- Heartbeat every 30 seconds with automatic reconnection
- Backpressure: server drops non-critical updates when client buffer exceeds threshold

**Update Rates by Layer**:
| Layer Type | Target Latency | Update Frequency | Priority |
|------------|----------------|-------------------|----------|
| Vehicle positions | < 1 second | 1 Hz | Critical |
| Server health | < 5 seconds | 0.2 Hz | High |
| Energy grid load | < 10 seconds | 0.1 Hz | High |
| Safety incidents | < 3 seconds | Event-driven | Critical |
| Certificate issuance | < 60 seconds | Batch | Normal |
| Compliance status | < 60 seconds | Batch | Normal |

### 6.3 Performance Optimization

**Client-Side Optimizations**:
1. **Spatial Indexing**: R-tree or H3 grid for viewport culling — only render visible data
2. **Delta Updates**: Only transmit changed fields, not full entity state
3. **Interpolation**: Predict positions between updates for smooth animation
4. **Level-of-Detail**: Simplify geometry at distance (points → clusters → heatmap)
5. **Offscreen Workers**: Data processing in Web Workers, rendering in main thread
6. **Tile-Based Updates**: Divide globe into tiles, update only visible tiles

**Server-Side Optimizations**:
1. **Viewport-Aware Publishing**: Server only sends data within client's viewport
2. **Aggregation at Source**: Cluster data server-side before transmission
3. **Change Detection**: Compare snapshots, only emit deltas
4. **Caching**: Redis for hot data, persistent store for historical
5. **Horizontal Scaling**: WebSocket servers behind load balancer with sticky sessions

### 6.4 Stale Data Indication

Defense-grade systems require clear indication of data freshness [^359^]:

- **Fresh (< 2x expected interval)**: Full brightness, sharp edges
- **Stale (2-5x expected interval)**: Dimmed, subtle pulse animation
- **Expired (> 5x expected interval)**: Grayed out, dashed outline, timestamp shown
- **Lost**: Marker removed with brief "fade out" animation

---

## 7. Defense-Grade Visualization Patterns

### 7.1 C2 (Command & Control) Interface Principles

Based on analysis of military C2 systems [^359^] [^361^] [^362^]:

**The COP that wins a demo is dense, animated, and full of overlays. The COP that wins operations is restrained, fast, and shows only what the operator needs.** [^359^]

#### Core Principles:

1. **Default to fewer, larger, higher-contrast symbols**
   - Let operators add detail; do not start at maximum density
   - Role-based defaults match the operator's actual job

2. **Stale-track indication**
   - Track symbol changes when data ages (dimmer, outlined, age indicator)
   - Operators must see at a glance which tracks to trust [^359^]

3. **Keyboard-first design**
   - Every common action has a keyboard shortcut
   - Shortcuts documented in-product and discoverable [^359^]

4. **Touch-and-glove operation**
   - Same COP runs on workstations and ruggedized tablets
   - Hit targets sized for gloves; high-contrast modes [^359^]

5. **Offline-first architecture**
   - COP functions on local cache when connectivity lost
   - Replay queued actions on reconnection
   - Clearly indicate stale data vs live data [^359^]

6. **Consistency across panels**
   - Selecting a track in map highlights it in all panels
   - Every panel obeys same interaction conventions [^359^]

### 7.2 Alert Systems & Anomaly Detection

Based on SOC dashboard patterns [^388^] [^415^]:

**Alert Severity Levels**:
| Level | Color | Criteria | Response |
|-------|-------|----------|----------|
| Critical | Red (#FF0000) | Immediate threat to life/safety | Instant notification + auto-escalation |
| High | Orange (#FF6600) | Significant compliance breach | Alert within 5 minutes |
| Medium | Yellow (#FFCC00) | Anomalous behavior detected | Alert within 30 minutes |
| Low | Blue (#0099FF) | Informational, worth monitoring | Daily digest |

**Alert Visualization on Globe**:
- Pulsing concentric rings emanating from alert location
- Severity color-coded glow effect
- Count badge for clustered alerts
- Click-through to detailed alert panel with AI-generated explanation [^388^]
- Auto-dismiss when conditions normalize

### 7.3 Security Classifications in UI

Based on DoD C2 implementation standards [^368^] [^417^]:

**Data Classification Levels for DeFoneos Horus**:
| Level | Color Banner | Access | Data Examples |
|-------|-------------|--------|---------------|
| PUBLIC | Green | Anyone | Marketing materials, public reports |
| INTERNAL | Blue | CSOAI Staff | Operational metrics, internal policies |
| CONFIDENTIAL | Amber | Authorized personnel | Customer data, financial forecasts |
| RESTRICTED | Red | Need-to-know only | Security vulnerabilities, active investigations |

**UI Enforcement**:
- Color-coded banner at top of interface indicating current session classification
- Classification label on every data entity
- Cross-checks at API and database layers — never only at UI [^359^]
- Watermark indicating classification level on screenshots/exports

### 7.4 Role-Based Access Control

Per defense C2 best practices [^359^] [^415^]:

**Filter at Two Places**:
1. **Gateway Filter**: What data to send to client (bandwidth optimization)
2. **Policy Engine**: Whether to send at all (security enforcement)

**Role Configuration**:
- Per-user, per-session layer authorization
- User can adjust within their authorization bounds
- System enforces the upper bound
- Cross-checks at API + database layers [^359^]

---

## 8. Recommended Tech Stack

### 8.1 Core Globe Rendering

| Component | Technology | Version | Justification |
|-----------|-----------|---------|---------------|
| **Primary Globe** | CesiumJS | 1.120+ | De facto defense standard, 3D Tiles, time-dynamic [^363^] |
| **Data Layers** | Deck.gl | 9.3+ | GPU-powered, millions of points, layer composition [^291^] |
| **3D Models** | Three.js | r160+ | glTF/GLB support, custom 3D objects |
| **2D Fallback** | MapLibre GL | 4.0+ | Mobile/2D views, vector tiles, offline support |
| **Globe.gl** | (optional) | 2.32+ | Rapid prototyping, simpler visualizations [^334^] |

### 8.2 Application Framework

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **UI Framework** | React 18 + TypeScript | Defense-proven, mature ecosystem [^359^] |
| **State Management** | Zustand + Immer | Reference-stable selectors for streaming data [^359^] |
| **UI Components** | Ant Design or Mantine | Mature component library, themable to defense conventions |
| **Build Tool** | Vite | Fast DX, optimized production builds |
| **Testing** | Vitest + Playwright | Unit + E2E testing |

### 8.3 Real-Time Pipeline

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Message Bus** | Apache Kafka | Industry standard, durable, scalable |
| **Stream Processing** | Kafka Streams / Flink | Complex event processing, windowing |
| **WebSocket Gateway** | Socket.io or custom WS | Fallback support, room-based subscriptions |
| **Cache** | Redis | Hot data, session state, rate limiting |
| **Database** | PostgreSQL + PostGIS | Geospatial queries, relational data |
| **Time-Series** | TimescaleDB or InfluxDB | Telemetry history, metrics |

### 8.4 Data Formats

| Format | Use Case | Justification |
|--------|----------|---------------|
| **CZML** | Time-dynamic 3D scenes | Cesium native, animation support [^447^] |
| **3D Tiles** | City models, point clouds | OGC standard, HLOD streaming [^339^] |
| **GeoJSON** | Vector features | Universal, simple, human-readable |
| **MVT (Mapbox Vector Tiles)** | Base maps | Compact, fast rendering [^339^] |
| **FlatGeobuf** | Large vector datasets | Binary, streamable, indexed |
| **Apache Arrow** | In-memory data transfer | Zero-copy, columnar, efficient |
| **MessagePack** | WebSocket payload | Binary JSON, compact, fast |

### 8.5 DevOps & Infrastructure

| Component | Technology | Justification |
|-----------|-----------|---------------|
| **Container** | Docker + Kubernetes | Scalable, portable deployment |
| **CDN** | CloudFront / Cloudflare | Global tile delivery, low latency |
| **Tile Server** | Cesium ion / custom | 3D Tiles, imagery serving |
| **CI/CD** | GitHub Actions | Automated testing, deployment |
| **Monitoring** | Grafana + Prometheus | Metrics, alerting, dashboards |

---

## 9. Top 10 Globe UI Patterns

Based on synthesis of Palantir-style interfaces, defense C2 systems, and modern geospatial visualization best practices:

### Pattern 1: The "God View" Overview
- **Description**: Full-screen 3D globe as default view, showing all active layers at world scale
- **Rationale**: Provides immediate spatial context for all global operations
- **Implementation**: CesiumJS with camera at ~10,000km altitude, atmospheric glow enabled [^363^]
- **Interaction**: Scroll to zoom, drag to rotate, right-click to tilt

### Pattern 2: Layer Cascade Controls
- **Description**: Collapsible hierarchical layer panel with master toggles, opacity sliders, and child sub-layers
- **Rationale**: Defense operators need quick access to toggle data domains without hunting through menus [^359^]
- **Implementation**: Left-side panel with accordion groups, color-coded by category
- **Interaction**: One-click toggle, shift+click to solo layer, drag to reorder priority

### Pattern 3: Temporal Scrubber
- **Description**: Bottom-mounted timeline with play/pause/speed controls, range selection, and live/historic mode toggle
- **Rationale**: Time is the fourth dimension; all globe data exists temporally [^447^] [^450^]
- **Implementation**: Cesium Timeline Widget with custom styling [^450^]
- **Interaction**: Drag to scrub, double-click to jump, range handles for window selection

### Pattern 4: Entity Spotlight
- **Description**: Click any globe entity to "spotlight" it — camera orbits, detail panel slides in, related entities highlight
- **Rationale**: Drill-down is the primary analysis pattern in intelligence systems
- **Implementation**: Raycasting for entity selection, smooth camera transition, React side panel with tabs
- **Interaction**: Click to select, Escape to deselect, Shift+click to multi-select

### Pattern 5: Alert Correlation Rings
- **Description**: Severity-coded concentric rings emanating from alert locations, with clustering at distance
- **Rationale**: Spatial anomalies need immediate visual attention [^388^] [^415^]
- **Implementation**: CSS/Canvas animation overlay on Cesium, dynamic LOD based on zoom
- **Interaction**: Click ring to see alert details, hover for summary, right-click to acknowledge

### Pattern 6: Density-Responsive Clustering
- **Description**: Individual markers at zoomed-in levels automatically aggregate into clusters with count badges when zoomed out
- **Rationale**: 100K+ points cannot all be individually rendered; clustering maintains performance [^419^]
- **Implementation**: H3 hexagonal binning at low zoom, supercluster for points, individual at high zoom
- **Interaction**: Click cluster to zoom in and expand, hover for cluster summary

### Pattern 7: Split-View Comparison
- **Description**: Side-by-side globe views showing different time periods or different data configurations
- **Rationale**: Comparative analysis is fundamental to intelligence work [^392^]
- **Implementation**: Deck.gl multi-view support or dual Cesium viewers [^392^]
- **Interaction**: Synchronized camera or independent, swipe divider to resize

### Pattern 8: Command Palette
- **Description**: Keyboard-activated search that can find locations, entities, layers, and actions
- **Rationale**: Keyboard-first design is essential for stressed operations [^359^]
- **Implementation**: Cmd/Ctrl+K to activate, fuzzy search, typeahead suggestions
- **Interaction**: Type to search, Enter to execute, arrow keys to navigate, Esc to dismiss

### Pattern 9: Adaptive Detail Panel
- **Description**: Context-aware right panel that shows summary statistics when nothing selected, entity details when selected, and comparison tables when multiple selected
- **Rationale**: Screen real estate is precious; panels should adapt to context [^359^]
- **Implementation**: React component with dynamic tabs based on selection state
- **Interaction**: Collapsible, resizable, detachable to separate window

### Pattern 10: Classification Watermark & Session Banner
- **Description**: Persistent visual indication of data classification level with color-coded banner and watermark
- **Rationale**: Security requires constant awareness of classification level [^417^] [^368^]
- **Implementation**: Fixed banner at viewport top, subtle watermark on all data, screenshot protection
- **Interaction**: Click banner to view session clearance details, auto-warning when viewing higher classification

---

## 10. Complete Globe Architecture

### 10.1 System Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           CLIENT APPLICATION                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │   GLOBE      │  │   LAYER      │  │   DETAIL     │  │   ALERT      │    │
│  │   COMPONENT  │  │   PANEL      │  │   PANEL      │  │   BAR        │    │
│  │  (CesiumJS)  │  │  (React)     │  │  (React)     │  │  (React)     │    │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘    │
│         │                 │                  │                 │            │
│  ┌──────┴─────────────────┴──────────────────┴─────────────────┴──────┐      │
│  │                        STATE MANAGEMENT (Zustand)                 │      │
│  │   - Camera position        - Active layers    - Selected entity   │      │
│  │   - Time settings          - Viewport         - Alert state       │      │
│  └─────────────────────────────────┬─────────────────────────────────┘      │
│                                    │                                        │
│  ┌─────────────────────────────────┴─────────────────────────────────────┐  │
│  │                    WEBSOCKET CLIENT (Socket.io)                       │  │
│  │   - Room subscriptions    - Delta application     - Reconnection     │  │
│  └─────────────────────────────────┬─────────────────────────────────────┘  │
└────────────────────────────────────┼────────────────────────────────────────┘
                                     │ WSS (TLS 1.3)
┌────────────────────────────────────┼────────────────────────────────────────┐
│                                    ▼                                        │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    API GATEWAY (Kong/AWS API GW)                     │   │
│  │   Auth (JWT)    Rate Limit    Classification Filter    RBAC         │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────┼───────────────────────────────────────┐   │
│  │                    WEBSOCKET GATEWAY CLUSTER                         │   │
│  │   - Connection mgmt    - Room subscriptions    - Message routing   │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────┴───────────────────────────────────────┐   │
│  │                    STREAM PROCESSING (Kafka Streams)                 │   │
│  │  fleet.telemetry  energy.metrics  safety.events  mcp.health        │   │
│  └─────────────────────────────┬───────────────────────────────────────┘   │
│                                │                                            │
│  ┌─────────────────────────────┴───────────────────────────────────────┐   │
│  │                    DATA LAYER                                        │   │
│  │  PostgreSQL+PostGIS  TimescaleDB  Redis  S3 (3D Tiles/Imagery)     │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 10.2 Component Design

#### Globe Component (React wrapper around CesiumJS)
```typescript
interface GlobeProps {
  // View state
  cameraPosition: CartographicPosition;
  viewMode: '3D' | '2D' | 'COLUMBUS';
  
  // Layer configuration
  layers: LayerConfig[];
  
  // Temporal
  clockMode: 'LIVE' | 'HISTORIC';
  currentTime: Date;
  playbackSpeed: number;
  
  // Selection
  selectedEntities: EntityId[];
  
  // Performance
  targetFps: number;
  enableTerrain: boolean;
  imageryQuality: 'LOW' | 'MEDIUM' | 'HIGH';
}
```

#### Layer Configuration
```typescript
interface LayerConfig {
  id: string;
  category: LayerCategory;
  name: string;
  description: string;
  enabled: boolean;
  opacity: number;        // 0.0 - 1.0
  zIndex: number;
  minZoom: number;        // Visibility range
  maxZoom: number;
  dataSource: DataSource; // WebSocket topic, API endpoint, or tile URL
  style: LayerStyle;      // Color, size, shape rules
  clustering: {
    enabled: boolean;
    threshold: number;    // Cluster when > N visible
    method: 'H3' | 'SUPERCLUSTER' | 'GRID';
  };
  requiresClearance: ClassificationLevel;
}
```

---

## 11. Layer System Specification

### 11.1 Layer Manager Architecture

```typescript
// Layer State Management (Zustand)
interface LayerState {
  // All registered layers
  layers: LayerConfig[];
  
  // Active layer IDs
  activeLayerIds: Set<string>;
  
  // Opacity overrides
  opacityMap: Record<string, number>;
  
  // Selection state
  selectedEntityId: string | null;
  selectedEntities: string[];  // Multi-select
  
  // Presets
  savedPresets: LayerPreset[];
  
  // Actions
  toggleLayer: (id: string) => void;
  setOpacity: (id: string, opacity: number) => void;
  applyPreset: (presetId: string) => void;
  savePreset: (name: string) => void;
  reorderLayers: (newOrder: string[]) => void;
}
```

### 11.2 Layer Presets

| Preset Name | Active Layers | Target User |
|-------------|---------------|-------------|
| **All Clear** | Base layers only | Default/Visitor |
| **Fleet Operations** | Fleet + Routes + Geofences + Safety | Fleet Manager |
| **Compliance Audit** | Governance + Certificates + Infrastructure | Compliance Officer |
| **Crisis Response** | Safety + Fleet + Energy + Alerts | Crisis Manager |
| **Infrastructure** | Energy + Waste + Plant Hire | Operations Director |
| **Network Health** | MCP Servers + BFT Council + Energy | Technical Lead |
| **Executive Summary** | Population + Economy + High-level KPIs | C-Suite |

### 11.3 Rendering Pipeline

```
Layer Update → Data Fetch → Spatial Filter → Style Application → Cluster Decision → Render

Spatial Filter:     Only include entities within camera viewport + margin
Style Application:  Evaluate style rules against entity properties + current time
Cluster Decision:   If entity count > threshold AND zoom < clusterZoom → aggregate
Render:             Cesium Primitives (instanced) for 3D, Deck.gl layers for overlays
```

---

## 12. Real-Time Pipeline Design

### 12.1 WebSocket Message Protocol

```typescript
// Client → Server: Subscribe to layer updates
interface SubscribeMessage {
  type: 'subscribe';
  layers: string[];           // Layer IDs to subscribe
  viewport?: BoundingBox;     // Spatial filter (optional)
  classification?: string;    // User's max classification
}

// Server → Client: Entity update
interface EntityUpdateMessage {
  type: 'entity.update';
  layer: string;
  entities: Entity[];         // Array of entity updates
  timestamp: number;
  isDelta: boolean;           // True = partial update (only changed fields)
}

// Server → Client: Entity removal
interface EntityRemoveMessage {
  type: 'entity.remove';
  layer: string;
  ids: string[];
  timestamp: number;
}

// Server → Client: Alert
interface AlertMessage {
  type: 'alert';
  alertId: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  entityId: string;
  layer: string;
  message: string;
  timestamp: number;
  location: [number, number]; // [lat, lng]
}
```

### 12.2 Data Flow Rates

| Data Source | Messages/sec | Payload Size | Bandwidth |
|-------------|-------------|--------------|-----------|
| Fleet GPS (1,000 vehicles @ 1Hz) | 1,000 | ~200B | ~200 KB/s |
| Energy Grid (100 substations @ 0.1Hz) | 10 | ~500B | ~5 KB/s |
| Safety IoT (10,000 sensors @ 0.2Hz) | 2,000 | ~150B | ~300 KB/s |
| MCP Servers (294 @ 0.2Hz) | 59 | ~300B | ~18 KB/s |
| **Total Peak** | **~3,069** | — | **~523 KB/s** |

With delta encoding (typical 10% change rate): **~52 KB/s sustained per client**

### 12.3 Quality of Service

| Priority | Layer Type | Delivery Guarantee | Retry Policy |
|----------|-----------|-------------------|--------------|
| P0 (Critical) | Safety alerts, fleet positions | At-least-once | Immediate retry, max 3 |
| P1 (High) | Energy grid, server health | At-least-once | Retry with backoff |
| P2 (Normal) | Certificates, compliance | Best-effort | No retry |
| P3 (Background) | Historical replay, analytics | Best-effort | N/A |

---

## 13. Mobile Adaptation Strategy

### 13.1 Responsive Design Approach

The globe view adapts across device classes:

**Desktop (1200px+)**:
- Full 3D CesiumJS globe with all features
- Persistent layer panel (collapsible)
- Detail panel on right
- Full keyboard shortcuts
- Multi-view support

**Tablet (768px - 1199px)**:
- 3D globe with touch-optimized controls
- Layer panel as slide-out drawer
- Bottom sheet for entity details
- Touch-optimized hit targets (min 44x44px)
- Gesture support (pinch-zoom, two-finger rotate)

**Mobile (< 768px)**:
- 2D MapLibre view as default (performance)
- 3D globe as optional toggle
- Simplified layer controls (bottom bar)
- Full-screen detail views
- Swipe gestures for navigation
- Reduced data density (aggressive clustering)

### 13.2 Performance Optimization for Mobile

1. **Reduced Imagery Resolution**: Serve lower-res tiles to mobile clients
2. **Simplified Terrain**: Use flat or low-detail terrain on mobile
3. **Aggressive Clustering**: Higher cluster thresholds on mobile
4. **Limited Simultaneous Layers**: Max 3 active layers on mobile vs 10+ on desktop
5. **Lazy Loading**: Load layers on demand, not all at startup
6. **WebSocket Throttling**: Reduce update frequency for mobile clients
7. **Offline Tile Caching**: PMTiles/MBTiles for offline operation [^359^]

### 13.3 Touch Interaction Model

| Gesture | Desktop Equivalent | Action |
|---------|-------------------|--------|
| Single tap | Left click | Select entity |
| Double tap | Double click | Zoom in to entity |
| Long press | Right click | Context menu |
| Pinch | Scroll wheel | Zoom in/out |
| Two-finger rotate | Right-drag | Orbit globe |
| Pan | Left-drag | Pan globe |
| Swipe from edge | — | Open layer/detail panel |

---

## 14. Security Framework

### 14.1 Data Classification Enforcement

```typescript
// Classification levels
enum ClassificationLevel {
  PUBLIC = 0,      // Green — anyone
  INTERNAL = 1,    // Blue — CSOAI staff
  CONFIDENTIAL = 2, // Amber — authorized
  RESTRICTED = 3   // Red — need-to-know
}

// Entity classification
interface ClassifiedEntity {
  id: string;
  classification: ClassificationLevel;
  compartments?: string[];    // Additional access controls
  releasability?: string[];   // NATO, FVEY, etc.
  data: EntityData;
}

// User clearance
interface UserClearance {
  level: ClassificationLevel;
  compartments: string[];
  role: UserRole;
  geographicRestrictions?: BoundingBox[];
}
```

### 14.2 Security Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT                                   │
│  - JWT token in memory (never localStorage)                     │
│  - Classification banner (visual enforcement)                   │
│  - Screenshot watermarking                                      │
│  - Auto-lock after inactivity                                   │
└──────────────────────┬──────────────────────────────────────────┘
                       │ HTTPS + WSS (TLS 1.3)
┌──────────────────────┼──────────────────────────────────────────┐
│                      ▼                                          │
│  ┌─────────────────────────────────────────────────────┐       │
│  │              API GATEWAY                             │       │
│  │  - JWT validation    - Rate limiting               │       │
│  │  - Classification filter (redact above clearance)  │       │
│  │  - Audit logging     - CORS enforcement            │       │
│  └────────────────────────┬────────────────────────────┘       │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────┐       │
│  │           APPLICATION SERVICES                       │       │
│  │  - RBAC enforcement    - Data validation            │       │
│  │  - Query scoping       - Sanitization               │       │
│  └────────────────────────┬────────────────────────────┘       │
│                           │                                     │
│  ┌────────────────────────┼────────────────────────────┐       │
│  │              DATA LAYER                              │       │
│  │  - Row-level security (PostgreSQL RLS)              │       │
│  │  - Encrypted at rest (AES-256)                      │       │
│  │  - Field-level classification tags                  │       │
│  └─────────────────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────────────────┘
```

### 14.3 Audit & Compliance

- **All actions logged**: Who accessed what data, when, from where [^415^]
- **Session recording**: Optional screen recording for training/analysis
- **Export controls**: All data exports watermarked with user ID and timestamp
- **Data retention**: Automatic purging per classification policy
- **Incident response**: Automated alerts on anomalous access patterns

### 14.4 Need-to-Know Data Display

Based on defense C2 principles [^359^]:

1. **Gateway filter**: Server only sends data at or below user's clearance
2. **UI redaction**: Fields above clearance shown as `[CLASSIFIED]`
3. **Geographic filtering**: Some users restricted to specific AO (Area of Operations)
4. **Layer restrictions**: Some layers require specific roles (e.g., BFT Council for validators only)
5. **Temporal restrictions**: Some users can only see data within time windows

---

## 15. ASCII Wireframes

### 15.1 Desktop: Full Globe View (All Panels Open)

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [PUBLIC]  DeFoneos Horus — Layer 0 World View          🔔 3  [Admin ▼] [?] │
├──────────┬──────────────────────────────────────────────────┬────────────────┤
│ LAYERS   │                                                  │ DETAIL         │
│          │              🌍  3D GLOBE VIEW                    │                │
│ [🔍]     │                                                  │ ┌────────────┐ │
│          │         ✦  Server Node (LIVE)                    │ │ Entity 473 │ │
│ ☑ AI     │              〰️                                 │ │────────────│ │
│   ☐ Zones│                    〰️    ⚡ Power Plant         │ │ Type: MCP  │ │
│   ☑ Certs│    🚛 Vehicle                      (amber)      │ │ Status: UP │ │
│   ☐ Audit│         〰️                                         │ │ CPU: 67%   │ │
│          │              〰️          ✦ Server Node            │ │ RAM: 45%   │ │
│ ☑ Fleet  │    ♻️ Waste Facility        (green)              │ │ Uptime: 99%│ │
│   ☑ Veh  │                                                  │ │ Location:  │ │
│   ☑ Rte  │         ♻️                 🚛 Vehicle            │ │ 51.5, -0.1│ │
│   ☐ Geo  │              Vehicle (red)                       │ └────────────┘ │
│          │                                                  │                │
│ ☐ Waste  │    ⚡              ✦                             │ ALERTS         │
│   ☐ Coll │                                                  │ ┌────────────┐ │
│   ☐ Trns │              ✦  Server Node                      │ │ 🔴 CRIT-1  │ │
│   ☐ Recy │         ⚡ Power Plant      (critical)           │ │ Server 892 │ │
│          │                                                  │ │ DOWN 2m ago│ │
│ ☐ Energy │    〰️  Route line  〰️                             │ ├────────────┤ │
│   ☑ Plant│                                                  │ │ 🟠 HIGH-3  │ │
│   ☑ Sub  │         ♻️                 ✦                     │ │ Fleet 104  │ │
│   ☑ Line │              〰️                                  │ │ Geofence   │ │
│   ☑ Load │    ⚡         〰️       🚛                        │ └────────────┘ │
│          │                                                  │                │
│ ☐ Safety │                                                  │ METRICS        │
│   ☑ Inc  │                                                  │ ┌────────────┐ │
│   ☐ Risk │                                                  │ │ Entities:  │ │
│   ☐ Score│    ✦ ✦ ✦ ✦   MCP Server Nodes                   │ │ 12,847     │ │
│          │    (cluster: 4 nodes)                            │ │ Active:    │ │
│ ☑ MCP    │                                                  │ │ 11,203     │ │
│   ☑ Srv  │                                                  │ │ Alerts:    │ │
│   ☑ Net  │    Legend:  ✦ Server  ⚡ Power  🚛 Vehicle        │ │ 7 (3🔴)   │ │
│   ☑ Load │             ♻️ Waste   〰️ Route                   │ │ FPS: 60    │ │
│          │                                                  │ │ Latency:   │ │
│ ☐ BFT    │                                                  │ │ 23ms       │ │
│   ☐ Valid│                                                  │ └────────────┘ │
│   ☐ Vote │                                                  │                │
│   ☐ Prop │                                                  │                │
│          │                                                  │                │
│ ☑ Base   │                                                  │                │
│   ☑ Sat  │                                                  │                │
│   ☑ Terr │                                                  │                │
│   ☐ Pop  │                                                  │                │
├──────────┴──────────────────────────────────────────────────┴────────────────┤
│ [◀ ▶ ⏸]  LIVE  |──[══════════════●══════════════════]──|  2x  📅 Jan 18   │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 15.2 Desktop: Layer Panel Detail

```
┌──────────────────────────────────┐
│ LAYERS                    [⚙️]  │
│ [🔍 Search layers...]           │
│                                  │
│ ☑ AI GOVERNANCE         [🟣]   │
│   ☐ Compliance Zones            │
│   ☑ Certification Status        │
│   ☐ Framework Coverage    [━━]  │
│   ☐ Audit Locations             │
│                                  │
│ ☑ FLEET                 [🔵]   │
│   ☑ Vehicle Positions     [━━]  │
│   ☑ Active Routes               │
│   ☐ Route History               │
│   ☐ Geofenced Zones             │
│                                  │
│ ☐ WASTE                 [🟢]   │
│   ☐ Collection Points           │
│   ☐ Transfer Stations           │
│   ☐ Recycling Facilities        │
│                                  │
│ ☐ ENERGY                [🟠]   │
│   ☐ Power Plants                │
│   ☐ Transmission Lines          │
│   ☐ Substations                 │
│   ☐ Grid Load                   │
│                                  │
│ ☑ SAFETY                [🔴]   │
│   ☑ Incident Locations    [━━]  │
│   ☐ Risk Heatmaps               │
│   ☐ Safety Scores               │
│                                  │
│ ☑ MCP SERVERS           [🔵]   │
│   ☑ Server Locations      [━━]  │
│   ☐ Network Topology            │
│   ☐ Data Flow                   │
│                                  │
│ ☑ BASE                  [⚪]   │
│   ☑ Satellite Imagery           │
│   ☑ Terrain Elevation           │
│   ☐ Population Density          │
│                                  │
│ [💾 Save Preset]  [📂 Load ▼]   │
└──────────────────────────────────┘
```

### 15.3 Desktop: Entity Detail Panel

```
┌────────────────────────────┐
│ MCP SERVER NODE #473  [✕]  │
├────────────────────────────┤
│ ┌──────────────────────┐   │
│ │ [🖼️ Mini Map]        │   │
│ │ Location: 51.5, -0.12│   │
│ └──────────────────────┘   │
│                            │
│ Status:       🟢 HEALTHY   │
│ Uptime:       99.97%       │
│ Region:       EU-West-1    │
│                            │
│ CPU Usage:    [████░░] 67% │
│ Memory:       [████░░] 45% │
│ Disk:         [██████] 82% │
│ Network In:   234 MB/s     │
│ Network Out:  198 MB/s     │
│                            │
│ Connected:    1,247 peers  │
│ Requests:     45,892/min   │
│ Error Rate:   0.02%        │
│                            │
│ [📋 Certificates] [🌐 Web] │
│ [📜 Logs]    [🔧 Manage]   │
│                            │
│ Last Updated: 2 seconds ago│
│ Data Class: INTERNAL       │
└────────────────────────────┘
```

### 15.4 Desktop: Alert State

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ [RESTRICTED] DeFoneos Horus ⚠️  3 CRITICAL ALERTS          🔔 7  [Admin ▼]  │
├──────────┬──────────────────────────────────────────────────┬────────────────┤
│          │                                                  │ CRITICAL ALERTS│
│          │              🌍  3D GLOBE VIEW                    │ ┌────────────┐ │
│          │                                                  │ │ 🔴 CRIT-001│ │
│          │    ⚠️         ⚡ Power Plant                     │ │ Server 892 │ │
│          │    (CRIT)              (critical)                │ │ EU-West-1  │ │
│          │                                                  │ │ DOWN 2m    │ │
│          │         ✦ Server Node                            │ │ Auto-fail  │ │
│          │         (DOWN)           🚛 Vehicle              │ │ triggered  │ │
│          │                        (stopped)                 │ │ [Ack] [View]│ │
│          │                                                  │ ├────────────┤ │
│          │              ⚠️           ⚠️                     │ │ 🔴 CRIT-002│ │
│          │         Safety Alert     Safety Alert            │ │ Vehicle 104│ │
│          │                                                  │ │ Geofence   │ │
│          │    〰️  Route line  〰️                             │ │ Breach     │ │
│          │                                                  │ │ [Ack] [View]│ │
│          │                                                  │ ├────────────┤ │
│          │                                                  │ │ 🔴 CRIT-003│ │
│          │         ✦ Cluster (12)   ⚡                     │ │ Substation │ │
│          │                        (warning)                 │ │ Grid Overld│ │
│          │                                                  │ │ [Ack] [View]│ │
│          │                                                  │ └────────────┘ │
│          │                                                  │                │
│          │                                                  │ HIGH PRIORITY  │
│          │    Legend:  ✦ Server  ⚡ Power  🚛 Vehicle        │ ┌────────────┐ │
│          │    ⚠️ Alert  〰️ Route  + Cluster                 │ │ 🟠 HIGH-001│ │
│          │                                                  │ │ Waste Bin  │ │
│          │                                                  │ │ 89% Full   │ │
│          │                                                  │ └────────────┘ │
├──────────┴──────────────────────────────────────────────────┴────────────────┤
│ [◀ ▶ ⏸]  LIVE  |──[══════════════●══════════════════]──|  2x  ⚠️ 3 ACTIVE │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 15.5 Mobile View (Portrait)

```
┌──────────────────────────────┐
│ [←] DeFoneos Horus  [🔔][⋮] │
├──────────────────────────────┤
│                              │
│                              │
│         🌍 GLOBE VIEW        │
│                              │
│      ✦    ⚡        ✦        │
│           〰️                 │
│    🚛              ♻️        │
│         ✦    ⚠️              │
│                              │
│    ⚡         〰️    🚛       │
│                              │
│                              │
├──────────────────────────────┤
│ [🏠] [📊] [🔍] [⚙️] [👤]     │
├──────────────────────────────┤
│ ACTIVE LAYERS (3/10)    [+] │
│ [Fleet●] [Safety●] [MCP●]   │
│                              │
│ SELECTED: MCP Server #473    │
│ 🟢 EU-West-1 | CPU 67%       │
│ [View Details →]             │
├──────────────────────────────┤
│ ⚠️ 3 Alerts  [View All →]    │
└──────────────────────────────┘
```

### 15.6 Mobile: Entity Detail (Bottom Sheet)

```
┌──────────────────────────────┐
│         [━━Drag Handle━━]    │
│ MCP SERVER NODE #473    [✕]  │
├──────────────────────────────┤
│ Status:       🟢 HEALTHY     │
│ Location:     51.5, -0.12    │
│ Region:       EU-West-1      │
│                              │
│ CPU:  [████░░] 67%           │
│ RAM:  [████░░] 45%           │
│ Disk: [██████] 82%           │
│                              │
│ Requests:     45,892/min     │
│ Error Rate:   0.02%          │
│                              │
│ [📋 Certs] [🌐 Web] [🔧 Mng]│
│                              │
│ Updated: 2s ago              │
└──────────────────────────────┘
```

### 15.7 Mobile: Layer Selection (Bottom Sheet)

```
┌──────────────────────────────┐
│         [━━Drag Handle━━]    │
│ SELECT LAYERS           [✕]  │
├──────────────────────────────┤
│ ☑ AI Governance        [🟣]  │
│   ☐ Compliance Zones         │
│   ☑ Certification Status     │
│                              │
│ ☑ Fleet                [🔵]  │
│   ☑ Vehicle Positions        │
│   ☐ Active Routes            │
│                              │
│ ☐ Waste                [🟢]  │
│                              │
│ ☐ Energy               [🟠]  │
│                              │
│ ☑ Safety               [🔴]  │
│   ☑ Incident Locations       │
│                              │
│ ☑ MCP Servers          [🔵]  │
│   ☑ Server Locations         │
│                              │
│ ☑ Base Map             [⚪]  │
│   ☑ Satellite                │
│   ☑ Terrain                  │
├──────────────────────────────┤
│ [Reset]  [Apply Changes]     │
└──────────────────────────────┘
```

### 15.8 Mobile: Alerts (Bottom Sheet)

```
┌──────────────────────────────┐
│         [━━Drag Handle━━]    │
│ ALERTS (7)            [✕]    │
├──────────────────────────────┤
│ 🔴 CRITICAL (3)              │
│ ├─ Server 892 DOWN    2m ago │
│ │  [Ack] [View]              │
│ ├─ Vehicle 104 Geofence Breach│
│ │  [Ack] [View]              │
│ └─ Substation Grid Overload  │
│    [Ack] [View]              │
│                              │
│ 🟠 HIGH (2)                  │
│ ├─ Waste Bin 89% Full        │
│ └─ Certificate Expiring      │
│                              │
│ 🔵 LOW (2)                   │
│ ├─ Daily report available    │
│ └─ System maintenance sched  │
│                              │
│ [Acknowledge All]            │
└──────────────────────────────┘
```

### 15.9 Command Palette

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                                                                              │
│                                                                              │
│                              🌍 GLOBE VIEW                                   │
│                                                                              │
│                                                                              │
│         ┌──────────────────────────────────────────────┐                     │
│         │  ⚡ Quick Command                            │                     │
│         │  [🔍 Type a command, location, or entity...] │                     │
│         │                                               │                     │
│         │  SUGGESTIONS                                  │                     │
│         │  ────────────────────────────────────────     │                     │
│         │  > Zoom to London, UK              [Location] │                     │
│         │  > Find Server #892                  [Entity] │                     │
│         │  > Show Fleet layer                 [Layer]   │                     │
│         │  > Toggle dark mode                [Setting]  │                     │
│         │  > Export current view             [Action]   │                     │
│         │  > Jump to alert CRIT-001          [Alert]    │                     │
│         │  > Playback: last 24 hours       [Temporal]   │                     │
│         │                                               │                     │
│         │  RECENT                                         │                     │
│         │  ────────────────────────────────────────     │                     │
│         │  > Server #473, EU-West-1                     │                     │
│         │  > Vehicle #104, London                       │                     │
│         │  > Substation Grid-7, Reading                 │                     │
│         └──────────────────────────────────────────────┘                     │
│                                                                              │
│         Press [Esc] to close  |  [↑↓] Navigate  |  [Enter] Execute         │
└──────────────────────────────────────────────────────────────────────────────┘
```

### 15.10 Multi-View Comparison Mode

```
┌────────────────────────────────────────┬─────────────────────────────────────┐
│ VIEW 1: Current                        │ VIEW 2: 24 Hours Ago                │
│ [📍 London Area]  [💾] [🔄]           │ [📍 London Area]  [💾] [🔄]        │
│                                        │                                      │
│     🌍  GLOBE VIEW (LIVE)              │      🌍  GLOBE VIEW (HISTORIC)     │
│                                        │                                      │
│  🚛 Vehicle (active)                   │  🚛 Vehicle (position diff)         │
│                                        │                                      │
│       ⚡ Power Plant                   │       ⚡ Power Plant               │
│       (load: 85%)                      │       (load: 72%)                   │
│                                        │                                      │
│  ✦ Server Cluster                      │  ✦ Server Cluster                   │
│  (all healthy)                         │  (1 node down)                      │
│                                        │                                      │
│  ─── Route ───                         │  ─── Route (different path) ───     │
│                                        │                                      │
│ Legend: Fleet + Energy + MCP           │ Legend: Fleet + Energy + MCP        │
├────────────────────────────────────────┴─────────────────────────────────────┤
│ [◀ ▶ ⏸]  COMPARING: Now vs 2026-01-17 00:00  |  [🔗 Sync] [👁️ Independent]  │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## Citations

[^291^] deck.gl official website — GPU-powered framework for visual exploratory data analysis. https://deck.gl/

[^293^] Deck.gl: Large-scale Web-based Visual Analytics Made Easy — Primitive-Instancing-Layering paradigm research paper. https://ar5iv.labs.arxiv.org/html/1910.08865

[^332^] 3D Map Creator Software: Best Picks (2026) — Comparison of CesiumJS, Mapbox, Google Earth Engine, ArcGIS. https://wifitalents.com/best/3d-map-creator-software/

[^333^] Real-time map rendering for military C2 — Corvus Intelligence performance benchmarks for Cesium vs Mapbox at 1,000/5,000/10,000 tracks. https://corvusintell.com/blog/c2-systems/real-time-map-rendering-military/

[^334^] Globe.gl — WebGL Globe Data Visualization built on Three.js. https://grokipedia.com/page/Globegl

[^335^] Cesium vs Mapbox: 3D Geospatial and Web Maps Compared — Atlas comparison guide. https://atlas.co/comparisons/cesium-vs-mapbox/

[^336^] D3GL: A D3 Plug-in for 3D Data Visualization Using WebGL — Academic research paper. https://rubenfernandez.co/master/deliverables/d3gl.pdf

[^337^] three-globe — WebGL Globe Data Visualization as a ThreeJS reusable 3D object (GitHub). https://github.com/vasturiano/three-globe

[^338^] FOSS4G 2025 — CesiumJS and MapLibre GL JS performance comparison for 3D urban models. https://talks.osgeo.org/foss4g-2025/talk/review/N9S9PHAACVPQJQHKFSM7MRGRHD89EJPN

[^339^] Assessment of Display Performance and Comparative Analysis — CesiumJS vs MapLibre GL JS using Japan PLATEAU 3D data (arXiv). https://arxiv.org/pdf/2602.23660

[^359^] Building a C2 System from Scratch, Part 3: The COP — Corvus Intelligence guide on Common Operational Picture design. https://corvusintell.com/blog/c2-systems/building-c2-from-scratch-part-3-cop-display/

[^360^] Foxglove SDK for Real-Time Industrial PLC Data Visualization — WebSocket streaming patterns. https://foxglove.dev/blog/use-foxglove-sdk-for-real-time-industrial-plc-data-visualization-and-playback

[^361^] Thor Defence Integrated Command Interface — C2 system capabilities overview. https://thordefence.com/integrated-command-interface/

[^362^] Visual Logic — UX & Product Design for Military & Defense Systems. https://visuallogic.com/military-ux/

[^363^] CesiumJS Official Platform Page — Features and capabilities. https://cesium.com/platform/cesiumjs/

[^364^] Globe of Wonder — WebGL globe for WebSocket JSON real-time data (GitHub). https://github.com/Quad9DNS/GlobeOfWonder

[^365^] Spatial Dashboard Using WebSockets — FME Support Center real-time vehicle tracking tutorial. https://support.safe.com/hc/en-us/articles/27652733318797-Spatial-Dashboard-Using-WebSockets

[^366^] CesiumJS — terrestris overview of capabilities and data formats. https://terrestris.de/en/software/cesiumjs/

[^367^] Real-time data visualization with WebSocket — Medium article on 300K data points/second at 60 FPS. https://niilo-keinanen-93801.medium.com/real-time-data-visualization-with-websocket-79773edbf477

[^368^] Department of Defense Command & Control Implementation Plan — Official DoD C2 framework. https://dodcio.defense.gov/Portals/0/Documents/C2_Implementation_Plan_v1.pdf

[^369^] DroneSentry-C2 — Good Design Award winner for defense C2 interface. https://good-design.org/projects/dronesentry-c2/

[^370^] Reimagining Military C2 in the Age of AI — Special Competitive Studies Project report. https://www.scsp.ai/wp-content/uploads/2024/12/DPS-Reimagining-Military-C2-in-the-Age-of-AI.pdf

[^371^] CesiumJS (@CesiumJS) / X — Official Cesium account with application showcases. https://x.com/CesiumJS

[^372^] Integrating Persistent Surveillance Systems into ISR — NATO STANAG standards for ISR data. https://publica.fraunhofer.de/bitstreams/b39f4ffb-b5a9-46d2-ae8d-b1a25a92bac3/download

[^388^] AI SOC Dashboard — Anomaly detection with ML and rule-based analysis (GitHub). https://github.com/Khush7349/ai-soc-dashboard

[^389^] Unlocking the Power of Mapbox Visual in Power BI — Multi-layer map design patterns. https://www.certlibrary.com/blog/unlocking-the-power-of-mapbox-visual-in-power-bi/

[^390^] Mapbox Custom Visual for Power BI — Multi-layer data visualization. https://marketplace.microsoft.com/es-es/product/power-bi-visuals/mapbox_pbi_custom_visual

[^391^] deck.gl v9.3 What's New — GlobeController improvements, 3D Tiles support, TerrainController. https://deck.gl/docs/whats-new

[^392^] deck.gl Views and Projections — Multi-view layouts, GlobeView. https://deck.gl/docs/developer-guide/views

[^393^] GlobeView (Experimental) — deck.gl API reference with limitations. https://deck.gl/docs/api-reference/core/globe-view

[^394^] What is deck.gl — CARTO glossary with technical overview. https://carto.com/glossary/deckgl/

[^395^] What is a Security Operations Center (SOC) — Anomali glossary on SOC operations. https://www.anomali.com/glossary/soc-security-operations-center

[^396^] Mapbox Business Intelligence — 3D Globe View for BI applications. https://www.mapbox.com/business-intelligence

[^415^] The Ultimate Guide to Cybersecurity Dashboard UI/UX — Aufait UX design guide. https://www.aufaitux.com/blog/cybersecurity-dashboard-ui-ux-design/

[^416^] Cyber Security Dashboard UI Template — Aura dark mode dashboard. https://www.aura.build/templates/cyber-security-85

[^417^] Data Classification Guide: Types, Levels & Best Practices — SentinelOne. https://www.sentinelone.com/cybersecurity-101/data-and-ai/what-is-data-classification/

[^418^] What Is Data Classification? Levels, Security & Examples — Proofpoint. https://www.proofpoint.com/us/threat-reference/data-classification

[^419^] How to Optimize Front-End Performance for Large-Scale Data Visualizations — SVG vs Canvas vs WebGL analysis. http://www.zigpoll.com/content/how-can-i-optimize-the-performance-of-a-web-application's-frontend-to-handle-largescale-data-visualizations-more-efficiently

[^420^] 4 Data Classification Levels: Importance & Examples — SISA. https://sisa.ai/resource/cyberpedia/data-classification-levels

[^421^] High-Performance WebGL-Based Visual Analytics Framework — MDPI research on 60 FPS at 5,000 nodes. https://www.mdpi.com/2076-3417/16/7/3307

[^422^] 10 Cybersecurity Dashboard UI Design Template 2026 — Design Monks. https://www.designmonks.co/blog/10-cybersecurity-dashboard-design-examples-for-design-inspiration

[^423^] 7 Powerful Open-Source WebGL Data Visualization Tools for 2025 — kepler.gl and Globe view. https://cybergarden.au/blog/7-powerful-open-source-webgl-data-visualization-tools-2025

[^424^] Palantir Foundry Design Patterns — Spencer Fuller engineering patterns. https://spencerfuller.dev/projects/foundry-patterns/

[^425^] Data Classification in Cybersecurity: Methods and Levels — Relyance.ai. https://www.relyance.ai/dspm/data-classification-in-cyber-security

[^426^] What Is Data Classification? — Palo Alto Networks Cyberpedia. https://www.paloaltonetworks.com/cyberpedia/data-classification

[^427^] 60 to 1500 FPS — Optimising a WebGL visualisation — Instancing performance guide. https://medium.com/@dhiashakiry/60-to-1500-fps-optimising-a-webgl-visualisation-d79705b33af4

[^445^] UK Power Networks — Network Infrastructure and Usage Map (NIUM). https://ukpowernetworks.opendatasoft.com/pages/network-infrastructure-usage-map/

[^446^] Awesome Electrical Grid Mapping — Global energy infrastructure datasets (GitHub). https://github.com/open-energy-transition/Awesome-Electrical-Grid-Mapping

[^447^] Visualizing Time Dynamic Data with Cesium Stories — Cesium time-dynamic tutorial. https://cesium.com/learn/ion/stories-time-dynamic/

[^448^] Optimizing Cesium tile display performance — Stack Overflow performance tips. https://stackoverflow.com/questions/59008197/optimizing-cesium-tile-display-performance

[^449^] Cesium.js time series data visualization — GIS StackExchange. https://gis.stackexchange.com/questions/212340/cesium-js-time-series-data-visualization

[^450^] Overview of the Cesium Timeline Widget — Oracle Spatial Studio documentation. https://docs.oracle.com/en/database/oracle/spatial-studio/23.2/spstu/overview-cesium-timeline-widget.html

[^451^] Working on a time range feature for dynamic visualizers — Cesium community forum. https://community.cesium.com/t/working-on-a-time-range-feature-for-dynamic-visualizers/62

---

## Appendix A: Performance Targets

| Metric | Target | Threshold | Measurement |
|--------|--------|-----------|-------------|
| Globe Frame Rate | 60 FPS | > 30 FPS minimum | Chrome DevTools |
| Entity Count (3D) | 5,000 | 10,000 with instancing | Simulated tracks |
| Entity Count (2D) | 50,000 | 100,000 with clustering | Simulated points |
| WebSocket Latency | < 100ms | < 500ms | Client ping |
| Tile Load Time | < 2s | < 5s | Network panel |
| Initial Page Load | < 5s | < 10s | Lighthouse |
| Time to Interactive | < 8s | < 15s | Lighthouse |
| Mobile FPS | 30 FPS | > 20 FPS minimum | Chrome DevTools |

## Appendix B: Data Source Integration Matrix

| System | Protocol | Format | Update Rate | Latency Target |
|--------|----------|--------|-------------|----------------|
| Fleet GPS | MQTT/HTTPS | JSON (lat/lng/speed/heading) | 1 Hz | < 1s |
| Energy Grid | REST API | JSON (load/voltage/frequency) | 0.1 Hz | < 10s |
| Safety IoT | WebSocket | Protocol Buffers | 0.2 Hz | < 3s |
| MCP Servers | gRPC/REST | JSON (health/metrics) | 0.2 Hz | < 5s |
| BFT Council | WebSocket | JSON (votes/proposals) | Event-driven | < 3s |
| Certificates | REST API | JSON (issue/verify/revoke) | Batch | < 60s |
| Waste Sensors | LoRaWAN/HTTPS | JSON (fill-level/location) | 0.1 Hz | < 60s |
| Plant Equipment | OEM API | Various | 0.1 Hz | < 30s |

---

*Research compiled for DeFoneos Horus — CSOAI/MEOK Layer 0 World View. All sources cited with [^number^] format. 18 independent searches conducted across 6 research categories.*
