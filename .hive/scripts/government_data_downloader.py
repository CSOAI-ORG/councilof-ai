#!/usr/bin/env python3
"""government_data_downloader.py — harvest openly licensed UK government datasets.

Wave 2 play: convert public data (land registry, Companies House, road traffic,
postcodes, flood risk) into CC0-style training corpora and SaaS features.
"""
from __future__ import annotations

import argparse
import csv
import json
import os
import urllib.request
import zipfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from data_budget_guard import enforce

ROOT = Path("/Users/nicholas/clawd")
OUT_DIR = ROOT / ".hive" / "data" / "government"
REPORT = ROOT / ".hive" / "logs" / "government_data_downloads.json"
USER_AGENT = "CSOAI-Hive-Research/1.0 (+https://csoai.co.uk)"

DATASETS: list[dict[str, Any]] = [
    {
        "name": "land_registry_price_paid",
        "title": "UK Property Price Paid (Land Registry)",
        "url": "http://prod.publicdata.landregistry.gov.uk.s3-website-eu-west-1.amazonaws.com/pp-complete.csv",
        "file": "price_paid/pp-complete.csv",
        "license": "OGL-UK-3.0",
        "rows_estimate": 30_000_000,
    },
    {
        "name": "companies_house_basic",
        "title": "Companies House Basic Company Data",
        "url": "https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2025-01-01.zip",
        "file": "companies_house/basic-company-data.zip",
        "license": "OGL-UK-3.0",
        "rows_estimate": 5_000_000,
    },
    {
        "name": "dft_road_traffic",
        "title": "Road Traffic Counts (DfT AADF)",
        "url": "https://storage.googleapis.com/dft-statistics/road-traffic/downloads/rawcount/data/rawcount2023.zip",
        "file": "road_traffic/rawcount2023.zip",
        "license": "OGL-UK-3.0",
        "rows_estimate": 500_000,
    },
    {
        "name": "os_opennames",
        "title": "OS Open Names (GB place names)",
        "url": "https://api.os.uk/downloads/v1/products/OpenNames/downloads?area=GB&format=GeoPackage&redirect",
        "file": "os/opennames.zip",
        "license": "OGL-UK-3.0",
        "rows_estimate": 2_500_000,
    },
]


def download(url: str, dest: Path) -> dict[str, Any]:
    dest.parent.mkdir(parents=True, exist_ok=True)
    tmp = dest.with_suffix(dest.suffix + ".tmp")
    headers = {
        "User-Agent": USER_AGENT,
        "Accept": "*/*",
    }
    if tmp.exists():
        start = tmp.stat().st_size
        headers["Range"] = f"bytes={start}-"
    else:
        start = 0

    result: dict[str, Any] = {"dest": str(dest.relative_to(ROOT)), "started_at": datetime.now(timezone.utc).isoformat()}
    try:
        req = urllib.request.Request(url, headers=headers)
        with urllib.request.urlopen(req, timeout=60) as resp:
            total = resp.headers.get("Content-Length")
            mode = "ab" if start and resp.status == 206 else "wb"
            if resp.status == 416:  # Range not satisfiable; restart
                mode = "wb"
            chunk_size = 1024 * 1024
            with tmp.open(mode) as fh:
                while True:
                    chunk = resp.read(chunk_size)
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


def maybe_unzip(dest: Path) -> None:
    if dest.suffix != ".zip":
        return
    extract_dir = dest.with_suffix("")
    try:
        with zipfile.ZipFile(dest, "r") as zf:
            zf.extractall(extract_dir)
        print(f"  unzipped → {extract_dir}")
    except zipfile.BadZipFile as exc:
        print(f"  unzip failed: {exc}")


def main() -> None:
    parser = argparse.ArgumentParser(description="Download UK government open datasets")
    parser.add_argument("--dataset", help="Download only this dataset name")
    parser.add_argument("--dry-run", action="store_true", help="List datasets and exit")
    args = parser.parse_args()

    datasets = [d for d in DATASETS if not args.dataset or d["name"] == args.dataset]
    if args.dry_run:
        for ds in datasets:
            print(f"{ds['name']}: {ds['title']} → {ds['url']}")
        return

    OUT_DIR.mkdir(parents=True, exist_ok=True)
    results: list[dict[str, Any]] = []
    for ds in datasets:
        dest = OUT_DIR / ds["file"]
        print(f"Downloading {ds['title']} …")
        res = download(ds["url"], dest)
        res["name"] = ds["name"]
        res["title"] = ds["title"]
        res["url"] = ds["url"]
        res["license"] = ds["license"]
        if res["status"] == "ok":
            maybe_unzip(dest)
        results.append(res)
        print(f"  {res['status']} {res.get('mb', 0)} MB")

    REPORT.parent.mkdir(parents=True, exist_ok=True)
    REPORT.write_text(json.dumps({
        "ts": datetime.now(timezone.utc).isoformat(),
        "datasets": results,
        "ok": sum(1 for r in results if r["status"] == "ok"),
        "failed": sum(1 for r in results if r["status"] != "ok"),
    }, indent=2), encoding="utf-8")

    print(f"\nReport written to {REPORT}")
    enforce()


if __name__ == "__main__":
    main()
