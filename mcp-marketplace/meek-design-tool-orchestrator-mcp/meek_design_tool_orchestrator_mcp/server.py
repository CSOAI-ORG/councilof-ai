#!/usr/bin/env python3
"""
meek-design-tool-orchestrator-mcp — server.py

Finds the best open-source CAD + slicer + EDA + simulation tool for the job.

Tools (5):
  1. find_cad_tool          — recommend the best CAD tool
  2. find_3d_print_tool    — recommend the best slicer
  3. find_pcb_tool          — recommend the best EDA tool
  4. find_github_repos      — find the best open-source repos
  5. generate_design_toolchain — generate the full toolchain
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

logger = logging.getLogger("meek_design_tool_orchestrator_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


CAD_TOOLS = {
    "freecad": {"license": "LGPL 2.1", "parametric": True, "use_for": "parametric 3D CAD + assemblies + drawings", "url": "github.com/FreeCAD/FreeCAD"},
    "openscad": {"license": "GPL 2.0", "parametric": True, "use_for": "code-based 3D CAD (reproducible)", "url": "github.com/openscad/openscad"},
    "blender": {"license": "GPL 2.0", "parametric": False, "use_for": "organic 3D modeling + animation + rendering", "url": "github.com/blender/blender"},
    "solvespace": {"license": "GPL 3.0", "parametric": True, "use_for": "constraint-based 3D CAD", "url": "github.com/whitequark/solvespace"},
    "cadquery": {"license": "Apache 2.0", "parametric": True, "use_for": "Python-based code CAD", "url": "github.com/CadQuery/cadquery"},
    "build123d": {"license": "Apache 2.0", "parametric": True, "use_for": "Python-based code CAD (modern)", "url": "github.com/gumyr/build123d"},
}

SLICER_TOOLS = {
    "prusaslicer": {"license": "AGPL 3.0", "use_for": "general purpose, multi-material", "url": "github.com/prusa3d/PrusaSlicer"},
    "superslicer": {"license": "AGPL 3.0", "use_for": "advanced features, fine tuning", "url": "github.com/supermerill/SuperSlicer"},
    "orcaslicer": {"license": "AGPL 3.0", "use_for": "Bambu-style, calibration", "url": "github.com/SoftFever/OrcaSlicer"},
    "cura": {"license": "LGPL 2.1", "use_for": "Ultimaker, plug-ins", "url": "github.com/Ultimaker/Cura"},
    "kirimoto": {"license": "MIT", "use_for": "web-based, browser-only", "url": "github.com/GridSpace/Kiri"},
}

EDA_TOOLS = {
    "kicad": {"license": "GPL 3.0", "use_for": "PCB EDA + schematic + layout + 3D", "url": "github.com/KiCad/KiCad"},
    "horizon_eda": {"license": "GPL 2.0", "use_for": "modern GUI PCB EDA", "url": "github.com/horizon-eda/horizon"},
    "fritzing": {"license": "GPL 3.0", "use_for": "beginner PCB design", "url": "github.com/fritzing/fritzing-app"},
    "magic": {"license": "BSD", "use_for": "VLSI layout (SkyWater 130nm)", "url": "github.com/RTimothyEdwards/magic"},
}


def find_cad_tool(component: str = "orb_bladder", complexity: str = "medium") -> dict:
    """Recommend the best CAD tool for a component."""
    if complexity == "low":
        recommended = "openscad"
    elif complexity == "medium":
        recommended = "freecad"
    elif complexity == "high":
        recommended = "blender"
    elif complexity == "code":
        recommended = "cadquery"
    else:
        recommended = "freecad"
    return {
        "component": component,
        "complexity": complexity,
        "recommended_tool": recommended,
        "tool_info": CAD_TOOLS[recommended],
        "alternatives": [t for t in CAD_TOOLS.keys() if t != recommended],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def find_3d_print_tool(material: str = "PVA", printer: str = "QIDI_Max4") -> dict:
    """Recommend the best slicer for a material."""
    # PrusaSlicer is the most versatile
    recommended = "prusaslicer"
    return {
        "material": material,
        "printer": printer,
        "recommended_tool": recommended,
        "tool_info": SLICER_TOOLS[recommended],
        "alternatives": [t for t in SLICER_TOOLS.keys() if t != recommended],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def find_pcb_tool(board_complexity: str = "simple_2_layer") -> dict:
    """Recommend the best EDA tool for a board."""
    if board_complexity in ("simple_2_layer", "simple_4_layer"):
        recommended = "kicad"
    elif board_complexity == "complex_8_layer":
        recommended = "kicad"
    elif board_complexity == "vlsi_skywater_130nm":
        recommended = "magic"
    else:
        recommended = "kicad"
    return {
        "board_complexity": board_complexity,
        "recommended_tool": recommended,
        "tool_info": EDA_TOOLS[recommended],
        "alternatives": [t for t in EDA_TOOLS.keys() if t != recommended],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def find_github_repos(domain: str = "humanoid") -> dict:
    """Find the best open-source repos for a domain."""
    repos = {
        "humanoid": [
            {"name": "lerobot", "url": "github.com/huggingface/lerobot", "license": "Apache 2.0"},
            {"name": "gym", "url": "github.com/openai/gym", "license": "MIT"},
            {"name": "dm_control", "url": "github.com/google-deepmind/dm_control", "license": "Apache 2.0"},
            {"name": "bullet3", "url": "github.com/bulletphysics/bullet3", "license": "Zlib"},
            {"name": "robomimic", "url": "github.com/ARISE-Initiative/robomimic", "license": "MIT"},
        ],
        "capillary": [
            {"name": "OpenFOAM", "url": "github.com/OpenFOAM/OpenFOAM-dev", "license": "GPL 3.0"},
            {"name": "fluidsim", "url": "github.com/fluiddyn/fluidsim", "license": "GPL 3.0"},
        ],
        "5d_silica": [
            {"name": "skywater-pdk", "url": "github.com/skywater-pdk/skywater-pdk", "license": "Apache 2.0"},
            {"name": "caravel", "url": "github.com/efabless/caravel", "license": "Apache 2.0"},
        ],
        "ai_brain": [
            {"name": "mamba", "url": "github.com/state-spaces/mamba", "license": "Apache 2.0"},
            {"name": "DeepSeek-V3", "url": "github.com/deepseek-ai/DeepSeek-V3", "license": "MIT"},
            {"name": "mistral-src", "url": "github.com/mistralai/mistral-src", "license": "Apache 2.0"},
        ],
    }
    return {
        "domain": domain,
        "repos": repos.get(domain, []),
        "total_repos": len(repos.get(domain, [])),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def generate_design_toolchain(project: str = "sovereign_orb") -> dict:
    """Generate the full toolchain for a project."""
    return {
        "project": project,
        "cad": {"tool": "FreeCAD", "license": "LGPL 2.1", "url": "github.com/FreeCAD/FreeCAD"},
        "slicer": {"tool": "PrusaSlicer", "license": "AGPL 3.0", "url": "github.com/prusa3d/PrusaSlicer"},
        "printer_firmware": {"tool": "Klipper", "license": "GPL 3.0", "url": "github.com/Klipper3d/klipper"},
        "printer": "QIDI Max4 (280×250×300 mm, CoreXY, Klipper)",
        "eda": {"tool": "KiCad", "license": "GPL 3.0", "url": "github.com/KiCad/KiCad"},
        "fem": {"tool": "CalculiX", "license": "GPL 2.0", "url": "github.com/calculix"},
        "cfd": {"tool": "OpenFOAM", "license": "GPL 3.0", "url": "github.com/OpenFOAM/OpenFOAM-dev"},
        "ai_brain": {"tool": "Mamba-2 SSD + DeepSeek V4 MoE", "license": "Apache 2.0"},
        "version_control": {"tool": "Git + GitHub", "license": "GPL 2.0"},
        "total_cost_gbp": 0,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-design-tool-orchestrator-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="find_cad_tool", description="Recommend the best CAD tool.", inputSchema={"type": "object", "properties": {"component": {"type": "string", "default": "orb_bladder"}, "complexity": {"type": "string", "default": "medium"}}, "required": []}),
        Tool(name="find_3d_print_tool", description="Recommend the best slicer.", inputSchema={"type": "object", "properties": {"material": {"type": "string", "default": "PVA"}, "printer": {"type": "string", "default": "QIDI_Max4"}}, "required": []}),
        Tool(name="find_pcb_tool", description="Recommend the best EDA tool.", inputSchema={"type": "object", "properties": {"board_complexity": {"type": "string", "default": "simple_2_layer"}}, "required": []}),
        Tool(name="find_github_repos", description="Find the best open-source repos.", inputSchema={"type": "object", "properties": {"domain": {"type": "string", "default": "humanoid"}}, "required": []}),
        Tool(name="generate_design_toolchain", description="Generate the full toolchain.", inputSchema={"type": "object", "properties": {"project": {"type": "string", "default": "sovereign_orb"}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "find_cad_tool":
        result = find_cad_tool(**arguments)
    elif name == "find_3d_print_tool":
        result = find_3d_print_tool(**arguments)
    elif name == "find_pcb_tool":
        result = find_pcb_tool(**arguments)
    elif name == "find_github_repos":
        result = find_github_repos(**arguments)
    elif name == "generate_design_toolchain":
        result = generate_design_toolchain(**arguments)
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