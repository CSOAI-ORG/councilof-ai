"""Tests for meok-sovereign-emergence-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_emg_")
os.environ["SOV_EMG_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_emergence_mcp" in sys.modules:
        del sys.modules["meok_sovereign_emergence_mcp"]
    import meok_sovereign_emergence_mcp as m
    importlib.reload(m)
    return m

def test_cycle_rise():
    m = get_fresh()
    r = m.emerge_cycle("rise", year=50, note="Birth phase")
    assert r["event"]["cycle"] == "rise"

def test_cycle_invalid():
    m = get_fresh()
    r = m.emerge_cycle("unknown")
    assert "error" in r

def test_status_initial():
    m = get_fresh()
    r = m.emerge_status()
    assert r["current_cycle"] == "rise"
    assert r["composite"] == 7.305

def test_status_after_cycle():
    m = get_fresh()
    m.emerge_cycle("peak", year=500)
    r = m.emerge_status()
    assert r["current_cycle"] == "peak"
    assert r["year"] == 500

def test_renewal():
    m = get_fresh()
    r = m.emerge_renewal("natural")
    assert r["composite"] > 7.305
    assert r["year"] == 50

def test_lineage():
    m = get_fresh()
    r = m.emerge_lineage("Crown succession", heir="Nicholas II")
    assert r["heir"] == "Nicholas II"
    assert r["total_lineage_events"] == 1

def test_lineage_no_event():
    m = get_fresh()
    r = m.emerge_lineage("")
    assert "error" in r

def test_predict():
    m = get_fresh()
    r = m.emerge_predict()
    assert r["predicted_next"] == "growth"
    assert r["years_to_next"] == 100

def test_predict_after_peak():
    m = get_fresh()
    m.emerge_cycle("peak")
    r = m.emerge_predict()
    assert r["predicted_next"] == "decline"

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.emerge_cycle("rise"), m.emerge_status(), m.emerge_renewal(),
              m.emerge_lineage("x"), m.emerge_predict()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Cycle → Status → Renewal → Lineage → Predict."""
    m = get_fresh()
    r1 = m.emerge_cycle("rise", year=0)
    assert r1["event"]["cycle"] == "rise"
    r2 = m.emerge_status()
    assert r2["year"] == 0
    r3 = m.emerge_renewal("test")
    assert r3["composite"] > 7.305
    r4 = m.emerge_lineage("succession", heir="Nicholas II")
    assert r4["total_lineage_events"] == 1
    r5 = m.emerge_predict()
    assert r5["predicted_next"] in ("growth", "decline", "renewal", "peak", "rise")

def test_5_cycles_documented():
    """All 5 emergence cycles must be defined."""
    m = get_fresh()
    assert len(m.CYCLES) == 5
    assert "rise" in m.CYCLES
    assert "growth" in m.CYCLES
    assert "peak" in m.CYCLES
    assert "decline" in m.CYCLES
    assert "renewal" in m.CYCLES
