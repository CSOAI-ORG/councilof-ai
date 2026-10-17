#!/usr/bin/env python3
"""usgs_tracker.py — USGS Earthquake Hazards realtime feed."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/usgs_state.json")


def fetch_usgs():
    try:
        url = "https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/significant_week.geojson"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=15
        )
        return json.loads(out)
    except Exception as e:
        print(f"  USGS fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"USGS earthquake tracker: {metrics.get('earthquakes_week', 0)} significant this week.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"usgs-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] usgs_tracker starting")
    data = fetch_usgs()
    quakes = data.get("features", [])
    by_mag = Counter()
    for q in quakes:
        mag = q.get("properties", {}).get("mag", 0)
        mag_bucket = round(mag)
        by_mag[mag_bucket] += 1
    write_card(f"quakes-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.scientific.usgs",
               {
                   "earthquakes_week": len(quakes),
                   "by_magnitude": dict(by_mag.most_common()),
                   "max_magnitude": max((q.get("properties", {}).get("mag", 0) for q in quakes), default=None),
                   "data_source": "USGS Earthquake Hazards realtime",
                   "auto_churn": True,
                   "miner_version": "usgs-1",
               })
    print(f"[{NOW()}] usgs_tracker done: {len(quakes)} significant quakes")
    return 0


if __name__ == "__main__":
    sys.exit(main())
