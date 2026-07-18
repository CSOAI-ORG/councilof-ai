"""Tests for meok-sovereign-webhooks-mcp."""
import os, sys, tempfile, importlib
_TEST = tempfile.mkdtemp(prefix="sov_wh_")
os.environ["SOV_WH_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_webhooks_mcp" in sys.modules:
        del sys.modules["meok_sovereign_webhooks_mcp"]
    import meok_sovereign_webhooks_mcp as m
    importlib.reload(m)
    return m

def test_register():
    m = get_fresh()
    r = m.webhooks_register("https://example.com/hook")
    assert "webhook" in r

def test_register_no_url():
    m = get_fresh()
    r = m.webhooks_register("")
    assert "error" in r

def test_register_specific_events():
    m = get_fresh()
    r = m.webhooks_register("https://example.com/hook", events="user.created,sigil.anchored")
    assert "user.created" in r["webhook"]["events"]

def test_dispatch():
    m = get_fresh()
    m.webhooks_register("https://example.com/hook")
    r = m.webhooks_dispatch("user.created", '{"id": "user-1"}')
    assert r["dispatched"] == 1

def test_dispatch_no_event():
    m = get_fresh()
    r = m.webhooks_dispatch("", "data")
    assert "error" in r

def test_dispatch_no_match():
    m = get_fresh()
    m.webhooks_register("https://example.com/hook", events="user.created")
    r = m.webhooks_dispatch("sigil.anchored", "data")
    assert r["dispatched"] == 0

def test_dispatch_to_multiple():
    m = get_fresh()
    m.webhooks_register("https://a.com/hook")
    m.webhooks_register("https://b.com/hook")
    m.webhooks_register("https://c.com/hook")
    r = m.webhooks_dispatch("user.created", "data")
    assert r["dispatched"] == 3

def test_retry():
    m = get_fresh()
    m.webhooks_register("https://a.com/hook")
    dispatch = m.webhooks_dispatch("test", "data")
    delivery_id = dispatch["deliveries"][0]["delivery_id"]
    # Simulate failure
    delivery = m._DELIVERIES[0]
    delivery["status"] = "failed"
    r = m.webhooks_retry(delivery_id)
    assert "delivery" in r

def test_retry_no_id():
    m = get_fresh()
    r = m.webhooks_retry("")
    assert "error" in r

def test_retry_unknown():
    m = get_fresh()
    r = m.webhooks_retry("nope")
    assert "error" in r

def test_retry_already_delivered():
    m = get_fresh()
    m.webhooks_register("https://a.com/hook")
    dispatch = m.webhooks_dispatch("test", "data")
    delivery_id = dispatch["deliveries"][0]["delivery_id"]
    r = m.webhooks_retry(delivery_id)
    assert "Already" in r.get("doctrine", "")

def test_retry_max_retries():
    m = get_fresh()
    m.webhooks_register("https://a.com/hook")
    dispatch = m.webhooks_dispatch("test", "data")
    delivery_id = dispatch["deliveries"][0]["delivery_id"]
    delivery = m._DELIVERIES[0]
    delivery["status"] = "failed"
    delivery["attempts"] = 3
    r = m.webhooks_retry(delivery_id)
    assert "Max retries" in r.get("doctrine", "")

def test_list():
    m = get_fresh()
    m.webhooks_register("https://a.com/hook")
    r = m.webhooks_list()
    assert r["total_webhooks"] == 1

def test_status():
    m = get_fresh()
    r = m.webhooks_status()
    assert r["max_retries"] == 3

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.webhooks_register("https://a.com/hook")
    m.webhooks_dispatch("test", "data")
    for r in [m.webhooks_list(), m.webhooks_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Register → Dispatch → Retry → List → Status."""
    m = get_fresh()
    m.webhooks_register("https://example.com/hook", events="user.created,user.deleted")
    r1 = m.webhooks_dispatch("user.created", '{"id": "u1"}')
    assert r1["dispatched"] == 1
    delivery_id = r1["deliveries"][0]["delivery_id"]
    delivery = m._DELIVERIES[0]
    delivery["status"] = "failed"
    r2 = m.webhooks_retry(delivery_id)
    assert "delivery" in r2
    r3 = m.webhooks_list()
    assert r3["total_deliveries"] >= 1
    s = m.webhooks_status()
    assert s["total_deliveries"] >= 1
