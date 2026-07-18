"""meok-sovereign-hive-mcp — 33 Hive Deep Operations.

Each hive: lat/lng, lead General, services, sovereign composite, status.
5 tools:
  1. hive_get          - get a specific hive
  2. hive_list         - list all 33 hives
  3. hive_status       - get hive online status
  4. hive_route        - route between two hives
  5. hive_tier         - get all hives in a tier
"""
from __future__ import annotations
import json
import hashlib
import math
import random
from datetime import datetime, timezone

PROTOCOL = "sovereign-hive/1.0"
VERSION = "1.0.0"
LICENSE = "MIT"

# The 33 sovereign hives with real coordinates
HIVES = [
    # Inner (6)
    {"id": 1, "name": "London", "lat": 51.5074, "lng": -0.1278, "tier": "inner", "gen": "Argus", "country": "UK"},
    {"id": 2, "name": "Cambridge", "lat": 52.2053, "lng": 0.1218, "tier": "inner", "gen": "Owl", "country": "UK"},
    {"id": 3, "name": "Edinburgh", "lat": 55.9533, "lng": -3.1883, "tier": "inner", "gen": "Shield", "country": "UK"},
    {"id": 4, "name": "York", "lat": 53.9600, "lng": -1.0873, "tier": "inner", "gen": "Scribe", "country": "UK"},
    {"id": 5, "name": "Cardiff", "lat": 51.4816, "lng": -3.1791, "tier": "inner", "gen": "Voice", "country": "UK"},
    {"id": 6, "name": "Belfast", "lat": 54.5973, "lng": -5.9301, "tier": "inner", "gen": "Crow", "country": "UK"},
    # Middle (12)
    {"id": 7, "name": "Dublin", "lat": 53.3498, "lng": -6.2603, "tier": "middle", "gen": "Voice", "country": "IE"},
    {"id": 8, "name": "Paris", "lat": 48.8566, "lng": 2.3522, "tier": "middle", "gen": "Owl", "country": "FR"},
    {"id": 9, "name": "Berlin", "lat": 52.5200, "lng": 13.4050, "tier": "middle", "gen": "Shield", "country": "DE"},
    {"id": 10, "name": "Amsterdam", "lat": 52.3676, "lng": 4.9041, "tier": "middle", "gen": "Lex", "country": "NL"},
    {"id": 11, "name": "Stockholm", "lat": 59.3293, "lng": 18.0686, "tier": "middle", "gen": "Scale", "country": "SE"},
    {"id": 12, "name": "Helsinki", "lat": 60.1699, "lng": 24.9384, "tier": "middle", "gen": "Scribe", "country": "FI"},
    {"id": 13, "name": "Madrid", "lat": 40.4168, "lng": -3.7038, "tier": "middle", "gen": "Voice", "country": "ES"},
    {"id": 14, "name": "Rome", "lat": 41.9028, "lng": 12.4964, "tier": "middle", "gen": "Lex", "country": "IT"},
    {"id": 15, "name": "Vienna", "lat": 48.2082, "lng": 16.3738, "tier": "middle", "gen": "Scale", "country": "AT"},
    {"id": 16, "name": "Copenhagen", "lat": 55.6761, "lng": 12.5683, "tier": "middle", "gen": "Crow", "country": "DK"},
    {"id": 17, "name": "Brussels", "lat": 50.8503, "lng": 4.3517, "tier": "middle", "gen": "Lex", "country": "BE"},
    {"id": 18, "name": "Warsaw", "lat": 52.2297, "lng": 21.0122, "tier": "middle", "gen": "Crow", "country": "PL"},
    # Outer (9)
    {"id": 19, "name": "New York", "lat": 40.7128, "lng": -74.0060, "tier": "outer", "gen": "Scribe", "country": "US"},
    {"id": 20, "name": "SF", "lat": 37.7749, "lng": -122.4194, "tier": "outer", "gen": "Builder", "country": "US"},
    {"id": 21, "name": "Tokyo", "lat": 35.6762, "lng": 139.6503, "tier": "outer", "gen": "Builder", "country": "JP"},
    {"id": 22, "name": "Singapore", "lat": 1.3521, "lng": 103.8198, "tier": "outer", "gen": "Abacus", "country": "SG"},
    {"id": 23, "name": "Sydney", "lat": -33.8688, "lng": 151.2093, "tier": "outer", "gen": "Voice", "country": "AU"},
    {"id": 24, "name": "Mumbai", "lat": 19.0760, "lng": 72.8777, "tier": "outer", "gen": "Crow", "country": "IN"},
    {"id": 25, "name": "Dubai", "lat": 25.2048, "lng": 55.2708, "tier": "outer", "gen": "Gear", "country": "AE"},
    {"id": 26, "name": "Sao Paulo", "lat": -23.5505, "lng": -46.6333, "tier": "outer", "gen": "Scale", "country": "BR"},
    {"id": 27, "name": "Toronto", "lat": 43.6532, "lng": -79.3832, "tier": "outer", "gen": "Lex", "country": "CA"},
    # Frontier (6)
    {"id": 28, "name": "Cape Town", "lat": -33.9249, "lng": 18.4241, "tier": "frontier", "gen": "Shield", "country": "ZA"},
    {"id": 29, "name": "Reykjavik", "lat": 64.1466, "lng": -21.9426, "tier": "frontier", "gen": "Scale", "country": "IS"},
    {"id": 30, "name": "Cairo", "lat": 30.0444, "lng": 31.2357, "tier": "frontier", "gen": "Lex", "country": "EG"},
    {"id": 31, "name": "Nairobi", "lat": -1.2921, "lng": 36.8219, "tier": "frontier", "gen": "Crow", "country": "KE"},
    {"id": 32, "name": "Bogota", "lat": 4.7110, "lng": -74.0721, "tier": "frontier", "gen": "Scribe", "country": "CO"},
    {"id": 33, "name": "Lagos", "lat": 6.5244, "lng": 3.3792, "tier": "frontier", "gen": "Gear", "country": "NG"},
]

