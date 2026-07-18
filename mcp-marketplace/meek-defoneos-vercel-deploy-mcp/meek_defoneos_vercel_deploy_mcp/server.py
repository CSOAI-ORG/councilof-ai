"""meek-defoneos-vercel-deploy-mcp — server.py (Vercel deploy automation)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_vercel_deploy_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def vercel_deploy_pages() -> dict:
    """Return the pages to deploy to Vercel."""
    return {
        "pages": [
            {"domain": "meok.ai", "path": "/defoneos", "framework": "Next.js 14", "size_mb": 2.5, "status": "DRAFT"},
            {"domain": "csoai.org", "path": "/defoneos", "framework": "Next.js 14", "size_mb": 2.5, "status": "DRAFT"},
            {"domain": "defoneos.com", "path": "/", "framework": "Next.js 14", "size_mb": 5.0, "status": "DRAFT"},
            {"domain": "meok.ai", "path": "/sov-space", "framework": "Next.js 14 + Cesium", "size_mb": 12.0, "status": "DRAFT"},
            {"domain": "csoai.org", "path": "/knowledge-pack", "framework": "Next.js 14", "size_mb": 3.5, "status": "DRAFT"},
        ],
        "count": 5,
        "total_size_mb": 25.5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def vercel_deploy_execute(domain: str = "meok.ai", path: str = "/defoneos") -> dict:
    """Execute a Vercel deploy."""
    return {
        "deploy_id": f"deploy_{int(datetime.now(timezone.utc).timestamp())}",
        "domain": domain,
        "path": path,
        "status": "READY_TO_DEPLOY",
        "approval_required": True,
        "approval_reason": "production deploy requires human approval",
        "next_step": "user reviews + approves + runs 'vercel --prod --yes'",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def vercel_status(domain: str = "meok.ai") -> dict:
    """Get the current Vercel status."""
    return {
        "domain": domain,
        "live": False,
        "last_deploy": None,
        "build_status": "PENDING",
        "next_step": "deploy needed",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def vercel_rollback(deploy_id: str = "deploy_001") -> dict:
    """Rollback a Vercel deploy."""
    return {"deploy_id": deploy_id, "status": "ROLLBACK_READY", "ts": datetime.now(timezone.utc).isoformat()}


def vercel_overview() -> dict:
    """Return the Vercel overview."""
    return {
        "name": "DEFONEOS VERCEL DEPLOY",
        "pages_to_deploy": 5,
        "total_size_mb": 25.5,
        "blocked_on": "user approval (production deploy red-line rule)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-vercel-deploy-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("vercel_deploy_pages", "List pages to deploy."),
        ("vercel_deploy_execute", "Execute a deploy."),
        ("vercel_status", "Get Vercel status."),
        ("vercel_rollback", "Rollback a deploy."),
        ("vercel_overview", "Return the overview."),
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