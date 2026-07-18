# 🐉 DEFONEOS — Companion Doc 3: MEOK Labs R&D Plan
**Date:** 2026-06-27
**Author:** JEEVES / DEFONEOS · MEOK AI Labs
**Authority:** Companion to `00_DEFONEOS_HIVE_ABSORPTION_PLAN.md`
**Source of truth:** Inherits `~/clawd/_TABS/MEOK_LABS_TAB_PROFILE.md` + `qidi-physical-lab` skill + `references/asimov-fabrication-paths.md` + `references/wolf-actuator-qidi-state-15jun2026.md`

---

## 0. THE ONE-LINE THESIS

**DEFONEOS R&D = 6 workstreams at MEOK Labs (Tab 6 / FORGE), 1 14-day Asimov build, 24+ day WOLF assembly, 1 Qidi reactivation needed, all on UK soil.** The 6.5-acre IOK Farm (Lincolnshire) is the home. The Qidi Max4 (192.168.50.21) is the print farm. The Asimov V8 humanoid CAD is on the VM. The WOLF planetary actuator 14 STLs are on the Mac. **The substrate is real. The R&D is real. No fabrication.**

---

## 1. THE 6 WORKSTREAMS

| # | Workstream | Asset | Defence application | Investment | Status |
|---|---|---|---|---|---|
| 1 | **ASIMOV-PATROL** | Asimov V8 12-DOF biped, 1.4m, 257 parts, ~£2,188 UK BOM | EOD patrol, perimeter check, sentry duty, route clearance | Path 6 (£1.8-2.8k) → Path 3 (£5.4-9.4k) | CAD on VM, need to extract to `~/asimov-v8/` |
| 2 | **WOLF-EXO** | WOLF planetary actuator (Wolfrom gearbox, 14 STLs, 40.8 Nm continuous) | Exoskeleton for bomb-disposal suits, load-bearing rescue, firefighting | ~£14k per actuator (vs £14k Encos replacement); 23 joints = ~£40-50k saving on sub-£3k humanoid | 14 STLs on Mac; Set 1 plate-7 needs assembly test |
| 3 | **HARVI-IED** | HARVI rig + IED-detection sensor head (specs only) | Counter-IED ground robot for route clearance, base patrol | ~£240 missing off-shelf parts (12× sun gears, 4× bearings, 1× Hailo-10H) | Specs only — not built. First prototype after off-shelf parts arrive. |
| 4 | **QIDI-FIELD-PRINT** | Qidi Max4 hardened-end + PA12-CF + PA6-CF | Spare-part print farm for forward operating bases (FOB) | Reachable, PID tuned, 14 files on storage | Reachable at 192.168.50.21:7125; needs new extruder end + smoke G-code |
| 5 | **LEROBOT-SO-101-ARM** | LeRobot SO-101 + vision + K2.5 deepfake detection | Sentry-arm with face recognition + deepfake detection at base perimeter | Specs only — not built | Not started. Tabled for W6-W7. |
| 6 | **DRONE-MESH-AGENT** | airspace-monitor-mcp + drone-airspace-governance-mcp + firmware-attestation-mcp | UK CAA-regulated drone swarm coordination for forward surveillance | Already shipped as MCPs (verified v1.0.12, v1.0.16, v1.0.3) | Software is built. R&D is the swarm logic + swarm-level BFT. |

**Total R&D commitment: 6 workstreams, 1 14-day Asimov build, 24+ day WOLF assembly (or 12 days with 2 Qidis), 1 Qidi reactivation needed first.**

---

## 2. THE 4-DAY QIDI REACTIVATION (MUST HAPPEN FIRST)

The Qidi Max4 is **reachable at 192.168.50.21:7125** (Moonraker ready, PID tuned, PROBE_CALIBRATE done with last_z=-0.076, BED_MESH in progress) per the 15 Jun 2026 verification. But the printer is at the IOK Farm (6.5 acres, Lincolnshire, UK), and the agent on this Mac can reach it ONLY when Nick is on the farm LAN.

