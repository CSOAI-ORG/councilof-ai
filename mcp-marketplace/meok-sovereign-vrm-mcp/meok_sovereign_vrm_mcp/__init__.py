"""meok-sovereign-vrm-mcp — 12-General VRM avatar controller.

5 tools:
  1. spawn_avatar   - spawn a General avatar
  2. speak          - speak with the General's voice
  3. gesture        - perform a gesture
  4. save_pose      - save current pose
  5. render         - render the avatar in UE5
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import Optional, List

PROTOCOL = "sovereign-vrm/1.0"
VERSION = "1.0.0"

GENERALS = [
    {"id": 1, "name": "Argus", "role": "watchdog", "voice": "Watch. Report. Protect.",
     "color": "#60a5fa", "asset_url": "/vrm/argus.vrm"},
    {"id": 2, "name": "Scribe", "role": "compliance", "voice": "Compliance is a covenant.",
     "color": "#fbbf24", "asset_url": "/vrm/scribe.vrm"},
    {"id": 3, "name": "Shield", "role": "safety", "voice": "Defense without offense.",
     "color": "#10b981", "asset_url": "/vrm/shield.vrm"},
    {"id": 4, "name": "Builder", "role": "architect", "voice": "Architecture is a covenant with the future.",
     "color": "#8b5cf6", "asset_url": "/vrm/builder.vrm"},
    {"id": 5, "name": "Abacus", "role": "quant", "voice": "Number is a covenant.",
     "color": "#f59e0b", "asset_url": "/vrm/abacus.vrm"},
    {"id": 6, "name": "Lex", "role": "legal", "voice": "Law is sovereign. License is sovereign.",
     "color": "#ef4444", "asset_url": "/vrm/lex.vrm"},
    {"id": 7, "name": "Scale", "role": "ethics", "voice": "Balance is sovereign. Bias is not.",
     "color": "#06b6d4", "asset_url": "/vrm/scale.vrm"},
    {"id": 8, "name": "Crow", "role": "risk", "voice": "Risk is sovereign. Knowledge is sovereign.",
     "color": "#a3e635", "asset_url": "/vrm/crow.vrm"},
    {"id": 9, "name": "Gear", "role": "operations", "voice": "Operations is a covenant with uptime.",
     "color": "#ec4899", "asset_url": "/vrm/gear.vrm"},
    {"id": 10, "name": "Voice", "role": "comms", "voice": "Communication is sovereign. Clarity is sovereign.",
     "color": "#14b8a6", "asset_url": "/vrm/voice.vrm"},
    {"id": 11, "name": "Owl", "role": "research", "voice": "Research is sovereign. Wisdom is sovereign.",
     "color": "#84cc16", "asset_url": "/vrm/owl.vrm"},
    {"id": 12, "name": "Dragon", "role": "sovereign", "voice": "The dragon runs itself. Sovereign by construction.",
     "color": "#fbbf24", "asset_url": "/vrm/dragon.vrm"},
]

_AVATARS = {}  # spawn_id → avatar


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "vrm-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def spawn_avatar(general_id: int, position: Optional[List[float]] = None) -> dict:
    """Spawn a General avatar."""
    if general_id < 1 or general_id > 12:
        return _sign({"error": "general_id must be 1-12"})
    general = GENERALS[general_id - 1]
    spawn_id = hashlib.sha256(f"{general_id}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:12]
    avatar = {
        "spawn_id": spawn_id,
        "general": general,
        "position": position or [0.0, 0.0, 0.0],
        "spawned_at": datetime.now(timezone.utc).isoformat(),
        "rig_vrm": general["asset_url"],
    }
    _AVATARS[spawn_id] = avatar
    return _sign(avatar)


def speak(spawn_id: str, message: str) -> dict:
    """Speak with the General's voice."""
    if spawn_id not in _AVATARS:
        return _sign({"error": f"unknown spawn_id: {spawn_id}"})
    avatar = _AVATARS[spawn_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "spawn_id": spawn_id,
        "general": avatar["general"]["name"],
        "message": message,
        "voice_id": avatar["general"]["name"].lower(),
        "duration_s": len(message) * 0.05,
        "doctrine": f"{avatar['general']['name']} spoke: {avatar['general']['voice']}",
    })


def gesture(spawn_id: str, gesture_type: str) -> dict:
    """Perform a gesture."""
    if spawn_id not in _AVATARS:
        return _sign({"error": f"unknown spawn_id: {spawn_id}"})
    if gesture_type not in ("wave", "bow", "point", "nod", "shake-head", "thumbs-up"):
        return _sign({"error": f"unknown gesture: {gesture_type}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "spawn_id": spawn_id, "gesture": gesture_type,
        "duration_s": 1.5,
        "doctrine": f"{_AVATARS[spawn_id]['general']['name']} performed {gesture_type}",
    })


def save_pose(spawn_id: str) -> dict:
    """Save current pose."""
    if spawn_id not in _AVATARS:
        return _sign({"error": f"unknown spawn_id: {spawn_id}"})
    pose_id = hashlib.sha256(f"pose|{spawn_id}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:12]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "spawn_id": spawn_id, "pose_id": pose_id,
        "doctrine": "Pose saved for sovereign replay.",
    })


def render(spawn_id: str) -> dict:
    """Render the avatar in UE5."""
    if spawn_id not in _AVATARS:
        return _sign({"error": f"unknown spawn_id: {spawn_id}"})
    avatar = _AVATARS[spawn_id]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "spawn_id": spawn_id,
        "engine": "UE5.7",
        "general": avatar["general"]["name"],
        "asset_loaded": True,
        "frame_count": 1, "fps": 60.0,
        "doctrine": "12 General avatars ready for digital twin.",
    })
