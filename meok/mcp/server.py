"""MEOK MCP — hub MCP server on :3102, backed by live SOV3 (:3101).

Launch (hive / launchd contract):
  cd /Users/nicholas/clawd && MEOK_MCP__PORT=3102 python -m meok.mcp.server

Endpoints
  GET  /health   — real multi-service health (SOV3 + MEOK API + tool count)
  GET  /pulse    — lightweight heartbeat
  POST /mcp      — JSON-RPC tools/list and tools/call (SOV3-backed)
  GET  /tools    — same tool list as a plain HTTP GET
"""
from __future__ import annotations

import os
import time
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from meok.mcp import sov3

PORT = int(os.environ.get("MEOK_MCP__PORT") or os.environ.get("PORT") or "3102")
HOST = os.environ.get("MEOK_MCP__HOST") or "127.0.0.1"
MASTER_KEY = os.environ.get("MEOK_MASTER_API_KEY", "")
MEOK_API_URL = os.environ.get("MEOK_API_URL", "http://127.0.0.1:3200")
STARTED_AT = time.time()

app = FastAPI(title="MEOK MCP", version="0.2.0", description="MEOK hub MCP backed by SOV3")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Hub-level tools owned by MEOK MCP (SOV3 tools are proxied under sov3_*)
HUB_TOOLS: List[Dict[str, Any]] = [
    {
        "name": "meok_hub_status",
        "description": "Live MEOK hub status: SOV3 health, MEOK API, MCP tool counts, uptime.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "sov3_health",
        "description": "Full SOV3 /health payload from the sovereign substrate on :3101.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "sov3_readyz",
        "description": "SOV3 readiness checks (memory_store, model_registry, consciousness).",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "sov3_list_tools",
        "description": "List every tool exposed by the SOV3 MCP endpoint.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "sov3_call_tool",
        "description": "Call a SOV3 MCP tool by name with JSON arguments.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "name": {"type": "string", "description": "SOV3 tool name"},
                "arguments": {"type": "object", "description": "Tool arguments"},
            },
            "required": ["name"],
        },
    },
]


def _auth(x_api_key: Optional[str], authorization: Optional[str]) -> None:
    """Accept X-API-Key (hub-bridge) or Authorization: Bearer (default)."""
    if not MASTER_KEY:
        return
    provided = x_api_key or ""
    if not provided and authorization:
        provided = authorization.removeprefix("Bearer ").strip()
    if provided != MASTER_KEY:
        raise HTTPException(status_code=401, detail="unauthorized")


def _meok_api_health(timeout: float = 4.0) -> Dict[str, Any]:
    import json
    import urllib.request

    url = f"{MEOK_API_URL}/api/health"
    try:
        with urllib.request.urlopen(url, timeout=timeout) as resp:
            return {"url": url, "status_code": resp.status, "body": json.loads(resp.read().decode("utf-8"))}
    except Exception as e:
        return {"url": url, "error": str(e)}


def sov3_timeout() -> float:
    return float(os.environ.get("SOV3_TIMEOUT", "30"))


def _health_payload() -> Dict[str, Any]:
    sov = sov3.summarize_health()
    try:
        tools = sov3.list_tools(timeout=sov3_timeout())
        tool_count = tools.get("count", 0)
        tool_error = tools.get("raw_error")
    except Exception as e:
        tool_count = 0
        tool_error = str(e)

    api = _meok_api_health()
    api_up = api.get("status_code") == 200
    sov_up = bool(sov.get("reachable"))

    status = "ok" if sov_up and api_up else ("degraded" if sov_up or api_up else "down")
    return {
        "status": status,
        "service": "meok-mcp",
        "version": "0.2.0",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "uptime_sec": round(time.time() - STARTED_AT, 1),
        "port": PORT,
        "sov3": sov,
        "meok_api": {"up": api_up, **api},
        "mcp": {
            "hub_tools": len(HUB_TOOLS),
            "sov3_tools": tool_count,
            "total_tools": len(HUB_TOOLS) + tool_count,
            "error": tool_error,
        },
    }


