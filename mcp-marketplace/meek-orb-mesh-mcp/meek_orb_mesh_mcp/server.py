#!/usr/bin/env python3
"""
meek-orb-mesh-mcp — server.py

Multi-frequency orb mesh (LoRa + WiFi + BLE + Sigil + UWB) for the
sovereign orb network.

Tools (6):
  1. multi_frequency_mesh        — compute the mesh routing table
  2. lora_long_range_comms       — compute LoRa range + power
  3. wifi_high_bandwidth_comms   — compute WiFi throughput + power
  4. ble_mesh_relay              — compute BLE mesh relay
  5. sigil_sovereign_signing_chain — compute SIGIL chain verification
  6. mesh_resilience             — compute mesh resilience to node failure
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

logger = logging.getLogger("meek_orb_mesh_mcp")
logging.basicConfig(level=logging.INFO)

BANNED_TERMS = re.compile(r"\b(james castle|grant carter|chris j\.?|csga[\-\s]?global|terranova)\b", re.IGNORECASE)


class BannedTermGate:
    @staticmethod
    def check(prompt: str) -> tuple[bool, str]:
        if not prompt: return True, ""
        m = BANNED_TERMS.search(prompt)
        if m: return False, f"Refused: '{m.group(0)}'"
        return True, ""


def multi_frequency_mesh(
    num_orbs: int = 5005,
    mesh_radius_m: float = 100.0,
    num_radios_per_orb: int = 5,
) -> dict:
    """Compute the mesh routing table."""
    # Number of edges in the mesh (assume each orb connects to ~10 neighbors)
    edges_per_orb = 10
    total_edges = num_orbs * edges_per_orb // 2  # undirected
    # Mesh diameter (max hops)
    mesh_diameter_hops = math.ceil(math.log2(num_orbs))
    # Routing table size per orb
    routing_table_size_bytes = edges_per_orb * 16  # 16 bytes per route entry
    total_routing_bytes = num_orbs * routing_table_size_bytes

    return {
        "num_orbs": num_orbs,
        "mesh_radius_m": mesh_radius_m,
        "num_radios_per_orb": num_radios_per_orb,
        "edges_per_orb": edges_per_orb,
        "total_edges": total_edges,
        "mesh_diameter_hops": mesh_diameter_hops,
        "routing_table_size_per_orb_bytes": routing_table_size_bytes,
        "total_routing_memory_mb": total_routing_bytes / 1e6,
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def lora_long_range_comms(
    frequency_mhz: float = 868.0,
    spreading_factor: int = 7,
    bandwidth_khz: float = 125.0,
    tx_power_dbm: float = 14.0,
) -> dict:
    """Compute LoRa range + power."""
    # Bitrate (LoRa formula)
    bitrate_bps = (bandwidth_khz * 1000 * (4 / (4 + spreading_factor))) / (2 ** spreading_factor / bandwidth_khz)
    bitrate_kbps = bitrate_bps / 1000
    # Range (free space path loss at 868 MHz)
    fspl_db = 100  # typical urban at 1km
    range_km = 10 ** ((tx_power_dbm + 5 - fspl_db) / 20)  # very approximate
    # Battery life (1000 mAh LiPo at 14 dBm)
    battery_life_hours = 1000 / (10 ** (tx_power_dbm / 10) * 60 / 1000)

    return {
        "frequency_mhz": frequency_mhz,
        "spreading_factor": spreading_factor,
        "bandwidth_khz": bandwidth_khz,
        "tx_power_dbm": tx_power_dbm,
        "bitrate_kbps": bitrate_kbps,
        "range_km": range_km,
        "battery_life_hours_1000mah": battery_life_hours,
        "use_case": "Long-range, low-power (sensor to brain)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def wifi_high_bandwidth_comms(
    frequency_ghz: float = 5.0,
    channel_width_mhz: float = 80,
    mimo_streams: int = 2,
    tx_power_dbm: float = 20.0,
) -> dict:
    """Compute WiFi throughput + power."""
    # Max throughput (WiFi 6 formula)
    max_throughput_mbps = channel_width_mhz * 0.6 * mimo_streams  # 600 Mbps / 80 MHz / 2x2
    # Range
    range_m = 100  # typical indoor
    # Power
    power_mw = 10 ** (tx_power_dbm / 10)

    return {
        "frequency_ghz": frequency_ghz,
        "channel_width_mhz": channel_width_mhz,
        "mimo_streams": mimo_streams,
        "tx_power_dbm": tx_power_dbm,
        "max_throughput_mbps": max_throughput_mbps,
        "range_m": range_m,
        "power_mw": power_mw,
        "use_case": "High-bandwidth (brain to sensors)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def ble_mesh_relay(
    num_orbs: int = 5005,
    ble_range_m: float = 30.0,
    max_hops: int = 10,
) -> dict:
    """Compute BLE mesh relay performance."""
    # BLE mesh: each orb relays for neighbors
    avg_hops = math.ceil(math.log(num_orbs))
    latency_per_hop_ms = 5
    total_latency_ms = avg_hops * latency_per_hop_ms
    # Coverage (BLE mesh covers the entire area if density > 1 orb per range²)
    coverage_pct = min(100.0, (num_orbs * ble_range_m ** 2) / 1e6)

    return {
        "num_orbs": num_orbs,
        "ble_range_m": ble_range_m,
        "avg_hops": avg_hops,
        "max_hops": max_hops,
        "total_latency_ms": total_latency_ms,
        "coverage_pct": coverage_pct,
        "use_case": "Mesh networking (orb to orb)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def sigil_sovereign_signing_chain(
    num_orbs: int = 5005,
    messages_per_second_per_orb: float = 10.0,
) -> dict:
    """Compute SIGIL chain verification."""
    total_msgs_per_sec = num_orbs * messages_per_second_per_orb
    sigil_size_bytes = 64  # Ed25519 signature
    chain_throughput_kbps = (total_msgs_per_sec * sigil_size_bytes * 8) / 1000
    # Verification time (Ed25519 is ~100 µs per signature on modern CPU)
    verification_time_ms = 0.1

    return {
        "num_orbs": num_orbs,
        "messages_per_second_per_orb": messages_per_second_per_orb,
        "total_msgs_per_sec": total_msgs_per_sec,
        "sigil_size_bytes": sigil_size_bytes,
        "chain_throughput_kbps": chain_throughput_kbps,
        "verification_time_ms_per_msg": verification_time_ms,
        "use_case": "Sovereign SIGIL signing chain (Ed25519)",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


def mesh_resilience(
    num_orbs: int = 5005,
    node_failure_pct: float = 30.0,
    mesh_redundancy_factor: int = 3,
) -> dict:
    """Compute mesh resilience to node failure."""
    failed_orbs = num_orbs * (node_failure_pct / 100)
    surviving_orbs = num_orbs - failed_orbs
    # Probability of mesh fragmentation (with redundancy 3)
    fragment_probability = (node_failure_pct / 100) ** (mesh_redundancy_factor + 1)
    mesh_uptime_pct = (1 - fragment_probability) * 100
    # Coverage after failure (if mesh stays connected)
    coverage_pct = (surviving_orbs / num_orbs) * 100

    return {
        "num_orbs": num_orbs,
        "node_failure_pct": node_failure_pct,
        "mesh_redundancy_factor": mesh_redundancy_factor,
        "failed_orbs": failed_orbs,
        "surviving_orbs": surviving_orbs,
        "fragment_probability": fragment_probability,
        "mesh_uptime_pct": mesh_uptime_pct,
        "coverage_after_failure_pct": coverage_pct,
        "verdict": "RESILIENT" if mesh_uptime_pct > 99 else "MARGINAL",
        "ts": datetime.now(timezone.utc).isoformat(),
    }


mcp = Server("meek-orb-mesh-mcp") if Server is not None else None


@mcp.list_tools() if mcp else None
async def list_tools():
    return [
        Tool(name="multi_frequency_mesh", description="Compute the mesh routing table.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "mesh_radius_m": {"type": "number", "default": 100.0}}, "required": []}),
        Tool(name="lora_long_range_comms", description="Compute LoRa range + power.", inputSchema={"type": "object", "properties": {"frequency_mhz": {"type": "number", "default": 868.0}, "spreading_factor": {"type": "integer", "default": 7}, "tx_power_dbm": {"type": "number", "default": 14.0}}, "required": []}),
        Tool(name="wifi_high_bandwidth_comms", description="Compute WiFi throughput + power.", inputSchema={"type": "object", "properties": {"frequency_ghz": {"type": "number", "default": 5.0}, "channel_width_mhz": {"type": "number", "default": 80}, "mimo_streams": {"type": "integer", "default": 2}}, "required": []}),
        Tool(name="ble_mesh_relay", description="Compute BLE mesh relay.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "ble_range_m": {"type": "number", "default": 30.0}}, "required": []}),
        Tool(name="sigil_sovereign_signing_chain", description="Compute SIGIL chain verification.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "messages_per_second_per_orb": {"type": "number", "default": 10.0}}, "required": []}),
        Tool(name="mesh_resilience", description="Compute mesh resilience to node failure.", inputSchema={"type": "object", "properties": {"num_orbs": {"type": "integer", "default": 5005}, "node_failure_pct": {"type": "number", "default": 30.0}, "mesh_redundancy_factor": {"type": "integer", "default": 3}}, "required": []}),
    ]


@mcp.call_tool() if mcp else None
async def call_tool(name: str, arguments: dict) -> list:
    if name == "multi_frequency_mesh":
        result = multi_frequency_mesh(**arguments)
    elif name == "lora_long_range_comms":
        result = lora_long_range_comms(**arguments)
    elif name == "wifi_high_bandwidth_comms":
        result = wifi_high_bandwidth_comms(**arguments)
    elif name == "ble_mesh_relay":
        result = ble_mesh_relay(**arguments)
    elif name == "sigil_sovereign_signing_chain":
        result = sigil_sovereign_signing_chain(**arguments)
    elif name == "mesh_resilience":
        result = mesh_resilience(**arguments)
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