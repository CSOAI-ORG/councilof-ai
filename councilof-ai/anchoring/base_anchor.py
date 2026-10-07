#!/usr/bin/env python3
"""
CSOAI Base EAS Anchor
=====================
Prepares an EAS (Ethereum Attestation Service) attestation on Base L2.

This script PREPARES the transaction but does NOT submit it.
Submission requires a funded Base wallet (owner action).

EAS on Base:
- Contract: 0x4200000000000000000000000000000000000021 (EAS)
- Schema: (to be registered — a simple bytes32 schema)
- Cost: ~$0.01 gas on Base L2

Run:
    python3 anchoring/base_anchor.py [--root-hash HASH]
"""

import json
import sys
from datetime import datetime, timezone


def prepare_base_eas(root_hash: str) -> dict:
    """Prepare Base EAS attestation spec."""
    spec = {
        "schema": "csoai.anchor.base-eas-spec/0.1",
        "kind": "eas.attestation",
        "prepared_at": datetime.now(timezone.utc).isoformat(),
        "root_hash": root_hash,
        "network": {
            "chain_id": 8453,
            "name": "Base",
            "eip155": "eip155:8453",
            "rpc": "https://mainnet.base.org",
            "explorer": "https://basescan.org",
        },
        "eas": {
            "contract": "0x4200000000000000000000000000000000000021",
            "schema_uid": "TO_BE_REGISTERED",
            "method": "attest",
            "data": {
                "recipient": "0x0000000000000000000000000000000000000000",
                "expirationTime": 0,
                "revocable": False,
                "refUID": "0x0000000000000000000000000000000000000000000000000000000000000000",
                "data": root_hash,
            },
        },
        "cost": {
            "gas_estimate": "~50,000 gas",
            "gas_price": "~0.001 gwei on Base L2",
            "estimated_usd": "~$0.01",
            "funding_source": "OWNER_BASE_WALLET (not automated)",
        },
        "status": "PREPARED_NOT_SUBMITTED",
        "requires_owner_action": True,
        "owner_action_needed": [
            "1. Fund a Base wallet with ≥$0.05 USDC/ETH",
            "2. Register schema (once): bytes32 root_hash",
            "3. Call attest() with the root hash",
            "4. Record attestation UID in interop/root-witness-latest.json",
        ],
        "x402_integration": {
            "note": "The x402 rail already lives on Base (eip155:8453). "
                    "The EAS attestation uses the same chain as the payment rail.",
            "pay_to": "0x212686404A7D1E1fD88F35eD6200c3aF7A78ae31",
        },
    }
    return spec


def main():
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument("--root-hash", help="Root hash to anchor")
    parser.add_argument("--output", help="Write spec to file")
    args = parser.parse_args()

    root_hash = args.root_hash
    if not root_hash:
        import urllib.request
        import ssl
        import os
        try:
            default = ssl.get_default_verify_paths().cafile
            ctx = ssl.create_default_context() if (default and os.path.exists(default)) else ssl.create_default_context(cafile=__import__("certifi").where())
        except Exception:
            ctx = ssl.create_default_context()
        req = urllib.request.Request("https://councilof.ai/root.json",
                                    headers={"User-Agent": "CSOAI-TUI5/1.0"})
        root = json.loads(urllib.request.urlopen(req, timeout=15, context=ctx).read())
        root_hash = root["merkle_root"]

    spec = prepare_base_eas(root_hash)
    if args.output:
        with open(args.output, "w") as f:
            json.dump(spec, f, indent=2)
    print(json.dumps(spec, indent=2))


if __name__ == "__main__":
    main()
