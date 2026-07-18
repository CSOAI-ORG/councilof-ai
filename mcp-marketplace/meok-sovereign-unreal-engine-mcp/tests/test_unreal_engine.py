"""Tests for meok-sovereign-unreal-engine-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_ue5_")
os.environ["SOV_UE5_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_unreal_engine_mcp" in sys.modules:
        del sys.modules["meok_sovereign_unreal_engine_mcp"]
    import meok_sovereign_unreal_engine_mcp as m
    importlib.reload(m)
    return m

def test_create_scene():
    m = get_fresh()
    r = m.sovworld_create_scene("London-Sovereign")
    assert "scene" in r

def test_create_scene_no_name():
    m = get_fresh()
    r = m.sovworld_create_scene("")
    assert "error" in r

def test_create_scene_invalid_care():
    m = get_fresh()
    r = m.sovworld_create_scene("x", care_floor=1.5)
    assert "error" in r

def test_create_scene_with_bounds():
    m = get_fresh()
    r = m.sovworld_create_scene("London", world_bounds="51.4,-0.2,51.6,0.0")
    assert len(r["scene"]["world_bounds"]) == 4

def test_add_actor():
    m = get_fresh()
    scene = m.sovworld_create_scene("London", world_bounds="51.4,-0.2,51.6,0.0")
    sid = scene["scene"]["scene_id"]
    r = m.sovworld_add_actor(sid, "StaticMeshActor", "100,200,300")
    assert "actor" in r

def test_add_actor_no_scene():
    m = get_fresh()
    r = m.sovworld_add_actor("", "x")
    assert "error" in r

def test_add_actor_no_type():
    m = get_fresh()
    scene = m.sovworld_create_scene("x")
    sid = scene["scene"]["scene_id"]
    r = m.sovworld_add_actor(sid, "")
    assert "error" in r

def test_add_actor_unknown_scene():
    m = get_fresh()
    r = m.sovworld_add_actor("nope", "x")
    assert "error" in r

def test_load_tiles():
    m = get_fresh()
    scene = m.sovworld_create_scene("London", world_bounds="51.4,-0.2,51.6,0.0")
    sid = scene["scene"]["scene_id"]
    r = m.sovworld_load_tiles(sid, "cesium-osgb", 12)
    assert "tile_count" in r

def test_load_tiles_no_scene():
    m = get_fresh()
    r = m.sovworld_load_tiles("", "cesium-osgb")
    assert "error" in r

def test_load_tiles_unknown():
    m = get_fresh()
    r = m.sovworld_load_tiles("nope", "x")
    assert "error" in r

def test_render_frame():
    m = get_fresh()
    scene = m.sovworld_create_scene("London", world_bounds="51.4,-0.2,51.6,0.0")
    sid = scene["scene"]["scene_id"]
    r = m.sovworld_render_frame(sid, 51.5, -0.1, 1000)
    assert r["frame"]["fps"] == 60

def test_render_frame_no_scene():
    m = get_fresh()
    r = m.sovworld_render_frame("")
    assert "error" in r

def test_render_frame_unknown():
    m = get_fresh()
    r = m.sovworld_render_frame("nope")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.sovworld_status()
    assert r["engine"] == "Unreal Engine 5.4"
    assert r["rendering"]["lumen"] is True
    assert r["rendering"]["nanite"] is True
    assert r["rendering"]["ray_tracing"] is True

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    scene = m.sovworld_create_scene("x")
    sid = scene["scene"]["scene_id"]
    for r in [scene, m.sovworld_add_actor(sid, "x"),
              m.sovworld_load_tiles(sid, "x"), m.sovworld_render_frame(sid),
              m.sovworld_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Create scene → Add actor → Load tiles → Render → Status."""
    m = get_fresh()
    r1 = m.sovworld_create_scene("London", world_bounds="51.4,-0.2,51.6,0.0")
    sid = r1["scene"]["scene_id"]
    r2 = m.sovworld_add_actor(sid, "Cesium3DTileset")
    assert r2["total_actors"] == 1
    r3 = m.sovworld_load_tiles(sid, "cesium-osgb", 14)
    assert r3["tile_count"] > 0
    r4 = m.sovworld_render_frame(sid, 51.5, -0.1, 1000)
    assert r4["frame"]["fps"] == 60
    s = m.sovworld_status()
    assert s["total_scenes"] >= 1
    assert s["total_frames_rendered"] >= 1
