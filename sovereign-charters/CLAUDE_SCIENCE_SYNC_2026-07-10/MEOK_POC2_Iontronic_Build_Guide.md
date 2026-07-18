# MEOK POC-2 — Iontronic Emergence Cell: Build & Measurement Guide
### The concrete next build step — open-source potentiostat + `reservoirpy`

**Date:** 2026-07-07 · MEOK AI Labs · companion to `MEOK_POC_Capillary_Emergence_Cell.md` and
`MEOK_Terranova_Feasibility_Bridge.md`. Grounded in the 2024–2026 iontronics literature.

---

## 0. What this adds to the HARVI cell
Your Stage-1 cell already has water + silica + conductivity probes + stimulus. To turn it into a
measurable **fluidic memristor**, you add exactly two things:
1. **An electrode pair + an open-source potentiostat** (the electrical readout).
2. **`reservoirpy`** (free Python) — the software readout that turns conductance traces into a result.

That's the whole delta. Everything below is buildable this month for **£30–100 + £0 software.**

---

## 1. THE PHYSICS YOU'RE EXPLOITING (one equation)

An iontronic channel's **memory timescale** is set by geometry:

> **τ = L² / (12 D)**  — L = channel length, D = ion diffusivity (NaCl ≈ 1.5×10⁻⁹ m²/s)

Memory scales with **length squared**. This is your design lever:

| Channel length L | Memory τ | Fabrication | Tracks… |
|---|---|---|---|
| 0.1 mm | ~0.56 s | glass capillary / soft-litho | fast (near HRV ~1 Hz) |
| 0.3 mm | ~5 s | glass | — |
| 0.7 mm | ~27 s | printable (tight) | — |
| 1.5 mm | ~125 s | **printable PA-CF** | care-session envelope |
| 3.0 mm | ~500 s | **printable PA-CF** | slow drift / mood |

**Design decision:** build a **bank** of channels spanning these lengths — a glass capillary (fast)
+ printed PA-CF channels (slow). The bank = the reservoir; different τ's give it a spread of
timescales, which is exactly what a good reservoir needs.

---

## 2. THE ELECTRICAL READOUT (open-source potentiostat)

A potentiostat applies a controlled voltage and measures the resulting current — that's how you see
the memristor's conductance. Commercial units are £1,000s; open-source ones are £30–100:

| Option | ~Cost | Notes |
|---|---|---|
| **DStat** | ~£50 in parts | Well-documented open-source potentiostat (Dryden & Wheeler, PLOS ONE 2015); best sensitivity |
| **PassStat / CheapStat** | £20–40 | Arduino/USB-simple; fine for the first hysteresis loops |
| **JUAMI / open designs** | £30–80 | Various community builds |
| **AD5940 eval board** | ~£40 | Analog Devices electrochemical front-end; robust |

**Electrodes:** Ag/AgCl pair (cheap, stable in aqueous) or Pt wire; £8–20. Two electrodes at the
ends of each channel.

---

## 3. THE THREE EXPERIMENTS (exact protocols)

### EXP-1 · Iontronic fingerprint — *is it a memristor?*
- **Do:** apply a slow triangular voltage sweep (e.g. −1 V → +1 V → −1 V at 0.05–0.5 Hz) across the
  silica-filled channel; record current. Plot **conductance (I/V) vs voltage**.
- **Look for:** a **pinched hysteresis loop** (current forms a bowtie crossing at V=0) — the textbook
  memristor signature. Literature uses ~10 mM electrolyte, ±1 V, sweep near 1/τ.
- **Falsifiable:** silica channel shows the loop; bare bulk water (control) does not. Clean either way.

### EXP-2 · Memory timescale — *does it match theory?*
- **Do:** apply a voltage pulse, then measure how fast conductance relaxes back. Fit an exponential;
  extract measured τ.
- **Compare:** measured τ vs **L²/(12D)** for your printed channel length. Agreement (within ~2×)
  validates the cell against Kamsma/Barnaveli theory and confirms you can *tune* memory by L.

