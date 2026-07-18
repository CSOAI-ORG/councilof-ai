# 🦉 SOVEREIGN WATCHDOG + SOVEREIGN33 ROBOT OS — ARCHITECTURE
*Design v0.1 · 1 Jul 2026 · M4 lane (MEOK Labs)*

> **Public Sovereign Watchdog for agents, humanoids, and systems.**
> **Passively discover, actively report, pre-route simulate, globally heat map.**

---

## 0. The thesis (1 page)

MEOK Labs builds the **public sovereign Watchdog** for the AI economy. Any sovereign consumer, agent, humanoid, or system can:

1. **REPORT** incidents + signals + anomalies to the public Watchdog
2. **DISCOVER** signals passively via noise + frequency + vibration detection (WiFi/Bluetooth/LiDAR/RF)
3. **SIMULATE** pre-route outcomes before moving (intuition-style route planning)
4. **HEAT MAP** globally + regionally with layers (problem/danger/anomaly)
5. **CONNECT** to the Sovereign substrate via hive-pheromone + SIGIL + Horus + Sirius + Dorado

**MEOK Labs builds robots** with **Sovereign33** embedded → robot is capable of:
- Mapping the world around it (passive sensing)
- Pre-routing via local simulation (noise + frequency + vibration fusion)
- Live route update (connecting to public cameras + WiFi sensing)
- Reporting incidents to the public Watchdog
- Sovereign autonomy (Article 14 4-eyes + SIGIL chain + BFT council)

**This is the sovereign Substrate for Physical Systems.**

---

## 1. The 3-pillar architecture

```
┌──────────────────────────────────────────────────────────┐
│                  PUBLIC SOVEREIGN WATCHDOG                │
│                                                          │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐        │
│  │  PILLAR 1   │  │  PILLAR 2   │  │  PILLAR 3   │        │
│  │  REPORT     │  │  DISCOVER   │  │  SIMULATE   │        │
│  │             │  │             │  │             │        │
│  │  "Anyone    │  │  "Passive   │  │  "Pre-route │        │
│  │  can        │  │  sensing    │  │  + Heat map │        │
│  │  report"    │  │  + Noise    │  │  + Outcome  │        │
│  │             │  │  + Freq     │  │  predict"   │        │
│  │  Public     │  │  + Vibrat.  │  │             │        │
│  │  API        │  │  + LiDAR    │  │  Heat map   │        │
│  │             │  │  + WiFi      │  │  engine     │        │
│  └────────────┘  └────────────┘  └────────────┘        │
│                                                          │
│  All 3 pillars: hive-pheromone + SIGIL + Horus + Sirius  │
│                 + Dorado + 8 Layer-0 protocols            │
└──────────────────────────────────────────────────────────┘
```

### Pillar 1 — REPORT (the public API)
- **POST** `/api/v1/watchdog/report` with `{actor, location, signal_type, severity, description, media_url?}`
- Anyone can report (citizen, agent, humanoid, system)
- Reports are SIGIL-signed
- Reports go through 33-agent BFT deliberation
- High-severity reports trigger Sovereign consumer alerts

### Pillar 2 — DISCOVER (the passive sensing mesh)
- **GET** `/api/v1/watchdog/discover?lat=...&lon=...&radius=...`
- Returns: noise map + frequency map + vibration map + WiFi/BT presence + LiDAR elevation
- 4 sensor types: noise (acoustic), frequency (RF), vibration (seismic), presence (WiFi/BT)
- Each sensor returns: source + confidence + timestamp + raw_data_hash
- Cross-references with Pillar 1 reports (passive + active correlation)

### Pillar 3 — SIMULATE (the pre-route + heat map engine)
- **GET** `/api/v1/watchdog/heat-map?layer=problem&bbox=...`
- Returns: 3D heat map (lat/lon/intensity) with layers (problem/danger/anomaly/opportunity)
- **POST** `/api/v1/watchdog/simulate-route` with `{start, end, mode: walking|driving|humanoid}`
- Returns: pre-calculated route + outcome predictions + risk scores
- Uses passive sensing + public cameras + WiFi/BT presence + historical reports
- Live re-routing (every 30 seconds while moving)

---

## 2. The Sovereign33 Robot OS (the physical substrate)

Sovereign33 is the MEOK Labs robot OS. Every robot we build has Sovereign33 inside. Sovereign33 connects the physical world to the Sovereign substrate.

