# 🎯 PHASE PLAN — Day of Real Progress
*2026-07-11 · Nick: morning · Source-of-truth for the day*

> **PRINTING = FROZEN** (per your instruction)
> Goal: real progress without prints. Recover from ext error. Commit pyramid idea. Get aligned.

---

## ⚠️ RECOVERY ITEMS (must fix before any print)

### R1. Diagnose the extruder error
**What happened:**
The 30 km-of-filament print + 4 cancellations in 3 days suggests the extruder is over-feeding or has a thermal/calibration issue. Most likely:
- Z-offset drift (height map stale after new extruder change)
- Extruder E-step miscalibration (over-extruding by ~2.5× in that long print)
- Hot-end thermal runaway / PID off after the extruder swap

**What needs to happen (manually on the Qidi touchscreen):**
1. **PID_CALIBRATE HEATER=extruder TARGET=250** — re-tune since hardware is new
2. **PID_CALIBRATE HEATER=heater_bed TARGET=60** — bed was at 80 when it should be 60 for PA12-CF (or 100 if PA)
3. **Bed mesh: ABORT → BED_MESH_CALIBRATE → SAVE_CONFIG**
4. **Extruder step calibrate:** mark a 120mm line on filament, command `G1 E100 F300`, measure actual extrude, adjust rotation_distance in printer.cfg
5. **PA12-CF cube test** before any other print (small PLA cube first)

These are physical actions on the Qidi — I can't do them from here. **You need ~10 minutes at the machine.**

---

### R2. Verify the pyramid-flow theory is preserved
The `FLOW_PYRAMID_THEORY.md` file already exists with a synthesis. This document commits it.

---

## 🛌 PHASE 0 — Capture current state (NOW, 5 min)

### What we have right now (no print work)
- 🖨️ **Qidi Max4**: state `ready`, nozzle 21°C, bed 18°C — fully cooled, idle
- ❌ **Last 2 prints cancelled** (workspace stuck, extruder concern)
- ✅ **Files on disk**: Everything from MEOK/CSOAI/DEFONEOS sprint + post-sprint
- ✅ **Knowledge base**: 385 KB DB, 22 STLs, OpenSCAD source, prototype specs
- ✅ **AGENTS.md**: post-tick-86 stable state (55 pages, 30 MCPs, 15 repos)
- 🆕 **FLOW_PYRAMID_THEORY.md** (just created)

---

## 🚀 PHASE PLAN (rest of today)

### Phase 1 — Alignment (now → +30 min)
- ✅ This document
- ✅ FLOW_PYRAMID_THEORY.md
- [ ] Pull latest from origin: `git -C ~/clawd pull`
- [ ] Read AGENTS.md note "for M2 / Hermes / any agent taking over"
- [ ] Decide which sub-agent acts on what today

### Phase 2 — Diagnostics only (no prints)
- [ ] **R1**: Run PID + step-calc + bed-mesh on the Qidi (manually, your hand)
- [ ] After R1 success, run a small PLA calibration cube (your call, but recommend)
- [ ] **DO NOT** start a WOLF or drone print until cube is clean

### Phase 3 — Knowledge-base hardening (parallel to R1)
- [ ] Add FLOW_PYRAMID_THEORY.md to knowledge database schema
- [ ] Add Ordy ORDS link research (if available)
- [ ] Cross-check existing deep_research_2026.json — does anything contradict the fluid-flow view?
- [ ] Update pillars.md or KNOWLEDGE_BASE/README.md with the new narrative

### Phase 4 — Owner-gate presentation prep (not yet)
- [ ] Build a 3-slide "Pyramid Flow" deck (Claude Sonnet)
- [ ] Sketch a fluid-pyramid diagram for the dashboard
- [ ] Identify 3 next-experiments to validate (e.g. Mamba-py on local M2 vs on VM)

### Phase 5 — Update handover
- [ ] Append to AGENTS.md today's events
- [ ] Carry forward for whoever picks it up next

---

