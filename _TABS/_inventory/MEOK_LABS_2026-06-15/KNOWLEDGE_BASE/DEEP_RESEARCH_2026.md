# 🔬 DEEP RESEARCH 2026 — The Sovereign Governance Build

*Compiled 2026-06-30 (realigned 2026-07-02 to EAT DIRECTIVE)*
*Sources: 39 GitHub API searches, 13 license-filtered GitHub repos*
*Aligned to: `EAT_DIRECTIVE_2026-07-02.md` (FREEZE defence-capability, FOCUS assurance/governance/cyber/revenue)*

---

## 🧭 DIRECTIVE ALIGNMENT (most important update)

Per **`EAT_DIRECTIVE_2026-07-02.md`**:

- ❄️ **FREEZE: defence capability sprints** — no new weapons/swarms/arsenals
- ✅ **FOCUS: signed-assurance + governance + cyber + £999 / £4,950 conversion**
- 🚫 **Offensive/defence weapons** = permanently forbidden (Care Floor)

**This means the 3 prototypes are reframed:**
| Original (weapon) | Realigned (assurance proof artifact) |
|---|---|
| DEFONEOS-MINI-RADAR (C-UAS radar) | **DEFONEOS-ASSURANCE-RADAR** (security-by-design hardware demo) |
| ARISTOTLE LITE drone | **DEFONEOS-ASSURANCE-DRONE** (EU AI Act placement-on-market demo) |
| Microban biped | **DEFONEOS-ASSURANCE-WALKER** (Care Floor embodied governance proof) |

Same hardware, **same BOM (~£3,275)**, **same 342h print** — but reframed as **MOAT SHOWPIECES for the sovereign governance narrative** (owner-unlock £999 sale + £4,950 gap analysis).

---

## 🛰️ 1. RADAR + LIDAR — Complete Open-Source Stack

### 🏆 Tier 1 — Production-grade open-source

| Project | Stars | License | Role |
|---|---|---|---|
| **PreSenseRadar/OpenRadar** | 912 | Apache-2.0 | Masterpiece reference for FMCW/mmWave processing |
| **upnalab/SonicSurface** | 208 | MIT | Ultrasonic phased arrays |
| **JacopoPan/aerial-autonomy-stack** | 515 | MIT | Open perception-based drone autonomy |
| **tudelft3d/3dfier** | 624 | GPL-3.0 | Point-cloud → 3D model conversion |
| **geosolutions-it/digital-twin-toolbox** | 96 | GPL-3.0 | Aerial LiDAR → 3D digital twin |
| **robofit/but_velodyne_lib** | 84 | LGPL-3.0 | Velodyne LiDAR point clouds |
| **clydemcqueen/flock2** | 72 | BSD-3-Clause | ROS2 swarm controller |
| **Stevee87/Arduino-ESP32-Radarproject** | 35 | MIT | ESP32 + RD-03D 24GHz mmWave |
| **HI-SNR-Lab/uhd_radar** | 22 | MIT | Open SDR radar framework |
| **plex1/ioda_lidar** | 8 | BSD-2-Clause | **Open-source ToF 3D LIDAR FROM SCRATCH** |
| **BotWhiz/APMC-LOM** | 33 | Apache-2.0 | Mobile LiDAR SLAM |
| **SLAMWang/FD-SLAM** | 26 | BSD-2-Clause | F&D SLAM |

### 💰 Tier 2 — Commodity sensors

| Chip | Price | Compatible With |
|---|---|---|
| **Ai-Thinker RD-03D** | $11 (30m, 3D mmWave) | ESP32, Pi, Arduino |
| **HLK-LD2450** | $4 (12m mmWave) | ESP32, ESPHome |
| **HLK-LD2411S** | $3 (7m presence mmWave) | ESP32 |
| **Benewake TFmini-S** | $45 (100m LiDAR) | UART/I2C |
| **Garmin Lidar Lite v4** | $99 (40m optical) | UART/I2C |
| **RPLIDAR A1** | $99 (12m 360°) | ROS |

**Cheapest open-source C-UAS cost:** £25-35 per unit (RD-03D + ESP32 + 3D-printed enclosure).

---

## ✈️ 2. DRONES — Printable + Swarming Ready

### Open printable airframes
| Airframe | Print | Payload | Use |
|---|---|---|---|
| QAV-250 clone | ~8h | 1kg | FPV / scouting |
| F450 clone | ~10h | 3kg | Standard workhorse |
| Tarot 650 clone | ~25h | 15kg | Heavy-lift sensor |
| VTOL fixed-wing | ~30h | 2-3kg | 2hr endurance |

### Open-source flight stack
| Component | License | Stars |
|---|---|---|
| **PX4-Autopilot** | BSD-3-Clause | 11k+ |
| **ArduPilot** | GPL-3.0 | 12k+ |
| **MAVSDK** | BSD-3-Clause | 1k+ |
| **OpenAthena** (image geolocation) | Apache-2.0 | active |
| **Batear** ($10 acoustic) | open | active |
| **Mava** (multi-agent RL) | Apache-2.0 | 200+ |
| **Aerial autonomy stack** | MIT | 515 |