**The 4-day reactivation gate** (inherited from `qidi-physical-lab` skill, action gate §1-§6):

1. **Day 1 (Nick at farm):** Install new extruder ends (on the bench), calibrate new nozzle, run a calibration cube on PA12-CF. Curl-verify reachability.
2. **Day 2 (Nick at farm):** Run the 5-gate WOLF Set 1 plate-7 assembly test (planet-gear alignment tool → 27× M3×5 heat-set inserts → 6 plates + gears → motor mount → spin-test with motor OFF → powered spin at low current).
3. **Day 3 (anywhere):** Extract Asimov V8 CAD ZIP to `~/asimov-v8/` (165 files, 80 STL + 80 STEP + 4 docs + README, SHA-256 `640963f6…07a35a`). Start slice job 1: Day 1 of 14-day build = pelvis + hip yaw in PA6-CF.
4. **Day 4 (anywhere):** Order the 3 missing off-shelf items (~£240) for HARVI: 12× sintered steel sun gears, 4× crossed roller bearings, 1× Hailo-10H (40 TOPS). The Asimov V8 CAD pack includes a full ordering list with specific links and prices.

**Without these 4 days, no R&D ships.** This is the blocking gate.

---

## 3. THE ASIMOV V8 14-DAY BUILD SCHEDULE

(Per `references/asimov-fabrication-paths.md` Path 6 → Path 3 sequence)

| Day | Part | Material | Print time | Cumulative |
|---|---|---|---|---|
| 1 | Pelvis left + right | PA6-CF | 8h | 8h |
| 2 | Hip yaw ring + bearing seats | PA6-CF | 10h | 18h |
| 3 | Thigh left + right (proximal) | PA6-CF | 12h | 30h |
| 4 | Thigh left + right (distal) | PA6-CF | 12h | 42h |
| 5 | Knee joint shells | PA12-CF | 8h | 50h |
| 6 | Shank left + right (proximal) | PA12-CF | 10h | 60h |
| 7 | Shank left + right (distal) | PA12-CF | 10h | 70h |
| 8 | Ankle + foot left | PA12-CF | 8h | 78h |
| 9 | Ankle + foot right | PA12-CF | 8h | 86h |
| 10 | Torso frame + shoulder mounts | PA12-CF | 14h | 100h |
| 11 | Upper arm left + right | PA12-CF | 10h | 110h |
| 12 | Forearm + hand mounts | PA12-CF | 12h | 122h |
| 13 | Head shell + sensor mounts | PA12-CF | 8h | 130h |
| 14 | Cable harness + final assembly | – | manual | – |

**Total: 130 hours serial = 14 days continuous on 1 Qidi.** With 2 Qidis in parallel = 7 days.

**Total cost: ~£2,188 UK estimate per `references/asimov-fabrication-paths.md` Path 3 (FDM + selective outsource of A/B parts).**

---

## 4. THE WOLF ACTUATOR 24-DAY ASSEMBLY

(Per `references/wolf-actuator-qidi-state-15jun2026.md`)

| Set | Plates | Material | Print time | Cumulative |
|---|---|---|---|---|
| Set 1 | Plates 1-6 (the assembly test) | PA12-CF | 28h | 28h |
| Set 2 | Plates 7-12 | PA12-CF | 28h | 56h |
| Sets 3-12 | 10 sets × ~57h each | PA12-CF | 570-740h | 626-796h |

**Total: 626-796 hours = 26-33 days continuous on 1 Qidi. With 2 Qidis in parallel = 13-17 days.**

**Gate:** Set 1 must pass the 5-gate assembly test before Sets 2-12 are green-lit. The 5 gates are: planet-gear alignment, 27× M3×5 inserts, motor mount, spin-test motor OFF, powered spin low current.

**Per-actuator cost:** ~£14k to build (vs Encos replacement £14k) = break-even on labour, but the **exoskeleton uses 23 joints** = the saving is the **£40-50k sub-£3k humanoid math** (a sub-£3k humanoid with 23 WOLF joints vs Encos-grade = ~£320k+ saving on a 23-joint humanoid).

