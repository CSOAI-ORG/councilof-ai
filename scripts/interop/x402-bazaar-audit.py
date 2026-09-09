#!/usr/bin/env python3
"""Audit Council presence in both public x402 Bazaar indexes.

    python3 scripts/interop/x402-bazaar-audit.py
        # writes docs/product/X402-BAZAAR-AUDIT.md
    python3 scripts/interop/x402-bazaar-audit.py --json
        # prints the derived reading and writes nothing

PayAI and Coinbase CDP are separate indexes.  This reader walks every advertised
offset or refuses to report absence.  It makes GET requests only; an index entry
is evidence of distribution, never proof of settlement, revenue, demand, or a
certification.  Exact URL host matching prevents lookalike domains from counting.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
import time
import urllib.error
import urllib.parse
import urllib.request
from pathlib import Path
from typing import Any, Callable

INDEXES = [
    ("PayAI", "https://facilitator.payai.network/discovery/resources"),
    ("Coinbase CDP", "https://api.cdp.coinbase.com/platform/v2/x402/discovery/resources"),
]
BASE = INDEXES[0][1]
UA = "csoai-bazaar-audit/0.2 (+https://councilof.ai/interop/)"
OURS = ("councilof.ai", "csoai.org")
OUT = Path("docs/product/X402-BAZAAR-AUDIT.md")
DOOR_BUILDER = Path("functions/api/_x402.ts")
X402_MANIFEST = Path("scripts/fixtures/x402scan/well_known_x402.json")
PAGE = 100  # both public APIs document 100 as the maximum page size
Fetcher = Callable[[str, int], Any]


def door_max_timeout() -> int | None:
    """Read the timeout emitted by our 402 builder instead of typing it here."""
    matches = re.findall(r"maxTimeoutSeconds:\s*(\d+)", DOOR_BUILDER.read_text())
    values = sorted(set(int(value) for value in matches))
    return values[0] if len(values) == 1 else None


def page_url(base: str, *, limit: int, offset: int) -> str:
    parsed = urllib.parse.urlsplit(base)
    query = dict(urllib.parse.parse_qsl(parsed.query, keep_blank_values=True))
    query.update({"limit": str(limit), "offset": str(offset)})
    return urllib.parse.urlunsplit(parsed._replace(query=urllib.parse.urlencode(query)))


def fetch_json(url: str, timeout_seconds: int) -> Any:
    request = urllib.request.Request(
        url,
        headers={"Accept": "application/json", "User-Agent": UA},
        method="GET",
    )
    with urllib.request.urlopen(request, timeout=timeout_seconds) as response:
        return json.load(response)


def scan(
    base: str = BASE,
    *,
    fetcher: Fetcher = fetch_json,
    page_size: int = PAGE,
    timeout_seconds: int = 60,
    retries: int = 2,
) -> tuple[list[dict[str, Any]], int]:
    """Return every advertised resource, or raise instead of guessing absence.

    ``offset`` advances by the number of rows actually returned, not the requested
    page size.  This matters because both services may cap a larger requested page.
    A local ``file://`` fixture is read once and must contain the complete population.
    """
    if not 1 <= page_size <= 100:
        raise ValueError("page_size must be between 1 and 100")
    items: list[dict[str, Any]] = []
    offset = 0
    totals_observed: list[int] = []
    paged = base.startswith(("http://", "https://"))
    while True:
        url = page_url(base, limit=page_size, offset=offset) if paged else base
        payload: Any = None
        last_error: Exception | None = None
        for attempt in range(retries + 1):
            try:
                payload = fetcher(url, timeout_seconds)
                last_error = None
                break
            except Exception as exc:
                last_error = exc
                if attempt < retries:
                    time.sleep(min(2**attempt, 2))
        if last_error is not None:
            raise last_error
        if not isinstance(payload, dict):
            raise ValueError("the index response is not a JSON object")
        page = payload.get("items")
        pagination = payload.get("pagination")
        if not isinstance(page, list) or not isinstance(pagination, dict):
            raise ValueError("the index response lacks items[] or pagination{}")
        total = pagination.get("total")
        reported_offset = pagination.get("offset", offset if not paged else None)
        if isinstance(total, bool) or not isinstance(total, int) or total < 0:
            raise ValueError("pagination.total is not a non-negative integer")
        if paged and reported_offset != offset:
            raise ValueError(f"requested offset {offset}, response reported {reported_offset!r}")
        if not all(isinstance(item, dict) for item in page):
            raise ValueError(f"offset {offset} contains a non-object resource")
        totals_observed.append(total)
        items.extend(page)
        required_total = max(totals_observed)
        if not paged:
            break
        if offset + len(page) >= required_total:
            offset += len(page)
            break
        if not page:
            raise ValueError(f"empty page at offset {offset} before advertised total {required_total}")
        offset += len(page)
        time.sleep(0.05)
    required_total = max(totals_observed) if totals_observed else 0
    if len(items) < required_total:
        raise ValueError(f"scanned {len(items)} of a declared {required_total}; absence would be a guess")
    return items, required_total


def resource_url(value: Any) -> str:
    """Return a URL from either discovery index's resource representation."""
    return value.get("url", "") if isinstance(value, dict) else str(value or "")


