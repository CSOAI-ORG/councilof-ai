#!/usr/bin/env python3
"""settlement_ledger.py — reconcile on-chain USDC transfers to payTo vs /api/revenue.

Reads:
  1. USDC Transfer events TO the x402 payTo address on Base (via Tenderly public gateway)
  2. /api/revenue (the server's own count)
  3. KNOWN_INTERNAL_WALLETS (self-test wallets)
  4. docs/product/SETTLED-DOORS-* for prior classified settlements

Classifies each transfer:
  - SELF_TEST: from a known internal wallet
  - EXTERNAL_CUSTOMER: from an unknown wallet, amount matches a SKU price
  - UNKNOWN_PURPOSE: from an unknown wallet, amount doesn't match any SKU
  - ZERO_VALUE: dust/zero transfers

Output: JSON ledger with classified transfers + reconciliation vs /api/revenue.
Read-only: no keys, no transactions.
"""
from __future__ import annotations

import json
import subprocess
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

ORIGIN = "https://councilof.ai"
PAY_TO = "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31"
USDC_BASE = "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913"
TRANSFER_TOPIC0 = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef"
CHAIN_ID = 8453

# Known internal wallets (self-test / census wallets)
KNOWN_INTERNAL = {
    "0x4db7aafbe797a39cd6cc4e7aa64d970f7f6e02b7",  # census wallet
    "0x6ea00613e3c54b9a4c25e4e09243cfe8f76e43c6",  # burner wallet
    PAY_TO.lower(),  # self-transfer
}

# SKU prices (atomic units, 6 decimals)
SKU_PRICES = {
    10000: "request_attestation (promo 0.01)",
    20000: "request_attestation (standard 0.02)",
    100000: "receipts_batch (0.10)",
    0: "free_door (0.00)",
}

TENDERLY_ETH = "https://gateway.tenderly.co/public/mainnet"
TENDERLY_BASE = "https://base.gateway.tenderly.co/public/mainnet"
# mainnet.base.org: Coinbase's canonical Base RPC. Tenderly's public gateway
# silently misses historical USDC logs (same class as the flashbots defect
# discovered 2026-09-12). mainnet.base.org serves complete getLogs.
PRIMARY_BASE_RPC = "https://mainnet.base.org"
# Known-event integrity anchor for Base
# Self-settlement tx (INTERNAL_SELF_FUNDED, 0.01 USDC, block 51172054)
# Recorded in public/interop/x402-self-settlement-2026-09-11.json
KNOWN_BASE_BLOCK = 51_172_054
KNOWN_BASE_TX = "0x60172f43ca14e5874eba92b990ce623e6503cee6d060fd89fd828993fababe7f"


def rpc(url: str, method: str, params: list, timeout: int = 45) -> dict:
    """JSON-RPC call."""
    payload = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    cmd = ["curl", "-s", "-X", "POST", url,
           "-H", "Content-Type: application/json",
           "--max-time", str(timeout),
           "-d", payload.decode()]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=timeout + 5)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"error": r.stdout[:200]}


def get_block_number(rpc_url: str) -> int:
    resp = rpc(rpc_url, "eth_blockNumber", [])
    return int(resp.get("result", "0x0"), 16)


def get_logs(rpc_url: str, from_block: int, to_block: int, address: str, topics: list) -> list:
    """Get logs with chunked fallback for range limits."""
    params = [{
        "address": address,
        "topics": topics,
        "fromBlock": hex(from_block),
        "toBlock": hex(to_block),
    }]
    resp = rpc(rpc_url, "eth_getLogs", params)
    if "error" in resp:
        err = resp["error"]
        if isinstance(err, dict) and "exceed" in str(err.get("message", "")).lower():
            # Range too large, halve
            mid = (from_block + to_block) // 2
            if mid == from_block:
                return []
            return get_logs(rpc_url, from_block, mid, address, topics) + \
                   get_logs(rpc_url, mid + 1, to_block, address, topics)
        return []
    return resp.get("result", [])


def classify_transfer(from_addr: str, amount: int) -> str:
    """Classify a USDC transfer by sender and amount."""
    if from_addr.lower() in KNOWN_INTERNAL:
        return "SELF_TEST"
    if amount == 0:
        return "ZERO_VALUE"
    if amount in SKU_PRICES:
        return "EXTERNAL_CUSTOMER"
    return "UNKNOWN_PURPOSE"


def fetch_revenue() -> dict:
    """Fetch /api/revenue."""
    cmd = ["curl", "-s", "--max-time", "15", f"{ORIGIN}/api/revenue"]
    r = subprocess.run(cmd, capture_output=True, text=True, timeout=20)
    try:
        return json.loads(r.stdout)
    except Exception:
        return {"error": r.stdout[:200]}


