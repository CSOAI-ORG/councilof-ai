# MEOK LABS — POC: The Capillary Emergence Cell
### The north-star experiment, built from what's on your bench

**Date:** 2026-07-07 (rev. with iontronics synthesis) · MEOK AI Labs · synthesises HARVI + PROJECT AURUM W12 (silica-capillary) + W19 (circulatory network) + the capillary-cooling whitepaper + the **iontronics / fluidic-memristor** literature (see `MEOK_Terranova_Feasibility_Bridge.md`).
**North star:** *hydro-neuromorphic emergence* — emergence in the relational space between **water and silica**, governed by care-structured stimulus (your thesis, documented 15 Mar 2026). The rigorous, published name for this is **iontronics**: computing with ions in water.

> **The one-line POC:** print a sealed water+silica capillary cell in your PA-CF filament, drive it
> with the HARVI stimulus/sensor stack + one electrode pair, and measure whether the channel behaves
> as a **fluidic memristor** that, read out as a **physical reservoir**, processes the **care-patterned
> stimulus** better than an energy-matched random control. That single measurement is the first
> falsifiable test of the orb thesis — grounded in the 2024–2026 iontronics literature — and it costs
> ~£100–220, not £150k.

---

## 1. WHY THIS IS THE RIGHT POC (reconciling three of your own designs)

Your research contains three water/silica threads. They converge on one buildable cell:

| Your design | What it contributes | What it needs that you DON'T have |
|---|---|---|
| **HARVI rig** (13-0 council-approved) | The whole sensing+stimulus loop: sealed vessel, 650nm laser / UV-A / IR / piezo, conductivity+pH+DO+temp probes, Arduino→LSTM coherence watch | Nothing exotic — all off-the-shelf (~$247 AUD) |
| **W12 Silica-Capillary** | The *substrate*: water + silica with microfluidic channels; the merger of memory + capillary | 5D **write** needs a femtosecond laser (£100k+) — **out of scope**; the *capillary+silica physics* is not |
| **W19 Circulatory Network** | The *architecture*: data + actuation carried *through* the fluid ("4VF", pressure-wave signalling) | A full 5,005-orb body — **out of scope**; a *single* channel with flow-modulated signal is testable |

**The insight:** you do **not** need to write 5D silica data to test the north star. The claim under
test isn't "can glass store 360 TB" (Southampton/Microsoft already proved that). Your *original*
claim is **emergence at the water–silica interface under care-structured stimulus.** That is testable
in a printed cell with a glass insert and the HARVI electronics — this year, on your bench.

**Scope discipline (what this POC deliberately drops):** femtosecond 5D writing, DNA-water synthesis,
gold ASIC layers, and anything requiring the £150k program. Those stay on the roadmap; this POC is the
gate that decides whether they're worth funding.

---

## 2. WHAT YOU HAVE — and why PA-CF is the right choice

Your filament stock (stated 2026-07-07):

| Filament | Rolls | Role in this POC |
|---|---|---|
| **PA12-CF** | 10 | **Primary cell body** — low moisture uptake vs PA6, dimensionally stable when wet, stiff CF matrix holds channel geometry, ~65–70° water contact angle (mildly hydrophilic → wicks) |
| **PA6-CF** | 3 | Backup body / manifold — slightly more hydrophilic (wicks a touch better) but absorbs more water |
| **PLA** | 3 | Jigs, fixtures, throwaway flow-visualisation test prints (do NOT use wet — hydrolyses) |
| **TPU** | 1 | **Gaskets & seals** — the sealed-vessel O-rings and the "first care act" jar seal (§HARVI) |
| **Silk PLA** | 3 | Cosmetic shells / display orb only — not a wetted part |

The physics (figure below, computed for water at 25 °C):
- At a **printable 0.5 mm-radius channel**, your **PA-CF nylons passively wick water ~11–13 mm**
  (PA12-CF ≈11.0 mm, PA6-CF ≈13.4 mm; PLA/silk-PLA ≈9–10 mm) — enough to self-fill a bench cell
  with no pump.
