#!/usr/bin/env python3
"""Generic SSE bridge for low-level mcp.server.Server instances.

Usage from a repo directory:
    python /path/to/mcp-sse-bridge.py

This imports `server` from `server.py` and exposes it over SSE,
with well-known MCP discovery endpoints and a health check.
"""

import json
import sys
import os

sys.path.insert(0, os.path.expanduser("~/clawd/meok-labs-engine/shared"))
sys.path.insert(0, os.getcwd())

from server import server as mcp_server

from starlette.applications import Starlette
from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from starlette.routing import Mount, Route
from mcp.server.sse import SseServerTransport


SERVICE_NAME = os.path.basename(os.getcwd())
REPO_URL = f"https://github.com/CSOAI-ORG/{SERVICE_NAME}"

SSE_PATH = "/sse"
MESSAGE_PATH = "/messages/"

sse = SseServerTransport(MESSAGE_PATH)


async def handle_sse(scope, receive, send):
    async with sse.connect_sse(scope, receive, send) as streams:
        await mcp_server.run(
            streams[0],
            streams[1],
            mcp_server.create_initialization_options(),
        )


async def sse_endpoint(request: Request) -> Response:
    return await handle_sse(request.scope, request.receive, request._send)


async def messages_endpoint(scope, receive, send):
    await sse.handle_post_message(scope, receive, send)


async def server_card(request: Request) -> Response:
    return JSONResponse(
        {
            "$schema": "https://schema.smithery.ai/server-card.json",
            "version": "1.0.0",
            "protocolVersion": "2025-11-25",
            "serverInfo": {
                "name": SERVICE_NAME,
                "description": f"MEOK AI Labs — {SERVICE_NAME}",
                "vendor": "MEOK AI Labs",
                "homepage": "https://meok.ai",
                "repository": REPO_URL,
            },
            "transport": {
                "type": "sse",
                "url": "http://localhost:8000/sse",
            },
            "capabilities": {
                "tools": {"listChanged": False},
                "resources": {"listChanged": False},
                "prompts": {"listChanged": False},
            },
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    )


async def mcp_manifest(request: Request) -> Response:
    return JSONResponse(
        {
            "mcp_version": "2025-11-25",
            "endpoints": [
                {"type": "sse", "path": "/sse", "url": "http://localhost:8000/sse"},
                {"type": "messages", "path": "/messages/"},
            ],
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    )


async def health(request: Request) -> Response:
    return JSONResponse({"status": "ok"})


app = Starlette(
    routes=[
        Route("/.well-known/mcp/server-card.json", endpoint=server_card, methods=["GET"]),
        Route("/.well-known/mcp", endpoint=mcp_manifest, methods=["GET"]),
        Route("/health", endpoint=health, methods=["GET"]),
        Route(SSE_PATH, endpoint=sse_endpoint, methods=["GET"]),
        Mount(MESSAGE_PATH, app=messages_endpoint),
    ],
)

if __name__ == "__main__":
    import uvicorn
    host = os.environ.get("MCP_HOST", "0.0.0.0")
    port = int(os.environ.get("MCP_PORT", "8000"))
    uvicorn.run(app, host=host, port=port, log_level="info")
