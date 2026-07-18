"""Tests for meok-sovereign-experiment-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_exp_")
os.environ["SOV_EXP_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_experiment_mcp" in sys.modules:
        del sys.modules["meok_sovereign_experiment_mcp"]
    import meok_sovereign_experiment_mcp as m
    importlib.reload(m)
    return m

def test_create():
    m = get_fresh()
    r = m.experiment_create("test1", "control,treatment")
    assert "test1" in r["experiment"]["name"]
    assert len(r["experiment"]["variants"]) == 2

def test_create_no_name():
    m = get_fresh()
    r = m.experiment_create("")
    assert "error" in r

def test_create_three_variants():
    m = get_fresh()
    r = m.experiment_create("test", "a,b,c")
    assert len(r["experiment"]["variants"]) == 3

def test_assign():
    m = get_fresh()
    exp = m.experiment_create("test", "control,treatment")
    r = m.experiment_assign(exp["experiment"]["exp_id"], "alice")
    assert r["variant"] in ["control", "treatment"]
    assert r["n"] == 1

def test_assign_unknown():
    m = get_fresh()
    r = m.experiment_assign("nope", "alice")
    assert "error" in r

def test_assign_deterministic():
    """Same citizen should always get same variant."""
    m = get_fresh()
    exp = m.experiment_create("test", "control,treatment")
    eid = exp["experiment"]["exp_id"]
    v1 = m.experiment_assign(eid, "alice")["variant"]
    v2 = m.experiment_assign(eid, "alice")["variant"]
    assert v1 == v2

def test_record():
    m = get_fresh()
    exp = m.experiment_create("test", "control,treatment")
    eid = exp["experiment"]["exp_id"]
    m.experiment_assign(eid, "alice")
    r = m.experiment_record(eid, "alice", converted=True)
    assert r["converted"] is True

def test_record_unknown():
    m = get_fresh()
    r = m.experiment_record("nope", "alice")
    assert "error" in r

def test_result_inconclusive():
    m = get_fresh()
    exp = m.experiment_create("test", "control,treatment")
    eid = exp["experiment"]["exp_id"]
    r = m.experiment_result(eid)
    assert r["winner"] is None  # No 30+ participants

def test_result_with_data():
    m = get_fresh()
    exp = m.experiment_create("test", "control,treatment")
    eid = exp["experiment"]["exp_id"]
    # Add 30+ participants
    for i in range(60):
        m.experiment_assign(eid, f"citizen_{i}")
        if i % 3 == 0:
            m.experiment_record(eid, f"citizen_{i}", converted=True)
    r = m.experiment_result(eid)
    assert "control" in r["rates"]
    assert "treatment" in r["rates"]

def test_status():
    m = get_fresh()
    m.experiment_create("a")
    m.experiment_create("b")
    r = m.experiment_status()
    assert r["total_experiments"] == 2

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    exp = m.experiment_create("test")
    for r in [exp, m.experiment_assign(exp["experiment"]["exp_id"], "a"),
              m.experiment_record(exp["experiment"]["exp_id"], "a"),
              m.experiment_result(exp["experiment"]["exp_id"]),
              m.experiment_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Create → Assign 60 → Record → Result → Status."""
    m = get_fresh()
    exp = m.experiment_create("sovereign_test", "control,treatment")
    eid = exp["experiment"]["exp_id"]
    for i in range(60):
        m.experiment_assign(eid, f"citizen_{i}")
        if i % 2 == 0:
            m.experiment_record(eid, f"citizen_{i}", converted=True)
    r = m.experiment_result(eid)
    assert "control" in r["rates"]
    s = m.experiment_status()
    assert s["total_experiments"] == 1
