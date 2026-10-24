#!/usr/bin/env python3
"""commit_freq.py — measures commit activity per repo.

Detects dormant repos, identifies most active contributors.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/commit_freq_state.json")

# Sample of repos to analyze (full 693 would be slow)
SAMPLE_REPOS = [
    'councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2',
    'csoai-dashboard', 'csoai-org', 'corpus-watch', 'clawd-workspace',
    'meok-compliance-gateway', 'proofof-ai-mcp', 'csoai-councilof-ai',
]


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_commits(repo, per_page=30):
    token = get_token()
    if not token:
        return []
    url = f"https://api.github.com/repos/CSOAI-ORG/{repo}/commits?per_page={per_page}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=15
        )
        commits = json.loads(out)
        return commits if isinstance(commits, list) else []
    except Exception:
        return []


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Commit frequency: {metrics.get('total_commits_sampled', 0)} commits across {metrics.get('repos_sampled', 0)} repos.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-commits-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    state = {}
    if STATE.exists():
        try:
            state = json.loads(STATE.read_text())
        except Exception:
            pass
    print(f"[{NOW()}] commit_freq starting")
    total = 0
    by_repo = {}
    contributors = Counter()
    for repo in SAMPLE_REPOS:
        commits = fetch_commits(repo, 30)
        by_repo[repo] = len(commits)
        total += len(commits)
        for c in commits:
            author = c.get('commit', {}).get('author', {}).get('name', 'unknown')
            contributors[author] += 1
    write_card(f"freq-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.commits",
               {
                   'total_commits_sampled': total,
                   'repos_sampled': len(SAMPLE_REPOS),
                   'by_repo': by_repo,
                   'top_contributors': dict(contributors.most_common(10)),
                   'auto_churn': True,
                   'miner_version': 'commit-freq-1',
               })
    print(f"[{NOW()}] commit_freq done: {total} commits across {len(SAMPLE_REPOS)} repos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
