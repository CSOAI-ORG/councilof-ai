#!/usr/bin/env python3
"""
meek-sacred-geometry-mcp — server.py

Silver/gold triangle connectors + Traibgle voting geometry + 5-radio per vertex.

Tools (6):
  1. tetrahedron_connector    — return the tetrahedron connector specs
  2. octahedron_connector     — return the octahedron connector specs
  3. icosahedron_connector    — return the icosahedron connector specs
  4. traibgle_voting           — return the Traibgle voting math + verdict
  5. five_radio_per_vertex     — return the 5-radio per vertex module
  6. synergy_verdict           — return the synergy verdict
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

logger = logging.getLogger("meek_sacred_geometry_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def tetrahedron_connector(edge_mm: float = 5.0) -> dict:
    """Return the tetrahedron connector specs."""
    vertices = 4
    faces = 4
    edges = 6
    volume = (math.sqrt(2) / 12) * (edge_mm ** 3)
    return {
        "shape": "tetrahedron",
        "vertices": vertices,
        "faces": faces,
        "edges": edges,
        "volume_mm3": volume,
        "edge_mm": edge_mm,
        "materials": "Silver + Gold",
        "use": "L3 chip + L0 gold spiral (the fundamental resonance layer)",
        "radios_per_orb": vertices * 5,
        "cost_per_orb_gbp": vertices * 15,
        "synergy": "the simplest 3D shape = the foundation",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def octahedron_connector(edge_mm: float = 5.0) -> dict:
    """Return the octahedron connector specs."""
    vertices = 6
    faces = 8
    edges = 12
    volume = (math.sqrt(2) / 3) * (edge_mm ** 3)
    return {
        "shape": "octahedron",
        "vertices": vertices,
        "faces": faces,
        "edges": edges,
        "volume_mm3": volume,
        "edge_mm": edge_mm,
        "materials": "Silver + Gold + Copper",
        "use": "L4 hive spiral (the Schumann resonance layer)",
        "radios_per_orb": vertices * 5,
        "cost_per_orb_gbp": vertices * 15,
        "synergy": "8 triangles = the 8-bit byte = the digital layer",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def icosahedron_connector(edge_mm: float = 5.0) -> dict:
    """Return the icosahedron connector specs."""
    vertices = 12
    faces = 20
    edges = 30
    phi = (1 + math.sqrt(5)) / 2
    volume = (5 * (3 + math.sqrt(5)) / 12) * (edge_mm ** 3)
    return {
        "shape": "icosahedron",
        "vertices": vertices,
        "faces": faces,
        "edges": edges,
        "volume_mm3": volume,
        "edge_mm": edge_mm,
        "materials": "Silver + Gold + Platinum",
        "use": "L5 laser processing (the water memory layer)",
        "radios_per_orb": vertices * 5,
        "cost_per_orb_gbp": vertices * 15,
        "synergy": "20 triangles = the water molecule's 4 + 16 vibrational modes = the water layer",
        "phi_ratio": phi,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def traibgle_voting(
    good_voters: int = 12,
    bad_voters: int = 4,
    neutral_voters: int = 8,
    good_weight: float = 1.0,
    bad_weight: float = 1.0,
    neutral_weight: float = 0.5,
    total_voter_weight: float = 37.0,
) -> dict:
    """Return the Traibgle voting math + verdict."""
    good_total = good_voters * good_weight
    bad_total = bad_voters * bad_weight
    neutral_total = neutral_voters * neutral_weight
    total = good_total + bad_total + neutral_total
    traibgle_score = (good_total - bad_total) / total_voter_weight if total_voter_weight > 0 else 0
    if traibgle_score > 0.5:
        verdict = "APPROVED"
    elif traibgle_score < -0.5:
        verdict = "REFUSED"
    else:
        verdict = "PENDING"
    return {
        "geometry": "traibgle",
        "axes": ["GOOD (yes vote)", "BAD (no vote)", "NEUTRAL (abstain)"],
        "good_voters": good_voters,
        "bad_voters": bad_voters,
        "neutral_voters": neutral_voters,
        "good_total_weight": good_total,
        "bad_total_weight": bad_total,
        "neutral_total_weight": neutral_total,
        "traibgle_score": traibgle_score,
        "verdict": verdict,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def five_radio_per_vertex(num_vertices: int = 4) -> dict:
    """Return the 5-radio per vertex module."""
    radios = {
        "lora_sx1276": {"freq_mhz": 868, "range_m": 10000, "power_mw": 25, "cost_gbp": 3, "purpose": "long-range mesh"},
        "wifi_esp32_c6": {"freq_ghz": 2.4, "range_m": 200, "power_mw": 100, "cost_gbp": 3, "purpose": "high-bandwidth mesh"},
        "ble_nrf52840": {"freq_ghz": 2.4, "range_m": 100, "power_mw": 10, "cost_gbp": 2, "purpose": "short-range mesh"},
        "sigil_cc1101": {"freq_mhz": 433, "range_m": 100, "power_mw": 5, "cost_gbp": 2, "purpose": "sovereign signing"},
        "uwb_dw3000": {"freq_ghz": 7, "range_m": 10, "power_mw": 50, "cost_gbp": 5, "purpose": "precise positioning"},
    }
    total_radios = num_vertices * 5
    total_cost = num_vertices * 15
    return {
        "radios_per_vertex": 5,
        "radios": radios,
        "total_radios": total_radios,
        "total_cost_per_orb_gbp": total_cost,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def synergy_verdict() -> dict:
    """Return the synergy verdict."""
    return {
        "sacred_geometry_aligned": True,
        "traibgle_voting_aligned": True,
        "five_radio_per_vertex_aligned": True,
        "verdict": "THE SACRED GEOMETRY CONNECTORS + TRAIBGLE ARE ALIGNED. The inner sovereign architecture is geometrically optimized.",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-sacred-geometry-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="tetrahedron_connector", description="Return the tetrahedron connector specs.", inputSchema={"type": "object", "properties": {"edge_mm": {"type": "number", "default": 5.0}}, "required": []}),
        Tool(name="octahedron_connector", description="Return the octahedron connector specs.", inputSchema={"type": "object", "properties": {"edge_mm": {"type": "number", "default": 5.0}}, "required": []}),
        Tool(name="icosahedron_connector", description="Return the icosahedron connector specs.", inputSchema={"type": "object", "properties": {"edge_mm": {"type": "number", "default": 5.0}}, "required": []}),
        Tool(name="traibgle_voting", description="Return the Traibgle voting math + verdict.", inputSchema={"type": "object", "properties": {"good_voters": {"type": "integer", "default": 12}, "bad_voters": {"type": "integer", "default": 4}, "neutral_voters": {"type": "integer", "default": 8}}, "required": []}),
        Tool(name="five_radio_per_vertex", description="Return the 5-radio per vertex module.", inputSchema={"type": "object", "properties": {"num_vertices": {"type": "integer", "default": 4}}, "required": []}),
        Tool(name="synergy_verdict", description="Return the synergy verdict.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "tetrahedron_connector":
        result = tetrahedron_connector(**arguments)
    elif name == "octahedron_connector":
        result = octahedron_connector(**arguments)
    elif name == "icosahedron_connector":
        result = icosahedron_connector(**arguments)
    elif name == "traibgle_voting":
        result = traibgle_voting(**arguments)
    elif name == "five_radio_per_vertex":
        result = five_radio_per_vertex(**arguments)
    elif name == "synergy_verdict":
        result = synergy_verdict()
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