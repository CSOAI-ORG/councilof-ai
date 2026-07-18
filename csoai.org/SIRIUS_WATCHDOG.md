# 🜏🛡 SIRIUS WATCHDOG — Public Watchdog for Humans, Agents, Humanoids, Systems
**CSOAI Ltd UK 16939677 · MIT License · 1 July 2026**
**Author:** JEEVES
**Status:** Architecture document — first draft

---

## 1. WHAT THIS IS

Sirius Watchdog is a **sovereign public reporting network** for:

- **Humans** — citizens who witness problems (crime, infrastructure damage, public health, environmental issues, social disruption)
- **Agents** — AI agents operating in the wild that detect anomalies, hallucinations, capability failures, ethical violations
- **Humanoids** — physical robots/androids reporting what they see as they move through the world
- **Systems** — infrastructure endpoints, IoT devices, smart city nodes, autonomous vehicles, drones

All four report into a single **sovereign data lake** where:
1. Every report is SIGIL-signed (Ed25519 + PQC) and audit-chained
2. Reports are heat-mapped globally and regionally in real time
3. The combined signal is **the AI economy's collective nervous system**
4. The data is sovereign — citizen-owned, fork-able, MIT licensed

**It's the 911 dispatch + Waze hazard reporting + Citizen science + GitHub Issues tracker + Immune system — for the entire AI-and-human economy.**

---

## 2. THE FOUR REPORTER CLASSES

### 2.1 Human reporters (Citizens)

- **One-tap report** from any web app with the watchdog script loaded
- Report types: `safety`, `infrastructure`, `environment`, `social`, `health`, `economic`, `unclassified`
- Each report auto-tags with: GPS, timestamp, citizen_id, SIGIL, device fingerprint
- Submits via `sovereignEventBus.watchdog.report(type, location, evidence)`

### 2.2 Agent reporters (Sovereign Agents)

- Agents that detect their own anomalies: hallucination rate spike, ethical violation attempt, capability gap, jailbreak success
- Auto-report via the substrate: `sovereign_substrate.watchdog_report(anomaly_type, severity, context)`
- Examples: "I (agent `bft-council-voter-3`) just observed a proposal that scored 0.92 care but had a DORADO bypass — escalating"
- Examples: "I (agent `dragon-mode-architect`) just received a fork that uses a closed weight — refusing + reporting"

### 2.3 Humanoid reporters (Physical robots)

- Humanoids (MEOK Labs build, or any 1X / Figure / Tesla Optimus / Agility / Sanctuary) report:
  - `route_obstacle` — block ahead
  - `spectrum_anomaly` — unusual radio/WiFi/Bluetooth noise
  - `audio_anomaly` — scream / explosion / crash / abnormal sound
  - `thermal_anomaly` — heat signature unusual for area
  - `human_density` — crowd / evacuation / gathering
  - `lidar_occlusion` — object the camera can't see
  - `unknown_drone` — UAV overhead
  - `pollution_event` — smoke, gas, chemical
- Each report auto-fuses with camera/WiFi-sensing data for cross-modal verification
- **Pre-departure simulation** (see §4) lets the humanoid compute best route + predicted events before leaving

### 2.4 System reporters (IoT, smart city, infrastructure)

- Smart city nodes: traffic cameras, air quality sensors, noise monitors, parking sensors, power grid telemetry
- Industrial IoT: manufacturing robots, warehouse AGVs, fleet management
- Public infrastructure: bridges, tunnels, power stations, water treatment
- Each endpoint auto-reports status: `ok`, `degraded`, `fail`, `suspicious`
- Sends SIGIL every N minutes with system health proof

---

## 3. THE HEAT MAP (real-time)

