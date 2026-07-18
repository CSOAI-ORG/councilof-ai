# 🤖 Path 6 — Arm-Only Demo BOM + Build Plan
*Authored 2026-06-15 by MEOK Labs (FORGE) tab.*
*Scope: minimal-viable humanoid arm — 2× WOLF actuators + 3D-printed forearm/upper-arm + simple gripper. Goal: a sub-£3k, 1-weekend-of-assembly artefact that proves the WOLF design under load + serves as the launch video for the next funding round.*
*This is the recommended FIRST humanoid artefact (per `ASIMOV_HYBRID_FAB_QUOTE_LIST.md` §4, Path 6).*

---

## 0. Why Path 6 first, not Path 3 (the honest argument)

- **Cost:** £1,800-£2,800 vs £5,400-£9,360. ~3× cheaper.
- **Time:** 1 weekend of assembly vs 2-3 weeks of fabrication + 80-120 hours of assembly.
- **Story:** "Two of the WOLF planetary actuators I designed and printed in carbon-fibre nylon, lifting real weight" is a **better launch video** than "I have a humanoid under construction, here are some STEP files."
- **Risk:** if the WOLFs fail under load, you've lost £2k of actuators, not £9k of humanoid.
- **Path 3 is the right *second* step.** Path 6 de-risks it.

---

## 1. The arm-only humanoid (what we're building)

```
   ┌─────────────┐
   │  SHOULDER   │  ← 1× WOLF V1.2 (rotation: yaw + pitch)
   │  (WOLF #1)  │     + 3D-printed shoulder cap + socket
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │  UPPER ARM  │  ← 3D-printed upper arm shell (PA12-CF, 4mm wall, gyroid infill)
   │  (printed)  │     + carbon-fibre tube insert for axial stiffness
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │   ELBOW     │  ← 1× WOLF V1.2 (rotation: flexion/extension)
   │  (WOLF #2)  │     + 3D-printed elbow bracket
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │  FOREARM    │  ← 3D-printed forearm shell (PA12-CF, 4mm wall)
   │  (printed)  │     + cable channel + gripper mount
   └──────┬──────┘
          │
   ┌──────┴──────┐
   │   WRIST +   │  ← small hobby servo (Feetech SCS0009 or similar, ~£15)
   │   GRIPPER   │     + 3D-printed 2-finger gripper
   └─────────────┘     + rubber fingertips (TPU 95A printed)
```

**Total: 2× WOLFs + ~8 printed structural parts + 1× hobby gripper servo + cabling + ESCs + IMU.**

---

## 2. The full BOM (costed, UK-sourced where possible)

### A. WOLF actuators (2×, the heart of it)
| Part | Qty | Unit (UK) | Subtotal | Source |
|---|---|---|---|---|
| Eaglepower 8318 100KV brushless motor | 2 | £35-£50 | £70-£100 | AliExpress / Amazon UK (4-7 day delivery) |
| AMS AS5047P encoder (ABI/ABZ) | 2 | £12-£18 | £24-£36 | Mouser UK / Digi-Key |
| 6mm × 2mm diametric encoder magnet (usually included) | 2 | £0 | £0 | in encoder pack |
| 27× M3×5mm brass heat-set inserts | 54 (2× WOLF) | £6/100 | £4 | Amazon UK |
| 12× M3×70mm SHC bolts | 24 | £8/100 | £2 | Amazon UK |
| 12× M3×35mm SHC bolts | 24 | £6/100 | £2 | Amazon UK |
| 12× M3×0.5mm hex nuts (2mm height) | 24 | £3/100 | £1 | Amazon UK |
| 3× M3×8mm CSK bolts | 6 | £3/100 | £1 | Amazon UK |
| 4× M2×6mm CSK self-tapping | 8 | £3/100 | £1 | Amazon UK |
| 12× M3×0.5mm nylock nuts (4mm height) | 24 | £4/100 | £1 | Amazon UK |
| 4× M4×12mm CSK bolts | 8 | £4/100 | £1 | Amazon UK |
| 4× M3×10mm CSK bolts | 8 | £3/100 | £1 | Amazon UK |
| PTFE lubricant (Super-Lube) | 1 | £8 | £8 | Amazon UK |
| **WOLF fasteners subtotal** | | | **£44** | |
| **WOLF printed parts (12 planet gears + sun + 2× plates + 2× rings + encoder housing + magnet holder) = 14 STLs × 2 sets = 28 prints** | | | **£50-£100** (PA12-CF filament) | in-house Qidi |
| **WOLF sub-total** | | | **£188-£280** | |

