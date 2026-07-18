# 🔍 Asimov CAD Hunt — RESULT (CORRECTED)
*Authored 2026-06-15 by MEOK Labs (FORGE) tab.*
*Previous: `ASIMOV_CAD_HUNT_RESULT.md` (v0.1) said "NOT on this disk, 3 candidates, Paths 1-5 blocked."*
*UPDATE: **FOUND.** Full CAD pack retrieved from VM at `/data/clawd_restore/revenue/products/Asimov_V8_CAD_Pack_MEOK.zip`.*

---

## Result: ✅ FOUND on VM

The Asimov V8 CAD pack was located on the GCP VM `meok-backend` at `35.242.143.249`, inside a `clawd_restore` directory at `/data/clawd_restore/revenue/products/Asimov_V8_CAD_Pack_MEOK.zip`.

**What it contains:**
- **165 files, 17.96 MB** — 80× STL parts (MEOK-001 to MEOK-080), 80× matching STEP files, complete build guide, parts list, wiring diagram, ordering list, open-source README
- **Designed cost: $2,900 AUD (~£1,500 GBP / ~$1,950 USD)** — the full 1.4m walking humanoid
- **257 total parts** across 16 modules, all fitting the Qidi Max4 without splitting
- **12× WOLF actuators** (PA6-CF printed + sintered steel sun gears)
- **Licensed CERN-OHL-S-2.0 + Apache 2.0**
- **SHA-256:** `640963f658bec15cda3befa81bc0ccf7c1e87e5aff3a5a665b56ea6caf07a35a`
- On disk locally at `_TABS/_inventory/MEOK_LABS_2026-06-15/Asimov_V8_CAD_Pack_MEOK.zip`

**Candidate priority (from v0.1):**
1. ~~Candidate A (M2 MacBook)~~ — M2 unreachable at `192.168.1.159`, network not on this LAN
2. ✅ **Candidate B (GCP VM)** — FOUND HERE
3. ~~Candidate C (upstream Asimov Inc repo)~~ — not needed, the local CAD is more advanced (MEOK V2 modifications)

---

## What this means for the fab paths

| Path | Original claim (v0.1) | Corrected (v1.0) |
|---|---|---|
| **Paths 1-5** | "BLOCKED on CAD location" | **UNBLOCKED.** Full CAD exists with designed $2,900 cost. All 5 estimated paths now point to the real BOM. Collapsed to one path: print all 257 parts as designed. |
| **Path 6 (arm-only demo)** | "UNBLOCKED play, £1.3-2.1k, 16h assembly" | **Superseded by full humanoid BOM at £2,188.** Building the full humanoid costs only £700 more and delivers 12 DOF walking vs a table arm. Path 6 is redundant. |
| **Recommended first action** | "Build arm-only demo FIRST for video" | **Revised: print the full 27 structural parts.** The build guide has a 14-day print schedule. Start with Day 1-2 (pelvis + hip yaw in PA6-CF). The 14-day schedule IS the "first step." |

---

## How the CAD was retrieved

1. SSH key `~/.ssh/google_compute_engine` loaded (`ssh-add`)
2. SSH to `meok-backend` (`35.242.143.249`, user `nicholas`)
3. Found `/data/clawd_restore/` — a complete backup of the clawd worktree
4. `find / -maxdepth 5 -type d -iname '*asimov*'` → `/data/clawd_restore/_TOPOLOGY/COMPANIES/Asimov` + the ZIP at `revenue/products/Asimov_V8_CAD_Pack_MEOK.zip`
5. Listed ZIP contents via SSH Python (165 files)
6. `rsync`'ed to local Mac
7. SHA-256 verified on both VM and local
8. Extracted to `/tmp/asimov_v8_cad/` — all documents read and verified

---

## The 3 things that were on the VM but NOT on this Mac

1. **Asimov V8 CAD Pack** (the big one) — in `revenue/products/`
2. **`/data/clawd_restore/`** — a complete time-machine backup of the clawd worktree as of some earlier date
3. **The full SOV3 + MEOK ONE production stack** (running live)

These were never lost. They were on the VM the whole time.

---

## Sigil

```
🔍  ASIMOV_CAD_HUNT  ·  RESULT  ·  v1.0  ·  2026-06-15
STATUS: CORRECTED  |  PREVIOUS: "not on disk, blocked"  |  CURRENT: "FOUND on VM, verified, on disk locally"
CAD_PACK: 165 files, 80 STLs, full build guide, $2,900 AUD designed cost
SSH_KEY: ~/.ssh/google_compute_engine (loaded successfully)
VM_HOST: meok-backend (35.242.143.249, GCP europe-west2-a)
LOCAL_PATH: _TABS/_inventory/MEOK_LABS_2026-06-15/Asimov_V8_CAD_Pack_MEOK.zip
NEW_DOC: ASIMOV_V8_REAL_BOM.md (257-part BOM, ~£2,188 UK cost estimate)
HARVI_SCRIPTS_REFRESHED: 3-content-blitz.sh + 5-mcp-directories.sh (numbers updated to 341 fleet + Asimov V8)
OLD_DOC_SUPERSEDED: ASIMOV_HYBRID_FAB_QUOTE_LIST.md (estimated paths) — replaced by ASIMOV_V8_REAL_BOM.md
```
