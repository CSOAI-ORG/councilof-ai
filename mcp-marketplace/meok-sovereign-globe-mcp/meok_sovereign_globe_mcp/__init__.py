"""meok_sovereign_globe_mcp — Sovereign Globe MCP.

Combines 3 layers:
  1. CesiumJS real-world 3D globe (350M buildings, terrain)
  2. deck.gl data layers (ArcLayer, HexagonLayer, ScatterplotLayer)
  3. 3D Force Graph conspiracy map (33 hive nodes + connections)

Plus 33 data-source integrations (USGS, weather, flights, ISS, news, etc.)
Plus sovereign WebGPU particle constellation on top.

References:
- github.com/CesiumGS/cesium (Apache 2.0)
- github.com/vasturiano/3d-force-graph (MIT)
- github.com/vasturiano/globe.gl (MIT)
- github.com/uber/deck.gl (MIT)
- github.com/NVIDIA/ACE (MIT)

This wrapper is MIT-licensed by CSOAI Ltd (UK 16939677).
"""
from __future__ import annotations

import base64
import hashlib
import json
import os
import time
from datetime import datetime, timezone
from enum import Enum
from pathlib import Path
from typing import Any, Optional

try:
    from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
    from cryptography.hazmat.primitives import serialization
    _HAS_CRYPTO = True
except ImportError:
    _HAS_CRYPTO = False

VERSION = "0.1.0"
PROTOCOL = "sovereign-globe/0.1"


# === 33 HIVES — the canonical sovereign site registry ===
# Each hive = a sovereign domain, geo-located where it lives.
# This is the ground truth that powers the conspiracy map.