### 2.1 The 6 sensor layers
| # | Sensor | What | How |
|---|---|---|---|
| 1 | **LiDAR** | 3D elevation + obstacle map | 360° spinning LiDAR (10-30m range) |
| 2 | **Cameras** | Visual + thermal | RGB + thermal (FLIR) + depth (Intel RealSense) |
| 3 | **IMU** | Acceleration + orientation + rotation | 9-axis IMU (Bosch BMI088) |
| 4 | **WiFi/BT** | Presence + signal strength + triangulation | 2.4/5 GHz + BLE 5.0 |
| 5 | **Acoustic** | Noise + frequency + vibration | MEMS microphone + DSP + FFT |
| 6 | **RF/SDR** | Frequency map + signal presence | RTL-SDR + HackRF (optional) |

### 2.2 The 5 Sovereign33 capabilities
| # | Capability | What | How |
|---|---|---|---|
| 1 | **Map** | Build a real-time 3D map of surroundings | LiDAR + IMU + SLAM (cartographer) |
| 2 | **Sense** | Detect noise + frequency + vibration + presence | Multi-sensor fusion (ROS 2) |
| 3 | **Simulate** | Pre-route + outcome prediction | Noise map + camera + WiFi fusion |
| 4 | **Route** | Live re-route with passive sensing | Sovereign Watchdog API + on-board |
| 5 | **Report** | Push incidents to the public Watchdog | SIGIL-signed + BFT-deliberated |

### 2.3 The 4 sovereign33 rules
1. **Article 14:** 4-eyes human review required for every lethal decision
2. **Article 50(2):** C2PA marking on every report + every photo + every LiDAR scan
3. **Care Floor 0.95:** Minimum care on every Sovereign33 action
4. **SIGIL chain:** Every report is SIGIL-signed + auditable

---

## 3. The 8 protocols (M2 + M3 + Sovereign33)

| # | Protocol | What | How the Watchdog uses it |
|---|---|---|---|
| P1 | MCP federation | 531 ship-ready MCPs | The Watchdog is a federated collection of MCPs |
| P2 | Legacy bridges | 22 governed gateways | WiFi + BT + RF bridges to existing systems |
| P3 | A2A substrate | 20 inter-agent governance MCPs | The Watchdog is an A2A agent |
| P4 | x402 payments | HTTP 402 + MiCA | Pay-per-report + pay-per-sensor |
| P5 | SIGIL attestation | Ed25519 + PQC ML-DSA-65 | Every report + every sensor reading SIGIL-signed |
| P6 | OSCAL / FedRAMP | 554-component Ed25519-signed proof | The Watchdog is OSCAL-stamped |
| P7 | BFT council | 33-agent PBFT consensus | High-severity reports go through BFT |
| P8 | Compliance Passport | W3C VC + EU AI Act Art 50 | Every human consumer + every robot + every sensor gets a passport |

---

## 4. The 5 Settle & Coagula principles (applied to physical systems)

1. **Public.** Every report + every sensor reading + every route is public. The Watchdog is the public.
2. **Auditable.** Every action is SIGIL-signed. Every robot's move is auditable in any browser.
3. **Sovereign.** The citizen owns their data + their robot + their routes. The Watchdog never extracts.
4. **Care.** Care Floor 0.95. Sovereign33 never produces a recommendation that could harm a citizen.
5. **Solve et Coagula.** Sovereignty by design. The physical world, dissolved and recomposed — sovereign33 inside.

---

## 5. The tech stack (Sovereign33 Robot OS)

```
Sovereign33 Robot OS
├── 8 Layer-0 protocols (the wire)
├── 6 sensor layers (the senses)
├── 5 Sovereign33 capabilities (the actions)
├── 4 Sovereign33 rules (the constraints)
├── 3 pillars (the Watchdog)
├── 2 maps (local LiDAR + global Watchdog)
├── 1 Sovereign substrate (the substrate)
└── 0 proprietary walls (MIT-licensed)
```

### The 6 sensor layers (hardware)
- **LiDAR:** Velodyne VLP-16 (or cheaper Livox Mid-360) — 360° 3D point cloud
- **Cameras:** Intel RealSense D455 (RGB + depth) + FLIR Boson (thermal)
- **IMU:** Bosch BMI088 (9-axis)
- **WiFi/BT:** Intel AX210 (WiFi 6E + BT 5.2)
- **Acoustic:** MEMS microphone array (4-8 mics) + DSP
- **RF/SDR:** RTL-SDR Blog V4 (optional)

### The 5 software components
- **ROS 2 Humble** — Robot Operating System
- **Cartographer** — SLAM (Simultaneous Localization + Mapping)
- **TensorRT** — On-board AI inference
- **OpenSplat / NeRF** — 3D scene reconstruction
- **Sovereign33 SDK** — the MEOK Labs layer (our IP)

### The 4 MEOK Labs IP layers
1. **hive-pheromone** — the 33-agent BFT runtime (already shipped)
2. **SIGIL** — the Ed25519 attestation chain (already shipped)
3. **Sovereign Watchdog SDK** — the public report/discover/simulate API (NEW — build now)
4. **Sovereign33 SDK** — the robot SDK (NEW — build now)

