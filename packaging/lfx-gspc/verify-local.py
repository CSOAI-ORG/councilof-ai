#!/usr/bin/env python3
"""Verify the source-only OpenBMC/OpenShell/LFX package without network or keys."""
from __future__ import annotations

import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
MANIFEST = ROOT / "packaging/lfx-gspc/PACKAGE-MANIFEST.json"


def verify() -> dict:
    manifest = json.loads(MANIFEST.read_text())
    files = manifest["files"]
    if manifest["file_count"] != len(files):
        raise ValueError("manifest file count differs from inventory")
    for name, expected in files.items():
        path = (ROOT / name).resolve()
        if not path.is_relative_to(ROOT) or not path.is_file():
            raise ValueError(f"missing or unsafe package file: {name}")
        raw = path.read_bytes()
        if len(raw) != expected["bytes"] or hashlib.sha256(raw).hexdigest() != expected["sha256"]:
            raise ValueError(f"package file drift: {name}")
    safe = json.loads((ROOT / "measurement/crosswalk/sources/osaia-safe.json").read_text())
    if safe["source_id"] != "osaia-safe":
        raise ValueError("wrong SAFE source crosswalk")
    return {"state": "PASS", "files": len(files), "safe_source": safe["source_id"],
            "claim_boundary": "local source integrity only; no runtime or upstream acceptance"}


if __name__ == "__main__":
    print(json.dumps(verify(), sort_keys=True))
