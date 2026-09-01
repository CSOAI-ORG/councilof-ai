#!/usr/bin/env python3
"""Emit a TRACE Trust Record stub bound to a GSPC card sha256.

Hardware RATS/EAT fields stay UNCHECKABLE. Does not write /api/gspc.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone


def emit(card_sha256: str, otel_trace_id: str | None = None, otel_trace_hash: str | None = None) -> dict:
    if len(card_sha256) != 64 or any(c not in "0123456789abcdef" for c in card_sha256.lower()):
        raise SystemExit("gspc-card-sha256 must be 64 hex")
    if otel_trace_hash and (len(otel_trace_hash) != 64 or any(c not in "0123456789abcdef" for c in otel_trace_hash.lower())):
        raise SystemExit("otel-trace-hash must be 64 hex when supplied")
    rec = {
        "schema": "https://councilof.ai/schema/trace-trust-record-v0.json",
        "kind": "csoai.trace-trust-record/0.1",
        "writes_board": False,
        "gspc_card_sha256": card_sha256.lower(),
        # OPTIONAL binding to the OTel runtime trace. Absent/null = UNCHECKABLE; TRACE never
        # invents a span. This binds the software runtime record, not any hardware quote.
        "otel_trace_id": otel_trace_id or None,
        "otel_trace_hash": (otel_trace_hash.lower() if otel_trace_hash else None),
        "as_of": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "claims": {
            "rats": {"status": "UNCHECKABLE", "note": "No hardware evidence file."},
            "eat": {"status": "UNCHECKABLE"},
            "slsa": {"status": "UNCHECKABLE", "note": "No provenance predicate attached."},
            "scitt": {"status": "UNCHECKABLE"},
            "spiffe": {"status": "UNCHECKABLE"},
            "ear": {"status": "UNCHECKABLE"},
            "silicon": {"status": "UNCHECKABLE", "note": "AMD/Intel/Microsoft/OPAQUE/TII not bound."},
        },
        "honesty": "Software stub. TRACE LF pack is not implemented. Empty silicon is UNCHECKABLE, not zero. Not a GSPC score. Not a certificate.",
    }
    rec["record_sha256"] = hashlib.sha256(
        json.dumps({k: rec[k] for k in rec if k != "record_sha256"}, sort_keys=True, separators=(",", ":")).encode()
    ).hexdigest()
    return rec


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--gspc-card-sha256", required=True)
    p.add_argument("--otel-trace-id", default=None, help="optional OTel trace id to bind")
    p.add_argument("--otel-trace-hash", default=None, help="optional sha256 of the OTLP export to bind")
    args = p.parse_args()
    json.dump(emit(args.gspc_card_sha256, args.otel_trace_id, args.otel_trace_hash), sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
