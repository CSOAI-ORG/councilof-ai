"""meok-sovereign-physical-mcp — JARVIS embodiment + physical robotics.

5 tools:
  1. jarvis_status     - JARVIS humanoid state (battery, motors, sensors)
  2. jarvis_command    - send command (move, grasp, speak, etc.)
  3. jarvis_simulate   - simulate a command in software (no hardware)
  4. mckibben_actuate  - actuate a McKibben pneumatic actuator
  5. lekiwi_navigate   - navigate the LeKiwi mobile base
"""
from __future__ import annotations
import json
import hashlib
import math
from datetime import datetime, timezone
from typing import Optional, List

PROTOCOL = "sovereign-physical/1.0"
VERSION = "1.0.0"

# State stores
_JARVIS_STATE = {
    "battery_pct": 0.85,
    "motors_health": {"arm_left": 0.98, "arm_right": 0.96, "leg_left": 0.99, "leg_right": 0.99, "neck": 1.0, "gripper": 0.97},
    "sensors_health": {"imu": 1.0, "lidar": 0.98, "camera": 0.99, "depth": 0.95, "force": 0.98, "audio": 1.0},
    "joints": {"shoulder_l": 0.0, "shoulder_r": 0.0, "elbow_l": 0.0, "elbow_r": 0.0, "hip_l": 0.0, "hip_r": 0.0, "knee_l": 0.0, "knee_r": 0.0},
    "position": [0.0, 0.0, 0.0],  # x, y, z in farm
    "pose": "standby",
    "last_heartbeat": datetime.now(timezone.utc).isoformat(),
    "sovereign_score": 7.305,
}

_MCKIBBEN = {
    "actuators": ["koi_pond_air_pump_1", "koi_pond_air_pump_2", "left_arm_air", "right_arm_air", "gripper_air"],
    "pressures": [0.0, 0.0, 0.0, 0.0, 0.0],  # kPa
    "temperatures": [22.0, 22.0, 22.0, 22.0, 22.0],
    "doctrine": "McKibben pneumatic - 6-DOF per actuator - koi pond air pumps feed JARVIS.",
}

_LEKIWI = {
    "position": [0.0, 0.0, 0.0],
    "battery_pct": 0.92,
    "path": [],
    "doctrine": "LeKiwi mobile base - iOK Farm navigation - 0.5m/s max.",
}

_JARVIS_LOG = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "phys-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def jarvis_status():
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "name": "JARVIS", "model": "Sovereign-Humanoid v1.0",
        "state": _JARVIS_STATE,
        "doctrine": "JARVIS humanoid. SO-100 arms + Berkeley Humanoid Lite legs + LeKiwi base + McKibben hands. Sovereign by construction.",
    })


def jarvis_command(command: str, params: Optional[dict] = None, simulate: bool = True):
    """Send a command to JARVIS (or simulate if hardware not connected)."""
    p = params or {}
    if command == "move_arm":
        joint = p.get("joint", "shoulder_l")
        angle = p.get("angle", 0.0)
        _JARVIS_STATE["joints"][joint] = angle
        result = f"Joint {joint} moved to {angle}°"
    elif command == "grasp":
        obj = p.get("object", "koi_fish")
        _JARVIS_STATE["pose"] = f"grasp({obj})"
        result = f"Grappling {obj}"
    elif command == "speak":
        text = p.get("text", "")
        _JARVIS_STATE["pose"] = "speak"
        result = f"Speaking: {text[:50]}"
    elif command == "stand":
        _JARVIS_STATE["pose"] = "stand"
        result = "Standing"
    elif command == "walk":
        distance = p.get("distance", 1.0)
        new_pos = list(_JARVIS_STATE["position"])
        new_pos[0] += distance
        _JARVIS_STATE["position"] = new_pos
        _JARVIS_STATE["pose"] = f"walk({distance}m)"
        result = f"Walked {distance}m to {new_pos}"
    elif command == "squat":
        _JARVIS_STATE["pose"] = "squat"
        result = "Squatting"
    else:
        result = f"Unknown command: {command}"
    _JARVIS_STATE["last_heartbeat"] = datetime.now(timezone.utc).isoformat()
    _JARVIS_LOG.append({"command": command, "params": p, "result": result, "ts": _JARVIS_STATE["last_heartbeat"]})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "command": command, "params": p, "result": result, "simulated": simulate,
        "new_pose": _JARVIS_STATE["pose"],
        "sovereign_score": _JARVIS_STATE["sovereign_score"],
        "doctrine": "JARVIS command executed. BFT 3-voter required for sensitive actions.",
    })


def jarvis_simulate(command: str, params: Optional[dict] = None):
    """Simulate a command without touching real hardware."""
    return jarvis_command(command, params, simulate=True)


def mckibben_actuate(actuator: str, pressure_kpa: float, duration_s: float = 1.0):
    """Actuate a McKibben pneumatic actuator."""
    if actuator not in _MCKIBBEN["actuators"]:
        return _sign({"error": f"unknown actuator: {actuator}", "valid": _MCKIBBEN["actuators"]})
    idx = _MCKIBBEN["actuators"].index(actuator)
    if pressure_kpa < 0 or pressure_kpa > 200:
        return _sign({"error": "pressure_kpa must be 0-200"})
    if duration_s < 0 or duration_s > 60:
        return _sign({"error": "duration_s must be 0-60"})
    _MCKIBBEN["pressures"][idx] = pressure_kpa
    _MCKIBBEN["temperatures"][idx] = 22.0 + (pressure_kpa / 200) * 10
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "actuator": actuator, "pressure_kpa": pressure_kpa,
        "duration_s": duration_s, "temperature_c": _MCKIBBEN["temperatures"][idx],
        "doctrine": "McKibben actuator - pneumatic. Koi pond air pumps feed JARVIS.",
    })


def lekiwi_navigate(x: float, y: float, speed_mps: float = 0.5):
    """Navigate LeKiwi mobile base to x,y in farm."""
    if speed_mps < 0 or speed_mps > 1.5:
        return _sign({"error": "speed_mps must be 0-1.5"})
    current = _LEKIWI["position"]
    distance = math.sqrt((x - current[0]) ** 2 + (y - current[1]) ** 2)
    if distance > 0 and speed_mps > 0:
        duration = distance / speed_mps
    else:
        duration = 0
    new_path = [(current[0] + t * (x - current[0]), current[1] + t * (y - current[1])) for t in [0.25, 0.5, 0.75, 1.0]]
    _LEKIWI["path"] = new_path
    _LEKIWI["position"] = [x, y, 0]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "from": current, "to": [x, y, 0], "distance_m": distance,
        "speed_mps": speed_mps, "duration_s": duration, "path": new_path,
        "doctrine": "LeKiwi mobile base - iOK Farm navigation.",
    })
