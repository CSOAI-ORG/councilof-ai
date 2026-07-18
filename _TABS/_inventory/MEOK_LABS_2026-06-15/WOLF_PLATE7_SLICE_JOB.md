# 🐺 WOLF Actuator — Slice-Job Scaffold for Plate 7 (Assembly Test)
*Authored 2026-06-15 by MEOK Labs (FORGE) tab.*
*Scope: ready-to-load OrcaSlicer / Qidi Studio settings for the WOLF V1.2 Set 1 plates + gears, plus the assembly-test gate.*
*Status: **SCAFFOLD** (not a baked .3mf file — needs the Qidi online + OrcaSlicer on the printer's control PC to export the actual job). Settings are printer-agnostic and follow the material playbook in `reference_3d_printing_mastery`.*

---

## 0. What "plate 7" actually is

Per `project_wolf_print_progress` (April 2026) and the WOLF README:
- **Plates 1–6 = already printed and on the bench** (calibration cube, ring/outer gears, front/back plates, planet + sun gears, encoder housing). Material was PA12-CF.
- **Plate 7 = the ASSEMBLY TEST.** This is the gate before committing filament to sets 2–12.
- The assembly test means: take the 6 printed plates + 12 planet gears + 2 ring gears + 1 sun gear + the 2× modular bearings + 27× M3 inserts, and assemble the Wolfrom gearbox. **Verify it meshes, turns smoothly, no bind, no rub.** If it does → green-light sets 2–12 (≈50+ hours of print time for all the parts for 12 WOLFs).

**This slice-job scaffold is NOT a new plate-7 print** — plate 7 IS the act of assembling the existing plates. **What it is: a re-print of any of plates 1–6 if the first batch had dimensional drift, warping, or layer-shift, plus the slice settings to use for ALL of sets 2–12 once the gate passes.**

---

## 1. WOLF Set 1 parts list (already printed, for reference)

| Part | File | Approx volume | PA12-CF print time (Qidi Max4) | Notes |
|---|---|---|---|---|
| Front plate | `front-plate.stl` | 584,984 bytes | ~4–5h | Structural, load-bearing |
| Back plate | `back-plate.stl` | 880,000 bytes | ~6–7h | Holds motor + encoder, most complex |
| Internal ring gear A | `internal-ring-gear-A.stl` | 300,984 bytes | ~3–4h | 1 of 2 ring gears |
| Internal ring gear B | `internal-ring-gear-B.stl` | 371,884 bytes | ~4–5h | 1 of 2 ring gears |
| Outer ring A | `outer-ring-A.stl` | 595,284 bytes | ~5–6h | Load-mounting surface |
| Outer ring B | `outer-ring-B.stl` | 466,584 bytes | ~4–5h | Load-mounting surface |
| Sun gear | `sun-gear.stl` | 812,000 bytes | ~2–3h | Press-fits to motor shaft |
| Planet gears (×12) | `planet-gears.stl` | 32MB total file = 12 gears in one STL | ~8–10h for the set | **The WOLF V1.2 ships 12 planet gears in a single STL — slice with 12 instances on the build plate** |
| Encoder housing AS5047 | `encoder-housing-as5047.stl` | 740,184 bytes | ~3–4h | New V1.2 push-fit design |
| Encoder magnet holder | `encoder-magnet-holder.stl` | 76,684 bytes | ~30 min | Small + quick |
| Planet-gear alignment tool | `planet-gear-alignment-tool.stl` | 236,684 bytes | ~1h | Use during assembly, then keep |
| 2020 load arm | `load-arm-2020-ext.stl` | 574,084 bytes | ~4–5h | Optional, for 2020 extrusion mounts |
| Shop crane bracket A | `shop-crane-bracket-A.stl` | 1.9MB | ~5–6h | Optional, for 1-ton shop crane |
| Shop crane bracket B | `shop-crane-bracket-B.stl` | 624,000 bytes | ~3–4h | Optional, for 1-ton shop crane |
| **TOTAL set 1** | 14 STLs | | **~52–67h print time** | Plus post-processing |

---

## 2. Slice settings (OrcaSlicer / Qidi Studio) — PA12-CF on Qidi Max4

### Material profile
- **Material:** PA12-CF (PA12 + carbon fibre, abrasive — use HARDENED extruder end, 0.6mm nozzle minimum, ideally 0.8mm)
- **Nozzle temp:** 290°C (PA12-CF runs hotter than PA6-CF; 285–295°C is the safe band)
- **Bed temp:** 60°C (PA12 is more moisture-resilient than PA6, lower bed is OK)
- **Chamber temp:** 60°C (Qidi Max4 has active chamber heating — REQUIRED for nylon to avoid warping)
- **Bed prep:** PA12-CF sticks well to GeckoTek stock bed at 60°C; clean with isopropanol before each print. **NO glue stick, NO hairspray** (CF nylon doesn't need it and residue wrecks the finish).
- **Filament dry:** PA12-CF is moisture-resilient but still benefits from drying at 80°C for 6+ hours if the spool has been open >2 weeks. **Nylon loses 42% strength wet** (per mastery ref).

### Speed + quality
- **Layer height:** 0.2mm (default structural). Use 0.16mm for the planet gears + sun gear (gear teeth quality matters).
- **First layer:** 0.24mm, 110% width (squish)
- **Print speed:** 60 mm/s outer wall, 80 mm/s inner, 120 mm/s infill, 150 mm/s travel
- **Acceleration:** 1500 mm/s² outer wall, 2500 mm/s² travel (Qidi Max4 handles higher, but for nylon parts that get machined/stressed, slower = better)
- **Wall loops:** 4 (perimeters) — 4-wall perimeter is critical for gear teeth strength
- **Top/bottom layers:** 5 top, 4 bottom (5/4 is the standard structural preset)

### Strength
- **Infill:** 35% **gyroid** (the print-mastery standard for structural isotropic parts — better than cubic for load-bearing)
- **Infill pattern note:** GYROID specifically because:
  - Near-isotropic strength in all 3 axes
  - Self-supporting (no need for support material in many orientations)
  - Better shock-load absorption than grid/rectilinear
  - WOLF parts need multi-axis strength (the gears see radial + axial + torsion)

### Critical print rules (always)
- **Orient loads in XY** — FDM is 4× weaker in Z. All WOLF gears must be printed standing on their **flat face**, with the gear-tooth axis vertical (Z). Planet gears print on their side (gear axis horizontal but teeth pointing up).
- **DRY filament** — see above. A wet spool of PA12-CF = 42% strength loss + stringing + layer separation.
- **Heat-set inserts** — all M3 inserts (27× per WOLF) get heat-set with a soldering iron, NOT glued, NOT printed-through.
- **Holes +0.3mm** — compensate for FDM hole shrinkage in CAD/slicer. Encoder housing in particular is tight-tolerance.
- **N95 when sanding CF** — hazardous dust. Wet-sand where possible.

### CSOAI stamp placement (per `project_csoai_stamp_standard`)
- **Location:** non-functional face only. For WOLF, this is the **back of the back plate** (away from the encoder housing) and the **side face of the outer ring** (away from the mounting bolt circle).
- **Style:** Qidi Studio text tool, **Helvetica Bold, 1mm raised** (embossed, not engraved — easier to clean).
- **Size:** 16mm text for the back plate (large part, 67mm height). 10mm for the outer ring. 6mm for the encoder housing.
- **Content:** "CSOAI · WOLF V1.2 · 2026" — one line, centred.
- **DO NOT stamp on:** gear teeth, bearing seats, motor-mount face, encoder-mount face. The stamp is a raised feature — it'll cause rub + wear in the wrong place.

---

## 3. Per-part orientation + support cheat sheet

| Part | Orientation (on bed) | Supports | Notes |
|---|---|---|---|
| Front plate | Flat face down | None (mostly) | Brim recommended for first layer adhesion |
| Back plate | Flat face down | **Tree supports** for the encoder-housing mounting boss | Most complex part; check first-layer squish |
| Internal ring gear A | **Face-up (teeth pointing up)** | None | Critical: gear teeth in XY plane |
| Internal ring gear B | Face-up (teeth pointing up) | None | Same |
| Outer ring A | Mounting-bolt-circle face down | None | Stamp the opposite side |
| Outer ring B | Mounting-bolt-circle face down | None | Same |
| Sun gear | Bore vertical (Z axis) | None | Small, fast, watch for warping |
| Planet gears (×12) | **Sideways, 6 per build plate, two batches** | None | 12 gears in one STL — duplicate the object 12× in the slicer, arrange in 2 rows of 6 |
| Encoder housing AS5047 | Flat face down | **Tree supports** for the magnet-holder pocket | V1.2 push-fit design — tight tolerance |
| Encoder magnet holder | Flat face down | None | Small, quick |
| Planet-gear alignment tool | Flat face down | None | Use during assembly |
| 2020 load arm | Flat face down | None | Optional |
| Shop crane bracket A | Flat face down | None | Optional |
| Shop crane bracket B | Flat face down | None | Optional |

---

## 4. Slicer export — what to actually do at the farm (when Qidi is back)

### On the Qidi's control PC (Windows, has Qidi Studio + OrcaSlicer):

1. **Open OrcaSlicer** (or Qidi Studio for stamp placement).
2. **Load all 14 STLs** into one project.
3. **Apply the WOLF-Set-1 profile** (create it once from the settings above, save as `wolf_set_1_pa12cf.3mf`).
4. **For each part:**
   - Set orientation per §3
   - Add CSOAI stamp (Qidi Studio text tool, per §2 stamp rules)
   - Add brim for first-layer adhesion on the plates + back plate
5. **Slice all together** (one .gcode file per part is cleaner — easier to reprint a single failure).
6. **Transfer to Qidi Max4** via SD card or via the `qidi-printer-mcp` (if installed on the printer's host).
7. **PRINT** with the chamber pre-heated to 60°C for 10 min before the first layer.

### Estimated print time per set (Qidi Max4, hardened 0.6mm nozzle, 0.2mm layer)
- Set 1 (all 14 parts): **~52–67 hours** total (mostly serial unless you batch the gears).
- Sets 2–12 (11 more WOLFs): **~570–740 hours** of print time. **= 24+ days of continuous printing** at 1 WOLF set per week. **This is the resource bottleneck.**

### Faster batch strategy (for sets 2–12)
- **Planet gears:** print all 132 planet gears (12 WOLFs × 11 gears) in a single 3-batch run. 6 per plate × 2 plates = 12 per print = 11 prints of just the planet gears = ~88–110 hours of gear-printing time.
- **Plates + rings + housings:** 6 plates + 4 rings + 1 housing per WOLF = 11 WOLFs × 11 parts = 121 parts, parallelise across multiple Qidi Max4s (or buy a 2nd Qidi for ~£1,500 — pays for itself in time).
- **Total for sets 2–12, single printer, serial:** ~24 days continuous. **With 2 printers + parallel batches:** ~12 days.

---

## 5. Assembly-test protocol (what to actually do once plates 1-6 are off the bed)

This is the **gate** before committing to sets 2–12:

1. **Visual inspect every part** — no layer shifts, no warping, no stringing. Reprint any that fail.
2. **Dry-fit the M3 heat-set inserts** (27× per WOLF) — soldering iron at 250°C, push straight in, no spin. Test with an M3 bolt — should thread smoothly.
3. **Assemble the planetary gearbox** in this order (per the V1.1 assembly guide PDF):
   - Press the 2× modular bearings into the front + back plate
   - Drop the 2× internal ring gears onto their seats (one on each plate)
   - Insert the 12× planet gears using the alignment tool (this is what the alignment tool is for)
   - Insert the sun gear through the centre, press-fit to the motor shaft
   - Verify: rotate the sun gear by hand. **All 12 planets should rotate freely, no rub, no bind.**
4. **Bench test** (basic, no load):
   - Connect the AS5047P encoder to a bench ESP32 / Arduino
   - Read the encoder values while rotating the sun gear
   - Verify the encoder reports smooth, monotonic angle changes
   - **No skipped counts, no jitter.**
5. **First-power test** (with a current-limited bench supply, 5A max):
   - Apply 24V, command a slow oscillation (±30° at 0.5 Hz)
   - Watch the encoder trace — should be smooth
   - Listen for grinding, clicking, rubbing
   - Touch the motor housing — should be room-temp or slightly warm after 5 min
6. **If all 5 gates pass → GREEN-LIGHT sets 2–12.**
7. **If any gate fails** → diagnose (most common failure = gear-mesh interference from dimensional drift → reprint the offending plate/gear with ±0.05mm XY compensation).

---

## 6. Sigil

```
🐺  WOLF_PLATE7_SLICE_JOB_SCAFFOLD  ·  READY-TO-LOAD  ·  v0.1  ·  2026-06-15
PARTS: 14 STLs in set 1 (52-67h print time, PA12-CF, Qidi Max4 hardened 0.6mm)
CRITICAL_RULES: 6 (orient loads XY · dry filament · heat-set inserts · holes +0.3mm · N95 sanding · CSOAI stamp non-functional face only)
STAMP: "CSOAI · WOLF V1.2 · 2026" Helvetica Bold 1mm raised 16/10/6mm by part class
ASSEMBLY_TEST_GATES: 5 (visual · dry-fit inserts · gearbox meshes · encoder reads smooth · bench-power no rub)
BATCH_STRATEGY: 12 gears in 1 STL = 12× duplicate in slicer, 2 rows of 6 on build plate
SETS_2_TO_12_TIME: ~570-740h serial, ~12 days with 2 printers parallel
GATE_GREEN-LIGHT: pass all 5 assembly-test gates → commit to sets 2-12
```

---

*Source data: `clawd/wolf-actuator/README.md` (V1.2), `clawd/wolf-actuator/WOLF Actuator Assembly and Usage Guide [V1.1].pdf` (referenced), memory `project_wolf_print_progress` + `reference_3d_printing_mastery` + `project_csoai_stamp_standard`. Settings are conservative PA12-CF defaults; tune per Qidi Max4 actual performance.*