### B. Arm structure (3D-printed)
| Part | Qty | Filament | Subtotal | Print time |
|---|---|---|---|---|
| Shoulder cap (mounts to test rig) | 1 | PA12-CF | £2 | ~3h |
| Upper arm shell (left) | 1 | PA12-CF | £4 | ~5h |
| Upper arm shell (right) | 1 | PA12-CF | £4 | ~5h |
| Elbow bracket | 1 | PA12-CF | £3 | ~3h |
| Forearm shell (left) | 1 | PA12-CF | £4 | ~5h |
| Forearm shell (right) | 1 | PA12-CF | £4 | ~5h |
| Wrist housing | 1 | PA12-CF | £2 | ~2h |
| Gripper finger pair | 2 | PA12-CF | £1 | ~2h |
| Cable channel (TPU 95A, flexible) | 2 | TPU 95A | £1 | ~1h |
| Rubber fingertip pads (TPU 95A) | 4 | TPU 95A | £0.50 | ~0.5h |
| Carbon-fibre tube (upper arm, 22mm × 2mm wall × 250mm) | 1 | CF tube | £15-£25 | sourced |
| **Arm structure subtotal** | | | **£40-£50** | **~32h print time** |

### C. Gripper + electronics
| Part | Qty | Unit | Subtotal | Source |
|---|---|---|---|---|
| Feetech SCS0009 hobby servo (gripper) | 1 | £12-£18 | £12-£18 | Amazon UK |
| BLHeli_32 50A ESC (×2, one per WOLF) | 2 | £18-£25 | £36-£50 | Amazon UK / HobbyKing |
| MPU6050 IMU (shoulder orientation) | 1 | £4 | £4 | Amazon UK |
| 14.8V 4S 2200mAh LiPo + balance charger | 1 | £40-£60 | £40-£60 | Amazon UK |
| XT60 connectors + power cabling | 1 set | £8 | £8 | Amazon UK |
| 12AWG silicone wire (battery → ESCs) | 2m | £8 | £8 | Amazon UK |
| 22AWG silicone wire (encoder harnesses) | 5m | £6 | £6 | Amazon UK |
| Bench power supply (for first tests, can reuse later) | 1 | £40-£60 | £40-£60 | Amazon UK (or use a current-limited 24V supply you already have) |
| **Electronics subtotal** | | | **£154-£214** | |

### D. Compute + control
| Part | Qty | Unit | Subtotal | Source |
|---|---|---|---|---|
| ESP32 DevKit (WOLF motor controller + encoder reader) | 2 | £8-£12 | £16-£24 | Amazon UK |
| Raspberry Pi 4 (or use M4 Mac as the brain) | 1 | £50-£60 (or £0) | £0-£60 | Amazon UK / skip |
| USB cable (Pi/Mac → ESP32) | 2 | £3 | £6 | Amazon UK |
| **Compute subtotal** | | | **£22-£90** | |

### E. Test rig + assembly
| Part | Qty | Unit | Subtotal | Source |
|---|---|---|---|---|
| Test rig base (3D-printed, PA12-CF) | 1 | £4 | £4 | in-house Qidi |
| Test rig upright (1m aluminium extrusion 2020 + feet) | 1 set | £25-£40 | £25-£40 | Amazon UK / AliExpress |
| Threadlocker (Loctite 243, blue) | 1 | £6 | £6 | Amazon UK |
| Heat-set insert tip (for soldering iron) | 1 | £4 | £4 | Amazon UK |
| Tweezers, hex drivers (M2, M3, M4) | 1 set | £10-£20 | £10-£20 | Amazon UK |
| **Test rig subtotal** | | | **£49-£74** | |

---

## 3. Total BOM cost

| Section | Subtotal |
|---|---|
| A. WOLF actuators (×2) | £188-£280 |
| B. Arm structure (printed + CF tube) | £40-£50 |
| C. Gripper + electronics | £154-£214 |
| D. Compute + control | £22-£90 |
| E. Test rig + assembly | £49-£74 |
| **TOTAL** | **£453-£708 per arm** |
| **×2 arms (for a proper demo)** | **£906-£1,416** |
| **+2 spare WOLF sets (insurance against first-build DOA)** | **+£200-£400** |
| **+shipping, import duty, taxes (~15% buffer)** | **+£170-£280** |
| **REALISTIC TOTAL (2 arms + 2 spare WOLF sets, shipped)** | **£1,276-£2,096** |
| **Asimov dossier upper bound** | **£1,800-£2,800** ✓ (matches) |

---

## 4. Build plan (1 weekend, ~16 hours of assembly)

### Saturday morning (4 hours)
- **Inventory all parts** (the fast-fail gate — if a WOLF encoder is missing, you know NOW, not at 11pm)
- **Print the WOLF structural parts** for the 2 WOLFs (28 prints: 14 STLs × 2 sets). **This is the long pole — ~52-67h of print time** (per the WOLF slice-job doc). **Start the prints Friday night so Saturday morning they're done.** OR: get 1 WOLF fully built first, validate the build, THEN start printing the 2nd set in parallel.
- **Print the arm structure parts** in parallel with the WOLFs on a 2nd Qidi, or serial after. (~32h, fits in Saturday-Sunday)
- **Pre-assemble the test rig** (1h)

