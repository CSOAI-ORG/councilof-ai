#!/usr/bin/env python3
"""star_tracker.py — tracks stargazers across CSOAI-ORG repos.

Identifies most-starred repos, tracks new stars, classifies star accounts.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/star_tracker_state.json")

SAMPLE_REPOS = [
    'councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2',
    'csoai-dashboard', 'meok-compliance-gateway', 'proofof-ai-mcp',
]


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_stargazers(repo, per_page=30):
    token = get_token()
    if not token:
        return []
    url = f"https://api.github.com/repos/CSOAI-ORG/{repo}/stargazers?per_page={per_page}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=15
        )
        data = json.loads(out) if not out.startswith('message') else []
        return data if isinstance(data, list) else []
    except Exception:
        return []


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Star tracker: {metrics.get('total_stars_sampled', 0)} stars across {metrics.get('repos_sampled', 0)} repos.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-stars-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] star_tracker starting")
    total_stars = 0
    by_repo = {}
    account_types = Counter()
    for repo in SAMPLE_REPOS:
        stargazers = fetch_stargazers(repo, 30)
        n = len(stargazers)
        total_stars += n
        by_repo[repo] = n
        # Classify accounts
        for sg in stargazers:
            user = sg.get('user', {})
            if user.get('type') == 'User':
                account_types['User'] += 1
            elif user.get('type') == 'Organization':
                account_types['Organization'] += 1
            else:
                account_types['Bot'] += 1
    write_card(f"stars-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.stars",
               {
                   'total_stars_sampled': total_stars,
                   'by_repo': by_repo,
                   'account_types': dict(account_types),
                   'repos_sampled': SAMPLE_REPOS,
                   'auto_churn': True,
                   'miner_version': 'star-tracker-1',
               })
    print(f"[{NOW()}] star_tracker done: {total_stars} stars sampled across {len(SAMPLE_REPOS)} repos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
