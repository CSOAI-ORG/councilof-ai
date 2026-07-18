"""
Tests for MEOK Sovereign Radar MCP
Covers: connect, targets, presence, zones, stream, care floor, SIGIL, simulation
"""
import os
import sys
import json

# Set sovereign key for testing
os.environ["SOV_RADAR_KEY"] = "test-radar-sovereign-key"

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from meok_radar_mcp import (
    radar_connect, radar_get_targets, radar_get_presence,
    radar_set_zone, radar_get_zone_status,
    radar_start_stream, radar_stop_stream, radar_care_floor,
    RadarTarget, _state, _sigil_sign, _simulate_targets, _care_floor_check
)


def test_connect():
    """Test radar connection."""
    _state.connected = False
    r = radar_connect("HLK-LD2450", "uart", "/dev/ttyUSB0", 256000)
    assert r["status"] == "connected"
    assert r["sensor"] == "HLK-LD2450"
    assert r["range_m"] == 6.0
    assert r["fov_deg"] == 120
    assert r["max_targets"] == 3
    assert r["cost_gbp"] == 8
    assert "care_floor" in r
    assert "sigil" in r
    assert "timestamp" in r
    print("✅ test_connect")


def test_connect_unknown_sensor():
    """Test connecting with unknown sensor type."""
    r = radar_connect("FakeSensor123")
    assert "error" in r
    assert "supported" in r
    print("✅ test_connect_unknown_sensor")


def test_get_targets_not_connected():
    """Test get_targets when not connected."""
    _state.connected = False
    r = radar_get_targets()
    assert "error" in r
    print("✅ test_get_targets_not_connected")


def test_get_targets_with_simulation():
    """Test get_targets with simulated data."""
    radar_connect("HLK-LD2450")
    _simulate_targets()
    r = radar_get_targets()
    assert r["sensor"] == "HLK-LD2450"
    assert r["target_count"] >= 0
    assert "targets" in r
    assert "care_floor" in r
    assert "sigil" in r
    # Verify targets are anonymous
    for t in r["targets"]:
        assert t["target_id"].startswith("Target-")
        assert "note" in t
    print("✅ test_get_targets_with_simulation")


def test_presence_clear():
    """Test presence detection when clear."""
    radar_connect("HLK-LD2450")
    _state.targets = []
    r = radar_get_presence()
    assert r["presence"] == "CLEAR"
    assert r["target_count"] == 0
    print("✅ test_presence_clear")


def test_presence_occupied():
    """Test presence detection when occupied."""
    radar_connect("HLK-LD2450")
    _state.targets = [RadarTarget(1, 1000, 2000, 1.5, 25)]
    r = radar_get_presence()
    assert r["presence"] == "OCCUPIED"
    assert r["target_count"] == 1
    print("✅ test_presence_occupied")


def test_set_zone():
    """Test zone definition."""
    radar_connect("HLK-LD2450")
    r = radar_set_zone("zone_a", -3000, 3000, 0, 6000, "Perimeter North")
    assert r["status"] == "zone_set"
    assert r["zone_id"] == "zone_a"
    assert r["total_zones"] == 1
    print("✅ test_set_zone")


def test_zone_status():
    """Test zone occupancy status."""
    radar_connect("HLK-LD2450")
    radar_set_zone("zone_a", -3000, 3000, 0, 6000, "Zone A")
    _state.targets = [
        RadarTarget(1, 500, 1000, 1.0, 25),
        RadarTarget(2, -1000, 3000, 0.5, 25),
    ]
    r = radar_get_zone_status()
    assert "zones" in r
    assert "zone_a" in r["zones"]
    assert r["zones"]["zone_a"]["count"] == 2
    assert r["zones"]["zone_a"]["status"] == "OCCUPIED"
    print("✅ test_zone_status")


def test_zone_status_empty():
    """Test zone status when no targets."""
    radar_connect("HLK-LD2450")
    radar_set_zone("zone_b", -3000, 3000, 0, 6000, "Zone B")
    _state.targets = []
    r = radar_get_zone_status()
    assert r["zones"]["zone_b"]["count"] == 0
    assert r["zones"]["zone_b"]["status"] == "CLEAR"
    print("✅ test_zone_status_empty")


def test_start_stream():
    """Test starting telemetry stream."""
    radar_connect("HLK-LD2450")
    r = radar_start_stream("mqtt.local", 1883, "meok/radar/test")
    assert r["status"] == "streaming"
    assert r["mqtt_broker"] == "mqtt.local"
    assert r["topic"] == "meok/radar/test"
    assert r["rate_hz"] == 10
    print("✅ test_start_stream")


