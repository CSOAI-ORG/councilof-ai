#!/usr/bin/env python3
"""
apply_security_headers.py — merge canonical security headers into hive vercel.json files.

Default mode: --dry-run (report only). Use --apply to actually write.

Strategy:
- For each ~/clawd/*-deploy/vercel.json AND ~/clawd/*-site/vercel.json
- Load existing config, find the headers block whose source matches "/(.*)"
  (or create one if absent), then merge our canonical header keys in
  (existing values override — we never clobber a hive's existing CSP).
- CSP is added as Content-Security-Policy-Report-Only so we never break a
  live page; tighten to enforcement after Vercel violation reports confirm.

Coord note: this is JEEVES/substrate-lane work. Does NOT trigger any deploy.
The parallel deploy lane runs `vercel deploy --prod` from each dir when ready.

Run:
  python3 _tooling/apply_security_headers.py            # dry-run
  python3 _tooling/apply_security_headers.py --apply    # write to disk
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

CLAWD = Path.home() / "clawd"
TEMPLATE = CLAWD / "_tooling" / "security_headers.json"
CANON_SOURCE = "/(.*)"
SKIP_DIRS = {"node_modules", ".next", ".vercel", "dist", "build"}


def load_template() -> dict:
    return json.loads(TEMPLATE.read_text())


def discover_targets() -> list[Path]:
    targets: list[Path] = []
    for pattern in ("*-deploy", "*-site"):
        for d in CLAWD.glob(pattern):
            if not d.is_dir() or d.name in SKIP_DIRS:
                continue
            vj = d / "vercel.json"
            if vj.exists():
                targets.append(vj)
    return sorted(targets)


def merge_headers(existing: dict, canon: dict) -> tuple[dict, list[str]]:
    """Returns (new_config, list_of_header_keys_added). Never clobbers."""
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
    ap.add_argument("--apply", action="store_true", help="Write changes (default: dry-run)")
    ap.add_argument("--json", action="store_true", help="Emit JSON report")
    args = ap.parse_args()

    canon = load_template()
    targets = discover_targets()
    report: list[dict] = []
    total_added = 0

    for vj in targets:
        try:
            existing = json.loads(vj.read_text())
        except Exception as e:
            report.append({"path": str(vj), "error": f"parse: {e}"})
            continue

        new_cfg, added = merge_headers(existing, canon)
        report.append(
            {
                "path": str(vj.relative_to(CLAWD)),
                "added": added,
                "already_present": [
                    h["key"]
                    for b in existing.get("headers", [])
                    if b.get("source") == CANON_SOURCE
                    for h in b.get("headers", [])
                ],
            }
        )
        total_added += len(added)

        if args.apply and added:
            vj.write_text(json.dumps(new_cfg, indent=2) + "\n")

    if args.json:
        print(json.dumps({"targets": len(targets), "total_headers_added": total_added, "applied": args.apply, "report": report}, indent=2))
    else:
        print(f"# Security-headers merge — {'APPLIED' if args.apply else 'DRY-RUN'}")
        print(f"# Targets scanned: {len(targets)}")
        print(f"# Total header additions: {total_added}")
        print()
        for entry in report:
            if "error" in entry:
                print(f"  ! {entry['path']}: {entry['error']}")
                continue
            added = entry["added"]
            if added:
                print(f"  + {entry['path']}: would add {len(added)} → {', '.join(added)}")
            else:
                print(f"  = {entry['path']}: no changes (already has canonical set)")
        print()
        print("Re-run with --apply to write. Deploy is parallel-session's lane.")

    return 0


if __name__ == "__main__":
    sys.exit(main())
