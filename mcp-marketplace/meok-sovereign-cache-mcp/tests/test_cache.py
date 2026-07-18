"""Tests for meok-sovereign-cache-mcp."""
import os, sys, tempfile, importlib, time
_TEST = tempfile.mkdtemp(prefix="sov_cache_")
os.environ["SOV_CACHE_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_cache_mcp" in sys.modules:
        del sys.modules["meok_sovereign_cache_mcp"]
    import meok_sovereign_cache_mcp as m
    importlib.reload(m)
    return m

def test_set():
    m = get_fresh()
    r = m.cache_set("key1", "value1")
    assert r["key"] == "key1"

def test_set_no_key():
    m = get_fresh()
    r = m.cache_set("", "value")
    assert "error" in r

def test_get_hit():
    m = get_fresh()
    m.cache_set("key1", "value1")
    r = m.cache_get("key1")
    assert r["hit"] is True
    assert r["value"] == "value1"

def test_get_miss():
    m = get_fresh()
    r = m.cache_get("nope")
    assert r["hit"] is False

def test_get_no_key():
    m = get_fresh()
    r = m.cache_get("")
    assert "error" in r

def test_ttl():
    m = get_fresh()
    m.cache_set("key-ttl", "value", ttl_seconds=1)
    r1 = m.cache_get("key-ttl")
    assert r1["hit"] is True
    time.sleep(1.5)
    r2 = m.cache_get("key-ttl")
    assert r2["hit"] is False  # Expired

def test_delete():
    m = get_fresh()
    m.cache_set("key2", "value")
    r = m.cache_delete("key2")
    assert r["deleted"] is True

def test_delete_no_key():
    m = get_fresh()
    r = m.cache_delete("")
    assert "error" in r

def test_delete_unknown():
    m = get_fresh()
    r = m.cache_delete("nope")
    assert r["deleted"] is False

def test_invalidate_prefix():
    m = get_fresh()
    m.cache_set("user:1", "alice")
    m.cache_set("user:2", "bob")
    m.cache_set("post:1", "post1")
    r = m.cache_invalidate("user:")
    assert r["invalidated"] == 2

def test_invalidate_no_prefix():
    m = get_fresh()
    r = m.cache_invalidate("")
    assert "error" in r

def test_status():
    m = get_fresh()
    m.cache_set("a", "1")
    m.cache_set("b", "2")
    m.cache_get("a")  # 1 hit
    r = m.cache_status()
    assert r["total_keys"] == 2

def test_lru_eviction():
    """When MAX_CACHE_SIZE is reached, oldest gets evicted."""
    m = get_fresh()
    # Set many keys
    for i in range(1005):
        m.cache_set(f"key-{i}", f"value-{i}")
    # Cache should be at MAX_CACHE_SIZE (1000)
    assert m.cache_status()["total_keys"] <= 1000

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    for r in [m.cache_set("x", "y"), m.cache_get("x"),
              m.cache_delete("x"), m.cache_status()]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Set → Get → Delete → Invalidate → Status."""
    m = get_fresh()
    m.cache_set("k1", "v1")
    m.cache_set("k2", "v2")
    m.cache_set("k3", "v3", ttl_seconds=1)
    assert m.cache_get("k1")["hit"] is True
    assert m.cache_get("k2")["hit"] is True
    m.cache_delete("k1")
    assert m.cache_get("k1")["hit"] is False
    m.cache_invalidate("k")
    assert m.cache_get("k2")["hit"] is False
    s = m.cache_status()
    assert s["hits"] >= 2
