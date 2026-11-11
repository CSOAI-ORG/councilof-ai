"""Synthetic correctness/negative controls; these tests are not human study data."""
import contextlib
import copy
import hashlib
import importlib.util
import io
import json
from pathlib import Path
import tempfile
import unittest

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("learning_review_report", HERE / "learning_review_report.py")
R = importlib.util.module_from_spec(spec)
spec.loader.exec_module(R)
from event import build, compute_event_id

NOW = "2026-11-11T04:00:00Z"
PRE = "2026-11-10T01:00:00Z"
POST = "2026-11-10T02:00:00Z"


def raw(obj):
    return json.dumps(obj, ensure_ascii=False, sort_keys=True, allow_nan=False).encode()


def fixture_card():
    return R._verifier()._card()


def case_hash(case):
    return hashlib.sha256(("synthetic-case:" + case).encode()).hexdigest()


def review(card, case="f1", reference="FAIL", candidate="FAIL", **changes):
    row = {"card_sha256": R.sha(raw(card)), "case_id": case, "case_sha256": case_hash(case),
           "source_group": "synthetic-source-" + case, "split": "TEST", "rubric_sha256": "d" * 64,
           "candidate_id": "synthetic-judge", "candidate_revision": "fixture-1", "trial_id": case,
           "reference_label": reference, "candidate_label": candidate, "reference_origin": "SYNTHETIC"}
    row.update(changes)
    return build(subject={"kind": "sandbox_run", "locator": "urn:synthetic:review-fixture"},
                 claim={"text": "Synthetic label-comparison fixture; no human study.",
                        "source_sha256": row["case_sha256"], "read_at": POST},
                 method={"id": "synthetic-review-fixture", "version": "1", "holder": "csoai"},
                 declared=None, observed={"evaluation_review": row}, state="PARTIAL", value=None,
                 limits=["Synthetic fixture, not a real model run or human review."])


def assessment(card, phase="PRE", case="pre-1", who="fixture-person-1", when=PRE, **changes):
    row = {"card_sha256": R.sha(raw(card)), "participant_ref": who, "phase": phase,
           "case_sha256": case_hash(case), "source_group": "synthetic-source-" + case,
           "rubric_sha256": "d" * 64, "lesson_revision": "lesson-v1:" + "e" * 64,
           "form_id": "form-" + phase, "response_label": "PASS", "data_origin": "SYNTHETIC"}
    row.update(changes)
    return build(subject={"kind": "sandbox_run", "locator": "urn:synthetic:assessment-fixture"},
                 claim={"text": "Synthetic study-structure fixture; no actual participant.",
                        "source_sha256": row["case_sha256"], "read_at": when},
                 method={"id": "synthetic-assessment-fixture", "version": "1", "holder": "csoai"},
                 declared=None, observed={"learning_assessment": row}, state="PARTIAL", value=None,
                 limits=["Synthetic fixture; human learning is not established."])


