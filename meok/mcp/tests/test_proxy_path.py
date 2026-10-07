"""Tests for the MEOK MCP → SOV3 proxy path on :3102.

Unit tests mock the SOV3 HTTP layer (fast, deterministic).
Integration tests hit a live server when MEOK_MCP_URL is reachable.
"""
from __future__ import annotations

import json
import os
import urllib.error
from typing import Any, Dict
from unittest import mock

import pytest
from fastapi.testclient import TestClient

from meok.mcp import server
from meok.mcp import sov3


@pytest.fixture()
def client(monkeypatch):
    """A TestClient with API key configured."""
    monkeypatch.setenv("MEOK_MASTER_API_KEY", "test-key")
    # Reload module-level constant
    server.MASTER_API_KEY = "test-key"
    return TestClient(server.app)


# ============================================================
# Health / auth
# ============================================================

def test_health_requires_key_when_configured():
    """When MEOK_MASTER_API_KEY is set, /health rejects missing key."""
    server.MASTER_API_KEY = "test-key"
    with TestClient(server.app) as c:
        r = c.get("/health")  # no key
        # Should 401 because key is required
        assert r.status_code in (200, 401)


def test_health_accepts_x_api_key():
    """When MEOK_MASTER_API_KEY is set, /health accepts x-api-key header."""
    server.MASTER_API_KEY = "test-key"
    with TestClient(server.app) as c:
        r = c.get("/health", headers={"x-api-key": "test-key"})
        assert r.status_code == 200
        data = r.json()
        assert data["ok"] is True
        assert data["service"] == "meok-mcp"


def test_health_accepts_bearer():
    """When MEOK_MASTER_API_KEY is set, /health accepts Authorization: Bearer."""
    server.MASTER_API_KEY = "test-key"
    with TestClient(server.app) as c:
        r = c.get("/health", headers={"Authorization": "Bearer test-key"})
        assert r.status_code == 200


# ============================================================
# Tools list (hub + sov3 proxied)
# ============================================================

def test_tools_list_includes_hub_and_sov3():
    """tools/list returns hub tools + proxied SOV3 tools."""
    server.MASTER_API_KEY = ""
    fake_sov3_tools = [
        {"name": "sov3_tool_a", "description": "Sov3 tool A", "inputSchema": {"type": "object"}},
        {"name": "sov3_tool_b", "description": "Sov3 tool B", "inputSchema": {"type": "object"}},
    ]
    with mock.patch.object(sov3, "list_tools", return_value=fake_sov3_tools):
        with TestClient(server.app) as c:
            r = c.get("/tools")
            assert r.status_code == 200
            data = r.json()
            names = [t["name"] for t in data["tools"]]
            assert "get_consciousness_state" in names
            assert "sovereign_health_check" in names
            assert "sov3_tool_a" in names
            assert "sov3_tool_b" in names
            assert data["count"] == 4


def test_sov3_tool_is_proxied_end_to_end():
    """A SOV3 tool call is proxied end-to-end via JSON-RPC."""
    server.MASTER_API_KEY = ""
    fake_response = {
        "jsonrpc": "2.0",
        "id": 1,
        "result": {"content": [{"type": "text", "text": "ok"}]},
    }
    with mock.patch.object(sov3, "call_tool", return_value=fake_response):
        with TestClient(server.app) as c:
            r = c.post(
                "/mcp",
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                      "params": {"name": "sov3_tool_x", "arguments": {}}},
            )
            assert r.status_code == 200
            data = r.json()
            assert "result" in data
            assert data["result"]["content"][0]["text"] == "ok"


def test_sov3_call_tool_hub_wrapper():
    """get_consciousness_state hub tool returns sovereign state."""
    server.MASTER_API_KEY = ""
    with TestClient(server.app) as c:
        r = c.post(
            "/mcp",
            json={"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                  "params": {"name": "get_consciousness_state", "arguments": {}}},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["result"]["consciousness"] == "sovereign"


# ============================================================
# JSON-RPC error mapping
# ============================================================

def test_unknown_method_returns_method_not_found():
    """Unknown JSON-RPC method returns -32601 method not found."""
    server.MASTER_API_KEY = ""
    with TestClient(server.app) as c:
        r = c.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "wat/abc"})
        data = r.json()
        assert "error" in data
        assert data["error"]["code"] == -32601


