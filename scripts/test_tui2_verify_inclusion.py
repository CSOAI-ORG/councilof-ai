from __future__ import annotations

import unittest

import tui2_verify_inclusion as v


class Tui2VerifyInclusionTest(unittest.TestCase):
    def test_selftest_passes(self):
        self.assertEqual(0, v.selftest())

    def test_verdict_states_never_blend(self):
        a = {"derived_digest": "ab" * 32, "subject": "x"}
        self.assertEqual("UNCHECKABLE", v.verdict_for(a, None, None))
        self.assertEqual("UNCHECKABLE", v.verdict_for(a, {"card_count": 228, "card_sha256": []}, None))
        self.assertEqual(
            "VALID",
            v.verdict_for(a, {"card_count": 241, "card_sha256": ["ab" * 32]}, {"kind": "inclusion", "proof": ["p"]}),
        )
        self.assertEqual("INVALID", v.verdict_for(a, {"card_count": 242, "card_sha256": ["cd" * 32]}, None))


if __name__ == "__main__":
    unittest.main()