_SERVICES = [
    "sovereign-wallet", "sovereign-identity", "sovereign-passport", "care-floor-0.95",
    "bft-council-12", "sigil-ed25519", "33-hive-federation", "dorado-1-click",
    "crown-lineage-1795-2026", "article-50-passport", "fork-doctrine-cc0-mit-osi",
    "pqc-ml-dsa-65", "mamba-2-ssd-16dim", "sovereign-composite-7.305",
]

_HIVE_STATUS = {}  # name -> "online"|"degraded"|"offline"


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "hive-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _haversine_km(lat1, lng1, lat2, lng2):
    """Haversine distance in km."""
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def hive_get(name: str = "", hive_id: int = 0) -> dict:
    """Get a specific hive by name or id."""
    hive = None
    if name:
        hive = next((h for h in HIVES if h["name"].lower() == name.lower()), None)
    elif hive_id:
        hive = next((h for h in HIVES if h["id"] == hive_id), None)
    if not hive:
        return _sign({"error": f"hive not found: name={name} id={hive_id}"})
    status = _HIVE_STATUS.get(hive["name"], "online")
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive": hive,
        "status": status,
        "services": _SERVICES[:5 + (hive["id"] % 10)],
        "sovereign_composite": 7.305,
        "doctrine": f"Hive {hive['name']} ({hive['tier']} tier, {hive['country']}). Lead: {hive['gen']}.",
    })


def hive_list() -> dict:
    """List all 33 hives."""
    by_tier = {}
    for h in HIVES:
        by_tier.setdefault(h["tier"], []).append(h["name"])
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "total": len(HIVES),
        "by_tier": by_tier,
        "hives": HIVES,
        "doctrine": "33 sovereign hive planets orbit the CSOAI sun.",
    })


def hive_status() -> dict:
    """Get online status of all hives."""
    online = sum(1 for h in HIVES if _HIVE_STATUS.get(h["name"], "online") == "online")
    degraded = sum(1 for h in HIVES if _HIVE_STATUS.get(h["name"], "online") == "degraded")
    offline = len(HIVES) - online - degraded
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "online": online,
        "degraded": degraded,
        "offline": offline,
        "total": len(HIVES),
        "status_map": {h["name"]: _HIVE_STATUS.get(h["name"], "online") for h in HIVES},
        "doctrine": f"{online}/{len(HIVES)} hives online.",
    })


def hive_route(from_id: int, to_id: int) -> dict:
    """Route between two hives (distance in km)."""
    h1 = next((h for h in HIVES if h["id"] == from_id), None)
    h2 = next((h for h in HIVES if h["id"] == to_id), None)
    if not h1 or not h2:
        return _sign({"error": f"hive not found: {from_id} or {to_id}"})
    distance = _haversine_km(h1["lat"], h1["lng"], h2["lat"], h2["lng"])
    # Sovereign routing: same general = 0.85 strength, same tier = 0.55
    if h1["gen"] == h2["gen"]:
        strength = 0.85
    elif h1["tier"] == h2["tier"]:
        strength = 0.55
    else:
        strength = 0.35
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "from": h1, "to": h2,
        "distance_km": round(distance, 1),
        "integration_strength": strength,
        "doctrine": f"Sovereign route: {h1['name']} → {h2['name']} ({distance:.0f} km, {strength:.2f} strength).",
    })


def hive_tier(tier: str = "") -> dict:
    """Get all hives in a tier."""
    if tier not in ("inner", "middle", "outer", "frontier"):
        return _sign({"error": f"tier must be inner/middle/outer/frontier, got {tier}"})
    hives = [h for h in HIVES if h["tier"] == tier]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "tier": tier,
        "hives": hives,
        "count": len(hives),
        "doctrine": f"{tier} tier: {len(hives)} sovereign hive planets.",
    })