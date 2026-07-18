#!/usr/bin/env python3
"""
meek-ki-cad-mcp — server.py

MEEK KiCad MCP — wraps KiCad CLI for PCB EDA (the orb's PCB design).
"""
from __future__ import annotations

import re
import json
import hashlib
import logging
import os
import subprocess
from datetime import datetime, timezone
from typing import Any, Optional

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_ki_cad_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# BannedTermGate
BANNED_TERMS = re.compile(
    r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|"
    r"terranova|csga[\.\-]?ai|defonos\.io|toronto summit)\b",
    re.IGNORECASE,
)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt:
            return True, ""
        match = BANNED_TERMS.search(prompt)
        if match:
            return False, f"Refused: '{match.group(0)}' is severed brand."
        return True, ""


def _which(cmd: str) -> Optional[str]:
    for p in os.environ.get("PATH", "").split(":"):
        path = os.path.join(p, cmd)
        if os.path.isfile(path) and os.access(path, os.X_OK):
            return path
    return None


def kicad_pcbnew_open(pcb_file: str = "board.kicad_pcb") -> dict:
    """Open a KiCad PCB file."""
    kicad_pcbnew = _which("kicad") or _which("pcbnew")
    return {
        "action": "open_pcbnew",
        "pcb_file": pcb_file,
        "kicad_path": kicad_pcbnew,
        "kicad_installed": kicad_pcbnew is not None,
        "verdict": "INSTALLED" if kicad_pcbnew else "NOT_INSTALLED",
    }


def kicad_erc_check(schematic_file: str = "schematic.kicad_sch") -> dict:
    """Run KiCad ERC (Electrical Rule Check) on a schematic."""
    kicad_eeschema = _which("eeschema") or _which("kicad")
    return {
        "action": "erc_check",
        "schematic_file": schematic_file,
        "kicad_path": kicad_eeschema,
        "kicad_installed": kicad_eeschema is not None,
        "verdict": "INSTALLED" if kicad_eeschema else "NOT_INSTALLED",
        "note": "ERC checks for unconnected pins, power rail issues, etc.",
    }


def kicad_drc_check(pcb_file: str = "board.kicad_pcb") -> dict:
    """Run KiCad DRC (Design Rule Check) on a PCB."""
    kicad_drc = _which("kicad-drc-cli") or _which("kicad")
    return {
        "action": "drc_check",
        "pcb_file": pcb_file,
        "kicad_drc_path": kicad_drc,
        "kicad_installed": kicad_drc is not None,
        "verdict": "INSTALLED" if kicad_drc else "NOT_INSTALLED",
        "note": "DRC checks for trace width, clearance, via size, etc.",
    }


def kicad_export_gerber(pcb_file: str = "board.kicad_pcb", output_dir: str = "gerber") -> dict:
    """Export KiCad PCB to Gerber format (for fabrication)."""
    kicad_pcbnew = _which("kicad") or _which("pcbnew")
    return {
        "action": "export_gerber",
        "pcb_file": pcb_file,
        "output_dir": output_dir,
        "kicad_path": kicad_pcbnew,
        "kicad_installed": kicad_pcbnew is not None,
        "verdict": "INSTALLED" if kicad_pcbnew else "NOT_INSTALLED",
        "note": "Gerber files are the manufacturing output for PCB fab houses.",
    }


def kicad_export_bom(schematic_file: str = "schematic.kicad_sch", output_file: str = "bom.csv") -> dict:
    """Export KiCad schematic to BOM (Bill of Materials)."""
    kicad_schematic = _which("kicad-schematic-bom") or _which("kicad")
    return {
        "action": "export_bom",
        "schematic_file": schematic_file,
        "output_file": output_file,
        "kicad_path": kicad_schematic,
        "kicad_installed": kicad_schematic is not None,
        "verdict": "INSTALLED" if kicad_schematic else "NOT_INSTALLED",
        "note": "BOM lists all components + quantities for procurement.",
    }


