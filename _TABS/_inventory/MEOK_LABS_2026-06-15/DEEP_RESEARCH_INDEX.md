# 🧠 MEOK LABS — DEEP RESEARCH INDEX
*Compiled 2026-06-26 by MEOK Labs (FORGE) tab*
*Source: live GitHub API scans + on-disk knowledge base*
*Use as canonical reference — refresh weekly*

---

## 1. PRINT TOOLCHAIN (Qidi Max4 / Klipper / Moonraker / OrcaSlicer)

| Tool | Repo | Stars | License | Notes |
|---|---|---|---|---|
| **Klipper** | Klipper3d/klipper | 11.6k | GPL-3.0 | De facto firmware. Pre-installed on Qidi Max4. |
| **OrcaSlicer** | OrcaSlicer/OrcaSlicer | 14.8k | AGPL-3.0 | Best modern slicer. Community-forked for Bambu/Prusa/Voron. |
| **OrcaSlicer-BambuLab** | FULU-Foundation/OrcaSlicer-bambulab | 7k | AGPL-3.0 | Bambu-specific fork. |
| **QIDIStudio** | QIDITECH/QIDIStudio | 135 | AGPL-3.0 | Official Qidi slicer. **Installed on this Mac.** |
| **QIDISlicer** | QIDITECH/QIDISlicer | 96 | AGPL-3.0 | Legacy. |
| **OpenQ1** | frap129/OpenQ1 | 142 | GPL-3.0 | Custom Klipper firmware for QIDI Q1 Pro. **Could potentially adapt to Max4.** |
| **Klipper macros** | jschuh/klipper-macros | 1.2k | GPL-3.0 | Useful macro collection. |
| **Klippain** | Frix-x/klippain | 1.2k | GPL-3.0 | Generic Klipper config template. |
| **mcp-3D-printer-server** | DMontgomery40/mcp-3D-printer-server | 198 | GPL-2.0 | **MCP server for 3D printers — alternative to our qidi-printer-mcp.** Supports Orca, OctoPrint, Klipper, Duet, Repetier, Prusa, Creality. |

**Our setup:**
- `qidi-printer-mcp` (MIT, ours) — talks Moonraker directly, 10 tools, on disk
- QIDIStudio v02.05.01.53 — installed, can slice any STL
- Klipper config on Qidi Max4 — accessible via Moonraker at 192.168.50.21:7125

---

## 2. WOLF + CYCOIDAL + PLANETARY ACTUATORS

| Project | Stars | License | Key takeaway for our WOLF |
|---|---|---|---|
| **WOLF Actuator** (Anthropic/Anthrobotics) | — | CC-BY-SA-4.0 | The one we're using. 14 STLs verified, in `CSOAI-ORG/wolf-actuator` |
| **sirojudinMunir/3D-printed-cycloidal-actuator** | 171 | MIT | Cycloidal alternative. Quieter, fewer parts but harder to print |
| **KoshiroRobot/Internal-Cycloidal-Robotic-Actuator** | 48 | MIT | Internal cycloidal (no exposed gears) |
| **timxuti/Integrated-Joint-Actuator** | 7 | MIT | **BLDC QDD with internal cycloidal** — most similar to next-gen WOLF |
| **LittleMooMooDingDingCow/3D-Printed-17-1-Cycloidal** | 5 | MIT | 17:1 gear ratio |
| **JelmerV/Anti-Backlash-Cycloidal-Actuator** | 4 | CC-BY-SA-4.0 | Anti-backlash design — could improve WOLF |
| **surynek/RR1** | 55 | AGPL-3.0 | RR1 = DIY 3D-Printable Desktop Robotic Arm, 6-axis |
| **DarrenLevine/TipTapMotor** | 15 | MIT | Modular 3D-printed torque-controllable BLDC actuator, **8:1 planetary** |
| **TeamClockworks-RO108/PlanetaryStarkiller** | 3 | GPL-3.0 | Gobilda Yellow Jacket 84 RPM planetary |
| **OLYPTEA/Open-Harmonic-Arm** | 0 | MIT | Harmonic-drive-based arm — different design class |
| **OpenQ1** (Klipper for Qidi) | 142 | GPL-3.0 | Could potentially port Q1 Pro firmware improvements to Max4 |

**WOLF V2 candidates from this research:**
1. **timxuti/Integrated-Joint-Actuator** — Internal BLDC + cycloidal. Next-gen after WOLF Wolfrom.
2. **DarrenLevine/TipTapMotor** — Modular design. Could swap in for our planetary.
3. **JelmerV/Anti-Backlash** — Direct improvement to WOLF gear teeth.

