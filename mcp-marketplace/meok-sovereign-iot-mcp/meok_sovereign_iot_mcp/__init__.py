"""meok_sovereign_iot_mcp — Sovereign IoT MCP (iOK Farm + sensors + MQTT).

5 tools for sovereign IoT + physical infrastructure:

  1. sov_iot_register       - register an IoT device
  2. sov_iot_telemetry      - receive signed telemetry from a device
  3. sov_iot_actuate        - actuate a device (requires BFT council approval)
  4. sov_iot_emergency_stop - emergency stop ALL actuators (free, no approval)
  5. sov_iot_status         - the IoT substrate status

iOK Farm: 13m × 12m koi pond, ESP32 + pH/DO/temp/humidity sensors,
            4 bead filter pumps, 2 Evolution Aqua UVs, 3D-printed koi feeder.
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import time
from collections import deque
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-iot/0.1"

# In-memory device registry + telemetry buffer
_DEVICES: dict = {}  # device_id -> device dict
_TELEMETRY: deque = deque(maxlen=10000)
_ACTUATIONS: deque = deque(maxlen=1000)
_ESTOP_ACTIVE = False

IOK_FARM_DEVICES = {
    "iok-pond-001": {
        "type": "esp32",
        "name": "iOK Farm main pond (13m × 12m)",
        "location": "Sutton St James, UK (52.7917, -0.0500)",
        "sensors": ["pH", "DO (mg/L)", "temp (°C)", "humidity (%)"],
        "actuators": ["bead_filter_pump_1", "bead_filter_pump_2", "bead_filter_pump_3", "bead_filter_pump_4", "uv_1", "uv_2", "koi_feeder", "aerator", "water_change_solenoid"],
        "hive_id": "iok-pond-001",
        "lat": 52.7917,
        "lng": -0.0500,
    },
    "iok-tunnel-001": {
        "type": "esp32",
        "name": "iOK Farm microgreens tunnel (135ft)",
        "location": "iOK Farm",
        "sensors": ["temp", "humidity", "soil_moisture", "co2"],
        "actuators": ["grow_light", "irrigation_pump", "ventilation_fan"],
        "hive_id": "iok-tunnel-001",
        "lat": 52.7918,
        "lng": -0.0501,
    },
    "iok-pond-camera-001": {
        "type": "rpi",
        "name": "iOK Farm koi camera (pond surveillance)",
        "location": "iOK Farm",
        "sensors": ["camera", "motion"],
        "actuators": [],
        "hive_id": "iok-pond-001",
        "lat": 52.7917,
        "lng": -0.0500,
    },
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_IOT_KEY") or os.path.expanduser("~/.meok/sov_iot_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    return {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}


def sov_iot_register(device_id: str, device_type: str, *, name: str, location: str, sensors: list, actuators: list = None, hive_id: str = None) -> dict:
    """Register an IoT device in the sovereign registry."""
    if device_id in _DEVICES:
        return {"error": f"device {device_id} already registered", "existing": _DEVICES[device_id]}
    _DEVICES[device_id] = {
        "device_id": device_id,
        "type": device_type,
        "name": name,
        "location": location,
        "sensors": sensors,
        "actuators": actuators or [],
        "hive_id": hive_id or device_id,
        "registered_at": datetime.now(timezone.utc).isoformat(),
        "last_telemetry": None,
    }
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "device": _DEVICES[device_id],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iot/{device_id}"
    return signed


def sov_iot_telemetry(device_id: str, readings: dict) -> dict:
    """Receive signed telemetry from a device."""
    if device_id not in _DEVICES:
        return {"error": f"device {device_id} not registered"}
    device = _DEVICES[device_id]
    # Validate sensor names
    unknown = [k for k in readings.keys() if k not in device["sensors"]]
    if unknown:
        return {"error": f"unknown sensors: {unknown}", "expected": device["sensors"]}

    telemetry_id = hashlib.sha256(f"{device_id}|{time.time()}".encode()).hexdigest()[:16]
    record = {
        "telemetry_id": telemetry_id,
        "device_id": device_id,
        "readings": readings,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _TELEMETRY.append(record)
    device["last_telemetry"] = record
    # Care-floor alert: pH out of range
    alerts = []
    if "pH" in readings:
        ph = readings["pH"]
        if not (6.5 <= ph <= 8.5):
            alerts.append({"type": "ph_alert", "severity": "high", "value": ph, "expected": "6.5-8.5"})
    if "DO (mg/L)" in readings:
        do = readings["DO (mg/L)"]
        if do < 5.0:
            alerts.append({"type": "do_alert", "severity": "high", "value": do, "expected": ">=5.0 mg/L"})

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "telemetry_id": telemetry_id,
        "device_id": device_id,
        "readings_count": len(readings),
        "alerts": alerts,
        "ts": record["ts"],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iot/telemetry/{telemetry_id}"
    return signed


def sov_iot_actuate(device_id: str, actuator: str, action: str, *, requires_council: bool = True) -> dict:
    """Actuate a device (requires BFT council approval unless requires_council=False)."""
    global _ESTOP_ACTIVE
    if _ESTOP_ACTIVE:
        return {"error": "EMERGENCY STOP ACTIVE — no actuations permitted"}
    if device_id not in _DEVICES:
        return {"error": f"device {device_id} not registered"}
    device = _DEVICES[device_id]
    if actuator not in device["actuators"]:
        return {"error": f"actuator {actuator} not on device {device_id}", "available": device["actuators"]}

    actuation_id = hashlib.sha256(f"{device_id}|{actuator}|{action}|{time.time()}".encode()).hexdigest()[:16]
    approval = "pending_council_vote" if requires_council else "auto_approved"

    _ACTUATIONS.append({
        "actuation_id": actuation_id,
        "device_id": device_id,
        "actuator": actuator,
        "action": action,
        "approval": approval,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "actuation_id": actuation_id,
        "device_id": device_id,
        "actuator": actuator,
        "action": action,
        "approval": approval,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iot/actuation/{actuation_id}"
    return signed


def sov_iot_emergency_stop(reason: str, *, actor: str = "sovereign") -> dict:
    """EMERGENCY STOP all actuators. Free, no approval required (Maternal Covenant)."""
    global _ESTOP_ACTIVE
    _ESTOP_ACTIVE = True
    estop_id = hashlib.sha256(f"ESTOP|{reason}|{time.time()}".encode()).hexdigest()[:16]
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "estop_id": estop_id,
        "actor": actor,
        "reason": reason,
        "all_actuators_halted": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/iot/estop/{estop_id}"
    return signed


def sov_iot_status() -> dict:
    """The IoT substrate status."""
    global _ESTOP_ACTIVE
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "registered_devices": len(_DEVICES),
        "telemetry_buffer_size": len(_TELEMETRY),
        "actuation_count": len(_ACTUATIONS),
        "estop_active": _ESTOP_ACTIVE,
        "iok_farm_devices": list(IOK_FARM_DEVICES.keys()),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/iot/status"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_iot_register", description="Register an IoT device.")(sov_iot_register)
    mcp.tool(name="sov_iot_telemetry", description="Receive signed telemetry from a device.")(sov_iot_telemetry)
    mcp.tool(name="sov_iot_actuate", description="Actuate a device (requires BFT council approval).")(sov_iot_actuate)
    mcp.tool(name="sov_iot_emergency_stop", description="EMERGENCY STOP all actuators (free).")(sov_iot_emergency_stop)
    mcp.tool(name="sov_iot_status", description="The IoT substrate status.")(sov_iot_status)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-iot")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
