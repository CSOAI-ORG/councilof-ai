"""Tests for meok-sovereign-terrain-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_terrain_")
os.environ["SOV_TERRAIN_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_terrain_mcp" in sys.modules:
        del sys.modules["meok_sovereign_terrain_mcp"]
    import meok_sovereign_terrain_mcp as m
    importlib.reload(m)
    return m

def test_generate_heightmap():
    m = get_fresh()
    r = m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0", 30)
    assert "terrain" in r

def test_generate_heightmap_invalid():
    m = get_fresh()
    r = m.terrain_generate_heightmap("bad-format")
    assert "error" in r

def test_generate_heightmap_3_bounds():
    m = get_fresh()
    r = m.terrain_generate_heightmap("51.4,-0.2,51.6")
    assert "error" in r

def test_build_tin():
    m = get_fresh()
    h = m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0")
    tid = h["terrain"]["terrain_id"]
    r = m.terrain_build_tin(tid, 1000)
    assert "triangle_count" in r

def test_build_tin_no_terrain():
    m = get_fresh()
    r = m.terrain_build_tin("", 1000)
    assert "error" in r

def test_build_tin_unknown():
    m = get_fresh()
    r = m.terrain_build_tin("nope", 1000)
    assert "error" in r

def test_apply_imagery():
    m = get_fresh()
    h = m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0")
    tid = h["terrain"]["terrain_id"]
    r = m.terrain_apply_imagery(tid, "cesium-ion")
    assert "imagery" in r

def test_apply_imagery_no_terrain():
    m = get_fresh()
    r = m.terrain_apply_imagery("", "cesium-ion")
    assert "error" in r

def test_apply_imagery_unknown_source():
    m = get_fresh()
    h = m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0")
    tid = h["terrain"]["terrain_id"]
    r = m.terrain_apply_imagery(tid, "unknown-source")
    # Should default to cesium-ion
    assert "imagery" in r

def test_export():
    m = get_fresh()
    h = m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0")
    tid = h["terrain"]["terrain_id"]
    r = m.terrain_export(tid, "ue5-landscape")
    assert r["format"] == "ue5-landscape"

def test_export_no_terrain():
    m = get_fresh()
    r = m.terrain_export("", "ue5")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.terrain_status()
    assert r["total_terrains"] == 0
    assert "UK" in r["global_coverage"]

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0"),
              m.terrain_build_tin("nope", 1000),
              m.terrain_apply_imagery("nope", "x"),
              m.terrain_export("nope", "ue5"),
              m.terrain_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Generate → Build TIN → Imagery → Export → Status."""
    m = get_fresh()
    r1 = m.terrain_generate_heightmap("51.4,-0.2,51.6,0.0", 30)
    tid = r1["terrain"]["terrain_id"]
    r2 = m.terrain_build_tin(tid, 5000)
    assert r2["triangle_count"] > 0
    r3 = m.terrain_apply_imagery(tid, "cesium-ion")
    assert r3["imagery"]["source"] == "cesium-ion"
    r4 = m.terrain_export(tid, "ue5-landscape")
    assert r4["size_mb"] == 145
    s = m.terrain_status()
    assert s["total_terrains"] >= 1
