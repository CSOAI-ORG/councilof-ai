# IOK Farm × MEOK Labs — 24,000 sqft Facility Blueprint
**v1.0 · 2026-05-29 · executable fit-out plan (hand to architect / builder / RAS supplier)**

> Scope honesty: this is a **zoning + services + phasing + budget blueprint** — enough to brief a structural engineer, an RAS aquaculture supplier, and a Building Control officer, and to break ground on the fit-out. It is **not** a stamped architectural drawing or a planning submission. Those come next, from a chartered engineer, using this as the brief.

---

## 0. The thesis — why these two things share one roof

IOK Farm (aquaponics/aquaculture) and MEOK Labs (robotics + optics + AI compute) are not a random pairing. They share the **same four utilities at industrial scale**: heavy power, heavy water, precise climate control, and structured airflow. Co-locating halves the infrastructure bill and creates a closed loop: **the farm is the live testbed the robotics/AI exists to serve** (AquaArm tank maintenance, PondSense sensors, fish-welfare vision models, SOV3 control). One building, two businesses, one nervous system.

24,000 sqft (≈2,230 m²) — assume a clear-span steel portal shed, ~60 m × 37m, eaves ≥ 6m (needed for RAS tank height + mezzanine + gantry). One end "wet/dirty" (farm), one end "dry/clean" (labs), service spine down the middle.

---

## 1. ZONING — the 24,000 sqft split

```
        ◄──────────────── 60 m ────────────────►
  ┌─────────────────────────────────────────────────┐
  │  A. AQUACULTURE / RAS HALL        6,500 sqft      │ ▲
  │  trout RAS tanks, biofilter, sump, aquaponics     │ │ WET END
  │  grow-beds, harvest/grading bay                   │ │ (slab drains,
  ├───────────────────────┬───────────────────────────┤ │  bunded, FRP)
  │ B. HATCHERY/QUARANTINE │ C. WATER PLANT / PUMP RM   │ │
  │    1,500 sqft          │    1,500 sqft (LV/pumps/   │ │
  │ (biosecure, separate)  │    O2/ozone/UV/CO2 scrub)  │ ▼
  ├───────────────────────┴───────────────────────────┤
  │  D. SERVICE SPINE / LOADING  2,000 sqft (roller    │  ← shared core
  │  doors both ends, forklift, palletised feed/resin) │
  ├───────────────────────┬───────────────────────────┤
  │ E. ROBOTICS HIGH-BAY   │ F. PRINT FARM             │ ▲
  │    3,500 sqft          │    1,500 sqft (Qidi Max4  │ │ DRY/CLEAN
  │ (Asimov assembly, WOLF,│    array, dryers, fume    │ │ END
  │  gantry crane, test pen│    extraction, CF-dust    │ │ (sealed,
  │  + safety cage)        │    control)               │ │  climate,
  ├───────────────────────┼───────────────────────────┤ │  ESD floor)
  │ G. OPTICS / METROLOGY  │ H. COMPUTE / SOV3 CORE     │ │
  │    1,500 sqft (dark rm,│    1,200 sqft (server +    │ │
  │  vibration-isolated    │    UPS + cooling; HARVI    │ │
  │  bench, HARVI rig)     │    water/silicon rig here) │ ▼
  ├───────────────────────┴───────────────────────────┤
  │ I. OFFICE / WELFARE / VISITOR  1,800 sqft (mezz)   │  ← human + biosecurity
  │  desks, kitchen, WC, shower/boot-change biosecurity│     airlock between ends
  │  airlock, meeting/demo room overlooking RAS hall   │
  └─────────────────────────────────────────────────┘
   J. PLANT/EXTERNAL (outside footprint): 3-phase intake, genset,
      rainwater harvest tanks, bulk O2/CO2, effluent treatment.
```

