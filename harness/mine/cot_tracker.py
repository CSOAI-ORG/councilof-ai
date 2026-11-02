#!/usr/bin/env python3
"""cot_tracker.py — CFTC Commitments of Traders weekly data."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/cot_tracker_state.json")

CFTC_CURRENT = "https://www.cftc.gov/dea/newcot/deafut.txt"


def fetch_cot(url):
    try:
        out = subprocess.check_output(
            ["curl", "-s", "-A", "CSOAI council@csoai.org", url],
            timeout=20
        )
        return out.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  CFTC fetch failed: {e}")
        return ""


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"CFTC CoT tracker: {metrics.get('rows_total', 0)} rows indexed.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"cftc-cot-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] cot_tracker starting")
    raw = fetch_cot(CFTC_CURRENT)
    rows = 0
    sample = []
    if raw:
        import csv, io
        reader = csv.DictReader(io.StringIO(raw), delimiter=",")
        for row in reader:
            rows += 1
            if rows <= 5:
                sample.append({k: row.get(k, "")[:30] for k in list(row.keys())[:10]})
    write_card(f"current-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.cftc_cot",
               {
                   "rows_total": rows,
                   "sample_rows": sample,
                   "data_source": "CFTC free public",
                   "auto_churn": True,
                   "miner_version": "cot-tracker-2",
               })
    print(f"[{NOW()}] cot_tracker done: {rows} rows")
    return 0


if __name__ == "__main__":
    sys.exit(main())
