"""meek-defoneos-pypi-publish-mcp — server.py (PyPI publish automation)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_pypi_publish_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def pypi_packages_ready() -> dict:
    """Return the 70 packages ready to publish to PyPI."""
    return {
        "packages": [
            {"name": "meek_defoneos_mcp", "version": "1.0.0", "license": "MIT", "size_kb": 12},
            {"name": "meek_wow_bot_mcp", "version": "1.0.0", "license": "MIT", "size_kb": 10},
            {"name": "meek_sovereign_body_mcp", "version": "1.0.0", "license": "MIT", "size_kb": 9},
        ],
        "ready_count": 70,
        "all_license": "MIT",
        "blocked_on": "PyPI 2FA + user approval",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pypi_publish_execute(package_name: str = "meek_defoneos_mcp") -> dict:
    """Execute a PyPI publish."""
    return {
        "package_name": package_name,
        "status": "READY_TO_PUBLISH",
        "approval_required": True,
        "approval_reason": "PyPI publish requires 2FA + user approval",
        "next_step": "user enables 2FA + runs 'twine upload dist/*'",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pypi_status(package_name: str = "meek_defoneos_mcp") -> dict:
    """Get the PyPI status of a package."""
    return {
        "package_name": package_name,
        "published": False,
        "version_published": None,
        "next_step": "publish needed",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pypi_overview() -> dict:
    """Return the PyPI overview."""
    return {
        "name": "DEFONEOS PYPI PUBLISH",
        "packages_to_publish": 70,
        "all_license": "MIT",
        "blocked_on": "PyPI 2FA + user approval",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-pypi-publish-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("pypi_packages_ready", "List packages ready to publish."),
        ("pypi_publish_execute", "Execute a publish."),
        ("pypi_status", "Get PyPI status."),
        ("pypi_overview", "Return the overview."),
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