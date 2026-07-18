"""Tests for meok-sovereign-unreal-mcp."""
import os, sys, tempfile, importlib

_TEST = tempfile.mkdtemp(prefix="sov_unreal_")
os.environ["SOV_UNREAL_KEY"] = _TEST + "/k.pem"


def get_fresh():
    """Re-import module to get clean state."""
    if "meok_sovereign_unreal_mcp" in sys.modules:
        # Remove so reimport picks up fresh
        del sys.modules["meok_sovereign_unreal_mcp"]
    import meok_sovereign_unreal_mcp as m
    importlib.reload(m)
    return m


def test_33_hives():
    m = get_fresh()
    assert len(m.HIVES) == 33


def test_georeference_get():
    m = get_fresh()
    r = m.unreal_georeference("get")
    assert r["action"] == "get"
    assert r["georeference"]["lat"] == 51.5074


def test_georeference_set():
    m = get_fresh()
    r = m.unreal_georeference("set", lat=35.6762, lng=139.6503, height=10)
    assert r["action"] == "set"
    assert r["georeference"]["lat"] == 35.6762


def test_georeference_invalid_action():
    m = get_fresh()
    r = m.unreal_georeference("invalid")
    assert "error" in r


def test_camera_fly_to():
    m = get_fresh()
    r = m.unreal_camera("fly_to", hive="Tokyo", altitude=2000000)
    assert r["hive"] == "Tokyo"
    assert r["lat"] == 35.6762
    assert r["altitude"] == 2000000


def test_camera_get():
    m = get_fresh()
    r = m.unreal_camera("get")
    assert "camera" in r


def test_camera_orbit():
    m = get_fresh()
    r = m.unreal_camera("orbit", hive="London", altitude=1000000, heading=30)
    assert r["action"] == "orbit"


def test_camera_invalid_hive():
    m = get_fresh()
    r = m.unreal_camera("fly_to", hive="Atlantis")
    assert "error" in r


def test_tileset_load():
    m = get_fresh()
    r = m.unreal_tileset("load", url="https://example.com/tileset.json", name="UK-Map")
    assert r["action"] == "load"
    assert r["tileset"]["name"] == "UK-Map"


def test_tileset_load_default():
    m = get_fresh()
    r = m.unreal_tileset("load")
    assert "tileset" in r


def test_tileset_list():
    m = get_fresh()
    m.unreal_tileset("load", name="A")
    m.unreal_tileset("load", name="B")
    r = m.unreal_tileset("list")
    assert r["total"] == 2


def test_tileset_unload():
    m = get_fresh()
    m.unreal_tileset("load", name="A")
    r = m.unreal_tileset("unload", name="A")
    assert r["remaining"] == 0


def test_blueprint_exec():
    m = get_fresh()
    r = m.unreal_blueprint("exec", name="JARVIS_Spawn", function="SpawnDrone", params="x=10,y=20,z=30")
    assert r["execution"]["name"] == "JARVIS_Spawn"
    assert "10" in str(r["execution"]["params"])


def test_blueprint_no_name():
    m = get_fresh()
    r = m.unreal_blueprint("exec")
    assert "error" in r


def test_blueprint_list():
    m = get_fresh()
    m.unreal_blueprint("exec", name="A")
    r = m.unreal_blueprint("list")
    assert r["total"] == 1


def test_status_initial():
    m = get_fresh()
    r = m.unreal_status()
    assert "engine_version" in r
    assert r["available_hives"] == 33
    assert r["tilesets_loaded"] == 0


def test_status_with_data():
    m = get_fresh()
    m.unreal_georeference("set", lat=35.6762, lng=139.6503)
    m.unreal_tileset("load")
    m.unreal_blueprint("exec", name="A")
    r = m.unreal_status()
    assert r["tilesets_loaded"] == 1
    assert r["blueprint_executions"] == 1


def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    m = get_fresh()
    for r in [m.unreal_georeference(), m.unreal_camera(), m.unreal_tileset(),
              m.unreal_blueprint("exec", name="A"), m.unreal_status()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_cesium_calls_present():
    m = get_fresh()
    r1 = m.unreal_georeference("set", lat=35, lng=139)
    assert "CesiumGeoreferenceComponent" in r1["cesium_call"]
    r2 = m.unreal_camera("fly_to", hive="Tokyo")
    assert "ACesiumCameraController" in r2["cesium_call"]
    r3 = m.unreal_tileset("load")
    assert "ACesium3DTileset" in r3["cesium_call"]
    r4 = m.unreal_blueprint("exec", name="A")
    assert "UBlueprintFunctionLibrary" in r4["unreal_call"]


def test_full_workflow():
    """Georeference → Tileset → Camera → Blueprint → Status."""
    m = get_fresh()
    g = m.unreal_georeference("set", lat=51.5074, lng=-0.1278, height=0)
    assert g["action"] == "set"
    t = m.unreal_tileset("load", name="UK-Land-Registry")
    assert t["tileset"]["name"] == "UK-Land-Registry"
    c = m.unreal_camera("fly_to", hive="London", altitude=500000)
    assert c["hive"] == "London"
    b = m.unreal_blueprint("exec", name="JARVIS_Spawn")
    assert b["execution"]["name"] == "JARVIS_Spawn"
    s = m.unreal_status()
    assert s["tilesets_loaded"] == 1
    assert s["blueprint_executions"] == 1
