"""meek-defoneos-pricing-mcp — server.py (the 7-tier licensing model)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_pricing_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def pricing_tiers() -> dict:
    """Return the 7 pricing tiers."""
    return {
        "tiers": [
            {"tier": 1, "name": "Open-source MIT", "price_gbp_month": 0, "description": "Free for everyone (humans + agents + developers + students)"},
            {"tier": 2, "name": "meok consumer", "price_gbp_month_range": "0-499", "description": "Personal use + small team + SaaS tool access"},
            {"tier": 3, "name": "csoai certification pilot", "price_gbp_range": "5000-25000", "description": "90-day pilot + DEFONEOS-SEAL signed credential"},
            {"tier": 4, "name": "csoai enterprise", "price_gbp_range": "100000-500000", "description": "Annual enterprise license + 24/7 support"},
            {"tier": 5, "name": "DEFONEOS wedge", "price_gbp_range": "25000-1000000", "description": "UK MOD + AUKUS Pillar 2 + defence primes"},
            {"tier": 6, "name": "per-transaction toll", "price_gbp_range": "0.01-5.00", "description": "Per-transaction micro-payment (regulatory checks)"},
            {"tier": 7, "name": "humanoids L7", "price_gbp_month_range": "500/robot/month", "description": "Per-humanoid-robot monthly license"},
        ],
        "count": 7,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pricing_get(tier: int = 1) -> dict:
    """Get a specific pricing tier."""
    tiers = pricing_tiers()["tiers"]
    if tier < 1 or tier > 7:
        return {"error": f"tier {tier} not found (must be 1-7)"}
    return tiers[tier - 1]


def pricing_year_3_forecast() -> dict:
    """Return the Year 3 ARR forecast."""
    return {
        "year_3_forecast_gbp": 76200000,
        "year_3_forecast_components": [
            {"component": "Open-source MIT", "revenue_gbp": 0},
            {"component": "meok consumer (1000 users x £250/month)", "revenue_gbp": 3000000},
            {"component": "csoai certification (50 pilots x £15K avg)", "revenue_gbp": 750000},
            {"component": "csoai enterprise (20 clients x £300K avg)", "revenue_gbp": 6000000},
            {"component": "DEFONEOS wedge (5 primes x £500K avg)", "revenue_gbp": 2500000},
            {"component": "per-transaction toll (1M tx x £50 avg)", "revenue_gbp": 50000000},
            {"component": "humanoids L7 (1000 robots x £500/month)", "revenue_gbp": 6000000},
        ],
        "total_revenue_gbp": 76200000,
        "year": 3,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pricing_competitor_comparison() -> dict:
    """Return competitor pricing comparison."""
    return {
        "competitors": [
            {"vendor": "Palantir Foundry", "annual_price_gbp": 8000000, "deployment": "US cloud", "sovereign": False},
            {"vendor": "Salesforce Einstein", "annual_price_gbp": 1500000, "deployment": "US cloud", "sovereign": False},
            {"vendor": "Snowflake", "annual_price_gbp": 1000000, "deployment": "US cloud", "sovereign": False},
            {"vendor": "AWS Bedrock", "annual_price_gbp": 500000, "deployment": "US cloud", "sovereign": False},
            {"vendor": "DEFONEOS (us)", "annual_price_gbp": "£100K-£1M", "deployment": "UK soil (London)", "sovereign": True},
        ],
        "competitive_advantage": "100% UK sovereign + 90-day pilot + DEFONEOS-SEAL signed credential + MIT open-source",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def pricing_overview() -> dict:
    """Return the pricing overview."""
    return {
        "name": "DEFONEOS PRICING",
        "tiers": 7,
        "year_3_arr_forecast_gbp": 76200000,
        "competitive_advantage": "100% UK sovereign + 90-day pilot + DEFONEOS-SEAL + MIT open-source",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-pricing-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("pricing_tiers", "Return the 7 pricing tiers."),
        ("pricing_get", "Get a specific tier."),
        ("pricing_year_3_forecast", "Return the Year 3 forecast."),
        ("pricing_competitor_comparison", "Return competitor comparison."),
        ("pricing_overview", "Return the overview."),
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