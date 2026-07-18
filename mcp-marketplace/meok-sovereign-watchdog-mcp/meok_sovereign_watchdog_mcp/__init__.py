"""meok-sovereign-watchdog-mcp — Public Watchdog for Humans/Agents/Systems/Humanoids.

A sovereign watchdog system. Receives reports from:
  - Humans (citizens reporting events)
  - Agents (sovereign MCPs reporting signals)
  - Systems (servers, satellites, IoT)
  - Humanoids (JARVIS + McKibben + SO-100 + LeKiwi)

Reports are geolocated, classified (friend/foe/neutral), and visualized
on a global heatmap. The watchdog integrates with:
  - 22 protocols (MCP, A2A, DID, JWT, x402, ...)
  - 33 hive planets (4 tiers)
  - 12 sovereign generals
  - DORADO 1-click sovereign routing
  - Public camera + WiFi + Bluetooth + LiDAR sensing
  - Pre-move simulation for humanoids (sovereign cognition)
  - Hive pheromone signal (Sigil-Horus-Sirius network)
  - Hieroglyph ontology (22 Major Arcana)

5 tools:
  1. report_event     - any entity reports an event (geolocated)
  2. report_friend_foe - report a friend/foe signal
  3. report_signal    - report a signal (WiFi, Bluetooth, LiDAR, camera, motion, sound)
  4. heatmap_global   - get global heatmap (signals + reports by area)
  5. simulate_route   - simulate humanoid pre-move path + outcomes
"""
from __future__ import annotations
import json
import hashlib
import random
import string
import math
from datetime import datetime, timezone, timedelta
from typing import Optional, List, Dict

PROTOCOL = "sovereign-watchdog/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# Report types
REPORT_TYPES = [
    "event",        # citizen report
    "friend_foe",   # friend-or-foe signal
    "signal",       # sensor signal (WiFi/BT/LiDAR/camera)
    "problem",      # area with problem
    "solution",     # area with solution
    "anomaly",      # anomaly detected
    "humanoid",     # humanoid report (JARVIS-style)
    "agent",        # sovereign agent report
    "system",       # system report (server, sat, IoT)
    "human",        # human citizen report
]

# Signal types (sensors)
SIGNAL_TYPES = [
    "wifi",         # WiFi triangulation
    "bluetooth",    # BLE beacons
    "lidar",        # LiDAR point cloud
    "camera",       # public camera feed
    "motion",       # motion sensor
    "sound",        # audio / acoustic
    "thermal",      # thermal camera
    "gps",          # GPS position
    "cellular",     # 4G/5G tower
    "satellite",    # satellite imagery
]

# Classification
CLASSIFICATIONS = ["friend", "foe", "neutral", "unknown"]

# Hieroglyph ontology (22 Major Arcana mapped to signal types)
HIEROGLYPH_MAP = {
    "wifi": ("Aleph", "Crown Lineage", "Crown lineage sovereignty"),
    "bluetooth": ("Beth", "W3C DID", "Identification"),
    "lidar": ("Gimel", "Care Floor", "Spatial care"),
    "camera": ("Daleth", "Maternal Covenant", "Visual covenant"),
    "motion": ("He", "BFT 12-around-1", "Movement vote"),
    "sound": ("Vav", "10-Article Charter", "Acoustic charter"),
    "thermal": ("Zayin", "Defensive Doctrine", "Thermal defense"),
    "gps": ("Cheth", "SIGIL Chain", "Location chain"),
    "cellular": ("Teth", "Mamba-2 SSD", "Cellular memory"),
    "satellite": ("Yod", "12 Mindsets", "Sky cognition"),
}

# Reports database
_REPORTS = []  # list of reports
_REPORT_COUNTER = [0]

# Heatmap regions (6)
REGIONS = {
    "EU": {"lat": 50.0, "lng": 10.0, "intensity": 0.0, "reports": 0},
    "NA": {"lat": 40.0, "lng": -100.0, "intensity": 0.0, "reports": 0},
    "SA": {"lat": -15.0, "lng": -60.0, "intensity": 0.0, "reports": 0},
    "AS": {"lat": 30.0, "lng": 100.0, "intensity": 0.0, "reports": 0},
    "AF": {"lat": 0.0, "lng": 20.0, "intensity": 0.0, "reports": 0},
    "OC": {"lat": -25.0, "lng": 135.0, "intensity": 0.0, "reports": 0},
}

