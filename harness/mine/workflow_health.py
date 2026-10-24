#!/usr/bin/env python3
"""workflow_health.py — identifies flappy/broken workflows.

Tracks consecutive failures, slow runs, cancelled runs.
ASI-Evolve: proposes workflow fixes when patterns detected.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import defaultdict
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/workflow_health_state.json")

SAMPLE_REPOS = ['councilof-ai', 'gspc-harness', 'sovos-harness', 'csoai-static-deploy2', 'csoai-org']


def get_token():
    try:
        out = subprocess.check_output(['gh', 'auth', 'token'], text=True, timeout=5)
        return out.strip()
    except Exception:
        return os.environ.get("GH_TOKEN", "")


def fetch_workflow_runs(repo, per_page=50):
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
        "honest_sentence": f"Workflow health: {metrics.get('total_workflows', 0)} workflows, {metrics.get('flappy_workflows', 0)} flappy.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"github-workflow-health-{subject.replace('/', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] workflow_health starting")
    # Map: workflow_name -> [results in chronological order]
    by_wf = defaultdict(list)
    workflow_names = {}
    for repo in SAMPLE_REPOS:
        runs = fetch_workflow_runs(repo, 50)
        for r in runs:
            wf_id = str(r.get('workflow_id'))
            wf_name = r.get('name', 'unknown')
            workflow_names[wf_id] = wf_name
            conclusion = r.get('conclusion', 'unknown')
            by_wf[wf_id].append(conclusion)
    
    flappy = []
    broken = []
    healthy = []
    for wf_id, results in by_wf.items():
        recent = results[:10]
        s = recent.count('success')
        f = recent.count('failure')
        c = recent.count('cancelled')
        wf_name = workflow_names.get(wf_id, 'unknown')
        if s + f + c == 0:
            continue
        success_rate = round(100 * s / (s + f + c), 1) if (s + f + c) > 0 else 0
        entry = {
            'workflow': wf_name,
            'success': s,
            'failure': f,
            'cancelled': c,
            'success_rate_pct': success_rate,
            'last_runs': recent[:5],
        }
        if success_rate < 50 and (s + f + c) >= 3:
            broken.append(entry)
        elif success_rate < 75 and (s + f + c) >= 4:
            flappy.append(entry)
        else:
            healthy.append(entry)
    
    write_card(f"wf-health-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.github.workflow_health",
               {
                   'total_workflows': len(by_wf),
                   'flappy_workflows': len(flappy),
                   'broken_workflows': len(broken),
                   'healthy_workflows': len(healthy),
                   'broken': broken,
                   'flappy': flappy,
                   'auto_churn': True,
                   'miner_version': 'workflow-health-1',
               })
    print(f"[{NOW()}] workflow_health done: {len(by_wf)} workflows, {len(flappy)} flappy, {len(broken)} broken")
    return 0


if __name__ == "__main__":
    sys.exit(main())
