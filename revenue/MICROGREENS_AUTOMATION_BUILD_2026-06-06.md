# Microgreens CEA — automation & build doc (draft)
*2026-06-06. D1 in the execute queue, REFRAMED: the 24,000 sqft IOK farm build is a **microgreens** controlled-environment operation, not aquaponics/FarmBot. (FarmBot is a soil-bed CNC robot — wrong tool for tray-based microgreens; the right stack is CEA tray automation + environment monitoring + 3D-printed jigs, below.) Open BOM, uses the on-site Creality K1 Max Pro.*

## Why microgreens (the honest case)
Fast cycle (7–21 days seed→harvest), high £/sqft, year-round indoors, strong B2B demand (restaurants, farm shops, retail). The risk isn't growing — it's **consistency + food safety + distribution**. Automation + monitoring de-risk consistency; HACCP/SALSA de-risks safety; the warm trade/local network handles distribution.

## Build modules (24,000 sqft, phased)
1. **Seeding** — 3D-printed **density-template jigs** (per-crop seed spacing) + vacuum seeder for scale. Printed on the K1 Max in food-safe-handling PETG (not PA12-CF for food-contact; PA12-CF for structural/non-contact mounts only).
2. **Racking + light** — vertical grow racks, full-spectrum LED bars on **relay/timer cycling** (e.g. 16/8). Smart plugs or an ESP relay board for schedule control.
3. **Irrigation** — bottom-watering / ebb-flow (cleaner for microgreens than overhead) with pump + solenoid + float; or fine-mist for germination. Printed manifolds/clips.
4. **Climate monitoring (the OSS core)** — **ESPHome** sensors (temp, RH, CO₂, leaf-zone airflow) → **MQTT** → **Home Assistant** → **InfluxDB + Grafana** dashboards + alerts. This doubles as **HACCP evidence logging** (continuous environment record).
5. **Blackout/germination zone** — stacked, dark, warm; printed stacking spacers + weight plates.
6. **Harvest + cold chain** — harvest tools, wash (where applicable — many microgreens sold un-washed/living), rapid-cool, cold storage with logged temps (same monitoring stack).

## 3D-printed parts (K1 Max — the on-site asset)
- Seeding density templates (per crop) · tray dividers/spacers · sensor + LED-bar mounts · irrigation manifolds/clips · label/QR holders for batch traceability · blackout-stack spacers.
- Material: **PETG** for anything near food/water + washdown; **PA12-CF** for structural mounts/jigs only. CSOAI stamp per the print standard.

## Open-source monitoring stack (build on, don't reinvent)
| Tool | Role | Note |
|---|---|---|
| Home Assistant (`home-assistant/core`) | hub, automations, alerts | mature, self-host |
| ESPHome (`esphome/esphome`) | cheap ESP sensor firmware → HA/MQTT | calibration is the real work |
| MQTT + InfluxDB + Grafana (`Nilhcem/home-monitoring-grafana`) | time-series + dashboards + HACCP evidence | reference arch |
| AquaPi pattern (`TheRealFalseReality/aquapi`) | ready ESP controller to adapt | reef-origin, adapt to grow-room |

## Food safety / compliance (the MEOK angle)
- **HACCP** plan (hazard analysis: seed source, water, contamination, allergens) + **SALSA** or **BRCGS** certification for B2B retail/restaurant supply.
- **Batch/lot traceability**: QR per tray → batch record (seed lot, sow date, environment log, harvest, buyer). The environment monitoring stack *is* the evidence trail.
- **Tie-in:** MEOK/CSOAI attestation engine could sign each batch's HACCP evidence pack → "provably traceable microgreens" — a genuine premium differentiator for restaurant/retail buyers. (Optional v2.)

## ROI framing (VERIFY with real local numbers before banking on it)
Microgreens commonly cited at high £/m²/cycle with ~weekly turns for fast crops — but yields, prices, and labour vary hugely by crop + buyer. **Do a 3-crop pilot** (e.g. pea, radish, sunflower) on a small rack, measure real yield/labour/sell price, THEN scale the 24,000 sqft plan off measured numbers, not table figures. Automation ROI = consistency + labour reduction, realised over 6–24 months.

## Phase 0 (next, cheap, de-risking)
1. Pilot rack: 1 rack, 3 crops, manual + 2 ESPHome sensors logging to HA/Grafana.
2. Print the seeding templates + sensor mounts on the K1 Max.
3. Land 1–2 warm B2B buyers (restaurant/farm shop) for the pilot output → validates demand before the full fit-out.
4. Draft the HACCP plan in parallel (needed for B2B anyway).