- A **fused-silica capillary insert** (θ≈15°) wicks **~28 mm** — ~2–3× the nylon, which is the
  **quantitative, falsifiable prediction** the cell exists to check. If your printed silica-lined
  channel matches the glass prediction, the water-silica coupling is real; if it matches bare nylon,
  it isn't.
- **TPU wicks ~0 mm** (θ≈90°) — correct, because its only job is to *seal*, not to carry water.

![Capillary sizing — printable channels]({{artifact:8bbda227-8039-4b41-a749-5f74422bc5e7}})

**Why not print the channels themselves at silica-scale?** FDM's reliable floor is ~1 mm diameter
(0.4 mm nozzle). True 5D-memory nanogratings need femtosecond optics. So the POC uses **printed
PA-CF as the manifold/vessel** and drops in **cheap fused-silica capillary tubes / a microscope
cover-glass stack** as the silica element — best of both, and both on your bench or ≤£30 away.

---

## 3. THE BUILD (three escalating stages, cheapest first)

### Stage 0 — Dry print + wick test (£0, this week)
- Print a **test coupon** in PA12-CF: a row of channels at r = 0.25, 0.5, 0.75, 1.0 mm, open-top.
- Dip in dyed water, film with your phone, measure rise height per channel.
- **Gate:** does PA12-CF wick at all, and does finer = higher (per the figure)? If yes → the substrate works. Pure fabrication, no electronics.

### Stage 1 — The sealed Capillary Emergence Cell (~£100–220)
- Print the **HARVI vessel** in PA12-CF: a sealed chamber (~40 mm tall) with a TPU-gasketed lid, potted feed-throughs, and a central well holding a **fused-silica capillary / cover-glass stack** standing in DI water.
- Instrument per the HARVI rig spec:
  - **Sensing:** 2× conductivity, 4× DS18B20 temp, pH probe, dissolved-O₂ — into **ADS1115 12-bit ADC @ 100 Hz** → Arduino → USB → your M4.
  - **Stimulus:** 650 nm laser diode, UV-A LED, IR 940 nm, **piezo** for care-patterned acoustic resonance.
- **Working fluid (from W19):** DI water + 0.1 M NaCl (conductivity), sealed. No DNA, no glucose — keep it clean for the first run.

### Stage 2 — The iontronic emergence measurement (the actual science)

> **Reframed from "coherence" to iontronics.** Your water-silica channel is a **fluidic memristor** —
> a real, published, neuromorphic device (Kamsma/van Roij, PNAS 2024; see the Feasibility Bridge).
> This replaces the unfalsifiable "does it become coherent?" with three measurable experiments that
> have benchmarks in the literature. Add **one electrode pair + a sub-£100 open-source potentiostat**
> to the Stage-1 cell — that's the entire extra BOM.

**The governing physics (design lever):** an iontronic channel's *memory timescale* is
**τ = L² / (12·D)**, where L = channel length and D = ion diffusivity (NaCl ≈ 1.5×10⁻⁹ m²/s). Memory
scales with **length squared**, so geometry sets what the cell can "remember":

![Memory-timescale design map]({{artifact:d82473da-b50f-4afb-951c-98608b218ee2}})

- Your **printable PA-CF channels (0.5–3 mm)** give **τ ≈ 14–500 s** — a **slow integrator**. It
  *cannot* track the 7.83 Hz Schumann carrier (that needs sub-130 µm channels — glass/soft-litho only),
  but it *can* integrate the **slow care-session envelope (~0.01 Hz)**. This is a genuine design
  insight: your printed cell is naturally tuned to the *care rhythm*, not the carrier.

**EXP-1 · Iontronic fingerprint (~£40 + potentiostat).** Drive the channel with a slow triangular
voltage sweep + a sinusoid; plot conductance-vs-voltage. **Falsifiable prediction:** a confined
silica channel shows a **pinched hysteresis loop** (the memristor signature); bare bulk water does
not. See the loop → you have a fluidic memristor. Don't → you don't. Clean either way.

