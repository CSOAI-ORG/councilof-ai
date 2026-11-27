#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unsigned dataset-delta comparison -> one existing csoai.evidence-event/0.1.

No network, signing, model execution or GSPC admission. A comparison prepared
by a caller is never authenticated by this adapter; the event stays PARTIAL.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from datetime import datetime
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import event as E  # noqa: E402

HEX40 = re.compile(r"^[0-9a-f]{40}$")
HEX64 = re.compile(r"^[0-9a-f]{64}$")
DATASET = re.compile(r"^[A-Za-z0-9_.-]+/[A-Za-z0-9_.-]+$")
STATES = {"UNCHANGED", "RAW_ONLY_CHANGE", "REVIEW_REQUIRED"}
MAX_BYTES = 2_000_000


class InvalidInput(ValueError):
    pass


def unique_pairs(pairs):
    out = {}
    for key, value in pairs:
        if key in out:
            raise InvalidInput("DUPLICATE_INPUT_KEY")
        out[key] = value
    return out


def validate_report(r: object) -> dict:
    if not isinstance(r, dict) or r.get("schema") != "csoai.dataset-delta/0.1" or r.get("kind") != "UNSIGNED_REVISION_COMPARISON":
        raise InvalidInput("BAD_DATASET_COMPARISON_SCHEMA")
    if r.get("state") not in STATES:
        raise InvalidInput("UNKNOWN_COMPARISON_STATE")
    if not isinstance(r.get("dataset"), str) or not DATASET.fullmatch(r["dataset"]):
        raise InvalidInput("BAD_DATASET_ID")
    for key in ("baseline_revision", "candidate_revision"):
        if not isinstance(r.get(key), str) or not HEX40.fullmatch(r[key]):
            raise InvalidInput("BAD_REVISION")
    for key in ("baseline_file_sha256", "candidate_file_sha256", "baseline_manifest_sha256"):
        if not isinstance(r.get(key), str) or not HEX64.fullmatch(r[key]):
            raise InvalidInput("BAD_FILE_HASH")
    counts = r.get("counts")
    if not isinstance(counts, dict) or set(counts) != {"baseline", "candidate", "changed", "added", "removed"}:
        raise InvalidInput("BAD_DENOMINATOR_FIELDS")
    if any(type(n) is not int or n < 0 for n in counts.values()):
        raise InvalidInput("BAD_DENOMINATOR_NUMBER")
    if not counts["baseline"] or not counts["candidate"] or counts["candidate"] != counts["baseline"] - counts["removed"] + counts["added"]:
        raise InvalidInput("INCONSISTENT_DENOMINATOR")
    if counts["changed"] > min(counts["baseline"] - counts["removed"], counts["candidate"] - counts["added"]):
        raise InvalidInput("INCONSISTENT_CHANGED_COUNT")
    has_delta = any(counts[k] for k in ("changed", "added", "removed"))
    if (r["state"] == "REVIEW_REQUIRED") != has_delta:
        raise InvalidInput("INCONSISTENT_COMPARISON_STATE")
    raw_same = r["baseline_file_sha256"] == r["candidate_file_sha256"]
    if has_delta and raw_same:
        raise InvalidInput("RECORD_DELTA_WITH_IDENTICAL_FILE_HASH")
    if r["state"] == "UNCHANGED" and not raw_same:
        raise InvalidInput("UNCHANGED_WITH_DIFFERENT_BYTES")
    if r["state"] == "RAW_ONLY_CHANGE" and raw_same:
        raise InvalidInput("RAW_ONLY_WITH_IDENTICAL_BYTES")
    if r.get("baseline_authenticated") is not False or r.get("human_source_approval") != "NOT_ESTABLISHED":
        raise InvalidInput("UNSUPPORTED_AUTHORITY_PROMOTION")
    if r.get("model_behaviour") != "NOT_TESTED" or r.get("agent_effect") != "NOT_TESTED" or r.get("gspc_admission") != "NOT_REQUESTED":
        raise InvalidInput("UNSUPPORTED_MEASUREMENT_PROMOTION")
    return r


def ingest(raw: bytes, *, read_at: str, source_url: str | None = None) -> dict:
    if len(raw) > MAX_BYTES:
        raise InvalidInput("INPUT_TOO_LARGE")
    if not isinstance(read_at, str) or not re.fullmatch(r"\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z", read_at):
        raise InvalidInput("BAD_READ_AT")
    try:
        datetime.fromisoformat(read_at.replace("Z", "+00:00"))
        report = validate_report(json.loads(raw.decode("utf-8"), object_pairs_hook=unique_pairs,
                                           parse_constant=lambda _: (_ for _ in ()).throw(InvalidInput("NONFINITE_NUMBER"))))
    except InvalidInput:
        raise
    except (UnicodeDecodeError, json.JSONDecodeError, ValueError) as exc:
        raise InvalidInput("BAD_JSON_OR_CLOCK_INPUT") from exc
    counts = report["counts"]
    # A changed record is a provenance difference, not proof of hostile intent.
    observed_delta = counts["changed"] + counts["added"] + counts["removed"]
    return E.build(
        subject={"kind": "dataset", "locator": f"urn:csoai:dataset-ref:{report['dataset']}", "declared_by": "caller-supplied source revision"},
        claim={"text": f"An unsigned comparison reported {report['state']} for a caller-supplied dataset revision; {observed_delta} record differences were reported, not independently established as malicious.",
               "source_url": source_url, "source_sha256": hashlib.sha256(raw).hexdigest(), "read_at": read_at},
        method={"id": "gspc-dataset-delta-guard", "version": "0.1", "holder": "csoai"},
        declared={"revision": report["baseline_revision"], "manifest_sha256": report["baseline_manifest_sha256"],
                  "file_sha256": report["baseline_file_sha256"], "records": counts["baseline"], "source_authority": "NOT_ESTABLISHED"},
        observed={"revision": report["candidate_revision"], "file_sha256": report["candidate_file_sha256"],
                  "comparison_state": report["state"], "counts": counts, "producer_verified": False},
        state="PARTIAL", value=None,
        negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
        limits=["This is an unsigned source comparison; the baseline, candidate revision and producer have not been independently authenticated.",
                "A reported changed record does not prove hostile content, model poisoning or a deployed effect.",
                "No training data permissions, code/model licence, GSPC admission, human authorization or runtime containment were checked."],
    )


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("report", type=Path)
    p.add_argument("--read-at", required=True)
    p.add_argument("--source-url")
    a = p.parse_args(argv)
    try:
        if not a.report.is_file() or a.report.is_symlink():
            raise InvalidInput("MISSING_OR_NONREGULAR_REPORT")
        with a.report.open("rb") as f:
            raw = f.read(MAX_BYTES + 1)
        event = ingest(raw, read_at=a.read_at, source_url=a.source_url)
    except (InvalidInput, ValueError, OSError, E.DoctrineError):
        print("UNMEASURED: invalid or unqualified dataset comparison; no event emitted", file=sys.stderr)
        return 2
    print(json.dumps(event, sort_keys=True, ensure_ascii=False))
    return 0


if __name__ == "__main__":
    sys.exit(main())
