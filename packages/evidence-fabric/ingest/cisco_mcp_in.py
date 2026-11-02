#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Cisco MCP Scanner --format raw envelope -> declared evidence, never permission.

    python3 ingest/cisco_mcp_in.py REPORT.json --read-at UTC --scanner-version VERSION

Wire contract reviewed at cisco-ai-defense/mcp-scanner@21a87b4b, docs/output-formats.md.
This accepts the envelope, not --raw arrays or known-configs maps. No scanner is run.
The provided scanner version is a caller declaration, not independently authenticated.
"""
import argparse
import copy
import hashlib
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E  # noqa: E402


def ingest(raw, *, read_at, scanner_version, source_url=None):
    doc = json.loads(raw)
    if not isinstance(doc, dict) or not all(k in doc for k in ("server_url", "scan_results", "requested_analyzers")):
        raise ValueError("expected the --format raw envelope; bare --raw output is unsupported")
    if not isinstance(doc["server_url"], str) or not doc["server_url"].strip():
        raise ValueError("server_url must identify the scanned target")
    if not isinstance(scanner_version, str) or not scanner_version.strip():
        raise ValueError("scanner_version is required; it cannot be inferred from this envelope")
    requested = doc["requested_analyzers"]
    if not isinstance(requested, list) or not all(isinstance(a, str) and a.strip() for a in requested):
        raise ValueError("requested_analyzers must be an array of names")
    rows = doc["scan_results"]
    if not isinstance(rows, list):
        raise ValueError("scan_results must be an array")
    for result in rows:
        if (not isinstance(result, dict) or not isinstance(result.get("status"), str)
                or not result["status"].strip() or type(result.get("is_safe")) is not bool
                or not isinstance(result.get("findings"), dict)):
            raise ValueError("each scan result needs status, boolean is_safe and object findings")
    sha = hashlib.sha256(raw).hexdigest()
    out = []
    # An empty scan is still a declared observation, never silent evidence of safety.
    for index, result in enumerate(rows or [None]):
        declared = {"scanner_version_declared": scanner_version,
                    "server_url": doc["server_url"], "requested_analyzers": copy.deepcopy(requested),
                    "result_index": index if result is not None else None,
                    "result": copy.deepcopy(result), "result_count": len(rows)}
        out.append(E.build(
            subject={"kind": "scanner_report", "locator": doc["server_url"],
                     "declared_by": f"Cisco MCP Scanner {scanner_version}; report sha256:{sha}"},
            claim={"text": "The scanner report contains a declared scan result." if result is not None else "The scanner report contains no scan results.",
                   "source_url": source_url, "source_sha256": sha, "read_at": read_at},
            method={"id": "cisco-mcp-scanner-in", "version": "0.1", "code_sha256": None,
                    "holder": "third_party:Cisco MCP Scanner"},
            declared=declared, observed={"re_observed": False}, state="UNMEASURED", value=None,
            negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
            limits=["Scanner declarations only; findings and is_safe have not been independently re-observed.",
                    "Requested analyzers do not establish which analyzers completed or their coverage.",
                    "Scanner version is supplied by the caller; this import authenticates neither scanner nor target.",
                    "No execution permission, overall safety verdict or vendor adoption is established."]))
    return out


def main(argv=None):
    ap = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    ap.add_argument("report")
    ap.add_argument("--read-at", required=True)
    ap.add_argument("--scanner-version", required=True)
    ap.add_argument("--source-url")
    a = ap.parse_args(argv)
    try:
        with open(a.report, "rb") as f:
            events = ingest(f.read(), read_at=a.read_at, scanner_version=a.scanner_version, source_url=a.source_url)
    except (OSError, ValueError, TypeError) as exc:
        print(f"Scanner import rejected: {exc}", file=sys.stderr)
        return 2
    for ev in events:
        print(json.dumps(ev, ensure_ascii=False, sort_keys=True))
    return 0


if __name__ == "__main__":
    sys.exit(main())