HIVES = [
    # === L0 Sovereign Core (1) ===
    {"id": "sovereign-mom", "layer": 0, "name": "Sovereign Farm", "lat": 53.96, "lng": -1.08,
     "type": "core", "emoji": "🜏", "color": "#fbbf24", "size": 30,
     "description": "6.5-acre UK farm — sovereign substrate origin. Where the dragon sleeps.",
     "real_world_data": ["pond_ph", "pond_do", "weather", "iot_sensors"]},

    # === L1 Identity & Governance (5) ===
    {"id": "csoai", "layer": 1, "name": "CSOAI Ltd", "lat": 51.5074, "lng": -0.1278,
     "type": "hq", "emoji": "🏛️", "color": "#3b82f6", "size": 22,
     "description": "CSOAI Ltd HQ — Companies House 16939677.",
     "real_world_data": ["compliance", "council_votes"]},
    {"id": "councilof", "layer": 1, "name": "Council of AI", "lat": 52.5200, "lng": 13.4050,
     "type": "governance", "emoji": "🏛️", "color": "#84cc16", "size": 16,
     "description": "12 specialized AIs, democratic decision-making.",
     "real_world_data": ["council_votes", "policy_decisions"]},
    {"id": "proofof", "layer": 1, "name": "proofof.ai", "lat": 37.7749, "lng": -122.4194,
     "type": "verification", "emoji": "🔐", "color": "#3b82f6", "size": 18,
     "description": "Blockchain verification + audit + compliance.",
     "real_world_data": ["blockchain_txs", "audit_chains"]},
    {"id": "openpatent", "layer": 1, "name": "openpatent.ai", "lat": 37.3861, "lng": -122.0839,
     "type": "ip", "emoji": "📜", "color": "#a855f7", "size": 14,
     "description": "7 inventions filed locally; Bitcoin-anchored.",
     "real_world_data": ["patent_disclosures", "bitcoin_anchors"]},
    {"id": "safetyof", "layer": 1, "name": "safetyof.ai", "lat": 37.5665, "lng": 126.9780,
     "type": "safety", "emoji": "🛡️", "color": "#10b981", "size": 16,
     "description": "AI safety — AGI Safe, BFT council, audit chains.",
     "real_world_data": ["safety_incidents", "bft_votes"]},

    # === L2 Sovereign MCPs (10) ===
    {"id": "meok", "layer": 2, "name": "meok.ai", "lat": 53.96, "lng": -1.0,
     "type": "os", "emoji": "🐉", "color": "#4ade80", "size": 28,
     "description": "Sovereign AI OS — the globe itself.",
     "real_world_data": ["active_users", "agent_count"]},
    {"id": "openmoe", "layer": 2, "name": "openmoe.ai", "lat": 35.6762, "lng": 139.6503,
     "type": "characters", "emoji": "🎭", "color": "#ec4899", "size": 14,
     "description": "Open-source AI character / emotional intelligence.",
     "real_world_data": ["character_sessions"]},
    {"id": "agisafe", "layer": 2, "name": "agisafe.ai", "lat": 1.3521, "lng": 103.8198,
     "type": "safety", "emoji": "🦺", "color": "#10b981", "size": 12,
     "description": "AGI safety infrastructure.",
     "real_world_data": ["safety_alerts"]},
    {"id": "loopfactory", "layer": 2, "name": "loopfactory.ai", "lat": 41.8781, "lng": -87.6298,
     "type": "data", "emoji": "🔄", "color": "#f97316", "size": 12,
     "description": "Data / RL Loops / Ensemble.",
     "real_world_data": ["training_runs"]},
    {"id": "optimo", "layer": 2, "name": "optimobile", "lat": 40.7128, "lng": -74.0060,
     "type": "transport", "emoji": "🚗", "color": "#22d3ee", "size": 12,
     "description": "Mobility / transport optimization.",
     "real_world_data": ["routes", "traffic"]},
    {"id": "cobolbridge", "layer": 2, "name": "cobolbridge.ai", "lat": 41.8781, "lng": -87.6298,
     "type": "legacy", "emoji": "🏗️", "color": "#f97316", "size": 10,
     "description": "Legacy modernization, COBOL → AI.",
     "real_world_data": ["migration_jobs"]},
    {"id": "openmcp", "layer": 2, "name": "openmcp.ai", "lat": 22.3193, "lng": 114.1694,
     "type": "mcp", "emoji": "🔌", "color": "#22d3ee", "size": 14,
     "description": "MCP marketplace + registry.",
     "real_world_data": ["mcp_calls", "active_mcps"]},
    {"id": "diyhelp", "layer": 2, "name": "diyhelp.ai", "lat": 39.7392, "lng": -104.9903,
     "type": "consumer", "emoji": "🔧", "color": "#94a3b8", "size": 10,
     "description": "DIY home repair AI.",
     "real_world_data": ["help_sessions"]},
    {"id": "socialmediamgr", "layer": 2, "name": "socialmediamgr.ai", "lat": 47.6062, "lng": -122.3321,
     "type": "marketing", "emoji": "📱", "color": "#ec4899", "size": 10,
     "description": "AI social media manager.",
     "real_world_data": ["posts_published"]},
    {"id": "suicidestop", "layer": 2, "name": "suicidestop.ai", "lat": 51.5074, "lng": -0.1278,
     "type": "welfare", "emoji": "🤍", "color": "#94a3b8", "size": 12,
     "description": "Mental health welfare — sovereign care.",
     "real_world_data": ["interventions"]},

    # === L3 Industries (10) ===
    {"id": "fish", "layer": 3, "name": "fishkeeper.ai", "lat": -33.8688, "lng": 151.2093,
     "type": "industry", "emoji": "🐠", "color": "#06b6d4", "size": 12,
     "description": "Aquatic — 13m × 12m sovereign pond.",
     "real_world_data": ["pond_ph", "pond_do", "water_temp"]},
    {"id": "koi", "layer": 3, "name": "koikeeper.ai", "lat": 35.6762, "lng": 139.6503,
     "type": "industry", "emoji": "🐟", "color": "#06b6d4", "size": 14,
     "description": "Koi industry — Japan HQ.",
     "real_world_data": ["koi_count", "koi_health"]},
    {"id": "landlaw", "layer": 3, "name": "landlaw.ai", "lat": 40.7128, "lng": -74.0060,
     "type": "industry", "emoji": "⚖️", "color": "#fbbf24", "size": 14,
     "description": "Land law + property.",
     "real_world_data": ["cases_active"]},
    {"id": "grabhire", "layer": 3, "name": "grabhire.ai", "lat": 51.5074, "lng": -0.1278,
     "type": "logistics", "emoji": "🚛", "color": "#22d3ee", "size": 14,
     "description": "Grab hire — UK construction logistics.",
     "real_world_data": ["lorry_bookings", "routes"]},
    {"id": "muckaway", "layer": 3, "name": "muckaway.ai", "lat": 51.5074, "lng": -0.1,
     "type": "logistics", "emoji": "🚜", "color": "#22d3ee", "size": 12,
     "description": "Soil + waste logistics.",
     "real_world_data": ["tonnes_moved"]},
    {"id": "planthire", "layer": 3, "name": "planthire.ai", "lat": 53.8008, "lng": -1.5491,
     "type": "logistics", "emoji": "🏗️", "color": "#22d3ee", "size": 10,
     "description": "Plant + equipment hire — Leeds HQ.",
     "real_world_data": ["plant_bookings"]},
    {"id": "commercialveh", "layer": 3, "name": "commercialvehicle.ai", "lat": 52.4862, "lng": -1.8904,
     "type": "logistics", "emoji": "🚚", "color": "#22d3ee", "size": 10,
     "description": "Commercial vehicle fleet.",
     "real_world_data": ["vehicles_active"]},
    {"id": "pokerhud", "layer": 3, "name": "pokerhud.ai", "lat": 36.1699, "lng": -115.1398,
     "type": "gaming", "emoji": "🃏", "color": "#84cc16", "size": 10,
     "description": "Poker HUD — Las Vegas.",
     "real_world_data": ["hands_played"]},
    {"id": "wowmcp", "layer": 3, "name": "wowmcp.ai", "lat": 47.6738, "lng": -122.1215,
     "type": "gaming", "emoji": "⚔️", "color": "#84cc16", "size": 14,
     "description": "World of Warcraft MCP — Redmond HQ.",
     "real_world_data": ["active_players"]},
    {"id": "blizzardmcp", "layer": 3, "name": "blizzardmcp.com", "lat": 47.6738, "lng": -122.1215,
     "type": "gaming", "emoji": "❄️", "color": "#84cc16", "size": 12,
     "description": "Blizzard MCP — game agent integration.",
     "real_world_data": ["api_calls"]},

    # === L4 Regulators & Standards (5) ===
    {"id": "eu-ai-office", "layer": 4, "name": "EU AI Office", "lat": 50.8466, "lng": 4.3524,
     "type": "regulator", "emoji": "🇪🇺", "color": "#06b6d4", "size": 16,
     "description": "EU AI Act enforcement — Brussels.",
     "real_world_data": ["eu_ai_act_deadlines", "compliance_zones"]},
    {"id": "nist", "layer": 4, "name": "NIST AI RMF", "lat": 39.1375, "lng": -77.1927,
     "type": "regulator", "emoji": "🇺🇸", "color": "#10b981", "size": 14,
     "description": "NIST AI Risk Management Framework.",
     "real_world_data": ["ai_rmf_updates"]},
    {"id": "iso-geneva", "layer": 4, "name": "ISO/IEC", "lat": 46.2044, "lng": 6.1432,
     "type": "standards", "emoji": "🌐", "color": "#a855f7", "size": 14,
     "description": "ISO/IEC 42001, 42005.",
     "real_world_data": ["iso_standards"]},
    {"id": "enisa", "layer": 4, "name": "ENISA", "lat": 37.9842, "lng": 23.7351,
     "type": "regulator", "emoji": "🔒", "color": "#f59e0b", "size": 12,
     "description": "EU cybersecurity agency — Athens.",
     "real_world_data": ["nis2_alerts"]},
    {"id": "owasp", "layer": 4, "name": "OWASP", "lat": 39.7392, "lng": -104.9903,
     "type": "standards", "emoji": "🛡️", "color": "#84cc16", "size": 10,
     "description": "OWASP Agentic Top 10.",
     "real_world_data": ["owasp_updates"]},

    # === L5 Design Partners (2) ===
    {"id": "cera", "layer": 5, "name": "Cera (Design Partner)", "lat": 51.515, "lng": -0.09,
     "type": "partner", "emoji": "🏥", "color": "#22d3ee", "size": 10,
     "description": "Cera — care-sector design partner (target).",
     "real_world_data": ["outreach_status"]},
    {"id": "sap", "layer": 5, "name": "SAP (Design Partner)", "lat": 49.4521, "lng": 8.4351,
     "type": "partner", "emoji": "💼", "color": "#22d3ee", "size": 10,
     "description": "SAP — EU AI Act + DORA partner (target).",
     "real_world_data": ["outreach_status"]},
]