def main():
    ts = datetime.now(timezone.utc).isoformat()
    print(f"Settlement ledger reconciler — {ts}", file=sys.stderr)

    # 1. Get current Base block
    head = get_block_number(PRIMARY_BASE_RPC)
    print(f"Base head block: {head}", file=sys.stderr)

    # 2. Integrity anchor check (use primary RPC — Tenderly silently misses historical logs)
    anchor_logs = get_logs(PRIMARY_BASE_RPC, KNOWN_BASE_BLOCK, KNOWN_BASE_BLOCK,
                           USDC_BASE, [TRANSFER_TOPIC0, None, "0x" + "0" * 24 + PAY_TO[2:].lower()])
    anchor_ok = any(log.get("transactionHash") == KNOWN_BASE_TX for log in anchor_logs)
    print(f"Integrity anchor (block {KNOWN_BASE_BLOCK}): {'PASS' if anchor_ok else 'FAIL'}", file=sys.stderr)

    if not anchor_ok:
        print("WARNING: anchor check failed — results may be incomplete", file=sys.stderr)

    # 3. Scan USDC transfers to payTo from a reasonable floor
    # x402 went live ~Sep 6-11, 2026. Base does ~43,200 blocks/day.
    # Scan from ~7 days back to be safe.
    floor = max(0, head - 300_000)
    print(f"Scanning USDC transfers to {PAY_TO} from block {floor} to {head}", file=sys.stderr)

    # topic0 = Transfer, topic2 = to (payTo padded)
    payto_padded = "0x" + "0" * 24 + PAY_TO[2:].lower()
    all_logs = []
    cursor = floor
    while cursor <= head:
        end = min(cursor + 999, head)
        batch = get_logs(PRIMARY_BASE_RPC, cursor, end, USDC_BASE,
                         [TRANSFER_TOPIC0, None, payto_padded])
        all_logs.extend(batch)
        cursor = end + 1
        time.sleep(0.1)
        if len(all_logs) % 50 == 0 and len(all_logs) > 0:
            print(f"  ... {len(all_logs)} transfers found so far", file=sys.stderr)

    print(f"Total USDC transfers to payTo: {len(all_logs)}", file=sys.stderr)

    # 4. Classify each transfer
    transfers = []
    for log in all_logs:
        topics = log.get("topics", [])
        from_addr = "0x" + topics[1][-40:] if len(topics) > 1 else "unknown"
        amount = int(log.get("data", "0x0"), 16)
        tx_hash = log.get("transactionHash", "")
        block = int(log.get("blockNumber", "0x0"), 16)
        classification = classify_transfer(from_addr, amount)

        transfers.append({
            "block": block,
            "tx": tx_hash,
            "from": from_addr,
            "amount_atomic": amount,
            "amount_usdc": f"{amount / 1e6:.6f}",
            "classification": classification,
            "sku_match": SKU_PRICES.get(amount),
        })

    # 5. Fetch /api/revenue
    revenue = fetch_revenue()

    # 6. Summarize
    by_class = {}
    for t in transfers:
        cls = t["classification"]
        by_class.setdefault(cls, {"count": 0, "total_atomic": 0, "transfers": []})
        by_class[cls]["count"] += 1
        by_class[cls]["total_atomic"] += t["amount_atomic"]
        by_class[cls]["transfers"].append(t)

    # 7. Reconciliation
    server_external = revenue.get("one_number", {}).get("all_time")
    chain_external = by_class.get("EXTERNAL_CUSTOMER", {}).get("count", 0)

    ledger = {
        "schema": "csoai.settlement-ledger/v1",
        "as_of": ts,
        "chain": "base",
        "chain_id": CHAIN_ID,
        "pay_to": PAY_TO,
        "scan_range": {"from_block": floor, "to_block": head},
        "integrity_anchor": {
            "block": KNOWN_BASE_BLOCK,
            "tx": KNOWN_BASE_TX,
            "passed": anchor_ok,
        },
        "total_transfers": len(transfers),
        "by_classification": {
            cls: {
                "count": d["count"],
                "total_usdc": f"{d['total_atomic'] / 1e6:.6f}",
            }
            for cls, d in by_class.items()
        },
        "reconciliation": {
            "server_external_payers": server_external,
            "chain_external_transfers": chain_external,
            "match": server_external == chain_external if server_external is not None else None,
            "server_source": "/api/revenue → one_number.all_time",
            "chain_source": f"USDC Transfer events to {PAY_TO} on Base",
        },
        "all_transfers": transfers,
        "revenue_api_snapshot": revenue,
        "spend": "$0 (read-only scan)",
        "keys_touched": False,
    }

    out_dir = Path(__file__).resolve().parent / "_results"
    out_dir.mkdir(parents=True, exist_ok=True)
    out_file = out_dir / f"settlement-ledger-{ts[:10]}.json"
    out_file.write_text(json.dumps(ledger, indent=2))

    print(f"\nLedger: {out_file}", file=sys.stderr)
    print(f"Total: {len(transfers)} transfers", file=sys.stderr)
    for cls, d in sorted(by_class.items()):
        print(f"  {cls}: {d['count']} transfers, {d['total_atomic'] / 1e6:.6f} USDC", file=sys.stderr)
    print(f"Server external: {server_external}, Chain external: {chain_external}", file=sys.stderr)

    json.dump(ledger, sys.stdout, indent=2)


if __name__ == "__main__":
    main()
