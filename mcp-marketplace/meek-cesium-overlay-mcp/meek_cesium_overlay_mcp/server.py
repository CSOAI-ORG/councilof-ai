"""meek-cesium-overlay-mcp — server.py (3D world overlay with regulations + orbs + terrain)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_cesium_overlay_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def cesium_engine_specs() -> dict:
    """Return the Cesium engine specs."""
    return {
        "engine": "CesiumJS (3D geospatial)",
        "version": "1.118+",
        "license": "Apache 2.0",
        "rendering": "WebGL 2.0 (60fps on modern GPU)",
        "data_source": "Cesium World Terrain (high-resolution 3D terrain)",
        "supports": ["3D terrain", "3D buildings", "3D models (.glTF)", "Real-time atmosphere", "Day/night cycle", "Star field"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def overlay_regulations_as_temples() -> dict:
    """Return the regulations as 3D temples on the globe."""
    regulations = [
        {"name": "EU AI Act", "country": "EU", "lat": 50.85, "lng": 4.35, "temple_height_m": 100, "temple_color": "#1f77b4", "frameworks": 4, "whitepapers": 12},
        {"name": "GDPR", "country": "EU", "lat": 50.85, "lng": 4.35, "temple_height_m": 80, "temple_color": "#1f77b4", "frameworks": 3, "whitepapers": 8},
        {"name": "UK AI Whitepaper", "country": "UK", "lat": 51.51, "lng": -0.13, "temple_height_m": 120, "temple_color": "#00b050", "frameworks": 3, "whitepapers": 6},
        {"name": "AUKUS Pillar 2", "country": "AUKUS", "lat": -35.28, "lng": 149.13, "temple_height_m": 150, "temple_color": "#ff7f0e", "frameworks": 3, "whitepapers": 3},
        {"name": "NIST AI RMF", "country": "US", "lat": 39.14, "lng": -77.21, "temple_height_m": 100, "temple_color": "#d62728", "frameworks": 4, "whitepapers": 7},
        {"name": "ISO 42001", "country": "International", "lat": 46.20, "lng": 6.14, "temple_height_m": 90, "temple_color": "#9467bd", "frameworks": 3, "whitepapers": 3},
    ]
    return {
        "temples": regulations,
        "count": len(regulations),
        "total_frameworks": sum(r["frameworks"] for r in regulations),
        "total_whitepapers": sum(r["whitepapers"] for r in regulations),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def overlay_sovereign_orbs() -> dict:
    """Return the 5,005 sovereign orbs as 3D models on the globe."""
    return {
        "orb_count": 5005,
        "orb_model": "Sovereign Orb (.glTF, 50cm diameter)",
        "orb_color": "#ffd700 (gold)",
        "orb_glow": "#fff8dc (warm white)",
        "distribution": "100km² SovTown (Yorkshire countryside)",
        "lat_lng_center": {"lat": 54.0, "lng": -1.5},
        "orb_features": [
            "Ed25519 SIGIL signed",
            "5-radio mesh (LoRa + WiFi + BLE + Sigil + UWB)",
            "4VF circulatory network",
            "33-hive BFT council voter",
            "SOV3 OOWM (Mamba-2 + MoE)",
            "Traibgle voting (GOOD/BAD/NEUTRAL)",
            "Quantum dreams (QUTANM 1.58)",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def overlay_terrain_with_osm() -> dict:
    """Return the terrain overlay using OSM data."""
    return {
        "terrain_source": "Cesium World Terrain (CesiumJS 1.118+)",
        "terrain_license": "Apache 2.0",
        "osm_overlay": {
            "data_source": "OpenStreetMap (ODbL)",
            "file": "/data/hive-data/.hive/data/osm/great-britain-latest.osm.pbf",
            "size_gb": 2.0,
            "features": "roads + buildings + rivers + parks + places of interest",
        },
        "terrain_quality": "high-resolution (1m-30m vertical accuracy)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def overlay_government_data() -> dict:
    """Return the government data overlay on the globe."""
    return {
        "companies_house": {"count": 5000000, "marker_type": "blue dot", "marker_size": "5px"},
        "companies_house_psc": {"count": 15600000, "marker_type": "purple dot", "marker_size": "4px"},
        "land_registry_price_paid": {"count": 30000000, "marker_type": "green dot", "marker_size": "3px"},
        "dvsa_mot": {"count": 40000000, "marker_type": "orange dot", "marker_size": "3px"},
        "fsa_hygiene": {"count": 500000, "marker_type": "red dot", "marker_size": "6px"},
        "nhs_prescribing": {"count": 1000000, "marker_type": "teal dot", "marker_size": "4px"},
        "ea_flood": {"count": 1000, "marker_type": "yellow flashing dot", "marker_size": "10px"},
        "met_office": {"count": 37, "marker_type": "weather symbol", "marker_size": "20px"},
        "total_markers": 92100000,  # 92.1M government data points on the globe
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def overlay_synth_town() -> dict:
    """Return the synthetic town overlay (the sovereign training world)."""
    return {
        "town_name": "SovTown",
        "size_km2": 100,
        "biome": "Yorkshire countryside",
        "sovereign_orbs": 5005,
        "metahuman_digital_twins": 1000,
        "sensors_per_orb": 12,
        "data_points_total": 50000,  # the synthetic training data
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def overlay_combine_all() -> dict:
    """Return the COMBINED overlay (regulations + orbs + terrain + government + SovTown)."""
    return {
        "name": "CESIUM COMBINED OVERLAY",
        "data_layers": [
            {"layer": "regulations_as_temples", "items": 6, "source": "EU AI Act + GDPR + UK + AUKUS + NIST + ISO"},
            {"layer": "sovereign_orbs", "items": 5005, "source": "Project AURUM"},
            {"layer": "terrain", "items": "high-res", "source": "Cesium World Terrain + OSM"},
            {"layer": "government_data", "items": 92100000, "source": "49 GB UK Government"},
            {"layer": "synth_town", "items": 5000, "source": "SovTown synthetic world"},
        ],
        "total_items": 92100000 + 5005 + 6 + 5000,
        "total_layers": 5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cesium_3d_scene_url() -> dict:
    """Return the URL to the 3D scene (the actual Cesium overlay)."""
    return {
        "scene_type": "Cesium 3D globe",
        "engine": "CesiumJS 1.118+",
        "scene_url": "https://cesium.com/downloads/cesiumjs/releases/1.118/Build/Cesium/Cesium.js",
        "local_url": "/home/nicholas/csoai-dashboard/client/src/data/cesium_overlay.json",
        "data_sources": [
            "/data/hive-data/.hive/data/government",
            "/data/hive-data/.hive/data/wikipedia",
            "/data/hive-data/.hive/data/osm",
            "/data/hive-data/.hive/data/names",
            "/data/hive-data/.hive/data/eu",
            "/data/hive-data/sovereign-town",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-cesium-overlay-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("cesium_engine_specs", "Return the Cesium engine specs."),
        ("overlay_regulations_as_temples", "Return the regulations as 3D temples."),
        ("overlay_sovereign_orbs", "Return the 5,005 sovereign orbs as 3D models."),
        ("overlay_terrain_with_osm", "Return the terrain overlay using OSM."),
        ("overlay_government_data", "Return the 92.1M government data points."),
        ("overlay_synth_town", "Return the SovTown synthetic world."),
        ("overlay_combine_all", "Combine all overlays."),
        ("cesium_3d_scene_url", "Return the 3D scene URL."),
    ]]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    fn = globals().get(name)
    if fn:
        return [TextContent(type="text", text=json.dumps(fn(), indent=2))]
    return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]


async def main():
    if not mcp or not stdio_server: raise RuntimeError("mcp package not installed")
    async with stdio_server() as (r, w): await mcp.run(r, w, mcp.create_initialization_options())

if __name__ == "__main__":
    import asyncio; asyncio.run(main())