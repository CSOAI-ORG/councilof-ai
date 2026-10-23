#!/usr/bin/env python3
"""Offline, bounded failure projection. Never retain provider bodies, URLs or errors."""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

from build_stablecoin_promotion_queue import (
    INDEX_REL, READINESS_REL, DEEP_REL, SOURCES_REL, COHORT1_REL, REPLAY_RELS, OUTPUT_REL,
)

SCHEMA = "csoai.stablecoin-failure-snapshot/0.1"
INDEX_BLOB = "25a5353e58678e36595135d5eb30b0adcf29dbe6"
INPUTS = (INDEX_REL, READINESS_REL, DEEP_REL, SOURCES_REL, COHORT1_REL, *REPLAY_RELS, OUTPUT_REL)
MAX_INPUT = 8 * 1024 * 1024
MAX_REPORT = 2 * 1024 * 1024
STATES = {"OK", "MISSING", "UNREADABLE", "OVERSIZE", "INVALID_JSON", "INVALID_SHAPE", "SYMLINK", "UNKNOWN"}
ACTIONS = {
    "PUBLISH_ASSET_SPECIFIC_PROTOCOL_DOORS", "SIGN_ROOT_WITNESS_ANCHOR",
    "STAGE_REPLAYED_MEASUREMENT", "RECONCILE_REPLAY_IDENTITY",
    "REPLAY_EXISTING_MEASUREMENT_AT_RECORDED_HEIGHT",
    "BUILD_REPRODUCIBLE_CHAIN_MEASUREMENT", "RUN_PRIMARY_SOURCE_DEEP_PROBE",
    "REVIEW_ISSUER_SITE_FOR_ATTESTATION", "REGISTER_PRIMARY_SOURCES",
}
BOOL_FIELDS = ("source_registered", "issuer_registered", "queue_measured",
               "queue_replay_ready", "queue_replay_hold")
HEX64 = re.compile(r"[0-9a-f]{64}\Z")
HEX40 = re.compile(r"[0-9a-f]{40}\Z")
IDENTITY = re.compile(r"[0-9]{1,6}\Z")


def enum(value, allowed, default="UNKNOWN"):
    return value if isinstance(value, str) and value in allowed else default


def digest(value):
    return value if isinstance(value, str) and HEX64.fullmatch(value) else None


def identity(value):
    if type(value) not in (str, int):
        return None
    value = str(value)
    return value if IDENTITY.fullmatch(value) else None


def read_json(path: Path, limit: int = MAX_INPUT):
    """No exception text escapes. Read at most limit+1 bytes; reject symlink paths."""
    if any(p.is_symlink() for p in (path, *path.parents)):
        return {}, {"state": "SYMLINK", "sha256": None}, None
    try:
        with path.open("rb") as stream:
            raw = stream.read(limit + 1)
    except FileNotFoundError:
        return {}, {"state": "MISSING", "sha256": None}, None
    except OSError:
        return {}, {"state": "UNREADABLE", "sha256": None}, None
    if len(raw) > limit:
        return {}, {"state": "OVERSIZE", "sha256": None}, None
    sha = hashlib.sha256(raw).hexdigest()
    try:
        data = json.loads(raw)
    except (ValueError, UnicodeError, RecursionError):
        return {}, {"state": "INVALID_JSON", "sha256": sha}, raw
    if not isinstance(data, dict):
        return {}, {"state": "INVALID_SHAPE", "sha256": sha}, raw
    return data, {"state": "OK", "sha256": sha}, raw


def records(data, key):
    rows = data.get(key)
    if not isinstance(rows, list) or len(rows) > 425:
        return {}
    return {identity(row.get("id")): row for row in rows
            if isinstance(row, dict) and identity(row.get("id")) is not None}


def clean_snapshot(data):
    """Reproject even our own baseline; unknown keys/strings can never be forwarded."""
    if not isinstance(data, dict) or data.get("schema") != SCHEMA:
        return None
    revision = data.get("source_revision")
    inputs = data.get("inputs")
    rows = data.get("rows")
    if not isinstance(inputs, list) or len(inputs) != len(INPUTS):
        return None
    if not isinstance(rows, list) or len(rows) > 425:
        return None
    cleaned_inputs = []
    for expected, item in zip(INPUTS, inputs):
        if not isinstance(item, dict) or item.get("path") != str(expected):
            return None
        cleaned_inputs.append({"path": str(expected), "state": enum(item.get("state"), STATES),
                               "sha256": digest(item.get("sha256"))})
    cleaned_rows, seen = [], set()
    for row in rows:
        if not isinstance(row, dict):
            return None
        key = identity(row.get("id"))
        if key is None or key in seen:
            return None
        seen.add(key)
        item = {"id": key}
        for field in BOOL_FIELDS:
            item[field] = row.get(field) if type(row.get(field)) is bool else None
        item["deep_state"] = enum(row.get("deep_state"), {"DEEP_PROBED", "UNMEASURED", "NOT_SCHEDULED"})
        item["measurement_state"] = enum(row.get("measurement_state"), {"MEASURED", "UNMEASURED"})
        item["queue_action"] = enum(row.get("queue_action"), ACTIONS)
        item["deep_sha256"] = digest(row.get("deep_sha256"))
        item["mirror_sha256"] = digest(row.get("mirror_sha256"))
        item["mirror_metadata_state"] = enum(row.get("mirror_metadata_state"), STATES)
        status = row.get("mirror_http")
        item["mirror_http"] = status if type(status) is int and 100 <= status <= 599 else None
        cleaned_rows.append(item)
    return {
        "schema": SCHEMA,
        "source_revision": revision if isinstance(revision, str) and HEX40.fullmatch(revision) else None,
        "index_state": enum(data.get("index_state"), {"PINNED_425", "UNVERIFIED"}),
        "inputs": cleaned_inputs,
        "rows": sorted(cleaned_rows, key=lambda row: int(row["id"])),
    }


