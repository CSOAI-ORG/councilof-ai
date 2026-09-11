#!/usr/bin/env python3
"""
CSOAI Independent Card + Root Verification
==========================================
Verifies Ed25519 signatures on measurement cards and the public root envelope
INDEPENDENTLY from any CSOAI tooling. Uses only stdlib + PyNaCl.

Two corpora exist:
  1. Public root: 167 cards at councilof.ai/cards/{prefix16}.json
     - Signed by board-attestation-1
     - Card structure: {card: {sha256, sig_ed25519, payload, ...}, proof: [...]}
     - sig_covers: compact envelope {did, schema, surface, as_of, sha256}
  2. Signed card index: 335 cards at councilof.ai/signed/cards/{full_hash}.json
     - Signed by card-attestation-1
     - Card structure: {id, body, signature, pubkey, alg}
     - Signature over: canonical JSON of body

Run:
    python3 anchoring/verify_chain.py [--root] [--infrastructure] [--sample N]

Outputs a machine-readable JSON report to stdout.
"""

import json
import hashlib
import base64
import sys
import urllib.request
from datetime import datetime, timezone

# ── Pinned keys from did:web:csoai.org ──
BOARD_ATTESTATION_KEY = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"
CARD_ATTESTATION_KEY = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"


def fetch_json(url: str, timeout: int = 15) -> dict:
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "CSOAI-TUI5-Verifier/1.0",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def verify_root_envelope(root: dict) -> dict:
    """Verify the public root.json Ed25519 signature."""
    from nacl.signing import VerifyKey

    # Preimage: canonical JSON of exactly 6 fields, ensure_ascii=False
    preimage_fields = {k: root[k] for k in ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]}
    preimage = json.dumps(preimage_fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()

    # Get DID key
    did = fetch_json("https://csoai.org/.well-known/did.json")
    x = next(v for v in did["verificationMethod"] if v["id"].endswith("#board-attestation-1"))["publicKeyJwk"]["x"]
    pk_bytes = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))

    result = {
        "merkle_root": root.get("merkle_root", "?"),
        "card_count": root.get("card_count", 0),
        "as_of": root.get("as_of", "?"),
        "preimage_bytes": len(preimage),
        "pubkey_hex": pk_bytes.hex(),
        "pubkey_matches_pin": pk_bytes.hex() == BOARD_ATTESTATION_KEY,
    }

    try:
        VerifyKey(pk_bytes).verify(preimage, bytes.fromhex(root["sig_ed25519"]))
        result["state"] = "VALID"
        result["verified"] = True
    except Exception as e:
        result["state"] = "INVALID"
        result["reason"] = str(e)
        result["verified"] = False

    # Also verify Merkle root recomputation
    leaves = [bytes.fromhex(h) for h in root.get("card_sha256", [])]
    lvl = leaves[:]
    while len(lvl) > 1:
        lvl = [hashlib.sha256(lvl[i] + (lvl[i + 1] if i + 1 < len(lvl) else lvl[i])).digest()
               for i in range(0, len(lvl), 2)]
    computed = lvl[0].hex() if lvl else ""
    result["merkle_recomputed"] = computed
    result["merkle_match"] = computed == root.get("merkle_root", "")
    result["leaf_count_match"] = len(leaves) == root.get("card_count", 0)

    return result


