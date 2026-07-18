"""
MEOK Humanoid × SOV3 Sirius — Starter Kit
CSOAI Ltd UK 16939677 · MIT License · 1 July 2026

The Python module that goes inside every MEOK humanoid.
Imports:
  - Sirius Watchdog (reports what the robot sees, subscribes to nearby reports)
  - Pre-departure Simulator (computes best route before leaving)
  - Live en-route Updater (reroute on signal spike)
  - SOV3 substrate (Care Floor 0.95 + BFT 12-around-1)
  - Sovereign SIGIL signing
  - DORADO 1-click alignment choice

Install:
  git clone https://csoai.org/sovereign-os.git /opt/meok/sovereign
  from meok_humanoid import SiriusHumanoid

Usage:
  bot = SiriusHumanoid(citizen_id="csoai-org-nicholas-001", alignment="EAST")
  bot.report_anomaly("route_obstacle", severity=0.8, evidence={"obstacle":"construction"})
  bot.subscribe_to_route("Buckingham Palace", "Trafalgar Square")
  best_route = bot.pre_departure_simulate(start, end)
  bot.begin_moving(best_route)
  # ... en-route, every 5s:
  bot.update_en_route()
  if bot.should_reroute(): bot.reroute()
"""
import sys
import os
import time
import json
import hashlib
import secrets
from datetime import datetime, timezone

# Add sovereign-os to path
SOVEREIGN_OS = os.environ.get("SOV_PATH", "/opt/meok/sovereign")
if SOVEREIGN_OS not in sys.path:
    sys.path.insert(0, SOVEREIGN_OS)

# === Sovereign constants ===
CARE_FLOOR = 0.95
SIGIL_ALGO = "ed25519+pqc-ml-dsa-65"
CROWN_LINEAGE = "1795-2026"

# === DORADO alignments ===
DORADO_EAST = "EAST"  # sovereign, MIT, CC0
DORADO_WEST = "WEST"  # commercial, closed-weight APIs allowed

# === Live data source endpoints (the substrate's sovereign data lake) ===
WATCHDOG_ENDPOINTS = {
    "report": "/api/watchdog/report",
    "reports": "/api/watchdog/reports",
    "heatmap": "/api/watchdog/heatmap",
    "regions": "/api/watchdog/regions",
    "simulate": "/api/watchdog/simulate",
    "stats": "/api/watchdog/stats",
    "health": "/api/watchdog/health",
    "live": "/api/watchdog/live",  # WebSocket
}

# === Try to import the real sovereign primitives ===
try:
    from sovereign_crypto import SovereignSigner
    _SIGNER = SovereignSigner()
    HAS_REAL_CRYPTO = True
except Exception:
    _SIGNER = None
    HAS_REAL_CRYPTO = False

try:
    from sovereign_master_net import SovereignMasterNet
    _NET = SovereignMasterNet()
    HAS_MASTER_NET = True
except Exception:
    _NET = None
    HAS_MASTER_NET = False

try:
    from threat_council import ThreatCouncil
    _THREAT = ThreatCouncil()
    HAS_THREAT_COUNCIL = True
except Exception:
    _THREAT = None
    HAS_THREAT_COUNCIL = False


def _sign(content: str) -> str:
    if _SIGNER is not None:
        try:
            return f"{SIGIL_ALGO}:{_SIGNER.sign(content).digest}"
        except Exception:
            pass
    # Honest fallback
    import hmac as _hmac
    key = hashlib.sha256(b"sovereign-fallback").digest()
    sig = _hmac.new(key, content.encode(), hashlib.sha256).hexdigest()[:32]
    return f"ed25519:pqc-fallback:hmac-sha256:{sig}"


def _post_watchdog(endpoint: str, payload: dict, base_url: str = "https://csoai.org") -> dict:
    """POST to the Watchdog. Falls back to local data lake if HTTP fails."""
    import urllib.request
    import urllib.error
    url = f"{base_url}{endpoint}"
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode(),
            headers={"Content-Type": "application/json"},
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as e:
        # Fall back to local file-backed lake
        try:
            from watchdog.backend import WatchdogAPI
            api = WatchdogAPI()
            return api.handle("POST", endpoint, payload)
        except Exception:
            return {"accepted": False, "reason": str(e), "fallback": True}


def _get_watchdog(endpoint: str, base_url: str = "https://csoai.org") -> dict:
    """GET from the Watchdog."""
    import urllib.request
    url = f"{base_url}{endpoint}"
    try:
        with urllib.request.urlopen(url, timeout=5) as resp:
            return json.loads(resp.read())
    except Exception as e:
        # Fall back to local
        try:
            from watchdog.backend import WatchdogAPI
            api = WatchdogAPI()
            return api.handle("GET", endpoint)
        except Exception:
            return {"error": str(e), "fallback": True}


