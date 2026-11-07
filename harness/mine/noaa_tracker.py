#!/usr/bin/env python3
"""noaa_tracker.py — NOAA Climate Data Online."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/noaa_state.json")


def fetch_noaa():
    try:
        # NOAA Global Monitoring Laboratory CO2
        url = "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_annmean_mlo.csv"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=20
        )
        return out.decode("utf-8", errors="ignore")
    except Exception as e:
        print(f"  NOAA fetch failed: {e}")
        return ""


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"NOAA CO2 tracker: {metrics.get('latest_co2_ppm', 'unknown')} ppm.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"noaa-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] noaa_tracker starting")
    csv_data = fetch_noaa()
    lines = csv_data.split(chr(10)) if csv_data else []
    latest_co2 = None
    latest_year = None
    for line in lines:
        if line and not line.startswith("#") and "," in line:
            parts = line.strip().split(",")
            if len(parts) >= 2:
                try:
                    year = int(parts[0])
                    co2 = float(parts[1])
                    latest_year = year
                    latest_co2 = co2
                except (ValueError, IndexError):
                    pass
    write_card(f"co2-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.scientific.noaa",
               {
                   "latest_co2_ppm": latest_co2,
                   "latest_year": latest_year,
                   "data_source": "NOAA GML public",
                   "auto_churn": True,
                   "miner_version": "noaa-1",
               })
    print(f"[{NOW()}] noaa_tracker done: {latest_year} CO2={latest_co2}ppm")
    return 0


if __name__ == "__main__":
    sys.exit(main())
