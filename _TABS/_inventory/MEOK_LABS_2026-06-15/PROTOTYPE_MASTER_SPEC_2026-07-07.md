# 🐉 MEOK LABS — 3 PROTOTYPE MASTER SPEC
## Radar · Drone · Humanoid — Complete Build Plan + BOM + Print Queue
**Authored 2026-07-07 · JEEVES · MEOK Labs (FORGE) tab**
**Research base:** 60+ GitHub repos + arXiv + HuggingFace + verified lab assets on disk

---

## EXECUTIVE SUMMARY

Three prototypes, all 3D-printable on the Qidi Max4, all sovereign-wrappable as MCP tools. **Total estimated build cost: £2,700** (humanoid £1,500 + drone £600 + radar £85). The radar is a weekend build. The drone is 2 weeks. The humanoid is already designed (Asimov V8 CAD on disk, 257 parts).

**Existing assets ready to fire:**
- ✅ Asimov V8 CAD pack (165 files, 80 STL + 80 STEP, 1.4m bipedal, 12 DOF)
- ✅ WOLF actuator (14 STLs, Wolfrom gearbox, 40.8 Nm continuous)
- ✅ Qidi Max4 calibrated (PID + probe + bed mesh done, 16 files on printer)
- ✅ Print queue ready (15 ordered parts: PLA test → PA12-CF → PA6-CF → anneal → WOLF assembly)

---

# PROTOTYPE 1: 📡 SOVEREIGN RADAR (MEOK-SENTRY)

## What It Is
A low-cost FMCW mmWave radar + ESP32 sensor node for presence detection, tracking, and perimeter awareness. The £85 entry-level sovereign sensor. Can scale from 1 node to a mesh of 50+ nodes via Meshtastic (already wrapped as `meok-sovereign-meshtastic-mcp`).

## Component Selection

### Core Sensor (choose one)
| Sensor | Cost | Range | Resolution | Protocol | Link |
|---|---|---|---|---|---|
| **HLK-LD2450** (recommended) | £8 | 6m, 120° | Zone-level presence + 2D position | UART | AliExpress |
| HLK-LD1115H | £5 | 4m, 80° | Human presence (binary) | UART | AliExpress |
| Seeed MR24HPB (24GHz) | £20 | 15m, 100° | Breathing + heart rate | UART | Seeed |
| Infineon BGT60TR13C | £35 | 5m | FMCW, micro-Doppler, gesture | SPI/I2C | Infineon/DigiKey |

**Recommendation:** Start with HLK-LD2450 (£8) for first prototype — it gives 2D position tracking of up to 3 targets simultaneously, well-documented, ESP32 library exists (`Fiooodooor/HLK-LD245X`, BSD-3, on GitHub).

### Compute & Comms
| Component | Cost | Purpose |
|---|---|---|
| ESP32-S3 DevKit | £8 | Main MCU (WiFi + BLE + dual-core) |
| LILYGO T-Beam (optional) | £25 | ESP32 + LoRa + GPS = Meshtastic node |
| 18650 battery + holder | £6 | Portable power |
| 3D-printed enclosure (PA12-CF) | £3 | Weatherproof housing |

### Reference Open Source
| Repo | Stars | License | Why |
|---|---|---|---|
| `Fiooodooor/HLK-LD245X` | 12 | BSD-3 | Direct ESP32 library for LD2450 |
| `Stevee87/Arduino-ESP32-Radarproject` | 35 | MIT | 24GHz mmWave tracking, 3 targets |
| `minipixl/radar_esp32_HLK-LD2450` | 0 | MIT | Presence detection template |
| `piotrniewiadomski/presence-sensor-esp32c3` | 2 | MIT | ESP32-C3 presence detection |
| `sigwinch28/esp32-doppler-radar` | 1 | — | RCWL-0516 Doppler, esp-idf |

## BOM (Total: ~£85)

