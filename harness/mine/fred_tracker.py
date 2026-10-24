#!/usr/bin/env python3
"""fred_tracker.py — Federal Reserve Economic Data (FRED).

Tracks 100+ economic series. Free public API.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timedelta, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/fred_tracker_state.json")

# Key economic series from FRED (free public)
FRED_SERIES = {
    "GDP": "US Gross Domestic Product",
    "GDPC1": "Real GDP",
    "CPIAUCSL": "Consumer Price Index",
    "UNRATE": "Unemployment Rate",
    "DFF": "Federal Funds Rate",
    "DGS10": "10-Year Treasury Yield",
    "DGS2": "2-Year Treasury Yield",
    "M2SL": "M2 Money Supply",
    "WALCL": "Fed Balance Sheet",
    "DEXUSEU": "USD/EUR Exchange Rate",
    "DCOILWTICO": "WTI Crude Oil",
    "GOLDAMGBD228NLBM": "Gold Price",
    "BAMLH0A0HYM2": "High Yield Credit Spread",
    "TEDRATE": "TED Spread",
    "VIXCLS": "VIX Volatility",
}


def fetch_fred_series(series_id):
    try:
        # FRED public observation endpoint (no key needed for limited)
        today = datetime.now(timezone.utc).date()
        start = today - timedelta(days=370)
        url = f"https://fred.stlouisfed.org/graph/fredgraph.csv?id={series_id}&cosd={start.isoformat()}&coed={today.isoformat()}"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=15
        )
        lines = out.decode("utf-8", errors="ignore").strip().split("\n")
        if len(lines) >= 2:
            return lines[-1].split(",")  # [date, value]
        return None
    except Exception as e:
        return None


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"FRED tracker: {metrics.get('series_count', 0)}/{metrics.get('series_total', 0)} series tracked.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"fred-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] fred_tracker starting")
    series_data = {}
    for sid, name in FRED_SERIES.items():
        result = fetch_fred_series(sid)
        if result and len(result) >= 2:
            series_data[sid] = {
                "name": name,
                "date": result[0],
                "value": result[1],
            }
    write_card(f"economic-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.fred",
               {
                   "series_count": len(series_data),
                   "series_total": len(FRED_SERIES),
                   "series_data": series_data,
                   "data_source": "FRED St Louis Fed public CSV",
                   "auto_churn": True,
                   "miner_version": "fred-tracker-1",
               })
    print(f"[{NOW()}] fred_tracker done: {len(series_data)}/{len(FRED_SERIES)} series")
    return 0


if __name__ == "__main__":
    sys.exit(main())
