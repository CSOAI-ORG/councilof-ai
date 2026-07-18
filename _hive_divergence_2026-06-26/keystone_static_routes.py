"""keystone_static_routes.py — additional static routes for the keystone.

Mounts llms.txt, .mcp.json, and /server.json for registry discovery.
"""
import json
import os
from pathlib import Path
from starlette.responses import JSONResponse, FileResponse

REPO_ROOT = Path(__file__).parent

def mount_static_routes(mcp):
    """Mount llms.txt, .mcp.json, server.json, and AGENTS.md on the given FastMCP instance."""

    @mcp.custom_route("/llms.txt", methods=["GET"])
    async def llms_txt(_request):
        path = REPO_ROOT / "llms.txt"
        if path.exists():
            return FileResponse(path, media_type="text/plain")
        return JSONResponse({"error": "llms.txt not found"}, status_code=404)

    @mcp.custom_route("/.mcp.json", methods=["GET"])
    async def mcp_json(_request):
        path = REPO_ROOT / ".mcp.json"
        if path.exists():
            return FileResponse(path, media_type="application/json")
        return JSONResponse({"error": ".mcp.json not found"}, status_code=404)

    @mcp.custom_route("/server.json", methods=["GET"])
    async def server_json(_request):
        path = REPO_ROOT / "server.json"
        if path.exists():
            return FileResponse(path, media_type="application/json")
        return JSONResponse({"error": "server.json not found"}, status_code=404)

