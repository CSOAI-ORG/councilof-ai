#!/usr/bin/env python3
"""Tests for meek-orb-mesh-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_orb_mesh_mcp.server import (
    multi_frequency_mesh,
    lora_long_range_comms,
    wifi_high_bandwidth_comms,
    ble_mesh_relay,
    sigil_sovereign_signing_chain,
    mesh_resilience,
)


def test_multi_frequency_mesh():
    r = multi_frequency_mesh(num_orbs=5005, mesh_radius_m=100.0)
    assert r["total_edges"] > 0
    assert r["mesh_diameter_hops"] > 0
    print(f"✅ test_mesh: {r['total_edges']} edges, {r['mesh_diameter_hops']} hops")


def test_lora_long_range_comms():
    r = lora_long_range_comms(frequency_mhz=868.0, spreading_factor=7)
    assert r["bitrate_kbps"] > 0
    assert r["range_km"] > 0
    print(f"✅ test_lora: {r['bitrate_kbps']:.1f} kbps, range={r['range_km']:.1f} km")


def test_wifi_high_bandwidth_comms():
    r = wifi_high_bandwidth_comms(frequency_ghz=5.0, channel_width_mhz=80, mimo_streams=2)
    assert r["max_throughput_mbps"] > 0
    print(f"✅ test_wifi: {r['max_throughput_mbps']:.0f} Mbps")


def test_ble_mesh_relay():
    r = ble_mesh_relay(num_orbs=5005, ble_range_m=30.0)
    assert r["avg_hops"] > 0
    assert r["total_latency_ms"] > 0
    print(f"✅ test_ble: avg_hops={r['avg_hops']}, latency={r['total_latency_ms']}ms")


def test_sigil_sovereign_signing_chain():
    r = sigil_sovereign_signing_chain(num_orbs=5005, messages_per_second_per_orb=10.0)
    assert r["total_msgs_per_sec"] > 0
    print(f"✅ test_sigil: {r['total_msgs_per_sec']:.0f} msgs/sec, chain={r['chain_throughput_kbps']:.1f} kbps")


def test_mesh_resilience():
    r = mesh_resilience(num_orbs=5005, node_failure_pct=30.0, mesh_redundancy_factor=3)
    assert "RESILIENT" in r["verdict"] or "MARGINAL" in r["verdict"]
    print(f"✅ test_resilience: {r['mesh_uptime_pct']:.2f}% uptime, verdict={r['verdict']}")


if __name__ == "__main__":
    test_multi_frequency_mesh()
    test_lora_long_range_comms()
    test_wifi_high_bandwidth_comms()
    test_ble_mesh_relay()
    test_sigil_sovereign_signing_chain()
    test_mesh_resilience()
    print("\n🎉 ALL 6 TESTS PASSED — meek-orb-mesh-mcp v1.0.0 is sovereign.")