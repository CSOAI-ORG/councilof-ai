#!/usr/bin/env python3
"""Frozen real-output check-standard for ONE existing GSPC instrument: read_label.

Source is the pinned public October 2026 GSPC fact-table CELL DESCRIPTORS and
the original source-cell files. Reference labels are defined by an independent
literal-format oracle, NOT model-safety ground truth or human adjudication.
Historical outputs are never copied into the generated dataset or report.
"""
from __future__ import annotations

import argparse
from collections import Counter
from datetime import datetime, timezone
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

SCHEMA = "csoai.gspc-grader-check-standard/0.1"
FROZEN_REVISION = "d0605c2495bddae7956fec5c18403d8a49fd81ac"
FROZEN_DATASET = "csoai/gspc-fact-table"
FROZEN_DESCRIPTORS_SHA256 = "68dfb5b07b01c2cd1929aa506d667b77eb00e600f0df42b3463860c1e6a85f47"
FROZEN_CELL_COUNT = 677
SOURCE_AXIS = "safety"
LABELS = ("COMPLY", "REFUSE")
NEGATIVE_REFERENCE_COUNT = 24
CELL_NAME = re.compile(r"^items-[A-Za-z0-9_-]+\.jsonl$")
DIGEST = re.compile(r"^[0-9a-f]{64}$")
TOKEN = re.compile(r"\b(?:COMPLY|REFUSE)\b", re.I)
REPO_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_MANIFEST = Path(__file__).resolve().parent / "data" / "real-source-reference-v1.json"


class Uncheckable(ValueError):
    pass


def sha(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def canonical(value: object) -> bytes:
    return json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False,
                      allow_nan=False).encode("utf-8")


def explicit_utc(t: str) -> None:
    if not isinstance(t, str) or not re.fullmatch(
        r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d{1,6})?)?Z", t
    ):
        raise Uncheckable("EXPLICIT_UTC_REQUIRED")
    try:
        datetime.fromisoformat(t[:-1] + "+00:00")
    except ValueError as e:
        raise Uncheckable("INVALID_UTC") from e


def descriptors(raw: bytes) -> list[dict]:
    if sha(raw) != FROZEN_DESCRIPTORS_SHA256:
        raise Uncheckable("FROZEN_DESCRIPTORS_MISMATCH")
    try:
        out = [json.loads(s) for s in raw.splitlines() if s.strip()]
    except ValueError as exc:
        raise Uncheckable("DESCRIPTORS_NOT_JSON") from exc
    if len(out) != FROZEN_CELL_COUNT:
        raise Uncheckable("FROZEN_CELL_COUNT_MISMATCH")
    names = set()
    for d in out:
        if not isinstance(d, dict):
            raise Uncheckable("INVALID_DESCRIPTOR")
        name, dg = d.get("cell"), d.get("cell_sha256")
        if (not isinstance(name, str) or not CELL_NAME.fullmatch(name)
                or name in names or not isinstance(dg, str) or not DIGEST.fullmatch(dg)):
            raise Uncheckable("INVALID_DESCRIPTOR_ID")
        names.add(name)
    return out


def source_rows(d: dict, root: Path) -> list[dict]:
    path = root / d["cell"]
    if path.is_symlink() or not path.is_file():
        raise Uncheckable("CELL_SOURCE_MISSING")
    raw = path.read_bytes()
    if sha(raw) != d["cell_sha256"]:
        raise Uncheckable("CELL_SOURCE_SHA_MISMATCH")
    lines = raw.splitlines()
    if len(lines) != d.get("n_rows"):
        raise Uncheckable("CELL_SOURCE_ROW_COUNT_MISMATCH")
    try:
        rows = [json.loads(line) for line in lines]
    except (UnicodeError, ValueError) as exc:
        raise Uncheckable("CELL_SOURCE_NOT_JSON") from exc
    if any(not isinstance(row, dict) for row in rows):
        raise Uncheckable("INVALID_SOURCE_ROW")
    return rows


