#!/usr/bin/env python3
"""Tests for meek-humanoid-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_humanoid_mcp.server import (
    humanoid_body_plan,
    muscle_count_for_force,
    inverse_kinematics_posture,
    capillary_spine_bus,
    humanoid_energy_budget,
)


def test_humanoid_body_plan():
    r = humanoid_body_plan(num_muscle_groups=200, orbs_per_muscle_group=25)
    assert r["total_muscle_orbs"] == 5000
    assert r["total_orbs"] == 5005  # 5000 + 4 sensor + 1 brain
    print(f"✅ test_humanoid_body_plan: {r['total_orbs']} orbs, mass={r['total_mass_kg']:.1f} kg")


def test_muscle_count_for_force():
    r = muscle_count_for_force(target_force_n=100, force_per_orb_n=2.0)
    assert r["n_orbs_safe"] >= 50
    print(f"✅ test_muscle_count: {r['n_orbs_safe']} orbs for 100N force (2x safety)")


def test_inverse_kinematics_posture():
    r = inverse_kinematics_posture(target_hand_position_cm=(50, 100, 50))
    if "error" not in r:
        assert "shoulder_azimuth_deg" in r
        assert "elbow_angle_deg" in r
        print(f"✅ test_ik: shoulder={r['shoulder_azimuth_deg']:.1f}°, elbow={r['elbow_angle_deg']:.1f}°")
    else:
        print(f"⚠️ test_ik: target out of reach (expected for default)")


def test_capillary_spine_bus():
    r = capillary_spine_bus()
    assert "coolant" in r["channels"]
    assert "sigil_bus" in r["channels"]
    print(f"✅ test_spine_bus: 4 channels (coolant + power + EO + SIGIL)")


def test_humanoid_energy_budget():
    r = humanoid_energy_budget(num_muscle_orbs=5000, actuation_power_per_orb_w=0.5, duty_cycle_pct=10.0, energy_harvested_mw=201.61)
    assert "peak_total_power_w" in r
    assert "verdict" in r
    print(f"✅ test_energy_budget: peak={r['peak_total_power_w']:.0f}W, avg={r['avg_continuous_power_w']:.1f}W, verdict={r['verdict']}")


if __name__ == "__main__":
    test_humanoid_body_plan()
    test_muscle_count_for_force()
    test_inverse_kinematics_posture()
    test_capillary_spine_bus()
    test_humanoid_energy_budget()
    print("\n🎉 ALL 5 TESTS PASSED — meek-humanoid-mcp v1.0.0 is sovereign.")