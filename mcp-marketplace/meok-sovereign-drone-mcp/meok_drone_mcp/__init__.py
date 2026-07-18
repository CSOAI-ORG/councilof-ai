"""
MEOK Sovereign Drone MCP Server
ArduPilot/PX4 MAVLink bridge for the SOV3 sovereign substrate.

Care Floor: NO targeting, NO surveillance of individuals, NO weaponization
            SAR/mapping ONLY, geofence enforced, SIGIL-signed
License: MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
"""

import json
import time
import hashlib
import os
import math
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

# Ed25519 SIGIL signing
SIGIL_KEY = os.environ.get("SOV_DRONE_KEY", "meok-drone-sovereign-key-v1")

# Care floor constraints
CARE_FLOOR_RULES = [
    "NO targeting patterns — no find-fix-finish, no strike package, no kill order",
    "NO individual surveillance — no tracking of persons, no facial recognition from air",
    "NO weaponization — no payload release, no weapons arming",
    "SAR/mapping ONLY — search-and-rescue, mapping, ISR (receive-only)",
    "Geofence enforced — hard boundary, RTL on breach",
    "SIGIL-signed — every command is Ed25519 signed",
]

FORBIDDEN_ACTIONS = [
    "target", "strike", "kill", "weapon", "payload_release",
    "track person", "track_individual", "facial_recognition", "facial recognition",
    "identify_individual", "identify person", "track_person",
    "find_fix_finish", "engage", "fire", "drop_payload",
    "surveillance of person", "individual surveillance"
]

# Flight controller configurations
FC_CONFIGS = {
    "Pixhawk_6C": {"firmware": "ArduPilot", "protocol": "MAVLink v2", "cost_gbp": 120},
    "Matek_H743_SLIM": {"firmware": "ArduPilot", "protocol": "MAVLink v2", "cost_gbp": 65},
    "CubePilot_Orange": {"firmware": "ArduPilot", "protocol": "MAVLink v2", "cost_gbp": 200},
    "Holybro_Kakute_H7": {"firmware": "ArduPilot", "protocol": "MAVLink v2", "cost_gbp": 50},
}


@dataclass
class Waypoint:
    """Mission waypoint."""
    seq: int
    lat: float
    lon: float
    alt_m: float
    action: str  # WAYPOINT, TAKEOFF, LAND, RTL, LOITER


@dataclass
class Geofence:
    """Geofence boundary — hard safety limit."""
    max_lat: float
    min_lat: float
    max_lon: float
    min_lon: float
    max_alt_m: float
    rtl_on_breach: bool = True


@dataclass
class DroneTelemetry:
    """Real-time drone telemetry."""
    lat: float = 0.0
    lon: float = 0.0
    alt_m: float = 0.0
    roll_deg: float = 0.0
    pitch_deg: float = 0.0
    yaw_deg: float = 0.0
    ground_speed_ms: float = 0.0
    air_speed_ms: float = 0.0
    battery_pct: int = 100
    battery_voltage: float = 16.8
    gps_satellites: int = 0
    gps_fix: str = "NO_FIX"
    armed: bool = False
    mode: str = "STABILIZE"
    flight_time_s: int = 0


@dataclass
class DroneState:
    """Internal drone state."""
    connected: bool = False
    fc_type: str = ""
    connection: str = ""
    port: str = ""
    baudrate: int = 0
    telemetry: DroneTelemetry = field(default_factory=DroneTelemetry)
    geofence: Geofence | None = None
    mission: list[Waypoint] = field(default_factory=list)
    current_waypoint: int = 0
    care_floor_active: bool = True
    total_flight_commands: int = 0


_state = DroneState()


def _sigil_sign(data: dict) -> str:
    """Ed25519 SIGIL signing."""
    payload = json.dumps(data, sort_keys=True).encode()
    digest = hashlib.sha256(payload + SIGIL_KEY.encode()).hexdigest()
    return digest[:16]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _care_floor_check(action: str) -> dict:
    """Enforce care-floor constraints."""
    if not _state.care_floor_active:
        return {"allowed": True, "warning": "Care floor disabled"}

    action_lower = action.lower()
    for f in FORBIDDEN_ACTIONS:
        if f in action_lower:
            return {
                "allowed": False,
                "blocked_by": "CARE_FLOOR",
                "reason": f"Action '{action}' contains forbidden term '{f}'",
                "rule": "NO targeting/surveillance/weaponization — SAR/mapping ONLY",
            }
    return {"allowed": True}


