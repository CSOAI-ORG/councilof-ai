"""Tests for meok-sovereign-orbs-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_orb_")
os.environ["SOV_ORB_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_orbs_mcp" in sys.modules:
        del sys.modules["meok_sovereign_orbs_mcp"]
    import meok_sovereign_orbs_mcp as m
    importlib.reload(m)
    return m

def test_create_orb():
    m = get_fresh()
    r = m.orb_create("London Hive", orb_type="hive")
    assert r["orb"]["name"] == "London Hive"
    assert r["total_orbs"] == 1

def test_create_no_name():
    m = get_fresh()
    r = m.orb_create("")
    assert "error" in r

def test_create_invalid_type():
    m = get_fresh()
    r = m.orb_create("X", orb_type="unknown")
    assert "error" in r

def test_create_5_types():
    """All 5 orb types should be createable."""
    m = get_fresh()
    for t in ["hive", "sub-hive", "twin", "archive", "edge"]:
        r = m.orb_create(f"orb-{t}", orb_type=t)
        assert r["orb"]["type"] == t

def test_transfer():
    m = get_fresh()
    a = m.orb_create("A", water_amount=1000)["orb"]["orb_id"]
    b = m.orb_create("B", water_amount=500)["orb"]["orb_id"]
    r = m.orb_transfer(a, b, amount=100)
    assert r["transfer"]["amount"] == 100
    assert r["from_water"] == 900
    assert r["to_water"] == 600

def test_transfer_insufficient():
    m = get_fresh()
    a = m.orb_create("A", water_amount=50)
    b = m.orb_create("B")
    r = m.orb_transfer(a["orb"]["orb_id"], b["orb"]["orb_id"], amount=100)
    assert "error" in r

def test_transfer_unknown_orb():
    m = get_fresh()
    r = m.orb_transfer("nope", "nope2", 100)
    assert "error" in r

def test_transfer_zero_amount():
    m = get_fresh()
    a = m.orb_create("A")
    b = m.orb_create("B")
    r = m.orb_transfer(a["orb"]["orb_id"], b["orb"]["orb_id"], 0)
    assert "error" in r

def test_inspect():
    m = get_fresh()
    a = m.orb_create("X")["orb"]["orb_id"]
    r = m.orb_inspect(a)
    assert r["orb"]["name"] == "X"

def test_inspect_unknown():
    m = get_fresh()
    r = m.orb_inspect("nope")
    assert "error" in r

def test_connect():
    m = get_fresh()
    a = m.orb_create("A")["orb"]["orb_id"]
    b = m.orb_create("B")["orb"]["orb_id"]
    r = m.orb_connect(a, b)
    assert r["total_channels"] == 1

def test_status():
    m = get_fresh()
    m.orb_create("A", water_amount=500)
    m.orb_create("B", water_amount=300)
    r = m.orb_status()
    assert r["total_orbs"] == 2
    assert r["total_water"] == 800

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.orb_create("x"), m.orb_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Create A → Create B → Connect → Transfer → Status."""
    m = get_fresh()
    a = m.orb_create("London Hive", orb_type="hive", water_amount=1000)["orb"]["orb_id"]
    b = m.orb_create("Twin", orb_type="twin", water_amount=500)["orb"]["orb_id"]
    r1 = m.orb_connect(a, b)
    assert r1["total_channels"] == 1
    r2 = m.orb_transfer(a, b, amount=200)
    assert r2["to_water"] == 700
    r3 = m.orb_status()
    assert r3["total_orbs"] == 2
    assert r3["total_transfers"] == 1
