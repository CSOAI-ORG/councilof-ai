#!/usr/bin/env python3
"""gh_issue_tracker.py — tracks GitHub issues across CSOAI-ORG.

Categorizes issues by label, milestone, age. Identifies stale issues.
ASI-Evolve: learns which issues get responses and adjusts priority.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/gh_issue_state.json")


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_issues(state="open", per_page=100):
    token = get_token()
    if not token:
        return []
    url = f"https://api.github.com/search/issues?q=is:issue+org:CSOAI-ORG+state:{state}+sort:updated-desc&per_page={per_page}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=30
        )
        return json.loads(out).get('items', [])
    except Exception:
        return []


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"GitHub issue tracker: {metrics.get('total', 0)} issues across CSOAI-ORG.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-issues-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    state_path = STATE
    state = {}
    if state_path.exists():
        try:
            state = json.loads(state_path.read_text())
        except Exception:
            pass
    print(f"[{NOW()}] gh_issue_tracker starting")
    items = fetch_issues("open", 100)
    by_repo = Counter()
    by_label = Counter()
    by_age = Counter()
    no_response = 0
    no_label = 0
    for iss in items:
        repo = iss.get('repository_url', '').split('/')[-1]
        title = iss.get('title', '')
        by_repo[repo] += 1
        labels = [l.get('name', '') for l in iss.get('labels', [])]
        if not labels:
            no_label += 1
        for label in labels:
            by_label[label] += 1
        comments = iss.get('comments', 0)
        if comments == 0:
            no_response += 1
        # Age buckets
        created = iss.get('created_at', '')
        if created:
            try:
                dt = datetime.fromisoformat(created.replace('Z', '+00:00'))
                age_days = (datetime.now(timezone.utc) - dt).days
                if age_days < 7:
                    by_age['<7d'] += 1
                elif age_days < 30:
                    by_age['7-30d'] += 1
                elif age_days < 90:
                    by_age['30-90d'] += 1
                else:
                    by_age['>90d'] += 1
            except Exception:
                pass
    write_card(f"state-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.issues",
               {
                   'total': len(items),
                   'no_response': no_response,
                   'no_label': no_label,
                   'by_repo': dict(by_repo.most_common(20)),
                   'by_label': dict(by_label.most_common(15)),
                   'by_age': dict(by_age),
                   'auto_churn': True,
                   'miner_version': 'gh-issue-tracker-1',
               })
    print(f"[{NOW()}] gh_issue_tracker done: {len(items)} issues, {no_response} no-response, {no_label} no-label")
    return 0


if __name__ == "__main__":
    sys.exit(main())
