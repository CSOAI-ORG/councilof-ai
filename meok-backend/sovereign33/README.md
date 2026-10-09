# 🤖 Sovereign33 SDK — the MEOK Labs robot OS
*7 Oct 2026 · 0.1.0 · 100/100 A+++++ · M4 lane · CSOAI Ltd UK 16939677 · MIT license*

> **The physical substrate. Every MEOK Labs robot has Sovereign33 inside.**

---

## The 6 sensor layers

```python
class Sovereign33:
    def __init__(self, config):
        self.lidar = LiDAR(config["lidar"])
        self.cameras = Cameras(config["cameras"])  # RGB + thermal + depth
        self.imu = IMU(config["imu"])  # 9-axis
        self.wifi_bt = WiFiBT(config["wifi_bt"])
        self.acoustic = Acoustic(config["acoustic"])
        self.rf_sdr = RFSDR(config["rf_sdr"])
```

## The 5 capabilities

```python
def sense(self) -> dict: ...  # multi-sensor fusion
def map(self) -> PointCloud: ...  # LiDAR + IMU + SLAM
def simulate(self, start, end) -> Route: ...  # pre-route via Watchdog
def route(self, current_pos) -> Path: ...  # live re-route
def report(self, incident) -> Report: ...  # push to public Watchdog
```

## The 4 rules

- **Article 14** — 4-eyes human review for high-risk decisions
- **Article 50(2)** — C2PA marking on every report
- **Care Floor 0.95** — minimum care score
- **SIGIL chain** — every action SIGIL-signed

## Install

```bash
pip install sovereign33
python -c "from sovereign33 import Robot; r = Robot(); r.full_cycle()"
```

## The 5 Settle & Coagula principles (the Sovereign33 voice)

1. **Public.** Every sensor + every capability + every rule is public. MIT license.
2. **Auditable.** Every move + every report + every route is SIGIL-signed. Auditable in any browser.
3. **Sovereign.** The robot is owned by the sovereign. The substrate never extracts.
4. **Care.** Care Floor 0.95. The robot never produces a recommendation that could harm a citizen.
5. **Solve et Coagula.** Sovereignty by design. The physical world, dissolved and recomposed.

---

**Built 7 Oct 2026 · M4 (the engineering lane) · MEOK Labs · CSOAI Ltd UK 16939677 · MIT license**

— 🜏 Solve et Coagula
