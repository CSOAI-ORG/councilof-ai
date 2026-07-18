# MEOK Labs — Humanoid Crown Jewels (absorbed 2026-06-24)
Source: `~/Downloads/MEOK_CROWN_JEWELS.md` (well-cited robotics research). Folded here so it lives in the repo, not just Downloads.

## Headline
Cheapest-capable humanoid for **$800–1,200** (vs $2,944 base) — a **60–73% cut** — by sourcing smarter + different actuation, NOT by cutting capability.

## The big architectural fork (decision-grade)
**Tesla Optimus Gen-3 insight = tendon-drive mass relocation.** Move motors to the torso/backpack, drive joints via Dyneema/Spectra (UHMWPE) tendons through low-friction guides.
- Cuts actuator count **22 → 12**; saves **~4.3 kg distal mass** (both sides); ~16 Nm less at hips/knees.
- Lets hip/knee motors downgrade a class → **$200–400 saved** + lower inertia = faster/agile.
- This is a **fundamentally different architecture than Berkeley Humanoid Lite's distributed actuators** — a strategic choice for MEOK Labs ([[asimov-wolf-humanoid-program]], [[berkeley-humanoid-lite-build]]).

## License-clean building blocks
- **DLR `DLR-RM/TendonDrivenContinuum`** — open-source tendon-driven CAD + assembly + control. Verify license before adopting.
- **RUKA hand** (2025) — $1,300 tendon-driven 15-DOF; ~Allegro dexterity at **8.7% of $15k cost**.
- **McKibben pneumatic muscles** — ~$7/m, **150 N/kg (6× BLDC)** for arm compliance.
- **Spectra/Dyneema cable** = fishing line, pennies/m; capstan equation → >99% efficiency, no slip.
- **Free filament sponsorships** (Overture3D / Polymaker / colorFabb) → eliminate the ~$280 structural-materials budget.

## Honest caveats (verify before building)
- These are research claims w/ footnotes — confirm the DLR/RUKA licenses are commercial-OK (RUKA/DLR may be research-only) before committing.
- Pneumatics add a compressor/valve subsystem (mass, noise, control) — the "6× force density" ignores that BOM.
- Still gated on MEOK Labs hardware reality (MuJoCo-on-Mac yes; Isaac Lab needs cloud NVIDIA per [[robotics-oss-and-sim-status]]).

## Batch 2 — actuator + gearing research (absorbed 2026-06-24, sim-backed)
From `ACTUATOR_RESEARCH_REPORT`, `MEOK_COMPOUND_GEARING`, `MEOK_MEGA_BOT_SYNTHESIS`, `MEOK_Robotics_Research/lab-docs/*`:

- **Actuator cost floor:** open-source joints now **$61–188/joint** (vs $2,000+ commercial). 22-DOF humanoid actuator BOM floor **~$1,800** (vs $13,000+ commercial QDD).
- **Walking needs only ~4 Nm at the joint** (sim sweep of 1,620 configs) → even $25 drone motors + 7:1 printed gearbox suffice. Don't over-spec.
- **Compound-gearing winner (207 configs simulated): dual-motor "twin-turbo".** Salvaged **e-scooter hub motor ($20, 9.6 Nm — 20× a 5010)** + tiny HDD Nidec ($2) on a shared **25:1 cycloidal → 208 Nm/joint for $85, 4.6× safety margin** (best value/$). Even solo: e-scooter + 15:1 = **127 Nm @ $62** < one M6C12 ($129). The e-scooter hub motor is the secret weapon.
- **Reference platforms:** Berkeley Lite $4,312 (16kg, 15:1 printed cycloidal, ~90% eff, MuJoCo RL zero-shot) · Caden Kraft ironless QDD **29.4 Nm @ $70 BOM** (cheapest open actuator) · K-Bot $8,999 (cheapest full-size buy, Robstride QDD) · Asimov (strength king).
- **Controller:** B-G431B-ESC1 **$19** (Berkeley's pick, SimpleFOC) < moteus/ODrive/VESC.
- **Mass-penalty spiral = 6.5×** (200g component error → +1.3kg system). Enforce torque density from day 1: **>15 Nm/kg min, >25 competitive, >35 SOTA**.

**Two competing cost strategies on the table (decision needed):** (1) tendon-drive mass-relocation (batch 1) vs (2) dual-motor twin-turbo compound (batch 2, sim-backed). Both cut cost via different physics; pick per joint group. Sim path reuses Nick's 18 RL policies (MuJoCo on Mac; Vast/cloud for Isaac).

_All zips now absorbed. Full docs remain in `~/Downloads/*.zip` if deeper detail needed._
