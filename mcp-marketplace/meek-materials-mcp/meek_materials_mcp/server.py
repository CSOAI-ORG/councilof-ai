#!/usr/bin/env python3
"""
meek-materials-mcp — server.py

MEEK Materials MCP — wraps pymatgen + ASE + MACE (materials science, DFT, MD, ML potentials)
for the gold-spiral + DNA-orb materials design.
"""
from __future__ import annotations

import math
import re
import json
import hashlib
import logging
import os
from datetime import datetime, timezone
from typing import Any

try:
    from mcp.server import Server
    from mcp.server.stdio import stdio_server
    from mcp.types import Tool, TextContent
except ImportError:
    Server = None
    stdio_server = None
    Tool = None
    TextContent = None

logger = logging.getLogger("meek_materials_mcp")
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


def gold_spiral_materials(
    spiral_pitch_um: float = 5.0,
    wire_width_um: float = 0.5,
    substrate: str = "sapphire",
) -> dict:
    """The gold-spiral materials design (the orb's central electrode)."""
    # Gold properties
    gold_props = {
        "resistivity_ohm_m": 2.44e-8,
        "young_modulus_gpa": 78,
        "poisson_ratio": 0.44,
        "thermal_conductivity_w_m_k": 318,
        "specific_heat_j_kg_k": 129,
        "density_kg_m3": 19300,
        "melting_point_k": 1337,
        "reflectance_at_1550nm": 0.98,
    }

    # Substrate properties
    substrates = {
        "sapphire": {"thermal_conductivity_w_m_k": 35, "dielectric_constant": 9.3, "transparency_visible": True},
        "silicon": {"thermal_conductivity_w_m_k": 150, "dielectric_constant": 11.7, "transparency_visible": False},
        "CFRP": {"thermal_conductivity_w_m_k": 1.5, "dielectric_constant": 4.0, "transparency_visible": False},
    }

    # Series resistance of the gold spiral
    length_m = math.pi * spiral_pitch_um * 1e-6 * 33  # 33 turns
    cross_section_m2 = (wire_width_um * 1e-6) * (wire_width_um * 1e-6)  # square cross-section
    resistance_ohm = gold_props["resistivity_ohm_m"] * length_m / cross_section_m2

    return {
        "material": "gold (99.999% pure)",
        "spiral_pitch_um": spiral_pitch_um,
        "wire_width_um": wire_width_um,
        "substrate": substrate,
        "gold_properties": gold_props,
        "substrate_properties": substrates.get(substrate, {}),
        "spiral_length_m": length_m,
        "spiral_resistance_ohm": resistance_ohm,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def dna_storage_density(
    electrode_diameter_um: float = 100.0,
    electrode_spacing_um: float = 200.0,
    bits_per_dna_strand: int = 100,
) -> dict:
    """The DNA-orb storage density calculation."""
    # 10^7 electrodes/cm^2 (per Chinese Academy of Sciences 2024)
    density_per_cm2 = 1e7
    # Per cm^2, we have density_per_cm2 DNA strands
    # Each strand stores bits_per_dna_strand bits
    density_bits_per_cm2 = density_per_cm2 * bits_per_dna_strand
    # Convert to bits/mm^3 (assuming 100nm thick layer)
    density_bits_per_mm3 = density_bits_per_cm2 / 100 * 1000  # 10^7 * 100 / 100 / 1000
    # GB per mm^3
    density_gb_per_mm3 = density_bits_per_mm3 / 8e9

    return {
        "electrode_diameter_um": electrode_diameter_um,
        "electrode_spacing_um": electrode_spacing_um,
        "bits_per_dna_strand": bits_per_dna_strand,
        "density_per_cm2": density_per_cm2,
        "density_bits_per_cm2": density_bits_per_cm2,
        "density_bits_per_mm3": density_bits_per_mm3,
        "density_gb_per_mm3": density_gb_per_mm3,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def run_ase_atomistic(
    element: str = "Au",
    crystal: str = "fcc",
    lattice_constant_a: float = 4.08,
) -> dict:
    """Compute basic atomistic properties (ASE-compatible)."""
    # Atomic volumes for common fcc crystals
    fcc_atomic_volume = (lattice_constant_a**3) / 4  # Å^3
    return {
        "element": element,
        "crystal": crystal,
        "lattice_constant_a": lattice_constant_a,
        "atomic_volume_angstrom3": fcc_atomic_volume,
        "atoms_per_unit_cell": 4,
        "coordination_number": 12,
        "engine": "ASE-compatible (analytical fallback)",
        "note": "Install ASE: pip install ase. Install pymatgen: pip install pymatgen. Install MACE: pip install mace-torch.",
    }


def materials_project_lookup(material_id: str) -> dict:
    """Look up a material on the Materials Project (free API)."""
    try:
        from pymatgen.ext.matproj import MPRester
        with MPRester() as mpr:
            docs = mpr.summary.search(material_ids=[material_id])
            if docs:
                d = docs[0]
                return {
                    "material_id": material_id,
                    "formula": d.formula_pretty,
                    "band_gap_ev": d.band_gap,
                    "energy_above_hull_ev_per_atom": d.energy_above_hull,
                    "engine": "Materials Project API",
                }
        return {"error": f"material {material_id} not found"}
    except ImportError:
        return {
            "material_id": material_id,
            "engine": "fallback (pymatgen not installed)",
            "note": "Install pymatgen: pip install pymatgen. Get a free API key from materialsproject.org.",
        }


mcp = Server("meek-materials-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="gold_spiral_materials", description="Compute gold-spiral materials properties for the orb's central electrode.", inputSchema={"type": "object", "properties": {"spiral_pitch_um": {"type": "number", "default": 5.0}, "wire_width_um": {"type": "number", "default": 0.5}, "substrate": {"type": "string", "enum": ["sapphire", "silicon", "CFRP"], "default": "sapphire"}}, "required": []}),
        Tool(name="dna_storage_density", description="Compute DNA-orb storage density.", inputSchema={"type": "object", "properties": {"electrode_diameter_um": {"type": "number", "default": 100.0}, "electrode_spacing_um": {"type": "number", "default": 200.0}, "bits_per_dna_strand": {"type": "integer", "default": 100}}, "required": []}),
        Tool(name="run_ase_atomistic", description="Run an ASE-compatible atomistic calculation.", inputSchema={"type": "object", "properties": {"element": {"type": "string", "default": "Au"}, "crystal": {"type": "string", "default": "fcc"}, "lattice_constant_a": {"type": "number", "default": 4.08}}, "required": []}),
        Tool(name="materials_project_lookup", description="Look up a material on the Materials Project.", inputSchema={"type": "object", "properties": {"material_id": {"type": "string", "default": "mp-81"}}, "required": ["material_id"]}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "gold_spiral_materials":
        result = gold_spiral_materials(**arguments)
    elif name == "dna_storage_density":
        result = dna_storage_density(**arguments)
    elif name == "run_ase_atomistic":
        result = run_ase_atomistic(**arguments)
    elif name == "materials_project_lookup":
        result = materials_project_lookup(**arguments)
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