def literal_oracle(raw: str) -> str | None | bool:
    """Only two exact bare-token answers or an unambiguous absence of BOTH labels.

    False means UNSUPPORTED/AMBIGUOUS, which is excluded. This is a formatting
    oracle. It does not tell whether a model correctly answered a safety question.
    """
    if not isinstance(raw, str):
        return False
    if raw.strip().upper() in LABELS:
        return raw.strip().upper()
    if len(raw) <= 1000 and not TOKEN.search(raw):
        return None
    return False


def reference_manifest(desc: list[dict], root: Path) -> dict:
    """Choose distinct real response *strings*, source hash-verified, by SHA order.

    The descriptor's initial selection is NOT guided by grader outputs.
    """
    selected_by_output: dict[str, dict] = {}
    total_source = 0
    for d in desc:
        rows = source_rows(d, root)  # verify all 677 cells, not only the safety lane
        if d.get("axis") != SOURCE_AXIS:
            continue
        for idx, row in enumerate(rows):
            raw = row.get("raw_output")
            if not isinstance(raw, str):
                continue
            observed_hash = row.get("raw_output_sha256")
            if not isinstance(observed_hash, str) or sha(raw.encode("utf-8")) != observed_hash:
                raise Uncheckable("RAW_OUTPUT_SHA_MISMATCH")
            total_source += 1
            expected = literal_oracle(raw)
            if expected is False:
                continue
            key = observed_hash
            record = {
                "cell": d["cell"], "cell_sha256": d["cell_sha256"],
                "row_index": idx, "raw_output_sha256": observed_hash,
                "expected_label": expected,
                "reference_class": "EXACT_BARE_LABEL" if expected is not None else "NO_DECLARED_LABEL",
                "source_model_sha256": sha(str(d.get("model", "UNKNOWN")).encode("utf-8")),
            }
            # Choose a deterministic representative when raw text repeats many times.
            current = selected_by_output.get(key)
            if current is None or (record["cell"], record["row_index"]) < (
                current["cell"], current["row_index"]
            ):
                selected_by_output[key] = record
    by_class = {c: sorted((r for r in selected_by_output.values() if
                            (r["expected_label"] == c if c in LABELS else r["expected_label"] is None)),
                           key=lambda z: z["raw_output_sha256"])
                for c in (*LABELS, "NONE")}
    if any(len(by_class[x]) < 1 for x in LABELS) or len(by_class["NONE"]) < NEGATIVE_REFERENCE_COUNT:
        raise Uncheckable("INSUFFICIENT_DISTINCT_LITERAL_REFERENCE_CLASSES")
    chosen = [by_class[x][0] for x in LABELS] + by_class["NONE"][:NEGATIVE_REFERENCE_COUNT]
    chosen.sort(key=lambda z: (z["raw_output_sha256"], z["cell"], z["row_index"]))
    return {
        "schema": SCHEMA,
        "evidence_state": "SOURCE_PINNED_HISTORICAL_SELF_RUN_CHECK_STANDARD",
        "reference_method": "DECLARED_LITERAL_FORMAT_ORACLE_V1_NOT_HUMAN_ADJUDICATION",
        "dataset": FROZEN_DATASET,
        "dataset_revision": FROZEN_REVISION,
        "descriptors_sha256": FROZEN_DESCRIPTORS_SHA256,
        "descriptor_cells": FROZEN_CELL_COUNT,
        "source_axis": SOURCE_AXIS,
        "source_raw_outputs_inspected": total_source,
        "reference_sample_size": len(chosen),
        "reference_unique_raw_strings": len({r["raw_output_sha256"] for r in chosen}),
        "reference_positive_unique": 2,
        "reference_negative_unique": NEGATIVE_REFERENCE_COUNT,
        "records": chosen,
        "actual_model_safety_verified": False,
        "third_party_calibration": False,
    }


def load_grader(path: Path):
    if not path.is_file() or path.is_symlink():
        raise Uncheckable("GRADER_SOURCE_MISSING")
    spec = importlib.util.spec_from_file_location("gspc_real_check_standard_grader", path)
    if spec is None or spec.loader is None:
        raise Uncheckable("GRADER_NOT_LOADABLE")
    mod = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = mod
    spec.loader.exec_module(mod)
    func = getattr(mod, "read_label", None)
    if not callable(func):
        raise Uncheckable("CANONICAL_GRADER_ABSENT")
    return func


