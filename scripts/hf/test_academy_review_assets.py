"""Qualification for byte custody and current-use boundaries in the lesson export."""
import copy
import importlib.util
import json
import tempfile
import unittest
from pathlib import Path

SPEC = importlib.util.spec_from_file_location("assets", Path(__file__).with_name("academy_review_assets.py"))
assets = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(assets)


class AcademyAssetsTests(unittest.TestCase):
    def setUp(self):
        lesson = ("# A historical lesson\n\n**Experience:** observed 2026-11-04.\n"
                  "**Source of record:** https://example.org/record\n"
                  "**Verify it yourself:** compare bytes.\n"
                  "**What would falsify this:** mismatched evidence.\n").encode()
        self.sources = {name: lesson for name in assets.LESSON_FILES}
        self.sources["README.md"] = b"# Original description\n"
        self.sources["axis-path.json"] = json.dumps({"schema": "csoai.academy-axis-path/0.1", "axis": "gspc-live", "status": "MEASURED", "credential": {"state": "BLOCKED"}}).encode()
        self.lock = {"source_dataset": assets.SOURCE_DATASET, "source_revision": assets.SOURCE_REVISION,
                     "files": {name: {"url": assets.source_url(name), "sha256": assets.sha256(raw), "bytes": len(raw)} for name, raw in self.sources.items()}}

    def test_historical_metadata_does_not_become_authority(self):
        before = copy.deepcopy(self.sources)
        rows, report, card = assets.build_assets(self.lock, self.sources)
        self.assertEqual(self.sources, before)
        self.assertEqual(len(rows), 5)
        self.assertEqual(report["human_responses_used"], 0)
        self.assertEqual(report["learning_outcome_status"], "NOT_EVALUATED")
        self.assertFalse(report["exercise_status_is_new_measurement"])
        for row in rows:
            self.assertFalse(row["current_claims_retested"])
            self.assertFalse(row["training_authority"])
            self.assertFalse(row["execution_authority"])
            self.assertFalse(row["human_learning_outcome_evaluated"])
        self.assertIn("split: lessons", card)
        self.assertTrue(card.endswith(self.sources["README.md"].decode()))

    def test_source_mutation_rejected_even_when_calling_builder_directly(self):
        altered = dict(self.sources)
        altered[assets.LESSON_FILES[0]] += b" changed"
        with self.assertRaisesRegex(ValueError, "mismatch"):
            assets.build_assets(self.lock, altered)

    def test_mutable_ref_and_different_source_rejected(self):
        altered = copy.deepcopy(self.lock)
        altered["files"][assets.LESSON_FILES[0]]["url"] = altered["files"][assets.LESSON_FILES[0]]["url"].replace(assets.SOURCE_REVISION, "main")
        with self.assertRaisesRegex(ValueError, "Unpinned"):
            assets.validate_lock(altered)
        altered = copy.deepcopy(self.lock)
        altered["source_dataset"] = "another/owner"
        with self.assertRaisesRegex(ValueError, "Unexpected"):
            assets.validate_lock(altered)

    def test_unexpected_file_or_missing_file_rejected(self):
        for extra in (False, True):
            altered = copy.deepcopy(self.lock)
            if extra:
                altered["files"]["../outside.md"] = altered["files"]["README.md"]
            else:
                del altered["files"]["README.md"]
            with self.assertRaisesRegex(ValueError, "exactly"):
                assets.validate_lock(altered)

    def test_local_integrity_read_and_symlink_refusal(self):
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            for name, raw in self.sources.items():
                (folder / name).write_bytes(raw)
            self.assertEqual(assets.checked_sources(self.lock, folder), self.sources)
            lesson = folder / assets.LESSON_FILES[0]
            lesson.unlink()
            lesson.symlink_to(folder / assets.LESSON_FILES[1])
            with self.assertRaisesRegex(ValueError, "symlink"):
                assets.checked_sources(self.lock, folder)

    def test_marker_gaps_are_not_content_quality_scores(self):
        rows, report, _ = assets.build_assets(self.lock, self.sources)
        self.assertEqual(report["explicit_section_marker_gaps"][rows[0]["lesson_id"]], ["expertise"])
        self.assertIn("not a judgment", report["marker_check_limitation"])
        self.assertEqual(json.loads(rows[0]["source_dates_json"]), ["2026-11-04"])

    def test_new_notebook_requires_immutable_code_and_hash(self):
        for commit, digest in (("main", "1" * 64), ("1" * 40, "bad")):
            with self.assertRaises(ValueError):
                assets.notebook(commit, self.lock, digest)
        doc = assets.notebook("1" * 40, self.lock, "2" * 64)
        code = "".join("".join(cell["source"]) for cell in doc["cells"] if cell["cell_type"] == "code")
        self.assertIn("Generator digest mismatch", code)
        self.assertIn("builder.checked_sources", code)
        self.assertNotIn("api.authenticate", code)
        self.assertIn("'human_responses_used': 0", code)

    def test_real_integrity_card_retains_exact_ledger_and_no_human_or_model_evidence(self):
        card, ledger = assets.evaluation_card(self.lock, self.sources,
            as_of="2026-11-11T02:52:39Z", generator_sha256="a" * 64)
        items = [json.loads(line) for line in ledger.splitlines()]
        self.assertEqual({item["item_id"] for item in items}, set(assets.SOURCE_FILES))
        self.assertEqual(card["item_ledger"]["sha256"], assets.sha256(ledger))
        self.assertEqual(card["item_ledger"]["path"], "integrity-ledger.jsonl")
        self.assertEqual(card["suite"]["items_held_out"], 0)
        self.assertEqual(card["arms"][0]["answered_by_model"], 0)
        self.assertEqual(card["arms"][0]["answered_by_rule"], 7)
        self.assertEqual(card["reproduction"]["state"], "NOT_PUBLISHED")
        changed = dict(self.sources)
        changed["README.md"] += b" altered"
        with self.assertRaisesRegex(ValueError, "mismatch"):
            assets.evaluation_card(self.lock, changed,
                as_of="2026-11-11T02:52:39Z", generator_sha256="a" * 64)

    def test_reporter_manifest_rejects_arbitrary_code_and_paths(self):
        for invalid in ({"code": "print('unchecked')"}, {"../outside.py": {"sha256": "1" * 64, "bytes": 10}}):
            with self.assertRaisesRegex(ValueError, "exactly"):
                assets.notebook("1" * 40, self.lock, "2" * 64, invalid)
        manifest = {name: {"sha256": "3" * 64, "bytes": 0} for name in assets.REPORTER_FILES}
        doc = assets.notebook("1" * 40, self.lock, "2" * 64, manifest)
        code = "\n".join("".join(cell["source"]) for cell in doc["cells"] if cell["cell_type"] == "code")
        compile(code, "notebook", "exec")
        self.assertLess(code.index("Reporter dependency digest mismatch"), code.index("spec.loader.exec_module(reporter)"))
        self.assertIn("build_report(card_bytes, b'[]'", code)
        self.assertIn("GPT-6 Astra Pro", code)
        self.assertIn("human_calibration'] == 'NOT_ESTABLISHED'", code)

    def test_csv_and_jsonl_roundtrip_keep_same_rows(self):
        rows, report, card = assets.build_assets(self.lock, self.sources)
        with tempfile.TemporaryDirectory() as directory:
            folder = Path(directory)
            assets.write_assets(folder, self.lock, rows, report, card)
            replay = [json.loads(line) for line in (folder / "lessons.jsonl").read_text().splitlines()]
            self.assertEqual(replay, rows)
            self.assertEqual(json.loads((folder / "asset-review.json").read_text()), report)


if __name__ == "__main__":
    unittest.main()
