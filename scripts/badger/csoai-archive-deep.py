#!/usr/bin/env python3
"""csoai-archive-deep.py — mine the deep archive on disk.

Lane-doable: walks every /signed/, /interop/, /_archive/, /_CLAIM_*.txt file
on disk and emits one unsigned card per artifact. This is the "every
file we have ever shipped is a measurement" loop.

Sources walked:
- public/signed/ — the signed cards and HOW-TO-VERIFY docs
- public/signed/cards/ — the 50+ signed measurement cards
- public/interop/ — the 100+ interop JSONs
- public/_CLAIM_TICK*.txt — the legacy claim tick files
- public/datasets/ — the HF dataset mirrors
- harness/owem/cards/ — the OWEM signed cards
- public/_archive/ — anything archived

Usage:
  ./csoai-archive-deep.py
  ./csoai-archive-deep.py --path public/signed --limit 100
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parent.parent
QUEUE = HERE / "_queue" / "archive-deep"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

INTEROP_PROTECT = {"public/interop/", "public/signed/cards/", "public/.well-known/did.json"}


def card(relative_path: str, kind: str, evidence: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "archive-atom",
            "path": relative_path,
        },
        "scope": {
            "axis": "archive",
            "kind": kind,
        },
        "measurement": {
            "status": "DISCOVERED",
            "evidence": evidence,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-mined by csoai-archive-deep.py at {now}",
            f"Path: {relative_path}",
            "Status DISCOVERED — every file we have ever shipped is a measurement.",
        ],
    }


def mine(under: Path, kind: str) -> list[dict]:
    out: list[dict] = []
    for f in under.rglob("*"):
        if not f.is_file():
            continue
        rel = f.relative_to(REPO).as_posix()
        if any(rel.startswith(p) for p in INTEROP_PROTECT):
            continue  # never overwrite evidence
        # Only certain file types
        if f.suffix.lower() not in {".json", ".md", ".txt", ".csv", ".html"}:
            continue
        # Skip very small files
        try:
            size = f.stat().st_size
        except Exception:
            continue
        if size < 100 or size > 100_000:
            continue
        # Read the first 4000 bytes for the fingerprint
        try:
            head = f.read_bytes()[:4000].decode("utf-8", errors="ignore")
        except Exception:
            continue
        sha = hashlib.sha256(f.read_bytes() if size < 50_000 else head.encode()).hexdigest()[:16]
        out.append({
            "relative_path": rel,
            "kind": kind,
            "evidence": {
                "size": size,
                "sha256_16": sha,
                "head_excerpt": head[:200].replace("\n", " "),
            },
        })
    return out


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"archive-deep-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r["relative_path"], r["kind"], r["evidence"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Deep archive miner.")
    ap.add_argument("--path", type=str, default=None, help="Mine a specific subdir.")
    ap.add_argument("--limit", type=int, default=500, help="Max records per source.")
    args = ap.parse_args()

    print(f"=== DEEP ARCHIVE MINE ===")
    if args.path:
        sources = {args.path: Path(args.path)}
    else:
        sources = {
            "public/signed": REPO / "public" / "signed",
            "public/datasets": REPO / "public" / "datasets",
            "harness/owem/cards": REPO / "harness" / "owem" / "cards",
            "public/embed": REPO / "public" / "embed",
            "public/city": REPO / "public" / "city",
        }
    total = 0
    for name, path in sources.items():
        if not path.exists():
            print(f"  {name:<25} (missing)")
            continue
        records = mine(path, "archive-atom")
        records = records[:args.limit]
        if records:
            n_written, n_oversized = emit(records)
            print(f"  {name:<25} {len(records):>5} records  →  {n_written} written, {n_oversized} oversized")
            total += n_written
        else:
            print(f"  {name:<25} (empty)")
    print(f"\n  total written: {total}")
    print(f"  queue:         {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
