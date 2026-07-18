# 📡 meok-sovereign-radar-mcp

**MEOK Sovereign Radar MCP** — mmWave radar sensor integration for the SOV3 sovereign substrate.

## Overview

Wraps 24GHz FMCW mmWave radar sensors (HLK-LD2450, HLK-LD1115H, Seeed MR24HPB) as a Model Context Protocol (MCP) server. Provides real-time presence detection, 2D target tracking (up to 3 simultaneous targets), and SIGIL-signed telemetry for the sovereign mesh.

## Tools (8)

| Tool | Purpose |
|---|---|
| `radar_connect` | Connect to radar node (UART or network) |
| `radar_get_targets` | Get current tracked targets (up to 3, 2D position) |
| `radar_get_presence` | Binary presence detection (occupied/clear) |
| `radar_set_zone` | Define detection zone boundaries |
| `radar_get_zone_status` | Check which zones are occupied |
| `radar_start_stream` | Start continuous MQTT telemetry stream |
| `radar_stop_stream` | Stop telemetry stream |
| `radar_care_floor` | Enforce care-floor constraints (no individual ID) |

## Care Floor Enforcement

- ❌ **NO individual identification** — targets are anonymous (Target 1, 2, 3 only)
- ❌ **NO biometric data** — no heart rate, no breathing rate, no gait analysis
- ❌ **NO tracking across zones** — each zone reports count only
- ✅ **Count-only mode** — "3 targets in Zone A" not "Person X is in Zone A"
- ✅ **SIGIL-signed** — every detection event is Ed25519 signed

## Supported Sensors

| Sensor | Range | Resolution | Cost | Protocol |
|---|---|---|---|---|
| HLK-LD2450 | 6m, 120° | 2D position, 3 targets | £8 | UART @ 256000 |
| HLK-LD1115H | 4m, 80° | Binary presence | £5 | UART @ 256000 |
| Seeed MR24HPB | 15m, 100° | Breathing + HR | £20 | UART |
| Infineon BGT60TR13C | 5m | FMCW, micro-Doppler | £35 | SPI/I2C |

## Installation

```bash
pip install meok-sovereign-radar-mcp
```

## Usage

```python
from meok_radar_mcp.server import mcp

# Connect to radar node
result = await mcp.call_tool("radar_connect", {
    "sensor_type": "HLK-LD2450",
    "connection": "uart",
    "port": "/dev/ttyUSB0",
    "baudrate": 256000
})

# Get targets
targets = await mcp.call_tool("radar_get_targets", {})
```

## License

MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
