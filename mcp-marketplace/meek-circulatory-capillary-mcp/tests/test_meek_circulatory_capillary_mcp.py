#!/usr/bin/env python3
"""Tests for meek-circulatory-capillary-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_circulatory_capillary_mcp.server import (
    working_fluid_composition,
    peristaltic_heart_pump,
    capillary_artery_vein,
    capillary_valve_network,
    blood_orb_cycle,
    circulatory_resilience,
)


def test_working_fluid_composition():
    r = working_fluid_composition(num_orbs=5005, fluid_volume_per_orb_ml=0.1)
    assert r["total_volume_ml"] == 500.5
    assert r["na_cl_mass_g"] > 0
    print(f"✅ test_working_fluid: {r['total_volume_ml']} mL total, {r['na_cl_mass_g']:.2f}g NaCl")


def test_peristaltic_heart_pump():
    r = peristaltic_heart_pump(flow_rate_ml_per_min=100.0, pressure_mmhg=75.0, roller_rpm=70)
    assert r["flow_rate_ml_per_min"] > 0
    assert r["bpm"] == 70
    assert r["electrical_power_w"] > 0
    print(f"✅ test_heart_pump: {r['flow_rate_ml_per_min']:.1f} mL/min, {r['electrical_power_w']:.2f}W, {r['bpm']} BPM")


def test_capillary_artery_vein():
    r = capillary_artery_vein(flow_rate_ml_per_min=100.0)
    assert r["artery_velocity_m_per_s"] > 0
    assert r["vein_velocity_m_per_s"] > 0
    print(f"✅ test_artery_vein: artery_v={r['artery_velocity_m_per_s']:.3f}m/s, vein_v={r['vein_velocity_m_per_s']:.3f}m/s")


def test_capillary_valve_network():
    r = capillary_valve_network(num_orbs=5005)
    assert r["total_valves"] == 10010
    assert r["total_cost_gbp"] == 5005 * 0.6
    print(f"✅ test_valve_network: {r['total_valves']} valves, £{r['total_cost_gbp']:.0f}")


def test_blood_orb_cycle():
    r = blood_orb_cycle(bpm=70, stroke_volume_ml=1.4, num_orbs=5005)
    assert r["cardiac_output_ml_per_min"] == 98.0  # 70 * 1.4
    assert r["cycle_time_s"] > 0
    print(f"✅ test_blood_orb_cycle: CO={r['cardiac_output_ml_per_min']} mL/min, {r['cycles_per_day']} cycles/day")


def test_circulatory_resilience():
    r = circulatory_resilience(num_pumps=2, pump_failure_pct=50.0, redundancy_factor=2)
    assert r["system_survives"] is True
    assert r["verdict"] == "RESILIENT"
    print(f"✅ test_resilience: {r['verdict']}, buffer={r['fluid_buffer_time_s']}s")


if __name__ == "__main__":
    test_working_fluid_composition()
    test_peristaltic_heart_pump()
    test_capillary_artery_vein()
    test_capillary_valve_network()
    test_blood_orb_cycle()
    test_circulatory_resilience()
    print("\n🎉 ALL 6 TESTS PASSED — meek-circulatory-capillary-mcp v1.0.0 is sovereign. The body is alive.")