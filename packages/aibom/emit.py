#!/usr/bin/env python3
"""Emit a CycloneDX-shaped AIBOM stub for a measured lineage.

Does not invent components. If no lineage file is passed, emit UNCHECKABLE.
Fold bom_sha256 into a card later — this file only prints the BOM.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path


def emit(lineage: dict | None) -> dict:
    comps = lineage.get("components") if lineage else []
    bom = {
        "bomFormat": "CycloneDX",
        "specVersion": "1.6",
        "version": 1,
        "metadata": {
            "timestamp": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
            "tools": [{"name": "csoai-aibom-stub", "version": "0.0.1"}],
        },
        "components": comps,
        "x_csoai": {
            "kind": "csoai.aibom/0.1",
            "writes_board": False,
            "spdx_ai_profile": "UNCHECKABLE until SPDX 3.0 AI Profile bytes exist",
            "honesty": "Stub. OWASP AIBOM Generator is not vendored yet. Empty component list is UNCHECKABLE, not a complete BOM. Not a GSPC score.",
        },
    }
    raw = json.dumps(bom, sort_keys=True, separators=(",", ":")).encode()
    bom["x_csoai"]["bom_sha256"] = hashlib.sha256(raw).hexdigest()
    return bom


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--lineage", help="optional JSON file with components[]")
    args = p.parse_args()
    lineage = json.loads(Path(args.lineage).read_text()) if args.lineage else None
    json.dump(emit(lineage), sys.stdout, indent=2)
    sys.stdout.write("\n")


if __name__ == "__main__":
    main()