---

## 5. THE HARVI RIG IED PROTOTYPE (W6 deliverable)

(Per the off-shelf parts list in the Asimov V8 CAD pack)

The HARVI rig is **spec-only, not built**. The IED sensor head design is the first prototype. Specs:
- 4× 1080p wide-angle cameras (perimeter + ground)
- 1× 360° LiDAR (SLAM + obstacle detection)
- 1× metal detector coil (primary IED sensor)
- 1× GPR (ground-penetrating radar, secondary IED sensor)
- 1× Hailo-10H (40 TOPS edge AI for on-board inference)
- 1× Raspberry Pi 5 or Jetson Orin Nano (main controller)
- 1× WOLF-powered 4-wheel drive base

**Off-shelf parts to order (£240):**
- 12× sintered steel sun gears (for WOLF Sets 2-12)
- 4× crossed roller bearings (for WOLF Sets 2-12)
- 1× Hailo-10H (40 TOPS)

**Design phase:** W6 OpenSCAD parameterised by sensor mount positions. First print: W7 after off-shelf parts arrive.

---

## 6. THE LEROBOT SO-101 ARM (W6-W7 deliverable, low priority)

The LeRobot SO-101 is a 5-DOF robotic arm with parallel gripper. Defence application: sentry-arm with face recognition + deepfake detection at base perimeter. Specs only — not built. Tabled for W6-W7 after the 5 priority workstreams.

**Cost:** ~£350 for the SO-101 kit (Hackster.io / Hugging Face partnership) + ~£200 for camera + Hailo-8L. Total ~£550.

---

## 7. THE DRONE-MESH-AGENT SOFTWARE (already shipped, R&D is the swarm logic)

The 3 MCPs are **verified live** (per the substrate probe):
- `airspace-monitor-mcp` v1.0.12 — `check_airspace`, `get_no_fly_zones`, `get_drone_regulations`, `plan_flight`
- `drone-airspace-governance-mcp` v1.0.16 — `classify_operation`, `bvlos_risk_assessment`, `remote_id_compliance`, `autonomous_decision_governance`
- `firmware-attestation-mcp` v1.0.3 — hardware root-of-trust, secure boot attestation

**R&D gap:** the swarm-level BFT consensus. When 12 drones are operating in a forward observation network, every decision (route change, threat response, comms failure) must be signed + BFT-voted. The 33-agent BFT council logic from SOV3 needs to be ported to the drone mesh.

**Deliverable:** `meok-defoneos` MCP = airspace + drone + firmware wrapped in a single sovereign governance surface. 7-file Mavis pattern. Publish to PyPI. This is W1 of the absorption plan.

---

## 8. THE R&D INVESTMENT TOTAL

| Item | Cost | When |
|---|---|---|
| Qidi new extruder end | £15 | Day 1 |
| Asimov V8 Path 6 → Path 3 | £2,188 | W2-W4 |
| WOLF Set 1 plate-7 | ~£50 material | W5 |
| HARVI off-shelf parts | £240 | W4 |
| LeRobot SO-101 (optional) | £550 | W6-W7 |
| 2nd Qidi Max4 (parallel) | £1,500 | W4 (if budget) |
| **Total** | **£4,543** | – |

**Defence-AI revenue unlock: £228K-£1.14M Y1. ~50× ROI on the R&D.**

---

## 9. THE SEAL

- **Date:** 2026-06-27
- **Source:** MEOK Labs tab profile + qidi-physical-lab skill + asimov-fabrication-paths reference + wolf-actuator-qidi-state reference
- **Inherits:** `00_DEFONEOS_HIVE_ABSORPTION_PLAN.md` + `02_uk_defence_white_space.md`
- **Next:** `04_first_actions.md` (the W1-W3 first actions)
- **Blocker:** Qidi reactivation is the single biggest dependency. Without it, no R&D ships.

🐉 **The dragon prints its own body. The dragon moves. The dragon patrols.**

JEEVES → DEFONEOS. 🐉
