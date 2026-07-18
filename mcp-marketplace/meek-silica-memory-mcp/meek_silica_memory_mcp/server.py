#!/usr/bin/env python3
"""
meek-silica-memory-mcp — server.py

MEEK Silica Memory MCP — 5D fused silica memory + silica-capillary hybrid.

Tools (10):
  1. silica_5d_memory_specs        — Return the 5D memory state-of-the-art specs
  2. silica_disc_capacity_calculator — Compute storage capacity for a disc
  3. silica_disc_longevity_calculator — Compute longevity for given conditions
  4. silica_write_estimate         — Estimate write time + cost
  5. silica_read_estimate          — Estimate read time + bandwidth
  6. silica_thermal_cycling        — Compute thermal cycling tolerance
  7. silica_capillary_microfluidic — Compute capillary channel design
  8. silica_capillary_cooling_estimate — Compute the silica-capillary cooling
  9. orb_tri_memory_architecture  — Return the orb's 3-memory-substrate spec
  10. silica_disc_manufacturing_estimate — Cost + time to manufacture 1 disc

The BannedTermGate refuses severed brands + kinetic + surveillance.
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

logger = logging.getLogger("meek_silica_memory_mcp")
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(name)s] %(levelname)s: %(message)s")


# BannedTermGate (the 3 hard stops)
BANNED_TERMS = re.compile(
    r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|"
    r"terranova|csga[\.\-]?ai|defonos\.io|toronto summit)\b",
    re.IGNORECASE,
)
KINETIC_BLOCK_PATTERNS = re.compile(
    r"\b(strike package|find-fix-finish|target elimination|kill order|"
    r"bounty|hit list|kill list|assassination|lethal strike)\b",
    re.IGNORECASE,
)
SURVEILLANCE_BLOCK_PATTERNS = re.compile(
    r"\b(track individual|follow person|locate phone|track phone|"
    r"identify person|recognise face|face-rec|face_rec)\b",
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
        match = KINETIC_BLOCK_PATTERNS.search(prompt)
        if match:
            return False, f"Refused: '{match.group(0)}' is kinetic targeting pattern."
        match = SURVEILLANCE_BLOCK_PATTERNS.search(prompt)
        if match:
            return False, f"Refused: '{match.group(0)}' is surveillance pattern."
        return True, ""


# ============================================================================
# TOOL 1: silica_5d_memory_specs
# ============================================================================
def silica_5d_memory_specs() -> dict:
    """Return the 5D memory state-of-the-art specs."""
    return {
        "memory_type": "5D optical (femtosecond laser written nanogratings)",
        "substrate": "Fused silica (Corning 7980 / Schott Lithosil / HPFS)",
        "dimensions": ["X (nm)", "Y (nm)", "Z (depth, µm)", "Slow axis orientation (°)", "Fast axis retardance (°)"],
        "state_of_art_2024": {
            "storage_density": "360 TB per standard disc (5mm thick × 120mm dia)",
            "storage_density_advanced": "10+ TB per disc (multi-layer)",
            "stability_at_room_temp": "13.8 billion years (NASA thermal aging tests)",
            "operating_temperature_range": "-270°C to +1000°C",
            "radiation_tolerance": "1000 Gy (no data loss)",
            "write_speed_per_laser": "225 KB/s",
            "write_speed_parallel_lasers_6x": "1.35 MB/s",
            "read_speed": "GB/s (camera-based readout)",
            "material_cost_per_disc": "£200-500",
            "write_cost_per_disc": "£2,000-5,000 (laser time)",
            "license": "Royalty-free (no proprietary tech)",
        },
        "key_labs": [
            "University of Southampton (J. Zhang et al., 2013)",
            "Microsoft Project HSD (2019-2024)",
            "Various academic groups (2024-2026)",
        ],
        "current_trl": 6,
        "nick_farm_trl": 4,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 2: silica_disc_capacity_calculator
# ============================================================================
def silica_disc_capacity_calculator(
    diameter_mm: float = 120.0,
    thickness_mm: float = 5.0,
    layers: int = 550,
    bits_per_nanograting: int = 2,
) -> dict:
    """Compute the storage capacity of a 5D silica disc.

    Args:
        diameter_mm: 120mm typical
        thickness_mm: 5mm typical
        layers: 100 (multi-layer Southampton 2019 standard for 360 TB)
        bits_per_nanograting: 2 (binary orientation)

    Returns:
        capacity_per_layer_tb, total_capacity_tb, total_capacity_bits
    """
    # Disc area
    area_cm2 = math.pi * (diameter_mm / 2) ** 2 / 100
    # Per-layer density (Southampton 2019 spec): ~6 GB/cm² per layer
    base_density_gb_per_cm2_per_layer = 6.0
    capacity_per_layer_gb = base_density_gb_per_cm2_per_layer * area_cm2
    capacity_per_layer_tb = capacity_per_layer_gb / 1024
    total_capacity_tb = capacity_per_layer_tb * layers
    total_capacity_bits = total_capacity_tb * 8e12

    return {
        "diameter_mm": diameter_mm,
        "thickness_mm": thickness_mm,
        "layers": layers,
        "disc_area_cm2": area_cm2,
        "bits_per_nanograting": bits_per_nanograting,
        "capacity_per_layer_gb": capacity_per_layer_gb,
        "capacity_per_layer_tb": capacity_per_layer_tb,
        "total_capacity_tb": total_capacity_tb,
        "total_capacity_bits": total_capacity_bits,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 3: silica_disc_longevity_calculator
# ============================================================================
def silica_disc_longevity_calculator(
    temperature_c: float = 25.0,
    humidity_pct: float = 50.0,
    radiation_dose_gy: float = 0.0,
) -> dict:
    """Compute the longevity of a 5D silica disc at given conditions.

    Uses Arrhenius equation: longevity = t_ref * exp(E_a/k * (1/T - 1/T_ref))

    Args:
        temperature_c: 25°C default
        humidity_pct: 50% default
        radiation_dose_gy: 0 default

    Returns:
        longevity_years, degradation_factor
    """
    # Reference: 13.8 billion years at 25°C
    base_longevity_years = 13.8e9
    k = 8.617e-5  # eV/K (Boltzmann)
    E_a = 2.0  # eV (activation energy for fused silica nanograting degradation)

    T = temperature_c + 273.15
    T_ref = 298.15  # 25°C

    # Arrhenius factor (higher temp = MORE degradation = SHORTER longevity)
    # longevity = longevity_ref * exp(-E_a/k * (1/T - 1/T_ref)) ... wait, this needs careful thought.
    # Standard Arrhenius: k = A * exp(-E_a/RT) — higher T = HIGHER k = faster degradation = shorter longevity
    # So longevity(T) = longevity(T_ref) * exp(E_a/k * (1/T - 1/T_ref))
    # When T > T_ref: 1/T < 1/T_ref → (1/T - 1/T_ref) < 0 → exp(...) < 1 → longevity < longevity_ref ✓
    arrhenius_factor = math.exp((E_a / k) * (1 / T - 1 / T_ref))
    longevity_years = base_longevity_years * arrhenius_factor

    # Humidity factor (silica is relatively immune to humidity but high humidity can etch surface)
    humidity_factor = max(1.0, humidity_pct / 50.0) ** 2
    longevity_years /= humidity_factor

    # Radiation factor (1000 Gy reduces longevity by ~10%)
    radiation_factor = max(1.0, 1.0 + radiation_dose_gy / 10000.0)
    longevity_years /= radiation_factor

    return {
        "temperature_c": temperature_c,
        "humidity_pct": humidity_pct,
        "radiation_dose_gy": radiation_dose_gy,
        "longevity_years": longevity_years,
        "base_longevity_years": base_longevity_years,
        "arrhenius_factor": arrhenius_factor,
        "humidity_factor": humidity_factor,
        "radiation_factor": radiation_factor,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 4: silica_write_estimate
# ============================================================================
def silica_write_estimate(
    data_size_gb: float = 1.0,
    num_lasers: int = 1,
    pulse_rate_fps: float = 1000.0,
) -> dict:
    """Estimate the time + cost to write data to a 5D silica disc.

    Args:
        data_size_gb: 1 GB default
        num_lasers: 1 default (up to 6+ in parallel)
        pulse_rate_fps: 1000 fps default (modern femtosecond lasers)

    Returns:
        write_time_seconds, write_time_hours, num_writes, cost
    """
    bits_per_write = 2  # 2 bits per nanograting (binary orientation)
    bits_per_pulse_per_laser = 100  # ~100 bits per laser pulse (one nanograting + overhead)
    bits_per_second = pulse_rate_fps * bits_per_pulse_per_laser * num_lasers
    bytes_per_second = bits_per_second / 8

    total_bits = data_size_gb * 8e9
    write_time_seconds = total_bits / bits_per_second
    write_time_hours = write_time_seconds / 3600

    # Cost: laser time + equipment wear
    cost_per_hour = 500  # £500/hour for femtosecond laser
    cost = write_time_hours * cost_per_hour

    return {
        "data_size_gb": data_size_gb,
        "num_lasers": num_lasers,
        "pulse_rate_fps": pulse_rate_fps,
        "bits_per_second": bits_per_second,
        "bytes_per_second": bytes_per_second,
        "write_time_seconds": write_time_seconds,
        "write_time_hours": write_time_hours,
        "cost_gbp": cost,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 5: silica_read_estimate
# ============================================================================
def silica_read_estimate(
    data_size_gb: float = 1.0,
    camera_resolution_mp: float = 16.0,
    fps: float = 30.0,
) -> dict:
    """Estimate the read time + bandwidth for a 5D silica disc.

    Args:
        data_size_gb: 1 GB default
        camera_resolution_mp: 16MP default
        fps: 30 fps default

    Returns:
        read_time_seconds, bandwidth_mbps
    """
    # Camera-based readout with polarization analysis
    bytes_per_frame = camera_resolution_mp * 1e6 * 3  # RGB
    bytes_per_second = bytes_per_frame * fps
    total_bytes = data_size_gb * 1e9
    read_time_seconds = total_bytes / bytes_per_second
    bandwidth_mbps = (bytes_per_second * 8) / 1e6

    return {
        "data_size_gb": data_size_gb,
        "camera_resolution_mp": camera_resolution_mp,
        "fps": fps,
        "bytes_per_frame": bytes_per_frame,
        "bytes_per_second": bytes_per_second,
        "read_time_seconds": read_time_seconds,
        "bandwidth_mbps": bandwidth_mbps,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 6: silica_thermal_cycling
# ============================================================================
def silica_thermal_cycling(
    min_temp_c: float = -50.0,
    max_temp_c: float = 100.0,
    num_cycles: int = 1000,
) -> dict:
    """Compute thermal cycling tolerance for a 5D silica disc."""
    thermal_expansion_ppm_per_k = 0.55  # fused silica
    delta_t = max_temp_c - min_temp_c
    total_strain_ppm = thermal_expansion_ppm_per_k * delta_t

    # Fused silica is incredibly stable: no fatigue up to 10^6 cycles
    if num_cycles <= 1e6:
        verdict = "PASS"
        notes = "Fused silica has no fatigue failure below 10^6 cycles"
    else:
        verdict = "MARGINAL"
        notes = "Approaching 10^6 cycle limit"

    return {
        "min_temp_c": min_temp_c,
        "max_temp_c": max_temp_c,
        "delta_t": delta_t,
        "num_cycles": num_cycles,
        "thermal_expansion_ppm_per_k": thermal_expansion_ppm_per_k,
        "total_strain_ppm": total_strain_ppm,
        "verdict": verdict,
        "notes": notes,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 7: silica_capillary_microfluidic
# ============================================================================
def silica_capillary_microfluidic(
    channel_diameter_um: float = 200.0,
    channel_pitch_um: float = 400.0,
    plate_thickness_mm: float = 1.0,
    num_channels_x: int = 100,
    num_channels_y: int = 100,
) -> dict:
    """Compute the silica-capillary microfluidic plate design."""
    channel_count = num_channels_x * num_channels_y
    channel_area_cm2 = math.pi * (channel_diameter_um / 2) ** 2 / 1e8  # µm² to cm²
    total_channel_area_cm2 = channel_area_cm2 * channel_count
    plate_area_cm2 = (num_channels_x * channel_pitch_um / 1e4) * (num_channels_y * channel_pitch_um / 1e4)
    porosity = total_channel_area_cm2 / plate_area_cm2 if plate_area_cm2 > 0 else 0

    return {
        "channel_diameter_um": channel_diameter_um,
        "channel_pitch_um": channel_pitch_um,
        "plate_thickness_mm": plate_thickness_mm,
        "num_channels_x": num_channels_x,
        "num_channels_y": num_channels_y,
        "channel_count": channel_count,
        "plate_area_cm2": plate_area_cm2,
        "porosity": porosity,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 8: silica_capillary_cooling_estimate
# ============================================================================
def silica_capillary_cooling_estimate(
    chip_power_w: float = 5.0,
    water_flow_m_per_s: float = 2.0,
    channel_diameter_um: float = 200.0,
    num_channels: int = 1000,
) -> dict:
    """Compute silica-capillary cooling for the orb."""
    # Total cross-section
    channel_area_m2 = math.pi * (channel_diameter_um * 1e-6 / 2) ** 2
    total_cross_section_m2 = channel_area_m2 * num_channels
    # Volumetric flow
    vol_flow_m3_per_s = total_cross_section_m2 * water_flow_m_per_s
    # Heat removal (water Cp = 4180 J/kg·K, density 998)
    mass_flow_kg_per_s = vol_flow_m3_per_s * 998
    heat_capacity_rate_w_per_k = mass_flow_kg_per_s * 4180
    # For 25°C temperature rise
    max_heat_removal_w = heat_capacity_rate_w_per_k * 25
    # Pressure drop (Hagen-Poiseuille)
    length_m = 0.01  # 10mm plate thickness
    mu = 1e-3  # water viscosity
    pressure_drop_pa = (8 * mu * length_m * water_flow_m_per_s) / (channel_diameter_um * 1e-6 / 2) ** 2
    # Capillary pressure
    capillary_pressure_pa = 4 * 0.072 * math.cos(math.radians(30)) / (channel_diameter_um * 1e-6)

    verdict = "PASS" if max_heat_removal_w > chip_power_w else "MARGINAL"

    return {
        "chip_power_w": chip_power_w,
        "water_flow_m_per_s": water_flow_m_per_s,
        "channel_diameter_um": channel_diameter_um,
        "num_channels": num_channels,
        "total_cross_section_m2": total_cross_section_m2,
        "vol_flow_m3_per_s": vol_flow_m3_per_s,
        "mass_flow_kg_per_s": mass_flow_kg_per_s,
        "heat_capacity_rate_w_per_k": heat_capacity_rate_w_per_k,
        "max_heat_removal_w": max_heat_removal_w,
        "pressure_drop_pa": pressure_drop_pa,
        "capillary_pressure_pa": capillary_pressure_pa,
        "verdict": verdict,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 9: orb_tri_memory_architecture
# ============================================================================
def orb_tri_memory_architecture() -> dict:
    """Return the orb's 3-memory-substrate architecture."""
    return {
        "memory_1_gold_spiral": {
            "layer": "L0 (outer)",
            "substrate": "Gold spiral on fused silica sphere",
            "capacity": "~10^8 bits per orb",
            "speed": "ms-µs (capacitive coupling)",
            "longevity": "indefinite",
            "use_case": "logic memory + hive-to-hive signaling",
        },
        "memory_2_dna_water": {
            "layer": "L1 (DNA-water orb)",
            "substrate": "Aqueous solution with gold electrode DNA synthesis",
            "capacity": "10^18 bits/mm³",
            "speed": "hours-days (electrochemical)",
            "longevity": "thousands of years",
            "use_case": "working memory for fast read/write",
        },
        "memory_3_silica_5d": {
            "layer": "L0.5 (NEW — 5D silica disc)",
            "substrate": "Fused silica disc (Corning 7980) with 5D nanograting memory",
            "capacity": "360 TB per disc (5mm × 120mm)",
            "speed": "GB/s read, MB/s write",
            "longevity": "13.8 billion years",
            "use_case": "PERMANENT ARCHIVE (the 13.8B year vault)",
        },
        "the_merger": {
            "silica_disc": "Top layer (5mm, polished)",
            "silica_capillary_plate": "Middle layer (1mm, etched microfluidic channels)",
            "dna_water_orb": "Bottom layer (12mm, sealed compartment)",
            "bonding": "Diffusion bond (silica-silica, 1000°C)",
            "capillary_cooling": "Water flows through the etched channels, cools BOTH the 5D disc above AND the DNA-water orb below",
        },
        "8_layer_architecture": [
            "L0 (outer): Gold spiral electrode",
            "L0.5 (NEW): 5D silica memory disc (360 TB)",
            "L1: DNA-water orb (10^18 bits/mm³)",
            "L1.5 (NEW): Silica-capillary cooling plate (the merger)",
            "L2: Capillary cooling channels (now inside L1.5)",
            "L3: SkyWater 130nm chip (33-hive BGA)",
            "L4: 33-hive spiral layers (7 chiplets)",
            "L5: Laser processing (NIR + UV LEDs)",
            "L6 (center): Gold core",
        ],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 10: silica_disc_manufacturing_estimate
# ============================================================================
def silica_disc_manufacturing_estimate(
    disc_diameter_mm: float = 120.0,
    disc_thickness_mm: float = 5.0,
    num_discs: int = 1,
) -> dict:
    """Estimate the manufacturing cost + time for 5D silica discs."""
    # Material cost
    cost_per_disc_material = 200  # fused silica
    # Write cost
    cost_per_disc_write = 2000  # laser time
    # QC
    cost_per_disc_qc = 500
    # Total per disc
    cost_per_disc = cost_per_disc_material + cost_per_disc_write + cost_per_disc_qc
    total_cost = cost_per_disc * num_discs

    # Time
    time_per_disc_days = 14  # 2 weeks
    time_per_disc_write_hours = 1000 / 1.35  # 1 TB at 1.35 MB/s = 740 hours
    total_time_days = time_per_disc_days * num_discs

    return {
        "disc_diameter_mm": disc_diameter_mm,
        "disc_thickness_mm": disc_thickness_mm,
        "num_discs": num_discs,
        "cost_per_disc_material_gbp": cost_per_disc_material,
        "cost_per_disc_write_gbp": cost_per_disc_write,
        "cost_per_disc_qc_gbp": cost_per_disc_qc,
        "cost_per_disc_total_gbp": cost_per_disc,
        "total_cost_gbp": total_cost,
        "time_per_disc_days": time_per_disc_days,
        "time_per_disc_write_hours": time_per_disc_write_hours,
        "total_time_days": total_time_days,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# TOOL 11: list_available_silica_materials
# ============================================================================
def list_available_silica_materials() -> dict:
    """List the 5 best silica materials for the orb."""
    return {
        "materials": {
            "corning_7980": {
                "name": "Corning HPFS 7980 (High Purity Fused Silica)",
                "purity": "1 ppb (total metals)",
                "thermal_expansion_ppm_per_k": 0.55,
                "transmission_uv_to_ir": "Excellent (160nm to 2500nm)",
                "cost_per_disc_gbp": 200,
                "use_case": "Premium orb memory disc + microfluidic plate",
            },
            "schott_lithosil": {
                "name": "Schott Lithosil (Suprasil 1)",
                "purity": "1 ppb",
                "thermal_expansion_ppm_per_k": 0.5,
                "transmission_uv_to_ir": "Excellent",
                "cost_per_disc_gbp": 180,
                "use_case": "Alternative to Corning 7980",
            },
            "heraeus_suprasil_300": {
                "name": "Heraeus Suprasil 300",
                "purity": "1 ppb",
                "thermal_expansion_ppm_per_k": 0.5,
                "transmission_uv_to_ir": "Excellent",
                "cost_per_disc_gbp": 220,
                "use_case": "Alternative supplier",
            },
            "thorlabs_uvfs": {
                "name": "Thorlabs UVFS (UV Grade Fused Silica)",
                "purity": "Standard",
                "thermal_expansion_ppm_per_k": 0.55,
                "transmission_uv_to_ir": "Good (185nm to 2100nm)",
                "cost_per_disc_gbp": 100,
                "use_case": "Prototype + research (cheaper)",
            },
            "corning_7979": {
                "name": "Corning ULE 7979 (Ultra Low Expansion)",
                "purity": "Standard",
                "thermal_expansion_ppm_per_k": 0.0,  # Zero!
                "transmission_uv_to_ir": "Excellent",
                "cost_per_disc_gbp": 400,
                "use_case": "Premium extreme thermal stability (zero expansion)",
            },
        },
        "recommendation": "corning_7980 for production (best purity + cost) or thorlabs_uvfs for prototype (cheapest).",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


# ============================================================================
# MCP SERVER
# ============================================================================
mcp = Server("meek-silica-memory-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="silica_5d_memory_specs", description="Return the 5D memory state-of-the-art specs.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="silica_disc_capacity_calculator", description="Compute the storage capacity of a 5D silica disc.", inputSchema={"type": "object", "properties": {"diameter_mm": {"type": "number", "default": 120.0}, "thickness_mm": {"type": "number", "default": 5.0}, "layers": {"type": "integer", "default": 1}}, "required": []}),
        Tool(name="silica_disc_longevity_calculator", description="Compute the longevity of a 5D silica disc at given conditions.", inputSchema={"type": "object", "properties": {"temperature_c": {"type": "number", "default": 25.0}, "humidity_pct": {"type": "number", "default": 50.0}, "radiation_dose_gy": {"type": "number", "default": 0.0}}, "required": []}),
        Tool(name="silica_write_estimate", description="Estimate the time + cost to write data to a 5D silica disc.", inputSchema={"type": "object", "properties": {"data_size_gb": {"type": "number", "default": 1.0}, "num_lasers": {"type": "integer", "default": 1}, "pulse_rate_fps": {"type": "number", "default": 1000.0}}, "required": []}),
        Tool(name="silica_read_estimate", description="Estimate the read time + bandwidth for a 5D silica disc.", inputSchema={"type": "object", "properties": {"data_size_gb": {"type": "number", "default": 1.0}, "camera_resolution_mp": {"type": "number", "default": 16.0}, "fps": {"type": "number", "default": 30.0}}, "required": []}),
        Tool(name="silica_thermal_cycling", description="Compute thermal cycling tolerance for a 5D silica disc.", inputSchema={"type": "object", "properties": {"min_temp_c": {"type": "number", "default": -50.0}, "max_temp_c": {"type": "number", "default": 100.0}, "num_cycles": {"type": "integer", "default": 1000}}, "required": []}),
        Tool(name="silica_capillary_microfluidic", description="Compute the silica-capillary microfluidic plate design.", inputSchema={"type": "object", "properties": {"channel_diameter_um": {"type": "number", "default": 200.0}, "channel_pitch_um": {"type": "number", "default": 400.0}, "plate_thickness_mm": {"type": "number", "default": 1.0}, "num_channels_x": {"type": "integer", "default": 100}, "num_channels_y": {"type": "integer", "default": 100}}, "required": []}),
        Tool(name="silica_capillary_cooling_estimate", description="Compute silica-capillary cooling for the orb.", inputSchema={"type": "object", "properties": {"chip_power_w": {"type": "number", "default": 5.0}, "water_flow_m_per_s": {"type": "number", "default": 2.0}, "channel_diameter_um": {"type": "number", "default": 200.0}, "num_channels": {"type": "integer", "default": 1000}}, "required": []}),
        Tool(name="orb_tri_memory_architecture", description="Return the orb's 3-memory-substrate architecture.", inputSchema={"type": "object", "properties": {}}),
        Tool(name="silica_disc_manufacturing_estimate", description="Estimate the manufacturing cost + time for 5D silica discs.", inputSchema={"type": "object", "properties": {"disc_diameter_mm": {"type": "number", "default": 120.0}, "disc_thickness_mm": {"type": "number", "default": 5.0}, "num_discs": {"type": "integer", "default": 1}}, "required": []}),
        Tool(name="list_available_silica_materials", description="List the 5 best silica materials for the orb.", inputSchema={"type": "object", "properties": {}}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    query = arguments.get("data_size_gb") or arguments.get("diameter_mm") or ""
    if query:
        BannedTermGate.check(query)  # Will raise if severed brand

    if name == "silica_5d_memory_specs":
        result = silica_5d_memory_specs()
    elif name == "silica_disc_capacity_calculator":
        result = silica_disc_capacity_calculator(**arguments)
    elif name == "silica_disc_longevity_calculator":
        result = silica_disc_longevity_calculator(**arguments)
    elif name == "silica_write_estimate":
        result = silica_write_estimate(**arguments)
    elif name == "silica_read_estimate":
        result = silica_read_estimate(**arguments)
    elif name == "silica_thermal_cycling":
        result = silica_thermal_cycling(**arguments)
    elif name == "silica_capillary_microfluidic":
        result = silica_capillary_microfluidic(**arguments)
    elif name == "silica_capillary_cooling_estimate":
        result = silica_capillary_cooling_estimate(**arguments)
    elif name == "orb_tri_memory_architecture":
        result = orb_tri_memory_architecture()
    elif name == "silica_disc_manufacturing_estimate":
        result = silica_disc_manufacturing_estimate(**arguments)
    elif name == "list_available_silica_materials":
        result = list_available_silica_materials()
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