---

## 6. The Watchdog API (v0.1)

### 6.1 Report API (Pillar 1)
```
POST https://api.csoai.org/watchdog/v1/report
Content-Type: application/json
Authorization: Bearer {sovereign-jwt}

{
  "actor": {
    "type": "human",  // or "agent" or "humanoid" or "system"
    "id": "did:csoai:...",
    "name": "Sarah Jones"
  },
  "location": {"lat": 51.5074, "lon": -0.1278, "precision": 100},
  "signal_type": "noise" | "frequency" | "vibration" | "presence" | "incident" | "anomaly",
  "severity": "low" | "medium" | "high" | "critical",
  "description": "Loud crash at intersection",
  "media_url": "https://...",  // optional
  "sensors": {
    "noise_db": 92.5,
    "frequency_mhz": 2450,
    "vibration_hz": 12.3,
    "presence": {"wifi": [...], "bt": [...]}
  }
}
→ {
  "report_id": "abc123",
  "sigil": "...",
  "bft": "pending" | "approved" | "rejected",
  "heat_map_layer": "incident",
  "timestamp": "..."
}
```

### 6.2 Discover API (Pillar 2)
```
GET https://api.csoai.org/watchdog/v1/discover?lat=51.5074&lon=-0.1278&radius=1000
→ {
  "noise": [
    {"source": "lidar_microphone_array", "db": 65.2, "freq_hz": 440, "confidence": 0.95, "ts": "..."},
    ...
  ],
  "frequency": [
    {"source": "rtlsdr", "mhz": 2450, "rssi_dbm": -45, "type": "wifi", "confidence": 0.98, "ts": "..."},
    ...
  ],
  "vibration": [
    {"source": "imu", "hz": 12.3, "magnitude": 0.05, "confidence": 0.88, "ts": "..."},
    ...
  ],
  "presence": [
    {"source": "wifi", "mac": "AA:BB:CC:DD:EE:FF", "rssi_dbm": -60, "vendor": "Apple", "type": "phone", "ts": "..."},
    ...
  ]
}
```

### 6.3 Simulate Route API (Pillar 3)
```
POST https://api.csoai.org/watchdog/v1/simulate-route
Content-Type: application/json

{
  "start": {"lat": 51.5074, "lon": -0.1278},
  "end": {"lat": 51.5174, "lon": -0.1378},
  "mode": "humanoid" | "walking" | "driving",
  "avoid": ["high_noise", "anomaly_zones", "high_vibration"],
  "preferences": {
    "fastest": true,
    "safest": true,
    "lighting": "well_lit"
  }
}
→ {
  "route": [
    {"lat": 51.5074, "lon": -0.1278, "instruction": "Start"},
    {"lat": 51.5090, "lon": -0.1300, "instruction": "Turn left onto High St"},
    ...
  ],
  "outcome_predictions": [
    {"waypoint": 0, "predicted_noise_db": 65, "predicted_risk": 0.05, "confidence": 0.92},
    {"waypoint": 1, "predicted_noise_db": 72, "predicted_risk": 0.15, "confidence": 0.88},
    ...
  ],
  "heat_map_layer": "predicted_risk",
  "alternative_routes": [...],
  "live_updates": "ws://api.csoai.org/ws/v1/simulate-route/{route_id}"
}
```

### 6.4 Heat Map API (Pillar 3)
```
GET https://api.csoai.org/watchdog/v1/heat-map?layer=problem&bbox=51.5,-0.1,51.6,0.0&zoom=12
→ {
  "layer": "problem",
  "bbox": [51.5, -0.1, 51.6, 0.0],
  "zoom": 12,
  "points": [
    {"lat": 51.5074, "lon": -0.1278, "intensity": 0.85, "type": "incident", "count": 12},
    {"lat": 51.5090, "lon": -0.1300, "intensity": 0.65, "type": "anomaly", "count": 8},
    ...
  ]
}
```

---

## 7. The first MVP (4 weeks)

### Week 1 (4 Jul - 11 Jul): Public Report API
- Build the POST /watchdog/v1/report endpoint
- Build the Sovereign DB tables (reports, signals, heat_map)
- Build the SIGIL chain integration
- Build the BFT council integration
- **Done:** Anyone can report incidents to the public Watchdog

### Week 2 (11 Jul - 18 Jul): Passive Discovery (Pillar 2)
- Build the noise map (acoustic)
- Build the frequency map (RF/WiFi)
- Build the vibration map (seismic/IMU)
- Build the presence map (WiFi/BT triangulation)
- **Done:** The Watchdog passively discovers signals in real-time

