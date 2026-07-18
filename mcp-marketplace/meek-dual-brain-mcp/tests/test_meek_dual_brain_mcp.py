#!/usr/bin/env python3
"""Tests for meek-dual-brain-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_dual_brain_mcp.server import (
    left_brain_status,
    right_brain_status,
    brain_routing,
    brain_synchronization,
    dual_brain_throughput,
)


def test_left_brain_status():
    r = left_brain_status()
    assert r["brain"] == "LEFT (SOV3 Online)"
    assert r["latency_ms"] == 50
    assert r["status"] == "ONLINE"
    print(f"✅ test_left_brain: {r['throughput_tokens_per_sec']} tok/s, {r['latency_ms']}ms latency")


def test_right_brain_status():
    r = right_brain_status()
    assert r["brain"] == "RIGHT (Coral Offline)"
    assert r["latency_ms"] == 1
    assert r["status"] == "ONLINE"
    print(f"✅ test_right_brain: {r['throughput_inf_per_sec']} inf/s, {r['latency_ms']}ms latency")


def test_brain_routing_fast():
    r = brain_routing(decision_type="fast_reflex", decision_urgency_ms=5)
    assert r["route"] == "RIGHT_BRAIN"
    print(f"✅ test_brain_routing_fast: {r['route']} ({r['reason']})")


def test_brain_routing_strategic():
    r = brain_routing(decision_type="strategic_plan", decision_urgency_ms=500)
    assert r["route"] == "LEFT_BRAIN"
    print(f"✅ test_brain_routing_strategic: {r['route']}")


def test_brain_synchronization():
    r = brain_synchronization(sync_interval_ms=100, data_per_sync_bytes=1024)
    assert r["sync_data_rate_bps"] == 81920  # 1024 * 8 / 0.1
    assert r["verdict"] == "SYNCHRONIZED"
    print(f"✅ test_brain_sync: {r['sync_data_rate_bps']} bps, verdict={r['verdict']}")


def test_dual_brain_throughput():
    r = dual_brain_throughput(left_brain_tps=3000, right_brain_ips=100)
    assert r["combined_strategy_tokens_per_sec"] == 3000
    assert r["combined_tactical_inf_per_sec"] == 100
    print(f"✅ test_dual_brain: strategy={r['combined_strategy_tokens_per_sec']} tok/s, tactical={r['combined_tactical_inf_per_sec']} inf/s")


if __name__ == "__main__":
    test_left_brain_status()
    test_right_brain_status()
    test_brain_routing_fast()
    test_brain_routing_strategic()
    test_brain_synchronization()
    test_dual_brain_throughput()
    print("\n🎉 ALL 6 TESTS PASSED — meek-dual-brain-mcp v1.0.0 is sovereign. The orb has two brains.")