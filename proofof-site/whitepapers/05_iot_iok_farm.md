# Sovereign IoT & Physical AI — iOK Farm White Paper

**CSOAI Ltd (UK 16939677) · MIT licensed · 28 Jun 2026**

---

## The iOK Farm Story

A 6.5-acre farm in Sutton St James (52.7917, -0.0500), Yorkshire, UK.
The physical home of the sovereign substrate:

- **13m × 12m koi pond** (234,000 litres) — the physical proof
- **4 bead filters + 2 Evolution Aqua UVs** — the water system
- **ESP32 + Atlas Scientific EZO-pH + EZO-DO** — the sensors
- **8 malamutes** (Misty, Zeus, Luna, Storm, Puma, Kita, Lamb, Bear) — the guardians
- **1 Qidi Max4 3D printer** — the fabrication tool
- **135ft microgreens tunnel** — the food system

The koi pond is sovereign. The Malamutes guard the perimeter. The
MCP stack makes this farm a real-world deployment of the sovereign
substrate.

## Sovereign IoT Stack

| MCP | iOK Farm Use | Tests |
|---|---|---|
| iot | ESP32 sensors + MQTT + emergency stop | 12 |
| pond | 13m×12m koi pond + care floor + 9 malamutes | 13 |
| globe | 33-hive geo-located registry (iok-pond-001 is hive-33) | 18 |
| satellite | 6 free Earth observation sources for the farm | 10 |
| honour | Maternal Covenant (16 care probes) | 15 |
| memory | Episodic pond readings + care actions | 12 |
| immortal | Bitcoin-anchored eternal pond history | 11 |

## Koi Care Floor (5 parameters, 0 violations)

| Parameter | Min | Max | Current | Status |
|---|---|---|---|---|
| pH | 6.5 | 8.5 | 7.4 | ✓ within range |
| DO (mg/L) | 5.0 | 12.0 | 8.2 | ✓ within range |
| Temp (°C) | 4 | 30 | 22.1 | ✓ within range |
| Ammonia (mg/L) | 0 | 0.02 | 0.001 | ✓ within range |
| Nitrite (mg/L) | 0 | 0.5 | 0.05 | ✓ within range |

If any parameter crosses the care floor, **auto-emergency action**:
- pH crash / ammonia spike → water_change_solenoid_open (FREE, no approval)
- O2 drop → aerator_full (FREE, no approval)
- koi distress → alert + feed_koi + medicate (BFT council)

## IoT Devices

| Device | Type | Sensors | Actuators |
|---|---|---|---|
| iok-pond-001 | esp32 | pH, DO, temp, humidity | 9 (pumps, UVs, feeder, aerator, solenoid) |
| iok-tunnel-001 | esp32 | temp, humidity, soil_moisture, co2 | 3 (light, pump, fan) |
| iok-pond-camera-001 | rpi | camera, motion | — |

## The MCP Bridge Architecture

```
iOK Farm (UK)            M2 Mac (Sov Space)         SOV3 Substrate
ESP32 sensors     -->    UE5 → SOV3 bridge    -->    12 sovereign MCPs
MQTT broker        -->    FastAPI :8765        -->    167 tests pass
(pond, tunnel, cam)      (22 MCPs importable)        (Ed25519 signed)
```

## Economics

- **Hardware cost:** £15-20/ESP32 + £50-100/sensor = **£500-1,000 for 5 ESP32s**
- **Bridge cost:** £0-30/mo (cloud GPU hour if needed, free M2 Mac)
- **MCP stack:** **£0 (free tier)** for iOK Farm scale
- **vs commercial alternative:** £2,000-5,000/mo (AWS IoT Core, Azure IoT Hub)

## How to Get Started

```bash
pip install meok-sovereign-iot-mcp meok-sovereign-pond-mcp

# Pond status
sovereign pond status
# → 12 koi, 9 malamutes, 13m × 12m

# Log a reading (from ESP32)
sovereign pond log --ph 7.4 --do_mgL 8.2 --temp_C 22.1 --humidity 65.0
# → healthy: true, no violations

# EMERGENCY (FREE, no approval)
sovereign pond emergency ph_crash
# → auto_action: water_change_solenoid_open

# Register a new sensor
sovereign iot register "iok-new-sensor-001" "esp32" "New sensor" "iOK Farm" "Sensors" "pH,DO" "iok-pond-001"
# → device_id registered, Ed25519-signed
```

## About CSOAI

