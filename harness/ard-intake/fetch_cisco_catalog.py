#!/usr/bin/env python3
"""Fetch only Cisco's public ARD manifest and save exact bytes plus provenance."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from urllib.parse import urlparse

SOURCE = "https://ai-catalog.outshift.io/.well-known/ard.json"
HOST = "ai-catalog.outshift.io"
MAX_BYTES = 32 * 1024 * 1024


class SameHostRedirect(urllib.request.HTTPRedirectHandler):
    def redirect_request(self, req, fp, code, msg, headers, newurl):
        parsed = urlparse(newurl)
        if parsed.scheme != "https" or parsed.hostname != HOST:
            raise ValueError("refusing redirect outside the pinned HTTPS catalog host")
        return super().redirect_request(req, fp, code, msg, headers, newurl)


def fetch() -> tuple[bytes, dict]:
    request = urllib.request.Request(SOURCE, headers={
        "Accept": "application/json",
        "User-Agent": "CSOAI-ARD-Discovery-Intake/0.1 (+https://councilof.ai)",
    })
    opener = urllib.request.build_opener(SameHostRedirect())
    with opener.open(request, timeout=25) as response:
        final = urlparse(response.geturl())
        if final.scheme != "https" or final.hostname != HOST:
            raise ValueError("final URL is outside the pinned HTTPS catalog host")
        length = response.headers.get("Content-Length")
        if length and int(length) > MAX_BYTES:
            raise ValueError(f"catalog manifest exceeds {MAX_BYTES} byte limit")
        raw = response.read(MAX_BYTES + 1)
        if len(raw) > MAX_BYTES:
            raise ValueError(f"catalog manifest exceeds {MAX_BYTES} byte limit")
        fetched_at = datetime.now(timezone.utc).isoformat()
        receipt = {
            "schema": "csoai.ard-fetch-receipt/0.1",
            "requested_uri": SOURCE,
            "final_uri": response.geturl(),
            "retrieved_at": fetched_at,
            "http_status": response.status,
            "content_type": response.headers.get("Content-Type"),
            "bytes": len(raw),
            "sha256": hashlib.sha256(raw).hexdigest(),
            "boundary": "public manifest bytes only; no cards dereferenced and no endpoints invoked",
        }
        return raw, receipt


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--snapshot", type=Path, required=True, help="destination for exact manifest bytes")
    parser.add_argument("--receipt", type=Path, required=True, help="destination for fetch metadata JSON")
    args = parser.parse_args()
    raw, receipt = fetch()
    args.snapshot.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.snapshot.write_bytes(raw)
    args.receipt.write_text(json.dumps(receipt, indent=2) + "\n")
    print(json.dumps(receipt, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, urllib.error.URLError) as exc:
        print(f"ard-fetch: {exc}", file=sys.stderr)
        raise SystemExit(2)
