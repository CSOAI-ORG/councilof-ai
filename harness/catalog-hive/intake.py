#!/usr/bin/env python3
"""Normalize saved public catalog API snapshots into non-executable candidates."""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "csoai.catalog-hive-candidate/0.1"
MAX_BYTES = 64 * 1024 * 1024
MAX_ITEMS = 50_000


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canon(value: Any) -> str:
    return digest(json.dumps(value, ensure_ascii=False, sort_keys=True,
                             separators=(",", ":")).encode("utf-8"))


def common_kind(kind: str) -> str:
    return {
        "application/mcp-server-card+json": "mcp-server",
        "application/a2a-agent-card+json": "a2a-agent",
        "application/agent-card+json": "a2a-agent",
        "application/skill+json": "agent-skill",
        "application/ai-registry+json": "agent-registry",
    }.get(kind, kind)


def normalize_url(value: Any) -> str | None:
    if not isinstance(value, str) or not value.strip():
        return None
    from urllib.parse import urlsplit, urlunsplit
    parts = urlsplit(value.strip())
    if parts.scheme not in {"http", "https"} or not parts.hostname:
        return None
    host = parts.hostname.lower()
    port = f":{parts.port}" if parts.port and not ((parts.scheme == "https" and parts.port == 443) or (parts.scheme == "http" and parts.port == 80)) else ""
    path = parts.path.rstrip("/") or "/"
    return urlunsplit((parts.scheme.lower(), host + port, path, "", ""))


def source_items(source: str, obj: Any) -> tuple[list[dict], dict]:
    if source == "ard_manifest":
        if not isinstance(obj, dict) or not isinstance(obj.get("entries"), list):
            raise ValueError("ARD snapshot must contain an entries array")
        return obj["entries"], {"manifest_entries": len(obj["entries"])}
    if source == "mcp_registry":
        if not isinstance(obj, dict) or not isinstance(obj.get("servers"), list):
            raise ValueError("MCP registry snapshot must contain a servers array")
        metadata = obj.get("metadata") if isinstance(obj.get("metadata"), dict) else {}
        return obj["servers"], {"next_cursor": metadata.get("nextCursor"),
                                "count": metadata.get("count")}
    if source == "huggingface_hub":
        if not isinstance(obj, list):
            raise ValueError("Hugging Face API snapshot must be a JSON array")
        return obj, {}
    raise ValueError(f"unsupported catalog adapter: {source}")