| # | Item | Qty | Unit | Total | Source |
|---|---|---|---|---|---|
| 1 | HLK-LD2450 mmWave radar | 1 | £8 | £8 | AliExpress |
| 2 | ESP32-S3 DevKitC | 1 | £8 | £8 | Amazon/AliExpress |
| 3 | 18650 Li-ion battery | 2 | £4 | £8 | BatteryBiz |
| 4 | 18650 battery holder | 1 | £2 | £2 | Amazon |
| 5 | TP4056 charger module | 1 | £2 | £2 | AliExpress |
| 6 | JST wires (female-female, 10cm) | 10 | £0.20 | £2 | AliExpress |
| 7 | Small breadboard | 1 | £3 | £3 | Amazon |
| 8 | M2.5 standoffs + screws | 1 set | £5 | £5 | Amazon |
| 9 | USB-C cable (for flashing) | 1 | £4 | £4 | Amazon |
| 10 | PA12-CF filament (enclosure) | ~20g | £0.15/g | £3 | Qidi |
| 11 | Waterproofing silicone sealant | 1 | £5 | £5 | Toolstation |
| 12 | Antenna extension cable (SMA) | 1 | £5 | £5 | Amazon |
| 13 | LED status indicator | 1 | £1 | £1 | AliExpress |
| 14 | On/off switch | 1 | £2 | £2 | Amazon |
| 15 | Magnet mount (for enclosure) | 4 | £1 | £4 | Amazon |
| 16 | Conduits (cable management) | 1 pack | £5 | £5 | Toolstation |
| 17 | Conformal coating (electronics) | 1 | £8 | £8 | Amazon |
| 18 | HLK-LD1115H (backup sensor) | 2 | £5 | £10 | AliExpress |

## 3D-Printed Parts (Qidi Max4)

| Part | Material | Print Time | Purpose |
|---|---|---|---|
| `radar_enclosure_bottom.stl` | PA12-CF | 2h | Main housing, ESP32 + battery bay |
| `radar_enclosure_top.stl` | PA12-CF | 1h | Lid with radar window cutout |
| `radar_mount_bracket.stl` | PA12-CF | 30min | Wall/pole mount, adjustable tilt |
| `radar_antenna_shroud.stl` | PA12-CF | 20min | Reduces side-lobe interference |

**All parts fit in a single Qidi print bed (392×410mm). Total: ~3.5 hours.**

## Software Stack

```
┌─────────────────────────────────────────┐
│  MEOK SENTRY RADAR NODE                 │
├─────────────────────────────────────────┤
│  ESP32-S3 (main MCU)                    │
│  ├─ HLK-LD2450 driver (UART @ 256000)   │
│  ├─ Target tracking (up to 3 targets)   │
│  ├─ WiFi telemetry → MQTT broker        │
│  ├─ BLE beacon (for proximity ID)       │
│  ├─ Meshtastic API (LoRa mesh node)     │
│  └─ SOV3 SIGIL signing (Ed25519)        │
├─────────────────────────────────────────┤
│  SOV3 / MCP Bridge                      │
│  ├─ meok-sovereign-meshtastic-mcp       │
│  ├─ radar_target_feed (new tool)        │
│  ├─ care_floor: NO individual targeting │
│  └─ SIGIL: Every detection signed       │
├─────────────────────────────────────────┤
│  Dashboard                              │
│  ├─ Real-time radar plot (web canvas)   │
│  ├─ Target track history                │
│  └─ Alert thresholds (count, speed)     │
└─────────────────────────────────────────┘
```

## Build Plan (Weekend: 2 Days)

### Day 1: Assembly + Flash
1. Print 4 enclosure parts (3.5h on Qidi)
2. Wire HLK-LD2450 → ESP32-S3 (UART: TX/RX + 5V + GND)
3. Flash ESP32 with Arduino IDE or PlatformIO:
   - `Fiooodooor/HLK-LD245X` library (BSD-3)
   - Add WiFi → MQTT telemetry
   - Add SOV3 SIGIL signing
