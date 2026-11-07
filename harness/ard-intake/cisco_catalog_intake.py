#!/usr/bin/env python3
"""Normalize a saved ARD manifest into discovery-only, quarantined candidates."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "csoai.ard-discovery-candidate/0.1"
MAX_MANIFEST_BYTES = 32 * 1024 * 1024
MAX_ENTRIES = 10_000
ALLOWED_MEDIA_TYPES = {
    "application/a2a-agent-card+json",
    "application/mcp-server-card+json",
    "application/agent-card+json",
    "application/skill+json",
    "application/ai-registry+json",
}


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical_digest(value: Any) -> str:
    raw = json.dumps(value, ensure_ascii=False, sort_keys=True,
                     separators=(",", ":")).encode("utf-8")
    return sha256(raw)


def normalize(raw: bytes, source_uri: str, retrieved_at: str | None = None) -> dict[str, Any]:
    if len(raw) > MAX_MANIFEST_BYTES:
        raise ValueError(f"manifest exceeds {MAX_MANIFEST_BYTES} byte limit")
    manifest = json.loads(raw)
    if not isinstance(manifest, dict) or not isinstance(manifest.get("entries"), list):
        raise ValueError("expected ARD manifest object with an entries array")
    entries = manifest["entries"]
    if len(entries) > MAX_ENTRIES:
        raise ValueError(f"entry count exceeds {MAX_ENTRIES} limit")

    candidates: list[dict[str, Any]] = []
    rejected: list[dict[str, Any]] = []
    seen: set[str] = set()
    for index, entry in enumerate(entries):
        if not isinstance(entry, dict):
            rejected.append({"index": index, "reason": "entry_not_object"})
            continue
        identifier = entry.get("identifier")
        name = entry.get("displayName")
        media_type = entry.get("type")
        has_url = isinstance(entry.get("url"), str) and bool(entry["url"].strip())
        has_data = "data" in entry and entry["data"] is not None
        problems = []
        if not isinstance(identifier, str) or not identifier.strip():
            problems.append("missing_identifier")
        if not isinstance(name, str) or not name.strip():
            problems.append("missing_display_name")
        if not isinstance(media_type, str) or not media_type.strip():
            problems.append("missing_media_type")
        if has_url == has_data:
            problems.append("must_have_exactly_one_of_url_or_data")
        if identifier in seen:
            problems.append("duplicate_identifier")
        if problems:
            rejected.append({"index": index, "identifier": identifier if isinstance(identifier, str) else None,
                             "reason": problems})
            continue
        seen.add(identifier)

        trust = entry.get("trustManifest")
        # Merely present trust metadata is not equivalent to verified trust.
        trust_state = "PRESENT_UNVERIFIED" if isinstance(trust, dict) else "ABSENT"
        candidates.append({
            "schema": SCHEMA,
            "candidate_id": "ard:" + canonical_digest(entry),
            "source": {
                "registry": "Cisco AI Catalog / Agent Directory Service",
                "source_uri": source_uri,
                "manifest_sha256": sha256(raw),
                "entry_sha256": canonical_digest(entry),
                "retrieved_at": retrieved_at or datetime.now(timezone.utc).isoformat(),
                "entry_index": index,
            },
            "resource": {
                "identifier": identifier,
                "display_name": name,
                "media_type": media_type,
                "listed_url": entry.get("url") if has_url else None,
                "inline_data": entry.get("data") if has_data else None,
                "representative_queries": entry.get("representativeQueries", []),
                "capabilities": entry.get("capabilities", []),
            },
            "directory_claims": {
                "trust_manifest_state": trust_state,
                "trust_manifest": trust if isinstance(trust, dict) else None,
                "catalog_verified_or_safe_badges": entry.get("metadata", {}).get("status") if isinstance(entry.get("metadata"), dict) else None,
            },
            "intake": {
                "state": "QUARANTINED_DISCOVERY_ONLY",
                "media_type_recognized": media_type in ALLOWED_MEDIA_TYPES,
                "endpoint_contacted": False,
                "signature_verified": False,
                "publisher_domain_verified": False,
                "health_measured": False,
                "gspc_measurement": False,
                "executable": False,
                "next_gate": "independent identity, trust, URL safety and authorization review before any bounded protocol probe",
            },
        })

    return {
        "schema": "csoai.ard-intake-receipt/0.1",
        "source_uri": source_uri,
        "retrieved_at": retrieved_at or datetime.now(timezone.utc).isoformat(),
        "manifest_sha256": sha256(raw),
        "manifest_bytes": len(raw),
        "reported_entries": len(entries),
        "candidate_count": len(candidates),
        "rejected_count": len(rejected),
        "candidates": candidates,
        "rejected": rejected,
        "boundary": "discovery metadata only; not a GSPC measurement, endorsement, live health check, or authorization",
    }


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("manifest", type=Path, help="saved exact ARD manifest JSON")
    parser.add_argument("--out", type=Path, required=True, help="write normalized JSONL candidates")
    parser.add_argument("--receipt", type=Path, help="optional intake receipt JSON")
    parser.add_argument("--source-uri", default="https://ai-catalog.outshift.io/.well-known/ard.json")
    parser.add_argument("--retrieved-at", help="RFC3339 fetch time recorded by the fetcher")
    args = parser.parse_args()
    raw = args.manifest.read_bytes()
    receipt = normalize(raw, args.source_uri, args.retrieved_at)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as stream:
        for item in receipt["candidates"]:
            stream.write(json.dumps(item, ensure_ascii=False, sort_keys=True) + "\n")
    summary = {k: receipt[k] for k in ("schema", "source_uri", "retrieved_at", "manifest_sha256", "manifest_bytes",
                                        "reported_entries", "candidate_count", "rejected_count", "boundary")}
    if args.receipt:
        args.receipt.parent.mkdir(parents=True, exist_ok=True)
        args.receipt.write_text(json.dumps({**summary, "rejected": receipt["rejected"]}, indent=2) + "\n")
    print(json.dumps(summary, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"ard-intake: {exc}", file=sys.stderr)
        raise SystemExit(2)
