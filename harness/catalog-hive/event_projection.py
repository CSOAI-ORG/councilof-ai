#!/usr/bin/env python3
"""Project verified catalog snapshot receipts into descriptive GSPC events.

This emits SOURCE_CHANGED only. It does not admit evidence, probe listed
resources, create measurements, or sign/anchor the event.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

CATALOG_ID = "cisco-ai-catalog"
PINNED_HOST = "ai-catalog.outshift.io"
EVENT_SOURCE = "urn:csoai:catalog-hive:cisco-ai-catalog"
EVENT_TYPE = "ai.csoai.gspc.SOURCE_CHANGED"


def _read_object(path: Path, label: str) -> dict[str, Any]:
    value = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(value, dict):
        raise ValueError(f"{label} must be a JSON object")
    return value


def _parse_time(value: Any, label: str) -> datetime:
    if not isinstance(value, str):
        raise ValueError(f"{label} must be an RFC3339 timestamp")
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    except ValueError as exc:
        raise ValueError(f"{label} must be an RFC3339 timestamp") from exc
    if parsed.tzinfo is None:
        raise ValueError(f"{label} must include a timezone")
    return parsed.astimezone(timezone.utc)


def build_event(fetch: dict[str, Any], intake: dict[str, Any]) -> dict[str, Any]:
    if fetch.get("schema") != "csoai.ard-fetch-receipt/0.1":
        raise ValueError("unsupported fetch receipt schema")
    if intake.get("schema") != "csoai.ard-intake-receipt/0.1":
        raise ValueError("unsupported intake receipt schema")
    for label, value in (("fetch", fetch), ("intake", intake)):
        uri = value.get("final_uri") if label == "fetch" else value.get("source_uri")
        parsed = urlparse(uri or "")
        if parsed.scheme != "https" or parsed.hostname != PINNED_HOST:
            raise ValueError(f"{label} receipt is not from the pinned Cisco catalog host")
    if fetch.get("http_status") != 200:
        raise ValueError("fetch receipt does not record HTTP 200")
    digest = fetch.get("sha256")
    if not isinstance(digest, str) or len(digest) != 64 or any(c not in "0123456789abcdef" for c in digest):
        raise ValueError("fetch receipt has an invalid SHA-256")
    if intake.get("manifest_sha256") != digest:
        raise ValueError("intake digest does not match fetched manifest bytes")
    if fetch.get("bytes") != intake.get("manifest_bytes", fetch.get("bytes")):
        raise ValueError("fetch and intake byte counts conflict")
    retrieved = _parse_time(fetch.get("retrieved_at"), "fetch retrieved_at")
    intake_time = _parse_time(intake.get("retrieved_at"), "intake retrieved_at")
    if retrieved != intake_time:
        raise ValueError("fetch and intake timestamps conflict")
    counts = (intake.get("reported_entries"), intake.get("candidate_count"), intake.get("rejected_count"))
    if any(not isinstance(value, int) or value < 0 for value in counts):
        raise ValueError("intake counts must be non-negative integers")
    if counts[1] + counts[2] > counts[0]:
        raise ValueError("candidate and rejected counts exceed reported entries")

    event_id = hashlib.sha256(f"{CATALOG_ID}:{digest}".encode()).hexdigest()
    return {
        "specversion": "1.0",
        "id": event_id,
        "source": EVENT_SOURCE,
        "type": EVENT_TYPE,
        "subject": CATALOG_ID,
        "time": retrieved.isoformat().replace("+00:00", "Z"),
        "datacontenttype": "application/json",
        "dataschema": "https://councilof.ai/schemas/catalog-source-change/0.1",
        "data": {
            "catalog_id": CATALOG_ID,
            "source_uri": fetch["final_uri"],
            "snapshot_sha256": digest,
            "snapshot_bytes": fetch["bytes"],
            "reported_entries": counts[0],
            "normalized_candidates": counts[1],
            "rejected_entries": counts[2],
            "discovery_state": "QUARANTINED_DISCOVERY_ONLY",
            "layer0_admission": "NOT_ATTEMPTED",
            "gspc_measurement": False,
            "signature": "NOT_CREATED",
            "anchor": "NOT_CREATED",
        },
        "authority": "descriptive",
        "execution": "disabled",
    }


def atomic_create(path: Path, payload: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, temp_name = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(payload)
            stream.flush()
            os.fsync(stream.fileno())
        # Hard-link is an atomic create-if-absent on the same filesystem.
        os.link(temp_name, path)
    finally:
        try:
            os.unlink(temp_name)
        except FileNotFoundError:
            pass


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("fetch_receipt", type=Path)
    parser.add_argument("intake_receipt", type=Path)
    parser.add_argument("--out", required=True, type=Path)
    args = parser.parse_args()
    event = build_event(_read_object(args.fetch_receipt, "fetch receipt"),
                        _read_object(args.intake_receipt, "intake receipt"))
    atomic_create(args.out, (json.dumps(event, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"event_type": event["type"], "id": event["id"],
                      "catalog_id": CATALOG_ID, "gspc_measurement": False,
                      "execution": event["execution"], "output": str(args.out.resolve())}, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"catalog-event: {exc}", file=sys.stderr)
        raise SystemExit(2)
