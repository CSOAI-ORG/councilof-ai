"""Tests for meok-sovereign-digital-twin-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_twin_")
os.environ["SOV_TWIN_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_digital_twin_mcp" in sys.modules:
        del sys.modules["meok_sovereign_digital_twin_mcp"]
    import meok_sovereign_digital_twin_mcp as m
    importlib.reload(m)
    return m

def test_map_address_found():
    m = get_fresh()
    r = m.twin_map_address("Downing")
    assert r["object"]["type"] == "Government"

def test_map_address_not_found():
    m = get_fresh()
    r = m.twin_map_address("Mars Colony")
    assert "error" in r

def test_map_address_no_input():
    m = get_fresh()
    r = m.twin_map_address("")
    assert "error" in r

def test_map_company():
    m = get_fresh()
    r = m.twin_map_company("CSOAI")
    assert r["object"]["company_number"] == "16939677"

def test_map_company_not_found():
    m = get_fresh()
    r = m.twin_map_company("FakeCompany12345")
    assert "error" in r

def test_map_company_no_input():
    m = get_fresh()
    r = m.twin_map_company("")
    assert "error" in r

def test_map_sensor():
    m = get_fresh()
    r = m.twin_map_sensor("cam-001")
    assert r["object"]["type"] == "camera"

def test_map_sensor_not_found():
    m = get_fresh()
    r = m.twin_map_sensor("nonexistent")
    assert "error" in r

def test_map_sensor_no_input():
    m = get_fresh()
    r = m.twin_map_sensor("")
    assert "error" in r

def test_render():
    m = get_fresh()
    r = m.twin_render()
    assert r["total"] > 0
    assert len(r["objects"]) > 0

def test_render_limit():
    m = get_fresh()
    r = m.twin_render(limit=5)
    assert len(r["objects"]) <= 5

def test_status():
    m = get_fresh()
    r = m.twin_status()
    assert r["addresses"] >= 5
    assert r["companies"] >= 2
    assert r["sensors"] >= 4

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.twin_map_address("Downing"), m.twin_map_company("CSOAI"),
              m.twin_map_sensor("cam-001"), m.twin_render(), m.twin_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Map address → Map company → Map sensor → Render → Status."""
    m = get_fresh()
    r1 = m.twin_map_address("Tower")
    assert "Tower" in r1["object"]["address"]
    r2 = m.twin_map_company("CSOAI")
    assert r2["object"]["company_number"] == "16939677"
    r3 = m.twin_map_sensor("temp-001")
    assert r3["object"]["type"] == "thermal"
    r4 = m.twin_render(limit=50)
    assert r4["total"] > 0
    r5 = m.twin_status()
    assert r5["total_objects"] >= 11
