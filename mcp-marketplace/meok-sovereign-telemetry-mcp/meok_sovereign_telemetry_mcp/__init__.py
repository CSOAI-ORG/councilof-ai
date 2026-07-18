"""meok-sovereign-telemetry-mcp — Live event log + care floor + BFT + sigil telemetry.

The Telemetry MCP is the master observability layer for the sovereign substrate.
It tracks:
  - 12 General events (per-tick logs)
  - Care floor probes (16 probes per check)
  - BFT votes (every vote on every proposal)
  - Sigil emissions (every signed event)

5 tools:
  1. telemetry_emit       - emit a telemetry event
  2. telemetry_get_recent - get recent events (filterable)
  3. telemetry_care_floor - care floor probe history
  4. telemetry_bft        - BFT voting history
  5. telemetry_sigil      - sigil chain summary
"""
from __future__ import annotations
import json
import hashlib
import time as _time
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, List, Optional

PROTOCOL = "sovereign-telemetry/1.0"
VERSION = "1.0.0"
LOG_PATH = Path("/Users/nicholas/clawd/sov_competition/telemetry_log.jsonl")
LOG_PATH.parent.mkdir(parents=True, exist_ok=True)

_LOG: List[dict] = []


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "tele-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _persist(entry):
    with open(LOG_PATH, "a") as f:
        f.write(json.dumps(entry) + "\n")


def telemetry_emit(event_type: str, actor: str, payload: dict = None) -> dict:
    """Emit a telemetry event."""
    payload = payload or {}
    event = {
        "event_type": event_type, "actor": actor, "payload": payload,
    }
    signed = _sign(event)
    _LOG.append(signed)
    _persist(signed)
    return signed


def telemetry_get_recent(limit: int = 50,
                        event_type: Optional[str] = None,
                        actor: Optional[str] = None) -> dict:
    """Get recent events, optionally filtered."""
    matching = []
    for entry in reversed(_LOG):
        if event_type and entry.get("event_type") != event_type:
            continue
        if actor and entry.get("actor") != actor:
            continue
        matching.append(entry)
        if len(matching) >= limit:
            break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "event_type": event_type, "actor": actor, "limit": limit,
        "matches": matching, "count": len(matching),
        "total": len(_LOG),
    })


def telemetry_care_floor(limit: int = 50) -> dict:
    """Care floor probe history (16 probes per check)."""
    matching = []
    for entry in reversed(_LOG):
        if entry.get("event_type") == "care_floor_check":
            matching.append(entry)
            if len(matching) >= limit:
                break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "matches": matching, "count": len(matching),
    })


def telemetry_bft(limit: int = 50) -> dict:
    """BFT voting history."""
    matching = []
    for entry in reversed(_LOG):
        if entry.get("event_type") in ("bft_propose", "bft_vote", "bft_ratify"):
            matching.append(entry)
            if len(matching) >= limit:
                break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "matches": matching, "count": len(matching),
    })


def telemetry_sigil() -> dict:
    """Sigil chain summary."""
    sigil_events = [e for e in _LOG if e.get("event_type", "").startswith("sigil_")]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sigil_count": len(sigil_events),
        "total_events": len(_LOG),
        "recent_sigil": sigil_events[-1] if sigil_events else None,
    })