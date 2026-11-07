#!/usr/bin/env python3
"""bis_tracker.py — BIS Statistical Bulletin."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/bis_tracker_state.json")


def fetch_bis_csv():
    try:
        url = "https://stats.bis.org/api/v1/data/BIS,WS_CBPOL_D,1.0/.M.US?format=csv"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=20
        )
        return out.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  BIS fetch failed: {e}")
        return ""


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"BIS tracker: {metrics.get('csv_lines', 0)} CSV lines from public SDMX.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"bis-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] bis_tracker starting")
    csv_data = fetch_bis_csv()
    lines = csv_data.split(chr(10)) if csv_data else []
    write_card(f"data-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.bis",
               {
                   "csv_lines": len(lines),
                   "sample": lines[:5],
                   "data_source": "BIS Statistics public SDMX (CSV)",
                   "auto_churn": True,
                   "miner_version": "bis-2",
               })
    print(f"[{NOW()}] bis_tracker done: {len(lines)} lines")
    return 0


if __name__ == "__main__":
    sys.exit(main())
