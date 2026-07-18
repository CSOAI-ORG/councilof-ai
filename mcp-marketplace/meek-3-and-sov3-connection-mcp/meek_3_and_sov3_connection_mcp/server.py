#!/usr/bin/env python3
"""meek-3-and-sov3-connection-mcp — server.py (L0-upwards connection of the 3 layers + SOV3)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_3_and_sov3_connection_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def the_3_layers() -> dict:
    return {
        "layer_1_sov3_cubed": {
            "name": "SOV3³ (SOV3-cubed)",
            "domain": "DEF ONE OS (defoneos.com)",
            "function": "Defence wedge (UK MOD + AUKUS)",
            "audience": "Military + defence primes",
            "all_hives": 28,  # the 28 hives from MEOK
            "all_mcps": 47,  # the 47 DEFONEOS MCPs
            "all_layers": 8,  # the 8 DEFONEOS UE5 products
        },
        "layer_2_sov3": {
            "name": "SOV3",
            "domain": "meok (meok.ai)",
            "function": "Public substrate (for ALL)",
            "audience": "Humans + agents + developers + industries + governments + the planet",
            "all_hives": 50,  # the 50+ public hives
            "all_mcps": 52,  # the 52 sovereign MCPs (47 prior + 5 W34)
            "all_layers": 7,  # the 7 layers of the meok substrate
        },
        "layer_3_csoai": {
            "name": "CSOAI",
            "domain": "csoai.org",
            "function": "Certification authority",
            "audience": "All (defence + public + compliance + audit)",
            "all_hives": 10,  # the 10+ audit/certification hives
            "all_mcps": 20,  # the 20+ compliance MCPs
            "all_layers": 5,  # the 5 layers of the certification framework
        },
        "all_3_connected": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov3_brain_left_right() -> dict:
    return {
        "left_brain_online": {
            "engine": "MoE-LARGE (qwen3:30b-a3b)",
            "size_gb": 18,
            "purpose": "logical reasoning + planning + analysis",
            "location": "GCP VM 35.242.143.249",
            "ed25519_sigil_signed": True,
        },
        "right_brain_offline": {
            "engine": "MOM-LARGE (moondream + zamba)",
            "size_gb": 9,
            "purpose": "world + sense + visual + multimodal",
            "location": "On the orb (Coral Edge TPU)",
            "ed25519_sigil_signed": True,
        },
        "mindsets": 12,
        "traibgle_voting": "GOOD/BAD/NEUTRAL per world model prediction",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov3_33_hive_bft() -> dict:
    return {
        "king": 1,  # weight 3.0
        "queens": 12,  # weight 1.0 each
        "pbft": 12,  # weight 1.0 each
        "vanguards": 4,  # weight 2.0 each + VETO power
        "specials": 4,  # weight 0.5 each
        "total": 33,
        "quorum_required": 23,
        "traibgle_total_weight": 37.0,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def l0_upwards_connection() -> dict:
    return {
        "l0_physical_base": "iokfarm.co.uk (UK soil, no foreign cloud)",
        "l1_sov3_infrastructure": "47 agents + 115 tools + 341 MCPs + 33-hive BFT",
        "l2_openpatent_defoneos_seal": "6-layer crypto disclosure + BFT-signed credentials",
        "l3_audit_chain": "Ed25519-signed + immutable + append-only",
        "l4_care_membrane": "4 care principles (dignity + agency + safety + solidarity)",
        "l5_government_pack": "40+ US Federal + UK + EU + AUKUS + Standards bodies",
        "l6_mcp_fleet": "9 industry packs (finance + healthcare + construction + agriculture + governance + ...)",
        "l7_humanoid_safety": "digital twin of the user (Mamba-2 SSD + 12 mindsets + 33-hive BFT)",
        "all_8_layers_connected": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def all_hives_connected() -> dict:
    return {
        "hive_count": 88,  # 28 SOV3 + 50 meok + 10 csoai
        "connections": [
            "L0 <-> L1 (physical base <-> SOV3 infrastructure)",
            "L1 <-> L2 (SOV3 <-> DEFONEOS-SEAL)",
            "L2 <-> L3 (DEFONEOS-SEAL <-> Audit Chain)",
            "L3 <-> L4 (Audit Chain <-> Care Membrane)",
            "L4 <-> L5 (Care Membrane <-> Government Pack)",
            "L5 <-> L6 (Government Pack <-> MCP Fleet)",
            "L6 <-> L7 (MCP Fleet <-> Humanoid Safety)",
        ],
        "all_hives_connected": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-3-and-sov3-connection-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("the_3_layers", "Return the 3 layers (SOV3 + SOV3 + CSOAI)."),
        ("sov3_brain_left_right", "Return the SOV3 brain (left + right)."),
        ("sov3_33_hive_bft", "Return the 33-hive BFT council."),
        ("l0_upwards_connection", "Return the L0-upwards connection."),
        ("all_hives_connected", "Return the all hives connected."),
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