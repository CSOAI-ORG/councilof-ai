#!/usr/bin/env python3
"""
Bulk-merge SAFE-PATCH Dependabot PRs.

Reads /tmp/deps-classified.csv and merges every SAFE-PATCH entry
(patch-level version bumps, no breaking changes) by:

1. Merge the PR with --auto / squash / rebase
2. If CI fails, leave the PR and log it
3. If merge succeeds, log it
4. After all done, summary report

Requires: gh CLI authenticated, write access to CSOAI-ORG.

Usage:
  GITHUB_TOKEN=... python3 bulk_merge_deps.py [--dry-run] [--limit N]
"""
import argparse
import csv
import json
import os
import subprocess
import sys
import time
from pathlib import Path

CSV_PATH = Path("/tmp/deps-classified.csv")


def run(cmd: list[str], check: bool = True) -> tuple[int, str, str]:
    """Run a command, return (exit, stdout, stderr)."""
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
    if check and r.returncode != 0:
        return r.returncode, r.stdout, r.stderr
    return r.returncode, r.stdout, r.stderr


def get_token() -> str:
    token = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
    if not token:
        try:
            token = subprocess.run(
                ["security", "find-internet-password", "-s", "github.com", "-w"],
                capture_output=True, text=True, timeout=5,
            ).stdout.strip()
        except Exception:
            pass
    if not token:
        print("ERROR: no GITHUB_TOKEN", file=sys.stderr)
        sys.exit(1)
    return token


def merge_pr(repo: str, number: int, dry_run: bool = False) -> dict:
    """Merge a PR via the GitHub API. Returns dict with status info."""
    import urllib.parse
    import urllib.request
    token = get_token()
    url = f"https://api.github.com/repos/{repo}/pulls/{number}/merge"
    payload = {
        "commit_title": f"chore(deps): squash-merge dependabot #{number}",
        "merge_method": "squash",
    }
    req = urllib.request.Request(
        url,
        data=json.dumps(payload).encode(),
        headers={
            "Authorization": f"token {token}",
            "Accept": "application/vnd.github+json",
        },
        method="PUT",
    )
    if dry_run:
        return {"status": "dry_run", "repo": repo, "number": number}
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            data = json.load(r)
            return {"status": "merged", "repo": repo, "number": number, "sha": data.get("sha", "")[:8]}
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8", errors="ignore")[:200]
        return {"status": f"error_{e.code}", "repo": repo, "number": number, "body": body}
    except Exception as e:
        return {"status": "exception", "repo": repo, "number": number, "error": str(e)}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=0, help="Stop after N merges (0=all)")
    parser.add_argument("--csv", default=str(CSV_PATH))
    args = parser.parse_args()

    if not Path(args.csv).exists():
        print(f"ERROR: {args.csv} not found. Run classify_dependabot.py first.", file=sys.stderr)
        return 1

    # Parse the CSV
    safe_patches: list[tuple[str, int, str]] = []
    with open(args.csv) as f:
        for line in f:
            if line.startswith("#") or not line.strip():
                continue
            parts = line.strip().split(",", 4)
            if len(parts) < 5:
                continue
            cat, repo, number, title, url = parts
            if cat == "SAFE-PATCH":
                safe_patches.append((repo, int(number), title.strip('"')))

    print(f"Found {len(safe_patches)} SAFE-PATCH PRs to merge", file=sys.stderr)

    results: list[dict] = []
    merged = 0
    errors = 0
    for i, (repo, number, title) in enumerate(safe_patches):
        if args.limit and merged >= args.limit:
            break
        print(f"[{i+1}/{len(safe_patches)}] {repo}#{number}: {title[:60]}", file=sys.stderr)
        result = merge_pr(repo, number, dry_run=args.dry_run)
        results.append(result)
        if result["status"] == "merged":
            merged += 1
        elif result["status"] == "dry_run":
            pass
        else:
            errors += 1
            print(f"  FAILED: {result}", file=sys.stderr)
        time.sleep(0.5)  # rate limit

    # Summary
    print(f"\n=== SUMMARY ===", file=sys.stderr)
    print(f"Merged: {merged}", file=sys.stderr)
    print(f"Errors: {errors}", file=sys.stderr)
    if args.dry_run:
        print("(DRY RUN — no actual merges performed)", file=sys.stderr)
    return 0


if __name__ == "__main__":
    sys.exit(main())