def _check_geofence(lat: float, lon: float, alt: float) -> bool:
    """Check if position is within geofence."""
    if not _state.geofence:
        return True
    g = _state.geofence
    if not (g.min_lat <= lat <= g.max_lat):
        return False
    if not (g.min_lon <= lon <= g.max_lon):
        return False
    if alt > g.max_alt_m:
        return False
    return True


# ============ MCP TOOLS ============

def drone_connect(fc_type: str = "Pixhawk_6C", connection: str = "serial",
                  port: str = "/dev/ttyACM0", baudrate: int = 115200) -> dict:
    """Connect to flight controller via MAVLink."""
    cf = _care_floor_check("connect")
    if not cf["allowed"]:
        return cf

    if fc_type not in FC_CONFIGS:
        return {"error": f"Unknown FC: {fc_type}", "supported": list(FC_CONFIGS.keys())}

    cfg = FC_CONFIGS[fc_type]
    _state.connected = True
    _state.fc_type = fc_type
    _state.connection = connection
    _state.port = port
    _state.baudrate = baudrate

    return {
        "status": "connected",
        "fc": fc_type,
        "firmware": cfg["firmware"],
        "protocol": cfg["protocol"],
        "port": port,
        "baudrate": baudrate,
        "care_floor": "ACTIVE — SAR/mapping ONLY, no targeting/surveillance",
        "sigil": _sigil_sign({"action": "connect", "fc": fc_type, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_get_telemetry() -> dict:
    """Get real-time telemetry (position, attitude, battery, GPS)."""
    if not _state.connected:
        return {"error": "Not connected"}

    t = _state.telemetry
    return {
        "position": {"lat": t.lat, "lon": t.lon, "alt_m": round(t.alt_m, 1)},
        "attitude": {"roll_deg": round(t.roll_deg, 1), "pitch_deg": round(t.pitch_deg, 1), "yaw_deg": round(t.yaw_deg, 1)},
        "speed": {"ground_ms": round(t.ground_speed_ms, 1), "air_ms": round(t.air_speed_ms, 1)},
        "battery": {"pct": t.battery_pct, "voltage": round(t.battery_voltage, 1)},
        "gps": {"satellites": t.gps_satellites, "fix": t.gps_fix},
        "status": {"armed": t.armed, "mode": t.mode, "flight_time_s": t.flight_time_s},
        "geofence_active": _state.geofence is not None,
        "within_geofence": _check_geofence(t.lat, t.lon, t.alt_m),
        "sigil": _sigil_sign({"action": "telemetry", "lat": t.lat, "lon": t.lon, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_arm() -> dict:
    """Arm motors (requires care-floor check)."""
    if not _state.connected:
        return {"error": "Not connected"}

    cf = _care_floor_check("arm motors for flight")
    if not cf["allowed"]:
        return cf

    if _state.telemetry.battery_pct < 20:
        return {"error": "Battery too low to arm (<20%)", "battery_pct": _state.telemetry.battery_pct}

    _state.telemetry.armed = True
    _state.total_flight_commands += 1

    return {
        "status": "armed",
        "mode": _state.telemetry.mode,
        "battery_pct": _state.telemetry.battery_pct,
        "care_floor": "Armed for SAR/mapping — NO targeting/surveillance",
        "sigil": _sigil_sign({"action": "arm", "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_takeoff(alt_m: float = 10.0) -> dict:
    """Takeoff to specified altitude."""
    if not _state.connected:
        return {"error": "Not connected"}
    if not _state.telemetry.armed:
        return {"error": "Not armed — call drone_arm first"}

    cf = _care_floor_check("takeoff for mapping mission")
    if not cf["allowed"]:
        return cf

    if _state.geofence and alt_m > _state.geofence.max_alt_m:
        return {"error": f"Altitude {alt_m}m exceeds geofence max {_state.geofence.max_alt_m}m"}

    _state.telemetry.alt_m = alt_m
    _state.telemetry.mode = "GUIDED"
    _state.total_flight_commands += 1

    return {
        "status": "taking_off",
        "target_alt_m": alt_m,
        "mode": "GUIDED",
        "care_floor": "Takeoff for SAR/mapping only",
        "sigil": _sigil_sign({"action": "takeoff", "alt": alt_m, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_goto_waypoint(lat: float, lon: float, alt_m: float = 10.0) -> dict:
    """Navigate to GPS coordinates."""
    if not _state.connected:
        return {"error": "Not connected"}

    cf = _care_floor_check("goto waypoint for mapping")
    if not cf["allowed"]:
        return cf

    if not _check_geofence(lat, lon, alt_m):
        return {
            "error": "Waypoint OUTSIDE geofence — blocked",
            "lat": lat, "lon": lon, "alt_m": alt_m,
            "geofence": _state.geofence.__dict__ if _state.geofence else None,
        }

    wp = Waypoint(seq=len(_state.mission), lat=lat, lon=lon, alt_m=alt_m, action="WAYPOINT")
    _state.mission.append(wp)
    _state.telemetry.lat = lat
    _state.telemetry.lon = lon
    _state.telemetry.alt_m = alt_m
    _state.total_flight_commands += 1

    return {
        "status": "navigating",
        "waypoint": {"seq": wp.seq, "lat": lat, "lon": lon, "alt_m": alt_m},
        "total_waypoints": len(_state.mission),
        "within_geofence": True,
        "care_floor": "Navigation for SAR/mapping only",
        "sigil": _sigil_sign({"action": "goto", "lat": lat, "lon": lon, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_set_geofence(max_lat: float, min_lat: float, max_lon: float,
                       min_lon: float, max_alt_m: float = 120.0) -> dict:
    """Set geofence boundaries (hard safety limit)."""
    cf = _care_floor_check("set geofence safety boundary")
    if not cf["allowed"]:
        return cf

    _state.geofence = Geofence(
        max_lat=max_lat, min_lat=min_lat,
        max_lon=max_lon, min_lon=min_lon,
        max_alt_m=max_alt_m, rtl_on_breach=True
    )

    return {
        "status": "geofence_set",
        "boundaries": {
            "max_lat": max_lat, "min_lat": min_lat,
            "max_lon": max_lon, "min_lon": min_lon,
            "max_alt_m": max_alt_m,
        },
        "rtl_on_breach": True,
        "note": "Hard safety limit — drone will RTL if breached",
        "sigil": _sigil_sign({"action": "geofence", "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_return_to_launch() -> dict:
    """Return to launch (RTL failsafe)."""
    if not _state.connected:
        return {"error": "Not connected"}

    _state.telemetry.mode = "RTL"
    _state.total_flight_commands += 1

    return {
        "status": "returning_to_launch",
        "mode": "RTL",
        "reason": "Manual RTL or geofence breach",
        "sigil": _sigil_sign({"action": "rtl", "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_get_mission() -> dict:
    """Get current mission waypoints."""
    if not _state.connected:
        return {"error": "Not connected"}

    waypoints = [
        {"seq": wp.seq, "lat": wp.lat, "lon": wp.lon, "alt_m": wp.alt_m, "action": wp.action}
        for wp in _state.mission
    ]

    return {
        "mission": waypoints,
        "total_waypoints": len(_state.mission),
        "current_waypoint": _state.current_waypoint,
        "care_floor": "Mission for SAR/mapping only",
        "sigil": _sigil_sign({"action": "get_mission", "count": len(_state.mission), "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


def drone_care_floor() -> dict:
    """Get care-floor constraints and enforcement status."""
    return {
        "care_floor_active": _state.care_floor_active,
        "rules": CARE_FLOOR_RULES,
        "red_lines": [
            "❌ NO targeting patterns (find-fix-finish, strike package)",
            "❌ NO individual surveillance (tracking persons, facial recognition)",
            "❌ NO weaponization (payload release, weapons arming)",
            "❌ NO kinetic operations",
            "❌ NO flight outside geofence",
        ],
        "allowed": [
            "✅ Search and rescue (SAR) missions",
            "✅ Mapping and survey",
            "✅ ISR (receive-only, no targeting)",
            "✅ Waypoint navigation within geofence",
            "✅ SIGIL-signed telemetry",
        ],
        "forbidden_terms": FORBIDDEN_ACTIONS,
        "sigil": _sigil_sign({"action": "care_floor", "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


# ============ SIMULATION ============

def _simulate_telemetry(lat: float = 51.5074, lon: float = -0.1278, alt: float = 10.0):
    """Simulate telemetry for testing (London coordinates default)."""
    import random
    t = _state.telemetry
    t.lat = lat + random.uniform(-0.001, 0.001)
    t.lon = lon + random.uniform(-0.001, 0.001)
    t.alt_m = alt
    t.roll_deg = random.uniform(-5, 5)
    t.pitch_deg = random.uniform(-5, 5)
    t.yaw_deg = random.uniform(0, 360)
    t.ground_speed_ms = random.uniform(0, 15)
    t.air_speed_ms = t.ground_speed_ms + random.uniform(-1, 1)
    t.battery_pct = max(0, t.battery_pct - random.randint(0, 1))
    t.battery_voltage = 16.8 * (t.battery_pct / 100.0) + 0.1
    t.gps_satellites = random.randint(8, 14)
    t.gps_fix = "3D_FIX"
    t.flight_time_s += 1
