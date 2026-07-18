"""Tests for meok-sovereign-simulation-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_sim_")
os.environ["SOV_SIM_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_simulation_mcp" in sys.modules:
        del sys.modules["meok_sovereign_simulation_mcp"]
    import meok_sovereign_simulation_mcp as m
    importlib.reload(m)
    return m

def test_create_urban():
    m = get_fresh()
    r = m.sim_create("urban", "Test-Urban")
    assert "sim" in r

def test_create_isr():
    m = get_fresh()
    r = m.sim_create("isr", "Test-ISR")
    assert "sim" in r

def test_create_c2():
    m = get_fresh()
    r = m.sim_create("c2", "Test-C2")
    assert "sim" in r

def test_create_network():
    m = get_fresh()
    r = m.sim_create("network", "Test-Network")
    assert "sim" in r

def test_create_swarm():
    m = get_fresh()
    r = m.sim_create("swarm", "Test-Swarm")
    assert "sim" in r

def test_create_unknown():
    m = get_fresh()
    r = m.sim_create("bogus", "x")
    assert "error" in r

def test_create_no_name():
    m = get_fresh()
    r = m.sim_create("urban", "")
    assert "error" in r

def test_step():
    m = get_fresh()
    sim = m.sim_create("urban", "x")
    sid = sim["sim"]["sim_id"]
    r = m.sim_step(sid, 5)
    assert r["new_step"] == 5

def test_step_no_id():
    m = get_fresh()
    r = m.sim_step("", 5)
    assert "error" in r

def test_step_unknown():
    m = get_fresh()
    r = m.sim_step("nope", 5)
    assert "error" in r

def test_visualize():
    m = get_fresh()
    sim = m.sim_create("swarm", "x")
    sid = sim["sim"]["sim_id"]
    r = m.sim_visualize(sid)
    assert "points" in r

def test_visualize_no_id():
    m = get_fresh()
    r = m.sim_visualize("")
    assert "error" in r

def test_visualize_unknown():
    m = get_fresh()
    r = m.sim_visualize("nope")
    assert "error" in r

def test_score():
    m = get_fresh()
    sim = m.sim_create("urban", "x")
    sid = sim["sim"]["sim_id"]
    r = m.sim_score(sid)
    assert "actual_score" in r["score"]

def test_score_no_id():
    m = get_fresh()
    r = m.sim_score("")
    assert "error" in r

def test_score_unknown():
    m = get_fresh()
    r = m.sim_score("nope")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.sim_status()
    assert r["total_simulations"] >= 2  # Seed sims

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    sim = m.sim_create("urban", "x")
    sid = sim["sim"]["sim_id"]
    for r in [sim, m.sim_step(sid, 1), m.sim_visualize(sid), m.sim_score(sid), m.sim_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Create → Step → Visualize → Score → Status."""
    m = get_fresh()
    r1 = m.sim_create("urban", "Test-Workflow")
    sid = r1["sim"]["sim_id"]
    r2 = m.sim_step(sid, 10)
    assert r2["new_step"] == 10
    r3 = m.sim_visualize(sid)
    assert "points" in r3
    r4 = m.sim_score(sid)
    assert "actual_score" in r4["score"]
    s = m.sim_status()
    assert s["total_simulations"] >= 3

def test_5_sim_types():
    m = get_fresh()
    assert set(m.SIM_TYPES) == {"urban", "isr", "c2", "network", "swarm"}