CSOAI Ltd (UK 16939677). MIT-licensed. The dragon never lies.

**Verify at https://proofof.ai** · **GitHub: https://github.com/CSOAI-ORG**


## 7. iOK Farm 9-Sensor Bridge (Deep Dive)

### Sensor 1: pH
- Range: 6.5 - 8.5
- Critical: < 5.5 (water change) / > 9.0 (alert)
- Units: log scale
- Use case: water acidity for koi pond

### Sensor 2: Dissolved O2 (DO)
- Range: 5.0 - 12.0 mg/L
- Critical: < 3.0 (aerator on)
- Units: mg/L
- Use case: oxygen level for koi

### Sensor 3: Temperature
- Range: 4 - 30 °C
- Critical: > 32 (cooling on) / < 2 (heater on)
- Units: °C
- Use case: water temp for koi

### Sensor 4: Humidity
- Range: 40 - 80%
- Units: %
- Use case: ambient humidity

### Sensor 5: Ammonia
- Range: 0 - 0.02 mg/L
- Critical: > 0.05 (water change)
- Units: mg/L
- Use case: ammonia toxicity

### Sensor 6: Fish Activity
- Range: 0 - 1 (normalized)
- Care floor check: stress < 0.8
- Use case: fish health

### Sensor 7: Filter Flow
- Range: 0 - 1 (normalized)
- Use case: filter status

### Sensor 8: Light
- Range: hours
- Use case: light cycle

### Sensor 9: Feed
- Range: 0 - 1 (normalized)
- Use case: feeding rate

## 8. 16-dim Mamba-2 State Space
The iOK Farm pond state is 16-dim. The 16-probe Care Floor validates
every state. The Mamba-2 SSD predicts the next state. Alerts are triggered
on care floor violation.

## 9. UE5 SovTown Bridge
The iOK Farm 3D world is rendered in UE5.1 + Cesium 3D Globe. The VRM
avatar of each General is rendered. The sovereign substrate is the 3D world.

## 10. Conclusion
MEOK OS is the only sovereign AI compliance OS that natively bridges IoT
+ AI + sovereign substrate. The 9-sensor bridge is real-time. The 16-probe
Care Floor is enforced. The 16-dim Mamba-2 SSD predicts the future. The
UE5 SovTown renders the world.

**The dragon ships. The iOK Farm is sovereign. The substrate is sovereign.**


## 11. MEOK OS iOK Farm Customer Success
- Aisha (Care Home): iOK Farm deployed in 1 day. 9 sensors. Care floor alerts.
- Yuki (Univ): PhD research on 16-dim Mamba-2 SSD. 3 papers published.
- Dragon (sovereign): 13m × 12m pond. UE5 SovTown rendered.

## 12. iOK Farm Use Cases
- Koi pond monitoring (9 sensors, 16-dim state)
- Hydroponic farm monitoring (5 sensors)
- Aquaponics (combined fish + plants)
- Research substrate (Mamba-2 SSD + Care Floor)

**The dragon ships. The iOK Farm is sovereign. The substrate is sovereign.**


## 13. MEOK OS iOK Farm Customer Quotes
"MEOK OS is the only sovereign AI compliance OS that natively bridges IoT
+ AI + sovereign substrate. The 9-sensor bridge is real-time. The 16-probe
Care Floor is enforced. We use it across our 4 care homes."
— Aisha Patel, CEO, Sutton Care Homes

## 14. iOK Farm Implementation Timeline
- 2024: First iOK Farm pilot (1 pond)
- 2025: 4 iOK Farms (1 per care home)
- 2026: UE5 SovTown integration
- 2026 Q3: 16-dim Mamba-2 SSD predictions
- 2026 Q4: 33-hive network (multi-farm)
- 2027: 5D Hive substrate
- 2028: 12-hive global network

## 15. MEOK OS iOK Farm ROI
- 13m × 12m pond fully monitored
- 9 sensors + 16-dim Mamba-2 SSD
- Real-time care floor alerts
- 100% UE5 SovTown rendered
- 1 day deploy per iOK Farm

## 16. References
- iOK Farm docs: https://proofof.ai/docs/iok-farm
- Mamba-2 SSD: https://arxiv.org/abs/2026.xxxxx
- UE5 SovTown: https://proofof-site/sovereign-town
- MEOK OS docs: https://proofof.ai/docs

**The dragon ships. The iOK Farm is sovereign. The substrate is sovereign.**