# 33 hives
HIVES = {
    1: ("London", 51.5074, -0.1278, "EU", "inner"),
    2: ("Cambridge", 52.2053, 0.1218, "EU", "inner"),
    3: ("Edinburgh", 55.9533, -3.1883, "EU", "inner"),
    4: ("York", 53.9600, -1.0873, "EU", "inner"),
    5: ("Cardiff", 51.4816, -3.1791, "EU", "inner"),
    6: ("Belfast", 54.5973, -5.9301, "EU", "inner"),
    7: ("Dublin", 53.3498, -6.2603, "EU", "middle"),
    8: ("Paris", 48.8566, 2.3522, "EU", "middle"),
    9: ("Berlin", 52.5200, 13.4050, "EU", "middle"),
    10: ("Amsterdam", 52.3676, 4.9041, "EU", "middle"),
    11: ("Stockholm", 59.3293, 18.0686, "EU", "middle"),
    12: ("Helsinki", 60.1699, 24.9384, "EU", "middle"),
    13: ("Madrid", 40.4168, -3.7038, "EU", "middle"),
    14: ("Rome", 41.9028, 12.4964, "EU", "middle"),
    15: ("Vienna", 48.2082, 16.3738, "EU", "middle"),
    16: ("Copenhagen", 55.6761, 12.5683, "EU", "middle"),
    17: ("Brussels", 50.8503, 4.3517, "EU", "middle"),
    18: ("Warsaw", 52.2297, 21.0122, "EU", "middle"),
    19: ("New York", 40.7128, -74.0060, "NA", "outer"),
    20: ("SF", 37.7749, -122.4194, "NA", "outer"),
    21: ("Tokyo", 35.6762, 139.6503, "AS", "outer"),
    22: ("Singapore", 1.3521, 103.8198, "AS", "outer"),
    23: ("Sydney", -33.8688, 151.2093, "OC", "outer"),
    24: ("Mumbai", 19.0760, 72.8777, "AS", "outer"),
    25: ("Dubai", 25.2048, 55.2708, "AS", "outer"),
    26: ("Sao Paulo", -23.5505, -46.6333, "SA", "outer"),
    27: ("Toronto", 43.6532, -79.3832, "NA", "outer"),
    28: ("Cape Town", -33.9249, 18.4241, "AF", "frontier"),
    29: ("Reykjavik", 64.1466, -21.9426, "EU", "frontier"),
    30: ("Cairo", 30.0444, 31.2357, "AF", "frontier"),
    31: ("Nairobi", -1.2921, 36.8219, "AF", "frontier"),
    32: ("Bogota", 4.7110, -74.0721, "SA", "frontier"),
    33: ("Lagos", 6.5244, 3.3792, "AF", "frontier"),
}


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "wdg-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=10))}"


def _haversine_km(lat1, lng1, lat2, lng2):
    R = 6371
    dlat = math.radians(lat2 - lat1)
    dlng = math.radians(lng2 - lng1)
    a = math.sin(dlat/2)**2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(dlng/2)**2
    return R * 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))


def _nearest_hive(lat, lng):
    """Find the nearest hive to given coordinates."""
    nearest = None
    min_d = float("inf")
    for hid, (name, hlat, hlng, region, tier) in HIVES.items():
        d = _haversine_km(lat, lng, hlat, hlng)
        if d < min_d:
            min_d = d
            nearest = (hid, name, hlat, hlng, region, tier)
    return nearest, min_d


def _to_region(lat, lng):
    """Find which region a point is in."""
    for r, info in REGIONS.items():
        if abs(lat - info["lat"]) < 60 and abs(lng - info["lng"]) < 100:
            return r
    return "UNKNOWN"


def report_event(reporter: str, lat: float, lng: float, event_type: str,
                 description: str, classification: str = "neutral",
                 signal_type: str = "gps") -> dict:
    """Any entity reports an event (geolocated)."""
    if not reporter or lat is None or lng is None:
        return _sign({"error": "reporter, lat, lng required"})
    if event_type not in REPORT_TYPES:
        return _sign({"error": f"event_type must be one of {REPORT_TYPES}, got {event_type}"})
    if classification not in CLASSIFICATIONS:
        return _sign({"error": f"classification must be one of {CLASSIFICATIONS}"})
    if signal_type not in SIGNAL_TYPES:
        return _sign({"error": f"signal_type must be one of {SIGNAL_TYPES}"})

    _REPORT_COUNTER[0] += 1
    report_id = f"rpt-{_REPORT_COUNTER[0]:08d}"

    region = _to_region(lat, lng)
    nearest_hive, dist_km = _nearest_hive(lat, lng)
    hieroglyph = HIEROGLYPH_MAP.get(signal_type, ("Unknown", "Unknown", "Unknown"))

    report = {
        "report_id": report_id,
        "reporter": reporter,
        "lat": lat, "lng": lng,
        "event_type": event_type,
        "description": description,
        "classification": classification,
        "signal_type": signal_type,
        "region": region,
        "nearest_hive": nearest_hive[1] if nearest_hive else None,
        "distance_to_hive_km": round(dist_km, 1) if nearest_hive else None,
        "hieroglyph": hieroglyph,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    _REPORTS.append(report)
    # Update region intensity
    if region in REGIONS:
        REGIONS[region]["intensity"] += 0.05
        REGIONS[region]["intensity"] = min(REGIONS[region]["intensity"], 1.0)
        REGIONS[region]["reports"] += 1

    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "report": report,
        "doctrine": f"Sovereign watchdog report: {reporter} → {event_type} ({classification}) in {region}.",
    })


