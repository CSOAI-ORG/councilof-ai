#!/usr/bin/env python3
"""Probe bytecode and ERC-20 metadata for every Ondo inventory row via public RPC."""
from __future__ import annotations

import argparse
import hashlib
import json
import time
import urllib.request
from urllib.error import HTTPError
from datetime import datetime, timezone
from pathlib import Path

RPC = {1: "https://ethereum-rpc.publicnode.com", 56: "https://bsc-rpc.publicnode.com"}
SELECTORS = {"symbol": "0x95d89b41", "decimals": "0x313ce567"}


def post(url: str, payload: object) -> object:
    request = urllib.request.Request(url, json.dumps(payload).encode(), {"content-type": "application/json", "user-agent": "CSOAI-measurement/0.1"})
    with urllib.request.urlopen(request, timeout=60) as response:
        return json.load(response)


def decode_string(value: str | None) -> str | None:
    if not value or value == "0x":
        return None
    raw = bytes.fromhex(value[2:])
    try:
        if len(raw) >= 64:
            size = int.from_bytes(raw[32:64])
            return raw[64:64 + size].decode()
        return raw.rstrip(b"\0").decode()
    except (UnicodeDecodeError, ValueError):
        return None


def batch(url: str, requests: list[dict], size: int = 20) -> dict[int, dict]:
    results: dict[int, dict] = {}
    for offset in range(0, len(requests), size):
        for attempt in range(6):
            try:
                response = post(url, requests[offset:offset + size])
                break
            except HTTPError as error:
                if error.code != 429 or attempt == 5:
                    raise
                time.sleep(2 ** attempt)
        if not isinstance(response, list):
            raise RuntimeError("RPC did not return a JSON batch")
        results.update({int(item["id"]): item for item in response})
        time.sleep(0.15)
    return results


def probe(inventory: dict, observed_at: str) -> dict:
    rows = inventory["ondo_global_markets"]
    out_rows = []
    for chain_id in sorted({int(row["chain_id"]) for row in rows}):
        chain_rows = [row for row in rows if int(row["chain_id"]) == chain_id]
        rpc = RPC.get(chain_id)
        if not rpc:
            out_rows.extend({"chain_id": chain_id, "address": row["address"], "status": "UNREACHABLE", "reason": "no pinned RPC"} for row in chain_rows)
            continue
        block = post(rpc, {"jsonrpc": "2.0", "id": 1, "method": "eth_getBlockByNumber", "params": ["finalized", False]})
        if not isinstance(block, dict) or "result" not in block:
            raise RuntimeError(f"finalized block unavailable for chain {chain_id}")
        block_data = block["result"]
        block_tag = block_data["number"]
        requests = []
        request_id = 1
        mapping: dict[int, tuple[int, str]] = {}
        for index, row in enumerate(chain_rows):
            address = row["address"]
            requests.append({"jsonrpc": "2.0", "id": request_id, "method": "eth_getCode", "params": [address, block_tag]})
            mapping[request_id] = (index, "code")
            request_id += 1
            for field, selector in SELECTORS.items():
                requests.append({"jsonrpc": "2.0", "id": request_id, "method": "eth_call", "params": [{"to": address, "data": selector}, block_tag]})
                mapping[request_id] = (index, field)
                request_id += 1
        responses = batch(rpc, requests)
        values: list[dict] = [{} for _ in chain_rows]
        for response_id, (index, field) in mapping.items():
            response = responses.get(response_id, {})
            values[index][field] = response.get("result")
            if response.get("error"):
                values[index].setdefault("errors", {})[field] = response["error"].get("message", "RPC error")
        for row, value in zip(chain_rows, values):
            code = value.get("code")
            symbol = decode_string(value.get("symbol"))
            decimals_hex = value.get("decimals")
            decimals = int(decimals_hex, 16) if isinstance(decimals_hex, str) and decimals_hex not in ("", "0x") else None
            checks = {
                "code_present": isinstance(code, str) and code not in ("0x", "0x0"),
                "symbol_matches": symbol == row["symbol"],
                "decimals_match": decimals == row["decimals"],
            }
            out_rows.append({
                "chain_id": chain_id,
                "address": row["address"],
                "published_symbol": row["symbol"],
                "observed_symbol": symbol,
                "published_decimals": row["decimals"],
                "observed_decimals": decimals,
                "checks": checks,
                "status": "MEASURED" if all(checks.values()) else "MEASURED_MISMATCH",
                "errors": value.get("errors", {}),
                "block": {"number": int(block_tag, 16), "hash": block_data["hash"], "timestamp": int(block_data["timestamp"], 16), "finality": "RPC_FINALIZED_TAG_PROVIDER_REPORTED_NOT_INDEPENDENTLY_PROVEN_FINAL"},
                "rpc": rpc,
            })
    counts = {
        "rows": len(out_rows),
        "measured_match": sum(row["status"] == "MEASURED" for row in out_rows),
        "measured_mismatch": sum(row["status"] == "MEASURED_MISMATCH" for row in out_rows),
        "unreachable": sum(row["status"] == "UNREACHABLE" for row in out_rows),
    }
    return {
        "schema": "csoai.ondo-token-onchain-probe/0.1",
        "observed_at": observed_at,
        "source_inventory_canonical_sha256": hashlib.sha256(json.dumps(inventory, sort_keys=True, separators=(",", ":")).encode()).hexdigest(),
        "counts": counts,
        "rows": out_rows,
        "not_measured": ["reserve backing", "price parity", "transferability for any specific holder", "legal status", "safety, solvency, creditworthiness, investment merit or endorsement"],
        "signature": {"state": "UNSIGNED", "sig_ed25519": None, "signer": "did:web:csoai.org#board-attestation-1", "route": "GHA_OIDC_ONLY"},
        "measurement_not_certification": True,
        "writes_gspc_board": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--inventory", type=Path, required=True)
    parser.add_argument("--observed-at", default=datetime.now(timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z"))
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = probe(json.loads(args.inventory.read_text()), args.observed_at)
    args.output.write_text(json.dumps(result, indent=2) + "\n")
    print(json.dumps(result["counts"], separators=(",", ":")))
    return 1 if result["counts"]["measured_mismatch"] or result["counts"]["unreachable"] else 0


if __name__ == "__main__":
    raise SystemExit(main())
