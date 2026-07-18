# MEOK — Capillary Emergence Cell: Build-Day Checklist

**Purpose:** turnkey path from "nothing printed" to "iontronic cell measuring on the bench."
Ordered so each step gates the next — do NOT order the £65–223 Stage-1 kit until the £0 Stage-0
coupon proves the material wicks. North star: emergence at the water–silica interface (iontronics /
fluidic memristor), NOT a consciousness claim. See MEOK_LABS_MASTER_CONSOLIDATION.md §10 for the arc.

---

## STAGE 0 — Wick coupon (TODAY, £0)

**Goal:** confirm PA12-CF actually wicks water in printed open grooves before spending a penny.

- [ ] Slice `MEOK_capillary_coupon_stage0.stl` for the **QIDI X-Max 4** (settings in the Print Manifest).
- [ ] Print in **PA12-CF** (0.4 mm nozzle, 0.2 mm layer). ~30–45 min.
- [ ] Dip the foot in DI water + food dye. Watch the four grooves (r = 0.5 / 0.75 / 1.0 / 1.5 mm).
- [ ] Read rise height off the 5 mm scale ticks. **Expected ~11 mm** for PA12-CF (Jurin/Washburn, θ≈68°).
- [ ] **GATE:** if it wicks measurably → proceed to Stage 1. If not → try silk-PLA groove, or plasma/
      surfactant treat, before ordering.

## STAGE 1 — Sealed iontronic cell (after Stage 0 passes, £65–223)

**Goal:** build the sealed water+silica cell with electrodes + care-stimulus, ready to measure.

**Print (all PA12-CF except gasket):**
- [ ] `MEOK_stage1_cell_body.stl` — chamber + well + feed-throughs. **Boss face DOWN** on the plate (needs support
      otherwise; the ~53 mm² boss ledge is the only real overhang — the Ø4 mm laser bore bridges clean).
- [ ] `MEOK_stage1_cell_lid.stl` — wiring gland + vent.
- [ ] `MEOK_stage1_gasket_TPU.stl` — print in **TPU**.

**Order (see MEOK_Stage1_BOM.csv — order the whole sheet at once):**
- [ ] Fused-silica capillary or borosilicate cover-glass (£8–30) — the silica element.
- [ ] Ag/AgCl electrode pair (£8–20).
- [ ] Potentiostat — open-source DStat / PassStat / JUAMI / AD5940 (£30–100).
- [ ] 650 nm laser diode + piezo disc (+ UV-A/IR-940 if doing full HARVI) (£6–19 all three; laser+piezo alone £4–13).
- [ ] NaCl + DI water + conductivity probe (£13–33).
- [ ] Confirm Arduino + ADS1115 on hand (else +£0–21).

**Assemble:**
- [ ] Chloride the Ag wire (or use pellet electrodes); seat through the two floor feed-throughs, seal.
- [ ] Insert silica element in the central well. Fill with **0.1 M NaCl in DI water** (0.58 g / 100 mL).
- [ ] Seat TPU gasket, close lid, route wiring through the gland.
- [ ] Wire per `MEOK_stage1_wiring_schematic.png`: potentiostat↔electrodes, sensors↔ADS1115↔Arduino↔M4,
      stimulus (laser/piezo) through the lid gland, SOV3 Ed25519 signs each logged reading.

## STAGE 2 — Measure (the three experiments, software mostly done)

- [ ] **EXP-1 · Iontronic fingerprint:** sweep ±1 V triangle, plot I–V. Look for a **pinched hysteresis
      loop** (the memristor signature). ~£0 beyond the potentiostat.
- [ ] **EXP-2 · Memory timescale:** step the voltage, fit the relaxation. Compare to **τ = L²/12D**
      (L = channel length): 0.5 mm→14 s, 3 mm→500 s. Confirms the printed channel is a slow integrator.
- [ ] **EXP-3 · Care-reservoir (the north-star test):** drive with `care_pattern_stimulus.py --emit care`
      vs `--emit random`, record conductance, run `esn_readout.py`. Pre-register FIRST (see below).
      Honest bar: care is separable from controls at ~75–90%, but the spectrum-matched null is NOT
      specifically harder — report that plainly.

**Pre-registration (do before EXP-3 and EXP-ICE-1):**
- [ ] Lock hypotheses, n per condition, and analysis in `MEOK_EXP_ICE1_preregistration.md` (freeze test)
      and the EXP-3 protocol in `MEOK_POC2_Iontronic_Build_Guide.md`. Sign the key with SOV3 Ed25519.

---

## Cost summary

| Stage | Cost | Gate to proceed |
|---|---|---|
| Stage 0 (wick coupon) | **£0** (PA12-CF on hand) | measurable wick → Stage 1 |
| Stage 1 (sealed cell) | **£65–223** essentials (+£15–40 optional DO) | cell holds water, electrodes read → Stage 2 |
| Stage 2 (measure) | £0 beyond Stage 1 | pinched hysteresis seen → publishable iontronic result |

*The £65 floor assumes Arduino + ADS1115 already on hand (HARVI kit); the £223 high end is all-new.
This refines the earlier ~£98–220 verbal envelope — order from MEOK_Stage1_BOM.csv, which is itemized.*

## What NOT to buy / build

- ✗ **Femtosecond laser** — needed only to WRITE 5D silica storage, NOT for the emergence POC. £10k–50k.
- ✗ **Moving-water circulatory rig** — bulk turbulent flow degrades the signal (Terranova finding).
      Use STATIC water + optional pulsatile pressure pulses as a 2nd care-channel.
- ✗ Anything labelled from AURUM "N/N tests pass" as if physical — those are software unit tests.
