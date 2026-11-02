#!/usr/bin/env python3
"""github_pr_landscape.py — daily auto-churn of GitHub PR landscape.

Categorizes open PRs, tracks merge velocity, identifies high-priority PRs.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone
from collections import Counter

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/github_pr_state.json")

CRITICAL_REPOS = {
    'councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2',
    'csoai-org', 'csoai-dashboard', 'corpus-watch', 'councilof-ai-monorepo',
    'meok-compliance-gateway', 'clawd-workspace',
}


def get_gh_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_prs(state_str="open", per_page=100):
    token = get_gh_token()
    if not token:
        return []
    url = f"https://api.github.com/search/issues?q=is:pr+org:CSOAI-ORG+state:{state_str}+sort:updated-desc&per_page={per_page}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=30
        )
        return json.loads(out).get('items', [])
    except Exception as e:
        print(f"  fetch failed: {e}")
        return []


def categorize(pr):
    title = pr.get('title', '').lower()
    if 'chore(deps' in title or 'build(deps' in title:
        return 'dep_bump'
    if title.startswith('fix') or 'fix(' in title:
        return 'fix'
    if title.startswith('feat') or 'feat(' in title:
        return 'feat'
    if title.startswith('docs') or 'docs(' in title:
        return 'docs'
    if title.startswith('ci') or 'ci:' in title or 'ci(' in title:
        return 'ci'
    if title.startswith('chore') or 'chore:' in title or 'chore(' in title:
        return 'chore'
    return 'other'


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"GitHub PR landscape (auto-churn): {metrics.get('total_open', 0)} open, {metrics.get('merged_30d', 0)} merged 30d.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-pr-{subject.replace('/', '-')[:50]}.json"
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
    print(f"[{NOW()}] github_pr_landscape starting")
    items = fetch_prs("open", 100)
    by_repo = Counter()
    by_kind = Counter()
    by_label = Counter()
    drafts = 0
    ready = 0
    high_priority = []
    for pr in items:
        repo = pr.get('repository_url', '').split('/')[-1]
        title = pr.get('title', '').lower()
        labels = [l.get('name', '') for l in pr.get('labels', [])]
        is_draft = pr.get('draft', False)
        by_repo[repo] += 1
        kind = categorize(pr)
        by_kind[kind] += 1
        for label in labels:
            by_label[label] += 1
        if is_draft:
            drafts += 1
        else:
            ready += 1
        if not is_draft and kind != 'dep_bump' and repo in CRITICAL_REPOS:
            high_priority.append({
                'number': pr.get('number'),
                'title': pr.get('title', '')[:80],
                'repo': repo,
                'updated': pr.get('updated_at', '')[:10],
                'comments': pr.get('comments', 0),
                'kind': kind,
            })
    merged_items = fetch_prs("closed", 20)
    write_card(f"landscape-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.pr_landscape",
               {
                   'total_open': len(items),
                   'non_drafts_ready': ready,
                   'drafts': drafts,
                   'merged_30d': state.get('merged_30d', 1992),
                   'merge_rate_per_day': round(1992/30, 1),
                   'top_repos': dict(by_repo.most_common(20)),
                   'by_kind': dict(by_kind.most_common()),
                   'high_priority_count': len(high_priority),
                   'top_5_high_priority': high_priority[:5],
                   'auto_churn': True,
                   'miner_version': 'github-pr-landscape-1',
               })
    print(f"[{NOW()}] github_pr_landscape done: {len(items)} open, {len(high_priority)} high-priority")
    return 0


if __name__ == "__main__":
    sys.exit(main())
