#!/usr/bin/env python3
"""Reconcile read-only chain measurements to a frozen asset catalogue.

Symbol+chain is only a candidate join: catalogue rows lack contract/issuer IDs.
This emits an internal candidate and never changes catalogue, GSPC, signing,
anchoring, publication, payment, or transaction-authority state.
"""
from __future__ import annotations
import argparse
import hashlib
import json
from pathlib import Path
from typing import Any

def load(path: Path) -> Any:
    return json.loads(path.read_text())

def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()

def norm(value: Any) -> str:
    return str(value or "").strip().casefold()

def catalogue_candidates(assets: list[dict], symbol: str, chain: str) -> list[dict]:
    aliases = {"ethereum": {"ethereum"}, "xrpl": {"xrpl", "xrp ledger"}}
    accepted = aliases[chain]
    return [{"id": row.get("id"), "symbol": row.get("symbol")}
            for row in assets if norm(row.get("symbol")) == norm(symbol)
            and any(norm(c) in accepted for c in row.get("chains", []))]

def reconcile(index_path: Path, eth_path: Path, eth_ind_path: Path,
              xrpl_path: Path, xrpl_ind_path: Path) -> dict:
    inputs = {"catalogue": index_path, "ethereum_primary": eth_path,
              "ethereum_independent": eth_ind_path, "xrpl_primary": xrpl_path,
              "xrpl_independent": xrpl_ind_path}
    docs = {name: load(path) for name, path in inputs.items()}
    assets = docs["catalogue"].get("assets", [])
    if len(assets) != docs["catalogue"].get("asset_count"):
        raise ValueError("CATALOGUE_COUNT_MISMATCH")
    if len({str(a.get("id")) for a in assets}) != len(assets):
        raise ValueError("DUPLICATE_CATALOGUE_ID")
    observations = []
    e, ei = docs["ethereum_primary"], docs["ethereum_independent"]
    e_rows = e.get("rows", [])
    if (not ei.get("all_7_match") or e.get("n") != len(e_rows)
            or e.get("n_measured") != len(e_rows)
            or any(r.get("state") != "MEASURED" for r in e_rows)):
        raise ValueError("ETHEREUM_PRIMARY_OR_INDEPENDENT_GATE_FAILED")
    if (not e_rows or any(r.get("block", {}).get("hash") != ei.get("block_hash")
            for r in e_rows)):
        raise ValueError("ETHEREUM_BLOCK_HASH_MISMATCH")
    ei_rows = {norm(r.get("symbol")): r for r in ei.get("rows", [])}
    if len(ei_rows) != len(ei.get("rows", [])) or set(ei_rows) != {norm(r.get("symbol")) for r in e["rows"]}:
        raise ValueError("ETHEREUM_IDENTITY_SET_MISMATCH")
    for row in e["rows"]:
        check = ei_rows[norm(row["symbol"])]
        if not check.get("decimals_match") or not check.get("total_supply_raw_match"):
            raise ValueError("ETHEREUM_INDEPENDENT_VALUE_MISMATCH")
        observations.append({
            "network": "ethereum", "identity": {"symbol": row["symbol"],
                "contract": row["address"].lower(), "block_hash": row["block"]["hash"]},
            "supply_raw": str(row["total_supply_raw"]), "decimals": row["decimals"],
            "measurement_state": "MEASURED_INDEPENDENTLY_READ_BACK",
            "catalogue_join": "SYMBOL_CHAIN_CANDIDATE_ONLY",
            "catalogue_candidates": catalogue_candidates(assets, row["symbol"], "ethereum"),
            "admission_state": "NOT_ADMITTED", "signature_state": "UNSIGNED",
            "anchor_state": "UNANCHORED"})
    x, xi = docs["xrpl_primary"], docs["xrpl_independent"]
    x_rows = x.get("rows", [])
    if (not xi.get("all_16_exact_matches") or x.get("n") != len(x_rows)
            or x.get("n_measured") != len(x_rows)
            or any(r.get("supply_state") != "MEASURED" for r in x_rows)):
        raise ValueError("XRPL_PRIMARY_OR_INDEPENDENT_GATE_FAILED")
    xi_rows = {(norm(r.get("symbol")), r.get("issuer_address")): r
               for r in xi.get("rows", [])}
    if len(xi_rows) != len(xi.get("rows", [])):
        raise ValueError("DUPLICATE_XRPL_INDEPENDENT_IDENTITY")
    x_keys = {(norm(r.get("symbol")), r.get("issuer_address")) for r in x_rows}
    if len(x_rows) != len(x_keys):
        raise ValueError("DUPLICATE_XRPL_PRIMARY_IDENTITY")
    if set(xi_rows) != x_keys:
        raise ValueError("XRPL_IDENTITY_SET_MISMATCH")
    for row in x_rows:
        key = (norm(row["symbol"]), row["issuer_address"])
        check = xi_rows[key]
        if not check.get("exact_match") or str(check.get("primary_supply")) != str(row["supply"]):
            raise ValueError("XRPL_INDEPENDENT_VALUE_MISMATCH")
        if (str(check.get("ledger_hash", "")).casefold() != str(row["ledger_hash"]).casefold()
                or check.get("ledger_index") != row.get("ledger_index")):
            raise ValueError("XRPL_LEDGER_HASH_MISMATCH")
        observations.append({
            "network": "xrpl", "identity": {"symbol": row["symbol"],
                "issuer": row["issuer_address"], "currency_code": row.get("currency_code_matched"),
                "ledger_hash": row["ledger_hash"]},
            "supply": str(row["supply"]),
            "measurement_state": "MEASURED_INDEPENDENTLY_READ_BACK",
            "catalogue_join": "SYMBOL_CHAIN_CANDIDATE_ONLY",
            "catalogue_candidates": catalogue_candidates(assets, row["symbol"], "xrpl"),
            "admission_state": "NOT_ADMITTED", "signature_state": "UNSIGNED",
            "anchor_state": "UNANCHORED"})
    evidence = [{"name": name, "sha256": digest(path)} for name, path in inputs.items()]
    return {"schema": "csoai.chain-measurement-coverage-candidate/0.1",
        "state": "INTERNAL_CANDIDATE_NOT_ADMITTED",
        "generated_from": evidence, "catalogue_asset_count": len(assets),
        "observations": observations,
        "coverage": {"read_only_measured": len(observations),
            "independently_read_back": len(observations), "catalogue_identity_bound": 0,
            "gspc_admitted": 0, "signed": 0, "anchored": 0},
        "claim_boundary": "Reads are exact for each recorded contract or issuer/currency and block/ledger. Symbol+chain joins are candidates only; this does not establish every deployment of an asset.",
        "authority": {"writes_catalogue": False, "signs": False, "anchors": False,
            "publishes": False, "pays": False, "executes_transactions": False}}

def main() -> int:
    ap = argparse.ArgumentParser()
    for flag in ("catalogue", "ethereum", "ethereum-independent", "xrpl", "xrpl-independent", "out"):
        ap.add_argument("--" + flag, required=True, type=Path)
    args = ap.parse_args()
    if args.out.exists():
        raise SystemExit("REFUSING_TO_OVERWRITE_EXISTING_CANDIDATE")
    result = reconcile(args.catalogue, args.ethereum, args.ethereum_independent,
        args.xrpl, args.xrpl_independent)
    args.out.parent.mkdir(parents=True, exist_ok=True)
    with args.out.open("x") as f:
        json.dump(result, f, sort_keys=True, indent=2)
        f.write("\n")
    print(json.dumps({"output": str(args.out), "observations": len(result["observations"]),
        "sha256": digest(args.out), "state": result["state"]}, sort_keys=True))
    return 0

if __name__ == "__main__":
    raise SystemExit(main())