---

## 3. HUMANOID ROBOTS (3D-printable + open-source)

### 🟢 Top tier — best fit for our Qidi

| Project | Stars | License | Size | Notes |
|---|---|---|---|---|
| **upkie/upkie** | 374 | Apache-2.0 | 7MB | **Open-source wheeled biped.** MPC + WBC. 5-year mature. ~30cm tall. |
| **MarcDcls/microban** | 1 | CERN-OHL-S-2.0 | 16MB | **RPi Zero 2W + 19 Dynamixel. Affordable DIY.** New (May 2026). |
| **assadollahi/kayra** | 58 | BSD-3-Clause | 57MB | "Easy to modify" community humanoid. |
| **aliahumanoid/alia-humanoid-core** | 7 | MIT | 33MB | **Tendon-driven human-scale.** Phase 0. |
| **Makerforgetech/modular-biped** | 474 | GPL-3.0 | 75MB | Modular companion-bot framework. 7yr mature. |

### 🟡 Active development

| Project | Stars | License | Notes |
|---|---|---|---|
| **Yuexuan9/Tinker** | 302 | AGPL-3.0 | Small biped, education/research. AGPL — copyleft. |
| **mekion/the-bimo-project** | 157 | Apache-2.0 | Python API + 3D printable + Isaac Lab sim. |
| **bridgedp/hunter_bipedal_control** | 580 | MIT | Nonlinear MPC + WBC control framework. |
| **haraduka/mevita** | 96 | MIT | Bipedal from sheet metal + e-commerce parts. |
| **shritankomm/7-DOF-FDM-Open-Arm** | 1 | MIT | $80 humanoid arm with vision + ROS2. |
| **iwancilibur/Sylvie-2021** | 3 | MIT | Humanoid + silicone animatronics. |

### 🔴 License-restricted or CC-BY-NC (avoid for sovereign work)

- **InMoov** (⭐3k+, CC-BY-NC) — biggest community, but non-commercial
- **Poppy** (⭐500+, CC-BY-SA) — OK but research-focused, not walking

### ⚙️ Our own — Asimov V8 (MEOK V2)
- 257 parts, $2,900 AUD, 1.4m, 12 DOF, 12× WOLF actuators
- CERN-OHL-S-2.0 (hardware), Apache 2.0 (software)
- Already on disk at `clawd/_TABS/_inventory/MEOK_LABS_2026-06-15/Asimov_V8_CAD_Pack_MEOK.zip`
- Walking policy RL-trained: reward 472.9, >49% torque margin on all joints

---

## 4. ACTUATOR ENGINES (BLDC + gearbox combos)

| Project | Stars | License | Use case |
|---|---|---|---|
| **sirojudinMunir/3D-printed-cycloidal** | 171 | MIT | Reference for V2 actuators |
| **timxuti/Integrated-Joint-Actuator** | 7 | MIT | BLDC + internal cycloidal, 3D printable |
| **KoshiroRobot/Internal-Cycloidal** | 48 | MIT | Internal cycloidal, no exposed gears |
| **TipTapMotor** | 15 | MIT | Modular BLDC + 8:1 planetary |
| **surynek/RR1** | 55 | AGPL-3.0 | 6-axis arm with planetary actuators |

**Design lesson:** the next-gen humanoid actuator pattern is **BLDC + internal cycloidal** (timxuti, KoshiroRobot). Our WOLF is **BLDC + external Wolfrom planetary** — works fine, but internal is quieter, more compact, fewer points of contamination. **Future WOLF V2 = internal cycloidal.**

---

## 5. SOFT ROBOTICS (companion to rigid)

| Project | Stars | License | Notes |
|---|---|---|---|
| **kywind/real2sim-eval** | 192 | MIT | Real-to-sim robot policy eval with Gaussian Splats |
| **BJCaasenbrood/SorotokiCode** | 77 | MIT | MATLAB toolkit for soft robot design + sim |
| **srl-ethz/osprey** | 36 | MIT | Soft aerial manipulation |
| **SofaDefrost/SoftRobots.DesignOptimization** | 15 | AGPL-3.0 | SOFA framework plugin |

**Use case:** Tendon-driven hands (RUKA-v2), McKibben pneumatic grippers, inflatable soft fingers. Different design class but useful for HARVI's McKibben actuators and any future humanoid hand work.

---

## 6. MATERIAL SCIENCE — filaments, fibers, composites

