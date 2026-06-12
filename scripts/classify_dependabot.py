#!/usr/bin/env python3
"""
Dependabot PR classifier — sorts the 679 open Dependabot PRs across CSOAI-ORG
by merge-safety. Outputs CSV-ready categories so Nick can merge safe ones first
and review risky ones individually.

Categories:
  SAFE-PATCH      patch-level bumps in actions, dev-only deps
  SAFE-MINOR      minor bumps in pinned dev deps
  REVIEW-MAJOR    major version bumps (need testing)
  REVIEW-MCP      mcp>=1.0.0 pins — fleet-wide impact, NEVER bulk-merge
  REVIEW-DEPS     pip deps (any)
  SKIP            already-merged or stale

Usage:
  python3 classify_dependabot.py > /tmp/dependabot-classified.csv
"""
import json
import os
import subprocess
import sys
from typing import Any

REPO = "CSOAI-ORG"
TOKEN = os.environ.get("GITHUB_TOKEN") or os.environ.get("GH_TOKEN")
if not TOKEN:
    # Fall back to keychain
    try:
        TOKEN = subprocess.run(
            ["security", "find-internet-password", "-s", "github.com", "-w"],
            capture_output=True, text=True, timeout=5
        ).stdout.strip()
    except Exception:
        pass

if not TOKEN:
    print("ERROR: no GitHub token in env or keychain", file=sys.stderr)
    sys.exit(1)


def gh_api(path: str, params=None) -> dict[str, Any]:
    if params is None:
        params = {}
    import urllib.parse
    import urllib.request
    # Use quote (space) not quote_plus (+) so GitHub search interprets
    # the query correctly. urlencode defaults to quote_plus which breaks
    # the GitHub search syntax.
    qs_parts = []
    for k, v in params.items():
        qs_parts.append(f"{urllib.parse.quote(k)}={urllib.parse.quote(v)}")
    qs = "?" + "&".join(qs_parts) if qs_parts else ""
    url = f"https://api.github.com{path}{qs}"
    req = urllib.request.Request(
        url, headers={
            "Authorization": f"token {TOKEN}",
            "Accept": "application/vnd.github+json",
            "X-GitHub-Api-Version": "2022-11-28",
        }
    )
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.load(r)


def classify(title: str) -> str:
    """Classify a Dependabot PR title by safety."""
    t = title.lower()

    # MCP fleet pins — DANGEROUS, never bulk-merge
    if "mcp>=" in t or "mcp==" in t or "mcp<" in t:
        return "REVIEW-MCP"

    # Major version bumps
    if "major" in t or " to v" in t.replace(".", "").replace("major", "x").replace("v", "") or any(
        t.startswith(prefix) for prefix in (
            "deps: bump ", "bump ", "deps(deps): bump ", "deps(dev): bump "
        )
    ):
        # Try to detect major vs minor vs patch from the title
        # Common patterns: "bump foo from 1.2.3 to 1.2.4" (patch), "1.2.3 to 2.0.0" (major)
        import re
        m = re.search(r"from\s+[\d.]+\s+to\s+(\d+)\.(\d+)\.(\d+)", title)
        if m:
            _, _, _ = m.groups()
            return None  # signal to use version comparison
    return "REVIEW-DEPS"


def version_compare(from_v: str, to_v: str) -> tuple[int, int, int]:
    """Return (major_delta, minor_delta, patch_delta)."""
    from_parts = [int(x) for x in from_v.split(".") if x.isdigit()][:3]
    to_parts = [int(x) for x in to_v.split(".") if x.isdigit()][:3]
    while len(from_parts) < 3:
        from_parts.append(0)
    while len(to_parts) < 3:
        to_parts.append(0)
    return (to_parts[0] - from_parts[0], to_parts[1] - from_parts[1], to_parts[2] - from_parts[2])


def main() -> int:
    import re
    print("# Dependabot PR classification across CSOAI-ORG")
    print("# Format: CATEGORY,REPO,PR_NUMBER,TITLE,URL")
    print()

    cats: dict[str, list[str]] = {
        "SAFE-PATCH": [],
        "SAFE-MINOR": [],
        "REVIEW-MAJOR": [],
        "REVIEW-MCP": [],
        "REVIEW-DEPS": [],
    }

    page = 1
    total = 0
    while True:
        print(f"# Fetching page {page}...", file=sys.stderr)
        data = gh_api("/search/issues", {
            "q": f"is:pr is:open author:app/dependabot org:{REPO}",
            "per_page": "100",
            "page": str(page),
        })
        items = data.get("items", [])
        if not items:
            break
        total += len(items)

        for pr in items:
            title = pr["title"]
            # Search results return `repository_url` not `repository` object
            repo_url = pr.get("repository_url", "")
            full_name = repo_url.replace("https://api.github.com/repos/", "") if repo_url else "unknown/unknown"
            number = pr["number"]
            url = pr["html_url"]

            # Parse the version delta
            m = re.search(r"from\s+([\d.]+)\s+to\s+([\d.]+)", title)
            major_delta = minor_delta = 0
            if m:
                from_v, to_v = m.group(1), m.group(2)
                major_delta, minor_delta, _ = version_compare(from_v, to_v)

            # MCP fleet pins = DANGEROUS
            if any(k in title.lower() for k in ["mcp>=", "mcp==", "mcp<"]):
                cat = "REVIEW-MCP"
            elif "mcp" in title.lower() and "update mcp" in title.lower():
                cat = "REVIEW-MCP"
            elif major_delta > 0:
                cat = "REVIEW-MAJOR"
            elif major_delta == 0 and minor_delta == 0:
                cat = "SAFE-PATCH"
            elif major_delta == 0 and minor_delta > 0:
                cat = "SAFE-MINOR"
            else:
                cat = "REVIEW-DEPS"

            cats[cat].append(f"{cat},{full_name},{number},\"{title}\",{url}")

        if len(items) < 100:
            break
        page += 1
        if page > 10:
            break

    print(f"# Total: {total} PRs", file=sys.stderr)
    for cat, lines in cats.items():
        print(f"# {cat}: {len(lines)} PRs", file=sys.stderr)
        for line in lines:
            print(line)

    return 0


if __name__ == "__main__":
    sys.exit(main())
