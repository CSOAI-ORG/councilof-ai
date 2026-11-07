#!/usr/bin/env python3
"""nasa_apod.py — NASA Astronomy Picture of the Day."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/nasa_apod_state.json")


def fetch_apod():
    try:
        # NASA APOD open API - use DEMO_KEY
        url = "https://api.nasa.gov/planetary/apod?api_key=DEMO_KEY"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=15
        )
        return json.loads(out)
    except Exception as e:
        print(f"  NASA APOD fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"NASA APOD: '{metrics.get('title', 'unknown')}' by {metrics.get('copyright', 'public')}.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"nasa-apod-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] nasa_apod starting")
    data = fetch_apod()
    write_card(f"apod-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.scientific.nasa",
               {
                   "title": data.get("title", "unknown")[:80],
                   "date": data.get("date"),
                   "media_type": data.get("media_type"),
                   "copyright": (data.get("copyright") or "public")[:50],
                   "explanation_excerpt": (data.get("explanation") or "")[:300],
                   "data_source": "NASA APOD open API (DEMO_KEY)",
                   "auto_churn": True,
                   "miner_version": "nasa-apod-1",
               })
    print(f"[{NOW()}] nasa_apod done: {data.get('title', 'unknown')[:60]}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
