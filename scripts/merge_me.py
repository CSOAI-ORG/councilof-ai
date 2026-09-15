#!/usr/bin/env python3
"""merge_me.py — auto-updated merge-me dashboard for the PR train.

G1.5 MERGE-TRAIN CONDUCTOR (TUI-1 INTEGRITY). Lists every open PR with
CI status, merge-readiness, and a one-liner description. Sorts by
merge order: green+approved first, green pending review next, failing last.

Usage:
  python3 scripts/merge_me.py                # human-readable table
  python3 scripts/merge_me.py --json         # machine-readable JSON
  python3 scripts/merge_me.py --write-issue  # update pinned GitHub issue

Requires: gh CLI authenticated to CSOAI-ORG/councilof-ai.
Exit codes: 0 ok; 1 gh CLI error; 2 no open PRs.
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
from datetime import datetime, timezone
from typing import Any


def gh(*args: str) -> Any:
    """Run a gh CLI command and return parsed JSON output."""
    result = subprocess.run(
        ["gh"] + list(args),
        capture_output=True, text=True, timeout=30,
    )
    if result.returncode != 0:
        raise RuntimeError(f"gh {' '.join(args[:3])}... failed: {result.stderr.strip()}")
    return json.loads(result.stdout) if result.stdout.strip() else None


def get_open_prs() -> list[dict]:
    """Fetch all open PRs with CI status."""
    prs = gh(
        "api",
        "repos/CSOAI-ORG/councilof-ai/pulls?state=open&per_page=100&sort=created&direction=desc",
    )
    if not prs:
        return []
    enriched = []
    for pr in prs:
        number = pr["number"]
        head_sha = pr["head"]["sha"]
        # Get check runs for the head commit
        try:
            checks = gh(
                "api",
                f"repos/CSOAI-ORG/councilof-ai/commits/{head_sha}/check-runs",
            )
            total = checks.get("total_count", 0)
            passed = sum(
                1 for c in checks.get("check_runs", [])
                if c["conclusion"] == "success"
            )
            failed = sum(
                1 for c in checks.get("check_runs", [])
                if c["conclusion"] in ("failure", "cancelled", "timed_out")
            )
            pending = sum(
                1 for c in checks.get("check_runs", [])
                if c["status"] in ("queued", "in_progress")
            )
            if total > 0:
                ci_status = "green" if passed == total else "failing" if failed > 0 else "pending"
            else:
                ci_status = "no-checks"
        except Exception:
            ci_status = "unknown"
            total = passed = failed = pending = 0

        enriched.append({
            "number": number,
            "title": pr["title"][:120],
            "head": pr["head"]["ref"],
            "base": pr["base"]["ref"],
            "created": pr["created_at"][:10],
            "updated": pr["updated_at"][:10],
            "draft": pr.get("draft", False),
            "mergeable": pr.get("mergeable"),
            "ci_status": ci_status,
            "checks_total": total,
            "checks_passed": passed,
            "checks_failed": failed,
            "checks_pending": pending,
            "url": pr["html_url"],
        })
    return enriched


def sort_by_merge_order(prs: list[dict]) -> list[dict]:
    """Sort PRs by merge-readiness: green first, then pending, then failing."""
    priority = {"green": 0, "no-checks": 1, "pending": 2, "unknown": 3, "failing": 4}
    return sorted(prs, key=lambda p: (priority.get(p["ci_status"], 5), p["created"]))


def format_table(prs: list[dict]) -> str:
    """Human-readable merge-me table."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    lines = [
        f"# MERGE-ME DASHBOARD — {now}",
        f"Open PRs: {len(prs)}",
        "",
        f"{'#':<6} {'CI':<10} {'MERGE':<8} {'TITLE':<70} {'BRANCH'}",
        "-" * 120,
    ]
    for p in prs:
        merge_icon = "READY" if p["ci_status"] == "green" and not p["draft"] else "DRAFT" if p["draft"] else "WAIT"
        checks_str = f"{p['checks_passed']}/{p['checks_total']}" if p["checks_total"] > 0 else "none"
        title = p["title"][:68]
        lines.append(
            f"#{p['number']:<5} {p['ci_status']:<10} {merge_icon:<8} {title:<70} {p['head']}"
        )
        if p["checks_total"] > 0:
            lines.append(
                f"{'':6} checks: {checks_str} passed, {p['checks_failed']} failed, {p['checks_pending']} pending"
            )
    lines.append("")
    lines.append("Legend: READY = green CI + not draft. WAIT = CI pending or draft. DRAFT = draft PR.")
    return "\n".join(lines)


def write_merge_issue(prs: list[dict]) -> str:
    """Generate markdown for a pinned merge-me GitHub issue."""
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    body = [
        "## MERGE-ME DASHBOARD",
        f"_Auto-updated: {now}_",
        "",
        "Merge order: green PRs top-to-bottom. Nick merges twice daily.",
        "",
        "| # | CI | Title | Branch | Created |",
        "|---|-----|-------|--------|---------|",
    ]
    for p in prs:
        icon = {"green": "✅", "failing": "❌", "pending": "⏳", "no-checks": "—", "unknown": "?"}.get(p["ci_status"], "?")
        body.append(f"| #{p['number']} | {icon} | {p['title'][:60]} | `{p['head']}` | {p['created']} |")
    body.append("")
    body.append(f"_Generated by `scripts/merge_me.py --write-issue` at {now}_")
    return "\n".join(body)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--json", action="store_true", help="JSON output")
    ap.add_argument("--write-issue", action="store_true", help="update pinned merge-me issue")
    args = ap.parse_args()

    try:
        prs = get_open_prs()
    except RuntimeError as e:
        print(f"ERROR: {e}", file=sys.stderr)
        return 1

    if not prs:
        print("No open PRs.", file=sys.stderr)
        return 2

    prs = sort_by_merge_order(prs)

    if args.json:
        print(json.dumps(prs, indent=2))
        return 0

    if args.write_issue:
        body = write_merge_issue(prs)
        # Try to find existing merge-me issue
        try:
            issues = gh(
                "api",
                "repos/CSOAI-ORG/councilof-ai/issues?labels=merge-me&state=open&per_page=1",
            )
            if issues:
                issue_number = issues[0]["number"]
                gh("api", f"repos/CSOAI-ORG/councilof-ai/issues/{issue_number}",
                   "-X", "PATCH", "-f", f"body={body}")
                print(f"Updated issue #{issue_number}")
            else:
                result = gh(
                    "api", "repos/CSOAI-ORG/councilof-ai/issues",
                    "-X", "POST",
                    "-f", "title=🔀 MERGE-ME: PR merge order",
                    "-f", f"body={body}",
                    "-f", 'labels=["merge-me","automation"]',
                )
                print(f"Created issue #{result['number']}")
        except Exception as e:
            print(f"WARNING: could not update issue: {e}", file=sys.stderr)
            print(body)
        return 0

    print(format_table(prs))
    return 0


if __name__ == "__main__":
    sys.exit(main())
