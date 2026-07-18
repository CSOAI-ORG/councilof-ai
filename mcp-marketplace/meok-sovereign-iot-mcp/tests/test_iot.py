"""Tests for meok-sovereign-iot-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_iot_test_")
os.environ["SOV_IOT_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_iot_mcp import (
    sov_iot_register, sov_iot_telemetry, sov_iot_actuate,
    sov_iot_emergency_stop, sov_iot_status, IOK_FARM_DEVICES, VERSION, PROTOCOL,
)


def test_register_basic():
    r = sov_iot_register("test-device-1", "esp32", name="Test", location="Lab", sensors=["temp"], hive_id="test")
    assert r["device"]["device_id"] == "test-device-1"
    assert "kid" in r


def test_register_duplicate():
    sov_iot_register("dup", "esp32", name="d", location="l", sensors=["x"], hive_id="d")
    r = sov_iot_register("dup", "esp32", name="d", location="l", sensors=["x"], hive_id="d")
    assert "error" in r


def test_telemetry_valid():
    sov_iot_register("pond-1", "esp32", name="p", location="iOK", sensors=["pH", "DO (mg/L)"], actuators=["pump"], hive_id="iok")
    r = sov_iot_telemetry("pond-1", {"pH": 7.2, "DO (mg/L)": 8.0})
    assert r["readings_count"] == 2
    assert r["alerts"] == []


def test_telemetry_ph_alert():
    sov_iot_register("pond-2", "esp32", name="p", location="iOK", sensors=["pH"], hive_id="iok")
    r = sov_iot_telemetry("pond-2", {"pH": 5.5})  # too acidic
    assert len(r["alerts"]) == 1
    assert r["alerts"][0]["type"] == "ph_alert"


def test_telemetry_do_alert():
    sov_iot_register("pond-3", "esp32", name="p", location="iOK", sensors=["DO (mg/L)"], hive_id="iok")
    r = sov_iot_telemetry("pond-3", {"DO (mg/L)": 3.0})  # too low
    assert len(r["alerts"]) == 1
    assert r["alerts"][0]["type"] == "do_alert"


def test_telemetry_unknown_sensor():
    sov_iot_register("pond-4", "esp32", name="p", location="iOK", sensors=["pH"], hive_id="iok")
    r = sov_iot_telemetry("pond-4", {"unknown": 99})
    assert "error" in r


def test_actuate_pending_council():
    sov_iot_register("pond-5", "esp32", name="p", location="iOK", sensors=["pH"], actuators=["pump"], hive_id="iok")
    r = sov_iot_actuate("pond-5", "pump", "ON", requires_council=True)
    assert r["approval"] == "pending_council_vote"


def test_actuate_auto_approved():
    sov_iot_register("pond-6", "esp32", name="p", location="iOK", sensors=["pH"], actuators=["pump"], hive_id="iok")
    r = sov_iot_actuate("pond-6", "pump", "ON", requires_council=False)
    assert r["approval"] == "auto_approved"


def test_actuate_estop_blocks():
    sov_iot_register("pond-7", "esp32", name="p", location="iOK", sensors=["pH"], actuators=["pump"], hive_id="iok")
    sov_iot_emergency_stop("test estop", actor="test")
    r = sov_iot_actuate("pond-7", "pump", "ON", requires_council=False)
    assert "error" in r and "EMERGENCY STOP" in r["error"]


def test_estop_is_free():
    r = sov_iot_emergency_stop("critical pH drop", actor="pond-mother")
    assert r["actor"] == "pond-mother"
    assert r["all_actuators_halted"] is True
    assert "kid" in r  # still signed


def test_status_iok_farm():
    r = sov_iot_status()
    assert "iok-pond-001" in r["iok_farm_devices"]


def test_all_signed():
    r = sov_iot_register("s", "esp32", name="s", location="l", sensors=["x"], hive_id="s")
    assert "kid" in r and "sig" in r
