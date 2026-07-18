#!/usr/bin/env python3
"""Tests for meek-stone-soup-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_stone_soup_mcp.server import multi_target_tracking, julia_dynamics_agent_simulation, drone_swarm_tactics


def test_multi_target_tracking():
    r = multi_target_tracking(num_targets=5, num_sensors=3)
    assert r["pda_efficiency"] > 0
    assert "verdict" in r
    print(f"✅ test_multi_target_tracking: pda={r['pda_efficiency']:.3f}, verdict={r['verdict']}")


def test_julia_dynamics_agent_simulation():
    r = julia_dynamics_agent_simulation(num_agents=100, num_steps=1000)
    assert 0 <= r["synchronization_order_param"] <= 1
    assert "verdict" in r
    print(f"✅ test_julia_dynamics: sync_order={r['synchronization_order_param']:.3f}")


def test_drone_swarm_tactics():
    r = drone_swarm_tactics(num_drones=20, mission_type="swarm_formation")
    assert r["num_drones"] == 20
    assert r["coverage_area_km2"] > 0
    print(f"✅ test_drone_swarm_tactics: coverage={r['coverage_area_km2']:.2f} km²")


if __name__ == "__main__":
    test_multi_target_tracking()
    test_julia_dynamics_agent_simulation()
    test_drone_swarm_tactics()
    print("\n🎉 ALL 3 TESTS PASSED — meek-stone-soup-mcp v1.0.0 is sovereign.")