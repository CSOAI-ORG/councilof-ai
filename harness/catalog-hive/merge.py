#!/usr/bin/env python3
"""Build a provenance-preserving index from normalized catalog JSONL snapshots."""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import tempfile
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

SCHEMA = "csoai.catalog-hive-index/0.1"
MAX_INPUT_BYTES = 256 * 1024 * 1024
MAX_OBSERVATIONS = 500_000


def sha256(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def read_jsonl(path: Path) -> tuple[list[dict[str, Any]], dict[str, Any]]:
    raw = path.read_bytes()
    if len(raw) > MAX_INPUT_BYTES:
        raise ValueError(f"{path}: exceeds {MAX_INPUT_BYTES} byte limit")
    observations: list[dict[str, Any]] = []
    for line_no, line in enumerate(raw.splitlines(), 1):
        if not line.strip():
            continue
        try:
            row = json.loads(line)
        except json.JSONDecodeError as exc:
            raise ValueError(f"{path}:{line_no}: invalid JSON: {exc.msg}") from exc
        if not isinstance(row, dict) or row.get("schema") != "csoai.catalog-hive-candidate/0.1":
            raise ValueError(f"{path}:{line_no}: not a Catalog Hive candidate")
        if row.get("state") != "QUARANTINED_DISCOVERY_ONLY":
            raise ValueError(f"{path}:{line_no}: candidate escaped discovery quarantine")
        if row.get("execution") != "NOT_ATTEMPTED" or row.get("gspc_measurement") is not False:
            raise ValueError(f"{path}:{line_no}: execution or GSPC claim violates intake boundary")
        if not isinstance(row.get("candidate_id"), str) or not isinstance(row.get("source"), dict):
            raise ValueError(f"{path}:{line_no}: missing candidate identity or source provenance")
        row = dict(row)
        row["observation_id"] = sha256(line.strip())
        observations.append(row)
        if len(observations) > MAX_OBSERVATIONS:
            raise ValueError(f"{path}: exceeds {MAX_OBSERVATIONS} observation limit")
    return observations, {"path": str(path), "sha256": sha256(raw),
                         "bytes": len(raw), "observation_count": len(observations)}


def build_index(inputs: list[Path], built_at: str | None = None) -> dict[str, Any]:
    observations: list[dict[str, Any]] = []
    files = []
    for path in inputs:
        rows, receipt = read_jsonl(path)
        observations.extend(rows)
        files.append(receipt)
        if len(observations) > MAX_OBSERVATIONS:
            raise ValueError(f"index exceeds {MAX_OBSERVATIONS} observations")

    by_locator: dict[str, list[str]] = defaultdict(list)
    for row in observations:
        resource = row.get("resource") if isinstance(row.get("resource"), dict) else {}
        locators = set(row.get("identity_urls") or [])
        locator = resource.get("locator")
        if isinstance(locator, str) and locator.startswith(("http://", "https://")):
            locators.add(locator)
        for value in locators:
            if isinstance(value, str) and value.startswith(("http://", "https://")):
                by_locator[value].append(row["observation_id"])

    groups = [{"locator": locator, "observation_ids": sorted(set(ids)),
               "match_semantics": "exact_locator_match_only_not_identity_or_trust"}
              for locator, ids in sorted(by_locator.items()) if len(set(ids)) > 1]
    return {
        "schema": SCHEMA,
        "built_at": built_at or datetime.now(timezone.utc).isoformat(),
        "source_files": files,
        "observation_count": len(observations),
        "exact_locator_match_group_count": len(groups),
        "observations": observations,
        "exact_locator_matches": groups,
        "boundary": "catalog discovery only; exact locator matches are review hints, not entity identity, trust, execution, measurement, or endorsement",
        "gspc_measurement": False,
    }


def atomic_write(path: Path, data: bytes) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    fd, tmp = tempfile.mkstemp(prefix=f".{path.name}.", dir=path.parent)
    try:
        with os.fdopen(fd, "wb") as stream:
            stream.write(data)
            stream.flush()
            os.fsync(stream.fileno())
        os.replace(tmp, path)
    except Exception:
        try:
            os.unlink(tmp)
        except OSError:
            pass
        raise


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("inputs", nargs="+", type=Path, help="normalized candidate JSONL snapshots")
    parser.add_argument("--out", required=True, type=Path, help="unified discovery index JSON")
    args = parser.parse_args()
    out = args.out.resolve()
    inputs = [path.resolve() for path in args.inputs]
    if out in inputs:
        raise ValueError("output path must not overwrite an input snapshot")
    index = build_index(inputs)
    atomic_write(out, (json.dumps(index, ensure_ascii=False, sort_keys=True, indent=2) + "\n").encode())
    print(json.dumps({"schema": index["schema"], "observation_count": index["observation_count"],
                      "exact_locator_match_group_count": index["exact_locator_match_group_count"],
                      "gspc_measurement": False, "output": str(out)}, sort_keys=True))
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (OSError, ValueError, json.JSONDecodeError) as exc:
        print(f"catalog-hive-merge: {exc}", file=sys.stderr)
        raise SystemExit(2)
