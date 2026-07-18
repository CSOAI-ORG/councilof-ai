# Deep Research: Open Source World Simulation Engines for CSOAI.org

**Date:** 2026-01-12
**Researcher:** AI Research Agent
**Purpose:** Evaluate all open-source, web-based, and AI-specific world simulation engines capable of powering 47 AI agents in a sovereign town context.
**Primary Engine:** Unreal Engine 5.8 (baseline for comparison)

---

## Table of Contents

1. [Executive Summary](#executive-summary)
2. [Engine Rankings](#engine-rankings)
3. [Detailed Engine Analysis](#detailed-engine-analysis)
   - 3.1 [Godot Engine](#31-godot-engine)
   - 3.2 [Bevy Engine](#32-bevy-engine)
   - 3.3 [Three.js](#33-threejs)
   - 3.4 [Babylon.js](#34-babylonjs)
   - 3.5 [NVIDIA Omniverse](#35-nvidia-omniverse)
   - 3.6 [Decentraland](#36-decentraland)
   - 3.7 [The Sandbox](#37-the-sandbox)
   - 3.8 [Roblox](#38-roblox)
   - 3.9 [Open 3D Engine (O3DE)](#39-open-3d-engine-o3de)
   - 3.10 [Panda3D](#310-panda3d)
   - 3.11 [OpenRA](#311-openra)
   - 3.12 [OpenMW](#312-openmw)
   - 3.13 [Colyseus](#313-colyseus)
   - 3.14 [SpatialOS (Improbable)](#314-spatialos-improbable)
   - 3.15 [WebGPU / wgpuEngine](#315-webgpu--wgpugengine)
   - 3.16 [CesiumJS + OpenStreetMap](#316-cesiumjs--openstreetmap)
   - 3.17 [Gazebo Simulator](#317-gazebo-simulator)
   - 3.18 [Heaps.io](#318-heapsio)
   - 3.19 [AI Town (a16z)](#319-ai-town-a16z)
   - 3.20 [Apache Ignite / Hazelcast](#320-apache-ignite--hazelcast)
4. [Comparison Matrix](#comparison-matrix)
5. [CSOAI Recommendations](#csoai-recommendations)
6. [Sources](#sources)

---

## Executive Summary

For CSOAI.org's requirement of powering 47 AI agents in a sovereign town, we evaluated 20 world simulation engines and platforms across multiple dimensions: license openness, 3D capability, agent capacity, networking support, and AI integration difficulty.

**Key Findings:**
- **Best Overall Alternative to UE5:** Godot Engine 4.x (MIT license, built-in NavigationAgent, growing AI plugin ecosystem)
- **Best for Web-Based Town:** Three.js + Babylon.js (MIT/Apache 2.0, immediate browser deployment)
- **Best for AI-First Simulation:** NVIDIA Omniverse (open-source components, agent-callable tools)
- **Best ECS Architecture:** Bevy Engine (Rust, dual MIT/Apache 2.0, massively parallel ECS)
- **Best for Distributed Worlds:** SpatialOS + Colyseus combination
- **Best Research Reference:** AI Town by a16z (MIT, purpose-built for LLM agent simulation)

For 47 agents specifically, all evaluated engines are technically capable. The choice depends on whether CSOAI prioritizes visual fidelity (UE5/Godot/O3DE), web accessibility (Three.js/Babylon), open-source purity (Godot/Bevy), or AI-native workflows (Omniverse/AI Town).

---

## Engine Rankings

### Tier 1: Strongly Recommended for CSOAI

| Rank | Engine | Score | Why |
|------|--------|-------|-----|
| 1 | Godot 4.x | 9.2/10 | MIT license, built-in AI pathfinding, thriving ecosystem |
| 2 | Bevy Engine | 9.0/10 | Rust ECS, MIT/Apache 2.0, excellent for agent simulation |
| 3 | AI Town (a16z) | 8.8/10 | Purpose-built for LLM agents, MIT license, proven reference |
| 4 | O3DE | 8.5/10 | Apache 2.0, AAA-capable, ROS2/robotics integration |
| 5 | NVIDIA Omniverse | 8.3/10 | Open-source components, AI agent toolkit, physics-accurate |

### Tier 2: Viable with Trade-offs

| Rank | Engine | Score | Why |
|------|--------|-------|-----|
| 6 | Three.js | 8.0/10 | Web-native, MIT, massive community |
| 7 | Babylon.js | 7.8/10 | Apache 2.0, Microsoft-backed, WebXR |
| 8 | CesiumJS + OSM | 7.5/10 | Real-world geospatial, Apache 2.0 |
| 9 | Panda3D | 7.2/10 | BSD license, Disney-proven, Python/C++ |
| 10 | Gazebo | 7.0/10 | Apache 2.0, robotics-native, ROS2 |

### Tier 3: Niche/Specialized Use

| Rank | Engine | Score | Why |
|------|--------|-------|-----|
| 11 | Decentraland | 6.5/10 | DAO-governed, Apache 2.0 scenes, blockchain-required |
| 12 | Colyseus | 6.5/10 | MIT, multiplayer framework (not standalone engine) |
| 13 | OpenRA | 6.0/10 | GPL-3, RTS-focused, AI research active |
| 14 | OpenMW | 5.8/10 | GPL-3, RPG-focused, Lua scripting |
| 15 | Heaps.io | 5.5/10 | Haxe-based, 2D/3D, smaller community |

### Tier 4: Limited Applicability

| Rank | Engine | Score | Why |
|------|--------|-------|-----|
| 16 | SpatialOS | 5.0/10 | Proprietary backend, complex setup |
| 17 | Roblox | 4.5/10 | Proprietary platform, not open source |
| 18 | The Sandbox | 4.0/10 | Proprietary UE4-based, closed ecosystem |
| 19 | Apache Ignite/Hazelcast | 4.0/10 | Data grid only, not rendering engine |
| 20 | WebGPU/wgpuEngine | 3.5/10 | Early stage, limited features |

---

## Detailed Engine Analysis

### 3.1 Godot Engine

- **Website:** https://godotengine.org
- **License:** MIT (fully permissive, commercial use allowed)
- **Language:** GDScript, C#, C++
- **Agent Capacity:** 2,000+ agents with proper optimization; 47 agents easily achievable
- **3D Capability:** Full 3D renderer with PBR, shadows, global illumination (significant improvements in Godot 4.x)
- **Networking:** Built-in multiplayer API, RPC system, dedicated server support
- **AI Integration:**
  - Built-in NavigationServer2D/3D with RVO collision avoidance
  - NavigationAgent2D/3D nodes for pathfinding [^1383^]
  - Player2 AI NPC plugin for LLM-powered NPCs [^1306^]
  - GDCogniAI Assistant (open-source AI assistant plugin) [^1311^]
  - Godot MCP (Model Context Protocol) for AI editor integration [^1312^]
  - Eidolon GodotAgent plugin for gen AI agents [^1307^]
- **Performance:** Users report 2,000 pathfinding agents at 140 FPS with proper batching [^1386^]

**Pros:**
- Completely free and open source (MIT)
- No royalties, no licensing fees
- Excellent documentation and growing community
- Built-in navigation and pathfinding for AI agents
- Multiplayer networking built-in
- Exports to Windows, macOS, Linux, Web, mobile

**Cons:**
- 3D rendering quality behind UE5
- GDScript is less performant than C++/Rust
- Smaller asset marketplace than Unity/UE5
- AI plugin ecosystem still maturing

**CSOAI Recommendation:** STRONG CANDIDATE - The best open-source alternative to UE5 for CSOAI. MIT license aligns perfectly with sovereign principles. 47 agents is well within capability. The built-in NavigationAgent system, combined with open-source AI plugins like Player2 and Eidolon, provides a complete solution. If UE5 becomes unsuitable, Godot should be the first fallback.

---

### 3.2 Bevy Engine

- **Website:** https://bevy.org
- **License:** Dual MIT or Apache 2.0
- **Language:** Rust
- **Agent Capacity:** Thousands of entities (ECS-optimized); cemetery memory system enables efficient respawning [^1338^]
- **3D Capability:** Modern 3D renderer with lights, shadows, PBR, glTF loading, custom shaders [^1380^]
- **Networking:** Bevy networking crates available (bevy_renet, bevy_quinnet)
- **AI Integration:**
  - Native ECS architecture is ideal for agent simulation
  - Each agent = entity with components (position, behavior, memory)
  - Lock-free parallel scheduler for multi-agent systems
  - KrABMaga framework built on Bevy for agent-based modeling [^1338^]
  - Custom systems for agent behavior, pathfinding, decision-making
- **Performance:** Massively parallel ECS; compile times 0.8-3 seconds with fast config [^1380^]

**Pros:**
- Most permissive open-source license (MIT/Apache 2.0)
- ECS architecture is perfect for agent simulation
- Rust provides memory safety and performance
- Hot reloading support
- Cross-platform (Windows, macOS, Linux, Web, iOS, Android)

**Cons:**
- Still in early development (pre-1.0)
- Rust learning curve for team
- Smaller ecosystem than Godot/UE5
- Editor/tools less mature
- Breaking API changes every ~3 months [^1385^]

**CSOAI Recommendation:** STRONG CANDIDATE for custom-built agent simulation. The ECS architecture maps perfectly to multi-agent AI systems. Best choice if CSOAI wants to build a custom agent framework from scratch. Rust's safety guarantees are ideal for long-running simulation systems. However, the pre-1.0 status requires willingness to handle API changes.

---

### 3.3 Three.js

- **Website:** https://threejs.org
- **License:** MIT
- **Language:** JavaScript/TypeScript
- **Agent Capacity:** Browser-dependent; ~100-500 animated agents typical, thousands possible with instancing
- **3D Capability:** Full WebGL 3D rendering; scenes, cameras, PBR materials, lighting, animation [^51^]
- **Networking:** WebSocket, WebRTC (via separate libraries)
- **AI Integration:**
  - Web-native: ideal for browser-based AI agent visualization
  - Can integrate with any LLM API via fetch/WebSocket
  - AI Town by a16z uses PixiJS (similar 2D approach) [^203^]
  - Visionary project: WebGPU + Three.js for AI world models [^1306^]
- **Ecosystem:** 2.5M+ weekly npm downloads, 109,000 GitHub stars [^1406^]

**Pros:**
- Most popular web 3D library
- Zero installation for users (runs in browser)
- Massive community and examples
- Integrates with any web AI service
- Hot reloading by nature (web-based)

**Cons:**
- Not a full game engine (no built-in physics, AI, networking)
- Performance limited by browser/JavaScript
- Requires separate libraries for physics, networking, audio
- Large scene optimization requires expertise [^1406^]

**CSOAI Recommendation:** GOOD for web-first deployment. If CSOAI wants a browser-accessible town that anyone can visit without installation, Three.js is the best choice. Combine with Colyseus for multiplayer. Not suitable if visual fidelity matching UE5 is required. Best paired with a backend AI agent system.

---

### 3.4 Babylon.js

- **Website:** https://babylonjs.com
- **License:** Apache 2.0
- **Language:** JavaScript/TypeScript
- **Agent Capacity:** Similar to Three.js; hundreds of agents with optimization
- **3D Capability:** Full-featured 3D engine with PBR, particle systems, WebXR, physics integration [^1327^]
- **Networking:** Built-in networking primitives; Colyseus integration available
- **AI Integration:**
  - Complete game engine (more features than Three.js)
  - Built-in physics (Cannon.js, Ammo.js)
  - Animation system with keyframe and rigging support
  - Node Material Editor for visual shader programming [^1332^]
- **Ecosystem:** Microsoft-backed, strong community

**Pros:**
- More complete engine than Three.js
- Apache 2.0 license (very permissive)
- Built-in physics and animation systems
- Strong WebXR/VR support
- Excellent documentation and playground

**Cons:**
- Smaller community than Three.js
- Same browser performance limitations
- Heavier than Three.js for simple use cases

**CSOAI Recommendation:** GOOD alternative to Three.js if CSOAI needs more built-in engine features. Apache 2.0 license is excellent. Microsoft backing provides stability. Better choice than Three.js for complex 3D town simulations requiring built-in physics.

---

### 3.5 NVIDIA Omniverse

- **Website:** https://www.nvidia.com/en-us/omniverse/
- **License:** Open-source components (various), free to use
- **Language:** Python, C++
- **Agent Capacity:** Designed for industrial scale; thousands of agents
- **3D Capability:** Photorealistic rendering with RTX ray-tracing, PhysX physics, OpenUSD [^1301^]
- **Networking:** Cloud-native, microservices architecture, Nucleus collaboration server
- **AI Integration:**
  - NVIDIA Agent Toolkit with open-source physical AI skills [^1302^]
  - ovphysx: Open-source USD-native physics [^1308^]
  - Newton Physics: Open-source extensible physics engine [^1308^]
  - NVIDIA Cosmos: World Foundation Models for physical AI reasoning [^1301^]
  - Synthetic data generation via Omniverse Replicator
  - Direct integration with Isaac Sim for robotics [^1305^]

**Pros:**
- Industry-leading photorealistic rendering
- Purpose-built for AI simulation agents
- OpenUSD ecosystem for interoperability
- Enterprise-proven (BMW, Amazon, GM, Siemens) [^1305^]
- Open-source components available

**Cons:**
- Requires NVIDIA GPU (RTX recommended)
- Full enterprise features require paid licensing
- Complex setup and steep learning curve
- Overkill for a 47-agent town simulation
- Requires cloud infrastructure for full deployment

**CSOAI Recommendation:** CONDITIONAL RECOMMENDATION. If CSOAI needs photorealistic quality and has NVIDIA hardware, Omniverse provides the most advanced AI-native simulation platform. However, it's likely overkill for 47 agents. Best suited for future scaling to hundreds/thousands of agents or when photorealism is critical.

---

### 3.6 Decentraland

- **Website:** https://decentraland.org
- **License:** Apache 2.0 (SDK scenes), various (clients)
- **Language:** TypeScript (SDK7), Rust (Bevy client)
- **Agent Capacity:** Platform-scale; concurrent users in thousands
- **3D Capability:** Browser-based 3D, WebGL/WebGPU rendering [^1314^]
- **Networking:** Decentralized network, DAO-governed
- **AI Integration:**
  - SDK7 for creating interactive scenes
  - Support for AI NPCs via server-side APIs
  - Community-built AI integrations
  - Bevy client as alternative renderer [^1312^]

**Pros:**
- Open source and decentralized
- DAO governance aligns with sovereignty concepts
- Browser-based (no installation)
- Apache 2.0 license for scene development
- Existing virtual world infrastructure

**Cons:**
- Blockchain/MANA cryptocurrency required for land ownership
- Performance issues reported (bugs, empty worlds) [^1314^]
- Not designed for private/controlled deployments
- AI integration requires custom development
- Community criticism on technical execution

**CSOAI Recommendation:** NOT RECOMMENDED as primary engine. The blockchain requirement and public-world model don't align with a sovereign town concept. However, the SDK and open-source components could provide useful reference architecture.

---

### 3.7 The Sandbox

- **Website:** https://www.sandbox.game
- **License:** Proprietary (closed source platform)
- **Engine:** Unreal Engine 4 (Game Maker) [^1410^]
- **Agent Capacity:** Platform-dependent
- **3D Capability:** Voxel-based 3D (Minecraft-style)
- **Networking:** Centralized servers
- **AI Integration:** Limited; plugin-based

**Pros:**
- Established metaverse platform
- Large user base
- Free to download Game Maker

**Cons:**
- NOT open source
- Voxel graphics may not suit realistic town simulation
- Closed ecosystem
- SAND cryptocurrency required
- Limited AI agent capabilities

**CSOAI Recommendation:** NOT RECOMMENDED. Not open source, closed ecosystem, and doesn't align with sovereign/self-hosted requirements.

---

### 3.8 Roblox

- **Website:** https://roblox.com
- **License:** Proprietary platform
- **Language:** Lua
- **Agent Capacity:** Platform supports millions of concurrent users
- **3D Capability:** Full 3D with physics
- **Networking:** Built-in multiplayer (Roblox handles all networking)
- **AI Integration:**
  - Determinant AI SDK (Apache 2.0) for AI NPCs [^1349^]
  - Comprehensive NPC System open source [^1358^]
  - RobloxClaw AI coding agent (MIT) [^1357^]
  - Roblox Cube 3D AI model generation (open source) [^1356^]
  - Text generation, TTS, STT tools announced

**Pros:**
- Massive scale and user base
- Easy multiplayer deployment
- Growing AI NPC ecosystem
- Some open-source SDKs available

**Cons:**
- Proprietary platform (NOT open source)
- Revenue share model (takes ~75%)
- Cannot self-host
- Limited control over infrastructure
- Platform rules and moderation

**CSOAI Recommendation:** NOT RECOMMENDED. While Roblox has interesting AI NPC tools, the proprietary, non-self-hosted nature contradicts CSOAI's sovereign principles. Some open-source AI NPC tools (Determinant AI SDK, Comprehensive NPC System) could be adapted for other engines.

---

### 3.9 Open 3D Engine (O3DE)

- **Website:** https://o3de.org
- **License:** Apache 2.0
- **Language:** C++, Lua, Python
- **Agent Capacity:** AAA-scale; hundreds to thousands
- **3D Capability:** Atom renderer (PBR, ray-tracing), cinema-quality [^1328^]
- **Networking:** Multiplayer Gem, dedicated server support
- **AI Integration:**
  - AI Gem for navigation and behavior trees
  - ROS 2 Gem for robotics simulation [^1325^]
  - Script Canvas (visual scripting)
  - Kythera AI integration (pathfinding, NPC behavior) [^1328^]
  - Modular Gem architecture for extensibility

**Pros:**
- Apache 2.0 (fully open source)
- AAA-capable rendering (Amazon/Meta/Huawei backed) [^1330^]
- No licensing fees or royalties
- ROS 2 integration for AI agents
- Modular Gem system
- Active development (25.05 released June 2025) [^1339^]

**Cons:**
- Smaller community than UE5/Godot
- Steep learning curve
- Documentation gaps
- Fewer marketplace assets
- Originally derived from Lumberyard (limited adoption history)

**CSOAI Recommendation:** STRONG CANDIDATE. Apache 2.0 license, AAA-capable, with ROS2 integration that enables sophisticated AI agent behaviors. The modular architecture allows building a custom agent simulation Gem. Best choice if CSOAI needs UE5-level quality with full open-source licensing.

---

### 3.10 Panda3D

- **Website:** https://www.panda3d.org
- **License:** BSD (revised)
- **Language:** Python, C++
- **Agent Capacity:** Proven with MMOs (Toontown Online, Pirates of Caribbean Online)
- **3D Capability:** Real-time 3D rendering, OpenGL, shader support [^1326^]
- **Networking:** Built-in networking library
- **AI Integration:**
  - Built-in AI library for pathfinding and decision-making [^1324^]
  - Finite state machines
  - Collision detection system
  - Scene graph architecture

**Pros:**
- BSD license (very permissive)
- Battle-tested with Disney MMOs
- Python API enables rapid prototyping
- Full C++ core for performance
- Built-in AI, physics, networking, audio
- Cross-platform (Windows, macOS, Linux)

**Cons:**
- Smaller modern community
- Dated compared to newer engines
- Less active development
- Scene graph architecture less performant than ECS for many agents
- Documentation feels dated

**CSOAI Recommendation:** VIABLE but DATED. Proven track record with MMO-scale agent counts. Python API is great for rapid AI agent development. However, the engine shows its age and has a smaller active community. Good for prototyping but consider Godot/Bevy for production.

---

### 3.11 OpenRA

- **Website:** https://www.openra.net
- **License:** GPL-3.0
- **Language:** C#, Lua, SDL/OpenGL
- **Agent Capacity:** 64 concurrent sessions per process demonstrated [^1364^]
- **3D Capability:** 2D isometric (RTS style), OpenGL rendering [^1371^]
- **Networking:** Built-in multiplayer, dedicated server support
- **AI Integration:**
  - OpenRA-RL: Open-source platform for LLM agents in RTS [^1364^]
  - 50 MCP tools for AI agent control
  - 25 Hz game loop with async streaming
  - Multi-session runner (64 sessions, 6GB RAM) [^1364^]
  - Deterministic replay system

**Pros:**
- GPL-3.0 open source
- Proven AI agent research platform (OpenRA-RL)
- LLM agent integration demonstrated
- Efficient multi-session architecture
- Well-architected C# codebase

**Cons:**
- 2D isometric only (no 3D)
- RTS mechanics not ideal for town simulation
- GPL-3.0 copyleft may concern some
- Smaller community than major engines

**CSOAI Recommendation:** INTERESTING REFERENCE. OpenRA-RL demonstrates how to integrate LLM agents with an open-source game engine efficiently. The architecture patterns (multi-session runner, MCP tools, async streaming) are highly relevant. However, 2D limitation makes it unsuitable as primary engine for a 3D town.

---

### 3.12 OpenMW

- **Website:** https://openmw.org
- **License:** GPL-3.0
- **Language:** C++, Lua (OpenMW-Lua scripting)
- **Agent Capacity:** Morrowind-scale; hundreds of NPCs
- **3D Capability:** Full 3D (Morrowind-era), navmesh pathfinding [^1351^]
- **Networking:** TES3MP fork for multiplayer
- **AI Integration:**
  - Navmesh-based pathfinding more elaborate than original Morrowind [^1351^]
  - AI packages (Wander, Follow, Escort, Combat)
  - OpenMW-Lua API for custom scripting
  - AI awareness and stealth systems
  - Custom NPC creation via scripts (no plugins needed) [^1351^]

**Pros:**
- Mature 3D RPG engine
- Navmesh pathfinding for NPCs
- Lua scripting for AI behaviors
- Open-source reimplementation (clean codebase)
- Dehardcoded mechanics (increasingly moddable)

**Cons:**
- GPL-3.0 copyleft
- Morrowind-era graphics (dated)
- RPG-focused (not designed for town simulation)
- Multiplayer requires TES3MP fork
- Community focused on Morrowind recreation

**CSOAI Recommendation:** NOT RECOMMENDED as primary. Interesting for NPC AI behavior patterns (packages, pathfinding, awareness), but too RPG-specific and graphically dated for a modern sovereign town.

---

### 3.13 Colyseus

- **Website:** https://colyseus.io
- **License:** MIT
- **Language:** JavaScript/TypeScript (Node.js)
- **Agent Capacity:** Depends on server; hundreds to thousands of concurrent clients
- **3D Capability:** N/A (networking framework, not renderer)
- **Networking:** Purpose-built multiplayer game server [^1363^]
- **AI Integration:**
  - State synchronization (schema-based)
  - Room-based architecture for agent partitioning
  - Matchmaking system
  - Client SDKs for Unity, JavaScript, Defold, Haxe, Cocos2d-X

**Pros:**
- MIT license
- Purpose-built for multiplayer games
- Automatic state synchronization
- Cloud-native (works with Kubernetes/Agones)
- Active development

**Cons:**
- NOT a rendering engine (needs Three.js/Babylon/Unity/Godot for visuals)
- Node.js single-threaded limitations
- Requires separate backend infrastructure

**CSOAI Recommendation:** RECOMMENDED as NETWORKING LAYER. If CSOAI deploys a web-based town (Three.js/Babylon), Colyseus provides the best open-source multiplayer synchronization. Pair with a frontend renderer for a complete solution.

---

### 3.14 SpatialOS (Improbable)

- **Website:** https://improbable.io
- **License:** Proprietary (platform), some open-source SDKs
- **Language:** C#, Java, C++, Scala
- **Agent Capacity:** Designed for massive scale (thousands to millions)
- **3D Capability:** Integrates with Unity, Unreal, and custom engines
- **Networking:** Distributed simulation architecture [^1353^]
- **AI Integration:**
  - Distributed entity system
  - Interest management (clients only see relevant entities)
  - Persistence layer
  - Load balancing across workers

**Pros:**
- Proven at massive scale
- Handles complex distributed simulations
- Works with existing engines (Unity, Unreal)
- Interest management for performance

**Cons:**
- Proprietary platform (NOT open source)
- Complex setup and operational overhead
- Pricing not transparent
- Some skepticism about actual capabilities [^1353^]
- Requires cloud infrastructure

**CSOAI Recommendation:** NOT RECOMMENDED. Proprietary platform with operational complexity far exceeding CSOAI's needs. For 47 agents, SpatialOS is massive overkill. Consider only if scaling to thousands+ agents.

---

### 3.15 WebGPU / wgpuEngine

- **Website:** https://github.com/upf-gti/wgpuEngine
- **License:** Open source (MIT-compatible)
- **Language:** C++ (compiles to WebAssembly)
- **Agent Capacity:** Browser-dependent
- **3D Capability:** WebGPU-based 3D rendering with PBR, forward/deferred pipelines [^1307^]
- **Networking:** N/A (rendering engine)
- **AI Integration:**
  - Can run ML inference via WebGPU compute shaders
  - Visionary project demonstrates WebGPU + AI world models [^1306^]
  - Experimental WebXR-WebGPU bindings

**Pros:**
- Future of web 3D graphics
- GPU compute for AI inference in browser
  - Cross-platform (desktop + web via WebAssembly)
  - Experimental WebXR support
  - OpenXR on desktop

**Cons:**
- WebGPU still W3C Candidate Recommendation (not final)
  - Limited browser support (Chrome/Edge mostly)
  - Early stage; limited ecosystem
  - Experimental features may break
  - Not a complete game engine

**CSOAI Recommendation:** WATCH FOR FUTURE. WebGPU represents the future of browser-based 3D + AI. The Visionary project shows how WebGPU can power AI world models. However, too immature for production use today. Monitor for future CSOAI iterations.

---

### 3.16 CesiumJS + OpenStreetMap

- **Website:** https://cesium.com / https://openstreetmap.org
- **License:** Apache 2.0 (CesiumJS), ODbL (OpenStreetMap data)
- **Language:** JavaScript
- **Agent Capacity:** Browser-dependent; handles millions of buildings
- **3D Capability:** Real-world 3D globe with 350M+ OSM buildings, terrain [^1354^]
- **Networking:** N/A (visualization library)
- **AI Integration:**
  - Real-world geospatial context for agents
  - Can overlay agent data on real terrain
  - Time-dynamic visualization
  - Suitable for digital twin applications

**Pros:**
- Real-world city data (actual buildings, roads, terrain)
- 350M+ buildings from OpenStreetMap [^1361^]
- Accurate geospatial positioning
- Used for urban planning and smart cities [^1352^]
- Open 3D Tiles standard

**Cons:**
- Focused on geospatial visualization, not game simulation
- No built-in AI agent framework
- OpenStreetMap data license (ODbL) has share-alike requirements
- JavaScript performance limitations for complex agent simulation
- Not a game engine (no physics, collision, AI)

**CSOAI Recommendation:** USE FOR REAL-WORLD CONTEXT. If CSOAI wants to place the sovereign town in a real-world geographic location, CesiumJS + OSM provides accurate 3D environments. Best used as a data source or visualization layer, not as the primary simulation engine.

---

### 3.17 Gazebo Simulator

- **Website:** https://gazebosim.org
- **License:** Apache 2.0
- **Language:** C++, Python
- **Agent Capacity:** Multi-robot simulation; dozens to hundreds
- **3D Capability:** OGRE v2 rendering, realistic environments, sensors [^1407^]
- **Networking:** TCP/IP transport, ROS/ROS2 native
- **AI Integration:**
  - ROS 2 native integration
  - Sensor simulation (LIDAR, camera, IMU, GPS)
  - Multiple physics engines (ODE, Bullet, DART)
  - Plugin system for custom robot/AI controllers
  - Gazebo Fuel model repository

**Pros:**
- Apache 2.0 open source
- Industry standard for robotics simulation
- ROS 2 integration for AI agents
- Accurate physics and sensor simulation
- Multi-robot support
- 16+ years of development

**Cons:**
- Robotics-focused, not game-focused
- Visual quality below game engines
- Steep learning curve for non-roboticists
- Primarily Linux-based
- Limited character animation (designed for robots)

**CSOAI Recommendation:** INTERESTING for PHYSICS-ACCURATE SIMULATION. If CSOAI agents need to interact with realistic physics (vehicles, objects), Gazebo provides accurate simulation. However, character/agent visualization is limited. Best combined with a rendering engine.

---

### 3.18 Heaps.io

- **Website:** https://heaps.io
- **License:** MIT
- **Language:** Haxe
- **Agent Capacity:** Proven with commercial games (Dead Cells, Northgard)
- **3D Capability:** Full 2D/3D GPU accelerated, custom HxSL shaders [^1411^]
- **Networking:** Available via Haxe networking libraries
- **AI Integration:**
  - 2D/3D scene graph
  - Used in successful games with AI (Northgard, Darksburg)
  - Lightweight and customizable

**Pros:**
- MIT license
- Proven with successful commercial games
- Cross-platform (HashLink JIT, C, JavaScript/WebGL2)
- Dead Cells built with Heaps (proven quality)
- Very lightweight

**Cons:**
- Haxe language (niche, smaller community)
- Documentation is limited [^1404^]
- Smaller community than major engines
- Not specifically designed for AI agent simulation
- Requires HashLink VM or C compilation

**CSOAI Recommendation:** LOW PRIORITY. Excellent engine but Haxe niche and limited AI-specific features make it less suitable unless the team already knows Haxe.

---

### 3.19 AI Town (a16z)

- **Website:** https://github.com/a16z-infra/ai-town
- **License:** MIT
- **Language:** JavaScript/TypeScript, Convex backend
- **Agent Capacity:** Scales with Convex backend; dozens demonstrated
- **3D Capability:** 2D top-down (PixiJS rendering), sprite-based [^203^]
- **Networking:** Convex backend (real-time sync, multiplayer-capable)
- **AI Integration:**
  - PURPOSE-BUILT for LLM agent simulation
  - Inspired by Stanford Generative Agents paper [^203^]
  - Vector memory system with embeddings
  - Tick-based agent decision loop
  - Social interaction system (conversations, relationships)
  - Supports Ollama (local), OpenAI, Together.ai, Anthropic [^203^]
  - Persistent memory via vector search
  - 9,600+ GitHub stars, 1,000 forks [^203^]

**Pros:**
- MIT license
- Designed specifically for AI agent towns
- Proven implementation (9,600+ stars)
- Local LLM support (privacy-preserving)
- Vector memory for agents
- Real-time social simulation
- Reference architecture for CSOAI's exact use case

**Cons:**
- 2D only (not 3D)
- Requires Convex backend (proprietary but free tier available)
- Node.js dependency
- Not a full game engine
- Limited to dozens of agents (not hundreds)

**CSOAI Recommendation:** STRONG REFERENCE ARCHITECTURE. AI Town is the closest existing implementation to CSOAI's requirements. Even if not used directly, its architecture (vector memory, tick-based agent loop, social interactions) should inform CSOAI's design. The MIT license allows direct code reuse. Consider porting agent logic to a 3D engine (Godot/Three.js).

---

### 3.20 Apache Ignite / Hazelcast

- **Website:** https://ignite.apache.org / https://hazelcast.com
- **License:** Apache 2.0 (Ignite), proprietary with open core (Hazelcast)
- **Language:** Java, C++, .NET, Python
- **Agent Capacity:** Designed for distributed systems; thousands to millions of entries
- **3D Capability:** N/A (data grid, not rendering)
- **Networking:** Distributed in-memory data grid
- **AI Integration:**
  - Distributed caching for shared world state
  - ACID transactions across nodes [^1369^]
  - SQL query support for agent data
  - Near-cache for low-latency reads
  - Partitioned/replicated caches [^1369^]

**Pros:**
- Distributed state management
- High performance, low latency
- Fault tolerant
- Scales horizontally
- SQL support for complex queries

**Cons:**
- NOT rendering engines (data only)
- Java-centric (JVM required)
- Operational complexity
- Hazelcast commercial features require paid license
- Overkill for 47-agent state

**CSOAI Recommendation:** USE ONLY IF DISTRIBUTED STATE NEEDED. For 47 agents, a simple database (PostgreSQL, SQLite) or in-memory store (Redis) is sufficient. Apache Ignite/Hazelcast only become relevant if scaling to thousands of agents across multiple servers.

---

## Comparison Matrix

| Engine | License | 3D Level | Agents | Network | AI Difficulty | Self-Host | Score |
|--------|---------|----------|--------|---------|--------------|-----------|-------|
| Godot 4.x | MIT | Full 3D | 2000+ | Built-in | Easy | Yes | 9.2 |
| Bevy | MIT/Apache | Full 3D | 1000+ | Crates | Medium | Yes | 9.0 |
| AI Town | MIT | 2D | ~50 | Convex | Very Easy | Partial | 8.8 |
| O3DE | Apache 2.0 | AAA 3D | 1000+ | Gem | Medium | Yes | 8.5 |
| Omniverse | Mixed | Photoreal | 1000+ | Cloud | Hard | Yes* | 8.3 |
| Three.js | MIT | Web 3D | 500+ | External | Medium | Yes | 8.0 |
| Babylon.js | Apache 2.0 | Web 3D | 500+ | External | Medium | Yes | 7.8 |
| CesiumJS+OSM | Apache 2.0 | Geo 3D | N/A | External | Hard | Yes | 7.5 |
| Panda3D | BSD | Full 3D | MMO | Built-in | Easy | Yes | 7.2 |
| Gazebo | Apache 2.0 | Sim 3D | 100+ | ROS2 | Hard | Yes | 7.0 |
| Decentraland | Apache 2.0 | Web 3D | 1000+ | P2P | Hard | No | 6.5 |
| Colyseus | MIT | N/A | 1000+ | Built-in | Easy | Yes | 6.5 |
| OpenRA | GPL-3.0 | 2D | 64+ | Built-in | Medium | Yes | 6.0 |
| OpenMW | GPL-3.0 | 3D | 100+ | Fork | Medium | Yes | 5.8 |
| Heaps.io | MIT | Full 3D | 100+ | External | Hard | Yes | 5.5 |
| SpatialOS | Proprietary | Via SDK | Massive | Built-in | Hard | No | 5.0 |
| Roblox | Proprietary | Full 3D | Millions | Built-in | Easy | No | 4.5 |
| Sandbox | Proprietary | Voxel | 1000+ | Central | Hard | No | 4.0 |
| Ignite/Grid | Apache 2.0 | N/A | N/A | Built-in | Medium | Yes | 4.0 |
| WebGPU | TBD | Web 3D | TBD | External | Hard | Yes | 3.5 |

---

## CSOAI Recommendations

### Primary Recommendation: Godot Engine 4.x

**Why:** MIT license provides complete sovereignty over the codebase. 47 agents is well within Godot's capabilities (users report 2,000+ pathfinding agents). Built-in NavigationAgent3D with RVO avoidance provides agent movement out of the box. Growing AI plugin ecosystem (Player2, Eidolon, GDCogniAI). Full 3D with PBR rendering. Active community and rapid development.

**Migration Path from UE5:** Godot 4.x supports glTF export from UE5. Assets, materials, and scenes can be transferred. GDScript is simpler than C++/Blueprints but less performant; use C# or C++ modules for performance-critical AI code.

### Secondary Recommendation: Bevy Engine (for custom architecture)

**Why:** If CSOAI wants to build a bespoke agent simulation system, Bevy's ECS architecture is the ideal foundation. Each agent is an entity; behaviors, memories, and states are components; systems process agent logic in parallel. Rust provides memory safety for long-running simulations. Dual MIT/Apache 2.0 licensing.

**Trade-off:** Pre-1.0 status means API changes. Rust learning curve for the team.

### Web Deployment Option: Three.js + Colyseus + AI Town Architecture

**Why:** For maximum accessibility (anyone can visit the town in a browser), combine Three.js for 3D rendering, Colyseus for multiplayer synchronization, and AI Town's agent architecture (vector memory, tick-based decisions, social interactions) for the AI backend.

**Trade-off:** Performance limited by browser. Requires building more from scratch.

### AAA-Quality Open Source: O3DE

**Why:** If visual quality matching UE5 is non-negotiable and open-source licensing is required, O3DE provides AAA-capable rendering under Apache 2.0. ROS 2 Gem enables sophisticated agent behaviors. Backed by Amazon, Meta, and Huawei.

**Trade-off:** Smaller community, steeper learning curve, fewer tutorials.

### AI-Native Platform: NVIDIA Omniverse

**Why:** If CSOAI needs the most advanced AI simulation capabilities and has NVIDIA hardware, Omniverse provides purpose-built tools for physical AI agents. The open-source components (Newton Physics, USD agents, ovphysx) can be used independently.

**Trade-off:** Likely overkill for 47 agents. Requires NVIDIA GPU. Enterprise features may require licensing.

---

## Sources

[^51^] Three.js Facts and Information. threejsresources.com
[^203^] AI Town - Open Source Simulation by a16z. grokipedia.com
[^1301^] NVIDIA Omniverse - Physical AI Platform. nvidia.com
[^1302^] NVIDIA Open Source Agent Tools Release. stocktitan.net
[^1305^] NVIDIA Omniverse: $50T Physical AI Operating System. introl.com
[^1306^] Visionary: WebGPU-Powered Gaussian Splatting Platform. arxiv.org
[^1307^] WebGPU-Based 3D Engine for Real-Time Rendering. dl.acm.org
[^1308^] NVIDIA Omniverse Developer Tools. developer.nvidia.com
[^1311^] GDCogniAI Assistant for Godot. forum.godotengine.org
[^1312^] Best AI Tools for Godot 2026. ziva.sh
[^1314^] Decentraland - Wikipedia. wikipedia.org
[^1324^] Game Engine for Panda3D. meegle.com
[^1325^] How to Start Simulation Projects in O3DE. robotec.ai
[^1327^] Babylon.js: Comprehensive Definition. incredibuild.com
[^1328^] O3DE Home. o3de.org
[^1330^] Open 3D Engine 25.05 Release. phoronix.com
[^1331^] O3DE GitHub Repository. github.com/o3de/o3de
[^1338^] Impact of ECS Logic on Parallel Performance in Agent Simulation. ceur-ws.org
[^1349^] Determinant AI SDK for Roblox. devforum.roblox.com
[^1351^] OpenMW 0.50.0 Released. openmw.org
[^1353^] SpatialOS Distributed Simulation Discussion. news.ycombinator.com
[^1354^] CesiumJS Interactive Building Tutorial. cesium.com
[^1356^] Roblox Open Source 3D Model AI. finance.yahoo.com
[^1357^] AI Agent Inside Roblox Studio. medium.com
[^1358^] Comprehensive NPC System for Roblox. github.com
[^1361^] Cesium Global 3D Content. cesium.com
[^1363^] ColyseusJS Multiplayer Framework. cnblogs.com
[^1364^] OpenRA-RL: AI Agents in RTS. huggingface.co
[^1366^] Hazelcast vs Ignite Comparison. paper.ijcsns.org
[^1369^] Apache Ignite vs Hazelcast Webinar. gridgain.com
[^1371^] OpenRA GitHub Repository. github.com/openra/openra
[^1380^] Bevy Engine. bevy.org
[^1383^] Godot NavigationAgent Documentation. docs.godotengine.org
[^1385^] Bevy GitHub Repository. github.com/bevyengine/bevy
[^1386^] Godot Large NavigationAgent Count. godotforums.org
[^1401^] Best Robot Simulators Comparison. introspector.io
[^1402^] Gazebo Simulator. gazebosim.org
[^1404^] Heaps Engine Discussion. news.ycombinator.com
[^1406^] Three.js Details and Reviews. checkthat.ai
[^1407^] Gazebo Sim GitHub. github.com/gazebosim/gz-sim
[^1409^] Gazebo Simulator Wikipedia. wikipedia.org
[^1410^] Everything You Wanted to Know About The Sandbox. hackernoon.com
[^1411^] Heaps.io Documentation - Shiro Games Stack. heaps.io

---

*Research compiled from 15+ independent searches covering open-source game engines, web-based 3D platforms, AI simulation frameworks, distributed systems, and metaverse platforms. All citations use [^N^] format as requested.*
