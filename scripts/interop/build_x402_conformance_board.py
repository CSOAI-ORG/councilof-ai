#!/usr/bin/env python3
"""Build the x402 conformance snapshot from the live discovery document.

This performs read-only GETs. A row is included only when its resource returns a
parseable 402 challenge; failures remain visible in the output.
"""
from __future__ import annotations

import argparse
import json
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

DEFAULT_SOURCE = "https://councilof.ai/.well-known/x402.json"
DEFAULT_OUT = Path("public/interop/x402-leaderboard/latest.json")
UA = "csoai-x402-board/1.0 (+https://councilof.ai/interop/)"


def get_json(url: str) -> tuple[int, dict[str, Any]]:
    request = urllib.request.Request(url, headers={"Accept": "application/json", "User-Agent": UA})
    try:
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.status, json.load(response)
    except urllib.error.HTTPError as error:
        return error.code, json.load(error)


def build(source_url: str, observed_at: str | None = None) -> dict[str, Any]:
    source_status, discovery = get_json(source_url)
    if source_status != 200 or not isinstance(discovery.get("resources"), list):
        raise ValueError(f"discovery failed: HTTP {source_status}")
    rows = []
    for listed in discovery["resources"]:
        url = listed["url"]
        status, challenge = get_json(url)
        accepts = challenge.get("accepts") if isinstance(challenge, dict) else None
        offer = accepts[0] if isinstance(accepts, list) and accepts else {}
        bazaar = challenge.get("extensions", {}).get("bazaar") if isinstance(challenge, dict) else None
        rows.append({
            "url": url,
            "http_status": status,
            "accepts_count": len(accepts) if isinstance(accepts, list) else 0,
            "network": offer.get("network"),
            "amount_atomic": offer.get("amount"),
            "asset": offer.get("extra", {}).get("name"),
            "bazaar_extension": bazaar is not None,
        })
    timestamp = observed_at or datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    passing = sum(
        row["http_status"] == 402
        and row["accepts_count"] > 0
        and row["network"] == "eip155:8453"
        and row["amount_atomic"] is not None
        and row["bazaar_extension"]
        for row in rows
    )
    return {
        "schema": "csoai.x402-conformance-board/1.0",
        "observed_at": timestamp,
        "definition": "Observed x402 challenge fields for each resource in the live Council of AI discovery document. This is a measurement snapshot, not a grade or certification.",
        "scope": {"operator": "Council of AI", "host": "councilof.ai", "discovery_url": source_url},
        "summary": {"doors_observed": len(rows), "doors_conforming": passing},
        "doors": rows,
        "methodology": "Each discovery URL was fetched once. Conforming means HTTP 402, at least one accepts[] entry, Base mainnet network eip155:8453, an explicit atomic amount (including zero), and extensions.bazaar present.",
        "limitations": [
            "This snapshot measures one operator and does not rank vendors.",
            "It does not prove settlement, demand, revenue, or future availability.",
            "Amounts are observations from 402 challenges and may change after observed_at.",
        ],
        "proof_command": "python3 scripts/interop/build_x402_conformance_board.py --check",
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--source-url", default=DEFAULT_SOURCE)
    parser.add_argument("--out", type=Path, default=DEFAULT_OUT)
    parser.add_argument("--check", action="store_true")
    args = parser.parse_args()
    snapshot = build(args.source_url)
    if args.check:
        committed = json.loads(args.out.read_text())
        expected = snapshot.copy()
        expected["observed_at"] = committed.get("observed_at")
        if expected != committed:
            raise SystemExit("committed board differs from a fresh live observation")
        print(f"x402 board matches live observation: {snapshot['summary']['doors_conforming']}/{snapshot['summary']['doors_observed']}")
        return 0
    args.out.write_text(json.dumps(snapshot, indent=2) + "\n")
    print(f"wrote {args.out}: {snapshot['summary']['doors_conforming']}/{snapshot['summary']['doors_observed']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
