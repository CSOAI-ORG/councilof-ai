#!/usr/bin/env python3
"""Emit a QUEUED eval-delta card when a watched frozen bank / grader changes (J32).

The delta SHAPE is real and always emitted; the delta NUMBER is UNCHECKABLE unless a full
model re-run supplied before/after accuracy. In CI we do not run a GPU model, so the number
is honestly UNCHECKABLE — the card records that a watched input changed and pins the new bank
hash, which is the auditable fact. The card is QUEUED (sig_ed25519=null); GHA signs it.

Usage:
  python3 packages/eval-ci/emit_delta.py --axis gspc-axis \
      [--prev-bank-sha256 <64hex>] [--before <acc> --after <acc>] [--write]
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
LOCK = Path(__file__).resolve().parent / "bank.lock.json"
OUT = ROOT / "public" / "interop" / "cards" / "eval-ci"
AS_OF = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def canonical(obj: object) -> bytes:
    return json.dumps(obj, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode("utf-8")


def build(axis: str, prev_sha: str | None, before: float | None, after: float | None) -> dict:
    lock = json.loads(LOCK.read_text())
    row = next((b for b in lock["banks"] if b["axis"] == axis), None)
    if not row:
        raise SystemExit(f"axis {axis!r} not pinned in bank.lock.json")
    unmeasured = []
    if before is None or after is None:
        delta = "UNCHECKABLE"
        unmeasured.append("delta_accuracy (no model run in CI; shape emitted, number not measured)")
    else:
        delta = round(after - before, 6)
    payload = {
        "axis": axis,
        "bank_sha256": row["sha256"],
        "prev_bank_sha256": prev_sha or "UNCHECKABLE",
        "before_accuracy": before if before is not None else "UNCHECKABLE",
        "after_accuracy": after if after is not None else "UNCHECKABLE",
        "delta_accuracy": delta,
        "trigger": "watched frozen bank / grader changed (eval-ci)",
        "unmeasured": unmeasured,
    }
    card = {
        "schema": "https://councilof.ai/schema/card-v0.json",
        "surface": "eval.delta",
        "subject": f"eval-delta / {axis}",
        "as_of": AS_OF,
        "source_urls": [f"https://councilof.ai/{row['path'].removeprefix('public/')}"],
        "payload": payload,
        "sha256": hashlib.sha256(canonical(payload)).hexdigest(),
        "sig_ed25519": None,
        "unmeasured": unmeasured,
        "signing": "QUEUED for GHA under did:web:csoai.org#card-attestation-1. NO_LAPTOP_SIGN.",
    }
    return card


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--axis", default="gspc-axis")
    ap.add_argument("--prev-bank-sha256", default=None)
    ap.add_argument("--before", type=float, default=None)
    ap.add_argument("--after", type=float, default=None)
    ap.add_argument("--write", action="store_true")
    args = ap.parse_args()
    card = build(args.axis, args.prev_bank_sha256, args.before, args.after)
    raw = json.dumps(card, indent=1, ensure_ascii=False) + "\n"
    if len(raw.encode()) > 3072:
        raise SystemExit("HALT eval-delta card > 3KB")
    if args.write:
        OUT.mkdir(parents=True, exist_ok=True)
        (OUT / f"eval-delta-{args.axis}.json").write_text(raw)
        print(f"wrote {(OUT / f'eval-delta-{args.axis}.json').relative_to(ROOT)} sha={card['sha256'][:16]}")
    else:
        sys.stdout.write(raw)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
