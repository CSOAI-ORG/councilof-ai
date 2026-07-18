# 🖨️ PRINTS QUEUE — Qidi Max4 (REAL files verified on printer)
*2026-06-27 · MEOK Labs (FORGE) tab · ready to fire*

**Printer:** Qidi Max4 @ 192.168.50.21:7125 (Moonraker)
**Status:** ✅ Ready, calibrated, 16 gcode + 50+ STL files on the printer
**Calibration done:** PID (extruder + bed), PROBE_CALIBRATE, BED_MESH_CALIBRATE (81 points, 0.85mm spread, default profile), SAVE_CONFIG persisted

---

## 📂 Files ACTUALLY on the printer (verified 2026-06-27)

### Pre-sliced gcode/3mf (ready to start immediately)
| File | Size | Purpose |
|---|---|---|
| `test_cube_pa12cf.gcode` | 408KB | **Test cube — PLA, ~20min** — fire this first |
| `01_accuracy_cube_20mm.gcode.3mf` | 33MB | Detailed accuracy test |
| `MEOK-001_hip_pitch_wolf_mount_FIXED.gcode.3mf` | 1.7MB | WOLF hip mount — first real part |
| `housing_Use Actuator Housing Profile.gcode.3mf` | 4.1MB | Actuator housing (PA12-CF) |
| `full-robot_Upper Body 1.gcode.3mf` | 27MB | Upper body — **140h print** |
| `Motor Shell - Motor Shell.gcode.3mf` | 10.4MB | Motor housing |
| `3DBenchy.gcode.3mf` | 692KB | Test boat |
| `Corn.gcode.3mf` | 4.5MB | Decorative |
| `Box 9x10x5.gcode.3mf` | 262KB | Box test |
| `Claw3.gcode.3mf` | 1.4MB | Gripper test |
| `Voron Cube.gcode.3mf` | 379KB | Cube test |
| `Phone holder.gcode.3mf` | 366KB | Holder test |
| `Hot bed nut wrench.gcode.3mf` | 440KB | Wrench |
| `Thicker Filament holder.gcode.3mf` | 1.7MB | Spool holder |
| `carrot.gcode.3mf` | 2.4MB | Carrot shape |
| `switch fidget.gcode.3mf` | 314KB | Fidget |

### Raw STLs (need to slice before printing)
| Part | STL file | Material | Use |
|---|---|---|---|
| Front plate | `front-plate.stl` | PA12-CF | WOLF gearbox |
| Back plate | `back-plate.stl` | PA12-CF | WOLF gearbox |
| Internal ring A | `internal-ring-gear-A.stl` | PA6-CF | WOLF ring gear |
| Internal ring B | `internal-ring-gear-B.stl` | PA6-CF | WOLF ring gear |
| Sun gear | `sun-gear.stl` | PA6-CF | WOLF center |
| Planet gears | `planet-gears.stl` | PA6-CF | 12 WOLF planet gears |
| Outer ring A | `outer-ring-A.stl` | PA12-CF | WOLF housing |
| Outer ring B | `outer-ring-B.stl` | PA12-CF | WOLF housing |
| Encoder housing | `encoder-housing-as5047.stl` | PA12-CF | WOLF encoder |
| Encoder magnet holder | `encoder-magnet-holder.stl` | PA12-CF | AS5047 magnet |
| Pelvis link | `pelvis_link.STL` | PA6-CF | Asimov V8 |
| Hip yaw links (L+R) | `left/right_hip_yaw_link.STL` | PA6-CF | Asimov V8 |
| Hip pitch links (L+R) | `left/right_hip_pitch_link.STL` | PA6-CF | Asimov V8 |
| Hip roll links (L+R) | `left/right_hip_roll_link.STL` | PA6-CF | Asimov V8 |
| Knee links (L+R) | `left/right_knee_link.STL` | PA6-CF | Asimov V8 |
| Ankle pitch links (L+R) | `left/right_ankle_pitch_link.STL` | PA6-CF | Asimov V8 |
| Ankle roll links (L+R) | `left/right_ankle_roll_link.STL` | PA6-CF | Asimov V8 |
| Ankle connecting rod | `ankle_connecting_rod.stl` | PA6-CF | Asimov V8 |
| Toe links (L+R) | `left/right_toe_link.STL` | PA6-CF | Asimov V8 |
| Ankle crossbar | `ankle_crossbar.stl` | PA6-CF | Asimov V8 |
| Ankle crank arm | `ankle_crank_arm.stl` | PA6-CF | Asimov V8 |
| Hip linkage A/B/C | `hip_linkage_A/B/C.stl` | PA6-CF | Asimov V8 |
| Hip connector | `hip_connector.stl` | PA6-CF | Asimov V8 |
| TPU SEA disc | `tpu_sea_disc.stl` | TPU 95A | Series elastic actuator |
| Alignment tool | `planet-gear-alignment-tool.stl` | PLA | Assembly jig |
| Tensile test | `06_dogbone_tensile.stl` | PLA | Material test |
| Bolt test | `02_bolt_test_block.stl` | PLA | Print test |
| Bridge span | `03b_bridge_span.stl` | PLA | Print test |
| Bridge pillar | `03a_bridge_pillar.stl` | PLA | Print test |
| Layer adhesion bar | `04_layer_adhesion_bar.stl` | PLA | Print test |
| Bearing fit cylinder | `05_bearing_fit_cylinder.stl` | PLA | Print test |
| Test cube 30mm PA12CF | `test_cube_PA12CF_30mm.stl` | PA12-CF | Material test |
| Test cube 40mm | `test_cube_40mm.stl` | PLA | Print test |

