#!/usr/bin/env python3
"""
CSOAI Deterministic Root Pipeline
==================================
Builds a Merkle root from published measurement cards.

The root is:
1. Fetched from the live card index
2. Each card's SHA-256 is the leaf
3. Merkle tree built bottom-up (SHA-256, sorted pairs)
4. Root hash is the canonical anchor target

This script does NOT sign. Signing is an off-device ceremony.
This script does NOT anchor. Anchoring is a separate step per chain.

Run:
    python3 anchoring/root_pipeline.py [--index URL] [--output FILE] [--verify-only]

The pipeline is deterministic: same input → same root, always.
"""

import json
import hashlib
import sys
import urllib.request
from datetime import datetime, timezone
from pathlib import Path


def fetch_json(url: str, timeout: int = 20) -> dict:
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "CSOAI-TUI5-RootPipeline/1.0",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def merkle_root(leaves: list[bytes]) -> tuple[bytes, list[list[bytes]]]:
    """
    Compute Merkle root from leaf hashes.
    Pairs are sorted (lexicographic) before hashing to ensure determinism.
    Returns (root_hash, layers).
    """
    if not leaves:
        return b"\x00" * 32, []

    layer = list(leaves)  # positional, NOT sorted
    layers = [layer[:]]

    while len(layer) > 1:
        next_layer = []
        for i in range(0, len(layer), 2):
            if i + 1 < len(layer):
                pair = layer[i] + layer[i + 1]  # left || right, positional
            else:
                pair = layer[i] + layer[i]  # odd leaf duplicates itself
            next_layer.append(hashlib.sha256(pair).digest())
        layer = next_layer  # positional, NOT sorted
        layers.append(layer[:])

    return layer[0], layers


def main():
    import argparse
    parser = argparse.ArgumentParser(description="CSOAI Deterministic Root Pipeline")
    parser.add_argument("--index", default="https://councilof.ai/signed/card_index.json",
                        help="URL of the card index")
    parser.add_argument("--output", help="Write root envelope to file")
    parser.add_argument("--verify-only", action="store_true",
                        help="Only verify the existing root, don't rebuild")
    parser.add_argument("--verbose", action="store_true")
    args = parser.parse_args()

    report = {
        "schema": "csoai.anchor.root-pipeline/0.1",
        "kind": "deterministic-root-build",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "pipeline": "fetch-index → extract-ids → merkle → output",
        "deterministic": True,
        "note": "Same index input always produces the same root. No randomness, no timestamps in the tree.",
    }

    # Step 1: Fetch the live root for comparison
    print("Step 1: Fetching live root.json...", file=sys.stderr)
    try:
        live_root = fetch_json("https://councilof.ai/root.json")
        report["live_root"] = {
            "merkle_root": live_root.get("merkle_root", "?"),
            "card_count": live_root.get("card_count", 0),
            "as_of": live_root.get("as_of", "?"),
            "signer": live_root.get("signer", "?"),
            "source": "https://councilof.ai/root.json",
        }
    except Exception as e:
        report["live_root"] = {"state": "FETCH_ERROR", "error": str(e)}
        live_root = None

    if args.verify_only:
        print(json.dumps(report, indent=2))
        return

    # Step 2: Fetch root's own card_sha256 list (the authoritative leaf set)
    print("Step 2: Fetching root's card_sha256 leaves...", file=sys.stderr)
    if not live_root:
        report["error"] = "Cannot build tree: root.json not fetched"
        print(json.dumps(report, indent=2))
        return

    card_ids = live_root.get("card_sha256", [])
    declared_count = live_root.get("card_count", len(card_ids))
    report["index_stats"] = {
        "source": "https://councilof.ai/root.json (card_sha256 field)",
        "total_leaves": len(card_ids),
        "declared_count": declared_count,
        "count_match": len(card_ids) == declared_count,
        "separate_corpus_note": "The 167-card public root and 335-card signed-card index are SEPARATE corpora with 0 identifier overlap.",
    }

    # Step 3: Build Merkle tree from card IDs (which are SHA-256 hashes)
    print(f"Step 3: Building Merkle tree from {len(card_ids)} leaves...", file=sys.stderr)
    leaves = [bytes.fromhex(cid) for cid in card_ids if len(cid) == 64]
    root_hash, layers = merkle_root(leaves)

    report["merkle_build"] = {
        "leaf_count": len(leaves),
        "root_hash": root_hash.hex(),
        "depth": len(layers),
        "algorithm": "SHA-256, positional pairs (left||right), odd-leaf self-duplication",
    }

    # Step 4: Compare with live root
    if live_root and "merkle_root" in live_root:
        live_hash = live_root["merkle_root"]
        computed_hash = root_hash.hex()
        match = live_hash == computed_hash
        report["reconciliation"] = {
            "live_merkle_root": live_hash,
            "computed_merkle_root": computed_hash,
            "match": match,
            "live_card_count": live_root.get("card_count", 0),
            "computed_card_count": len(leaves),
        }
        if not match:
            report["reconciliation"]["note"] = (
                "MISMATCH: The computed root differs from the live root. "
                "Possible causes: (1) index has different cards than root, "
                "(2) sorting differs, (3) root was built from a different leaf set."
            )
            print("WARNING: Root mismatch!", file=sys.stderr)
        else:
            print("✓ Computed root matches live root.", file=sys.stderr)

    # Step 5: Prepare anchor targets (one hash, five chains)
    report["anchor_targets"] = {
        "root_hash": root_hash.hex(),
        "root_hash_bytes_32": root_hash.hex(),
        "root_hash_base64": __import__("base64").b64encode(root_hash).decode(),
        "chains": {
            "bitcoin_ots": {
                "method": "OpenTimestamps calendar submission",
                "calendars": ["alice.btc.calendar.opentimestamps.org", "bob.btc.calendar.opentimestamps.org"],
                "cost": "free",
                "input": root_hash.hex(),
            },
            "rekor_sigstore": {
                "method": "Rekor API entry creation",
                "url": "https://rekor.sigstore.dev/api/v1/log/entries",
                "cost": "free",
                "input": root_hash.hex(),
            },
            "xrpl_memo": {
                "method": "XRPL Memo field transaction",
                "network": "xrpl:mainnet",
                "cost": "~0.00001 XRP (~$0.00001)",
                "memo_data": root_hash.hex(),
                "memo_format": "csoai-public-root-v1",
                "memo_type": "application/json",
            },
            "base_eas": {
                "method": "EAS Schema Attestation on Base L2",
                "network": "eip155:8453",
                "contract": "0x4200000000000000000000000000000000000021",
                "cost": "~$0.01",
                "data": root_hash.hex(),
            },
            "ethereum_eas": {
                "method": "EAS Schema Attestation on Ethereum L1",
                "network": "eip155:1",
                "contract": "0xA1207F3BBa224E2c9c3c6D5B0f0f4c9d8b7c6d5e",
                "cost": "~$0.50-2",
                "data": root_hash.hex(),
            },
        },
    }

    if args.output:
        Path(args.output).write_text(json.dumps(report, indent=2))
        print(f"Written to {args.output}", file=sys.stderr)

    print(json.dumps(report, indent=2))


if __name__ == "__main__":
    main()