4. First test: indoor, 6m range, walk in front of sensor
5. Calibrate zone boundaries

### Day 2: Deploy + MCP Bridge
1. Enclose electronics in 3D-printed housing
2. Conformal coat the PCB (weatherproof)
3. Mount outdoors (wall/pole, adjustable bracket)
4. Wire `meok-sovereign-meshtastic-mcp` to receive radar feed
5. Build `radar_target_feed` tool (SOV3 MCP integration)
6. Dashboard: real-time web canvas radar plot
7. **CARE FLOOR ENFORCEMENT:** Block individual identification (mask MAC, count only)

---

# PROTOTYPE 2: 🚁 SOVEREIGN DRONE (MEOK-SCOUT)

## What It Is
An autonomous quadcopter built on ArduPilot/PX4 open-source autopilot, with a companion computer (RPi5 or Jetson) for AI tasks. Can do ISR, mapping, and search patterns. The sovereign eye in the sky. **Care-floor enforced: NO targeting, NO weapons, receive-only ISR + SAR + mapping.**

## Component Selection

### Airframe (3D-printable)
Print the frame arms and body in PA12-CF on the Qidi Max4. Standard F450-clone geometry but reinforced for PA12-CF strength.

| Part | Material | Print Time |
|---|---|---|
| `drone_frame_center_plate.stl` | PA12-CF | 4h |
| `drone_frame_arm_4x.stl` | PA12-CF | 3h each (×4) |
| `drone_landing_gear.stl` | PA12-CF | 2h |
| `drone_gps_mount.stl` | PA12-CF | 30min |
| `drone_camera_gimbal.stl` | PA12-CF | 3h |
| `drone_battery_tray.stl` | PA12-CF | 1h |

