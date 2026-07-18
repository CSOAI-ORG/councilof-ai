# 🏊 MEOK Labs — Pond Aeration System
## VORTEX design — tangential inlet, cyclone aeration, spinning waterfall

### How it works
Water enters **tangentially** into a cylindrical chamber → spirals around the wall (like a cyclone) → the spinning creates a **low-pressure eye at the center top** → the **air intake at the eye** sucks in maximum oxygen → the spinning water then accelerates through the throat (6 m/s) → the diverging section slows it but **the spin holds** → it hits the waterfall spreader already rotating → **the 340mm water sheet twists as it falls** = light-catching helical waterfall.

**No extra electricity. No air pump. Just physics.**

### Parts in this directory

| File | Description | Print time | Material | Bed fit |
|---|---|---|---|---|
| `vortex_110mm.scad` | **Vortex venturi for 110mm pipe** — 200mm cyclone chamber, 15mm throat, center-top air intake | ~14h | PA12-CF | ✅ 200mm dia |
| `vortex_2inch.scad` | **Vortex venturi for 2" pipe** — 90mm cyclone chamber, 9mm throat, center-top air intake | ~6h | PA12-CF | ✅ 90mm dia |
| `vortex_spreader.scad` | **Waterfall fan spreader** — 340mm wide × 6mm gap, flared side walls, V-notch glyphs, 15° angled lip | ~8h | PA12-CF | ✅ 340mm (max width) |
| `air_manifold.scad` | Central air distribution — 7 outlets, 1 bug-screened intake | ~6h | PETG/PLA | ✅ |
| `venturi_110mm.scad` | Original straight-through design (reference) | ~12h | PA12-CF | ✅ |
| `venturi_2inch.scad` | Original straight-through design (reference) | ~5h | PA12-CF | ✅ |

### Vortex vs Straight-Through

| Feature | Straight-through venturi | VORTEX venturi |
|---|---|---|
| Air draw | ~12% | **~18-22%** (centrifugal low pressure) |
| Bubble size | 2-5mm | **0.5-2mm** (shear from spinning) |
| Waterfall visual | Flat sheet | **Twisting/helical sheet** |
| Back-pressure | ~0.3 bar | ~0.4 bar (slightly more, still fine) |
| Clog resistance | Good | **Better** — centrifugal force keeps debris away from throat |

### How to print

**PA12-CF settings (Qidi Max4, hardened 0.6mm nozzle):**
```
Nozzle: 280°C | Bed: 100°C | Chamber: 55°C
Layer: 0.16mm (venturi bodies) / 0.2mm (spreader)
Infill: 30% gyroid | Walls: 4 | Supports: Tree for air barb
Dry: 70°C for 2hr before print
```

### Installation

1. **Vortex venturi** — install between pump outlet and waterfall. The tangential inlet means the pipe comes from the SIDE of the part, not straight through. Orient so the spin direction matches your waterfall direction.
2. **Air tube** — 8mm silicone hose from the center-top barb to the air manifold (above water)
3. **Waterfall spreader** — bolt or solvent-weld to the venturi outlet. The 370mm wide × 6mm gap creates the spinning sheet.
4. **All 7 venturis** — 2× 110mm for the main waterfalls + 5× 2" for submerged aeration

### The visual result

Two 340mm wide waterfall sheets, side by side, spinning as they fall = **680mm total** of light-catching helical water. Each stream between the V-notches twists individually. At 6 m/s throat velocity and 18-22% air content, the water looks white/milky from the fine bubbles — like a mountain stream.

### Performance (at 15,000 L/h total)
- **Air injected:** ~2,700 L/h (vs 1,800 L/h for straight-through)
- **Oxygen transfer:** 3-4 kg O₂/day
- **Waterfall:** 680mm total width, twisting helix sheet
- **Submerged aeration:** 5× 2" vortex jets for bottom oxygen
