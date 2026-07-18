# 🤖 Asimov Humanoid — Hybrid Fabrication Quote List (Draft)
*Authored 2026-06-15 by MEOK Labs (FORGE) tab.*
*Scope: costed per-joint BOM split across FDM (Qidi) + CNC (Xometry/Protolabs) + SLM (Xometry/Protolabs), sub-£10k humanoid target.*
*Status: **ESTIMATE RANGES**, not live vendor quotes. Use as the RFQ brief to send to Xometry + Protolabs + a UK 2nd-source (Rapid Manufacturing, 3T, AME-Group).*

---

## 0. Honesty + scope guard

- **There is no Asimov CAD/print tree on this disk** (per `_TABS/MEOK_LABS_TAB_PROFILE.md` §4, 2026-06-15). Numbers below assume an Asimov-class humanoid (≈23 actuator joints, 2× WOLF per leg, 2× per arm, 1× head, 1× waist = ~12–18 actuator slots depending on config).
- **Official Asimov v1 manual** (per memory `project_asimov_v1_manual`) splits parts into A/B/C classes:
  - **A = CNC aluminium** (structural load frames, hip/knee/shoulder/elbow housings). FDM won't meet tolerance.
  - **B = SLM 316L stainless** (high-stress inserts, gear hubs, bearing seats). FDM won't meet strength.
  - **C = MJF nylon** (covers, cable channels, sensor mounts). **FDM in PA12-CF is a viable substitute** with ~20% strength penalty.
- This quote list = the **pragmatic hybrid path C** (per the MEOK Labs dossier + the tab profile §6.3). NOT pure FDM, NOT pure industrial.
- All £ figures = working estimates based on typical UK/US prototype-job pricing as of early 2026. **Get live quotes before committing.** Order-of-magnitude is the goal here.

---

## 1. Per-joint fabrication split

| Class | Process | Why | Typical unit cost (small batch 1–23) | Qty / humanoid | Sub-total |
|---|---|---|---|---|---|
| **A — structural frames** (hip, knee, shoulder, elbow) | CNC 7075-T6 aluminium (Xometry / Protolabs / AME-Group UK) | Tolerances ±0.05mm, M3/M4 tapped, structural | **£80–£180** per frame × ~4 unique parts × 2 sides = 8 parts | 8 | **£640–£1,440** |
| **B — high-stress inserts** (gear hubs, bearing seats, motor mounts) | SLM 316L stainless (Xometry / Protolabs SLM) | Strength + tolerance in small features | **£60–£140** per insert × ~6 unique parts × 2 sides = 12 parts | 12 | **£720–£1,680** |
| **C — covers, channels, mounts** (panels, cable channels, sensor brackets, feet shells) | **FDM in PA12-CF on Qidi Max4** (in-house) | Volume + cosmetic + revisable | **£0.50–£2** filament cost per part × ~40 unique parts | ~80 prints | **£40–£160** (filament only) |
| **D — actuators** (WOLF V1.2) | 14 STLs each, 12 WOLFs minimum (2 per limb + waist) | We own the WOLF repo, sub-£200 BOM each | **£120–£180** WOLF BOM × 12 = ~£30 filament + bearings + fasteners | 12 | **£1,440–£2,160** |
| **E — motors + electronics** (Eaglepower 8318 100KV × 12, ESCs × 12, AS5047P × 12, cabling) | COTS | Per WOLF README BOM | **£180–£260** per joint × 12 | 12 | **£2,160–£3,120** |
| **F — IMU, compute, batteries, harness, frame fasteners** | COTS | One humanoid | lump | 1 | **£400–£800** |

