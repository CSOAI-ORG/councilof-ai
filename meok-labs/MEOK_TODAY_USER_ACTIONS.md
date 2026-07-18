# 📋 MEOK Today — User-Action Checklist (11 Jul 2026)
*Authored by: JEEVES (FORGE tab) for Nicholas Templeman.*
*What ONLY Nick can do — every gate has a why-it's-blocked-from-the-agent-side.*

---

## Today's deltas (from JEEVES)

| Δ | What changed | Where |
|---|---|---|
| + | `MEOK_AssuranceRadar_Firmware.ino` (Stage-0, compilable ESP32 sketch, 196 lines) | `meok-labs/radar/` |
| + | `verify_test.py` (offline verifier, 4/4 tests PASS, 100-frame batch verified) | `meok-labs/radar/` |
| + | `MEOK_AssuranceRadar_OSCAL.json` (7 control objectives, 3 findings, OSCAL 1.1.2) | `meok-labs/oscal/` |
| + | `MEOK_Radar_Print_Manifest.md` (Qidi settings, both tracks, stage-0 coupon gate) | `meok-labs/print-manifest/` |
| + | `sov33_pyramid_owem.py` (4-tier pyramid: 2 small + 1 big + 1 SOV33³ governor) | `_alignment/sovereign_merge_kit/` |
| + | Groq API key wired (LEFT top-10% router, sub-second 70B) | `~/.sovereign/keystore/groq_api_key.txt` |
| - | DISK freed (820MB → QIDIStudio DMGs trashed, pip cache purged, 1.4GB free now) | n/a |
| ⚠ | Qidi Max4 STILL UNREACHABLE from M4 (`192.168.50.21:7125` no response) | n/a |
| ⚠ | OCI A1 24GB STILL capacity-blocked in `uk-london-1` | n/a |

---

## The checklist — what ONLY Nick can do

### 🔴 Print-related (gated on Qidi Max4 being on the LAN + extruder calibration)
| # | Action | Gate | Why agent can't do it |
|---|---|---|---|
| 1 | **Print the Stage-0 PA12-CF coupon** (50×50×10mm) | before any structural print | Agent can't reach the printer; Nick has the printer + the chamber view |
| 2 | **Print ONE radar module body** (Track 1, plate 1) | after Stage-0 coupon passes the bend-test | physical print, requires the new extruder ends Nick has |
| 3 | **Re-verify `192.168.50.21:7125` reachable from M4** | before any slicer push | printer is on a different LAN or off; agent can't wake it |
| 4 | **Install/calibrate the new extruder ends** | before any structural PA12-CF print | hardened bimetal nozzles need physical swap |
| 5 | **Confirm LD2450 baud = 256000** | before flashing `MEOK_AssuranceRadar_Firmware.ino` | per HLK datasheet v1.04 — verify on the actual sensor, not assume |
| 6 | **Print WOLF plate 7 (assembly test)** | the long-standing next gate | printer + bench assembly (magnet holder, alignment tool, 2020 load arm, crane brackets) |

### 🔴 Domain/IP/trademark (gated on browser/registry actions)
| # | Action | Gate | Why agent can't do it |
|---|---|---|---|
| 7 | **Confirm `openpatent.ai` domain + trademark** | before any "sovereign open-patent" launch claim | NIC/registry requires Nick's account; agent can't impersonate |
| 8 | **Register Oracle Cloud tenancy OCIDs** (if user wants OCI VM) | before any free-tier ARM deploy | Oracle sign-in is browser-required (Nick's own tenancy) |

### 🔴 Physical/parts order (gated on order + receive)
| # | Action | Gate | Why agent can't do it |
|---|---|---|---|
| 9 | **Order Stage-1 BOM** if coupon wicks | before radar bench test | ESP32 + LD2450 + battery + M3 inserts all need purchase |
| 10 | **Order ~£250 LeRobot SO-101 parts** | before any care-gated farm-robot pipeline | parts are physical; agent can't shop |
| 11 | **Measure PCB mount-hole coords on the LD2450** | before radar box STL is finalised | the physical PCB determines the M3 spacing |

### 🟡 Configuration (gated on Nick's specific choices)
| # | Action | Gate | Why agent can't do it |
|---|---|---|---|
| 12 | **Set `WIFI_SSID` + `WIFI_PASSWORD`** in `MEOK_AssuranceRadar_Firmware.ino` | before flashing | per-deployment; not in repo |
| 13 | **Choose the radar deployment site** (one room, one hallway, one care-home) | before sense-policy tuning | care-floor thresholds depend on the deployment context |
| 14 | **Confirm 12-buyer CRM tier weighting** (T1/T2/T3/T4 reply-rate estimates) | before any outreach | empirical signal score depends on Nick's experience + market |

---

## Stage-0 coupons / print summary (per Track)

**Track 1 — Radar module** (~10h print, ~£10 in filament, ALL new STLs):
1. `radar_body_v0.1.stl` — PA12-CF — 4h 30m
2. `radar_box_v0.1.stl` — PA12-CF — 2h 15m
3. `radar_radome_a_v0.1.stl` — **PLA (RF transparent)** — 45m
4. `radar_radome_b_v0.1.stl` — **PLA** — 30m
5. `radar_tamper_cap_v0.1.stl` — **TPU 95A** — 35m
6. `radar_mount_v0.1.stl` × 2 — PA12-CF — 1h 10m

**Track 2 — WOLF plate 7** (~8h print, ~£7 in filament, ASSEMBLY TEST):
1. `magnet_holder.stl` — PA12-CF — 1h 10m
2. `alignment_tool.stl` — PLA — 45m
3. `2020_load_arm.stl` — PA12-CF — 1h 50m
4. `shop_crane_bracket_A.stl` — PA12-CF — 2h 05m
5. `shop_crane_bracket_B.stl` — PA12-CF — 2h 05m

**Gating logic:** Stage-0 coupon must pass before any Track 1 or Track 2 print.

---

## What the agent did NOT do today (honesty)

- **Did NOT** print anything (Qidi is unreachable)
- **Did NOT** claim the radar works in-situ (only offline-verified)
- **Did NOT** claim Asimov humanoid (no CAD tree on disk)
- **Did NOT** claim HARVI rig is built (specs only)
- **Did NOT** claim LeRobot SO-101 is running (parts not ordered)

---

## What to copy-paste back to the agent (when ready)

When you've completed an action, drop a one-line status update in `~/clawd/_TABS/INBOX.md`:
```
→ MEOK Labs (FORGE): Stage-0 coupon PRINTED + bend-test passed — from Nick, [date]
→ MEOK Labs (FORGE): radar_body printed, ready for box — from Nick, [date]
→ MEOK Labs (FORGE): WOLF plate 7 magnet_holder printed — from Nick, [date]
→ MEOK Labs (FORGE): LD2450 baud confirmed 256000 — from Nick, [date]
→ MEOK Labs (FORGE): openpatent.ai domain owned — from Nick, [date]
```

The agent will then continue the bench-test, assembly, and integration paths.