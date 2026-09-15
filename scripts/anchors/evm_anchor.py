#!/usr/bin/env python3
"""evm_anchor.py — generate or verify an EVM (ETH / Base) anchor for councilof.ai/root.json.

WHAT THIS DOES
  Default (generate): Fetches the live root.json from councilof.ai, computes
  sha256 over the raw bytes as served, and emits an unsigned EVM transaction
  JSON with the hash embedded in the `data` field (bare data-carrying
  transaction — no contract call, no OP_RETURN analog needed on EVM: any
  address can hold arbitrary calldata).  The owner must fill in `from`, set
  gas parameters, sign, and broadcast.

  Verify (--verify <tx_hash> --chain <ethereum|base>): Fetches the given
  transaction from a public RPC, extracts the `input` data field, and
  compares the embedded hash to the current sha256 of root.json.

WHAT THIS IS NOT
  - NOT a signer.  No keys are loaded, no transaction is broadcast.
  - NOT a contract.  This is a bare transaction with data; the hash lives in
    the tx receipt, viewable on any explorer.  No ABI, no contract deployment.
  - NOT a certificate.  An EVM data-tx proves only that a 32-byte digest was
    included in a block; it says nothing about what the bytes mean.

EXIT CODES
  0  success (tx generated / hash verified)
  1  mismatch (verify mode: data != current root.json hash)
  2  usage / network / parse error

DEPENDENCIES: stdlib only (hashlib, json, urllib).  No pip installs.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROOT_URL = "https://councilof.ai/root.json"
UA = "csoai-evm-anchor/0 (+https://councilof.ai/root.json)"

# Prefix prepended to the sha256 in the data field.  Human-readable tag so
# explorers can identify the tx purpose.  4 bytes = 8 hex chars.
# "CSOA" = 0x43534f41
DATA_PREFIX = b"CSOA"

# Public, keyless JSON-RPC endpoints.  The first that answers wins.
CHAINS: dict[str, dict] = {
    "ethereum": {
        "chain_id": 1,
        "rpcs": [
            "https://ethereum-rpc.publicnode.com",
            "https://eth.llamarpc.com",
            "https://cloudflare-eth.com",
            "https://1rpc.io/eth",
            "https://eth.drpc.org",
        ],
        "explorer_tx": "https://etherscan.io/tx/",
    },
    "base": {
        "chain_id": 8453,
        "rpcs": [
            "https://base-rpc.publicnode.com",
            "https://mainnet.base.org",
            "https://1rpc.io/base",
            "https://base.drpc.org",
        ],
        "explorer_tx": "https://basescan.org/tx/",
    },
}


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Network helpers
# ---------------------------------------------------------------------------


def fetch_root_bytes() -> bytes:
    """Fetch root.json raw bytes.  Raises on network failure (fail-closed)."""
    req = urllib.request.Request(ROOT_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as resp:
        if resp.status != 200:
            raise RuntimeError(f"HTTP {resp.status} from {ROOT_URL}")
        return resp.read()


def evm_rpc(method: str, params: list, rpc_url: str, timeout: int = 20) -> dict:
    """Single EVM JSON-RPC call.  Returns parsed JSON or {"error": ...}."""
    body = json.dumps({
        "jsonrpc": "2.0",
        "id": 1,
        "method": method,
        "params": params,
    }).encode()
    req = urllib.request.Request(
        rpc_url,
        data=body,
        headers={"Content-Type": "application/json", "User-Agent": UA},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as exc:
        return {"error": str(exc)}


def _try_rpcs(chain: str, method: str, params: list) -> tuple[dict, str]:
    """Try each RPC for the chain.  Returns (result_dict, rpc_url_used).
    Raises RuntimeError if none answer.  A valid JSON-RPC response (has
    "jsonrpc" key, no "error") counts as answered even if "result" is null
    (e.g. tx not found)."""
    for rpc_url in CHAINS[chain]["rpcs"]:
        resp = evm_rpc(method, params, rpc_url)
        if "error" in resp:
            continue
        # A valid JSON-RPC 2.0 response always has "jsonrpc" and "id" keys.
        # "result" may be null (tx not found) — that is still an answer.
        if "jsonrpc" in resp:
            return resp, rpc_url
    raise RuntimeError(f"no public RPC answered for chain={chain}")


# ---------------------------------------------------------------------------
# Generate mode
# ---------------------------------------------------------------------------


def generate(chain: str, root_sha: str, root_bytes_len: int, fetched_at: str) -> dict:
    """Build the unsigned EVM transaction JSON.

    The data field contains: 0x + prefix("CSOA") + sha256 (32 bytes) = 36 bytes.
    No contract call, no function selector — just bare calldata.

    The owner fills in `from`, sets gas/nonce, signs, and broadcasts.
    """
    # 0x43534f41 + sha256 bytes
    data_hex = "0x" + DATA_PREFIX.hex() + root_sha.lower()

    chain_info = CHAINS[chain]
    tx = {
        "to": "0x0000000000000000000000000000000000000000",
        "value": "0x0",
        "data": data_hex,
        "chainId": hex(chain_info["chain_id"]),
        # Owner fills these:
        "from": "OWNER_ADDRESS",
        "nonce": "OWNER_NONCE",
        "gasPrice": "OWNER_GAS_PRICE",
        "gas": "OWNER_GAS_LIMIT",
    }

    envelope = {
        "_draft": {
            "schema": "csoai.evm-anchor-draft/0.1",
            "status": "UNSIGNED_DRAFT_NOT_BROADCAST",
            "prepared_at": fetched_at,
            "prepared_by": "scripts/anchors/evm_anchor.py (no key, no signing, no submission)",
            "chain": chain,
            "chain_id": chain_info["chain_id"],
            "owner_action": (
                "Owner replaces OWNER_ADDRESS, OWNER_NONCE, OWNER_GAS_PRICE, "
                "OWNER_GAS_LIMIT with real values from their wallet/node, signs, "
                "and broadcasts.  Nothing is on-chain until that happens."
            ),
            "subject": {
                "url": ROOT_URL,
                "fetched_at": fetched_at,
                "sha256": root_sha,
                "bytes": root_bytes_len,
            },
            "data_field_semantics": (
                "The data field contains the bytes 'CSOA' followed by the raw "
                "32-byte sha256 of root.json bytes as served at fetched_at.  "
                "This proves only that the digest was included in a block; "
                "it says nothing about what the bytes mean."
            ),
            "data_layout": {
                "offset_0_4": "0x43534f41 (ASCII 'CSOA', 4-byte prefix)",
                "offset_4_36": f"0x{root_sha} (32-byte sha256)",
                "total_length": "36 bytes",
            },
        },
        "tx": tx,
        "verification": {
            "before_signing": (
                f"curl -s {ROOT_URL} | shasum -a 256   "
                "# must match the last 64 hex chars of tx.data"
            ),
            "after_owner_submits": (
                f"python3 scripts/anchors/evm_anchor.py --verify <TX_HASH> --chain {chain}"
            ),
        },
    }
    return envelope


# ---------------------------------------------------------------------------
# Verify mode
# ---------------------------------------------------------------------------


def verify(tx_hash: str, chain: str) -> int:
    """Verify a submitted EVM anchor.  Exit code: 0 ok, 1 mismatch, 2 error."""
    if chain not in CHAINS:
        print(f"FAIL: unknown chain '{chain}'.  Supported: {', '.join(CHAINS)}", file=sys.stderr)
        return 2

    # 1. Current root hash
    try:
        root_raw = fetch_root_bytes()
    except Exception as exc:
        print(f"FAIL: could not fetch {ROOT_URL}: {exc}", file=sys.stderr)
        return 2
    current_sha = hashlib.sha256(root_raw).hexdigest().lower()
    print(f"  current root.json sha256 : {current_sha}")

    # 2. Fetch tx from public RPC
    try:
        resp, rpc_url = _try_rpcs(chain, "eth_getTransactionByHash", [tx_hash])
    except RuntimeError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 2

    tx_data = resp.get("result")
    if not tx_data:
        print(f"FAIL: tx not found on {chain}", file=sys.stderr)
        return 2

    block_hex = tx_data.get("blockNumber")
    input_data: str = tx_data.get("input", "0x")
    tx_to = tx_data.get("to", "")
    tx_from = tx_data.get("from", "")

    print(f"  rpc          : {rpc_url}")
    print(f"  from         : {tx_from}")
    print(f"  to           : {tx_to}")
    print(f"  blockNumber  : {block_hex or 'pending'}")
    print(f"  input length : {len(input_data)} chars ({(len(input_data) - 2) // 2} bytes)")

    if not block_hex:
        print("FAIL: tx not yet mined", file=sys.stderr)
        return 2

    # 3. Extract hash from data field
    # Expected: 0x + "43534f41" (8 chars) + sha256 (64 chars) = 0x + 72 chars
    if len(input_data) < 74:  # 0x + 72
        print(f"FAIL: input data too short ({len(input_data)} chars) to contain CSOA prefix + hash", file=sys.stderr)
        return 1

    prefix_hex = input_data[2:10].lower()
    if prefix_hex != DATA_PREFIX.hex().lower():
        print(
            f"FAIL: data prefix is 0x{prefix_hex}, expected 0x{DATA_PREFIX.hex().lower()} "
            f"('CSOA')",
            file=sys.stderr,
        )
        return 1

    tx_sha = input_data[10:74].lower()

    if tx_sha == current_sha:
        print(f"PASS: tx data matches current root.json sha256 ({current_sha})")
        explorer = CHAINS[chain]["explorer_tx"] + tx_hash
        print(f"  explorer     : {explorer}")
        return 0
    else:
        print(
            f"NOTE: tx data sha256 ({tx_sha}) does NOT match current root.json ({current_sha}).\n"
            "      This is expected if root.json was updated after the anchor was submitted.\n"
            "      The tx committed to the sha256 at anchor time; current root has moved.",
            file=sys.stderr,
        )
        return 1


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate or verify an EVM anchor for councilof.ai/root.json.",
        epilog="Exit codes: 0=ok, 1=mismatch, 2=usage/network error.",
    )
    parser.add_argument(
        "--chain",
        choices=sorted(CHAINS),
        default="ethereum",
        help="Target chain (default: ethereum).",
    )
    parser.add_argument(
        "--verify",
        metavar="TX_HASH",
        help="Verify a submitted EVM transaction hash against current root.json.",
    )
    parser.add_argument(
        "--output",
        metavar="FILE",
        help="Write generated JSON to FILE instead of stdout.",
    )
    args = parser.parse_args()

    # --- Verify mode ---
    if args.verify:
        return verify(args.verify, args.chain)

    # --- Generate mode ---
    try:
        root_raw = fetch_root_bytes()
    except Exception as exc:
        print(f"FAIL: could not fetch {ROOT_URL}: {exc}", file=sys.stderr)
        return 2

    root_sha = hashlib.sha256(root_raw).hexdigest()
    fetched_at = _utcnow_iso()

    envelope = generate(args.chain, root_sha, len(root_raw), fetched_at)

    output = json.dumps(envelope, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        from pathlib import Path

        Path(args.output).write_text(output, encoding="utf-8")
        print(f"  written to {args.output}")
    else:
        sys.stdout.write(output)

    data_hex = "0x" + DATA_PREFIX.hex() + root_sha
    print(f"  root.json sha256 : {root_sha}", file=sys.stderr)
    print(f"  root.json bytes  : {len(root_raw)}", file=sys.stderr)
    print(f"  chain            : {args.chain}", file=sys.stderr)
    print(f"  data field       : {data_hex}", file=sys.stderr)
    print(f"  fetched_at       : {fetched_at}", file=sys.stderr)
    print("", file=sys.stderr)
    print(
        "  OWNER ACTION: replace OWNER_ADDRESS/OWNER_NONCE/OWNER_GAS_PRICE/"
        "OWNER_GAS_LIMIT, sign, and broadcast.",
        file=sys.stderr,
    )
    return 0


if __name__ == "__main__":
    sys.exit(main())