| Zone | sqft | Function | Critical requirement |
|---|---|---|---|
| **A · RAS Hall** | 6,500 | Trout RAS + aquaponics grow-beds | Drained bunded slab, FRP/epoxy floor, 6m height, overhead feed lines |
| **B · Hatchery/Quarantine** | 1,500 | Egg→fry, incoming-stock quarantine | Physically separate, own water loop, footbath biosecurity |
| **C · Water Plant** | 1,500 | Pumps, drum filter, biofilter, O2/ozone/UV, CO2 strip | Redundant pumps, on-fail alarms → SOV3 |
| **D · Service Spine** | 2,000 | Loading, forklift, bulk storage | Roller doors both ends, 4m clear |
| **E · Robotics High-Bay** | 3,500 | Asimov/WOLF assembly + test | Gantry crane (Asimov bring-up = "crane + E-stop"), caged test pen, 6m height |
| **F · Print Farm** | 1,500 | Qidi Max4 array + dryers | LEV fume extraction, CF-dust HEPA, fire separation, 24/7 monitored |
| **G · Optics/Metrology** | 1,500 | Vision-model rig, calibration, HARVI | Vibration-isolated bench, blackout, stable temp ±1°C |
| **H · Compute/SOV3** | 1,200 | Servers, UPS, network core | Dedicated cooling, fire suppression, separate power phase |
| **I · Office/Welfare** | 1,800 | People + biosecurity airlock | Boot/clothing change between wet↔dry ends |
| | **22,500** | (1,500 sqft circulation/walls reserve) | |

---

## 2. SERVICES — the four shared utilities (the real cost driver)

### Power
- **3-phase 415V supply.** Estimated peak load: RAS pumps/aeration (~30–50 kW continuous, this is the big one and it runs 24/7), print farm (~5 kW), compute+cooling (~10–20 kW), robotics/CNC (~10 kW intermittent), lighting/HVAC (~15 kW). **Budget a 150–200 kVA supply minimum.**
- **Standby generator (genset)** — *non-negotiable* for RAS. A power cut with no aeration kills a full trout stock in <1 hour. Auto-transfer switch + UPS bridge on aeration + SOV3 alarm.
- Separate clean phase for compute/optics (no pump-motor noise on sensitive kit).

### Water
- RAS is the heavy user — recirculating, so consumption is "makeup" (~5–10% volume/day) not full flow, but the *plumbing* is heavy: 110mm+ returns, bunded sump, drum filter, moving-bed biofilter, degassing, O2 injection.
- **Mains + rainwater harvest** (big roof = free catchment) + borehole option if the farm has spring water (HARVI already uses farm spring water — same source can pre-condition RAS makeup).
- **Effluent: this is the compliance gate.** RAS discharge needs an Environment Agency permit (or T-exemption depending on volume). Settlement + reedbed/filtration before discharge. Aquaponics partially closes this (plants consume the nitrate) — lean into that for the permit story.

### Air / Climate
- **Wet end:** high humidity + ammonia/CO2 risk → mechanical ventilation, CO2 monitoring (fish + staff safety), heat recovery.
- **Dry end:** print farm needs stable ~25°C chamber-adjacent + **CF-dust HEPA + VOC/LEV extraction** (your own memory: "CF dust is hazardous, N95 when sanding"). Optics needs ±1°C stability + blackout. Compute needs dedicated cooling (CRAC or high-capacity split).
- **Hard separation wet↔dry:** humidity migrating into the print/optics/compute end is a slow killer. Sealed partition wall + the office airlock as the only through-route.

### Fire / Safety
- Print farm = highest fire risk (24/7 unattended hot machines). Fire-rated separation, smoke detection per-machine, auto-cutoff, ideally its own compartment.
- Compute = clean-agent or at least early-detection.
- Robotics test pen = physical cage + E-stop ring + light curtains (Asimov bring-up sequence demands it).
- Biosecurity = footbaths, boot change, quarantine separation (protects the whole fish stock from one bad incoming batch).

---

## 3. PHASING — how to not bankrupt yourself on day one

Build the revenue engine first; let it fund the research wing.