## 🚫 STAY CLEAR — work you're NOT doing today

- ❌ No new prints (per instruction)
- ❌ No new DEFONEOS sprints (you said "from claude signce" — implying close to the limit)
- ❌ No new MCPs (the 30/30 is locked)
- ❌ No BFT voting today (Care Floor 0.94, let it sit)
- ❌ No csoai-launch-pack edits (Phase 4 says "later")

---

## 💡 Optional deep-work (if you have time / want to seed a new thread)

### Option X — Build a 100-line Python prototype
Open a notebook and write a **flow-pyramid simulator**:

```python
# Pyramid flow simulator
import numpy as np
from dataclasses import dataclass

@dataclass
class Throat:
    depth: int        # which level in the pyramid
    width: int        # channel width (smaller = faster flow)
    pressure_in: float
    pressure_out: float

    def flow_rate(self):
        # Continuity: V1*A1 = V2*A2
        area = self.width ** 2
        dp = self.pressure_in - self.pressure_out
        return dp / area  # venturi-like

throats = [Throat(depth=0, width=64, pressure_in=10.0, pressure_out=8.0),
           Throat(depth=1, width=32, pressure_in=8.0, pressure_out=5.0),
           Throat(depth=2, width=16, pressure_in=5.0, pressure_out=2.0)]

# simulate 1 token "flowing" through
flow = 0
for t in throats:
    f = t.flow_rate()
    flow += f
    print(f"depth {t.depth} width {t.width}: pressure {t.pressure_in:.1f} → {t.pressure_out:.1f}, flow_rate {f:.3f}, cumulative flow {flow:.2f}")
```

This is the smallest possible prototype. **Worth 30 min, it shows the idea concretely**.

### Option Y — Look at your existing hydro/pond designs and see if they were actually pyramids
You designed 7 vortex venturis for the koi pond. Those are physically pyramids in flow-space — each "venturi throat" is a single model layer. Read `~/clawd/_TABS/_inventory/MEOK_LABS_2026-06-15/pond_design/` with the new lens and see what emerges.

### Option Z — Read the ORBS v2 architecture doc
`/tmp/kimi_extract/*.ORBS*` files (if you re-download the Kimi bundle, which was 12 DEFONEOS packages containing the ORBS architecture). See what "ORBS in water" means as a flow.

---

## 🔑 WHAT TO LEAVE WITH

By the end of today you should have:
1. ✅ This phase plan (committed)
2. ✅ The Pyramid Flow theory committed to disk
3. ✅ Extruder error **diagnosed** (even if not fixed)
4. ✅ Knowledge-base updated to reflect the new narrative
5. ✅ Clear signal to whatever agent picks up next (via AGENTS.md) what to do and what NOT to do

By end of tomorrow you should have:
6. ✅ One decent-flow prototype in Python (Option X)
7. ✅ Qidi fully re-calibrated with a clean test print

By end of this week you should have:
8. ✅ At least one printed radar enclosure (revenue path: £999)
9. ✅ A small fluid-flow demo on the Mamba infrastructure (research path)

That's ambitious but achievable. **Whatever you don't finish today — record in handoff.**

---

## 👤 WHO DOES WHAT (proposed split)

| Task | Agent | Time |
|---|---|---|
| This plan + pyramid theory | MEOK Labs FORGE (me) | 30 min (done) |
| Pull origin + update AGENTS.md | Hermes/JEEVES (background) | runs while I sleep |
| Qidi touch-screen work (R1) | **YOU** (Nick) | 10-15 min, your hands |
| Python flow simulator (X) | MEOK Labs FORGE (me) | 30 min, later today |
| Knowledge base narrative update | MEOK Labs FORGE (me) | 20 min, later today |
| csoai.org / DEFONEOS sprinting | **NO** today (per directive) | — |
| Picking up next | whoever-claude or Hermes |  |

---

*This document is the source of truth for today. If you deviate from it, that's fine — record the deviation in AGENTS.md at the end of day.*

∎