"""Tests for meek-world-data-mcp."""
import os, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
from meek_world_data_mcp.server import government_data_overview, wikipedia_data_overview, osm_data_overview, names_data_overview, eu_data_overview, place_name_resolve, reverse_geocode, world_data_status

def test_government_data_overview():
    r = government_data_overview()
    assert r["total_size_gb"] == 49
    assert len(r["datasets"]) >= 10
    print(f"✅ test_gov: {r['total_size_gb']} GB, {len(r['datasets'])} datasets")

def test_wikipedia_data_overview():
    r = wikipedia_data_overview()
    assert r["total_size_gb"] == 25
    assert r["languages"] == 300
    print(f"✅ test_wikipedia: {r['total_size_gb']} GB, {r['languages']} languages")

def test_osm_data_overview():
    r = osm_data_overview()
    assert r["total_size_gb"] == 2.0
    assert "great-britain-latest.osm.pbf" in r["file"]
    print(f"✅ test_osm: {r['total_size_gb']} GB")

def test_names_data_overview():
    r = names_data_overview()
    assert r["total_names"] == 9100000
    print(f"✅ test_names: {r['total_names']} place names")

def test_eu_data_overview():
    r = eu_data_overview()
    assert r["total_size_kb"] == 380
    assert len(r["datasets"]) == 5
    print(f"✅ test_eu: {r['total_size_kb']} KB, {len(r['datasets'])} datasets")

def test_place_name_resolve():
    r = place_name_resolve(name="London")
    assert r["lat"] == 51.5074
    assert r["lng"] == -0.1278
    print(f"✅ test_resolve: London -> {r['lat']}, {r['lng']}")

def test_reverse_geocode():
    r = reverse_geocode(lat=51.5074, lng=-0.1278)
    assert r["place_name"] == "London"
    print(f"✅ test_reverse: {r['place_name']}, distance {r['distance_km']}km")

def test_world_data_status():
    r = world_data_status()
    assert r["total_datasets"] == 35
    print(f"✅ test_status: {r['total_size_gb']} GB total, {r['total_datasets']} datasets")

if __name__ == "__main__":
    test_government_data_overview()
    test_wikipedia_data_overview()
    test_osm_data_overview()
    test_names_data_overview()
    test_eu_data_overview()
    test_place_name_resolve()
    test_reverse_geocode()
    test_world_data_status()
    print("\n🎉 ALL 8 TESTS PASSED — meek-world-data-mcp v1.0.0 is sovereign. 77 GB of real world data overlaid on the sovereign OS.")