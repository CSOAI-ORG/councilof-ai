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


def emit(card_sha256: str) -> dict:
    if len(card_sha256) != 64 or any(c not in "0123456789abcdef" for c in card_sha256.lower()):
        raise SystemExit("gspc-card-sha256 must be 64 hex")
    rec = {
        "schema": "https://councilof.ai/schema/trace-trust-record-v0.json",
        "kind": "csoai.trace-trust-record/0.1",
        "writes_board": False,
        "gspc_card_sha256": card_sha256.lower(),
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
    args = p.parse_args()
    json.dump(emit(args.gspc_card_sha256), sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