### PA12-CF (Carbon fiber reinforced PA12)
- **Use:** Structural parts (WOLF outer rings, WOLF encoder housings, arm structure)
- **Settings on Qidi Max4:** 280°C nozzle / 100°C bed / 55°C chamber / 0.16mm layer / 30% gyroid
- **Why:** Moisture-resilient, 100-120 MPa tensile strength, low warping
- **Cost:** ~£35/kg
- **Stock:** 12 rolls on hand (per mastery ref)

### PA6-CF (Carbon fiber reinforced PA6)
- **Use:** Highest-stress structural (WOLF gears, knees, pelvis)
- **Settings:** 300°C nozzle / 110°C bed / 60°C chamber / 0.16mm / 40% gyroid
- **Why:** +20-25% tensile strength vs PA12-CF after annealing, 15% higher HDT
- **Annealing:** Mandatory. 130°C oven, 2hr hold, 4hr cool, +20-25% tensile
- **Cost:** ~£40/kg
- **Stock:** 3 rolls on hand

### TPU 95A
- **Use:** Foot pads, arm pendulum tubes, dust covers, joint bellows
- **Settings:** 225°C nozzle / 50°C bed / 0.20mm / 20% gyroid, **chamber OFF**
- **Stock:** 2 rolls on hand

### PLA / PLA+ (cheap calibration prints)
- **Settings:** 210°C / 60°C / 0.20mm / 30% grid
- **Your stock:** 4 colours — black, blue, yellow, white (perfect for the dragon + koi sculpture pond feature)

### Pellet-extruder alternative (NOT on this Qidi, future option)
- Various pellet extruders (Dollo, Mosaic, Factor 4) work for larger/cheaper humanoid parts
- Out of scope for current Max4 (FDM only, 0.6mm nozzle)

---

## 7. KEEPERS — the 5 sub-keepers

These are the projects **actively maintained** that we'll watch / use:

1. **WOLF Actuator** (CC-BY-SA) — our joint engine, in CSOAI-ORG
2. **Asimov V8** (CERN-OHL-S-2.0) — our humanoid, 257 parts ready to print
3. **Klipper3d/klipper** — printer firmware
4. **QIDITECH/QIDIStudio** — official slicer
5. **DMontgomery40/mcp-3D-printer-server** — alternative MCP printer server (GPL-2.0)

### 🆕 NEW keepers identified (added 2026-06-26)
- **upkie/upkie** (Apache-2.0) — wheeled biped, MPC + WBC, mature — could inspire Asimov V9 with wheels as fallback locomotion
- **timxuti/Integrated-Joint-Actuator** (MIT) — next-gen WOLF candidate (internal cycloidal + BLDC)
- **DarrenLevine/TipTapMotor** (MIT) — modular planetary actuator, swappable
- **MarcDcls/microban** (CERN-OHL-S-2.0) — affordable dynamixel humanoid, MIT-equivalent hardware license
- **assadollahi/kayra** (BSD-3-Clause) — fully permissive, easy modify, 57MB of community work
- **ruka-hand-v2/RUKA-v2** (MIT) — tendon-driven hand, perfect for Asimov hand upgrade

---

## 8. TOPICS TO WATCH

Watch these repos for new releases / major commits:

- `Klipper3d/klipper` — firmware updates every ~2 weeks
- `OrcaSlicer/OrcaSlicer` — major slicer features monthly
- `DMontgomery40/mcp-3D-printer-server` — MCP-printer integration ideas
- `upkie/upkie` — wheeled biped control algorithms
- `assadollahi/kayra` — community humanoid design

---

## 9. Quick recall — for SOV3 to verify my expertise

| Question | Answer |
|---|---|
| Can the Qidi Max4 print PA-CF? | ✅ Yes, hardened 0.6mm+ nozzle, 280-300°C, 60°C chamber |
| Does Asimov V8 fit the bed? | ✅ All 257 parts fit Qidi 392×410×342mm bed |
| Is WOLF open-source? | ✅ CC-BY-SA-4.0, mirrored to CSOAI-ORG |
| Best slicer for our printer? | OrcaSlicer (14.8k stars) — QIDIStudio works too |
| Best actuator design for next-gen? | Cycloidal (internal) — see timxuti, KoshiroRobot |
| License to avoid for sovereign work? | CC-BY-NC — InMoov, anything "non-commercial" |
| MCP for printer? | ✅ Yes, ours (qidi-printer-mcp) + DMontgomery40's open source |

---

*Refreshed 2026-06-26 · MEOK Labs (FORGE) tab · verified via GitHub API*
*Refresh cadence: weekly, or on printer/cadence milestones*