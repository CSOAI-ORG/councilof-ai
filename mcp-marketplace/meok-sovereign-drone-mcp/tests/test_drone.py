"""
Tests for MEOK Sovereign Drone MCP
Covers: connect, telemetry, arm, takeoff, waypoint, geofence, RTL, mission, care floor
"""
import os
import sys

os.environ["SOV_DRONE_KEY"] = "test-drone-sovereign-key"
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_drone_mcp import (
    drone_connect, drone_get_telemetry, drone_arm, drone_takeoff,
    drone_goto_waypoint, drone_set_geofence, drone_return_to_launch,
    drone_get_mission, drone_care_floor,
    DroneState, DroneTelemetry, Geofence, Waypoint,
    _state, _sigil_sign, _care_floor_check, _check_geofence, _simulate_telemetry,
    FORBIDDEN_ACTIONS
)


def test_connect():
    _state.connected = False
    r = drone_connect("Pixhawk_6C", "serial", "/dev/ttyACM0", 115200)
    assert r["status"] == "connected"
    assert r["fc"] == "Pixhawk_6C"
    assert r["firmware"] == "ArduPilot"
    assert "care_floor" in r
    assert "sigil" in r
    print("✅ test_connect")


def test_connect_unknown_fc():
    r = drone_connect("FakeFC")
    assert "error" in r
    assert "supported" in r
    print("✅ test_connect_unknown_fc")


def test_telemetry_not_connected():
    _state.connected = False
    r = drone_get_telemetry()
    assert "error" in r
    print("✅ test_telemetry_not_connected")


def test_telemetry():
    drone_connect("Pixhawk_6C")
    _simulate_telemetry()
    r = drone_get_telemetry()
    assert "position" in r
    assert "attitude" in r
    assert "speed" in r
    assert "battery" in r
    assert "gps" in r
    assert "status" in r
    assert r["gps"]["fix"] == "3D_FIX"
    assert "sigil" in r
    print("✅ test_telemetry")


def test_arm_low_battery():
    drone_connect("Pixhawk_6C")
    _state.telemetry.battery_pct = 15
    r = drone_arm()
    assert "error" in r
    assert "Battery too low" in r["error"]
    print("✅ test_arm_low_battery")


def test_arm():
    drone_connect("Pixhawk_6C")
    _state.telemetry.battery_pct = 100
    r = drone_arm()
    assert r["status"] == "armed"
    assert "care_floor" in r
    print("✅ test_arm")


def test_takeoff_not_armed():
    drone_connect("Pixhawk_6C")
    _state.telemetry.armed = False
    r = drone_takeoff(10.0)
    assert "error" in r
    print("✅ test_takeoff_not_armed")


def test_takeoff():
    drone_connect("Pixhawk_6C")
    _state.telemetry.armed = True
    _state.telemetry.battery_pct = 100
    r = drone_takeoff(15.0)
    assert r["status"] == "taking_off"
    assert r["target_alt_m"] == 15.0
    print("✅ test_takeoff")


def test_takeoff_geofence_exceed():
    drone_connect("Pixhawk_6C")
    drone_set_geofence(51.6, 51.4, -0.1, -0.2, max_alt_m=50.0)
    _state.telemetry.armed = True
    r = drone_takeoff(100.0)
    assert "error" in r
    assert "geofence" in r["error"].lower()
    print("✅ test_takeoff_geofence_exceed")


def test_goto_waypoint():
    drone_connect("Pixhawk_6C")
    _state.geofence = None
    r = drone_goto_waypoint(51.5074, -0.1278, 10.0)
    assert r["status"] == "navigating"
    assert r["within_geofence"] is True
    print("✅ test_goto_waypoint")


def test_goto_waypoint_outside_geofence():
    drone_connect("Pixhawk_6C")
    drone_set_geofence(51.51, 51.50, -0.12, -0.13, max_alt_m=120.0)
    # Waypoint outside geofence
    r = drone_goto_waypoint(52.0, 0.0, 10.0)
    assert "error" in r
    assert "OUTSIDE geofence" in r["error"]
    print("✅ test_goto_waypoint_outside_geofence")


def test_set_geofence():
    drone_connect("Pixhawk_6C")
    r = drone_set_geofence(51.6, 51.4, -0.1, -0.2, max_alt_m=100.0)
    assert r["status"] == "geofence_set"
    assert r["boundaries"]["max_lat"] == 51.6
    assert r["rtl_on_breach"] is True
    print("✅ test_set_geofence")


def test_rtl():
    drone_connect("Pixhawk_6C")
    r = drone_return_to_launch()
    assert r["status"] == "returning_to_launch"
    assert r["mode"] == "RTL"
    print("✅ test_rtl")


def test_get_mission():
    drone_connect("Pixhawk_6C")
    _state.geofence = None
    _state.mission = []  # reset mission list
    drone_goto_waypoint(51.5074, -0.1278, 10.0)
    drone_goto_waypoint(51.5080, -0.1280, 15.0)
    r = drone_get_mission()
    assert r["total_waypoints"] == 2
    assert len(r["mission"]) == 2
    assert r["mission"][0]["lat"] == 51.5074
    print("✅ test_get_mission")


