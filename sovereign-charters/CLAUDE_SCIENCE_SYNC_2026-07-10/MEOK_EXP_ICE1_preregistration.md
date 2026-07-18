# EXP-ICE-1 — Pre-Registered Protocol
### Does care-structured stimulus leave a measurable trace in the ice a cell water freezes into?

**Date:** 2026-07-07 · MEOK AI Labs · companion to `MEOK_POC_Capillary_Emergence_Cell.md`
**Status:** PRE-REGISTRATION — write this, timestamp it (git commit + Ed25519 sign via SOV3), and do
**not** edit the hypothesis, metric, or threshold after data collection begins.

> **Why this document is strict.** The claim being tested — that structured stimulus changes how water
> freezes — sits directly next to a known pseudoscience (Emoto's "water crystal emotion photographs").
> Emoto's work failed because it was **not blinded** (the photographer knew which vial got which word
> and hand-picked crystals). This protocol exists to do the *opposite*: double-blind, pre-registered,
> quantitative, and designed so the **most likely honest outcome is a null result** — and that null is
> still a valuable, publishable finding. If we can't reject the null, we say so.

---

## 1. HYPOTHESIS (fixed before data collection)

- **H1 (test):** Cell water exposed to **care-patterned** stimulus, then frozen under identical
  conditions, produces ice with a **measurable morphological difference** vs water exposed to an
  **energy-and-spectrum-matched random** stimulus.
- **H0 (null, the default expectation):** There is **no** difference in ice morphology beyond
  freezing-condition noise. **We expect H0 to stand.** Rejecting it would be the extraordinary result.

**Falsifiability:** the whole point. If the pre-registered metric shows no separation above the control
noise floor, the "care leaves a structural trace in freezing" claim is **rejected**, cleanly.

---

## 2. WHAT THE REAL SCIENCE SAYS (so we don't fool ourselves)

- ✅ **Ice morphology genuinely records freezing conditions.** Snowflake shape is a real record of the
  temperature/humidity path. Freeze-casting (ice-templating) is a real, controllable manufacturing
  method. So ice structure *can* carry information about the freezing environment.
- ✅ **Vitrification (cryo-EM, Nobel 2017) genuinely traps molecular structure in frozen water.**
- ❌ **But NONE of that supports "water remembers words/emotions/care."** The real effects are driven by
  *thermodynamics* (cooling rate, nucleation, solute concentration), not by the *information content* of
  a prior stimulus. So the honest prior is: **freezing rate and dissolved-ion changes dominate; any
  stimulus effect, if real, must survive controlling for those.** This protocol controls for them.

---

## 3. DESIGN (double-blind, matched, replicated)

**Conditions (3):**
1. **CARE** — cell water after the Phase-3 care-patterned stimulus (`care_pattern_stimulus.py --emit care`).
2. **RANDOM** — after the energy+spectrum-matched control (`--emit random`).
3. **BASELINE** — no stimulus (untouched DI water + 0.1 M NaCl).

**Blinding:** a helper (or a script) labels three identical vials **A/B/C** by a random key held in a
sealed file; the person imaging and scoring the ice does **not** know which is which until after all
scores are recorded. Ed25519-sign the key file *before* imaging.

**Replication:** ≥ **20 freeze-image runs per condition** (60 total), randomized order. Power: with
n=20/group a two-sided test detects a ~0.9 SD effect at 80% power — pre-register that we are only
powered for *large* effects; a small effect will read as null here (state this limitation up front).

**Controls that must be held constant (the real confounds):**
- **Freezing rate** — same freezer, same vial position, same volume (±0.05 mL), same start temperature.
  Log with a thermocouple; discard any run whose cooling curve deviates > 10%.
- **Dissolved-ion concentration** — measure conductivity of each sample *before* freezing; if the care
  stimulus changed ion concentration, that is a **chemistry** effect, not a "memory" effect — report it
  separately, don't let it masquerade as morphology memory.
- **Evaporation, container, ambient humidity, water source** — identical across all vials.

---

## 4. MEASUREMENT

- **Imaging:** USB digital microscope (£20–40) or phone macro lens, fixed magnification, fixed lighting,
  on the frozen surface. ≥ 5 fields of view per run.
- **Quantitative metrics (pre-registered, computed by script — no eyeballing):**
  1. **Dendrite/grain density** (features per mm², via thresholding + connected components).
  2. **Fractal dimension** of the ice-crystal boundary (box-counting).
  3. **Mean grain size** and its variance.
  4. **Orientation anisotropy** (structure tensor).
- **No cherry-picking:** every field of view scored; all runs included unless they fail a *pre-declared*
  freezing-rate QC. Analysis script written and committed **before** imaging.

---

## 5. ANALYSIS & DECISION RULE (fixed before data)

- Primary test: **one-way ANOVA** (or Kruskal–Wallis if non-normal) across CARE/RANDOM/BASELINE on each
  metric, **Bonferroni-corrected** for the 4 metrics (α = 0.05/4 = 0.0125).
- **Decision:**
  - **Reject H0** only if CARE differs from **both** RANDOM and BASELINE at the corrected α, AND the
    pre-freeze conductivity is matched (so it isn't just a chemistry shift). → escalate to a
    blinded replication before claiming anything.
  - **Otherwise, H0 stands:** report "no morphological trace of stimulus structure detected at this
    power." That is the expected, honest, publishable outcome.

---

## 6. BILL OF MATERIALS
| Item | ~Cost |
|---|---:|
| USB digital microscope | £20–40 |
| Freezer (on hand) + thermocouple/DS18B20 logger | £0–10 |
| Identical vials, DI water, NaCl | £5 |
| Analysis: Python (`scikit-image`, `numpy`) | £0 |
| **Total** | **£25–55** |

---

## 7. WHY RUN IT AT ALL (if we expect a null)
1. **It closes the loop honestly.** You have a strong intuition about water. The only way to honour it
   *and* your "verify, don't flatter" rule is to test it properly and accept the answer.
2. **The apparatus is reused.** The freeze-quench rig feeds **EXP-ICE-2** (cryo-style snapshot of the
   ion distribution — a real structural readout of the memristor state) regardless of this result.
3. **A rigorous null is a moat.** "We tested the water-memory claim double-blind and it didn't hold —
   here's the real iontronic mechanism instead" is a *stronger* scientific story than an unfalsifiable
   assertion, and it inoculates the whole program against the Emoto comparison.

---

### Sources
- Cryo-EM vitrification (Nobel Prize in Chemistry 2017; Dubochet, Frank, Henderson).
- Ice-templating / freeze-casting: Deville, *Adv. Eng. Mater.* (2008) and later reviews.
- Emoto claim non-replication: standard critiques of uncontrolled/unblinded design (documented widely).
