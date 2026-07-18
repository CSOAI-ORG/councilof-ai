"""Tests for meok-sovereign-deployment-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_deploy_")
os.environ["SOV_DEPLOY_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_deployment_mcp" in sys.modules:
        del sys.modules["meok_sovereign_deployment_mcp"]
    import meok_sovereign_deployment_mcp as m
    importlib.reload(m)
    return m

def test_deploy():
    m = get_fresh()
    r = m.deploy_deploy("test-surface")
    assert "deployment" in r

def test_deploy_canary():
    m = get_fresh()
    r = m.deploy_deploy("test-canary", canary=True)
    assert r["deployment"]["canary_pct"] == 5

def test_deploy_no_surface():
    m = get_fresh()
    r = m.deploy_deploy("")
    assert "error" in r

def test_status():
    m = get_fresh()
    r = m.deploy_status()
    assert r["total"] >= 5  # Seed deploys

def test_status_specific_surface():
    m = get_fresh()
    r = m.deploy_status("proofof-site")
    assert all(d["surface"] == "proofof-site" for d in r["deployments"])

def test_rollback():
    m = get_fresh()
    m.deploy_deploy("test")
    did = list(m._DEPLOYMENTS.keys())[0]
    r = m.deploy_rollback(did, "test reason")
    assert r["rolled_back"] is True

def test_rollback_no_id():
    m = get_fresh()
    r = m.deploy_rollback("", "reason")
    assert "error" in r

def test_rollback_unknown():
    m = get_fresh()
    r = m.deploy_rollback("nope", "reason")
    assert "error" in r

def test_canary():
    m = get_fresh()
    r = m.deploy_canary("test-canary", 10)
    assert r["deployment"]["canary_pct"] == 10

def test_canary_no_surface():
    m = get_fresh()
    r = m.deploy_canary("", 5)
    assert "error" in r

def test_canary_invalid_pct():
    m = get_fresh()
    r = m.deploy_canary("test", 0)
    assert "error" in r
    r = m.deploy_canary("test", 101)
    assert "error" in r

def test_list():
    m = get_fresh()
    m.deploy_deploy("a")
    r = m.deploy_list()
    assert "deployments" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.deploy_deploy("test")
    for r in [m.deploy_status(), m.deploy_list(), m.deploy_canary("test", 10)]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Deploy → Status → Canary → Rollback → List."""
    m = get_fresh()
    r1 = m.deploy_deploy("sovereign-os", "us-east-1", "v64")
    assert r1["deployment"]["surface"] == "sovereign-os"
    r2 = m.deploy_status()
    assert r2["total"] >= 6
    r3 = m.deploy_canary("sovereign-os", 25)
    assert r3["deployment"]["canary_pct"] == 25
    r4 = m.deploy_rollback(list(m._DEPLOYMENTS.keys())[0], "perf issue")
    assert r4["rolled_back"] is True
    r5 = m.deploy_list()
    assert "deployments" in r5
