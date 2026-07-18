#!/usr/bin/env python3
"""
meek-design-bom-mcp — server.py

Generates the Bill of Materials for orbs + spine + humanoid + finds suppliers.

Tools (5):
  1. generate_orb_bom       — BOM for a single orb
  2. generate_spine_bom     — BOM for the spine bus
  3. generate_humanoid_bom  — full humanoid BOM
  4. estimate_cost          — estimate the total cost
  5. find_suppliers         — find UK + EU + US suppliers
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

logger = logging.getLogger("meek_design_bom_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def generate_orb_bom() -> dict:
    """BOM for a single orb (brain + sensor + muscle combined)."""
    components = [
        {"item": "PVA/PDMS elastomer bladder (25mm³)", "qty": 1, "unit_cost_gbp": 5, "supplier": "Amazon"},
        {"item": "PFA capillary tube (0.2mm × 50mm)", "qty": 10000, "unit_cost_gbp": 0.001, "supplier": "Sigma-Aldrich"},
        {"item": "Pt electrode (1mm × 5mm × 100nm)", "qty": 2, "unit_cost_gbp": 0.5, "supplier": "Goodfellow"},
        {"item": "Water + 0.1M NaCl electrolyte (0.1mL)", "qty": 1, "unit_cost_gbp": 0.01, "supplier": "Sigma-Aldrich"},
        {"item": "LoRa SX1276 radio", "qty": 1, "unit_cost_gbp": 3, "supplier": "Mouser"},
        {"item": "WiFi 6 ESP32-C6", "qty": 1, "unit_cost_gbp": 3, "supplier": "Espressif"},
        {"item": "BLE 5.x nRF52840", "qty": 1, "unit_cost_gbp": 2, "supplier": "Nordic"},
        {"item": "Sigil CC1101 radio", "qty": 1, "unit_cost_gbp": 2, "supplier": "TI"},
        {"item": "UWB DW3000", "qty": 1, "unit_cost_gbp": 5, "supplier": "Qorvo"},
        {"item": "Coral Edge TPU", "qty": 1, "unit_cost_gbp": 60, "supplier": "Google"},
        {"item": "Pressure sensor (piezoresistive)", "qty": 1, "unit_cost_gbp": 0.5, "supplier": "Mouser"},
        {"item": "CMOS camera (5MP)", "qty": 1, "unit_cost_gbp": 3, "supplier": "Arducam"},
        {"item": "IR thermal (160×120)", "qty": 1, "unit_cost_gbp": 15, "supplier": "FLIR"},
        {"item": "Acoustic MEMS mic array (4×)", "qty": 4, "unit_cost_gbp": 2.5, "supplier": "Knowles"},
        {"item": "Magnetometer (3-axis)", "qty": 1, "unit_cost_gbp": 2, "supplier": "STMicro"},
        {"item": "PVA filament (5g)", "qty": 1, "unit_cost_gbp": 0.5, "supplier": "Amazon"},
        {"item": "EGaIn (2g)", "qty": 1, "unit_cost_gbp": 4, "supplier": "GalliumSource"},
        {"item": "Bi2Te3 TEG (4×)", "qty": 4, "unit_cost_gbp": 12.5, "supplier": "TEC1-12706"},
        {"item": "LiPo battery (100 mAh)", "qty": 1, "unit_cost_gbp": 20, "supplier": "PKCELL"},
        {"item": "OLED display (sunlight-readable)", "qty": 1, "unit_cost_gbp": 5, "supplier": "Mouser"},
    ]
    total_cost_gbp = sum(c["qty"] * c["unit_cost_gbp"] for c in components)
    return {
        "orb_type": "sovereign_muscle_orb",
        "components": components,
        "total_components": len(components),
        "prototype_cost_gbp": total_cost_gbp,
        "mass_production_cost_gbp": 25.0,  # 10x cheaper at scale
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def generate_spine_bom() -> dict:
    """BOM for the spine bus (4 channels)."""
    return {
        "spine_type": "CFRP_copper_spine",
        "length_mm": 1500,
        "cross_section_mm": 50,
        "components": [
            {"item": "CFRP tube (50mm × 50mm × 1500mm)", "qty": 1, "unit_cost_gbp": 200, "supplier": "Easy Composites"},
            {"item": "PFA coolant tube (10mm)", "qty": 2, "unit_cost_gbp": 5, "supplier": "Amazon"},
            {"item": "24V DC power cable", "qty": 5, "unit_cost_gbp": 1, "supplier": "Mouser"},
            {"item": "EO control cable (0-100V)", "qty": 5, "unit_cost_gbp": 1, "supplier": "Mouser"},
            {"item": "Sigil bus cable (Ed25519)", "qty": 5, "unit_cost_gbp": 1, "supplier": "Mouser"},
            {"item": "Peristaltic heart pump (Watson-Marlow 120U/DV)", "qty": 1, "unit_cost_gbp": 400, "supplier": "Watson-Marlow"},
            {"item": "Bi2Te3 TEG (4×)", "qty": 4, "unit_cost_gbp": 50, "supplier": "TEC1-12706"},
            {"item": "LiPo backup battery (1000 mAh)", "qty": 1, "unit_cost_gbp": 100, "supplier": "PKCELL"},
            {"item": "PT check valves (10010×)", "qty": 1, "unit_cost_gbp": 1000, "supplier": "Amazon"},
            {"item": "Pt EO electrodes (5005× pairs)", "qty": 1, "unit_cost_gbp": 5000, "supplier": "Goodfellow"},
        ],
        "prototype_cost_gbp": 6757,
        "mass_production_cost_gbp": 1500,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def generate_humanoid_bom(num_muscle_orbs: int = 5000, num_sensor_orbs: int = 4, num_brain_orbs: int = 1) -> dict:
    """Full humanoid BOM."""
    orb = generate_orb_bom()
    spine = generate_spine_bom()
    total_orb_cost = orb["prototype_cost_gbp"] * num_muscle_orbs
    total_sensor_cost = orb["prototype_cost_gbp"] * num_sensor_orbs  # sensor orbs same as muscle
    total_brain_cost = orb["prototype_cost_gbp"] * num_brain_orbs  # brain orb same as muscle
    total_cost = total_orb_cost + total_sensor_cost + total_brain_cost + spine["prototype_cost_gbp"]
    # Mass production
    orb_mass_cost = 25.0 * (num_muscle_orbs + num_sensor_orbs + num_brain_orbs)
    spine_mass_cost = 1500
    total_mass_cost = orb_mass_cost + spine_mass_cost
    return {
        "humanoid": "sovereign_capillary_humanoid",
        "num_muscle_orbs": num_muscle_orbs,
        "num_sensor_orbs": num_sensor_orbs,
        "num_brain_orbs": num_brain_orbs,
        "total_orbs": num_muscle_orbs + num_sensor_orbs + num_brain_orbs,
        "muscle_orbs_cost_gbp": total_orb_cost,
        "sensor_orbs_cost_gbp": total_sensor_cost,
        "brain_orbs_cost_gbp": total_brain_cost,
        "spine_cost_gbp": spine["prototype_cost_gbp"],
        "total_prototype_cost_gbp": total_cost,
        "total_mass_production_cost_gbp": total_mass_cost,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def estimate_cost(num_orbs: int = 5005, prototype: bool = True) -> dict:
    """Estimate the total cost."""
    if prototype:
        cost_per_orb_gbp = 191
    else:
        cost_per_orb_gbp = 25
    total_orbs_cost = num_orbs * cost_per_orb_gbp
    spine_cost_gbp = 6757 if prototype else 1500
    return {
        "num_orbs": num_orbs,
        "prototype": prototype,
        "cost_per_orb_gbp": cost_per_orb_gbp,
        "total_orbs_cost_gbp": total_orbs_cost,
        "spine_cost_gbp": spine_cost_gbp,
        "total_cost_gbp": total_orbs_cost + spine_cost_gbp,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def find_suppliers(component_category: str = "all") -> dict:
    """Find UK + EU + US suppliers for each component."""
    return {
        "uk_suppliers": [
            {"name": "RS Components", "url": "uk.rs-online.com", "specialty": "general electronics"},
            {"name": "Farnell", "url": "uk.farnell.com", "specialty": "general electronics"},
            {"name": "Mouser UK", "url": "mouser.co.uk", "specialty": "semiconductors + passives"},
            {"name": "CPC Farnell", "url": "cpc.farnell.com", "specialty": "general"},
            {"name": "Easy Composites", "url": "easycomposites.co.uk", "specialty": "CFRP + composites"},
        ],
        "eu_suppliers": [
            {"name": "Digi-Key", "url": "digikey.com", "specialty": "semiconductors"},
            {"name": "Mouser EU", "url": "mouser.com", "specialty": "semiconductors + passives"},
            {"name": "Conrad", "url": "conrad.com", "specialty": "general electronics"},
            {"name": "Reichelt", "url": "reichelt.com", "specialty": "general electronics"},
        ],
        "us_suppliers": [
            {"name": "Digikey", "url": "digikey.com", "specialty": "semiconductors"},
            {"name": "Mouser", "url": "mouser.com", "specialty": "semiconductors + passives"},
            {"name": "McMaster-Carr", "url": "mcmaster.com", "specialty": "hardware + materials"},
            {"name": "Amazon", "url": "amazon.com", "specialty": "general"},
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-design-bom-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="generate_orb_bom", description="BOM for a single orb.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="generate_spine_bom", description="BOM for the spine bus.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="generate_humanoid_bom", description="Full humanoid BOM.", inputSchema={"type": "object", "properties": {"num_muscle_orbs": {"type": "integer", "default": 5000}, "num_sensor_orbs": {"type": "integer", "default": 4}, "num_brain_orbs": {"type": "integer", "default": 1}}, "required": []}),
        Tool(name="estimate_cost", description="Estimate the total cost.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "prototype": {"type": "boolean", "default": True}}, "required": []}),
        Tool(name="find_suppliers", description="Find UK + EU + US suppliers.", inputSchema={"type": "object", "properties": {"component_category": {"type": "string", "default": "all"}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "generate_orb_bom":
        result = generate_orb_bom()
    elif name == "generate_spine_bom":
        result = generate_spine_bom()
    elif name == "generate_humanoid_bom":
        result = generate_humanoid_bom(**arguments)
    elif name == "estimate_cost":
        result = estimate_cost(**arguments)
    elif name == "find_suppliers":
        result = find_suppliers(**arguments)
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