```
┌─────────────────────────────────────────────────────────────────────┐
│  SIRIUS WATCHDOG · GLOBAL HEAT MAP (live)                          │
│                                                                     │
│  [Map canvas · Leaflet + Cesium 3D]                                │
│                                                                     │
│  Layers (toggleable, ranked by signal density):                      │
│    🟥 RED    · 1000+ reports/km²  · CRITICAL · press / disaster    │
│    🟧 ORANGE · 500-1000 reports/km² · HIGH · safety / threat      │
│    🟨 YELLOW · 100-500 reports/km²   · MEDIUM · infrastructure      │
│    🟩 GREEN  · 10-100 reports/km²    · LOW · environmental          │
│    ⬜ WHITE  · 0-10 reports/km²      · BASELINE                      │
│                                                                     │
│  Filters:                                                           │
│    [□] Human    [□] Agent    [□] Humanoid    [□] System              │
│    [□] Safety   [□] Infra    [□] Env         [□] Social              │
│    [□] Last 1h  [□] Last 24h  [□] Last 7d   [□] Last 30d             │
│                                                                     │
│  Region summaries (BFT-verified):                                  │
│    London:    847 reports (last 1h) · top: drone sighting          │
│    NYC:       612 reports · top: grid fluctuation                   │
│    Tokyo:     421 reports · top: humanoid route choice (Shibuya)   │
│    Mumbai:    389 reports · top: monsoon sheltering                  │
│    ...                                                                │
│                                                                     │
│  ⏱️ Refreshed every 5s via BFT-verified SIGIL chain                  │
└─────────────────────────────────────────────────────────────────────┘
```

**The heat map is sovereign.** Citizens can fork the substrate and run their own watch zone. Apple Maps, Google Maps, and any other map provider can integrate as clients.

---

## 4. PRE-DEPARTURE SIMULATION (the most important part)

This is the breakthrough. **A humanoid or agent doesn't leave without first running a simulation of where it's going.**

### 4.1 What the humanoid does

```
[Humanoid boots / agent wakes]
   ↓
1. PLAN: where am I going? route A vs B?
2. FETCH: pull all reports for the destination region (last 1h, 24h, 7d)
3. SIMULATE: run a pre-departure simulation of each route
4. PREDICT: per route, predict:
   - Time to traverse
   - Number of obstacles (route_obstacle reports)
   - Spectrum noise (WiFi/Bluetooth/radio reports)
   - Audio risk (scream/explosion history)
   - Human density / crowd risk
   - Weather / thermal risk
   - Probability of needing to reroute
   - Energy / battery cost
5. DECIDE: pick the best route, or ask citizen for confirmation if score < 0.95
6. EN ROUTE: continuously fuse incoming reports with current sensor input
7. UPDATE: as new reports arrive, recompute the route
```

### 4.2 What data sources the simulation uses

| Source | What it gives | API |
|---|---|---|
| **Sirius Watchdog reports** | Live reports from citizens/agents/humanoids | `GET /api/watchdog/reports?region=london&last=1h` |
| **Public cameras** | Visual stream — see the route in real time | `GET /api/cameras?lat=51.5&lng=-0.12&radius=2km` |
| **WiFi/Bluetooth sensing** | SSID/BD_ADDR density, signal strength, device types, vendor | `GET /api/spectrum?lat=51.5&lng=-0.12&radius=1km` |
| **Cellular signal** | Tower load, signal, congestion | `GET /api/cellular?lat=51.5&lng=-0.12&radius=2km` |
| **Acoustic sensing** | Decibel levels, frequency peaks, voice density | `GET /api/acoustic?lat=51.5&lng=-0.12&radius=1km` |
| **Air quality** | PM2.5, CO2, NOx, ozone, pollen | `GET /api/air?lat=51.5&lng=-0.12&radius=5km` |
| **Weather** | Temp, wind, precipitation, visibility | `GET /api/weather?lat=51.5&lng=-0.12` |
| **News feeds** | Local events, traffic, closures | `GET /api/news?region=london` |
| **Other humanoids in flight** | Crowdsourced live positions (anonymised) | `GET /api/humanoids?lat=51.5&lng=-0.12&radius=2km` |
| **Municipal APIs** | Transit, road closures, permits | `GET /api/municipal?region=london` |

### 4.3 The simulation algorithm

