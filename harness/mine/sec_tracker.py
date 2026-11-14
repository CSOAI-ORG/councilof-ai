#!/usr/bin/env python3
"""sec_tracker.py — tracks SEC filings mentioning AI from public sources.

SEC EDGAR provides free public access. We scrape filings tagged with
AI keywords, classify by company, track AI mentions in 10-Ks/8-Ks/S-1s.
"""
from __future__ import annotations
import json, os, sys, urllib.parse, urllib.request
from pathlib import Path
from collections import Counter
from datetime import datetime, timedelta, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/sec_tracker_state.json")

# SEC EDGAR free public search (no API key needed).
def sec_url():
    today = datetime.now(timezone.utc).date()
    start = today - timedelta(days=30)
    query = urllib.parse.urlencode({
        "q": '"artificial intelligence"', "dateRange": "custom",
        "startdt": start.isoformat(), "enddt": today.isoformat(),
    })
    return "https://efts.sec.gov/LATEST/search-index?" + query


def fetch_sec_filings():
    """Fetch recent SEC filings mentioning AI."""
    try:
        req = urllib.request.Request(
            sec_url(),
            headers={"User-Agent": "CSOAI Council research@csoai.org"}
        )
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception as e:
        print(f"  SEC fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"SEC filings tracker: {metrics.get('filings_total', 0)} AI-related filings indexed.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"sec-filings-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] sec_tracker starting")
    data = fetch_sec_filings()
    hits = data.get("hits", {}).get("hits", [])
    by_form = Counter()
    by_company = Counter()
    sample_filings = []
    wanted_forms = {"10-K", "10-Q", "8-K", "S-1", "20-F", "6-K"}
    for hit in hits:
        source = hit.get("_source", {})
        form = source.get("form", "unknown")
        if form not in wanted_forms:
            continue
        cname = source.get("display_names", ["unknown"])[0] if source.get("display_names") else "unknown"
        by_form[form] += 1
        by_company[cname] += 1
        sample_filings.append({
            "company": cname[:40],
            "form": form,
            "filed": source.get("file_date", "")[:10],
            "url": f"https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK={source.get('ciks', ['?'])[0]}",
        })
    write_card(f"filings-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.regulatory.sec_filings",
               {
                   "filings_total": len(hits),
                   "by_form": dict(by_form.most_common(10)),
                   "top_companies": dict(by_company.most_common(15)),
                   "sample_filings": sample_filings[:10],
                   "auto_churn": True,
                   "miner_version": "sec-tracker-1",
                   "data_source": "SEC EDGAR free public",
               })
    print(f"[{NOW()}] sec_tracker done: {len(hits)} filings")
    return 0


if __name__ == "__main__":
    sys.exit(main())
