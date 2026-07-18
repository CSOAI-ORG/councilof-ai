#!/usr/bin/env python3
"""Generate a scaled SVG floor plan for the 24,000 sqft IOK Farm x MEOK Labs facility.
Building ~60m x 37m (clear-span portal). Wet end (farm) left, dry end (labs) right,
service spine + office through the middle. Output: floorplan.svg (open on phone)."""

# building envelope in metres
W_M, H_M = 60.0, 37.0
SCALE = 14            # px per metre
PAD = 60
W = int(W_M * SCALE + PAD * 2)
H = int(H_M * SCALE + PAD * 2)

def m(x): return PAD + x * SCALE

# zones: (label, x, y, w, h in metres, fill) — laid out wet(left)/dry(right)
ZONES = [
    ("A · AQUACULTURE / RAS HALL\n6,500 sqft\ntrout RAS · aquaponics", 0, 0, 24, 17, "#cfe8f3"),
    ("B · HATCHERY /\nQUARANTINE\n1,500 sqft", 0, 17, 12, 9, "#bcdcea"),
    ("C · WATER PLANT\nPUMPS · O2 · UV\n1,500 sqft", 12, 17, 12, 9, "#bcdcea"),
    ("D · SERVICE SPINE / LOADING\n2,000 sqft  (roller doors both ends)", 0, 26, 24, 6, "#eeeeee"),
    ("E · ROBOTICS HIGH-BAY\n3,500 sqft\nAsimov · WOLF · gantry · test cage", 24, 0, 22, 13, "#fde9d0"),
    ("F · PRINT FARM\n1,500 sqft\nQidi Max4 · CF-dust LEV", 46, 0, 14, 13, "#fbd9b0"),
    ("G · OPTICS / METROLOGY\n1,500 sqft\nHARVI · vibration-iso", 24, 13, 22, 9, "#fde9d0"),
    ("H · COMPUTE / SOV3 CORE\n1,200 sqft\nservers · UPS · cooling", 46, 13, 14, 9, "#fbd9b0"),
    ("I · OFFICE / WELFARE / VISITOR (mezz)\n1,800 sqft · biosecurity airlock wet↔dry", 24, 22, 36, 10, "#e6e0f0"),
    ("D2 · loading", 0, 32, 24, 5, "#eeeeee"),
    ("plant strip (genset · O2/CO2 · effluent)", 24, 32, 36, 5, "#e8e8e8"),
]

parts = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" font-family="system-ui,sans-serif">']
parts.append(f'<rect x="0" y="0" width="{W}" height="{H}" fill="#ffffff"/>')
# title
parts.append(f'<text x="{PAD}" y="34" font-size="22" font-weight="700" fill="#0f172a">IOK Farm × MEOK Labs — 24,000 sqft (≈60m × 37m)</text>')
parts.append(f'<text x="{PAD}" y="52" font-size="13" fill="#5a5e66">WET END (farm) ◄── left  ·  service spine + office ── middle  ·  right ──► DRY END (labs)</text>')
# building outline
parts.append(f'<rect x="{m(0)}" y="{m(0)}" width="{W_M*SCALE}" height="{H_M*SCALE}" fill="none" stroke="#0f172a" stroke-width="3"/>')
# wet/dry divider (the critical partition)
parts.append(f'<line x1="{m(24)}" y1="{m(0)}" x2="{m(24)}" y2="{m(32)}" stroke="#dc2626" stroke-width="2.5" stroke-dasharray="8 5"/>')
parts.append(f'<text x="{m(24)+4}" y="{m(0)-4}" font-size="11" fill="#dc2626" font-weight="700">⟂ sealed wet/dry partition (humidity barrier)</text>')

for label, x, y, zw, zh, fill in ZONES:
    parts.append(f'<rect x="{m(x)}" y="{m(y)}" width="{zw*SCALE}" height="{zh*SCALE}" fill="{fill}" stroke="#334155" stroke-width="1.5"/>')
    cx = m(x) + zw*SCALE/2
    cy = m(y) + 16
    for i, line in enumerate(label.split("\n")):
        weight = "700" if i == 0 else "400"
        size = 12 if i == 0 else 10
        parts.append(f'<text x="{cx}" y="{cy + i*13}" font-size="{size}" font-weight="{weight}" fill="#1e293b" text-anchor="middle">{line}</text>')

# scale bar (10 m)
sb_y = H - 22
parts.append(f'<line x1="{m(0)}" y1="{sb_y}" x2="{m(10)}" y2="{sb_y}" stroke="#0f172a" stroke-width="2"/>')
parts.append(f'<text x="{m(0)}" y="{sb_y-6}" font-size="11" fill="#0f172a">10 m</text>')
parts.append(f'<text x="{W-PAD}" y="{sb_y}" font-size="10" fill="#94a3b8" text-anchor="end">MEOK ONE · 2026-05-29 · planning brief, not a stamped drawing</text>')
parts.append("</svg>")

open("/Users/nicholas/clawd/facility/floorplan.svg", "w").write("\n".join(parts))
print(f"wrote floorplan.svg ({W}x{H}px, scale {SCALE}px/m)")
print("zones:", len(ZONES), "| total labelled ~22,500 sqft + 1,500 circulation reserve")
