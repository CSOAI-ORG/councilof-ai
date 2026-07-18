"""meok-sovereign-sphere-mcp — Cesium 3D globe renderer.

5 tools:
  1. render_globe      - render a Cesium globe with all 33 hives
  2. add_marker        - add a marker (lat/lng/label)
  3. fly_to            - fly camera to a position
  4. load_hive_data    - load hive network data
  5. get_camera_state  - get current camera position
"""
from __future__ import annotations
import json
import math
import hashlib
from datetime import datetime, timezone
from typing import Optional, List, Dict

PROTOCOL = "sovereign-sphere/1.0"
VERSION = "1.0.0"

HIVES = [
    {"id": i+1, "name": name, "lat": lat, "lng": lng, "country": country}
    for i, (name, lat, lng, country) in enumerate([
        ("London", 51.5074, -0.1278, "UK"), ("Cambridge", 52.2053, 0.1218, "UK"),
        ("Edinburgh", 55.9533, -3.1883, "UK"), ("Dublin", 53.3498, -6.2603, "IE"),
        ("Paris", 48.8566, 2.3522, "FR"), ("Berlin", 52.5200, 13.4050, "DE"),
        ("Amsterdam", 52.3676, 4.9041, "NL"), ("Stockholm", 59.3293, 18.0686, "SE"),
        ("Helsinki", 60.1699, 24.9384, "FI"), ("Madrid", 40.4168, -3.7038, "ES"),
        ("Rome", 41.9028, 12.4964, "IT"), ("Vienna", 48.2082, 16.3738, "AT"),
        ("NYC", 40.7128, -74.0060, "US"), ("SF", 37.7749, -122.4194, "US"),
        ("Toronto", 43.6532, -79.3832, "CA"), ("Mexico City", 19.4326, -99.1332, "MX"),
        ("Bogota", 4.7110, -74.0721, "CO"), ("Lima", -12.0464, -77.0428, "PE"),
        ("Santiago", -33.4489, -70.6693, "CL"), ("Buenos Aires", -34.6037, -58.3816, "AR"),
        ("Tokyo", 35.6762, 139.6503, "JP"), ("Singapore", 1.3521, 103.8198, "SG"),
        ("Sydney", -33.8688, 151.2093, "AU"), ("Mumbai", 19.0760, 72.8777, "IN"),
        ("Dubai", 25.2048, 55.2708, "AE"), ("Hong Kong", 22.3193, 114.1694, "HK"),
        ("Seoul", 37.5665, 126.9780, "KR"), ("Jakarta", -6.2088, 106.8456, "ID"),
        ("Cape Town", -33.9249, 18.4241, "ZA"), ("Nairobi", -1.2921, 36.8219, "KE"),
        ("Cairo", 30.0444, 31.2357, "EG"), ("Lagos", 6.5244, 3.3792, "NG"),
        ("Reykjavik", 64.1466, -21.9426, "IS"),
    ])
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "sphere-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def render_globe(hive_ids: Optional[List[int]] = None) -> dict:
    """Render a Cesium globe with all 33 hives."""
    selected = [h for h in HIVES if hive_ids is None or h["id"] in hive_ids]
    # Compute great-circle distance between London and NYC for example
    if len(selected) >= 2:
        a, b = selected[0], selected[1]
        great_circle_km = int(6371 * math.acos(
            math.sin(math.radians(a["lat"])) * math.sin(math.radians(b["lat"])) +
            math.cos(math.radians(a["lat"])) * math.cos(math.radians(b["lat"])) *
            math.cos(math.radians(a["lng"] - b["lng"]))
        ))
    else:
        great_circle_km = 0
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "engine": "Cesium 1.118",
        "globe_center": {"lat": 20, "lng": 0, "height_km": 20000},
        "hives": selected, "count": len(selected),
        "example_great_circle_km": great_circle_km,
        "doctrine": "Cesium 3D globe. 33 hives. Sovereign by construction.",
    })


def add_marker(lat: float, lng: float, label: str, hive_id: Optional[int] = None) -> dict:
    """Add a marker to the globe."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "marker_id": hashlib.sha256(f"{lat}|{lng}|{label}|{datetime.now(timezone.utc).isoformat()}".encode()).hexdigest()[:12],
        "lat": lat, "lng": lng, "label": label,
        "hive_id": hive_id,
        "color": "#fbbf24",
        "added_at": datetime.now(timezone.utc).isoformat(),
    })


def fly_to(lat: float, lng: float, height_km: float = 1000.0) -> dict:
    """Fly camera to a position."""
    if height_km < 0 or height_km > 50000:
        return _sign({"error": "height_km must be 0-50000"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "camera": {"lat": lat, "lng": lng, "height_km": height_km},
        "duration_s": 2.5, "easing": "easeInOutQuad",
        "doctrine": "Fly to any point on the 3D globe.",
    })


def load_hive_data(hive_id: int) -> dict:
    """Load data for a specific hive."""
    hive = next((h for h in HIVES if h["id"] == hive_id), None)
    if not hive:
        return _sign({"error": f"unknown hive: {hive_id} (must be 1-33)"})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "hive": hive,
        "industries": ["Finance", "Defence", "Healthcare", "AI"],
        "courses": 10, "cert_tiers": 4,
        "doctrine": f"33rd hive sovereign substrate for {hive['name']}.",
    })


def get_camera_state() -> dict:
    """Get current camera state."""
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "camera": {"lat": 20.0, "lng": 0.0, "height_km": 20000.0},
        "pitch": -1.57, "heading": 0.0,
        "fov": 0.785,
        "doctrine": "Sovereign globe camera state.",
    })