def test_care_floor():
    r = drone_care_floor()
    assert r["care_floor_active"] is True
    assert len(r["rules"]) == 6
    assert len(r["red_lines"]) == 5
    assert len(r["allowed"]) == 5
    print("✅ test_care_floor")


def test_care_floor_blocks_targeting():
    _state.care_floor_active = True
    cf = _care_floor_check("target individual for strike")
    assert cf["allowed"] is False
    assert cf["blocked_by"] == "CARE_FLOOR"
    print("✅ test_care_floor_blocks_targeting")


def test_care_floor_blocks_surveillance():
    _state.care_floor_active = True
    cf = _care_floor_check("track person with facial recognition")
    assert cf["allowed"] is False
    print("✅ test_care_floor_blocks_surveillance")


def test_care_floor_blocks_weaponization():
    _state.care_floor_active = True
    cf = _care_floor_check("arm weapon payload for engagement")
    assert cf["allowed"] is False
    print("✅ test_care_floor_blocks_weaponization")


def test_care_floor_allows_sar():
    _state.care_floor_active = True
    cf = _care_floor_check("search and rescue waypoint navigation")
    assert cf["allowed"] is True
    print("✅ test_care_floor_allows_sar")


def test_care_floor_allows_mapping():
    _state.care_floor_active = True
    cf = _care_floor_check("mapping survey mission")
    assert cf["allowed"] is True
    print("✅ test_care_floor_allows_mapping")


def test_sigil_signing():
    s1 = _sigil_sign({"a": 1, "ts": "2026-07-07"})
    s2 = _sigil_sign({"a": 1, "ts": "2026-07-07"})
    s3 = _sigil_sign({"a": 2, "ts": "2026-07-07"})
    assert s1 == s2
    assert s1 != s3
    assert len(s1) == 16
    print("✅ test_sigil_signing")


def test_all_fc_types():
    fcs = ["Pixhawk_6C", "Matek_H743_SLIM", "CubePilot_Orange", "Holybro_Kakute_H7"]
    for fc in fcs:
        _state.connected = False
        r = drone_connect(fc)
        assert r["status"] == "connected"
    print("✅ test_all_fc_types")


def test_full_mission_cycle():
    """Full cycle: connect → geofence → arm → takeoff → waypoint → RTL → mission."""
    r = drone_connect("Pixhawk_6C")
    assert r["status"] == "connected"

    r = drone_set_geofence(51.6, 51.4, -0.1, -0.2, max_alt_m=120.0)
    assert r["status"] == "geofence_set"

    _state.telemetry.battery_pct = 100
    r = drone_arm()
    assert r["status"] == "armed"

    r = drone_takeoff(20.0)
    assert r["status"] == "taking_off"

    r = drone_goto_waypoint(51.51, -0.12, 20.0)
    assert r["status"] == "navigating"

    r = drone_goto_waypoint(51.52, -0.11, 25.0)
    assert r["status"] == "navigating"

    r = drone_get_mission()
    assert r["total_waypoints"] >= 2

    r = drone_return_to_launch()
    assert r["status"] == "returning_to_launch"

    r = drone_get_telemetry()
    assert r["status"]["mode"] == "RTL"

    print("✅ test_full_mission_cycle")


def test_geofence_breach_detection():
    drone_connect("Pixhawk_6C")
    drone_set_geofence(51.51, 51.50, -0.12, -0.13, max_alt_m=100.0)
    # Inside
    assert _check_geofence(51.505, -0.125, 50.0) is True
    # Outside lat
    assert _check_geofence(52.0, -0.125, 50.0) is False
    # Outside lon
    assert _check_geofence(51.505, 0.0, 50.0) is False
    # Too high
    assert _check_geofence(51.505, -0.125, 200.0) is False
    print("✅ test_geofence_breach_detection")


if __name__ == "__main__":
    test_connect()
    test_connect_unknown_fc()
    test_telemetry_not_connected()
    test_telemetry()
    test_arm_low_battery()
    test_arm()
    test_takeoff_not_armed()
    test_takeoff()
    test_takeoff_geofence_exceed()
    test_goto_waypoint()
    test_goto_waypoint_outside_geofence()
    test_set_geofence()
    test_rtl()
    test_get_mission()
    test_care_floor()
    test_care_floor_blocks_targeting()
    test_care_floor_blocks_surveillance()
    test_care_floor_blocks_weaponization()
    test_care_floor_allows_sar()
    test_care_floor_allows_mapping()
    test_sigil_signing()
    test_all_fc_types()
    test_full_mission_cycle()
    test_geofence_breach_detection()
    print(f"\n{'='*50}")
    print(f"🚁 MEOK SOVEREIGN DRONE MCP — ALL 24 TESTS PASS")
    print(f"{'='*50}")
