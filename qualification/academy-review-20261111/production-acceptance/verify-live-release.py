#!/usr/bin/env python3
"""Read-only, finite release readback for the Academy 0.3.0 source bytes."""
import argparse
import concurrent.futures
import datetime as dt
import hashlib
import json
import re
import urllib.error
import urllib.request
from pathlib import Path

SOURCE_COMMIT = "ccd06e2d625f5cdc3b8d1f955177dabd3a1c6ed9"
ORIGINS = ["https://councilof.ai", "https://councilof-ai.pages.dev"]
SOURCES = [
    ("/", "homepage", None),
    ("/evidence-learning/element.js?v=0.3.0&rev=d86d5307e36e", "component",
     "d86d5307e36ecdc7cdd5c24f0ee7806281a7e581bd0aa986bb8cdaea2bb21415"),
    ("/evidence-learning/contract.mjs?rev=aedf2a1d40af", "contract",
     "aedf2a1d40afbe12c43745822b69a6296bb50e2085398aef373e67c65998c377"),
]


def now():
    return dt.datetime.now(dt.timezone.utc)


def read_one(item):
    origin, path, kind, expected = item
    url = origin + path
    row = {"requested_url": url, "kind": kind, "expected_sha256": expected}
    try:
        request = urllib.request.Request(url, headers={"User-Agent": "Council-Academy-Release-Readback/1.0"})
        with urllib.request.urlopen(request, timeout=25) as response:
            body = response.read()
            row.update(status=response.status, final_url=response.geturl(), bytes=len(body),
                       sha256=hashlib.sha256(body).hexdigest(),
                       content_type=response.headers.get("Content-Type"),
                       etag=response.headers.get("ETag"))
        if kind == "homepage":
            row["prerender_marker"] = bool(re.search(
                rb'data-testid="home-verify"|Check an AI claim in your browser', body, re.I))
            row["minimum_bytes"] = 20000
            row["passed"] = row["status"] == 200 and len(body) >= 20000 and row["prerender_marker"]
        else:
            row["passed"] = row["status"] == 200 and row["sha256"] == expected
    except (OSError, urllib.error.URLError) as error:
        row.update(passed=False, error=str(error))
    row["observed_at"] = now().isoformat()
    return row


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--label", required=True)
    parser.add_argument("--output", type=Path, required=True)
    parser.add_argument("--compare", type=Path)
    args = parser.parse_args()
    started = now()
    if args.output.exists():
        parser.error("output already exists; keep prior observations")
    previous = None
    gap = None
    if args.compare:
        previous_bytes = args.compare.read_bytes()
        previous = json.loads(previous_bytes)
        gap = (started - dt.datetime.fromisoformat(previous["finished_at"])).total_seconds()
        if gap < 120:
            parser.error(f"delayed readback requires 120 seconds after prior completion; elapsed {gap:.1f}")
    items = [(origin, *source) for origin in ORIGINS for source in SOURCES]
    with concurrent.futures.ThreadPoolExecutor(max_workers=6) as pool:
        rows = list(pool.map(read_one, items))
    receipt = {"schema": "csoai.academy-live-readback/0.1", "label": args.label,
               "source_commit": SOURCE_COMMIT, "started_at": started.isoformat(),
               "finished_at": now().isoformat(), "requests": rows,
               "passed": all(row["passed"] for row in rows),
               "scope": "Anonymous HTTP observations and source-byte equality; no human assessment, signature authentication or execution authority."}
    if previous is not None:
        receipt["previous_receipt_sha256"] = hashlib.sha256(previous_bytes).hexdigest()
        receipt["seconds_after_previous_completion"] = gap
    with args.output.open("x", encoding="utf-8") as output:
        json.dump(receipt, output, indent=2)
        output.write("\n")
    print(json.dumps({"label": args.label, "passed": receipt["passed"],
                      "requests_passed": sum(row["passed"] for row in rows),
                      "requests_total": len(rows), "output": str(args.output),
                      "seconds_after_previous_completion": gap}))
    return 0 if receipt["passed"] else 1


if __name__ == "__main__":
    raise SystemExit(main())