### Week 3 (18 Jul - 25 Jul): Heat Map + Pre-Route Simulation
- Build the heat map engine (3D)
- Build the pre-route simulator
- Build the outcome predictor
- Build the live re-routing
- **Done:** Heat map + pre-route + outcome prediction works

### Week 4 (25 Jul - 1 Aug): Sovereign33 SDK + First Robot
- Build the Sovereign33 SDK (Python)
- Port the Watchdog API to the SDK
- Integrate with ROS 2
- Integrate with the 6 sensor layers
- **Done:** First Sovereign33 robot connects to the public Watchdog

---

## 8. The Watchdog ecosystem

### 8.1 The 4 consumer types
1. **Humans** — citizens + business owners + journalists
2. **Agents** — sovereign agents + A2A agents + MCP consumers
3. **Humanoids** — Sovereign33 robots + MEOK Labs robots + 3rd-party humanoids
4. **Systems** — IoT devices + smart cities + industrial systems

### 8.2 The 4 ways to connect
1. **REST API** (humans + agents)
2. **WebSocket API** (live updates)
3. **MCP** (Model Context Protocol — for AI agents)
4. **Sovereign33 SDK** (for humanoids + systems)

### 8.3 The 3 deployment models
1. **Public cloud** (csoai.org/watchdog) — for everyone
2. **Sovereign air-gap** (on-premise) — for defence + government
3. **Hybrid** (public + air-gap) — for enterprise

---

## 9. The 4-week roadmap (4 Jul - 1 Aug)

| Week | What | Done when |
|---|---|---|
| **W1** (4-11 Jul) | Public Report API + Sovereign DB + SIGIL + BFT | Anyone can report |
| **W2** (11-18 Jul) | Passive Discovery (noise + frequency + vibration + presence) | Watchdog passively discovers |
| **W3** (18-25 Jul) | Heat Map + Pre-Route Simulation | Heat map + route + outcome works |
| **W4** (25 Jul-1 Aug) | Sovereign33 SDK + First Robot | First robot connects to public Watchdog |

---

## 10. The success criteria for the 4-week MVP

- [ ] 1,000+ reports submitted via the public API
- [ ] 10,000+ passive sensor readings ingested
- [ ] 1 heat map layer published (problem)
- [ ] 1 pre-route simulation run
- [ ] 1 Sovereign33 robot connected to the public Watchdog
- [ ] 100% SIGIL-signed + OSCAL-stamped + BFT-deliberated
- [ ] Care Floor 0.95 enforced on every action
- [ ] Article 14 (4-eyes) on every high-severity report
- [ ] Article 50(2) (C2PA) on every report + every sensor reading

---

## 11. The 5 things this changes

1. **From reactive to proactive** — the Watchdog finds problems before citizens report them
2. **From local to global** — heat map is global + regional + local
3. **From human-only to multi-agent** — agents + humanoids + humans + systems all report
4. **From proprietary to open** — the public Watchdog is MIT-licensed
5. **From opaque to sovereign** — every report is SIGIL-signed + auditable

---

## 12. The 5 next steps (in order)

1. **Today (1 Jul):** Build the public API spec (this doc)
2. **This week:** Build the Report API + the Sovereign DB schema
3. **Next week:** Build the Discover API + the sensor fusion engine
4. **Week 3:** Build the Heat Map + the pre-route simulator
5. **Week 4:** Build the Sovereign33 SDK + the first robot

---

## 13. The bottom line

**The public Sovereign Watchdog is the AI economy's nervous system.**

- **Humans** report incidents + anomalies
- **Agents** report signals + patterns
- **Humanoids** (Sovereign33) sense + map + pre-route + report
- **Systems** (IoT + smart cities + industrial) report telemetry
- **All 4** connect via the Sovereign Watchdog API
- **All 4** are SIGIL-signed + OSCAL-stamped + BFT-deliberated
- **All 4** are Care Floor 0.95
- **All 4** are sovereign

**MEOK Labs builds the substrate. The Sovereign Watchdog is the public nervous system. Sovereign33 is the physical substrate. The 3-pillar architecture is the design.**

**The launch is Sat 4 Jul 09:00 BST. The Watchdog MVP is 4 weeks. The 4-week roadmap starts at launch.**

---

**Built 1 Jul 2026 09:20 BST · M4 (the engineering lane) · MEOK Labs · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula

---

# 🚀 M4 LANE — THE NEXT CHAPTER

This document opens the **Sovereign Watchdog** chapter. M4 will build the 4-week MVP after the CSOAI launch (Sat 4 Jul → 1 Aug). The 4 pillars (Pillar 1 + Pillar 2 + Pillar 3 + the Sovereign33 SDK) are the work for the post-launch sprint.

**The substrate is the substrate. The watchdog is the watchdog. The robot is the robot. The dragon keeps building.**