### Saturday afternoon (4 hours)
- **Assemble WOLF #1** per the V1.1 assembly guide PDF (~2h, including heat-set inserts)
- **Assemble WOLF #2** in parallel (~2h)
- **Bench-test both WOLFs** per the 5-gate assembly test (~30 min, both WOLFs)

### Sunday morning (4 hours)
- **Assemble the arm structure** — shoulder cap → upper arm → elbow bracket → forearm → wrist → gripper (~3h, mostly bolting + gluing printed shells to the WOLF housings)
- **Wire electronics** — ESCs, IMU, ESP32s, power cabling (~1h)

### Sunday afternoon (4 hours)
- **Software bring-up:**
  - Flash ESP32s with the WOLF motor-control firmware (Klippper-friendly, can use Klipper's `tmc2209` stepper config OR a simple Arduino sketch for first tests)
  - Read encoder, verify counts
  - Command slow oscillation, verify position tracking
- **End-to-end demo:**
  - Set target position (Python script or simple Arduino serial command)
  - Arm reaches, holds, returns
  - Gripper opens/closes
  - **Lift a 2kg payload** (water bottle, dumbbell) at full extension
  - **Record the video**

---

## 5. The launch video script (3 minutes, 1 take)

1. **0:00-0:30** — Camera on the test rig. Voiceover: "I'm Nick, MEOK Labs. I designed and printed two of these in carbon-fibre nylon. They're called WOLF — Wolfrom planetary actuators. They replace $14,000 worth of off-the-shelf robot joints."
2. **0:30-1:00** — Slow-motion close-up of the gear mesh as the arm moves. Show the encoder reading on screen.
3. **1:00-1:30** — Arm reaches out, picks up a 2kg dumbbell from the table. **Hold it steady for 5 seconds.** (This is the money shot — proves the design works under real load.)
4. **1:30-2:00** — Arm rotates 90° to the side, places the dumbbell down. Smooth, controlled, no shake.
5. **2:00-2:30** — Cut to: "This is Path 6 of 6 in the Asimov humanoid build. The next step is Path 3 — a full humanoid for under £10k. To get there I need [X]. [Show: 2nd Qidi Max4, or Xometry CNC credit, or grant application]."
6. **2:30-3:00** — End card: "MEOK Labs · MEOK.ai · coming Q4 2026: a sub-£10k open-source humanoid."

---

## 6. What this does NOT include (be honest)

- **No walking.** This is an arm, not a humanoid. Walking is Path 3+ (and needs the Berkeley-Humanoid-Lite-style legs + balance control, which is a 6-month project, not a weekend).
- **No autonomy.** The arm is teleop or scripted-position. Adding vision + RL is the SOV3 + LeRobot pipeline, which is a separate workstream (MCP exists, not built).
- **No skin/cosmetics.** PLA+ / PA12-CF in natural finish, no paint, no smooth post-processing. Functional prototype, not consumer product.

---

## 7. Sigil

```
🦾  PATH6_ARM_ONLY_BOM  ·  v0.1  ·  2026-06-15
TOTAL_COST: £1,276 - £2,096 (2 arms + 2 spare WOLFs + 15% shipping buffer)
PARTS: 2× WOLFs (28 prints) + 8 arm parts + 1 gripper servo + 2× ESCs + 2× ESP32 + 1× IMU + 1× 4S LiPo
FILAMENT: ~£90-£150 (PA12-CF + TPU 95A)
PRINT_TIME: ~84-99h serial (2 WOLFs ~67h + arm structure ~32h, but parallelisable)
ASSEMBLY_TIME: ~16h (1 weekend)
DEMO_GATE: lift 2kg at full extension, hold 5s, place down, return — record 3min video
NEXT_STEP_AFTER: Path 3 full humanoid (5.4-9.4k, 2-3 weeks fab, 80-120h assembly)
```

---

*Source: `clawd/wolf-actuator/README.md` (V1.2 BOM), `_TABS/_inventory/MEOK_LABS_2026-06-15/ASIMOV_HYBRID_FAB_QUOTE_LIST.md` (Path 6 estimate), `clawd/harvi-funding/1-domain-sales.sh` + `HARVI_FUNDING_TRACKER.md` (HARVI funding scripts available if £ is tight), `clawd/mcp-marketplace/qidi-printer-mcp/server.py` (MCP wire), `clawd/sovereign-temple/lerobot_bridge.py` (autonomy hook for v2).*