def resource_host(item: dict[str, Any]) -> str | None:
    resource = resource_url(item.get("resource"))
    try:
        return (urllib.parse.urlsplit(resource).hostname or "").lower() or None
    except ValueError:
        return None


def ours(items: list[dict[str, Any]], hosts: tuple[str, ...] = OURS) -> list[dict[str, Any]]:
    allowed = {host.lower().rstrip(".") for host in hosts}
    return sorted((item for item in items if resource_host(item) in allowed), key=lambda item: resource_url(item.get("resource")))


def route_key(value: Any) -> str:
    """Compare product routes without treating example query values as products."""
    parsed = urllib.parse.urlsplit(resource_url(value))
    return f"{parsed.scheme}://{parsed.netloc}{parsed.path}".rstrip("/")


def manifest_routes() -> list[str]:
    doc = json.loads(X402_MANIFEST.read_text())
    return [row["url"] for row in doc.get("resources", []) if row.get("url")]


def add_manifest_coverage(result: dict[str, Any], declared_routes: list[str]) -> dict[str, Any]:
    declared = {route_key(url): url for url in declared_routes}
    indexed: dict[str, list[dict[str, Any]]] = {}
    for listing in result["ours"]:
        indexed.setdefault(route_key(listing["resource"]), []).append(listing)
    result["manifest_declared"] = len(declared)
    result["manifest_indexed"] = sum(key in indexed for key in declared)
    result["manifest_current"] = [
        url for key, url in declared.items()
        if any(row["listing_disagrees_with_door"] is False for row in indexed.get(key, []))
    ]
    result["manifest_stale"] = [
        url for key, url in declared.items()
        if indexed.get(key) and not any(row["listing_disagrees_with_door"] is False for row in indexed[key])
    ]
    result["manifest_missing"] = [url for key, url in declared.items() if key not in indexed]
    return result


def reading(name: str, url: str, door_timeout: int | None) -> dict[str, Any]:
    items, total = scan(url)
    mine = ours(items)
    rows = []
    for item in mine:
        accepts = item.get("accepts") or []
        first = accepts[0] if accepts and isinstance(accepts[0], dict) else {}
        observed_timeout = first.get("maxTimeoutSeconds")
        rows.append({
            "resource": item.get("resource"),
            "last_updated": item.get("last_updated") or item.get("lastUpdated"),
            "x402_version": item.get("x402Version"),
            "service_name": item.get("serviceName"),
            "tags": item.get("tags"),
            "description_chars": len(item.get("description") or ""),
            "max_timeout_seconds": observed_timeout,
            "amount": first.get("amount"),
            "listing_disagrees_with_door": None if door_timeout is None else observed_timeout != door_timeout,
        })
    return {
        "index": name,
        "url": url,
        "declared_total": total,
        "scanned": len(items),
        "population_complete": len(items) >= total,
        "ours": rows,
        "limitation": "Offset pagination is a live view, not a transactional snapshot.",
    }


