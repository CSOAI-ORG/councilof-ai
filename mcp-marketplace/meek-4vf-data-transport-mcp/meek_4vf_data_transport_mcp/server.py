#!/usr/bin/env python3
"""
meek-4vf-data-transport-mcp — server.py

4th Vibration Frequency (4VF) data transport over capillary fluid pressure waves.

Tools (5):
  1. 4vf_data_rate             — compute the 4VF data rate per orb + total
  2. 4vf_modulation_scheme     — return the modulation scheme (OOK, FSK, PSK)
  3. 4vf_signal_attenuation    — compute the signal attenuation along the capillary
  4. 4vf_sigil_encoding        — compute the SIGIL encoding in the 4VF pressure wave
  5. 4vf_decoding_per_orb      — compute the decoding at each orb
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

logger = logging.getLogger("meek_4vf_data_transport_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def four_vf_data_rate(
    num_orbs: int = 5005,
    carrier_freq_hz: float = 500.0,
    modulation: str = "OOK",
    sigil_size_bytes: int = 64,
) -> dict:
    """Compute the 4VF data rate per orb + total."""
    # Per-orb data rate
    if modulation == "OOK":
        bits_per_symbol = 1
    elif modulation == "FSK":
        bits_per_symbol = 2
    elif modulation == "PSK":
        bits_per_symbol = 2
    else:
        bits_per_symbol = 1
    per_orb_bitrate_bps = carrier_freq_hz * bits_per_symbol
    per_orb_bytes_per_sec = per_orb_bitrate_bps / 8
    # SIGIL signing rate per orb
    sigils_per_sec_per_orb = per_orb_bytes_per_sec / sigil_size_bytes
    # Total data rate
    total_data_rate_bps = num_orbs * per_orb_bitrate_bps
    total_bytes_per_sec = num_orbs * per_orb_bytes_per_sec

    return {
        "num_orbs": num_orbs,
        "carrier_freq_hz": carrier_freq_hz,
        "modulation": modulation,
        "bits_per_symbol": bits_per_symbol,
        "per_orb_bitrate_bps": per_orb_bitrate_bps,
        "per_orb_bytes_per_sec": per_orb_bytes_per_sec,
        "sigil_size_bytes": sigil_size_bytes,
        "sigils_per_sec_per_orb": sigils_per_sec_per_orb,
        "total_data_rate_bps": total_data_rate_bps,
        "total_data_rate_kbps": total_data_rate_bps / 1000,
        "total_data_rate_mbps": total_data_rate_bps / 1e6,
        "total_bytes_per_sec": total_bytes_per_sec,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def four_vf_modulation_scheme(
    scheme: str = "OOK",
    snr_db: float = 40.0,
) -> dict:
    """Return the modulation scheme parameters."""
    schemes = {
        "OOK": {"bits_per_symbol": 1, "min_snr_db": 10, "complexity": "low", "robustness": "high"},
        "FSK": {"bits_per_symbol": 2, "min_snr_db": 15, "complexity": "medium", "robustness": "high"},
        "PSK": {"bits_per_symbol": 2, "min_snr_db": 12, "complexity": "medium", "robustness": "medium"},
        "QAM": {"bits_per_symbol": 4, "min_snr_db": 20, "complexity": "high", "robustness": "medium"},
    }
    selected = schemes.get(scheme, schemes["OOK"])
    snr_margin_db = snr_db - selected["min_snr_db"]
    viable = snr_margin_db > 0

    return {
        "scheme": scheme,
        "snr_db": snr_db,
        "snr_margin_db": snr_margin_db,
        "viable": viable,
        "bits_per_symbol": selected["bits_per_symbol"],
        "min_snr_db": selected["min_snr_db"],
        "complexity": selected["complexity"],
        "robustness": selected["robustness"],
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def four_vf_signal_attenuation(
    capillary_length_m: float = 1.5,
    carrier_freq_hz: float = 500.0,
    fluid: str = "water",
) -> dict:
    """Compute the signal attenuation along the capillary."""
    # Attenuation coefficient (alpha in dB/m for water at various frequencies)
    alpha_db_per_m = {
        100: 0.01,
        500: 0.1,
        1000: 0.5,
        5000: 2.0,
        10000: 5.0,
    }
    # Find closest frequency
    closest_freq = min(alpha_db_per_m.keys(), key=lambda x: abs(x - carrier_freq_hz))
    alpha = alpha_db_per_m[closest_freq]
    total_attenuation_db = alpha * capillary_length_m
    # Signal-to-noise ratio
    initial_snr_db = 60  # 60 dB initial SNR (clean water)
    final_snr_db = initial_snr_db - total_attenuation_db

    return {
        "capillary_length_m": capillary_length_m,
        "carrier_freq_hz": carrier_freq_hz,
        "fluid": fluid,
        "alpha_db_per_m": alpha,
        "total_attenuation_db": total_attenuation_db,
        "initial_snr_db": initial_snr_db,
        "final_snr_db": final_snr_db,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def four_vf_sigil_encoding(
    sigil_size_bytes: int = 64,
    sigils_per_second: int = 1,
    encoding_scheme: str = "amplitude_shift_keying",
) -> dict:
    """Compute the SIGIL encoding in the 4VF pressure wave."""
    # Encode each SIGIL as 64 bytes in the 4VF amplitude
    # 8 bits per amplitude sample
    samples_per_sigil = sigil_size_bytes * 8
    samples_per_sec = samples_per_sigil * sigils_per_second
    # Per-orb data rate
    per_orb_data_rate_bps = samples_per_sec * 8  # 8 bits per sample
    # Pressure wave amplitude
    pressure_amplitude_pa = 100  # 100 Pa peak (typical for capillary flow)

    return {
        "sigil_size_bytes": sigil_size_bytes,
        "sigils_per_second": sigils_per_second,
        "encoding_scheme": encoding_scheme,
        "samples_per_sigil": samples_per_sigil,
        "samples_per_sec": samples_per_sec,
        "per_orb_data_rate_bps": per_orb_data_rate_bps,
        "pressure_amplitude_pa": pressure_amplitude_pa,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def four_vf_decoding_per_orb(
    carrier_freq_hz: float = 500.0,
    sampling_rate_hz: float = 10000.0,
    adc_bits: int = 12,
    sigil_size_bytes: int = 64,
) -> dict:
    """Compute the decoding at each orb."""
    # Nyquist check
    nyquist_ok = sampling_rate_hz >= 2 * carrier_freq_hz
    # ADC dynamic range
    dynamic_range_db = adc_bits * 6.02
    # Decoding latency (per orb)
    decoding_latency_ms = 1.0  # 1 ms for envelope detection
    # Processing power
    microcontroller = "ARM Cortex-M0+ (32 MHz, 4 KB RAM)"
    cost_per_orb_gbp = 0.50

    return {
        "carrier_freq_hz": carrier_freq_hz,
        "sampling_rate_hz": sampling_rate_hz,
        "nyquist_ok": nyquist_ok,
        "adc_bits": adc_bits,
        "dynamic_range_db": dynamic_range_db,
        "sigil_size_bytes": sigil_size_bytes,
        "decoding_latency_ms": decoding_latency_ms,
        "microcontroller": microcontroller,
        "cost_per_orb_gbp": cost_per_orb_gbp,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-4vf-data-transport-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="4vf_data_rate", description="Compute the 4VF data rate per orb + total.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "carrier_freq_hz": {"type": "number", "default": 500.0}, "modulation": {"type": "string", "default": "OOK"}}, "required": []}),
        Tool(name="4vf_modulation_scheme", description="Return the modulation scheme parameters.", inputSchema={"type": "object", "properties": {"scheme": {"type": "string", "default": "OOK"}, "snr_db": {"type": "number", "default": 40.0}}, "required": []}),
        Tool(name="4vf_signal_attenuation", description="Compute the signal attenuation along the capillary.", inputSchema={"type": "object", "properties": {"capillary_length_m": {"type": "number", "default": 1.5}, "carrier_freq_hz": {"type": "number", "default": 500.0}}, "required": []}),
        Tool(name="4vf_sigil_encoding", description="Compute the SIGIL encoding in the 4VF pressure wave.", inputSchema={"type": "object", "properties": {"sigil_size_bytes": {"type": "integer", "default": 64}, "sigils_per_second": {"type": "integer", "default": 1}}, "required": []}),
        Tool(name="4vf_decoding_per_orb", description="Compute the decoding at each orb.", inputSchema={"type": "object", "properties": {"carrier_freq_hz": {"type": "number", "default": 500.0}, "sampling_rate_hz": {"type": "number", "default": 10000.0}, "adc_bits": {"type": "integer", "default": 12}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "4vf_data_rate":
        result = four_vf_data_rate(**arguments)
    elif name == "4vf_modulation_scheme":
        result = four_vf_modulation_scheme(**arguments)
    elif name == "4vf_signal_attenuation":
        result = four_vf_signal_attenuation(**arguments)
    elif name == "4vf_sigil_encoding":
        result = four_vf_sigil_encoding(**arguments)
    elif name == "4vf_decoding_per_orb":
        result = four_vf_decoding_per_orb(**arguments)
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