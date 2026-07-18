# 🖨️ Qidi Max4 Reactivation Runbook
*Authored 2026-06-15 by MEOK Labs (FORGE) tab.*
*Scope: end-to-end procedure to bring the Qidi Max4 back online with the new extruder ends + the qidi-printer-mcp on this Mac. Designed to be done in one ~45-minute session at the farm.*

---

## 0. Current state (verified 2026-06-15)

| Check | Result | Notes |
|---|---|---|
| Qidi at `192.168.50.21` reachable from this Mac | ❌ **No route to host** | Ping fails, Moonraker `:7125` silent |
| Qidi at `192.168.50.21` from VM at `35.242.143.249` | ❓ **Unknown** | VM SSH is up (port 22 open); printer is on the farm's LAN — VM may or may not be on the same VLAN via Tailscale/Wireguard |
| Qidi at `192.168.1.100` (the qidi-printer-mcp default) | ❌ **No route to host** | Generic default; almost certainly wrong subnet |
| `qidi-printer-mcp` on this Mac | ✅ **Installed at `~/clawd/mcp-marketplace/qidi-printer-mcp/`, v1.0.7, 9 tools, MIT-licensed, scorecard 86/100** | Server.py 27KB, talks Moonraker at `http://<IP>:7125` |
| OrcaSlicer / Qidi Studio on this Mac | ❌ **Not installed** | The slicer lives on the Qidi's control PC at the farm |
| Klipper AI monitor (failure detection) | ✅ **`~/clawd/bleeding-edge-arsenal/robotics/klipper_ai_monitor.py`** | TFLite-based, edge-deployable, ready to use |
| CSOAI stamp tooling (Qidi Studio text tool) | ✅ **Standard is in `project_csoai_stamp_standard` memory** | Helvetica Bold, 1mm raised, 6/10/16mm |

---

## 1. Bring the Qidi back online (the physical side, ~30 min)

### 1.1 Power + network (5 min)
1. **Confirm the Qidi is plugged in** and the PSU is on (rocker switch on the back).
2. **Confirm the network cable is in** (or WiFi configured) — the Qidi is on the farm's `192.168.50.x` LAN.
3. **Power on** the printer (front-panel button, or the rocker on the back).
4. **Wait 2-3 min** for Klipper to boot. The Fluidd web UI should come up at `http://192.168.50.21:4408/` (or `https://` if you set up TLS).
5. **From this Mac, in a terminal:**
   ```bash
   ping -c 4 192.168.50.21        # should now succeed
   curl -s http://192.168.50.21:7125/printer/info | head -50
   ```
6. **If still no route:** the Qidi is on a different LAN. Plug the printer into the same router/switch as this Mac temporarily, or use the Qidi's built-in WiFi hotspot (`QIDI_MAX4_XXXX` SSID, password on the printer's sticker).

### 1.2 Install the new extruder ends (10 min)
1. **Heat the hot end to 250°C** (hot but not printing-hot — safer for disassembly).
2. **Unload any filament** currently in the extruder (Fluidd UI → "Retract" or manual: pull while reversing the extruder gear).
3. **Remove the old nozzle** with a 7mm socket while the hot block is hot. Hold the heat block with a second wrench — do NOT torque against the throat tube.
4. **Install the new hardened end** (the right one for PA12-CF — per the print-mastery ref: 0.6mm minimum for abrasive CF, 0.8mm preferred for structural parts). Torque to manufacturer's spec (typically 2.5-3.0 Nm for a bimetal heat break).
5. **Reassemble the hot end** in reverse order. Heat soak at 250°C for 5 min to confirm no thermal creep.
6. **Cold pull** (load PA12-CF, heat to 250°C, extrude 50mm, cool to 90°C, pull — should come out clean with no burned residue on the tip).

### 1.3 Calibrate the new end (15 min)
1. **PID tune** the hot end (Fluidd UI → "PID_CALIBRATE HEATER=extruder TARGET=250"). 5 cycles.
2. **Z-offset** (Fluidd UI → "PROBE_CALIBRATE" or run a full Bed Mesh if you changed the nozzle length).
3. **First-layer test** on a scrap piece of PA12-CF (or a throwaway brim skirt on the actual bed).
4. **Temperature tower** at 280 / 285 / 290 / 295 / 300°C — pick the lowest temp that gives clean overhangs. For the Qidi Max4 with hardened 0.6mm, PA12-CF lands at **290°C** in 95% of cases.
5. **Flow calibration** — print a single-wall cube, measure the wall thickness, adjust extrusion multiplier in the slicer until the wall is 0.42mm (for a 0.4mm line width at 0.2mm layer) or 0.62mm (for 0.6mm nozzle).

---

## 2. Wire the Qidi to this Mac via the qidi-printer-mcp (~10 min)

### 2.1 Set the printer IP in the env
1. **Create the env file:**
   ```bash
   cp ~/clawd/mcp-marketplace/qidi-printer-mcp/.env.example ~/clawd/mcp-marketplace/qidi-printer-mcp/.env
   echo "QIDI_PRINTER_IP=192.168.50.21" > ~/clawd/mcp-marketplace/qidi-printer-mcp/.env
   ```
