#!/usr/bin/env python3
"""FastMCP Streamable-HTTP wrapper with well-known endpoints and health checks.

Usage:
    python /path/to/mcp-streamable-http-wrapper.py

This imports `mcp` from `server.py`, mounts discovery endpoints, and runs
with transport='streamable-http'.
"""

import json
import os
import sys

sys.path.insert(0, os.path.expanduser("~/clawd/meok-labs-engine/shared"))
sys.path.insert(0, os.getcwd())

from starlette.requests import Request
from starlette.responses import JSONResponse, Response
from server import mcp as mcp_server


SERVICE_NAME = os.path.basename(os.getcwd())
REPO_URL = f"https://github.com/CSOAI-ORG/{SERVICE_NAME}"


@mcp_server.custom_route("/.well-known/mcp/server-card.json", methods=["GET"])
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
                "type": "streamable-http",
                "url": "http://localhost:8000/mcp",
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


@mcp_server.custom_route("/.well-known/mcp", methods=["GET"])
async def mcp_manifest(request: Request) -> Response:
    return JSONResponse(
        {
            "mcp_version": "2025-11-25",
            "endpoints": [
                {
                    "type": "streamable-http",
                    "path": "/mcp",
                    "url": "http://localhost:8000/mcp",
                }
            ],
        },
        headers={
            "Access-Control-Allow-Origin": "*",
            "Cache-Control": "public, max-age=3600",
        },
    )


@mcp_server.custom_route("/health", methods=["GET"])
async def health(request: Request) -> Response:
    return JSONResponse({"status": "ok"})


if __name__ == "__main__":
    mcp_server.settings.host = "0.0.0.0"
    mcp_server.run(transport="streamable-http")
