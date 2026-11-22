#!/usr/bin/env python3
"""Pre-merge, fail-closed full parity check for mill evidence and its overflow.

Requires a complete local checkout of the candidate branch. Verifies every
present Git blob against one of two anonymous HF dataset trees, and requires
at least one anonymous SHA-256 GET from each shard. Does not write to Hub.
"""
from __future__ import annotations
import hashlib
import importlib.util
from pathlib import Path
import sys

HERE = Path(__file__).resolve().parent
SCRIPTS = HERE.parent
sys.path.insert(0, str(SCRIPTS))
from hf.mill_evidence_overflow import blob_sha1, destination, load_map

spec = importlib.util.spec_from_file_location("evidence_sync_mirror_probe", SCRIPTS / "pod-loops" / "evidence_sync.py")
es = importlib.util.module_from_spec(spec)
spec.loader.exec_module(es)
ROOT = HERE.parent.parent
EVIDENCE = ROOT / "public" / "interop" / "mill-evidence"
SOURCE_ROOT = "interop/mill-evidence"
OVERFLOW_ROOT = "interop/mill-evidence-shards/v1"


def _matches(actual: bytes, record) -> bool:
    if record is None:
        return False
    oid, lfs_sha = record
    return (
        hashlib.sha256(actual).hexdigest() == lfs_sha
        if lfs_sha else blob_sha1(actual) == oid
    )


def validate_local_source(files: dict, entries: dict[str, str]) -> None:
    # A partially checked-out working tree isn't evidence of absence. CI uses
    # the full GitHub checkout. A stray modified mapped blob is never uploaded.
    if not all(name in files for name in entries):
        missing = [name for name in entries if name not in files]
        raise ValueError(f"Incomplete source tree: {len(missing)} pinned overflow inputs missing")
    for logical, expected_oid in entries.items():
        actual = blob_sha1(files[logical].read_bytes())
        if actual != expected_oid:
            raise ValueError(f"Overflow source mismatch: {logical}")


def verify_mirrors(files: dict, entries: dict[str, str], original: dict, overflow: dict):
    """Pure comparison for 9,106 candidate files; returns physical shard samples."""
    fails = []
    samples = {}
    for logical, local_path in sorted(files.items()):
        body = local_path.read_bytes()
        if logical in entries:
            physical = destination(logical, entries)
            record = overflow.get(physical)
            if not _matches(body, record):
                fails.append(logical)
            shard = physical.split("/")[-2]
            samples.setdefault(shard, (physical, local_path))
        elif not _matches(body, original.get(logical)):
            fails.append(logical)
    return fails, samples


def main() -> int:
    entries = load_map()
    files = {
        str(p.relative_to(ROOT / "public")): p
        for p in EVIDENCE.rglob("*") if p.is_file() and not p.name.startswith(".")
    } if EVIDENCE.exists() else {}
    present = sum(logical in files for logical in entries)
    if present == 0:
        # In master before the new batch lands there are no claimed overflow
        # objects to publish. The legacy HF gate still applies independently.
        print("mill-overflow-verifier: 0 pinned files in this source tree; no overflow publication claimed")
        return 0
    validate_local_source(files, entries)
    original = es.remote_tree({SOURCE_ROOT})
    overflow = es.remote_tree({OVERFLOW_ROOT})
    fails, samples = verify_mirrors(files, entries, original, overflow)
    if fails:
        print(f"mill-overflow-verifier: REFUSED {len(fails)} mismatched or absent mirror objects; examples {fails[:3]}",file=sys.stderr)
        return 1
    for shard, (physical, path) in sorted(samples.items()):
        bad = es.anon_probe({physical:path}, [physical], 1)
        if bad:
            print(f"mill-overflow-verifier: REFUSED anonymous SHA-256 readback shard {shard}",file=sys.stderr)
            return 2
    print(f"mill-overflow-verifier: VERIFIED {len(files)} source files, {len(entries)} sharded objects, {len(samples)} anonymous SHA-256 shard probes; no board admission asserted")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
