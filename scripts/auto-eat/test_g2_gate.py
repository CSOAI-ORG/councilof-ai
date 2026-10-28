import sys, unittest
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parent))
import g2_gate as g

GOOD = {
    "n_valid": 40,
    "n_total": 42,
    "unparsed": 1,
    "truncated": 1,
    "transport_errors": 0,
    "score": 0.6,
    "score_scale": "fraction",
    "serial": True,
    "temperature": 0,
    "seed": 0,
    "run_of_record": True,
    "model": "x:1b",
    "axis": "care",
}


class T(unittest.TestCase):
    def test_good_passes(self):
        self.assertEqual(g.g2_reasons("autoeat.x", dict(GOOD), []), [])

    def test_good_percent_passes(self):
        p = {**GOOD, "score": 60, "score_scale": "percent"}
        self.assertEqual(g.g2_reasons("autoeat.x", p, []), [])

    def test_each_gate(self):
        for k, v in [
            ("n_valid", 29),
            ("unparsed", 4),
            ("transport_errors", 3),
            ("seed", 1),
            ("temperature", 0.7),
            ("serial", False),
            ("duplicate_of", "r1"),
            ("stitched", True),
            ("det", True),
        ]:
            self.assertTrue(g.g2_reasons("autoeat.x", {**GOOD, k: v}, []), (k, v))

    def test_missing_fails_closed(self):
        self.assertTrue(g.g2_reasons("autoeat.x", {"kind": "probe"}, []))

    def test_hold_rule(self):
        held = [{"model": "x:1b", "digest": "any", "axis": "care", "reason": "HELD"}]
        self.assertIn("hold rule: HELD", g.g2_reasons("autoeat.x", dict(GOOD), held))

    def test_missing_score_scale_rejected(self):
        p = {k: v for k, v in GOOD.items() if k != "score_scale"}
        reasons = g.g2_reasons("autoeat.x", p, [])
        self.assertTrue(any("score_scale" in x for x in reasons), reasons)

    def test_unknown_score_scale_rejected(self):
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score_scale": "ratio"}, [])
        self.assertTrue(any("score_scale" in x for x in reasons), reasons)

    def test_fraction_endpoint_0(self):
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score": 0, "score_scale": "fraction"}, [])
        self.assertTrue(any("endpoint for fraction" in x for x in reasons), reasons)

    def test_fraction_endpoint_1(self):
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score": 1.0, "score_scale": "fraction"}, [])
        self.assertTrue(any("endpoint for fraction" in x for x in reasons), reasons)

    def test_percent_endpoint_0(self):
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score": 0, "score_scale": "percent"}, [])
        self.assertTrue(any("endpoint for percent" in x for x in reasons), reasons)

    def test_percent_endpoint_100(self):
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score": 100, "score_scale": "percent"}, [])
        self.assertTrue(any("endpoint for percent" in x for x in reasons), reasons)

    def test_fraction_does_not_treat_100_as_endpoint(self):
        # Without assume-fraction: score=100 with scale=fraction is not an endpoint (odd but not 0/1.0).
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score": 100, "score_scale": "fraction"}, [])
        self.assertFalse(any("endpoint" in x for x in reasons), reasons)

    def test_percent_does_not_treat_1_as_endpoint(self):
        # score=1 with scale=percent is 1%, not an endpoint.
        reasons = g.g2_reasons("autoeat.x", {**GOOD, "score": 1, "score_scale": "percent"}, [])
        self.assertFalse(any("endpoint" in x for x in reasons), reasons)


if __name__ == "__main__":
    unittest.main()
