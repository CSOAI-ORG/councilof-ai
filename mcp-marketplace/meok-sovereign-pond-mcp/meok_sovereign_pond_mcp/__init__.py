"""meok_sovereign_pond_mcp — Sovereign Pond MCP (the 13m × 12m iOK Farm koi pond).

5 tools for the koi pond (the physical heart of the empire):

  1. sov_pond_status      - current pond state (pH, DO, temp, humidity, koi count)
  2. sov_pond_log         - log a reading manually (or from ESP32)
  3. sov_pond_care_action - trigger a care action (water change, feed, medication)
  4. sov_pond_history     - pond history (last N readings)
  5. sov_pond_emergency   - emergency action (pH crash, ammonia spike, O2 drop)

The 9 malamutes guard the perimeter. The 13m × 12m pond is sovereign.
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
PROTOCOL = "sovereign-pond/0.1"

# Pond state (in-memory; replace with real sensors in production)
_POND_STATE = {
    "pond_id": "iok-pond-001",
    "name": "iOK Farm main pond (13m × 12m)",
    "lat": 52.7917,
    "lng": -0.0500,
    "depth_m": 1.5,
    "volume_l": 234000,
    "koi_count": 12,
    "koi_species": ["Kohaku", "Sanke", "Showa", "Tancho", "Asagi"],
    "filters": ["4x Evolution Aqua bead filters", "2x Evolution Aqua UVs"],
    "malamutes_guarding": ["Misty", "Zeus", "Luna", "Storm", "Puma", "Kita", "Lamb", "Bear", "Fang"],
    "last_reading": None,
    "last_water_change": None,
}

_READINGS: deque = deque(maxlen=1000)  # history buffer
_CARE_ACTIONS: deque = deque(maxlen=100)
_EMERGENCIES: deque = deque(maxlen=50)

# Care floor for koi (the Maternal Covenant applied to fish)
KOI_CARE_FLOOR = {
    "pH": (6.5, 8.5),
    "DO_mgL": (5.0, 12.0),  # dissolved oxygen
    "temp_C": (4, 30),     # koi can survive 4-30°C
    "ammonia_mgL": (0, 0.02),  # toxic above 0.02
    "nitrite_mgL": (0, 0.5),    # toxic above 0.5
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_POND_KEY") or os.path.expanduser("~/.meok/sov_pond_key.pem")
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


def _check_care_floor(readings):
    """Check if readings violate the koi care floor."""
    violations = []
    for param, (low, high) in KOI_CARE_FLOOR.items():
        if param in readings:
            v = readings[param]
            if v < low or v > high:
                violations.append({"parameter": param, "value": v, "expected": f"{low}-{high}", "severity": "high"})
    return violations


def sov_pond_status() -> dict:
    """Current pond state."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "pond": _POND_STATE,
        "care_floor": KOI_CARE_FLOOR,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/pond/status"
    return signed


def sov_pond_log(ph: float, do_mgL: float, temp_C: float, *, humidity: float = None, ammonia_mgL: float = 0, koi_count: int = 12, source: str = "manual") -> dict:
    """Log a pond reading (manual or from ESP32)."""
    reading_id = hashlib.sha256(f"{ph}|{do_mgL}|{temp_C}|{time.time()}".encode()).hexdigest()[:16]
    reading = {
        "reading_id": reading_id,
        "ph": ph,
        "do_mgL": do_mgL,
        "temp_C": temp_C,
        "humidity": humidity,
        "ammonia_mgL": ammonia_mgL,
        "koi_count": koi_count,
        "source": source,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    violations = _check_care_floor({"pH": ph, "DO_mgL": do_mgL, "temp_C": temp_C, "ammonia_mgL": ammonia_mgL})
    _READINGS.append(reading)
    _POND_STATE["last_reading"] = reading
    _POND_STATE["koi_count"] = koi_count

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "reading_id": reading_id,
        "violations": violations,
        "healthy": len(violations) == 0,
        "ts": reading["ts"],
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/pond/reading/{reading_id}"
    return signed


def sov_pond_care_action(action: str, *, reason: str = "", requires_council: bool = True) -> dict:
    """Trigger a care action on the pond (water change, feed, medication, pump cycle)."""
    valid_actions = ["water_change", "feed_koi", "medicate", "cycle_pumps", "clean_filter", "test_water"]
    if action not in valid_actions:
        return {"error": f"unknown action: {action}", "valid": valid_actions}

    care_id = hashlib.sha256(f"{action}|{time.time()}".encode()).hexdigest()[:16]
    approval = "pending_council_vote" if requires_council else "auto_approved"
    _CARE_ACTIONS.append({
        "care_id": care_id,
        "action": action,
        "reason": reason,
        "approval": approval,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    if action == "water_change":
        _POND_STATE["last_water_change"] = datetime.now(timezone.utc).isoformat()

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "care_id": care_id,
        "action": action,
        "approval": approval,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/pond/care/{care_id}"
    return signed


def sov_pond_history(limit: int = 50) -> dict:
    """Get pond reading history."""
    readings = list(_READINGS)[-limit:]
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "reading_count": len(readings),
        "readings": readings,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/pond/history"
    return signed


def sov_pond_emergency(emergency_type: str, *, severity: str = "high", actor: str = "sovereign") -> dict:
    """Trigger a pond emergency action (free, no approval — Maternal Covenant)."""
    valid_emergencies = ["ph_crash", "ammonia_spike", "oxygen_drop", "pump_failure", "filter_clog", "koi_distress", "predator"]
    if emergency_type not in valid_emergencies:
        return {"error": f"unknown emergency: {emergency_type}", "valid": valid_emergencies}
    emergency_id = hashlib.sha256(f"EMERGENCY|{emergency_type}|{time.time()}".encode()).hexdigest()[:16]
    _EMERGENCIES.append({
        "emergency_id": emergency_id,
        "type": emergency_type,
        "severity": severity,
        "actor": actor,
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "emergency_id": emergency_id,
        "type": emergency_type,
        "severity": severity,
        "actor": actor,
        "auto_action": "water_change_solenoid_open" if emergency_type in ("ph_crash", "ammonia_spike") else "aerator_full",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/pond/emergency/{emergency_id}"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_pond_status", description="Current pond state (pH, DO, temp, koi count).")(sov_pond_status)
    mcp.tool(name="sov_pond_log", description="Log a pond reading (manual or from ESP32).")(sov_pond_log)
    mcp.tool(name="sov_pond_care_action", description="Trigger a care action (water change, feed, etc).")(sov_pond_care_action)
    mcp.tool(name="sov_pond_history", description="Pond reading history.")(sov_pond_history)
    mcp.tool(name="sov_pond_emergency", description="Trigger a pond emergency action (free, no approval).")(sov_pond_emergency)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-pond")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
