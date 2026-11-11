# SPDX-License-Identifier: Apache-2.0
"""Synthetic cross-runtime checks; these do not collect participant results."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("academy_learning_import", HERE / "academy_learning_import.py")
A = importlib.util.module_from_spec(spec)
spec.loader.exec_module(A)
from event import compute_event_id, validate

NOW = "2026-11-11T04:00:00Z"


def raw(value):
    return json.dumps(value, ensure_ascii=False, allow_nan=False).encode()


class AcademyLearningImportTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        # Generate with the exact shipped browser module, not a Python imitation.
        script = """
import {readFileSync} from 'node:fs';
import * as S from './public/academy/exercises/learning-study.mjs';
const d=await S.definition(JSON.parse(readFileSync('public/academy/exercises/study-content.json','utf8')),JSON.parse(readFileSync('public/academy/exercises/exercises.json','utf8')));
const at=n=>`2026-11-10T01:00:${String(n).padStart(2,'0')}.000Z`;
let state=await S.startStudy(d,{at:at(0),origin:'SYNTHETIC',sessionRef:'00000000-0000-4000-8000-000000000001'}),n=1;
for (const task of d.tasks) {
  if(state.stage==='LESSON')state=await S.continueLesson(d,state.events,at(n++));
  state=await S.respond(d,state.events,task.id==='pre-key'?null:task.reference_choice,at(n++));
}
process.stdout.write(JSON.stringify(state.events));
"""
        result = subprocess.run(["node", "--input-type=module", "-e", script], cwd=A.R.REPO,
                                capture_output=True, text=True, check=True)
        cls.original = json.loads(result.stdout)
        cls.card = raw(A.R._verifier()._card())

    def setUp(self):
        self.events = copy.deepcopy(self.original)

    def rehash(self, index):
        self.events[index]["event_id"] = compute_event_id(self.events[index])

    def test_shipped_js_event_ids_and_definition_match_python_canonical_validator(self):
        for ev in self.events:
            self.assertEqual(validate(ev), [])
        d, original, rows = A.validate_study(raw(self.events), as_of=NOW)
        self.assertEqual(len(original), 8)
        self.assertEqual(len(rows), 6)
        self.assertEqual(rows[0]["observed"]["academy_self_study"]["rubric_sha256"], d["rubric_sha256"])

    def test_import_retains_originals_and_explicit_context_bound_derived_events(self):
        events = A.import_events(self.card, raw(self.events), as_of=NOW)
        self.assertEqual(events[:8], self.events)
        self.assertEqual(len(events), 14)
        for ev in events[8:]:
            self.assertEqual(validate(ev), [])
            self.assertEqual(ev["declared"]["card_context"], "SUPPLIED_NOT_ASSERTED_AS_THE_TASK_SOURCE")
            self.assertEqual(ev["observed"]["learning_assessment"]["data_origin"], "SYNTHETIC")
            self.assertIn(ev["observed"]["source_event_id"], {x["event_id"] for x in self.events})

    def test_report_separates_transfer_abstentions_and_unknown_human_outcomes(self):
        report = A.build_report(self.card, raw(self.events), as_of=NOW)
        before = report["before_after"]
        self.assertEqual(before["phase_counts"], {"PRE": 2, "POST": 2, "TRANSFER": 2})
        self.assertEqual(before["phase_response_label_counts"]["PRE"], {"ABSTAIN": 1, "PASS": 1})
        self.assertEqual(before["structurally_paired_transfer_handles"], 1)
        self.assertIsNone(before["human_learning_gain"])
        self.assertIsNone(before["authenticated_human_count"])
        self.assertFalse(report["authority"]["execution_authorized"])
        self.assertNotIn("00000000-0000-4000-8000-000000000001", json.dumps(report))
        self.assertEqual([x["heading"] for x in report["sections"]], list(A.R.HEADINGS))
        self.assertIn("report context only", report["markdown"])

    def test_partial_session_reports_missing_phases_without_invented_rows(self):
        report = A.build_report(self.card, raw(self.events[:3]), as_of=NOW)
        self.assertEqual(report["before_after"]["assessment_rows"], 2)
        self.assertEqual(report["before_after"]["issues"]["MISSING_PRE_OR_POST"], 1)

    def test_rehashed_selected_answer_score_and_attempt_forgery_are_rejected(self):
        for field, value in [("response_label", "PASS"), ("selected_index", True), ("attempt", 2), ("phase", "POST")]:
            self.events = copy.deepcopy(self.original)
            self.events[1]["observed"]["academy_self_study"][field] = value
            self.rehash(1)
            with self.subTest(field=field), self.assertRaises(ValueError):
                A.validate_study(raw(self.events), as_of=NOW)

    def test_source_task_rubric_and_lesson_revision_mismatch_is_rejected(self):
        for field in ("case_sha256", "rubric_sha256", "lesson_revision"):
            self.events = copy.deepcopy(self.original)
            self.events[1]["observed"]["academy_self_study"][field] = "f" * 64
            self.rehash(1)
            with self.subTest(field=field), self.assertRaises(ValueError):
                A.validate_study(raw(self.events), as_of=NOW)

    def test_missing_lesson_or_reordered_transfer_is_rejected(self):
        for indexes in ([0, 1, 2, 4, 5, 6, 7], [0, 1, 2, 3, 6, 5, 4, 7]):
            with self.subTest(indexes=indexes), self.assertRaises(ValueError):
                A.validate_study(raw([self.events[i] for i in indexes]), as_of=NOW)

    def test_forged_identity_authority_and_signature_cannot_be_imported(self):
        for field, value in [("human_identity", "VERIFIED"), ("execution_authorized", True), ("participant_name", "PRIVATE_SENTINEL")]:
            self.events = copy.deepcopy(self.original)
            self.events[1]["observed"]["academy_self_study"][field] = value
            self.rehash(1)
            with self.subTest(field=field), self.assertRaises(ValueError):
                A.validate_study(raw(self.events), as_of=NOW)
        self.events = copy.deepcopy(self.original)
        self.events[1]["signature"] = {"typed_name": "PRIVATE_SENTINEL"}
        with self.assertRaises(ValueError):
            A.validate_study(raw(self.events), as_of=NOW)

    def test_future_invalid_and_repeated_timestamps_are_rejected(self):
        for at in ("2027-11-10T01:00:00.000Z", "2026-02-30T01:00:00.000Z", "2026-11-10T01:00:00.000Z"):
            self.events = copy.deepcopy(self.original)
            self.events[1]["claim"]["read_at"] = at
            self.rehash(1)
            with self.subTest(at=at), self.assertRaises(ValueError):
                A.validate_study(raw(self.events), as_of=NOW)

    def test_malformed_oversize_and_unknown_origin_inputs_are_rejected(self):
        for value in (b"not json", b"[]", b"{}", b" " * (A.MAX_STUDY_BYTES + 1)):
            with self.assertRaises(ValueError):
                A.validate_study(value, as_of=NOW)
        self.events[1]["observed"]["academy_self_study"]["data_origin"] = "HUMAN_AUTHENTICATED"
        self.rehash(1)
        with self.assertRaises(ValueError):
            A.validate_study(raw(self.events), as_of=NOW)

    def test_valid_generic_events_with_null_or_list_observed_are_bounded_rejections(self):
        for observed in (None, [], "not a self-study"):
            self.events = copy.deepcopy(self.original)
            self.events[0]["observed"] = observed
            self.rehash(0)
            self.assertEqual(validate(self.events[0]), [])
            with self.subTest(observed=observed), self.assertRaises(ValueError):
                A.validate_study(raw(self.events), as_of=NOW)

    def test_duplicate_json_keys_are_refused_like_the_browser(self):
        value = raw(self.events).replace(b'"kind": "START"', b'"kind": "ALTERED", "kind": "START"', 1)
        with self.assertRaises(ValueError):
            A.validate_study(value, as_of=NOW)

    def test_invalid_context_card_cannot_receive_derived_events(self):
        card = json.loads(self.card); card["schema_version"] = "invented"
        with self.assertRaises(ValueError):
            A.import_events(raw(card), raw(self.events), as_of=NOW)

    def test_ai_tool_disclosure_is_retained_as_a_declaration(self):
        report = A.build_report(self.card, raw(self.events), as_of=NOW,
                               ai_tools=[{"name": "Synthetic software test", "version": "1", "role": "Generated these fixture responses; no human participant"}])
        self.assertEqual(len(report["ai_tools"]), 1)
        self.assertEqual(report["ai_tools"][0]["status"], "DECLARED_NOT_INDEPENDENTLY_VERIFIED")

    def test_cli_outputs_real_report_and_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp)
            (path / "card.json").write_bytes(self.card)
            (path / "study.json").write_bytes(raw(self.events))
            args = ["--card", str(path / "card.json"), "--study", str(path / "study.json"),
                    "--as-of", NOW, "--output", str(path / "review.md")]
            self.assertEqual(A.main(args), 0)
            before = (path / "review.md").read_bytes()
            self.assertIn(b"# Evaluation and learning review", before)
            self.assertEqual(A.main(args), 2)
            self.assertEqual((path / "review.md").read_bytes(), before)


if __name__ == "__main__":
    unittest.main()