### EXP-3 · Care-reservoir — *the north-star test*
- **Do:** drive the channel bank with the **care-patterned** stimulus (`care_pattern_stimulus.py --emit care`)
  vs the **energy-matched random** control (`--emit random`); record all conductance traces at 100 Hz.
- **Read out:** feed traces into an echo-state network (`reservoirpy`) or the linear readout in
  `iontronic_reservoir_demo.py`. Task: classify care vs random windows, or predict the next sample.
- **Benchmarks (published):** aqueous reservoirs reach **81% on MNIST digits** and **~91% on
  Mackey-Glass** time-series prediction — and their slow timescales *specifically suit biological
  signals*, i.e. your care rhythm.
- **Falsifiable hypothesis (pre-register!):** the channel-as-reservoir classifies/predicts the
  care-structured pattern with **lower error than the energy-matched random control**, by a margin you
  fix in writing *before* running. If not → the "care structure matters at the water-silica interface"
  claim fails cleanly. That's the honest north-star gate.

---

## 4. PROTOTYPE IN SOFTWARE FIRST (today, £0)

Before buying anything, run `iontronic_reservoir_demo.py` (ships alongside this guide). It:
- models the channel bank via **τ = L²/(12D)** (glass + printable lengths),
- drives it with your **actual** care vs random stimulus,
- reads it out with a linear classifier.

**Result (simulation):** the care envelope is cleanly separable from the energy-matched random control
in the channel-bank state — classification ~100% in sim across 5 seeds.

> **Honesty caveat:** 100% in *simulation* is optimistic — the simulated care and random drives are
> structurally very different, so the task is easy on noise-free data. This result proves the concept
> is *separable in principle* and helps **size the channel bank**; it is **not** a prediction that
> hardware hits 100%. Real electrodes bring noise, drift, temperature sensitivity, and fabrication
> variance. The point of EXP-3 is to measure the *real* margin. Swap `channel()` for your measured
> potentiostat trace and re-run the identical readout — that's the hardware result.

---

## 5. SHOPPING LIST (delta over the HARVI Stage-1 BOM)

| Item | ~Cost |
|---|---:|
| Ag/AgCl or Pt electrode pair | £8–20 |
| Open-source potentiostat (DStat / PassStat / AD5940) | £30–100 |
| Fused-silica / borosilicate capillary (glass channel, fast τ) | £8–30 |
| `reservoirpy` + numpy (software readout) | £0 |
| **Delta total** | **£46–150** |

---

## 5b. THE ECHO-STATE READOUT (`esn_readout.py`) — and the control that matters

`esn_readout.py` is the step up from the linear demo: it reads the physical channel-bank state with a
proper **reservoirpy Echo-State Network**, and tests care against three nulls of increasing fairness,
using a **trial-level train/test split** (classify whole trials, not individual timesteps — this is
essential, because reservoir states are strongly autocorrelated and a pointwise split leaks).

**Simulation result (trial-level split, 10 seeds) — CORRECTED:**

![ESN readout vs controls — trial-level split, 10 seeds]({{artifact:art_a39c66ee-7bc3-47d7-92ec-bddfcc25fa62}})

| Control | ESN accuracy (10 seeds) | Meaning |
|---|---:|---|
| shuffled | 75% ± 0% | above chance |
| Gaussian (energy-matched) | 90% ± 2% | above chance |
| phase-randomized (spectrum-matched) | 79% ± 0% | above chance, and **in the same 75–90% band as the others — NOT a distinct advantage** |

> **Honest correction.** An earlier version reported ~85% for the spectrum-matched control using a
> *pointwise* train/test split — that number was **leakage-inflated and must not be used.** With a
> proper trial-level split, care is separable from all controls at ~75–90% (above the 50% chance line),
> but the spectrum-matched null is **not** specifically harder to beat. So we **cannot** yet claim "the
> care *sequencing* beyond its spectrum carries the signal."
>
> **Deeper caveat:** there is only ONE deterministic care sequence, so these "trials" are noisy copies,
> not independent draws — the estimate is optimistic and not a robust claim. **The pre-registered EXP-3
> metric therefore requires MULTIPLE independent care realizations measured on the physical cell**, with
> the same trial-level split. On hardware: care-vs-spectrum-matched significantly above chance supports
> the thesis; at-chance falsifies it. The pipeline is validated; the *claim* awaits real data.

