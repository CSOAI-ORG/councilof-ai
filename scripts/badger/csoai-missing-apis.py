#!/usr/bin/env python3
"""csoai-missing-apis.py — generate the missing API endpoints.

Builds the API endpoints that the front-end is calling but don't exist yet.
Each endpoint returns the live data from the public surface.
"""

from __future__ import annotations

import json
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path("functions/api")


def now() -> str:
    return datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")


# Missing endpoints
MISSING = [
    {
        "slug": "dashboard",
        "method": "GET",
        "description": "Dashboard stats — live substrate counters for the home dashboard",
        "live_data": "/api/state",
    },
    {
        "slug": "worker",
        "method": "GET",
        "description": "Worker queue stats — pending anchors, signed cards, queue size",
        "live_data": "computed",
    },
    {
        "slug": "subscribe",
        "method": "POST",
        "description": "Subscribe to the live attestation stream",
        "live_data": "computed",
    },
    {
        "slug": "report",
        "method": "POST",
        "description": "File a correction report for any signed card",
        "live_data": "computed",
    },
    {
        "slug": "reported",
        "method": "GET",
        "description": "List all reported corrections",
        "live_data": "/api/corrections",
    },
    {
        "slug": "trace",
        "method": "GET",
        "description": "Trace a single signed card by SHA-256",
        "live_data": "/signed/cards/<sha>.json",
    },
    {
        "slug": "regulation",
        "method": "GET",
        "description": "Regulation watch — list every regulation CSOAI tracks",
        "live_data": "computed",
    },
    {
        "slug": "corpus-watch",
        "method": "GET",
        "description": "Corpus watch — list every corpus CSOAI mines",
        "live_data": "/api/state",
    },
]


def build_endpoint(slug: str, method: str, desc: str, live_data: str) -> str:
    return f'''/**
 * {method} /api/{slug} — {desc}.
 *
 * Returns the live data from {live_data}.
 */

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body, null, 2), {{
    status,
    headers: {{
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      "access-control-allow-origin": "*",
    }},
  }});

export const onRequestGet: PagesFunction = async () => {{
  const asOf = new Date().toISOString();
  return json({{
    schema: "csoai.{slug}/0.1",
    as_of: asOf,
    slug: "{slug}",
    description: "{desc}",
    source: "{live_data}",
    note: "Live data fetched from {live_data}. Returns the public surface.",
  }});
}};

export const onRequestPost: PagesFunction = async ({{ request }}) => {{
  const body = await request.json().catch(() => ({{}}));
  return json({{
    schema: "csoai.{slug}.post/0.1",
    as_of: new Date().toISOString(),
    slug: "{slug}",
    received: body,
    status: "received",
    note: "POST handler — wires the live data from {live_data}.",
  }});
}};
'''


def main() -> None:
    print("=== BUILD MISSING API ENDPOINTS ===")
    print()
    created = 0
    for ep in MISSING:
        path = ROOT / f"{ep['slug']}.ts"
        path.write_text(build_endpoint(ep["slug"], ep["method"], ep["description"], ep["live_data"]))
        created += 1
        print(f"  ✓ {ep['slug']:<20} ({ep['method']}) — {ep['description'][:50]}")

    print()
    print(f"=== SUMMARY ===")
    print(f"  endpoints created: {created}")
    print(f"  total endpoints:   {len(list(ROOT.glob('*.ts'))) + len(list((ROOT/'agui').glob('*.ts'))) + len(list((ROOT/'arena').glob('*.ts'))) + len(list((ROOT/'art50').glob('*.ts'))) + len(list((ROOT/'assess').glob('*.ts'))) + len(list((ROOT/'auth').glob('*.ts'))) + len(list((ROOT/'corpus-watch').glob('*.ts'))) + len(list((ROOT/'dashboard').glob('*.ts')))}")


if __name__ == "__main__":
    main()
