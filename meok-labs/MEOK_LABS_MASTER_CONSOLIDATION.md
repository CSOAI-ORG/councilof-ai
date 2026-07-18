# 🦾 MEOK Labs Master Consolidation (11 Jul 2026)
*Authored by: JEEVES (FORGE tab) for Nicholas Templeman.*
*Living document — append-only; replace only when structure changes.*

---

## Today's deltas (11 Jul 2026)

| Δ | File | Status |
|---|---|---|
| + | `meok-labs/radar/MEOK_AssuranceRadar_Firmware.ino` | NEW — Stage-0 firmware, 196 lines |
| + | `meok-labs/radar/verify_test.py` | NEW — 4/4 tests PASS, 100-frame batch verified |
| + | `meok-labs/oscal/MEOK_AssuranceRadar_OSCAL.json` | NEW — OSCAL 1.1.2, 7 control objectives |
| + | `meok-labs/print-manifest/MEOK_Radar_Print_Manifest.md` | NEW — Qidi settings, both tracks, Stage-0 coupon gate |
| + | `meok-labs/MEOK_TODAY_USER_ACTIONS.md` | NEW — 14-item user-action checklist |
| + | `_alignment/sovereign_merge_kit/sov33_pyramid_owem.py` | NEW — 4-tier pyramid (2 small + 1 big + 1 SOV33³ governor) |

---

## The full MEOK Labs (FORGE) inventory

### Stage-0 (live + verified, this session)
- ✅ **MEOK Assurance Radar** firmware (ESP32, LD2450, Ed25519, RFC-8785 JCS, /api/verify)
- ✅ **OSCAL assessment** for the radar (Stage-0, 7 objectives, 3 findings, OSCAL 1.1.2)
- ✅ **Print manifest** (radar module + WOLF plate 7, both tracks ready when printer on LAN)
- ✅ **User-action checklist** (14 items, every gate has a why-it's-blocked-from-agent-side)

### Dormant / awaiting Nick (per `MEOK_LABS_TAB_PROFILE.md`)
- 🔴 **Qidi Max4** — `192.168.50.21:7125` unreachable; new extruder ends not yet installed
- 🔴 **WOLF actuator plate 7** — printed parts 1–6 done April, plate 7 (assembly test) the next gate
- 🔴 **Asimov humanoid** — sim/policy only; no CAD/print tree on this disk (honest gap)
- 🔴 **HARVI rig** — specs exist; not built
- 🔴 **LeRobot SO-101** — `lerobot_bridge.py` exists (7 MCP endpoints); parts not ordered

### Cross-cutting
- **Care-gating** — every physical action validated by SOV3 Maternal Covenant
- **Harvest robotics** — shared with Tab 5 (IOK Farm)
- **CSOAI stamp standard** — applied to every structural/cosmetic print (Helvetica Bold, 1mm raised)

---

## Hard rules (binding)

1. **Honesty over hype** — Asimov humanoid is design/sim only (no print tree here). HARVI + LeRobot are specs, not built.
2. **Robotics print rules** — orient loads in XY (FDM 4× weaker in Z) · gyroid infill · DRY filament (nylon loses 42% strength wet) · heat-set inserts · holes +0.3mm · **N95 when sanding CF (hazardous dust)**.
3. **CSOAI stamp on every structural/cosmetic print** — Qidi Studio text tool, Helvetica Bold, 1mm raised, 6/10/16mm by part class.
4. **Qidi firmware** — use QIDI firmware only; do NOT update Klipper independently.
5. **Asimov A/B parts are NOT FDM-able** — outsource CNC-Al + SLM-steel.
6. **No `CSGA` / `James Castle` / `Terranova`** (severed).

---

## Index — all MEOK Labs deliverables

| Deliverable | Path | Purpose |
|---|---|---|
| Tab profile | `_TABS/MEOK_LABS_TAB_PROFILE.md` | Agent card, scope, rules |
| Ecosystem tabs | `_TABS/MEOK_ECOSYSTEM_TABS.md` | All-tab overview |
| Inbox | `_TABS/INBOX.md` | Where Nick drops line items |
| Radar firmware | `meok-labs/radar/MEOK_AssuranceRadar_Firmware.ino` | Stage-0 firmware (ESP32) |
| Radar verifier | `meok-labs/radar/verify_test.py` | Offline test harness (4/4 PASS) |
| Radar OSCAL | `meok-labs/oscal/MEOK_AssuranceRadar_OSCAL.json` | Stage-0 OSCAL 1.1.2 |
| Print manifest | `meok-labs/print-manifest/MEOK_Radar_Print_Manifest.md` | Qidi settings, both tracks |
| User actions | `meok-labs/MEOK_TODAY_USER_ACTIONS.md` | 14-item checklist |
| Master consolidation | `meok-labs/MEOK_LABS_MASTER_CONSOLIDATION.md` | THIS FILE |

---

## What we don't promise (honest gaps)

- ❌ The radar is not bench-tested yet (offline verifier PASSED; in-situ is gated on Nick's bench)
- ❌ WOLF plate 7 is not yet printed (printer unreachable; manifest ready)
- ❌ Asimov humanoid has no CAD/print tree (honest scope: sim + reference only)
- ❌ HARVI rig is specs only (not built)
- ❌ LeRobot SO-101 is specs only (parts not ordered)

When each gap closes, this file gets a Δ + commit. Append-only.