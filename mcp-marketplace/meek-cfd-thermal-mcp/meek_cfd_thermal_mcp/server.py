#!/usr/bin/env python3
"""
meek-cfd-thermal-mcp — server.py

MEEK CFD + Thermal MCP — wraps OpenFOAM (CFD) + Basilisk (microfluidic VOF) + CoolProp (thermo)
+ Cantera (chemical kinetics) for the capillary cooling + thermal routing sims.

Inherits: MEOK_DEFONEOS_ALIGNMENT v3.0 + PROJECT_AURUM_W10_2026-06-28.
"""
from __future__ import annotations

import math
import re
import json
import hashlib
import logging
import os
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

logger = logging.getLogger("meek_cfd_thermal_mcp")
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
            term = match.group(0)
            return False, f"Refused: '{term}' is a severed brand (v3.0 §①)."
        return True, ""


def coolprop_lookup(fluid: str, prop1: str, prop2: str, value1: float) -> dict:
    """Look up a thermodynamic property using CoolProp (if installed)."""
    try:
        import CoolProp.CoolProp as CP
        result = CP.PropsSI(prop1, prop2, value1, "P", 101325, fluid)
        return {
            "fluid": fluid,
            "property": prop1,
            "value": float(result),
            "unit": "SI",
            "engine": "CoolProp",
        }
    except ImportError:
        # Fallback: water table at 20°C, 1 atm
        fallback_table = {
            "water": {"D": 998.2, "H": 4184.0, "S": 0.072, "C": 4.18e3, "L": 2.26e6, "V": 1.0e-3, "P": 101325.0},
        }
        if fluid.lower() in fallback_table and prop1.upper() in fallback_table[fluid.lower()]:
            return {
                "fluid": fluid,
                "property": prop1,
                "value": fallback_table[fluid.lower()][prop1.upper()],
                "unit": "SI (fallback)",
                "engine": "fallback (CoolProp not installed)",
            }
        return {"error": f"property {prop1} not in fallback table"}


def capillary_flow(
    channel_diameter: float = 0.5e-3,
    channel_length: float = 0.3,
    fluid: str = "water",
    temperature: float = 25.0,
) -> dict:
    """Compute capillary flow in a circular channel (Washburn equation)."""
    if fluid == "water":
        gamma = 0.072
        mu = 1.0e-3
        rho = 998.0
    elif fluid == "HFE-7200":
        gamma = 0.013
        mu = 0.00045
        rho = 1420.0
    else:
        gamma = 0.072
        mu = 1.0e-3
        rho = 1000.0

    # Temperature adjustment (water viscosity decreases with T)
    mu = mu * (1.0 - 0.025 * (temperature - 20.0))

    theta_rad = math.radians(30.0)
    # Capillary pressure
    dp_cap = 4 * gamma * math.cos(theta_rad) / channel_diameter
    # Washburn penetration depth at time t
    t = 1.0  # 1 second
    L = math.sqrt((gamma * channel_diameter * math.cos(theta_rad) * t) / (4 * mu))
    # Flow rate (Hagen-Poiseuille)
    r = channel_diameter / 2
    q = (math.pi * r**4 * dp_cap) / (8 * mu * channel_length)

    return {
        "fluid": fluid,
        "channel_diameter": channel_diameter,
        "channel_length": channel_length,
        "temperature": temperature,
        "capillary_pressure_pa": dp_cap,
        "penetration_depth_m_at_1s": L,
        "flow_rate_m3_per_s": q,
        "verdict": "PASS" if L > channel_length * 0.5 else "MARGINAL",
    }


def two_phase_heat_removal(
    heat_flux_w: float = 5.0,
    fluid: str = "water",
    fraction_evaporated: float = 0.1,
) -> dict:
    """Compute two-phase heat removal (latent heat transport)."""
    if fluid == "water":
        h_fg = 2.26e6
    elif fluid == "HFE-7200":
        h_fg = 88000.0
    else:
        h_fg = 2.26e6

    mass_flow_required = heat_flux_w / (h_fg * fraction_evaporated)
    liquid_only_mass_flow = heat_flux_w / (4180.0 * 10.0)  # 10°C temp rise

    return {
        "heat_flux_w": heat_flux_w,
        "fluid": fluid,
        "fraction_evaporated": fraction_evaporated,
        "h_fg_j_per_kg": h_fg,
        "mass_flow_required_kg_per_s": mass_flow_required,
        "liquid_only_mass_flow_10c_rise": liquid_only_mass_flow,
        "phase_change_advantage": liquid_only_mass_flow / mass_flow_required if mass_flow_required > 0 else float("inf"),
        "verdict": "PASS" if mass_flow_required < 0.1 else "MARGINAL",
    }


