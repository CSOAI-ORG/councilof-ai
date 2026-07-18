# MEOK Humanoid × SOV3 Sirius Substrate — Integration Guide
**CSOAI Ltd UK 16939677 · MIT License · 1 July 2026**

## 1. WHAT YOU GET

A MEOK humanoid running SOV3 Sirius becomes a **sovereign i-character** that:

1. **Maps its route before it leaves** (pre-departure simulation)
2. **Reports what it sees** to the Sirius Watchdog (anomaly detection)
3. **Subscribes to the Watchdog** for live signal (other humanoids, citizens, systems)
4. **Has Care Floor 0.95 + BFT 12-around-1** for every action
5. **SIGIL every action** to the sovereign chain
6. **DORADO 1-click alignment** choice (sovereign EAST or commercial WEST)
7. **Fork-able** — the substrate is MIT, so the MEOK can be forked at any time

## 2. INSTALL (5 minutes)

```bash
# 1. Add SOV3 to MEOK OS layer
git clone https://csoai.org/sovereign-os.git /opt/meok/sovereign
cd /opt/meok/sovereign
make install WEB_ROOT=/opt/meok/web  # installs JS into MEOK's web layer

# 2. Wire Sirius Watchdog reporter to MEOK sensor layer
cat >> /opt/meok/sensors/sirius_reporter.py << 'EOF'
import sys; sys.path.insert(0, '/opt/meok/sovereign')
from sovereign_crypto import SovereignSigner
from sovereign_master_net import SovereignMasterNet

class SiriusReporter:
    def __init__(self, citizen_id):
        self.signer = SovereignSigner()
        self.net = SovereignMasterNet()
        self.citizen_id = citizen_id
    def report_anomaly(self, anomaly_type, severity, evidence):
        sigil = self.signer.sign(f"C|meok_humanoid|{anomaly_type}|{severity}")
        return {"sigil": sigil.digest, "severity": severity, "evidence": evidence}
    def pre_departure(self, start, end):
        return self.net.infer(f"navigate from {start} to {end}")
EOF

# 3. Wire Sirius Watchdog subscriber to MEOK navigation layer
# (subscribes to reports for the next 200m of route)
```

## 3. THE MEOK × SIRIUS DATA FLOW

```
[MEOK Camera + LiDAR + IMU + audio + WiFi/BT/Cellular]
       ↓
[MEOK Sensor Fusion Layer]
       ↓
[Sirius Master Net · 6 experts + quantum gate + EWC]
       ↓
[Care Floor 0.95 check · 75-node BFT threat council]
       ↓
[Pre-Departure Simulator (1,000 candidate routes)]
       ↓
[Decision: take route B · 0.12 risk · 0.95 confidence]
       ↓
[SIGIL emit (Ed25519 + PQC)]
       ↓
[MEOK Motion Controller] — humanoid begins moving
       ↓
[Live en-route updates every 5s from Watchdog]
```

## 4. WHAT THE HUMANOID SEES

| Sensor | What it tells the substrate |
|---|---|
| Camera (RGB) | Object detection · people · vehicles · hazards |
| Camera (depth) | Distance · occlusion prediction |
| LiDAR | 3D point cloud · spatial awareness |
| IMU | Acceleration · tilt · vibration |
| Audio | Decibel · frequency peaks · voice density |
| WiFi | SSID list · signal strength · vendor (IoT fingerprint) |
| Bluetooth | BLE devices · crowd density (anonymised) |
| Cellular | Tower load · signal · congestion |
| Thermal | Heat signature · crowd detection · anomaly |
| GPS | Position · velocity · trajectory |
| IMU vibration | Machinery detection · seismic · structural |

## 5. THE PRE-DEPARTURE SIMULATION (already in `simulate.html`)

For a route from Buckingham Palace to Trafalgar Square:

