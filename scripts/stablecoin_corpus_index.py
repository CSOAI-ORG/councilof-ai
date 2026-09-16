#!/usr/bin/env python3
"""One index over the stablecoin readers, with disjointness proven rather than assumed.

Two readers cover the frozen universe: an EVM reader over ten chains and a Solana reader.
They cover different assets, so their MEASURED sets can be unioned — but "can be unioned"
is a claim, so this file checks it: any asset id measured by both is listed, and if any
exists the union is refused rather than published.

What is counted is assets with at least one measured deployment. It is NOT a supply total:
the universe mixes peg currencies, and one asset may be deployed on several chains, so
adding the numbers would either mix units or double-count a bridged token.
"""
import json, sys, time, pathlib

def load(p):
    try:
        return json.loads(pathlib.Path(p).read_text())
    except Exception:
        return None

def main() -> int:
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/stablecoin-corpus-index.json"
    evm = load("public/interop/stablecoin-universe-supply-2026-09-16.json")
    sol = load("public/interop/stablecoin-solana-supply-2026-09-16.json")
    src = load("public/interop/stablecoin-universe-2026-09/index.json")
    if not (evm and sol and src):
        print("a source file is missing; refusing to publish an index over sources it cannot read"); return 1

    evm_m = {str(r["asset_id"]) for r in evm["rows"] if r["state"] == "MEASURED"}
    sol_m = {str(r["asset_id"]) for r in sol["rows"] if r.get("supply_state") == "MEASURED"}
    overlap = sorted(evm_m & sol_m)
    if overlap:
        print(f"REFUSED: {len(overlap)} asset(s) measured by both readers; a union would double-count"); return 2

    universe = src.get("asset_count")
    measured = evm_m | sol_m
    doc = {
      "schema": "csoai.stablecoin-corpus-index/0.1", "kind": "index",
      "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
      "universe_asset_count": universe,
      "assets_with_at_least_one_measured_deployment": len(measured),
      "still_unmeasured": (universe - len(measured)) if universe else None,
      "by_reader": {
        "evm": {"file": "/interop/stablecoin-universe-supply-2026-09-16.json",
                "measured_assets": len(evm_m), "chains": evm.get("measured_by_chain"),
                "identification": "symbol() confirmed on chain"},
        "solana": {"file": "/interop/stablecoin-solana-supply-2026-09-16.json",
                   "measured_assets": len(sol_m), "slot": sol.get("slot"),
                   "identification": "UNCONFIRMED_ONCHAIN — an SPL mint carries no symbol() to call"}},
      "disjointness_checked": {"overlapping_asset_ids": overlap, "result": "disjoint",
        "why_it_is_checked": ("Two sets may only be added when nothing is in both. That is a claim, so it is "
                              "tested here and the union is refused if it fails, rather than assumed.")},
      "not_a_supply_total": ("This counts ASSETS with at least one measured deployment. It is not a sum of "
                             "supply: the universe mixes peg currencies, and one asset may be deployed on "
                             "several chains, so a sum would mix units or double-count a bridged token."),
      "not_measured_breakdown": ("see each reader's rows; every unmeasured asset carries its own reason — a "
                                 "chain with no endpoint here, an upstream with no address, a chain label "
                                 "that disagrees with its address, or a symbol mismatch. None is a zero."),
    }
    pathlib.Path(out).write_text(json.dumps(doc, indent=2) + "\n")
    print(f"universe {universe} · measured {len(measured)} · unmeasured {doc['still_unmeasured']} · disjoint (overlap {len(overlap)})")
    return 0

if __name__ == "__main__":
    sys.exit(main())
