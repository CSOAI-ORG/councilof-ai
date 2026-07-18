#!/usr/bin/env python3
"""Copy streamable-http wrapper and SSE bridge into each MCP repo as needed."""

import json
import os
import shutil
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")
WRAPPER_SRC = os.path.join(BASE_DIR, "scripts", "mcp-streamable-http-wrapper.py")
BRIDGE_SRC = os.path.join(BASE_DIR, "scripts", "mcp-sse-bridge.py")


def uses_fastmcp(server_py_path: str) -> bool:
    try:
        with open(server_py_path, "r", encoding="utf-8") as f:
            return "FastMCP" in f.read()
    except Exception:
        return False


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Distributing wrappers to {len(servers)} deployable servers...")

    fastmcp = 0
    bridge = 0

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)
        server_py = os.path.join(repo_dir, "server.py")

        if uses_fastmcp(server_py):
            dest = os.path.join(repo_dir, "mcp-wrapper.py")
            shutil.copy2(WRAPPER_SRC, dest)
            fastmcp += 1
        else:
            dest = os.path.join(repo_dir, "mcp-sse-bridge.py")
            shutil.copy2(BRIDGE_SRC, dest)
            bridge += 1

    print(f"Done. FastMCP wrappers: {fastmcp}, Bridge scripts: {bridge}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
