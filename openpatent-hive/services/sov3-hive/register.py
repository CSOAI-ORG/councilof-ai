#!/usr/bin/env python3
"""
SOV3 Hive Bridge — registers openpatent.ai with the SOV3 28-hive mesh.

Idempotent. Safe to re-run. Reads services/sov3-hive/manifest.json and POSTs
to the SOV3 BFT bridge at http://localhost:3101/api/hive/register.

Returns 200 if registered, 201 if newly created, 409 if duplicate.
"""
from __future__ import annotations

import json
import os
import sys
import urllib.request
import urllib.error
from pathlib import Path

SOV3_BRIDGE = os.environ.get("SOV3_BRIDGE", "http://localhost:3101")
MANIFEST = Path(__file__).parent / "manifest.json"


def main() -> int:
    if not MANIFEST.exists():
        print(f"ERROR: manifest not found at {MANIFEST}", file=sys.stderr)
        return 1
    manifest = json.loads(MANIFEST.read_text())
    payload = json.dumps(manifest).encode("utf-8")
    req = urllib.request.Request(
        f"{SOV3_BRIDGE}/api/hive/register",
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            print(f"OK [{r.status}] {r.read().decode()[:500]}")
            return 0
    except urllib.error.HTTPError as e:
        body = e.read().decode() if e.fp else ""
        if e.code == 409:
            print(f"OK [409] already registered: {body[:300]}")
            return 0
        print(f"ERR [{e.code}] {body[:500]}", file=sys.stderr)
        return 2
    except urllib.error.URLError as e:
        print(f"BRIDGE_UNREACHABLE [{SOV3_BRIDGE}]: {e.reason}", file=sys.stderr)
        # Not fatal — SOV3 may not be running locally
        return 0


if __name__ == "__main__":
    sys.exit(main())
