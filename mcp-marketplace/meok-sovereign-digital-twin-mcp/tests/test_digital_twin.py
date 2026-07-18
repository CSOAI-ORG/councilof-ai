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

def test_init():
    m = get_fresh()
    r = m.twin_globe_init()
    assert r["districts_count"] == 33
    assert r["arcana_count"] == 22

def test_init_with_rotation():
    m = get_fresh()
    r = m.twin_globe_init(rotation=0.5)
    assert r["globe"]["rotation"] == 0.5

def test_visualize():
    m = get_fresh()
    m.twin_globe_init()
    r = m.twin_visualize("real")
    assert "view" in r

def test_visualize_unknown_layer():
    m = get_fresh()
    m.twin_globe_init()
    r = m.twin_visualize("bogus")
    assert "error" in r

def test_layer_set():
    m = get_fresh()
    m.twin_globe_init()
    r = m.twin_layer_set("urban")
    assert r["active_layer"] == "urban"

def test_layer_set_unknown():
    m = get_fresh()
    m.twin_globe_init()
    r = m.twin_layer_set("bogus")
    assert "error" in r

def test_ontology():
    m = get_fresh()
    r = m.twin_ontology()
    assert r["arcana_count"] == 22
    assert r["districts_count"] == 33

def test_status():
    m = get_fresh()
    r = m.twin_status()
    assert r["arcana"] == 22
    assert r["districts"] == 33

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.twin_globe_init(), m.twin_visualize("real"),
              m.twin_layer_set("urban"), m.twin_ontology(), m.twin_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Init → Visualize → Set layer → Ontology → Status."""
    m = get_fresh()
    m.twin_globe_init()
    r1 = m.twin_visualize("real")
    assert "view" in r1
    r2 = m.twin_layer_set("urban")
    assert r2["active_layer"] == "urban"
    r3 = m.twin_visualize("urban")
    assert r3["view"]["layer"] == "urban"
    r4 = m.twin_ontology()
    assert r4["arcana_count"] == 22
    s = m.twin_status()
    assert s["globe_initialized"] is True

def test_22_arcana():
    m = get_fresh()
    assert len(m.ARCANA) == 22

def test_33_districts():
    m = get_fresh()
    assert len(m.DISTRICTS) == 33
