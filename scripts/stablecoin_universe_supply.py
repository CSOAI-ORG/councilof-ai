#!/usr/bin/env python3
"""On-chain issued supply for the frozen stablecoin universe, Ethereum deployments.

Provenance, stated plainly. The frozen index (425 assets) carries no contract address. The
addresses used here come from the SAME upstream the index itself was built from
(stablecoins.llama.fi, source_sha256 recorded in the index), read per asset. That is an
aggregator, weaker than an issuer's own page, and every row says so.

Because an aggregator can be wrong, no address is trusted on its word: symbol() is called
on chain and must return the asset's own symbol before any supply is recorded. A mismatch
is REJECTED, not measured.

Ten EVM chains are read, each at its own head block, recorded per row. An asset on a chain
with no endpoint here is UNMEASURED with that reason — not zero, and not silently dropped.
"""
import argparse, json, re, sys, time, urllib.request

# Endpoints reused from scripts/readers/wrapped-asset-parity-reader.mjs (CHAINS), which records
# why each was chosen: publicnode refuses pinned-block eth_call without a token since 2026-09-15,
# and polygon-rpc.com answers 401 keyless. Chains absent here are not read, and say so per row.
CHAIN_RPC = {
    "ethereum": "https://eth.drpc.org",
    "base": "https://mainnet.base.org",
    "optimism": "https://mainnet.optimism.io",
    "arbitrum": "https://arb1.arbitrum.io/rpc",
    "polygon": "https://polygon-bor-rpc.publicnode.com",
    "bsc": "https://bsc-rpc.publicnode.com",
    "avax": "https://avalanche-c-chain-rpc.publicnode.com",
    "celo": "https://forno.celo.org",
    "rsk": "https://public-node.rsk.co",
    "hyperliquid": "https://rpc.hyperliquid.xyz/evm",
}
RPC = CHAIN_RPC["ethereum"]
SEL = {"symbol": "0x95d89b41", "name": "0x06fdde03", "decimals": "0x313ce567", "totalSupply": "0x18160ddd"}
UP = "https://stablecoins.llama.fi/stablecoin/%s"


def rpc(method, params, endpoint=None):
    r = urllib.request.Request(endpoint or RPC, method="POST",
        data=json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode(),
        headers={"Content-Type": "application/json", "User-Agent": "csoai-gspc/1.4"})
    with urllib.request.urlopen(r, timeout=30) as resp:
        return json.loads(resp.read().decode())


def call(to, data, blk, endpoint=None):
    r = rpc("eth_call", [{"to": to, "data": data}, blk], endpoint)
    if "error" in r:
        raise RuntimeError(str(r["error"])[:90])
    return r["result"]


def dec_str(hx):
    b = bytes.fromhex(hx[2:]) if hx.startswith("0x") else b""
    if len(b) < 64:
        return b.rstrip(b"\x00").decode("ascii", "ignore").strip()
    ln = int.from_bytes(b[32:64], "big")
    return b[64:64 + ln].decode("utf-8", "ignore").strip()