| Phase | What | Why first | Rough capex band* |
|---|---|---|---|
| **0. Shell + services** | Portal frame, slab, 3-phase, genset, roof catchment, wet/dry partition | Everything depends on it | £250k–£500k |
| **1. RAS Hall + Water Plant (A+C)** | Trout RAS online, hatchery later | **Revenue + the live testbed.** Fish sales + the data the AI needs. | £150k–£400k (RAS kit scales with tonnage) |
| **2. Print Farm + Compute (F+H)** | Move Qidi array in, SOV3 core, network | Already own the printers; cheap to stand up; powers robotics + revenue MCPs | £20k–£60k (mostly fit-out, kit exists) |
| **3. Robotics High-Bay + Optics (E+G)** | Gantry, test cage, HARVI, metrology | The research destination; funded by phases 1–2 | £40k–£120k |
| **4. Hatchery/Quarantine + Aquaponics grow (B + A-grow)** | Close the loop, own broodstock, plant revenue | Margin + biosecurity independence | £60k–£150k |

*Bands are order-of-magnitude planning figures for briefing a quantity surveyor — NOT quotes. RAS especially varies 3–4× with target tonnage. Get real quotes.

---

## 4. THE CLOSED LOOP (why this beats two separate buildings)

```
   FISH (RAS, Zone A) ──nutrient water──► AQUAPONICS plants ──► clean water back
        │  ▲                                                         │
   sensors│  │ care-gated control                                    │
        ▼  │                                                         ▼
   PondSense (Zone G optics) ──data──► SOV3 CORE (Zone H) ──commands──► AquaArm
        │                                  │                      (LeRobot, Zone E)
        │                                  │ welfare attestation
        ▼                                  ▼
   fish-welfare vision model      MEOK compliance MCPs (RSPCA/ASC/CEFAS)
   (trained on real stock)        = the revenue moat, proven on YOUR farm
```

The farm isn't a side project to the labs — **it's the proving ground that makes the software credible.** "Our fish-welfare attestation runs on our own ASC-grade RAS" is a sales line no competitor has.

---

## 5. COMPLIANCE / CONSENTS CHECKLIST (start these EARLY — they're the long pole)

- [ ] **Planning permission** — change of use / new agricultural+industrial building. Pre-app with the local authority. (Agricultural tie may ease it; mixed B2/research use may complicate it — ask the planning officer.)
- [ ] **Environment Agency** — RAS discharge permit or exemption (effluent). *Longest lead time — start first.*
- [ ] **CEFAS** — aquaculture production business (APB) authorisation; fish health.
- [ ] **APHA** — fish movement / health records.
- [ ] **Building Regs** — structure, fire (BS 9999), electrical (BS 7671), drainage.
- [ ] **DSEAR/COSHH** — CF dust, resins, ozone, CO2 (print farm + water plant).
- [ ] **3-phase grid connection** — DNO application (can be 8–12 weeks+).
- [ ] **F-gas / refrigeration** — for compute + optics cooling.
- [ ] **RSPCA Assured / ASC** — the welfare cert that gates retailer sales (and proves the MCP). Apply once RAS is stocked.

---

## 6. IMMEDIATE NEXT ACTIONS (for Nick, when off the digger)

1. **Confirm the envelope:** is it new-build steel portal, or fit-out of an existing structure? Eaves height? This sets everything.
2. **Call the DNO** for the 3-phase connection quote + timeline (longest pole #1).
3. **Pre-app the planning officer** with this zoning (longest pole #2).
4. **Brief a RAS supplier** (e.g. Fish Farm Feeds / Aquacare / Gael Force / Pentair AES) with Zone A+C for a real tank+filtration quote at your target tonnage.
5. **Tell me the target trout tonnage/yr** — it sizes the RAS, the power, the water, and Phase 1 capex. Everything downstream keys off that one number.

---

*Generated by Claude (Opus 4.8) in dragon mode, 2026-05-29, while Nick was on the digger. Grounded in real project specs from memory: Qidi Max4 print farm, PA12-CF robotics, Asimov+WOLF assembly, HARVI water/silicon rig, SOV3 compute core, UK trout RAS + RSPCA/ASC/CEFAS compliance. Numbers are planning bands for briefing professionals, not quotes — verify with a QS, a RAS supplier, and a chartered engineer before committing capital.*
