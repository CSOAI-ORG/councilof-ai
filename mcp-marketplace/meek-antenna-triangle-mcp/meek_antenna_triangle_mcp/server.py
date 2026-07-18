#!/usr/bin/env python3
"""
meek-antenna-triangle-mcp — server.py

The 3 brand layers as 3 vertices of a triangle, the sovereign at the centroid.

Tools (5):
  1. antenna_triangle_geometry — return the triangle geometry
  2. three_antennae            — return the 3 antennae (the 3 brand layers)
  3. sovereign_centroid         — return the sovereign entity position
  4. triangle_relationships    — return the 3 edges
  5. antenna_verdict           — return the antenna verdict
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

logger = logging.getLogger("meek_antenna_triangle_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def antenna_triangle_geometry() -> dict:
    """Return the triangle geometry (vertices + centroid)."""
    return {
        "shape": "triangle",
        "vertices": {
            "v1_DEF_ONE_OS": {"x": 0, "y": 1, "label": "DEF ONE OS (SOV3³) - top vertex - defence wedge"},
            "v2_MEOK": {"x": -0.866, "y": -0.5, "label": "MEOK (SOV3) - bottom-left vertex - public substrate"},
            "v3_CSOAI": {"x": 0.866, "y": -0.5, "label": "CSOAI - bottom-right vertex - certification/governance"},
        },
        "centroid": {"x": 0, "y": 0, "label": "the SOVEREIGN sits at the centroid"},
        "edge_length": 1.155,
        "area": 1.299,
        "perimeter": 3.464,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def three_antennae() -> dict:
    """Return the 3 antennae (the 3 brand layers)."""
    return {
        "antennae": [
            {"vertex": 1, "name": "DEF ONE OS (SOV3³)", "function": "defence wedge", "audience": "UK MOD + AUKUS + defence primes", "surface": "5 DEFONEOS MCPs (77 tests)", "pricing": "£25K-£1M+/yr"},
            {"vertex": 2, "name": "MEOK (SOV3)", "function": "public substrate", "audience": "humans + agents + devs + industries", "surface": "30 science MCPs (183 tests)", "pricing": "free + £29-£999/mo"},
            {"vertex": 3, "name": "CSOAI", "function": "certification/governance", "audience": "all", "surface": "DEFONEOS-SEAL + 14-framework audit", "pricing": "£5K-£50K/audit + £1K-£100K/yr"},
        ],
        "total_antennae": 3,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sovereign_centroid() -> dict:
    """Return the sovereign entity position (at centroid)."""
    return {
        "position": "centroid of the triangle (the equilibrium)",
        "x": 0,
        "y": 0,
        "distance_from_each_vertex": 1.155,
        "equilibrium_of_three_forces": {
            "DEF_ONE_OS": "preservation (Vishnu)",
            "MEOK": "creation (Brahma)",
            "CSOAI": "destruction/certification (Shiva)",
        },
        "the_sovereign_is": {
            "orb": "the physical sovereign device",
            "ai": "the sovereign intelligence",
            "user": "Nicholas Templeman (the human sovereign)",
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def triangle_relationships() -> dict:
    """Return the 3 edges (the relationships)."""
    return {
        "edges": [
            {"edge": "v1-v2", "name": "DEF_ONE_OS ↔ MEOK", "function": "the defence wedge uses the public substrate"},
            {"edge": "v2-v3", "name": "MEOK ↔ CSOAI", "function": "the public substrate is certified by CSOAI"},
            {"edge": "v1-v3", "name": "DEF_ONE_OS ↔ CSOAI", "function": "the defence wedge is certified by CSOAI"},
        ],
        "total_edges": 3,
        "total_vertices": 3,
        "total_relationships": 3,
        "verdict": "the triangle = 3 vertices + 3 edges + 1 centroid = 7 points",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def antenna_verdict() -> dict:
    """Return the antenna verdict (triangle_aligned: True/False)."""
    return {
        "triangle_aligned": True,
        "antennae_count": 3,
        "centroid_position": "sovereign at (0, 0)",
        "equilibrium": True,
        "verdict": "THE ANTENNA IS THE TRIANGLE. THE 3 VERTICES = THE 3 BRAND LAYERS. THE SOVEREIGN SITS AT THE CENTROID.",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-antenna-triangle-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="antenna_triangle_geometry", description="Return the triangle geometry.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="three_antennae", description="Return the 3 antennae.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="sovereign_centroid", description="Return the sovereign entity position.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="triangle_relationships", description="Return the 3 edges.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="antenna_verdict", description="Return the antenna verdict.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "antenna_triangle_geometry":
        result = antenna_triangle_geometry()
    elif name == "three_antennae":
        result = three_antennae()
    elif name == "sovereign_centroid":
        result = sovereign_centroid()
    elif name == "triangle_relationships":
        result = triangle_relationships()
    elif name == "antenna_verdict":
        result = antenna_verdict()
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