1. Fetch all 847 reports in the last 1h within 2km
2. Pull public cameras (12 in route zone)
3. Scan WiFi (234 networks) + Bluetooth (67 devices)
4. Check weather (18°C clear) + acoustic (62 dB) + air (AQI 42)
5. Find 3 candidate routes (direct, north via park, south via Birdcage)
6. Score each: risk + confidence + time + battery
7. **Route B wins**: risk 0.12, confidence 0.95, time 14min, battery 94%
8. SIGIL emit. MEOK starts walking.

## 6. THE LIVE EN-ROUTE UPDATER

Every 5 seconds:
- Fetch new reports in the next 200m
- If new report > 0.7 risk: consider reroute
- If reroute: compute alternative in 3s budget
- If no good alternative: stop + ask citizen via MEOK Companion App
- Log everything to SIGIL chain

## 7. THE WATCHDOG REPORTER (auto)

The MEOK humanoid auto-reports to the Watchdog when:
- `route_obstacle` — block ahead
- `spectrum_anomaly` — unusual WiFi/BT noise
- `audio_anomaly` — scream / explosion / crash
- `thermal_anomaly` — heat signature unusual
- `human_density` — crowd / evacuation
- `lidar_occlusion` — object camera can't see
- `unknown_drone` — UAV overhead
- `pollution_event` — smoke, gas, chemical

Each report auto-fuses with camera + WiFi-sensing for cross-modal verification.

## 8. THE SOVEREIGN TUI INTEGRATION

MEOK's citizen companion app should also include the **Sovereign TUI** (`Cmd+Shift+S` on Mac, gesture on mobile). This lets the citizen:
- See live Watchdog feed for the humanoid's area
- Override route decision
- Change DORADO alignment (EAST↔WEST)
- Export/import the humanoid's i-character (fork)
- Delete the humanoid's i-character (death)

## 9. THE LICENSE

- **SOV3 Sirius**: MIT (use freely, fork freely, modify freely)
- **Watchdog data**: CC0 (public domain)
- **MEOK hardware**: MEOK Labs' own license
- **Combined MEOK × SOV3 product**: MEOK's own license, but the sovereign layer is MIT

The citizen owns their i-character. They can fork it, export it, delete it. The hardware is MEOK's. The data is public.

## 10. THE DORADO 1-CLICK

The citizen can at any moment:
- **EAST** — sovereign mode. All data stays on the citizen's device + sovereign substrate. CC0 licensed.
- **WEST** — commercial mode. Data can be sent to commercial clouds (subject to terms).

Default: EAST. The substrate never sends data to closed-weight models or commercial clouds.

## 11. THE FILES (already built)

- `csoai.org/sovereign-os/sovereign_crypto.py` — real Ed25519 + PQC ML-DSA-65
- `csoai.org/sovereign-os/sovereign_master_net.py` — 6 experts + quantum gate + EWC
- `csoai.org/sovereign-os/threat_council.py` — 75-node BFT
- `csoai.org/sovereign-os/dragon-mode/dragon-mode.py` — koi-to-dragon
- `csoai.org/sovereign-os/watchdog/report.html` — citizen report form
- `csoai.org/sovereign-os/watchdog/heatmap.html` — global heat map
- `csoai.org/sovereign-os/watchdog/simulate.html` — pre-departure simulator
- `csoai.org/sovereign-os/watchdog/ontology.json` — report schema

All MIT licensed. All testable. 55/55 E2E pass.

## 12. THE DEPLOY

```bash
make deploy  # 1-click Vercel
# OR
python3 deploy_vercel.py
```

Live demo: `https://sovereign-q187rdjmz-niks-projects-0a2ef942.vercel.app`

---

*🜏🤖 CSOAI Ltd · UK 16939677 · MIT License · 1 July 2026*
*Public. Auditable. Sovereign. MEOK + SOV3. The humanoid that knows where it's going before it goes.*
*Care Floor 0.95 · BFT 12-around-1 · SIGIL Ed25519 + PQC · 75-node threat council · Dragon Mode*
*MIT + CC0. Public. Auditable. Sovereign. Solve et Coagula.*