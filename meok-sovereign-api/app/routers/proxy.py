"""
Proxy router — forwards requests to existing MEOK backend services.
This allows the marketing frontend to talk to one unified API while
we gradually migrate functionality into the sovereign API.

Targets:
- SOV3 Temple API (consciousness, council, expertise, bridges, memory, learning, dreams)
- MEOK Dashboard API (hatch, neural inference, RAG memory search)
- MCP Monetization Gateway (billing, subscriptions, server registry)
"""

import os
from typing import Any

import httpx
from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse

router = APIRouter(prefix="/proxy", tags=["proxy"])

SOV3_BASE = os.getenv("SOV3_URL", "http://localhost:8888")
MCP_BASE = os.getenv("MCP_GATEWAY_URL", "http://localhost:8000")

_client: httpx.AsyncClient | None = None


def _get_client() -> httpx.AsyncClient:
    global _client
    if _client is None:
        _client = httpx.AsyncClient(timeout=10.0)
    return _client


async def _proxy(method: str, base: str, path: str, request: Request, body: Any = None):
    """Forward a request to an upstream service."""
    url = f"{base}{path}"
    headers = {}
    auth = request.headers.get("authorization")
    if auth:
        headers["Authorization"] = auth
    api_key = request.headers.get("x-api-key")
    if api_key:
        headers["X-API-Key"] = api_key

    client = _get_client()
    try:
        if method == "GET":
            resp = await client.get(url, headers=headers, params=dict(request.query_params))
        elif method == "POST":
            resp = await client.post(url, headers=headers, json=body)
        else:
            raise HTTPException(status_code=405, detail="Method not allowed")

        # Try to parse JSON; fallback to text
        content_type = resp.headers.get("content-type", "")
        if "application/json" in content_type:
            try:
                data = resp.json()
            except Exception:
                data = {"upstream_text": resp.text, "upstream_status": resp.status_code}
        else:
            data = {"upstream_text": resp.text, "upstream_status": resp.status_code}

        return JSONResponse(content=data, status_code=resp.status_code if resp.status_code < 500 else 502)

    except httpx.ConnectError:
        raise HTTPException(status_code=503, detail=f"Upstream service unavailable: {base}")
    except httpx.TimeoutException:
        raise HTTPException(status_code=504, detail=f"Upstream service timeout: {base}")
    except httpx.RequestError as exc:
        raise HTTPException(status_code=503, detail=f"Upstream error: {exc}")


# ─── Consciousness & Council ──────────────────────────────────

@router.get("/consciousness")
async def proxy_consciousness(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/consciousness", request)


@router.get("/council/status")
async def proxy_council_status(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/council/status", request)


@router.post("/council/propose")
async def proxy_council_propose(request: Request):
    body = await request.json()
    return await _proxy("POST", SOV3_BASE, "/api/council/propose", request, body)


@router.get("/council/history")
async def proxy_council_history(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/council/history", request)


# ─── Memory ───────────────────────────────────────────────────

@router.post("/memory/search")
async def proxy_memory_search(request: Request):
    body = await request.json()
    return await _proxy("POST", SOV3_BASE, "/api/memory/search", request, body)


@router.post("/memory/store")
async def proxy_memory_store(request: Request):
    body = await request.json()
    return await _proxy("POST", SOV3_BASE, "/api/memory/store", request, body)


@router.get("/memory/collections")
async def proxy_memory_collections(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/memory/collections", request)


# ─── Intelligence ─────────────────────────────────────────────

@router.get("/intelligence")
async def proxy_intelligence(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/intelligence", request)


@router.get("/intelligence/matrix")
async def proxy_intelligence_matrix(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/intelligence/matrix", request)


# ─── Dreams & Learning ────────────────────────────────────────

@router.get("/dreams")
async def proxy_dreams(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/dreams", request)


@router.get("/learning/status")
async def proxy_learning_status(request: Request):
    return await _proxy("GET", SOV3_BASE, "/api/learning/status", request)


# ─── MCP Gateway ──────────────────────────────────────────────

@router.get("/mcp/servers")
async def proxy_mcp_servers(request: Request):
    return await _proxy("GET", MCP_BASE, "/servers", request)
