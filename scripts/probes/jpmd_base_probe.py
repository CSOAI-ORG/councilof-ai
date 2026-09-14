#!/usr/bin/env python3
"""JPMD (JPM Coin deposit token) observation probe on Base — OBSERVED-UNSIGNED-NOT-A-CARD.

Reads, via a public Base JSON-RPC endpoint and nothing else:
  * name / symbol / decimals / totalSupply at a pinned block
  * the EIP-1967 implementation slot (the token is a proxy)
  * ERC-20 Transfer events from/to the zero address (mints / burns) over a
    recent block window, scanned in chunks (public RPC caps eth_getLogs ranges)

The contract address is the one J.P. Morgan publishes on its own page
(https://www.jpmorgan.com/kinexys/jpm-coin, which links to basescan.org/token/<address>).
This script does not interpret supply as reserves, backing, volume or adoption.
It signs nothing and grades nothing. A window with zero events is recorded as
zero events *in that window*, never as "no activity".

Stdlib only. Usage:
  python3 scripts/probes/jpmd_base_probe.py --out measurement/probes/jpmd_probe_2026-09-14.json
"""
from __future__ import annotations

import argparse
import datetime as dt
import json
import time
import urllib.request

RPC_DEFAULT = "https://mainnet.base.org"
JPMD = "0x7e0aedc93d9f898be835a44bfca3842e52416b82"
ADDRESS_SOURCE = "https://www.jpmorgan.com/kinexys/jpm-coin"
TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
ZERO_TOPIC = "0x" + "0" * 64
EIP1967_IMPL_SLOT = "0x360894a13ba1a3210667c828492db98dca3e2076cc3735a920a3ca505d382bbc"
CHUNK = 2000  # mainnet.base.org: "eth_getLogs is limited to a 2,000 range"


class RPC:
    def __init__(self, url: str):
        self.url = url
        self.calls = 0

    def __call__(self, method: str, params: list):
        body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
        for attempt in range(5):
            req = urllib.request.Request(self.url, data=body, headers={"content-type": "application/json", "user-agent": "CSOAI-probe/0.1"})
            try:
                with urllib.request.urlopen(req, timeout=30) as r:
                    out = json.load(r)
                self.calls += 1
                if "error" in out:
                    raise RuntimeError(f"{method}: {out['error']}")
                return out["result"]
            except (OSError, RuntimeError) as e:  # rate limits / transient
                if attempt == 4:
                    raise
                time.sleep(1.5 * (attempt + 1))


