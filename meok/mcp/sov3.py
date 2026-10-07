"""SOV3 MCP client — HTTP JSON-RPC against the sovereign substrate on :3101.

Used by the MEOK MCP proxy to forward JSON-RPC calls to the sovereign substrate.
The proxy is the single audit chokepoint for every MCP call from external clients.
"""
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
SOV3_TIMEOUT = float(os.environ.get("SOV3_TIMEOUT", "30"))


def rpc(method: str, params: Optional[Dict[str, Any]] = None, timeout: float = SOV3_TIMEOUT) -> Dict[str, Any]:
    """Send a JSON-RPC request to the SOV3 substrate."""
    payload = {
        "jsonrpc": "2.0",
        "id": int(time.time() * 1000),
        "method": method,
    }
    if params is not None:
        payload["params"] = params
    req = urllib.request.Request(
        SOV3_MCP_URL,
        data=json.dumps(payload).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def health(timeout: float = SOV3_TIMEOUT) -> Dict[str, Any]:
    """Hit the SOV3 /health endpoint."""
    req = urllib.request.Request(SOV3_HEALTH_URL, method="GET")
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read().decode())


def readyz(timeout: float = SOV3_TIMEOUT) -> bool:
    """Hit the SOV3 /readyz endpoint, return True if ready."""
    try:
        req = urllib.request.Request(SOV3_READYZ_URL, method="GET")
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return resp.status == 200
    except Exception:
        return False


def list_tools(timeout: float = SOV3_TIMEOUT) -> list:
    """List tools exposed by the SOV3 MCP server."""
    result = rpc("tools/list", {}, timeout=timeout)
    return result.get("result", {}).get("tools", [])


def call_tool(name: str, arguments: Optional[Dict[str, Any]] = None, timeout: float = SOV3_TIMEOUT) -> Dict[str, Any]:
    """Call a tool on the SOV3 MCP server."""
    return rpc("tools/call", {"name": name, "arguments": arguments or {}}, timeout=timeout)


def summarize_health() -> Dict[str, Any]:
    """Return a summary of the SOV3 substrate health."""
    try:
        h = health()
        r = readyz()
        tools = list_tools()
        return {
            "healthy": r,
            "tools_count": len(tools),
            "raw": h,
        }
    except Exception as e:
        return {"healthy": False, "error": str(e), "tools_count": 0}
