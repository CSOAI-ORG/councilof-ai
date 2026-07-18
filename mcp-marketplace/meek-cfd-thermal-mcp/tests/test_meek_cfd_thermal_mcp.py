#!/usr/bin/env python3
"""Tests for meek-cfd-thermal-mcp."""
import os
import sys

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_cfd_thermal_mcp.server import (
    coolprop_lookup,
    capillary_flow,
    two_phase_heat_removal,
    cantera_combustion,
    run_capillary_cooling_full_sim,
)


def test_coolprop_lookup():
    result = coolprop_lookup("water", "D", "T", 293.15)
    assert "value" in result
    print(f"✅ test_coolprop_lookup: water density at 20°C = {result['value']:.1f} kg/m³")


def test_capillary_flow():
    result = capillary_flow(channel_diameter=0.5e-3, channel_length=0.3)
    assert result["capillary_pressure_pa"] > 0
    assert result["verdict"] in ("PASS", "MARGINAL")
    print(f"✅ test_capillary_flow: dp_cap={result['capillary_pressure_pa']:.0f} Pa")


def test_two_phase_heat_removal():
    result = two_phase_heat_removal(heat_flux_w=5.0, fluid="water", fraction_evaporated=0.1)
    assert "phase_change_advantage" in result
    assert result["phase_change_advantage"] > 0
    print(f"✅ test_two_phase_heat_removal: phase_change_advantage={result['phase_change_advantage']:.0f}x")


def test_cantera_combustion():
    result = cantera_combustion(fuel="methane", equivalence_ratio=1.0)
    assert "engine" in result
    print(f"✅ test_cantera_combustion: {result['engine']}")


def test_run_capillary_cooling_full_sim():
    result = run_capillary_cooling_full_sim(channel_diameter=0.5e-3, heat_flux_w_per_cm2=10.0)
    assert result["sim"] == "capillary_cooling_full"
    assert "capillary_flow" in result
    assert "thermal" in result
    print(f"✅ test_run_capillary_cooling_full_sim: {result['verdict']}")


if __name__ == "__main__":
    test_coolprop_lookup()
    test_capillary_flow()
    test_two_phase_heat_removal()
    test_cantera_combustion()
    test_run_capillary_cooling_full_sim()
    print("\n🎉 ALL 5 TESTS PASSED — meek-cfd-thermal-mcp v1.0.0 is sovereign.")