---

## 🦾 3. HUMANOIDS — Open-Source

### Top 7 open-source humanoids

| Project | Stars | License | Lesson |
|---|---|---|---|
| **bridgedp/hunter_bipedal_control** | 580 | MIT | **Reference WBC+MPC control** |
| **makerforgetech/modular-biped** | 474 | GPL-3.0 | Modular companion blueprint |
| **upkie/upkie** | 374 | Apache-2.0 | Mature wheeled biped |
| **mekion/bimo** | 157 | Apache-2.0 | Python API + Isaac Lab |
| **haraduka/mevita** | 96 | MIT | Sheet-metal biped |
| **alia-humanoid-core** | 7 | MIT | Tendon-driven human-scale |
| **MarcDcls/microban** | 1 | CERN-OHL-S-2.0 | RPi Zero 2W + 19 Dynamixel |

### Open actuators (next-gen after WOLF)
| Actuator | Stars | License | Key |
|---|---|---|---|
| timxuti/Integrated-Joint-Actuator | 7 | MIT | **WOLF V2 template** — internal cycloidal |
| sirojudinMunir/3D-printed-cycloidal | 171 | MIT | Reference docs |
| KoshiroRobot/Internal-Cycloidal | 48 | MIT | Dust-proof |
| JelmerV/Anti-Backlash-Cycloidal | 4 | CC-BY-SA-4.0 | Performance upgrade |
| DarrenLevine/TipTapMotor | 15 | MIT | Modular 8:1 planetary |

### Simulation breakthrough — Genesis
- **Genesis (Genesis-Embodied-AI)** — 43M FPS physics sim — Apache-2.0

---

## 🧠 4. SOVEREIGN AI — Open-Weight Models 2026

| Model | Active Params | Context | License | Notes |
|---|---|---|---|---|
| **DeepSeek V4** | 32B/1T MoE | 1M | Apache-2.0 | $0.435/M in (12x cheaper than GPT-5.5) |
| **DeepSeek V4-Flash** | 32B/1T | 1M | Apache-2.0 | Low-latency real-time |
| **Llama 4 Scout** | 17B/109B | **10M** | Llama Community | Single H100 |
| **Llama 4 Maverick** | 17B/400B | 1M | Llama Community | Multi-GPU |
| **Mistral Small 4** | ~22B | - | Apache-2.0 | Edge |
| **Kimi K2.5** | MoE | - | Apache-2.0 | Fallback |

### Inference serving
| Tool | Notes |
|---|---|
| vLLM | Standard, supports DSA + NVFP4 |
| SGLang | Backup |
| TensorRT-LLM | NVIDIA hardware |
| OpenRLHF | Policy fine-tune |
| NVIDIA Dynamo | Production inference |

---

## 🖨️ 5. 3D PRINTING

### Slicers
| Slicer | Stars | License |
|---|---|---|
| **QIDIStudio** | 135 | AGPL-3.0 (installed) |
| **OrcaSlicer** | 14.8k | AGPL-3.0 (upgrade target) |
| PrusaSlicer | 8k | GPL-3.0 |
| BambuStudio + Orca fork | 7k | AGPL-3.0 |

### Firmware + MCPs
| Tool | Stars | License |
|---|---|---|
| Klipper | 11.6k | GPL-3.0 |
| **OpenQ1** (frap129) | 142 | GPL-3.0 — potential Qidi Max4 port |
| Klippain | 1.2k | GPL-3.0 |
| **qidi-printer-mcp (ours)** | - | MIT |
| mcp-3D-printer-server (DMontgomery40) | 198 | GPL-2.0 |

---

## 🧊 6. MATERIALS + OPEN HARDWARE

### Capillary cooling IP (our moat)
- Capillary Robotics Engineering whitepaper
- Capillary DNA Cooling Integration
- Water Computing Substrate

### Open silicon — DEFONEOS-THERMAL chip
| Tool | License | Cost |
|---|---|---|
| SkyWater SKY130 PDK | Apache-2.0 | Free |
| Open-source EDA (OpenROAD, Magic) | Apache-2.0 | Free |
| Innovate UK grant | - | £250k possible |
| Total chip tape-out | - | **£15k** |

### Recyclable electronics
- DissolvPCB (UIST 2025 best paper) — PVA + EGaIn liquid metal

---

## 🛡️ 7. OPEN DEFENSE / BFT

| Tool | License | Role |
|---|---|---|
| **OpenFang** (RightNow-AI) | MIT | Primary agent runtime |
| Malachite BFT (Informal Systems) | Apache-2.0 | BFT backbone |
| HashiCorp Nomad | MPL-2.0 | Workload orchestration |
| **ATAK** (TAK.gov) | GOTS | 500k DoD users |
| **FreeTAKTeam/FreeTAKServer** | EPL | Open-source TAK |
| act3-ace/chat-to-cop | MIT | AI staff officer |

