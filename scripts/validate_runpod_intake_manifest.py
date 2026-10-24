#!/usr/bin/env python3
"""Verify exact regular-file membership and SHA256 identity for an intake bundle."""
import argparse
import hashlib
import json
import os
import stat
from pathlib import Path, PurePosixPath
import re

def sha256_file(path):
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()

def validate(root, *, include_digests=False):
    root = Path(root)
    if root.is_symlink() or not root.is_dir():
        raise ValueError("bundle root must be a real directory")
    root = root.resolve()
    manifest = root / "SHA256SUMS"
    data = root / "gspc-24x7"
    if manifest.is_symlink() or not manifest.is_file():
        raise ValueError("SHA256SUMS must be a regular file")
    if data.is_symlink() or not data.is_dir():
        raise ValueError("gspc-24x7 must be a real directory")
    expected = {}
    descriptor = os.open(manifest, os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK)
    with os.fdopen(descriptor, "rb") as stream:
        if not stat.S_ISREG(os.fstat(stream.fileno()).st_mode):
            raise ValueError("SHA256SUMS must be a regular file")
        raw_manifest = stream.read(8 * 1024 * 1024 + 1)
    if len(raw_manifest) > 8 * 1024 * 1024:
        raise ValueError("SHA256SUMS exceeds the 8 MiB manifest limit")
    for number, line in enumerate(raw_manifest.decode("utf-8").splitlines(keepends=True), 1):
        line = line[:-1] if line.endswith("\n") else line
        match = re.fullmatch(r"([0-9a-fA-F]{64}) [ *](.+)", line)
        if not match:
            raise ValueError(f"malformed manifest line {number}")
        digest, name = match.groups()
        path = PurePosixPath(name)
        if (path.is_absolute() or ".." in path.parts or "\\" in name
                or str(path) != name or len(path.parts) < 2
                or path.parts[0] != "gspc-24x7"):
            raise ValueError(f"noncanonical data path at line {number}")
        if name in expected:
            raise ValueError(f"duplicate path at line {number}")
        expected[name] = digest.lower()
    if not expected:
        raise ValueError("manifest must name at least one data file")
    actual = {}
    for path in data.rglob("*"):
        if path.is_symlink():
            raise ValueError("symlink in data tree")
        if path.is_dir():
            continue
        if not path.is_file():
            raise ValueError("nonregular data entry")
        actual[path.relative_to(root).as_posix()] = path
    if set(expected) != set(actual):
        raise ValueError("manifest and data file sets differ")
    for name, digest in expected.items():
        if sha256_file(actual[name]) != digest:
            raise ValueError(f"SHA256 mismatch: {name}")
    result = {"files": len(actual), "manifest_sha256": hashlib.sha256(raw_manifest).hexdigest()}
    if include_digests:
        result["digests"] = expected
    return result

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", required=True)
    args = parser.parse_args()
    print(json.dumps(validate(args.root), sort_keys=True))

if __name__ == "__main__":
    main()