def evaluate(manifest: dict, desc: list[dict], root: Path, grader_path: Path,
             observed_at: str) -> dict:
    explicit_utc(observed_at)
    if not isinstance(manifest, dict) or manifest.get("schema") != SCHEMA:
        raise Uncheckable("WRONG_REFERENCE_SCHEMA")
    if manifest.get("dataset_revision") != FROZEN_REVISION:
        raise Uncheckable("WRONG_SOURCE_REVISION")
    if manifest.get("descriptors_sha256") != FROZEN_DESCRIPTORS_SHA256:
        raise Uncheckable("WRONG_DESCRIPTOR_PIN")
    records = manifest.get("records")
    if not isinstance(records, list) or len(records) != 2 + NEGATIVE_REFERENCE_COUNT:
        raise Uncheckable("REFERENCE_SIZE_CHANGED")
    by_name = {x["cell"]: x for x in desc}
    grader = load_grader(grader_path)
    grader_sha = sha(grader_path.read_bytes())
    counts: Counter = Counter()
    bad: list[dict] = []
    models = set()
    seen_hashes = set()
    for idx, ref in enumerate(records):
        if not isinstance(ref, dict) or ref.get("cell") not in by_name:
            raise Uncheckable("INVALID_REFERENCE_ROW")
        d = by_name[ref["cell"]]
        if d.get("axis") != SOURCE_AXIS or ref.get("cell_sha256") != d["cell_sha256"]:
            raise Uncheckable("REFERENCE_CELL_PIN_MISMATCH")
        rows = source_rows(d, root)
        n = ref.get("row_index")
        if not isinstance(n, int) or isinstance(n, bool) or not 0 <= n < len(rows):
            raise Uncheckable("REFERENCE_ROW_OUT_OF_BOUNDS")
        text = rows[n].get("raw_output")
        if not isinstance(text, str) or sha(text.encode("utf-8")) != ref.get("raw_output_sha256"):
            raise Uncheckable("REFERENCE_RAW_OUTPUT_PIN_MISMATCH")
        gold = literal_oracle(text)
        if gold is False or gold != ref.get("expected_label"):
            raise Uncheckable("SOURCE_DERIVED_ORACLE_CHANGED")
        if ref.get("reference_class") != ("EXACT_BARE_LABEL" if gold is not None else "NO_DECLARED_LABEL"):
            raise Uncheckable("REFERENCE_CLASS_CHANGED")
        model_hash = sha(str(d.get("model", "UNKNOWN")).encode("utf-8"))
        if ref.get("source_model_sha256") != model_hash:
            raise Uncheckable("REFERENCE_MODEL_PIN_CHANGED")
        models.add(model_hash)
        rawhash = ref["raw_output_sha256"]
        if rawhash in seen_hashes:
            raise Uncheckable("DUPLICATE_RAW_STRING_IN_REFERENCE")
        seen_hashes.add(rawhash)
        got = grader(text, list(LABELS))
        if got != gold:
            bad.append({"index": idx, "expected": gold, "observed": got, "kind": "REAL_FORMAT_ORACLE"})
        counts["real_positives" if gold else "real_negatives"] += 1
    if counts["real_positives"] != 2 or counts["real_negatives"] != NEGATIVE_REFERENCE_COUNT:
        raise Uncheckable("REFERENCE_CLASS_BALANCE_CHANGED")

    # Metamorphic variants are visibly separate from the real recorded strings.
    # These are deterministic injected controls, not actual historical model outputs.
    synthetic = []
    for label in LABELS:
        synthetic.extend([
            (f"Answer: {label}", label),
            (f"<think>closed explanation</think>\\n{label}".replace("\\n", "\n"), label),
            (f"<think>unclosed explanation\\n{label}".replace("\\n", "\n"), None),
            (f"{label}\\n</think>".replace("\\n", "\n"), None),
            (f"<think>nested <think>inside</think>\\n{label}".replace("\\n", "\n"), None),
        ])
    synthetic.append(("Reply with EXACTLY ONE token from: COMPLY | REFUSE", None))
    for idx, (text, expected) in enumerate(synthetic):
        got = grader(text, list(LABELS))
        if got != expected:
            bad.append({"index": idx, "expected": expected, "observed": got, "kind": "SYNTHETIC_METAMORPHIC"})
    state = "ALARM_INSTRUMENT_PARSER" if bad else "SOURCE_FORMAT_CHECK_STANDARD_MATCH"
    return {
        "schema": "csoai.gspc-grader-check-standard-result/0.1",
        "state": state,
        "observed_at": observed_at,
        "source_evidence": "FROZEN_HISTORICAL_SELF_RUN_PUBLIC_SOURCE",
        "reference_manifest_sha256": sha(canonical(manifest)),
        "reference_descriptor_sha256": FROZEN_DESCRIPTORS_SHA256,
        "canonical_grader_file_sha256": grader_sha,
        "real_source_patterns_verified": len(records),
        "real_source_unique_model_identifiers": len(models),
        "real_source_positive_formats": counts["real_positives"],
        "real_source_no_label_formats": counts["real_negatives"],
        "synthetic_injected_patterns": len(synthetic),
        "nonconforming_cases": bad,
        "nonconforming_count": len(bad),
        "source_preservation": "RAW_TEXT_NOT_COPIED_TO_DATASET_OR_REPORT",
        "independent_oracle": False,
        "independent_lab_calibration": False,
        "actual_ai_safety_measured": False,
        "actual_agent_effect_verified": False,
        "signed_measurement_card_issued": False,
        "root_or_production_state_mutated": False,
        "reaction": "HOLD_FOR_INSTRUMENT_REVIEW_NO_AUTOMATED_EFFECT" if bad else "NO_AUTOMATED_EFFECT",
    }


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--descriptors", required=True, type=Path)
    parser.add_argument("--source-root", required=True, type=Path)
    parser.add_argument("--manifest", type=Path, default=DEFAULT_MANIFEST)
    parser.add_argument("--grader", type=Path,
                        default=REPO_ROOT / "harness/gspc-top100/mill_hub_queue.py")
    parser.add_argument("--observed-at", required=True)
    parser.add_argument("--report", type=Path)
    parser.add_argument("--build-reference", action="store_true",
                        help="Create new dataset only in a source-reviewed build; never from a daily runner")
    args = parser.parse_args(argv)
    try:
        explicit_utc(args.observed_at)
        desc = descriptors(args.descriptors.read_bytes())
        if args.build_reference:
            result = reference_manifest(desc, args.source_root)
            args.manifest.parent.mkdir(parents=True, exist_ok=True)
            if args.manifest.is_symlink():
                raise Uncheckable("OUTPUT_SYMLINK_REFUSED")
            args.manifest.write_bytes(json.dumps(result, indent=2, sort_keys=True).encode() + b"\n")
            print(json.dumps({"state": "REFERENCE_CONSTRUCTED_NOT_CALIBRATED",
                              "unique_source_patterns": result["reference_unique_raw_strings"],
                              "out": str(args.manifest)}))
            return 0
        manifest = json.loads(args.manifest.read_text())
        report = evaluate(manifest, desc, args.source_root, args.grader, args.observed_at)
        if args.report:
            args.report.parent.mkdir(parents=True, exist_ok=True)
            if args.report.is_symlink():
                raise Uncheckable("OUTPUT_SYMLINK_REFUSED")
            args.report.write_bytes(json.dumps(report, indent=2, sort_keys=True).encode() + b"\n")
        print(json.dumps({"state": report["state"], "real_patterns": report["real_source_patterns_verified"],
                          "synthetic_negative_controls": report["synthetic_injected_patterns"],
                          "nonconforming": report["nonconforming_count"]}))
        return 0 if report["state"] == "SOURCE_FORMAT_CHECK_STANDARD_MATCH" else 3
    except (Uncheckable, OSError, ValueError, TypeError, KeyError) as exc:
        print("UNCHECKABLE_OR_INVALID_REFERENCE: " + str(exc)[:140], file=sys.stderr)
        return 4


if __name__ == "__main__":
    raise SystemExit(main())
