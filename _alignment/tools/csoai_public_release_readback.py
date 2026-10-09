#!/usr/bin/env python3
"""Read-only public CSOAI release readback.

This tool records served HTTP bytes and a few narrowly-defined public discovery
contracts. It performs no authentication, publishing, signing, payment,
deployment, or state mutation outside its local receipt directory.
"""
from __future__ import annotations

import hashlib
import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

ROOT = "https://councilof.ai"
OUT_DIR = Path("/Users/nicholas/clawd/_alignment/runtime/public-release-readback")
TIMEOUT = 20
TARGETS = {
    "home": f"{ROOT}/",
    "dashboard_measured": f"{ROOT}/dashboard/?tab=measured",
    "claims_register": f"{ROOT}/claims-register/",
    "mcp_catalogue": f"{ROOT}/mcps/",
    "mcp_transport": f"{ROOT}/mcp",
    "mcp_well_known": f"{ROOT}/.well-known/mcp.json",
    "mcp_server_card": f"{ROOT}/.well-known/mcp/server-card.json",
    "x402_well_known": f"{ROOT}/.well-known/x402.json",
    "feed_canonical": f"{ROOT}/api/feed.xml",
    "feed_alias": f"{ROOT}/feed.xml",
    "rss_alias": f"{ROOT}/rss.xml",
    "atom_alias": f"{ROOT}/atom.xml",
    "sitemap": f"{ROOT}/sitemap.xml",
}


def fetch(name: str, url: str) -> dict:
    req = Request(url, headers={"User-Agent": "CSOAI-public-release-readback/1"})
    try:
        with urlopen(req, timeout=TIMEOUT) as response:
            body = response.read()
            return {
                "name": name,
                "url": url,
                "http_status": getattr(response, "status", response.getcode()),
                "content_type": response.headers.get("content-type"),
                "last_modified": response.headers.get("last-modified"),
                "bytes": len(body),
                "sha256": hashlib.sha256(body).hexdigest(),
                "body": body,
            }
    except HTTPError as error:
        body = error.read()
        return {
            "name": name,
            "url": url,
            "http_status": error.code,
            "content_type": error.headers.get("content-type") if error.headers else None,
            "bytes": len(body),
            "sha256": hashlib.sha256(body).hexdigest(),
            "body": body,
            "error": f"HTTPError: {error.reason}",
        }
    except (URLError, OSError, TimeoutError) as error:
        return {"name": name, "url": url, "http_status": None, "error": f"{type(error).__name__}: {error}"}


def parse_json(record: dict) -> tuple[dict | None, str | None]:
    body = record.get("body")
    if not isinstance(body, bytes):
        return None, "no_response_body"
    try:
        return json.loads(body), None
    except (UnicodeDecodeError, json.JSONDecodeError) as error:
        return None, f"{type(error).__name__}: {error}"


def body_text(record: dict) -> str:
    return record.get("body", b"").decode("utf-8", errors="replace")


def public_record(record: dict) -> dict:
    return {key: value for key, value in record.items() if key != "body"}