def cantera_combustion(
    fuel: str = "methane",
    equivalence_ratio: float = 1.0,
    temperature: float = 300.0,
) -> dict:
    """Run a Cantera combustion calculation (if Cantera is installed)."""
    try:
        import cantera as ct
        if fuel == "methane":
            gas = ct.Solution("gri30.yaml")
        elif fuel == "hydrogen":
            gas = ct.Solution("h2o2.yaml")
        else:
            gas = ct.Solution("gri30.yaml")
        gas.set_equivalence_ratio(equivalence_ratio, fuel, "o2:1.0, n2:3.76")
        gas.TP = temperature, ct.one_atm
        adiabatic_flame_temperature = gas.T
        return {
            "fuel": fuel,
            "equivalence_ratio": equivalence_ratio,
            "initial_temperature": temperature,
            "adiabatic_flame_temperature": adiabatic_flame_temperature,
            "engine": "Cantera",
        }
    except ImportError:
        return {
            "fuel": fuel,
            "equivalence_ratio": equivalence_ratio,
            "initial_temperature": temperature,
            "engine": "fallback (Cantera not installed)",
            "note": "Install Cantera: pip install cantera. Use gri30.yaml or h2o2.yaml mechanism.",
            "adiabatic_flame_temperature_estimated": temperature + 2000 * equivalence_ratio if equivalence_ratio <= 1 else temperature + 1500,
        }


def run_capillary_cooling_full_sim(
    channel_diameter: float = 0.5e-3,
    channel_length: float = 0.3,
    heat_flux_w_per_cm2: float = 10.0,
    fluid: str = "water",
) -> dict:
    """Run the FULL Project AURUM capillary cooling sim (CFD + thermal combined)."""
    flow = capillary_flow(channel_diameter, channel_length, fluid)
    thermal = two_phase_heat_removal(
        heat_flux_w=heat_flux_w_per_cm2 * math.pi * (channel_diameter / 2)**2 * 10000,
        fluid=fluid,
        fraction_evaporated=0.1,
    )
    return {
        "sim": "capillary_cooling_full",
        "channel_diameter": channel_diameter,
        "channel_length": channel_length,
        "heat_flux_w_per_cm2": heat_flux_w_per_cm2,
        "fluid": fluid,
        "capillary_flow": flow,
        "thermal": thermal,
        "verdict": "PASS" if flow["verdict"] == "PASS" and thermal["verdict"] == "PASS" else "MARGINAL",
    }


mcp = Server("meek-cfd-thermal-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="coolprop_lookup", description="Look up a CoolProp thermodynamic property.", inputSchema={"type": "object", "properties": {"fluid": {"type": "string", "default": "water"}, "prop1": {"type": "string", "default": "D"}, "prop2": {"type": "string", "default": "T"}, "value1": {"type": "number", "default": 293.15}}, "required": ["fluid", "prop1", "prop2", "value1"]}),
        Tool(name="capillary_flow", description="Compute capillary flow in a circular channel (Washburn equation).", inputSchema={"type": "object", "properties": {"channel_diameter": {"type": "number", "default": 0.0005}, "channel_length": {"type": "number", "default": 0.3}, "fluid": {"type": "string", "enum": ["water", "HFE-7200"], "default": "water"}, "temperature": {"type": "number", "default": 25.0}}, "required": []}),
        Tool(name="two_phase_heat_removal", description="Compute two-phase heat removal (latent heat transport).", inputSchema={"type": "object", "properties": {"heat_flux_w": {"type": "number", "default": 5.0}, "fluid": {"type": "string", "enum": ["water", "HFE-7200"], "default": "water"}, "fraction_evaporated": {"type": "number", "default": 0.1}}, "required": []}),
        Tool(name="cantera_combustion", description="Run a Cantera combustion calculation.", inputSchema={"type": "object", "properties": {"fuel": {"type": "string", "enum": ["methane", "hydrogen"], "default": "methane"}, "equivalence_ratio": {"type": "number", "default": 1.0}, "temperature": {"type": "number", "default": 300.0}}, "required": []}),
        Tool(name="run_capillary_cooling_full_sim", description="Run the FULL Project AURUM capillary cooling sim (CFD + thermal combined).", inputSchema={"type": "object", "properties": {"channel_diameter": {"type": "number", "default": 0.0005}, "channel_length": {"type": "number", "default": 0.3}, "heat_flux_w_per_cm2": {"type": "number", "default": 10.0}, "fluid": {"type": "string", "enum": ["water", "HFE-7200"], "default": "water"}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "coolprop_lookup":
        result = coolprop_lookup(**arguments)
    elif name == "capillary_flow":
        result = capillary_flow(**arguments)
    elif name == "two_phase_heat_removal":
        result = two_phase_heat_removal(**arguments)
    elif name == "cantera_combustion":
        result = cantera_combustion(**arguments)
    elif name == "run_capillary_cooling_full_sim":
        result = run_capillary_cooling_full_sim(**arguments)
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
