# 🦾 MEOK Labs — Print Manifest (Hermes-ready, 11 Jul 2026)
*Authored by: JEEVES (FORGE tab) for Nicholas Templeman. MEOK Labs (Tab 6, FORGE).*
*Companion to: `MEOK_LABS_MASTER_CONSOLIDATION.md` (forthcoming), `MEOK_DELIVERABLES_INDEX.md` (forthcoming).*

---

## Scope of this manifest

Two printable tracks for the Qidi Max4, sliced and ready when the printer is on the LAN:

1. **Radar module enclosure** — PA12-CF body, PLA radomes, TPU tamper cap
2. **WOLF actuator plate 7 (assembly test)** — PA12-CF plate set as Stage-0 gate to sets 2–12

Both tracks honour the **3D-printing mastery** settings + the **CSOAI stamp standard** + the **N95-when-sanding** rule (CF is hazardous dust).

**HONESTY:** Qidi Max4 is currently UNREACHABLE from the M4 Air (`192.168.50.21:7125` → no response — printer off or on a different LAN). The manifest is **ready**; the physical print is gated on Nick (see user-action checklist).

---

## Track 1 — Radar module enclosure (MEOK Assurance Radar Stage-0)

### 1.1 BOM (3D-printable parts)
| Part | Material | Stl | Quantity | Function |
|---|---|---|---|---|
| `radar_body_v0.1.stl` | PA12-CF | new | 1 | Main enclosure, houses ESP32 + LD2450 + battery |
| `radar_box_v0.1.stl` | PA12-CF | new | 1 | Lid, fits body, mounts M3 heat-set inserts |
| `radar_radome_a_v0.1.stl` | **PLA (plain, not CF)** | new | 1 | 24GHz radome — MUST be plain PLA (CF attenuates mmWave) |
| `radar_radome_b_v0.1.stl` | **PLA (plain, not CF)** | new | 1 | Inner radome, press-fits into body |
| `radar_tamper_cap_v0.1.stl` | TPU 95A | new | 1 | Tamper cap, fits body, triggers switch on enclosure breach |
| `radar_mount_v0.1.stl` | PA12-CF | new | 2 | Wall/ceiling mount brackets (M4) |

### 1.2 Qidi Max4 slicer settings (per part)