@app.get("/health")
def health(x_api_key: Optional[str] = Header(default=None), authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    _auth(x_api_key, authorization)
    return _health_payload()


@app.get("/pulse")
def pulse() -> Dict[str, Any]:
    # Heartbeat stays cheap: readyz only, short timeout (full health is /health).
    ready = sov3.readyz(timeout=2.0)
    ready_body = ready.get("body") or {}
    sov_ok = ready.get("status_code") == 200
    return {
        "status": "alive" if sov_ok else "degraded",
        "service": "meok-mcp",
        "mode": "hub",
        "uptime_sec": round(time.time() - STARTED_AT, 1),
        "sov3_readyz": ready_body.get("status"),
        "checks": ready_body.get("checks") or {},
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
    }


@app.get("/tools")
def tools_http(x_api_key: Optional[str] = Header(default=None), authorization: Optional[str] = Header(default=None)) -> Dict[str, Any]:
    _auth(x_api_key, authorization)
    remote = sov3.list_tools()
    return {
        "hub_tools": HUB_TOOLS,
        "sov3_tools": remote.get("tools") or [],
        "counts": {"hub": len(HUB_TOOLS), "sov3": remote.get("count", 0)},
    }


async def _handle_mcp(body: Dict[str, Any]) -> Dict[str, Any]:
    method = body.get("method")
    req_id = body.get("id", 1)
    params = body.get("params") or {}

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": req_id,
            "result": {
                "protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "meok-mcp", "version": "0.2.0"},
            },
        }

    if method in ("ping", "notifications/initialized"):
        return {"jsonrpc": "2.0", "id": req_id, "result": {}}

    if method == "tools/list":
        remote = sov3.list_tools()
        sov3_tools = remote.get("tools") or []
        return {"jsonrpc": "2.0", "id": req_id, "result": {"tools": HUB_TOOLS + sov3_tools}}

    if method == "tools/call":
        name = (params.get("name") or "").strip()
        arguments = params.get("arguments") or {}
        if not name:
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32602, "message": "missing tool name"}}

        if name == "meok_hub_status":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": __import__("json").dumps(_health_payload())}]}}
        if name == "sov3_health":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": __import__("json").dumps(sov3.health())}]}}
        if name == "sov3_readyz":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": __import__("json").dumps(sov3.readyz())}]}}
        if name == "sov3_list_tools":
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": __import__("json").dumps(sov3.list_tools())}]}}
        if name == "sov3_call_tool":
            target = arguments.get("name")
            if not target:
                return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32602, "message": "missing sov3 tool name"}}
            proxied = sov3.call_tool(target, arguments.get("arguments") or {})
            # Unwrap JSON-RPC envelope the same way the default proxy path does.
            result = proxied.get("result") if isinstance(proxied, dict) else None
            payload = result if result is not None else proxied
            return {"jsonrpc": "2.0", "id": req_id, "result": {"content": [{"type": "text", "text": __import__("json").dumps(payload)}]}}

        # Default: proxy to SOV3 (so hub clients can call substrate tools directly)
        proxied = sov3.call_tool(name, arguments)
        if "error" in proxied and "result" not in proxied:
            return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32000, "message": str(proxied.get("error"))}}
        return {"jsonrpc": "2.0", "id": req_id, "result": proxied.get("result") or proxied}

    return {"jsonrpc": "2.0", "id": req_id, "error": {"code": -32601, "message": f"method not found: {method}"}}


@app.post("/mcp")
async def mcp_endpoint(
    request: Request,
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> Any:
    _auth(x_api_key, authorization)
    try:
        body = await request.json()
    except Exception:
        raise HTTPException(status_code=400, detail="invalid JSON-RPC body") from None
    if isinstance(body, list):
        return [await _handle_mcp(item) for item in body]
    return await _handle_mcp(body)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host=HOST, port=PORT, log_level=os.environ.get("MEOK_MCP__LOG_LEVEL", "info"))
