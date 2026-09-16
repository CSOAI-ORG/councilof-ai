#!/usr/bin/env python3
"""Issued supply for the universe's Solana-deployed stablecoins. Keyless public RPC.

Identification is weaker here and the rows say so. An SPL mint account carries no symbol()
to call, so unlike the EVM reader there is no on-chain check that this mint is the asset the
aggregator names. Supply is a fact about the mint; the mapping from mint to symbol rests on
the aggregator alone, and every row carries identification_state UNCONFIRMED_ONCHAIN.
"""
import json, sys, time, urllib.request

EP = "https://api.mainnet-beta.solana.com"


def rpc(method, params):
    req = urllib.request.Request(EP, method="POST",
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "csoai-gspc/1.4"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def main() -> int:
    src = sys.argv[sys.argv.index("--from") + 1] if "--from" in sys.argv else "public/interop/stablecoin-universe-supply-2026-09-16.json"
    out = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/stablecoin-solana-supply.json"
    base = json.load(open(src))
    targets = [r for r in base["rows"] if r.get("address_chain") == "solana" and r.get("address")]
    slot = rpc("getSlot", []).get("result")
    rows = []
    for t in targets:
        row = {"asset_id": t.get("asset_id"), "symbol": t.get("symbol"), "name": t.get("name"),
               "mint": t["address"], "chain": "solana", "slot": slot,
               "address_source": t.get("address_source"),
               "identification_state": "UNCONFIRMED_ONCHAIN",
               "identification_note": ("an SPL mint account carries no symbol() to call, so there is no "
                                       "on-chain check that this mint is the named asset; the mapping "
                                       "rests on the aggregator")}
        try:
            r = rpc("getTokenSupply", [t["address"]])
            if "error" in r:
                row.update({"supply_state": "UNCHECKABLE", "reason": str(r["error"])[:110]})
            else:
                v = r["result"]["value"]
                row.update({"supply_state": "MEASURED", "decimals": v["decimals"],
                            "total_supply_raw": v["amount"], "total_supply": float(v["uiAmountString"]),
                            "context_slot": r["result"]["context"]["slot"],
                            "method": "Solana JSON-RPC getTokenSupply on the mint account"})
        except Exception as e:
            row.update({"supply_state": "UNCHECKABLE", "reason": f"{type(e).__name__}: {e}"[:110]})
        rows.append(row); time.sleep(0.25)
    from collections import Counter
    c = Counter(r["supply_state"] for r in rows)
    doc = {"schema": "csoai.stablecoin-solana-supply/0.1", "kind": "deterministic-facts",
           "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()), "chain": "solana",
           "rpc": EP, "slot": slot, "n": len(rows), "counts": dict(c), "writes_board": False,
           "honesty": ("getTokenSupply on a mint account is the issued supply of that mint. It is not "
                       "circulating supply, not a reserve attestation, not backing and not a grade. "
                       "Identification is weaker than on the EVM side: an SPL mint carries no symbol() "
                       "to call, so every row is marked UNCONFIRMED_ONCHAIN and the mint-to-symbol "
                       "mapping rests on the aggregator alone."),
           "rows": rows}
    json.dump(doc, open(out, "w"), indent=2)
    print(f"slot {slot}  " + "  ".join(f"{k}={v}" for k, v in sorted(c.items())))
    for r in rows[:6]:
        print(f"  {str(r['symbol']):9s} {r['supply_state']:11s} {r.get('total_supply')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
