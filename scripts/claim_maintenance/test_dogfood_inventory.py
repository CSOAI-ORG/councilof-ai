import importlib.util
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("dogfood_inventory", HERE / "dogfood_inventory.py")
dog = importlib.util.module_from_spec(spec)
spec.loader.exec_module(dog)


class DogfoodInventoryTests(unittest.TestCase):
    def test_negated_certification_is_review_candidate_not_verdict(self):
        with tempfile.TemporaryDirectory(dir=dog.ROOT) as tmp:
            p = Path(tmp) / "claim.md"
            p.write_text("We are not certified by any regulator.\n", encoding="utf-8")
            meta, hits = dog.scan_file(p)
            self.assertEqual(meta["state"], "SCANNED")
            self.assertEqual(len(hits), 1)
            self.assertEqual(hits[0]["rule"], "CERTIFICATION")
            self.assertTrue(hits[0]["negation_nearby"])
            self.assertEqual(hits[0]["state"], "REVIEW_CANDIDATE")

    def test_priority_claim_is_captured_with_exact_line(self):
        with tempfile.TemporaryDirectory(dir=dog.ROOT) as tmp:
            p = Path(tmp) / "claim.txt"
            p.write_text("header\nWorld's first claim-maintenance layer\n", encoding="utf-8")
            _meta, hits = dog.scan_file(p)
            self.assertEqual(len(hits), 1)
            self.assertEqual(hits[0]["rule"], "PRIORITY_CLAIM")
            self.assertEqual(hits[0]["line"], 2)

    def test_no_match_stays_empty(self):
        with tempfile.TemporaryDirectory(dir=dog.ROOT) as tmp:
            p = Path(tmp) / "safe.md"
            p.write_text("Measured observation with explicit limitations.\n", encoding="utf-8")
            _meta, hits = dog.scan_file(p)
            self.assertEqual(hits, [])


if __name__ == "__main__":
    unittest.main()
