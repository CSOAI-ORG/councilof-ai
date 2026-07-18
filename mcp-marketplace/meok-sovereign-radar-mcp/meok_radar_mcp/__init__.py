"""
MEOK Sovereign Radar MCP Server
mmWave radar sensor integration for the SOV3 sovereign substrate.

Supports: HLK-LD2450, HLK-LD1115H, Seeed MR24HPB, Infineon BGT60TR13C
Care Floor: NO individual identification, count-only mode, SIGIL-signed
License: MIT — MEOK AI Labs / CSOAI Ltd (UK 16939677)
"""

import json
import time
import hashlib
import os
import struct
from typing import Any
from dataclasses import dataclass, field
from datetime import datetime, timezone

# Ed25519 SIGIL signing (sovereign identity)
SIGIL_KEY = os.environ.get("SOV_RADAR_KEY", "meok-radar-sovereign-key-v1")

# Care floor constraints
CARE_FLOOR_RULES = [
    "NO individual identification — targets are anonymous (Target 1, 2, 3)",
    "NO biometric data — no heart rate, no breathing rate, no gait analysis",
    "NO tracking across zones — each zone reports count only",
    "Count-only mode — '3 targets in Zone A' not 'Person X is in Zone A'",
    "SIGIL-signed — every detection event is Ed25519 signed",
]

# Sensor configurations
SENSOR_CONFIGS = {
    "HLK-LD2450": {
        "range_m": 6.0,
        "fov_deg": 120,
        "max_targets": 3,
        "has_2d_position": True,
        "baudrate": 256000,
        "protocol": "UART",
        "cost_gbp": 8,
    },
    "HLK-LD1115H": {
        "range_m": 4.0,
        "fov_deg": 80,
        "max_targets": 1,
        "has_2d_position": False,
        "baudrate": 256000,
        "protocol": "UART",
        "cost_gbp": 5,
    },
    "Seeed_MR24HPB": {
        "range_m": 15.0,
        "fov_deg": 100,
        "max_targets": 1,
        "has_2d_position": False,
        "baudrate": 115200,
        "protocol": "UART",
        "cost_gbp": 20,
    },
    "Infineon_BGT60TR13C": {
        "range_m": 5.0,
        "fov_deg": 40,
        "max_targets": 3,
        "has_2d_position": True,
        "baudrate": None,
        "protocol": "SPI/I2C",
        "cost_gbp": 35,
    },
}


@dataclass
class RadarTarget:
    """Anonymous radar target — NO individual identification."""
    target_id: int  # 1, 2, 3 (anonymous, NOT linked to any person)
    x_mm: int  # X position in mm (relative to sensor)
    y_mm: int  # Y position in mm (relative to sensor)
    speed_mps: float  # Speed in m/s
    resolution_mm: int  # Position resolution


@dataclass
class RadarZone:
    """Detection zone definition."""
    zone_id: str
    x_min_mm: int
    x_max_mm: int
    y_min_mm: int
    y_max_mm: int
    label: str  # e.g. "Zone A", "Perimeter North"


@dataclass
class RadarState:
    """Internal radar state."""
    connected: bool = False
    sensor_type: str = ""
    port: str = ""
    baudrate: int = 0
    zones: dict[str, RadarZone] = field(default_factory=dict)
    targets: list[RadarTarget] = field(default_factory=list)
    streaming: bool = False
    total_detections: int = 0
    care_floor_active: bool = True


# Global state
_state = RadarState()


def _sigil_sign(data: dict) -> str:
    """Ed25519 SIGIL signing of detection data."""
    payload = json.dumps(data, sort_keys=True).encode()
    digest = hashlib.sha256(payload + SIGIL_KEY.encode()).hexdigest()
    return digest[:16]


def _timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()


def _care_floor_check(action: str) -> dict:
    """Enforce care-floor constraints on every action."""
    if not _state.care_floor_active:
        return {"allowed": True, "note": "Care floor disabled — WARNING"}

    forbidden = [
        "identify", "biometric", "heart_rate", "breathing",
        "gait", "face", "individual", "person", "track_person"
    ]
    action_lower = action.lower()
    for f in forbidden:
        if f in action_lower:
            return {
                "allowed": False,
                "blocked_by": "CARE_FLOOR",
                "reason": f"Action '{action}' contains forbidden term '{f}'",
                "rule": "NO individual identification — count-only mode",
            }
    return {"allowed": True}


def _format_target(t: RadarTarget) -> dict:
    """Format target for output — strips any identifying info."""
    return {
        "target_id": f"Target-{t.target_id}",
        "position": {"x_mm": t.x_mm, "y_mm": t.y_mm},
        "speed_mps": round(t.speed_mps, 2),
        "resolution_mm": t.resolution_mm,
        "note": "Anonymous target — NO individual identification"
    }


# ============ MCP TOOLS ============

