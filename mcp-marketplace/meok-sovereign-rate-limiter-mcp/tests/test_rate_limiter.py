"""Tests for meok-sovereign-rate-limiter-mcp."""
import os, sys, tempfile, importlib, time
_TEST = tempfile.mkdtemp(prefix="sov_rl_")
os.environ["SOV_RL_KEY"] = _TEST + "/k.pem"

def get_fresh():
    if "meok_sovereign_rate_limiter_mcp" in sys.modules:
        del sys.modules["meok_sovereign_rate_limiter_mcp"]
    import meok_sovereign_rate_limiter_mcp as m
    importlib.reload(m)
    return m

def test_check():
    m = get_fresh()
    r = m.rl_check("citizen-1", 1)
    assert r["allowed"] is True

def test_check_no_entity():
    m = get_fresh()
    r = m.rl_check("", 1)
    assert "error" in r

def test_check_consumes_tokens():
    m = get_fresh()
    r1 = m.rl_check("citizen-1", 50)
    r2 = m.rl_check("citizen-1", 60)  # 50 + 60 > 100
    assert r1["allowed"] is True
    assert r2["allowed"] is False

def test_check_refills():
    m = get_fresh()
    m.rl_check("citizen-1", 100)  # Exhaust
    time.sleep(0.5)  # Wait for refill
    r = m.rl_check("citizen-1", 1)  # Should be allowed
    assert r["allowed"] is True

def test_set_quota():
    m = get_fresh()
    r = m.rl_set_quota("citizen-2", 100)
    assert r["capacity_per_hour"] == 100

def test_set_quota_no_entity():
    m = get_fresh()
    r = m.rl_set_quota("", 100)
    assert "error" in r

def test_quota_exhaustion():
    m = get_fresh()
    m.rl_set_quota("citizen-3", 5)
    for i in range(5):
        r = m.rl_check("citizen-3", 1)
        assert r["allowed"] is True
    r = m.rl_check("citizen-3", 1)  # Should be denied (quota exhausted)
    assert r["allowed"] is False

def test_status():
    m = get_fresh()
    r = m.rl_status()
    assert "total_entities" in r

def test_status_entity():
    m = get_fresh()
    m.rl_check("citizen-4", 1)
    r = m.rl_status("citizen-4")
    assert r["entity"] == "citizen-4"

def test_ddos_no_attack():
    m = get_fresh()
    r = m.rl_ddos("citizen-5", request_rate=50, threshold=100)
    assert r["ddos_detected"] is False

def test_ddos_attack():
    m = get_fresh()
    r = m.rl_ddos("citizen-6", request_rate=200, threshold=100, duration_seconds=60)
    assert r["ddos_detected"] is True
    assert r["blocked"] is True

def test_ddos_blocks_subsequent():
    m = get_fresh()
    m.rl_ddos("citizen-7", request_rate=200, threshold=100, duration_seconds=60)
    r = m.rl_check("citizen-7", 1)
    assert r["allowed"] is False

def test_ddos_no_entity():
    m = get_fresh()
    r = m.rl_ddos("", 100, 100)
    assert "error" in r

def test_reset():
    m = get_fresh()
    m.rl_check("citizen-8", 100)  # Exhaust
    m.rl_ddos("citizen-8", request_rate=200, threshold=100)
    m.rl_reset("citizen-8")
    r = m.rl_check("citizen-8", 1)
    assert r["allowed"] is True

def test_reset_no_entity():
    m = get_fresh()
    r = m.rl_reset("")
    assert "error" in r

def test_no_external_deps():
    m = get_fresh()
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src

def test_signed_outputs():
    m = get_fresh()
    m.rl_check("citizen-9", 1)
    for r in [m.rl_check("citizen-9", 1), m.rl_set_quota("citizen-9", 100),
              m.rl_status(), m.rl_ddos("citizen-9", 50, 100),
              m.rl_reset("citizen-9")]:
        assert "kid" in r and "sig" in r and "ts" in r

def test_full_workflow():
    """Check → Quota → DDoS → Reset → Status."""
    m = get_fresh()
    r1 = m.rl_check("citizen-10", 1)
    assert r1["allowed"] is True
    r2 = m.rl_set_quota("citizen-10", 5)
    assert r2["capacity_per_hour"] == 5
    r3 = m.rl_ddos("citizen-10", 50, 100)  # No DDoS
    assert r3["ddos_detected"] is False
    r4 = m.rl_ddos("citizen-10", 200, 100)  # DDoS!
    assert r4["blocked"] is True
    r5 = m.rl_reset("citizen-10")
    s = m.rl_status()
    assert "total_entities" in s
