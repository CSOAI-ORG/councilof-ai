#!/usr/bin/env python3
"""Tests for meek-wifi-csi-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from meek_wifi_csi_mcp.server import wifi_csi_through_wall_detection, drone_motor_signature, human_presence_detection


def test_wifi_csi_through_wall_detection():
    r = wifi_csi_through_wall_detection(num_esp32_nodes=4, wall_material="drywall", wall_thickness_cm=15.0)
    assert r["classification_accuracy"] > 0.8
    assert r["detection_range_m"] > 0
    print(f"✅ test_wifi_csi: accuracy={r['classification_accuracy']:.3f}, range={r['detection_range_m']:.1f}m")


def test_drone_motor_signature():
    r = drone_motor_signature(motor_rpm=8000, prop_blades=2, detection_range_m=10.0)
    assert r["blade_pass_hz"] > 0
    assert r["detection_confidence"] > 0.5
    print(f"✅ test_drone_motor_signature: blade_pass={r['blade_pass_hz']:.0f} Hz, confidence={r['detection_confidence']:.3f}")


def test_human_presence_detection():
    r = human_presence_detection(room_area_m2=25.0, num_people=1)
    assert r["detectable"] is True
    print(f"✅ test_human_presence_detection: detectable={r['detectable']}, time={r['detection_time_s']:.1f}s")


if __name__ == "__main__":
    test_wifi_csi_through_wall_detection()
    test_drone_motor_signature()
    test_human_presence_detection()
    print("\n🎉 ALL 3 TESTS PASSED — meek-wifi-csi-mcp v1.0.0 is sovereign.")