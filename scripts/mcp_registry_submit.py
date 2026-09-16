#!/usr/bin/env python3
"""mcp_registry_submit.py — submit Council of AI to the MCP Registry.

G6.1 CLAIM SWEEP. Publishes the server.json to the MCP Registry via
the /v0.1/publish endpoint. Requires a GitHub personal access token
with repo scope.

Usage:
  python3 scripts/mcp_registry_submit.py --token <github-pat>
  python3 scripts/mcp_registry_submit.py --validate-only

Exit codes: 0 published; 1 validation failed; 2 auth/network error.
"""
from __future__ import annotations

import argparse
import json
import sys
import urllib.request
import urllib.error
from pathlib import Path

REGISTRY_BASE = "https://registry.modelcontextprotocol.io"
SERVER_JSON = Path("public/.well-known/mcp/server.json")


def get_github_token(token: str) -> str:
    """Exchange GitHub PAT for a registry JWT."""
    req = urllib.request.Request(
        f"{REGISTRY_BASE}/v0.1/auth/github-at",
        data=json.dumps({"token": token}).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.loads(r.read())
            return data.get("token", "")
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:300]
        print(f"AUTH FAILED: HTTP {e.code} — {body}", file=sys.stderr)
        return ""


def validate_server(server_json: dict) -> bool:
    """Validate server.json without publishing."""
    req = urllib.request.Request(
        f"{REGISTRY_BASE}/v0.1/validate",
        data=json.dumps(server_json).encode(),
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
            print(f"VALIDATION: {json.dumps(result, indent=2)}")
            return result.get("valid", False)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:300]
        print(f"VALIDATION FAILED: HTTP {e.code} — {body}", file=sys.stderr)
        return False


def publish_server(jwt: str, server_json: dict) -> bool:
    """Publish server.json to the MCP Registry."""
    req = urllib.request.Request(
        f"{REGISTRY_BASE}/v0.1/publish",
        data=json.dumps(server_json).encode(),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {jwt}",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            result = json.loads(r.read())
            print(f"PUBLISHED: {json.dumps(result, indent=2)}")
            return True
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", "replace")[:300]
        print(f"PUBLISH FAILED: HTTP {e.code} — {body}", file=sys.stderr)
        return False


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--token", help="GitHub personal access token")
    ap.add_argument("--validate-only", action="store_true")
    ap.add_argument("--server-json", default=str(SERVER_JSON))
    args = ap.parse_args()

    server_json = json.loads(Path(args.server_json).read_text())
    print(f"Server: {server_json.get('name')}")
    print(f"Version: {server_json.get('version')}")

    if args.validate_only:
        ok = validate_server(server_json)
        return 0 if ok else 1

    if not args.token:
        print("ERROR: --token required for publishing", file=sys.stderr)
        return 2

    jwt = get_github_token(args.token)
    if not jwt:
        return 2

    ok = publish_server(jwt, server_json)
    return 0 if ok else 2


if __name__ == "__main__":
    sys.exit(main())