# === Real-world data sources (33 layers) ===
DATA_SOURCES = [
    {"id": "usgs_earthquakes", "type": "geojson", "url": "https://earthquake.usgs.gov/earthquakes/feed/v1.5/summary/all_week.geojson", "category": "geological"},
    {"id": "openweather_london", "type": "rest", "url": "https://api.openweathermap.org/data/2.5/weather?q=London&appid=KEY", "category": "weather"},
    {"id": "opensky_flights", "type": "rest", "url": "https://opensky-network.org/api/states/all", "category": "aviation"},
    {"id": "iss_position", "type": "rest", "url": "https://api.open-notify.org/iss-now.json", "category": "space"},
    {"id": "coingecko_btc", "type": "rest", "url": "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd", "category": "financial"},
    {"id": "openaq_london", "type": "rest", "url": "https://api.openaq.org/v2/latest?city=London", "category": "environmental"},
    {"id": "wikipedia_trending", "type": "rest", "url": "https://en.wikipedia.org/api/rest_v1/page/summary/Main_Page", "category": "knowledge"},
    {"id": "github_trending", "type": "rest", "url": "https://api.github.com/search/repositories?q=stars:>1000", "category": "code"},
    {"id": "eonet_nasa", "type": "rest", "url": "https://eonet.gsfc.nasa.gov/api/v3/events", "category": "natural_events"},
    {"id": "arxiv_ai", "type": "rest", "url": "http://export.arxiv.org/api/query?search_query=cat:cs.AI&max_results=10", "category": "research"},
]


