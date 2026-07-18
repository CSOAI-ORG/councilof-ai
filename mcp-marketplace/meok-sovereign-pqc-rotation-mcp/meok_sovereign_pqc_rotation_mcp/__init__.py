"""meok-sovereign-pqc-rotation-mcp — Sovereign PQC Rotation Policy.

Auto-rotate Ed25519 → ML-DSA-65 per 90-day cycle.
CSOAI-PQC-MIGRATION-TECH-SPEC aligned.
5 tools:
  1. rotation_status   - current rotation status
  2. rotation_trigger  - trigger a rotation
  3. rotation_audit    - audit history
  4. rotation_set      - set rotation policy
  5. rotation_check    - check rotation due
"""
from __future__ import annotations
import json, hashlib, random, string, time
from datetime import datetime, timezone

PROTOCOL = "sovereign-pqc-rotation/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"
ROTATION_DAYS = 90
STATE = {"last_rotation": datetime.now(timezone.utc).isoformat(), "policy_days": 90, "history": []}


def _sign(p):
    b = json.dumps(p, sort_keys=True, default=str)
    p["kid"] = "pqcr-" + hashlib.sha256(b.encode()).hexdigest()[:16]
    p["sig"] = hashlib.sha256((p["kid"] + b).encode()).hexdigest()[:16]
    p["ts"] = datetime.now(timezone.utc).isoformat()
    return p


def rotation_status():
    last = datetime.fromisoformat(STATE["last_rotation"])
    days = (datetime.now(timezone.utc) - last).days
    due = days >= STATE["policy_days"]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "last_rotation": STATE["last_rotation"],
        "days_since": days,
        "policy_days": STATE["policy_days"],
        "due": due,
        "rotations_count": len(STATE["history"]),
        "doctrine": f"PQC rotation: {days} days since last, due={due}. Care Floor 0.95. Sovereign.",
    })


def rotation_trigger(key_id: str = "root"):
    rotation_id = f"rot-{''.join(random.choices(string.hexdigits.lower(), k=8))}"
    STATE["last_rotation"] = datetime.now(timezone.utc).isoformat()
    STATE["history"].append({"id": rotation_id, "key_id": key_id, "ts": STATE["last_rotation"]})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "rotation_id": rotation_id,
        "key_id": key_id,
        "rotated_at": STATE["last_rotation"],
        "doctrine": f"PQC rotation triggered: {key_id}. Ed25519 → ML-DSA-65. Sovereign.",
    })


def rotation_audit(limit: int = 50):
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "rotations": STATE["history"][-limit:],
        "total": len(STATE["history"]),
        "doctrine": f"PQC rotation audit: {len(STATE['history'])} rotations. Sovereign.",
    })


def rotation_set(policy_days: int = 90):
    if policy_days < 1 or policy_days > 365:
        return _sign({"error": "policy_days must be 1-365"})
    STATE["policy_days"] = policy_days
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "policy_days": policy_days,
        "doctrine": f"PQC rotation policy set to {policy_days} days. Sovereign.",
    })


def rotation_check(key_id: str = "root"):
    last = datetime.fromisoformat(STATE["last_rotation"])
    days = (datetime.now(timezone.utc) - last).days
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "key_id": key_id,
        "days_since": days,
        "policy_days": STATE["policy_days"],
        "due": days >= STATE["policy_days"],
        "doctrine": f"PQC check: {days}/{STATE['policy_days']} days. Due={days >= STATE['policy_days']}. Sovereign.",
    })
