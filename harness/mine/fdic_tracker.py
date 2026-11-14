#!/usr/bin/env python3
"""fdic_tracker.py — FDIC BankFind API tracker."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/fdic_tracker_state.json")

# FDIC BankFind public API - institutions
FDIC_BASE = "https://api.fdic.gov/banks/institutions?limit=20&sort_by=NAME&sort_order=ASC"


def fetch_failed():
    try:
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", FDIC_BASE],
            timeout=15
        )
        return json.loads(out)
    except Exception as e:
        print(f"  FDIC fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"FDIC tracker: {metrics.get('banks_indexed', 0)} banks indexed.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"fdic-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] fdic_tracker starting")
    data = fetch_failed()
    institutions = data.get("data", [])
    by_state = Counter()
    total_assets = 0
    for inst in institutions:
        st = inst.get("STALP", "?")
        by_state[st] += 1
        assets = inst.get("ASSET", 0)
        if assets:
            total_assets += float(assets)
    write_card(f"banks-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.fdic",
               {
                   "banks_indexed": len(institutions),
                   "by_state": dict(by_state.most_common(10)),
                   "total_assets_thousands": round(total_assets, 2),
                   "data_source": "FDIC BankFind public API",
                   "auto_churn": True,
                   "miner_version": "fdic-tracker-2",
               })
    print(f"[{NOW()}] fdic_tracker done: {len(institutions)} banks")
    return 0


if __name__ == "__main__":
    sys.exit(main())
