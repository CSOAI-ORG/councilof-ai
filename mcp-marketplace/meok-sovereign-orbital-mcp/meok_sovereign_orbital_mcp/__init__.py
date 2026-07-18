"""meok-sovereign-orbital-mcp — 33-hive orbital mechanics.

The 33 hives are PLANETS orbiting the CSOAI sun.
Each hive has rotation, revolution, axis tilt, period, gravitational pull.

5 tools:
  1. hive_position     - get current 3D position of a hive
  2. hive_orbital      - get orbital params (period, distance, eccentricity)
  3. hive_resonance    - compute resonance between 2 hives
  4. sovereign_align   - alignment of all 33 hives to CSOAI sun
  5. solar_system      - the full 33-planet solar system snapshot
"""
from __future__ import annotations
import json
import math
import hashlib
from datetime import datetime, timezone
from typing import Optional

PROTOCOL = "sovereign-orbital/1.0"
VERSION = "1.0.0"

# The 33 hives with orbital parameters
# Distance = AU from CSOAI sun, Period = years, Tilt = axis tilt degrees
# Color = visual color, General = lead General
HIVES = [
    # Tier 1: Inner 6 (closest to CSOAI sun, like Mercury/Venus/Earth/Mars)
    {"id": 1, "name": "London",   "tier": 1, "distance_au": 0.39, "period_yr": 0.24, "tilt_deg": 0.03, "radius_au": 0.02, "color": "#60a5fa", "general": "Argus",   "industry": "Finance"},
    {"id": 2, "name": "Cambridge","tier": 1, "distance_au": 0.72, "period_yr": 0.62, "tilt_deg": 2.6,  "radius_au": 0.03, "color": "#8b5cf6", "general": "Owl",     "industry": "Academia"},
    {"id": 3, "name": "Edinburgh","tier": 1, "distance_au": 1.00, "period_yr": 1.00, "tilt_deg": 23.4, "radius_au": 0.04, "color": "#10b981", "general": "Shield",  "industry": "Defence"},
    {"id": 4, "name": "York",     "tier": 1, "distance_au": 1.52, "period_yr": 1.88, "tilt_deg": 25.2, "radius_au": 0.05, "color": "#f59e0b", "general": "Crow",    "industry": "Heritage"},
    {"id": 5, "name": "Cardiff",  "tier": 1, "distance_au": 2.50, "period_yr": 4.20, "tilt_deg": 3.1,  "radius_au": 0.06, "color": "#ef4444", "general": "Voice",   "industry": "Media"},
    {"id": 6, "name": "Belfast",  "tier": 1, "distance_au": 3.00, "period_yr": 7.30, "tilt_deg": 26.7, "radius_au": 0.07, "color": "#06b6d4", "general": "Scale",   "industry": "Peace"},
    # Tier 2: Middle 12 (Jupiter/Saturn zone)
    {"id": 7, "name": "Dublin",    "tier": 2, "distance_au": 5.20, "period_yr": 11.86, "tilt_deg": 3.1,  "radius_au": 0.08, "color": "#a3e635", "general": "Lex",     "industry": "Legal"},
    {"id": 8, "name": "Paris",     "tier": 2, "distance_au": 6.50, "period_yr": 16.20, "tilt_deg": 26.7, "radius_au": 0.09, "color": "#60a5fa", "general": "Owl",     "industry": "Research"},
    {"id": 9, "name": "Berlin",    "tier": 2, "distance_au": 7.80, "period_yr": 20.50, "tilt_deg": 27.0, "radius_au": 0.10, "color": "#10b981", "general": "Shield",  "industry": "Engineering"},
    {"id": 10,"name": "Amsterdam", "tier": 2, "distance_au": 9.00, "period_yr": 28.00, "tilt_deg": 3.1,  "radius_au": 0.11, "color": "#f59e0b", "general": "Abacus",  "industry": "Fintech"},
    {"id": 11,"name": "Stockholm", "tier": 2, "distance_au": 10.5, "period_yr": 35.00, "tilt_deg": 26.7, "radius_au": 0.12, "color": "#06b6d4", "general": "Scale",   "industry": "Sustainability"},
    {"id": 12,"name": "Helsinki",  "tier": 2, "distance_au": 12.0, "period_yr": 42.00, "tilt_deg": 26.7, "radius_au": 0.13, "color": "#84cc16", "general": "Owl",     "industry": "Climate"},
    {"id": 13,"name": "Madrid",    "tier": 2, "distance_au": 13.5, "period_yr": 50.00, "tilt_deg": 26.7, "radius_au": 0.14, "color": "#fbbf24", "general": "Voice",   "industry": "Hospitality"},
    {"id": 14,"name": "Rome",      "tier": 2, "distance_au": 15.0, "period_yr": 60.00, "tilt_deg": 26.7, "radius_au": 0.15, "color": "#ec4899", "general": "Gear",    "industry": "Heritage"},
    {"id": 15,"name": "Vienna",    "tier": 2, "distance_au": 16.5, "period_yr": 75.00, "tilt_deg": 26.7, "radius_au": 0.16, "color": "#8b5cf6", "general": "Voice",   "industry": "Music"},
    {"id": 16,"name": "Copenhagen","tier": 2, "distance_au": 18.0, "period_yr": 90.00, "tilt_deg": 26.7, "radius_au": 0.17, "color": "#14b8a6", "general": "Scale",   "industry": "Green"},
    {"id": 17,"name": "Brussels",  "tier": 2, "distance_au": 20.0, "period_yr": 110.0, "tilt_deg": 26.7, "radius_au": 0.18, "color": "#ef4444", "general": "Lex",     "industry": "EU Legal"},
    {"id": 18,"name": "Warsaw",    "tier": 2, "distance_au": 22.0, "period_yr": 130.0, "tilt_deg": 26.7, "radius_au": 0.19, "color": "#a3e635", "general": "Shield",  "industry": "Defence"},
    # Tier 3: Outer 9 (Uranus/Neptune zone)
    {"id": 19,"name": "New York",  "tier": 3, "distance_au": 25.0, "period_yr": 160.0, "tilt_deg": 28.3, "radius_au": 0.20, "color": "#fbbf24", "general": "Scribe",  "industry": "Finance"},
    {"id": 20,"name": "SF",        "tier": 3, "distance_au": 28.0, "period_yr": 200.0, "tilt_deg": 28.3, "radius_au": 0.21, "color": "#84cc16", "general": "Builder", "industry": "Tech"},
    {"id": 21,"name": "Tokyo",     "tier": 3, "distance_au": 32.0, "period_yr": 250.0, "tilt_deg": 28.3, "radius_au": 0.22, "color": "#8b5cf6", "general": "Builder", "industry": "Robotics"},
    {"id": 22,"name": "Singapore", "tier": 3, "distance_au": 36.0, "period_yr": 300.0, "tilt_deg": 3.1,  "radius_au": 0.23, "color": "#f59e0b", "general": "Abacus",  "industry": "Fintech"},
    {"id": 23,"name": "Sydney",    "tier": 3, "distance_au": 40.0, "period_yr": 350.0, "tilt_deg": 23.4, "radius_au": 0.24, "color": "#ec4899", "general": "Gear",    "industry": "Mining"},
    {"id": 24,"name": "Mumbai",    "tier": 3, "distance_au": 45.0, "period_yr": 400.0, "tilt_deg": 26.7, "radius_au": 0.25, "color": "#a3e635", "general": "Crow",    "industry": "Risk Ops"},
    {"id": 25,"name": "Dubai",     "tier": 3, "distance_au": 50.0, "period_yr": 450.0, "tilt_deg": 26.7, "radius_au": 0.26, "color": "#fbbf24", "general": "Gear",    "industry": "Logistics"},
    {"id": 26,"name": "Sao Paulo", "tier": 3, "distance_au": 55.0, "period_yr": 500.0, "tilt_deg": 26.7, "radius_au": 0.27, "color": "#a3e635", "general": "Crow",    "industry": "Agriculture"},
    {"id": 27,"name": "Toronto",   "tier": 3, "distance_au": 60.0, "period_yr": 600.0, "tilt_deg": 26.7, "radius_au": 0.28, "color": "#06b6d4", "general": "Scribe",  "industry": "AI Act"},
    # Tier 4: Frontier 6 (deep space)
    {"id": 28,"name": "Cape Town", "tier": 4, "distance_au": 70.0, "period_yr": 700.0, "tilt_deg": 26.7, "radius_au": 0.30, "color": "#a3e635", "general": "Crow",    "industry": "Mining"},
    {"id": 29,"name": "Reykjavik", "tier": 4, "distance_au": 80.0, "period_yr": 800.0, "tilt_deg": 26.7, "radius_au": 0.32, "color": "#06b6d4", "general": "Scale",   "industry": "Geothermal"},
    {"id": 30,"name": "Cairo",     "tier": 4, "distance_au": 90.0, "period_yr": 900.0, "tilt_deg": 26.7, "radius_au": 0.34, "color": "#f59e0b", "general": "Scribe",  "industry": "Heritage"},
    {"id": 31,"name": "Nairobi",   "tier": 4, "distance_au": 100.0,"period_yr": 1000.0,"tilt_deg": 26.7, "radius_au": 0.36, "color": "#10b981", "general": "Abacus",  "industry": "Fintech"},
    {"id": 32,"name": "Bogota",    "tier": 4, "distance_au": 110.0,"period_yr": 1100.0,"tilt_deg": 26.7, "radius_au": 0.38, "color": "#a3e635", "general": "Scale",   "industry": "Coffee"},
    {"id": 33,"name": "Lagos",     "tier": 4, "distance_au": 120.0,"period_yr": 1200.0,"tilt_deg": 26.7, "radius_au": 0.40, "color": "#fbbf24", "general": "Abacus",  "industry": "Fintech"},
]


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "orb-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _hive_by_id(hive_id: int) -> Optional[dict]:
    for h in HIVES:
        if h["id"] == hive_id:
            return h
    return None