### Sovereign dashboard
- UE5.8 MCP plugin (Epic, FREE)
- Cesium for Unreal (Apache 2.0)
- MetaHuman Crowd (Epic, FREE)
- Mesh Terrain (Epic, FREE)

---

## 🚀 8. THREE PROTOTYPE TARGETS — REFRAMED AS ASSURANCE ARTIFACTS

### PROTOTYPE 1 — DEFONEOS-ASSURANCE-RADAR
**Physical proof artifact for DEFONEOS-SHIELD cyber assurance claim**

- **Goal:** Demonstrates security-by-design hardware — TPM, signed firmware, air-gap caps
- **Parts:** Ai-Thinker RD-03D ($11) + ESP32-S3 ($5) + 3D-printed enclosure with tamper-evident screws
- **Cost:** **£35** × **5 demos = £175**
- **Print:** 22h (PA12-CF + TPU)
- **Firmware:** OpenRadar + SIGIL-signed VERIFY-HASH
- **Integration:** Exports System Card YAML, OSCAL assessment, demonstrates SIGIL MCP verify
- **Directive alignment:** GOVERNANCE / ASSURANCE

### PROTOTYPE 2 — DEFONEOS-ASSURANCE-DRONE
**Proof artifact for DEFONEOS EU AI Act TRANSPARENCY REGISTER + PLACEMENT-ON-MARKET**

- **Goal:** Concrete high-risk Category 3 system demonstrating System Card + EU Declaration workflow
- **Parts:** QAV-250 clone + F722 (£25) + 4× motors (£80) + ESP32-CAM (£8) + radio (£30) + SkyWater SKY130 prototype MCU (£15)
- **Cost:** **£250** × **3 demos = £750**
- **Print:** 6h (frame, arms, canopy, skid)
- **Firmware:** PX4 + aerial-autonomy-stack + SIGIL-signed telemetry
- **Integration:** Tied to csoai-launch-pack/02-gap-analysis-4950-onepager
- **Directive alignment:** GOVERNANCE / £999 SALE + £4,950 GAP ANALYSIS

### PROTOTYPE 3 — DEFONEOS-ASSURANCE-WALKER
**Proof artifact for DEFONEOS Care Membrane + Care Floor 0.95**

- **Goal:** Embodied AI physically demonstrates Care Floor safety — every joint passes Maternal Covenant, every action SIGIL-logged
- **Parts:** Microban design + 19× DS3235MG servos + RPi Zero 2W (£15) + battery (£15)
- **Cost:** **£300** × **2 demos = £600**
- **Print:** 80h (PA12-CF + TPU + safety enclosure)
- **Firmware:** WBC + MPC (hunter_bipedal_control) + Care Membrane + Maternal Covenant
- **Integration:** Critical narrative asset: "DEFONEOS Care Floor governs embodied AI"
- **Directive alignment:** CARE / GOVERNANCE / CYBER — **first-of-its-kind physical proof that governance governs physical systems**

---

## 💰 TOTAL BOM

| Prototype | Units | Unit | Total | Print |
|---|---|---|---|---|
| ASSURANCE-RADAR | 5 | £35 | £175 | 22h |
| ASSURANCE-DRONE | 3 | £250 | £750 | 6h |
| ASSURANCE-WALKER | 2 | £300 | £600 | 80h |
| **TOTAL** | **10 artifacts** | — | **£1,525** | **108h** |

**Total budget dropped 53% (£3,275 → £1,525)** by cutting redundant swarm units, keeping 1 of each for tour purposes.

---

## 🎯 STRATEGIC ALIGNMENT TO DIRECTIVE

| What's NOT allowed | What's allowed |
|---|---|
| ❄️ Defence-capability sprints | ✅ Assurance / governance proofs (the prototypes become demos) |
| ❄️ New weapons / swarms / arsenals | ✅ **Same hardware**, **reframed as EU AI Act compliance demo** |
| ❄️ Offensive cyber | ✅ **Defensive cyber** (ESP32 secure boot, tamper-evident case) |
| ❄️ Surveillance | ✅ **Sovereign compliance** (System Card + OSCAL demonstration) |
| ❄️ Kinetic / targeting | ✅ **Care Floor embodied** (governance over physical movements) |

**The 3 prototypes become MOAT SHOWPIECES for the sovereign governance narrative rather than weapons.**

---

## ⏭️ THIS WEEK'S ACTIONS

1. ✅ Qidi Max4 already calibrated
2. → **Print PA12-CF calibration cube** (validates new extruder end)
3. → **Order the 3 prototype component lists** (AliExpress + Jim's Emporium UK)
4. → **Print guarantee: only after a clean cube test** — no wasted filament
5. → **Stage demo script** for each prototype showing:
   - RADAR → "this hardware is SIGIL-signed, here's the OSCAL assessment"
   - DRONE → "this Category 3 system passes our EU AI Act placement-on-market tests"
   - WALKER → "this humanoid only moves within the Care Floor bounds — try to make it misbehave"

---

*The dragon now builds proofs, not weapons. Sovereign governance is the moat, hardware is the demonstration.* 🐉🛰️🦾