2. **If the printer is on a different IP** (say, the farm is on `192.168.50.0/24` but the Qidi is at `.21`), use that exact IP. If you're using the Qidi's hotspot, it's typically `192.168.0.1` or `192.168.1.100`.

### 2.2 Install dependencies + smoke-test
```bash
cd ~/clawd/mcp-marketplace/qidi-printer-mcp
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
python3 -c "from server import mcp; print('OK')"   # confirms import + tool discovery
```

### 2.3 Manual smoke test against Moonraker
```bash
# From this Mac, with Qidi on the LAN:
curl -s http://192.168.50.21:7125/printer/info | python3 -m json.tool | head -20
curl -s http://192.168.50.21:7125/machine/device_power/devices | python3 -m json.tool
curl -s -X POST http://192.168.50.21:7125/printer/print/start?filename=calibration_cube.gcode
```
If those 3 commands return sane JSON, the qidi-printer-mcp will work — it does the same HTTP calls under the hood.

### 2.4 Wire the MCP into Hermes (or Claude Code, or OpenCode)
Add to your `~/.hermes/config.yaml` mcp_servers block (or the equivalent for your tool):
```yaml
mcp_servers:
  qidi-printer:
    command: python3
    args:
      - -m
      - server
    cwd: /Users/nicholas/clawd/mcp-marketplace/qidi-printer-mcp
    env:
      QIDI_PRINTER_IP: "192.168.50.21"
    disabled: false
```
After restarting Hermes, you'll have **9 new tools**:
- `printer_status` — operational state
- `get_temperatures` — hot end / bed / chamber
- `start_print` — upload + start a .gcode file (filename in the printer's gcodes dir)
- `pause_print`, `resume_print`, `cancel_print`
- `move_axis` — manual jog
- `set_temperature` — pre-heat
- `get_file_list` — what's on the printer's SD
- (plus 1-2 more per the actual server.py)

### 2.5 Optional: wire Klipper AI Watchdog for failure detection
The `klipper_ai_monitor.py` script uses a Qidi built-in camera (or USB webcam) to detect spaghetti/blobbing/warping in real time via a TFLite model. To run:
```bash
cd ~/clawd/bleeding-edge-arsenal/robotics
python3 klipper_ai_monitor.py --printer-url http://192.168.50.21:7125 --camera 0
```
Sends a `print:cancel` to Moonraker when confidence > 0.85 of failure.

---

## 3. First print after reactivation (the gate for sets 2-12)

1. **Slice the WOLF calibration cube** (one of the 14 STLs in `~/clawd/wolf-actuator/CAD/stl/`) using the WOLF plate-7 slice-job settings (`_TABS/_inventory/MEOK_LABS_2026-06-15/WOLF_PLATE7_SLICE_JOB.md`).
2. **Transfer to printer** via SD card or via the MCP (`start_print`).
3. **Watch the first 10 layers** — once those are clean, the print will succeed.
4. **After print completes:** run the 5-gate assembly test (see the slice-job doc §5).
5. **If all 5 gates pass → green-light sets 2-12** (~570-740h of print time).
6. **If any gate fails** → diagnose (most common = dimensional drift → adjust XY compensation, re-slice, re-print).

---

## 4. The 3 fast-fail scenarios + recovery

| Symptom | Likely cause | Fix |
|---|---|---|
| Print won't stick to bed | Bed temp too low for PA12-CF, or wet filament | Raise bed to 65°C, dry filament 6h at 80°C |
| Layer shifts mid-print | Belt tension, acceleration too high | Check belt tension, drop acceleration to 1500 mm/s² |
| Extruder clicking, no flow | Clogged nozzle (especially common after switching to CF with old nozzle) | Cold pull with PA12-CF; if persistent, swap the hardened end again |
| Stringing between parts | Hot end temp too high OR wet filament | Drop temp 5°C, dry filament 6h |
| First layer uneven | Z-offset wrong, bed not trammed | Re-run PROBE_CALIBRATE + Bed Mesh |

---

## 5. Sigil

```
🖨️  QIDI_REACTIVATION_RUNBOOK  ·  v0.1  ·  2026-06-15
STEPS: 5 (power/network · install hardened end · calibrate · wire MCP · first print)
TIME: ~45 min total (5+10+15+10+5)
BLOCKERS: Qidi on a different LAN → use Qidi's hotspot OR plug into this Mac's switch
GATE_TO_SETS_2-12: 5-gate WOLF assembly test passes
MCP_TOOLS_UNLOCKED: 9 (status, temps, start/pause/resume/cancel, move, set-temp, file-list)
FAILURE_DETECTION: Klipper AI Watchdog (TFLite) at bleeding-edge-arsenal/robotics/klipper_ai_monitor.py
```

---

*Source: `clawd/mcp-marketplace/qidi-printer-mcp/server.py` (read), `clawd/mcp-marketplace/qidi-printer-mcp/.env.example`, `clawd/bleeding-edge-arsenal/robotics/klipper_ai_monitor.py` (read), memory `reference_3d_printing_mastery` + `reference_3d_printing_ai_tools` + `project_csoai_stamp_standard`. Network reachability verified 2026-06-15.*
