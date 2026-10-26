#!/usr/bin/env python3
"""Tests for the third-party results converter (eval-ci, 2026-10).

Stdlib only, no network. The converter's job is to be *honest about pins*, so
these tests check the pin gate rather than the parsing:

  1. a truncated commit prefix is resolved and the resolution is verified
  2. a prefix that cannot be resolved is a MISSING pin, never a guessed sha
  3. a record missing any required pin is a candidate, not an attestation
  4. every attestable record validates against the real EvaluationResult/v1 schema
  5. `heldOut` is absent on every record (absent means unknown, not false)
  6. the Wilson interval is only present where the estimand allows it
  7. the corpus on disk agrees with the report beside it

Run:  python3 -m unittest packages/eval-ci/test_convert_third_party.py
"""
from __future__ import annotations

import json
import sys
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent.parent
sys.path.insert(0, str(HERE))

import convert_third_party as C  # noqa: E402

CORPUS_DIR = HERE / "third_party"
CANDIDATES = CORPUS_DIR / "candidates.jsonl"
GAPS = CORPUS_DIR / "gaps.json"
REPORT = CORPUS_DIR / "report.json"
SCHEMA_PATH = ROOT / "packages" / "gspc-card-verifier" / "schema" / "evaluation-result.schema.json"

ROWS = [json.loads(l) for l in CANDIDATES.read_text(encoding="utf-8").splitlines() if l.strip()] \
    if CANDIDATES.is_file() else []
VALID = [r for r in ROWS if r.get("predicate")]


def _resolver(sha: str | None):
    def resolve(repo: str, prefix: str):
        if sha is None:
            return None, "not resolvable in this test"
        return sha, "test resolver"
    return resolve


def _lm_eval_doc(**over):
    doc = {
        "git_hash": "2389abfa",
        "date": 1732321779.95,
        "config": {"model": "openai-completions", "batch_size": 1},
        "results": {"boolq": {"alias": "boolq", "acc,none": 0.75, "acc_stderr,none": 0.03}},
        "n-samples": {"boolq": {"original": 100, "effective": 100}},
        "task_hashes": {"boolq": "a" * 64},
        "higher_is_better": {"boolq": {"acc": True}},
        "versions": {"boolq": 1.0},
    }
    doc.update(over)
    return doc


class TestCommitResolution(unittest.TestCase):
    def test_a_full_sha_is_accepted_without_a_network_call(self):
        sha = "2389abfa184f2a5592d67020b950a4e7f256c540"
        got, reason = C.resolve_commit("any/repo", sha)
        self.assertEqual(sha, got)
        self.assertIn("already full", reason)

    def test_a_non_hex_prefix_is_refused_rather_than_looked_up(self):
        got, reason = C.resolve_commit("any/repo", "zzzzzzz")
        self.assertIsNone(got)
        self.assertIn("not a hex sha", reason)

    def test_an_unresolvable_prefix_is_a_missing_pin_not_a_guess(self):
        """The converter must never invent the other end of a sha."""
        cands = C._lm_eval_candidates(
            _lm_eval_doc(), "test", "https://example.org/r.json", "d" * 64,
            {"name": "lm-evaluation-harness", "repo": "EleutherAI/lm-evaluation-harness"},
            _resolver(None))
        self.assertEqual(1, len(cands))
        self.assertIsNone(cands[0].predicate)
        self.assertIn("harness.commit", cands[0].pins_missing)
        self.assertIn("harness.version", cands[0].pins_missing)


class TestPinGate(unittest.TestCase):
    def _convert(self, doc):
        return C._lm_eval_candidates(
            doc, "test", "https://example.org/r.json", "d" * 64,
            {"name": "lm-evaluation-harness", "repo": "EleutherAI/lm-evaluation-harness"},
            _resolver("2389abfa184f2a5592d67020b950a4e7f256c540"))

    def test_a_fully_pinned_result_becomes_a_predicate(self):
        cands = self._convert(_lm_eval_doc())
        self.assertEqual(1, len(cands))
        self.assertIsNotNone(cands[0].predicate)
        self.assertEqual([], cands[0].pins_missing)

    def test_a_missing_task_hash_is_a_missing_item_digest(self):
        doc = _lm_eval_doc(task_hashes={})
        cands = self._convert(doc)
        self.assertIsNone(cands[0].predicate)
        self.assertIn("items.digest", cands[0].pins_missing)

    def test_a_missing_sample_count_is_a_missing_item_count(self):
        doc = _lm_eval_doc(**{"n-samples": {}})
        cands = self._convert(doc)
        self.assertIsNone(cands[0].predicate)
        self.assertIn("items.n", cands[0].pins_missing)

    def test_a_subsampled_item_set_records_both_counts(self):
        doc = _lm_eval_doc(**{"n-samples": {"boolq": {"original": 10000, "effective": 5}}})
        cands = self._convert(doc)
        pred = cands[0].predicate
        self.assertEqual(5, pred["items"]["n"])
        self.assertIn("5 of 10000", pred["establishes"][0])

    def test_direction_is_recorded_outside_the_predicate(self):
        """EvaluationResult/v1 has no direction field; the corpus carries it."""
        cands = self._convert(_lm_eval_doc())
        self.assertEqual("maximize", cands[0].direction)
        self.assertNotIn("direction", cands[0].predicate["result"])


