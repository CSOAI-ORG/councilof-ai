#!/usr/bin/env python3
"""
meek-circulatory-capillary-mcp — server.py

The living fluid network (heart + arteries + veins + capillaries + valves).

Tools (6):
  1. working_fluid_composition     — compute the fluid composition
  2. peristaltic_heart_pump        — compute the heart pump specs
  3. capillary_artery_vein         — compute the artery/vein specs
  4. capillary_valve_network       — compute the valve network
  5. blood_orb_cycle               — compute the life cycle parameters
  6. circulatory_resilience        — compute the resilience to pump failure
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

logger = logging.getLogger("meek_circulatory_capillary_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def working_fluid_composition(
    num_orbs: int = 5005,
    fluid_volume_per_orb_ml: float = 0.1,
    na_cl_concentration_m: float = 0.1,
) -> dict:
    """Compute the working fluid composition."""
    total_volume_ml = num_orbs * fluid_volume_per_orb_ml
    # NaCl mass (per 1000 mL of 0.1 M solution = 5.85 g NaCl)
    na_cl_mass_g = (na_cl_concentration_m * 58.44 * total_volume_ml) / 1000
    # Glucose (for fuel cells): 5 mM
    glucose_mass_g = 0.005 * 180.16 * total_volume_ml / 1000
    # Dissolved O2 (for energy harvesting): 8 mg/L at 25°C
    o2_mass_mg = 8 * total_volume_ml / 1000
    # pH
    ph = 7.4  # physiological

    return {
        "num_orbs": num_orbs,
        "fluid_volume_per_orb_ml": fluid_volume_per_orb_ml,
        "total_volume_ml": total_volume_ml,
        "total_volume_l": total_volume_ml / 1000,
        "na_cl_concentration_m": na_cl_concentration_m,
        "na_cl_mass_g": na_cl_mass_g,
        "glucose_mass_g": glucose_mass_g,
        "o2_mass_mg": o2_mass_mg,
        "ph": ph,
        "fluid": "water + 0.1M NaCl + 5mM glucose + 8mg/L O2 (physiological)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def peristaltic_heart_pump(
    flow_rate_ml_per_min: float = 100.0,
    pressure_mmhg: float = 75.0,
    tube_id_mm: float = 4.0,
    roller_rpm: int = 70,
) -> dict:
    """Compute the peristaltic heart pump specs."""
    # Peristaltic flow rate: Q = π × D × L × RPM (approximate)
    # For a 3-roller pump with 10mm roller length:
    roller_length_mm = 10.0
    q_per_roller = math.pi * tube_id_mm * roller_length_mm * roller_rpm  # mm³/min
    q_per_roller_ml_per_min = q_per_roller / 1000
    num_rollers = 3
    total_flow_ml_per_min = q_per_roller_ml_per_min * num_rollers

    # Power
    # Pressure × flow rate / efficiency
    pressure_pa = pressure_mmhg * 133.322  # 1 mmHg = 133.322 Pa
    flow_m3_per_s = total_flow_ml_per_min / 1e6 / 60
    hydraulic_power_w = pressure_pa * flow_m3_per_s
    motor_efficiency = 0.7
    electrical_power_w = hydraulic_power_w / motor_efficiency

    return {
        "flow_rate_ml_per_min": total_flow_ml_per_min,
        "pressure_mmhg": pressure_mmhg,
        "tube_id_mm": tube_id_mm,
        "roller_rpm": roller_rpm,
        "roller_length_mm": roller_length_mm,
        "num_rollers": num_rollers,
        "bpm": roller_rpm,  # peristaltic pump beats per minute
        "hydraulic_power_w": hydraulic_power_w,
        "electrical_power_w": electrical_power_w,
        "motor_type": "3-phase BLDC (24V DC)",
        "commercial_part": "Watson-Marlow 120U/DV (£400)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def capillary_artery_vein(
    flow_rate_ml_per_min: float = 100.0,
    artery_diameter_mm: float = 2.0,
    artery_length_m: float = 1.5,
    vein_diameter_mm: float = 3.0,
    vein_length_m: float = 1.5,
) -> dict:
    """Compute the artery/vein specs."""
    # Pressure drop (Hagen-Poiseuille)
    eta = 1e-3  # water viscosity
    q_m3_per_s = flow_rate_ml_per_min / 1e6 / 60
    # Artery
    artery_radius_m = artery_diameter_mm / 2 / 1000
    artery_cross_section = math.pi * artery_radius_m ** 2
    artery_velocity = q_m3_per_s / artery_cross_section
    artery_dp = (32 * eta * artery_length_m * artery_velocity) / (artery_diameter_mm / 1000) ** 2
    # Vein
    vein_radius_m = vein_diameter_mm / 2 / 1000
    vein_cross_section = math.pi * vein_radius_m ** 2
    vein_velocity = q_m3_per_s / vein_cross_section
    vein_dp = (32 * eta * vein_length_m * vein_velocity) / (vein_diameter_mm / 1000) ** 2
    # Convert to mmHg
    artery_dp_mmhg = artery_dp / 133.322
    vein_dp_mmhg = vein_dp / 133.322

    return {
        "flow_rate_ml_per_min": flow_rate_ml_per_min,
        "artery_diameter_mm": artery_diameter_mm,
        "artery_length_m": artery_length_m,
        "artery_velocity_m_per_s": artery_velocity,
        "artery_pressure_drop_pa": artery_dp,
        "artery_pressure_drop_mmhg": artery_dp_mmhg,
        "vein_diameter_mm": vein_diameter_mm,
        "vein_length_m": vein_length_m,
        "vein_velocity_m_per_s": vein_velocity,
        "vein_pressure_drop_pa": vein_dp,
        "vein_pressure_drop_mmhg": vein_dp_mmhg,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def capillary_valve_network(
    num_orbs: int = 5005,
    valves_per_orb: int = 2,  # 1 electroosmotic + 1 passive check
    electroosmotic_valve_cost_gbp: float = 0.50,
    passive_check_valve_cost_gbp: float = 0.10,
) -> dict:
    """Compute the valve network."""
    total_valves = num_orbs * valves_per_orb
    total_cost_gbp = num_orbs * (electroosmotic_valve_cost_gbp + passive_check_valve_cost_gbp)
    # Electroosmotic valve response time
    eo_response_time_ms = 10
    # Passive check valve cracking pressure
    cracking_pressure_mmhg = 5

    return {
        "num_orbs": num_orbs,
        "valves_per_orb": valves_per_orb,
        "total_valves": total_valves,
        "total_cost_gbp": total_cost_gbp,
        "electroosmotic_valve_cost_gbp": electroosmotic_valve_cost_gbp,
        "passive_check_valve_cost_gbp": passive_check_valve_cost_gbp,
        "eo_response_time_ms": eo_response_time_ms,
        "cracking_pressure_mmhg": cracking_pressure_mmhg,
        "valve_type": "1 electroosmotic (active) + 1 passive check (backup)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def blood_orb_cycle(
    bpm: int = 70,
    stroke_volume_ml: float = 1.4,
    num_orbs: int = 5005,
) -> dict:
    """Compute the life cycle parameters."""
    cardiac_output_ml_per_min = bpm * stroke_volume_ml
    cycle_time_s = 60.0 / bpm
    # Per-orb time to fill (assuming uniform distribution)
    orb_fill_time_s = cycle_time_s  # all orbs fill in one cycle
    # Per-orb volume per cycle
    per_orb_volume_per_cycle_ml = cardiac_output_ml_per_min / (num_orbs * bpm / 60)
    # Number of cycles per day
    cycles_per_day = bpm * 60 * 24

    return {
        "bpm": bpm,
        "stroke_volume_ml": stroke_volume_ml,
        "cardiac_output_ml_per_min": cardiac_output_ml_per_min,
        "cycle_time_s": cycle_time_s,
        "num_orbs": num_orbs,
        "per_orb_volume_per_cycle_ml": per_orb_volume_per_cycle_ml,
        "orb_fill_time_s": orb_fill_time_s,
        "cycles_per_day": cycles_per_day,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def circulatory_resilience(
    num_pumps: int = 1,
    pump_failure_pct: float = 50.0,
    redundancy_factor: int = 2,
    total_fluid_volume_ml: float = 500.0,
) -> dict:
    """Compute the resilience to pump failure."""
    failed_pumps = num_pumps * (pump_failure_pct / 100)
    surviving_pumps = num_pumps - failed_pumps
    # With redundancy, system survives if at least 1 pump survives
    if redundancy_factor >= num_pumps:
        system_survives = True
    else:
        system_survives = surviving_pumps >= 1
    # Fluid buffer (allows ~30 seconds of operation without pump)
    fluid_buffer_time_s = total_fluid_volume_ml / 100  # 100 mL/min baseline flow

    return {
        "num_pumps": num_pumps,
        "pump_failure_pct": pump_failure_pct,
        "redundancy_factor": redundancy_factor,
        "failed_pumps": failed_pumps,
        "surviving_pumps": surviving_pumps,
        "system_survives": system_survives,
        "fluid_buffer_time_s": fluid_buffer_time_s,
        "verdict": "RESILIENT" if system_survives else "CRITICAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-circulatory-capillary-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="working_fluid_composition", description="Compute the working fluid composition.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "fluid_volume_per_orb_ml": {"type": "number", "default": 0.1}}, "required": []}),
        Tool(name="peristaltic_heart_pump", description="Compute the peristaltic heart pump specs.", inputSchema={"type": "object", "properties": {"flow_rate_ml_per_min": {"type": "number", "default": 100.0}, "pressure_mmhg": {"type": "number", "default": 75.0}, "roller_rpm": {"type": "integer", "default": 70}}, "required": []}),
        Tool(name="capillary_artery_vein", description="Compute the artery/vein specs.", inputSchema={"type": "object", "properties": {"flow_rate_ml_per_min": {"type": "number", "default": 100.0}, "artery_diameter_mm": {"type": "number", "default": 2.0}, "vein_diameter_mm": {"type": "number", "default": 3.0}}, "required": []}),
        Tool(name="capillary_valve_network", description="Compute the valve network.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}}, "required": []}),
        Tool(name="blood_orb_cycle", description="Compute the life cycle parameters.", inputSchema={"type": "object", "properties": {"bpm": {"type": "integer", "default": 70}, "num_orbs": {"type": "integer", "default": 5005}}, "required": []}),
        Tool(name="circulatory_resilience", description="Compute the resilience to pump failure.", inputSchema={"type": "object", "properties": {"num_pumps": {"type": "integer", "default": 1}, "pump_failure_pct": {"type": "number", "default": 50.0}, "redundancy_factor": {"type": "integer", "default": 2}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "working_fluid_composition":
        result = working_fluid_composition(**arguments)
    elif name == "peristaltic_heart_pump":
        result = peristaltic_heart_pump(**arguments)
    elif name == "capillary_artery_vein":
        result = capillary_artery_vein(**arguments)
    elif name == "capillary_valve_network":
        result = capillary_valve_network(**arguments)
    elif name == "blood_orb_cycle":
        result = blood_orb_cycle(**arguments)
    elif name == "circulatory_resilience":
        result = circulatory_resilience(**arguments)
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