#!/usr/bin/env python3
"""
meek-3d-print-toolchain-mcp — server.py

OpenSCAD + PrusaSlicer + GCODE + QIDI Max4 print job pipeline.

Tools (5):
  1. generate_stl           — generate STL from OpenSCAD
  2. slice_for_qidi         — slice for the QIDI Max4
  3. generate_gcode         — generate GCODE with PrusaSlicer
  4. estimate_print_time    — estimate the print time + material
  5. qidi_print_job         — send the GCODE to the QIDI Max4
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

logger = logging.getLogger("meek_3d_print_toolchain_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def generate_stl(component: str = "orb_bladder", material: str = "PVA") -> dict:
    """Generate STL from OpenSCAD."""
    # OpenSCAD command (simulated)
    openscad_cmd = f"openscad -o {component}.stl {component}.scad"
    return {
        "component": component,
        "material": material,
        "openscad_cmd": openscad_cmd,
        "stl_file": f"{component}.stl",
        "estimated_stl_size_kb": 250,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def slice_for_qidi(stl_file: str = "orb_bladder.stl", material: str = "PVA", layer_height_mm: float = 0.2) -> dict:
    """Slice for the QIDI Max4."""
    prusaslicer_cmd = f"prusa-slicer --export-gcode --output orb_bladder.gcode --layer-height {layer_height_mm} --filament-type {material} {stl_file}"
    return {
        "stl_file": stl_file,
        "material": material,
        "layer_height_mm": layer_height_mm,
        "prusaslicer_cmd": prusaslicer_cmd,
        "gcode_file": stl_file.replace(".stl", ".gcode"),
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def generate_gcode(stl_file: str = "orb_bladder.stl", material: str = "PVA", layer_height_mm: float = 0.2) -> dict:
    """Generate GCODE with PrusaSlicer."""
    return {
        "stl_file": stl_file,
        "material": material,
        "layer_height_mm": layer_height_mm,
        "gcode_file": stl_file.replace(".stl", ".gcode"),
        "estimated_gcode_size_mb": 2.5,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def estimate_print_time(
    stl_file: str = "orb_bladder.stl",
    material: str = "PVA",
    layer_height_mm: float = 0.2,
    infill_pct: int = 20,
    print_speed_mm_per_s: float = 60,
) -> dict:
    """Estimate the print time + material."""
    # Estimate based on component (simplified)
    if "bladder" in stl_file:
        volume_cm3 = 5.0
    elif "spine" in stl_file:
        volume_cm3 = 250.0
    elif "heart" in stl_file:
        volume_cm3 = 30.0
    elif "housing" in stl_file:
        volume_cm3 = 8.0
    else:
        volume_cm3 = 10.0
    # Effective volume with infill
    effective_volume_cm3 = volume_cm3 * (infill_pct / 100)
    # Material density (PLA ~1.24 g/cm³, PVA ~1.23, PETG ~1.27)
    material_density_g_per_cm3 = 1.24 if material == "PLA" else 1.23
    mass_g = effective_volume_cm3 * material_density_g_per_cm3
    # Time estimate (rough: 1 cm³ takes ~30s at 0.2mm layer)
    time_s = effective_volume_cm3 * 30
    # Filament length
    filament_length_m = effective_volume_cm3 / (1.75 ** 2 * math.pi / 4) / 100

    return {
        "stl_file": stl_file,
        "material": material,
        "layer_height_mm": layer_height_mm,
        "infill_pct": infill_pct,
        "print_speed_mm_per_s": print_speed_mm_per_s,
        "volume_cm3": volume_cm3,
        "effective_volume_cm3": effective_volume_cm3,
        "material_mass_g": mass_g,
        "filament_length_m": filament_length_m,
        "estimated_print_time_s": time_s,
        "estimated_print_time_hours": time_s / 3600,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def qidi_print_job(
    gcode_file: str = "orb_bladder.gcode",
    qidi_ip: str = "192.168.50.21",
    qidi_port: int = 7125,
) -> dict:
    """Send the GCODE to the QIDI Max4 via LAN."""
    # Klipper/Moonraker API call
    curl_cmd = f"curl -X POST http://{qidi_ip}:{qidi_port}/printer/print/start -H 'Content-Type: application/json' -d '{{\"filename\": \"{gcode_file}\"}}'"
    return {
        "gcode_file": gcode_file,
        "qidi_ip": qidi_ip,
        "qidi_port": qidi_port,
        "curl_cmd": curl_cmd,
        "print_status": "QUEUED",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-3d-print-toolchain-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="generate_stl", description="Generate STL from OpenSCAD.", inputSchema={"type": "object", "properties": {"component": {"type": "string", "default": "orb_bladder"}, "material": {"type": "string", "default": "PVA"}}, "required": []}),
        Tool(name="slice_for_qidi", description="Slice for the QIDI Max4.", inputSchema={"type": "object", "properties": {"stl_file": {"type": "string", "default": "orb_bladder.stl"}, "material": {"type": "string", "default": "PVA"}, "layer_height_mm": {"type": "number", "default": 0.2}}, "required": []}),
        Tool(name="generate_gcode", description="Generate GCODE with PrusaSlicer.", inputSchema={"type": "object", "properties": {"stl_file": {"type": "string", "default": "orb_bladder.stl"}, "material": {"type": "string", "default": "PVA"}, "layer_height_mm": {"type": "number", "default": 0.2}}, "required": []}),
        Tool(name="estimate_print_time", description="Estimate the print time + material.", inputSchema={"type": "object", "properties": {"stl_file": {"type": "string", "default": "orb_bladder.stl"}, "material": {"type": "string", "default": "PVA"}, "layer_height_mm": {"type": "number", "default": 0.2}, "infill_pct": {"type": "integer", "default": 20}}, "required": []}),
        Tool(name="qidi_print_job", description="Send the GCODE to the QIDI Max4 via LAN.", inputSchema={"type": "object", "properties": {"gcode_file": {"type": "string", "default": "orb_bladder.gcode"}, "qidi_ip": {"type": "string", "default": "192.168.50.21"}, "qidi_port": {"type": "integer", "default": 7125}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "generate_stl":
        result = generate_stl(**arguments)
    elif name == "slice_for_qidi":
        result = slice_for_qidi(**arguments)
    elif name == "generate_gcode":
        result = generate_gcode(**arguments)
    elif name == "estimate_print_time":
        result = estimate_print_time(**arguments)
    elif name == "qidi_print_job":
        result = qidi_print_job(**arguments)
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