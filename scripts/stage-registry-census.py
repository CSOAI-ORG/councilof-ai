#!/usr/bin/env python3
"""Stage a completed CSOAI MCP Registry census for the guarded site publisher.

Run scripts/registry-census.py off-edge first, then pass its output with --input. This command
does no network request, Git operation or deploy. It preserves one immutable timestamped source
and updates the small, deterministic /interop/mcp-registry-latest.json pointer atomically. A
failed or incomplete measurement leaves the previous pointer alone; --check verifies its bytes.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import tempfile
from datetime import datetime
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
LATEST = Path("interop/mcp-registry-latest.json")
SCHEMA = "csoai.mcp-registry-census/0.1"
LATEST_SCHEMA = "csoai.mcp-registry-latest/0.1"
REGISTRY = "https://registry.modelcontextprotocol.io"
NAMESPACE = "io.github.CSOAI-ORG"
DATED = re.compile(r"^/interop/mcp-registry-\d{4}-\d{2}-\d{2}/census\.json$")
TIMESTAMPED = re.compile(r"^/interop/mcp-registry-census/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}Z\.json$")
UTC_SECOND = re.compile(r"^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$")


def parse_time(value: object) -> datetime:
    if not isinstance(value, str) or not UTC_SECOND.fullmatch(value):
        raise ValueError("census timestamp must be UTC to the second with a Z suffix")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def decode_census(raw: bytes) -> dict:
    body = json.loads(raw)
    if not isinstance(body, dict) or body.get("schema") != SCHEMA or body.get("kind") != "measurement":
        raise ValueError("wrong census schema or kind")
    if body.get("registry") != REGISTRY or body.get("namespace") != NAMESPACE:
        raise ValueError("wrong registry or namespace")
    for field in ("servers", "version_rows"):
        value = body.get(field)
        if type(value) is not int or value < 0:
            raise ValueError(f"{field} must be a complete nonnegative integer")
    if body["version_rows"] < body["servers"]:
        raise ValueError("version_rows cannot be smaller than distinct server names")
    if body.get("version_read_failures") != []:
        raise ValueError("version list has failures; latest pointer stays unchanged")
    start, end = parse_time(body.get("measured_utc")), parse_time(body.get("completed_utc"))
    if end < start:
        raise ValueError("census completed before it started")
    if "cursor exhaustion" not in str(body.get("method", "")):
        raise ValueError("census does not describe a cursor-exhausted namespace walk")
    return body


def public_path(path: Path, public_root: Path) -> str:
    try:
        rel = path.resolve().relative_to(public_root.resolve())
    except ValueError as exc:
        raise ValueError("source artifact is outside public root") from exc
    return "/" + rel.as_posix()


def validate_pointer(public_root: Path) -> dict:
    pointer_path = public_root / LATEST
    pointer = json.loads(pointer_path.read_bytes())
    if not isinstance(pointer, dict) or pointer.get("schema") != LATEST_SCHEMA:
        raise ValueError("latest pointer schema is invalid")
    source = pointer.get("source_artifact")
    if not isinstance(source, str) or not (DATED.fullmatch(source) or TIMESTAMPED.fullmatch(source)):
        raise ValueError("latest pointer does not name an immutable dated source")
    source_path = public_root / source.lstrip("/")
    raw = source_path.read_bytes()
    body = decode_census(raw)
    expected_dated = f"/interop/mcp-registry-{body['completed_utc'][:10]}/census.json"
    expected_timestamped = "/interop/mcp-registry-census/" + body["completed_utc"].replace(":", "-") + ".json"
    if source not in (expected_dated, expected_timestamped):
        raise ValueError("immutable source path does not match the census completion time")
    expected = {
        "schema": LATEST_SCHEMA,
        "source_artifact": source,
        "source_sha256": hashlib.sha256(raw).hexdigest(),
        "source_bytes": len(raw),
        "producer": "scripts/registry-census.py",
        "registry": body["registry"],
        "namespace": body["namespace"],
        "measured_utc": body["measured_utc"],
        "completed_utc": body["completed_utc"],
        "servers": body["servers"],
        "version_rows": body["version_rows"],
        "version_read_failures": body["version_read_failures"],
        "note": "Self-published listings, not executions, adoption or customers.",
    }
    if pointer != expected:
        raise ValueError("latest pointer does not match source bytes and measured fields")
    return pointer


def stage(source_path: Path, public_root: Path) -> dict:
    raw = source_path.read_bytes()
    body = decode_census(raw)
    digest = hashlib.sha256(raw).hexdigest()
    current_path = public_root / LATEST
    if current_path.exists():
        current = validate_pointer(public_root)
        if parse_time(body["completed_utc"]) < parse_time(current["completed_utc"]):
            raise ValueError("new census is older than the current latest measurement")
        if current["completed_utc"] == body["completed_utc"]:
            if current["source_sha256"] != digest:
                raise ValueError("same measurement timestamp has different bytes")
            return current

    try:
        rel = public_path(source_path, public_root)
        if rel not in (
            f"/interop/mcp-registry-{body['completed_utc'][:10]}/census.json",
            "/interop/mcp-registry-census/" + body["completed_utc"].replace(":", "-") + ".json",
        ):
            raise ValueError("input inside public root is not an immutable dated census path")
        immutable_path = source_path
    except ValueError as exc:
        if "outside public root" not in str(exc):
            raise
        stamp = body["completed_utc"].replace(":", "-")
        immutable_path = public_root / "interop" / "mcp-registry-census" / f"{stamp}.json"
        rel = public_path(immutable_path, public_root)
        immutable_path.parent.mkdir(parents=True, exist_ok=True)
        try:
            with immutable_path.open("xb") as dest:
                dest.write(raw)
        except FileExistsError:
            if immutable_path.read_bytes() != raw:
                raise ValueError("timestamped artifact already exists with different bytes") from exc

    pointer = {
        "schema": LATEST_SCHEMA,
        "source_artifact": rel,
        "source_sha256": digest,
        "source_bytes": len(raw),
        "producer": "scripts/registry-census.py",
        "registry": body["registry"],
        "namespace": body["namespace"],
        "measured_utc": body["measured_utc"],
        "completed_utc": body["completed_utc"],
        "servers": body["servers"],
        "version_rows": body["version_rows"],
        "version_read_failures": body["version_read_failures"],
        "note": "Self-published listings, not executions, adoption or customers.",
    }
    current_path.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile("w", dir=current_path.parent, prefix=".registry-latest-", delete=False) as temp:
        json.dump(pointer, temp, sort_keys=True, indent=2)
        temp.write("\n")
        temp_path = Path(temp.name)
    os.replace(temp_path, current_path)
    return validate_pointer(public_root)


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--input", type=Path, help="completed off-edge registry-census.py output")
    ap.add_argument("--public-root", type=Path, default=ROOT / "public")
    ap.add_argument("--check", action="store_true", help="check pointer, immutable source and checksum without writing")
    args = ap.parse_args()
    try:
        if args.check:
            pointer = validate_pointer(args.public_root)
        elif args.input:
            pointer = stage(args.input, args.public_root)
        else:
            ap.error("--input is required unless --check is set")
        print(json.dumps({"state": "VALID", "source": pointer["source_artifact"], "sha256": pointer["source_sha256"], "servers": pointer["servers"], "version_rows": pointer["version_rows"], "completed_utc": pointer["completed_utc"]}))
        return 0
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"UNCHECKABLE: {exc}; previous published measurement must not be replaced", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
