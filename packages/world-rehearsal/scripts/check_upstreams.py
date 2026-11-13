#!/usr/bin/env python3
"""Offline integrity check, not proof of rights beyond the retained source licenses."""
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def check():
    manifest = json.loads((ROOT / "UPSTREAMS.json").read_text())
    expected = manifest["files"]
    actual = {p.relative_to(ROOT).as_posix() for p in (ROOT / "third_party").rglob("*")
              if p.is_file() and "__pycache__" not in p.parts}
    if actual != set(expected):
        raise ValueError("Unreviewed or missing third-party files")
    for name, digest in expected.items():
        path = ROOT / name
        if hashlib.sha256(path.read_bytes()).hexdigest() != digest:
            raise ValueError("Upstream bytes changed: " + name)
    dependency = manifest["canonical_dependency"]
    if hashlib.sha256((ROOT / dependency["path"]).read_bytes()).hexdigest() != dependency["sha256"]:
        raise ValueError("Canonical event dependency changed; requalify the exact new source")
    print(json.dumps({"state": "PINNED_BYTES_MATCH", "third_party_files": len(actual),
                      "canonical_dependency": dependency["path"],
                      "license_files_retained": True}))


if __name__ == "__main__":
    check()
