#!/usr/bin/env python3
"""harvest-per-issuer-cards.py — per-issuer × per-axis signed cards.

Lane-doable: reads /api/xrpl + /api/swift, emits one unsigned ≤3KB card
per (issuer, deterministic-fact-axis) pair. Staged under scripts/badger/
_queue/per-issuer/ for the mill to sign + upload.

Why: an XRPL issuer can pin "RLUSD passed reserve-attestation on 2026-09-03"
as a signed evidence card — value for insurers, auditors, RWA wrappers.

Usage:
  ./harvest-per-issuer-cards.py            # all
  ./harvest-per-issuer-cards.py --chain xrpl
  ./harvest-per-issuer-cards.py --chain swift
  ./harvest-per-issuer-cards.py --dry-run
"""
from __future__ import annotations

import argparse
import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

HERE = Path(__file__).resolve().parent
QUEUE = HERE / "_queue" / "per-issuer"
DID = "did:web:csoai.org#card-attestation-1"
SCHEMA = "csoai.gspc-axes/0.5"
MAX_PAYLOAD = 3072

DETERMINISTIC_AXES = [
    "provenance-controls",
    "reserve-attestation",
    "regulatory-framework",
    "distribution-integrity",
    "custody-disclosure",
]


def curl_json(url: str) -> object:
    try:
        r = subprocess.run(
            ["curl", "-L", "-s", "-H", "Accept: application/json",
             "-w", "\n%{http_code}", "--max-time", "30", url],
            capture_output=True, text=True, timeout=35,
        )
        out = r.stdout
        if "\n" in out:
            body, code = out.rsplit("\n", 1)
            try:
                if int(code) != 200:
                    return None
            except ValueError:
                return None
            try:
                return json.loads(body)
            except Exception:
                return None
        return None
    except Exception:
        return None


def card(chain: str, issuer_id: str, axis: str, evidence: dict) -> dict:
    now = datetime.now(timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")
    return {
        "schema": SCHEMA,
        "kind": "gspc.measurement-card",
        "version": 1,
        "issuer": DID,
        "as_of": now,
        "subject": {
            "kind": "issuer",
            "chain": chain,
            "issuer_id": issuer_id,
            "name": evidence.get("name") or evidence.get("bank") or issuer_id,
        },
        "scope": {
            "axis": axis,
            "family": "financial",
            "kind": "deterministic-facts",
        },
        "measurement": {
            "status": evidence.get("status", "DISCOVERED"),
            "n": evidence.get("n"),
            "evidence": evidence,
        },
        "links": {
            "live_board": "https://councilof.ai/api/gspc",
            "verify": "https://councilof.ai/gspc-verify",
        },
        "notes": [
            f"Auto-derived by harvest-per-issuer-cards.py at {now}",
            f"Chain: {chain}. Axis: {axis}. Issuer: {issuer_id}.",
            "Status is what the chain says, not MEASURED unless a real run produced it.",
            "Measurement, not certification. Verify free.",
        ],
    }


def harvest_xrpl() -> list[dict]:
    xrpl = curl_json("https://councilof.ai/api/xrpl")
    if not xrpl or not isinstance(xrpl, dict):
        return []
    assets = xrpl.get("assets", [])
    out = []
    for asset in assets:
        issuer = asset.get("issuer") or asset.get("r_address") or "unknown"
        symbol = asset.get("symbol") or asset.get("currency") or "?"
        for axis in DETERMINISTIC_AXES:
            out.append({
                "chain": "xrpl",
                "issuer_id": issuer,
                "axis": axis,
                "evidence": {
                    "name": symbol,
                    "status": asset.get("control_facts", "UNMEASURED"),
                    "verified_via": asset.get("verified_via"),
                    "sig_ed25519": asset.get("sig_ed25519"),
                    "n": 1,  # 1 issuer × 1 axis
                },
            })
    return out


def harvest_swift() -> list[dict]:
    swift = curl_json("https://councilof.ai/api/swift")
    if not swift or not isinstance(swift, dict):
        return []
    banks = swift.get("rows", [])
    out = []
    for bank in banks:
        name = bank.get("bank") or bank.get("name") or "unknown"
        for axis in DETERMINISTIC_AXES:
            out.append({
                "chain": "swift",
                "issuer_id": name,
                "axis": axis,
                "evidence": {
                    "name": name,
                    "status": bank.get("status", "DISCOVERED"),
                    "press_url": bank.get("press_url"),
                    "as_of": bank.get("as_of"),
                    "n": 1,
                },
            })
    return out


def emit(records: list[dict]) -> tuple[int, int]:
    QUEUE.mkdir(parents=True, exist_ok=True)
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%SZ")
    path = QUEUE / f"per-issuer-{stamp}.jsonl"
    n_written = 0
    n_oversized = 0
    with open(path, "w") as f:
        for r in records:
            body = card(r["chain"], r["issuer_id"], r["axis"], r["evidence"])
            blob = json.dumps(body, separators=(",", ":"))
            if len(blob) > MAX_PAYLOAD:
                n_oversized += 1
                continue
            f.write(blob + "\n")
            n_written += 1
    return n_written, n_oversized


def main():
    ap = argparse.ArgumentParser(description="Per-issuer × per-axis cards.")
    ap.add_argument("--chain", choices=["xrpl", "swift", "all"], default="all")
    ap.add_argument("--dry-run", action="store_true")
    args = ap.parse_args()

    print(f"=== PER-ISSUER × PER-AXIS HARVEST ===")
    print(f"  chain: {args.chain}  dry-run: {args.dry_run}")
    print()

    recs = []
    if args.chain in ("xrpl", "all"):
        xrpl_recs = harvest_xrpl()
        print(f"  xrpl: {len(xrpl_recs)} issuer×axis pairs")
        recs.extend(xrpl_recs)
    if args.chain in ("swift", "all"):
        swift_recs = harvest_swift()
        print(f"  swift: {len(swift_recs)} bank×axis pairs")
        recs.extend(swift_recs)

    print(f"  total: {len(recs)} records")
    print()

    if args.dry_run:
        print("(dry-run) no cards written.")
        return 0

    n_written, n_oversized = emit(recs)
    print(f"  written:   {n_written}")
    print(f"  oversized: {n_oversized}")
    print(f"  queue:     {QUEUE}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
