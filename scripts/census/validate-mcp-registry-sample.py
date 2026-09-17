#!/usr/bin/env python3
"""Run the schema-validation stage over a BOUNDED SAMPLE of the live MCP Registry.

This measures a sample. It is NOT a census of the population and the report says
so in its own bytes (``"population": null``, ``"is_sample": true``). Do not
extrapolate a sample distribution to the full registry.

Collection and validation are kept apart on purpose:
  1. collect  — pull pages, keep each served record's bytes verbatim;
  2. validate — run registry_schema_validation over those bytes, never editing them.

Usage:
  python3 scripts/census/validate-mcp-registry-sample.py --limit 500 \
      --out /tmp/mcp-registry-validation-sample.json --allow-network
"""

from __future__ import annotations

import argparse
import importlib.util
import json
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

_SPEC = importlib.util.spec_from_file_location(
    "registry_schema_validation",
    Path(__file__).with_name("registry_schema_validation.py"),
)
rsv = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
sys.modules["registry_schema_validation"] = rsv
_SPEC.loader.exec_module(rsv)

BASE = "https://registry.modelcontextprotocol.io/v0/servers"


def collect(limit: int, page_size: int = 100, timeout: float = 30.0):
    """Return [(raw_bytes, http_context)] — the served bytes, unedited."""
    out = []
    cursor = None
    pages = 0
    stop = "limit reached"
    seen_cursors = set()
    while len(out) < limit:
        url = f"{BASE}?limit={page_size}" + (f"&cursor={cursor}" if cursor else "")
        req = urllib.request.Request(
            url, headers={"User-Agent": "csoai-registry-census/1"}
        )
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            status = resp.status
            page = json.loads(resp.read())
        pages += 1
        servers = page.get("servers") or []
        if not servers:
            stop = f"page {pages} returned 0 records"
            break
        for envelope in servers:
            if len(out) >= limit:
                break
            # Re-serialise ONE envelope from the page. This is a framing change
            # only: no key, value or structure of the served record is altered.
            out.append(
                (
                    json.dumps(envelope, sort_keys=True).encode("utf-8"),
                    {"http_status": status, "page": pages, "url": url},
                )
            )
        cursor = (page.get("metadata") or {}).get("nextCursor")
        if not cursor:
            stop = "cursor exhausted before limit"
            break
        if cursor in seen_cursors:
            stop = f"cursor repeated at page {pages} (upstream pagination defect)"
            break
        seen_cursors.add(cursor)
    return out, {"pages_fetched": pages, "stop_reason": stop}


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("--limit", type=int, default=500, help="bounded sample size")
    ap.add_argument("--out", default="/tmp/mcp-registry-validation-sample.json")
    ap.add_argument("--cache-dir", default=str(rsv.DEFAULT_CACHE_DIR))
    ap.add_argument(
        "--allow-network",
        action="store_true",
        help="permit fetching (and caching) schemas a record declares",
    )
    args = ap.parse_args(argv)

    records, collection_meta = collect(args.limit)
    resolver = rsv.SchemaResolver(args.cache_dir, allow_network=args.allow_network)

    verdicts = []
    rows = []
    for raw, ctx in records:
        verdict = rsv.validate_record_bytes(raw, resolver)
        verdicts.append(verdict)
        rows.append({**verdict.to_dict(), "http": ctx})

    dist = rsv.distribution(verdicts)
    by_schema: dict[str, dict[str, int]] = {}
    for v in verdicts:
        key = v.schema_url or "<undeclared>"
        by_schema.setdefault(key, {s: 0 for s in rsv.SCHEMA_STATES})
        by_schema[key][v.schema_state] += 1

    report = {
        "is_sample": True,
        "population": None,
        "population_note": (
            "The registry population was not enumerated by this run. These counts "
            "describe the sampled records only and must not be extrapolated."
        ),
        "sample_size": len(records),
        "requested_limit": args.limit,
        "sampling_method": (
            "first N records in registry pagination order — convenience sample, "
            "not random"
        ),
        "collected_at": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "source": BASE,
        "collection": collection_meta,
        "source_state_note": (
            "Every sampled record is SOURCE_ACCEPTED: the upstream served it. "
            "That fact confers nothing about schema validity."
        ),
        "schema_state_distribution": dist,
        "distribution_by_declared_schema": by_schema,
        "invalid_records": [
            {
                "name": (r["record_identity"] or {}).get("name"),
                "version": (r["record_identity"] or {}).get("version"),
                "schema_url": r["schema_url"],
                "violations": r["violations"],
            }
            for r in rows
            if r["schema_state"] == rsv.SCHEMA_INVALID
        ],
        "records": rows,
    }
    Path(args.out).write_text(json.dumps(report, indent=2, sort_keys=True) + "\n")

    print(f"sample_size={len(records)} (SAMPLE, not the population)")
    print(f"collection: {collection_meta}")
    for state in rsv.SCHEMA_STATES:
        print(f"  {state:<20} {dist[state]}")
    print(f"report -> {args.out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
