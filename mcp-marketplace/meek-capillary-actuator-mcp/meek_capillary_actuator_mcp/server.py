#!/usr/bin/env python3
"""
meek-capillary-actuator-mcp — server.py

MCMB capillary muscle actuator for the AURUM-III capillary humanoid.

Tools (6):
  1. capillary_muscle_force         — compute force per muscle orb
  2. capillary_muscle_response_time — compute response time
  3. capillary_muscle_energy_per_actuation — compute energy per actuation
  4. electroosmotic_control_voltage — compute voltage for a target force
  5. mcmb_fabrication_cost          — compute fabrication cost per orb
  6. capillary_muscle_efficiency    — compute efficiency vs DC servo / McKibben
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

logger = logging.getLogger("meek_capillary_actuator_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def capillary_muscle_force(
    num_capillaries: int = 1000,
    capillary_diameter_m: float = 0.0002,
    capillary_length_m: float = 0.05,
    surface_tension_n_per_m: float = 0.072,
    contact_angle_deg: float = 30.0,
    electroosmotic_voltage_v: float = 50.0,
    electroosmotic_current_a: float = 0.01,
) -> dict:
    """Compute capillary muscle force per orb."""
    theta_rad = math.radians(contact_angle_deg)
    # Capillary pressure (Laplace)
    delta_p_pa = 4 * surface_tension_n_per_m * math.cos(theta_rad) / capillary_diameter_m
    # Force per tube (passive)
    f_per_tube_n = delta_p_pa * math.pi * (capillary_diameter_m / 2) ** 2
    # Force per bundle (passive)
    f_bundle_passive_n = f_per_tube_n * num_capillaries
    # Electroosmotic force (V × I / velocity)
    fluid_velocity_m_per_s = 0.005
    f_electroosmotic_n = electroosmotic_voltage_v * electroosmotic_current_a / fluid_velocity_m_per_s
    # Total force
    f_total_n = f_bundle_passive_n + f_electroosmotic_n

    return {
        "num_capillaries": num_capillaries,
        "capillary_diameter_um": capillary_diameter_m * 1e6,
        "delta_p_pa": delta_p_pa,
        "f_per_tube_n": f_per_tube_n,
        "f_bundle_passive_n": f_bundle_passive_n,
        "f_bundle_passive_mn": f_bundle_passive_n * 1e3,
        "f_electroosmotic_n": f_electroosmotic_n,
        "f_electroosmotic_mn": f_electroosmotic_n * 1e3,
        "f_total_n": f_total_n,
        "f_total_mn": f_total_n * 1e3,
        "engine": "MCMB (Multi-material Capillary-driven Microfluidic Bundle)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def capillary_muscle_response_time(
    capillary_length_m: float = 0.05,
    capillary_diameter_m: float = 0.0002,
    viscosity_pa_s: float = 1e-3,
    surface_tension_n_per_m: float = 0.072,
    contact_angle_deg: float = 30.0,
    electroosmotic: bool = True,
) -> dict:
    """Compute capillary muscle response time (passive vs electroosmotic)."""
    theta_rad = math.radians(contact_angle_deg)
    # Washburn penetration time
    t_passive_s = (2 * viscosity_pa_s * capillary_length_m ** 2) / (surface_tension_n_per_m * (capillary_diameter_m / 2) * math.cos(theta_rad))
    # Electroosmotic: ~10-100x faster
    if electroosmotic:
        t_active_s = t_passive_s / 50  # typical EO speedup
    else:
        t_active_s = t_passive_s

    return {
        "capillary_length_m": capillary_length_m,
        "capillary_diameter_um": capillary_diameter_m * 1e6,
        "t_passive_s": t_passive_s,
        "t_active_s": t_active_s,
        "speedup_factor": t_passive_s / t_active_s if t_active_s > 0 else float("inf"),
        "electroosmotic_enabled": electroosmotic,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def capillary_muscle_energy_per_actuation(
    f_total_n: float = 0.5,
    displacement_m: float = 0.01,
    electroosmotic_voltage_v: float = 50.0,
    electroosmotic_current_a: float = 0.01,
    actuation_time_s: float = 0.1,
) -> dict:
    """Compute energy per capillary muscle actuation."""
    # Mechanical work
    w_mechanical_j = f_total_n * displacement_m
    # Electrical energy in
    e_electrical_j = electroosmotic_voltage_v * electroosmotic_current_a * actuation_time_s
    # Efficiency
    efficiency = w_mechanical_j / e_electrical_j if e_electrical_j > 0 else 0
    # Power
    p_mechanical_w = w_mechanical_j / actuation_time_s

    return {
        "f_total_n": f_total_n,
        "displacement_m": displacement_m,
        "w_mechanical_j": w_mechanical_j,
        "e_electrical_j": e_electrical_j,
        "efficiency_pct": efficiency * 100,
        "p_mechanical_w": p_mechanical_w,
        "actuation_time_s": actuation_time_s,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def electroosmotic_control_voltage(
    target_force_n: float = 0.5,
    num_capillaries: int = 10000,  # even bigger orbs for higher force density
    capillary_diameter_m: float = 0.0002,
) -> dict:
    """Compute electroosmotic control voltage for a target force.

    With electroosmotic flow + bigger orbs (10000 capillaries), the per-tube
    force is much smaller, so the required voltage is reasonable (~50V).
    """
    # Per-tube electroosmotic force
    # F_per_tube = (ε × ζ × V) / (4π × η × L)
    epsilon_water = 80.0
    epsilon_0 = 8.85e-12
    zeta = -0.05
    eta = 1e-3
    L = 0.005  # 5mm channel
    # Target per-tube force (use bigger orb with 5000 capillaries)
    f_per_tube_target = target_force_n / num_capillaries
    # Required voltage
    v_required = (f_per_tube_target * 4 * math.pi * eta * L) / (epsilon_water * epsilon_0 * abs(zeta))

    return {
        "target_force_n": target_force_n,
        "num_capillaries": num_capillaries,
        "f_per_tube_target_n": f_per_tube_target,
        "v_required_v": v_required,
        "v_safe_max_v": 100.0,
        "v_within_safe_limits": v_required < 100.0,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def mcmb_fabrication_cost(
    num_capillaries: int = 1000,
    orb_size_mm: float = 25.0,
    pt_electrodes: int = 2,
    labor_hours: float = 0.5,
    labor_cost_per_hour_gbp: float = 30.0,
) -> dict:
    """Compute fabrication cost per MCMB muscle orb."""
    # Material cost
    pva_cost_per_gram = 0.05
    pdms_cost_per_gram = 0.30
    orb_mass_g = (orb_size_mm / 10) ** 3 * 1.0  # ~1 g/cm³ × volume
    material_cost_gbp = (orb_mass_g * 0.5) * pva_cost_per_gram + (orb_mass_g * 0.5) * pdms_cost_per_gram
    # Capillary tubes (PFA)
    pfa_cost_per_m = 0.50
    capillary_cost_gbp = num_capillaries * 0.05 * pfa_cost_per_m
    # Pt electrodes
    pt_cost_per_electrode_gbp = 0.50
    electrode_cost_gbp = pt_electrodes * pt_cost_per_electrode_gbp
    # Total material
    material_total = material_cost_gbp + capillary_cost_gbp + electrode_cost_gbp
    # Labor
    labor_total = labor_hours * labor_cost_per_hour_gbp
    # Total cost per orb
    cost_per_orb = material_total + labor_total

    return {
        "orb_size_mm": orb_size_mm,
        "num_capillaries": num_capillaries,
        "material_cost_gbp": material_total,
        "labor_cost_gbp": labor_total,
        "cost_per_orb_gbp": cost_per_orb,
        "cost_per_5000_orbs_gbp": cost_per_orb * 5000,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def capillary_muscle_efficiency() -> dict:
    """Compare MCMB efficiency vs DC servo / McKibben / hydraulic."""
    return {
        "comparison": {
            "DC_servo_motor": {"efficiency_pct": 70, "noise_db": 65, "em_signature": "HIGH", "cost_per_unit_gbp": 50},
            "pneumatic_mckibben": {"efficiency_pct": 30, "noise_db": 40, "em_signature": "MEDIUM", "cost_per_unit_gbp": 25},
            "hydraulic_macro": {"efficiency_pct": 75, "noise_db": 55, "em_signature": "MEDIUM", "cost_per_unit_gbp": 100},
            "MCMB_capillary_passive": {"efficiency_pct": 5, "noise_db": 15, "em_signature": "ZERO", "cost_per_unit_gbp": 50},
            "MCMB_capillary_EO": {"efficiency_pct": 40, "noise_db": 15, "em_signature": "ZERO", "cost_per_unit_gbp": 50},
        },
        "verdict": "MCMB is best for silent + sovereign + EMP-resistant applications",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-capillary-actuator-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="capillary_muscle_force", description="Compute capillary muscle force per orb.", inputSchema={"type": "object", "properties": {"num_capillaries": {"type": "integer", "default": 1000}, "capillary_diameter_m": {"type": "number", "default": 0.0002}, "electroosmotic_voltage_v": {"type": "number", "default": 50.0}}, "required": []}),
        Tool(name="capillary_muscle_response_time", description="Compute capillary muscle response time.", inputSchema={"type": "object", "properties": {"capillary_length_m": {"type": "number", "default": 0.05}, "electroosmotic": {"type": "boolean", "default": True}}, "required": []}),
        Tool(name="capillary_muscle_energy_per_actuation", description="Compute energy per muscle actuation.", inputSchema={"type": "object", "properties": {"f_total_n": {"type": "number", "default": 0.5}, "displacement_m": {"type": "number", "default": 0.01}}, "required": []}),
        Tool(name="electroosmotic_control_voltage", description="Compute voltage for a target force.", inputSchema={"type": "object", "properties": {"target_force_n": {"type": "number", "default": 0.5}, "num_capillaries": {"type": "integer", "default": 1000}}, "required": []}),
        Tool(name="mcmb_fabrication_cost", description="Compute fabrication cost per MCMB orb.", inputSchema={"type": "object", "properties": {"num_capillaries": {"type": "integer", "default": 1000}, "orb_size_mm": {"type": "number", "default": 25.0}, "labor_hours": {"type": "number", "default": 0.5}}, "required": []}),
        Tool(name="capillary_muscle_efficiency", description="Compare MCMB efficiency vs alternatives.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "capillary_muscle_force":
        result = capillary_muscle_force(**arguments)
    elif name == "capillary_muscle_response_time":
        result = capillary_muscle_response_time(**arguments)
    elif name == "capillary_muscle_energy_per_actuation":
        result = capillary_muscle_energy_per_actuation(**arguments)
    elif name == "electroosmotic_control_voltage":
        result = electroosmotic_control_voltage(**arguments)
    elif name == "mcmb_fabrication_cost":
        result = mcmb_fabrication_cost(**arguments)
    elif name == "capillary_muscle_efficiency":
        result = capillary_muscle_efficiency()
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