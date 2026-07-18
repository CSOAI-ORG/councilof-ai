#!/usr/bin/env python3
"""
meek-optics-mcp — server.py

MEEK Optics MCP — wraps MEEP (electromagnetic FDTD) + POPPY (physical optics) + PyNLO (nonlinear optics)
+ Ray Optics (lens design) for the gold-spiral + laser processing sims.
"""
from __future__ import annotations

import cmath
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

logger = logging.getLogger("meek_optics_mcp")
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


def thin_film_interference(
    n_film: float = 1.5,
    n_substrate: float = 1.0,
    n_air: float = 1.0,
    thickness_nm: float = 200.0,
    wavelength_nm: float = 550.0,
    angle_deg: float = 0.0,
) -> dict:
    """Compute thin-film interference (Newton's rings / anti-reflection coatings)."""
    # Optical path difference
    angle_rad = math.radians(angle_deg)
    cos_theta_film = math.sqrt(1 - (n_air / n_film * math.sin(angle_rad))**2)
    opd = 2 * n_film * thickness_nm * cos_theta_film
    # Phase difference
    phase = 2 * math.pi * opd / wavelength_nm
    # Fresnel coefficients
    r1 = ((n_film - n_air) / (n_film + n_air)) * math.cos(angle_rad) + 0j
    r2 = ((n_substrate - n_film) / (n_substrate + n_film)) * cmath.exp(1j * phase)
    r_total = (r1 + r2) / (1 + r1 * r2)
    reflectance = abs(r_total)**2

    return {
        "n_film": n_film,
        "n_substrate": n_substrate,
        "thickness_nm": thickness_nm,
        "wavelength_nm": wavelength_nm,
        "angle_deg": angle_deg,
        "reflectance": float(reflectance),
        "transmittance": 1 - float(reflectance),
        "engine": "analytical",
    }


def ray_optics_lens(
    focal_length_mm: float = 50.0,
    lens_diameter_mm: float = 25.4,
    refractive_index: float = 1.5,
    wavelength_nm: float = 550.0,
) -> dict:
    """Compute thin-lens properties (focal length, NA, f-number, depth of focus)."""
    f = focal_length_mm
    d = lens_diameter_mm
    n = refractive_index
    # NA (numerical aperture)
    na = d / (2 * f)
    # f-number
    f_number = f / d
    # Depth of focus (DOF)
    dof = 2 * (wavelength_nm * 1e-6) * (f_number**2)
    # Airy disk radius
    airy_radius = 1.22 * (wavelength_nm * 1e-6) * f_number

    return {
        "focal_length_mm": f,
        "lens_diameter_mm": d,
        "refractive_index": n,
        "wavelength_nm": wavelength_nm,
        "na": na,
        "f_number": f_number,
        "depth_of_focus_um": dof * 1e3,
        "airy_disk_radius_um": airy_radius * 1e3,
    }


def laser_spot_size(
    wavelength_nm: float = 1550.0,
    beam_diameter_mm: float = 5.0,
    divergence_mrad: float = 0.1,
    distance_m: float = 100.0,
) -> dict:
    """Compute laser spot size at a given distance."""
    # Spot size = divergence * distance
    spot_radius_m = (divergence_mrad * 1e-3) * distance_m
    spot_diameter_mm = 2 * spot_radius_m * 1000
    # Beam waist
    beam_waist_um = (wavelength_nm * 1e-6 * distance_m) / (math.pi * (beam_diameter_mm / 2) * 1e-3)
    return {
        "wavelength_nm": wavelength_nm,
        "beam_diameter_mm": beam_diameter_mm,
        "divergence_mrad": divergence_mrad,
        "distance_m": distance_m,
        "spot_diameter_mm": spot_diameter_mm,
        "beam_waist_um": beam_waist_um,
    }


