# IOK Farm × MEOK Labs — Phased Execution Plan
**v1.0 · 2026-05-29 · companion to the 24,000 sqft blueprint**

> This expands the 5-phase build sequence into something you can *act on*: per-phase tasks, real UK supplier shortlists, dependencies, timelines, and the **gate** that must close before the next phase starts. Capex are planning bands for briefing a QS — **not quotes**. The one missing input that resizes everything is **target trout tonnage/year**; I've parameterised RAS at two reference points (25 t/yr and 50 t/yr) so this is useful before you confirm it.

---

## The dependency spine (what blocks what)

```
PHASE 0 ─ shell + services ───────────────┬──► everything
   │ (longest poles START on day 1)        │
   │   • EA discharge permit  ░░░░░░░░░░ 3–6 mo
   │   • DNO 3-phase connect  ░░░░░░ 8–16 wk
   │   • planning pre-app→full ░░░░░░░░ 8–13 wk
   ▼
PHASE 1 ─ RAS + Water Plant ──► REVENUE + the live AI testbed
   │ (needs: slab, 3-phase, genset, drainage, EA permit)
   ▼
PHASE 2 ─ Print Farm + Compute ──► powers robotics + revenue MCPs
   │ (needs: dry-end climate + power; kit already owned)   ── can overlap Phase 1
   ▼
PHASE 3 ─ Robotics High-Bay + Optics ──► the research destination
   │ (needs: gantry, 6m height, caged pen, stable temp)
   ▼
PHASE 4 ─ Hatchery/Quarantine + Aquaponics grow ──► closes the loop, margin
```

**Critical-path insight:** the build is gated by *paperwork*, not concrete. EA permit + DNO connection + planning each run 2–4 months and can run **in parallel from day 1**. Start all three before you order a single tank. Phase 2 (print/compute) can be stood up cheaply *during* Phase 1 because you already own the kit — don't serialise it.

---

## PHASE 0 — Shell + Services
**Goal:** weather-tight clear-span shell with the four utilities live. **Gate to Phase 1:** slab cured + 3-phase energised + genset commissioned + drainage signed off by Building Control.

### Tasks
1. **Confirm envelope** — new steel portal vs fit-out of existing. Eaves ≥ 6 m (RAS tank height + mezz + gantry). This single decision sets cost ±£300k.
2. **Appoint:** chartered structural engineer + a QS (get them the blueprint as the brief).
3. **Start the 3 long poles (parallel, day 1):**
   - EA discharge permit / T-exemption (effluent from RAS) — *the longest; start first.*
   - DNO application for 3-phase (150–200 kVA) — National Grid / your regional DNO.
   - Planning pre-app with the local authority using the blueprint zoning.
4. **Groundworks:** drained, bunded slab at the wet end (falls to a sump/interceptor); FRP/epoxy floor spec; ESD floor zone at dry end.
5. **Genset + ATS** (auto-transfer switch) + UPS bridge on aeration. *RAS dies in <1 hr without power — this is life-support, not backup.*
6. **Wet/dry partition** built into the shell (humidity barrier) + office airlock.
7. **Rainwater harvest** off the (large) roof into buffer tanks.

### Suppliers / who to call
- Steel portal: any regional agricultural/industrial steel-frame contractor (get 3 quotes).
- DNO: your regional distribution operator (find via Energy Networks Association postcode lookup).
- Genset: FG Wilson / Cummins / Perkins dealer (50–100 kVA standby, diesel or HVO).

### Capex band: **£250k–£500k** (dominated by frame + slab + 3-phase + genset)

---

## PHASE 1 — RAS Hall + Water Plant (Zones A + C)
**Goal:** trout swimming, water loop stable, first stock in. **This is the revenue engine AND the dataset the AI needs.** **Gate to Phase 4:** stable water chemistry for 60 days + first grading + (parallel) RSPCA/ASC application started.

