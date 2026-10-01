"""SOV3 MCP client — HTTP JSON-RPC against the sovereign substrate on :3101."""
from __future__ import annotations

import json
import os
import time
import urllib.error
import urllib.request
from typing import Any, Dict, Optional

SOV3_MCP_URL = os.environ.get("SOV3_MCP_URL", "http://127.0.0.1:3101/mcp")
SOV3_HEALTH_URL = os.environ.get("SOV3_HEALTH_URL", "http://127.0.0.1:3101/health")
SOV3_READYZ_URL = os.environ.get("SOV3_READYZ_URL", "http://127.0.0.1:3101/readyz")
DEFAULT_TIMEOUT = float(os.environ.get("SOV3_TIMEOUT", "30"))


def rpc(method: str, params: Optional[Dict[str, Any]] = None, timeout: float = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    payload: Dict[str, Any] = {"jsonrpc": "2.0", "id": 1, "method": method}
    if params is not None:
        payload["params"] = params
    req = urllib.request.Request(
        SOV3_MCP_URL,
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json", "Accept": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        return {"error": f"SOV3 HTTP {e.code}: {e.reason}"}
    except Exception as e:
        return {"error": f"SOV3 unreachable: {type(e).__name__}: {e}"}


def health(timeout: float = 8.0) -> Dict[str, Any]:
    out: Dict[str, Any] = {"url": SOV3_HEALTH_URL}
    try:
        with urllib.request.urlopen(SOV3_HEALTH_URL, timeout=timeout) as resp:
            out["status_code"] = resp.status
            out["body"] = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        out["error"] = str(e)
    return out


def readyz(timeout: float = 5.0) -> Dict[str, Any]:
    out: Dict[str, Any] = {"url": SOV3_READYZ_URL}
    try:
        with urllib.request.urlopen(SOV3_READYZ_URL, timeout=timeout) as resp:
            out["status_code"] = resp.status
            out["body"] = json.loads(resp.read().decode("utf-8"))
    except Exception as e:
        out["error"] = str(e)
    return out


def list_tools(timeout: float = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    res = rpc("tools/list", timeout=timeout)
    tools = (res.get("result") or {}).get("tools") or []
    return {"ok": "error" not in res, "count": len(tools), "tools": tools, "raw_error": res.get("error")}


def call_tool(name: str, arguments: Optional[Dict[str, Any]] = None, timeout: float = DEFAULT_TIMEOUT) -> Dict[str, Any]:
    return rpc("tools/call", {"name": name, "arguments": arguments or {}}, timeout=timeout)


def summarize_health() -> Dict[str, Any]:
    """Live SOV3 health summary used by MEOK /health."""
    started = time.time()
    h = health()
    r = readyz()
    body = h.get("body") or {}
    ready = (r.get("body") or {})
    components = body.get("components") or {}
    models = components.get("neural_models") or {}
    return {
        "reachable": "error" not in h and h.get("status_code") == 200,
        "status": body.get("status"),
        "version": body.get("version"),
        "readyz": ready,
        "model_count": len(models) if isinstance(models, dict) else 0,
        "models": sorted(models.keys()) if isinstance(models, dict) else [],
        "memory_store": (components.get("memory_store") if isinstance(components, dict) else None),
        "consciousness_mode": body.get("consciousness_mode") or body.get("mode"),
        "latency_ms": int((time.time() - started) * 1000),
        "error": h.get("error") or r.get("error"),
    }
