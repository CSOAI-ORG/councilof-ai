"""meek-defoneos-knowledge-pack-mcp — server.py (3 whitepapers + 18 datasheets + datasets + licensing)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_defoneos_knowledge_pack_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def whitepapers_list() -> dict:
    """List the 3 whitepapers."""
    return {
        "whitepapers": [
            {"id": "wp_001", "title": "DEFONEOS Architecture", "size_kb": 11, "license": "CC-BY-4.0", "pages": 25, "summary": "the meok substrate + DEFONEOS upper wedge + Legacy Bridge + 4 care principles + 33-agent BFT council + 14-framework audit + supply-chain sovereignty"},
            {"id": "wp_002", "title": "DEFONEOS Legacy Bridge", "size_kb": 7.9, "license": "CC-BY-4.0", "pages": 18, "summary": "the 13-MCP migration path (COBOL -> A2A -> DEFONEOS-SEAL) + 4 steps + 90-day pilot + buyer journey"},
            {"id": "wp_003", "title": "DEFONEOS Simulation Framework", "size_kb": 3.6, "license": "CC-BY-4.0", "pages": 8, "summary": "5 BFT scenario tests + sovereign-town synthetic world + asimov-v8 humanoid digital twin"},
        ],
        "count": 3,
        "total_size_kb": 22.5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def datasheets_list() -> dict:
    """List the 18 datasheets (5 DEFONEOS MCPs + 13 Legacy Bridges)."""
    return {
        "datasheets": [
            {"id": "ds_001", "mcp": "meek-defoneos-mcp", "type": "DEFONEOS", "license": "MIT", "version": "1.0.0", "tools": 6, "tests": 14},
            {"id": "ds_002", "mcp": "csoai-defoneos-mcp", "type": "DEFONEOS", "license": "MIT", "version": "1.0.0", "tools": 6, "tests": 13},
            {"id": "ds_003", "mcp": "councilof-mcp", "type": "DEFONEOS", "license": "MIT", "version": "1.0.0", "tools": 6, "tests": 14},
            {"id": "ds_004", "mcp": "meok-defoneos-geospatial-intel-mcp", "type": "DEFONEOS", "license": "MIT", "version": "1.0.0", "tools": 6, "tests": 17},
            {"id": "ds_005", "mcp": "meok-os-mcp", "type": "DEFONEOS", "license": "MIT", "version": "1.0.0", "tools": 6, "tests": 16},
            {"id": "ds_006", "mcp": "cobol-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_007", "mcp": "as400-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_008", "mcp": "cics-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_009", "mcp": "dlms-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_010", "mcp": "edi-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_011", "mcp": "iso20022-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_012", "mcp": "iso8583-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_013", "mcp": "acord-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_014", "mcp": "hl7-fhir-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_015", "mcp": "gs1-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_016", "mcp": "mismo-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_017", "mcp": "mqtt-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
            {"id": "ds_018", "mcp": "a2a-governance-bridge-mcp", "type": "Legacy Bridge", "license": "MIT", "version": "1.0.0"},
        ],
        "count": 18,
        "defoneos_count": 5,
        "legacy_bridge_count": 13,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def datasets_list() -> dict:
    """List the datasets in the knowledge pack."""
    return {
        "datasets": [
            {"name": "Land Registry price_paid", "size_gb": 5.1, "license": "OGL-3.0", "rows": "30M transactions"},
            {"name": "Companies House basic-company-data", "size_gb": 3.1, "license": "OGL-3.0", "rows": "5M+ companies"},
            {"name": "Companies House PSC", "size_gb": 6.1, "license": "OGL-3.0", "rows": "15.6M records"},
            {"name": "OS Open Names", "size_gb": 2.3, "license": "OGL-3.0", "rows": "2.5M GB place names"},
            {"name": "DfT Road Traffic Counts", "size_gb": 1.1, "license": "OGL-3.0"},
            {"name": "EA Waste Data 2023", "size_gb": 0.065, "license": "OGL-3.0"},
            {"name": "HSE Construction Safety RIDDOR + Costs", "size_gb": 0.000312, "license": "OGL-3.0"},
            {"name": "Met Office Station Data", "size_gb": 0.0021, "license": "OGL-3.0"},
        ],
        "total_size_gb": 17.8,
        "license": "OGL-3.0 (Open Government Licence)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def licensing_list() -> dict:
    """List the 7 licensing tiers."""
    return {
        "tiers": [
            {"tier": "MIT", "price": "Free", "scope": "everyone"},
            {"tier": "meok consumer", "price": "£0-£499/mo", "scope": "personal + small team"},
            {"tier": "csoai certification pilot", "price": "£5K-£25K", "scope": "90-day pilot"},
            {"tier": "csoai enterprise", "price": "£100K-£500K", "scope": "annual enterprise"},
            {"tier": "DEFONEOS wedge", "price": "£25K-£1M+", "scope": "UK MOD + AUKUS Pillar 2"},
            {"tier": "per-transaction toll", "price": "£0.01-£5.00/tx", "scope": "micro-payment"},
            {"tier": "humanoids L7", "price": "£500/robot/mo", "scope": "per-humanoid"},
        ],
        "count": 7,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def knowledge_pack_overview() -> dict:
    """Return the knowledge pack overview."""
    return {
        "name": "DEFONEOS KNOWLEDGE PACK",
        "whitepapers": 3,
        "datasheets": 18,
        "datasets": 8,
        "licensing_tiers": 7,
        "total_size_kb": 22500,  # 3 whitepapers (22.5 KB) + 18 datasheets (~30 KB each)
        "license": "CC-BY-4.0 + OGL-3.0 + MIT",
        "url": "https://defoneos.com/knowledge-pack",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-defoneos-knowledge-pack-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("whitepapers_list", "List the 3 whitepapers."),
        ("datasheets_list", "List the 18 datasheets."),
        ("datasets_list", "List the datasets."),
        ("licensing_list", "List the 7 licensing tiers."),
        ("knowledge_pack_overview", "Return the overview."),
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