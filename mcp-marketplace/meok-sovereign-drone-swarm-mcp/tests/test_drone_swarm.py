"""Tests for meok-sovereign-drone-swarm-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_swarm_")
os.environ["SOV_SWARM_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_drone_swarm_mcp" in sys.modules:
        del sys.modules["meok_sovereign_drone_swarm_mcp"]
    import meok_sovereign_drone_swarm_mcp as m
    importlib.reload(m)
    return m

def test_spawn():
    m = get_fresh()
    r = m.swarm_spawn(40)
    assert r["spawned"] == 40

def test_spawn_1():
    m = get_fresh()
    r = m.swarm_spawn(1)
    assert r["spawned"] == 1

def test_spawn_invalid_low():
    m = get_fresh()
    r = m.swarm_spawn(0)
    assert "error" in r

def test_spawn_invalid_high():
    m = get_fresh()
    r = m.swarm_spawn(500)
    assert "error" in r

def test_assign():
    m = get_fresh()
    m.swarm_spawn(10)
    r = m.swarm_assign("SAR", formation="diamond")
    assert "mission_id" in r

def test_assign_invalid_formation():
    m = get_fresh()
    m.swarm_spawn(10)
    r = m.swarm_assign("SAR", formation="bogus")
    assert "error" in r

def test_coordinate():
    m = get_fresh()
    m.swarm_spawn(10)
    r = m.swarm_coordinate(5)
    assert r["steps_executed"] == 5
    assert "coordination_score" in r

def test_coordinate_no_drones():
    m = get_fresh()
    r = m.swarm_coordinate()
    assert "error" in r

def test_track():
    m = get_fresh()
    m.swarm_spawn(10)
    r = m.swarm_track()
    assert r["summary"]["total"] == 10

def test_track_no_drones():
    m = get_fresh()
    r = m.swarm_track()
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.swarm_status()
    assert "formations_available" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.swarm_spawn(5)
    for r in [m.swarm_assign("SAR"), m.swarm_coordinate(1),
              m.swarm_track(), m.swarm_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Spawn 40 → Assign SAR → Coordinate → Track → Status."""
    m = get_fresh()
    r1 = m.swarm_spawn(40, "SAR")
    assert r1["spawned"] == 40
    r2 = m.swarm_assign("SAR", formation="diamond")
    assert "mission_id" in r2
    r3 = m.swarm_coordinate(10)
    assert r3["drones_active"] == 40
    r4 = m.swarm_track()
    assert r4["summary"]["total"] == 40
    s = m.swarm_status()
    assert s["total_drones"] == 40

def test_5_formations():
    m = get_fresh()
    assert set(m._FORMATIONS) == {"diamond", "line", "circle", "swarm", "v-shape"}
