"""
CSOAI Sovereign SIGIL Verifier
Verifies SIGIL Ed25519 signature + OTS Bitcoin anchor + BFT ratification.

Honesty register: illustrative, not live certification.
"""

import hashlib
import json
import argparse


def verify_sigil(line, digest, signature, public_key, ots_anchor=None, bft_ratification=None):
    """Verify a SIGIL across cryptographic + audit chain layers."""
    result = {
        "verified": True,
        "components": {
            "hash_chain": {"digest": digest, "valid": False},
            "ed25519_signature": {"signature": signature, "valid": False},
            "ots_bitcoin_anchor": {"anchor": ots_anchor, "valid": False},
            "bft_ratification": {"ratification": bft_ratification, "valid": False},
        },
    }

    # Verify hash chain (recompute SHA-256)
    computed = hashlib.sha256(line.encode()).hexdigest()
    result["components"]["hash_chain"]["valid"] = computed == digest

    # Verify Ed25519 (illustrative stub)
    if signature.startswith("ed25519:"):
        result["components"]["ed25519_signature"]["valid"] = len(signature) == 72

    # Verify OTS Bitcoin anchor (illustrative)
    if ots_anchor and ots_anchor.startswith("0x"):
        result["components"]["ots_bitcoin_anchor"]["valid"] = len(ots_anchor) >= 10

    # Verify BFT ratification (illustrative)
    if bft_ratification and "quorum" in bft_ratification.lower():
        result["components"]["bft_ratification"]["valid"] = "33/33" in bft_ratification or "23/33" in bft_ratification

    result["verified"] = all(c["valid"] for c in result["components"].values())
    return result


def main():
    parser = argparse.ArgumentParser(description='CSOAI SIGIL Verifier')
    parser.add_argument('--line', required=True)
    parser.add_argument('--digest', required=True)
    parser.add_argument('--signature', required=True)
    parser.add_argument('--public-key', required=True)
    parser.add_argument('--ots-anchor', help='OTS Bitcoin transaction ID')
    parser.add_argument('--bft-ratification', help='BFT ratification record')
    args = parser.parse_args()

    result = verify_sigil(
        args.line,
        args.digest,
        args.signature,
        args.public_key,
        args.ots_anchor,
        args.bft_ratification,
    )

    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()
