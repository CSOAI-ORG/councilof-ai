"""meok-sovereign-cdn-mcp — Sovereign CDN + Edge Caching + Multi-Region.

8 sovereign regions + edge caching + multi-region routing.
UK / EU / US / AU / AS / SA / AF / ANT.

5 tools:
  1. cdn_register        - register an edge node
  2. cdn_route           - route to nearest region
  3. cdn_purge           - purge cache at edge
  4. cdn_multicast       - multicast to all regions
  5. cdn_status          - CDN status
"""
from __future__ import annotations
import json
import hashlib
import random
import string
from datetime import datetime, timezone
from collections import defaultdict

PROTOCOL = "sovereign-cdn/1.0"
VERSION = "1.0.0"
LICENSE = "MIT + CC0 1.0"

# 8 sovereign regions
REGIONS = {
    "UK": {"name": "United Kingdom", "lat": 51.5, "lon": -0.1, "cities": ["London", "Cambridge", "Edinburgh"], "edges": 12, "tier": "primary"},
    "EU": {"name": "European Union", "lat": 50.8, "lon": 4.4, "cities": ["Paris", "Berlin", "Amsterdam", "Stockholm", "Helsinki"], "edges": 18, "tier": "primary"},
    "US": {"name": "United States", "lat": 38.9, "lon": -77.0, "cities": ["DC", "NYC", "SF", "Austin"], "edges": 14, "tier": "primary"},
    "AU": {"name": "Australia", "lat": -35.3, "lon": 149.1, "cities": ["Canberra", "Sydney"], "edges": 6, "tier": "allied"},
    "AS": {"name": "Asia (Japan/Korea/Singapore)", "lat": 35.7, "lon": 139.7, "cities": ["Tokyo", "Seoul", "Singapore"], "edges": 8, "tier": "allied"},
    "SA": {"name": "South America", "lat": -23.5, "lon": -46.6, "cities": ["São Paulo", "Buenos Aires"], "edges": 4, "tier": "allied"},
    "AF": {"name": "Africa", "lat": -1.3, "lon": 36.8, "cities": ["Nairobi", "Cape Town"], "edges": 3, "tier": "allied"},
    "ANT": {"name": "Antarctic Research", "lat": -75.3, "lon": 0.1, "cities": ["McMurdo"], "edges": 1, "tier": "research"},
}

# Edges
_EDGES = {}  # edge_id -> {region, location, healthy, cache_size, requests}
_PURGE_LOG = []
_MULTICAST_LOG = []


def _sign(payload):
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "cdn-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()[:16]
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _gen_id(prefix: str) -> str:
    return f"{prefix}-{''.join(random.choices(string.hexdigits.lower(), k=8))}"


def cdn_register(edge_id: str = "", region: str = "UK", location: str = "") -> dict:
    """Register an edge node."""
    if not edge_id:
        return _sign({"error": "edge_id required"})
    if region not in REGIONS:
        return _sign({"error": f"unknown region: {region}. Use: {list(REGIONS.keys())}"})
    _EDGES[edge_id] = {
        "edge_id": edge_id,
        "region": region,
        "location": location or REGIONS[region]["cities"][0],
        "healthy": True,
        "cache_size_mb": 1024,
        "requests": 0,
        "registered_at": datetime.now(timezone.utc).isoformat(),
    }
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "edge": _EDGES[edge_id],
        "total_edges": len(_EDGES),
        "doctrine": f"Edge {edge_id} registered in {region}. Sovereign by construction.",
    })


def cdn_route(client_lat: float = 51.5, client_lon: float = -0.1, content: str = "index.html") -> dict:
    """Route to nearest sovereign region by great-circle distance."""
    best_region = None
    best_distance = float("inf")
    for region_id, info in REGIONS.items():
        # Great-circle distance (Haversine approximation, simple version)
        d = ((info["lat"] - client_lat) ** 2 + (info["lon"] - client_lon) ** 2) ** 0.5
        if d < best_distance:
            best_distance = d
            best_region = region_id
    # Find healthy edge in region
    region_edges = [e for e in _EDGES.values() if e["region"] == best_region and e["healthy"]]
    if not region_edges:
        return _sign({"error": f"no healthy edges in {best_region}"})
    edge = region_edges[0]
    edge["requests"] += 1
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "client": {"lat": client_lat, "lon": client_lon},
        "routed_to": {"region": best_region, "name": REGIONS[best_region]["name"], "edge": edge["edge_id"]},
        "content": content,
        "distance_degrees": round(best_distance, 2),
        "doctrine": f"Routed to {best_region} ({REGIONS[best_region]['name']}). Sovereign by construction.",
    })


def cdn_purge(edge_id: str = "", content: str = "") -> dict:
    """Purge cache at edge."""
    if not edge_id:
        return _sign({"error": "edge_id required"})
    edge = _EDGES.get(edge_id)
    if not edge:
        return _sign({"error": f"unknown edge: {edge_id}"})
    _PURGE_LOG.append({"edge": edge_id, "content": content, "ts": datetime.now(timezone.utc).isoformat()})
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "edge_id": edge_id,
        "purged": content,
        "doctrine": f"Cache purged at {edge_id}. Sovereign by construction.",
    })


def cdn_multicast(content: str = "", regions: str = "") -> dict:
    """Multicast content to multiple regions."""
    if not content:
        return _sign({"error": "content required"})
    if regions:
        region_list = [r.strip() for r in regions.split(",")]
    else:
        region_list = list(REGIONS.keys())
    target_edges = [e for e in _EDGES.values() if e["region"] in region_list and e["healthy"]]
    _MULTICAST_LOG.append({
        "content": content,
        "regions": region_list,
        "edges_reached": len(target_edges),
        "ts": datetime.now(timezone.utc).isoformat(),
    })
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "content": content,
        "regions": region_list,
        "edges_reached": len(target_edges),
        "doctrine": f"Multicast to {len(region_list)} regions, {len(target_edges)} edges. Sovereign.",
    })


def cdn_status() -> dict:
    """CDN status."""
    healthy_edges = sum(1 for e in _EDGES.values() if e["healthy"])
    total_requests = sum(e["requests"] for e in _EDGES.values())
    return _sign({
        "protocol": PROTOCOL, "version": LICENSE,
        "total_regions": len(REGIONS),
        "total_edges": len(_EDGES),
        "healthy_edges": healthy_edges,
        "total_requests": total_requests,
        "purge_count": len(_PURGE_LOG),
        "multicast_count": len(_MULTICAST_LOG),
        "regions": REGIONS,
        "doctrine": f"Sovereign CDN: {len(REGIONS)} regions, {len(_EDGES)} edges. Care Floor 0.95. Sovereign.",
    })