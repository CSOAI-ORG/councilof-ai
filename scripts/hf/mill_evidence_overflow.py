#!/usr/bin/env python3
"""Lossless, immutable-path mapping for the HF mill evidence directory overflow.

The existing csoai/councilof-ai-evidence/interop/mill-evidence directory cannot
be extended beyond its supported capacity. Historical object keys remain in
place; only exact, OID-pinned new keys are remapped into bounded v1 shards.
No data is deleted, re-signed or marked MEASURED by this module.
"""
from __future__ import annotations
import hashlib
import json
import re
from pathlib import Path

SCHEMA = "csoai.mill-evidence-overflow/1"
SOURCE = re.compile(
    r"^interop/mill-evidence/(?:admission-[0-9a-f]{12}\.json|items-[a-z0-9-]+-[0-9a-f]{12}\.jsonl)$"
)
PREFIX = "interop/mill-evidence-shards/v1"
EXPECTED = Path(__file__).with_name("mill_evidence_overflow_map.json")


def blob_sha1(data: bytes) -> str:
    return hashlib.sha1(b"blob %d\0" % len(data) + data).hexdigest()


def load_map(path: Path = EXPECTED) -> dict[str, str]:
    raw = json.loads(Path(path).read_text(encoding="utf-8"))
    if (
        raw.get("schema") != SCHEMA
        or raw.get("destination_prefix") != PREFIX
        or not re.fullmatch(r"[0-9a-f]{40}", raw.get("source_commit", ""))
        or not isinstance(raw.get("entries"), dict)
        or not raw["entries"]
    ):
        raise ValueError("Invalid overflow-map envelope")
    for name, oid in raw["entries"].items():
        if not SOURCE.fullmatch(name) or not isinstance(oid, str) or not re.fullmatch(r"[0-9a-f]{40}", oid):
            raise ValueError("Invalid overflow-map file name or blob OID")
    return raw["entries"]


def destination(logical: str, entries: dict[str, str]) -> str:
    if logical not in entries:
        return logical
    name = logical.rsplit("/", 1)[1]
    digest = name.rsplit("-", 1)[1][:12]
    # One hex-digit shard: 16 directories, ~225 records each in the first
    # 3,608-file overflow batch, with large headroom below the 10k limit.
    return f"{PREFIX}/{digest[0]}/{name}"


def remap_files(files: dict, entries: dict[str, str]) -> dict:
    """Validate original Git blobs before enabling any remote publication."""
    remapped = {}
    for logical, source in files.items():
        physical = destination(logical, entries)
        if physical in remapped:
            raise ValueError("Duplicate physical mirror destination")
        if logical in entries:
            actual = blob_sha1(Path(source).read_bytes())
            if actual != entries[logical]:
                raise ValueError(f"Source blob OID changed; overflow map needs reviewed update: {logical}")
        remapped[physical] = source
    return remapped


def source_for(physical: str, entries: dict[str, str]) -> str | None:
    """Reverse lookup; used only for tested provenance/readback code."""
    seen = [source for source in entries if destination(source, entries) == physical]
    if len(seen) > 1:
        raise ValueError("Non-injective overflow mapping")
    return seen[0] if seen else None
