#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""OCSF OUTPUT for the openshell adapter: rows.json -> OCSF 1.9.0 Detection Findings (class 2004), one per row.

    python3 ocsf_out.py OUT/rows.json --read-at <UTC> --control DIVERGENT > findings.ocsf.jsonl

The adapter already READS OpenShell's OCSF enforcer events; this writes our declared-vs-observed rows back out in
OCSF so a SIEM that ingests OpenShell's audit trail can hold the comparison beside it. Shape and doctrine come from
packages/evidence-fabric (never Compliance Finding; severity Informational; UNMEASURED carries no number).
"""
import json, os, sys
FABRIC = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "packages", "evidence-fabric")
sys.path.insert(0, os.path.abspath(FABRIC))
from ingest import openshell_in  # noqa: E402
from render import ocsf  # noqa: E402


def main(argv=None):
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("rows"); ap.add_argument("--read-at", required=True); ap.add_argument("--control", required=True)
    ap.add_argument("--subject", default="urn:example:openshell-sandbox")
    a = ap.parse_args(argv)
    for ev in openshell_in.ingest(open(a.rows, "rb").read(), read_at=a.read_at, control=a.control, subject=a.subject):
        sys.stdout.write(json.dumps(ocsf.render(ev), ensure_ascii=False, sort_keys=True) + "\n")


if __name__ == "__main__":
    main()
