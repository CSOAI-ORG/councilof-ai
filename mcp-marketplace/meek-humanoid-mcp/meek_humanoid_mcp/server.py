#!/usr/bin/env python3
"""
meek-humanoid-mcp — server.py

Capillary humanoid body orchestrator for the AURUM-III sovereign humanoid.

Tools (5):
  1. humanoid_body_plan          — return the full body layout
  2. muscle_count_for_force      — compute orbs needed for a target force
  3. inverse_kinematics_posture  — solve IK for a posture
  4. capillary_spine_bus          — return the spine bus specs
  5. humanoid_energy_budget       — compute the full-body energy budget
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

logger = logging.getLogger("meek_humanoid_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def humanoid_body_plan(
    num_muscle_groups: int = 200,
    orbs_per_muscle_group: int = 25,
    orb_size_mm: float = 25.0,
    num_sensor_orbs: int = 4,
    num_brain_orbs: int = 1,
) -> dict:
    """Return the full body layout."""
    total_muscle_orbs = num_muscle_groups * orbs_per_muscle_group
    total_orbs = total_muscle_orbs + num_sensor_orbs + num_brain_orbs
    # Mass calculation (PVA/PDMS bladder ~1g/cm³)
    orb_mass_kg = (orb_size_mm / 10) ** 3 / 1000  # ~0.0156 kg per 25mm orb
    muscle_mass_kg = total_muscle_orbs * orb_mass_kg
    sensor_mass_kg = num_sensor_orbs * 0.05
    brain_mass_kg = num_brain_orbs * 0.5
    total_mass_kg = muscle_mass_kg + sensor_mass_kg + brain_mass_kg

    return {
        "num_muscle_groups": num_muscle_groups,
        "orbs_per_muscle_group": orbs_per_muscle_group,
        "total_muscle_orbs": total_muscle_orbs,
        "num_sensor_orbs": num_sensor_orbs,
        "num_brain_orbs": num_brain_orbs,
        "total_orbs": total_orbs,
        "orb_mass_kg_per_orb": orb_mass_kg,
        "muscle_mass_kg": muscle_mass_kg,
        "sensor_mass_kg": sensor_mass_kg,
        "brain_mass_kg": brain_mass_kg,
        "total_mass_kg": total_mass_kg,
        "engine": "Capillary humanoid (no motors)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def muscle_count_for_force(
    target_force_n: float = 100.0,
    force_per_orb_n: float = 2.0,
    safety_factor: float = 2.0,
) -> dict:
    """Compute orbs needed for a target force at a joint."""
    n_orbs_raw = target_force_n / force_per_orb_n
    n_orbs_safe = math.ceil(n_orbs_raw * safety_factor)

    return {
        "target_force_n": target_force_n,
        "force_per_orb_n": force_per_orb_n,
        "safety_factor": safety_factor,
        "n_orbs_raw": n_orbs_raw,
        "n_orbs_safe": n_orbs_safe,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def inverse_kinematics_posture(
    target_hand_position_cm: tuple = (50.0, 100.0, 50.0),
    arm_length_cm: float = 70.0,
    forearm_length_cm: float = 60.0,
) -> dict:
    """Simple 2-link IK for the right arm (shoulder + elbow + wrist)."""
    x, y, z = target_hand_position_cm
    r = math.sqrt(x ** 2 + z ** 2)  # horizontal distance
    # Total reach
    d = math.sqrt(r ** 2 + y ** 2)
    # 2-link IK (Law of Cosines)
    max_reach = arm_length_cm + forearm_length_cm
    if d > max_reach:
        return {"error": f"target ({d} cm) out of reach ({max_reach} cm)"}
    cos_elbow = (arm_length_cm ** 2 + forearm_length_cm ** 2 - d ** 2) / (2 * arm_length_cm * forearm_length_cm)
    elbow_angle = math.acos(max(-1, min(1, cos_elbow)))
    # Shoulder angle (azimuth + elevation)
    shoulder_azimuth = math.atan2(x, z)
    cos_shoulder = (arm_length_cm ** 2 + d ** 2 - forearm_length_cm ** 2) / (2 * arm_length_cm * d)
    shoulder_elevation = math.acos(max(-1, min(1, cos_shoulder)))

    return {
        "target_position_cm": target_hand_position_cm,
        "distance_cm": d,
        "max_reach_cm": max_reach,
        "shoulder_azimuth_rad": shoulder_azimuth,
        "shoulder_azimuth_deg": math.degrees(shoulder_azimuth),
        "shoulder_elevation_rad": shoulder_elevation,
        "shoulder_elevation_deg": math.degrees(shoulder_elevation),
        "elbow_angle_rad": elbow_angle,
        "elbow_angle_deg": math.degrees(elbow_angle),
        "muscle_commands": {
            "shoulder_azimuth_pos": math.degrees(shoulder_azimuth),
            "shoulder_azimuth_neg": -math.degrees(shoulder_azimuth),
            "shoulder_elevation_pos": math.degrees(shoulder_elevation),
            "shoulder_elevation_neg": -math.degrees(shoulder_elevation),
            "elbow_flex_pos": math.degrees(elbow_angle),
            "elbow_flex_neg": -math.degrees(elbow_angle),
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def capillary_spine_bus() -> dict:
    """Return the spine bus specs (coolant + EO + SIGIL + power)."""
    return {
        "spine_length_mm": 1500.0,
        "spine_cross_section_mm": 50.0,
        "channels": {
            "coolant": {
                "fluid": "water",
                "tube_diameter_mm": 10.0,
                "flow_ml_per_s": 5.0,
                "function": "removes heat from brain + muscles",
                "thermoelectric_harvesters": 4,
            },
            "power": {
                "voltage_v": 24.0,
                "current_a": 10.0,
                "max_power_w": 240.0,
                "function": "DC power distribution",
            },
            "electroosmotic_control": {
                "voltage_range_v": "0-100",
                "current_ma": 10.0,
                "function": "muscle actuation",
                "response_time_ms": 100,
            },
            "sigil_bus": {
                "protocol": "Ed25519",
                "frequency_mhz": 100.0,
                "latency_ms": 5,
                "function": "signed muscle commands + sensor readings",
            },
        },
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def humanoid_energy_budget(
    num_muscle_orbs: int = 5000,
    actuation_power_per_orb_w: float = 0.5,
    brain_power_w: float = 0.1,
    sensor_power_w: float = 0.05,
    duty_cycle_pct: float = 10.0,
    energy_harvested_mw: float = 201.61,
) -> dict:
    """Compute the full-body energy budget."""
    # Peak power (all muscles actuated)
    peak_muscle_w = num_muscle_orbs * actuation_power_per_orb_w
    peak_total_w = peak_muscle_w + brain_power_w + sensor_power_w
    # Continuous power (duty cycle weighted)
    avg_muscle_w = peak_muscle_w * (duty_cycle_pct / 100)
    continuous_w = avg_muscle_w + brain_power_w + sensor_power_w
    # Energy harvested
    harvested_w = energy_harvested_mw / 1000
    # Net power
    net_w = harvested_w - continuous_w

    return {
        "num_muscle_orbs": num_muscle_orbs,
        "peak_muscle_power_w": peak_muscle_w,
        "peak_total_power_w": peak_total_w,
        "duty_cycle_pct": duty_cycle_pct,
        "avg_continuous_power_w": continuous_w,
        "energy_harvested_w": harvested_w,
        "net_power_w": net_w,
        "verdict": "ENERGY_AUTONOMOUS" if net_w >= 0 else "BATTERY_REQUIRED",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-humanoid-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="humanoid_body_plan", description="Return the full body layout.", inputSchema={"type": "object", "properties": {"num_muscle_groups": {"type": "integer", "default": 200}, "orbs_per_muscle_group": {"type": "integer", "default": 25}, "orb_size_mm": {"type": "number", "default": 25.0}}, "required": []}),
        Tool(name="muscle_count_for_force", description="Compute orbs needed for a target force.", inputSchema={"type": "object", "properties": {"target_force_n": {"type": "number", "default": 100.0}, "force_per_orb_n": {"type": "number", "default": 2.0}, "safety_factor": {"type": "number", "default": 2.0}}, "required": []}),
        Tool(name="inverse_kinematics_posture", description="Solve IK for a posture.", inputSchema={"type": "object", "properties": {"target_hand_position_cm": {"type": "array", "items": {"type": "number"}, "default": [50.0, 100.0, 50.0]}, "arm_length_cm": {"type": "number", "default": 70.0}, "forearm_length_cm": {"type": "number", "default": 60.0}}, "required": []}),
        Tool(name="capillary_spine_bus", description="Return the spine bus specs.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="humanoid_energy_budget", description="Compute the full-body energy budget.", inputSchema={"type": "object", "properties": {"num_muscle_orbs": {"type": "integer", "default": 5000}, "actuation_power_per_orb_w": {"type": "number", "default": 0.5}, "duty_cycle_pct": {"type": "number", "default": 10.0}, "energy_harvested_mw": {"type": "number", "default": 201.61}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "humanoid_body_plan":
        result = humanoid_body_plan(**arguments)
    elif name == "muscle_count_for_force":
        result = muscle_count_for_force(**arguments)
    elif name == "inverse_kinematics_posture":
        # Handle tuple conversion
        args = dict(arguments)
        if "target_hand_position_cm" in args and isinstance(args["target_hand_position_cm"], list):
            args["target_hand_position_cm"] = tuple(args["target_hand_position_cm"])
        result = inverse_kinematics_posture(**args)
    elif name == "capillary_spine_bus":
        result = capillary_spine_bus()
    elif name == "humanoid_energy_budget":
        result = humanoid_energy_budget(**arguments)
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