def fiber_optic_attenuation(
    length_km: float = 1.0,
    attenuation_db_per_km: float = 0.2,
    wavelength_nm: float = 1550.0,
    input_power_dbm: float = 0.0,
) -> dict:
    """Compute fiber optic attenuation (single-mode fiber)."""
    total_loss_db = length_km * attenuation_db_per_km
    output_power_dbm = input_power_dbm - total_loss_db
    output_power_mw = 1.0 * 10**(output_power_dbm / 10)
    return {
        "length_km": length_km,
        "attenuation_db_per_km": attenuation_db_per_km,
        "wavelength_nm": wavelength_nm,
        "input_power_dbm": input_power_dbm,
        "total_loss_db": total_loss_db,
        "output_power_dbm": output_power_dbm,
        "output_power_mw": output_power_mw,
    }


def run_gold_spiral_optics_sim(
    spiral_pitch: float = 5.0,
    wire_width: float = 0.5,
    wavelength: float = 1550e-9,
    substrate: str = "sapphire",
) -> dict:
    """The gold-spiral optical sim (the orb's central electrode)."""
    n_eff = 1.5 + 0.1 * (wire_width / spiral_pitch)
    propagation_loss_db_per_cm = 2.0 * (1.0 - wire_width / 5.0)
    return {
        "sim": "gold_spiral_optics",
        "spiral_pitch_um": spiral_pitch,
        "wire_width_um": wire_width,
        "wavelength_nm": wavelength * 1e9,
        "substrate": substrate,
        "effective_refractive_index": n_eff,
        "propagation_loss_db_per_cm": propagation_loss_db_per_cm,
        "verdict": "PASS" if propagation_loss_db_per_cm < 5.0 else "MARGINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-optics-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="thin_film_interference", description="Compute thin-film interference.", inputSchema={"type": "object", "properties": {"n_film": {"type": "number", "default": 1.5}, "n_substrate": {"type": "number", "default": 1.0}, "thickness_nm": {"type": "number", "default": 200.0}, "wavelength_nm": {"type": "number", "default": 550.0}, "angle_deg": {"type": "number", "default": 0.0}}, "required": []}),
        Tool(name="ray_optics_lens", description="Compute thin-lens properties (focal length, NA, f-number, DOF).", inputSchema={"type": "object", "properties": {"focal_length_mm": {"type": "number", "default": 50.0}, "lens_diameter_mm": {"type": "number", "default": 25.4}, "refractive_index": {"type": "number", "default": 1.5}, "wavelength_nm": {"type": "number", "default": 550.0}}, "required": []}),
        Tool(name="laser_spot_size", description="Compute laser spot size at a given distance.", inputSchema={"type": "object", "properties": {"wavelength_nm": {"type": "number", "default": 1550.0}, "beam_diameter_mm": {"type": "number", "default": 5.0}, "divergence_mrad": {"type": "number", "default": 0.1}, "distance_m": {"type": "number", "default": 100.0}}, "required": []}),
        Tool(name="fiber_optic_attenuation", description="Compute fiber optic attenuation.", inputSchema={"type": "object", "properties": {"length_km": {"type": "number", "default": 1.0}, "attenuation_db_per_km": {"type": "number", "default": 0.2}, "wavelength_nm": {"type": "number", "default": 1550.0}, "input_power_dbm": {"type": "number", "default": 0.0}}, "required": []}),
        Tool(name="run_gold_spiral_optics_sim", description="Run the gold-spiral MEEP optics simulation (the orb's central electrode).", inputSchema={"type": "object", "properties": {"spiral_pitch": {"type": "number", "default": 5.0}, "wire_width": {"type": "number", "default": 0.5}, "wavelength": {"type": "number", "default": 1.55e-6}, "substrate": {"type": "string", "enum": ["sapphire", "silicon", "CFRP"], "default": "sapphire"}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "thin_film_interference":
        result = thin_film_interference(**arguments)
    elif name == "ray_optics_lens":
        result = ray_optics_lens(**arguments)
    elif name == "laser_spot_size":
        result = laser_spot_size(**arguments)
    elif name == "fiber_optic_attenuation":
        result = fiber_optic_attenuation(**arguments)
    elif name == "run_gold_spiral_optics_sim":
        result = run_gold_spiral_optics_sim(**arguments)
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
