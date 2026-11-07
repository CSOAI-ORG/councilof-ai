#!/usr/bin/env python3
"""Read-only repository recovery inventory (audit item 3).

Inventories git repositories under the workspace as recovery candidates:
origin URLs, refs, HEAD commit, commit counts, working-tree dirtiness,
licence file presence, and object-database connectivity (failures only).
READ-ONLY: no fetch, no gc, no writes to any repository.
Output: JSON receipt to stdout.
"""
import json
import os
import subprocess
import sys
from datetime import datetime, timezone

ROOT = "/Users/nicholas/clawd/councilof-ai-work"


def git(repo, *args, timeout=120):
    try:
        r = subprocess.run(["git", "-C", repo] + list(args),
                           capture_output=True, text=True, timeout=timeout)
        return r.stdout.strip(), r.returncode
    except subprocess.TimeoutExpired:
        return "TIMEOUT", 124


def inventory(repo):
    rel = os.path.relpath(repo, ROOT)
    rec = {"path": rel}
    remotes, rc = git(repo, "remote", "-v")
    rec["remotes"] = sorted({ln.split()[1] for ln in remotes.splitlines() if "(fetch)" in ln}) if rc == 0 else []
    head, _ = git(repo, "rev-parse", "HEAD")
    rec["head_commit"] = head if len(head) == 40 else None
    branch, _ = git(repo, "branch", "--show-current")
    rec["current_branch"] = branch or None
    n, rc = git(repo, "rev-list", "--count", "HEAD")
    rec["commit_count_head"] = int(n) if rc == 0 and n.isdigit() else None
    refs, rc = git(repo, "for-each-ref", "--format=%(refname)")
    rec["ref_count"] = len(refs.splitlines()) if rc == 0 and refs else 0
    last, _ = git(repo, "log", "-1", "--format=%cI")
    rec["last_commit_at"] = last or None
    dirty, rc = git(repo, "status", "--porcelain")
    rec["worktree_modified_paths"] = len(dirty.splitlines()) if rc == 0 else None
    wt, rc = git(repo, "worktree", "list", "--porcelain")
    rec["worktrees"] = sum(1 for ln in wt.splitlines() if ln.startswith("worktree ")) if rc == 0 else None
    # Object connectivity, failures only (read-only). Can be slow on large repos.
    fsck, rc = git(repo, "fsck", "--connectivity-only", "--no-progress", timeout=300)
    # Dangling objects are normal in an active multi-lane repo (unreferenced but
    # intact); they are NOT connectivity failures. Only non-dangling output is.
    real = [ln for ln in fsck.splitlines() if ln and not ln.startswith("dangling")]
    dangling = sum(1 for ln in fsck.splitlines() if ln.startswith("dangling"))
    rec["fsck_connectivity"] = ("CLEAN" if rc == 0 and not real else
        "ISSUES: " + "; ".join(real[:5]) if real else f"rc={rc}")
    rec["fsck_dangling_objects"] = dangling
    for lic in ("LICENSE", "LICENSE.md", "LICENCE", "COPYING"):
        if os.path.isfile(os.path.join(repo, lic)):
            rec["licence_file"] = lic
            break
    else:
        rec["licence_file"] = None
    return rec


def main():
    repos = []
    for dirpath, dirnames, _filenames in os.walk(ROOT):
        depth = os.path.relpath(dirpath, ROOT).count(os.sep)
        if depth > 2:  # keep it shallow; this is an inventory, not a crawl
            dirnames[:] = []
            continue
        dirnames[:] = [d for d in dirnames if d not in ("node_modules", ".venv", "venv", "__pycache__")]
        if ".git" in dirnames or os.path.isfile(os.path.join(dirpath, ".git")):
            repos.append(dirpath)
    receipt = {
        "schema": "csoai.repo-recovery-inventory/0.1",
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "scope": ("Read-only inventory of local repository candidates for recovery planning. "
                  "Presence of a clone is NOT proof of complete canonical history; "
                  "no fetch/push/gc was performed; object reachability checked via "
                  "fsck --connectivity-only (failures reported, absence of failures "
                  "is not a completeness proof)."),
        "workspace": ROOT,
        "repositories": [inventory(r) for r in sorted(repos)],
    }
    json.dump(receipt, sys.stdout, indent=1)
    print()


if __name__ == "__main__":
    main()