def evaluate(records: dict[str, dict]) -> tuple[dict, list[str]]:
    failures: list[str] = []
    for name, record in records.items():
        if record.get("http_status") != 200:
            failures.append(f"{name}: expected HTTP 200, got {record.get('http_status')}")

    discovery: dict = {}
    mcp_doc, err = parse_json(records["mcp_well_known"])
    if err:
        discovery["mcp_well_known_json"] = {"state": "uncheckable", "error": err}
        failures.append("mcp_well_known: JSON is not parseable")
    elif not isinstance(mcp_doc, dict):
        discovery["mcp_well_known_json"] = {"state": "unexpected_shape"}
        failures.append("mcp_well_known: expected object")
    else:
        counts_source = mcp_doc.get("measured", mcp_doc)
        if not isinstance(counts_source, dict):
            counts_source = {}
        total = counts_source.get("total_tools")
        free = counts_source.get("free_tools")
        paid = counts_source.get("metered_tools")
        discovery["mcp_well_known_counts"] = {"total_tools": total, "free_tools": free, "metered_tools": paid}
        if not all(isinstance(value, int) for value in (total, free, paid)) or total != free + paid:
            failures.append("mcp_well_known: total_tools must equal free_tools + metered_tools")

    mcp_text = body_text(records["mcp_well_known"]).lower()
    server_text = body_text(records["mcp_server_card"]).lower()
    legacy_human_count_words = ("eight free", "twelve: eight free", "12: eight free")
    discovery["stale_human_count_phrases"] = {
        "well_known": [phrase for phrase in legacy_human_count_words if phrase in mcp_text],
        "server_card": [phrase for phrase in legacy_human_count_words if phrase in server_text],
    }
    if any(discovery["stale_human_count_phrases"].values()):
        failures.append("MCP discovery metadata still contains stale human-facing count wording")

    feed = body_text(records["feed_canonical"])
    match = re.search(r'<atom:link[^>]+rel=["\']self["\'][^>]+href=["\']([^"\']+)', feed)
    if not match:
        match = re.search(r'<atom:link[^>]+href=["\']([^"\']+)["\'][^>]+rel=["\']self', feed)
    self_url = match.group(1) if match else None
    discovery["feed"] = {"canonical_url": TARGETS["feed_canonical"], "self_url": self_url}
    if self_url != TARGETS["feed_canonical"]:
        failures.append("feed_canonical: self link does not identify the canonical feed URL")

    legacy = "github.com/CSOAI-ORG"
    discovery["legacy_generic_github_references"] = {
        name: body_text(records[name]).count(legacy)
        for name in ("home", "dashboard_measured", "claims_register", "mcp_catalogue")
    }
    if any(discovery["legacy_generic_github_references"].values()):
        failures.append("public HTML still contains generic legacy CSOAI-ORG links")
    discovery["x402_legacy_source_reference_occurrences"] = body_text(records["x402_well_known"]).count(legacy)
    if discovery["x402_legacy_source_reference_occurrences"]:
        failures.append("x402 discovery document still claims an unavailable legacy source location")

    placeholder = "0x…"
    x402_text = body_text(records["x402_well_known"])
    discovery["x402_unicode_ellipsis_placeholder_occurrences"] = x402_text.count(placeholder)
    discovery["x402_raw_angle_bracket_payer_placeholder_occurrences"] = len(
        re.findall(r"receipts\?payer=0x<[^>]*>", x402_text),
    )
    if discovery["x402_unicode_ellipsis_placeholder_occurrences"]:
        failures.append("x402 well-known document still contains a non-copyable Unicode-ellipsis address placeholder")
    if discovery["x402_raw_angle_bracket_payer_placeholder_occurrences"]:
        failures.append("x402 well-known document contains an unencoded angle-bracket address placeholder, which is not URI-safe")

    sitemap_text = body_text(records["sitemap"])
    expected_sitemap_urls = (TARGETS["mcp_transport"], TARGETS["mcp_well_known"], TARGETS["mcp_server_card"], TARGETS["x402_well_known"], TARGETS["feed_canonical"])
    missing = [url for url in expected_sitemap_urls if url not in sitemap_text]
    discovery["sitemap_missing_expected_discovery_urls"] = missing
    if missing:
        failures.append("sitemap is missing one or more discovery endpoints")

    return discovery, failures


def main() -> int:
    observed_at = datetime.now(timezone.utc)
    raw = {name: fetch(name, url) for name, url in TARGETS.items()}
    discovery, failures = evaluate(raw)
    receipt = {
        "schema": "csoai.public-release-readback/1",
        "observed_at": observed_at.isoformat().replace("+00:00", "Z"),
        "mode": "unauthenticated_read_only",
        "boundary": "Served-output observation only; not a deploy, signing, anchoring, traffic, customer-use, or revenue receipt.",
        "targets": {name: public_record(record) for name, record in raw.items()},
        "discovery_contracts": discovery,
        "state": "pass" if not failures else "fail",
        "failures": failures,
    }
    OUT_DIR.mkdir(parents=True, exist_ok=True)
    name = observed_at.strftime("%Y%m%dT%H%M%SZ") + "-public-release-readback.json"
    path = OUT_DIR / name
    payload = json.dumps(receipt, indent=2, sort_keys=True) + "\n"
    path.write_text(payload)
    (OUT_DIR / "latest.json").write_text(payload)
    print(path)
    print(json.dumps({"state": receipt["state"], "failure_count": len(failures), "failures": failures}, indent=2))
    return 0 if not failures else 1

if __name__ == "__main__":
    raise SystemExit(main())
