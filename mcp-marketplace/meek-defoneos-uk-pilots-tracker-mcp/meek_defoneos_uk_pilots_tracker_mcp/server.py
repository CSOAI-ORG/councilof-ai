"""meek-defoneos-uk-pilots-tracker-mcp — server.py (the 7 UK prime outreach tracker)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_uk_pilots_tracker_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def pilots_list() -> dict:
    """List all 7 UK prime pilots."""
    pilots = [
        {"id": "pilot_001", "prime": "Babcock International", "sector": "Naval + aerospace", "contact": "CEO", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 1500000},
        {"id": "pilot_002", "prime": "QinetiQ", "sector": "Defence R&D", "contact": "CEO", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 2000000},
        {"id": "pilot_003", "prime": "BAE Systems", "sector": "Land + naval + air", "contact": "CEO", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 3000000},
        {"id": "pilot_004", "prime": "Thales UK", "sector": "Defence + transport + aerospace", "contact": "CEO", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 1500000},
        {"id": "pilot_005", "prime": "Leonardo UK", "sector": "Helicopters + electronics", "contact": "CEO", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 1000000},
        {"id": "pilot_006", "prime": "DSTL", "sector": "Defence Science + Technology Lab", "contact": "Director", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 1000000},
        {"id": "pilot_007", "prime": "DAIC", "sector": "Defence AI Centre", "contact": "Director", "status": "COLD_EMAIL_READY", "potential_arr_gbp": 2000000},
    ]
    return {
        "pilots": pilots,
        "count": len(pilots),
        "total_potential_arr_gbp": sum(p["potential_arr_gbp"] for p in pilots),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pilot_get(pilot_id: str = "pilot_001") -> dict:
    """Get a specific pilot."""
    pilots = pilots_list()["pilots"]
    pilot = next((p for p in pilots if p["id"] == pilot_id), None)
    if not pilot:
        return {"error": f"pilot {pilot_id} not found"}
    return pilot


def pilot_metrics() -> dict:
    """Return pilot metrics."""
    pilots = pilots_list()["pilots"]
    return {
        "total_pilots": len(pilots),
        "cold_email_ready": sum(1 for p in pilots if p["status"] == "COLD_EMAIL_READY"),
        "meeting_booked": sum(1 for p in pilots if p["status"] == "MEETING_BOOKED"),
        "pilot_active": sum(1 for p in pilots if p["status"] == "PILOT_ACTIVE"),
        "pilot_completed": sum(1 for p in pilots if p["status"] == "PILOT_COMPLETED"),
        "total_potential_arr_gbp": sum(p["potential_arr_gbp"] for p in pilots),
        "year_3_arr_forecast_gbp": 76200000,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pilot_status_update(pilot_id: str = "pilot_001", new_status: str = "MEETING_BOOKED") -> dict:
    """Update a pilot's status."""
    return {"pilot_id": pilot_id, "old_status": "COLD_EMAIL_READY", "new_status": new_status, "ts": datetime.now(timezone.utc).isoformat()}


def pilots_overview() -> dict:
    """Return the pilots overview."""
    return {
        "name": "DEFONEOS UK PILOTS TRACKER",
        "total_pilots": 7,
        "total_potential_arr_gbp": 12000000,
        "year_3_arr_forecast_gbp": 76200000,
        "blocked_on": "user approval (cold email outbound communication red-line rule)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-uk-pilots-tracker-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("pilots_list", "List all 7 UK pilots."),
        ("pilot_get", "Get a specific pilot."),
        ("pilot_metrics", "Return pilot metrics."),
        ("pilot_status_update", "Update a pilot's status."),
        ("pilots_overview", "Return the overview."),
    ]]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    fn = globals().get(name)
    if fn:
        return [TextContent(type="text", text=json.dumps(fn(**arguments), indent=2))]
    return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]


async def main():
    if not mcp or not stdio_server: raise RuntimeError("mcp package not installed")
    async with stdio_server() as (r, w): await mcp.run(r, w, mcp.create_initialization_options())

if __name__ == "__main__":
    import asyncio; asyncio.run(main())