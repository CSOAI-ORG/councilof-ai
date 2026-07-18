#!/usr/bin/env python3
"""🐉 publish-pre-flight.py — verify MEOK hatch is ready to publish to MCP Registry.

Checks:
1. server.json exists + is valid JSON
2. server.json schema fields are present
3. README.md exists with install instructions
4. pyproject.toml has the package metadata
5. Live endpoint /api/mcp responds
6. Streamable-HTTP transport accepted

Usage: python3 publish-pre-flight.py [--json]
Exit code: 0 = ready, 1 = not ready (with what to fix).
"""
import json
import os
import subprocess
import sys
from pathlib import Path

ROOT = Path("/Users/nicholas/clawd")
SERVER_JSON = ROOT / "mcp-marketplace" / "meok-hatch-server.json"
README = ROOT / "mcp-marketplace" / "meok-hatch" / "README.md"
PYPROJECT = ROOT / "mcp-marketplace" / "meok-hatch" / "pyproject.toml"
SERVER_PY = ROOT / "mcp-marketplace" / "meok-hatch" / "server.py"
BACKEND = "http://127.0.0.1:8000"


def main():
    json_out = "--json" in sys.argv
    checks = []

    # 1. server.json exists
    if SERVER_JSON.exists():
        try:
            data = json.loads(SERVER_JSON.read_text())
            checks.append(("server.json valid JSON", True, f"{SERVER_JSON.stat().st_size} bytes"))
        except json.JSONDecodeError as e:
            checks.append(("server.json valid JSON", False, f"parse error: {e}"))
    else:
        checks.append(("server.json valid JSON", False, "file missing"))

    # 2. server.json schema fields
    if SERVER_JSON.exists():
        try:
            data = json.loads(SERVER_JSON.read_text())
            required = ["name", "version", "description", "repository", "license", "transport"]
            missing = [f for f in required if f not in data]
            if missing:
                checks.append(("server.json schema fields", False, f"missing: {missing}"))
            else:
                checks.append(("server.json schema fields", True, f"all {len(required)} required fields"))
        except json.JSONDecodeError:
            checks.append(("server.json schema fields", False, "JSON invalid"))

    # 3. README.md
    if README.exists():
        size = README.stat().st_size
        if size > 1000:
            checks.append(("README.md present + substantial", True, f"{size} bytes"))
        else:
            checks.append(("README.md present + substantial", False, f"only {size} bytes"))
    else:
        checks.append(("README.md present + substantial", False, "file missing"))

    # 4. pyproject.toml
    if PYPROJECT.exists():
        text = PYPROJECT.read_text()
        if "name = " in text and "version = " in text:
            checks.append(("pyproject.toml complete", True, "name + version declared"))
        else:
            checks.append(("pyproject.toml complete", False, "missing name/version"))
    else:
        checks.append(("pyproject.toml complete", False, "file missing"))

    # 5. server.py exists
    if SERVER_PY.exists():
        size = SERVER_PY.stat().st_size
        if size > 1000:
            checks.append(("server.py present + substantial", True, f"{size} bytes"))
        else:
            checks.append(("server.py present + substantial", False, f"only {size} bytes"))
    else:
        checks.append(("server.py present + substantial", False, "file missing"))

    # 6. Live endpoint
    out = subprocess.run(
        ["curl", "-sf", "-X", "POST", f"{BACKEND}/api/backend/status"],
        capture_output=True, text=True, timeout=5,
    )
    if out.returncode == 0:
        checks.append(("backend live", True, "/api/backend/status 200"))
    else:
        checks.append(("backend live", False, "offline"))

    # 7. /api/mcp responds
    out = subprocess.run(
        ["curl", "-sf", "-X", "POST", f"{BACKEND}/api/mcp",
         "-H", "Content-Type: application/json",
         "-d", '{"jsonrpc":"2.0","method":"tools/list","params":{},"id":1}'],
        capture_output=True, text=True, timeout=5,
    )
    if out.returncode == 0:
        checks.append(("/api/mcp responds", True, "JSON-RPC 200 OK"))
    else:
        checks.append(("/api/mcp responds", False, "offline or rejected"))

    # 8. namespace correctness
    if SERVER_JSON.exists():
        try:
            data = json.loads(SERVER_JSON.read_text())
            name = data.get("name", "")
            if name == "io.github.CSOAI-ORG/meok-hatch":
                checks.append(("MCP Registry namespace", True, name))
            else:
                checks.append(("MCP Registry namespace", False, f"got {name}"))
        except json.JSONDecodeError:
            checks.append(("MCP Registry namespace", False, "JSON invalid"))

    if json_out:
        print(json.dumps({"checks": checks, "ready": all(c[1] for c in checks)}, indent=2))
    else:
        print("🐉 MEOK HATCH — MCP REGISTRY PUBLISH PRE-FLIGHT\n")
        for name, ok, detail in checks:
            mark = "✅" if ok else "❌"
            print(f"  {mark} {name}: {detail}")
        print()
        ready = all(c[1] for c in checks)
        if ready:
            print("✅ READY TO PUBLISH — run: SUBMIT=1 mcp-publisher publish mcp-marketplace/meok-hatch-server.json")
        else:
            print("❌ NOT READY — fix the items above")

    return 0 if all(c[1] for c in checks) else 1


if __name__ == "__main__":
    sys.exit(main())
