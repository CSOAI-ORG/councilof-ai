#!/usr/bin/env python3
"""cc0_harvester.py — harvest public-domain / CC0 datasets for training and features.

Wave 2 play: build a reusable corpus of CC0 text, tabular, and reference data
that can be mixed with synthetic records and UK open-government data.
"""
from __future__ import annotations

import argparse
import json
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from data_budget_guard import enforce

ROOT = Path("/Users/nicholas/clawd")
OUT_DIR = ROOT / ".hive" / "data" / "cc0"
REPORT = ROOT / ".hive" / "logs" / "cc0_harvester.json"
USER_AGENT = "CSOAI-Hive-Research/1.0 (+https://csoai.co.uk)"

SOURCES: list[dict[str, Any]] = [
    {
        "name": "world_cities",
        "title": "World Cities (CC0)",
        "url": "https://raw.githubusercontent.com/datasets/world-cities/master/data/world-cities.csv",
        "file": "world-cities.csv",
        "license": "CC0-1.0",
    },
    {
        "name": "country_codes",
        "title": "Country Codes (CC0)",
        "url": "https://raw.githubusercontent.com/datasets/country-codes/master/data/country-codes.csv",
        "file": "country-codes.csv",
        "license": "CC0-1.0",
    },
    {
        "name": "us_hospital_locations",
        "title": "US Hospital Locations (HIFLD/CC0)",
        "url": "https://raw.githubusercontent.com/datasets/hospital-locations/master/data/hospital-locations.csv",
        "file": "hospital-locations.csv",
        "license": "CC0-1.0",
    },
    {
        "name": "gutenberg_pride_prejudice",
        "title": "Pride and Prejudice (public domain text)",
        "url": "https://www.gutenberg.org/files/1342/1342-0.txt",
        "file": "texts/pride-and-prejudice.txt",
        "license": "public-domain",
    },
    {
        "name": "us_air_quality",
        "title": "US Air Quality (EPA/CC0-ish daily summary)",
        "url": "https://raw.githubusercontent.com/datasets/air-quality/master/data/air-quality.csv",
        "file": "air-quality.csv",
        "license": "CC0-1.0",
    },
]


def download(url: str, dest: Path) -> dict[str, Any]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    headers = {"User-Agent": USER_AGENT, "Accept": "*/*"}
    result = {"dest": str(dest.relative_to(ROOT)), "started_at": datetime.now(timezone.utc).isoformat()}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as resp:
            with tmp.open("wb") as fh:
                while True:
                    chunk = resp.read(1024 * 1024)
                    if not chunk:
                        break
                    fh.write(chunk)
        tmp.rename(dest)
        size = dest.stat().st_size
        result.update({
            "status": "ok",
            "bytes": size,
            "mb": round(size / (1024 * 1024), 2),
            "completed_at": datetime.now(timezone.utc).isoformat(),
        })
    except Exception as exc:
        result.update({"status": "failed", "error": str(exc)})
    return result


def load_extra_sources(path: Path) -> list[dict[str, Any]]:
    if not path.exists():
        return []
    try:
        data = json.loads(path.read_text(encoding="utf-8"))
        return data if isinstance(data, list) else []
    except Exception:
        return []


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source", help="Harvest only this source name")
    parser.add_argument("--dry-run", action="store_true", help="List sources and exit")
    args = parser.parse_args()

    extra = load_extra_sources(ROOT / ".hive" / "config" / "cc0_sources.json")
    sources = SOURCES + extra
    if args.source:
        sources = [s for s in sources if s["name"] == args.source]
    if args.dry_run:
        for s in sources:
            print(f"{s['name']}: {s['title']} → {s['url']}")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results = []
    for s in sources:
        dest = OUT_DIR / s["file"]
        print(f"Harvesting {s['title']} …")
        res = download(s["url"], dest)
        res.update({"name": s["name"], "title": s["title"], "url": s["url"], "license": s["license"]})
        results.append(res)
        print(f"  {res['status']} {res.get('mb', 0)} MB")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({
        "ts": datetime.now(timezone.utc).isoformat(),
        "sources": results,
        "ok": sum(1 for r in results if r["status"] == "ok"),
        "failed": sum(1 for r in results if r["status"] != "ok"),
    }, indent=2), encoding="utf-8")
    print(f"\nReport: {REPORT}")
    enforce()


if __name__ == "__main__":
    main()
