#!/usr/bin/env python3
"""Derive exact-identity, block/ledger-bound issued-supply deltas from frozen reader JSON."""
from __future__ import annotations
import argparse
from datetime import datetime, timezone
from decimal import Decimal, localcontext
import hashlib
import json
from pathlib import Path
from typing import Any

def _unique(rows: list[dict[str, Any]], key_fn, label: str) -> dict[tuple, dict[str, Any]]:
    out = {}
    for row in rows:
        key = key_fn(row)
        if key in out:
            raise ValueError(f"duplicate {label} identity: {key}")
        out[key] = row
    return out

def _amount(row: dict[str, Any], chain: str) -> Decimal:
    if chain == "ethereum":
        if row.get("state") != "MEASURED":
            raise ValueError("Ethereum row is not MEASURED")
        raw, decimals = row.get("total_supply_raw"), row.get("decimals")
        if raw is None or decimals is None or int(decimals) < 0:
            raise ValueError("Ethereum exact raw supply/decimals required")
        return Decimal(str(raw)) / (Decimal(10) ** int(decimals))
    if row.get("supply_state") != "MEASURED" or row.get("supply") is None:
        raise ValueError("XRPL row is not MEASURED")
    return Decimal(str(row["supply"]))

def derive_pair(chain: str, prior: dict[str, Any], current: dict[str, Any]) -> dict[str, Any]:
    if chain == "ethereum":
        key_fn = lambda r: (r.get("symbol"), str(r.get("address", "")).lower())
        identity_fn = lambda r: {"symbol": r["symbol"], "contract": r["address"], "decimals": int(r["decimals"])}
        ledger_fn = lambda r: (r.get("block") or {}).get("number")
    elif chain == "xrpl":
        key_fn = lambda r: (r.get("symbol"), r.get("issuer_address"))
        identity_fn = lambda r: {"symbol": r["symbol"], "issuer_address": r["issuer_address"], "currency_code": r.get("currency_code_matched")}
        ledger_fn = lambda r: r.get("ledger_index")
    else:
        raise ValueError(f"unsupported chain: {chain}")
    old_rows = prior.get("rows")
    new_rows = current.get("rows")
    if not isinstance(old_rows, list) or not isinstance(new_rows, list):
        raise ValueError(f"{chain} inputs must contain rows[]")
    old = _unique(old_rows, key_fn, f"{chain} prior")
    new = _unique(new_rows, key_fn, f"{chain} current")
    result = []
    for key, now in new.items():
        before = old.get(key)
        if before is None:
            raise ValueError(f"{chain} current identity missing in prior: {key}")
        a, b = _amount(before, chain), _amount(now, chain)
        change = b - a
        with localcontext() as ctx:
            ctx.prec = 50
            pct = (change / a * Decimal(100)) if a else None
        result.append({
            "identity": identity_fn(now),
            "old_value": str(a),
            "new_value": str(b),
            "delta": str(change),
            "delta_percent": str(pct.quantize(Decimal("0.0001"))) if pct is not None else None,
            "old_ledger": ledger_fn(before),
            "new_ledger": ledger_fn(now),
        })
    return {"rows": result, "prior_rows_without_current_match": sorted(set(old) - set(new))}

def _load(path: Path) -> dict[str, Any]:
    return json.loads(path.read_text(encoding="utf-8"))

def _source(path: Path, doc: dict[str, Any]) -> dict[str, Any]:
    return {"path": str(path), "sha256": hashlib.sha256(path.read_bytes()).hexdigest(),
            "as_of": doc.get("as_of") or doc.get("generated_at")}

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("--ethereum-prior", type=Path, required=True)
    ap.add_argument("--ethereum-current", type=Path, required=True)
    ap.add_argument("--xrpl-prior", type=Path, required=True)
    ap.add_argument("--xrpl-current", type=Path, required=True)
    ap.add_argument("--out", type=Path, required=True, help="new output path; existing files are never overwritten")
    args = ap.parse_args(argv)
    inputs = {
        "ethereum_prior": args.ethereum_prior, "ethereum_current": args.ethereum_current,
        "xrpl_prior": args.xrpl_prior, "xrpl_current": args.xrpl_current,
    }
    docs = {name: _load(path) for name, path in inputs.items()}
    eth = derive_pair("ethereum", docs["ethereum_prior"], docs["ethereum_current"])
    xrp = derive_pair("xrpl", docs["xrpl_prior"], docs["xrpl_current"])
    out = {
        "schema": "csoai.onchain-issued-supply-delta/0.1",
        "generated_at_utc": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "state": "INTERNAL_SIGNAL_CANDIDATE_NOT_ADMITTED",
        "method": "exact asset identity match across block/ledger-bound issued-supply snapshots",
        "not_claimed": ["not reserves/backing", "not transaction-level mint/burn attribution", "not revenue", "not a grade"],
        "sources": {name: _source(path, docs[name]) for name, path in inputs.items()},
        "counts": {"ethereum_exact_matches": len(eth["rows"]), "xrpl_exact_matches": len(xrp["rows"])},
        "prior_rows_without_current_match": {"ethereum": eth["prior_rows_without_current_match"], "xrpl": xrp["prior_rows_without_current_match"]},
        "ethereum": eth["rows"], "xrpl": xrp["rows"],
    }
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("x", encoding="utf-8") as f:
        json.dump(out, f, sort_keys=True, indent=2, ensure_ascii=False)
        f.write("\n")
    print(f"derived {len(eth['rows'])} Ethereum + {len(xrp['rows'])} XRPL exact-identity deltas -> {args.out}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
