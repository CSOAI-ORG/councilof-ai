# MEOK Assurance-Radar — Print Manifest (QIDI Max4)

**For Hermes / the printer operator.** Every radar STL below, with QIDI Max4 slicer settings per
part. The agent cannot reach the printer (LAN-only `192.168.50.21:7125`) — this manifest is what
lets you slice and print directly.

> **RF RULE — non-negotiable:** the **radome windows MUST be printed in plain PLA or silk PLA**
> (RF-transparent). **Never print a radome in PA12-CF / PA6-CF** — carbon fibre is conductive and
> will attenuate the 24 GHz antenna signal. Structural bodies/boxes are PA12-CF; windows are PLA.

## Filament assignment

| Part | Material | Why |
|---|---|---|
| Case body / ground box / humanoid module | **PA12-CF** | stiff, dimensionally stable structural shell |
| Radome windows (both) | **plain PLA or silk PLA** | RF-transparent — must not block 24 GHz |
| Tamper cap | **TPU** | flexible, shows tamper, grips the cable slot |

## Per-part slicer settings

### 1. Single-unit case body — `MEOK_radar_case_body.stl` (65×22×11 mm, 6.1 cm³) · PA12-CF
- Nozzle **290 °C**, bed **60 °C**, **hardened steel nozzle required** (CF is abrasive; 0.4 mm)
- Layer **0.2 mm**, walls **4**, top/bottom **5**, infill **25 % gyroid**
- Orientation: **tray floor on the bed, open front up** (antenna aperture faces up)
- Supports: **none needed** (standoffs are short posts; ears are on-bed)
- Dry the filament: PA12-CF absorbs moisture — 8 h @ 70 °C before printing

### 2. Radome window — `MEOK_radar_radome_PLA.stl` (46.6×17.6×1.0 mm, 0.8 cm³) · **PLA**
- Nozzle **210 °C**, bed **55 °C**, 0.4 mm
- Layer **0.16 mm**, walls **3**, infill **100 %** (thin solid window)
- Orientation: **flat on the bed**; no supports
- Thin part — use a brim (5 mm) for bed adhesion

### 3. Tamper cap — `MEOK_radar_tamper_cap_TPU.stl` (10×10×3 mm) · TPU
- Nozzle **230 °C**, bed **40 °C**, 0.4 mm, **slow (20 mm/s)**
- Layer **0.2 mm**, walls **3**, infill **30 %**; no supports; direct-drive recommended

### 4. Humanoid-attachable module — `MEOK_radar_humanoid_module.stl` (50×21×13.8 mm, 4.8 cm³) · PA12-CF
- Same PA12-CF profile as #1 (290/60, hardened nozzle, 0.2 mm, 4 walls, 25 % gyroid)
- Orientation: **dovetail rail flat on the bed, cavity up** — prints the dovetail cleanly, no supports
- The dovetail is the robot-chassis mount; keep it support-free for a clean slide fit

### 5. Ground / vehicle box — `MEOK_radar_ground_vehicle_box.stl` (116×70×32 mm, 48.7 cm³) · PA12-CF
- Same PA12-CF profile; walls **4**, infill **30 %** (larger, load-bearing)
- Orientation: **open front up, mount ears on the bed**
- Supports: **tree supports under the mount ears and cable-gland boss only** (overhang there)
- Longest print (~48 cm³) — budget ~4–5 h; ensure filament is dried

### 6. Ground radome — `MEOK_radar_ground_radome_PLA.stl` (49×25×1.2 mm, 1.5 cm³) · **PLA**
- Same PLA profile as #2 (210/55, 0.16 mm, 100 % infill, brim, flat, no supports)

---

## v2 — R&D-refined enclosures (recommended; supersede parts #4–#6)

The v2 bodies are chamfered (faceted def-tech look + fillets that stop layer-line cracking),
ribbed (≈7× stiffer panel → keeps the antenna plane flat), and gasket-lipped for sealing. Static
strength was never the limit (ears already SF≈21) — these changes buy **stiffness, durability, and
sealing**, not raw strength. Print these instead of #4–#6 unless you specifically want the flat originals.

### 4v2. Ground / vehicle box v2 — `MEOK_radar_ground_vehicle_box_v2.stl` (142×70×36 mm, 65.5 cm³) · PA12-CF
- PA12-CF profile (290/60, hardened nozzle, 0.2 mm). Walls **4**, infill **20 % gyroid** (ribs carry
  the stiffness, so infill can drop — saves time and filament).
- **Orientation: open front UP, ribbed floor DOWN on the bed.** This is important — it lays the
  internal ribs in-plane (strong direction) and keeps the chamfered side walls support-free.
- **Supports: none for the shell**; only light **tree supports under the cable-gland boss**. The
  filleted ears and chamfers are self-supporting at ≤45°.
- Gasket lip prints as a raised rim on the open face — no supports; do not sand it flat.
- Longest print (~66 cm³); budget ~5–6 h. Dry the CF filament 8 h @ 70 °C first.

### 5v2. Humanoid module v2 — `MEOK_radar_humanoid_module_v2.stl` (50×21×18 mm, 6.8 cm³) · PA12-CF
- Same PA12-CF profile; walls **3**, infill **20 %** (lightweight — mass matters on a robot).
- **Orientation: dovetail rail flat on the bed, cavity up.** Prints the dovetail slide-face cleanly
  and lays the ribs in-plane. No supports.
- Check the dovetail against your Asimov/WOLF rail with a test-fit before batching.

### 6v2. Radomes v2 — `MEOK_radar_ground_radome_v2_PLA.stl` (117×71×3 mm) + `MEOK_radar_humanoid_radome_v2_PLA.stl` (49×20×3 mm) · **PLA**
- **PLA only — RF-transparent. Never CF.** (Same rule as #2/#6.)
- 210/55, layer **0.16 mm**, walls **3**, infill **100 %**, **flat on the bed, brim 5 mm**, no supports.
- Snap-frame rim seats into the body's gasket lip — do not scale; print at 100 %.

## Print order (one build session)
1. **PA12-CF batch** (bodies/box/module) — group all CF parts, one filament load, dried
2. **PLA batch** (both radomes) — swap to PLA, print together
3. **TPU** (tamper cap) — swap to TPU last

## What to confirm before the final structural print
- **PCB mount-hole coordinates** — the standoff positions are designed to the 44×15 mm outline but
  not to exact hole centres. Verify against the board (calipers / PCB drawing) before committing the
  final body print, or print one test body and check the board seats before batching 5.

## Cross-reference — capillary track (same printer, same day)
The Stage-0 wick coupon and Stage-1 cell have their own settings in
`MEOK_Print_Manifest.md` (capillary POC). The £0 Stage-0 coupon is the other thing worth printing
today. Both tracks share the QIDI Max4 and your PA12-CF / PLA / TPU stock.
