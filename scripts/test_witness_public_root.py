import base64
import hashlib
import json
import unittest

import witness_public_root as witness


class RekorEntryValidationTests(unittest.TestCase):
    def fixture(self):
        preimage = b"root preimage"
        signature = bytes(range(64))
        public_key = b"-----BEGIN PUBLIC KEY-----\nexample\n-----END PUBLIC KEY-----\n"
        body = {
            "kind": "rekord",
            "spec": {
                "data": {
                    "hash": {
                        "algorithm": "sha256",
                        "value": hashlib.sha256(preimage).hexdigest(),
                    }
                },
                "signature": {
                    "content": base64.b64encode(signature).decode(),
                    "publicKey": {"content": base64.b64encode(public_key).decode()},
                },
            },
        }
        entry = {
            "body": base64.b64encode(json.dumps(body).encode()).decode(),
            "logIndex": 7,
            "verification": {"inclusionProof": {"logIndex": 7, "treeSize": 8}},
        }
        return {"a" * 80: entry}, preimage, signature, public_key

    def test_accepts_matching_entry_and_inclusion_coordinates(self):
        response, preimage, signature, public_key = self.fixture()
        uuid, entry = witness.validate_rekor_entry(response, preimage, signature, public_key)
        self.assertEqual(uuid, "a" * 80)
        self.assertEqual(entry["logIndex"], 7)

    def test_rejects_entry_proof_log_index_mismatch(self):
        response, preimage, signature, public_key = self.fixture()
        response["a" * 80]["verification"]["inclusionProof"]["logIndex"] = 6
        with self.assertRaisesRegex(ValueError, "logIndex mismatch"):
            witness.validate_rekor_entry(response, preimage, signature, public_key)

    def test_rejects_entry_outside_tree(self):
        response, preimage, signature, public_key = self.fixture()
        response["a" * 80]["verification"]["inclusionProof"]["treeSize"] = 7
        with self.assertRaisesRegex(ValueError, "outside treeSize"):
            witness.validate_rekor_entry(response, preimage, signature, public_key)

    def test_rejects_wrong_preimage_hash(self):
        response, _preimage, signature, public_key = self.fixture()
        with self.assertRaisesRegex(ValueError, "does not bind"):
            witness.validate_rekor_entry(response, b"different", signature, public_key)


if __name__ == "__main__":
    unittest.main()