def snapshot(repo: Path, source_revision: str | None = None):
    documents, inputs, index_raw = {}, [], None
    for rel in INPUTS:
        data, receipt, raw = read_json(repo / rel)
        documents[rel] = data
        inputs.append({"path": str(rel), **receipt})
        if rel == INDEX_REL:
            index_raw = raw
    index = records(documents[INDEX_REL], "assets")
    blob = (hashlib.sha1(b"blob " + str(len(index_raw)).encode() + b"\0" + index_raw).hexdigest()
            if index_raw is not None else None)
    pinned = blob == INDEX_BLOB and len(index) == 425
    sources = records(documents[SOURCES_REL], "sources")
    readiness = records(documents[READINESS_REL], "assets")
    deep = records(documents[DEEP_REL], "rows")
    queue = records(documents[OUTPUT_REL], "rows")
    rows = []
    # Unverified index bytes never define the identifiers of the diagnostic.
    for key in sorted(index if pinned else [], key=int):
        d = deep.get(key, {})
        q = queue.get(key, {}).get("states")
        q = q if isinstance(q, dict) else {}
        measurement = readiness.get(key, {}).get("measurement")
        measurement = measurement if isinstance(measurement, dict) else {}
        meta, receipt, _ = read_json(repo / DEEP_REL.parent / "mirrors" / (key + ".meta.json"), 65536) if key in deep else ({}, {"state": "MISSING"}, None)
        rows.append({
            "id": key,
            "source_registered": bool(sources.get(key, {}).get("attestation_page")),
            "issuer_registered": bool(sources.get(key, {}).get("issuer_site")),
            "deep_state": d.get("measurement_state", "NOT_SCHEDULED"),
            "measurement_state": measurement.get("state"),
            "queue_measured": q.get("measured"),
            "queue_replay_ready": q.get("replay_stage_ready"),
            "queue_replay_hold": q.get("replay_identity_hold"),
            "queue_action": queue.get(key, {}).get("next_action"),
            "deep_sha256": d.get("mirror_sha256"),
            "mirror_sha256": meta.get("sha256"),
            "mirror_http": meta.get("http"),
            "mirror_metadata_state": receipt["state"],
        })
    return clean_snapshot({"schema": SCHEMA, "source_revision": source_revision,
                           "index_state": "PINNED_425" if pinned else "UNVERIFIED",
                           "inputs": inputs, "rows": rows})


def failure_report(current, baseline):
    before = clean_snapshot(baseline)
    after = clean_snapshot(current)
    if after is None:
        raise ValueError("INVALID_CURRENT_SNAPSHOT")
    old = {r["id"]: r for r in before["rows"]} if before else {}
    new = {r["id"]: r for r in after["rows"]}
    changed = [key for key in sorted(old.keys() | new.keys(), key=int) if old.get(key) != new.get(key)]
    return {
        "schema": "csoai.stablecoin-failure-diagnostics/0.1",
        "baseline_state": "AVAILABLE" if before else "UNAVAILABLE",
        "before": before, "after": after, "changed_ids": changed if before else [],
        "boundary": "Offline projections only. Queue bytes may predate current inputs; compare input hashes. No root-cause or measurement claim.",
    }


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--repo-root", type=Path, default=Path("."))
    parser.add_argument("--source-revision")
    parser.add_argument("--baseline", type=Path)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    current = snapshot(args.repo_root, args.source_revision)
    data = failure_report(current, read_json(args.baseline, MAX_REPORT)[0]) if args.baseline else current
    rendered = (json.dumps(data, sort_keys=True, indent=2) + "\n").encode()
    if len(rendered) > MAX_REPORT:
        raise SystemExit("DIAGNOSTIC_SIZE_LIMIT")
    # Caller provides a dedicated runner-temp file, never a production input path.
    args.output.write_bytes(rendered)
    print("STABLECOIN_DIAGNOSTIC_WRITTEN")


if __name__ == "__main__":
    main()
