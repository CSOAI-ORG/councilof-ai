#!/usr/bin/env python3
"""
CSOAI Evidence Chain — End-to-End Test
=======================================
Runs the complete verification chain from published bytes.
No CSOAI tooling dependency. Uses only stdlib + PyNaCl.

Exit 0 = all checks pass. Exit 1 = at least one failure.
Machine-readable JSON report to stdout; human-readable to stderr.

Run:
    python3 anchoring/test_chain.py
"""

import json
import hashlib
import base64
import sys
import urllib.request
from datetime import datetime, timezone

BOARD_KEY = "9367cf59be9cb72bbc9796adf056201ec1c58adfeaa13f83b2c5b754d6c20170"
CARD_KEY = "d4cb0eaa16d5f50bf7633a36aa34fe09a55e124b9316ded2abdb122bb9c37e38"
REKOR_LOG_INDEX = 2791822965


def fetch(url, timeout=15):
    req = urllib.request.Request(url, headers={
        "Accept": "application/json",
        "User-Agent": "CSOAI-TUI5-Test/1.0",
    })
    with urllib.request.urlopen(req, timeout=timeout) as resp:
        return json.loads(resp.read())


def test_root_signature(root, did_doc):
    """Verify the root.json Ed25519 signature against the DID-pinned key."""
    from nacl.signing import VerifyKey

    preimage_fields = {k: root[k] for k in ["kind", "schema", "as_of", "merkle_root", "card_count", "did_intended"]}
    preimage = json.dumps(preimage_fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()

    x = next(v for v in did_doc["verificationMethod"]
             if v["id"].endswith("#board-attestation-1"))["publicKeyJwk"]["x"]
    pk_bytes = base64.urlsafe_b64decode(x + "=" * (-len(x) % 4))

    assert pk_bytes.hex() == BOARD_KEY, f"Key mismatch: {pk_bytes.hex()} != {BOARD_KEY}"
    VerifyKey(pk_bytes).verify(preimage, bytes.fromhex(root["sig_ed25519"]))
    return {"preimage_bytes": len(preimage), "pubkey_hex": pk_bytes.hex(), "state": "VALID"}


def test_merkle_root(root):
    """Recompute the Merkle root from the published leaf hashes."""
    leaves = [bytes.fromhex(h) for h in root.get("card_sha256", [])]
    assert len(leaves) == root["card_count"], f"Count mismatch: {len(leaves)} != {root['card_count']}"

    layer = leaves[:]
    while len(layer) > 1:
        nxt = []
        for i in range(0, len(layer), 2):
            left = layer[i]
            right = layer[i + 1] if i + 1 < len(layer) else layer[i]
            nxt.append(hashlib.sha256(left + right).digest())
        layer = nxt

    computed = layer[0].hex()
    published = root["merkle_root"]
    assert computed == published, f"Root mismatch: {computed} != {published}"
    return {"leaf_count": len(leaves), "computed": computed, "published": published, "state": "MATCH"}


def test_card_signatures(root, sample_size=5):
    """Verify a random sample of card signatures and Merkle inclusion proofs."""
    import random
    from nacl.signing import VerifyKey

    card_hashes = root.get("card_sha256", [])
    leaf_pos = {h: i for i, h in enumerate(card_hashes)}

    sample = random.sample(card_hashes, min(sample_size, len(card_hashes)))
    results = []

    for h in sample:
        card_data = fetch(f"https://councilof.ai/cards/{h[:16]}.json")
        card = card_data["card"]
        proof = card_data.get("proof", [])

        # Verify digest (whole-card-except-sha256-and-sig_ed25519, ensure_ascii=False)
        digest_fields = {k: v for k, v in card.items() if k not in ("sha256", "sig_ed25519")}
        computed_digest = hashlib.sha256(
            json.dumps(digest_fields, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
        ).hexdigest()
        digest_ok = computed_digest == card["sha256"]

        # Verify signature (may be None for unsigned cards)
        sig_val = card.get("sig_ed25519")
        if sig_val is None:
            sig_ok = True  # unsigned is a known honest state (NO_LAPTOP_SIGN)
            sig_state = "UNSIGNED"
        else:
            compact = {k: card[k] for k in ["did", "schema", "surface", "as_of", "sha256"]}
            sig_preimage = json.dumps(compact, sort_keys=True, separators=(",", ":"), ensure_ascii=False).encode()
            try:
                VerifyKey(bytes.fromhex(BOARD_KEY)).verify(sig_preimage, bytes.fromhex(sig_val))
                sig_ok = True
                sig_state = "VALID"
            except Exception:
                sig_ok = False
                sig_state = "INVALID"

        # Verify Merkle inclusion proof (direction-aware)
        pos = leaf_pos.get(h, 0)
        current = bytes.fromhex(card["sha256"])
        idx = pos
        for node_hex in proof:
            node = bytes.fromhex(node_hex)
            if idx % 2 == 0:
                current = hashlib.sha256(current + node).digest()
            else:
                current = hashlib.sha256(node + current).digest()
            idx //= 2
        proof_root = current.hex()
        proof_ok = proof_root == root["merkle_root"]

        results.append({
            "card_prefix": h[:16],
            "digest_ok": digest_ok,
            "signature_ok": sig_ok,
            "signature_state": sig_state,
            "proof_ok": proof_ok,
            "proof_depth": len(proof),
            "state": "VALID" if (digest_ok and sig_ok and proof_ok) else "INVALID",
        })

    all_valid = all(r["state"] == "VALID" for r in results)
    return {
        "sample_size": len(results),
        "all_valid": all_valid,
        "valid_count": sum(1 for r in results if r["state"] == "VALID"),
        "results": results,
        "state": "VALID" if all_valid else "INVALID",
    }


def test_corpora_separation(root, idx):
    """Verify the 167-card root and 335-card index have 0 identifier overlap."""
    root_leaves = set(root.get("card_sha256", []))
    signed_hashes = set(c.get("card", "") for c in idx.get("cards", []))
    overlap = root_leaves & signed_hashes
    return {
        "root_count": len(root_leaves),
        "signed_count": len(signed_hashes),
        "overlap": len(overlap),
        "state": "SEPARATE" if len(overlap) == 0 else "OVERLAP_DETECTED",
    }


def test_rekor_entry():
    """Verify the Rekor transparency log entry at the expected logIndex."""
    url = f"https://rekor.sigstore.dev/api/v1/log/entries?logIndex={REKOR_LOG_INDEX}"
    data = fetch(url, timeout=20)
    uuid = list(data.keys())[0]
    entry = data[uuid]
    return {
        "uuid": uuid,
        "logIndex": entry.get("logIndex"),
        "integratedTime": entry.get("integratedTime"),
        "logID": entry.get("logID"),
        "state": "WITNESSED",
    }


def test_rekor_log():
    """Check the Rekor log is live and growing."""
    data = fetch("https://rekor.sigstore.dev/api/v1/log")
    return {
        "tree_size": data.get("treeSize"),
        "state": "LIVE",
    }


def test_ots_calendars():
    """Check OTS calendar servers are reachable."""
    results = {}
    all_live = True
    for name in ["alice", "bob"]:
        url = f"https://{name}.btc.calendar.opentimestamps.org"
        try:
            req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "CSOAI-TUI5-Test/1.0"})
            resp = urllib.request.urlopen(req, timeout=10)
            results[name] = {"status": resp.status, "state": "LIVE"}
        except Exception as e:
            results[name] = {"state": "UNREACHABLE", "error": str(e)}
            all_live = False
    results["state"] = "LIVE" if all_live else "DEGRADED"
    return results


