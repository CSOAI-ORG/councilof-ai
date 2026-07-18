#!/usr/bin/env python3
"""Copy the Smithery publish workflow into every MCP sub-repo, commit, and push."""

import json
import os
import shutil
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MANIFEST_PATH = os.path.join(BASE_DIR, "MCP_DEPLOYMENT_MANIFEST.json")
TEMPLATE_PATH = os.path.join(BASE_DIR, ".github", "workflows", "mcp-smithery-publish.yml")

COMMIT_MESSAGE = "ci: add Smithery publish workflow"


def run(cmd: list[str], cwd: str) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main() -> int:
    if not os.path.exists(MANIFEST_PATH):
        print(f"Manifest not found: {MANIFEST_PATH}")
        return 1
    if not os.path.exists(TEMPLATE_PATH):
        print(f"Template not found: {TEMPLATE_PATH}")
        return 1

    with open(MANIFEST_PATH, "r") as f:
        manifest = json.load(f)

    servers = [s for s in manifest.get("deployable_servers", []) if s.get("deployment_ready")]
    print(f"Applying workflow to {len(servers)} deployable servers...")

    pushed = 0
    skipped = 0
    errors = 0

    for server in servers:
        name = server["name"]
        repo_path = os.path.join(BASE_DIR, "mcp-marketplace", name)
        workflows_dir = os.path.join(repo_path, ".github", "workflows")
        workflow_rel = ".github/workflows/mcp-smithery-publish.yml"
        dest_path = os.path.join(repo_path, workflow_rel)

        if not os.path.isdir(os.path.join(repo_path, ".git")):
            print(f"[SKIP] {name}: not a git repo")
            skipped += 1
            continue

        # Ensure workflow dir exists
        os.makedirs(workflows_dir, exist_ok=True)

        # Check if already identical
        if os.path.exists(dest_path):
            with open(TEMPLATE_PATH, "r") as src, open(dest_path, "r") as dst:
                if src.read() == dst.read():
                    print(f"[SKIP] {name}: workflow already up to date")
                    skipped += 1
                    continue

        shutil.copy2(TEMPLATE_PATH, dest_path)

        # Stage, commit, push
        run(["git", "add", workflow_rel], cwd=repo_path)
        result = run(["git", "diff", "--cached", "--quiet"], cwd=repo_path)
        if result.returncode == 0:
            print(f"[SKIP] {name}: no changes to commit")
            skipped += 1
            continue

        result = run(["git", "commit", "-m", COMMIT_MESSAGE], cwd=repo_path)
        if result.returncode != 0:
            print(f"[ERR ] {name}: commit failed - {result.stderr.strip()}")
            errors += 1
            continue

        result = run(["git", "push", "origin", "main"], cwd=repo_path)
        if result.returncode != 0:
            print(f"[ERR ] {name}: push failed - {result.stderr.strip()}")
            errors += 1
            continue

        print(f"[OK  ] {name}: workflow committed and pushed")
        pushed += 1

    print(f"\nDone. Pushed: {pushed}, Skipped: {skipped}, Errors: {errors}")
    return 0 if errors == 0 else 1


if __name__ == "__main__":
    sys.exit(main())
