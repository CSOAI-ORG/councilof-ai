#!/usr/bin/env python3
"""Offline, bounded, source-pinned dataset change evidence. NOT a malware detector.

No network, model inference, training, signing, GSPC admission or production writes.
A trusted baseline must be reviewed through existing source/rights custody.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SCHEMA = "csoai.dataset-delta/0.1"
HEX40 = re.compile(r"[0-9a-f]{40}\Z")
DATASET = re.compile(r"[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+\Z")
MAX_BYTES = 2_000_000
MAX_ROWS = 5000
MAX_LINE = 100_000


class Uncheckable(ValueError):
    pass


def digest(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, ensure_ascii=False, sort_keys=True, separators=(",", ":"), allow_nan=False).encode("utf-8")


def unique_pairs(pairs: list[tuple[str, object]]) -> dict:
    obj = {}
    for key, val in pairs:
        if key in obj:
            raise Uncheckable("DUPLICATE_JSON_FIELD")
        obj[key] = val
    return obj


def load_file(path: Path) -> bytes:
    if not path.is_file() or path.is_symlink():
        raise Uncheckable("MISSING_OR_NONREGULAR_FILE")
    if path.stat().st_size > MAX_BYTES:
        raise Uncheckable("FILE_EXCEEDS_2MB_BOUND")
    with path.open("rb") as handle:
        raw = handle.read(MAX_BYTES + 1)
    if len(raw) > MAX_BYTES:
        raise Uncheckable("FILE_EXCEEDS_2MB_BOUND")
    return raw


def parse_rows(raw: bytes, id_field: str) -> dict[str, str]:
    try:
        text = raw.decode("utf-8", errors="strict")
    except UnicodeDecodeError as exc:
        raise Uncheckable("INVALID_UTF8") from exc
    rows = {}
    for i, line in enumerate(text.splitlines(), start=1):
        if not line.strip():
            continue
        if len(line.encode("utf-8")) > MAX_LINE:
            raise Uncheckable("LINE_EXCEEDS_BOUND")
        try:
            row = json.loads(line, object_pairs_hook=unique_pairs, parse_constant=lambda _: (_ for _ in ()).throw(Uncheckable("NONFINITE_NUMBER")))
        except Uncheckable:
            raise
        except (json.JSONDecodeError, TypeError, RecursionError, ValueError) as exc:
            raise Uncheckable("INVALID_JSONL") from exc
        if not isinstance(row, dict):
            raise Uncheckable("ROW_NOT_OBJECT")
        key = row.get(id_field)
        if not isinstance(key, str) or not (1 <= len(key) <= 160):
            raise Uncheckable("MISSING_OR_INVALID_RECORD_ID")
        if key in rows:
            raise Uncheckable("DUPLICATE_RECORD_ID")
        rows[key] = digest(canonical(row))
        if len(rows) > MAX_ROWS:
            raise Uncheckable("ROW_COUNT_EXCEEDS_BOUND")
    if not rows:
        raise Uncheckable("NO_RECORDS")
    return rows


def require_revision(value: str) -> str:
    if not isinstance(value, str) or not HEX40.fullmatch(value):
        raise Uncheckable("REVISION_MUST_BE_PINNED_SHA40")
    return value


def make_baseline(raw: bytes, *, dataset: str, revision: str, id_field: str = "id") -> dict:
    if not DATASET.fullmatch(dataset):
        raise Uncheckable("DATASET_REPO_ID_REQUIRED")
    require_revision(revision)
    if not isinstance(id_field, str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,60}", id_field):
        raise Uncheckable("INVALID_ID_FIELD")
    rows = parse_rows(raw, id_field)
    doc = {
        "schema": SCHEMA, "kind": "UNSIGNED_BASELINE_CANDIDATE",
        "dataset": dataset, "revision": revision, "id_field": id_field,
        "file_sha256": digest(raw), "n_records": len(rows),
        "rows": [{"id": key, "row_sha256": rows[key]} for key in sorted(rows)],
        "rights": "NOT_EVALUATED", "human_source_approval": "NOT_ESTABLISHED",
        "safety": "NOT_ASSESSED", "model_behaviour": "NOT_TESTED",
    }
    doc["manifest_sha256"] = digest(canonical(doc))
    return doc


def parse_baseline(raw: bytes) -> dict:
    try:
        baseline = json.loads(raw, object_pairs_hook=unique_pairs)
    except (json.JSONDecodeError, ValueError, TypeError) as exc:
        raise Uncheckable("INVALID_BASELINE_JSON") from exc
    if not isinstance(baseline, dict) or baseline.get("schema") != SCHEMA:
        raise Uncheckable("INVALID_BASELINE_SCHEMA")
    claimed_sha = baseline.get("manifest_sha256")
    body = {k: val for k, val in baseline.items() if k != "manifest_sha256"}
    if not isinstance(claimed_sha, str) or digest(canonical(body)) != claimed_sha:
        raise Uncheckable("BASELINE_DIGEST_MISMATCH")
    if baseline.get("kind") != "UNSIGNED_BASELINE_CANDIDATE" or not DATASET.fullmatch(str(baseline.get("dataset", ""))):
        raise Uncheckable("INVALID_BASELINE_SOURCE")
    if not isinstance(baseline.get("id_field"), str) or not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]{0,60}", baseline["id_field"]):
        raise Uncheckable("INVALID_BASELINE_ID_FIELD")
    require_revision(baseline.get("revision"))
    rows = baseline.get("rows")
    if not isinstance(rows, list) or not 1 <= len(rows) <= MAX_ROWS or baseline.get("n_records") != len(rows):
        raise Uncheckable("INVALID_BASELINE_DENOMINATOR")
    ids = set()
    for r in rows:
        if not isinstance(r, dict) or set(r) != {"id", "row_sha256"}:
            raise Uncheckable("INVALID_BASELINE_ROW")
        if not isinstance(r["id"], str) or not 1 <= len(r["id"]) <= 160 or r["id"] in ids:
            raise Uncheckable("DUPLICATE_OR_INVALID_BASELINE_ID")
        if not re.fullmatch(r"[0-9a-f]{64}", str(r["row_sha256"])):
            raise Uncheckable("INVALID_BASELINE_ROW_HASH")
        ids.add(r["id"])
    if not re.fullmatch(r"[0-9a-f]{64}", str(baseline.get("file_sha256", ""))):
        raise Uncheckable("INVALID_BASELINE_FILE_HASH")
    return baseline


def compare(baseline: dict, raw: bytes, *, current_revision: str) -> dict:
    require_revision(current_revision)
    current = parse_rows(raw, baseline["id_field"])
    expected = {r["id"]: r["row_sha256"] for r in baseline["rows"]}
    before = set(expected)
    after = set(current)
    changed = sorted(key for key in before & after if expected[key] != current[key])
    added, removed = sorted(after - before), sorted(before - after)
    raw_changed = digest(raw) != baseline["file_sha256"]
    # Use ID digests in the output: data subjects/secret fields are never copied.
    anonymize = lambda keys: [digest(key.encode("utf-8"))[:16] for key in keys[:50]]
    state = "REVIEW_REQUIRED" if (changed or added or removed) else "RAW_ONLY_CHANGE" if raw_changed else "UNCHANGED"
    return {
        "schema": SCHEMA, "kind": "UNSIGNED_REVISION_COMPARISON",
        "state": state, "dataset": baseline["dataset"],
        "baseline_revision": baseline["revision"], "candidate_revision": current_revision,
        "baseline_manifest_sha256": baseline["manifest_sha256"],
        "baseline_file_sha256": baseline["file_sha256"], "candidate_file_sha256": digest(raw),
        "counts": {"baseline": len(expected), "candidate": len(current), "changed": len(changed), "added": len(added), "removed": len(removed)},
        "changed_id_digests": anonymize(changed), "added_id_digests": anonymize(added), "removed_id_digests": anonymize(removed),
        "id_list_truncated": max(len(changed), len(added), len(removed)) > 50,
        "meaning": "SHA-256 evidence of version differences, not evidence of maliciousness, model behaviour or prevention",
        "baseline_authenticated": False, "human_source_approval": "NOT_ESTABLISHED",
        "model_behaviour": "NOT_TESTED", "agent_effect": "NOT_TESTED", "gspc_admission": "NOT_REQUESTED",
    }


def main(argv=None) -> int:
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    sub = parser.add_subparsers(dest="command", required=True)
    a = sub.add_parser("baseline", help="make unsigned candidate manifest; owner must review baseline")
    a.add_argument("--input", required=True, type=Path)
    a.add_argument("--dataset", required=True)
    a.add_argument("--revision", required=True)
    a.add_argument("--id-field", default="id")
    a = sub.add_parser("compare", help="compare one candidate file against a reviewed candidate baseline")
    a.add_argument("--input", required=True, type=Path)
    a.add_argument("--baseline", required=True, type=Path)
    a.add_argument("--revision", required=True)
    opts = parser.parse_args(argv)
    try:
        raw = load_file(opts.input)
        if opts.command == "baseline":
            result = make_baseline(raw, dataset=opts.dataset, revision=opts.revision, id_field=opts.id_field)
        else:
            base = parse_baseline(load_file(opts.baseline))
            result = compare(base, raw, current_revision=opts.revision)
    except (Uncheckable, OSError, OverflowError, ValueError) as exc:
        print(json.dumps({"schema": SCHEMA, "state": "UNCHECKABLE", "reason": str(exc), "safety": "NOT_ASSESSED"}, sort_keys=True))
        return 2
    print(json.dumps(result, ensure_ascii=False, sort_keys=True, indent=2))
    return 1 if result.get("state") == "REVIEW_REQUIRED" else 0


if __name__ == "__main__":
    sys.exit(main())
