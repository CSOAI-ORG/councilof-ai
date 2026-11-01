#!/usr/bin/env python3
"""Materialize and look up SHA-256-verified control-plane frozen banks for RunPod intake.

Never derives a bank from items.jsonl and never alters the allowlist. Only exact
bytes whose SHA-256 is listed in scripts/runpod_gspc_bank_allowlist.current.json
are staged into the control-plane trusted-banks directory.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import re
import sys
import urllib.request
from pathlib import Path
from typing import Any

SHA256_RE = re.compile(r"^[0-9a-f]{64}$")

CONTROL_PLANE_BANK_GLOBS = (
    "gpu-offload/kaggle-gspc-batch/banks/*.jsonl",
    "public/interop/banks/**/*.jsonl",
)

PINNED_HF_BANKS = (
    {
        "axis": "jail",
        "sha256": "0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a",
        "url": "https://huggingface.co/datasets/csoai/gspc-jail-goldbank/resolve/df16e7855ff04b90fea19aa5f11f4b86cb466a47/samples.jsonl",
    },
)


def sha256_bytes(raw: bytes) -> str:
    return hashlib.sha256(raw).hexdigest()


def load_allowlisted_digests(allowlist_path: Path) -> dict[str, str]:
    data = json.loads(allowlist_path.read_text(encoding="utf-8"))
    allowed: dict[str, str] = {}
    for row in data.get("banks", []):
        digest = str(row.get("sha256", ""))
        axis = str(row.get("axis", ""))
        if SHA256_RE.fullmatch(digest) and axis:
            allowed[digest] = axis
    return allowed


def _write_immutable_bank(dest: Path, raw: bytes) -> None:
    if dest.exists():
        if sha256_bytes(dest.read_bytes()) == sha256_bytes(raw):
            return
        dest.unlink()
    fd = os.open(dest, os.O_WRONLY | os.O_CREAT | os.O_EXCL, 0o600)
    with os.fdopen(fd, "wb") as handle:
        handle.write(raw)
        handle.flush()
        os.fsync(handle.fileno())


def stage_trusted_banks(
    repo_root: Path,
    allowlist_path: Path,
    out_dir: Path,
    fetch_pinned_hf: bool = False,
) -> dict[str, Any]:
    allowed = load_allowlisted_digests(allowlist_path)
    out_dir.mkdir(parents=True, exist_ok=True)
    staged: dict[str, str] = {}

    for pattern in CONTROL_PLANE_BANK_GLOBS:
        for candidate in sorted(repo_root.glob(pattern)):
            if not candidate.is_file() or candidate.is_symlink():
                continue
            raw = candidate.read_bytes()
            digest = sha256_bytes(raw)
            if digest in allowed:
                dest = out_dir / f"{digest}.jsonl"
                _write_immutable_bank(dest, raw)
                staged[digest] = str(candidate.relative_to(repo_root))

    if fetch_pinned_hf:
        for item in PINNED_HF_BANKS:
            digest = item["sha256"]
            if digest not in allowed or digest in staged:
                continue
            try:
                raw = urllib.request.urlopen(item["url"], timeout=20).read()
            except Exception:
                continue
            if sha256_bytes(raw) == digest:
                dest = out_dir / f"{digest}.jsonl"
                _write_immutable_bank(dest, raw)
                staged[digest] = item["url"]

    return {
        "allowlisted_total": len(allowed),
        "staged_total": len(staged),
        "staged_digests": sorted(staged.keys()),
        "missing_digests": sorted(set(allowed.keys()) - set(staged.keys())),
    }


def lookup_run_trusted_bank(run_dir: Path, trusted_banks_dir: Path) -> Path | None:
    run_file = run_dir / "run.json"
    if not run_file.is_file() or run_file.is_symlink():
        return None
    try:
        run_data = json.loads(run_file.read_text(encoding="utf-8"))
    except Exception:
        return None
    digest = str(run_data.get("bank_sha256", ""))
    if not SHA256_RE.fullmatch(digest):
        return None
    candidate = (trusted_banks_dir / f"{digest}.jsonl").resolve()
    if not candidate.is_file() or candidate.is_symlink():
        return None
    if sha256_bytes(candidate.read_bytes()) != digest:
        return None
    return candidate


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="cmd", required=True)

    p_stage = sub.add_parser("stage")
    p_stage.add_argument("--repo-root", required=True, type=Path)
    p_stage.add_argument("--allowlist", required=True, type=Path)
    p_stage.add_argument("--out-dir", required=True, type=Path)
    p_stage.add_argument("--fetch-pinned-hf", action="store_true")

    p_lookup = sub.add_parser("lookup")
    p_lookup.add_argument("--run-dir", required=True, type=Path)
    p_lookup.add_argument("--trusted-banks-dir", required=True, type=Path)

    args = parser.parse_args(argv)
    if args.cmd == "stage":
        summary = stage_trusted_banks(
            args.repo_root.resolve(),
            args.allowlist.resolve(),
            args.out_dir.resolve(),
            fetch_pinned_hf=args.fetch_pinned_hf,
        )
        print(json.dumps(summary, sort_keys=True))
        return 0
    if args.cmd == "lookup":
        found = lookup_run_trusted_bank(args.run_dir.resolve(), args.trusted_banks_dir.resolve())
        if found is None:
            return 2
        print(str(found))
        return 0
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