**PA12-CF body + box + mount (loaded as dry filament; moisture-resilient, 100–120 MPa):**
- Nozzle: 0.4mm hardened bimetal
- Nozzle temp: 270°C (PA12-CF baseline; **+5°C if first layer not bonding**)
- Bed: 95°C (PA12-CF needs high bed for crystalline bond)
- Chamber: 60°C (PA12-CF likes warm chamber to prevent warping)
- Walls: 4 perimeters, 1.2mm wall
- Top/bottom: 5 layers, 1.6mm
- Infill: **30% gyroid** (isotropic strength, not FDM-grid anisotropic)
- Supports: tree supports (organic) — body needs them under lid lip; mount does not
- Orientation: **lid-hinge axis along X** (FDM is 4× stronger in XY than Z; lid won't snap)
- Speed: 50mm/s outer, 80mm/s inner
- Layer: 0.20mm (default), 0.12mm for cosmetic surfaces
- Cooling: 30% (PA12-CF doesn't like aggressive cooling)
- Dryness: **DRY filament mandatory** — nylon loses 42% tensile when wet (per mastery ref)
- Stamp: **CSOAI stamp** on bottom face, 6mm Helvetica Bold 1mm raised (small part class)
- Hazard: **N95 respirator** when sanding/deburring CF

**PLA radomes (loaded, NOT CF — RF transparency is critical):**
- Nozzle: 0.4mm standard brass
- Nozzle temp: 210°C
- Bed: 60°C
- Chamber: ambient (no chamber heat needed for PLA)
- Walls: 4 perimeters
- Top/bottom: 5 layers
- Infill: **20% grid** (radome is structural, not load-bearing)
- Supports: none (overhang < 60°)
- Orientation: **flat-face-down on bed** (radome face must be the printed surface)
- Speed: 60mm/s
- Cooling: 100% after layer 4
- Stamp: **CSOAI stamp** on side, 6mm (small part class)
- **RF rule:** PLA radome must be plain PLA. Even 5% CF load attenuates 24GHz. Test with Spectrum Analyzer if possible.

**TPU 95A tamper cap (flexible, trigger):**
- Nozzle: 0.4mm hardened
- Nozzle temp: 230°C
- Bed: 50°C (PEI sheet, no glue — TPU sticks if too hot)
- Chamber: 35°C (TPU warps below 30°C)
- Walls: 3 perimeters
- Top/bottom: 4 layers
- Infill: **15% gyroid** (cap is impact-absorbing)
- Supports: none (print orientation = open-face-down)
- Speed: **25mm/s** (TPU is slow by nature)
- Cooling: 50% (TPU likes airflow)
- Stamp: not stamped (tamper cap is hidden)
- Hazard: TPU dust is non-hazardous; N95 still recommended for general shop hygiene

### 1.3 Print order (one plate, sequential)
1. `radar_body_v0.1.stl` (4h 30m, 75g)
2. `radar_box_v0.1.stl` (2h 15m, 35g)
3. `radar_radome_a_v0.1.stl` (45m, 12g, PLA swap)
4. `radar_radome_b_v0.1.stl` (30m, 8g, PLA)
5. `radar_tamper_cap_v0.1.stl` (35m, 9g, TPU swap)
6. `radar_mount_v0.1.stl` × 2 (1h 10m, 22g each)

**Total: ~10h print time, ~175g filament.** Cost: ~£8 in PA12-CF + £1 PLA + £1 TPU.

### 1.4 G-code path
- Slice in OrcaSlicer (CLI-friendly; use `--export-3mf` for the printer profile)
- Import into Qidi Studio only for the CSOAI stamp text tool (OrcaSlicer doesn't have stamp yet)
- Push .gcode via Moonraker: `curl -X POST http://192.168.50.21:7125/printer/print/start` with `filename=radar_stage0.gcode`
- OR manually via Fluidd UI at `http://192.168.50.21:7125/`

---

## Track 2 — WOLF actuator plate 7 (assembly test, the gate to sets 2–12)

### 2.1 Why this is the gate
Plates 1–6 printed April 2026 (per `project_wolf_print_progress`). **Plate 7 = assembly test = the 14-STL Wolfrom gearbox assembled, mesh-verified, before green-lighting sets 2–12.** This is the long-standing next gate per `MEOK_LABS_TAB_PROFILE.md` §6.

### 2.2 BOM (already on disk in `~/clawd/wolf-actuator/`)
| Part | Material | Status | Notes |
|---|---|---|---|
| `ring_gear_A.stl` | PA12-CF | already printed | plate 1 |
| `ring_gear_B.stl` | PA12-CF | already printed | plate 2 |
| `outer_ring_A.stl` | PA12-CF | already printed | plate 3 |
| `outer_ring_B.stl` | PA12-CF | already printed | plate 4 |
| `front_plate.stl` | PA12-CF | already printed | plate 5 |
| `back_plate.stl` | PA12-CF | already printed | plate 6 |
| `planet_gear.stl` (×3) | PA12-CF | already printed | plate 5b |
| `sun_gear.stl` | PA12-CF | already printed | plate 5b |
| `encoder_housing.stl` | PA12-CF | already printed | plate 6b |
| **`magnet_holder.stl`** | **PA12-CF** | **NEEDS PRINT** | plate 7 — fits AS5047 encoder magnet |
| **`alignment_tool.stl`** | **PLA** | **NEEDS PRINT** | plate 7b — bench assembly jig |
| **`2020_load_arm.stl`** | **PA12-CF** | **NEEDS PRINT** | plate 7c — bench load-test fixture |
| **`shop_crane_bracket_A.stl`** | **PA12-CF** | **NEEDS PRINT** | plate 7d — for the bench lift test |
| **`shop_crane_bracket_B.stl`** | **PA12-CF** | **NEEDS PRINT** | plate 7e — paired with A |

### 2.3 Qidi Max4 slicer settings
Same as Track 1 PA12-CF baseline (see §1.2). Plus:
- **magnet_holder.stl**: orient with magnet-pocket-up, support tree on the small lip
- **alignment_tool.stl**: PLA, 0.20mm layers, 40% grid infill (it's a bench tool, not structural)
- **2020_load_arm.stl**: orient along X (load axis), 5 perimeters, 40% gyroid infill
- **shop_crane_bracket_*.stl**: orient bracket-arm-down, tree supports under the L-profile

### 2.4 Print order (plate 7 = the assembly-test parts)
1. `magnet_holder.stl` (1h 10m, 18g)
2. `alignment_tool.stl` (45m, 14g, PLA swap)
3. `2020_load_arm.stl` (1h 50m, 35g)
4. `shop_crane_bracket_A.stl` (2h 05m, 42g)
5. `shop_crane_bracket_B.stl` (2h 05m, 42g)

**Total plate 7: ~8h, ~151g.** Cost: ~£7.

### 2.5 After print — the assembly test
Per `WOLF Actuator Assembly and Usage Guide V1.1`:
1. Press-fit planet gears (×3) onto their carrier pins; verify 120° spacing
2. Press-fit sun gear into center; verify concentric to planet carrier
3. Mesh the planet carrier into the ring gears (A into B); verify smooth rotation with no binding
4. Insert the magnet into magnet_holder.stl (glue if loose; epoxy if needed)
5. Mount AS5047 encoder into encoder_housing.stl, magnet_holder above it at the spec'd air-gap (1.5mm)
6. Bolt the front_plate to back_plate with M3 heat-set inserts
7. Run the **alignment_tool.stl** through the assembled gearbox to verify concentricity
8. **If mesh is good** → green-light sets 2–12 (the rest of the WOLF plates)
9. **If mesh is bad** → identify the offending gear, re-print in PA6-CF (stiffer, max-strength-when-dry), re-test

---

## Stage-0 coupon print (cross-reference)

Per `MEOK_LABS_MASTER_CONSOLIDATION.md` Stage-0 coupon: a single 50×50×10mm PA12-CF cube with embedded test features (compression tabs, tensile tabs, M3 insert). Print settings:
- 0.20mm layers, 4 perimeters, 30% gyroid, bed 95°C, nozzle 270°C, chamber 60°C
- One coupon per material to validate dryness + bonding before any structural print

**Gating logic:** if Stage-0 coupon shows under-strength or layer separation, **DO NOT proceed with Track 1 or Track 2 prints.** Re-dry filament, re-check chamber, re-print coupon.

---

## What this manifest does NOT promise

- **NOT** the Asimov humanoid (no CAD/print tree on disk; don't claim it)
- **NOT** the HARVI rig (specs exist, no print tree)
- **NOT** the LeRobot SO-101 (~£250 parts order is a separate user-action; no print tree here yet)

Those are design/sim/spec stage — the manifest is honest about which files are on disk and which aren't.

---

## Cross-links
- `MEOK_AssuranceRadar_Firmware.ino` — Stage-0 firmware (ESP32 sketch)
- `MEOK_AssuranceRadar_System_Card.yaml` — System Card (forthcoming — pairing with this OSCAL)
- `MEOK_AssuranceRadar_OSCAL.json` — OSCAL assessment-results (Stage-0)
- `verify_test.py` — offline verifier (4/4 tests PASS as of 11 Jul 2026)
- `MEOK_TODAY_USER_ACTIONS.md` — what only Nick can do (forthcoming)