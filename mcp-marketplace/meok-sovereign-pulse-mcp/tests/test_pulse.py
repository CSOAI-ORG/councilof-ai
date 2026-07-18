"""Tests for meok-sovereign-pulse-mcp."""
import os, sys, tempfile, importlib, time
_TEST = tempfile.mkdtemp(prefix="sov_pls_")
os.environ["SOV_PLS_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_pulse_mcp" in sys.modules:
        del sys.modules["meok_sovereign_pulse_mcp"]
    import meok_sovereign_pulse_mcp as m
    importlib.reload(m)
    return m

def test_record_basic():
    m = get_fresh()
    r = m.pulse_record(0.95, "test_action")
    assert r["pulse"]["care_floor"] == 0.95
    assert r["pulse"]["compliant"] is True

def test_record_violation():
    m = get_fresh()
    r = m.pulse_record(0.50, "low_action")
    assert r["pulse"]["compliant"] is False

def test_record_default_care_floor():
    m = get_fresh()
    r = m.pulse_record()
    assert r["pulse"]["care_floor"] == 0.95

def test_bpm_empty():
    m = get_fresh()
    r = m.pulse_bpm()
    assert r["bpm"] == 0

def test_bpm_with_pulses():
    m = get_fresh()
    for _ in range(10):
        m.pulse_record()
        time.sleep(0.001)
    r = m.pulse_bpm(window_seconds=10)
    assert r["bpm"] > 0
    assert r["pulses_in_window"] == 10

def test_rhythm_empty():
    m = get_fresh()
    r = m.pulse_rhythm()
    assert "error" in r

def test_rhythm_perfect():
    m = get_fresh()
    for _ in range(10):
        m.pulse_record(0.99)
    r = m.pulse_rhythm()
    assert r["rhythm_quality"] == "PERFECT"
    assert r["compliance_rate"] == 1.0

def test_rhythm_strong():
    m = get_fresh()
    for _ in range(9):
        m.pulse_record(0.96)
    m.pulse_record(0.85)  # one violation
    r = m.pulse_rhythm()
    assert r["rhythm_quality"] in ["STRONG", "STEADY"]
    assert r["compliance_rate"] == 0.9

def test_rhythm_weak():
    m = get_fresh()
    for _ in range(5):
        m.pulse_record(0.99)
    for _ in range(5):
        m.pulse_record(0.50)
    r = m.pulse_rhythm()
    assert r["rhythm_quality"] == "WEAK"

def test_history():
    m = get_fresh()
    for i in range(15):
        m.pulse_record(0.95, f"action_{i}")
    r = m.pulse_history(limit=10)
    assert r["total_pulses"] == 15
    assert len(r["pulses"]) == 10

def test_status():
    m = get_fresh()
    m.pulse_record()
    r = m.pulse_status()
    assert r["total_pulses"] == 1
    assert r["uptime_seconds"] >= 0

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.pulse_record(), m.pulse_bpm(), m.pulse_rhythm(), m.pulse_history(), m.pulse_status()]:
        if "error" not in r:
            assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Record 50 → BPM → Rhythm → History → Status."""
    m = get_fresh()
    for i in range(50):
        m.pulse_record(0.95 if i % 5 != 0 else 0.85, f"action_{i}")
    b = m.pulse_bpm()
    assert b["pulses_in_window"] == 50
    r = m.pulse_rhythm()
    assert r["total_pulses"] == 50
    h = m.pulse_history(limit=10)
    assert len(h["pulses"]) == 10
    s = m.pulse_status()
    assert s["total_pulses"] == 50