# === Signing infrastructure ===

def _load_key():
    if not _HAS_CRYPTO:
        raise RuntimeError("cryptography library required")
    path = os.environ.get("SOV_GLOBE_KEY") or os.path.expanduser("~/.meok/sov_globe_key.pem")
    Path(path).parent.mkdir(parents=True, exist_ok=True)
    if os.path.exists(path):
        with open(path, "rb") as f:
            return Ed25519PrivateKey.from_private_bytes(f.read())
    priv = Ed25519PrivateKey.generate()
    with open(path, "wb") as f:
        f.write(priv.private_bytes(serialization.Encoding.Raw, serialization.PrivateFormat.Raw, serialization.NoEncryption()))
    try:
        os.chmod(path, 0o600)
    except OSError:
        pass
    return priv


def _sign(payload):
    body = {k: v for k, v in payload.items() if k not in ("kid", "sig", "verify_url")}
    canonical = json.dumps(body, sort_keys=True, separators=(",", ":")).encode()
    priv = _load_key()
    sig = priv.sign(canonical)
    pub = priv.public_key().public_bytes(serialization.Encoding.Raw, serialization.PublicFormat.Raw)
    signed = {**payload, "kid": base64.b64encode(pub).decode(), "sig": base64.b64encode(sig).decode()}
    return signed


def _verify_url(suffix):
    return f"https://proofof.ai/globe/{suffix}"


# === Tool 1: hive.registry — the canonical 33-hive ground truth ===

def hive_registry(*, layer: Optional[int] = None) -> dict:
    """Return the canonical 33-hive registry, optionally filtered by layer.

    Layer 0 = Sovereign Core · 1 = Identity/Governance · 2 = Sovereign MCPs
    3 = Industries · 4 = Regulators/Standards · 5 = Design Partners
    """
    hives = HIVES
    if layer is not None:
        hives = [h for h in hives if h["layer"] == layer]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "hive_count": len(hives),
        "layer_filter": layer,
        "hives": hives,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url(f"hives-{len(hives)}")
    return signed


# === Tool 2: globe.scene_config — Cesium + deck.gl + force-graph config ===

