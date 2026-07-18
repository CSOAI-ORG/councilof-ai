#!/usr/bin/env python3
"""
meek-poc-prioritizer-mcp — server.py

The TOP 10 most feasible findings + the CHEAPEST bootstrap path.

Tools (6):
  1. top_findings           — return the TOP 10 most feasible findings
  2. cheapest_bootstrap     — return the cheapest bootstrap path
  3. poc_roadmap            — return the POC roadmap (Phase 0-6)
  4. tools_kit              — return the TOP 10 tools to use
  5. cost_calculator        — calculate the cost
  6. feasibility_scorer     — score a new finding
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

logger = logging.getLogger("meek_poc_prioritizer_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def top_findings() -> dict:
    """Return the TOP 10 most feasible findings (sorted by score)."""
    findings = [
        {"rank": 1, "finding": "SOV3 sovereign orchestration", "mcp": "meek-sov3-orchestrator-mcp", "impact": 10, "feasibility": 10, "cost_gbp": 0, "score": float("inf")},
        {"rank": 2, "finding": "Multi-frequency orb mesh", "mcp": "meek-orb-mesh-mcp", "impact": 9, "feasibility": 9, "cost_gbp": 15, "score": 5.4},
        {"rank": 3, "finding": "WiFi CSI through-wall detection", "mcp": "meek-wifi-csi-mcp", "impact": 8, "feasibility": 10, "cost_gbp": 121, "score": 0.66},
        {"rank": 4, "finding": "LoRa passive radar", "mcp": "meek-lora-radar-mcp", "impact": 8, "feasibility": 9, "cost_gbp": 20, "score": 3.6},
        {"rank": 5, "finding": "Counter-drone stack (HackRF)", "mcp": "meek-lora-radar-mcp + meek-wifi-csi-mcp + meek-stone-soup-mcp", "impact": 9, "feasibility": 7, "cost_gbp": 250, "score": 0.25},
        {"rank": 6, "finding": "5D silica memory disc", "mcp": "meek-silica-memory-mcp", "impact": 9, "feasibility": 5, "cost_gbp": 2900, "score": 0.016},
        {"rank": 7, "finding": "MCMB capillary muscle orb", "mcp": "meek-capillary-actuator-mcp", "impact": 8, "feasibility": 5, "cost_gbp": 43, "score": 0.93},
        {"rank": 8, "finding": "33-hive BFT council", "mcp": "councilof-mcp", "impact": 9, "feasibility": 8, "cost_gbp": 0, "score": float("inf")},
        {"rank": 9, "finding": "Ed25519 SIGIL signing", "mcp": "csoai-defoneos-mcp", "impact": 8, "feasibility": 9, "cost_gbp": 0, "score": float("inf")},
        {"rank": 10, "finding": "Thermoelectric energy harvester", "mcp": "meek-energy-harvester-mcp", "impact": 7, "feasibility": 6, "cost_gbp": 50, "score": 0.84},
    ]
    return {
        "findings": findings,
        "total_count": len(findings),
        "zero_cost_count": sum(1 for f in findings if f["cost_gbp"] == 0),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cheapest_bootstrap() -> dict:
    """Return the cheapest bootstrap path ($0 to £1K)."""
    return {
        "phases": [
            {"phase": 0, "name": "$0 POC", "cost_gbp": 0, "time_days": 1, "components": ["SOV3 orchestration", "33-hive BFT council", "Ed25519 SIGIL signing"], "tools": ["existing MCPs on the VM"]},
            {"phase": 1, "name": "£121 POC", "cost_gbp": 121, "time_days": 7, "components": ["1× ESP32 + 1× LoRa + 1× Raspberry Pi 4 + 1× Coral USB TPU"], "tools": ["WiFi CSI", "LoRa passive radar", "SOV3 connection"]},
            {"phase": 2, "name": "£250 POC", "cost_gbp": 250, "time_days": 10, "components": ["1× HackRF One clone + 1× BladeRF + 1× PlutoSDR"], "tools": ["counter-drone stack", "EW"]},
            {"phase": 3, "name": "£43 POC", "cost_gbp": 43, "time_days": 14, "components": ["1× MCMB kit (PVA/PDMS + Pt + PFA) + 1× EO controller"], "tools": ["MCMB muscle orb", "electroosmotic control"]},
            {"phase": 4, "name": "£2,900 POC", "cost_gbp": 2900, "time_days": 42, "components": ["1× Corning 7980 + femtosecond laser write (borrow university)"], "tools": ["5D silica memory disc"]},
            {"phase": 5, "name": "£3,500 POC", "cost_gbp": 3500, "time_days": 84, "components": ["1,000× MCMB kits + 1× spine bus + 1× sensor + 1× brain"], "tools": ["1,000-orbs pilot"]},
            {"phase": 6, "name": "£126,625", "cost_gbp": 126625, "time_days": 180, "components": ["5,005 orbs + 1 spine + 4 sensors + 1 brain"], "tools": ["Full sovereign capillary humanoid"]},
        ],
        "zero_cost_poc": True,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def poc_roadmap() -> dict:
    """Return the POC roadmap (Phase 0-6)."""
    return {
        "phase_0_$0": "Use existing SOV3 + BFT + SIGIL on the VM (£0, 1 day)",
        "phase_1_£121": "Build 1× WiFi CSI node + 1× LoRa radar receiver (£121, 1 week)",
        "phase_2_£250": "Add HackRF + BladeRF + PlutoSDR for counter-drone (£250, 1.5 weeks)",
        "phase_3_£43": "Build 1× MCMB capillary muscle orb (£43, 2 weeks)",
        "phase_4_£2,900": "Add 5D silica memory disc (£2,900, 6 weeks)",
        "phase_5_£3,500": "Scale to 1,000 orbs (£3,500, 12 weeks)",
        "phase_6_£126,625": "Full sovereign capillary humanoid (£126,625 mass production, 6 months)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def tools_kit() -> dict:
    """Return the TOP 10 tools to use."""
    return {
        "tools": [
            {"rank": 1, "tool": "SOV3 orchestration (meek-sov3-orchestrator-mcp)", "use": "Brain", "cost_gbp": 0, "available": True},
            {"rank": 2, "tool": "33-hive BFT council (councilof-mcp)", "use": "Governance", "cost_gbp": 0, "available": True},
            {"rank": 3, "tool": "Ed25519 SIGIL signing (libsodium)", "use": "Trust", "cost_gbp": 0, "available": True},
            {"rank": 4, "tool": "WiFi CSI ESP32", "use": "Through-wall sensing", "cost_gbp": 10, "available": "Mouser"},
            {"rank": 5, "tool": "LoRa SX1276", "use": "Long-range mesh", "cost_gbp": 3, "available": "Mouser"},
            {"rank": 6, "tool": "HackRF One clone", "use": "EW + counter-drone", "cost_gbp": 150, "available": "AliExpress"},
            {"rank": 7, "tool": "Coral Edge TPU USB", "use": "On-device ML", "cost_gbp": 60, "available": "Google"},
            {"rank": 8, "tool": "RTL-SDR V4", "use": "Software-defined radio", "cost_gbp": 30, "available": "Mouser"},
            {"rank": 9, "tool": "QIDI Max4 (already have)", "use": "3D printing", "cost_gbp": 0, "available": True},
            {"rank": 10, "tool": "FreeCAD + OpenSCAD (Mac)", "use": "CAD design", "cost_gbp": 0, "available": True},
        ],
        "total_toolkit_cost_gbp": 253,  # 10 + 3 + 150 + 60 + 30
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def cost_calculator(
    num_orbs: int = 1,
    prototype: bool = True,
    include_spine: bool = True,
) -> dict:
    """Calculate the cost for any number of orbs/prototypes."""
    if prototype:
        cost_per_orb_gbp = 201
        spine_cost_gbp = 6757
    else:
        cost_per_orb_gbp = 25
        spine_cost_gbp = 1500
    total_orbs_cost = num_orbs * cost_per_orb_gbp
    spine_total = spine_cost_gbp if include_spine else 0
    return {
        "num_orbs": num_orbs,
        "prototype": prototype,
        "include_spine": include_spine,
        "cost_per_orb_gbp": cost_per_orb_gbp,
        "total_orbs_cost_gbp": total_orbs_cost,
        "spine_cost_gbp": spine_total,
        "total_cost_gbp": total_orbs_cost + spine_total,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def feasibility_scorer(
    impact: int = 7,
    feasibility: int = 8,
    cost_gbp: int = 100,
) -> dict:
    """Score a new finding by impact × feasibility / cost."""
    if cost_gbp == 0:
        score = float("inf")
    else:
        score = (impact * feasibility) / cost_gbp
    verdict = "HIGH_PRIORITY" if score > 1 else "MEDIUM_PRIORITY" if score > 0.1 else "LOW_PRIORITY"
    return {
        "impact": impact,
        "feasibility": feasibility,
        "cost_gbp": cost_gbp,
        "score": score,
        "verdict": verdict,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-poc-prioritizer-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="top_findings", description="Return the TOP 10 most feasible findings.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="cheapest_bootstrap", description="Return the cheapest bootstrap path.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="poc_roadmap", description="Return the POC roadmap.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="tools_kit", description="Return the TOP 10 tools to use.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="cost_calculator", description="Calculate the cost.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 1}, "prototype": {"type": "boolean", "default": True}, "include_spine": {"type": "boolean", "default": True}}, "required": []}),
        Tool(name="feasibility_scorer", description="Score a new finding.", inputSchema={"type": "object", "properties": {"impact": {"type": "integer", "default": 7}, "feasibility": {"type": "integer", "default": 8}, "cost_gbp": {"type": "integer", "default": 100}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "top_findings":
        result = top_findings()
    elif name == "cheapest_bootstrap":
        result = cheapest_bootstrap()
    elif name == "poc_roadmap":
        result = poc_roadmap()
    elif name == "tools_kit":
        result = tools_kit()
    elif name == "cost_calculator":
        result = cost_calculator(**arguments)
    elif name == "feasibility_scorer":
        result = feasibility_scorer(**arguments)
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