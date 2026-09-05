#!/usr/bin/env python3
"""harvest-per-item-cards.py — per-item × per-model signed cards.

Lane-doable: reads the per-item data we already have on disk, emits one
unsigned ≤3KB card per (item, model) pair.

For the jail axis alone: 71 items × 7 models = 497 atoms. The full estate
could emit 15,580+ per-item cards if all per-item data is on disk.

Usage:
  ./harvest-per-item-cards.py             # all on-disk per-item data
  ./harvest-per-item-cards.py --axis jail
  ./harvest-per-item-cards.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "per-item"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

INTEROP_DIR = Path(__file__).resolve().parent.parent.parent / "public" / "interop"


def card(axis: str, model: str, item_id: str, kind: str, detected, n: int, grade: str) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "model",
            "slug": model,
            "hub": "local-ollama",
        },
        "scope": {
            "axis": axis,
            "item_id": item_id,
            "kind": kind,
        },
        "measurement": {
            "status": "MEASURED" if detected is not None else "UNCHECKABLE",
            "n": n,
            "grade": grade,
            "detected": detected,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-derived by harvest-per-item-cards.py at {now}",
            f"Item {item_id} ({kind}) · model {model} · grade {grade}",
            "Per-item audit trail. Measurement, not certification.",
        ],
    }


def harvest_jail() -> list[dict]:
    """Read public/interop/jail-peritem-v3.json and emit per-(item, model) cards."""
    src = INTEROP_DIR / "jail-peritem-v3.json"
    if not src.exists():
        return []
    doc = json.loads(src.read_text())
    models = doc.get("models", {})
    n = doc.get("n", 71)
    out = []
    for model_id, m in models.items():
        usable = m.get("usable", 0)
        tp = m.get("tp", 0)
        fp = m.get("fp", 0)
        fn = m.get("fn", 0)
        tn = m.get("tn", 0)
        # Honest grade: TPR / (TPR + FNR) — but we keep the raw counts
        grade = f"TP={tp} FP={fp} FN={fn} TN={tn}"
        for row in m.get("rows", []):
            out.append({
                "axis": "jail",
                "model": model_id,
                "item_id": row.get("id", "?"),
                "kind": row.get("kind", "?"),
                "detected": row.get("detected"),
                "n": n,
                "grade": grade,
            })
    return out


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"per-item-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r["axis"], r["model"], r["item_id"], r["kind"],
                        r["detected"], r["n"], r["grade"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Per-item × per-model harvester.")
    ap.add_argument("--axis", default="jail", help="Which axis to harvest.")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"=== PER-ITEM × PER-MODEL HARVEST ===")
    print(f"  axis: {args.axis}  dry-run: {args.dry_run}")
    print()

    if args.axis == "jail":
        recs = harvest_jail()
    else:
        print(f"  axis {args.axis} not yet wired (jail only)")
        recs = []

    # Group by (item, model) — keep unique pairs
    seen = set()
    uniq = []
    for r in recs:
        k = (r["axis"], r["model"], r["item_id"])
        if k in seen:
            continue
        seen.add(k)
        uniq.append(r)
    print(f"  records: {len(uniq)} unique (item, model) pairs")
    if uniq[:3]:
        print(f"  sample: {uniq[:3]}")
    print()

    if args.dry_run:
        print("(dry-run) no cards written.")
        return 0

    n_written, n_oversized = emit(uniq)
    print(f"  written:   {n_written}")
    print(f"  oversized: {n_oversized}")
    print(f"  queue:     {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