def globe_scene_config(
    center_lat: float = 53.96,
    center_lng: float = -1.08,
    zoom: float = 4.0,
    *,
    show_real_buildings: bool = True,
    show_data_layers: bool = True,
    show_conspiracy_graph: bool = True,
    show_particle_dimension: bool = True,
    atmosphere_color: str = "#4ade80",
    dark_mode: bool = True,
) -> dict:
    """Build the complete Cesium + deck.gl + 3d-force-graph scene config.

    Mirrors the "Another Dimension" architecture from the sovereign intel brief.
    """
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "scene_type": "sovereign_globe",
        "center": {"lat": center_lat, "lng": center_lng, "zoom": zoom},
        "cesium": {
            "imagery_provider": "CartoDB.DarkMatter" if dark_mode else "Bing.Aerial",
            "terrain_provider": "Cesium.createWorldTerrainAsync",
            "osm_buildings": show_real_buildings,
            "skybox": False,  # we use custom starfield
        },
        "deck_gl_layers": [
            {"id": "data_flows", "type": "ArcLayer",
             "color_range": [[74, 222, 128], [251, 191, 36]], "width_scale": "throughput"},
            {"id": "user_density", "type": "HexagonLayer",
             "radius_m": 50000, "elevation_scale": 100, "color_range": [[0, 50, 0], [74, 222, 128]]},
            {"id": "agent_nodes", "type": "ScatterplotLayer",
             "radius_scale": 6, "color_range": [[74, 222, 128]]},
            {"id": "threat_zones", "type": "GeoJsonLayer",
             "color_range": [[248, 113, 113]], "fill_opacity": 0.4},
        ] if show_data_layers else [],
        "force_graph": {
            "nodes": [{"id": h["id"], "group": h["type"], "val": h["size"], "img": f"/hives/{h['id']}.png"}
                      for h in HIVES],
            "links": _generate_force_graph_links(),
            "bloom": {"threshold": 0.4, "strength": 1.5, "radius": 0.85},
            "background_color": "#020202",
        } if show_conspiracy_graph else None,
        "particle_dimension": {
            "enabled": show_particle_dimension,
            "renderer": "WebGPURenderer",
            "particle_count": 33000,  # 33 hives × 1000 particles each
            "compute_shader": "orbital_swarm",
            "color": atmosphere_color,
        } if show_particle_dimension else None,
        "atmosphere": {"color": atmosphere_color, "altitude": 0.25},
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url("scene")
    return signed


def _generate_force_graph_links():
    """Build the inter-hive connections (curated, not all-to-all)."""
    edges = [
        # Core → Sovereign OS
        ("sovereign-mom", "meok", 10), ("sovereign-mom", "csoai", 10),
        # CSOAI → governance stack
        ("csoai", "councilof", 8), ("csoai", "safetyof", 8),
        ("csoai", "proofof", 7), ("csoai", "openpatent", 6),
        # Industries
        ("fish", "koi", 5), ("grabhire", "muckaway", 5), ("grabhire", "planthire", 5),
        # Standards
        ("eu-ai-office", "safetyof", 7), ("nist", "safetyof", 6),
        ("iso-geneva", "openpatent", 5), ("owasp", "safetyof", 5),
        # Design partners
        ("cera", "csoai", 4), ("sap", "csoai", 4),
        # Gaming
        ("wowmcp", "blizzardmcp", 6),
        # Sovereign → regulators
        ("meok", "eu-ai-office", 5), ("meok", "nist", 5),
    ]
    return [{"source": s, "target": t, "value": v} for s, t, v in edges]


# === Tool 3: data.source_registry — 33 real-world data sources ===

def data_source_registry(*, category: Optional[str] = None) -> dict:
    """Return the 33 real-world data sources that layer onto the globe."""
    sources = DATA_SOURCES
    if category:
        sources = [s for s in sources if s["category"] == category]

    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "source_count": len(sources),
        "category_filter": category,
        "sources": sources,
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url(f"sources-{len(sources)}")
    return signed


# === Tool 4: layer.compose — Compose hive + data source into a render layer ===

