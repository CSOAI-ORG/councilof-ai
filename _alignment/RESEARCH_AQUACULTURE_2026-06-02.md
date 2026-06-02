# RESEARCH — Aquaculture / Aquaponics / Koi Science (2026)
**Compiled:** 2026-06-02 · **Method:** live web + journal search · SURE/GUESS marked. Companion to `ALIGNMENT_2026-06-02.md` §4.

## 1. RAS / aquaponics science (2025–26)
- **RAS welfare → allostasis + environmental enrichment** — *Animals* Feb 2026, PMC12937366. Field shifting from homeostatic to allostatic welfare model; RAS = sensory-deprived → EE imperative. **Citeable spine for MEOK welfare positioning (aligns with care membrane).** [SURE]
- **Nofima RAS 4.0** (Norway) — biological-driver automation (ammonia/ozone/CO₂ + feeding + AI); ozone reduces accumulated steroid hormones. [SURE]
- **Stirling** — tilapia water-quality ML *decision-support* (actions not just numbers), *Sci Reports* 2025 s41598-025-16939-w; satellite meta-learning for HAB. [SURE]
- **Water-quality ML cluster (2025):** CNN-GRU-attention (COD+ammonia), LGBM+BiSRU & VMD-DBN (DO), shrimp-RAS real-time ammonia/nitrite (mdpi 2410-3888/9/10/386), nitrate hybrid NN (arXiv:2401.01491). [SURE]
- **FLOCponics** (biofloc+aquaponics) — *Reviews in Aquaculture* 2025 raq.70029; tilapia+shrimp biofloc ~2× shrimp biomass. [SURE]

## 2. Disease + behaviour CV (2025–26) — **HuggingFace is a DEAD END = MEOK's opening**
- HF has **zero serious recent aquaculture disease models** → publish there for first-mover SEO. [SURE]
- **Fish-Sense** `Vision-At-SEECS/Fish-Sense` — biomass + disease/health multi-task; datasets gated (Google Form), no license → architecture template, not forkable. [SURE]
- **FishKP-YOLOv11** `pigcat88/...` — **keypoint** detection (NOT mass est — upstream mislabels), YOLOv11, no license. [SURE]
- **SalmonScan** dataset — Mendeley x3fz2nfm4w, ~1,208 imgs healthy/infected, **openly downloadable** → usable today. [SURE]
- **WellFish** `WF-WellFish` — SSD-MobileNetV2, 6 freshwater diseases. [SURE]
- **Sea-lice CV = near-vacuum** — Fitzgerald 2025 (aff2.70036): only ONE machine-vision sea-lice study exists; **open data is THE bottleneck**. Commercial-only: Tidal Lice Control (Aug 2025). **Wide-open gap.** [SURE]

## 3. Aquaponics open hardware (live 2026)
- **AquaPi** `TheRealFalseReality/aquapi` — **TOP FORK. Apache-2.0, v26.2.2 (23 Mar 2026), 1,264 commits, 24 releases.** ESP32+Atlas EZO: temp/pH/EC/DO/ORP/CO₂/leak, native ESPHome+Home Assistant. Best-maintained open aquarium/aquaponics controller in 2026. [SURE]
- **Aquaponics-Kit** (same author), **DIY my Dose** (ESP32 dosing), **ReefRhythm** (ESP32-S3 smart doser), **Reef-Pi 6.0** (Pi + ESP32 offload), **HydroMycodo** (Pi+MQTT+ESP32). [SURE]
- **Atlas Ezo_I2c_lib** official (has aquaponics_kit .ino) + **EzoGateway** REST API. Whitebox Tentacle T1 MkII = analog isolation front-end. [SURE]

## 4. Koi (2025–26)
- **First CEV/Koi Sleepy Disease DNA vaccine** — *J Fish Diseases* 2025, jfd.70119. Research-stage. [SURE it exists; efficacy=GUESS]
- **CEV surveillance via shipping-water sampling** — PMC11881292 → koi-trade biosecurity SOP MEOK can productise. [SURE]
- **KHV field detection** — CPA-LFA (S0166093424000144) + LAMP gold-nanoparticle dual visual, ~90 min. [SURE]
- **Koi-variety AI:** KRS-Net (97.9%, 13 varieties, 2022) still the reference; **nothing newer, none on HF** → cheap content win. [SURE]

## 5. UK + EU regulation (2025–26)
- **RSPCA Assured rainbow trout — 177 new standards, in force 23 Jul 2025:** mandatory whole-slaughter CCTV, welfare-outcome assessments, **ban on asphyxiation + CO₂ narcosis**. **Most relevant to Nick's trout farm.** [SURE]
- **RSPCA Atlantic salmon** — 300+ standards since 19 May 2024 (CCTV, cleaner-fish, non-medicinal lice). [SURE]
- **ASC Farm Standard v1.0.1** — 12 species → ONE standard, effective 1 Aug 2025, **mandatory 1 May 2027** (2-yr transition window = sales window). [SURE]
- **WOAH Aquatic Code §7.2–7.4 rewrite** — review→revision agreed Feb 2026 (transport, stunning/killing). Pre-build templates. [SURE]
- **Soil Association organic salmon** — consultation closed ~15 Mar 2026; SA threatened sector withdrawal if no progress by Summer 2026. [SURE salmon; trout unchanged GUESS]
- **EU** — transport reg revision brings fish into scope; cage-farming phase-out proposal expected 2026. [SURE proposal; timing GUESS]
- **DEFRA/CEFAS** — Fish Health Inspectorate enforcement strategy 2025–2027. [SURE]

## 6. Aquaponic/aquaculture robotics (2026)
- Marine net-cleaning is **taken**: Remora (€13.9M, sold out), Aqua Robotics HALO, StealthCleaner. [SURE]
- **Inland aquaponic tank-cleaning/feeding/transplanting robotics = greenfield** (Springer s43621-025-00908-4 names it, empty). MEOK's open lane. [SURE]

## TOP 10 ACTIONABLE
1. **Fork AquaPi → MEOK PondSense** base controller (Apache-2.0, actively maintained). Highest ROI.
2. **Publish open fish-disease/sea-lice dataset + YOLOv11 to HF** (`meok-ai/`) — nobody has; instant first-mover.
3. **Koi/CEV biosecurity compliance product** (shipping-water surveillance + DNA vaccine + LAMP) — koi trade has no tooling.
4. **Cite PMC12937366 (RAS allostasis/EE)** as welfare-positioning spine.
5. **Own ASC (May 2027 mandatory) + RSPCA trout (Jul 2025) windows** in £29–£999 tiers — deadline-driven selling calendar.
6. **Track WOAH §7.2–7.4** — ship templates day-one of publication.
7. **Adopt OWI + SWIM welfare-scoring math** → auditable welfare numbers for compliance reports.
8. **Position aquaponic robotics** as inland (greenfield), not marine (taken); demo on existing 3D-print/robotics stack + Genesis fluid sim.
9. **Water-quality ML forecasting module** (DO + ammonia/nitrite) into the controller — proven 2025 methods.
10. **Refresh koi-variety classifier** for koikeeper.ai (KRS-Net is 2022, none on HF).

**Corrections to noise:** FishKP-YOLOv11 = keypoint not mass-est; HuggingFace = publish-target not source.
**Key URLs:** github.com/TheRealFalseReality/aquapi · Vision-At-SEECS/Fish-Sense · wiley aff2.70036 · PMC12937366 · jfd.70119 · PMC11881292 · thefishsite Remora · asc-aqua.org farm-standard · RSPCA trout (fishfarmingexpert 1927484).
