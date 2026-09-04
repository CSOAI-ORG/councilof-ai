#!/usr/bin/env python3
"""Repair public references whose evidence files are no longer publishable.

The archive remains append-only for measurements. This repair changes no card,
root, signature, inclusion proof, block field, or timestamp. It only replaces a
proof URL that cannot be verified with JSON null. Git preserves the prior bytes
and the incident archive preserves the removed proof-shaped artifacts.

Use `--check` in review and `--apply` for the one-time correction.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path
from typing import Any, Callable


REPO = Path(__file__).resolve().parents[1]
PUBLIC = REPO / "public"
ARCHIVE = PUBLIC / "archive"
INTEROP_INDEX = PUBLIC / "interop" / "index.json"


def local_public_path(reference: str) -> Path | None:
    value = reference.removeprefix("https://councilof.ai/")
    if value.startswith("public/"):
        value = value.removeprefix("public/")
    if not value.startswith("interop/") or not value.endswith(".ots"):
        return None
    candidate = PUBLIC / value
    return candidate if candidate.is_relative_to(PUBLIC) else None


def repair_value(value: Any, exists: Callable[[Path], bool]) -> int:
    changed = 0
    if isinstance(value, dict):
        reference = value.get("ots_path")
        if isinstance(reference, str):
            target = local_public_path(reference)
            if target is not None and not exists(target):
                value["ots_path"] = None
                changed += 1
        for child in value.values():
            changed += repair_value(child, exists)
    elif isinstance(value, list):
        for child in value:
            changed += repair_value(child, exists)
    return changed


def repair_file(path: Path, apply: bool) -> int:
    if path.suffix == ".jsonl":
        lines: list[str] = []
        changed = 0
        for raw in path.read_text(encoding="utf-8").splitlines():
            if not raw.strip():
                continue
            value = json.loads(raw)
            count = repair_value(value, Path.is_file)
            changed += count
            lines.append(
                json.dumps(value, sort_keys=True, separators=(",", ":"), ensure_ascii=False)
                if count
                else raw
            )
        if changed and apply:
            path.write_text("\n".join(lines) + "\n", encoding="utf-8")
        return changed

    value = json.loads(path.read_text(encoding="utf-8"))
    changed = repair_value(value, Path.is_file)
    if changed and apply:
        path.write_text(json.dumps(value, indent=1, ensure_ascii=False) + "\n", encoding="utf-8")
    return changed


def repair_interop_index(apply: bool, exists: Callable[[Path], bool] = Path.is_file) -> int:
    value = json.loads(INTEROP_INDEX.read_text(encoding="utf-8"))
    formats = value.get("formats") if isinstance(value.get("formats"), list) else []
    kept: list[Any] = []
    removed = 0
    prefix = "https://councilof.ai/interop/"
    for entry in formats:
        url = entry.get("url") if isinstance(entry, dict) else None
        if isinstance(url, str) and url.startswith(prefix):
            target = PUBLIC / "interop" / url.removeprefix(prefix)
            if not exists(target):
                removed += 1
                continue
        kept.append(entry)
    if removed and apply:
        value["formats"] = kept
        value["total_formats"] = len(kept)
        INTEROP_INDEX.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    return removed


def run_selftest() -> int:
    missing = {"ots_path": "public/interop/root-deadbeef.json.ots"}
    assert repair_value(missing, lambda _: False) == 1
    assert missing["ots_path"] is None

    present = {"ots_path": "public/interop/root-728e8c5e.json.ots"}
    assert repair_value(present, lambda _: True) == 0
    assert present["ots_path"].endswith(".ots")

    unrelated = {"ots_path": "https://example.invalid/proof.ots"}
    assert repair_value(unrelated, lambda _: False) == 0
    assert unrelated["ots_path"].startswith("https://")
    sample = {
        "formats": [
            {"url": "https://councilof.ai/interop/present.json"},
            {"url": "https://councilof.ai/interop/missing.ots"},
        ]
    }
    kept = [
        entry
        for entry in sample["formats"]
        if not entry["url"].endswith("missing.ots")
    ]
    assert len(kept) == 1
    print("repair-archive-ots-references selftest: PASS")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser()
    modes = parser.add_mutually_exclusive_group(required=True)
    modes.add_argument("--check", action="store_true")
    modes.add_argument("--apply", action="store_true")
    modes.add_argument("--selftest", action="store_true")
    args = parser.parse_args()
    if args.selftest:
        return run_selftest()

    changed = 0
    files = sorted(path for path in ARCHIVE.rglob("*") if path.suffix in {".json", ".jsonl"})
    for path in files:
        changed += repair_file(path, apply=args.apply)
    removed_index_entries = repair_interop_index(apply=args.apply)
    mode = "repaired" if args.apply else "needs repair"
    print(
        f"public proof references {mode}: archive={changed}, "
        f"interop_index={removed_index_entries}, scanned_archive_files={len(files)}"
    )
    return 1 if args.check and (changed or removed_index_entries) else 0


if __name__ == "__main__":
    raise SystemExit(main())
