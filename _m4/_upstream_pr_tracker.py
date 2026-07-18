#!/usr/bin/env python3
"""Track the 5 upstream PRs over the 5-day launch period.

Polls the GitHub API every 10 min for the 5 opened PRs:
- PR #20  → morganrcu/awesome-eu-ai-act
- PR #42  → theopenlane/awesome-compliance
- PR #45  → GenAI-Gurus/awesome-eu-ai-act
- PR #50  → Vaquill-AI/awesome-legaltech
- PR #1   → CSOAI-ORG/awesome-mcp-servers-csoai

Emits a single-line status for each (state + last-comment + CI badge if any).
Writes the result to ~/clawd/UPSTREAM_PR_STATUS.json + prints to stdout.

Run: `python3 _m4/_upstream_pr_tracker.py`
Cron-friendly: writes to a known path the orchestrator can poll.
"""
import json
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

OUT = Path.home() / "clawd" / "UPSTREAM_PR_STATUS.json"

[('morganrcu/awesome-eu-ai-act', 'Add CSOAI OSCAL Generator + Layer-0 to Developer Tools & SDKs', 'main'), ('GenAI-Gurus/awesome-eu-ai-act', 'Add CSOAI Layer-0 to Open-Source Projects > AI Agent Governance', 'main'), ('Vaquill-AI/awesome-legaltech', 'Add CSOAI Legacy Bridges to MCP Servers for Legal', 'main'), ('theopenlane/awesome-compliance', 'Add CSOAI/MEOK Labs MCP servers (531 MIT MCPs, OSCAL-signed)', 'main'), ('CSOAI-ORG/awesome-mcp-servers-csoai', 'Self-PIN: CSOAI curated MCP servers list', 'main')]  # PRS list — the 5 upstream-PR repos


def get_pr_state(repo: str, head_branch: str, base_branch: str) -> dict:
    # Strategy: use REST to get the PR by exact branch match + isCrossRepository
    res = subprocess.run(
        ["gh", "pr", "list", "--repo", repo, "--state", "all",
         "--json", "number,state,title,url,createdAt,mergedAt,closedAt,headRefName,isCrossRepository,author"],
        capture_output=True, text=True, timeout=15,
    )
    if res.returncode != 0:
        return {"repo": repo, "error": res.stderr[:200]}
    prs = json.loads(res.stdout) if res.stdout.strip() else []
    # Find ours — head branch + by CSOAI-ORG author (handles both cross-repo forks and self-PRs)
    ours = [p for p in prs
            if p.get("headRefName") == head_branch and
            (p.get("author") or {}).get("login") == "CSOAI-ORG"]
    if not ours:
        return {"repo": repo, "status": "NOT_FOUND", "branch": head_branch}
    p = ours[0]
    n = p.get("number")
    # Get last comment
    cres = subprocess.run(
        ["gh", "api", f"repos/{repo}/issues/{n}/comments?per_page=1"],
        capture_output=True, text=True, timeout=15,
    )
    comments = json.loads(cres.stdout) if cres.stdout.strip() else []
    last_comment_author = comments[0]["user"]["login"] if comments else None
    last_comment_body = (comments[0]["body"][:200] if comments else None)
    # Get reviews
    rres = subprocess.run(
        ["gh", "api", f"repos/{repo}/pulls/{n}/reviews?per_page=1"],
        capture_output=True, text=True, timeout=15,
    )
    reviews = json.loads(rres.stdout) if rres.stdout.strip() else []
    last_review = reviews[0] if reviews else None
    return {
        "repo": repo,
        "number": n,
        "url": p.get("url"),
        "title": p.get("title"),
        "state": p.get("state"),
        "mergedAt": p.get("mergedAt"),
        "closedAt": p.get("closedAt"),
        "lastCommentAuthor": last_comment_author,
        "lastCommentBody": (last_comment_body or "")[:200].replace(chr(10), ' / '),
        "lastReviewState": (last_review or {}).get("state"),
        "lastReviewAuthor": ((last_review or {}).get("user") or {}).get("login"),
    }


# Active upstream PRs (sibling-shipped versions supersede the M4 originals)
# Sibling closed M4's #20/#45/#50 as dupes; the new PRs are #19/#43/#49 + #42 theopenlane
PRS = [
    ("morganrcu/awesome-eu-ai-act", "add-csoai-signed-legacy-compliance", "main"),
    ("GenAI-Gurus/awesome-eu-ai-act", "add-csoai-signed-legacy-compliance", "main"),
    ("Vaquill-AI/awesome-legaltech", "add-csoai-signed-legacy-compliance", "main"),
    ("theopenlane/awesome-compliance", "add-csoai-mcp-servers", "main"),
    # Self-PIN
    ("CSOAI-ORG/awesome-mcp-servers-csoai", "main", "main"),
]


def main():
    timestamp = datetime.now(timezone.utc).isoformat()
    status = {"timestamp": timestamp, "prs": []}
    for repo, head_branch, base_branch in PRS:
        s = get_pr_state(repo, head_branch, base_branch)
        status["prs"].append(s)
    summary_count = {"merged": 0, "open": 0, "closed-not-merged": 0, "not-found": 0}
    for p in status["prs"]:
        if p.get("merged"):
            summary_count["merged"] += 1
        elif p.get("state") == "OPEN":
            summary_count["open"] += 1
        elif p.get("state") == "CLOSED":
            summary_count["closed-not-merged"] += 1
        else:
            summary_count["not-found"] += 1
    status["summary"] = summary_count
    status["merge_rate"] = f"{summary_count['merged']}/{len(PRS)}"
    OUT.write_text(json.dumps(status, indent=2))
    print(f"=== UPSTREAM PR STATUS at {timestamp} ===")
    print(f"  Merge rate: {status['merge_rate']}")
    for p in status["prs"]:
        n = p.get("number", "?")
        s = p.get("state", "?")
        merged = "MERGED" if p.get("merged") else s
        print(f"  PR #{n}  {p['repo']:50s}  {merged}")
        if p.get("lastComment"):
            author = p.get("lastCommentAuthor", "?")
            body = (p.get("lastComment") or "")[:120].replace(chr(10), ' / ')
            print(f"        └─ @{author}: {body}")
    print(f"\nWrote: {OUT}")


if __name__ == "__main__":
    main()
