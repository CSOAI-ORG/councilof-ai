#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""One-command offline dataset revision -> unsigned evidence packet.

Uses the existing pinned row-delta guard and Evidence Fabric. A valid packet
demonstrates ONLY agreement with caller-supplied local baseline bytes, not
authenticity of any external source, poisoning detection, or model enforcement.
No network, signing, publishing, money movement, or model execution.
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

import dataset_delta_guard as G

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / "packages" / "evidence-fabric" / "ingest"))
import dataset_delta_in as F  # noqa: E402

SCHEMA = "csoai.dataset-delta-proof-packet/0.1"


def build_packet(*, baseline_manifest_raw: bytes, baseline_file_raw: bytes,
                 candidate_file_raw: bytes, candidate_revision: str,
                 read_at: str) -> dict:
    baseline = G.parse_baseline(baseline_manifest_raw)
    # The manifest has an internal integrity digest, not a signature or
    # external trust anchor. Recreate it from the ORIGINAL held raw bytes.
    local = G.make_baseline(
        baseline_file_raw, dataset=baseline["dataset"],
        revision=baseline["revision"], id_field=baseline["id_field"]
    )
    if G.canonical(local) != G.canonical(baseline):
        raise G.Uncheckable("BASELINE_BYTES_DISAGREE_WITH_MANIFEST")
    report = G.compare(baseline, candidate_file_raw, current_revision=candidate_revision)
    event = F.ingest(G.canonical(report), read_at=read_at)
    if event["state"] != "PARTIAL" or event["value"] is not None:
        raise G.Uncheckable("EVIDENCE_AUTHORITY_BOUNDARY_VIOLATION")
    return {
        "schema": SCHEMA,
        "stage": "OFFLINE_RESEARCH_CANDIDATE",
        "source_authentication": "NOT_ESTABLISHED",
        "baseline_local_byte_check": "MATCHED",
        "model_poisoning": "NOT_TESTED",
        "runtime_prevention": "NOT_TESTED",
        "human_approval": "NOT_ESTABLISHED",
        "signatures": "NONE",
        "comparison": report,
        "evidence_event": event,
    }


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    p.add_argument("--baseline-manifest", type=Path, required=True,
                   help="previously generated, owner-reviewed unsigned candidate manifest")
    p.add_argument("--baseline-file", type=Path, required=True,
                   help="original local JSONL bytes behind that exact manifest")
    p.add_argument("--candidate-file", type=Path, required=True,
                   help="candidate local JSONL bytes")
    p.add_argument("--candidate-revision", required=True,
                   help="caller-supplied immutable 40-hex source revision (not externally authenticated)")
    p.add_argument("--read-at", required=True, help="UTC YYYY-MM-DDTHH:MM:SSZ")
    args = p.parse_args(argv)
    try:
        packet = build_packet(
            baseline_manifest_raw=G.load_file(args.baseline_manifest),
            baseline_file_raw=G.load_file(args.baseline_file),
            candidate_file_raw=G.load_file(args.candidate_file),
            candidate_revision=args.candidate_revision, read_at=args.read_at
        )
    except (G.Uncheckable, F.InvalidInput, OSError, ValueError) as exc:
        print(json.dumps({
            "schema": SCHEMA, "state": "UNCHECKABLE",
            "reason": str(exc)[:180], "source_authentication": "NOT_ESTABLISHED",
            "model_poisoning": "NOT_TESTED"
        }, sort_keys=True), file=sys.stderr)
        return 2
    print(json.dumps(packet, ensure_ascii=False, sort_keys=True, indent=2))
    return 1 if packet["comparison"]["state"] == "REVIEW_REQUIRED" else 0


if __name__ == "__main__":
    sys.exit(main())
