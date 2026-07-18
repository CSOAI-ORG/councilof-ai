"""Tests for meok-sovereign-twin-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_twn2_")
os.environ["SOV_TWN_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_twin_mcp" in sys.modules:
        del sys.modules["meok_sovereign_twin_mcp"]
    import meok_sovereign_twin_mcp as m
    importlib.reload(m)
    return m

def test_query_land():
    m = get_fresh()
    r = m.twin_query("Downing", "land")
    assert r["total_matches"] >= 1
    assert "Downing" in r["results"][0]["address"]

def test_query_company():
    m = get_fresh()
    r = m.twin_query("CSOAI", "companies")
    assert r["total_matches"] >= 1
    assert "CSOAI" in r["results"][0]["name"]

def test_query_hive():
    m = get_fresh()
    r = m.twin_query("London", "hives")
    assert r["total_matches"] >= 1
    assert any("London" in str(o) for o in r["results"])

def test_query_no_query():
    m = get_fresh()
    r = m.twin_query("")
    assert "error" in r

def test_query_all_layer():
    m = get_fresh()
    r = m.twin_query("London", "all")
    assert r["total_matches"] >= 1

def test_render_all():
    m = get_fresh()
    r = m.twin_render("all")
    assert r["total"] > 100  # 30+30+33+120+

def test_render_specific_layer():
    m = get_fresh()
    r = m.twin_render("hives")
    assert r["total"] == 33

def test_render_specific_hive():
    m = get_fresh()
    r = m.twin_render("all", hive="London")
    assert r["total"] > 0

def test_layer_toggle_hives():
    m = get_fresh()
    r = m.twin_layer("hives", enabled=True)
    assert r["enabled"] is True

def test_layer_toggle_land():
    m = get_fresh()
    r = m.twin_layer("land", enabled=False)
    assert r["enabled"] is False

def test_layer_invalid():
    m = get_fresh()
    r = m.twin_layer("invalid")
    assert "error" in r

def test_simulate():
    m = get_fresh()
    r = m.twin_simulate("drone_rescue", "London")
    assert r["scenario"] == "drone_rescue"
    assert r["sim_id"].startswith("sim-")

def test_status():
    m = get_fresh()
    r = m.twin_status()
    assert r["land_registry_records"] == 30
    assert r["companies_house_records"] == 20
    assert r["hive_planets"] == 33
    assert r["live_sensors"] == 120

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.twin_query("London", "all"), m.twin_render(), m.twin_layer("hives"),
              m.twin_simulate(), m.twin_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Query → Render → Layer → Simulate → Status."""
    m = get_fresh()
    r1 = m.twin_query("BAE", "companies")
    assert r1["total_matches"] >= 1
    r2 = m.twin_render("hives")
    assert r2["total"] == 33
    r3 = m.twin_layer("sensors", enabled=True)
    assert r3["enabled"]
    r4 = m.twin_simulate("fire_response", "London")
    assert r4["sim_id"]
    s = m.twin_status()
    assert s["hive_planets"] == 33
    assert s["live_sensors"] == 120

def test_data_size():
    """The digital twin should have real-world data scale."""
    m = get_fresh()
    s = m.twin_status()
    assert s["land_registry_records"] >= 20
    assert s["companies_house_records"] >= 15
    assert s["hive_planets"] == 33
    assert s["live_sensors"] >= 100
    assert s["total_land_value_gbp"] > 1e10  # >£10B mapped

def test_33_hives_canonical():
    """All 33 hive planets must be present."""
    m = get_fresh()
    assert len(m.HIVES) == 33
    # 6 inner, 12 middle, 9 outer, 6 frontier
    tiers = {}
    for h in m.HIVES:
        tiers[h["tier"]] = tiers.get(h["tier"], 0) + 1
    assert tiers["inner"] == 6
    assert tiers["middle"] == 12
    assert tiers["outer"] == 9
    assert tiers["frontier"] == 6
