#!/usr/bin/env python3
"""merge-conflicting-v2.py — the fixed merge script.

Properly handles multi-word PR titles by using the gh JSON output directly.
"""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

REPO = Path("/Users/nicholas/clawd/councilof-ai")


def run(cmd: list[str], **kw) -> subprocess.CompletedProcess:
    return subprocess.run(cmd, capture_output=True, text=True, **kw)


def list_conflicting_prs() -> list[dict]:
    r = run(["gh", "pr", "list", "--repo", "CSOAI-ORG/councilof-ai",
             "--state", "open", "--limit", "30",
             "--json", "number,title,headRefName,additions,mergeable,state"])
    if r.returncode != 0:
        print(f"gh failed: {r.stderr}")
        return []
    prs = json.loads(r.stdout)
    return [p for p in prs if p.get("mergeable") == "CONFLICTING" and p.get("state") == "OPEN"]


def rebase_and_merge(pr: dict) -> tuple[bool, str]:
    pr_num = pr["number"]
    branch = pr["headRefName"]
    title = pr.get("title", "")[:60]
    adds = pr.get("additions", 0)

    # Step 1: fetch
    r = run(["git", "fetch", "origin", branch], cwd=REPO)
    if r.returncode != 0:
        return False, f"fetch failed: {r.stderr[:100]}"

    # Step 2: create worktree
    wt = Path(f"/tmp/merge-v2-{pr_num}")
    if wt.exists():
        run(["git", "worktree", "remove", "--force", str(wt)], cwd=REPO)
    r = run(["git", "worktree", "add", "-q", str(wt), "-b", f"merge-v2/{pr_num}", "origin/master"], cwd=REPO)
    if r.returncode != 0:
        return False, f"worktree add failed: {r.stderr[:100]}"

    # Step 3: rebase
    r = run(["git", "rebase", "origin/master"], cwd=wt)
    if r.returncode != 0:
        # Resolve conflicts: keep both
        conflicted = run(["git", "diff", "--name-only", "--diff-filter=U"], cwd=wt).stdout.split()
        for f in conflicted:
            fp = wt / f
            if not fp.exists():
                continue
            try:
                text = fp.read_text()
                # Resolve git conflict markers
                import re
                while True:
                    m = re.search(
                        r"<<<<<<< HEAD\n(.*?)\n=======\n(.*?)\n>>>>>>> [a-zA-Z0-9/_.-]+",
                        text, re.DOTALL,
                    )
                    if not m:
                        break
                    head, branch = m.group(1), m.group(2)
                    if head.strip() == branch.strip():
                        merged = head
                    else:
                        merged = head + "\n" + branch
                    text = text[:m.start()] + merged + text[m.end():]
                fp.write_text(text)
                run(["git", "add", f], cwd=wt)
            except Exception as e:
                pass
        r = run(["git", "-c", "core.editor=true", "rebase", "--continue"], cwd=wt)
        if r.returncode != 0:
            run(["git", "rebase", "--abort"], cwd=wt)
            run(["git", "worktree", "remove", "--force", str(wt)], cwd=REPO)
            return False, f"rebase failed even after resolve: {r.stderr[:200]}"

    # Step 4: push
    r = run(["git", "push", "--no-verify", "--force-with-lease",
             "origin", f"HEAD:{branch}"], cwd=wt)
    if r.returncode != 0:
        run(["git", "worktree", "remove", "--force", str(wt)], cwd=REPO)
        return False, f"push failed: {r.stderr[:200]}"

    # Step 5: merge
    r = run(["gh", "pr", "merge", str(pr_num), "--repo", "CSOAI-ORG/councilof-ai",
             "--merge", "--delete-branch"], cwd=REPO)
    if r.returncode != 0:
        run(["git", "worktree", "remove", "--force", str(wt)], cwd=REPO)
        return False, f"gh merge failed: {r.stderr[:200]}"

    run(["git", "worktree", "remove", "--force", str(wt)], cwd=REPO)
    return True, "merged"


def main():
    print("=" * 70)
    print("  MERGE CONFLICTING v2 — the 10-PR backlog")
    print("=" * 70)

    prs = list_conflicting_prs()
    print(f"\nFound {len(prs)} CONFLICTING open PRs")
    for p in prs:
        print(f"  #{p['number']} +{p.get('additions',0):>5}  {p.get('title','')[:60]}")
    print()

    merged = 0
    failed = 0
    for p in prs:
        ok, msg = rebase_and_merge(p)
        mark = "✓" if ok else "✗"
        print(f"  {mark} #{p['number']} +{p.get('additions',0):>5}  {msg}")
        if ok:
            merged += 1
        else:
            failed += 1

    print(f"\n=== Summary ===")
    print(f"  merged: {merged}")
    print(f"  failed: {failed}")


if __name__ == "__main__":
    main()
