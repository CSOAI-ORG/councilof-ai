#!/usr/bin/env python3
"""Measure the fourteen LIVE register banks the arena actually fetches, under the
arena's own loader and its own vocabulary rule. This is the "before" the candidates
are proposed against, and it is read from the published bytes, never asserted.

    python3 measurement/bank-candidates/2026-09-23/measure_live_banks.py --out <path>

No model is called. No GPU is used. Nothing is written outside --out.
"""
from __future__ import annotations

import argparse
import collections
import hashlib
import importlib.util
import json
import sys
import tempfile
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]

# The axis names the arena rotation actually plays, copied from scripts/arena/rotation.py
# AXES. These are dataset short names, not the board's axis names: the board calls these
# "safety" and "continuity" where the rotation says "agi" and "asi". The URL is built in
# lanes/loops/arena-hourly.sh as csoai/gspc-${BANK_AXIS}/resolve/main/items.jsonl, so the
# rotation name IS the dataset name and any mismatch is a bank that cannot be fetched.
ARENA_AXES = [
    "gov", "prv", "agi", "asi", "mcp", "oss", "mach",
    "care", "xr", "det", "art5", "swarm", "affect", "jail",
]
BOARD_AXIS_OF = {
    "gov": "governance", "prv": "provenance", "agi": "safety", "asi": "continuity",
    "mcp": "conformance", "oss": "openness", "mach": "machinery-conformity",
    "care": "care", "xr": "cross-reality", "det": "detector-interop",
    "art5": "art5-safeguard", "swarm": "swarm", "affect": "affect", "jail": "jail",
}


def load_module(name: str, path: Path):
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    sys.modules[name] = mod
    spec.loader.exec_module(mod)
    return mod


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--out", required=True)
    args = ap.parse_args()
    arena = load_module("_axis_arena", ROOT / "harness" / "arena" / "axis_arena.py")

    rows = []
    with tempfile.TemporaryDirectory() as td:
        for axis in ARENA_AXES:
            url = f"https://huggingface.co/datasets/csoai/gspc-{axis}/resolve/main/items.jsonl"
            rec = {"arena_axis": axis, "board_axis": BOARD_AXIS_OF[axis], "url": url}
            try:
                raw = urllib.request.urlopen(
                    urllib.request.Request(url, headers={"User-Agent": "csoai-bank-audit"}),
                    timeout=120,
                ).read()
            except Exception as e:  # noqa: BLE001
                rec["state"] = "UNREACHABLE"
                rec["error"] = str(e)[:160]
                rows.append(rec)
                print(f"{axis:8s} UNREACHABLE {str(e)[:60]}")
                continue
            rec["sha256"] = hashlib.sha256(raw).hexdigest()
            rec["bytes"] = len(raw)
            p = Path(td) / f"{axis}.jsonl"
            p.write_bytes(raw)
            loaded = arena.load_bank_file(str(p))
            items, canary = loaded[0], loaded[1]
            textless = loaded[2] if len(loaded) > 2 else 0
            labels = sorted(
                {
                    str(i.get("expected", "")).strip()
                    for i in items
                    if i.get("expected") not in (None, "", "KEYWORD_MATCH", "0", "1")
                }
            )
            dist = collections.Counter(str(i.get("expected")) for i in items)
            n = len(items)
            rec.update(
                {
                    "items_loaded": n,
                    "canary_rows": canary,
                    "textless_rows_dropped": textless,
                    "expected_distribution": dict(sorted(dist.items())),
                    "arena_label_vocabulary": labels,
                    "label_count": len(labels),
                    "majority_share": round(max(dist.values()) / n, 4) if n else None,
                }
            )
            if n == 0:
                rec["state"] = "UNPLAYABLE_NO_ITEMS"
            elif len(labels) == 0:
                rec["state"] = "NO_LABEL_VOCABULARY"
                rec["consequence"] = (
                    "the arena falls through to its generic EU-AI-Act prompt and the legacy "
                    "scorer; answers that name no bank label grade ungraded"
                )
            elif len(labels) == 1:
                rec["state"] = "SINGLE_LABEL"
                rec["consequence"] = (
                    "every answer naming the one label scores 1.0 for both models, so the "
                    "axis cannot separate however long it is played"
                )
            elif rec["majority_share"] and rec["majority_share"] > 0.90:
                rec["state"] = "IMBALANCED_OVER_90PC"
            else:
                rec["state"] = "OK"
            rows.append(rec)
            print(
                f"{axis:8s} {rec['state']:22s} items={n:4d} labels={len(labels)} "
                f"{labels if len(labels) <= 4 else str(len(labels)) + ' labels'}"
            )

    out = {
        "schema": "csoai.arena-bank-audit/0.1",
        "as_of": "2026-09-23",
        "what_this_is": (
            "The label vocabulary the arena derives from each register bank it fetches, read "
            "from the published bytes with the arena's own loader. No model was called."
        ),
        "loader": "harness/arena/axis_arena.py load_bank_file",
        "vocabulary_rule": (
            'sorted({expected}) minus {None, "", "KEYWORD_MATCH", "0", "1"} '
            "— axis_arena.py main(); a bank whose expected values are all 0/1 therefore has "
            "no vocabulary at all"
        ),
        "url_pattern": "lanes/loops/arena-hourly.sh: https://huggingface.co/datasets/csoai/gspc-${AXIS}/resolve/main/items.jsonl",
        "axis_name_note": (
            "arena_axis is the rotation name (scripts/arena/rotation.py AXES) and is what the "
            "HF URL is built from; board_axis is what GET /api/gspc calls the same axis. They "
            "differ for two: agi/safety and asi/continuity."
        ),
        "banks": rows,
        "summary": collections.Counter(r.get("state") for r in rows),
    }
    out["summary"] = dict(out["summary"])
    Path(args.out).write_text(json.dumps(out, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print("\nsummary:", out["summary"])
    print("wrote", args.out)
    return 0


if __name__ == "__main__":
    sys.exit(main())