def upstream_head(i, nbytes=3000):
    req = urllib.request.Request(UP % i, headers={"User-Agent": "csoai-gspc/1.4",
                                                  "Range": f"bytes=0-{nbytes}"})
    with urllib.request.urlopen(req, timeout=25) as r:
        chunk = r.read(nbytes).decode("utf-8", "ignore")
    g = lambda k: (re.search(r'"%s"\s*:\s*"([^"]*)"' % k, chunk) or [None, None])[1]
    return {"address": g("address"), "symbol": g("symbol"), "name": g("name")}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--index", default="public/interop/stablecoin-universe-2026-09/index.json")
    parser.add_argument("--out", default="public/interop/stablecoin-universe-supply.json")
    parser.add_argument("--limit", type=int)
    args = parser.parse_args()
    idx = json.load(open(args.index))
    out_path = args.out
    limit = args.limit if args.limit is not None else len(idx["assets"])
    assets = idx["assets"][:limit]
    heads = {}
    for ch, ep in CHAIN_RPC.items():
        try:
            h = rpc("eth_blockNumber", [], ep)["result"]
            b = rpc("eth_getBlockByNumber", [h, False], ep)["result"]
            heads[ch] = {"number": int(h, 16), "hex": h, "hash": b["hash"], "timestamp": int(b["timestamp"], 16), "rpc": ep}
        except Exception as e:
            heads[ch] = {"error": f"{type(e).__name__}: {str(e)[:70]}", "rpc": ep}
    block = heads.get("ethereum", {})

    rows = []
    for a in assets:
        row = {"asset_id": a["id"], "symbol": a.get("symbol"), "name": a.get("name"),
               "address_source": f"aggregator {UP % a['id']} — the same upstream the frozen index was built from",
               "confirmation": "symbol() called on chain; must equal the asset symbol"}
        try:
            h = upstream_head(a["id"])
        except Exception as e:
            row.update({"state": "UNCHECKABLE", "reason": f"upstream: {type(e).__name__}"}); rows.append(row); continue
        addr = (h.get("address") or "").strip()
        if not addr:
            row.update({"state": "UNMEASURED", "reason": "upstream carries no contract address"}); rows.append(row); continue
        chain = "ethereum"
        if ":" in addr:
            chain, addr = addr.split(":", 1)
        row["address"] = addr; row["address_chain"] = chain
        ch = "ethereum" if chain.lower() in ("ethereum", "eth") else chain.lower()
        well_formed = bool(re.fullmatch(r"0x[0-9a-fA-F]{40}", addr))
        if ch in CHAIN_RPC and not well_formed:
            # The upstream's chain label and its address disagree. Saying "no endpoint for that
            # chain" would blame our reader for a defect in the source, so name it as what it is.
            row.update({"state": "UNMEASURED", "upstream_label_disagrees_with_address": True,
                        "reason": (f"the upstream labels this {chain}, but {addr!r} is not a 20-byte EVM "
                                   f"address, so the label and the address disagree. Not read; not guessed at.")})
            rows.append(row); continue
        if ch not in CHAIN_RPC:
            row.update({"state": "UNMEASURED",
                        "reason": f"address is on {chain}; this reader has no endpoint for that chain"}); rows.append(row); continue
        if not well_formed:
            row.update({"state": "UNMEASURED", "reason": f"{addr!r} is not a 20-byte EVM address"}); rows.append(row); continue
        hd = heads.get(ch, {})
        if "error" in hd:
            row.update({"state": "UNCHECKABLE", "reason": f"{ch} endpoint: {hd['error']}"}); rows.append(row); continue
        ep = CHAIN_RPC[ch]; head = hd["hex"]; row["block"] = {k: v for k, v in hd.items() if k != "rpc"}; row["rpc"] = ep
        try:
            sym = dec_str(call(addr, SEL["symbol"], head, ep))
            row["onchain_symbol"] = sym
            if not sym or not a.get("symbol") or sym.upper() != str(a["symbol"]).upper():
                row.update({"state": "REJECTED",
                            "reason": f"on-chain symbol {sym!r} does not match {a.get('symbol')!r}; not this token's contract"})
            else:
                dec = int(call(addr, SEL["decimals"], head, ep), 16)
                raw = int(call(addr, SEL["totalSupply"], head, ep), 16)
                row.update({"state": "MEASURED", "decimals": dec, "total_supply_raw": str(raw),
                            "total_supply": raw / (10 ** dec),
                            "onchain_name": dec_str(call(addr, SEL["name"], head, ep))})
        except Exception as e:
            row.update({"state": "UNCHECKABLE", "reason": f"{type(e).__name__}: {e}"[:110]})
        rows.append(row)
        time.sleep(0.12)

    # One retry for the transient conditions seen in the first pass: 403 and 429 from a
    # rate-limited endpoint, and "missing trie node", which is the node having pruned the
    # state for the block we pinned between reading the head and calling. The retry takes a
    # fresh head for that chain. Anything that fails twice stays UNCHECKABLE with its reason.
    TRANSIENT = ("403", "429", "missing trie node", "Too Many Requests", "Forbidden")
    for row in rows:
        if row.get("state") != "UNCHECKABLE" or not any(t in str(row.get("reason", "")) for t in TRANSIENT):
            continue
        ch = row.get("address_chain"); ep = CHAIN_RPC.get(ch if ch != "eth" else "ethereum")
        if not ep or not row.get("address"):
            continue
        try:
            h2 = rpc("eth_blockNumber", [], ep)["result"]
            sym = dec_str(call(row["address"], SEL["symbol"], h2, ep))
            row["onchain_symbol"] = sym; row["retried"] = True
            expected = row.get("symbol")
            if not sym or not expected or sym.upper() != str(expected).upper():
                row.update({"state": "REJECTED",
                            "reason": f"on-chain symbol {sym!r} does not match {expected!r}; not this token's contract"})
            else:
                dec = int(call(row["address"], SEL["decimals"], h2, ep), 16)
                raw = int(call(row["address"], SEL["totalSupply"], h2, ep), 16)
                row.update({"state": "MEASURED", "decimals": dec, "total_supply_raw": str(raw),
                            "total_supply": raw / (10 ** dec),
                            "block": {"number": int(h2, 16), "hex": h2, "retried_at_fresh_head": True}})
                row.pop("reason", None)
        except Exception as e:
            row["retry_reason"] = f"{type(e).__name__}: {e}"[:110]
        time.sleep(0.3)

    from collections import Counter
    c = Counter(r["state"] for r in rows)
    doc = {"schema": "csoai.stablecoin-universe-supply/0.1", "kind": "deterministic-facts",
           "as_of": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
           "chains_read": list(CHAIN_RPC), "heads": heads,
           "universe_asset_count": idx.get("asset_count"), "n_attempted": len(rows),
           "counts": dict(c), "writes_board": False,
           "honesty": ("totalSupply() at a named block is the issued supply of that contract on Ethereum. "
                       "It is not circulating supply across chains, not a reserve attestation, not backing, "
                       "not a grade. Addresses come from the aggregator the frozen index itself was built "
                       "from — weaker than an issuer's own page — so none is trusted without an on-chain "
                       "symbol() match, and a mismatch is REJECTED rather than measured. Assets deployed on "
                       "other chains are UNMEASURED with that reason, never zero."),
           "rows": rows}
    json.dump(doc, open(out_path, "w"), indent=2)
    print(f"block {block['number']}  attempted {len(rows)}  " + "  ".join(f"{k}={v}" for k, v in sorted(c.items())))
    return 0


if __name__ == "__main__":
    sys.exit(main())
