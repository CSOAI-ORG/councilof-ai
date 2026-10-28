#!/usr/bin/env python3
"""Build / verify the GSPC benchmark index.

The published public/interop/benchmark-index-v0.1.json had NO producer in the
repository: it was generated once by hand on 2026-09-17 and committed, so it
drifted silently as mill cards accumulated (3998 rows published vs 4980 files on
disk on 2026-10-07, a 982-row gap). This script is that missing producer, plus
the drift check that keeps it from going silent again.

Self-referential digest rule, reverse-engineered and verified byte-for-byte
against the published file (byte_size 1,066,626 and sha256 both matched):

    body     = document minus its "sha256" and "byte_size" members
    byte_size = len(json.dumps(body, sort_keys=True, separators=(",", ":"),
                               ensure_ascii=False).encode())
    sha256    = sha256(that same serialisation)

The committed file is PRETTY-PRINTED (1,362,868 bytes on disk) while the digest
covers the compact form — so never compare declared byte_size to st_size.

Usage:
  python3 scripts/build_benchmark_index.py --verify
      Validate the published index against the cards on disk. Exit 1 on drift.

  python3 scripts/build_benchmark_index.py --write PATH
      Generate a fresh index. Refuses to touch an existing file unless
      --force, because published indexes carry OpenTimestamps sidecars that
      this script must not silently invalidate.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INTEROP = ROOT / "public" / "interop"
DEFAULT_INDEX = INTEROP / "benchmark-index-v0.1.json"
SIGNED_DIR = INTEROP / "mill-cards-signed"
UNSIGNED_DIR = INTEROP / "mill-cards-unsigned"


def compact(doc: dict) -> bytes:
    return json.dumps(doc, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()


def seal(doc: dict) -> tuple[bytes, dict]:
    """Return (serialisation, doc carrying byte_size+sha256)."""
    body = {k: v for k, v in doc.items() if k not in ("sha256", "byte_size")}
    raw = compact(body)
    sealed = dict(body)
    sealed["byte_size"] = len(raw)
    sealed["sha256"] = hashlib.sha256(raw).hexdigest()
    return raw, sealed


def check_seal(doc: dict) -> tuple[bool, str]:
    if "sha256" not in doc or "byte_size" not in doc:
        return False, "missing sha256/byte_size"
    raw = compact({k: v for k, v in doc.items() if k not in ("sha256", "byte_size")})
    if len(raw) != doc["byte_size"]:
        return False, f"byte_size {doc['byte_size']} != {len(raw)}"
    digest = hashlib.sha256(raw).hexdigest()
    if digest != doc["sha256"]:
        return False, f"sha256 {doc['sha256'][:16]}… != {digest[:16]}…"
    return True, "ok"


def rows_on_disk() -> list[dict]:
    rows: list[dict] = []
    for signed, directory in ((True, SIGNED_DIR), (False, UNSIGNED_DIR)):
        for path in sorted(directory.glob("*.json")):
            try:
                card = json.loads(path.read_text(encoding="utf-8"))
            except Exception:
                continue
            body = card.get("body") if isinstance(card.get("body"), dict) else None
            if not isinstance(body, dict):
                # e.g. mill-cards-signed/GOVERNANCE-RETRIEVE.json, a pointer stub
                continue
            rows.append({
                "path": f"{directory.name}/{path.name}",
                "signed": signed,
                "axis": body.get("axis"),
                "model": body.get("model"),
                "n": body.get("n"),
                "accuracy": body.get("accuracy"),
                "status": body.get("status"),
                "sha256_id": card.get("id") or card.get("sha256"),
            })
    return rows


def build_doc(rows: list[dict], generated_at: str) -> dict:
    by_model: Counter[str] = Counter(r["model"] for r in rows if r.get("model"))
    return {
        "schema": "csoai.benchmark-index/0.1",
        "generated_at": generated_at,
        "title": "GSPC Benchmark Index — Every measurement card on the board",
        "purpose": "Single index of every GSPC axis x model measurement card. "
                   f"{len({r['axis'] for r in rows})} axes, all measured, all quotable.",
        "disclaimer": "Measurement, not certification. Each card carries its own sha256 id + "
                      "Ed25519 signature (signed) or unsigned status.",
        "totals": {
            "cards_total": len(rows),
            "signed": sum(1 for r in rows if r["signed"]),
            "unsigned": sum(1 for r in rows if not r["signed"]),
            "axes": len({r["axis"] for r in rows}),
            "models": len({r["model"] for r in rows if r.get("model")}),
        },
        "by_axis": dict(Counter(r["axis"] for r in rows).most_common()),
        "by_model_top_20": dict(by_model.most_common(20)),
        "cards": rows,
    }


def verify(index_path: Path) -> int:
    doc = json.loads(index_path.read_text(encoding="utf-8"))
    ok, why = check_seal(doc)
    print(f"seal: {'OK' if ok else 'FAIL'} — {why}")

    totals = doc.get("totals", {})
    rows = doc.get("cards", [])
    internal = {
        "cards_total": totals.get("cards_total") == len(rows),
        "signed": totals.get("signed") == sum(1 for r in rows if r.get("signed")),
        "unsigned": totals.get("unsigned") == sum(1 for r in rows if not r.get("signed")),
        "axes": totals.get("axes") == len({r.get("axis") for r in rows}),
        "models": totals.get("models") == len({r.get("model") for r in rows}),
    }
    print(f"internal totals: {'OK' if all(internal.values()) else 'FAIL'} — {internal}")

    disk = {r["path"] for r in rows_on_disk()}
    published = {r.get("path") for r in rows}
    # A published row with no card body (the GOVERNANCE-RETRIEVE pointer stub) is deliberately
    # excluded by rows_on_disk, so it lands in `published - disk` and used to be reported as
    # "gone from disk" — which is false: the file is present, it is simply not a measurement card.
    # Detect it on the placeholder model, not on an empty id: 70 genuinely unsigned rows also
    # carry an empty sha256_id, but only the stub carries model "?".
    def _is_non_card(row: dict) -> bool:
        model = str(row.get("model") or "").strip()
        return model in ("", "?", "null", "None")

    non_card_rows = [r for r in rows if _is_non_card(r)]
    non_card_paths = {r.get("path") for r in non_card_rows}
    missing = published - disk - non_card_paths
    added = disk - published
    print(f"coverage: {len(published)} published / {len(disk)} on disk")
    print(f"  published but gone from disk: {len(missing)}")
    print(f"  on disk but never published:  {len(added)}  <- drift")

    if non_card_rows:
        print(f"  non-card rows (placeholder model, excluded from disk rows): {len(non_card_rows)}")
        for r in non_card_rows[:5]:
            print(f"      {r.get('path')} (axis={r.get('axis')}, signed={r.get('signed')})")

    stale = bool(added) or bool(missing) or bool(non_card_rows) or not ok or not all(internal.values())
    print(f"\n{'DRIFT — regenerate and re-stamp' if stale else 'CLEAN'} ({index_path.name})")
    return 1 if stale else 0


def write(path: Path, force: bool, generated_at: str) -> int:
    if path.exists() and not force:
        print(f"refusing to overwrite {path} (it may carry an .ots sidecar); use --force",
              file=sys.stderr)
        return 2
    _, sealed = seal(build_doc(rows_on_disk(), generated_at))
    text = json.dumps(sealed, indent=2, ensure_ascii=True) + "\n"
    path.write_text(text, encoding="utf-8")
    print(f"wrote {path} — totals {sealed['totals']}  digest {sealed['sha256'][:16]}…")
    print("NOTE: a regenerated index is UNSTAMPED. Re-stamp and re-deploy are owner-gated.")
    return 0


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--verify", action="store_true", help="check the published index for drift")
    ap.add_argument("--index", type=Path, default=DEFAULT_INDEX)
    ap.add_argument("--write", type=Path, metavar="PATH", help="generate a fresh index at PATH")
    ap.add_argument("--force", action="store_true", help="allow overwriting PATH")
    ap.add_argument("--as-of", default=None, help="generated_at timestamp (default: now, UTC)")
    args = ap.parse_args(argv)

    if args.write:
        import datetime
        stamp = args.as_of or datetime.datetime.now(datetime.timezone.utc).strftime(
            "%Y-%m-%dT%H:%M:%S.%f+00:00")
        return write(args.write, args.force, stamp)
    if args.verify or args.index.exists():
        return verify(args.index)
    print("nothing to do: pass --verify or --write PATH", file=sys.stderr)
    return 2


if __name__ == "__main__":
    raise SystemExit(main())
