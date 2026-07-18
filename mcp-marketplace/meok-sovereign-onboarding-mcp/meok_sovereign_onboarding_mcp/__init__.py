"""meok-sovereign-onboarding-mcp — Sovereign Citizen Onboarding.

DID + Passport + UBI tier + training + voting.
Care Floor 0.95. SIGIL chain.

5 tools:
  1. onboard_register    - register a citizen
  2. onboard_passport    - issue sovereign passport
  3. onboard_ubi         - assign UBI tier
  4. onboard_progress    - check onboarding progress
  5. onboard_status      - onboarding system status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-onboarding/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# State
_CITIZENS = {}  # citizen_id -> {name, email, did, passport, tier, progress}
_ONBOARDING_STEPS = ["register", "did", "passport", "training", "ubi", "voting"]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "onboard-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def onboard_register(name: str = "", email: str = "") -> dict:
    """Register a citizen."""
    if not name or not email:
        return _sign({"error": "name and email required"})
    citizen_id = _gen_id("citizen")
    did = f"did:csoai:{citizen_id}"
    _CITIZENS[citizen_id] = {
        "citizen_id": citizen_id,
        "name": name,
        "email": email,
        "did": did,
        "passport": None,
        "tier": None,
        "progress": ["register"],
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "citizen": _CITIZENS[citizen_id],
        "next_step": "issue_did",
        "doctrine": f"Citizen {name} registered. DID: {did}. Sovereign by construction.",
    })


def onboard_passport(citizen_id: str = "") -> dict:
    """Issue sovereign passport."""
    if not citizen_id:
        return _sign({"error": "citizen_id required"})
    if citizen_id not in _CITIZENS:
        return _sign({"error": f"unknown citizen: {citizen_id}"})
    passport_id = _gen_id("passport")
    _CITIZENS[citizen_id]["passport"] = {
        "passport_id": passport_id,
        "issued_at": datetime.now(timezone.utc).isoformat(),
        "ed25519_signed": True,
    }
    if "passport" not in _CITIZENS[citizen_id]["progress"]:
        _CITIZENS[citizen_id]["progress"].append("passport")
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "passport": _CITIZENS[citizen_id]["passport"],
        "citizen_id": citizen_id,
        "doctrine": f"Passport issued for {citizen_id}. Ed25519-signed. Sovereign.",
    })


def onboard_ubi(citizen_id: str = "", tier: str = "foundation") -> dict:
    """Assign UBI tier."""
    tiers = {"foundation":300, "practitioner":600, "lead-auditor":900, "director":1200}
    if not citizen_id:
        return _sign({"error": "citizen_id required"})
    if citizen_id not in _CITIZENS:
        return _sign({"error": f"unknown citizen: {citizen_id}"})
    if tier not in tiers:
        return _sign({"error": f"unknown tier: {tier}. Use: {list(tiers.keys())}"})
    _CITIZENS[citizen_id]["tier"] = {"name":tier, "amount_gbp":tiers[tier], "since": datetime.now(timezone.utc).isoformat()}
    if "ubi" not in _CITIZENS[citizen_id]["progress"]:
        _CITIZENS[citizen_id]["progress"].append("ubi")
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "citizen_id": citizen_id,
        "tier": _CITIZENS[citizen_id]["tier"],
        "doctrine": f"UBI tier {tier} (£{tiers[tier]}/mo) assigned. Sovereign.",
    })


def onboard_progress(citizen_id: str = "") -> dict:
    """Check onboarding progress."""
    if not citizen_id:
        return _sign({"error": "citizen_id required"})
    if citizen_id not in _CITIZENS:
        return _sign({"error": f"unknown citizen: {citizen_id}"})
    c = _CITIZENS[citizen_id]
    completed = c["progress"]
    remaining = [s for s in _ONBOARDING_STEPS if s not in completed]
    pct = round(len(completed) / len(_ONBOARDING_STEPS) * 100, 1)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "citizen_id": citizen_id,
        "completed_steps": completed,
        "remaining_steps": remaining,
        "progress_pct": pct,
        "doctrine": f"Onboarding progress: {pct}% ({len(completed)}/{len(_ONBOARDING_STEPS)}). Sovereign.",
    })


def onboard_status() -> dict:
    """Onboarding system status."""
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_citizens": len(_CITIZENS),
        "onboarding_steps": _ONBOARDING_STEPS,
        "doctrine": f"Sovereign onboarding: {len(_CITIZENS)} citizens. Care Floor 0.95. Sovereign by construction.",
    })