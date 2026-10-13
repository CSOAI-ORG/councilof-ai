#!/usr/bin/env python3
"""openalex_tracker.py — OpenAlex academic papers tracker."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/openalex_state.json")


def fetch_openalex(query, per_page=20):
    try:
        import urllib.parse
        q = urllib.parse.quote(query)
        url = f"https://api.openalex.org/works?search={q}&per_page={per_page}&sort=publication_date:desc"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=20
        )
        return json.loads(out)
    except Exception as e:
        print(f"  OpenAlex fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"OpenAlex: {metrics.get('papers_total', 0)} papers, {metrics.get('open_access_count', 0)} open access.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"openalex-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] openalex starting")
    query = "AI governance"
    data = fetch_openalex(query, 25)
    results = data.get("results", [])
    by_year = Counter()
    open_access = 0
    by_venue = Counter()
    for r in results:
        year = (r.get("publication_date") or "????")[:4]
        by_year[year] += 1
        if r.get("open_access", {}).get("is_oa"):
            open_access += 1
        venue = (r.get("primary_location", {}) or {}).get("source", {}) or {}
        vname = venue.get("display_name", "unknown")[:30]
        by_venue[vname] += 1
    write_card(f"governance-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.research.openalex",
               {
                   "papers_total": len(results),
                   "open_access_count": open_access,
                   "by_year": dict(by_year.most_common()),
                   "top_venues": dict(by_venue.most_common(5)),
                   "query": query,
                   "data_source": "OpenAlex open academic catalog",
                   "auto_churn": True,
                   "miner_version": "openalex-1",
               })
    print(f"[{NOW()}] openalex done: {len(results)} papers")
    return 0


if __name__ == "__main__":
    sys.exit(main())
