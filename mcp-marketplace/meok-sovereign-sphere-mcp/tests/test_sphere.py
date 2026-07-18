"""Tests for meok-sovereign-sphere-mcp (Cesium 3D globe)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_sphere_test_")
os.environ["SOV_SPHERE_KEY"] = os.path.join(_TEST_DIR, "key.pem")
import meok_sovereign_sphere_mcp as m
from meok_sovereign_sphere_mcp import render_globe, add_marker, fly_to, load_hive_data, get_camera_state, HIVES


def test_33_hives():
    assert len(HIVES) == 33


def test_render_globe_all():
    r = render_globe()
    assert r["engine"] == "Cesium 1.118"
    assert r["count"] == 33


def test_render_globe_filtered():
    r = render_globe(hive_ids=[1, 2, 3])
    assert r["count"] == 3


def test_render_globe_great_circle():
    r = render_globe(hive_ids=[1, 13])
    assert r["example_great_circle_km"] > 0
    assert 5000 < r["example_great_circle_km"] < 8000


def test_add_marker():
    r = add_marker(52.2053, 0.1218, "Cambridge Hub")
    assert r["label"] == "Cambridge Hub"
    assert r["color"] == "#fbbf24"


def test_add_marker_unique_id():
    r1 = add_marker(52.0, 0.0, "A")
    r2 = add_marker(52.0, 0.0, "A")
    assert r1["marker_id"] != r2["marker_id"]


def test_fly_to_valid():
    r = fly_to(52.2053, 0.1218, 1000)
    assert r["camera"]["height_km"] == 1000


def test_fly_to_invalid_height():
    r = fly_to(52.0, 0.0, 100000)
    assert "error" in r
    r = fly_to(52.0, 0.0, -100)
    assert "error" in r


def test_load_hive_valid():
    r = load_hive_data(1)
    assert r["hive"]["name"] == "London"
    assert r["courses"] == 10


def test_load_hive_invalid():
    r = load_hive_data(0)
    assert "error" in r


def test_get_camera_state():
    r = get_camera_state()
    assert "camera" in r


def test_no_external_deps():
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import requests" not in src


def test_signed_outputs():
    for r in [render_globe(), add_marker(52.0, 0.0, "X"), fly_to(52.0, 0.0, 100), load_hive_data(1), get_camera_state()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_full_lifecycle():
    render_globe(hive_ids=[1, 2])
    add_marker(52.2053, 0.1218, "Cambridge", hive_id=2)
    fly_to(52.2053, 0.1218, 500)
    load_hive_data(2)
    get_camera_state()
