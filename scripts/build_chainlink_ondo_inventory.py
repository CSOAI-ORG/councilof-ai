#!/usr/bin/env python3
"""Build a deterministic Chainlink LINK and Ondo token-address inventory.

This measures what the named publishers list. It does not measure reserves,
price parity, legal status, safety, creditworthiness, or investment merit.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
from pathlib import Path

CHAINLINK_URL = "https://docs.chain.link/resources/link-token-contracts.md"
ONDO_URL = "https://raw.githubusercontent.com/ondoprotocol/ondo-global-markets-token-list/main/tokenlist.json"
ADDRESS_RE = re.compile(r"0x[0-9a-fA-F]{40}")


def sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def parse_chainlink(raw: bytes) -> list[dict]:
    text = raw.decode("utf-8")
    network = None
    rows: list[dict] = []
    block: dict[str, object] = {}
    for line in text.splitlines():
        if line.startswith("### "):
            if block:
                rows.append(block)
            network = re.sub(r"<[^>]+>", "", line[4:]).strip()
            block = {"network": network}
            continue
        if not block or not line.startswith("|"):
            continue
        cells = [cell.strip() for cell in line.strip().strip("|").split("|")]
        if len(cells) < 2:
            continue
        key = cells[0].replace("`", "").strip().lower().replace(" ", "_")
        value = "|".join(cells[1:]).strip()
        if key == "chain_id":
            match = re.search(r"`(\d+)`", value)
            if match:
                block["chain_id"] = int(match.group(1))
        elif key == "address":
            match = ADDRESS_RE.search(value)
            if match:
                block["address"] = match.group(0)
            url = re.search(r'contractUrl="([^"]+)"', value)
            if url:
                block["explorer_url"] = url.group(1)
        elif key == "name":
            block["name"] = re.sub(r"<[^>]+>", "", value).strip()
        elif key == "symbol":
            block["symbol"] = re.sub(r"<[^>]+>", "", value).strip()
        elif key == "decimals":
            match = re.search(r"\d+", value)
            if match:
                block["decimals"] = int(match.group(0))
    if block:
        rows.append(block)
    rows = [row for row in rows if {"chain_id", "address"} <= row.keys()]
    if not rows:
        raise ValueError("no LINK contracts parsed")
    keys = [(row["chain_id"], str(row["address"]).lower()) for row in rows]
    if len(keys) != len(set(keys)):
        raise ValueError("duplicate Chainlink chain/address row")
    return rows


def parse_ondo(raw: bytes) -> tuple[dict, list[dict]]:
    source = json.loads(raw)
    rows = []
    for token in source.get("tokens", []):
        address = token.get("address")
        if not isinstance(address, str) or not ADDRESS_RE.fullmatch(address):
            raise ValueError(f"invalid Ondo token address: {address!r}")
        rows.append({
            "chain_id": int(token["chainId"]),
            "address": address,
            "name": str(token["name"]),
            "symbol": str(token["symbol"]),
            "decimals": int(token["decimals"]),
            "tags": list(token.get("tags") or []),
        })
    keys = [(row["chain_id"], str(row["address"]).lower()) for row in rows]
    if not rows or len(keys) != len(set(keys)):
        raise ValueError("empty or duplicate Ondo chain/address rows")
    return source, rows


def build(chainlink_path: Path, ondo_path: Path, observed_at: str) -> dict:
    chainlink_raw = chainlink_path.read_bytes()
    ondo_raw = ondo_path.read_bytes()
    chainlink = parse_chainlink(chainlink_raw)
    ondo_source, ondo = parse_ondo(ondo_raw)
    return {
        "schema": "csoai.chainlink-ondo-token-inventory/0.1",
        "kind": "publisher-directory-measurement",
        "observed_at": observed_at,
        "status": "MEASURED",
        "measurement": "publisher-listed chain IDs, token addresses, symbols, names and decimals",
        "not_measured": [
            "contract bytecode or interface correctness except where a separate on-chain probe is attached",
            "cross-chain supply reconciliation",
            "reserves, backing, price parity or redemption",
            "legal or regulatory status",
            "safety, solvency, creditworthiness, investment merit or endorsement",
        ],
        "sources": {
            "chainlink": {"url": CHAINLINK_URL, "sha256": sha256(chainlink_raw)},
            "ondo": {"url": ONDO_URL, "sha256": sha256(ondo_raw), "timestamp": ondo_source.get("timestamp"), "version": ondo_source.get("version")},
        },
        "counts": {
            "chainlink_rows": len(chainlink),
            "chainlink_mainnet_rows": sum("testnet" not in str(row.get("network", "")).lower() and "sepolia" not in str(row.get("network", "")).lower() and "devnet" not in str(row.get("network", "")).lower() for row in chainlink),
            "ondo_rows": len(ondo),
            "ondo_chain_ids": sorted({row["chain_id"] for row in ondo}),
        },
        "chainlink_link": chainlink,
        "ondo_global_markets": ondo,
        "signature": {"state": "UNSIGNED", "sig_ed25519": None, "signer": "did:web:csoai.org#board-attestation-1", "route": "GHA_OIDC_ONLY"},
        "measurement_not_certification": True,
        "writes_gspc_board": False,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--chainlink", type=Path, required=True)
    parser.add_argument("--ondo", type=Path, required=True)
    parser.add_argument("--observed-at", required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    result = build(args.chainlink, args.ondo, args.observed_at)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps(result["counts"], separators=(",", ":")))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
