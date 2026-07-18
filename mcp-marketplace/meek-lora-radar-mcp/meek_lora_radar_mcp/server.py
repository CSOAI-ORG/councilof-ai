#!/usr/bin/env python3
"""
meek-lora-radar-mcp — server.py

LoRa passive radar + Cross-Ambiguity Function processing + RTL-SDR reception
for the DEFONEOS SHIELD arm.

Per BLEEDING_EDGE_SYNTHESIS.md: Uses existing LoRa infrastructure as illuminator,
RTL-SDR receiver detects reflections from moving objects, no dedicated transmitter
required (completely passive, undetectable), range 1-10 km.
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

logger = logging.getLogger("meek_lora_radar_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def lora_passive_radar(
    lora_frequency_mhz: float = 868.0,  # EU868
    rtl_sdr_bandwidth_mhz: float = 2.56,
    integration_time_s: float = 1.0,
    target_rcs_dbsm: float = -10.0,  # drone RCS
) -> dict:
    """Compute LoRa passive radar detection performance."""
    c = 3e8  # speed of light
    wavelength_m = c / (lora_frequency_mhz * 1e6)
    # Range resolution (depends on bandwidth)
    range_resolution_m = c / (2 * rtl_sdr_bandwidth_mhz * 1e6)
    # Velocity resolution (depends on integration time)
    velocity_resolution_m_per_s = wavelength_m / (2 * integration_time_s)
    # Maximum detection range (depends on target RCS + LoRa ERP)
    # Simplified bistatic radar equation: R_max^4 ∝ RCS
    # Typical LoRa ERP: 14 dBm (25 mW)
    lora_erp_dbm = 14.0
    rtl_sdr_nf_db = 3.5
    snr_threshold_db = 13.0  # for 0.5 probability of detection
    # Range equation (simplified) — adjusted for realistic LoRa ERP
    max_range_km = 5.0 * 10 ** ((lora_erp_dbm + target_rcs_dbsm - rtl_sdr_nf_db - snr_threshold_db) / 40)
    # Cross-Ambiguity Function (CAF) processing gain
    caf_processing_gain_db = 10 * math.log10(integration_time_s * rtl_sdr_bandwidth_mhz * 1e6)

    return {
        "lora_frequency_mhz": lora_frequency_mhz,
        "wavelength_m": wavelength_m,
        "rtl_sdr_bandwidth_mhz": rtl_sdr_bandwidth_mhz,
        "integration_time_s": integration_time_s,
        "target_rcs_dbsm": target_rcs_dbsm,
        "range_resolution_m": range_resolution_m,
        "velocity_resolution_m_per_s": velocity_resolution_m_per_s,
        "max_detection_range_km": max_range_km,
        "caf_processing_gain_db": caf_processing_gain_db,
        "lora_erp_dbm": lora_erp_dbm,
        "rtl_sdr_cost_gbp": 30.0,  # RTL-SDR V4
        "additional_receiver_cost_gbp": 20.0,  # extra ESP32 + LoRa
        "engine": "Cross-Ambiguity Function (CAF) processing",
        "passive": True,  # completely passive, undetectable
        "verdict": "PASS" if max_range_km > 1.0 else "MARGINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def rtl_sdr_setup(
    device: str = "RTL-SDR V4",
    sample_rate_msps: float = 2.56,
    center_frequency_mhz: float = 868.0,
    gain_db: float = 30.0,
) -> dict:
    """Compute RTL-SDR setup for LoRa passive radar reception."""
    device_specs = {
        "RTL-SDR V4": {"freq_range_mhz": (24, 1766), "max_sample_rate_msps": 3.2, "adc_bits": 8, "cost_gbp": 30},
        "HackRF One": {"freq_range_mhz": (1, 6000), "max_sample_rate_msps": 20, "adc_bits": 8, "cost_gbp": 250},
        "LimeSDR Mini": {"freq_range_mhz": (10, 3500), "max_sample_rate_msps": 40, "adc_bits": 12, "cost_gbp": 300},
        "BladeRF 2.0": {"freq_range_mhz": (47, 6000), "max_sample_rate_msps": 61, "adc_bits": 12, "cost_gbp": 500},
    }
    spec = device_specs.get(device, device_specs["RTL-SDR V4"])
    # Check if center freq is in range
    in_range = spec["freq_range_mhz"][0] <= center_frequency_mhz <= spec["freq_range_mhz"][1]
    # Check sample rate
    sample_rate_ok = sample_rate_msps <= spec["max_sample_rate_msps"]
    # ADC dynamic range
    dynamic_range_db = spec["adc_bits"] * 6.02  # ENOB
    # Sensitivity (typical)
    sensitivity_dbm = -174 + 10 * math.log10(sample_rate_msps * 1e6) + spec["adc_bits"] * 0.5

    return {
        "device": device,
        "device_specs": spec,
        "center_frequency_mhz": center_frequency_mhz,
        "frequency_in_range": in_range,
        "sample_rate_msps": sample_rate_msps,
        "sample_rate_ok": sample_rate_ok,
        "gain_db": gain_db,
        "adc_bits": spec["adc_bits"],
        "dynamic_range_db": dynamic_range_db,
        "sensitivity_dbm": sensitivity_dbm,
        "cost_gbp": spec["cost_gbp"],
        "verdict": "PASS" if (in_range and sample_rate_ok) else "FAIL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-lora-radar-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="lora_passive_radar", description="Compute LoRa passive radar detection performance.", inputSchema={"type": "object", "properties": {"lora_frequency_mhz": {"type": "number", "default": 868.0}, "rtl_sdr_bandwidth_mhz": {"type": "number", "default": 2.56}, "integration_time_s": {"type": "number", "default": 1.0}, "target_rcs_dbsm": {"type": "number", "default": -10.0}}, "required": []}),
        Tool(name="rtl_sdr_setup", description="Compute RTL-SDR setup for LoRa passive radar reception.", inputSchema={"type": "object", "properties": {"device": {"type": "string", "default": "RTL-SDR V4"}, "sample_rate_msps": {"type": "number", "default": 2.56}, "center_frequency_mhz": {"type": "number", "default": 868.0}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "lora_passive_radar":
        result = lora_passive_radar(**arguments)
    elif name == "rtl_sdr_setup":
        result = rtl_sdr_setup(**arguments)
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