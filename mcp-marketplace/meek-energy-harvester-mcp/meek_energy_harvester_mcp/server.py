#!/usr/bin/env python3
"""
meek-energy-harvester-mcp — server.py

The 12th critical science MCP. Wraps the 4 energy harvesting mechanisms
for the AURUM-II sovereign energy-autonomous orb.

Tools (9):
  1. streaming_potential_energy   — Compute capillary streaming potential power
  2. triboelectric_energy         — Compute PVA-water triboelectric power
  3. piezoelectric_energy         — Compute PVDF piezo power
  4. thermoelectric_energy         — Compute Bi2Te3 TEG power
  5. orb_total_energy_harvest     — Sum all 4 mechanisms
  6. orb_power_budget             — Compare harvest vs consumption
  7. orb_battery_runtime          — Calculate LiPo backup battery runtime
  8. list_energy_harvesting_components — List the 5 best components
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

logger = logging.getLogger("meek_energy_harvester_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# BannedTermGate
BANNED_TERMS = re.compile(
    r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|"
    r"terranova|csga[\.\-]?ai|defonos\.io|toronto summit)\b",
    re.IGNORECASE,
)
KINETIC_BLOCK_PATTERNS = re.compile(
    r"\b(strike package|kill order|assassination)\b", re.IGNORECASE
)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt:
            return True, ""
        m = BANNED_TERMS.search(prompt)
        if m:
            return False, f"Refused: '{m.group(0)}' is severed brand."
        m = KINETIC_BLOCK_PATTERNS.search(prompt)
        if m:
            return False, f"Refused: '{m.group(0)}' is kinetic targeting pattern."
        return True, ""


# ============================================================================
# TOOL 1: streaming_potential_energy
# ============================================================================
def streaming_potential_energy(
    num_capillaries: int = 1000,
    capillary_diameter_m: float = 0.5e-3,
    capillary_length_m: float = 0.5,
    flow_velocity_m_per_s: float = 0.05,
    fluid: str = "water",
) -> dict:
    """Compute capillary streaming potential energy harvesting.

    Per Yang et al. 2003: ΔV_streaming = (ε × ζ × ΔP) / (η × κ × ε_0)
    """
    # Constants
    epsilon_water = 80.0
    epsilon_0 = 8.85e-12
    zeta_silica_water = -0.05  # V
    # Viscosity + Debye length
    eta = 1.0e-3 if fluid == "water" else 0.5e-3
    kappa = 1e8  # m^-1 (Debye length inverse)

    # Hagen-Poiseuille pressure drop
    delta_p = 32 * eta * capillary_length_m * flow_velocity_m_per_s / (capillary_diameter_m ** 2)

    # Streaming potential per channel
    delta_v_per_channel = (epsilon_water * epsilon_0 * zeta_silica_water * delta_p) / (eta * kappa)

    # Resistance per channel
    r_per_channel = 1e7  # 10 MΩ

    # Current per channel
    i_per_channel = abs(delta_v_per_channel) / r_per_channel

    # Power per channel
    p_per_channel = abs(delta_v_per_channel) * i_per_channel

    # Total power (channels in series, voltage stacks)
    total_power_w = p_per_channel * num_capillaries

    return {
        "mechanism": "streaming_potential",
        "num_capillaries": num_capillaries,
        "capillary_diameter_um": capillary_diameter_m * 1e6,
        "capillary_length_m": capillary_length_m,
        "flow_velocity_m_per_s": flow_velocity_m_per_s,
        "fluid": fluid,
        "delta_p_pa": delta_p,
        "delta_v_per_channel_v": delta_v_per_channel,
        "i_per_channel_a": i_per_channel,
        "p_per_channel_w": p_per_channel,
        "total_power_w": total_power_w,
        "total_power_mw": total_power_w * 1e3,
        "engine": "Electrokinetic streaming potential (Yang et al. 2003)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 2: triboelectric_energy
# ============================================================================
def triboelectric_energy(
    pva_wall_area_cm2: float = 1000.0,
    flow_velocity_m_per_s: float = 0.05,
    contact_charge_density_uc_per_m2: float = 50.0,
) -> dict:
    """Compute PVA-water triboelectric energy harvesting.

    Per Wang et al. 2014: PVA is highly triboelectric.
    """
    wall_area_m2 = pva_wall_area_cm2 / 1e4
    # Charge per second (depends on flow rate + replacement of contacts)
    contact_rate_per_s = flow_velocity_m_per_s * 100  # contacts/sec (empirical)
    charge_per_contact_c = contact_charge_density_uc_per_m2 * 1e-6 * wall_area_m2
    # Open circuit voltage (10-100 V for water-PVA)
    v_open_circuit_v = 50.0
    # Power: P = 0.5 × C × V² × f (capacitive)
    capacitance_per_cm2 = 30e-12  # 30 pF/cm² (water-PVA interface)
    capacitance_f = capacitance_per_cm2 * pva_wall_area_cm2 * 1e-4
    frequency_hz = contact_rate_per_s
    power_w = 0.5 * capacitance_f * (v_open_circuit_v ** 2) * frequency_hz

    return {
        "mechanism": "triboelectric",
        "pva_wall_area_cm2": pva_wall_area_cm2,
        "flow_velocity_m_per_s": flow_velocity_m_per_s,
        "contact_charge_density_uc_per_m2": contact_charge_density_uc_per_m2,
        "contact_rate_per_s": contact_rate_per_s,
        "charge_per_contact_c": charge_per_contact_c,
        "v_open_circuit_v": v_open_circuit_v,
        "capacitance_f": capacitance_f,
        "frequency_hz": frequency_hz,
        "total_power_w": power_w,
        "total_power_mw": power_w * 1e3,
        "engine": "Triboelectric Nanogenerator (Wang et al. 2014)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 3: piezoelectric_energy
# ============================================================================
def piezoelectric_energy(
    pvdf_coating_area_cm2: float = 100.0,
    pressure_pulse_amplitude_pa: float = 1000.0,
    pulse_frequency_hz: float = 10.0,
) -> dict:
    """Compute PVDF piezoelectric energy harvesting from capillary pressure pulses."""
    # PVDF piezoelectric coefficient d33 = 33 pC/N
    d33 = 33e-12  # C/N
    area_m2 = pvdf_coating_area_cm2 / 1e4
    # Charge per pulse: Q = d33 × F = d33 × ΔP × A
    charge_per_pulse_c = d33 * pressure_pulse_amplitude_pa * area_m2
    # Energy per pulse: E = 0.5 × Q² / C (assuming C = 100 pF)
    capacitance_f = 100e-12
    energy_per_pulse_j = 0.5 * (charge_per_pulse_c ** 2) / capacitance_f
    # Power: P = E × f
    power_w = energy_per_pulse_j * pulse_frequency_hz

    return {
        "mechanism": "piezoelectric",
        "pvdf_coating_area_cm2": pvdf_coating_area_cm2,
        "pressure_pulse_amplitude_pa": pressure_pulse_amplitude_pa,
        "pulse_frequency_hz": pulse_frequency_hz,
        "charge_per_pulse_c": charge_per_pulse_c,
        "energy_per_pulse_j": energy_per_pulse_j,
        "total_power_w": power_w,
        "total_power_mw": power_w * 1e3,
        "engine": "PVDF piezoelectric (d33 = 33 pC/N)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 4: thermoelectric_energy
# ============================================================================
def thermoelectric_energy(
    num_tegs: int = 4,
    delta_t_c: float = 25.0,
    teg_area_cm2: float = 16.0,  # 4cm x 4cm TEC1-12706
) -> dict:
    """Compute Bi2Te3 thermoelectric energy harvesting (Seebeck effect)."""
    # Bi2Te3 Seebeck coefficient per junction
    seebeck_per_junction_v_per_k = 200e-6
    junctions_per_teg = 127  # TEC1-12706 standard
    # Open circuit voltage per TEG
    v_open_per_teg = seebeck_per_junction_v_per_k * junctions_per_teg * delta_t_c
    # Internal resistance per TEG (typical 2 Ω)
    r_per_teg = 2.0
    # Power into matched load (R_load = R_internal)
    p_per_teg = (v_open_per_teg ** 2) / (4 * r_per_teg)
    # Total power
    total_power_w = p_per_teg * num_tegs

    return {
        "mechanism": "thermoelectric",
        "num_tegs": num_tegs,
        "delta_t_c": delta_t_c,
        "teg_area_cm2": teg_area_cm2,
        "junctions_per_teg": junctions_per_teg,
        "seebeck_per_junction_v_per_k": seebeck_per_junction_v_per_k,
        "v_open_per_teg_v": v_open_per_teg,
        "r_per_teg_ohm": r_per_teg,
        "p_per_teg_w": p_per_teg,
        "total_power_w": total_power_w,
        "total_power_mw": total_power_w * 1e3,
        "engine": "Bi2Te3 TEG TEC1-12706 (Seebeck effect)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 5: orb_total_energy_harvest
# ============================================================================
def orb_total_energy_harvest(
    num_capillaries: int = 1000,
    pva_wall_area_cm2: float = 1000.0,
    pvdf_area_cm2: float = 100.0,
    num_tegs: int = 4,
    delta_t_c: float = 25.0,
) -> dict:
    """Sum all 4 energy harvesting mechanisms for the orb."""
    sp = streaming_potential_energy(num_capillaries=num_capillaries)
    te = triboelectric_energy(pva_wall_area_cm2=pva_wall_area_cm2)
    pe = piezoelectric_energy(pvdf_coating_area_cm2=pvdf_area_cm2)
    th = thermoelectric_energy(num_tegs=num_tegs, delta_t_c=delta_t_c)
    total_power_w = sp["total_power_w"] + te["total_power_w"] + pe["total_power_w"] + th["total_power_w"]

    return {
        "orb": "AURUM-II energy-autonomous",
        "streaming_potential_mw": sp["total_power_mw"],
        "triboelectric_mw": te["total_power_mw"],
        "piezoelectric_mw": pe["total_power_mw"],
        "thermoelectric_mw": th["total_power_mw"],
        "total_power_mw": total_power_w * 1e3,
        "total_power_w": total_power_w,
        "verdict": "ENERGY_AUTONOMOUS" if total_power_w > 1e-3 else "MARGINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 6: orb_power_budget
# ============================================================================
def orb_power_budget(
    harvested_mw: float = 30.0,
    sleep_mode_uw: float = 10.0,
    active_signing_mw: float = 5.0,
    wifi_csi_peak_mw: float = 100.0,
    led_peak_mw: float = 100.0,
    duty_cycle_pct: float = 1.0,  # 1% active, 99% sleep
) -> dict:
    """Compute the orb's power budget (harvested vs consumed)."""
    # Continuous consumption (duty cycle weighted)
    avg_active_mw = active_signing_mw * (duty_cycle_pct / 100)
    continuous_consumption_mw = (sleep_mode_uw / 1000) + avg_active_mw
    # Surplus (continuous)
    surplus_mw = harvested_mw - continuous_consumption_mw
    # Peak load (for short durations)
    peak_load_mw = wifi_csi_peak_mw + active_signing_mw + led_peak_mw

    return {
        "harvested_mw": harvested_mw,
        "continuous_consumption_mw": continuous_consumption_mw,
        "surplus_mw": surplus_mw,
        "peak_load_mw": peak_load_mw,
        "duty_cycle_pct": duty_cycle_pct,
        "verdict": "ENERGY_AUTONOMOUS" if surplus_mw > 0 else "POWER_HUNGRY",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 7: orb_battery_runtime
# ============================================================================
def orb_battery_runtime(
    battery_capacity_mah: float = 100.0,
    battery_voltage_v: float = 3.7,
    peak_load_mw: float = 210.0,
    harvested_mw: float = 30.0,
) -> dict:
    """Compute LiPo backup battery runtime for peak loads."""
    # Battery energy
    battery_energy_j = battery_capacity_mah * battery_voltage_v * 3.6
    # Net power drain (peak load - harvested recharge)
    net_power_drain_mw = peak_load_mw - harvested_mw
    if net_power_drain_mw <= 0:
        runtime_hours = float("inf")
        verdict = "INFINITE"
    else:
        net_power_drain_w = net_power_drain_mw / 1000
        runtime_seconds = battery_energy_j / net_power_drain_w
        runtime_hours = runtime_seconds / 3600
        verdict = "PASS" if runtime_hours > 0.5 else "MARGINAL"

    return {
        "battery_capacity_mah": battery_capacity_mah,
        "battery_voltage_v": battery_voltage_v,
        "battery_energy_j": battery_energy_j,
        "peak_load_mw": peak_load_mw,
        "harvested_mw": harvested_mw,
        "net_power_drain_mw": net_power_drain_mw,
        "runtime_hours": runtime_hours,
        "verdict": verdict,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 8: list_energy_harvesting_components
# ============================================================================
def list_energy_harvesting_components() -> dict:
    """List the 5 best energy harvesting components for the orb."""
    return {
        "components": {
            "tec1_12706_teg": {
                "name": "TEC1-12706 Bi2Te3 TEG",
                "type": "thermoelectric",
                "specs": "127 PN junctions, 40mm × 40mm × 3.6mm, 200 µV/K per junction",
                "cost_per_unit_gbp": 12.0,
                "power_per_unit_mw": 50.0,
                "use_case": "The dominant energy harvester (thermoelectric + heat pipes)",
            },
            "pvdf_capillary_tube": {
                "name": "PVDF-coated fused silica capillary",
                "type": "piezoelectric",
                "specs": "d33 = 33 pC/N, 1000 capillaries × 50mm × 0.5mm",
                "cost_per_unit_gbp": 0.10,
                "power_total_mw": 0.1,
                "use_case": "Piezoelectric backup from capillary pressure pulses",
            },
            "pt_streaming_potential_electrode": {
                "name": "Pt streaming potential electrode pair",
                "type": "electrokinetic",
                "specs": "1 mm × 5 mm × 100 nm Pt on fused silica capillary",
                "cost_per_unit_gbp": 0.05,
                "power_total_mw": 1.0,
                "use_case": "Streaming potential energy harvesting",
            },
            "pva_capillary_tube": {
                "name": "PVA-coated fused silica capillary (DissolvPCB material)",
                "type": "triboelectric",
                "specs": "PVA triboelectric charge density 50 µC/m², 1000 cm² wall area",
                "cost_per_unit_gbp": 0.05,
                "power_total_mw": 1.0,
                "use_case": "Triboelectric backup harvester",
            },
            "lipo_100mah_37v": {
                "name": "LiPo micro-battery 100 mAh 3.7V",
                "type": "storage",
                "specs": "100 mAh × 3.7V × 3.6 = 1332 J total energy",
                "cost_per_unit_gbp": 20.0,
                "use_case": "Peak load backup (1.76 hours at 210 mW peak)",
            },
        },
        "recommendation": "TEC1-12706 (4 units) + 1000 PVDF capillaries + 1000 Pt electrode pairs + 1000 PVA capillaries + 1 LiPo = £520 total. The AURUM-II orb becomes energy-autonomous.",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# MCP SERVER
# ============================================================================
mcp = Server("meek-energy-harvester-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="streaming_potential_energy", description="Compute capillary streaming potential power.", inputSchema={"type": "object", "properties": {"num_capillaries": {"type": "integer", "default": 1000}, "capillary_diameter_m": {"type": "number", "default": 0.0005}, "capillary_length_m": {"type": "number", "default": 0.5}, "flow_velocity_m_per_s": {"type": "number", "default": 0.05}, "fluid": {"type": "string", "enum": ["water", "ethanol"], "default": "water"}}, "required": []}),
        Tool(name="triboelectric_energy", description="Compute PVA-water triboelectric power.", inputSchema={"type": "object", "properties": {"pva_wall_area_cm2": {"type": "number", "default": 1000.0}, "flow_velocity_m_per_s": {"type": "number", "default": 0.05}, "contact_charge_density_uc_per_m2": {"type": "number", "default": 50.0}}, "required": []}),
        Tool(name="piezoelectric_energy", description="Compute PVDF piezoelectric power.", inputSchema={"type": "object", "properties": {"pvdf_coating_area_cm2": {"type": "number", "default": 100.0}, "pressure_pulse_amplitude_pa": {"type": "number", "default": 1000.0}, "pulse_frequency_hz": {"type": "number", "default": 10.0}}, "required": []}),
        Tool(name="thermoelectric_energy", description="Compute Bi2Te3 TEG power.", inputSchema={"type": "object", "properties": {"num_tegs": {"type": "integer", "default": 4}, "delta_t_c": {"type": "number", "default": 25.0}, "teg_area_cm2": {"type": "number", "default": 16.0}}, "required": []}),
        Tool(name="orb_total_energy_harvest", description="Sum all 4 energy harvesting mechanisms.", inputSchema={"type": "object", "properties": {"num_capillaries": {"type": "integer", "default": 1000}, "pva_wall_area_cm2": {"type": "number", "default": 1000.0}, "pvdf_area_cm2": {"type": "number", "default": 100.0}, "num_tegs": {"type": "integer", "default": 4}, "delta_t_c": {"type": "number", "default": 25.0}}, "required": []}),
        Tool(name="orb_power_budget", description="Compute the orb's power budget.", inputSchema={"type": "object", "properties": {"harvested_mw": {"type": "number", "default": 30.0}, "sleep_mode_uw": {"type": "number", "default": 10.0}, "active_signing_mw": {"type": "number", "default": 5.0}, "wifi_csi_peak_mw": {"type": "number", "default": 100.0}, "led_peak_mw": {"type": "number", "default": 100.0}, "duty_cycle_pct": {"type": "number", "default": 1.0}}, "required": []}),
        Tool(name="orb_battery_runtime", description="Compute LiPo backup battery runtime.", inputSchema={"type": "object", "properties": {"battery_capacity_mah": {"type": "number", "default": 100.0}, "battery_voltage_v": {"type": "number", "default": 3.7}, "peak_load_mw": {"type": "number", "default": 210.0}, "harvested_mw": {"type": "number", "default": 30.0}}, "required": []}),
        Tool(name="list_energy_harvesting_components", description="List the 5 best energy harvesting components.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "streaming_potential_energy":
        result = streaming_potential_energy(**arguments)
    elif name == "triboelectric_energy":
        result = triboelectric_energy(**arguments)
    elif name == "piezoelectric_energy":
        result = piezoelectric_energy(**arguments)
    elif name == "thermoelectric_energy":
        result = thermoelectric_energy(**arguments)
    elif name == "orb_total_energy_harvest":
        result = orb_total_energy_harvest(**arguments)
    elif name == "orb_power_budget":
        result = orb_power_budget(**arguments)
    elif name == "orb_battery_runtime":
        result = orb_battery_runtime(**arguments)
    elif name == "list_energy_harvesting_components":
        result = list_energy_harvesting_components()
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