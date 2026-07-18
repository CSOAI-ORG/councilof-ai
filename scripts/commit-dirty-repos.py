#!/usr/bin/env python3
"""Commit and push all dirty MCP repos."""

import os
import subprocess
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MARKETPLACE = os.path.join(BASE_DIR, "mcp-marketplace")


def run(cmd, cwd):
    return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True)


def main() -> int:
    committed = 0
    pushed = 0
    skipped = 0

    for name in sorted(os.listdir(MARKETPLACE)):
        repo_dir = os.path.join(MARKETPLACE, name)
        if not os.path.isdir(repo_dir):
            continue

        status = run(["git", "status", "--porcelain"], cwd=repo_dir)
        if not status.stdout.strip():
            skipped += 1
            continue

        run(["git", "add", "-A"], cwd=repo_dir)
        commit = run(
            ["git", "commit", "-m", "feat: enhanced README/docs and server capabilities"],
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

    print(f"Done. Committed: {committed}, Pushed: {pushed}, Skipped: {skipped}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
