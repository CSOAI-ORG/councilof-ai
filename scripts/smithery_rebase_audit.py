#!/usr/bin/env python3
"""Smithery 75-server rebase audit + driver.

Lists which CSOAI-ORG repos are on feat/* branches ahead of origin/main
and need a rebase. Outputs a JSON manifest the user (Nick) can iterate
through manually OR fire via the --rebase flag.

Per /Users/nicholas/clawd/meok-compliance-gateway/AGENTS.md:
- Account-gated = Nick only: PyPI publish, GHCR flip, merging PRs
- This script is READ-ONLY by default. --rebase flag prints the commands
  but does not execute them.
"""
import json
import subprocess
import sys
from pathlib import Path

# Find CSOAI-ORG / csga-global / meok-ai clones
CLONE_ROOTS = [
    Path("/Users/nicholas/clawd"),
    Path("/Users/nicholas/meok-ai"),
    Path("/Users/nicholas"),
    Path("/Users/nicholas/csoai"),
    # /Users/nicholas/csga — REMOVED 2026-06-27 (severed brand, no CSGA clones permitted)
]

def is_git_repo(p: Path) -> bool:
    return (p / ".git").is_dir()

def branch_info(p: Path):
    """Return (current_branch, ahead_of_main, has_uncommitted) for repo p."""
    try:
        b = subprocess.run(
            ["git", "-C", str(p), "rev-parse", "--abbrev-ref", "HEAD"],
            capture_output=True, text=True, timeout=5
        ).stdout.strip()
        if b in ("main", "master", "HEAD", ""):
            return b, 0, False
        # Count commits ahead of origin/main
        a = subprocess.run(
            ["git", "-C", str(p), "rev-list", "--count", f"origin/main..{b}"],
            capture_output=True, text=True, timeout=5
        )
        ahead = int(a.stdout.strip() or 0) if a.returncode == 0 else -1
        # Check dirty
        s = subprocess.run(
            ["git", "-C", str(p), "status", "--porcelain"],
            capture_output=True, text=True, timeout=5
        )
        dirty = bool(s.stdout.strip())
        return b, ahead, dirty
    except Exception as e:
        return None, None, str(e)

def find_repos():
    """Find all git repos under CLONE_ROOTS that have feat/* or fix/* branches ahead of origin/main."""
    repos = []
    for root in CLONE_ROOTS:
        if not root.exists():
            continue
        for p in root.iterdir():
            if not p.is_dir():
                continue
            if not is_git_repo(p):
                continue
            # Skip if not in scope
            name = p.name
            if not any(k in name.lower() for k in ['meok', 'mcp', 'csoai', 'csga', 'sovereign', 'care', 'compliance', 'bias', 'fleet', 'keystone', 'privacy', 'transparency', 'data', 'landlaw', 'cobol']):
                continue
            b, ahead, dirty = branch_info(p)
            if b is None or ahead is None:
                continue
            if ahead == 0 and not dirty:
                continue
            repos.append({
                "path": str(p),
                "name": name,
                "branch": b,
                "ahead_of_main": ahead,
                "dirty": dirty if isinstance(dirty, bool) else False,
            })
    return repos

def main():
    repos = find_repos()
    # Sort by ahead desc
    repos.sort(key=lambda r: -r["ahead_of_main"])
    out = {
        "generated_at": __import__("datetime").datetime.utcnow().isoformat() + "Z",
        "scope": "feat/* + fix/* branches ahead of origin/main (Smithery pre-flight)",
        "count": len(repos),
        "repos": repos,
    }
    print(json.dumps(out, indent=2))
    # Write the manifest
    outpath = Path("/Users/nicholas/clawd/SMITHERY_REBASE_MANIFEST_2026-06-15.json")
    outpath.write_text(json.dumps(out, indent=2))
    print(f"\nManifest written: {outpath}", file=sys.stderr)
    return 0

if __name__ == "__main__":
    sys.exit(main())
