#!/usr/bin/env python3
"""worldbank.py — World Bank Open Data API.

Tracks global economic indicators across 200+ countries. Free public.
"""
from __future__ import annotations
import json, os, sys, subprocess
from pathlib import Path
from collections import Counter
from datetime import datetime, timezone

NOW = lambda: datetime.now(timezone.utc).isoformat().replace("+00:00", "Z")
MEAS_DIR = Path.home() / "clawd" / "councilof-ai" / "measurement"
STATE = Path("/tmp/worldbank_state.json")

WB_INDICATORS = {
    "NY.GDP.MKTP.CD": "GDP current USD",
    "NY.GDP.MKTP.KD.ZG": "GDP growth annual %",
    "FP.CPI.TOTL.ZG": "Inflation CPI %",
    "SL.UEM.TOTL.ZS": "Unemployment %",
    "NE.EXP.GNFS.CN": "Exports of goods/services",
    "BN.CAB.XOKA.CD": "Current account balance",
}


def fetch_indicator(code):
    try:
        url = f"https://api.worldbank.org/v2/country/all/indicator/{code}?format=json&date=2024:2026&per_page=20"
        out = subprocess.check_output(
            ["curl", "-sL", "-A", "CSOAI council@csoai.org", url],
            timeout=15
        )
        data = json.loads(out)
        return data[1] if len(data) > 1 else []
    except Exception:
        return []


def write_card(subject, kind, metrics):
    body = {
        "schema": "gspc.measurement-card/0.1",
        "kind": kind,
        "subject": subject,
        "measured_at": NOW(),
        "metrics": metrics,
        "honest_sentence": f"World Bank tracker: {metrics.get('indicators_tracked', 0)} indicators across {metrics.get('countries_count', 0)} countries.",
        "measurement_not_certification": True,
        "auto_churn": True,
        "permissionless": True,
    }
    fname = MEAS_DIR / f"worldbank-{subject.replace(' ', '-')[:50]}.json"
    fname.write_text(json.dumps(body, indent=2))
    return fname


def main():
    print(f"[{NOW()}] worldbank starting")
    all_data = {}
    for code, name in WB_INDICATORS.items():
        rows = fetch_indicator(code)
        countries = set()
        latest = {}
        for r in rows[:50]:
            country = r.get("country", {}).get("value", "?")
            value = r.get("value")
            date = r.get("date")
            if value is not None:
                countries.add(country)
                if country not in latest or date > latest[country][0]:
                    latest[country] = (date, value)
        all_data[code] = {"name": name, "countries": len(countries), "latest": dict(list(latest.items())[:5])}
    write_card(f"indicators-{NOW().replace(':','').replace('-','')[:13]}",
               "measurement.financial.worldbank",
               {
                   "indicators_tracked": len(all_data),
                   "countries_count": max((d["countries"] for d in all_data.values()), default=0),
                   "indicators": all_data,
                   "data_source": "World Bank Open Data v2",
                   "auto_churn": True,
                   "miner_version": "worldbank-1",
               })
    print(f"[{NOW()}] worldbank done: {len(all_data)} indicators")
    return 0


if __name__ == "__main__":
    sys.exit(main())
