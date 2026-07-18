"""Tests for meok-sovereign-rpc-bus-mcp (12 Generals + 33 Hives)."""
import os, tempfile
_TEST_DIR = tempfile.mkdtemp(prefix="sov_rpc_test_")
os.environ["SOV_RPC_KEY"] = os.path.join(_TEST_DIR, "key.pem")
from meok_sovereign_rpc_bus_mcp import (
    rpc_call, rpc_broadcast, rpc_register, rpc_keepalive, rpc_status,
    GENERALS, HIVES, _HANDLERS, _LOG,
)


def reset_rpc():
    _HANDLERS.clear()
    _LOG.clear()


def test_12_generals():
    assert len(GENERALS) == 12
    assert "dragon" in GENERALS
    assert "scribe" in GENERALS


def test_33_hives():
    assert len(HIVES) == 33
    assert "london" in HIVES
    assert "tokyo" in HIVES


def test_call_valid():
    reset_rpc()
    r = rpc_call("dragon", "audit_eu_ai_act", {"code": "test"})
    assert r["target"] == "dragon"
    assert r["method"] == "audit_eu_ai_act"
    assert r["response"]["status"] in ["OK", "SIMULATED"]


def test_call_invalid_target():
    reset_rpc()
    r = rpc_call("hacker", "test")
    assert "error" in r


def test_call_with_handler():
    reset_rpc()
    rpc_register("dragon", "test_handler")
    r = rpc_call("dragon", "test_handler", {"x": 1})
    assert r["response"]["status"] == "OK"
    assert r["response"]["result"]["method"] == "test_handler"


def test_broadcast_all_33():
    reset_rpc()
    r = rpc_broadcast("audit_update", {"new_version": "1.0"})
    assert r["hive_count"] == 33
    assert len(r["responses"]) == 33


def test_register_valid():
    reset_rpc()
    r = rpc_register("dragon", "test_method")
    assert r["registered"] is True
    assert "test_method" in _HANDLERS["dragon"]


def test_register_invalid():
    reset_rpc()
    r = rpc_register("hacker", "test")
    assert "error" in r


def test_keepalive_alive():
    reset_rpc()
    r = rpc_keepalive("dragon")
    assert r["status"] == "ALIVE"
    assert r["latency_ms"] >= 0


def test_keepalive_invalid():
    reset_rpc()
    r = rpc_keepalive("hacker")
    assert "error" in r


def test_status_summary():
    reset_rpc()
    r = rpc_status()
    assert r["general_count"] == 12
    assert r["hive_count"] == 33


def test_no_external_deps():
    import meok_sovereign_rpc_bus_mcp as m
    src = open(m.__file__).read()
    assert "import ollama" not in src
    assert "import urllib" not in src
    assert "import requests" not in src


def test_signed_outputs():
    reset_rpc()
    r1 = rpc_call("dragon", "test")
    assert "kid" in r1 and "sig" in r1 and "ts" in r1
    r2 = rpc_broadcast("test")
    assert "kid" in r2 and "sig" in r2 and "ts" in r2
    r3 = rpc_register("dragon", "test")
    assert "kid" in r3 and "sig" in r3 and "ts" in r3
    r4 = rpc_keepalive("dragon")
    assert "kid" in r4 and "sig" in r4 and "ts" in r4
    r5 = rpc_status()
    assert "kid" in r5 and "sig" in r5 and "ts" in r5


def test_log_tracks_calls():
    reset_rpc()
    rpc_call("dragon", "test1")
    rpc_call("scribe", "test2")
    rpc_broadcast("test3")
    r = rpc_status()
    assert r["log_count"] == 3


def test_keepalive_for_hive():
    """Keepalive should work for hives too."""
    r = rpc_keepalive("tokyo")
    assert r["status"] == "ALIVE"


def test_call_all_12_generals():
    """Every General can be called."""
    for g in GENERALS:
        r = rpc_call(g, "heartbeat")
        assert "error" not in r


def test_call_all_33_hives():
    """Every Hive can be called."""
    for h in HIVES:
        r = rpc_call(h, "heartbeat")
        assert "error" not in r


def test_simulation_fallback():
    """When no handler registered, falls back to SIMULATED."""
    reset_rpc()
    r = rpc_call("dragon", "unknown_method")
    assert r["response"]["status"] == "SIMULATED"