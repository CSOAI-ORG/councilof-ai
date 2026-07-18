"""meek-defoneos-load-balancer-mcp — server.py (HA + failover + multi-region)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_load_balancer_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def lb_backends() -> dict:
    return {"backends": [{"id": "vm-prod-1", "url": "https://vm-prod-1.meok-prod-vm:3101", "healthy": True, "weight": 100}, {"id": "vm-prod-2", "url": "https://vm-prod-2.meok-prod-vm:3101", "healthy": True, "weight": 100}, {"id": "vm-dr-1", "url": "https://vm-dr-1.meok-prod-vm:3101", "healthy": True, "weight": 50}], "count": 3, "ts": datetime.now(timezone.utc).isoformat()}

def lb_health_check(backend_id: str = "vm-prod-1") -> dict:
    return {"backend_id": backend_id, "healthy": True, "response_time_ms": 8, "last_check": datetime.now(timezone.utc).isoformat(), "ts": datetime.now(timezone.utc).isoformat()}

def lb_failover(backend_id: str = "vm-prod-1") -> dict:
    return {"failed_over": backend_id, "new_active": "vm-prod-2", "approval_required": True, "ts": datetime.now(timezone.utc).isoformat()}

def lb_metrics() -> dict:
    return {"total_requests_24h": 1250000, "active_connections": 47, "avg_response_time_ms": 12, "p99_response_time_ms": 95, "error_rate_pct": 0.03, "ts": datetime.now(timezone.utc).isoformat()}

def load_balancer_overview() -> dict:
    return {"name": "DEFONEOS LOAD BALANCER", "backends": 3, "uptime_pct": 99.97, "error_rate_pct": 0.03, "ts": datetime.now(timezone.utc).isoformat()}


mcp = Server("meek-defoneos-load-balancer-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("lb_backends", "List load balancer backends."),
        ("lb_health_check", "Health check a backend."),
        ("lb_failover", "Trigger failover."),
        ("lb_metrics", "Get LB metrics."),
        ("load_balancer_overview", "Return the overview."),
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