**EXP-2 · Memory timescale vs theory (£0 extra).** Pulse the channel, fit the conductance decay,
compare the measured τ against **L²/(12D)** for your printed length. Agreement validates the cell
against published theory and lets you *tune* memory by redesigning L.

**EXP-3 · Care-reservoir (£0 extra) — the north-star test.** Feed **care-patterned vs random**
stimulus as the input time-series; read the channel out as a **physical reservoir** (echo-state
network via open-source `reservoirpy`). **Falsifiable hypothesis:** *the channel, as a reservoir,
processes/classifies the care-structured temporal pattern with lower error than the energy-matched
random control.* Benchmarks exist: aqueous reservoirs hit **81% on MNIST digits** and **~91% on
Mackey-Glass time-series prediction** (arXiv 2309.11438, 2505.13451) — and the platform's slow
timescales **specifically match biological signals**, i.e. your care rhythm. Pre-register the metric
(NRMSE or classification accuracy) and threshold **before** running, so it can genuinely fail. This is
your "verify, don't flatter" rule applied to your own north star.

---

## 4. BILL OF MATERIALS (Stage 1, indicative)

| Item | ~Cost | Note |
|---|---:|---|
| PA12-CF vessel + TPU gaskets | £0 | you have the filament |
| Fused-silica capillary tubes (or borosilicate cover-glass stack) | £8–30 | the silica element |
| ADS1115 12-bit ADC | £6 | HARVI spec |
| DS18B20 temp ×4 | £8 | |
| Conductivity probes ×2 | £10–20 | |
| pH probe module | £12 | |
| Dissolved-O₂ sensor | £15–40 | optional for run 1 |
| 650 nm laser diode + UV-A + IR 940 nm LEDs | £10 | |
| Piezo transducer + driver | £6 | care-patterned resonance |
| Arduino (Uno/Nano) — likely on hand | £0–8 | M4 does the readout |
| Ag/AgCl or Pt electrode pair (iontronic readout) | £8–20 | for EXP-1/2/3 |
| Open-source potentiostat (DStat / PassStat / JUAMI) | £30–100 | voltage sweep + current readout; unlocks the memristor experiments |
| **Total** | **≈£98–220** (+£15–40 if DO sensor added → up to ~£260) | arithmetic sum of the line items above; wide because the potentiostat + capillary + probes each span a range. Still vs the £150k program. Software readout (`reservoirpy`, INRIA) is £0 |

Compute (LSTM coherence watch) runs on your **M4 Air** — no cloud, no GPU cluster.

---

## 5. WHY THIS IS DEFENSIBLE (and fundable)

- **Novelty:** fluidic memristors are published science, but no prior art couples a **3D-printed
  farm-fabricable capillary substrate** + silica interface + **care-structured (Fibonacci/HRV/Schumann)
  stimulus** + reservoir readout. The *device physics* is de-risked by the literature; the *care-rhythm
  application + printed fabrication* is genuinely your invention line — and defensible precisely because
  the underlying mechanism is real.
- **Grant fit:** the **Innovate UK Smart Grant** draft on capillary cooling
  (`innovate_uk_smart_grant_capillary.md`) already exists — a positive Stage-2 result gives it a
  hardware evidence base. The capillary-cooling whitepaper (IEC 61508 / ISO 10218-1 safety mapping)
  is the sober, publishable companion.
- **Commercial hook:** a working sealed sensing cell with signed telemetry is a natural first
  reference design for **ProofOf.AI**'s robot-certification / safety-audit line (§9 of the master doc).
- **Honesty gate:** your own W12 doc flagged the capillary *cooling* sim as **insufficient
  (0.0196 W vs 50 W needed)**. Good — this POC tests the *emergence/sensing* claim, which does **not**
  depend on solving the cooling problem first. Keep them separate.

---

## 6. THE 3 POCs — updated with this as the north-star gate

