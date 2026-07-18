"""Tests for meok-sovereign-pond-mcp."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_pond_test_")
os.environ["SOV_POND_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_pond_mcp import (
    sov_pond_status, sov_pond_log, sov_pond_care_action,
    sov_pond_history, sov_pond_emergency, _POND_STATE, KOI_CARE_FLOOR, VERSION, PROTOCOL,
)


def test_pond_status_basic():
    r = sov_pond_status()
    assert r["pond"]["name"] == "iOK Farm main pond (13m × 12m)"
    assert r["pond"]["koi_count"] >= 1
    assert "Misty" in r["pond"]["malamutes_guarding"]


def test_pond_status_signed():
    r = sov_pond_status()
    assert "kid" in r and "sig" in r


def test_pond_log_healthy():
    r = sov_pond_log(ph=7.4, do_mgL=8.2, temp_C=22.1, humidity=65.0, source="test")
    assert r["healthy"] is True
    assert len(r["violations"]) == 0


def test_pond_log_ph_too_low():
    r = sov_pond_log(ph=4.0, do_mgL=8.0, temp_C=22.0)
    assert r["healthy"] is False
    assert any(v["parameter"] == "pH" for v in r["violations"])


def test_pond_log_do_too_low():
    r = sov_pond_log(ph=7.0, do_mgL=2.0, temp_C=22.0)
    assert any(v["parameter"] == "DO_mgL" for v in r["violations"])


def test_pond_log_ammonia_too_high():
    r = sov_pond_log(ph=7.0, do_mgL=8.0, temp_C=22.0, ammonia_mgL=0.5)
    assert any(v["parameter"] == "ammonia_mgL" for v in r["violations"])


def test_pond_care_action_water_change():
    r = sov_pond_care_action("water_change", reason="weekly", requires_council=True)
    assert r["action"] == "water_change"
    assert r["approval"] == "pending_council_vote"
    assert _POND_STATE["last_water_change"] is not None


def test_pond_care_action_invalid():
    r = sov_pond_care_action("bad_action")
    assert "error" in r


def test_pond_history():
    import meok_sovereign_pond_mcp as m
    m._READINGS.clear()
    m.sov_pond_log(7.0, 8.0, 22.0)
    m.sov_pond_log(7.2, 8.5, 22.5)
    r = m.sov_pond_history()
    assert r["reading_count"] == 2


def test_pond_emergency_ph_crash():
    r = sov_pond_emergency("ph_crash", severity="critical", actor="pond-mother")
    assert r["type"] == "ph_crash"
    assert r["auto_action"] == "water_change_solenoid_open"
    assert "kid" in r


def test_pond_emergency_invalid():
    r = sov_pond_emergency("nonsense")
    assert "error" in r


def test_care_floor_5_params():
    assert len(KOI_CARE_FLOOR) == 5
    assert "pH" in KOI_CARE_FLOOR


def test_all_signed():
    r = sov_pond_log(7.0, 8.0, 22.0)
    assert "kid" in r and "sig" in r