def test_stop_stream():
    """Test stopping telemetry stream."""
    radar_connect("HLK-LD2450")
    radar_start_stream()
    r = radar_stop_stream()
    assert r["status"] == "stopped"
    assert "total_detections" in r
    print("✅ test_stop_stream")


def test_care_floor():
    """Test care floor constraints."""
    r = radar_care_floor()
    assert r["care_floor_active"] is True
    assert len(r["rules"]) == 5
    assert len(r["red_lines"]) == 5
    assert len(r["allowed"]) == 5
    assert "sigil" in r
    # Check red lines
    for rl in r["red_lines"]:
        assert "❌" in rl
    # Check allowed
    for a in r["allowed"]:
        assert "✅" in a
    print("✅ test_care_floor")


def test_care_floor_blocks_identification():
    """Test that care floor blocks individual identification."""
    _state.care_floor_active = True
    cf = _care_floor_check("identify person in zone")
    assert cf["allowed"] is False
    assert cf["blocked_by"] == "CARE_FLOOR"
    print("✅ test_care_floor_blocks_identification")


def test_care_floor_blocks_biometric():
    """Test that care floor blocks biometric data."""
    _state.care_floor_active = True
    cf = _care_floor_check("get heart_rate from target")
    assert cf["allowed"] is False
    assert "heart_rate" in cf["reason"]
    print("✅ test_care_floor_blocks_biometric")


def test_care_floor_allows_counting():
    """Test that care floor allows counting."""
    _state.care_floor_active = True
    cf = _care_floor_check("get target count")
    assert cf["allowed"] is True
    print("✅ test_care_floor_allows_counting")


def test_sigil_signing():
    """Test SIGIL signature generation."""
    sig1 = _sigil_sign({"action": "test", "ts": "2026-07-07T00:00:00Z"})
    sig2 = _sigil_sign({"action": "test", "ts": "2026-07-07T00:00:00Z"})
    sig3 = _sigil_sign({"action": "different", "ts": "2026-07-07T00:00:00Z"})
    # Same input → same sigil
    assert sig1 == sig2
    # Different input → different sigil
    assert sig1 != sig3
    # Sigil is 16 chars
    assert len(sig1) == 16
    print("✅ test_sigil_signing")


def test_all_sensor_types():
    """Test all supported sensor types."""
    sensors = ["HLK-LD2450", "HLK-LD1115H", "Seeed_MR24HPB", "Infineon_BGT60TR13C"]
    for s in sensors:
        _state.connected = False
        r = radar_connect(s)
        assert r["status"] == "connected"
        assert r["sensor"] == s
    print("✅ test_all_sensor_types")


def test_target_anonymity():
    """Test that targets are always anonymous."""
    radar_connect("HLK-LD2450")
    _state.targets = [RadarTarget(1, 1000, 2000, 1.5, 25)]
    r = radar_get_targets()
    for t in r["targets"]:
        # Target ID must be "Target-N" not a person name
        assert t["target_id"] == "Target-1"
        assert "Anonymous" in t["note"]
    print("✅ test_target_anonymity")


def test_full_cycle():
    """Test full radar cycle: connect → zone → detect → stream → stop."""
    # Connect
    r = radar_connect("HLK-LD2450")
    assert r["status"] == "connected"

    # Set zone
    r = radar_set_zone("perimeter", -3000, 3000, 0, 6000, "Full Perimeter")
    assert r["status"] == "zone_set"

    # Simulate targets
    _simulate_targets()
    _state.total_detections += len(_state.targets)

    # Get targets
    r = radar_get_targets()
    assert r["target_count"] >= 0

    # Get presence
    r = radar_get_presence()
    assert r["presence"] in ("OCCUPIED", "CLEAR")

    # Zone status
    r = radar_get_zone_status()
    assert "zones" in r

    # Stream
    r = radar_start_stream()
    assert r["status"] == "streaming"

    # Stop
    r = radar_stop_stream()
    assert r["status"] == "stopped"

    print("✅ test_full_cycle")


if __name__ == "__main__":
    test_connect()
    test_connect_unknown_sensor()
    test_get_targets_not_connected()
    test_get_targets_with_simulation()
    test_presence_clear()
    test_presence_occupied()
    test_set_zone()
    test_zone_status()
    test_zone_status_empty()
    test_start_stream()
    test_stop_stream()
    test_care_floor()
    test_care_floor_blocks_identification()
    test_care_floor_blocks_biometric()
    test_care_floor_allows_counting()
    test_sigil_signing()
    test_all_sensor_types()
    test_target_anonymity()
    test_full_cycle()
    print(f"\n{'='*50}")
    print(f"📡 MEOK SOVEREIGN RADAR MCP — ALL 19 TESTS PASS")
    print(f"{'='*50}")
