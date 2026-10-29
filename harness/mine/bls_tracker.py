#!/usr/bin/env python3
"""bls_tracker.py — Bureau of Labor Statistics data.

Tracks employment, inflation, wage growth. Free public BLS data.
"""
from __future__ import annotations
import json, os, sys, urllib.request
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/bls_tracker_state.json")

# BLS Public Data API v2 — free, series IDs for CES/CPI/UNRATE
BLS_SERIES = {
    "CES0000000001": "Total Nonfarm Employment",
    "CES0500000001": "Information Sector Employment",
    "CES5000000001": "Information: AI/Software Employment",
    "LNS14000000": "Unemployment Rate",
    "CUUR0000SA0": "CPI All Items",
}


def fetch_bls_series(series_id):
    try:
        url = f"https://api.bls.gov/publicAPI/v2/timeseries/data/{series_id}?startyear=2025&endyear=2026"
        req = urllib.request.Request(url, headers={"User-Agent": "CSOAI council@csoai.org"})
        with urllib.request.urlopen(req, timeout=15) as r:
            return json.loads(r.read())
    except Exception:
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"BLS tracker: {metrics.get('series_count', 0)} series tracked.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"bls-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] bls_tracker starting")
    series_data = {}
    for sid, name in BLS_SERIES.items():
        data = fetch_bls_series(sid)
        if data.get("Results", {}).get("series"):
            s = data["Results"]["series"][0]
            obs = s.get("data", [])
            if obs:
                latest = obs[0]
                series_data[name] = {
                    "series_id": sid,
                    "latest_value": latest.get("value"),
                    "latest_period": f"{latest.get('year')}-{latest.get('period')}",
                    "year_ago_value": obs[12].get("value") if len(obs) > 12 else None,
                }
    write_card(f"employment-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.bls",
               {
                   "series_count": len(series_data),
                   "series_data": series_data,
                   "data_source": "BLS Public Data API v2",
                   "auto_churn": True,
                   "miner_version": "bls-tracker-1",
               })
    print(f"[{NOW()}] bls_tracker done: {len(series_data)} series")
    return 0


if __name__ == "__main__":
    sys.exit(main())
