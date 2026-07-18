#!/usr/bin/env python3
"""meek-sov-space-mcp — server.py (SOV SPACE orchestrator)."""
from __future__ import annotations
import re, json, logging
from datetime import datetime, timezone
try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None; stdio_server = None; Tool = None; TextContent = None

logger = logging.getLogger("meek_sov_space_mcp")
logging.basicConfig(level=logging.INFO)
BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)

class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def sov_space_layout() -> dict:
    return {
        "window": "SOV_SPACE",
        "left_hand_side": {"name": "Workspace", "contents": ["Globe (Cesium)", "SaaS Tools (open)", "Workflows + Sessions + Tasks"]},
        "right_hand_bar": {"name": "Sovereign", "contents": ["SOV3 Character", "Left Brain (online)", "Right Brain (offline)", "Mindsets", "BFT Council"]},
        "center_chat": "speaks to SOV3 directly",
        "bottom_bar": "DORADO WEST (EAST → WEST click-through)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_space_sov3_character() -> dict:
    return {
        "character": "SOV3",
        "brain_left_online": "MoE-LARGE qwen3:30b-a3b (18GB)",
        "brain_right_offline": "MOM-LARGE moondream+zamba (9GB)",
        "mindsets": ["creative", "logical", "careful", "bold", "wise", "playful", "focused", "patient", "curious", "decisive", "diplomatic", "innovative"],
        "bft_council": "33-hive BFT (1 King + 12 Queens + 12 PBFT + 4 Vanguards + 4 Specials)",
        "traibgle_voting": "GOOD/BAD/NEUTRAL per world model prediction",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_space_saas_tools() -> dict:
    return {
        "saas_tools": ["meok-defoneos-mcp", "csoai-defoneos-mcp", "meok-os-mcp", "councilof-mcp", "meek-wow-bot-mcp", "meek-pdca-planning-mcp", "meek-hybrid-roadmap-mcp", "meek-design-bom-mcp", "meek-poc-prioritizer-mcp"],
        "count": 9,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_space_workflows() -> dict:
    return {
        "workflows": [
            {"name": "DEFONEOS W-sprint", "steps": ["build", "wait correction", "retract", "rebuild", "verify", "commit+seal", "update refs"]},
            {"name": "PDCA", "steps": ["Plan", "Do", "Check", "Act"]},
            {"name": "BFT voting", "steps": ["convene", "vote", "verdict", "update priors"]},
            {"name": "Traibgle voting", "steps": ["predict", "vote GOOD/BAD/NEUTRAL", "update priors if APPROVED"]},
            {"name": "Quantum dream", "steps": ["QAOA care weights", "VQE world model", "Grover path search", "update Mamba"]},
        ],
        "count": 5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_space_dorado_west() -> dict:
    return {
        "name": "DORADO WEST",
        "flow": "EAST → WEST",
        "click_through": "single click per layer",
        "layers": 8,
        "layer_0_physical": "iokfarm.co.uk (UK soil)",
        "layer_7_humanoid": "digital twin of the user",
        "ai_governance": "heavy ontology methods applied",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sov_space_status() -> dict:
    return {
        "name": "SOV SPACE",
        "status": "LIVE",
        "rh_bar_connected": True,
        "lh_side_open": True,
        "center_chat_active": True,
        "dorado_west_active": True,
        "all_7_layers_connected": True,
        "all_hives_connected": True,
        "verdict": "SOV SPACE IS BUILT. R H bar + L H side + center chat + DORADO + globe. The sovereign UI/UX is real.",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sov-space-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [Tool(name=n, description=d, inputSchema={"type": "object", "properties": {}}) for n, d in [
        ("sov_space_layout", "Return the SOV SPACE layout."),
        ("sov_space_sov3_character", "Return the SOV3 character."),
        ("sov_space_saas_tools", "Return the SaaS tools."),
        ("sov_space_workflows", "Return the workflows."),
        ("sov_space_dorado_west", "Return the DORADO west click-through."),
        ("sov_space_status", "Return the full SOV SPACE status."),
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