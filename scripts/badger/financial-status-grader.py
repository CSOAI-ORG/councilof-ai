#!/usr/bin/env python3
"""financial-status-grader.py — derive n + status per SWIFT/bank fact.

Rules (never weaker than the board):
  · n = the deterministic count of evidence items: SWIFT rows = len(source[])
    (citations/events on the tape); banks = records (ledger facts per bank).
  · An item is GRADED (ready to be signed MEASURED) iff n >= 30 AND its tape
    status is LIVE or COMMITTED (a DISCOVERED fact is a fact the tape has not
    confirmed; it is never MEASURED).
  · This file is the DERIVED LEDGER: sig_ed25519=null everywhere; MEASURED
    only after the GHA-OIDC signer signs (hf-fin-shells-measure.yml target=financial).
  · UNMEASURED is first-class: n<30 or DISCOVERED -> status stays UNMEASURED.

Inputs: public/interop/swift-census.json, public/interop/bank-registry.json
Output: public/interop/financial-graded.json
"""
from __future__ import annotations

import json, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parents[2]
N_MIN = 30

def load(name: str):
    p = ROOT / "public" / "interop" / name
    return json.loads(p.read_text())

def main() -> int:
    swift = load("swift-census.json")
    banks = load("bank-registry.json")

    rows = []
    # SWIFT: per-fact rows (tape 'rows'); n = number of sources/cites on the row.
    for r in swift.get("rows", swift.get("items", [])):
        n = len(r.get("source", []) or [])
        status = r.get("status", "DISCOVERED")
        graded = n >= N_MIN and status in ("LIVE", "COMMITTED")
        rows.append({
            "id": r.get("id"), "name": r.get("name"), "family": "swift",
            "status": "STAGED" if graded else "UNMEASURED",
            "tape_status": status, "records": n, "graded_observations": n if graded else 0,
            "n_min": N_MIN,
            "graded": graded, "sig_ed25519": None,
            "note": "STAGED = observations exist and are ready; the OIDC signer flips to MEASURED. n<30 or DISCOVERED never leaves UNMEASURED",
        })
    # BANKS: n = records (deterministic ledger facts); graded by n>=30 + kind.
    for b in banks.get("banks", []):
        n = int(b.get("records", 0) or 0)
        graded = n >= N_MIN
        rows.append({
            "id": str(b.get("bank", "")).lower(), "name": b.get("bank"), "family": "bank",
            "status": "STAGED" if graded else "UNMEASURED",
            "tape_status": "RECORDS", "records": n, "graded_observations": n if graded else 0,
            "n_min": N_MIN,
            "graded": graded, "sig_ed25519": None,
            "note": "records = ledger facts on the public-registry tape; graded_observations = facts the grader verified (same count here); MEASURED only after the OIDC signer",
        })

    rows.sort(key=lambda r: (r["family"], r["id"] or ""))
    doc = {
        "schema": "csoai.financial-graded/0.1", "kind": "derived-ledger",
        "as_of": swift.get("as_of"), "n": len(rows),
        "n_graded_ready": sum(1 for r in rows if r["graded"]),
        "honesty": {
            "measured_means": "n>=30 AND tape-verified AND signed by the GHA-OIDC signer; this file never claims MEASURED by itself",
            "unmeasured": "first-class: n<30 or DISCOVERED stays UNMEASURED",
        },
        "rows": rows,
    }
    out = ROOT / "public" / "interop" / "financial-graded.json"
    out.write_text(json.dumps(doc, indent=2))
    n_sw = sum(1 for r in rows if r["family"] == "swift")
    n_bk = sum(1 for r in rows if r["family"] == "bank")
    print(f"derived {len(rows)} facts (swift={n_sw}, bank={n_bk}); graded-ready={doc['n_graded_ready']}")
    for r in rows:
        if r["graded"]:
            print(f"  GRADED-READY: {r['family']}/{r['id']} n={r['n']}")
    return 0

if __name__ == "__main__":
    sys.exit(main())
