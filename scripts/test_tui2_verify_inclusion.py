from __future__ import annotations

import hashlib
import unittest

import tui2_verify_inclusion as v
import publish_public_root as publisher


class Tui2VerifyInclusionTest(unittest.TestCase):
    def test_selftest_passes(self):
        self.assertEqual(0, v.selftest())

    def test_verdict_states_never_blend(self):
        leaf_hex = hashlib.sha256(b"x").hexdigest()
        leaves = [hashlib.sha256(f"l{i}".encode()).hexdigest() for i in range(3)]
        leaves[1] = leaf_hex
        root = publisher.merkle_root(leaves)
        proof = publisher.merkle_proof(leaves, leaf_hex)
        a = {"derived_digest": leaf_hex, "subject": "x"}
        live = {"card_count": 3, "card_sha256": leaves, "merkle_root": root, "as_of": "2026-09-12T18:00:00Z"}
        good = {"kind": "inclusion", "index": 1, "proof": proof}
        self.assertEqual("UNCHECKABLE", v.verdict_for(a, None, None, None)[0])
        self.assertEqual("VALID", v.verdict_for(a, live, good, None)[0])
        self.assertEqual("UNCHECKABLE", v.verdict_for(a, live, None, None)[0])
        self.assertEqual("INVALID", v.verdict_for(a, live, {"kind": "inclusion", "index": 0, "proof": proof}, None)[0])
        # count/bind mismatch: never VALID
        bad_count = dict(live, card_count=4)
        self.assertEqual("UNCHECKABLE", v.verdict_for(a, bad_count, good, None)[0])


if __name__ == "__main__":
    unittest.main()