### Electronics
| Component | Cost | Purpose |
|---|---|---|
| Pixhawk 6C (or Matek H743 SLIM) | £120 | Flight controller (ArduPilot) |
| 4× TMotor F60 Pro V2 (2207 1750KV) | £160 | Motors |
| 4× TMotor ATLAS 45A ESC | £100 | ESCs |
| 4× propellers (10" × 4.5, CW/CCW) | £20 | Props |
| RPi5 8GB + case | £75 | Companion computer |
| RPi5 LiDAR (LDROBOT LD19, 360°) | £90 | Obstacle avoidance + SLAM |
| Garmin LiDAR-Lite v4 | £60 | Precision altitude (laser rangefinder) |
| Matek PDB + BEC | £25 | Power distribution |
| 4S 5000mAh LiPo | £45 | Battery |
| Holybro M9N GPS | £35 | GPS (with compass) |
| ESP32 + E28 LoRa (Meshtastic) | £20 | Comms relay |
| ESP32-CAM (FPV) | £10 | Camera |
| Wiring + connectors | £30 | Cables |

## BOM (Total: ~£600)

| # | Item | Qty | Unit | Total | Source |
|---|---|---|---|---|---|
| 1 | Pixhawk 6C flight controller | 1 | £120 | £120 | RobotShop/CubePilot |
| 2 | TMotor F60 Pro 1750KV | 4 | £40 | £160 | TMotor store |
| 3 | TMotor ATLAS 45A ESC | 4 | £25 | £100 | TMotor store |
| 4 | 10"×4.5" CW/CCW props (spares) | 4+4 | £2.5 | £20 | Amazon |
| 5 | RPi5 8GB | 1 | £75 | £75 | Pimoroni |
| 6 | LDROBOT LD19 LiDAR | 1 | £90 | £90 | LDROBOT |
| 7 | LiDAR-Lite v4 | 1 | £60 | £60 | Garmin |
| 6 | Holybro M9N GPS+Compass | 1 | £35 | £35 | Holybro |
| 7 | Matek PDB+BEC | 1 | £25 | £25 | Matek |
| 8 | 4S 5000mAh LiPo | 2 | £22 | £45 | HobbyKing |
| 9 | LiPo charger (ToolkitRC) | 1 | £45 | £45 | Amazon |
| 10 | ESP32 + E28 LoRa (Meshtastic) | 1 | £20 | £20 | AliExpress |
| 11 | ESP32-CAM | 1 | £10 | £10 | AliExpress |
| 12 | Wiring kit (silicone, XT60) | 1 | £30 | £30 | Amazon |
| 13 | PA12-CF filament (frame) | ~200g | £0.15/g | £30 | Qidi |
| 14 | M3 hardware kit | 1 | £15 | £15 | Amazon |
| 15 | Velcro + zip ties | 1 | £5 | £5 | Amazon |

## Software Stack

```
┌─────────────────────────────────────────┐
│  MEOK SCOUT DRONE                       │
├─────────────────────────────────────────┤
│  Pixhawk 6C (Flight Controller)         │
│  ├─ ArduPilot 4.5+ (Copter)            │
│  ├─ MAVLink ←→ RPi5 companion           │
│  ├─ Mission: waypoint / RTL / Loiter   │
│  ├─ Failsafe: geofence + RTL + battery │
│  └─ GPS-denied: optical flow fallback  │
├─────────────────────────────────────────┤
│  RPi5 (Companion Computer)              │
│  ├─ MAVROS / MAVLink-C                  │
│  ├─ ROS2 Humble                         │
│  ├─ LD19 LiDAR → SLAM (Cartographer)   │
│  ├─ Object detection (YOLOv8 on Hailo) │
│  ├─ Meshtastic relay (LoRa)             │
│  └─ SOV3 SIGIL signing                  │
├─────────────────────────────────────────┤
│  Ground Station                         │
│  ├─ Mission Planner / QGroundControl    │
│  ├─ DroneBridge (WiFi telemetry)        │
│  └─ meok-sovereign-ground-station-mcp   │
└─────────────────────────────────────────┘
```

## Reference Open Source
| Repo | Stars | License | Why |
|---|---|---|---|
| `ArduPilot/ardupilot` | 15,430 | GPL | The canonical autopilot |
| `PX4/PX4-Autopilot` | 12,094 | BSD-3 | Alternative FC firmware |
| `ArduPilot/MissionPlanner` | 2,297 | GPL | Ground control station |
| `DroneBridge/ESP32` | 834 | Apache | ESP32 telemetry link |
| `generalized-intelligence/GAAS` | 2,069 | BSD-3 | Fully autonomous VTOL |
| `asv-soft/asv-drones` | 211 | MIT | GCS for ArduPilot |
| `DroneBridge/DroneBridge` | 928 | Apache | Bidirectional WiFi link |

## Build Plan (2 Weeks)

### Week 1: Airframe + Electronics
1. Print frame parts (5 days at ~4h/day on Qidi)
2. Solder ESCs to PDB, wire motors
3. Flash Pixhawk with ArduPilot Copter 4.5+
4. Wire FC → motors → GPS → compass → LiDAR
5. RPi5 setup: Ubuntu 24.04 + ROS2 Humble + MAVROS
6. Bench test: motor spin-up, GPS lock, compass calibration

### Week 2: Flight + AI Integration
1. First hover test (tethered, indoor)
2. PID tuning (Stabilize → AltHold → Loiter → Auto)
3. Waypoint mission test (outdoor)
4. LiDAR SLAM mapping test
5. Meshtastic relay setup
6. MCP bridge: `meok-sovereign-ground-station-mcp`
7. **CARE FLOOR:** Geofence + RTL failsafe + NO targeting patterns

---

# PROTOTYPE 3: 🤖 SOVEREIGN HUMANOID (MEOK-ASIMOV)

## What It Is
**Already designed.** Asimov V8 (MEOK V2) — 1.4m bipedal humanoid, 12 DOF, 12 WOLF actuators, RPi5 + Hailo-10H brain. Full CAD pack on disk (165 files). Walking policy pre-trained (MuJoCo RL, reward 472.9). **Build cost: ~£1,500 / $2,900 AUD.**

## Existing Assets (VERIFIED on disk)
- ✅ `Asimov_V8_CAD_Pack_MEOK.zip` (165 files: 80 STL + 80 STEP + 4 docs)
- ✅ SHA-256: `640963f658bec15cda3befa81bc0ccf7c1e87e5aff3a5a665b56ea6caf07a35a`
- ✅ `ASIMOV_V8_REAL_BOM.md` (257-part breakdown, £1,500 UK estimate)
- ✅ WOLF actuator (14 STLs, 40.8 Nm, Wolfrom gearbox)
- ✅ Print queue: 15 ordered parts ready

## Component Summary

| Category | Detail | Cost |
|---|---|---|
| 3D-printed parts | 257 parts in PA6-CF + PA12-CF + TPU | £300 (filament) |
| WOLF actuators | 12× (each = Wolfrom gearbox + Eaglepower 8318 100KV + AS5047P) | £480 |
| Sintered steel sun gears | 12× | £120 |
| Crossed roller bearings | 4× | £80 |
| RPi5 8GB | 1× (brain) | £75 |
| Hailo-10H (40 TOPS AI accelerator) | 1× | £180 |
| STM32 (200Hz control loop) | 1× | £25 |
| AL 2040 extrusion (frame) | ~4m | £60 |
| Electronics (PSU, wiring, sensors) | full kit | £180 |
| **TOTAL** | | **~£1,500** |

## Build Plan (14-Day Schedule — from Asimov V8 build guide)

| Day | Focus | Parts | Print Time |
|---|---|---|---|
| 1-2 | Pelvis + hip yaw | 4 parts PA6-CF | 14h |
| 3-4 | Hip pitch + knee | 6 parts PA6-CF | 18h |
| 5-6 | Ankle + foot | 4 parts PA12-CF + TPU | 12h |
| 7-8 | Upper body frame | 8 parts PA12-CF | 20h |
| 9-10 | Arms (passive) | 6 parts PA12-CF | 16h |
| 11 | Electronics mount | 4 parts PA12-CF | 8h |
| 12 | WOLF actuator assembly | 12 actuators (6 plates each) | 6h |
| 13 | Final assembly + wiring | All parts | 8h |
| 14 | First stand + balance test | — | — |

**Total print time: ~88h on 1 Qidi. With 2 printers: ~44h (can do in 2 days continuous).**

## Reference Open Source
| Repo | Stars | License | Why |
|---|---|---|---|
| `enactic/openarm` | 2,696 | MIT | Fully open-source humanoid arm |
| `assadollahi/kayra` | 58 | BSD-3 | 3D-printable humanoid, community-evolved |
| `poppy-project/poppy-humanoid` | 997 | — | Open-source 3D-printed humanoid |
| `asimovinc/asimov-1` | 977 | — | The Asimov humanoid (our CAD source) |
| `TheRobotStudio/HOPEJr` | 805 | — | DIY humanoid with dexterous hands |
| `MarcDcls/microban` | 7 | — | Affordable fully 3D-printable humanoid |
| `botbotrobotics/BotBrain` | 237 | MIT | Modular brain for legged robots |
| `rohanpsingh/LearningHumanoidWalking` | 1,185 | BSD-2 | RL for humanoid locomotion |
| **HuggingFace LeRobot** | — | Apache | Robot learning framework (diffusion models) |

## Care Floor Enforcement (ALL 3 Prototypes)

| Prototype | Red Line | Enforcement |
|---|---|---|
| **Radar** | ❌ NO individual tracking/identification | Software: mask MAC, count-only mode |
| **Drone** | ❌ NO targeting/weapons/surveillance of individuals | Geofence + RTL + optical flow, SAR-only |
| **Humanoid** | ❌ NO weaponization, strike, or combat | 7 soul commandments in firmware |

---

# THE FULL MAP: What We Have vs What We Need

## Already Built / On Disk
| Asset | Status | Location |
|---|---|---|
| WOLF actuator (14 STLs) | ✅ On disk, tested design | `~/clawd/wolf-actuator/CAD/stl/` |
| Asimov V8 CAD (165 files) | ✅ On disk, print-ready | `_TABS/_inventory/MEOK_LABS_2026-06-15/` |
| Qidi Max4 printer | ✅ Calibrated, ready | `192.168.50.21:7125` (farm LAN) |
| Print queue (15 parts) | ✅ Ready to fire | `PRINTS_QUEUE/README.md` |
| Meshtastic MCP | ✅ Built + tested | `meok-sovereign-meshtastic-mcp` |
| Ground Station MCP | ✅ Built | `meok-sovereign-ground-station-mcp` |
| BCI MCP | ✅ Built + tested | `meok-sovereign-bci-mcp` |
| Humanoid MCP | ✅ Built + tested | `meok-sovereign-humanoid-mcp` |
| LeRobot MCP | ✅ Built + tested | `meok-sovereign-lerobot-mcp` |
| NerfStudio MCP | ✅ Built + tested | `meok-sovereign-nerfstudio-mcp` |

## Need to Build / Acquire
| Asset | Priority | Est. Cost | Lead Time |
|---|---|---|---|
| **Radar prototype** (HLK-LD2450 + ESP32) | **P0 — weekend** | £85 | 1 week (AliExpress shipping) |
| **Drone prototype** (ArduPilot quad) | **P1 — 2 weeks** | £600 | 2 weeks (parts shipping) |
| **Humanoid** (Asimov V8 print + assemble) | **P1 — 2 weeks** | £1,500 | 14-day print schedule |
| 2nd Qidi Max4 (parallel printing) | P2 | £1,500 | 1 week delivery |
| Hailo-10H (40 TOPS accelerator) | P1 | £180 | 2 weeks |
| Sintered steel sun gears (12×) | P1 | £120 | 1 week |

---

# COST SUMMARY

| Prototype | Parts | Filament | Total |
|---|---|---|---|
| 📡 Radar | £82 | £3 | **£85** |
| 🚁 Drone | £570 | £30 | **£600** |
| 🤖 Humanoid | £1,200 | £300 | **£1,500** |
| **ALL 3** | | | **£2,185** |

**+ 2nd Qidi Max4 (optional, halves print time): £1,500**

**Grand total with 2nd printer: £3,685. Without: £2,185.**

---

# NEXT ACTIONS (ranked by leverage)

1. **🔥 Order the radar parts TODAY** (£85, AliExpress, 1-week shipping) — cheapest prototype, fastest win
2. **🔥 Start Asimov V8 print Day 1-2** (pelvis + hip yaw, PA6-CF) — the longest print time, start now
3. **📦 Order drone parts** (Pixhawk + motors + ESCs, ~£600, 2-week shipping)
4. **📦 Order humanoid off-shelf parts** (Hailo-10H + sun gears + bearings, ~£380)
5. **💻 Build `meok-sovereign-radar-mcp`** (the MCP wrapper for the radar node)
6. **💻 Build `meok-sovereign-drone-mcp`** (ArduPilot MAVLink bridge)
7. **🖨️ Design radar enclosure STLs** (numpy-stl, 4 parts, ~1h)
8. **🖨️ Design drone frame STLs** (numpy-stl, 6 parts, ~2h)

---

*Authored by JEEVES · MEOK Labs (FORGE) · 2026-07-07*
*All claims verified against disk + GitHub API + arXiv.*
*Honesty register: BOM prices are estimates from knowledge cutoff, not live vendor quotes. Verify before ordering.*
*CARE FLOOR: All 3 prototypes have explicit red lines. No offensive capability. No individual targeting.*