def render_markdown(readings: list[dict[str, Any]], door_timeout: int | None) -> str:
    lines = [
        "# x402 Bazaars — what each index holds for us",
        "",
        "DERIVED by `scripts/interop/x402-bazaar-audit.py`. Never hand-edited; regenerate it.",
        "",
        "There are two indexes. Presence in one says nothing about the other. A listing proves",
        "distribution only — never settlement, revenue, demand, or certification.",
        "",
        f"Our current 402 builder declares `maxTimeoutSeconds` as **{door_timeout if door_timeout is not None else 'multiple values — not comparable'}**.",
        "",
    ]
    for result in readings:
        lines += [
            f"## {result['index']}",
            "",
            f"- `{result['url']}`",
            f"- scanned **{result['scanned']} of {result['declared_total']}** advertised rows",
            f"- ours: **{len(result['ours'])}** listings",
            f"- manifest coverage: **{result['manifest_indexed']} of {result['manifest_declared']}** doors indexed; "
            f"**{len(result['manifest_current'])}** current, **{len(result['manifest_stale'])}** stale, "
            f"**{len(result['manifest_missing'])}** missing",
            "- limitation: the index is a mutable offset-paginated view, not a transactional snapshot",
            "",
        ]
        if result["manifest_stale"]:
            lines += ["Stale manifest doors: " + ", ".join(f"`{route_key(url)}`" for url in result["manifest_stale"]), ""]
        if result["manifest_missing"]:
            lines += ["Missing manifest doors: " + ", ".join(f"`{route_key(url)}`" for url in result["manifest_missing"]), ""]
        if result["ours"]:
            lines += [
                "| resource | last updated | x402 | serviceName | tags | amount | maxTimeout |",
                "|---|---|---|---|---|---|---|",
            ]
            for item in result["ours"]:
                stale = " **(stale)**" if item["listing_disagrees_with_door"] else ""
                lines.append(
                    f"| `{item['resource']}` | {item['last_updated']} | v{item['x402_version']} | "
                    f"{item['service_name'] or '—'} | {item['tags'] or '—'} | {item['amount']} | "
                    f"{item['max_timeout_seconds']}{stale} |"
                )
            lines.append("")
        else:
            lines += ["**Not listed in this complete read.**", ""]
    return "\n".join(lines) + "\n"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--json", action="store_true")
    parser.add_argument("--source", help="audit one index at this URL instead of both")
    args = parser.parse_args()
    targets = [("source", args.source)] if args.source else INDEXES
    timeout = door_max_timeout()
    declared = manifest_routes()
    readings = []
    for name, url in targets:
        try:
            readings.append(add_manifest_coverage(reading(name, url, timeout), declared))
        except (urllib.error.URLError, ValueError, KeyError, json.JSONDecodeError) as exc:
            print(f"UNCHECKABLE {name} {type(exc).__name__}: {exc}; {OUT} left untouched", file=sys.stderr)
            return 2
    document = {
        "kind": "csoai.x402-bazaar-audit/v1",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "door_max_timeout_seconds": timeout,
        "door_max_timeout_source": str(DOOR_BUILDER),
        "x402_manifest_source": str(X402_MANIFEST),
        "indexes": readings,
        "not_proof_of": ["settlement", "revenue", "demand", "certification"],
    }
    if args.json:
        print(json.dumps(document, indent=2))
        return 0
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(render_markdown(readings, timeout))
    print("wrote " + str(OUT) + ": " + "; ".join(
        f"{row['index']} {len(row['ours'])} of {row['scanned']}/{row['declared_total']}" for row in readings
    ))
    return 0


if __name__ == "__main__":
    sys.exit(main())
