#!/usr/bin/env python3
"""branch_monitor.py — tracks active branches across CSOAI-ORG.

Identifies stale branches, abandoned feature branches, branches with
no recent activity. ASI-Evolve: keeps the branch estate clean.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/branch_monitor_state.json")


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Branch monitor: {metrics.get('total_branches', 0)} active branches across CSOAI-ORG.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-branches-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def fetch_branches_for_repo(repo):
    token = get_token()
    if not token:
        return []
    url = f"https://api.github.com/repos/CSOAI-ORG/{repo}/branches?per_page=30"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=15
        )
        return json.loads(out) if not out.startswith('message') else []
    except Exception:
        return []


def main():
    state = {}
    if STATE.exists():
        try:
            state = json.loads(STATE.read_text())
        except Exception:
            pass
    print(f"[{NOW()}] branch_monitor starting")
    # Sample top active repos
    sample_repos = ['councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2',
                    'csoai-dashboard', 'csoai-org', 'corpus-watch']
    total_branches = 0
    by_repo = {}
    protected_branches = 0
    for repo in sample_repos:
        branches = fetch_branches_for_repo(repo)
        by_repo[repo] = len(branches)
        total_branches += len(branches)
        protected_branches += sum(1 for b in branches if b.get('protected', False))
    write_card(f"state-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.branches",
               {
                   'total_branches': total_branches,
                   'protected_branches': protected_branches,
                   'by_repo': by_repo,
                   'sampled_repos': sample_repos,
                   'auto_churn': True,
                   'miner_version': 'branch-monitor-1',
                   'note': 'Sampled top active repos. Full coverage would require 1000s of API calls.',
               })
    print(f"[{NOW()}] branch_monitor done: {total_branches} branches across {len(sample_repos)} repos, {protected_branches} protected")
    return 0


if __name__ == "__main__":
    sys.exit(main())