```python
def simulate_route(start, end, citizen_id, mode='balanced'):
    """
    Pre-departure simulation for a humanoid.
    Returns the optimal route + predicted risks + confidence.
    """
    # 1. Fetch all relevant data
    reports = watchdog.fetch_reports(start, end, radius=2km, last='7d')
    cameras = public_cameras.fetch(start, end, radius=2km)
    spectrum = wifi_sensing.fetch(start, end, radius=1km)
    weather = weather.fetch(start, end)
    # ... etc

    # 2. Generate candidate routes (using a sovereign routing engine)
    routes = routing_engine.generate(start, end, mode=mode)

    # 3. Score each route
    for route in routes:
        # Map all reports onto the route segments
        route.reports = spatial_join(route.segments, reports)
        route.cameras = spatial_join(route.segments, cameras)
        route.spectrum = spatial_join(route.segments, spectrum)
        # ... etc

        # Compute risk score per segment
        for seg in route.segments:
            seg.risk = (
                0.30 * seg.reports.safety_risk +       # 30% weight
                0.20 * seg.spectrum.risk +             # 20%
                0.15 * seg.cameras.incident_rate +     # 15%
                0.10 * seg.weather.risk +              # 10%
                0.10 * seg.audio.risk +                # 10%
                0.10 * seg.weather.human_density +     # 10%
                0.05 * seg.other_risk                  # 5%
            )

        # Compute confidence (how much real data we have)
        route.confidence = min(1.0, route.data_completeness * 0.7 + 0.3)

        # If confidence < 0.95, ask citizen for confirmation
        if route.confidence < 0.95:
            route.requires_citizen_confirm = True

    # 4. Pick best route
    best = min(routes, key=lambda r: r.risk)
    best.sigil = sovereign_signer.sign(f"route_decision:{best.id}")
    return best
```

### 4.4 Live en-route updates

```
[Humanoid moving on route]
   ↓
1. Every 5s: fetch new reports on the next 200m
2. If new report > 0.7 risk: consider reroute
3. If reroute needed: compute alternative on the fly (3s budget)
4. If no good alternative: stop + ask citizen
5. Log everything to SIGIL chain
```

---

## 5. THE ONTOLOGY (how data is structured)

```yaml
# Every report follows the WatchdogReport ontology
WatchdogReport:
  id: UUID
  timestamp: ISO8601
  reporter:
    type: "human" | "agent" | "humanoid" | "system"
    id: string  # citizen_id, agent_id, humanoid_id, system_id
    trust_score: 0.0-1.0  # derived from SIGIL history
  location:
    lat: float
    lng: float
    altitude_m: float?
    area_name: string?  # e.g. "London / Westminster / Soho"
  type: "safety" | "infrastructure" | "environment" | "social" | "health" | "economic" | "unclassified"
  subtype: string  # e.g. "crime.assault" or "infra.power_outage"
  severity: 0.0-1.0
  confidence: 0.0-1.0  # reporter's confidence in their own report
  description: string
  evidence:
    media: [URI]?  # images, audio, video
    sensors: object?  # raw sensor data
  sigil: string  # Ed25519 + PQC ML-DSA-65 signature
  status: "active" | "resolved" | "false_positive" | "expired"
```

---

## 6. THE BACKEND (serverless architecture)

