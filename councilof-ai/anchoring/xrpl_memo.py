#!/usr/bin/env python3
"""
CSOAI XRPL Memo Anchor
=======================
Prepares an XRPL memo transaction to anchor the root hash on the XRPL ledger.

This script PREPARES the transaction but does NOT submit it.
Submission requires a funded XRPL account (owner action).

Run:
    python3 anchoring/xrpl_memo.py [--root-hash HASH]

Output: JSON transaction specification ready for signing.
"""

import json
import hashlib
import sys
from datetime import datetime, timezone


def prepare_xrpl_memo(root_hash: str, root_url: str = "https://councilof.ai/root.json") -> dict:
    """
    Prepare an XRPL memo transaction spec for anchoring a root hash.
    
    XRPL Memo format:
    - MemoData: hex-encoded root hash (64 hex chars = 32 bytes)
    - MemoFormat: hex-encoded "csoai-public-root-v1"
    - MemoType: hex-encoded "application/json"
    
    Cost: ~0.00001 XRP (negligible)
    """
    memo_data = root_hash.encode("utf-8").hex()
    memo_format = "csoai-public-root-v1".encode("utf-8").hex()
    memo_type = "application/json".encode("utf-8").hex()

    tx_spec = {
        "schema": "csoai.anchor.xrpl-memo-spec/0.1",
        "kind": "xrpl.memo.anchor",
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "transaction": {
            "TransactionType": "Payment",
            "Destination": "rHb9CJAWyB4rj91VRWn96DkukG4bwdtyTh",  # XRPL genesis account (burn)
            "Amount": "1",  # 1 drop (0.000001 XRP)
            "Memos": [
                {
                    "Memo": {
                        "MemoData": memo_data,
                        "MemoFormat": memo_format,
                        "MemoType": memo_type,
                    }
                }
            ],
        },
        "decoded_memo": {
            "root_hash": root_hash,
            "format": "csoai-public-root-v1",
            "content_type": "application/json",
            "root_url": root_url,
        },
        "cost": {
            "amount": "1 drop + fee",
            "estimated_total_xrp": "~0.000012 XRP",
            "estimated_total_usd": "~$0.00001",
            "funding_source": "OWNER_XRPL_ACCOUNT (not automated)",
        },
        "network": {
            "name": "XRP Ledger Mainnet",
            "chain_id": "xrpl:mainnet",
            "explorer": "https://xrpscan.com",
        },
        "verification": {
            "after_submission": "Search XRPL for memo containing root hash hex",
            "command": f"xrpscan.com search: {root_hash[:16]}...",
        },
        "status": "PREPARED_NOT_SUBMITTED",
        "requires_owner_action": True,
        "owner_action_needed": [
            "1. Fund an XRPL account with ≥0.01 XRP",
            "2. Sign this transaction with the account's secret key",
            "3. Submit to XRPL mainnet",
            "4. Record the transaction hash in interop/root-witness-latest.json",
        ],
    }

    return tx_spec


def main():
    import argparse
    parser = argparse.ArgumentParser(description="CSOAI XRPL Memo Anchor Preparation")
    parser.add_argument("--root-hash", help="Root hash to anchor (default: fetch from live root)")
    parser.add_argument("--output", help="Write spec to file")
    args = parser.parse_args()

    root_hash = args.root_hash
    if not root_hash:
        import urllib.request
        req = urllib.request.Request("https://councilof.ai/root.json",
                                    headers={"User-Agent": "CSOAI-TUI5/1.0"})
        root = json.loads(urllib.request.urlopen(req, timeout=15).read())
        root_hash = root["merkle_root"]
        print(f"Fetched live root hash: {root_hash}", file=sys.stderr)

    spec = prepare_xrpl_memo(root_hash)

    if args.output:
        with open(args.output, "w") as f:
            json.dump(spec, f, indent=2)
        print(f"Written to {args.output}", file=sys.stderr)

    print(json.dumps(spec, indent=2))


if __name__ == "__main__":
    main()
