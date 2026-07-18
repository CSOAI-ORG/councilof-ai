#!/usr/bin/env python3
"""Tests for meek-capillary-actuator-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_capillary_actuator_mcp.server import (
    capillary_muscle_force,
    capillary_muscle_response_time,
    capillary_muscle_energy_per_actuation,
    electroosmotic_control_voltage,
    mcmb_fabrication_cost,
    capillary_muscle_efficiency,
)


def test_capillary_muscle_force():
    r = capillary_muscle_force(num_capillaries=1000, electroosmotic_voltage_v=50.0)
    assert r["f_total_n"] > 0
    assert r["f_total_mn"] > 0
    print(f"✅ test_capillary_muscle_force: {r['f_total_mn']:.2f} mN per orb (passive + EO)")


def test_capillary_muscle_response_time():
    r = capillary_muscle_response_time(capillary_length_m=0.05, electroosmotic=True)
    assert r["t_passive_s"] > 0
    assert r["t_active_s"] < r["t_passive_s"]
    print(f"✅ test_response_time: passive={r['t_passive_s']:.2f}s, EO={r['t_active_s']:.3f}s ({r['speedup_factor']:.0f}x speedup)")


def test_capillary_muscle_energy_per_actuation():
    r = capillary_muscle_energy_per_actuation(f_total_n=0.5, displacement_m=0.01)
    assert r["w_mechanical_j"] > 0
    print(f"✅ test_energy_per_actuation: {r['w_mechanical_j']:.3e} J mechanical, {r['efficiency_pct']:.1f}% efficiency")


def test_electroosmotic_control_voltage():
    r = electroosmotic_control_voltage(target_force_n=0.5, num_capillaries=10000)
    assert r["v_required_v"] > 0
    # Voltage scales inversely with capillary count - higher density = lower voltage
    # With 10000 capillaries per orb, voltage is reasonable (~90V)
    assert r["v_required_v"] < 200  # within reasonable voltage range (under 200V)
    print(f"✅ test_electroosmotic_voltage: {r['v_required_v']:.1f}V required for {r['target_force_n']}N")


def test_mcmb_fabrication_cost():
    r = mcmb_fabrication_cost(num_capillaries=1000, orb_size_mm=25.0)
    assert r["cost_per_orb_gbp"] > 0
    print(f"✅ test_fabrication_cost: £{r['cost_per_orb_gbp']:.2f} per orb, £{r['cost_per_5000_orbs_gbp']:.0f} per 5000-orb humanoid")


def test_capillary_muscle_efficiency():
    r = capillary_muscle_efficiency()
    assert "DC_servo_motor" in r["comparison"]
    assert "MCMB_capillary_EO" in r["comparison"]
    print(f"✅ test_efficiency: 5 actuator types compared")


if __name__ == "__main__":
    test_capillary_muscle_force()
    test_capillary_muscle_response_time()
    test_capillary_muscle_energy_per_actuation()
    test_electroosmotic_control_voltage()
    test_mcmb_fabrication_cost()
    test_capillary_muscle_efficiency()
    print("\n🎉 ALL 6 TESTS PASSED — meek-capillary-actuator-mcp v1.0.0 is sovereign.")