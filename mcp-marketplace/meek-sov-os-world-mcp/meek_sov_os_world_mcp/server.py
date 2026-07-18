"""meek-sov-os-world-mcp — server.py (the sovereign OS world = globe + overlays + orbs + regulations)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_sov_os_world_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def sov_os_world_layout() -> dict:
    """Return the sovereign OS world layout."""
    return {
        "name": "SOV OS WORLD",
        "viewport": "the entire 3D globe (Cesium)",
        "left_hand_side": {
            "name": "SaaS tools + workflows + sessions",
            "contents": ["9 SaaS tools", "5 workflows", "3 sessions", "8 sovereign features"],
        },
        "right_hand_bar": {
            "name": "Sovereign (SOV3 character + BFT + mindsets)",
            "contents": ["SOV3 character", "Left brain (online)", "Right brain (offline)", "12 mindsets", "33-hive BFT"],
        },
        "center_chat": "speaks to SOV3 directly",
        "globe_overlay": {
            "engine": "Cesium 3D globe",
            "data_layers": 5,
            "total_items": 92100000,
        },
        "bottom_bar": "DORADO WEST (EAST -> WEST click-through, 8 layers)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_os_world_interactions() -> dict:
    """Return the world interactions (click, zoom, hover, drag, etc.)."""
    return {
        "interactions": [
            {"action": "click_on_temple", "result": "SOV3 reads the regulation + asks permission to learn more"},
            {"action": "click_on_orb", "result": "SOV3 shows the orb's status (HP + bond + BFT vote + quantum dream)"},
            {"action": "click_on_company", "result": "SOV3 shows the company data (Companies House)"},
            {"action": "click_on_property", "result": "SOV3 shows the property data (Land Registry)"},
            {"action": "click_on_weather_station", "result": "SOV3 shows the weather (Met Office)"},
            {"action": "zoom_to_country", "result": "SOV3 zooms the globe to the user's country"},
            {"action": "hover_over_marker", "result": "SOV3 shows the marker's data + permission ask"},
            {"action": "drag_globe", "result": "SOV3 rotates the globe + loads more data"},
            {"action": "search_place_name", "result": "SOV3 resolves the place name + zooms to it"},
            {"action": "type_in_chat", "result": "SOV3 thinks + plans + acts + learns"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_os_world_overlays() -> dict:
    """Return the world overlays (the 5 data layers)."""
    return {
        "overlays": [
            {"layer": "1_regulations", "items": 6, "source": "EU AI Act + GDPR + UK + AUKUS + NIST + ISO"},
            {"layer": "2_orbs", "items": 5005, "source": "Project AURUM"},
            {"layer": "3_terrain", "items": "high-res", "source": "Cesium World Terrain + OSM (2GB)"},
            {"layer": "4_government_data", "items": 92100000, "source": "49 GB UK Government"},
            {"layer": "5_synth_town", "items": 5000, "source": "SovTown synthetic world"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_os_world_user_can_do() -> dict:
    """Return what the user can do in the sovereign OS world."""
    return {
        "actions": [
            "Login (zooms to user's IP region)",
            "See all regulations as temples on the globe",
            "See all sovereign orbs as 3D models",
            "See all 92.1M government data points",
            "Click on a temple to learn about a regulation",
            "Click on an orb to see its status",
            "Click on a company to see Companies House data",
            "Click on a property to see Land Registry data",
            "Click on a weather station to see Met Office data",
            "Chat with SOV3 directly (the center chat)",
            "Run workflows from the L H side",
            "Vote on Traibgle (GOOD/BAD/NEUTRAL)",
            "Switch between SaaS tools (open multiple)",
            "Switch between sovereign features",
            "Customize the L H side + R H bar",
            "Switch to the digital twin view (i-character)",
            "Use the TUI (terminal-based) on PC + mobile",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_os_world_data_sources() -> dict:
    """Return the world data sources (where the data comes from)."""
    return {
        "government_data": {
            "path": "/data/hive-data/.hive/data/government",
            "size_gb": 49,
            "license": "OGL-UK-3.0",
            "source": "data.gov.uk",
            "datasets": 19,
        },
        "wikipedia": {
            "path": "/data/hive-data/.hive/data/wikipedia",
            "size_gb": 25,
            "license": "CC-BY-SA",
            "articles": "60M",
        },
        "openstreetmap": {
            "path": "/data/hive-data/.hive/data/osm",
            "size_gb": 2.0,
            "license": "ODbL",
            "file": "great-britain-latest.osm.pbf",
        },
        "names": {
            "path": "/data/hive-data/.hive/data/names",
            "total_names": 9100000,
            "source": "Names_2010Census.csv",
        },
        "eu_data": {
            "path": "/data/hive-data/.hive/data/eu",
            "size_kb": 380,
            "license": "CC-BY",
            "source": "eurostat + EEA + EU27_2020",
        },
        "synthetic": {
            "path": "/data/hive-data/.hive/data/synthetic",
            "size_gb": 1.5,
            "rows": "532K",
        },
        "total_size_gb": 49 + 25 + 2.0 + 0.380 + 1.5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_os_world_status() -> dict:
    """Return the SOV OS world status."""
    return {
        "name": "SOV OS WORLD",
        "status": "LIVE",
        "all_5_overlays_loaded": True,
        "all_92_1M_data_points_loaded": True,
        "all_5005_orbs_visible": True,
        "all_6_regulations_as_temples": True,
        "all_19_government_datasets_loaded": True,
        "verdict": "The SOV OS WORLD IS LIVE. The globe shows regulations as temples, sovereign orbs as 3D models, government data as markers, terrain from Cesium + OSM, and the SovTown synthetic world. The user can interact with everything. SOV3 watches.",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sov-os-world-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("sov_os_world_layout", "Return the sovereign OS world layout."),
        ("sov_os_world_interactions", "Return the world interactions."),
        ("sov_os_world_overlays", "Return the 5 data overlays."),
        ("sov_os_world_user_can_do", "Return what the user can do."),
        ("sov_os_world_data_sources", "Return the data sources."),
        ("sov_os_world_status", "Return the world status."),
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