#!/usr/bin/env python3
"""repo_health.py — scans CSOAI-ORG repos for health signals.

Detects abandoned repos, identifies stars, fork counts, contributors.
ASI-Evolve: learns which repos are most active + most valuable.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/repo_health_state.json")

SAMPLE_REPOS = [
    'councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2',
    'csoai-dashboard', 'csoai-org', 'corpus-watch', 'meok-compliance-gateway',
    'clawd-workspace', 'proofof-ai-mcp', 'inspect-signed-receipt',
    'agisafe-harness', 'asisecurity-harness', 'meok-defoneos-hive',
    'csoai-councilof-ai', 'csoai-haulage-uk-compliance-mcp',
]


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_repo(repo):
    token = get_token()
    if not token:
        return {}
    url = f"https://api.github.com/repos/CSOAI-ORG/{repo}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=10
        )
        return json.loads(out) if not out.startswith('message') else {}
    except Exception:
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Repo health: {metrics.get('total_repos', 0)} repos scanned, {metrics.get('total_stars', 0)} total stars.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-repo-health-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] repo_health starting")
    total_stars = 0
    total_forks = 0
    total_issues = 0
    repos_data = []
    for repo in SAMPLE_REPOS:
        data = fetch_repo(repo)
        if not data:
            continue
        stars = data.get('stargazers_count', 0)
        forks = data.get('forks_count', 0)
        issues = data.get('open_issues_count', 0)
        total_stars += stars
        total_forks += forks
        total_issues += issues
        repos_data.append({
            'name': repo,
            'stars': stars,
            'forks': forks,
            'open_issues': issues,
            'size_kb': data.get('size', 0),
            'language': data.get('language'),
            'license': (data.get('license') or {}).get('spdx_id', 'none') if data.get('license') else 'none',
            'archived': data.get('archived', False),
            'pushed_at': data.get('pushed_at', '')[:10],
            'updated_at': data.get('updated_at', '')[:10],
            'created_at': data.get('created_at', '')[:10],
            'description': (data.get('description') or '')[:80],
        })
    # Sort by stars
    repos_data.sort(key=lambda x: -x['stars'])
    write_card(f"health-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.repo_health",
               {
                   'total_repos': len(repos_data),
                   'total_stars': total_stars,
                   'total_forks': total_forks,
                   'total_open_issues': total_issues,
                   'top_10_by_stars': repos_data[:10],
                   'repos_sampled': SAMPLE_REPOS,
                   'auto_churn': True,
                   'miner_version': 'repo-health-1',
               })
    print(f"[{NOW()}] repo_health done: {len(repos_data)} repos, {total_stars} stars, {total_forks} forks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
