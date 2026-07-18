"""Tests for meok-sovereign-globe-mcp."""
import os, tempfile

_TEST_DIR = tempfile.mkdtemp(prefix="sov_globe_test_")
os.environ["SOV_GLOBE_KEY"] = os.path.join(_TEST_DIR, "key.pem")

from meok_sovereign_globe_mcp import (
    hive_registry, globe_scene_config, data_source_registry,
    layer_compose, particle_config, HIVES, DATA_SOURCES,
    _generate_force_graph_links, VERSION, PROTOCOL,
)


def test_hive_registry_full():
    r = hive_registry()
    assert r["protocol"] == PROTOCOL
    assert r["version"] == VERSION
    assert r["hive_count"] == len(HIVES)
    assert len(r["hives"]) == len(HIVES)
    assert "kid" in r and "sig" in r
    assert r["verify_url"].startswith("https://proofof.ai/globe/")


def test_hive_registry_has_core():
    r = hive_registry()
    sovereign_mom = next(h for h in r["hives"] if h["id"] == "sovereign-mom")
    assert sovereign_mom["layer"] == 0
    assert sovereign_mom["emoji"] == "🜏"
    assert sovereign_mom["lat"] == 53.96
    assert sovereign_mom["lng"] == -1.08


def test_hive_registry_layer_filter():
    r = hive_registry(layer=0)
    assert r["layer_filter"] == 0
    assert len(r["hives"]) == 1
    assert r["hives"][0]["id"] == "sovereign-mom"


def test_hive_registry_layer_3_industries():
    r = hive_registry(layer=3)
    assert all(h["layer"] == 3 for h in r["hives"])
    industry_ids = {h["id"] for h in r["hives"]}
    assert "fish" in industry_ids
    assert "koi" in industry_ids
    assert "grabhire" in industry_ids


def test_all_hives_have_required_fields():
    for h in HIVES:
        assert "id" in h and "layer" in h and "lat" in h and "lng" in h
        assert "name" in h and "type" in h and "emoji" in h and "color" in h
        assert -90 <= h["lat"] <= 90
        assert -180 <= h["lng"] <= 180


def test_globe_scene_config_basic():
    r = globe_scene_config()
    assert r["scene_type"] == "sovereign_globe"
    assert r["center"]["lat"] == 53.96
    assert "cesium" in r
    assert r["cesium"]["osm_buildings"] is True
    assert "deck_gl_layers" in r
    assert len(r["deck_gl_layers"]) == 4
    assert r["force_graph"] is not None
    assert r["particle_dimension"] is not None


def test_globe_scene_config_force_graph_has_all_hives():
    r = globe_scene_config()
    node_ids = {n["id"] for n in r["force_graph"]["nodes"]}
    assert len(node_ids) == len(HIVES)


def test_globe_scene_config_custom_center():
    r = globe_scene_config(center_lat=40.7128, center_lng=-74.0060, zoom=2.0)
    assert r["center"]["lat"] == 40.7128
    assert r["center"]["lng"] == -74.0060
    assert r["center"]["zoom"] == 2.0


def test_globe_scene_config_disabled_layers():
    r = globe_scene_config(
        show_real_buildings=False,
        show_data_layers=False,
        show_conspiracy_graph=False,
        show_particle_dimension=False,
    )
    assert r["cesium"]["osm_buildings"] is False
    assert r["deck_gl_layers"] == []
    assert r["force_graph"] is None
    assert r["particle_dimension"] is None


def test_data_source_registry():
    r = data_source_registry()
    assert r["source_count"] == len(DATA_SOURCES)
    assert all("id" in s and "url" in s for s in r["sources"])


def test_data_source_registry_filtered():
    r = data_source_registry(category="weather")
    assert r["category_filter"] == "weather"
    assert all(s["category"] == "weather" for s in r["sources"])


def test_layer_compose_valid():
    r = layer_compose("sovereign-mom", "usgs_earthquakes", visual="arc", color="#f87171")
    assert "layer_id" in r
    assert r["hive"]["id"] == "sovereign-mom"
    assert r["source"]["id"] == "usgs_earthquakes"
    assert r["visual"]["type"] == "arc"
    assert r["deck_gl"]["type"] == "ArcLayer"
    assert "kid" in r and "sig" in r


def test_layer_compose_unknown_hive():
    r = layer_compose("nonexistent", "usgs_earthquakes")
    assert "error" in r
    assert "available" in r


def test_layer_compose_unknown_source():
    r = layer_compose("sovereign-mom", "nonexistent")
    assert "error" in r
    assert "available" in r


def test_layer_compose_all_visual_types():
    for v in ["arc", "hex", "scatter", "ring", "pulse"]:
        r = layer_compose("koi", "iss_position", visual=v)
        assert "deck_gl" in r


def test_particle_config_basic():
    r = particle_config()
    assert r["particle_count"] == 33000
    assert r["renderer"] == "WebGPURenderer"
    assert r["pattern"] == "orbital_swarm"
    assert r["bloom"]["strength"] == 1.5
    assert len(r["color_palette"]) == 4


def test_force_graph_links_curated():
    links = _generate_force_graph_links()
    assert len(links) > 5
    for link in links:
        assert "source" in link and "target" in link and "value" in link
        assert link["value"] > 0


def test_layer_compose_arc_has_source_position():
    r = layer_compose("fish", "iss_position", visual="arc")
    pos = r["deck_gl"]["getSourcePosition"]
    assert pos[0] == 151.2093  # fishkeeper lng
    assert pos[1] == -33.8688  # fishkeeper lat
    r = globe_scene_config()
    assert "kid" in r and "sig" in r
    assert "verify_url" in r
