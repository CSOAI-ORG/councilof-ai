"""meok-sovereign-orbs-mcp — The Orbs + Water Data Transfer.

The orbs are sovereign data nodes. Each orb holds a piece of the
digital twin. Water flows between orbs (data transfer).

5 tools:
  1. orb_create      - create a new orb (sovereign data node)
  2. orb_transfer    - transfer water (data) between orbs
  3. orb_inspect     - inspect an orb's contents
  4. orb_connect     - connect two orbs (channel)
  5. orb_status      - get orbs network status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone

PROTOCOL = "sovereign-orbs/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Orb types (hive, sub-hive, twin, archive, edge)
ORB_TYPES = ["hive", "sub-hive", "twin", "archive", "edge"]

# Orbs network
_ORBS = {}  # orb_id -> {name, type, lat, lng, water_amount, channels}
_CHANNELS = []  # list of (orb_a, orb_b)
_WATER_HISTORY = []  # list of transfers


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "orb-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def orb_create(name: str = "", orb_type: str = "hive", lat: float = 51.5074, lng: float = -0.1278, water_amount: float = 1000.0) -> dict:
    """Create a new orb (sovereign data node)."""
    if orb_type not in ORB_TYPES:
        return _sign({"error": f"unknown orb_type: {orb_type}. Use one of {ORB_TYPES}"})
    if not name:
        return _sign({"error": "name required"})
    orb_id = _gen_id("orb")
    _ORBS[orb_id] = {
        "orb_id": orb_id,
        "name": name,
        "type": orb_type,
        "lat": lat,
        "lng": lng,
        "water_amount": water_amount,
        "max_capacity": water_amount * 10,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "orb": _ORBS[orb_id],
        "total_orbs": len(_ORBS),
        "doctrine": f"Orb '{name}' ({orb_type}) created at ({lat}, {lng}) with {water_amount} units of water.",
    })


def orb_transfer(from_orb: str = "", to_orb: str = "", amount: float = 0) -> dict:
    """Transfer water (data) between orbs."""
    if from_orb not in _ORBS:
        return _sign({"error": f"unknown from_orb: {from_orb}"})
    if to_orb not in _ORBS:
        return _sign({"error": f"unknown to_orb: {to_orb}"})
    if amount <= 0:
        return _sign({"error": "amount must be > 0"})
    if _ORBS[from_orb]["water_amount"] < amount:
        return _sign({"error": f"insufficient water in {from_orb}: has {_ORBS[from_orb]['water_amount']}, need {amount}"})
    _ORBS[from_orb]["water_amount"] -= amount
    _ORBS[to_orb]["water_amount"] = min(_ORBS[to_orb]["max_capacity"], _ORBS[to_orb]["water_amount"] + amount)
    transfer_id = _gen_id("transfer")
    transfer = {
        "transfer_id": transfer_id,
        "from": from_orb,
        "to": to_orb,
        "amount": amount,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _WATER_HISTORY.append(transfer)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "transfer": transfer,
        "from_water": _ORBS[from_orb]["water_amount"],
        "to_water": _ORBS[to_orb]["water_amount"],
        "doctrine": f"Transferred {amount} units of water from {_ORBS[from_orb]['name']} to {_ORBS[to_orb]['name']}. Sovereign by construction.",
    })


def orb_inspect(orb_id: str = "") -> dict:
    """Inspect an orb's contents."""
    if orb_id not in _ORBS:
        return _sign({"error": f"unknown orb_id: {orb_id}"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "orb": _ORBS[orb_id],
        "doctrine": f"Orb '{_ORBS[orb_id]['name']}' has {_ORBS[orb_id]['water_amount']} units of water.",
    })


def orb_connect(orb_a: str = "", orb_b: str = "") -> dict:
    """Connect two orbs (channel)."""
    if orb_a not in _ORBS:
        return _sign({"error": f"unknown orb_a: {orb_a}"})
    if orb_b not in _ORBS:
        return _sign({"error": f"unknown orb_b: {orb_b}"})
    channel_id = _gen_id("ch")
    channel = {
        "channel_id": channel_id,
        "orb_a": orb_a,
        "orb_b": orb_b,
        "opened_at": datetime.now(timezone.utc).isoformat(),
    }
    _CHANNELS.append(channel)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "channel": channel,
        "total_channels": len(_CHANNELS),
        "doctrine": f"Channel opened between {_ORBS[orb_a]['name']} and {_ORBS[orb_b]['name']}. Sovereign by construction.",
    })


def orb_status() -> dict:
    """Get orbs network status."""
    total_water = sum(o["water_amount"] for o in _ORBS.values())
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_orbs": len(_ORBS),
        "total_channels": len(_CHANNELS),
        "total_water": total_water,
        "total_transfers": len(_WATER_HISTORY),
        "orbs": list(_ORBS.values()),
        "doctrine": f"Orbs network: {len(_ORBS)} orbs, {len(_CHANNELS)} channels, {total_water:.0f} units of water. Sovereign.",
    })