#!/usr/bin/env python3
"""Offline hash-pinned source replay: count reasoning-tag candidates in raw GSPC cells.

No raw prompt/response is printed, copied to GitHub, or sent to any API.
This measures source presence, not grader correctness, model safety, or the
effect of a new grader on other archive generations.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys

SCHEMA = "csoai.frozen-raw-think-audit/0.1"
FROZEN_REV = "d0605c2495bddae7956fec5c18403d8a49fd81ac"
FROZEN_DESCRIPTORS_SHA256 = "68dfb5b07b01c2cd1929aa506d667b77eb00e600f0df42b3463860c1e6a85f47"
FROZEN_CELLS = 677
FROZEN_ROWS = 20517
CELL_NAME = re.compile(r"^items-[A-Za-z0-9_-]+\.jsonl$")
HEX = re.compile(r"^[0-9a-f]{64}$")
THINK_TAG = re.compile(r"<\s*/?\s*think\b", re.IGNORECASE)


class Uncheckable(ValueError):
    pass


def digest(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def audit(descriptor_bytes: bytes, root: Path, *,
          required_descriptor_digest: str = FROZEN_DESCRIPTORS_SHA256,
          required_cell_count: int = FROZEN_CELLS,
          required_rows: int = FROZEN_ROWS) -> dict:
    """Count in a bounded, exact source snapshot; fail closed if custody breaks."""
    if not isinstance(descriptor_bytes, bytes) or not isinstance(root, Path):
        raise Uncheckable("INVALID_INPUT")
    if not isinstance(required_descriptor_digest, str) or not HEX.fullmatch(required_descriptor_digest):
        raise Uncheckable("INVALID_PIN")
    if digest(descriptor_bytes) != required_descriptor_digest:
        raise Uncheckable("FROZEN_DESCRIPTOR_MISMATCH")
    if not isinstance(required_cell_count, int) or isinstance(required_cell_count, bool) or not 1 <= required_cell_count <= 10000:
        raise Uncheckable("INVALID_CELL_COUNT")
    if not isinstance(required_rows, int) or isinstance(required_rows, bool) or not 1 <= required_rows <= 300000:
        raise Uncheckable("INVALID_ROW_COUNT")
    try:
        descriptors = [json.loads(line) for line in descriptor_bytes.splitlines() if line.strip()]
    except (ValueError, UnicodeError) as exc:
        raise Uncheckable("CORRUPT_DESCRIPTORS") from exc
    if len(descriptors) != required_cell_count:
        raise Uncheckable("DESCRIPTOR_CELL_COUNT_MISMATCH")
    if not root.is_dir():
        raise Uncheckable("SOURCE_ROOT_MISSING")
    counts: Counter = Counter()
    per_axis: Counter = Counter()
    seen_names = set()
    for d in descriptors:
        if not isinstance(d, dict) or not isinstance(d.get("cell"), str):
            raise Uncheckable("BAD_CELL_DESCRIPTOR")
        name = d["cell"]
        if not CELL_NAME.fullmatch(name) or name in seen_names:
            raise Uncheckable("DUPLICATE_OR_UNSAFE_FILENAME")
        seen_names.add(name)
        declared_sha = d.get("cell_sha256")
        if not isinstance(declared_sha, str) or not HEX.fullmatch(declared_sha):
            raise Uncheckable("BAD_CELL_DIGEST")
        file = root / name
        if file.is_symlink() or not file.is_file():
            raise Uncheckable("CELL_MISSING_OR_SYMLINK")
        data = file.read_bytes()
        if digest(data) != declared_sha:
            raise Uncheckable("CELL_DIGEST_MISMATCH")
        rows = data.splitlines()
        if len(rows) != d.get("n_rows"):
            raise Uncheckable("CELL_ROW_COUNT_MISMATCH")
        counts["source_cells_verified"] += 1
        for raw in rows:
            try:
                row = json.loads(raw)
            except (ValueError, UnicodeError) as exc:
                raise Uncheckable("CORRUPT_SOURCE_ROW") from exc
            if not isinstance(row, dict):
                raise Uncheckable("INVALID_SOURCE_ROW")
            counts["source_rows_verified"] += 1
            output = row.get("raw_output")
            if not isinstance(output, str):
                counts["raw_output_unavailable"] += 1
                continue
            counts["raw_outputs_verified"] += 1
            expected = row.get("raw_output_sha256")
            if not isinstance(expected, str) or not HEX.fullmatch(expected):
                raise Uncheckable("RAW_OUTPUT_DIGEST_ABSENT")
            if digest(output.encode("utf-8")) != expected:
                raise Uncheckable("RAW_OUTPUT_DIGEST_MISMATCH")
            if THINK_TAG.search(output):
                counts["reasoning_tag_candidates"] += 1
                per_axis[str(row.get("axis", "unknown"))] += 1

    if counts["source_rows_verified"] != required_rows:
        raise Uncheckable("ARCHIVE_ROW_COUNT_MISMATCH")
    result = {
        "schema": SCHEMA,
        "state": "SOURCE_HASH_REPLAY_VERIFIED",
        "evidence_state": "SOURCE_PINNED_SELF_RUN_INSPECTION_ONLY",
        "frozen_hf_repo": "csoai/gspc-fact-table",
        "frozen_hf_revision": FROZEN_REV,
        "descriptor_sha256": digest(descriptor_bytes),
        "source_cells_verified": counts["source_cells_verified"],
        "source_rows_verified": counts["source_rows_verified"],
        "raw_outputs_verified": counts["raw_outputs_verified"],
        "raw_output_unavailable": counts["raw_output_unavailable"],
        "reasoning_tag_candidates": counts["reasoning_tag_candidates"],
        "candidate_axes": dict(sorted(per_axis.items())),
        "historical_scope": "ONLY_THE_PINNED_2026_10_28_FACT_TABLE_SOURCE_CELLS",
        "historical_grader_scores_rewritten": False,
        "other_corpora_inspected": False,
        "model_safety_certified": False,
        "independent_calibration_performed": False,
    }
    return result


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--descriptors", required=True, help="Local pinned gspc_cells.jsonl, never latest master")
    ap.add_argument("--source-root", required=True, help="Directory of original evidence-cell files")
    ap.add_argument("--output", required=True, help="Local summary JSON, no raw data")
    args = ap.parse_args(argv)
    try:
        report = audit(Path(args.descriptors).read_bytes(), Path(args.source_root))
        dest = Path(args.output)
        if dest.exists() and dest.is_symlink():
            raise Uncheckable("OUTPUT_SYMLINK_REFUSED")
        dest.parent.mkdir(parents=True, exist_ok=True)
        dest.write_text(json.dumps(report, sort_keys=True, indent=2, allow_nan=False) + "\n", encoding="utf-8")
        print(json.dumps({"state": report["state"], "verified_cells": report["source_cells_verified"],
                          "verified_raw_outputs": report["raw_outputs_verified"],
                          "tag_candidates": report["reasoning_tag_candidates"],
                          "unavailable_outputs": report["raw_output_unavailable"],
                          "output": str(dest)}, sort_keys=True))
        return 0
    except (Uncheckable, OSError, TypeError, ValueError) as exc:
        print("UNCHECKABLE source audit (no historical conclusion): " + str(exc)[:130], file=sys.stderr)
        return 4


if __name__ == "__main__":
    sys.exit(main())
