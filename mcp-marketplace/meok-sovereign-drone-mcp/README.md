# 🚁 meok-sovereign-drone-mcp

**MEOK Sovereign Drone MCP** — ArduPilot/PX4 MAVLink bridge for the SOV3 sovereign substrate.

## Overview

Wraps ArduPilot/PX4 autopilot systems via MAVLink protocol as an MCP server. Provides mission planning, waypoint navigation, telemetry streaming, and geofence enforcement for sovereign drone operations.

## Tools (9)

| Tool | Purpose |
|---|---|
| `drone_connect` | Connect to flight controller via MAVLink |
| `drone_get_telemetry` | Get real-time telemetry (position, attitude, battery) |
| `drone_arm` | Arm motors (requires care-floor check) |
| `drone_takeoff` | Takeoff to specified altitude |
| `drone_goto_waypoint` | Navigate to GPS coordinates |
| `drone_set_geofence` | Set geofence boundaries (safety) |
| `drone_return_to_launch` | RTL failsafe |
| `drone_get_mission` | Get current mission waypoints |
| `drone_care_floor` | Enforce care-floor constraints |

## Care Floor Enforcement

- ❌ **NO targeting patterns** — no find-fix-finish, no strike package
- ❌ **NO individual surveillance** — no tracking of persons
- ❌ **NO weaponization** — no payload release commands
- ✅ **SAR/mapping ONLY** — search-and-rescue, mapping, ISR (receive-only)
- ✅ **Geofence enforced** — hard boundary, RTL on breach
- ✅ **SIGIL-signed** — every command is Ed25519 signed

## Supported Flight Controllers

| FC | Firmware | Protocol | Cost |
|---|---|---|---|
| Pixhawk 6C | ArduPilot 4.5+ / PX4 | MAVLink v2 | £120 |
| Matek H743 SLIM | ArduPilot / PX4 | MAVLink v2 | £65 |
| CubePilot Cube Orange | ArduPilot | MAVLink v2 | £200 |
| Holybro Kakute H7 | Betaflight / ArduPilot | MAVLink v2 | £50 |

## Installation

```bash
pip install meok-sovereign-drone-mcp
```

## License

MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