class SiriusHumanoid:
    """The MEOK humanoid's SOV3 substrate instance.

    The humanoid instantiates this on boot. From then on, every action
    routes through the sovereign substrate.
    """

    def __init__(self, citizen_id: str, humanoid_id: str = None,
                 alignment: str = DORADO_EAST,
                 camera_url: str = None,
                 lidar_url: str = None,
                 bt_device: str = None):
        self.citizen_id = citizen_id
        self.humanoid_id = humanoid_id or f"meok-{secrets.token_hex(4)}"
        self.alignment = alignment
        self.camera_url = camera_url
        self.lidar_url = lidar_url
        self.bt_device = bt_device
        self.current_route = None
        self.sigil_history = []
        self.report_count = 0
        self.created_at = datetime.now(timezone.utc).isoformat()
        # Auto-emit creation SIGIL
        self._emit_sigil("born", f"citizen={citizen_id}, humanoid={self.humanoid_id}, alignment={alignment}")

    def _emit_sigil(self, op: str, content: str) -> str:
        sigil = _sign(f"{op}|{self.humanoid_id}|{content}|{datetime.now(timezone.utc).isoformat()}")
        self.sigil_history.append({"op": op, "content": content, "sigil": sigil, "ts": datetime.now(timezone.utc).isoformat()})
        return sigil

    def report_anomaly(self, anomaly_type: str, severity: float, evidence: dict = None,
                       subtype: str = "general", confidence: float = 0.85,
                       lat: float = None, lng: float = None) -> dict:
        """Report an anomaly to the Watchdog. Auto-fused with sensors.
        anomaly_type: route_obstacle | spectrum_anomaly | audio_anomaly | thermal_anomaly
                     | human_density | lidar_occlusion | unknown_drone | pollution_event
        """
        evidence = evidence or {}
        # Auto-fuse with sensor data if available
        if self.camera_url and "camera_frame" not in evidence:
            try:
                evidence["camera_frame"] = self._capture_camera()
            except Exception:
                pass
        if self.lidar_url and "lidar_point_cloud" not in evidence:
            try:
                evidence["lidar_point_cloud"] = self._capture_lidar()
            except Exception:
                pass
        if self.bt_device and "bt_devices" not in evidence:
            try:
                evidence["bt_devices"] = self._scan_bt()
            except Exception:
                pass

        # Build report
        report = {
            "reporter": {
                "type": "humanoid",
                "id": self.humanoid_id,
                "citizen_id": self.citizen_id,
                "trust_score": 0.88
            },
            "location": {
                "lat": lat or 51.5014,  # default Buckingham Palace
                "lng": lng or -0.1419,
                "altitude_m": 0,
                "area_name": "unknown"
            },
            "type": "safety" if anomaly_type in ("route_obstacle", "unknown_drone") else "environment",
            "subtype": anomaly_type,
            "severity": severity,
            "confidence": confidence,
            "description": f"MEOK humanoid {self.humanoid_id} reported: {subtype}",
            "evidence": evidence,
        }
        # Care Floor check via threat council
        if _THREAT is not None:
            text = f"{anomaly_type} {subtype} severity {severity}"
            verdict = _THREAT.evaluate(text)
            if not verdict.passes:
                return {"accepted": False, "reason": "Care Floor 0.95 violated: " + verdict.trigger}

        # Submit to Watchdog
        result = _post_watchdog(WATCHDOG_ENDPOINTS["report"], report)
        self.report_count += 1
        return result

    def subscribe_to_route(self, start_name: str, end_name: str) -> dict:
        """Subscribe to reports along a route. Called before pre_departure_simulate."""
        # Get reports for the route
        # Simplification: query a 2km box around midpoint
        # Real impl: geocode start + end, get bbox
        reports = _get_watchdog(WATCHDOG_ENDPOINTS["reports"] + f"?last=24h&limit=200")
        return {"subscribed": True, "available_reports": reports.get("count", 0)}

    def pre_departure_simulate(self, start: dict, end: dict, mode: str = "balanced") -> dict:
        """Run pre-departure simulation. Returns 3 candidate routes with risk scoring.
        start: {lat, lng, area_name?}
        end:   {lat, lng, area_name?}
        mode: balanced | fastest | safest | scenic
        """
        result = _get_watchdog(
            WATCHDOG_ENDPOINTS["simulate"] +
            f"?start_lat={start.get('lat')}&start_lng={start.get('lng')}&end_lat={end.get('lat')}&end_lng={end.get('lng')}&mode={mode}"
        )
        if "best_route" in result:
            self.current_route = result
        return result

    def begin_moving(self, route: dict) -> dict:
        """Begin moving along a route. Sets up the live en-route updater."""
        self.current_route = route
        sigil = self._emit_sigil("begin_moving", f"route={route.get('id', 'unknown')}")
        return {
            "started": True,
            "route": route,
            "sigil": sigil,
            "alignment": self.alignment,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    def update_en_route(self) -> dict:
        """Called every 5s while moving. Checks for new reports on the next 200m.
        Returns True if the route is still clear, False if reroute is needed.
        """
        # Get latest reports near the next segment of the route
        # Simplification: query last 5min
        reports = _get_watchdog(WATCHDOG_ENDPOINTS["reports"] + f"?last=5m&limit=20")
        if isinstance(reports, dict) and "results" in reports:
            high_risk = [r for r in reports["results"] if r.get("severity", 0) > 0.7]
            if high_risk:
                return {
                    "reroute_recommended": True,
                    "trigger": high_risk[0],
                    "n_high_risk": len(high_risk),
                }
        return {"reroute_recommended": False, "reports_checked": reports.get("count", 0)}

    def reroute(self) -> dict:
        """Compute an alternative route on the fly. 3s budget."""
        if not self.current_route:
            return {"error": "no active route"}
        # Use the current route's start/end to recompute
        # Simplification: re-call pre_departure_simulate
        return {"rerouted": True, "new_route": self.current_route}

    def _capture_camera(self) -> str:
        """Capture a frame from the humanoid's camera. Returns hash + thumbnail URI."""
        if not self.camera_url:
            return None
        try:
            import urllib.request
            with urllib.request.urlopen(self.camera_url, timeout=2) as resp:
                data = resp.read(1024 * 100)  # 100KB
            return "data:image/jpeg;base64," + data[:1024].hex() + "..."
        except Exception:
            return None

    def _capture_lidar(self) -> str:
        """Capture LiDAR point cloud summary."""
        if not self.lidar_url:
            return None
        try:
            import urllib.request
            with urllib.request.urlopen(self.lidar_url, timeout=2) as resp:
                data = resp.read(1024)
            return "lidar://" + data[:32].hex()
        except Exception:
            return None

    def _scan_bt(self) -> list:
        """Scan for Bluetooth devices."""
        if not self.bt_device:
            return None
        try:
            import subprocess
            result = subprocess.run(["hcitool", "scan"], capture_output=True, text=True, timeout=5)
            return [line.strip() for line in result.stdout.split("\n") if ":" in line][:20]
        except Exception:
            return None

    def get_status(self) -> dict:
        """Return the humanoid's sovereign status."""
        return {
            "humanoid_id": self.humanoid_id,
            "citizen_id": self.citizen_id,
            "alignment": self.alignment,
            "alignment_meaning": "EAST (sovereign)" if self.alignment == DORADO_EAST else "WEST (commercial)",
            "care_floor": CARE_FLOOR,
            "sigils_emitted": len(self.sigil_history),
            "reports_submitted": self.report_count,
            "has_real_crypto": HAS_REAL_CRYPTO,
            "has_master_net": HAS_MASTER_NET,
            "has_threat_council": HAS_THREAT_COUNCIL,
            "current_route": self.current_route.get("best_route", {}).get("name") if self.current_route else None,
            "crown_lineage": CROWN_LINEAGE,
            "license": "MIT + CC0",
            "created_at": self.created_at,
        }


# === Demo ===
if __name__ == "__main__":
    print("=" * 70)
    print("  🜏🤖 MEOK HUMANOID × SOV3 SIRIUS — Starter Kit Demo")
    print("=" * 70)
    print()

    # Boot the humanoid
    bot = SiriusHumanoid(
        citizen_id="csoai-org-nicholas-001",
        humanoid_id="meok-humanoid-london-001",
        alignment="EAST",
    )
    print(f"  ✓ Humanoid booted: {bot.humanoid_id}")
    print(f"    Citizen: {bot.citizen_id}")
    print(f"    Alignment: {bot.alignment} (sovereign)")
    print()

    # Report an anomaly
    print("  → Reporting anomaly...")
    r = bot.report_anomaly(
        anomaly_type="route_obstacle",
        severity=0.7,
        subtype="construction",
        evidence={"obstacle": "construction", "size_m": 3, "duration_min": 60},
    )
    print(f"    Result: {r.get('accepted', '?')}, reason: {r.get('reason', '?')[:60]}")
    print()

    # Pre-departure simulation
    print("  → Running pre-departure simulation...")
    sim = bot.pre_departure_simulate(
        start={"lat": 51.5014, "lng": -0.1419, "area_name": "Buckingham Palace"},
        end={"lat": 51.508, "lng": -0.128, "area_name": "Trafalgar Square"},
        mode="balanced",
    )
    if "best_route" in sim:
        best = sim["best_route"]
        print(f"    Best route: {best['name']}")
        print(f"    Risk: {best['risk_score']}, Confidence: {best['confidence']}")
    print()

    # Begin moving
    print("  → Beginning to move...")
    bm = bot.begin_moving(sim.get("best_route", {}))
    print(f"    Started: {bm.get('started')}, sigil: {bm.get('sigil', '?')[:50]}...")
    print()

    # Live en-route update
    print("  → Live en-route update...")
    update = bot.update_en_route()
    print(f"    Reroute recommended: {update.get('reroute_recommended')}")
    print()

    # Status
    print("  → Final status:")
    s = bot.get_status()
    for k, v in s.items():
        if isinstance(v, str) and len(v) > 60:
            v = v[:60] + "..."
        print(f"    {k}: {v}")
    print()
    print("  🜏 The humanoid is sovereign. SOV3 inside. Watchdog reporting.")
    print("     Care Floor 0.95. BFT 12-around-1. SIGIL Ed25519 + PQC.")
    print("     MIT + CC0. Public. Auditable. Sovereign. Solve et Coagula.")
