"""meek-sov-os-gamification-mcp — server.py (XP + achievements + leaderboard for the digital twin)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_sov_os_gamification_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def xp_award(twin_id: str = "twin_001", xp_amount: int = 100, reason: str = "First Login") -> dict:
    """Award XP to a digital twin."""
    current_xp = 100 + xp_amount
    level = 1 + current_xp // 1000
    return {
        "twin_id": twin_id,
        "xp_awarded": xp_amount,
        "xp_total": current_xp,
        "level": level,
        "reason": reason,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def xp_status(twin_id: str = "twin_001") -> dict:
    """Get the XP status of a digital twin."""
    return {
        "twin_id": twin_id,
        "level": 2,
        "xp_total": 1500,
        "xp_to_next_level": 500,
        "progress_pct": 75,
        "title": "Sovereign Apprentice",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def achievements_list() -> dict:
    """List all achievements."""
    return {
        "achievements": [
            {"id": "ach_001", "name": "First Login", "xp_reward": 100, "status": "UNLOCKED", "unlocked_at": "2026-06-28T12:00:00Z"},
            {"id": "ach_002", "name": "First Regulation Studied", "xp_reward": 500, "status": "UNLOCKED", "unlocked_at": "2026-06-28T12:30:00Z"},
            {"id": "ach_003", "name": "First Workflow Created", "xp_reward": 250, "status": "UNLOCKED", "unlocked_at": "2026-06-28T13:00:00Z"},
            {"id": "ach_004", "name": "First Sovereign Bond Formed", "xp_reward": 1000, "status": "LOCKED"},
            {"id": "ach_005", "name": "First Quantum Dream", "xp_reward": 2000, "status": "LOCKED"},
            {"id": "ach_006", "name": "100 Regulations Studied", "xp_reward": 5000, "status": "LOCKED"},
            {"id": "ach_007", "name": "1000 Workflow Runs", "xp_reward": 10000, "status": "LOCKED"},
            {"id": "ach_008", "name": "Defence First Pilot Closed", "xp_reward": 50000, "status": "LOCKED"},
        ],
        "count": 8,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def leaderboard_global(limit: int = 10) -> dict:
    """Get the global leaderboard."""
    return {
        "leaderboard": [
            {"rank": 1, "twin_id": "twin_007", "user_name": "Sarah Chen", "level": 42, "xp_total": 42000, "title": "Sovereign Grandmaster"},
            {"rank": 2, "twin_id": "twin_013", "user_name": "James Park", "level": 38, "xp_total": 38000, "title": "Sovereign Master"},
            {"rank": 3, "twin_id": "twin_001", "user_name": "Nicholas Templeman", "level": 2, "xp_total": 1500, "title": "Sovereign Apprentice"},
        ],
        "total_twins": 100,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def title_unlock(level: int = 10) -> dict:
    """Unlock a title based on level."""
    titles = {
        1: "Sovereign Initiate",
        2: "Sovereign Apprentice",
        5: "Sovereign Practitioner",
        10: "Sovereign Expert",
        20: "Sovereign Master",
        30: "Sovereign Grandmaster",
        42: "Sovereign Legend",
    }
    title = titles.get(level, "Sovereign Initiate")
    return {"level": level, "title": title, "ts": datetime.now(timezone.utc).isoformat()}


def gamification_overview() -> dict:
    """Return the gamification overview."""
    return {
        "name": "SOV OS GAMIFICATION",
        "system": "XP + levels + achievements + titles + leaderboard",
        "max_level": 42,
        "total_achievements": 8,
        "leaderboard_users": 100,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sov-os-gamification-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("xp_award", "Award XP to a twin."),
        ("xp_status", "Get XP status."),
        ("achievements_list", "List all achievements."),
        ("leaderboard_global", "Get the global leaderboard."),
        ("title_unlock", "Unlock a title."),
        ("gamification_overview", "Return the overview."),
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