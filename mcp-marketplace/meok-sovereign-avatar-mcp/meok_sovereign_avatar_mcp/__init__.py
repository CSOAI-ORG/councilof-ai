"""meok_sovereign_avatar_mcp — Sovereign Avatar MCP.

Embodied sovereign character (VRM) with local voice + gaze + lip-sync.
5 tools:
  1. sov_avatar_say - avatar speaks (with lip-sync + TTS)
  2. sov_avatar_listen - STT (whisper.cpp local)
  3. sov_avatar_gaze - set gaze target (mouse/cursor tracking)
  4. sov_avatar_state - get current avatar state
  5. sov_avatar_mood - set mood (idle/listening/speaking/alert)
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import time
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
PROTOCOL = "sovereign-avatar/0.1"

# Avatar state (in-memory; replace with persistent store for production)
_AVATAR_STATE = {
    "name": "Sov3",
    "vrm_model": "sov3-dragon.vrm",
    "position": {"x": 0.8, "y": -0.8},  # bottom-right corner
    "scale": 0.8,
    "mood": "idle",
    "current_text": "",
    "is_speaking": False,
    "last_speech_ts": None,
    "gaze_target": {"x": 0, "y": 0},
    "voice_id": "sovereign_dragon",
    "stt_model": "whisper-base-en",
}


def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_AVATAR_KEY") or os.path.expanduser("~/.meok/sov_avatar_key.pem")
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


def sov_avatar_say(text: str, *, mood: str = "neutral", voice_id: Optional[str] = None) -> dict:
    """Avatar speaks the given text (with lip-sync + local TTS).

    In production: Kokoro TTS generates audio + VRM blend shapes for lip-sync.
    Here: returns the signed instruction for the frontend to execute.
    """
    speech_id = hashlib.sha256(
        f"{text[:200]}|{mood}|{time.time()}".encode()
    ).hexdigest()[:16]

    _AVATAR_STATE["is_speaking"] = True
    _AVATAR_STATE["current_text"] = text
    _AVATAR_STATE["mood"] = mood
    _AVATAR_STATE["last_speech_ts"] = datetime.now(timezone.utc).isoformat()

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "speech_id": speech_id,
        "text": text,
        "mood": mood,
        "voice_id": voice_id or _AVATAR_STATE["voice_id"],
        "tts": "kokoro",
        "lip_sync": True,
        "duration_estimate_sec": len(text.split()) * 0.4,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/avatar/speech/{speech_id}"
    return signed


def sov_avatar_listen(audio_path: str, *, stt_model: Optional[str] = None) -> dict:
    """STT: transcribe audio to text (whisper.cpp local)."""
    if not os.path.exists(audio_path):
        return {"error": f"audio file not found: {audio_path}"}

    listen_id = hashlib.sha256(
        f"{audio_path}|{time.time()}".encode()
    ).hexdigest()[:16]
    _AVATAR_STATE["mood"] = "listening"

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "listen_id": listen_id,
        "audio_path": audio_path,
        "stt_model": stt_model or _AVATAR_STATE["stt_model"],
        "engine": "whisper.cpp",
        "language": "en",
        # In production: actual transcription
        "transcript": "(transcription would happen here — wire to whisper.cpp)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = f"https://proofof.ai/avatar/listen/{listen_id}"
    return signed


def sov_avatar_gaze(target_x: float, target_y: float) -> dict:
    """Set avatar gaze target (-1 to 1 normalized coords)."""
    if not (-1.0 <= target_x <= 1.0 and -1.0 <= target_y <= 1.0):
        return {"error": "gaze coords must be in [-1, 1]"}

    _AVATAR_STATE["gaze_target"] = {"x": target_x, "y": target_y}

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "gaze_target": _AVATAR_STATE["gaze_target"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/avatar/gaze"
    return signed


def sov_avatar_state() -> dict:
    """Get current avatar state."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "avatar": _AVATAR_STATE,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/avatar/state"
    return signed


def sov_avatar_mood(mood: str) -> dict:
    """Set avatar mood: idle | listening | speaking | alert | happy | concerned."""
    valid_moods = ("idle", "listening", "speaking", "alert", "happy", "concerned", "neutral")
    if mood not in valid_moods:
        return {"error": f"invalid mood: {mood}", "valid": list(valid_moods)}

    old_mood = _AVATAR_STATE["mood"]
    _AVATAR_STATE["mood"] = mood

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "old_mood": old_mood,
        "new_mood": mood,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = "https://proofof.ai/avatar/mood"
    return signed


def register_mcp_tools(mcp):
    mcp.tool(name="sov_avatar_say", description="Avatar speaks text (lip-sync + local TTS).")(sov_avatar_say)
    mcp.tool(name="sov_avatar_listen", description="STT via whisper.cpp (local, sovereign).")(sov_avatar_listen)
    mcp.tool(name="sov_avatar_gaze", description="Set avatar gaze target.")(sov_avatar_gaze)
    mcp.tool(name="sov_avatar_state", description="Get current avatar state.")(sov_avatar_state)
    mcp.tool(name="sov_avatar_mood", description="Set avatar mood (idle/listening/speaking/alert).")(sov_avatar_mood)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-avatar")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
