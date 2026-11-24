#!/usr/bin/env python3
"""Synthetic-only negative controls for public root cryptographic readback."""
import base64
import hashlib
import importlib.util
import json
import pathlib
import unittest

from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey
from cryptography.hazmat.primitives import serialization

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("readback", HERE / "verify_root_readback.py")
readback = importlib.util.module_from_spec(spec)
spec.loader.exec_module(readback)


def proof_for(leaves, idx):
    siblings, level, at = [], [bytes.fromhex(h) for h in leaves], idx
    while len(level) > 1:
        if len(level) % 2:
            level.append(level[-1])
        siblings.append(level[at ^ 1].hex())
        level = [hashlib.sha256(level[i] + level[i + 1]).digest()
                 for i in range(0, len(level), 2)]
        at //= 2
    return {"sha256": leaves[idx], "index": idx, "card_count": len(leaves),
            "merkle_root": readback.compute_merkle(leaves), "proof": siblings}


def fixture():
    private = Ed25519PrivateKey.generate()
    public = private.public_key().public_bytes(
        encoding=serialization.Encoding.Raw,
        format=serialization.PublicFormat.Raw)
    kid = "did:web:csoai.org#board-attestation-1"
    did = {"verificationMethod": [{"id": kid, "publicKeyJwk": {
        "kty": "OKP", "crv": "Ed25519",
        "x": base64.urlsafe_b64encode(public).decode().rstrip("=")}}]}
    leaves = [hashlib.sha256(i.to_bytes(3, "big")).hexdigest() for i in range(3)]
    root = {"kind": "csoai.public-root/v1", "schema": "https://councilof.ai/schema/public-root-v1.json",
            "as_of": "2026-11-24T00:00:00Z", "merkle_root": readback.compute_merkle(leaves),
            "card_count": len(leaves), "did_intended": kid, "card_sha256": leaves}
    canonical = json.dumps({k: root[k] for k in readback.PREIMAGE_FIELDS},
                           sort_keys=True, separators=(",", ":")).encode()
    root["sig_ed25519"] = private.sign(canonical).hex()
    proofs = {i: proof_for(leaves, i) for i in range(3)}
    return root, did, proofs


class ReadbackNegativeControls(unittest.TestCase):
    def test_valid_synthetic_odd_tree(self):
        root, did, proofs = fixture()
        result = readback.verify_sources(root, did, proofs)
        self.assertEqual(result["verdict"], "VALID")
        self.assertEqual({v["state"] for v in result["checks"].values()}, {"VALID"})

    def test_tamper_leaf_breaks_tree(self):
        root, did, proofs = fixture()
        root["card_sha256"][0] = "f" * 64
        result = readback.verify_sources(root, did, proofs)
        self.assertEqual(result["checks"]["merkle_tree"]["state"], "INVALID")

    def test_forged_signature_rejected(self):
        root, did, proofs = fixture()
        root["sig_ed25519"] = "0" * 128
        self.assertEqual(readback.verify_sources(root, did, proofs)["checks"]["root_signature"]["state"], "INVALID")

    def test_unpinned_key_rejected(self):
        root, did, proofs = fixture()
        did["verificationMethod"][0]["id"] = "did:web:csoai.org#different"
        self.assertEqual(readback.verify_sources(root, did, proofs)["checks"]["root_signature"]["state"], "INVALID")

    def test_tampered_path_rejected(self):
        root, did, proofs = fixture()
        proofs[2]["proof"][0] = "f" * 64
        self.assertEqual(readback.verify_sources(root, did, proofs)["checks"]["proof_2"]["state"], "INVALID")

    def test_duplicate_tail_out_of_bounds_rejected(self):
        root, did, proofs = fixture()
        fake = proof_for(root["card_sha256"], 2)
        fake["index"] = 3
        with self.assertRaisesRegex(ValueError, "index exceeds"):
            readback.verify_inclusion(fake, 3, root["card_sha256"], root["merkle_root"])

    def test_wrong_root_bound_proof_rejected(self):
        root, did, proofs = fixture()
        proofs[0]["merkle_root"] = "a" * 64
        self.assertEqual(readback.verify_sources(root, did, proofs)["checks"]["proof_0"]["state"], "INVALID")

    def test_valid_size_one(self):
        leaf = hashlib.sha256(b"only").hexdigest()
        self.assertEqual(readback.compute_merkle([leaf]), leaf)
        self.assertEqual(readback.indices_for(1), [0])


if __name__ == "__main__":
    unittest.main()
