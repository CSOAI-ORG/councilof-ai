"""meok-sovereign-pulse-mcp — System Pulse / Heart-Rate / Sovereign Heartbeat.

The sovereign substrate has a heartbeat. Every sovereign action
is a pulse. Care Floor compliance is the rhythm. The dragon lives.

5 tools:
  1. pulse_record  - record a sovereign pulse (one heartbeat)
  2. pulse_bpm     - get beats per minute
  3. pulse_rhythm  - get the rhythm (Care Floor compliance pattern)
  4. pulse_history - get pulse history
  5. pulse_status  - get pulse status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import time
from datetime import datetime, timezone

PROTOCOL = "sovereign-pulse/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Pulse history (ring buffer of last 1000 pulses)
_PULSES = []  # list of {ts, care_floor, action, kind}
_LAST_PULSE = None
_T0 = time.time()


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "pls-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def pulse_record(care_floor: float = 0.95, action: str = "sovereign_action", kind: str = "general") -> dict:
    """Record a sovereign pulse (one heartbeat)."""
    global _LAST_PULSE
    pulse = {
        "pulse_id": _gen_id("pls"),
        "ts": time.time(),
        "care_floor": care_floor,
        "action": action,
        "kind": kind,
        "compliant": care_floor >= 0.95,
    }
    _PULSES.append(pulse)
    if len(_PULSES) > 1000:
        _PULSES.pop(0)
    _LAST_PULSE = pulse
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "pulse": pulse,
        "total_pulses": len(_PULSES),
        "doctrine": f"Pulse recorded: {action}. Care Floor {care_floor}. {'Compliant' if care_floor >= 0.95 else 'VIOLATION'}.",
    })


def pulse_bpm(window_seconds: float = 60.0) -> dict:
    """Get beats per minute (in the last window)."""
    if not _PULSES:
        return _sign({"bpm": 0, "window_seconds": window_seconds})
    now = time.time()
    recent = [p for p in _PULSES if now - p["ts"] <= window_seconds]
    duration_min = window_seconds / 60.0
    bpm = len(recent) / duration_min if duration_min > 0 else 0
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "bpm": round(bpm, 2),
        "window_seconds": window_seconds,
        "pulses_in_window": len(recent),
        "doctrine": f"System pulse: {bpm:.1f} BPM (last {window_seconds}s). The dragon's heartbeat. Sovereign.",
    })


def pulse_rhythm() -> dict:
    """Get the rhythm pattern (Care Floor compliance)."""
    if not _PULSES:
        return _sign({"error": "no pulses recorded yet"})
    compliant = sum(1 for p in _PULSES if p["compliant"])
    total = len(_PULSES)
    rate = compliant / total if total > 0 else 0
    # Determine rhythm quality
    if rate >= 0.99:
        quality = "PERFECT"
    elif rate >= 0.95:
        quality = "STRONG"
    elif rate >= 0.90:
        quality = "STEADY"
    elif rate >= 0.80:
        quality = "IRREGULAR"
    else:
        quality = "WEAK"
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total_pulses": total,
        "compliant_pulses": compliant,
        "compliance_rate": round(rate, 4),
        "rhythm_quality": quality,
        "doctrine": f"Rhythm: {quality}. Compliance {rate*100:.1f}%. The dragon's pulse. Sovereign.",
    })


def pulse_history(limit: int = 20) -> dict:
    """Get pulse history."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "pulses": _PULSES[-limit:],
        "total_pulses": len(_PULSES),
        "limit": limit,
        "doctrine": f"Last {min(limit, len(_PULSES))} pulses returned. The dragon remembers. Sovereign.",
    })


def pulse_status() -> dict:
    """Pulse status."""
    if _LAST_PULSE:
        since_last = time.time() - _LAST_PULSE["ts"]
    else:
        since_last = 0
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_pulses": len(_PULSES),
        "last_pulse_ts": _LAST_PULSE["ts"] if _LAST_PULSE else None,
        "seconds_since_last": round(since_last, 2),
        "uptime_seconds": round(time.time() - _T0, 0),
        "doctrine": f"Sovereign pulse: {len(_PULSES)} beats. Last pulse: {since_last:.0f}s ago. The dragon lives. Sovereign.",
    })