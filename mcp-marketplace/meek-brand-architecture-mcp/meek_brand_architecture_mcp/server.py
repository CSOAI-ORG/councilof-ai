#!/usr/bin/env python3
"""
meek-brand-architecture-mcp — server.py

The 3-layer brand orchestrator (SOV3³ + SOV3 + CSOAI).

Tools (5):
  1. brand_layers              — return the 3-layer brand architecture
  2. sov3_defense_os           — return the SOV3³ DEF ONE OS details
  3. sov3_public_substrate     — return the SOV3 meok details
  4. csoai_certification       — return the CSOAI csoai.org details
  5. combined_revenue_forecast — compute the combined Year 3 ARR
"""
from __future__ import annotations

import math
import re
import json
import logging
from datetime import datetime, timezone

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_brand_architecture_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def brand_layers() -> dict:
    """Return the 3-layer brand architecture."""
    return {
        "layers": [
            {"layer": 1, "brand": "SOV3³ (SOV3-cubed)", "domain": "DEF ONE OS (defoneos.com)", "function": "defence wedge (UK MOD + AUKUS)", "audience": "military + defence + AUKUS", "license": "UK sovereign", "pricing": "£25K-£1M+/yr"},
            {"layer": 2, "brand": "SOV3", "domain": "meok (meok.ai)", "function": "public substrate", "audience": "humans + agents + devs + industries", "license": "MIT + commercial", "pricing": "free + £29-£999/mo"},
            {"layer": 3, "brand": "CSOAI (CSOAI LTD UK 16939677)", "domain": "csoai.org", "function": "certification authority (DEFONEOS-SEAL)", "audience": "all", "license": "certification", "pricing": "£5K-£50K/audit + £1K-£100K/yr"},
        ],
        "total_layers": 3,
        "total_mcps": 36,
        "total_tests": 270,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov3_defense_os() -> dict:
    """Return the SOV3³ DEF ONE OS details."""
    return {
        "brand": "SOV3³ (SOV3-cubed)",
        "domain": "defoneos.com",
        "function": "UK sovereign defence AI OS",
        "surface": "5 DEFONEOS MCPs (77 tests)",
        "audience": "UK MOD, AUKUS Pillar 2, defence primes, NATO, Five Eyes",
        "license": "UK sovereign + DEFONEOS-SEAL signed",
        "pricing": {
            "pilot_gbp": 25000,
            "enterprise_gbp_per_yr": "100K-500K",
            "aukus_gbp_per_yr": "1M+",
            "nato_five_eyes_gbp_per_yr": "5M+",
        },
        "key_features": [
            "33-hive BFT council",
            "3 hard stops (severed brands + kinetic + surveillance)",
            "14-framework compliance (EU AI Act + NIST + ISO + DAIC + AUKUS Pillar 2 + ...)",
            "SkyWater 130nm chip (sovereign core)",
            "5-radio mesh + 4VF circulatory + dual-brain",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov3_public_substrate() -> dict:
    """Return the SOV3 meok details."""
    return {
        "brand": "SOV3",
        "domain": "meok.ai",
        "function": "Public AI substrate",
        "surface": "30 science MCPs (183 tests) + 9 industry packs",
        "audience": "humans + agents + developers + industries + governments + the planet",
        "license": "Open-source MIT + commercial tier",
        "pricing": {
            "free": 0,
            "pro_gbp_per_mo": 29,
            "team_gbp_per_mo": 99,
            "enterprise_gbp_per_mo": 999,
            "industry_packs_gbp_per_yr": "10M+ aggregate",
        },
        "key_features": [
            "9 industry packs (finance + healthcare + construction + agriculture + governance + ...)",
            "Sovereign bridge (COBOL + AS400 + CICS + ...)",
            "Capillary cooling + 5D silica + dry DNA",
            "Mamba-2 + MoE + DeepSeek V4 + Mistral",
            "Hybrid roadmap (MOD first + BUILD only the unique)",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def csoai_certification() -> dict:
    """Return the CSOAI csoai.org details."""
    return {
        "brand": "CSOAI",
        "legal": "CSOAI LTD (UK 16939677)",
        "domain": "csoai.org",
        "function": "Sovereign AI certification authority",
        "surface": "DEFONEOS-SEAL signed credentials + 14-framework audit + MITRE ATLAS crosswalk + EU AI Act compliance",
        "audience": "all (defence + public + compliance + audit)",
        "license": "Certification services",
        "pricing": {
            "per_audit_gbp": "5K-50K",
            "annual_subscription_gbp": "1K-100K",
        },
        "key_features": [
            "DEFONEOS-SEAL signed credentials (Ed25519 SIGIL)",
            "14-framework audit (EU AI Act 2026 + NIST AI RMF + ISO 42001 + MITRE ATLAS + ...)",
            "Audit chain (immutable + Ed25519 signed)",
            "MITRE ATLAS crosswalk (adversarial ML)",
            "Sovereign (UK soil, no foreign deps)",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def combined_revenue_forecast(
    sov3_defense_customers: int = 5,
    sov3_defense_arr_per_customer_gbp: int = 500000,
    sov3_pro_users: int = 100000,
    sov3_pro_price_per_mo_gbp: int = 29,
    sov3_team_teams: int = 10000,
    sov3_team_price_per_mo_gbp: int = 99,
    sov3_enterprise_orgs: int = 1000,
    sov3_enterprise_price_per_mo_gbp: int = 999,
    csoai_audits_per_yr: int = 100,
    csoai_audit_price_gbp: int = 50000,
    csoai_subscribers: int = 1000,
    csoai_sub_price_per_yr_gbp: int = 10000,
) -> dict:
    """Compute the combined Year 3 ARR."""
    sov3_defense_arr = sov3_defense_customers * sov3_defense_arr_per_customer_gbp
    sov3_pro_arr = sov3_pro_users * sov3_pro_price_per_mo_gbp * 12
    sov3_team_arr = sov3_team_teams * sov3_team_price_per_mo_gbp * 12
    sov3_enterprise_arr = sov3_enterprise_orgs * sov3_enterprise_price_per_mo_gbp * 12
    sov3_total_arr = sov3_defense_arr + sov3_pro_arr + sov3_team_arr + sov3_enterprise_arr
    csoai_audits_arr = csoai_audits_per_yr * csoai_audit_price_gbp
    csoai_subs_arr = csoai_subscribers * csoai_sub_price_per_yr_gbp
    csoai_total_arr = csoai_audits_arr + csoai_subs_arr
    grand_total_arr = sov3_total_arr + csoai_total_arr
    return {
        "year": 3,
        "sov3_defense_arr_gbp": sov3_defense_arr,
        "sov3_public_arr_gbp": sov3_total_arr - sov3_defense_arr,
        "sov3_total_arr_gbp": sov3_total_arr,
        "csoai_total_arr_gbp": csoai_total_arr,
        "grand_total_arr_gbp": grand_total_arr,
        "verdict": f"£{grand_total_arr/1e6:.1f}M ARR (Year 3)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-brand-architecture-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="brand_layers", description="Return the 3-layer brand architecture.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="sov3_defense_os", description="Return the SOV3³ DEF ONE OS details.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="sov3_public_substrate", description="Return the SOV3 meok details.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="csoai_certification", description="Return the CSOAI csoai.org details.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="combined_revenue_forecast", description="Compute the combined Year 3 ARR.", inputSchema={"type": "object", "properties": {"sov3_defense_customers": {"type": "integer", "default": 5}, "sov3_pro_users": {"type": "integer", "default": 100000}, "sov3_team_teams": {"type": "integer", "default": 10000}, "sov3_enterprise_orgs": {"type": "integer", "default": 1000}, "csoai_audits_per_yr": {"type": "integer", "default": 100}, "csoai_subscribers": {"type": "integer", "default": 1000}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "brand_layers":
        result = brand_layers()
    elif name == "sov3_defense_os":
        result = sov3_defense_os()
    elif name == "sov3_public_substrate":
        result = sov3_public_substrate()
    elif name == "csoai_certification":
        result = csoai_certification()
    elif name == "combined_revenue_forecast":
        result = combined_revenue_forecast(**arguments)
    else:
        return [TextContent(type="text", text=json.dumps({"error": f"unknown tool: {name}"}))]
    return [TextContent(type="text", text=json.dumps(result, indent=2))]


async def main():
    if not mcp or not stdio_server:
        raise RuntimeError("mcp package not installed")
    async with stdio_server() as (read_stream, write_stream):
        await mcp.run(read_stream, write_stream, mcp.create_initialization_options())


if __name__ == "__main__":
    import asyncio
    asyncio.run(main())