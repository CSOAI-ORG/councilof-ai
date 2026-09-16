#!/usr/bin/env python3
"""Read totalSupply() on-chain for stablecoins whose contract address the estate already holds.

Why the roster is small: the frozen universe index (425 assets) carries name, symbol, chains
and an aggregator's circulating figure, but no contract address. An address typed from memory
is exactly the defect this estate corrects, so an asset enters this roster only when its address
comes from a file already in the repository, and the file is named per row.

What is measured: totalSupply() at a named block, and decimals(). That is the token's issued
supply on that chain. It is not circulating supply, not a reserve attestation, not backing,
and not a grade. Where the aggregator's figure is available it is printed beside the chain
read as a comparison, never as a substitute.
"""
import json, sys, time, urllib.request

RPC = "https://ethereum-rpc.publicnode.com"
SEL_TOTAL_SUPPLY = "0x18160ddd"
SEL_DECIMALS = "0x313ce567"

# address -> the file in this repository the address was taken from
ROSTER = [
    {"symbol": "USDT", "name": "Tether", "address": "0xdAC17F958D2ee523a2206206994597C13D831ec7",
     "address_source": "scripts/readers/wrapped-asset-parity-reader.mjs (USDT_ETH)"},
    {"symbol": "USDC", "name": "USD Coin", "address": "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48",
     "address_source": "scripts/readers/wrapped-asset-parity-reader.mjs (USDC_ETH)"},
    {"symbol": "DAI", "name": "Dai", "address": "0x6B175474E89094C44Da98b954EedeAC495271d0F",
     "address_source": "scripts/readers/wrapped-asset-parity-reader.mjs (DAI_ETH)"},
    {"symbol": "BUIDL", "name": "BlackRock USD Institutional Digital Liquidity Fund",
     "address": "0x7712c34205737192402172409a8f7ccef8aa2aec",
     "address_source": "public/interop/evm-control-facts.json (measured[0].contract)"},
]


def rpc(method, params):
    req = urllib.request.Request(RPC, method="POST",
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "csoai-gspc/1.4"})
    with urllib.request.urlopen(req, timeout=30) as r:
        return json.loads(r.read().decode())


def call(to, data, block):
    r = rpc("eth_call", [{"to": to, "data": data}, block])
    if "error" in r:
        raise RuntimeError(str(r["error"])[:120])
    return r["result"]


def main() -> int:
    out_path = sys.argv[sys.argv.index("--out") + 1] if "--out" in sys.argv else "public/interop/stablecoin-onchain-supply.json"
    head = rpc("eth_blockNumber", [])["result"]
    blk = rpc("eth_getBlockByNumber", [head, False])["result"]
    block = {"number": int(head, 16), "hex": head, "hash": blk["hash"],
             "timestamp": int(blk["timestamp"], 16)}
    rows = []
    for a in ROSTER:
        row = dict(a); row["chain"] = "ethereum"; row["block"] = block
        try:
            dec = int(call(a["address"], SEL_DECIMALS, head), 16)
            raw = int(call(a["address"], SEL_TOTAL_SUPPLY, head), 16)
            row.update({"decimals": dec, "total_supply_raw": str(raw),
                        "total_supply": raw / (10 ** dec), "state": "MEASURED",
                        "method": "eth_call totalSupply() at the named block, public RPC"})
        except Exception as e:
            row.update({"state": "UNCHECKABLE", "reason": f"{type(e).__name__}: {e}"[:160]})
        rows.append(row); time.sleep(0.3)

    universe_n = None
    try:
        u = json.load(open("public/interop/stablecoin-universe-2026-09/index.json"))
        universe_n = u.get("asset_count")
    except Exception:
        pass

    doc = {
        "schema": "csoai.stablecoin-onchain-supply/0.1",
        "kind": "deterministic-facts",
        "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "rpc": RPC,
        "n": len(rows),
        "n_measured": sum(1 for r in rows if r["state"] == "MEASURED"),
        "writes_board": False,
        "universe_asset_count": universe_n,
        "universe_unmeasured_here": (universe_n - len(rows)) if universe_n else None,
        "honesty": ("totalSupply() at a named block is the issued supply of that contract on that "
                    "chain. It is not circulating supply, not a reserve attestation, not backing, "
                    "and not a grade. The frozen universe carries no contract addresses, so an asset "
                    "enters this roster only when its address is already in a file in this repository, "
                    "named per row. Every other asset in the universe stays UNMEASURED here, and the "
                    "reason is the missing sourced address, never a zero."),
        "rows": rows,
    }
    json.dump(doc, open(out_path, "w"), indent=2)
    print(f"block {block['number']}  measured {doc['n_measured']}/{doc['n']}  universe {universe_n} (unmeasured here: {doc['universe_unmeasured_here']})")
    for r in rows:
        print(f"  {r['symbol']:7s} {r['state']:12s} supply={r.get('total_supply')}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
