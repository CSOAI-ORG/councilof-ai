#!/usr/bin/env python3
"""Commit and push SEO descriptions + test templates fleet-wide."""

import json
import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Committing and pushing changes for {len(servers)} servers...")

    committed = 0
    pushed = 0
    skipped = 0

    for server in servers:
        name = server["name"]
        repo_dir = os.path.join(BASE_DIR, "mcp-marketplace", name)

        status = run(["git", "status", "--porcelain"], cwd=repo_dir)
        if not status.stdout.strip():
            skipped += 1
            continue

        run(["git", "add", "-A"], cwd=repo_dir)
        commit = run(
            ["git", "commit", "-m", "feat: add SEO descriptions, test templates, and security audit fixes"],
            cwd=repo_dir,
        )
        if commit.returncode != 0 and "nothing to commit" not in commit.stderr.lower():
            print(f"[WARN] {name}: commit failed: {commit.stderr.strip()}")
            continue

        committed += 1
        push = run(["git", "push"], cwd=repo_dir)
        if push.returncode == 0:
            pushed += 1
        else:
            print(f"[WARN] {name}: push failed: {push.stderr.strip()}")

    print(f"Done. Committed: {committed}, Pushed: {pushed}, Skipped (no changes): {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