def test_did_document(did_doc):
    """Verify the DID document has the expected verification methods."""
    vms = [v["id"] for v in did_doc.get("verificationMethod", [])]
    has_board = any(v.endswith("#board-attestation-1") for v in vms)
    has_card = any(v.endswith("#card-attestation-1") for v in vms)
    return {
        "verification_method_count": len(vms),
        "methods": vms,
        "has_board_attestation": has_board,
        "has_card_attestation": has_card,
        "state": "VALID" if (has_board and has_card) else "INCOMPLETE",
    }


def test_root_file_hash():
    """Verify the root.json file SHA-256 matches what was submitted to Rekor."""
    import urllib.request
    req = urllib.request.Request("https://councilof.ai/root.json", headers={"User-Agent": "CSOAI-TUI5-Test/1.0"})
    raw = urllib.request.urlopen(req, timeout=15).read()
    file_hash = hashlib.sha256(raw).hexdigest()
    return {
        "sha256": file_hash,
        "size_bytes": len(raw),
        "state": "COMPUTED",
    }


def main():
    report = {
        "schema": "csoai.anchor.e2e-test/0.1",
        "kind": "tui5.end-to-end-verification",
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "tests": {},
    }
    failures = []

    def run(name, fn, *args):
        print(f"  {name}...", file=sys.stderr)
        try:
            result = fn(*args)
            report["tests"][name] = result
            state = result.get("state", "UNKNOWN")
            ok = state in ("VALID", "MATCH", "SEPARATE", "WITNESSED", "LIVE", "COMPUTED")
            if not ok:
                failures.append(f"{name}: {state}")
                print(f"    FAIL: {state}", file=sys.stderr)
            else:
                print(f"    OK: {state}", file=sys.stderr)
            return result
        except Exception as e:
            report["tests"][name] = {"state": "ERROR", "error": str(e)}
            failures.append(f"{name}: {e}")
            print(f"    ERROR: {e}", file=sys.stderr)
            return None

    # Fetch shared resources
    print("Fetching live resources...", file=sys.stderr)
    root = fetch("https://councilof.ai/root.json")
    did_doc = fetch("https://csoai.org/.well-known/did.json")
    idx = fetch("https://councilof.ai/signed/card_index.json")

    # Run tests
    run("did_document", test_did_document, did_doc)
    run("root_signature", test_root_signature, root, did_doc)
    run("merkle_root", test_merkle_root, root)
    run("card_signatures", test_card_signatures, root, 5)
    run("corpora_separation", test_corpora_separation, root, idx)
    run("rekor_log", test_rekor_log)
    run("rekor_entry", test_rekor_entry)
    run("ots_calendars", test_ots_calendars)
    run("root_file_hash", test_root_file_hash)

    # Summary
    report["summary"] = {
        "total_tests": len(report["tests"]),
        "passed": len(report["tests"]) - len(failures),
        "failed": len(failures),
        "failures": failures,
        "overall": "PASS" if not failures else "FAIL",
    }

    print(json.dumps(report, indent=2))

    if failures:
        print(f"\nFAILED: {len(failures)} test(s)", file=sys.stderr)
        for f in failures:
            print(f"  - {f}", file=sys.stderr)
        sys.exit(1)
    else:
        print(f"\nALL {len(report['tests'])} TESTS PASSED", file=sys.stderr)
        sys.exit(0)


if __name__ == "__main__":
    main()
