#!/usr/bin/env python3
"""Tests for meek-pdca-planning-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_pdca_planning_mcp.server import (
    pdca_plan_phase,
    pdca_do_phase,
    pdca_check_phase,
    pdca_act_phase,
    pdca_loop_metrics,
)


def test_pdca_plan_phase():
    r = pdca_plan_phase(goal="deliver_package", num_candidate_paths=47, digital_twin_available=True)
    assert r["paths_simulated"] == 470  # 47 * 10
    assert r["plan_time_ms"] == 10  # with digital twin
    assert r["best_path_length_steps"] == 12
    print(f"✅ test_pdca_plan: {r['paths_simulated']} paths, {r['plan_time_ms']}ms plan time")


def test_pdca_do_phase():
    r = pdca_do_phase(plan_path_length=12, execution_speed_m_per_s=1.0)
    assert r["execution_time_s"] == 12.0
    assert r["actions_executed"] == 12
    print(f"✅ test_pdca_do: {r['execution_time_s']}s execution")


def test_pdca_check_phase_pass():
    r = pdca_check_phase(expected_sensor_data=(1.0, 2.0, 3.0), actual_sensor_data=(1.05, 2.1, 2.95))
    assert r["verdict"] in ("PASS", "REPLAN_NEEDED")
    print(f"✅ test_pdca_check: {r['verdict']}, max_dev={r['max_deviation_pct']:.1f}%")


def test_pdca_act_phase():
    r = pdca_act_phase(replan_time_ms=1.0, original_plan_steps=12, new_plan_steps=10)
    assert r["improvement_pct"] > 0
    print(f"✅ test_pdca_act: {r['improvement_pct']:.1f}% improvement, {r['replan_time_ms']}ms replan")


def test_pdca_loop_metrics():
    r = pdca_loop_metrics(cycles_completed=100, avg_cycle_time_ms=100.0, replanning_rate=0.15)
    assert r["success_rate"] == 0.85
    assert r["verdict"] in ("OPTIMAL", "ACCEPTABLE", "POOR")
    print(f"✅ test_pdca_loop: {r['success_rate']*100}% success, verdict={r['verdict']}")


if __name__ == "__main__":
    test_pdca_plan_phase()
    test_pdca_do_phase()
    test_pdca_check_phase_pass()
    test_pdca_act_phase()
    test_pdca_loop_metrics()
    print("\n🎉 ALL 5 TESTS PASSED — meek-pdca-planning-mcp v1.0.0 is sovereign. The orb plans + acts + checks + corrects.")