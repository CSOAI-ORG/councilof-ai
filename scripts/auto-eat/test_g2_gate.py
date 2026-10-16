import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import g2_gate as g

GOOD = {"n_valid": 40, "n_total": 42, "unparsed": 1, "truncated": 1, "transport_errors": 0, "score": 0.6,
        "serial": True, "temperature": 0, "seed": 0, "run_of_record": True, "model": "x:1b", "axis": "care"}


class T(unittest.TestCase):
    def test_good_passes(self):
        self.assertEqual(g.g2_reasons("autoeat.x", dict(GOOD), []), [])

    def test_each_gate(self):
        for k, v in [("n_valid", 29), ("unparsed", 4), ("transport_errors", 3), ("score", 1),
                     ("score", 0), ("seed", 1), ("temperature", 0.7), ("serial", False),
                     ("duplicate_of", "r1"), ("stitched", True), ("det", True)]:
            self.assertTrue(g.g2_reasons("autoeat.x", {**GOOD, k: v}, []), (k, v))

    def test_missing_fails_closed(self):
        self.assertTrue(g.g2_reasons("autoeat.x", {"kind": "probe"}, []))

    def test_hold_rule(self):
        held = [{"model": "x:1b", "digest": "any", "axis": "care", "reason": "HELD"}]
        self.assertIn("hold rule: HELD", g.g2_reasons("autoeat.x", dict(GOOD), held))


if __name__ == "__main__":
    unittest.main()