### The tonnage fork (pick one — everything scales off it)
| | **25 t/yr** (start lean) | **50 t/yr** (commercial) |
|---|---|---|
| Tank volume (approx) | ~150–250 m³ system | ~300–500 m³ system |
| Peak biomass | ~6–10 t standing | ~12–20 t standing |
| O₂ demand | moderate (LOX + diffusers) | high (LOX + oxygen cones) |
| Continuous power | ~25–35 kW | ~40–60 kW |
| RAS capex band | **£150k–£250k** | **£300k–£450k** |
| Feasible Phase-1 start? | ✅ yes, lean | needs more upfront capital |

> Recommendation: **start at ~25 t/yr** to prove the loop + the welfare-attestation story, sized so the water plant (pumps, drum filter, biofilter) can be uprated to 50 t/yr later without re-plumbing. Tell me your number and I'll firm the BOM.

### Tasks
1. **Brief a turnkey RAS supplier** with Zone A+C + your tonnage. Get a tank+filtration+controls quote.
2. Tank install (circular FRP/PP, dual-drain), drum filter, moving-bed biofilter (MBBR), degassing/CO₂ stripping, LOX oxygenation, UV/ozone disinfection, sump + redundant pumps.
3. Feed system (automatic feeders → tie into SOV3 later).
4. Water-quality instrumentation — **this is where MEOK PondSense plugs in** (Atlas EZO pH/DO/EC/temp; the open-hardware kit from your aquaponics memory). Alarms → SOV3 core.
5. Stock: source fingerlings/fry through quarantine (Phase 4 hatchery comes later; buy in to start).

### Suppliers
- Turnkey RAS (UK/EU): **Gael Force Group**, **Pentair Aquatic Eco-Systems**, **Aquacare**, **Fish Farm Feeds / FishGen**, **Billund Aquaculture** (larger). Get 2–3 quotes.
- Probes: Atlas Scientific (EZO), Whitebox Labs Tentacle baseboard (your PondSense fork base).

### Compliance gate (start during build)
- CEFAS Aquaculture Production Business (APB) authorisation.
- APHA fish-movement records.
- EA discharge permit (from Phase 0) must be **live before stocking**.

### Capex band: **£150k–£450k** (per tonnage fork above)

---

## PHASE 2 — Print Farm + Compute Core (Zones F + H)
**Goal:** Qidi array printing 24/7 in a safe enclosure; SOV3 core racked. **Can overlap Phase 1** — kit is already owned, so this is mostly fit-out. **Gate to Phase 3:** print farm fume/dust-safe + signed off; SOV3 reachable on the facility network.

### Tasks
1. **Print farm (F):** relocate Qidi Max4(s) onto a vibration-tolerant bench; **LEV fume extraction + HEPA for CF dust** (your memory: "CF dust hazardous, N95 when sanding" — engineer it out at facility scale); per-machine smoke detection + auto power-cutoff; filament dryers (Sunlu E2 / equivalent, 110°C for PA6-CF); fire-rated separation from everything else.
2. **Compute (H):** rack SOV3 core + UPS + dedicated cooling (CRAC or high-capacity split, F-gas certified install); separate clean power phase (no pump-motor noise); fire early-detection.
3. **Network spine:** structured cabling wet↔dry; PondSense/feeders/alarms (Phase 1) terminate into SOV3 here. This is where the **closed loop** physically wires together.
4. Move HARVI water/silicon rig staging here temporarily until Optics (Phase 3) is ready.

### Capex band: **£20k–£60k** (mostly extraction, cooling, racks, cabling — printers/servers exist)

---

## PHASE 3 — Robotics High-Bay + Optics/Metrology (Zones E + G)
**Goal:** Asimov assembly + bring-up rig live; optics/metrology bench for vision-model calibration + HARVI. **Funded by Phases 1–2 revenue.** **Gate to Phase 4:** test cage + E-stop ring commissioned (safety sign-off before any powered humanoid bring-up).

