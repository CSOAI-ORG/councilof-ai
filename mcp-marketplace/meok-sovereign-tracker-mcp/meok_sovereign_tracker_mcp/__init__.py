"""meok-sovereign-tracker-mcp — GitHub-style PR + issue tracker for sovereign teams.

5 tools:
  1. tracker_create_issue   - create an issue
  2. tracker_create_pr     - create a pull request
  3. tracker_merge_pr      - merge a PR (BFT 3 voters required)
  4. tracker_list          - list issues/PRs (filterable)
  5. tracker_status        - overall tracker status
"""
from __future__ import annotations
import json
import hashlib
from datetime import datetime, timezone
from typing import List, Optional

PROTOCOL = "sovereign-tracker/1.0"
VERSION = "1.0.0"

_ISSUES: dict = {}
_PRS: dict = {}

# 12 Generals as contributors
CONTRIBUTORS = [
    "argus", "scribe", "shield", "builder", "abacus", "lex",
    "scale", "crow", "gear", "voice", "owl", "dragon",
]


def _sign(payload: dict) -> dict:
    body = json.dumps(payload, sort_keys=True, default=str)
    payload["kid"] = "track-" + hashlib.sha256(body.encode()).hexdigest()[:16]
    payload["sig"] = hashlib.sha256((payload["kid"] + body).encode()).hexdigest()
    payload["ts"] = datetime.now(timezone.utc).isoformat()
    return payload


def _now_ns():
    import time as _t
    return _t.time_ns()


def tracker_create_issue(title: str, description: str,
                        assignee: Optional[str] = None,
                        labels: List[str] = None) -> dict:
    """Create an issue."""
    if assignee and assignee not in CONTRIBUTORS:
        return _sign({"error": f"unknown assignee: {assignee}"})
    if labels is None:
        labels = []
    issue_id = hashlib.sha256(f"{title}|{_now_ns()}".encode()).hexdigest()[:8]
    issue = {
        "issue_id": issue_id,
        "title": title, "description": description,
        "assignee": assignee, "labels": labels,
        "status": "OPEN", "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _ISSUES[issue_id] = issue
    return _sign(issue)


def tracker_create_pr(title: str, body: str, base: str, head: str,
                    author: str) -> dict:
    """Create a pull request."""
    if author not in CONTRIBUTORS:
        return _sign({"error": f"unknown author: {author}"})
    pr_id = hashlib.sha256(f"{title}|{_now_ns()}".encode()).hexdigest()[:8]
    pr = {
        "pr_id": pr_id,
        "title": title, "body": body,
        "base": base, "head": head,
        "author": author, "status": "OPEN",
        "approvals": 0, "reviewers": [],
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    _PRS[pr_id] = pr
    return _sign(pr)


def tracker_merge_pr(pr_id: str, merger: str) -> dict:
    """Merge a PR (requires 3 BFT approvals from CONTRIBUTORS)."""
    if pr_id not in _PRS:
        return _sign({"error": f"unknown PR: {pr_id}"})
    pr = _PRS[pr_id]
    pr["approvals"] += 1
    if pr["approvals"] >= 3:
        pr["status"] = "MERGED"
        pr["merged_at"] = datetime.now(timezone.utc).isoformat()
        pr["merger"] = merger
    return _sign(pr)


def tracker_list(kind: str = "issues",
                status: Optional[str] = None,
                assignee: Optional[str] = None) -> dict:
    """List issues or PRs (filterable)."""
    if kind == "issues":
        items = list(_ISSUES.values())
        if status:
            items = [i for i in items if i["status"] == status]
        if assignee:
            items = [i for i in items if i["assignee"] == assignee]
    else:
        items = list(_PRS.values())
        if status:
            items = [p for p in items if p["status"] == status]
        if assignee:
            items = [p for p in items if p["author"] == assignee or p["merger"] == assignee]
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "kind": kind, "items": items, "count": len(items),
    })


def tracker_status() -> dict:
    """Overall tracker status."""
    issues_open = sum(1 for i in _ISSUES.values() if i["status"] == "OPEN")
    issues_closed = sum(1 for i in _ISSUES.values() if i["status"] == "CLOSED")
    prs_open = sum(1 for p in _PRS.values() if p["status"] == "OPEN")
    prs_merged = sum(1 for p in _PRS.values() if p["status"] == "MERGED")
    return _sign({
        "protocol": PROTOCOL, "version": VERSION,
        "issues": {"open": issues_open, "closed": issues_closed, "total": len(_ISSUES)},
        "prs": {"open": prs_open, "merged": prs_merged, "total": len(_PRS)},
        "contributors": len(CONTRIBUTORS),
    })