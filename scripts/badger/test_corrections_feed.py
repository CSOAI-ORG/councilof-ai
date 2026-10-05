#!/usr/bin/env python3
"""Append-only refutation feed regressions; uses only temporary fixtures."""
import importlib.util
import json
from pathlib import Path
import tempfile
import unittest

SOURCE = Path(__file__).with_name("csoai-do-all-syntheses.py")
spec = importlib.util.spec_from_file_location("syntheses", SOURCE)
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)

class CorrectionsFeedTests(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.addCleanup(self.temp.cleanup)
        self.original = module.ROOT, module.INTEROP
        self.addCleanup(self.restore)
        module.ROOT = Path(self.temp.name)
        module.INTEROP = module.ROOT / "public/interop"
        module.INTEROP.mkdir(parents=True)
        self.source = module.ROOT / "client/src/pages/RefutationLedger.tsx"
        self.source.parent.mkdir(parents=True)
        self.write_source(1)

    def restore(self):
        module.ROOT, module.INTEROP = self.original

    def write_source(self, *ids, claim="claim", why="reason"):
        self.source.write_text("\n".join(
            f'n: {n}, claim: "{claim}", measured: "observed", artefact: "source", why: "{why}"'
            for n in ids))

    def save(self, value):
        (module.INTEROP / "corrections-feed.json").write_text(json.dumps(value))

    def test_preserves_removed_history_and_appends_new_id(self):
        old = module.build_corrections_feed()
        self.save(old)
        self.write_source(2)
        new = module.build_corrections_feed()
        self.assertEqual(new["total"], 2)
        self.assertEqual(new["corrections"][0], old["corrections"][0])
        self.assertEqual(new["corrections"][1]["refutation_id"], "REF-002")
        self.assertEqual(new["signature_state"], "UNSIGNED_SNAPSHOT")

    def test_current_cohort_is_idempotent(self):
        old = module.build_corrections_feed()
        self.save(old)
        self.assertEqual(module.build_corrections_feed()["corrections"], old["corrections"])

    def test_changed_claim_cannot_overwrite_same_id(self):
        self.save(module.build_corrections_feed())
        self.write_source(1, claim="replacement")
        with self.assertRaisesRegex(ValueError, "historical refutation changed"):
            module.build_corrections_feed()

    def test_changed_explanation_cannot_silently_disappear(self):
        self.save(module.build_corrections_feed())
        self.write_source(1, why="different explanation")
        with self.assertRaisesRegex(ValueError, "historical refutation changed"):
            module.build_corrections_feed()

    def test_duplicate_history_is_rejected(self):
        old = module.build_corrections_feed()
        old["corrections"].append(old["corrections"][0])
        self.save(old)
        with self.assertRaisesRegex(ValueError, "duplicate IDs"):
            module.build_corrections_feed()

    def test_malformed_history_is_rejected(self):
        for value in ([], {"corrections": {}}, {"corrections": [None]}, {"corrections": [{}]}):
            with self.subTest(value=value):
                self.save(value)
                with self.assertRaises(ValueError):
                    module.build_corrections_feed()

    def test_duplicate_source_ids_are_rejected(self):
        self.write_source(1, 1)
        with self.assertRaisesRegex(ValueError, "duplicate current"):
            module.build_corrections_feed()

    def test_unparsed_source_fails_instead_of_claiming_fresh_history(self):
        self.save(module.build_corrections_feed())
        self.source.write_text("source format has changed")
        with self.assertRaisesRegex(ValueError, "no current refutations"):
            module.build_corrections_feed()

    def test_committed_feed_retains_exact_rows(self):
        module.ROOT, module.INTEROP = self.original
        old = json.loads((module.INTEROP / "corrections-feed.json").read_text())
        self.assertEqual(module.build_corrections_feed()["corrections"], old["corrections"])

if __name__ == "__main__":
    unittest.main()
