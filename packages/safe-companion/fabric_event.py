#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Inspect an original local export and print one unsigned evidence-fabric event.

Usage: python3 fabric_event.py EXPORT.json
NODE_BINARY may select a trusted local Node executable. No saved diagnostic is
accepted as an inspection result; the sibling reader always reads original bytes.
No network request, output file, case intake or authority decision is performed.
"""
import hashlib
import importlib.util
import json
import os
from pathlib import Path
import re
import subprocess
import sys


# Importing the canonical builder must not create a __pycache__ on a reader run.
sys.dont_write_bytecode = True
HERE = Path(__file__).resolve().parent
FABRIC = HERE.parent / "evidence-fabric"
_spec = importlib.util.spec_from_file_location("csoai_evidence_event", FABRIC / "event.py")
event = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(event)

VERSION = "0.1.0"
FORMAT = "csoai.safe-companion-diagnostic/0.1-experimental"
MAX_BYTES = 1_048_576
COUNTS = ("entries", "versions", "declared_pass", "declared_fail",
          "declared_inconclusive", "visible_items", "withheld_items")
CHECK_STATES = {
    "syntax": {"NOT_EVALUATED", "CHECKED", "REFUSED"},
    "schema": {"NOT_EVALUATED", "CHECKED", "REFUSED"},
    "consistency": {"NOT_EVALUATED", "CONSISTENT", "CONTRADICTED"},
    "transport_integrity": {"NOT_EVALUATED", "DIGEST_COMPUTED"},
    "package_integrity": {"NOT_PROVIDED"},
    "producer_identity": {"NOT_AUTHENTICATED"},
    "human_authority": {"NOT_ESTABLISHED"},
    "effect": {"NOT_OBSERVED"},
    "freshness": {"UNCONFIRMED", "SUPERSEDED_AS_DECLARED"},
}
FINDINGS = frozenset({
    "INPUT_TYPE", "INPUT_TOO_LARGE", "INVALID_UTF8", "BOM_UNSUPPORTED",
    "INVALID_JSON", "DUPLICATE_MEMBER", "UNSAFE_MEMBER", "RESOURCE_LIMIT",
    "UNSAFE_NUMBER", "UNKNOWN_DOCUMENT", "UNSUPPORTED_VERSION", "SCHEMA_MISMATCH",
    "SCHEMA_PROFILE_ERROR", "INVALID_TIMESTAMP", "DUPLICATE_ENTRY_ID",
    "HISTORY_INCONSISTENT", "TRANSITION_INCONSISTENT", "DUPLICATE_ITEM_ID",
    "DUPLICATE_MANIFEST_ID", "VERSION_INCONSISTENT", "WITHHELD_COUNT_MISMATCH",
    "APPROVAL_DIGEST_MISMATCH", "MANIFEST_ID_MISMATCH", "RANGE_INCONSISTENT",
    "DECLARED_RESULTS_ONLY", "COMPARATOR_NOT_PROVIDED", "APPROVAL_REFERENCE_ONLY",
    "WITHHELD_NOT_ASSESSED", "HISTORICAL_ONLY", "TIMESTAMP_ORDER_ANOMALY",
})
PERMISSIONS = {"execute": False, "submit": False, "publish": False}


def _hex(value, length):
    return isinstance(value, str) and re.fullmatch(r"[0-9a-f]{%d}" % length, value) is not None


def _source_pin():
    """Identify the actual local adapter/reader/schema/builder bytes using its JCS."""
    paths = {"fabric_event.py": HERE / "fabric_event.py", "reader.mjs": HERE / "reader.mjs",
             "cli.mjs": HERE / "cli.mjs", "schemas.mjs": HERE / "schemas.mjs",
             "evidence-fabric/event.py": FABRIC / "event.py",
             "evidence-fabric/schema.json": FABRIC / "schema/evidence-event-0.1.schema.json"}
    pins = {name: hashlib.sha256(path.read_bytes()).hexdigest() for name, path in paths.items()}
    return hashlib.sha256(event.jcs(pins)).hexdigest()


def _project(report, returncode):
    """Allow only the reader's bounded codes/counts; never copy its prose or input metadata."""
    if not isinstance(report, dict) or report.get("format") != FORMAT:
        raise ValueError
    accepted = report.get("accepted_for_reading")
    if type(accepted) is not bool or returncode != (0 if accepted else 2):
        raise ValueError
    source, supplied = report["reader"], report["input"]
    if source["version"] != VERSION or not _hex(source["upstream_commit"], 40):
        raise ValueError
    schema_hash = source["schema_sha256"]
    if schema_hash is not None and not _hex(schema_hash, 64):
        raise ValueError
    if not _hex(supplied["sha256"], 64) or type(supplied["bytes"]) is not int or not 0 <= supplied["bytes"] <= MAX_BYTES:
        raise ValueError
    if supplied["type"] not in ("unknown", "catalog", "disclosure") or supplied["schema_version"] not in (None, VERSION):
        raise ValueError
    if accepted and (supplied["type"] == "unknown" or supplied["schema_version"] != VERSION or schema_hash is None):
        raise ValueError
    checks = report["checks"]
    if not isinstance(checks, list) or len(checks) != len(CHECK_STATES):
        raise ValueError
    states = {}
    for check in checks:
        name, state = check["id"], check["state"]
        if name in states or name not in CHECK_STATES or state not in CHECK_STATES[name]:
            raise ValueError
        states[name] = state
    if accepted and any(states[k] != v for k, v in {
        "syntax": "CHECKED", "schema": "CHECKED", "consistency": "CONSISTENT",
        "transport_integrity": "DIGEST_COMPUTED"}.items()):
        raise ValueError
    counts = {name: report["counts"][name] for name in COUNTS}
    if any(type(n) is not int or not 0 <= n <= 50_000 for n in counts.values()):
        raise ValueError
    findings = report["findings"]
    if not isinstance(findings, list) or len(findings) > len(FINDINGS):
        raise ValueError
    codes = sorted({finding["code"] for finding in findings})
    if any(code not in FINDINGS for code in codes) or report.get("permissions") != PERMISSIONS:
        raise ValueError
    declared = {"export_type": supplied["type"], "export_schema_version": supplied["schema_version"],
                "source_pin": {"upstream_commit": source["upstream_commit"], "schema_sha256": schema_hash}}
    observed = {"accepted_for_reading": accepted, "input_sha256": supplied["sha256"],
                "input_bytes": supplied["bytes"], "counts": counts, "checks": states,
                "finding_codes": codes, "permissions": dict(PERMISSIONS)}
    return declared, observed