class LearningReviewTests(unittest.TestCase):
    def setUp(self):
        self.card = fixture_card()

    def report(self, events=(), **kwargs):
        return R.build_report(raw(self.card), raw(list(events)), as_of=NOW, **kwargs)

    def reject(self, events=(), card=None):
        with self.assertRaises(ValueError):
            R.build_report(raw(self.card if card is None else card), raw(list(events)), as_of=NOW)

    def test_seven_exact_headings_and_complete_no_event_readiness(self):
        r = self.report()
        self.assertEqual([x["heading"] for x in r["sections"]], list(R.HEADINGS))
        self.assertEqual([x[3:] for x in r["markdown"].splitlines() if x.startswith("## ")], list(R.HEADINGS))
        self.assertEqual(r["calibration"]["state"], "NOT_ESTABLISHED")
        self.assertEqual(r["before_after"]["state"], "NOT_ESTABLISHED")
        self.assertIsNone(r["before_after"]["human_learning_gain"])
        self.assertIsNone(r["denominators"]["authenticated_human_participants"])
        self.assertIn("does not mean none were used", r["markdown"])

    def test_existing_card_validator_is_used(self):
        card = copy.deepcopy(self.card)
        card["suite"]["items_total"] = 999
        self.reject(card=card)

    def test_unknown_schema_cannot_be_treated_as_valid(self):
        card = copy.deepcopy(self.card)
        card["schema"] = "https://example.org/unknown.json"
        self.reject(card=card)

    def test_false_heldout_count_rejected(self):
        card = copy.deepcopy(self.card)
        card["suite"]["items_held_out"] = 11
        self.reject(card=card)

    def test_unmeasured_card_cannot_smuggle_numeric_result(self):
        card = copy.deepcopy(self.card)
        card["result"]["state"] = "UNMEASURED"
        self.reject(card=card)

    def test_ledger_pointer_retained_without_claiming_verification(self):
        self.card["item_ledger"] = {"path": "fixture-ledger.jsonl", "sha256": "b" * 64, "items": 10}
        r = self.report()
        self.assertEqual(r["bindings"]["item_ledger"]["declared"], self.card["item_ledger"])
        self.assertEqual(r["bindings"]["item_ledger"]["verification"], "NOT_PERFORMED_BY_RENDERER")
        self.assertIn("does not open or verify that ledger", r["markdown"])

    def test_duplicate_arm_and_unknown_result_partition_rejected(self):
        card = copy.deepcopy(self.card)
        card["arms"][1]["id"] = card["arms"][0]["id"]
        self.reject(card=card)
        card = copy.deepcopy(self.card)
        card["result"]["per_arm"][0]["arm_id"] = "does-not-exist"
        self.reject(card=card)

    def test_result_partition_does_not_exceed_arm(self):
        card = copy.deepcopy(self.card)
        card["result"]["per_arm"][0]["items"] = 100
        self.reject(card=card)

    def test_card_and_event_raw_bytes_are_bound(self):
        ev = review(self.card)
        r = self.report([ev])
        self.assertEqual(r["bindings"]["card_sha256"], R.sha(raw(self.card)))
        self.assertEqual(r["bindings"]["events_sha256"], R.sha(raw([ev])))
        self.assertTrue(all(len(x) == 64 for x in r["bindings"]["implementation_sha256"].values()))

    def test_denominators_keep_rule_and_model_counts_distinct(self):
        r = self.report()
        self.assertEqual(r["denominators"]["answered_by_model_declared"], 6)
        self.assertEqual(r["denominators"]["answered_by_rule_declared"], 4)
        self.assertEqual(r["denominators"]["items_total"], 10)

    def test_tampered_and_missing_canonical_event_id_rejected(self):
        ev = review(self.card)
        ev["observed"]["evaluation_review"]["candidate_label"] = "PASS"
        self.reject([ev])
        ev = review(self.card)
        del ev["event_id"]
        self.reject([ev])

    def test_rehashed_wrong_card_or_source_binding_rejected(self):
        self.reject([review(self.card, card_sha256="a" * 64)])
        ev = review(self.card)
        ev["claim"]["source_sha256"] = "b" * 64
        ev["event_id"] = compute_event_id(ev)
        self.reject([ev])

    def test_future_or_missing_review_date_rejected(self):
        for value in ("2027-01-01T00:00:00Z", None):
            ev = review(self.card)
            ev["claim"]["read_at"] = value
            ev["event_id"] = compute_event_id(ev)
            self.reject([ev])

    def test_wrappers_and_capture_only_repeats_do_not_multiply_labels(self):
        ev = review(self.card)
        wrapper = copy.deepcopy(ev)
        wrapper["signature"] = {"unverified_test_string": "not-human-evidence"}
        capture = copy.deepcopy(ev)
        capture["claim"]["read_at"] = "2026-11-10T03:00:00Z"
        capture["event_id"] = compute_event_id(capture)
        r = self.report([ev, wrapper, capture])
        self.assertEqual(r["denominators"]["raw_events"], 3)
        self.assertEqual(r["denominators"]["duplicate_event_wrappers"], 1)
        self.assertEqual(r["denominators"]["capture_only_repeats"], 1)
        self.assertEqual(r["calibration"]["input_rows"], 1)
        self.assertEqual(r["calibration"], self.report([capture, wrapper, ev])["calibration"])

    def test_confusion_and_nonbinary_denominators(self):
        evs = [review(self.card, "tp", "FAIL", "FAIL"), review(self.card, "fn", "FAIL", "PASS"),
               review(self.card, "tn", "PASS", "PASS"), review(self.card, "fp", "PASS", "FAIL"),
               review(self.card, "abstain", "FAIL", "ABSTAIN"), review(self.card, "invalid", "PASS", "INVALID"),
               review(self.card, "unresolved", "UNRESOLVED", "FAIL")]
        g = self.report(evs)["calibration"]["groups"][0]
        self.assertEqual(g["confusion"], {"true_positive": 1, "false_negative": 1, "true_negative": 1, "false_positive": 1})
        self.assertEqual(g["binary_pairs"], 4)
        self.assertEqual(g["trials"], 7)
        self.assertEqual(g["failure_detection"]["denominator"], 3)
        self.assertEqual(g["correct_acceptance"]["denominator"], 3)
        self.assertEqual(g["decision_coverage"]["value"], 4 / 6)
        self.assertEqual(g["candidate_label_counts"]["INVALID"], 1)

    def test_no_reference_class_is_unavailable_not_zero_or_one(self):
        g = self.report([review(self.card)])["calibration"]["groups"][0]
        self.assertIsNone(g["correct_acceptance"]["value"])
        self.assertEqual(g["correct_acceptance"]["denominator"], 0)
        self.assertEqual(g["correct_acceptance"]["interval"]["state"], "UNAVAILABLE")

    def test_wilson_interval_numeric_and_bounded(self):
        x = R._wilson(5, 10, independent=True)
        self.assertAlmostEqual(x["lower"], 0.2365930905, places=8)
        self.assertAlmostEqual(x["upper"], 0.7634069095, places=8)
        self.assertGreaterEqual(R._wilson(0, 10, independent=True)["lower"], 0)
        self.assertLessEqual(R._wilson(10, 10, independent=True)["upper"], 1)

    def test_repeated_case_or_source_does_not_receive_independent_interval(self):
        evs = [review(self.card), review(self.card, trial_id="second-trial")]
        g = self.report(evs)["calibration"]["groups"][0]
        self.assertEqual(g["trials"], 2)
        self.assertEqual(g["distinct_cases"], 1)
        self.assertEqual(g["failure_detection"]["interval"]["state"], "UNAVAILABLE")
        evs = [review(self.card, "a", source_group="shared"), review(self.card, "b", source_group="shared")]
        self.assertEqual(self.report(evs)["calibration"]["groups"][0]["failure_detection"]["interval"]["state"], "UNAVAILABLE")

    def test_conflicting_reference_labels_and_duplicate_trials_rejected(self):
        self.reject([review(self.card), review(self.card, reference="PASS", trial_id="other")])
        self.reject([review(self.card), review(self.card, "another-case", trial_id="f1")])

    def test_different_regimes_are_not_pooled(self):
        evs = [review(self.card), review(self.card, "new", candidate_revision="fixture-2")]
        self.assertEqual(len(self.report(evs)["calibration"]["groups"]), 2)

    def test_train_test_source_and_byte_overlap_are_rejected(self):
        self.reject([review(self.card, "train", split="TRAIN", source_group="same"),
                     review(self.card, "test", split="TEST", source_group="same")])
        self.reject([review(self.card, "train", split="TRAIN"),
                     review(self.card, "test", split="TEST", case_sha256=case_hash("train"))])

    def test_changed_case_id_revision_rejected(self):
        self.reject([review(self.card), review(self.card, trial_id="other", case_sha256="f" * 64)])

    def test_role_strings_and_signatures_cannot_authenticate_humans(self):
        ev = review(self.card, reference_origin="HUMAN_DECLARED")
        ev["observed"]["human_verified"] = True
        ev["observed"]["reviewer_role"] = "Chair"
        ev["signature"] = {"human": True}
        ev["event_id"] = compute_event_id(ev)
        r = self.report([ev])
        self.assertEqual(r["calibration"]["human_calibration"], "NOT_ESTABLISHED")
        self.assertIsNone(r["denominators"]["authenticated_human_participants"])
        self.assertFalse(r["authority"]["execution_authorized"])
        self.assertFalse(r["authority"]["charter_adopted"])

    def test_unknown_review_authority_fields_rejected(self):
        ev = review(self.card)
        ev["observed"]["evaluation_review"]["authenticated_human"] = True
        ev["event_id"] = compute_event_id(ev)
        self.reject([ev])

    def test_private_event_text_and_handles_are_not_exported(self):
        ev = assessment(self.card, who="PRIVATE_PARTICIPANT_SENTINEL")
        ev["claim"]["text"] = "PRIVATE_CASE_SENTINEL"
        ev["observed"]["free_text"] = "PRIVATE_REPORT_SENTINEL"
        ev["event_id"] = compute_event_id(ev)
        rendered = json.dumps(self.report([ev]))
        for sentinel in ("PRIVATE_PARTICIPANT_SENTINEL", "PRIVATE_CASE_SENTINEL", "PRIVATE_REPORT_SENTINEL"):
            self.assertNotIn(sentinel, rendered)

    def test_before_after_pairs_do_not_become_human_gains(self):
        evs = [assessment(self.card), assessment(self.card, "POST", "post-1", when=POST)]
        x = self.report(evs)["before_after"]
        self.assertEqual(x["state"], "STRUCTURALLY_PAIRED_UNVERIFIED")
        self.assertEqual(x["structurally_paired_handles"], 1)
        self.assertIsNone(x["human_learning_gain"])
        self.assertIsNone(x["authenticated_human_count"])

    def test_before_after_missingness_and_unmatched_handles(self):
        evs = [assessment(self.card), assessment(self.card, "POST", "post-1", who="different-handle", when=POST)]
        x = self.report(evs)["before_after"]
        self.assertEqual(x["structurally_paired_handles"], 0)
        self.assertEqual(x["issues"]["MISSING_PRE_OR_POST"], 2)

    def test_reused_transfer_cases_and_changed_rubric_flagged(self):
        evs = [assessment(self.card), assessment(self.card, "POST", "pre-1", when=POST, rubric_sha256="f" * 64)]
        x = self.report(evs)["before_after"]
        self.assertEqual(x["structurally_paired_handles"], 0)
        self.assertEqual(x["issues"]["REUSED_PRE_POST_CASES"], 1)
        self.assertEqual(x["issues"]["RUBRIC_CHANGED"], 1)

    def test_reversed_chronology_and_training_overlap_flagged(self):
        evs = [review(self.card, "train", split="TRAIN", source_group="teaching"),
               assessment(self.card, when=POST),
               assessment(self.card, "POST", "post-1", when=PRE, source_group="teaching")]
        x = self.report(evs)["before_after"]
        self.assertEqual(x["issues"]["PRE_POST_CHRONOLOGY_NOT_ESTABLISHED"], 1)
        self.assertEqual(x["issues"]["TRANSFER_SOURCE_OVERLAPS_TRAINING"], 1)

    def test_supplemental_event_is_not_implicitly_support(self):
        ev = review(self.card)
        ev["observed"] = {"unrelated": True}
        ev["event_id"] = compute_event_id(ev)
        r = self.report([ev])
        self.assertEqual(r["bindings"]["event_refs"][0]["relationship"], "SUPPLEMENTAL_NOT_ASSERTED_AS_SUPPORT")
        self.assertEqual(r["calibration"]["input_rows"], 0)

    def test_ai_disclosure_event_binding_and_missing_disclosure(self):
        ev = review(self.card)
        tool = {"name": "Synthetic model", "version": "1", "role": "fixture labels", "evidence_event_ids": [ev["event_id"]]}
        r = self.report([ev], ai_tools=[tool], proposed_decisions=["Review failed fixtures."])
        self.assertEqual(r["ai_tools"][0]["status"], "DECLARED_NOT_INDEPENDENTLY_VERIFIED")
        self.assertEqual(r["proposed_decisions"][0]["state"], "PROPOSED_NOT_ADOPTED")
        tool["evidence_event_ids"] = ["sha256:" + "a" * 64]
        with self.assertRaises(ValueError):
            self.report([ev], ai_tools=[tool])

    def test_markdown_escapes_source_markup(self):
        self.card["title"] = "<script>alert(1)</script> [link](javascript:evil)"
        text = self.report()["markdown"]
        self.assertNotIn("<script>", text)
        self.assertNotIn("[link](javascript:evil)", text)

    def test_report_replay_is_deterministic_and_tampering_rejected(self):
        r = self.report([review(self.card)])
        self.assertEqual(r, self.report([review(self.card)]))
        r["denominators"]["items_total"] = 10000
        with self.assertRaises(ValueError):
            R.render_markdown(r)

    def test_jsonl_is_accepted_without_changing_event_accounting(self):
        ev = review(self.card)
        r = R.build_report(raw(self.card), raw(ev) + b"\n", as_of=NOW)
        self.assertEqual(r["calibration"], self.report([ev])["calibration"])

    def test_duplicate_json_keys_nan_and_oversize_refused(self):
        for bad in (b'{"schema":null,"schema":null}', b'{"n":NaN}', b" " * (R.MAX_BYTES + 1)):
            with self.assertRaises(ValueError):
                R.build_report(bad, as_of=NOW)

    def test_cli_creates_report_but_does_not_overwrite(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            card = folder / "card.json"
            output = folder / "review.md"
            card.write_bytes(raw(self.card))
            args = ["--card", str(card), "--as-of", NOW, "--output", str(output)]
            self.assertEqual(R.main(args), 0)
            first = output.read_bytes()
            with contextlib.redirect_stderr(io.StringIO()):
                self.assertEqual(R.main(args), 2)
            self.assertEqual(first, output.read_bytes())

    def test_symlink_and_nonregular_input_refused(self):
        with tempfile.TemporaryDirectory() as d:
            folder = Path(d)
            card = folder / "card.json"
            card.write_bytes(raw(self.card))
            link = folder / "link.json"
            link.symlink_to(card)
            with self.assertRaises(ValueError):
                R.read_bounded(link)
            with self.assertRaises(ValueError):
                R.read_bounded(folder)

    def test_v02_failure_classes_are_retained(self):
        self.card = R._verifier()._card_02()
        r = self.report()
        self.assertEqual(r["failure_classes"], self.card["limitation_taxonomy"]["classes"])
        self.assertIn("sample", r["markdown"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
