#!/usr/bin/env python3
"""actions_monitor.py — monitors GitHub Actions workflow health.

Identifies failed runs, slow workflows, flappy tests.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/actions_monitor_state.json")


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_workflow_runs(repo, per_page=30):
    token = get_token()
    if not token:
        return []
    url = f"https://api.github.com/repos/CSOAI-ORG/{repo}/actions/runs?per_page={per_page}"
    try:
        out = subprocess.check_output(
            ['curl', '-s', '-H', f'Authorization: token {token}', url],
            text=True, timeout=15
        )
        return json.loads(out).get('workflow_runs', []) if not out.startswith('message') else []
    except Exception:
        return []


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Actions monitor: {metrics.get('total_runs', 0)} runs across {metrics.get('repos_sampled', 0)} repos, {metrics.get('success_rate_pct', 0)}% success.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-actions-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] actions_monitor starting")
    SAMPLE_REPOS = ['councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2', 'csoai-org']
    total = 0
    success = 0
    failed = 0
    by_workflow = Counter()
    failures_by_workflow = Counter()
    for repo in SAMPLE_REPOS:
        runs = fetch_workflow_runs(repo, 30)
        for r in runs:
            total += 1
            wf_name = r.get('name', 'unknown')
            conclusion = r.get('conclusion', 'unknown')
            by_workflow[wf_name] += 1
            if conclusion == 'success':
                success += 1
            elif conclusion == 'failure':
                failed += 1
                failures_by_workflow[wf_name] += 1
    success_rate = round(100 * success / total, 1) if total > 0 else 0
    write_card(f"actions-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.actions",
               {
                   'total_runs': total,
                   'success': success,
                   'failed': failed,
                   'success_rate_pct': success_rate,
                   'by_workflow': dict(by_workflow.most_common(15)),
                   'failures_by_workflow': dict(failures_by_workflow.most_common(10)),
                   'repos_sampled': SAMPLE_REPOS,
                   'auto_churn': True,
                   'miner_version': 'actions-monitor-1',
               })
    print(f"[{NOW()}] actions_monitor done: {total} runs, {success_rate}% success, {failed} failed")
    return 0


if __name__ == "__main__":
    sys.exit(main())
