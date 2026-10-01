"""Tests for the MEOK MCP → SOV3 proxy path on :3102.

Unit tests mock the SOV3 HTTP layer (fast, deterministic).
Integration tests hit a live server when MEOK_MCP_URL is reachable.
"""
from __future__ import annotations

import json
import os
import urllib.error
import urllib.request
from typing import Any, Dict

import pytest
from fastapi.testclient import TestClient

from meok.mcp import server, sov3


MASTER_KEY = os.environ.get("MEOK_MASTER_API_KEY", "test-key")
os.environ.setdefault("MEOK_MASTER_API_KEY", MASTER_KEY)

FAKE_TOOLS = [
    {
        "name": "get_consciousness_state",
        "description": "Consciousness state",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "sovereign_health_check",
        "description": "Health",
        "inputSchema": {"type": "object", "properties": {}},
    },
]


@pytest.fixture()
def client(monkeypatch: pytest.MonkeyPatch) -> TestClient:
    server.MASTER_KEY = MASTER_KEY
    return TestClient(server.app)


@pytest.fixture()
def fake_sov3(monkeypatch: pytest.MonkeyPatch) -> Dict[str, Any]:
    """Replace SOV3 HTTP calls with deterministic fixtures."""

    def _list_tools(timeout: float = 30.0) -> Dict[str, Any]:
        return {"ok": True, "count": len(FAKE_TOOLS), "tools": FAKE_TOOLS, "raw_error": None}

    def _call_tool(name: str, arguments: Dict[str, Any] | None = None, timeout: float = 30.0) -> Dict[str, Any]:
        return {
            "jsonrpc": "2.0",
            "id": 1,
            "result": {
                "content": [
                    {
                        "type": "text",
                        "text": json.dumps(
                            {
                                "called": name,
                                "arguments": arguments or {},
                                "source": "sov3-stub",
                            }
                        ),
                    }
                ]
            },
        }

    def _health(timeout: float = 8.0) -> Dict[str, Any]:
        return {
            "status_code": 200,
            "body": {
                "status": "healthy",
                "version": "2.0.0",
                "components": {
                    "neural_models": {"care_validation_nn": {"is_trained": True}},
                    "memory_store": "connected",
                },
            },
        }

    def _readyz(timeout: float = 5.0) -> Dict[str, Any]:
        return {
            "status_code": 200,
            "body": {
                "status": "ready",
                "checks": {"memory_store": True, "model_registry": True, "consciousness": True},
            },
        }

    def _summarize_health() -> Dict[str, Any]:
        return {
            "reachable": True,
            "status": "healthy",
            "version": "2.0.0",
            "readyz": _readyz()["body"],
            "model_count": 1,
            "models": ["care_validation_nn"],
            "memory_store": "connected",
            "consciousness_mode": "waking",
            "latency_ms": 12,
            "error": None,
        }

    monkeypatch.setattr(server.sov3, "list_tools", _list_tools)
    monkeypatch.setattr(server.sov3, "call_tool", _call_tool)
    monkeypatch.setattr(server.sov3, "health", _health)
    monkeypatch.setattr(server.sov3, "readyz", _readyz)
    monkeypatch.setattr(server.sov3, "summarize_health", _summarize_health)
    monkeypatch.setattr(server, "_meok_api_health", lambda timeout=4.0: {"up": True, "status_code": 200, "body": {"status": "ok"}})
    return {"tools": FAKE_TOOLS}


def _auth_headers() -> Dict[str, str]:
    return {"X-API-Key": MASTER_KEY}


class TestAuth:
    def test_health_requires_key_when_configured(self, client: TestClient, fake_sov3):
        assert client.get("/health").status_code == 401

    def test_health_accepts_x_api_key(self, client: TestClient, fake_sov3):
        resp = client.get("/health", headers=_auth_headers())
        assert resp.status_code == 200

    def test_health_accepts_bearer(self, client: TestClient, fake_sov3):
        resp = client.get("/health", headers={"Authorization": f"Bearer {MASTER_KEY}"})
        assert resp.status_code == 200