---

## ✅ Recommended print order (start now)

| Step | File | Material | Time | Why |
|---|---|---|---|---|
| **1** | `test_cube_pa12cf.gcode` | PA12-CF | ~20min | **Verify new end + bed adhesion** — this is the gate |
| 2 | `01_accuracy_cube_20mm.gcode.3mf` | PA12-CF | ~2h | Detailed dimensional check |
| 3 | `MEOK-001_hip_pitch_wolf_mount_FIXED.gcode.3mf` | PA12-CF | ~1.5h | First real WOLF part |
| 4 | Slice `front-plate.stl` in QIDIStudio → PA12-CF | PA12-CF | ~5h | WOLF front plate |
| 5 | Slice `back-plate.stl` → PA12-CF | PA12-CF | ~7h | WOLF back plate |
| 6 | Slice `internal-ring-gear-A.stl` + `B.stl` → PA6-CF | PA6-CF | ~9h | WOLF ring gears (anneal after) |
| 7 | Slice `sun-gear.stl` → PA6-CF | PA6-CF | ~3h | WOLF sun gear |
| 8 | Slice `planet-gears.stl` (×12) → PA6-CF | PA6-CF | ~10h | All planet gears |
| 9 | Slice `outer-ring-A.stl` + `outer-ring-B.stl` → PA12-CF | PA12-CF | ~11h | WOLF housing rings |
| 10 | Slice `encoder-housing-as5047.stl` → PA12-CF | PA12-CF | ~4h | Encoder housing |
| 11 | Slice `encoder-magnet-holder.stl` → PA12-CF | PA12-CF | ~1h | Magnet holder |
| 12 | Slice `planet-gear-alignment-tool.stl` → PLA | PLA | ~1h | Assembly jig |
| **13** | **ASSEMBLE WOLF UNIT 1** | — | ~3h | The gate — verify meshing |
| 14 | Slice Asimov V8 pelvis + hip links → PA6-CF | PA6-CF | ~30h | Asimov V8 structural |
| 15 | Slice Asimov V8 legs (knee, ankle) → PA6-CF | PA6-CF | ~40h | Asimov V8 legs |
| 16 | Slice Asimov V8 arm structure → PA12-CF | PA12-CF | ~10h | Asimov V8 arms |
| 17 | Slice TPU pads → TPU 95A | TPU | ~3h | TPU foot pads |
| 18 | **Anneal PA6-CF parts** (130°C oven × 2hr) | — | ~4h | Strengthens structural |

**Total estimate: ~140h serial = ~6 days on 1 printer**

---

## 🎯 Critical settings to verify before each print

| Material | Nozzle | Bed | Layer | Infill | Notes |
|---|---|---|---|---|---|
| **PLA** | 210-220°C | 60°C | 0.20mm | 30% grid | Standard, easy |
| **PA12-CF** | 280°C | 100°C | 0.16mm | 30% gyroid | Chamber 55°C, dry filament |
| **PA6-CF** | 300°C | 110°C | 0.16mm | 40% gyroid | Chamber 60°C, anneal after |
| **TPU 95A** | 225°C | 50°C | 0.20mm | 20% gyroid | Chamber OFF, slow speeds |

**Bed prep:** IPA wipe before every print, dry filament for CF/PETG
**First layer check:** lines squished smooth = good, balling = Z too high, no sticking = Z too low
**Babystep Z during layer 1** if needed

---

## 🛟 Troubleshooting cheat sheet

| Symptom | Cause | Fix |
|---|---|---|
| Lines not sticking | Z too high, dirty bed, no glue (PLA on PEI) | Babystep Z down -0.05mm, IPA wipe |
| Lines too squished | Z too low | Babystep Z up +0.05mm |
| Layer shift | Belt tension, acceleration too high | Lower accel to 1500 mm/s² |
| Stringing | Wet filament, temp too high | Dry filament 70°C×8h, drop temp 5°C |
| Nozzle clog | Cold pull, hardened end clean | Heat 250°C, extrude 50mm, cool to 90°C, pull |
| Bed mesh not used | Probe state stuck | `ABORT` then `SAVE_CONFIG` |
| WIFI drops | Print continues offline, reconnect | `printer_status` re-establishes |

---

## 🔌 Programmatic access

```bash
# Check printer state
cd ~/clawd/mcp-marketplace/qidi-printer-mcp
QIDI_PRINTER_IP=192.168.50.21 python3 -c "
import os; os.environ['QIDI_PRINTER_IP']='192.168.50.21'
from server import mcp
import asyncio, json
r = asyncio.run(mcp.call_tool('printer_status', {}))
print(json.loads(r[0].text))
"
```

10 tools available: `printer_status`, `get_temperatures`, `list_files`, `start_print`, `pause_print`, `resume_print`, `cancel_print`, `send_gcode`, `preheat`, `print_progress`.

---

*Last verified 2026-06-27 · MEOK Labs (FORGE) tab · printer calibrated and ready*
*Refresh: any time you load new STLs onto the Qidi*