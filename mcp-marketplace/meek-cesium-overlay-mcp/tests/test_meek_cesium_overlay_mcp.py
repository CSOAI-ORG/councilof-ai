"""Tests for meek-cesium-overlay-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_cesium_overlay_mcp.server import cesium_engine_specs, overlay_regulations_as_temples, overlay_sovereign_orbs, overlay_terrain_with_osm, overlay_government_data, overlay_synth_town, overlay_combine_all, cesium_3d_scene_url

def test_cesium_engine_specs():
    r = cesium_engine_specs()
    assert "CesiumJS" in r["engine"]
    assert "WebGL" in r["rendering"]
    print(f"✅ test_engine: {r['engine']} with {r['rendering']}")

def test_overlay_regulations_as_temples():
    r = overlay_regulations_as_temples()
    assert r["count"] == 6
    assert r["total_whitepapers"] >= 30
    print(f"✅ test_temples: {r['count']} regulations as temples, {r['total_whitepapers']} whitepapers")

def test_overlay_sovereign_orbs():
    r = overlay_sovereign_orbs()
    assert r["orb_count"] == 5005
    assert "gold" in r["orb_color"]
    assert len(r["orb_features"]) == 7
    print(f"✅ test_orbs: {r['orb_count']} sovereign orbs, {len(r['orb_features'])} features per orb")

def test_overlay_terrain_with_osm():
    r = overlay_terrain_with_osm()
    assert r["osm_overlay"]["size_gb"] == 2.0
    print(f"✅ test_terrain: Cesium + OSM ({r['osm_overlay']['size_gb']} GB)")

def test_overlay_government_data():
    r = overlay_government_data()
    assert r["total_markers"] == 92100000
    print(f"✅ test_gov: {r['total_markers']} government data points")

def test_overlay_synth_town():
    r = overlay_synth_town()
    assert r["sovereign_orbs"] == 5005
    print(f"✅ test_sovtown: {r['size_km2']} km2, {r['sovereign_orbs']} orbs, {r['metahuman_digital_twins']} digital twins")

def test_overlay_combine_all():
    r = overlay_combine_all()
    assert r["total_layers"] == 5
    assert r["total_items"] >= 92100000
    print(f"✅ test_combine: {r['total_layers']} layers, {r['total_items']} items")

def test_cesium_3d_scene_url():
    r = cesium_3d_scene_url()
    assert "Cesium" in r["scene_url"]
    assert len(r["data_sources"]) == 6
    print(f"✅ test_scene: {r['scene_type']} with {len(r['data_sources'])} data sources")

if __name__ == "__main__":
    test_cesium_engine_specs()
    test_overlay_regulations_as_temples()
    test_overlay_sovereign_orbs()
    test_overlay_terrain_with_osm()
    test_overlay_government_data()
    test_overlay_synth_town()
    test_overlay_combine_all()
    test_cesium_3d_scene_url()
    print("\n🎉 ALL 8 TESTS PASSED — meek-cesium-overlay-mcp v1.0.0 is sovereign. The 3D world is overlaid.")