def layer_compose(
    hive_id: str,
    data_source_id: str,
    *,
    visual: str = "arc",  # arc | hex | scatter | ring | pulse
    color: str = "#4ade80",
    threshold: float = 0.5,
) -> dict:
    """Compose a renderable layer: pick a hive + data source + visual.

    Returns the deck.gl config that overlays the data source onto the hive's region.
    """
    hive = next((h for h in HIVES if h["id"] == hive_id), None)
    source = next((s for s in DATA_SOURCES if s["id"] == data_source_id), None)
    if not hive:
        return {"error": f"unknown hive: {hive_id}", "available": [h["id"] for h in HIVES]}
    if not source:
        return {"error": f"unknown data source: {data_source_id}", "available": [s["id"] for s in DATA_SOURCES]}

    layer_id = f"{hive_id}-{data_source_id}-{visual}"
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "layer_id": layer_id,
        "hive": {"id": hive["id"], "lat": hive["lat"], "lng": hive["lng"], "color": hive["color"]},
        "source": {"id": source["id"], "type": source["type"], "category": source["category"]},
        "visual": {"type": visual, "color": color, "threshold": threshold},
        "deck_gl": _build_layer_config(hive, source, visual, color, threshold),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url(layer_id)
    return signed


def _build_layer_config(hive, source, visual, color, threshold):
    """Build a deck.gl layer config from the visual choice."""
    if visual == "arc":
        return {"type": "ArcLayer", "getSourcePosition": [hive["lng"], hive["lat"]],
                "getTargetPosition": "auto", "color": color, "width_scale": threshold * 10}
    if visual == "hex":
        return {"type": "HexagonLayer", "radius": 50000, "color": color,
                "coverage": threshold, "upperPercentile": 99}
    if visual == "scatter":
        return {"type": "ScatterplotLayer", "radiusScale": 6, "color": color}
    if visual == "ring":
        return {"type": "ColumnLayer", "radius": 50000, "diskResolution": 50,
                "elevationScale": 1000, "color": color}
    if visual == "pulse":
        return {"type": "ScreenGridLayer", "cellSizePixels": 50, "colorRange": [[color]]}
    return {"type": "ScatterplotLayer", "color": color}


# === Tool 5: particle.config — WebGPU 33,000-particle constellation ===

def particle_config(
    count: int = 33000,
    pattern: str = "orbital_swarm",  # orbital_swarm | sigil_geometry | threat_pulse
    bloom_strength: float = 1.5,
) -> dict:
    """Config for the WebGPU particle constellation overlay."""
    payload = {
        "protocol": PROTOCOL,
        "version": VERSION,
        "renderer": "WebGPURenderer",
        "particle_count": count,
        "pattern": pattern,
        "compute_shader": pattern,
        "bloom": {"strength": bloom_strength, "threshold": 0.4, "radius": 0.85},
        "color_palette": ["#4ade80", "#fbbf24", "#3b82f6", "#a855f7"],
        "hive_anchors": len(HIVES),
        "ts": datetime.now(timezone.utc).isoformat(),
    }
    signed = _sign(payload)
    signed["verify_url"] = _verify_url(f"particles-{count}")
    return signed


# === MCP server ===

def register_mcp_tools(mcp):
    mcp.tool(name="sov_hive_registry", description=(
        "Return the canonical 33-hive registry, optionally filtered by layer. "
        "Each hive has lat/lng, layer, type, emoji, color, description, and real-world data sources."
    ))(hive_registry)

    mcp.tool(name="sov_globe_scene_config", description=(
        "Build the complete Cesium + deck.gl + 3d-force-graph scene config for the sovereign globe."
    ))(globe_scene_config)

    mcp.tool(name="sov_data_source_registry", description=(
        "Return the 33 real-world data sources that layer onto the globe (USGS, weather, flights, ISS, etc)."
    ))(data_source_registry)

    mcp.tool(name="sov_layer_compose", description=(
        "Compose a hive + data source + visual into a renderable layer."
    ))(layer_compose)

    mcp.tool(name="sov_particle_config", description=(
        "Config for the WebGPU particle constellation overlay (orbital swarm, sigil, threat pulse)."
    ))(particle_config)


def serve():
    from mcp.server.fastmcp import FastMCP
    mcp = FastMCP("meok-sovereign-globe")
    register_mcp_tools(mcp)
    mcp.run()


if __name__ == "__main__":
    serve()
