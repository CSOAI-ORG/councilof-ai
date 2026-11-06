#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Inspect declared local GPAI evidence files: availability and SHA-256 only.

No document interpretation, legal determination, remote access, model inference,
signing or execution occurs. Records reuse csoai.evidence-event/0.1.
"""
import argparse
from datetime import datetime
import errno
import hashlib
import json
import os
from pathlib import Path, PurePosixPath
import re
import stat

import event

VERSION = "0.1.0"
MAX_FILE_BYTES = 64 * 1024 * 1024
HEX = re.compile(r"^[0-9a-f]{64}$")
EVENT_REF = re.compile(r"^sha256:[0-9a-f]{64}$")
ARTICLE_BASE = "https://ai-act-service-desk.ec.europa.eu/en/ai-act/article-"
# These are documentary evidence slots, not an exhaustive legal checklist.
SLOTS = {
    "53.1.a": ("Technical documentation", 53),
    "53.1.b": ("Information for downstream system providers", 53),
    "53.1.c": ("Copyright policy", 53),
    "53.1.d": ("Training-content summary", 53),
    "54.1": ("Authorised-representative mandate", 54),
    "55.1.a": ("Model evaluation records", 55),
    "55.1.b": ("Systemic-risk assessment and mitigation records", 55),
    "55.1.c": ("Serious-incident records", 55),
    "55.1.d": ("Cybersecurity records", 55),
}


class PacketError(ValueError):
    pass


def require(ok, message):
    if not ok:
        raise PacketError(message)


def nonempty(value):
    return isinstance(value, str) and bool(value.strip())


def is_hex(value):
    return isinstance(value, str) and bool(HEX.fullmatch(value))


def fields(obj, allowed, required, label):
    require(isinstance(obj, dict), label + " must be an object")
    require(not (set(obj) - set(allowed)), label + " contains unknown keys")
    require(set(required).issubset(obj), label + " is missing required keys")


def unique_object(pairs):
    result = {}
    for key, value in pairs:
        require(key not in result, "duplicate JSON key: " + key)
        result[key] = value
    return result


def read_json(path):
    return json.loads(Path(path).read_text(encoding="utf-8"), object_pairs_hook=unique_object)


def path_parts(value):
    require(nonempty(value), "artifact path must be a nonempty relative path")
    require("\\" not in value and "\x00" not in value, "invalid artifact path")
    parts = value.split("/")
    require(not PurePosixPath(value).is_absolute() and all(p not in ("", ".", "..") for p in parts),
            "artifact path must stay inside the packet root without traversal")
    return parts


def validate_packet(packet):
    fields(packet, {"packet_id", "checked_at", "legal_source", "slots"},
           {"packet_id", "checked_at", "legal_source", "slots"}, "packet")
    require(nonempty(packet["packet_id"]), "packet_id required")
    require(nonempty(packet["checked_at"]), "checked_at required")
    try:
        checked_at = datetime.fromisoformat(packet["checked_at"].replace("Z", "+00:00"))
    except ValueError as exc:
        raise PacketError("checked_at must be a valid timezone-aware timestamp") from exc
    require(checked_at.tzinfo is not None, "checked_at must have a timezone")
    legal = packet["legal_source"]
    fields(legal, {"version_label", "source_bytes_sha256", "retrieval_record_ref"},
           {"version_label", "source_bytes_sha256", "retrieval_record_ref"}, "legal_source")
    require(nonempty(legal["version_label"]), "legal source version label required")
    require(legal["source_bytes_sha256"] is None or is_hex(legal["source_bytes_sha256"]),
            "legal source digest must be null or SHA-256")
    require(legal["retrieval_record_ref"] is None or nonempty(legal["retrieval_record_ref"]),
            "legal retrieval reference must be null or nonempty")
    require(isinstance(packet["slots"], list), "slots must be an array")
    slots = {}
    for item in packet["slots"]:
        fields(item, {"slot_id", "path", "expected_sha256", "applicability"},
               {"slot_id", "path", "expected_sha256", "applicability"}, "slot")
        identity = item["slot_id"]
        require(isinstance(identity, str) and identity in SLOTS, "unknown evidence slot")
        require(identity not in slots, "duplicate evidence slot")
        if item["path"] is None:
            require(item["expected_sha256"] is None, "absent path must not claim expected bytes")
        else:
            path_parts(item["path"])
            require(is_hex(item["expected_sha256"]), "artifact expected SHA-256 required")
        applicability = item["applicability"]
        fields(applicability, {"state", "review_event_id", "reviewer_ref", "reason"}, {"state"}, "applicability")
        state = applicability["state"]
        require(isinstance(state, str) and state in {"UNKNOWN", "APPLICABLE", "NOT_APPLICABLE"}, "invalid applicability state")
        if state != "UNKNOWN":
            require(isinstance(applicability.get("review_event_id"), str) and
                    EVENT_REF.fullmatch(applicability["review_event_id"]), "applicability needs external review reference")
            require(nonempty(applicability.get("reviewer_ref")) and nonempty(applicability.get("reason")),
                    "applicability needs reviewer reference and reason")
        slots[identity] = item
    return slots


def open_root(root):
    supplied = Path(root)
    require(not supplied.is_symlink(), "packet root must not be a symlink")
    try:
        resolved = supplied.resolve(strict=True)
        fd = os.open(resolved, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
    except OSError as exc:
        raise PacketError("packet root must be an existing directory") from exc
    return fd


def inspect_file(root_fd, relative, expected, max_bytes=MAX_FILE_BYTES):
    """Walk by directory descriptors; refuse symlinks and nonregular files."""
    descriptors = []
    parent = root_fd
    try:
        parts = path_parts(relative)
        for part in parts[:-1]:
            fd = os.open(part, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW, dir_fd=parent)
            descriptors.append(fd); parent = fd
        # NONBLOCK prevents a FIFO or device from blocking before fstat rejects it.
        fd = os.open(parts[-1], os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=parent)
        descriptors.append(fd)
        before = os.fstat(fd)
        if not stat.S_ISREG(before.st_mode):
            return {"status": "NONREGULAR_REFUSED", "actual_sha256": None, "bytes": None}
        if before.st_size > max_bytes:
            return {"status": "SIZE_LIMIT", "actual_sha256": None, "bytes": before.st_size}
        h = hashlib.sha256(); total = 0
        while True:
            chunk = os.read(fd, 65536)
            if not chunk:
                break
            total += len(chunk)
            if total > max_bytes:
                return {"status": "SIZE_LIMIT", "actual_sha256": None, "bytes": total}
            h.update(chunk)
        after = os.fstat(fd)
        if (before.st_size, before.st_mtime_ns, before.st_ctime_ns) != (after.st_size, after.st_mtime_ns, after.st_ctime_ns):
            return {"status": "CHANGED_DURING_READ", "actual_sha256": None, "bytes": total}
        actual = h.hexdigest()
        return {"status": "BYTES_MATCH" if actual == expected else "DIGEST_MISMATCH",
                "actual_sha256": actual, "bytes": total}
    except FileNotFoundError:
        return {"status": "MISSING", "actual_sha256": None, "bytes": None}
    except OSError as exc:
        status = "UNSAFE_PATH_REFUSED" if exc.errno in (errno.ELOOP, errno.ENOTDIR) else "UNREADABLE"
        return {"status": status, "actual_sha256": None, "bytes": None}
    finally:
        for fd in reversed(descriptors):
            os.close(fd)


def check_packet(packet, root, *, max_bytes=MAX_FILE_BYTES):
    require(type(max_bytes) is int and max_bytes > 0, "positive byte limit required")
    declarations = validate_packet(packet)
    packet_sha = event.sha256_hex(event.jcs(packet))
    code_sha = hashlib.sha256(Path(__file__).read_bytes()).hexdigest()
    events = []
    root_fd = open_root(root)
    try:
        for slot_id, (label, article) in SLOTS.items():
            item = declarations.get(slot_id)
            if item is None or item["path"] is None:
                inspection = {"status": "NOT_SUPPLIED", "actual_sha256": None, "bytes": None}
            else:
                inspection = inspect_file(root_fd, item["path"], item["expected_sha256"], max_bytes)
            matches = inspection["status"] == "BYTES_MATCH"
            applicability = item["applicability"] if item else {"state": "UNKNOWN"}
            # A byte match never alters applicability or establishes a legal outcome.
            observed = {**inspection, "slot_id": slot_id, "checked_at": packet["checked_at"],
                        "timestamp_basis": "CALLER_SUPPLIED_INSPECTION_TIME",
                        "applicability_declaration": applicability,
                        "applicability_verification": "NOT_PERFORMED",
                        "legal_source_verification": "NOT_FETCHED_OR_VERIFIED",
                        "document_content_assessment": "NOT_PERFORMED",
                        "authenticity_assessment": "NOT_PERFORMED", "legal_outcome": "NOT_ESTABLISHED"}
            events.append(event.build(
                subject={"kind": "repository", "locator": packet["packet_id"]},
                claim={"text": "A declared local documentary artifact was checked for availability and byte integrity.",
                       "source_url": ARTICLE_BASE + str(article), "source_sha256": None},
                method={"id": "gpai-packet-artifact-check", "version": VERSION, "holder": "csoai", "code_sha256": code_sha},
                declared={"packet_sha256": packet_sha, "slot_id": slot_id, "slot_label": label,
                          "legal_source": packet["legal_source"], "artifact": item},
                observed=observed, state="PARTIAL" if matches else "UNCHECKABLE", value=None,
                limits=["This checks local file availability and SHA-256 integrity only.",
                        "Matching bytes do not establish authorship, currentness, document adequacy or legal satisfaction.",
                        "Applicability and legal source provenance are supplied declarations and were not verified.",
                        "The nine documentary slots are not an exhaustive account of obligations, exceptions or required evidence.",
                        "No file was executed, interpreted, sent to a model, signed or transmitted."]
            ))
    finally:
        os.close(root_fd)
    return {"method": "gpai-packet-artifact-check/" + VERSION, "packet_sha256": packet_sha,
            "counts": {"enumerated_slots": len(SLOTS), "declared_slots": len(declarations),
                       "matching_slots": sum(e["observed"]["status"] == "BYTES_MATCH" for e in events),
                       "unique_matched_digests": len({e["observed"]["actual_sha256"] for e in events if e["observed"]["status"] == "BYTES_MATCH"}),
                       "uncheckable_slots": sum(e["state"] == "UNCHECKABLE" for e in events),
                       "legal_outcomes_established": 0},
            "events": events}


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--packet", required=True)
    parser.add_argument("--root", required=True)
    parser.add_argument("--out", required=True, help="New output file; existing files are never overwritten")
    args = parser.parse_args()
    out = check_packet(read_json(args.packet), args.root)
    with open(args.out, "x", encoding="utf-8") as stream:
        json.dump(out, stream, ensure_ascii=False, indent=2); stream.write("\n")
    print(json.dumps(out["counts"], sort_keys=True))


if __name__ == "__main__":
    main()