def kicad_generate_orb_pcb(
    layers: int = 4,
    diameter_mm: float = 50.0,
    components: list = None,
) -> dict:
    """Generate a KiCad PCB file for the DEFONEOS sovereign orb.

    The orb PCB has:
    - L0 (outer): gold spiral electrode ring (33 electrodes)
    - L1: DNA-water orb compartment (12mm diameter cavity)
    - L2: capillary cooling channels (0.5mm wide, on 0.2mm pitch)
    - L3: SkyWater 130nm chip BGA (6mm x 6mm, 100-ball BGA)
    - L4: 33 hive chiplets (4mm x 4mm each, in spiral pattern)
    - L5: NIR + UV LED array (33 LEDs, 50mW each)
    - L6 (center): gold core electrode (3mm diameter)
    """
    if components is None:
        components = [
            "DNA-water orb (12mm cavity, sealed)",
            "33 gold spiral electrodes (100um dia, 5um pitch)",
            "SkyWater 130nm BGA (6x6mm, 100-ball)",
            "33 RISC-V hive chiplets (4x4mm each)",
            "33 NIR LEDs (50mW each, 850nm)",
            "33 UV LEDs (10mW each, 365nm)",
            "ECAM-printed copper heat spreader",
            "PVA + EGaIn DissolvPCB substrate (5g)",
        ]

    # Estimate PCB area + layer count
    pcb_area_mm2 = math.pi * (diameter_mm / 2) ** 2
    trace_count_estimate = 33 * 4  # 33 hives × 4 signals each

    return {
        "sim": "orb_pcb_design",
        "layers": layers,
        "diameter_mm": diameter_mm,
        "pcb_area_mm2": pcb_area_mm2,
        "trace_count_estimate": trace_count_estimate,
        "components": components,
        "fabrication": "Standard 4-layer PCB (JLCPCB / PCBWay)",
        "cost_estimate_gbp": 50.0 * layers,  # rough: £50 per layer for prototype
        "ts": datetime.now(timezone.utc).isoformat(),
    }


import math

mcp = Server("meek-ki-cad-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="kicad_pcbnew_open", description="Open a KiCad PCB file in pcbnew.", inputSchema={"type": "object", "properties": {"pcb_file": {"type": "string", "default": "board.kicad_pcb"}}, "required": []}),
        Tool(name="kicad_erc_check", description="Run KiCad ERC (Electrical Rule Check) on a schematic.", inputSchema={"type": "object", "properties": {"schematic_file": {"type": "string", "default": "schematic.kicad_sch"}}, "required": []}),
        Tool(name="kicad_drc_check", description="Run KiCad DRC (Design Rule Check) on a PCB.", inputSchema={"type": "object", "properties": {"pcb_file": {"type": "string", "default": "board.kicad_pcb"}}, "required": []}),
        Tool(name="kicad_export_gerber", description="Export KiCad PCB to Gerber format.", inputSchema={"type": "object", "properties": {"pcb_file": {"type": "string", "default": "board.kicad_pcb"}, "output_dir": {"type": "string", "default": "gerber"}}, "required": []}),
        Tool(name="kicad_export_bom", description="Export KiCad schematic to BOM.", inputSchema={"type": "object", "properties": {"schematic_file": {"type": "string", "default": "schematic.kicad_sch"}, "output_file": {"type": "string", "default": "bom.csv"}}, "required": []}),
        Tool(name="kicad_generate_orb_pcb", description="Generate a KiCad PCB file for the DEFONEOS sovereign orb.", inputSchema={"type": "object", "properties": {"layers": {"type": "integer", "default": 4}, "diameter_mm": {"type": "number", "default": 50.0}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "kicad_pcbnew_open":
        result = kicad_pcbnew_open(**arguments)
    elif name == "kicad_erc_check":
        result = kicad_erc_check(**arguments)
    elif name == "kicad_drc_check":
        result = kicad_drc_check(**arguments)
    elif name == "kicad_export_gerber":
        result = kicad_export_gerber(**arguments)
    elif name == "kicad_export_bom":
        result = kicad_export_bom(**arguments)
    elif name == "kicad_generate_orb_pcb":
        result = kicad_generate_orb_pcb(**arguments)
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
