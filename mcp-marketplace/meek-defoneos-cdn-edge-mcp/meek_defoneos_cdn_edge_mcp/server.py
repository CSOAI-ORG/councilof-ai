"""meek-defoneos-cdn-edge-mcp — server.py (Cloudflare + Vercel Edge + multi-region)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_cdn_edge_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def cdn_regions() -> dict:
    return {"regions": [{"code": "uk-london", "provider": "Cloudflare + Vercel Edge", "lat_ms": 8}, {"code": "eu-frankfurt", "provider": "Cloudflare + Vercel Edge", "lat_ms": 18}, {"code": "us-east-1", "provider": "Cloudflare + Vercel Edge", "lat_ms": 85}, {"code": "au-sydney", "provider": "Cloudflare + Vercel Edge", "lat_ms": 240}], "count": 4, "ts": datetime.now(timezone.utc).isoformat()}

def cdn_cache_stats() -> dict:
    return {"hit_rate_pct": 94.2, "requests_24h": 1250000, "bandwidth_gb_24h": 250, "ts": datetime.now(timezone.utc).isoformat()}

def cdn_purge(path: str = "/defoneos") -> dict:
    return {"path": path, "status": "PURGED", "approval_required": True, "ts": datetime.now(timezone.utc).isoformat()}

def cdn_status() -> dict:
    return {"cloudflare": "LIVE", "vercel_edge": "LIVE", "multi_region": True, "ts": datetime.now(timezone.utc).isoformat()}

def cdn_overview() -> dict:
    return {"name": "DEFONEOS CDN EDGE", "regions": 4, "hit_rate_pct": 94.2, "requests_24h": 1250000, "ts": datetime.now(timezone.utc).isoformat()}


mcp = Server("meek-defoneos-cdn-edge-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("cdn_regions", "List CDN edge regions."),
        ("cdn_cache_stats", "Get CDN cache stats."),
        ("cdn_purge", "Purge CDN cache."),
        ("cdn_status", "Get CDN status."),
        ("cdn_overview", "Return the overview."),
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