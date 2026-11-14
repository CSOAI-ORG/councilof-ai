#!/usr/bin/env python3
"""Render EAT status from one validated local snapshot; never verify signatures.

Malformed/missing inputs fail before either prior report is replaced. Probe rates
exclude non-probe legacy samples. Generation time is not evidence of live activity.
No discovery, network request, signing, grading or training occurs here.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import re
import stat
import sys
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import common as c

MAX_QUEUE_BYTES = 64 * 1024 * 1024
MAX_JSON_BYTES = 16 * 1024 * 1024
MAX_ATOM_BYTES = 128 * 1024
MAX_RECORDS = 200000
MAX_SURFACES = 1024
SURFACE = re.compile(r"autoeat\.[a-z0-9]+(?:[._-][a-z0-9]+)*\Z")
SHA256 = re.compile(r"[a-f0-9]{64}\Z")


class InputError(ValueError):
    """Input snapshot is missing, malformed, ambiguous or inconsistent."""


def _bytes(path, limit):
    """Bound the read and refuse a symlink at the leaf; roots are host-owned."""
    fd = os.open(str(path), os.O_RDONLY | getattr(os, "O_NOFOLLOW", 0))
    with os.fdopen(fd, "rb") as stream:
        info = os.fstat(stream.fileno())
        if not stat.S_ISREG(info.st_mode) or info.st_size > limit:
            raise InputError("INPUT_FILE_TYPE_OR_SIZE: " + path.name)
        raw = stream.read(limit + 1)
    if len(raw) > limit:
        raise InputError("INPUT_FILE_SIZE: " + path.name)
    return raw


def _json(raw):
    def pairs(items):
        result = {}
        for key, value in items:
            if key in result:
                raise InputError("DUPLICATE_JSON_KEY")
            result[key] = value
        return result

    def number(text):
        value = float(text)
        if not math.isfinite(value):
            raise InputError("NONFINITE_JSON")
        return value

    def constant(_):
        raise InputError("NONFINITE_JSON")

    try:
        return json.loads(raw.decode("utf-8"), object_pairs_hook=pairs,
                          parse_float=number, parse_constant=constant)
    except (UnicodeError, json.JSONDecodeError, RecursionError) as exc:
        raise InputError("INVALID_JSON") from exc


def _timestamp(value):
    if not isinstance(value, str) or not value:
        raise InputError("SOURCE_TIME_REQUIRED")
    try:
        if re.fullmatch(r"\d{4}-\d{2}-\d{2}", value):
            return datetime.fromisoformat(value).replace(tzinfo=timezone.utc)
        date = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if date.tzinfo is None:
            raise ValueError("timezone missing")
        return date.astimezone(timezone.utc)
    except ValueError as exc:
        raise InputError("INVALID_SOURCE_TIME") from exc


def _integer(value, label):
    if type(value) is not int or not 0 <= value <= MAX_RECORDS:
        raise InputError("INVALID_COUNT: " + label)
    return value


def _identifier(row):
    if not isinstance(row, dict):
        raise InputError("QUEUE_ROW_NOT_OBJECT")
    for key in ("kind", "id"):
        value = row.get(key)
        if not isinstance(value, str) or not value or len(value) > 4096:
            raise InputError("QUEUE_IDENTITY_REQUIRED")
        if any(ord(char) < 32 for char in value):
            raise InputError("QUEUE_IDENTITY_CONTROL_CHARACTER")
    if row.get("status") != "DISCOVERED":
        raise InputError("QUEUE_STATE_NOT_DISCOVERED")
    return row["kind"] + ":" + row["id"]


def _canonical(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(",", ":"), allow_nan=False).encode("utf-8")


def build_status():
    """No writes. Return a bounded status after validating all source bytes."""
    inputs = {}

    def read(path, limit, label):
        raw = _bytes(path, limit)
        inputs[label] = (path, limit, hashlib.sha256(raw).hexdigest())
        return raw

    raw = read(c.QUEUE, MAX_QUEUE_BYTES, "queue.jsonl")
    rows = []
    for line in raw.splitlines():
        if line.strip():
            rows.append(_json(line))
            if len(rows) > MAX_RECORDS:
                raise InputError("TOO_MANY_QUEUE_ROWS")
    ids = [_identifier(row) for row in rows]
    if len(ids) != len(set(ids)):
        raise InputError("DUPLICATE_QUEUE_IDENTITY")
    by_kind = {}
    for row in rows:
        by_kind[row["kind"]] = by_kind.get(row["kind"], 0) + 1

    probed = _json(read(c.PROBED, MAX_JSON_BYTES, "probed.json"))
    if not isinstance(probed, list) or len(probed) > MAX_RECORDS:
        raise InputError("PROBED_LIST_REQUIRED")
    if any(not isinstance(key, str) or not key for key in probed):
        raise InputError("INVALID_PROBED_IDENTITY")
    if len(probed) != len(set(probed)):
        raise InputError("DUPLICATE_PROBED_IDENTITY")
    if not set(probed).issubset(set(ids)):
        raise InputError("PROBED_IDENTITY_NOT_IN_QUEUE")

    compact = _json(read(c.COMPACT, MAX_JSON_BYTES, "cards-compact.json"))
    if not isinstance(compact, dict) or len(compact) > MAX_SURFACES:
        raise InputError("COMPACT_OBJECT_REQUIRED")
    expected_atoms = set()
    live = denominator = 0
    included, excluded, source_times = [], [], []
    for surface, payload in compact.items():
        if not SURFACE.fullmatch(surface) or not isinstance(payload, dict):
            raise InputError("INVALID_SURFACE_OR_PAYLOAD")
        name = "card-" + c.slug(surface) + "-unsigned.json"
        if name in expected_atoms:
            raise InputError("ATOM_NAME_COLLISION")
        expected_atoms.add(name)
        if len(_canonical(payload)) > c.MAX_PAYLOAD_BYTES:
            raise InputError("PAYLOAD_EXCEEDS_3KB")
        flags = payload.get("flags")
        if not isinstance(flags, dict) or flags.get("auto_measured") is not False:
            raise InputError("UNQUALIFIED_AUTO_MEASURED_FLAG")
        _timestamp(payload.get("as_of"))
        source_times.append(payload["as_of"])
        atom = _json(read(c.FEED / name, MAX_ATOM_BYTES, name))
        if not isinstance(atom, dict) or atom.get("surface") != surface:
            raise InputError("ATOM_SURFACE_MISMATCH")
        if "sig_ed25519" not in atom or atom["sig_ed25519"] is not None or atom.get("state") != "queued":
            raise InputError("STAGED_ATOM_NOT_UNSIGNED_QUEUED")
        if _canonical(atom.get("payload")) != _canonical(payload):
            raise InputError("ATOM_COMPACT_PAYLOAD_MISMATCH")
        if atom.get("as_of") != payload["as_of"]:
            raise InputError("ATOM_COMPACT_TIME_MISMATCH")
        sample = payload.get("sample")
        if not isinstance(sample, dict):
            raise InputError("SAMPLE_OBJECT_REQUIRED")
        if "n_probed" not in sample and "live" not in sample:
            excluded.append(surface)
            continue
        if "n_probed" not in sample or "live" not in sample:
            raise InputError("INCOMPLETE_PROBE_COUNTS")
        n = _integer(sample["n_probed"], "n_probed")
        count = _integer(sample["live"], "live")
        if count > n:
            raise InputError("LIVE_EXCEEDS_PROBED")
        states = ("placeholder", "held", "dead", "uncheckable")
        if any(key in sample for key in states):
            if not all(key in sample for key in states):
                raise InputError("INCOMPLETE_PROBE_STATE_COUNTS")
            if count + sum(_integer(sample[key], key) for key in states) != n:
                raise InputError("PROBE_STATE_TOTAL_MISMATCH")
        if "live_fraction_of_probed" in sample:
            fraction = sample["live_fraction_of_probed"]
            expected = round(count / n, 4) if n else None
            if fraction != expected or (fraction is not None and type(fraction) not in (int, float)):
                raise InputError("PROBE_FRACTION_MISMATCH")
        live += count
        denominator += n
        included.append(surface)

    actual_atoms = {path.name for path in c.FEED.glob("card-autoeat-*-unsigned.json")}
    if actual_atoms != expected_atoms:
        raise InputError("STAGED_ATOM_SET_MISMATCH")

    # Presence is NOT signature verification. Never infer a verified signed batch
    # from attacker/caller-controlled text, even when its field is non-empty.
    candidate = None
    signature_candidates = 0
    ledger_files = sorted(c.INTEROP.glob("ledger-card-autoeat-*.json"))
    if len(ledger_files) > 2 * MAX_SURFACES:
        raise InputError("TOO_MANY_LEDGER_CANDIDATES")
    for path in ledger_files:
        card = _json(read(path, MAX_ATOM_BYTES, "ledger/" + path.name))
        if not isinstance(card, dict):
            raise InputError("LEDGER_CARD_OBJECT_REQUIRED")
        signature = card.get("sig_ed25519")
        if signature in (None, ""):
            continue
        if not isinstance(signature, str):
            raise InputError("INVALID_SIGNATURE_FIELD_TYPE")
        surface = card.get("surface")
        if not isinstance(surface, str) or not SURFACE.fullmatch(surface):
            raise InputError("INVALID_LEDGER_SURFACE")
        _timestamp(card.get("as_of"))
        digest = card.get("sha256")
        if not isinstance(digest, str) or not SHA256.fullmatch(digest):
            raise InputError("INVALID_LEDGER_DIGEST_FIELD")
        signature_candidates += 1
        record = {"surface": surface, "as_of": card["as_of"], "sha256": digest}
        if candidate is None or _timestamp(record["as_of"]) > _timestamp(candidate["as_of"]):
            candidate = record

    # Detect ordinary concurrent writer changes without taking over its lock.
    for path, limit, digest in inputs.values():
        if hashlib.sha256(_bytes(path, limit)).hexdigest() != digest:
            raise InputError("INPUT_CHANGED_DURING_STATUS_READ")
    if actual_atoms != {p.name for p in c.FEED.glob("card-autoeat-*-unsigned.json")} or ledger_files != sorted(c.INTEROP.glob("ledger-card-autoeat-*.json")):
        raise InputError("INPUT_SET_CHANGED_DURING_STATUS_READ")
    stamp = c.utcnow()
    source_times.sort(key=_timestamp)
    return {
        "loop": "asi-auto-eat", "as_of": stamp, "report_generated_at": stamp,
        "input_integrity": "VALIDATED_LOCAL_SNAPSHOT",
        "loop_liveness": "NOT_ESTABLISHED_BY_SAVED_FILES",
        "queue_discovered_total": len(rows), "discovered_by_kind": by_kind,
        "probed_total": len(probed), "atoms_staged": len(expected_atoms),
        "surfaces_staged": sorted(compact),
        "staged_live_of_probed": {"live": live, "probed": denominator,
                                  "fraction": round(live / denominator, 4) if denominator else None},
        "probe_fraction_scope": {"included_surfaces": sorted(included), "excluded_non_probe_surfaces": sorted(excluded),
                                 "meaning": "Retained reachability probes only; not scores or current availability."},
        "staged_source_times": {"earliest": source_times[0] if source_times else None,
                                "latest": source_times[-1] if source_times else None,
                                "date_only_values_preserve_day_precision": True},
        "last_signed_batch": None,
        "signature_verification": "NOT_PERFORMED",
        "signature_present_candidates": signature_candidates,
        "last_signature_present_batch": candidate,
        "input_sha256": {name: digest for name, (_, _, digest) in inputs.items()},
        "invariant": "Signature presence is not verification; reachability is not a GSPC score, human approval or training permission.",
    }


def render_markdown(status):
    sample = status["staged_live_of_probed"]
    fraction = "n/a" if sample["fraction"] is None else str(sample["fraction"])
    lines = ["# EAT — retained input status", "",
             "Report generated " + status["report_generated_at"] + "; saved-source liveness is not established.", "",
             "| Field | Value |", "|---|---|",
             "| Discovered queue rows | " + str(status["queue_discovered_total"]) + " |",
             "| Probed identities | " + str(status["probed_total"]) + " |",
             "| Validated unsigned staged atoms | " + str(status["atoms_staged"]) + " |",
             "| Retained LIVE/probed sample | " + str(sample["live"]) + "/" + str(sample["probed"]) + " (" + fraction + ") |",
             "| Earliest retained staged observation | " + str(status["staged_source_times"]["earliest"]) + " |",
             "| Latest retained staged observation | " + str(status["staged_source_times"]["latest"]) + " |",
             "| Signature verification | NOT PERFORMED |",
             "| Files with signature text | " + str(status["signature_present_candidates"]) + " (not verified signatures) |", "",
             "## Discovered by kind", "", "| Kind | Count |", "|---|---|"]
    for kind, count in sorted(status["discovered_by_kind"].items()):
        safe_kind = kind.replace("|", "\\|").replace("<", "&lt;").replace(">", "&gt;")
        lines.append("| " + safe_kind + " | " + str(count) + " |")
    lines.extend(["", "## Scope", "",
                  "- A report timestamp is not evidence that the loop ran a fresh probe.",
                  "- Non-probe legacy samples are excluded from the reachability denominator: " + ", ".join(status["probe_fraction_scope"]["excluded_non_probe_surfaces"] or ["none"]) + ".",
                  "- `last_signed_batch` stays null: this generator does not verify signatures. Signature-bearing candidates remain explicitly unverified.",
                  "- Discovery, reachability, signature verification, model measurement, human approval and training permission remain separate.",
                  "- This generator performs no network requests, signing, training or execution approval.", ""])
    return "\n".join(lines)


def _publish(status, markdown):
    """Stage both complete reports before per-file atomic replacement.

    This is not a multi-file transaction under storage failure; readers can compare
    generation times. Invalid source input never reaches this function.
    """
    staged = []
    try:
        for target, raw in [(c.STATUS_JSON, (json.dumps(status, indent=1, ensure_ascii=False, allow_nan=False) + "\n").encode()),
                            (c.STATUS_MD, markdown.encode("utf-8"))]:
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.is_symlink():
                raise InputError("OUTPUT_SYMLINK_REFUSED")
            fd, name = tempfile.mkstemp(prefix=".eat-status-", dir=str(target.parent))
            staged.append((name, target))
            with os.fdopen(fd, "wb") as stream:
                stream.write(raw)
                stream.flush()
                os.fsync(stream.fileno())
        for name, target in staged:
            os.replace(name, target)
    finally:
        for name, _ in staged:
            if os.path.exists(name):
                os.unlink(name)


def main():
    try:
        status = build_status()
        _publish(status, render_markdown(status))
    except (InputError, OSError, TypeError, ValueError, RecursionError) as exc:
        print("FAIL EAT status: " + type(exc).__name__ + ": " + str(exc)[:200], file=sys.stderr)
        return 1
    print("STATUS discovered={queue_discovered_total} probed={probed_total} atoms={atoms_staged} signature_verification=NOT_PERFORMED".format(**status))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
