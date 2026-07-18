#!/usr/bin/env python3
"""SHA-pin actions/attest-build-provenance@v2 in all MCP repos."""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKETPLACE = os.path.join(BASE_DIR, "mcp-marketplace")

OLD = "actions/attest-build-provenance@v2"
NEW = "actions/attest-build-provenance@96b4a1ef7235a096b17240c259729fdd70c83d45 # v2"


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main() -> int:
    fixed = 0
    for name in sorted(os.listdir(MARKETPLACE)):
        repo_dir = os.path.join(MARKETPLACE, name)
        if not os.path.isdir(repo_dir):
            continue
        wf_path = os.path.join(repo_dir, ".github", "workflows", "mcp-smithery-publish.yml")
        if not os.path.exists(wf_path):
            continue

        with open(wf_path, "r", encoding="utf-8") as f:
            content = f.read()

        if OLD not in content:
            continue

        content = content.replace(OLD, NEW)
        with open(wf_path, "w", encoding="utf-8") as f:
            f.write(content)

        run(["git", "add", ".github/workflows/mcp-smithery-publish.yml"], cwd=repo_dir)
        commit = run(
            ["git", "commit", "-m", "ci: SHA-pin attest-build-provenance action"],
            cwd=repo_dir,
        )
        if commit.returncode == 0 or "nothing to commit" in commit.stderr.lower():
            push = run(["git", "push"], cwd=repo_dir)
            if push.returncode == 0:
                fixed += 1
            else:
                print(f"[WARN] {name}: push failed")
        else:
            print(f"[WARN] {name}: commit failed: {commit.stderr.strip()}")

    print(f"Done. Fixed {fixed} repos.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