### Tasks
1. **High-bay (E):** gantry crane (your Asimov bring-up sequence = "crane + E-stop + homing") rated for humanoid lift; **caged test pen + E-stop ring + light curtains**; WOLF actuator assembly bench; CAN-bus bring-up station (motor-ID via CAN per the Asimov manual).
2. **Optics/metrology (G):** vibration-isolated optical bench; blackout/dark-room capability; temp ±1°C; calibration targets for the fish-welfare vision models (trained on Phase-1 real stock — the loop pays off here).
3. **HARVI** moves into G permanently: sealed borosilicate vessel, sensor/stimulus arrays, Arduino Mega ADC → M4 Air LSTM, SOV3 Maternal-Covenant validation on stimuli (per the HARVI spec).
4. **AquaArm** (LeRobot + SO-101) reference build — tank-maintenance robot, tested against the real RAS in Zone A.

### Capex band: **£40k–£120k** (gantry + safety cage are the big items)

---

## PHASE 4 — Hatchery/Quarantine + Aquaponics Grow (Zones B + A-grow)
**Goal:** own broodstock (biosecurity independence) + plant revenue closing the nutrient loop. **Gate:** quarantine protocol validated; aquaponics nitrate-uptake measured (strengthens the EA permit story).

### Tasks
1. **Hatchery/Quarantine (B):** physically separate, own water loop, footbath/boot biosecurity, egg→fry rearing, incoming-stock quarantine (protects the whole farm from one bad batch).
2. **Aquaponics grow-beds (A):** deep-water-culture / media beds fed by RAS nutrient water; plants consume nitrate → partially closes discharge → **directly improves the EA permit + the sustainability sales line**.
3. Welfare attestation goes live: RSPCA Assured / ASC cert achieved → the MCP moat ("runs on our own ASC-grade RAS") becomes provable.

### Capex band: **£60k–£150k**

---

## Rough timeline (parallel where possible)

```
Month   1   2   3   4   5   6   7   8   9  10  11  12
P0 shell ████████████
  EA permit ░░░░░░░░░░░░░░░░          (start day 1, ~3–6 mo)
  DNO 3ph   ░░░░░░░░                  (start day 1, ~2–4 mo)
  planning  ░░░░░░░░                  (pre-app→full)
P1 RAS              ████████████      (after slab+power)
P2 print/compute        ██████        (overlap — kit owned)
P3 robotics/optics              ██████████
P4 hatchery/aquaponics                    ██████████
first fish revenue ──────────────► ~month 6–8
first robotics work ───────────────────► ~month 8–10
```

This is order-of-magnitude. Real dates depend on the permit/DNO returns and the tonnage decision.

---

## What I need from you to firm this up (one input unlocks the rest)
1. **Target trout tonnage/year** → sizes RAS, power, water, Phase-1 capex.
2. **New-build or existing structure?** → sets Phase 0 cost ±£300k.
3. **Capital available for Phase 0–1?** → tells us whether to start at 25 t/yr (lean) or 50 t/yr (commercial).

Give me #1 and I'll turn the Phase-1 band into an actual BOM with a supplier brief you can email.

---

## Per-phase one-line gate summary (the checklist)
- [ ] **P0 gate:** slab cured · 3-phase live · genset commissioned · drainage signed off
- [ ] **P1 gate:** EA permit live · stable water 60 days · first grading · welfare cert applied
- [ ] **P2 gate:** print farm dust/fume-safe · SOV3 on facility network · loop wired
- [ ] **P3 gate:** test cage + E-stop commissioned (safety sign-off pre-bring-up)
- [ ] **P4 gate:** quarantine validated · aquaponics nitrate-uptake measured

*Generated Opus 4.8, dragon mode, 2026-05-29. Planning bands for briefing professionals (QS, RAS supplier, DNO, EA, chartered engineer) — not quotes. Verify before committing capital.*
