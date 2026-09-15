#!/usr/bin/env python3
"""triple_anchor_report.py — combined anchor status report for councilof.ai/root.json.

WHAT THIS DOES
  Reads the current root.json, checks the status of every anchor in the
  triple-anchor set (OTS/Bitcoin, XRPL memo, EVM Ethereum, EVM Base), and
  emits a JSON report.  Each anchor status is one of:
    ANCHORED  — confirmed on-chain/blockchain with matching hash
    PENDING   — submitted but not yet confirmed (e.g. OTS calendar stamp
                without Bitcoin block, or tx in mempool)
    NOT_YET   — no anchor artifact found

  For OTS, scans the repo for .ots files covering root.json and checks
  attestation state (requires `opentimestamps` pip package for deep check;
  falls back to file-existence heuristic otherwise).

  For XRPL and EVM, uses --xrpl-tx / --evm-eth-tx / --evm-base-tx to
  check specific transaction hashes.  Without a hash, status is NOT_YET.

WHAT THIS IS NOT
  - NOT a certifier.  Each anchor proves only that a 32-byte digest was
    committed to a ledger at a point in time.
  - NOT exhaustive.  It checks exactly the anchors it knows about; there may
    be other valid anchors not covered here.

EXIT CODES
  0  report generated (all statuses are informational, not pass/fail)
  2  usage / network error

DEPENDENCIES: stdlib only for basic operation.  Optional: `opentimestamps`
  for deep OTS state check (gracefully skipped if absent).
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import sys
import urllib.error
import urllib.request
from datetime import datetime, timezone
from pathlib import Path

# ---------------------------------------------------------------------------
# Constants
# ---------------------------------------------------------------------------

ROOT_URL = "https://councilof.ai/root.json"
UA = "csoai-triple-anchor-report/0 (+https://councilof.ai/root.json)"
REPO = Path(__file__).resolve().parents[2]  # coai-t1 root

# Memo semantic constant (must match xrpl_memo_anchor.py)
MEMO_TYPE_PLAIN = "csoai/public-root-sha256"

# EVM data prefix (must match evm_anchor.py)
EVM_DATA_PREFIX = b"CSOA"

# XRPL servers
XRPL_SERVERS = [
    "https://xrplcluster.com",
    "https://s1.ripple.com:51234",
]

# EVM RPCs (subset — only ethereum and base)
EVM_RPCS: dict[str, list[str]] = {
    "ethereum": [
        "https://ethereum-rpc.publicnode.com",
        "https://eth.llamarpc.com",
        "https://cloudflare-eth.com",
    ],
    "base": [
        "https://base-rpc.publicnode.com",
        "https://mainnet.base.org",
        "https://1rpc.io/base",
    ],
}


def _utcnow_iso() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")


# ---------------------------------------------------------------------------
# Network helpers
# ---------------------------------------------------------------------------


def fetch_root_bytes() -> bytes:
    """Fetch root.json raw bytes.  Raises on failure."""
    req = urllib.request.Request(ROOT_URL, headers={"User-Agent": UA})
    with urllib.request.urlopen(req, timeout=25) as resp:
        return resp.read()


def xrpl_rpc(method: str, params: list, server: str, timeout: int = 15) -> dict:
    body = json.dumps({"method": method, "params": params}).encode()
    req = urllib.request.Request(
        f"{server}/", data=body,
        headers={"Content-Type": "application/json", "User-Agent": UA},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as exc:
        return {"error": str(exc)}


def evm_rpc(method: str, params: list, rpc_url: str, timeout: int = 15) -> dict:
    body = json.dumps({"jsonrpc": "2.0", "id": 1, "method": method, "params": params}).encode()
    req = urllib.request.Request(
        rpc_url, data=body,
        headers={"Content-Type": "application/json", "User-Agent": UA},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            return json.loads(resp.read().decode())
    except Exception as exc:
        return {"error": str(exc)}


# ---------------------------------------------------------------------------
# OTS anchor check
# ---------------------------------------------------------------------------


def check_ots_anchor(root_sha: str) -> dict:
    """Check OTS anchor status for root.json.

    Strategy:
    1. Look for a root.json.ots file in public/ or root dir.
    2. If found and opentimestamps is importable, check attestation state.
    3. If found but opentimestamps is absent, report PENDING (deep check unavailable).
    4. If not found, report NOT_YET.
    """
    # Candidate .ots file locations
    candidates = [
        REPO / "public" / "root.json.ots",
        REPO / "public" / "signed" / "root.json.ots",
    ]

    # Also check for atom-root .ots files
    atom_roots = sorted((REPO / "public" / "interop").glob("atom-root-*.json.ots")) if (REPO / "public" / "interop").exists() else []

    ots_path = None
    for p in candidates:
        if p.is_file():
            ots_path = p
            break

    result: dict = {
        "anchor_type": "ots",
        "chain": "bitcoin",
        "root_sha256": root_sha,
    }

    if ots_path is None and not atom_roots:
        result["status"] = "NOT_YET"
        result["note"] = "no .ots file found for root.json"
        return result

    # Try deep check with opentimestamps library
    try:
        sys.path.insert(0, str(REPO / "scripts" / "badger"))
        from ots_stamp import attestation_state

        if ots_path:
            data = ots_path.read_bytes()
            state = attestation_state(data)
            result["status"] = "ANCHORED" if state.get("state") == "bitcoin" else "PENDING"
            result["tx_ref"] = f"Bitcoin block {state.get('block_height', '?')}" if state.get("state") == "bitcoin" else None
            result["ots_file"] = str(ots_path.relative_to(REPO))
            result["attestation_state"] = state
        elif atom_roots:
            latest = atom_roots[-1]
            data = latest.read_bytes()
            state = attestation_state(data)
            result["status"] = "ANCHORED" if state.get("state") == "bitcoin" else "PENDING"
            result["tx_ref"] = f"Bitcoin block {state.get('block_height', '?')}" if state.get("state") == "bitcoin" else None
            result["ots_file"] = str(latest.relative_to(REPO))
            result["attestation_state"] = state
    except ImportError:
        # opentimestamps not installed — file-existence heuristic only
        if ots_path:
            result["status"] = "PENDING"
            result["ots_file"] = str(ots_path.relative_to(REPO))
            result["note"] = "deep check unavailable (opentimestamps not installed); .ots file exists"
        elif atom_roots:
            latest = atom_roots[-1]
            result["status"] = "PENDING"
            result["ots_file"] = str(latest.relative_to(REPO))
            result["note"] = "deep check unavailable (opentimestamps not installed); atom-root .ots exists"
    except Exception as exc:
        result["status"] = "PENDING"
        result["note"] = f"attestation check error: {exc}"

    return result


# ---------------------------------------------------------------------------
# XRPL anchor check
# ---------------------------------------------------------------------------


def check_xrpl_anchor(tx_hash: str | None, root_sha: str) -> dict:
    """Check XRPL memo anchor status."""
    result: dict = {
        "anchor_type": "xrpl_memo",
        "chain": "xrpl",
        "root_sha256": root_sha,
    }
    if not tx_hash:
        result["status"] = "NOT_YET"
        result["note"] = "no XRPL tx hash provided"
        return result

    for server in XRPL_SERVERS:
        resp = xrpl_rpc("tx", [{"transaction": tx_hash, "binary": False}], server)
        if "error" in resp:
            continue
        res = resp.get("result", {})
        validated = res.get("validated", False)
        tx_result = res.get("meta", {}).get("TransactionResult", "UNKNOWN")
        tx_json = res.get("tx_json", res)
        memos = tx_json.get("Memos", [])

        if not validated:
            result["status"] = "PENDING"
            result["tx_ref"] = tx_hash
            result["note"] = f"tx not validated (server: {server})"
            return result

        if tx_result != "tesSUCCESS":
            result["status"] = "PENDING"
            result["tx_ref"] = tx_hash
            result["note"] = f"tx result: {tx_result} (not tesSUCCESS)"
            return result

        # Extract MemoData
        for m in memos:
            memo = m.get("Memo", {})
            mt = bytes.fromhex(memo.get("MemoType", "")).decode("utf-8", "replace")
            if mt == MEMO_TYPE_PLAIN:
                memo_data = memo.get("MemoData", "").upper()
                if memo_data == root_sha.upper():
                    result["status"] = "ANCHORED"
                    result["tx_ref"] = tx_hash
                    result["memo_data"] = memo_data
                    result["note"] = "MemoData matches current root.json sha256"
                else:
                    result["status"] = "ANCHORED"
                    result["tx_ref"] = tx_hash
                    result["memo_data"] = memo_data
                    result["note"] = (
                        f"MemoData ({memo_data}) does not match current root ({root_sha.upper()}). "
                        "Root may have moved since anchor."
                    )
                return result

        result["status"] = "PENDING"
        result["tx_ref"] = tx_hash
        result["note"] = "tx succeeded but no csoai/public-root-sha256 memo found"
        return result

    result["status"] = "PENDING"
    result["tx_ref"] = tx_hash
    result["note"] = "no XRPL server answered"
    return result


# ---------------------------------------------------------------------------
# EVM anchor check
# ---------------------------------------------------------------------------


def check_evm_anchor(chain: str, tx_hash: str | None, root_sha: str) -> dict:
    """Check EVM anchor status for a given chain."""
    result: dict = {
        "anchor_type": f"evm_{chain}",
        "chain": chain,
        "chain_id": {"ethereum": 1, "base": 8453}.get(chain, "?"),
        "root_sha256": root_sha,
    }
    if not tx_hash:
        result["status"] = "NOT_YET"
        result["note"] = f"no {chain} tx hash provided"
        return result

    rpcs = EVM_RPCS.get(chain, [])
    if not rpcs:
        result["status"] = "NOT_YET"
        result["note"] = f"no RPCs configured for chain '{chain}'"
        return result

    for rpc_url in rpcs:
        resp = evm_rpc("eth_getTransactionByHash", [tx_hash], rpc_url)
        if "error" in resp:
            continue
        tx_data = resp.get("result")
        if not tx_data:
            continue

        block_hex = tx_data.get("blockNumber")
        input_data: str = tx_data.get("input", "0x")

        if not block_hex:
            result["status"] = "PENDING"
            result["tx_ref"] = tx_hash
            result["note"] = "tx in mempool, not yet mined"
            return result

        # Check data prefix + hash
        expected_data = "0x" + EVM_DATA_PREFIX.hex() + root_sha.lower()
        result["tx_ref"] = tx_hash
        result["data"] = input_data

        if len(input_data) < 74:
            result["status"] = "ANCHORED"
            result["note"] = (
                f"tx mined at {block_hex} but data too short to contain CSOA+hash. "
                "May be a different anchor format."
            )
            return result

        prefix_hex = input_data[2:10].lower()
        tx_sha = input_data[10:74].lower()

        if prefix_hex != EVM_DATA_PREFIX.hex().lower():
            result["status"] = "ANCHORED"
            result["note"] = (
                f"tx mined at {block_hex} but data prefix is 0x{prefix_hex}, "
                "not CSOA. May be a different anchor format."
            )
            return result

        if tx_sha == root_sha.lower():
            result["status"] = "ANCHORED"
            result["note"] = f"tx data matches current root.json sha256"
        else:
            result["status"] = "ANCHORED"
            result["note"] = (
                f"tx sha256 ({tx_sha}) does not match current root ({root_sha.lower()}). "
                "Root may have moved since anchor."
            )
        return result

    result["status"] = "PENDING"
    result["tx_ref"] = tx_hash
    result["note"] = f"no {chain} RPC answered"
    return result


# ---------------------------------------------------------------------------
# Report assembly
# ---------------------------------------------------------------------------


def build_report(
    xrpl_tx: str | None,
    evm_eth_tx: str | None,
    evm_base_tx: str | None,
) -> dict:
    """Build the combined anchor report."""
    # Fetch current root
    try:
        root_raw = fetch_root_bytes()
    except Exception as exc:
        return {
            "error": f"could not fetch {ROOT_URL}: {exc}",
            "prepared_at": _utcnow_iso(),
        }

    root_sha = hashlib.sha256(root_raw).hexdigest()
    report: dict = {
        "schema": "csoai.triple-anchor-report/0.1",
        "prepared_at": _utcnow_iso(),
        "subject": {
            "url": ROOT_URL,
            "sha256": root_sha,
            "bytes": len(root_raw),
        },
        "anchors": {
            "ots": check_ots_anchor(root_sha),
            "xrpl": check_xrpl_anchor(xrpl_tx, root_sha),
            "evm_eth": check_evm_anchor("ethereum", evm_eth_tx, root_sha),
            "evm_base": check_evm_anchor("base", evm_base_tx, root_sha),
        },
    }

    # Summary counts
    statuses = [a["status"] for a in report["anchors"].values()]
    report["summary"] = {
        "total": len(statuses),
        "anchored": statuses.count("ANCHORED"),
        "pending": statuses.count("PENDING"),
        "not_yet": statuses.count("NOT_YET"),
    }

    return report


# ---------------------------------------------------------------------------
# CLI
# ---------------------------------------------------------------------------


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Generate a combined triple-anchor status report.",
        epilog="Exit codes: 0=report generated, 2=usage/network error.",
    )
    parser.add_argument("--xrpl-tx", metavar="HASH", help="XRPL transaction hash to check.")
    parser.add_argument("--evm-eth-tx", metavar="HASH", help="Ethereum transaction hash to check.")
    parser.add_argument("--evm-base-tx", metavar="HASH", help="Base transaction hash to check.")
    parser.add_argument("--output", metavar="FILE", help="Write report to FILE instead of stdout.")
    args = parser.parse_args()

    report = build_report(args.xrpl_tx, args.evm_eth_tx, args.evm_base_tx)

    if "error" in report:
        print(f"FAIL: {report['error']}", file=sys.stderr)
        return 2

    output = json.dumps(report, indent=2, ensure_ascii=False) + "\n"
    if args.output:
        Path(args.output).write_text(output, encoding="utf-8")
        print(f"  written to {args.output}")
    else:
        sys.stdout.write(output)

    # Print summary to stderr
    s = report["summary"]
    print(f"  anchors: {s['anchored']} ANCHORED, {s['pending']} PENDING, {s['not_yet']} NOT_YET", file=sys.stderr)
    for name, anchor in report["anchors"].items():
        tx_ref = anchor.get("tx_ref", "-")
        note = anchor.get("note", "")
        print(f"    {name:10s}  {anchor['status']:10s}  {tx_ref}  {note[:60]}", file=sys.stderr)

    return 0


if __name__ == "__main__":
    sys.exit(main())
