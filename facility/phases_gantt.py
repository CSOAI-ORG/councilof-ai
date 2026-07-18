#!/usr/bin/env python3
"""Scaled SVG Gantt for the IOK Farm x MEOK Labs phased build. 12-month horizon.
Shows the paperwork long-poles running parallel from day 1 + the 5 build phases.
Output: phases_gantt.svg (open on phone)."""

MONTHS = 12
COLW = 62          # px per month
LABELW = 230
ROWH = 34
PAD = 50
W = LABELW + MONTHS * COLW + PAD * 2
TOP = 96

# (label, start_month(0-idx), duration_months, colour, kind)
BARS = [
    ("EA discharge permit",        0, 6, "#dc2626", "paper"),
    ("DNO 3-phase connection",     0, 4, "#dc2626", "paper"),
    ("Planning pre-app → full",    0, 3.5, "#dc2626", "paper"),
    ("P0 · Shell + services",      0, 3, "#0f766e", "build"),
    ("P1 · RAS + Water Plant",     3, 4, "#0ea5e9", "build"),
    ("P2 · Print Farm + Compute",  4, 2.5, "#f59e0b", "build"),
    ("P3 · Robotics + Optics",     7, 3.5, "#a855f7", "build"),
    ("P4 · Hatchery + Aquaponics", 9, 3, "#16a34a", "build"),
]
MILESTONES = [
    ("◆ first fish revenue", 7.0),
    ("◆ first robotics work", 9.0),
]

rows = len(BARS)
H = TOP + rows * ROWH + 120

def mx(month): return PAD + LABELW + month * COLW

p = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" font-family="system-ui,sans-serif">']
p.append(f'<rect width="{W}" height="{H}" fill="#ffffff"/>')
p.append(f'<text x="{PAD}" y="34" font-size="20" font-weight="700" fill="#0f172a">IOK Farm × MEOK Labs — Phased Build (12-month view)</text>')
p.append(f'<text x="{PAD}" y="54" font-size="12" fill="#dc2626">red = paperwork long-poles (START day 1, run in parallel)</text>')
p.append(f'<text x="{PAD+330}" y="54" font-size="12" fill="#5a5e66">· coloured = build phases · ◆ = revenue milestones</text>')

# month gridlines + labels
for i in range(MONTHS + 1):
    x = mx(i)
    p.append(f'<line x1="{x}" y1="{TOP-8}" x2="{x}" y2="{TOP + rows*ROWH}" stroke="#e6e8ec" stroke-width="1"/>')
    if i < MONTHS:
        p.append(f'<text x="{x+4}" y="{TOP-14}" font-size="11" fill="#94a3b8">M{i+1}</text>')

# bars
for r, (label, start, dur, colour, kind) in enumerate(BARS):
    y = TOP + r * ROWH
    p.append(f'<text x="{PAD}" y="{y+20}" font-size="12" fill="#1e293b">{label}</text>')
    bx, bw = mx(start), dur * COLW
    dash = ' stroke-dasharray="6 4" fill-opacity="0.35"' if kind == "paper" else ''
    p.append(f'<rect x="{bx}" y="{y+6}" width="{bw}" height="20" rx="4" fill="{colour}"{dash} stroke="{colour}" stroke-width="1.5"/>')

# milestones (vertical markers)
for label, month in MILESTONES:
    x = mx(month)
    p.append(f'<line x1="{x}" y1="{TOP-8}" x2="{x}" y2="{TOP + rows*ROWH + 10}" stroke="#0f172a" stroke-width="1.5" stroke-dasharray="3 3"/>')
    p.append(f'<text x="{x+4}" y="{TOP + rows*ROWH + 26}" font-size="11" fill="#0f172a" font-weight="600">{label} (~M{int(month)+1})</text>')

# footnote
p.append(f'<text x="{PAD}" y="{H-30}" font-size="11" fill="#94a3b8">Order-of-magnitude. Real dates depend on EA/DNO/planning returns + the trout-tonnage decision. Planning brief, not a stamped programme.</text>')
p.append("</svg>")

open("/Users/nicholas/clawd/facility/phases_gantt.svg", "w").write("\n".join(p))
print(f"wrote phases_gantt.svg ({W}x{H}px) · {len(BARS)} bars · {len(MILESTONES)} milestones")