def normalize(raw: bytes, source: str, source_uri: str,
              retrieved_at: str | None = None) -> dict:
    if len(raw) > MAX_BYTES:
        raise ValueError(f"snapshot exceeds {MAX_BYTES} byte limit")
    obj = json.loads(raw)
    entries, page = source_items(source, obj)
    if len(entries) > MAX_ITEMS:
        raise ValueError(f"page exceeds {MAX_ITEMS} record limit")
    timestamp = retrieved_at or datetime.now(timezone.utc).isoformat()
    source_hash = digest(raw)
    candidates, rejected = [], []
    seen: set[str] = set()

    for index, record in enumerate(entries):
        if not isinstance(record, dict):
            rejected.append({"index": index, "reason": "record_not_object"})
            continue
        if source == "ard_manifest":
            rid = record.get("identifier")
            name = record.get("displayName")
            kind = record.get("type")
            locator = record.get("url")
            payload = record.get("data")
            ref_ok = (isinstance(locator, str) and bool(locator.strip())) != (payload is not None)
            description = record.get("description")
            claims = {"trust_manifest": record.get("trustManifest"),
                     "representative_queries": record.get("representativeQueries", [])}
            original_kind = kind
            kind = common_kind(kind) if isinstance(kind, str) else kind
            identity_urls = [normalize_url(locator)]
        elif source == "mcp_registry":
            server = record.get("server") if isinstance(record.get("server"), dict) else record
            rid = server.get("name")
            name = server.get("title") or rid
            kind = "mcp-server"
            remotes = server.get("remotes") if isinstance(server.get("remotes"), list) else []
            locator = next((normalize_url(remote.get("url")) for remote in remotes
                            if isinstance(remote, dict) and normalize_url(remote.get("url"))), None)
            payload = None
            description = server.get("description")
            claims = {"version": server.get("version"),
                      "packages": server.get("packages"),
                      "remotes": server.get("remotes"),
                      "registry_meta": record.get("_meta")}
            kind = "mcp-server"
            original_kind = kind
            identity_urls = [normalize_url(locator)]
        else:
            rid = record.get("id")
            name = rid
            repo_type = record.get("repoType") or record.get("type") or "model"
            kind = f"huggingface-{repo_type}"
            locator = f"https://huggingface.co/{repo_type}s/{rid}" if isinstance(rid, str) else None
            payload = None
            description = record.get("cardData", {}).get("description") if isinstance(record.get("cardData"), dict) else None
            claims = {"repo_type": repo_type, "sha": record.get("sha"),
                      "last_modified": record.get("lastModified"),
                      "tags": record.get("tags"), "downloads": record.get("downloads"),
                      "likes": record.get("likes"), "pipeline_tag": record.get("pipeline_tag"),
                      "sdk": record.get("sdk")}
            ref_ok = True
            original_kind = kind
            identity_urls = [normalize_url(locator)]

        errors = []
        if not isinstance(rid, str) or not rid.strip(): errors.append("missing_stable_identifier")
        if not isinstance(name, str) or not name.strip(): errors.append("missing_display_name")
        if source == "ard_manifest" and (not isinstance(kind, str) or not kind.strip()): errors.append("missing_media_type")
        if source == "ard_manifest" and not ref_ok: errors.append("invalid_url_or_data_cardinality")
        if isinstance(rid, str) and rid in seen: errors.append("duplicate_identifier_in_page")
        if errors:
            rejected.append({"index": index, "identifier": rid if isinstance(rid, str) else None,
                             "reasons": errors})
            continue
        seen.add(rid)
        identity_urls = [url for url in identity_urls if url]
        provisional_dedupe_key = "url:" + identity_urls[0] if identity_urls else f"{kind}:{rid}"
        candidates.append({
            "schema": SCHEMA,
            "candidate_id": f"{source}:{rid}",
            "provisional_dedupe_key": provisional_dedupe_key,
            "identity_urls": identity_urls,
            "source": {"catalog_id": source, "source_uri": source_uri,
                       "snapshot_sha256": source_hash, "record_sha256": canon(record),
                       "retrieved_at": timestamp, "page_index": index},
            "resource": {"identifier": rid, "display_name": name, "resource_type": kind,
                         "catalog_type": original_kind, "locator": locator,
                         "description_untrusted": description},
            "source_claims_unverified": claims,
            "state": "QUARANTINED_DISCOVERY_ONLY",
            "execution": "NOT_ATTEMPTED",
            "signature_verification": "NOT_ATTEMPTED",
            "publisher_verification": "NOT_ATTEMPTED",
            "health_measurement": "NOT_MEASURED",
            "gspc_measurement": False,
        })
    return {"schema": "csoai.catalog-hive-intake-receipt/0.1",
            "source": source, "source_uri": source_uri, "retrieved_at": timestamp,
            "snapshot_sha256": source_hash, "snapshot_bytes": len(raw),
            "reported_page_count": len(entries), "candidate_count": len(candidates),
            "rejected_count": len(rejected), "pagination": page,
            "candidates": candidates, "rejected": rejected,
            "boundary": "catalog data only; no invocation, validation, measurement, trust verdict, or endorsement"}


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("source", choices=["ard_manifest", "mcp_registry", "huggingface_hub"])
    parser.add_argument("snapshot", type=Path, help="saved response bytes in JSON form")
    parser.add_argument("--source-uri", required=True)
    parser.add_argument("--out", type=Path, required=True, help="candidate JSONL destination")
    parser.add_argument("--receipt", type=Path, required=True)
    parser.add_argument("--retrieved-at")
    args = parser.parse_args()
    result = normalize(args.snapshot.read_bytes(), args.source, args.source_uri, args.retrieved_at)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("w", encoding="utf-8") as stream:
        for candidate in result["candidates"]:
            stream.write(json.dumps(candidate, ensure_ascii=False, sort_keys=True) + "\n")
    summary = {key: value for key, value in result.items() if key != "candidates"}
    args.receipt.parent.mkdir(parents=True, exist_ok=True)
    args.receipt.write_text(json.dumps(summary, ensure_ascii=False, indent=2) + "\n")
    print(json.dumps({k: summary[k] for k in ("source", "snapshot_sha256", "reported_page_count",
                                               "candidate_count", "rejected_count", "pagination")}, sort_keys=True))
    return 0


if __name__ == "__main__":
    try: raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"catalog-hive: {exc}", file=sys.stderr)
        raise SystemExit(2)
