"""Tests for meok-sovereign-satellite-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_sat_")
os.environ["SOV_SAT_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_satellite_mcp" in sys.modules:
        del sys.modules["meok_sovereign_satellite_mcp"]
    import meok_sovereign_satellite_mcp as m
    importlib.reload(m)
    return m

def test_list():
    m = get_fresh()
    r = m.satellite_list()
    assert r["total"] > 15

def test_list_agency():
    m = get_fresh()
    r = m.satellite_list(agency="ESA")
    assert r["total"] > 0
    assert all(s["agency"] == "ESA" for s in r["satellites"])

def test_list_sovereign():
    m = get_fresh()
    r = m.satellite_list(sovereign_only=True)
    assert r["total"] == 6  # 6 sovereign sats
    assert all(s.get("sovereign") for s in r["satellites"])

def test_track():
    m = get_fresh()
    r = m.satellite_track("sat-sentinel-2a")
    assert r["satellite"]["name"] == "Sentinel-2A"

def test_track_unknown():
    m = get_fresh()
    r = m.satellite_track("nope")
    assert "error" in r

def test_pass():
    m = get_fresh()
    r = m.satellite_pass("sat-sentinel-2a", "gs-london")
    assert r["satellite"] == "Sentinel-2A"
    assert r["ground_station"] == "London Ground Station"

def test_pass_unknown_sat():
    m = get_fresh()
    r = m.satellite_pass("nope", "gs-london")
    assert "error" in r

def test_pass_unknown_gs():
    m = get_fresh()
    r = m.satellite_pass("sat-sentinel-2a", "nope")
    assert "error" in r

def test_ground():
    m = get_fresh()
    r = m.satellite_ground()
    assert r["total"] == 33

def test_status():
    m = get_fresh()
    r = m.satellite_status()
    assert r["total_satellites"] > 15
    assert r["total_ground_stations"] == 33
    assert r["sovereign_satellites"] == 6

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.satellite_list(), m.satellite_track("sat-sentinel-2a"),
              m.satellite_pass("sat-sentinel-2a", "gs-london"),
              m.satellite_ground(), m.satellite_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """List → Track → Pass → Ground → Status."""
    m = get_fresh()
    r1 = m.satellite_list()
    assert r1["total"] > 15
    r2 = m.satellite_track("sat-sentinel-2a")
    assert r2["satellite"]["name"] == "Sentinel-2A"
    r3 = m.satellite_pass("sat-sentinel-2a", "gs-london")
    assert r3["next_pass_minutes"] > 0
    r4 = m.satellite_ground()
    assert r4["total"] == 33
    s = m.satellite_status()
    assert s["sovereign_satellites"] == 6

def test_33_ground_stations():
    m = get_fresh()
    assert len(m.GROUND_STATIONS) == 33

def test_6_sovereign_sats():
    m = get_fresh()
    sovereign = [s for s in m.SATELLITES if s.get("sovereign", False)]
    assert len(sovereign) == 6
