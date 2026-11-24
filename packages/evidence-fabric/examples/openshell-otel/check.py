#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Verify EXACT OpenTelemetry file exporter readback, including multiplicity.

Original retained OpenShell v0.1.2 readback has 3 real captured evaluation
events. A dictionary keyed only by csoai.event_id silently overwrote duplicate
events and ignored extra collector rows; that made an altered trace look
IDENTICAL. This checker accounts for every log record and attribute, and
keeps an explicit UNCHECKABLE result for malformed inputs.

Usage: python3 check.py [SENT.otlp.json] [READBACK.jsonl]
No network access, provider inference or production state writes.
"""
from __future__ import annotations

from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys

EVENT_ID = re.compile(r"^sha256:[0-9a-f]{64}$")


class Uncheckable(ValueError):
    pass


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def _attr_value(entry):
    value = entry.get("value")
    if not isinstance(value, dict) or len(value) != 1:
        raise Uncheckable("attribute has missing/ambiguous OTLP value")
    name, val = next(iter(value.items()))
    if name not in {"stringValue", "intValue", "doubleValue", "boolValue",
                    "bytesValue", "arrayValue", "kvlistValue"}:
        raise Uncheckable("unsupported OTLP attribute value type")
    return val


def records(doc):
    """Flatten every physical log entry; DO NOT coalesce by event_id."""
    if not isinstance(doc, dict) or not isinstance(doc.get("resourceLogs"), list):
        raise Uncheckable("resourceLogs absent or invalid")
    out = []
    for resource in doc["resourceLogs"]:
        if not isinstance(resource, dict) or not isinstance(resource.get("scopeLogs"), list):
            raise Uncheckable("scopeLogs absent or invalid")
        for scope in resource["scopeLogs"]:
            if not isinstance(scope, dict) or not isinstance(scope.get("logRecords"), list):
                raise Uncheckable("logRecords absent or invalid")
            for record in scope["logRecords"]:
                if not isinstance(record, dict) or not isinstance(record.get("attributes"), list):
                    raise Uncheckable("record attributes absent or invalid")
                attrs = {}
                for attr in record["attributes"]:
                    if not isinstance(attr, dict) or not isinstance(attr.get("key"), str):
                        raise Uncheckable("invalid OTLP attribute key")
                    key = attr["key"]
                    if key in attrs:
                        raise Uncheckable("duplicate OTLP attribute key")
                    attrs[key] = _attr_value(attr)
                eid = attrs.get("csoai.event_id")
                if not isinstance(eid, str) or not EVENT_ID.fullmatch(eid):
                    raise Uncheckable("missing or invalid csoai.event_id")
                event_name = record.get("eventName")
                timestamp = record.get("timeUnixNano")
                if not isinstance(event_name, str) or not event_name or not isinstance(timestamp, str) or not re.fullmatch(r"[0-9]+", timestamp):
                    raise Uncheckable("missing/invalid eventName or timestamp")
                out.append({
                    "event_id": eid,
                    "eventName": event_name,
                    "timeUnixNano": timestamp,
                    "attributes": attrs,
                })
    if not out:
        raise Uncheckable("zero log records; empty is not identical")
    return out


def flat(doc):
    """Backward-compatible helper: reject duplicates instead of overwriting."""
    out = {}
    for event in records(doc):
        eid = event["event_id"]
        if eid in out:
            raise Uncheckable("duplicate csoai.event_id")
        out[eid] = {k: v for k, v in event.items() if k != "event_id"}
    return out


def read_readback(path):
    entries = []
    count = 0
    with Path(path).open(encoding="utf-8") as file:
        for raw in file:
            if not raw.strip():
                continue
            count += 1
            if count > 100000:
                raise Uncheckable("too many JSONL envelopes")
            try:
                entries.extend(records(json.loads(raw)))
            except (json.JSONDecodeError, UnicodeError) as exc:
                raise Uncheckable("malformed collector JSONL") from exc
    if not entries:
        raise Uncheckable("empty collector readback")
    return entries


def compare(sent_path, back_path):
    try:
        sent = records(json.loads(Path(sent_path).read_text(encoding="utf-8")))
        back = read_readback(back_path)
    except (json.JSONDecodeError, UnicodeError) as exc:
        raise Uncheckable("malformed OTLP sent payload") from exc

    counts_sent = Counter(x["event_id"] for x in sent)
    counts_back = Counter(x["event_id"] for x in back)
    sent_map = {x["event_id"]: x for x in sent}
    back_map = {x["event_id"]: x for x in back}
    missing = sorted(set(sent_map) - set(back_map))
    unexpected = sorted(set(back_map) - set(sent_map))
    duplicated_sent = sorted(eid for eid, n in counts_sent.items() if n > 1)
    duplicated_readback = sorted(eid for eid, n in counts_back.items() if n > 1)
    changed = sorted(eid for eid in set(sent_map) & set(back_map) if sent_map[eid] != back_map[eid])
    identical = (bool(sent) and bool(back)
                 and len(sent) == len(back)
                 and not (missing or unexpected or duplicated_sent or duplicated_readback or changed))
    rows = []
    for eid in sorted(sent_map):
        match = eid in back_map and eid not in changed and eid not in duplicated_readback and eid not in duplicated_sent
        row = back_map.get(eid, {})
        rows.append({
            "event_id": eid,
            "read_back": eid in back_map,
            "identical": match,
            "eventName": row.get("eventName"),
            "state": row.get("attributes", {}).get("gen_ai.evaluation.score.label"),
        })
    return {
        "schema": "csoai.openshell-otel-exact-readback/0.2",
        "sent_sha256": sha(sent_path),
        "readback_sha256": sha(back_path),
        "records_sent": len(sent),
        "records_read_back": len(back),
        "unique_sent_event_ids": len(sent_map),
        "unique_readback_event_ids": len(back_map),
        "missing_event_ids": missing,
        "unexpected_event_ids": unexpected,
        "duplicate_sent_event_ids": duplicated_sent,
        "duplicate_readback_event_ids": duplicated_readback,
        "changed_event_ids": changed,
        "records": rows,
        "result": "IDENTICAL" if identical else "MISMATCH",
        "collector_record_content_independently_verified": False,
        "runtime_effectiveness_verified": False,
        "source_capture_signature_verified": False,
    }


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if len(args) > 2:
        print("usage: check.py [SENT.otlp.json] [READBACK.jsonl]", file=sys.stderr)
        return 2
    sent = args[0] if len(args) >= 1 else "data/openshell.otlp.json"
    back = args[1] if len(args) >= 2 else "data/readback-otelcol-contrib-v0.162.0.jsonl"
    try:
        report = compare(sent, back)
    except (Uncheckable, OSError, ValueError, TypeError, KeyError) as exc:
        print(json.dumps({"result": "UNCHECKABLE", "reason": type(exc).__name__,
                          "actual_effect_verified": False}, sort_keys=True))
        return 2
    print(json.dumps(report, indent=1, sort_keys=True))
    return 0 if report["result"] == "IDENTICAL" else 1


if __name__ == "__main__":
    sys.exit(main())