def _hive_by_name(name: str) -> Optional[dict]:
    for h in HIVES:
        if h["name"].lower() == name.lower():
            return h
    return None


def hive_position(hive_id: int, t_yr: float = 0.0) -> dict:
    """Get the 3D position of a hive at time t (years from now)."""
    h = _hive_by_id(hive_id)
    if not h:
        return _sign({"error": f"unknown hive: {hive_id}"})
    # Position: r(θ) = a / (1 + e cos θ), simplified: x = a cos θ, z = a sin θ
    # With tilt: y = a sin(θ) sin(tilt)
    theta = 2 * math.pi * t_yr / h["period_yr"]
    x = h["distance_au"] * math.cos(theta)
    z = h["distance_au"] * math.sin(theta)
    y = h["distance_au"] * math.sin(theta) * math.sin(math.radians(h["tilt_deg"]))
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive_id": hive_id, "hive_name": h["name"],
        "t_yr": t_yr, "position_au": [round(x, 3), round(y, 3), round(z, 3)],
        "doctrine": f"Hive {h['name']} orbits CSOAI sun at {h['distance_au']} AU. Period: {h['period_yr']}y.",
    })


def hive_orbital(hive_id: int) -> dict:
    """Get orbital params of a hive."""
    h = _hive_by_id(hive_id)
    if not h:
        return _sign({"error": f"unknown hive: {hive_id}"})
    # Kepler's 3rd law simplified: T² = a³ (in solar units, period in years)
    period_kepler = math.sqrt(h["distance_au"] ** 3)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive_id": hive_id, "hive_name": h["name"],
        "tier": h["tier"], "industry": h["industry"], "general": h["general"],
        "distance_au": h["distance_au"], "period_yr": h["period_yr"],
        "tilt_deg": h["tilt_deg"], "radius_au": h["radius_au"], "color": h["color"],
        "kepler_check_period_yr": round(period_kepler, 2),
        "speed_au_per_yr": round(2 * math.pi * h["distance_au"] / h["period_yr"], 3),
        "doctrine": f"{h['name']} orbits the CSOAI sun (UK 16939677) at {h['distance_au']} AU.",
    })


