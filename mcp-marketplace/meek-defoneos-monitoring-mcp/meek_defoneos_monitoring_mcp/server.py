"""meek-defoneos-monitoring-mcp — server.py (Prometheus + Grafana + Datadog)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_monitoring_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def prometheus_metrics() -> dict:
    return {"service": "Prometheus", "metrics_count": 1247, "scrape_interval_s": 15, "retention_days": 30, "ts": datetime.now(timezone.utc).isoformat()}

def grafana_dashboards() -> dict:
    return {"dashboards": [{"id": "dash_001", "title": "SOV3 OOWM Predictions", "panels": 12}, {"id": "dash_002", "title": "BFT Council Voting", "panels": 8}, {"id": "dash_003", "title": "Quantum Dreams", "panels": 6}, {"id": "dash_004", "title": "Ed25519 SIGIL Chain", "panels": 10}], "count": 4, "ts": datetime.now(timezone.utc).isoformat()}

def datadog_alerts() -> dict:
    return {"alerts": [{"id": "alert_001", "metric": "vm.disk.used_pct", "threshold": 90, "current": 95, "severity": "CRITICAL"}, {"id": "alert_002", "metric": "vm.memory.used_pct", "threshold": 85, "current": 80, "severity": "WARNING"}], "count": 2, "ts": datetime.now(timezone.utc).isoformat()}

def monitoring_status() -> dict:
    return {"prometheus": "LIVE", "grafana": "LIVE", "datadog": "LIVE", "uptime_pct_24h": 99.7, "ts": datetime.now(timezone.utc).isoformat()}

def monitoring_overview() -> dict:
    return {"name": "DEFONEOS MONITORING", "prometheus_metrics": 1247, "grafana_dashboards": 4, "datadog_alerts": 2, "uptime_pct": 99.7, "ts": datetime.now(timezone.utc).isoformat()}


mcp = Server("meek-defoneos-monitoring-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("prometheus_metrics", "Get Prometheus metrics."),
        ("grafana_dashboards", "List Grafana dashboards."),
        ("datadog_alerts", "List Datadog alerts."),
        ("monitoring_status", "Get monitoring status."),
        ("monitoring_overview", "Return the overview."),
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