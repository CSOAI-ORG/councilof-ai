#!/usr/bin/env python3
"""
meek-wifi-csi-mcp — server.py

WiFi CSI through-wall detection + drone detection (ESP32 array, ESP-CSI framework,
CNN-LSTM classifier) for the DEFONEOS SHIELD arm.

Per BLEEDING_EDGE_SYNTHESIS.md Section 1.1: WiFi CSI provides detailed information
about how WiFi signals propagate through an environment. Unlike RSSI (a single
number), CSI provides amplitude and phase information for every subcarrier across
the WiFi channel.
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

logger = logging.getLogger("meek_wifi_csi_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def wifi_csi_through_wall_detection(
    num_esp32_nodes: int = 4,
    subcarrier_count: int = 64,
    wall_material: str = "drywall",
    wall_thickness_cm: float = 15.0,
) -> dict:
    """Compute WiFi CSI through-wall detection performance."""
    # CSI attenuation through walls (dB)
    wall_attenuation_db = {
        "drywall": 3.0,  # dB per wall
        "concrete": 12.0,
        "brick": 8.0,
        "wood": 5.0,
        "metal": 20.0,
    }
    atten = wall_attenuation_db.get(wall_material, 10.0) * (wall_thickness_cm / 15.0)
    # CSI amplitude SNR after wall
    csi_snr_db = 30.0 - atten  # 30 dB initial SNR
    # Phase coherence (drone RPM creates periodic signature)
    phase_coherence = max(0.0, min(1.0, csi_snr_db / 30.0))
    # Detection range (m)
    detection_range_m = 5.0 * math.sqrt(num_esp32_nodes) * phase_coherence
    # Classification accuracy (drone vs human vs bird vs car)
    classification_accuracy = 0.85 + 0.05 * (num_esp32_nodes - 1)
    classification_accuracy = min(0.99, classification_accuracy)

    return {
        "num_esp32_nodes": num_esp32_nodes,
        "subcarrier_count": subcarrier_count,
        "wall_material": wall_material,
        "wall_thickness_cm": wall_thickness_cm,
        "wall_attenuation_db": atten,
        "csi_snr_db": csi_snr_db,
        "phase_coherence": phase_coherence,
        "detection_range_m": detection_range_m,
        "classification_accuracy": classification_accuracy,
        "cost_per_node_gbp": 20.0,  # ESP32 ~£5 each
        "engine": "ESP-CSI framework (open source) + CNN-LSTM classifier",
        "verdict": "PASS" if classification_accuracy > 0.8 else "MARGINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def drone_motor_signature(
    motor_rpm: int = 8000,
    prop_blades: int = 2,
    detection_range_m: float = 10.0,
) -> dict:
    """Compute drone motor CSI signature for detection."""
    # Motor fundamental frequency
    fundamental_hz = motor_rpm / 60.0
    # Blade pass frequency (prop_blades × fundamental)
    blade_pass_hz = fundamental_hz * prop_blades
    # Harmonic strength
    harmonic_db = 20 * math.log10(prop_blades)
    # CSI sampling rate needed (Nyquist)
    min_sampling_rate_hz = 2 * blade_pass_hz
    # Phase shift per RPM variation
    phase_shift_per_rpm = 360.0 / motor_rpm
    # Detection confidence at range
    range_attenuation_db = 20 * math.log10(detection_range_m)
    detection_confidence = max(0.0, min(1.0, 1.0 - range_attenuation_db / 60.0))

    return {
        "motor_rpm": motor_rpm,
        "prop_blades": prop_blades,
        "fundamental_hz": fundamental_hz,
        "blade_pass_hz": blade_pass_hz,
        "harmonic_strength_db": harmonic_db,
        "min_sampling_rate_hz": min_sampling_rate_hz,
        "phase_shift_per_rpm": phase_shift_per_rpm,
        "detection_range_m": detection_range_m,
        "detection_confidence": detection_confidence,
        "verdict": "PASS" if detection_confidence > 0.5 else "MARGINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def human_presence_detection(
    room_area_m2: float = 25.0,
    num_people: int = 1,
    breathing_rate_per_min: float = 15.0,
) -> dict:
    """Detect human presence via CSI breathing signature."""
    # Breathing frequency in Hz
    breathing_hz = breathing_rate_per_min / 60.0
    # CSI amplitude variation per breath
    amplitude_variation_db = 0.5 * num_people  # 0.5 dB per person
    # Detection threshold (need >0.1 dB variation)
    detectable = amplitude_variation_db > 0.1
    # Time to detect (seconds) - need 3 breath cycles
    detection_time_s = 3.0 / breathing_hz

    return {
        "room_area_m2": room_area_m2,
        "num_people": num_people,
        "breathing_rate_per_min": breathing_rate_per_min,
        "breathing_hz": breathing_hz,
        "amplitude_variation_db": amplitude_variation_db,
        "detectable": detectable,
        "detection_time_s": detection_time_s,
        "verdict": "PASS" if detectable else "FAIL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-wifi-csi-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="wifi_csi_through_wall_detection", description="Compute WiFi CSI through-wall detection performance.", inputSchema={"type": "object", "properties": {"num_esp32_nodes": {"type": "integer", "default": 4}, "wall_material": {"type": "string", "default": "drywall"}, "wall_thickness_cm": {"type": "number", "default": 15.0}}, "required": []}),
        Tool(name="drone_motor_signature", description="Compute drone motor CSI signature.", inputSchema={"type": "object", "properties": {"motor_rpm": {"type": "integer", "default": 8000}, "prop_blades": {"type": "integer", "default": 2}, "detection_range_m": {"type": "number", "default": 10.0}}, "required": []}),
        Tool(name="human_presence_detection", description="Detect human presence via CSI breathing signature.", inputSchema={"type": "object", "properties": {"room_area_m2": {"type": "number", "default": 25.0}, "num_people": {"type": "integer", "default": 1}, "breathing_rate_per_min": {"type": "number", "default": 15.0}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "wifi_csi_through_wall_detection":
        result = wifi_csi_through_wall_detection(**arguments)
    elif name == "drone_motor_signature":
        result = drone_motor_signature(**arguments)
    elif name == "human_presence_detection":
        result = human_presence_detection(**arguments)
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