def hive_resonance(hive_id_a: int, hive_id_b: int) -> dict:
    """Compute the gravitational resonance between 2 hives."""
    a = _hive_by_id(hive_id_a)
    b = _hive_by_id(hive_id_b)
    if not a or not b:
        return _sign({"error": "unknown hive"})
    ratio = a["period_yr"] / b["period_yr"]
    # Find nearest simple fraction
    simplest = None
    for p in range(1, 12):
        for q in range(1, 12):
            if abs(ratio - p/q) < 0.05:
                simplest = f"{p}:{q}"
                break
        if simplest:
            break
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive_a": a["name"], "hive_b": b["name"],
        "period_ratio": round(ratio, 3),
        "resonance": simplest or "complex (non-resonant)",
        "doctrine": f"{a['name']}:{b['name']} orbital resonance = {simplest or 'complex'}.",
    })


def sovereign_align(t_yr: float = 0.0) -> dict:
    """Get alignment of all 33 hives to CSOAI sun."""
    positions = []
    for h in HIVES:
        theta = 2 * math.pi * t_yr / h["period_yr"]
        x = h["distance_au"] * math.cos(theta)
        z = h["distance_au"] * math.sin(theta)
        positions.append({
            "hive_id": h["id"], "hive_name": h["name"],
            "tier": h["tier"], "distance_au": h["distance_au"],
            "theta_rad": round(theta, 3), "x_au": round(x, 3), "z_au": round(z, 3),
        })
    # Compute centroid (gravitational center)
    cx = sum(p["x_au"] for p in positions) / len(positions)
    cz = sum(p["z_au"] for p in positions) / len(positions)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "sun": "CSOAI (UK 16939677)",
        "t_yr": t_yr, "hive_count": len(positions),
        "centroid_au": [round(cx, 3), 0, round(cz, 3)],
        "hives": positions,
        "doctrine": f"All 33 hives orbit CSOAI sun. Centroid at ({round(cx,2)}, 0, {round(cz,2)}) AU. Sovereign by construction.",
    })