class TestInterval(unittest.TestCase):
    def test_wilson_brackets_the_estimate(self):
        low, high = C.wilson(75, 100)
        self.assertLess(low, 0.75)
        self.assertGreater(high, 0.75)
        self.assertGreaterEqual(low, 0.0)
        self.assertLessEqual(high, 1.0)

    def test_wilson_narrows_with_more_instances(self):
        narrow = C.wilson(750, 1000)
        wide = C.wilson(75, 100)
        self.assertLess(narrow[1] - narrow[0], wide[1] - wide[0])

    def test_a_metric_outside_the_proportion_set_carries_no_interval(self):
        doc = _lm_eval_doc(results={"boolq": {"alias": "boolq", "perplexity,none": 12.5}})
        cands = C._lm_eval_candidates(
            doc, "test", "https://example.org/r.json", "d" * 64,
            {"name": "lm-evaluation-harness", "repo": "EleutherAI/lm-evaluation-harness"},
            _resolver("2389abfa184f2a5592d67020b950a4e7f256c540"))
        self.assertNotIn("interval", cands[0].predicate["result"])

    def test_one_instance_carries_no_interval(self):
        doc = _lm_eval_doc(**{"n-samples": {"boolq": {"original": 1, "effective": 1}}})
        cands = C._lm_eval_candidates(
            doc, "test", "https://example.org/r.json", "d" * 64,
            {"name": "lm-evaluation-harness", "repo": "EleutherAI/lm-evaluation-harness"},
            _resolver("2389abfa184f2a5592d67020b950a4e7f256c540"))
        self.assertNotIn("interval", cands[0].predicate["result"])


@unittest.skipUnless(VALID, "the converted corpus is not present")
class TestCorpus(unittest.TestCase):
    def test_the_corpus_validates_against_the_real_schema(self):
        try:
            import warnings
            warnings.filterwarnings("ignore")
            from jsonschema import Draft202012Validator
        except Exception:
            self.skipTest("jsonschema is not installed")
        validator = Draft202012Validator(json.loads(SCHEMA_PATH.read_text(encoding="utf-8")))
        errors = []
        for row in VALID:
            for err in validator.iter_errors(row["predicate"]):
                errors.append(f"{row['result_id']}: {err.message}")
        self.assertEqual([], errors[:5], f"{len(errors)} schema errors in the corpus")

    def test_held_out_is_absent_everywhere(self):
        """Absent means unknown. It must never be written as false."""
        for row in VALID:
            self.assertNotIn("heldOut", row["predicate"]["items"],
                             f"{row['result_id']} claims heldOut")

    def test_contamination_is_absent_everywhere(self):
        """The question was not asked, so no answer is recorded."""
        for row in VALID:
            self.assertNotIn("contamination", row["predicate"])

    def test_every_record_declares_what_it_does_not_establish(self):
        for row in VALID:
            self.assertTrue(row["predicate"].get("doesNotEstablish"))

    def test_no_record_claims_to_be_measured(self):
        for row in ROWS:
            self.assertNotIn("MEASURED", json.dumps(row).replace("UNMEASURED", ""))

    def test_the_report_agrees_with_the_corpus(self):
        report = json.loads(REPORT.read_text(encoding="utf-8"))
        gaps = json.loads(GAPS.read_text(encoding="utf-8"))
        self.assertEqual(len(ROWS), report["n_candidates"])
        self.assertEqual(len(VALID), report["n_valid"])
        self.assertEqual(len(ROWS), gaps["n_candidates"])
        self.assertEqual(len(VALID), gaps["n_valid"])

    def test_the_corpus_meets_the_bank_threshold(self):
        """The board's own gate for these axes is n_valid >= 30."""
        gaps = json.loads(GAPS.read_text(encoding="utf-8"))
        self.assertGreaterEqual(gaps["n_valid"], 30,
                                "the converted corpus must carry at least 30 fully pinned records")

    def test_a_gap_record_names_the_missing_pin(self):
        for row in ROWS:
            if row["attestable"]:
                self.assertEqual([], row["pins_missing"])
            else:
                self.assertTrue(row["pins_missing"], f"{row['result_id']} is a gap with no reason")
                self.assertIsNone(row["predicate"])


if __name__ == "__main__":
    unittest.main()