### Sub-totals (per humanoid, 1× prototype)
- A + B outsourced (the actual £-outlay): **£1,360–£3,120**
- C in-house filament: **£40–£160**
- D WOLF actuators (12): **£1,440–£2,160**
- E motors + electronics: **£2,160–£3,120**
- F harness + compute + battery: **£400–£800**
- **TOTAL: £5,400–£9,360** (the dossier's "£5–9k hybrid" claim — verified within the same band)

### Scaling
- **2nd humanoid** = A + B drops ~30% (no setup), motors + WOLF BOM are linear → **£4,800–£8,100 per unit at 2-unit batch**
- **5 humanoid** = A + B drops ~50% (volume), **£4,200–£7,000 per unit at 5-unit batch**
- **A 23-joint Asimov** (using all WOLF slots) = +11 extra WOLFs ≈ +£1,800 → **£7,200–£11,200 for the full-robot build**

---

## 2. RFQ brief to send to Xometry + Protolabs + UK 2nd-source

### Xometry (instant-quote, US/EU, large catalogue)
- **Upload step files** (`.step` or `.iges`) for the 8× A parts + 12× B parts.
- Material: **7075-T6 aluminium** (A) / **316L stainless** (B).
- Tolerance: **±0.05 mm** standard; **±0.025 mm** for bearing seats if needed (B).
- Finish: **bead-blast + anodise black** (A, for cosmetics + corrosion), **as-machined** (B, for press-fit).
- Cert: **material cert + CMM inspection report** (one-time, ~£150 extra, worth it for the first article).
- Lead time: **5–10 business days** for small batch, **2–3 days premium**.

### Protolabs (faster, more expensive, EU/UK)
- Same upload, same materials, same tolerances.
- **Protolabs Network** in UK = excellent for the 12× B SLM parts.
- Lead time: **1–5 business days** with the "firstcut" tier (premium).

### UK 2nd-source (recommended for resilience)
- **Rapid Manufacturing** (RML, Merseyside) — CNC + SLM, ISO 9001, low-volume friendly.
- **3T (Additive Manufacturing Ltd, Berkshire)** — SLM specialist.
- **AME-Group (Eggborough, Yorkshire)** — CNC + SLM, Yorkshire-based, good for the A aluminium batch.

### Action item for Nick (estimated 2–4 hours of admin)
1. Get the Asimov CAD/STEP files — confirm where they live (M2? another drive? an upstream repo?). **Blocker for any real RFQ.**
2. Once STEP files are located: upload to Xometry + Protolabs + Rapid Manufacturing for instant quotes (~30 min per vendor for a small part set).
3. Compare quotes, pick primary + 2nd-source, place 1-unit A + 1-unit B test order (~£200–£400 spend to validate both vendors).
4. If test parts pass inspection → commit to the full 8+12 batch for first humanoid.

---

## 3. What this quote list does NOT cover (be honest)

- **WOLF SLA/SLS gears** — the WOLF V1.1 used Polysonic PLA, official V1.2 specs are PLA-tested, but SLS-printed nylon gears would significantly increase continuous torque (AnthroDev: "tested 90 Nm with PLA, expects more with SLS"). Adding SLS = another quote path. **Skip for v1 prototype.**
- **Carbon-fibre layup tubes** (the femur/tibia/humerus) — not in this list, ~£40–£80 per tube × 16 = ~£640–£1,280 add-on. An Asimov is mostly structural tubes.
- **Real Asimov BOM** — needs the actual manual + STEP set. Memory says "official Asimov v1 can't be built entirely on the Qidi" but I haven't seen the full manual. **Pull the Asimov v1 manual from upstream (Bechkoff? Open-dynamic-robot-initiative? Addify?) before locking any numbers.**
- **Labour / assembly time** — this quote list is parts only. Budget ~80–120 hours of assembly labour for the first humanoid.

---

## 4. Decision matrix for the 6 fab paths (from memory)

| Path | Approach | Cost | Lead time | Strength vs spec | Recommend? |
|---|---|---|---|---|---|
| **1. Full industrial** | All A = CNC, all B = SLM, all C = MJF | ~£18,000–£22,000 | 4–6 weeks | 100% | No — too expensive for v1 |
| **2. Mostly industrial** | A CNC, B SLM, C FDM PA12-CF | ~£9,000–£12,000 | 3–4 weeks | ~95% | Maybe — if Nick has £10k cash + 3 weeks |
| **3. Pragmatic hybrid (THIS)** | A CNC (only critical 4 parts), B SLM (only 6 inserts), C FDM, WOLF everywhere | **£5,400–£9,360** | 2–3 weeks | ~85% | **YES — recommended for v1** |
| **4. FDM-heavy** | A = printed aluminium-replacement (CF-nylon gussets), B = printed steel-substitute (CF-nylon+inserts), C = FDM | £800–£1,500 | 1 week | ~50% | No — won't pass structural gate |
| **5. Pure SLS/MJF** | All parts in nylon SLS | £3,000–£5,000 | 2 weeks | ~70% | No — actuator mounts will fail |
| **6. Sub-£3k "minimum viable humanoid"** | 2× WOLFs only (just arms), 3D-printed body, hobby ESCs, RC batteries | **£1,800–£2,800** | 1 weekend | ~40% | **YES — for the demo / viral video** |

**My recommendation:** build a Path 6 arm-only demo FIRST (~£2k, 1 weekend of assembly once the Qidi is back). Use it for the launch video, the HARVI/SO-101 cross-promo, and as the in-house proof that WOLF works under real load. THEN commit to Path 3 for the full humanoid.

---

## 5. Sigil

```
🛠️  ASIMOV_HYBRID_FAB_QUOTE_LIST  ·  ESTIMATE  ·  v0.1  ·  2026-06-15
PATHS_COSTED: 6 (1 industrial → 6 sub-£3k)
PATH_RECOMMENDED: 3 (pragmatic £5.4–9.4k) + 6 (arm-only demo £1.8–2.8k FIRST)
BLOCKER: Asimov STEP files (need to find on disk / M2 / upstream repo)
NEXT_ACTIONS: 4 (locate STEP · upload to 3 vendors · 1-unit A+B test order · commit to full batch)
RFQ_VENDORS: 3 (Xometry, Protolabs, Rapid Manufacturing) + 2 UK 2nd-source (3T, AME-Group)
COST_BAND_PER_HUMANOID: £5,400 – £9,360 (path 3) | £1,800 – £2,800 (path 6 arm-only)
```

---

*Source data: `_TABS/MEOK_LABS_TAB_PROFILE.md`, `revenue/MEOK_LABS_DOSSIER_2026-05-20.md`, memory `project_asimov_v1_manual` + `project_asimov_humanoid` + `reference_3d_printing_mastery`. Vendor pricing estimates are typical 2026 small-batch ranges; not live quotes.*
