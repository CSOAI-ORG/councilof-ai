#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Derive a held referee view of an existing axis index; never update that index.

Uses csoai.evidence-event/0.1 and the existing axis-specialist index. This is a
renderer, not another case store, grader, authority service or scheduler. The
caller supplies previously captured bytes. No network, signing or model calls.
"""
from __future__ import annotations
import argparse
import copy
import datetime as dt
import hashlib
import json
from pathlib import Path
import re
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from event import check_renderable, jcs

MAX_BYTES = 2 * 1024 * 1024
HEX = re.compile(r"^[0-9a-f]{64}$")
AXIS = re.compile(r"^[a-z][a-z0-9-]{0,79}$")


def strict_json(raw: bytes):
    if not isinstance(raw, bytes) or len(raw) > MAX_BYTES:
        raise ValueError("input must be bounded bytes")
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise ValueError("duplicate JSON key")
            result[key] = value
        return result
    def constant(_):
        raise ValueError("non-finite JSON number")
    return json.loads(raw.decode("utf-8"), object_pairs_hook=pairs, parse_constant=constant)


def stamp(value):
    if not isinstance(value, str) or len(value) > 40:
        raise ValueError("timestamp required")
    parsed = dt.datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None or parsed.utcoffset() is None:
        raise ValueError("timestamp must include an offset")
    return parsed.astimezone(dt.timezone.utc)


def validate_index(index):
    if not isinstance(index, dict) or index.get("schema") != "csoai.axis-specialist-index/1.0":
        raise ValueError("existing axis index required")
    rows = index.get("specialists")
    if not isinstance(rows, list) or not 1 <= len(rows) <= 1000:
        raise ValueError("bounded specialist roster required")
    charter = index.get("charter", {})
    if (not isinstance(charter, dict) or not HEX.fullmatch(str(charter.get("sha256", "")))
            or charter.get("mapping_kind") != "REVIEW_CROSS_REFERENCE_NOT_COMPLIANCE"):
        raise ValueError("pinned charter review mapping required")
    version = charter.get("version")
    if not isinstance(version, str) or not version.strip() or len(version) > 128:
        raise ValueError("bounded charter version required")
    snapshot = index.get("source_snapshot")
    if snapshot is not None and (not isinstance(snapshot, str) or len(snapshot) > 1024):
        raise ValueError("source snapshot must be a bounded string or null")
    axes = {}
    for row in rows:
        if not isinstance(row, dict):
            raise ValueError("specialist must be an object")
        axis = row.get("axis")
        if not isinstance(axis, str) or not AXIS.fullmatch(axis) or axis in axes:
            raise ValueError("invalid or duplicate axis")
        if row.get("human_decision") != "HOLD" or row.get("may_apply") is not False:
            raise ValueError("renderer accepts only held review indexes")
        articles = row.get("charter_articles")
        if (not isinstance(articles, list) or not articles or
                any(type(a) is not int or a <= 0 for a in articles) or len(set(articles)) != len(articles)):
            raise ValueError("explicit unique article references required")
        axes[axis] = row
    count = index.get("coverage", {}).get("specialists")
    if type(count) is not int or count != len(rows):
        raise ValueError("specialist denominator differs from roster")
    return axes


def validate_events(raw, axes, observed_at):
    values = strict_json(raw)
    if not isinstance(values, list) or len(values) > 10000:
        raise ValueError("bounded event array required")
    events = {}
    for value in values:
        check_renderable(value)  # Existing event-id and doctrine validator.
        observed = value.get("observed")
        if not isinstance(observed, dict):
            raise ValueError("structured observation required")
        links = observed.get("axis_ids")
        if (not isinstance(links, list) or not links or len(links) > len(axes)
                or any(not isinstance(a, str) or a not in axes for a in links)
                or len(set(links)) != len(links)):
            raise ValueError("explicit in-roster axis references required")
        read_at = value.get("claim", {}).get("read_at")
        if stamp(read_at) > observed_at:
            raise ValueError("future event relative to this view")
        source_hash = value.get("claim", {}).get("source_sha256")
        if not isinstance(source_hash, str) or not HEX.fullmatch(source_hash):
            raise ValueError("source digest required")
        # Signatures are not authenticated by this renderer; wrappers are not
        # independent observations. Deduplicate by canonical event identity.
        eid = value["event_id"]
        if eid not in events:
            events[eid] = value
    return events


def content_ref(event):
    """A derived continuity key, NOT another canonical event identity.

    Exclude only capture time and attestation wrappers. Keep source digests,
    methods, declarations, observations, state, limits and correction lineage.
    This detects capture-only rereads; it does not decide semantic equivalence.
    """
    body = {key: copy.deepcopy(value) for key, value in event.items()
            if key not in ("event_id", "signature", "anchors")}
    body["claim"].pop("read_at", None)
    payload = {"identity_kind": "review-content/1", "event_body": body}
    return "sha256:" + hashlib.sha256(jcs(payload)).hexdigest()


def content_groups(events):
    groups = {}
    for eid, value in events.items():
        groups.setdefault(content_ref(value), set()).add(eid)
    return groups


def project(index_bytes: bytes, event_bytes: bytes, *, as_of: str,
            previous_event_bytes: bytes | None = None,
            previous_as_of: str | None = None):
    clock = stamp(as_of)
    index = strict_json(index_bytes)
    axes = validate_index(index)
    current = validate_events(event_bytes, axes, clock)
    if (previous_event_bytes is None) != (previous_as_of is None):
        raise ValueError("comparison bytes and observation time must be supplied together")
    prior = None
    if previous_event_bytes is not None:
        prior_clock = stamp(previous_as_of)
        if prior_clock > clock:
            raise ValueError("comparison baseline is newer than this view")
        prior = validate_events(previous_event_bytes, axes, prior_clock)
    current_ids, prior_ids = set(current), set(prior or {})
    current_content, prior_content = content_groups(current), content_groups(prior or {})
    current_keys, prior_keys = set(current_content), set(prior_content)
    references = []
    for axis in sorted(axes):
        linked = sorted(eid for eid, ev in current.items() if axis in ev["observed"]["axis_ids"])
        references.append({
            "axis": axis,
            "charter_articles": copy.deepcopy(axes[axis]["charter_articles"]),
            "event_refs": [{"event_id": eid, "content_ref": content_ref(current[eid]),
                            "state": current[eid]["state"],
                            "source_sha256": current[eid]["claim"]["source_sha256"],
                            "source_read_at": current[eid]["claim"]["read_at"],
                            "signature_verification": "NOT_PERFORMED"} for eid in linked],
            "review_state": "PENDING_REVIEW" if linked else "NO_LINKED_OBSERVATION",
            "independence_status": "NOT_ESTABLISHED",
            "human_decision": "HOLD", "may_apply": False, "replies": "HELD",
        })
    result = {
        "projection_kind": "AXIS_REFEREE_REVIEW",
        "renderer_revision": "axis-referee-review/2",
        "as_of": as_of,
        "source_index": {"sha256": hashlib.sha256(index_bytes).hexdigest(),
                         "schema": index["schema"],
                         "snapshot": index.get("source_snapshot"),
                         "charter": {key: copy.deepcopy(index["charter"].get(key))
                                     for key in ("version", "sha256", "mapping_kind")}},
        "event_schema": "csoai.evidence-event/0.1",
        "source_events_sha256": hashlib.sha256(event_bytes).hexdigest(),
        "comparison": {
            "baseline_available": prior is not None,
            "previous_as_of": previous_as_of,
            "previous_events_sha256": (hashlib.sha256(previous_event_bytes).hexdigest()
                                       if previous_event_bytes is not None else None),
            "new_event_ids": sorted(current_ids - prior_ids) if prior is not None else None,
            "carried_event_ids": sorted(current_ids & prior_ids) if prior is not None else None,
            "no_longer_observed_ids": sorted(prior_ids - current_ids) if prior is not None else None,
            "no_longer_observed_means_resolved": False,
        },
        "content_comparison": {
            "identity_kind": "review-content/1",
            "unique_current_content_refs": len(current_content),
            "baseline_available": prior is not None,
            "new_content_refs": sorted(current_keys - prior_keys) if prior is not None else None,
            "carried_content_refs": sorted(current_keys & prior_keys) if prior is not None else None,
            "no_longer_observed_content_refs": sorted(prior_keys - current_keys) if prior is not None else None,
            "refreshed_content_refs": sorted(key for key in current_keys & prior_keys
                                             if current_content[key] != prior_content[key]) if prior is not None else None,
            "no_longer_observed_means_resolved": False,
            "semantic_equivalence_established": False,
            "excluded_fields": ["event_id", "signature", "anchors", "claim.read_at"],
        },
        "counts": {"axis_slots": len(axes), "unique_event_refs": len(current),
                   "axes_with_observations": sum(bool(r["event_refs"]) for r in references)},
        "axis_reviews": references,
        "signature_state": "UNSIGNED", "mode": "REVIEW_ONLY",
        "bft_status": "NOT_DEMONSTRATED", "execution_authorized": False,
        "publication_authorized": False, "replies": "HELD",
        "limits": [
            "Structural event validation is not source truth, signature verification or referee independence.",
            "Cross-references do not change signed evidence, axis measurements, legal applicability or authority.",
            "Event counts are not independent reproductions, new model measurements or financial value.",
            "Unknown independence stays unknown; another owner must qualify identity and failure domains.",
            "No baseline authenticity or scheduled ingestion is established by supplying comparison bytes.",
            "Content continuity excludes capture time only; other event changes remain distinct, not automatically improvements.",
        ],
    }
    result["projection_id"] = "sha256:" + hashlib.sha256(jcs(result)).hexdigest()
    return result


def read_bounded(path):
    path = Path(path)
    if any(p.is_symlink() for p in [path, *path.parents]):
        raise ValueError("symlink input refused")
    with path.open("rb") as handle:
        raw = handle.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise ValueError("input exceeds size bound")
    return raw


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--index", required=True)
    parser.add_argument("--events", required=True)
    parser.add_argument("--as-of", required=True)
    parser.add_argument("--previous-events")
    parser.add_argument("--previous-as-of")
    args = parser.parse_args()
    result = project(read_bounded(args.index), read_bounded(args.events), as_of=args.as_of,
                     previous_event_bytes=read_bounded(args.previous_events) if args.previous_events else None,
                     previous_as_of=args.previous_as_of)
    print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))


if __name__ == "__main__":
    main()