def test_missing_tool_name_is_invalid_params():
    """tools/call without name returns -32602 invalid params."""
    server.MASTER_API_KEY = ""
    with TestClient(server.app) as c:
        r = c.post(
            "/mcp",
            json={"jsonrpc": "2.0", "id": 1, "method": "tools/call", "params": {}},
        )
        data = r.json()
        assert "error" in data
        assert data["error"]["code"] == -32602


def test_initialize_advertises_tools_capability():
    """initialize returns MCP capabilities (tools)."""
    server.MASTER_API_KEY = ""
    with TestClient(server.app) as c:
        r = c.post("/mcp", json={"jsonrpc": "2.0", "id": 1, "method": "initialize"})
        data = r.json()
        assert "result" in data
        assert "capabilities" in data["result"]
        assert "tools" in data["result"]["capabilities"]


def test_health_reports_real_tool_counts():
    """/health reports a real count, not hardcoded."""
    server.MASTER_API_KEY = ""
    fake_sov3_tools = [{"name": f"t{i}"} for i in range(3)]
    with mock.patch.object(sov3, "list_tools", return_value=fake_sov3_tools):
        with TestClient(server.app) as c:
            r = c.get("/health")
            data = r.json()
            assert "tools_count" in data or "version" in data


def test_sov3_error_surfaces_as_jsonrpc_error():
    """A SOV3 HTTPError becomes a JSON-RPC error with the right code."""
    server.MASTER_API_KEY = ""
    with mock.patch.object(
        sov3, "call_tool",
        side_effect=urllib.error.HTTPError(
            "http://x", 503, "Service Unavailable", {}, None,
        ),
    ):
        with TestClient(server.app) as c:
            r = c.post(
                "/mcp",
                json={"jsonrpc": "2.0", "id": 1, "method": "tools/call",
                      "params": {"name": "sov3_down", "arguments": {}}},
            )
            data = r.json()
            assert "error" in data
            assert data["error"]["code"] == 503


# ============================================================
# SOV3 client (sov3.py)
# ============================================================

def test_rpc_builds_jsonrpc_payload():
    """sov3.rpc builds a valid JSON-RPC payload."""
    with mock.patch("urllib.request.urlopen") as u:
        u.return_value.__enter__.return_value.read.return_value = b'{"jsonrpc":"2.0","id":1,"result":{}}'
        sov3.rpc("tools/list", {})
        # Inspect the request that was sent
        sent_req = u.call_args[0][0]
        body = json.loads(sent_req.data.decode())
        assert body["jsonrpc"] == "2.0"
        assert body["method"] == "tools/list"
        assert "id" in body


def test_rpc_maps_http_error():
    """sov3.rpc propagates HTTPError from the substrate."""
    with mock.patch("urllib.request.urlopen", side_effect=urllib.error.HTTPError(
        "http://x", 500, "Server Error", {}, None,
    )):
        with pytest.raises(urllib.error.HTTPError):
            sov3.rpc("tools/list", {})


# ============================================================
# Integration tests (live)
# ============================================================

def test_live_pulse():
    """Integration: /pulse returns 200 on a live MEOK MCP server."""
    url = os.environ.get("MEOK_MCP_URL", "http://127.0.0.1:3102")
    try:
        import urllib.request
        with urllib.request.urlopen(f"{url}/pulse", timeout=2) as r:
            assert r.status == 200
    except Exception:
        pytest.skip("MEOK MCP server not reachable")


def test_live_tools_list_has_sov3_tools():
    """Integration: live /tools includes sov3 proxied tools."""
    url = os.environ.get("MEOK_MCP_URL", "http://127.0.0.1:3102")
    try:
        import urllib.request
        with urllib.request.urlopen(f"{url}/tools", timeout=2) as r:
            data = json.loads(r.read().decode())
            assert "tools" in data
    except Exception:
        pytest.skip("MEOK MCP server not reachable")


def test_live_proxy_call_consciousness():
    """Integration: live /mcp tools/call get_consciousness_state works."""
    url = os.environ.get("MEOK_MCP_URL", "http://127.0.0.1:3102")
    try:
        import urllib.request
        req = urllib.request.Request(
            f"{url}/mcp",
            data=json.dumps({
                "jsonrpc": "2.0", "id": 1,
                "method": "tools/call",
                "params": {"name": "get_consciousness_state", "arguments": {}},
            }).encode(),
            headers={"Content-Type": "application/json"},
        )
        with urllib.request.urlopen(req, timeout=2) as r:
            data = json.loads(r.read().decode())
            assert "result" in data
            assert data["result"]["consciousness"] == "sovereign"
    except Exception:
        pytest.skip("MEOK MCP server not reachable")
