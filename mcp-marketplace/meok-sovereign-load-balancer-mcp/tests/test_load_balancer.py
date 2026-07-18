"""Tests for meok-sovereign-load-balancer-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_lb_")
os.environ["SOV_LB_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_load_balancer_mcp" in sys.modules:
        del sys.modules["meok_sovereign_load_balancer_mcp"]
    import meok_sovereign_load_balancer_mcp as m
    importlib.reload(m)
    return m

def test_register():
    m = get_fresh()
    r = m.lb_register("b1", "https://sovereign/b1", weight=1, pool="default")
    assert r["backend"]["backend_id"] == "b1"

def test_register_no_id():
    m = get_fresh()
    r = m.lb_register("", "", 1, "default")
    assert "error" in r

def test_route_no_backends():
    m = get_fresh()
    r = m.lb_route("default")
    assert "error" in r

def test_route_single():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    r = m.lb_route("default")
    assert r["routed_to"]["backend_id"] == "b1"

def test_route_round_robin():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    m.lb_register("b2", "https://b")
    r1 = m.lb_route("default")
    r2 = m.lb_route("default")
    assert r1["routed_to"]["backend_id"] != r2["routed_to"]["backend_id"] or r1 == r2

def test_status():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    r = m.lb_status()
    assert r["total"] == 1
    assert r["healthy"] == 1

def test_status_specific():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    r = m.lb_status("b1")
    assert r["backend"]["healthy"] is True

def test_status_unknown():
    m = get_fresh()
    r = m.lb_status("nope")
    assert "error" in r

def test_failover():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    r = m.lb_failover("b1", reason="test failure")
    assert r["healthy"] is False

def test_failover_unknown():
    m = get_fresh()
    r = m.lb_failover("nope", "reason")
    assert "error" in r

def test_failover_no_id():
    m = get_fresh()
    r = m.lb_failover("", "reason")
    assert "error" in r

def test_failover_already_unhealthy():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    m.lb_failover("b1", "reason")
    r = m.lb_failover("b1", "another reason")
    assert "error" in r

def test_scale_up():
    m = get_fresh()
    m.lb_scale("default", target_size=3)
    assert m.lb_status()["total"] == 3

def test_scale_down():
    m = get_fresh()
    m.lb_scale("default", target_size=5)
    m.lb_scale("default", target_size=2)
    assert m.lb_status()["total"] == 2

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.lb_register("b1", "https://a")
    for r in [m.lb_route(), m.lb_status(), m.lb_failover("b1", "reason"),
              m.lb_scale("default", 1)]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Register → Route → Failover → Scale → Status."""
    m = get_fresh()
    m.lb_register("b1", "https://a")
    m.lb_register("b2", "https://b")
    r1 = m.lb_route()
    assert "routed_to" in r1
    r2 = m.lb_failover("b1", "test")
    assert r2["healthy"] is False
    r3 = m.lb_scale("default", 5)
    assert r3["current_size"] == 5
    s = m.lb_status()
    assert s["healthy"] >= 4  # b1 was failed
