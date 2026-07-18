import sys
import os
import importlib
import importlib.util
sys.path.insert(0, os.path.expanduser("~/clawd/mcp-marketplace/meok-sovereign-shared-core"))
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))) + "/../meok-sovereign-shared-core")
"""Tests for meok-sovereign-ground-station-mcp."""
import os

MODULE_PATH = os.path.join(os.path.dirname(__file__), "..", "sovereign_gs.py")
spec = importlib.util.spec_from_file_location("sovereign_gs", MODULE_PATH)
mod = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mod)

gs_list_satellites = mod.gs_list_satellites
gs_list_hardware = mod.gs_list_hardware
gs_schedule_pass = mod.gs_schedule_pass
gs_decode_telemetry = mod.gs_decode_telemetry
gs_care_floor = mod.gs_care_floor
gs_status = mod.gs_status
gs_emit_sigil = mod.gs_emit_sigil
VERSION = mod.VERSION
TOOLS = mod.TOOLS


def test_version():
    assert VERSION == "1.0.0"


def test_tools_count():
    assert len(TOOLS) == 7


def test_list_sats():
    r = gs_list_satellites()
    assert r["count"] >= 7
    assert "NOAA-15" in r["satellites"]


def test_list_hardware():
    r = gs_list_hardware()
    assert "pi5-rtlsdr" in r["hardware"]


def test_schedule_pass():
    r = gs_schedule_pass("NOAA-15")
    assert r["mode"] == "RECEIVE-ONLY"
    assert r["tx_blocked"] is True
    assert r["freq_mhz"] == 137.620


def test_schedule_invalid():
    r = gs_schedule_pass("STARLINK-1234")
    assert "error" in r


def test_decode():
    r = gs_decode_telemetry("obs-1", 500)
    assert r["decoded"] is True
    assert "weather image" in r["products"]


def test_care_floor_rx():
    r = gs_care_floor("receive-only")
    assert r["approved"] is True


def test_care_floor_tx_blocked():
    r = gs_care_floor("transmit uplink")
    assert r["approved"] is False


def test_status():
    r = gs_status()
    assert r["rx_only"] is True
    assert r["tx_blocked"] is True


def test_emit_sigil():
    r = gs_emit_sigil("obs-1")
    assert len(r["digest"]) == 16



if __name__ == "__main__":
    test_version()
    print("PASS: test_version")
    test_tools_count()
    print("PASS: test_tools_count")
    test_list_sats()
    print("PASS: test_list_sats")
    test_list_hardware()
    print("PASS: test_list_hardware")
    test_schedule_pass()
    print("PASS: test_schedule_pass")
    test_schedule_invalid()
    print("PASS: test_schedule_invalid")
    test_decode()
    print("PASS: test_decode")
    test_care_floor_rx()
    print("PASS: test_care_floor_rx")
    test_care_floor_tx_blocked()
    print("PASS: test_care_floor_tx_blocked")
    test_status()
    print("PASS: test_status")
    test_emit_sigil()
    print("PASS: test_emit_sigil")
    print("\n" + str(11) + " tests complete")