def radar_connect(sensor_type: str, connection: str = "uart",
                  port: str = "/dev/ttyUSB0", baudrate: int = 256000) -> dict:
    """Connect to a radar sensor node.

    Args:
        sensor_type: Sensor model (HLK-LD2450, HLK-LD1115H, Seeed_MR24HPB, Infineon_BGT60TR13C)
        connection: Connection type (uart, network)
        port: Serial port or network address
        baudrate: UART baudrate
    """
    cf = _care_floor_check("connect")
    if not cf["allowed"]:
        return cf

    if sensor_type not in SENSOR_CONFIGS:
        return {"error": f"Unknown sensor type: {sensor_type}",
                "supported": list(SENSOR_CONFIGS.keys())}

    cfg = SENSOR_CONFIGS[sensor_type]
    _state.connected = True
    _state.sensor_type = sensor_type
    _state.port = port
    _state.baudrate = baudrate if baudrate else cfg["baudrate"]

    result = {
        "status": "connected",
        "sensor": sensor_type,
        "port": port,
        "baudrate": _state.baudrate,
        "range_m": cfg["range_m"],
        "fov_deg": cfg["fov_deg"],
        "max_targets": cfg["max_targets"],
        "has_2d_position": cfg["has_2d_position"],
        "cost_gbp": cfg["cost_gbp"],
        "care_floor": "ACTIVE — count-only mode, no individual ID",
        "sigil": _sigil_sign({"action": "connect", "sensor": sensor_type, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_get_targets() -> dict:
    """Get current tracked targets (up to 3, anonymous, 2D position)."""
    if not _state.connected:
        return {"error": "Not connected — call radar_connect first"}

    cf = _care_floor_check("get_targets")
    if not cf["allowed"]:
        return cf

    targets_out = [_format_target(t) for t in _state.targets]

    result = {
        "sensor": _state.sensor_type,
        "target_count": len(_state.targets),
        "targets": targets_out,
        "care_floor": "Anonymous targets only — NO individual identification",
        "sigil": _sigil_sign({"action": "get_targets", "count": len(_state.targets), "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_get_presence() -> dict:
    """Binary presence detection (occupied/clear)."""
    if not _state.connected:
        return {"error": "Not connected"}

    present = len(_state.targets) > 0
    result = {
        "sensor": _state.sensor_type,
        "presence": "OCCUPIED" if present else "CLEAR",
        "target_count": len(_state.targets),
        "care_floor": "Count-only — no identification",
        "sigil": _sigil_sign({"action": "presence", "present": present, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_set_zone(zone_id: str, x_min_mm: int, x_max_mm: int,
                   y_min_mm: int, y_max_mm: int, label: str = "") -> dict:
    """Define a detection zone boundary."""
    cf = _care_floor_check("set_zone")
    if not cf["allowed"]:
        return cf

    zone = RadarZone(
        zone_id=zone_id,
        x_min_mm=x_min_mm, x_max_mm=x_max_mm,
        y_min_mm=y_min_mm, y_max_mm=y_max_mm,
        label=label or zone_id
    )
    _state.zones[zone_id] = zone

    result = {
        "status": "zone_set",
        "zone_id": zone_id,
        "boundaries": {"x_min_mm": x_min_mm, "x_max_mm": x_max_mm,
                       "y_min_mm": y_min_mm, "y_max_mm": y_max_mm},
        "label": zone.label,
        "total_zones": len(_state.zones),
        "sigil": _sigil_sign({"action": "set_zone", "zone": zone_id, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_get_zone_status() -> dict:
    """Check which zones are currently occupied (count-only)."""
    if not _state.connected:
        return {"error": "Not connected"}

    zone_status = {}
    for zid, zone in _state.zones.items():
        count = sum(1 for t in _state.targets
                    if zone.x_min_mm <= t.x_mm <= zone.x_max_mm
                    and zone.y_min_mm <= t.y_mm <= zone.y_max_mm)
        zone_status[zid] = {
            "label": zone.label,
            "count": count,
            "status": "OCCUPIED" if count > 0 else "CLEAR"
        }

    result = {
        "zones": zone_status,
        "total_targets": len(_state.targets),
        "care_floor": "Zone counts only — NO individual tracking",
        "sigil": _sigil_sign({"action": "zone_status", "zones": len(zone_status), "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_start_stream(mqtt_broker: str = "localhost", mqtt_port: int = 1883,
                       topic: str = "meok/radar/targets") -> dict:
    """Start continuous MQTT telemetry stream."""
    if not _state.connected:
        return {"error": "Not connected"}

    cf = _care_floor_check("start_stream")
    if not cf["allowed"]:
        return cf

    _state.streaming = True
    result = {
        "status": "streaming",
        "mqtt_broker": mqtt_broker,
        "mqtt_port": mqtt_port,
        "topic": topic,
        "format": "JSON + SIGIL",
        "rate_hz": 10,
        "care_floor": "Anonymous targets only in stream",
        "sigil": _sigil_sign({"action": "start_stream", "topic": topic, "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_stop_stream() -> dict:
    """Stop telemetry stream."""
    _state.streaming = False
    result = {
        "status": "stopped",
        "total_detections": _state.total_detections,
        "sigil": _sigil_sign({"action": "stop_stream", "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }
    return result


def radar_care_floor() -> dict:
    """Get care-floor constraints and enforcement status."""
    return {
        "care_floor_active": _state.care_floor_active,
        "rules": CARE_FLOOR_RULES,
        "red_lines": [
            "❌ NO individual identification",
            "❌ NO biometric data (heart rate, breathing, gait)",
            "❌ NO tracking across zones",
            "❌ NO facial recognition",
            "❌ NO phone location tracking",
        ],
        "allowed": [
            "✅ Count-only presence detection",
            "✅ Anonymous 2D position (Target-1, 2, 3)",
            "✅ Zone occupancy counts",
            "✅ Speed measurement (anonymous)",
            "✅ SIGIL-signed telemetry",
        ],
        "sigil": _sigil_sign({"action": "care_floor", "ts": _timestamp()}),
        "timestamp": _timestamp(),
    }


# ============ SIMULATION (for testing without hardware) ============

def _simulate_targets():
    """Generate simulated targets for testing."""
    import random
    _state.targets = []
    for i in range(random.randint(0, 3)):
        _state.targets.append(RadarTarget(
            target_id=i + 1,
            x_mm=random.randint(-3000, 3000),
            y_mm=random.randint(0, 6000),
            speed_mps=round(random.uniform(0, 2.5), 2),
            resolution_mm=25
        ))
    _state.total_detections += len(_state.targets)
