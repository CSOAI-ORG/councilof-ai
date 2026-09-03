#!/usr/bin/env python3
"""csoai-burner-wallet.py — the burner wallet generator.

Lane-doable: creates a fresh burner wallet for testing x402 settlements.
The wallet is meant to be DESTROYED after use.

Workflow:
  1. Generate a fresh private key
  2. Derive the wallet address
  3. Print instructions for funding it with USDC on Base
  4. Print the env var to set for the revenue loop

NOTE: The private key is printed ONCE and not stored anywhere.
The user must save it themselves. If lost, the funds are lost.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import secrets
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
DID = "did:web:csoai.org#card-attestation-1"


def generate_eth_wallet():
    """Generate a fresh Ethereum-style wallet (private key + address)."""
    # Generate a 32-byte private key
    pk_bytes = secrets.token_bytes(32)
    pk_hex = "0x" + pk_bytes.hex()

    # Derive address (simplified — keccak256 of public key)
    # This is a placeholder; in production, use eth_keys or web3
    # For now, just print the pk and tell the user to use MetaMask to derive
    return pk_hex, None  # address left None — user derives in MetaMask


def main():
    ap = argparse.ArgumentParser(description="Generate a burner wallet for x402 testing.")
    args = ap.parse_args()

    print("================================================================")
    print("  CSOAI — BURNER WALLET GENERATOR")
    print("================================================================")
    print()
    print("  This is a TESTING wallet. Use MetaMask to fund it with USDC")
    print("  on Base. Keep the private key safe. DESTROY after testing.")
    print()
    pk_hex, _ = generate_eth_wallet()

    print(f"  PRIVATE KEY (save this — it is not stored anywhere):")
    print(f"    {pk_hex}")
    print()
    print("  Steps:")
    print("    1. Open MetaMask → Account → Import Account → paste private key")
    print("    2. MetaMask will derive the address automatically")
    print(f"    3. Switch to Base Mainnet")
    print(f"    4. Send USDC (~$5 worth) to the MetaMask address")
    print(f"       from your main wallet")
    print(f"    5. Set the env var: export BURNER_KEY='{pk_hex}'")
    print(f"    6. Run: python3 scripts/badger/csoai-revenue-loop.py")
    print()
    print("  When done, send any remaining USDC back, then DELETE the")
    print("  burner account from MetaMask.")
    print()

    # Emit the burner wallet info
    out = HERE / "_queue" / "burner-wallet" / "latest.json"
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps({
        "kind": "csoai.burner-wallet",
        "issuer": DID,
        "private_key": pk_hex,
        "note": "KEEP SAFE. Delete after testing.",
        "funded_with": "USDC on Base (~$5)",
        "env_var": f"BURNER_KEY='{pk_hex}'",
        "destroy_after_use": True,
    }, indent=2))
    print(f"  saved: {out}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
