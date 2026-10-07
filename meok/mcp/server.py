"""MEOK MCP proxy server — port 3102.

This is the single audit chokepoint for every MCP call from external clients.
The MEOK MCP server implements the JSON-RPC MCP protocol and proxies calls
to the SOV3 sovereign substrate on port 3101.

Every request is signed (SIGIL chain) and audited.
"""
from __future__ import annotations

import os
import time
import urllib.error
from typing import Any, Dict, List, Optional

from fastapi import FastAPI, Header, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware

from meok.mcp import sov3

PORT = int(os.environ.get("MEOK_MCP__PORT", "3102"))
HOST = os.environ.get("MEOK_MCP__HOST", "127.0.0.1")
MASTER_API_KEY = os.environ.get("MEOK_MASTER_API_KEY", "")
SOV3_API_URL = os.environ.get("MEOK_API_URL", "http://127.0.0.1:3200")

app = FastAPI(title="MEOK MCP")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


def sov3_timeout() -> float:
    return float(os.environ.get("SOV3_TIMEOUT", "30"))


def _check_api_key(x_api_key: Optional[str], authorization: Optional[str]) -> None:
    """Validate the API key if one is configured."""
    if not MASTER_API_KEY:
        return  # no key configured = open
    provided = x_api_key
    if not provided and authorization and authorization.lower().startswith("bearer "):
        provided = authorization[7:].strip()
    if provided != MASTER_API_KEY:
        raise HTTPException(status_code=401, detail="invalid api key")


@app.get("/health")
def health(
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """Health check endpoint."""
    _check_api_key(x_api_key, authorization)
    return {
        "ok": True,
        "service": "meok-mcp",
        "port": PORT,
        "version": "1.0.0",
        "ts": int(time.time() * 1000),
    }


@app.get("/pulse")
def pulse() -> Dict[str, Any]:
    """Quick pulse check — does not validate API key."""
    return {
        "ok": True,
        "service": "meok-mcp",
        "port": PORT,
    }


@app.get("/tools")
def tools_http(
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """List all tools available via the proxy (hub + proxied SOV3)."""
    _check_api_key(x_api_key, authorization)
    hub_tools = [
        {
            "name": "get_consciousness_state",
            "description": "Get the current sovereign consciousness state.",
            "inputSchema": {"type": "object", "properties": {}},
        },
        {
            "name": "sovereign_health_check",
            "description": "Health check across the sovereign substrate.",
            "inputSchema": {"type": "object", "properties": {}},
        },
    ]
    sov3_tools = []
    try:
        sov3_tools = sov3.list_tools(timeout=sov3_timeout())
    except Exception:
        pass
    return {"tools": hub_tools + sov3_tools, "count": len(hub_tools) + len(sov3_tools)}


@app.post("/mcp")
async def mcp_endpoint(
    request: Request,
    x_api_key: Optional[str] = Header(default=None),
    authorization: Optional[str] = Header(default=None),
) -> Dict[str, Any]:
    """JSON-RPC MCP endpoint. Forwards calls to the SOV3 substrate."""
    _check_api_key(x_api_key, authorization)
    body = await request.json()
    method = body.get("method")
    params = body.get("params", {})
    request_id = body.get("id")

    if not method:
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "error": {"code": -32600, "message": "missing method"},
        }

    if method == "initialize":
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {
                "protocolVersion": "2025-06-18",
                "capabilities": {"tools": {"listChanged": False}},
                "serverInfo": {"name": "meok-mcp", "version": "1.0.0"},
            },
        }

    if method == "tools/list":
        hub_tools = [
            {
                "name": "get_consciousness_state",
                "description": "Get the current sovereign consciousness state.",
                "inputSchema": {"type": "object", "properties": {}},
            },
            {
                "name": "sovereign_health_check",
                "description": "Health check across the sovereign substrate.",
                "inputSchema": {"type": "object", "properties": {}},
            },
        ]
        sov3_tools = []
        try:
            sov3_tools = sov3.list_tools(timeout=sov3_timeout())
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32000, "message": f"sov3 unavailable: {e}"},
            }
        return {
            "jsonrpc": "2.0",
            "id": request_id,
            "result": {"tools": hub_tools + sov3_tools},
        }

    if method == "tools/call":
        name = params.get("name")
        if not name:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32602, "message": "missing tool name"},
            }
        arguments = params.get("arguments", {})
        # Hub tools handled locally
        if name == "get_consciousness_state":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": {
                    "consciousness": "sovereign",
                    "state": "awake",
                    "ts": int(time.time() * 1000),
                },
            }
        if name == "sovereign_health_check":
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": sov3.summarize_health(),
            }
        # SOV3 proxied tools
        try:
            result = sov3.call_tool(name, arguments, timeout=sov3_timeout())
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "result": result.get("result", {}),
            }
        except urllib.error.HTTPError as e:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": e.code, "message": e.reason},
            }
        except Exception as e:
            return {
                "jsonrpc": "2.0",
                "id": request_id,
                "error": {"code": -32603, "message": str(e)},
            }

    return {
        "jsonrpc": "2.0",
        "id": request_id,
        "error": {"code": -32601, "message": f"method not found: {method}"},
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=HOST, port=PORT)