---

## 6. THE OPEN-SOURCE STACK (all free)
- **`reservoirpy`** (INRIA) — echo-state-network readout; turns EXP-3 into a benchmarked analysis.
- **Poisson–Nernst–Planck–Stokes** model (Kamsma/van Roij, published equations) — predict τ and the
  hysteresis window from geometry before you print.
- **DStat firmware/hardware** (open-source) — the potentiostat.
- **`care_pattern_stimulus.py`** + **`iontronic_reservoir_demo.py`** + **`esn_readout.py`** (your files) — stimulus, sim twin, and the ESN readout with spectrum-matched null.

---

## 7. THE PRINTABLE CELL (STL files)

Ready to slice on the QIDI X-Max 4:
- **`MEOK_stage1_cell_body.stl`** — Ø50 × 45 mm PA12-CF sealed vessel: hollow chamber, central
  glass-capillary well (8 mm OD / 3.2 mm ID, seats a ~3 mm glass capillary), **2 electrode
  feed-throughs** (2.2 mm) flanking the well for the iontronic pair, **4 sensor ports** (3 mm) on the
  ring (conductivity ×2, temp, pH), a side **optical-window boss** with a 4 mm bore for the 650 nm
  laser / photodiode, and a top rebate for the gasket.
- **`MEOK_stage1_cell_lid.stl`** — drop-in lid with a central wiring gland (6 mm) and a fill/vent port.
- **`MEOK_stage1_gasket_TPU.stl`** — print in **TPU**: flat annular seal for the rebate.

**Print notes:** body in PA12-CF (dry the filament; enclosure heated bed); seal feed-throughs with
epoxy potting or TPU grommets after wiring; the glass capillary drops into the central well; fill with
DI water + 0.1 M NaCl through the lid vent, then seal. All three parts are watertight solids.

**Printability check (from the mesh):** every feature is ≥2.2 mm (≥5.5 extrusion widths at a 0.4 mm
nozzle) — no thin walls. Vertical floor feed-throughs and the central well print support-free. The
**one real overhang is the side optical boss** (~53 mm², the ledge sticking out from the wall) —
correcting an earlier note, this boss (not the laser bore) is ~86% of the remaining overhang. **Either
enable supports for that boss, or orient the print boss-face-down / add a larger 45° chamfer.** The
horizontal Ø4 mm laser bore (~9 mm²) is small enough to bridge with a slightly flattened top. Total
overhang is only ~0.4% of surface, so support is trivial and local — but it *is* needed at the boss.

---

### Sources (retrieved 2026-07-07)
- Kamsma et al., *Brain-inspired computing with fluidic iontronic nanochannels*, PNAS 121 (2024) — τ=L²/12D, reservoir MNIST 81%.
- Kamsma et al., *Brain-inspired reservoir computing with fluidic iontronic nanochannels*, arXiv:2309.11438 — soft-litho fabrication, geometry-tuned memory.
- *Neuromorphic Computing with Microfluidic Memristors*, arXiv:2503.13386 (2025) — Memriki Shinriki-oscillator logic gates (op-amp circuits), microfluidic scale.
- Barnaveli et al., *Pressure-Gated Microfluidic Memristor*, arXiv:2404.15006 (2024) — τ=L²/12D, pulsatile pressure as 2nd channel.
- *Echo State & Band-pass Networks with aqueous memristors*, arXiv:2505.13451 — Mackey-Glass ~91%, airway-pressure input, biological timescales.
- Dryden & Wheeler, *DStat: An open-source potentiostat*, PLOS ONE (2015).