def abi_string(hexdata: str) -> str | None:
    b = bytes.fromhex(hexdata[2:])
    if len(b) < 96:
        return None
    ln = int.from_bytes(b[32:64], "big")
    return b[64:64 + ln].decode("utf-8", "replace")


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--rpc", default=RPC_DEFAULT)
    ap.add_argument("--window", type=int, default=43200, help="blocks to scan back from the pinned block (~24h at 2s blocks)")
    ap.add_argument("--out", required=True)
    a = ap.parse_args()

    rpc = RPC(a.rpc)
    started = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
    head = int(rpc("eth_blockNumber", []), 16)
    tag = hex(head)
    head_block = rpc("eth_getBlockByNumber", [tag, False])
    code = rpc("eth_getCode", [JPMD, tag])
    call = lambda sel: rpc("eth_call", [{"to": JPMD, "data": sel}, tag])
    decimals = int(call("0x313ce567"), 16)
    supply_raw = int(call("0x18160ddd"), 16)
    impl_slot = rpc("eth_getStorageAt", [JPMD, EIP1967_IMPL_SLOT, tag])

    frm = max(0, head - a.window + 1)
    events = []
    chunks = 0
    for start in range(frm, head + 1, CHUNK):
        end = min(start + CHUNK - 1, head)
        for kind, topics in (("mint", [TRANSFER_TOPIC, ZERO_TOPIC]), ("burn", [TRANSFER_TOPIC, None, ZERO_TOPIC])):
            logs = rpc("eth_getLogs", [{"address": JPMD, "fromBlock": hex(start), "toBlock": hex(end), "topics": topics}])
            for lg in logs:
                amt = int(lg["data"], 16)
                events.append({
                    "kind": kind,
                    "block": int(lg["blockNumber"], 16),
                    "tx": lg["transactionHash"],
                    "log_index": int(lg["logIndex"], 16),
                    "counterparty": "0x" + (lg["topics"][2] if kind == "mint" else lg["topics"][1])[-40:],
                    "amount_raw": str(amt),
                    "amount": f"{amt / 10 ** decimals:.{decimals}f}",
                })
        chunks += 1
    events.sort(key=lambda e: (e["block"], e["log_index"]))
    finished = dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")

    doc = {
        "label": "OBSERVED-UNSIGNED-NOT-A-CARD",
        "schema": "csoai.observation-probe/0.1",
        "subject": "JPM Coin (JPMD) deposit token contract on Base",
        "public_framing": "Measurement, not certification. An observation of public chain state; not a grade, not a reserve attestation, not a traction figure.",
        "engine": "scripts/probes/jpmd_base_probe.py (stdlib JSON-RPC; eth_call/eth_getLogs)",
        "corpus": "Base mainnet public chain state at the pinned block",
        "chain": {"name": "Base", "chain_id": 8453},
        "rpc_url": a.rpc,
        "retrieved_started_at": started,
        "retrieved_finished_at": finished,
        "contract": {
            "address": JPMD,
            "address_source_url": ADDRESS_SOURCE,
            "address_source_statement": "J.P. Morgan's JPM Coin page links to basescan.org/token/" + JPMD + " as the smart contract and states tokens of the same or similar name at different addresses are not affiliated with J.P. Morgan.",
            "bytecode_present": code not in ("0x", "0x0"),
            "eip1967_implementation": "0x" + impl_slot[-40:] if int(impl_slot, 16) else None,
        },
        "pinned_block": {"number": head, "hash": head_block["hash"], "timestamp_utc": dt.datetime.fromtimestamp(int(head_block["timestamp"], 16), dt.timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")},
        "token": {
            "name": abi_string(call("0x06fdde03")),
            "symbol": abi_string(call("0x95d89b41")),
            "decimals": decimals,
            "total_supply_raw": str(supply_raw),
            "total_supply": f"{supply_raw / 10 ** decimals:.{decimals}f}",
            "state": "OBSERVED",
        },
        "mint_burn_window": {
            "from_block": frm,
            "to_block": head,
            "blocks": head - frm + 1,
            "chunk_size": CHUNK,
            "chunks_scanned": chunks,
            "chunks_failed": 0,
            "method": "eth_getLogs Transfer(address,address,uint256) with from==0x0 (mint) or to==0x0 (burn)",
            "mint_count": sum(1 for e in events if e["kind"] == "mint"),
            "burn_count": sum(1 for e in events if e["kind"] == "burn"),
            "events": events,
            "scope_note": "Counts cover only this block window. Transfers between non-zero addresses are not counted. Zero here means zero in this window.",
        },
        "unmeasured": [
            "reserve / backing of the deposit token (off-chain; not observable from Base state)",
            "holder distribution",
            "non-mint/burn transfer volume",
            "activity outside the scanned window",
            "claim-side figures published by J.P. Morgan (none quoted here)",
        ],
        "rpc_calls": rpc.calls,
        "signature_state": "UNSIGNED",
    }
    with open(a.out, "w") as f:
        json.dump(doc, f, indent=2)
        f.write("\n")
    print(f"block {head} supply {doc['token']['total_supply']} {doc['token']['symbol']} mints {doc['mint_burn_window']['mint_count']} burns {doc['mint_burn_window']['burn_count']} calls {rpc.calls}")


if __name__ == "__main__":
    main()
