#!/usr/bin/env python3
"""treasury_tracker.py — US Treasury daily statements."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/treasury_tracker_state.json")

TREASURY_BASE = "https://api.fiscaldata.treasury.gov/services/api/fiscal_service/v2/accounting/od/debt_to_penny?sort=-record_date&pagesize=5"


def fetch_treasury():
    try:
        out = subprocess.check_output(
            ["curl", "-s", "-A", "CSOAI council@csoai.org", TREASURY_BASE],
            timeout=20
        )
        return json.loads(out)
    except Exception as e:
        print(f"  Treasury fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"Treasury tracker: latest debt = {metrics.get('latest_debt', 'unknown')}.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"treasury-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] treasury_tracker starting")
    data = fetch_treasury()
    rows = data.get("data", [])
    latest_debt = None
    if rows:
        latest_debt = rows[0].get("tot_pub_debt_out_amt", "unknown") if rows else None
    debt_held_public = rows[0].get("debt_held_public_amt") if rows else None
    intragov_hold = rows[0].get("intragov_hold_amt") if rows else None
    write_card(f"debt-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.treasury",
               {
                   "tot_pub_debt_out_amt": latest_debt,
                   "debt_held_public_amt": debt_held_public,
                   "intragov_hold_amt": intragov_hold,
                   "record_date": rows[0].get("record_date") if rows else None,
                   "rows_count": len(rows),
                   "data_source": "Treasury Fiscal Data API",
                   "auto_churn": True,
                   "miner_version": "treasury-tracker-2",
               })
    print(f"[{NOW()}] treasury_tracker done: latest_debt={latest_debt}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
