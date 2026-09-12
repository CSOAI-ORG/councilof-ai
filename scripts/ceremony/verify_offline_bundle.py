#!/usr/bin/env python3
"""Verify the pinned macOS arm64/Python 3.9 ceremony wheelhouse and runtime."""
from __future__ import annotations

import argparse
import hashlib
import importlib.metadata
import platform
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
DOCS = ROOT / "docs" / "operations" / "root-ceremony"
MANIFEST = DOCS / "wheelhouse-macos-arm64-py39.SHA256"
VERSIONS = {"cryptography": "43.0.3", "cffi": "1.17.1", "pycparser": "2.22"}


def verify_wheelhouse(path: Path) -> list[str]:
    errors: list[str] = []
    for line in MANIFEST.read_text(encoding="utf-8").splitlines():
        if not line.strip() or line.startswith("#"):
            continue
        expected, filename = line.split(None, 1)
        wheel = path / filename.strip()
        if not wheel.is_file():
            errors.append(f"missing wheel: {wheel.name}")
            continue
        got = hashlib.sha256(wheel.read_bytes()).hexdigest()
        if got != expected:
            errors.append(f"hash mismatch: {wheel.name}")
    return errors


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--wheelhouse", required=True)
    args = ap.parse_args()
    errors = []
    if sys.version_info[:2] != (3, 9) or platform.machine() != "arm64" or platform.system() != "Darwin":
        errors.append("this lock is only for CPython 3.9 on macOS arm64")
    errors.extend(verify_wheelhouse(Path(args.wheelhouse)))
    for package, expected in VERSIONS.items():
        try:
            got = importlib.metadata.version(package)
        except importlib.metadata.PackageNotFoundError:
            errors.append(f"runtime package missing: {package}=={expected}")
            continue
        if got != expected:
            errors.append(f"runtime version mismatch: {package} expected {expected}, got {got}")
    if errors:
        for error in errors:
            print(f"REFUSING: {error}", file=sys.stderr)
        return 2
    print("offline_bundle: VERIFIED")
    print("platform: CPython 3.9 / macOS arm64")
    for package, version in VERSIONS.items():
        print(f"{package}: {version}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