def inspect_file(path, *, node_binary=None):
    """Re-read one original export via cli.mjs; return canonical PARTIAL/UNCHECKABLE."""
    source_pin = _source_pin()
    declared = {"export_type": "unknown", "export_schema_version": None, "source_pin": None}
    observed = {"accepted_for_reading": False, "input_sha256": None, "input_bytes": None,
                "counts": None, "checks": {name: "NOT_EVALUATED" for name in CHECK_STATES},
                "finding_codes": ["LOCAL_READ_UNAVAILABLE"], "permissions": dict(PERMISSIONS)}
    # A configured executable is a trusted host choice, never a document field.
    env = os.environ.copy()
    env.pop("NODE_OPTIONS", None)
    try:
        process = subprocess.run(
            [node_binary or env.get("NODE_BINARY", "node"), str(HERE / "cli.mjs"), "inspect", os.fspath(path)],
            capture_output=True, check=False, timeout=15, env=env,
        )
        if process.returncode in (0, 2):
            if len(process.stdout) > 65_536:
                raise ValueError
            declared, observed = _project(json.loads(process.stdout), process.returncode)
    except (OSError, subprocess.TimeoutExpired):
        pass
    except (ValueError, KeyError, TypeError):
        observed["finding_codes"] = ["READER_OUTPUT_INVALID"]
    # No input path, arbitrary identifier, title, recipient, body, message or subprocess
    # error crosses this boundary. An unread input has no fabricated digest or zero count.
    digest = observed["input_sha256"]
    return event.build(
        subject={"kind": "scanner_report", "locator": "sha256:" + digest if digest else "urn:csoai:safe-companion:unread-input"},
        claim={"text": "A local export inspection was requested; the observed fields record its bounded diagnostic outcome."},
        method={"id": "safe-companion-export-inspection", "version": VERSION,
                "holder": "csoai", "code_sha256": source_pin},
        declared=declared, observed=observed,
        state="PARTIAL" if observed["accepted_for_reading"] else "UNCHECKABLE", value=None,
        limits=[
            "This is an unsigned local inspection of project-defined export structure and internal relationships, not an official SAFE assessment.",
            "Source-declared results are not independently reproduced measurements; no negative control ran in this inspection.",
            "Producer identity, current human authority, execution permission and external effects are not established.",
            "Byte identity and counts may remain sensitive. No original body, recipient, personal identifier or filesystem path is included.",
            "This event creates no case, referral, publication, policy amendment, training entitlement or scheduled task.",
            "When the local read is unavailable, no input digest or count is asserted; this event cannot identify an unread input.",
        ],
    )


def main(argv=None):
    args = sys.argv[1:] if argv is None else argv
    if len(args) != 1:
        sys.stderr.write("Usage: python3 fabric_event.py EXPORT.json\n")
        return 64
    try:
        result = inspect_file(args[0])
        # Reuse the canonical serializer, builder and validator, never a parallel schema.
        event.check_renderable(result)
        sys.stdout.write(event.jcs(result).decode("utf-8") + "\n")
        return 0 if result["state"] == "PARTIAL" else 2
    except Exception:
        sys.stderr.write("Local evidence projection is unavailable. No output file was written.\n")
        return 1


if __name__ == "__main__":
    sys.exit(main())
