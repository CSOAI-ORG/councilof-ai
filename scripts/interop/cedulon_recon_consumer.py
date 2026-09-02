#!/usr/bin/env python3
"""cedulon-recon harness consumer — bank/* → unsigned cedulon.recon card-v0.

Reads public/interop/cedulon-recon/bank/* and emits an unsigned card
(sig_ed25519 null). No keys. Never wrangler. Never certify. Not a TS.
Never edits /api/gspc.

Harness (M4): ~/.grokbot/harness/run.sh measure may invoke this script;
see public/interop/cedulon-recon/HARNESS.md.
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import datetime, timezone
from pathlib import Path

_HERE = Path(__file__).resolve().parent
if str(_HERE) not in sys.path:
    sys.path.insert(0, str(_HERE))
from _card_canon import unsigned_card, write_card  # noqa: E402


def repo_root() -> Path:
    return Path(__file__).resolve().parents[2]


def load_bank(bank: Path) -> tuple[dict, dict, list[dict]]:
    counts = json.loads((bank / "class-counts-expected.json").read_text(encoding="utf-8"))
    pin = json.loads((bank / "probe-pin.json").read_text(encoding="utf-8"))
    rows = []
    with (bank / "conservation-fixtures.jsonl").open(encoding="utf-8") as fh:
        for line in fh:
            line = line.strip()
            if line:
                rows.append(json.loads(line))
    return counts, pin, rows


def conservation_summary(rows: list[dict]) -> list[dict]:
    out = []
    for r in rows:
        item = {"id": r["id"]}
        if "expected_instruction_disposition" in r:
            item["expected"] = r.get("expected_instruction_disposition")
            item["observed"] = r.get("observed_disposition")
            if r.get("expected_orphan_records"):
                item["orphan_records"] = r["expected_orphan_records"]
        if r.get("expected_exclusion_reported") is not None:
            item["exclusion_reported"] = r["expected_exclusion_reported"]
        if r.get("gap"):
            item["gap"] = r["gap"]
        out.append(item)
    return out


def build_card(counts: dict, pin: dict, rows: list[dict], as_of: str) -> dict:
    class_counts = counts["class_counts"]
    payload = {
        "profile": counts.get("profile") or pin.get("profile") or "abak-00-population",
        "package_pin": counts.get("package_pin") or (pin.get("npm") or ["?"])[0],
        "probe_sha256": counts.get("probe_sha256") or pin.get("sha256"),
        "class_counts": class_counts,
        "class_counts_total": sum(class_counts.values()),
        "conservation_row_count": len(rows),
        "conservation_rows": conservation_summary(rows),
        "bank_paths": [
            "public/interop/cedulon-recon/bank/class-counts-expected.json",
            "public/interop/cedulon-recon/bank/conservation-fixtures.jsonl",
            "public/interop/cedulon-recon/bank/probe-pin.json",
        ],
        "pin_rerun": {
            "as_of": (pin.get("pin_rerun") or {}).get("as_of") or as_of,
            "status": (pin.get("pin_rerun") or {}).get("status") or "unknown",
        },
        "board_axis_fill": False,
        "status": "UNSIGNED_BANK_FIXTURE",
    }
    sources = list(pin.get("source_urls") or [])
    if not sources:
        sources = ["https://github.com/dogrucanemek-alt/cedulon"]
    return unsigned_card(
        surface="cedulon.recon",
        subject="cedulon:abak-00-population-probe#bank-consumer",
        as_of=as_of,
        source_urls=sources,
        payload=payload,
        unmeasured=[
            "n>=30_windows",
            "4way_vs_parents",
            "keystone_signature",
            "x402_facilitator_receipt",
            "gspc_axis_projection_forbidden",
            "MEASURED_forbidden_here",
        ],
        tags=["scitt-eat", "cedulon", "abak-00", "unsigned", "harness-consumer"],
    )


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument(
        "--repo-root",
        type=Path,
        default=None,
        help="Repo root (default: inferred from script path)",
    )
    ap.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Output card path (default: public/interop/cedulon-recon/card-unsigned.consumer.json)",
    )
    ap.add_argument("--stdout", action="store_true", help="Print card JSON to stdout")
    args = ap.parse_args()
    root = args.repo_root or repo_root()
    bank = root / "public" / "interop" / "cedulon-recon" / "bank"
    if not bank.is_dir():
        raise SystemExit(f"bank missing: {bank}")
    as_of = datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")
    counts, pin, rows = load_bank(bank)
    card = build_card(counts, pin, rows, as_of)
    assert card["sig_ed25519"] is None
    out = args.out or (root / "public" / "interop" / "cedulon-recon" / "card-unsigned.consumer.json")
    if args.stdout:
        print(json.dumps(card, indent=2, ensure_ascii=False))
    else:
        write_card(out, card)
        print(f"wrote {out} sha256={card['sha256']} sig_ed25519=null", file=sys.stderr)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
