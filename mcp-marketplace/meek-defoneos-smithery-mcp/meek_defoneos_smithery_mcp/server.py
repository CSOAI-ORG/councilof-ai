"""meek-defoneos-smithery-mcp — server.py (Smithery MCP registry)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_smithery_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def smithery_publish_listing() -> dict:
    """Return the Smithery listing payload."""
    return {
        "publisher": "CSOAI Ltd UK 16939677",
        "package_count": 70,
        "registry_url": "https://smithery.com",
        "listing_status": "DRAFT",
        "approval_required": True,
        "blocked_on": "Smithery API key + user approval",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def smithery_publish_execute() -> dict:
    """Execute the Smithery publish."""
    return {
        "status": "READY_TO_PUBLISH",
        "approval_required": True,
        "approval_reason": "Smithery publish requires API key + user approval",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def smithery_status() -> dict:
    """Get the Smithery status."""
    return {
        "published": False,
        "discovery_url": None,
        "blocked_on": "Smithery API key",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def smithery_overview() -> dict:
    """Return the Smithery overview."""
    return {
        "name": "DEFONEOS SMITHERY",
        "packages_to_publish": 70,
        "blocked_on": "Smithery API key + user approval",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-smithery-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("smithery_publish_listing", "Return the listing payload."),
        ("smithery_publish_execute", "Execute the publish."),
        ("smithery_status", "Get Smithery status."),
        ("smithery_overview", "Return the overview."),
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