class TestProxyPath:
    def test_tools_list_includes_hub_and_sov3(self, client: TestClient, fake_sov3):
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={"jsonrpc": "2.0", "id": 1, "method": "tools/list"},
        )
        assert resp.status_code == 200
        tools = resp.json()["result"]["tools"]
        names = {t["name"] for t in tools}
        assert "meok_hub_status" in names
        assert "sov3_call_tool" in names
        assert "get_consciousness_state" in names
        assert len(tools) == server.HUB_TOOLS.__len__() + len(FAKE_TOOLS)

    def test_sov3_tool_is_proxied_end_to_end(self, client: TestClient, fake_sov3):
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={
                "jsonrpc": "2.0",
                "id": 2,
                "method": "tools/call",
                "params": {
                    "name": "get_consciousness_state",
                    "arguments": {"probe": True},
                },
            },
        )
        assert resp.status_code == 200
        body = resp.json()
        assert "error" not in body
        text = body["result"]["content"][0]["text"]
        payload = json.loads(text)
        assert payload["called"] == "get_consciousness_state"
        assert payload["arguments"] == {"probe": True}
        assert payload["source"] == "sov3-stub"

    def test_sov3_call_tool_hub_wrapper(self, client: TestClient, fake_sov3):
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={
                "jsonrpc": "2.0",
                "id": 3,
                "method": "tools/call",
                "params": {
                    "name": "sov3_call_tool",
                    "arguments": {
                        "name": "sovereign_health_check",
                        "arguments": {},
                    },
                },
            },
        )
        assert resp.status_code == 200
        payload = json.loads(resp.json()["result"]["content"][0]["text"])
        # sov3_call_tool unwraps the SOV3 JSON-RPC result (same as default proxy)
        inner = payload
        if isinstance(payload, dict) and "content" in payload:
            inner = json.loads(payload["content"][0]["text"])
        assert inner["called"] == "sovereign_health_check"

    def test_unknown_method_returns_method_not_found(self, client: TestClient, fake_sov3):
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={"jsonrpc": "2.0", "id": 4, "method": "resources/list"},
        )
        assert resp.status_code == 200
        assert resp.json()["error"]["code"] == -32601

    def test_missing_tool_name_is_invalid_params(self, client: TestClient, fake_sov3):
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={
                "jsonrpc": "2.0",
                "id": 5,
                "method": "tools/call",
                "params": {"arguments": {}},
            },
        )
        assert resp.json()["error"]["code"] == -32602

    def test_initialize_advertises_tools_capability(self, client: TestClient, fake_sov3):
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={"jsonrpc": "2.0", "id": 6, "method": "initialize", "params": {}},
        )
        result = resp.json()["result"]
        assert result["serverInfo"]["name"] == "meok-mcp"
        assert "tools" in result["capabilities"]

    def test_health_reports_real_tool_counts(self, client: TestClient, fake_sov3):
        resp = client.get("/health", headers=_auth_headers())
        data = resp.json()
        assert data["status"] == "ok"
        assert data["sov3"]["reachable"] is True
        assert data["mcp"]["hub_tools"] == len(server.HUB_TOOLS)
        assert data["mcp"]["sov3_tools"] == len(FAKE_TOOLS)
        assert data["mcp"]["total_tools"] == len(server.HUB_TOOLS) + len(FAKE_TOOLS)

    def test_sov3_error_surfaces_as_jsonrpc_error(self, client: TestClient, monkeypatch: pytest.MonkeyPatch, fake_sov3):
        def _boom(name, arguments=None, timeout=30.0):
            return {"error": "SOV3 unreachable: boom"}

        monkeypatch.setattr(server.sov3, "call_tool", _boom)
        resp = client.post(
            "/mcp",
            headers=_auth_headers(),
            json={
                "jsonrpc": "2.0",
                "id": 7,
                "method": "tools/call",
                "params": {"name": "get_consciousness_state", "arguments": {}},
            },
        )
        assert resp.json()["error"]["code"] == -32000


class TestSov3ClientUnit:
    def test_rpc_builds_jsonrpc_payload(self, monkeypatch: pytest.MonkeyPatch):
        captured: Dict[str, Any] = {}

        class _Resp:
            status = 200

            def read(self):
                return json.dumps({"jsonrpc": "2.0", "id": 1, "result": {"ok": True}}).encode()

            def __enter__(self):
                return self

            def __exit__(self, *args):
                return False

        def _urlopen(req, timeout=30):
            captured["url"] = req.full_url
            captured["body"] = json.loads(req.data.decode())
            return _Resp()

        monkeypatch.setattr(sov3.urllib.request, "urlopen", _urlopen)
        out = sov3.rpc("tools/list")
        assert out["result"]["ok"] is True
        assert captured["body"]["method"] == "tools/list"
        assert captured["body"]["jsonrpc"] == "2.0"
        assert captured["url"].endswith("/mcp")

    def test_rpc_maps_http_error(self, monkeypatch: pytest.MonkeyPatch):
        def _urlopen(req, timeout=30):
            raise urllib.error.HTTPError(req.full_url, 503, "unavailable", hdrs=None, fp=None)

        monkeypatch.setattr(sov3.urllib.request, "urlopen", _urlopen)
        out = sov3.rpc("tools/list")
        assert "SOV3 HTTP 503" in out["error"]


LIVE_URL = os.environ.get("MEOK_MCP_TEST_URL", "http://127.0.0.1:3102")


def _live_available() -> bool:
    try:
        urllib.request.urlopen(LIVE_URL + "/pulse", timeout=5)
        return True
    except Exception:
        return False


@pytest.mark.skipif(not _live_available(), reason="MEOK MCP not listening on MEOK_MCP_TEST_URL")
class TestLiveProxy:
    """Optional end-to-end checks against a running :3102 (requires MEOK_MASTER_API_KEY)."""

    def test_live_pulse(self):
        with urllib.request.urlopen(LIVE_URL + "/pulse", timeout=10) as resp:
            data = json.loads(resp.read().decode())
        assert data["service"] == "meok-mcp"
        assert data["status"] in {"alive", "degraded"}

    def test_live_tools_list_has_sov3_tools(self):
        key = os.environ.get("MEOK_MASTER_API_KEY", "")
        req = urllib.request.Request(
            LIVE_URL + "/mcp",
            data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": "tools/list"}).encode(),
            headers={"Content-Type": "application/json", "X-API-Key": key},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            tools = json.loads(resp.read().decode())["result"]["tools"]
        names = {t["name"] for t in tools}
        assert "meok_hub_status" in names
        assert "get_consciousness_state" in names
        assert len(tools) >= 100

    def test_live_proxy_call_consciousness(self):
        key = os.environ.get("MEOK_MASTER_API_KEY", "")
        req = urllib.request.Request(
            LIVE_URL + "/mcp",
            data=json.dumps(
                {
                    "jsonrpc": "2.0",
                    "id": 2,
                    "method": "tools/call",
                    "params": {"name": "get_consciousness_state", "arguments": {}},
                }
            ).encode(),
            headers={"Content-Type": "application/json", "X-API-Key": key},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=45) as resp:
            body = json.loads(resp.read().decode())
        assert "error" not in body
        payload = json.loads(body["result"]["content"][0]["text"])
        assert "consciousness_mode" in payload or "consciousness_level" in payload
