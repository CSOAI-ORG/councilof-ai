"""Tests for meok-sovereign-bridge-mcp."""
import os, tempfile
_TEST = tempfile.mkdtemp(prefix="sov_brdg_")
os.environ["SOV_BRDG_KEY"] = _TEST + "/k.pem"
from meok_sovereign_bridge_mcp import (
    bridge_list, bridge_call, bridge_verify, bridge_route, bridge_stats,
    _BRIDGE_LOG, PROTOCOLS,
)


def reset():
    _BRIDGE_LOG.clear()


def test_22_protocols():
    assert len(PROTOCOLS) == 22


def test_bridge_list():
    r = bridge_list()
    assert r["total"] == 22


def test_bridge_call_mcp_to_http():
    reset()
    r = bridge_call("MCP", "HTTP", {"hello": "world"})
    assert r["status"] == "bridged"
    assert r["from"]["name"] == "MCP"


def test_bridge_call_invalid():
    reset()
    r = bridge_call("FAKE", "HTTP")
    assert "error" in r


def test_bridge_call_logs():
    reset()
    bridge_call("MCP", "A2A")
    bridge_call("A2A", "DID")
    assert len(_BRIDGE_LOG) == 2


def test_bridge_verify_valid():
    r = bridge_verify("MCP")
    assert r["verified"] is True


def test_bridge_verify_invalid():
    r = bridge_verify("FAKE")
    assert "error" in r


def test_bridge_route():
    reset()
    r = bridge_route("MCP", "JWT")
    assert r["status"] == "bridged"


def test_bridge_stats():
    reset()
    r = bridge_stats()
    assert r["total_protocols"] == 22
    assert r["total_calls"] == 0


def test_bridge_stats_after_calls():
    reset()
    bridge_call("MCP", "A2A")
    bridge_call("A2A", "DID")
    bridge_call("DID", "JWT")
    r = bridge_stats()
    assert r["total_calls"] == 3


def test_no_external_deps():
    import meok_sovereign_bridge_mcp as m
    src = open(m.__file__).read()
    for blocked in ["ollama", "requests", "urllib.request", "httpx"]:
        assert f"import {blocked}" not in src


def test_signed_outputs():
    for r in [bridge_list(), bridge_call("MCP", "HTTP"),
              bridge_verify("MCP"), bridge_route("MCP", "A2A"),
              bridge_stats()]:
        assert "kid" in r and "sig" in r and "ts" in r


def test_all_protocols_have_required_fields():
    for p in PROTOCOLS:
        assert "name" in p
        assert "version" in p
        assert "purpose" in p
        assert "port" in p
        assert "transport" in p


def test_canonical_22():
    names = [p["name"] for p in PROTOCOLS]
    assert "MCP" in names
    assert "A2A" in names
    assert "DID" in names
    assert "JWT" in names
    assert "x402" in names
    assert "Ed25519" in names or "ED" in names


def test_full_workflow():
    """List → Call → Verify → Route → Stats."""
    reset()
    l = bridge_list()
    assert l["total"] == 22
    c = bridge_call("MCP", "A2A", {"subject": "sovereign"})
    assert c["status"] == "bridged"
    v = bridge_verify("MCP")
    assert v["verified"] is True
    r = bridge_route("MCP", "JWT")
    assert r["status"] == "bridged"
    s = bridge_stats()
    assert s["total_calls"] >= 2
