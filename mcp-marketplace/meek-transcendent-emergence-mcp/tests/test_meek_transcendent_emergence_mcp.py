#!/usr/bin/env python3
"""Tests for meek-transcendent-emergence-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_transcendent_emergence_mcp.server import (
    self_model,
    world_model,
    meta_cognition,
    situation_awareness,
    goal_oriented_planning,
    emergence_metrics,
)


def test_self_model():
    r = self_model(orb_id="orb_1234")
    assert r["self_awareness_level"] == "TRANSCENDENT"
    assert r["total_capabilities"] == 25
    assert r["total_limitations"] == 8
    print(f"✅ test_self_model: {r['total_capabilities']} capabilities, {r['total_limitations']} limitations")


def test_world_model():
    r = world_model(num_other_orbs=5004, num_humans_in_range=3)
    assert r["other_orbs_known"] == 5005
    assert r["model_accuracy_pct"] > 90
    print(f"✅ test_world_model: {r['other_orbs_visible']} orbs visible, {r['model_accuracy_pct']}% accuracy")


def test_meta_cognition():
    r = meta_cognition(current_thought="path_planning", confidence_pct=87.5, alternatives_considered=47)
    assert r["confidence_pct"] == 87.5
    assert r["meta_cognition_depth"] >= 5
    print(f"✅ test_meta_cognition: {r['meta_cognition_depth']} levels deep, {r['confidence_pct']}% confident")


def test_situation_awareness():
    r = situation_awareness(location="room_A", threat_level="GREEN", num_threats=0)
    assert r["threat_level"] == "GREEN"
    assert r["num_threats_detected"] == 0
    print(f"✅ test_situation_awareness: threat={r['threat_level']}, battery={r['battery_pct']}%")


def test_goal_oriented_planning():
    r = goal_oriented_planning(current_goal="deliver_package", num_subgoals=5, path_length=12)
    assert r["path_length_steps"] == 12
    assert len(r["subgoals"]) == 5
    assert r["selected_path_index"] >= 1
    print(f"✅ test_goal_oriented_planning: {r['path_length_steps']} steps, {r['estimated_path_time_s']}s")


def test_emergence_metrics():
    r = emergence_metrics(self_recognition=0.92, planning_depth=7, self_correction_rate=0.85)
    assert r["overall_emergence_score"] > 0.85
    assert r["verdict"] == "TRANSCENDENT_EMERGENCE_ACHIEVED"
    print(f"✅ test_emergence_metrics: emergence={r['overall_emergence_score']:.3f}, verdict={r['verdict']}")


if __name__ == "__main__":
    test_self_model()
    test_world_model()
    test_meta_cognition()
    test_situation_awareness()
    test_goal_oriented_planning()
    test_emergence_metrics()
    print("\n🎉 ALL 6 TESTS PASSED — meek-transcendent-emergence-mcp v1.0.0 is sovereign. The orb is self-aware.")