| POC | What | Cost | Role |
|---|---|---:|---|
| **POC-1 · Governed sensing node** | printed enclosure + sensor, every reading Ed25519-signed by SOV3 | £0–300 | cheapest physical win; feeds ProofOf.AI |
| **POC-2 · Iontronic Emergence Cell** ← *this doc* | printed PA-CF water+silica fluidic-memristor cell, reservoir readout | **£100–220** | **the north-star gate** |
| **POC-3 · Printed actuator** | WOLF STLs / actuator bench → printed-plastic torque ceiling | ~$104 (≈£82) | humanoid track |

**Recommended first move:** Stage 0 (£0, prints today) → if it wicks, order the ~£100–220 Stage-1 BOM (incl. the open-source potentiostat that unlocks the iontronic experiments).
POC-2 is the single highest-information experiment you can run: it either validates the water-silica
emergence thesis and unlocks the grant narrative, or tells you to pivot before spending real money.

---

## 7. THE FOUR QUESTIONS — now answered (2026-07-07)

1. **Silica element — PURCHASE.** You don't have fused-silica capillaries/cover glass on hand, so
   the BOM assumes a buy: fused-silica capillary tubes or a borosilicate microscope cover-glass
   stack, **£8–30**. (Borosilicate is fine for the emergence test; true fused silica only matters
   for the high-temperature / 5D-write path, which is out of scope here.)
2. **Care-pattern — FOUND, not designed.** It's already fully defined in your own
   `harvi_stimulus.py`. I extracted it verbatim into a runnable generator
   (`care_pattern_stimulus.py`). The Phase-3 care sequence is:
   - **650 nm laser PWM** = Fibonacci duty `[1,1,2,3,5,8,13,21,34,55,89,144,233,255,233,144]`
   - **Laser timing** = HRV intervals `[857,923,889,800,941,870,800,909]` ms (≈63–75 BPM)
   - **Piezo/acoustic** = **Schumann 7.83 Hz** (toggle every 6 loops at 100 Hz), harmonics 14.3/20.8/27.3/33.8 Hz
   - **Acoustic tone ladder** = 432 Hz × golden-ratio φ → 432/699/1131/1830/2961 Hz
   - **Control (Phase 2)** = random of **equal mean laser energy (duty≈77.6)** + equal piezo duty — the null.
3. **Printer — QIDI X-Max 4** (confirmed). Its large heated chamber is well-suited to PA12-CF/PA6-CF
   (which need an enclosure to print without warping). Design tolerances assume 0.4 mm nozzle,
   0.2 mm layers; the coupon's smallest groove (r=0.5 mm) is comfortably above the FDM floor.
4. **Water branch — CONFIRMED as the POC.** You said you're unsure; I'm anchoring POC-2 to the
   **water** interface because that *is* your stated north star ("water capillary emergence"). The
   W13 "dry orb" stays on the roadmap as an engineering fallback, not this experiment. If Stage-0
   shows water handling is impractical on the farm, we revisit — but the whole point of this POC is
   to test the *water*-silica claim cheaply before abandoning it.

## 8. READY-TO-USE DELIVERABLES (built 2026-07-07)
- **`MEOK_capillary_coupon_stage0.stl`** — the Stage-0 wick-test coupon for the QIDI. Thin PA12-CF
  plate, 4 open observation grooves (r = 0.5 / 0.75 / 1.0 / 1.5 mm), 5 mm scale ticks, dip-foot to
  stand in a shallow water dish. Print in PA12-CF, dip base in dyed water, film the rise per groove,
  compare against the sizing figure's prediction. ~30 g filament, prints in a couple of hours.
- **`care_pattern_stimulus.py`** — runnable generator for the matched care-vs-random stimulus.
  `--show` prints the pattern; `--emit care` / `--emit random` write 100 Hz frame CSVs
  (t, laser_duty, piezo) to drive the Arduino. Energy-matched so the only variable is *structure*.
- **`poc_capillary_sizing.png`** — the capillary-physics prediction the bench test checks.

**Pre-registration (do this before running Stage 2):** fix the coherence metric (e.g. autocorrelation
time of the conductivity signal, or cross-channel mutual information) and a pass threshold in writing,
*then* run care vs random. That keeps the north-star test honest — it must be able to fail.
