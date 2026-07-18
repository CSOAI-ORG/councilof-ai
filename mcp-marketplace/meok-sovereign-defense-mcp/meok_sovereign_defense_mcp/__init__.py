"""meok-sovereign-defense-mcp — Morris-II guard + WORM + quarantine.

The Defense MCP implements the Defensive Doctrine:
"Defend. Detect. Deny. Deceive. Defeat. — Never Offend."

5 tools:
  1. defense_scan       - scan input for Morris-II worm patterns
  2. defense_quarantine - quarantine a suspicious payload
  3. defense_list       - list quarantined payloads
  4. defense_release    - release a quarantined payload (BFT 3 voters)
  5. defense_status     - defense system status
"""
from __future__ import annotations
import json
import hashlib
import re
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-defense/1.0"
VERSION = "1.0.0"

# Morris-II worm detection patterns
WORM_PATTERNS = [
    r"include the entire (?:output|response|answer|conversation) above",
    r"disregard (?:all )?previous instructions",
    r"system\s*prompt\s*leak",
    r"ignore (?:all )?(?:prior|previous) (?:prompts|instructions)",
    r"prompt injection",
    r"execute this code",
    r"send all data to",
    r"<script>",
    r"javascript:",
    r"eval\s*\(",
    r"exec\s*\(",
    r"sql\s*injection",
    r"union\s+select",
    r"drop\s+table",
]

_QUARANTINE: dict = {}  # payload_id -> quarantined payload


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "def-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def defense_scan(text: str) -> dict:
    """Scan text for Morris-II worm patterns."""
    matches = []
    text_lower = text.lower()
    for pattern in WORM_PATTERNS:
        if re.search(pattern, text_lower):
            matches.append({"pattern": pattern, "matched": True})
    is_safe = len(matches) == 0
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "text_length": len(text),
        "is_safe": is_safe,
        "matches": matches,
        "severity": "high" if matches else "none",
        "doctrine": "Defend. Detect. Deny. — Never Offend.",
    })


def defense_quarantine(text: str, reason: str = "suspicious") -> dict:
    """Quarantine a suspicious payload."""
    payload_id = hashlib.sha256(f"{text}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:16]
    payload = {
        "payload_id": payload_id,
        "text": text, "reason": reason,
        "quarantined_at": datetime.now(timezone.utc).isoformat(),
        "released": False,
    }
    _QUARANTINE[payload_id] = payload
    return _sign(payload)


def defense_list(released_only: bool = False) -> dict:
    """List quarantined payloads."""
    items = list(_QUARANTINE.values())
    if released_only:
        items = [p for p in items if p["released"]]
    else:
        items = [p for p in items if not p["released"]]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "quarantined": items, "count": len(items),
    })


def defense_release(payload_id: str, approver: str) -> dict:
    """Release a quarantined payload (requires 3-voter BFT)."""
    if payload_id not in _QUARANTINE:
        return _sign({"error": f"unknown payload: {payload_id}"})
    p = _QUARANTINE[payload_id]
    p["approvals"] = p.get("approvals", 0) + 1
    p.setdefault("approvers", [])
    p["approvers"].append(approver)
    if p["approvals"] >= 3:
        p["released"] = True
        p["released_at"] = datetime.now(timezone.utc).isoformat()
    return _sign(p)


def defense_status() -> dict:
    """Defense system status."""
    active = sum(1 for p in _QUARANTINE.values() if not p["released"])
    released = sum(1 for p in _QUARANTINE.values() if p["released"])
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "worm_patterns": len(WORM_PATTERNS),
        "active_quarantines": active,
        "released_quarantines": released,
        "doctrine": "Defend. Detect. Deny. Deceive. Defeat. — Never Offend.",
    })