import copy
import hashlib
import json
import unittest
from tempfile import TemporaryDirectory
from review_projection import canonical, project


class ReviewProjectionTest(unittest.TestCase):
    def inventory(self):
        rows = [
            {"finding_id": "a", "path": "public/a.json", "line": 1, "rule": "ENDORSEMENT", "matched_text": "approved by", "negation_nearby": False},
            {"finding_id": "b", "path": "public/a.json", "line": 1, "rule": "ENDORSEMENT", "matched_text": "approved by", "negation_nearby": False},
            {"finding_id": "c", "path": "public/b.json", "line": 2, "rule": "CERTIFICATION", "matched_text": "certification", "negation_nearby": True},
        ]
        x = {"schema": "csoai.claim-maintenance-dogfood/0.1", "observed_at": "2026-09-28T00:00:00Z", "review_candidates": len(rows), "findings": rows}
        x["content_hash"] = hashlib.sha256(canonical(x)).hexdigest()
        return x

    def test_retains_all_context_and_deduplicates_only_projection(self):
        x = self.inventory()
        result = project(x, 1)
        self.assertEqual(result["bucket_counts"], {"priority_context": 1, "ordinary_context": 0, "negation_context": 1})
        self.assertEqual((result["raw_candidates"], result["unique_locations"], result["duplicate_locations"]), (3, 2, 1))
        self.assertEqual(len(x["findings"]), 3)
        self.assertEqual(result["mirror_locations"], 0)

    def test_structured_exclusion_retirement_and_unresolved_are_annotations(self):
        with TemporaryDirectory() as directory:
            root = __import__("pathlib").Path(directory)
            (root / "agent.json").write_text('{"explicitly_not": [\n  "accreditation"\n]}\n')
            (root / "claims.json").write_text('{"claims": [\n  {"claim": "we certify", "status": "retired"},\n  {"claim": "we certify", "status": "live"}\n]}\n')
            rows = [
                {"finding_id": "d", "path": "agent.json", "line": 2, "rule": "ACCREDITATION", "matched_text": "accreditation", "negation_nearby": False},
                {"finding_id": "e", "path": "claims.json", "line": 2, "rule": "PRODUCTION_ASSURANCE", "matched_text": "certify", "negation_nearby": False},
                {"finding_id": "f", "path": "claims.json", "line": 3, "rule": "PRODUCTION_ASSURANCE", "matched_text": "certify", "negation_nearby": False},
                {"finding_id": "g", "path": "../outside.json", "line": 1, "rule": "PRODUCTION_ASSURANCE", "matched_text": "certify", "negation_nearby": False},
            ]
            x = self.inventory()
            x["findings"] = rows
            x["review_candidates"] = len(rows)
            x["content_hash"] = hashlib.sha256(canonical({k: v for k, v in x.items() if k != "content_hash"})).hexdigest()
            result = project(x, source_root=root)
            self.assertEqual([r["source_context"] for r in result["priority_sample"]], ["SOURCE_UNAVAILABLE", "EXPLICIT_EXCLUSION", "RETIRED_CLAIM_TEXT", "STRUCTURED_CONTEXT_UNRESOLVED"])
            self.assertEqual(result["bucket_counts"]["priority_context"], 4)

    def test_refuses_mutated_source(self):
        x = self.inventory()
        x["findings"][0]["matched_text"] = "altered"
        with self.assertRaisesRegex(ValueError, "content hash mismatch"):
            project(x)

    def test_refuses_forged_count(self):
        x = self.inventory()
        x["review_candidates"] = 4
        x["content_hash"] = hashlib.sha256(canonical({k: v for k, v in x.items() if k != "content_hash"})).hexdigest()
        with self.assertRaisesRegex(ValueError, "findings count mismatch"):
            project(x)


if __name__ == "__main__":
    unittest.main()