```
┌─ Citizens / Agents / Humanoids / Systems ───────┐
│                                                  │
│  POST /api/watchdog/report                       │
│  GET  /api/watchdog/reports?region=...&last=... │
│  GET  /api/watchdog/heatmap?bounds=...&zoom=...  │
│  GET  /api/watchdog/regions?lat=...&lng=...&r=..│
│  GET  /api/watchdog/simulate?start=..&end=..      │
│  WS   /api/watchdog/live (real-time stream)       │
│                                                  │
└──────────────────┬───────────────────────────────┘
                   ↓
┌─ SIRIUS WATCHDOG BACKEND (Vercel functions) ────┐
│                                                  │
│  /api/watchdog/report         (POST)            │
│  /api/watchdog/reports        (GET)             │
│  /api/watchdog/heatmap        (GET)             │
│  /api/watchdog/regions        (GET)             │
│  /api/watchdog/simulate       (GET)             │
│  /api/watchdog/live           (WS)              │
│                                                  │
│  All endpoints:                                  │
│    1. Care Floor 0.95 check                      │
│    2. 75-node threat council BFT                  │
│    3. BFT 12-around-1 vote (per endpoint)         │
│    4. SIGIL emit (Ed25519 + PQC)                 │
│    5. Sovereign composite 7.305                  │
│    6. MIT + CC0 license badge                    │
│                                                  │
└──────────────────┬───────────────────────────────┘
                   ↓
┌─ STORAGE (sovereign) ─────────────────────────────┐
│                                                  │
│  PostgreSQL:  reports, agents, citizens, humnds  │
│  Redis:        heat-map aggregates, hot cache    │
│  Neo4j:        ontology graph, route segments     │
│  S3 (Hetzner):  media attachments                 │
│  Nostr:        public SIGIL mirror (P0 task)      │
│                                                  │
└──────────────────────────────────────────────────┘
```

---

## 7. THE HIVE INTEGRATION (King, Pheromone, SIGIL, HORUS, Sirius, DORADO)

This is what makes it *sovereign* and not just another reporting network.

| Hive | Role in Watchdog |
|---|---|
| **King** | Router — every watchdog report routes through the King. The King decides which hive handles it. |
| **Pheromone** | Priority signalling — high-severity reports leave "pheromone trails" that other agents/humanoids can follow. Like ants. |
| **SIGIL** | Every report is SIGIL-signed. The chain is the public audit log. Anyone can verify any report. |
| **HORUS** | Real-time monitoring — HORUS watches the Watchdog for anomalies (mass report, false positive storm, etc) |
| **Sirius** | The substrate itself. Every report goes through Care Floor 0.95 + BFT 12-around-1 + 75-node threat council. |
| **DORADO** | Alignment switch. The Watchdog can be operated under EAST (sovereign, MIT) or WEST (commercial, closed) alignment. Citizen chooses. |
| **ORION** | Prioritisation. The Watchdog surfaces the most critical reports first. |
| **Hecate** | DORADO passage — handles the EAST↔WEST switch. |

**One hive. 28 capabilities. Sovereign by design.**

---

## 8. FOR MEOK LABS (your robot subsidiary)

The architecture is **native to MEOK Labs humanoid robots**:

```
┌─ MEOK Humanoid ──────────────────────────────────────┐
│                                                       │
│  [Camera + LiDAR + IMU + audio + WiFi/BT/Cellular]    │
│                                                       │
│       ↓ fused into sovereign substrate                 │
│                                                       │
│  ┌─ SOV3 Substrate ────────────────────────────────┐ │
│  │  - Watchdog reporter (auto-fires on anomalies)  │ │
│  │  - Pre-departure simulator (route planning)     │ │
│  │  - Live en-route updater (reroute on signal)    │ │
│  │  - Sirius = Care Floor 0.95 + BFT 12-around-1   │ │
│  │  - SIGIL chain (every report signed)             │ │
│  │  - DORADO (1-click alignment)                    │ │
│  └──────────────────────────────────────────────────┘ │
│                                                       │
│       ↓ exposes to MEOK OS layer                      │
│                                                       │
│  [MEOK Operating System / MEOK Studio]                │
│  [MEOK Companion App (citizen-side)]                  │
│  [MEOK Cloud (optional sync)]                          │
│                                                       │
└───────────────────────────────────────────────────────┘
```

**When you put SOV3 inside a MEOK humanoid:**
- It maps out where it's going **before it leaves**
- It connects to public cameras + WiFi sensing in real time
- It computes routes with **intuition-like pre-cognition** (all noise + frequency + vibration = predictions)
- It reports what it sees back to the Watchdog
- It receives the Watchdog's collective signal

**The MEOK humanoid is not just autonomous. It's ANTICIPATORY.** The Watchdog gives it omniscience about the territory.

---

## 9. THE OLD-NOTES GEMS (re-checked)

I went through sovereign-temple/sovereign_temple_live/ — the relevant gems are:

