#!/usr/bin/env python3
"""imf_tracker.py — IMF DataMapper API."""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path(__file__).resolve().parents[2] / "measurement"
STATE = Path("/tmp/imf_tracker_state.json")


def fetch_imf():
    try:
        url = "https://www.imf.org/external/datamapper/api/v1/NGDP_RPCH?periods=2025,2026"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=20
        )
        return json.loads(out)
    except Exception as e:
        print(f"  IMF fetch failed: {e}")
        return {}


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"IMF tracker: GDP growth for {metrics.get('countries_count', 0)} countries.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"imf-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] imf_tracker starting")
    data = fetch_imf()
    values = data.get("values", {}).get("NGDP_RPCH", {})
    countries_count = len(values)
    sample = {k: values[k] for k in list(values.keys())[:10]}
    write_card(f"gdp-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.imf",
               {
                   "countries_count": countries_count,
                   "indicator": "NGDP_RPCH (Real GDP growth %)",
                   "sample": sample,
                   "data_source": "IMF DataMapper public",
                   "auto_churn": True,
                   "miner_version": "imf-1",
               })
    print(f"[{NOW()}] imf_tracker done: {countries_count} countries")
    return 0


if __name__ == "__main__":
    sys.exit(main())
