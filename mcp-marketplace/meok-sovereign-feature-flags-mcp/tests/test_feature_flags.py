"""Tests for meok-sovereign-feature-flags-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_ff_")
os.environ["SOV_FF_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_feature_flags_mcp" in sys.modules:
        del sys.modules["meok_sovereign_feature_flags_mcp"]
    import meok_sovereign_feature_flags_mcp as m
    importlib.reload(m)
    return m

def test_create():
    m = get_fresh()
    r = m.flags_create("new-feature", 50)
    assert r["flag"]["name"] == "new-feature"

def test_create_no_name():
    m = get_fresh()
    r = m.flags_create("", 50)
    assert "error" in r

def test_create_invalid_rollout():
    m = get_fresh()
    r = m.flags_create("x", 150)
    assert "error" in r

def test_create_negative_rollout():
    m = get_fresh()
    r = m.flags_create("x", -10)
    assert "error" in r

def test_create_too_few_variants():
    m = get_fresh()
    r = m.flags_create("x", 100, variants="only-one")
    assert "error" in r

def test_evaluate():
    m = get_fresh()
    m.flags_create("new-feature", 100)
    r = m.flags_evaluate("new-feature", "user-1")
    assert "variant" in r
    assert r["enabled"] is True

def test_evaluate_no_name():
    m = get_fresh()
    r = m.flags_evaluate("", "user-1")
    assert "error" in r

def test_evaluate_no_user():
    m = get_fresh()
    r = m.flags_evaluate("new-feature", "")
    assert "error" in r

def test_evaluate_unknown_flag():
    m = get_fresh()
    r = m.flags_evaluate("nope", "user-1")
    assert "error" in r

def test_evaluate_zero_rollout():
    m = get_fresh()
    m.flags_create("disabled-flag", 0)
    r = m.flags_evaluate("disabled-flag", "user-1")
    assert r["enabled"] is False

def test_evaluate_deterministic():
    """Same user always gets same variant."""
    m = get_fresh()
    m.flags_create("feature", 100, variants="a,b,c")
    r1 = m.flags_evaluate("feature", "user-X")
    r2 = m.flags_evaluate("feature", "user-X")
    assert r1["variant"] == r2["variant"]

def test_set_rollout():
    m = get_fresh()
    m.flags_create("x", 100)
    r = m.flags_set_rollout("x", 25)
    assert r["rollout"] == 25

def test_set_rollout_no_name():
    m = get_fresh()
    r = m.flags_set_rollout("", 50)
    assert "error" in r

def test_set_rollout_unknown():
    m = get_fresh()
    r = m.flags_set_rollout("nope", 50)
    assert "error" in r

def test_list():
    m = get_fresh()
    m.flags_create("a", 100)
    m.flags_create("b", 50)
    r = m.flags_list()
    assert r["total"] == 2

def test_status():
    m = get_fresh()
    r = m.flags_status()
    assert r["total_flags"] == 0

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.flags_create("x", 100)
    for r in [m.flags_evaluate("x", "user-1"), m.flags_set_rollout("x", 50),
              m.flags_list(), m.flags_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Create → Evaluate → Set rollout → Evaluate → List → Status."""
    m = get_fresh()
    m.flags_create("sovereign-cta", 100, variants="control,treatment")
    r1 = m.flags_evaluate("sovereign-cta", "user-1")
    assert r1["variant"] in ["control", "treatment"]
    r2 = m.flags_set_rollout("sovereign-cta", 50)
    assert r2["rollout"] == 50
    r3 = m.flags_list()
    assert r3["total"] == 1
    s = m.flags_status()
    assert s["total_flags"] == 1
