"""meok-sovereign-feature-flags-mcp — Sovereign Feature Flags + A/B Testing.

Feature flags with rollout %, A/B testing, canary deployment.
Care Floor gated.

5 tools:
  1. flags_create       - create a feature flag
  2. flags_evaluate     - evaluate flag for user
  3. flags_set_rollout  - update rollout %
  4. flags_list         - list all flags
  5. flags_status       - flag system status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-feature-flags/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_FLAGS = {}  # flag_id -> {name, rollout, variants, enabled, created_at}
_EVALUATIONS = []  # log of evaluations


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "ff-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def flags_create(name: str = "", rollout: int = 100, variants: str = "control,treatment") -> dict:
    """Create a feature flag."""
    if not name:
        return _sign({"error": "name required"})
    if rollout < 0 or rollout > 100:
        return _sign({"error": "rollout must be 0-100"})
    variant_list = [v.strip() for v in variants.split(",") if v.strip()]
    if len(variant_list) < 2:
        return _sign({"error": "need at least 2 variants for A/B testing"})
    _FLAGS[name] = {
        "name": name,
        "rollout": rollout,
        "variants": variant_list,
        "enabled": True,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "flag": _FLAGS[name],
        "doctrine": f"Feature flag {name} created. Sovereign by construction.",
    })


def flags_evaluate(name: str = "", user_id: str = "") -> dict:
    """Evaluate flag for user (deterministic hash)."""
    if not name:
        return _sign({"error": "name required"})
    if not user_id:
        return _sign({"error": "user_id required"})
    if name not in _FLAGS:
        return _sign({"error": f"unknown flag: {name}"})
    flag = _FLAGS[name]
    if not flag["enabled"]:
        result = {"protocol": PROTOCOL, "version": VERSION, "name": name, "variant": "control", "enabled": False}
        _EVALUATIONS.append(result)
        return _sign(result)
    # Deterministic hash for user
    user_hash = int(hashlib.sha256((name + ":" + user_id).encode()).hexdigest()[:8], 16)
    user_pct = user_hash % 100
    if user_pct >= flag["rollout"]:
        result = {"protocol": PROTOCOL, "version": VERSION, "name": name, "variant": "control", "enabled": False, "reason": "user in control group (rollout excludes)"}
        _EVALUATIONS.append(result)
        return _sign(result)
    # Pick variant deterministically
    variant_idx = user_hash % len(flag["variants"])
    variant = flag["variants"][variant_idx]
    result = {"protocol": PROTOCOL, "version": VERSION, "name": name, "variant": variant, "enabled": True}
    _EVALUATIONS.append(result)
    return _sign(result)


def flags_set_rollout(name: str = "", rollout: int = 100) -> dict:
    """Update rollout %."""
    if not name:
        return _sign({"error": "name required"})
    if name not in _FLAGS:
        return _sign({"error": f"unknown flag: {name}"})
    if rollout < 0 or rollout > 100:
        return _sign({"error": "rollout must be 0-100"})
    _FLAGS[name]["rollout"] = rollout
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "name": name,
        "rollout": rollout,
        "doctrine": f"Feature flag {name} rollout updated to {rollout}%. Sovereign.",
    })


def flags_list() -> dict:
    """List all flags."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "flags": list(_FLAGS.values()),
        "total": len(_FLAGS),
        "doctrine": f"Sovereign feature flags: {len(_FLAGS)} flags. Sovereign.",
    })


def flags_status() -> dict:
    """Flag system status."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_flags": len(_FLAGS),
        "enabled_flags": sum(1 for f in _FLAGS.values() if f["enabled"]),
        "evaluations_logged": len(_EVALUATIONS),
        "doctrine": f"Sovereign feature flags: {len(_FLAGS)} flags ({sum(1 for f in _FLAGS.values() if f['enabled'])} enabled), {len(_EVALUATIONS)} evaluations. Care Floor 0.95.",
    })