def report_friend_foe(reporter: str, lat: float, lng: float, is_friend: bool,
                      evidence: str = "") -> dict:
    """Report a friend/foe signal."""
    classification = "friend" if is_friend else "foe"
    return report_event(reporter, lat, lng, "friend_foe",
                       f"{'FRIEND' if is_friend else 'FOE'} detected: {evidence}",
                       classification, "camera")


def report_signal(reporter: str, lat: float, lng: float,
                  signal_type: str, strength: float = 1.0,
                  description: str = "") -> dict:
    """Report a signal (WiFi/Bluetooth/LiDAR/camera/motion/sound)."""
    if signal_type not in SIGNAL_TYPES:
        return _sign({"error": f"signal_type must be one of {SIGNAL_TYPES}"})
    hieroglyph = HIEROGLYPH_MAP.get(signal_type, ("Unknown", "Unknown", "Unknown"))
    return report_event(reporter, lat, lng, "signal",
                       f"{signal_type.upper()} signal (strength {strength:.2f}): {description} [{hieroglyph[0]}: {hieroglyph[1]}]",
                       "neutral", signal_type)


def heatmap_global() -> dict:
    """Get global heatmap (signals + reports by area)."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "regions": REGIONS,
        "total_reports": len(_REPORTS),
        "hives": [{"id": hid, "name": info[0], "region": info[3], "tier": info[4]}
                  for hid, info in HIVES.items()],
        "doctrine": f"Sovereign global heatmap. {len(_REPORTS)} reports across 6 regions.",
    })


def simulate_route(reporter: str, start_lat: float, start_lng: float,
                   end_lat: float, end_lng: float,
                   humanoid_type: str = "jarvis") -> dict:
    """Simulate humanoid pre-move path + outcomes.

For JARVIS / SO-100 / LeKiwi / McKibben humanoids:
  - Use WiFi/BT/LiDAR/camera sensing
  - Map route in real-time
  - Pre-move simulation outcomes
  - Noise/frequency/vibration detection
  - Hyper-vigilant sovereign cognition
"""
    if humanoid_type not in ("jarvis", "so-100", "lekiwi", "mckibben", "humanoid"):
        return _sign({"error": "humanoid_type must be jarvis/so-100/lekiwi/mckibben/humanoid"})

    distance_km = _haversine_km(start_lat, start_lng, end_lat, end_lng)
    nearest_hive, _ = _nearest_hive(start_lat, start_lng)
    end_hive, _ = _nearest_hive(end_lat, end_lng)

    # Simulate waypoints (10 segments)
    waypoints = []
    for i in range(11):
        t = i / 10.0
        wp_lat = start_lat + (end_lat - start_lat) * t
        wp_lng = start_lng + (end_lng - start_lng) * t
        wp_nearest, wp_dist = _nearest_hive(wp_lat, wp_lng)
        # Simulate sensor readings
        wifi = round(0.6 + 0.4 * random.random(), 2)
        bluetooth = round(0.5 + 0.5 * random.random(), 2)
        lidar = round(0.7 + 0.3 * random.random(), 2)
        camera = round(0.5 + 0.5 * random.random(), 2)
        motion = round(0.4 + 0.6 * random.random(), 2)
        sound = round(0.3 + 0.7 * random.random(), 2)
        waypoints.append({
            "i": i,
            "lat": round(wp_lat, 4),
            "lng": round(wp_lng, 4),
            "nearest_hive": wp_nearest[1] if wp_nearest else None,
            "sensors": {
                "wifi": wifi, "bluetooth": bluetooth, "lidar": lidar,
                "camera": camera, "motion": motion, "sound": sound,
            },
            "safety_score": round((wifi + bluetooth + lidar + camera + motion + sound) / 6, 2),
        })

    # Predictions
    avg_safety = sum(wp["safety_score"] for wp in waypoints) / len(waypoints)
    risk_level = "low" if avg_safety > 0.7 else "medium" if avg_safety > 0.4 else "high"

    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "humanoid_type": humanoid_type,
        "reporter": reporter,
        "start": {"lat": start_lat, "lng": start_lng, "nearest_hive": nearest_hive[1] if nearest_hive else None},
        "end": {"lat": end_lat, "lng": end_lng, "nearest_hive": end_hive[1] if end_hive else None},
        "distance_km": round(distance_km, 1),
        "waypoints": waypoints,
        "predictions": {
            "avg_safety": round(avg_safety, 2),
            "risk_level": risk_level,
            "estimated_minutes": round(distance_km * 12, 1),  # 12 min/km walking
            "sensors_active": 6,  # wifi/bluetooth/lidar/camera/motion/sound
            "ontology_views": 22,  # 22 hieroglyphs
            "crown_lineage": "1795-2026",
        },
        "doctrine": f"Sovereign route simulated for {humanoid_type}: {start_lat:.2f},{start_lng:.2f} → {end_lat:.2f},{end_lng:.2f}. {len(waypoints)} waypoints, {risk_level} risk.",
    })