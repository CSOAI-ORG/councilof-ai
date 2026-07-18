#!/usr/bin/env python3
"""Merge canonical security headers into hive vercel.json files.

Default: --dry-run report. Use --apply to write.
"""
from __future__ import annotations
import argparse, json, sys
from pathlib import Path

CLAWD = Path.home() / "clawd"
TEMPLATE = CLAWD / ".local-tools" / "security_headers.json"
CANON_SOURCE = "/(.*)"


def discover_targets() -> list[Path]:
    targets: list[Path] = []
    for pattern in ("*-deploy", "*-site"):
        for d in CLAWD.glob(pattern):
            if not d.is_dir():
                continue
            vj = d / "vercel.json"
            if vj.exists():
                targets.append(vj)
    return sorted(targets)


def merge_headers(existing: dict, canon: dict) -> tuple[dict, list[str]]:
    new = dict(existing)
    headers_list = list(new.get("headers", []))
    canon_headers = {h["key"]: h["value"] for h in canon["headers"]}
    target_block = None
    for block in headers_list:
        if block.get("source") == CANON_SOURCE:
            target_block = block
            break
    if target_block is None:
        target_block = {"source": CANON_SOURCE, "headers": []}
        headers_list.append(target_block)
    existing_keys = {h["key"] for h in target_block.get("headers", [])}
    added: list[str] = []
    for key, value in canon_headers.items():
        if key not in existing_keys:
            target_block.setdefault("headers", []).append({"key": key, "value": value})
            added.append(key)
    new["headers"] = headers_list
    return new, added


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--apply", action="store_true")
    args = ap.parse_args()
    canon = json.loads(TEMPLATE.read_text())
    targets = discover_targets()
    total_added = 0
    touched = 0
    for vj in targets:
        try:
            existing = json.loads(vj.read_text())
        except Exception as e:
            print(f"  ! {vj.relative_to(CLAWD)}: parse error {e}")
            continue
        new_cfg, added = merge_headers(existing, canon)
        total_added += len(added)
        if args.apply and added:
            vj.write_text(json.dumps(new_cfg, indent=2) + "\n")
            touched += 1
    print(f"{'APPLIED' if args.apply else 'DRY-RUN'}: scanned {len(targets)} files, {total_added} header additions, {touched} files touched")
    return 0


if __name__ == "__main__":
    sys.exit(main())
