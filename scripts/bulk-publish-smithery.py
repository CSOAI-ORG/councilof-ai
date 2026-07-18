#!/usr/bin/env python3
"""Bulk publish all MCP repos to Smithery using the local API key."""

import json
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")
API_KEY = os.environ.get("SMITHERY_API_KEY", "")
NAMESPACE = "nicholastempleman"


def run(cmd: list[str], cwd: str = BASE_DIR) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env["SMITHERY_API_KEY"] = API_KEY
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, env=env)


def main() -> int:
    if not API_KEY:
        print("Error: SMITHERY_API_KEY environment variable is required.")
        return 1

    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Publishing {len(servers)} servers to Smithery under namespace '{NAMESPACE}'...")

    published = 0
    failed = 0
    skipped = 0

    for server in servers:
        name = server["name"]
        repo_url = f"https://github.com/CSOAI-ORG/{name}"
        qualified_name = f"{NAMESPACE}/{name}"

        # Check if already exists on Smithery
        check = run(["npx", "@smithery/cli", "mcp", "get", qualified_name, "--json"])
        if check.returncode == 0:
            print(f"[SKIP] {qualified_name}: already exists on Smithery")
            skipped += 1
            continue

        result = run([
            "npx", "@smithery/cli", "mcp", "publish", repo_url,
            "-n", qualified_name, "--json"
        ])

        if result.returncode == 0:
            print(f"[OK  ] {qualified_name}: published")
            published += 1
        else:
            err = result.stderr.strip() or result.stdout.strip()
            print(f"[ERR ] {qualified_name}: {err[:120]}")
            failed += 1

    print(f"\nDone. Published: {published}, Skipped (already exists): {skipped}, Failed: {failed}")
    return 0 if failed == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