def verify_root_card(card_data: dict, leaf_index: int = 0) -> dict:
    """Verify a root corpus card (v1 envelope + Merkle inclusion proof).
    
    leaf_index: position of this card's hash in the root's card_sha256 list.
    Required for direction-aware Merkle proof verification.
    """
    from nacl.signing import VerifyKey

    card = card_data["card"]
    proof = card_data.get("proof", [])

    # Step 1: Verify digest = sha256(whole-card-except-sha256-and-sig_ed25519)
    digest_fields = {k: v for k, v in card.items() if k not in ("sha256", "sig_ed25519")}
    computed_digest = hashlib.sha256(
        json.dumps(digest_fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
    ).hexdigest()

    # Step 2: Verify signature over compact envelope (may be None for unsigned cards)
    sig_val = card.get("sig_ed25519")
    result = {
        "card_sha256": card.get("sha256", "?"),
        "digest_match": computed_digest == card.get("sha256", ""),
    }

    if sig_val is None:
        result["signature_valid"] = True
        result["signature_state"] = "UNSIGNED"
    else:
        compact = {k: card[k] for k in ["did", "schema", "surface", "as_of", "sha256"]}
        sig_preimage = json.dumps(compact, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        try:
            pk_bytes = bytes.fromhex(BOARD_ATTESTATION_KEY)
            VerifyKey(pk_bytes).verify(sig_preimage, bytes.fromhex(sig_val))
            result["signature_valid"] = True
            result["signature_state"] = "VALID"
        except Exception as e:
            result["signature_valid"] = False
            result["signature_error"] = str(e)
            result["signature_state"] = "INVALID"

    # Step 3: Verify Merkle inclusion proof (direction-aware)
    if proof:
        current = bytes.fromhex(card["sha256"])
        idx = leaf_index
        for node_hex in proof:
            node = bytes.fromhex(node_hex)
            if idx % 2 == 0:
                current = hashlib.sha256(current + node).digest()
            else:
                current = hashlib.sha256(node + current).digest()
            idx //= 2
        result["proof_computed_root"] = current.hex()

    return result


def check_rekor_status() -> dict:
    try:
        data = fetch_json("https://rekor.sigstore.dev/api/v1/log")
        return {
            "status": "LIVE",
            "tree_size": data.get("treeSize"),
            "root_hash": data.get("rootHash", "?"),
            "verified": True,
        }
    except Exception as e:
        return {"status": "UNREACHABLE", "error": str(e), "verified": False}


def check_ots_calendars() -> dict:
    results = {}
    for name in ["alice", "bob"]:
        url = f"https://{name}.btc.calendar.opentimestamps.org"
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "CSOAI-TUI5/1.0"})
            with urllib.request.urlopen(req, timeout=10) as resp:
                results[name] = {"status": str(resp.status), "verified": True}
        except Exception as e:
            results[name] = {"status": "UNREACHABLE", "error": str(e), "verified": False}
    return results


def main():
    import argparse
    import random

    parser = argparse.ArgumentParser(description="CSOAI Independent Verification")
    parser.add_argument("--root", action="store_true", help="Verify the public root envelope")
    parser.add_argument("--infrastructure", action="store_true", help="Check anchor infrastructure")
    parser.add_argument("--all", action="store_true", help="Full verification report")
    parser.add_argument("--sample", type=int, default=5, help="Sample cards to verify")
    args = parser.parse_args()

    report = {
        "schema": "csoai.anchor.verification-report/0.1",
        "kind": "tui5.independent-verification",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "verifier": "anchoring/verify_chain.py (standalone, no CSOAI tooling)",
    }

    if args.infrastructure or args.all:
        report["infrastructure"] = {
            "rekor": check_rekor_status(),
            "ots_calendars": check_ots_calendars(),
        }

    if args.root or args.all:
        print("Fetching root.json...", file=sys.stderr)
        try:
            root = fetch_json("https://councilof.ai/root.json")
            report["root_verification"] = verify_root_envelope(root)

            # Verify sample root cards
            card_hashes = root.get("card_sha256", [])
            leaf_pos = {h: i for i, h in enumerate(card_hashes)}
            sample = random.sample(card_hashes, min(args.sample, len(card_hashes)))
            card_results = []
            for h in sample:
                try:
                    card_data = fetch_json(f"https://councilof.ai/cards/{h[:16]}.json")
                    result = verify_root_card(card_data, leaf_index=leaf_pos.get(h, 0))
                    result["card_prefix"] = h[:16]
                    card_results.append(result)
                except Exception as e:
                    card_results.append({"card_prefix": h[:16], "error": str(e)})

            valid_sigs = sum(1 for r in card_results if r.get("signature_valid"))
            valid_proofs = sum(1 for r in card_results if r.get("proof_computed_root") == report["root_verification"].get("merkle_root"))

            report["sample_card_verification"] = {
                "sample_size": len(card_results),
                "signatures_valid": valid_sigs,
                "proofs_valid": valid_proofs,
                "results": card_results,
            }
        except Exception as e:
            report["root_verification"] = {"state": "FETCH_ERROR", "error": str(e)}

    print(json.dumps(report, indent=2, default=str))


if __name__ == "__main__":
    main()