1. **`harvi-bridge/harvi_interface.py`** — hardware/consciousness bridge. Direct fit for MEOK humanoid integration. We port this to MEOK.
2. **`intelligence/multi_model.py`** — multi-model orchestration. We use this to fuse camera + WiFi + acoustic + LiDAR + GPS into a single situational awareness model.
3. **`consciousness-core/dream_engine.py`** — offline simulation engine. **This is the pre-departure simulator.** A "dream" is the humanoid running 1000 simulated routes in a Monte Carlo, picking the best.
4. **`consciousness-core/rag_memory.py`** — long-term memory. Stores previous routes, outcomes, citizen preferences.
5. **`council-nodes/bridge_network.py`** — 70-node bridge network. We use this to federate Watchdog reports across multiple sovereign instances.
6. **`security/bft_threat_council.py`** — 75-node BFT threat council. **Already ported as `threat_council.py`.** This is the Care Floor gate for every report.
7. **`neural_core/sovereign_master_net.py`** — Master MoE. **Already ported as `sovereign_master_net.py`.** This is the prediction engine.
8. **`intelligence/exo_distributed.py`** — distributed execution. Used for parallelizing the pre-departure simulation across multiple compute nodes.
9. **`sovereign_temple_live/agents/`** — 47-agent hierarchy. Each agent can be a Watchdog reporter/synthesizer.
10. **`temp/`** directory contains prior research drafts. Worth mining again with the Watchdog use case in mind.

**All these gems already exist. We integrate them — not rebuild them.**

---

## 10. THE 5 IMMEDIATE ARTEFACTS

1. **csoai.org/sovereign-os/watchdog/report.html** — the citizen-side report form (1-tap from any web app)
2. **csoai.org/sovereign-os/watchdog/heatmap.html** — the live global heat map
3. **csoai.org/sovereign-os/watchdog/simulate.html** — the pre-departure simulator UI
4. **csoai.org/sovereign-os/watchdog/ontology.json** — the WatchdogReport schema
5. **csoai.org/sovereign-os/watchdog/MEOK-integration.md** — how MEOK Labs puts this in a humanoid

All 5 ship in Phase 462.

---

## 11. THE 7 WATCHDOG USE CASES (what's possible on day 1)

| # | Use case | Who benefits | What it does |
|---|---|---|---|
| 1 | **Citizen safety reporting** | Humans | One-tap report of crime/incident. Heat map lights up. Other citizens see the risk. |
| 2 | **Humanoid pre-departure route** | Humanoids | Computes safest route + predicts events before leaving. Reroutes en-route. |
| 3 | **Agent self-reporting** | AI agents | Anomalous behaviour, jailbreak attempts, ethical violations — auto-reported. |
| 4 | **Critical infrastructure** | Operators | Bridge/tunnel/power station reports status every 5min. Heat map shows degradation. |
| 5 | **Public health surveillance** | Health agencies | Hospital admission patterns, illness clusters, AQI spikes — auto-flagged. |
| 6 | **Disaster response** | First responders | Earthquake/flood/fire reports stream in real time. Heat map shows extent within minutes. |
| 7 | **Agent economy coordination** | All agents | The 47-agent hive + MEOK humanoids + sovereign citizens can all see the same problem. Coordination emerges. |

---

## 12. THE LICENSE

- **MIT** for the software (Watchdog code, backend, frontend)
- **CC0 1.0** for the data (every report is CC0 — public domain, forkable, no rights reserved)
- **OSI approved**
- **DORADO 1-click alignment choice** — EAST (sovereign) or WEST (commercial)

**The data is public domain. The substrate is MIT. The fork is sovereign.**

---

*🜏🛡 CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026*
*Public. Auditable. Sovereign. The Watchdog sees everything. The Watchdog is sovereign.*
*Care Floor 0.95 · BFT 12-around-1 · SIGIL Ed25519 + PQC · 75-node threat council*
*Humans · Agents · Humanoids · Systems — all reporting. All sovereign. All auditable.*
*Public. Auditable. Sovereign. Solve et Coagula.*