def solar_system(t_yr: float = 0.0) -> dict:
    """The full 33-planet solar system snapshot."""
    system = {
        "sun": {
            "name": "CSOAI", "kind": "G2V sovereign main-sequence",
            "spectral": "Ed25519-Sovereign", "mass_kg": 7.305e30,
            "composite": 7.305, "crown_lineage": "1795-2026",
            "license": "MIT + CC0", "fid": "did:csoai:csoai-org-001",
        },
        "inner_tier": [],
        "middle_tier": [],
        "outer_tier": [],
        "frontier_tier": [],
    }
    for h in HIVES:
        theta = 2 * math.pi * t_yr / h["period_yr"]
        x = h["distance_au"] * math.cos(theta)
        z = h["distance_au"] * math.sin(theta)
        planet = {
            **h, "theta_rad": round(theta, 3),
            "x_au": round(x, 3), "z_au": round(z, 3),
        }
        if h["tier"] == 1:
            system["inner_tier"].append(planet)
        elif h["tier"] == 2:
            system["middle_tier"].append(planet)
        elif h["tier"] == 3:
            system["outer_tier"].append(planet)
        else:
            system["frontier_tier"].append(planet)
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "system": system,
        "hive_count": len(HIVES),
        "doctrine": "33 hives orbit CSOAI sun. Inner (6) + Middle (12) + Outer (9) + Frontier (6). Sovereign by construction.",
    })
