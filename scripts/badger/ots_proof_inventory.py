#!/usr/bin/env python3
"""List mutable OTS proofs without ever descending into incident quarantine.

The OTS upgrade job mutates proof files in place.  Evidence under
``evidence/incidents`` is immutable incident history, so it must not merely be
filtered after discovery: the walker must never enter that directory at all.
"""
from __future__ import annotations

import argparse
import hashlib
import os
import sys
import tempfile
from pathlib import Path


EXCLUDED_PREFIXES = (
    Path("dist"),
    Path("node_modules"),
    Path("evidence/incidents"),
)


def is_excluded(relative: Path) -> bool:
    return any(relative == prefix or prefix in relative.parents for prefix in EXCLUDED_PREFIXES)


def proof_paths(root: Path) -> list[Path]:
    """Return .ots paths eligible for upgrade, pruning excluded trees first."""
    root = root.resolve()
    found: list[Path] = []
    for current, dirnames, filenames in os.walk(root, topdown=True):
        current_path = Path(current)
        relative_current = current_path.relative_to(root)
        dirnames[:] = [
            name
            for name in dirnames
            if not is_excluded(relative_current / name)
        ]
        found.extend(
            current_path / name
            for name in filenames
            if name.endswith(".ots") and not is_excluded(relative_current / name)
        )
    return sorted(found)


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def selftest() -> int:
    with tempfile.TemporaryDirectory() as directory:
        # macOS exposes the same temporary tree through /var and /private/var;
        # compare resolved paths so the regression is about pruning, not aliases.
        root = Path(directory).resolve()
        included = root / "public" / "current.ots"
        quarantined = root / "evidence" / "incidents" / "case" / "proof.ots"
        manifest = root / "evidence" / "incidents" / "case" / "manifest.json"
        ignored = root / "dist" / "client" / "copy.ots"
        for path, payload in (
            (included, b"mutable-proof"),
            (quarantined, b"immutable-incident-proof"),
            (manifest, b'{"immutable":true}\n'),
            (ignored, b"generated-copy"),
        ):
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_bytes(payload)

        quarantine_before = {path: digest(path) for path in (quarantined, manifest)}
        discovered = proof_paths(root)
        if discovered != [included]:
            print("ots-proof-inventory selftest: FAILED", file=sys.stderr)
            print("discovered:", [str(path.relative_to(root)) for path in discovered], file=sys.stderr)
            return 1

        # Model the upgrade job mutating every path it is handed.  The incident
        # proof and its manifest must remain byte-identical because neither path
        # was ever yielded by the pruned walker.
        for path in discovered:
            path.write_bytes(path.read_bytes() + b"-upgraded")
        if any(digest(path) != before for path, before in quarantine_before.items()):
            print("ots-proof-inventory selftest: FAILED — quarantine changed", file=sys.stderr)
            return 1

    print("ots-proof-inventory selftest: PASS — incident quarantine was not traversed or mutated")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--root", type=Path, default=Path(__file__).resolve().parents[2])
    parser.add_argument("--null", action="store_true", help="NUL-delimit paths for xargs -0")
    parser.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        return selftest()
    separator = "\0" if args.null else "\n"
    rendered = separator.join(str(path) for path in proof_paths(args.root))
    if rendered:
        sys.stdout.write(rendered + separator)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
