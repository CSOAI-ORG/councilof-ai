#!/usr/bin/env python3
"""test_watchdog_charter_feed.py — the routing queue must be PROVABLY unable to decide.

A charter feed that can open a challenge, approve an action, or assert that an
obligation is satisfied is not a routing queue — it is a machine in the human's seat,
which is the one thing the estate's HOLD gate exists to prevent.

These tests pin the properties that make the feed safe to publish:

  1. Every row's human_decision is HOLD and may_apply is False.
  2. No row opens a challenge, and no row asserts a determination.
  3. Relevance is a MECHANICAL grid intersection — a source whose grid does not meet
     an obligation's grid never raises it.
  4. A source that did NOT answer is still routed, with the reason stated, because a
     watchdog that stopped answering is a fact a human must see.
  5. The feed never invents a count: a source with no count carries none.

Run: python3 scripts/test_watchdog_charter_feed.py
"""
from __future__ import annotations

import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import watchdog_charter_feed as wcf  # noqa: E402

INDEX = {
    "run_id": "TESTRUN",
    "as_of": "2026-10-30T00:00:00Z",
    "run_artifact": "/interop/watchdog-intake/TESTRUN.json",
    "signals": [
        {
            "source_id": "reachable-advisory",
            "name": "A reachable advisory feed",
            "kind": "advisory-feed",
            "state": "REACHABLE",
            "count": 1764,
            "count_kind": "count",
            "grid": ["supply-chain", "provenance"],
            "body_sha256": "a" * 64,
        },
        {
            "source_id": "dead-watchdog",
            "name": "A watchdog that stopped answering",
            "kind": "advisory-feed",
            "state": "UNREACHABLE",
            "count": None,
            "count_kind": "absent",
            "grid": ["supply-chain"],
            "body_sha256": None,
        },
        {
            "source_id": "off-grid-source",
            "name": "A source touching no obligation grid",
            "kind": "advisory-feed",
            "state": "REACHABLE",
            "count": 3,
            "count_kind": "count",
            "grid": ["jail"],
            "body_sha256": "b" * 64,
        },
    ],
    "unpinned_findings": [],
}


class TestRelevanceIsMechanical(unittest.TestCase):
    def test_a_grid_intersection_raises_an_obligation(self):
        ids = wcf.obligations_for(INDEX["signals"][0])
        self.assertIn("dora", ids)
        self.assertIn("article-50", ids)

    def test_a_source_off_every_obligation_grid_raises_nothing(self):
        self.assertEqual(wcf.obligations_for(INDEX["signals"][2]), [])

    def test_the_rule_is_reproducible(self):
        # The same source must raise the same obligations every time — relevance that
        # drifts between runs is relevance that cannot be audited.
        first = wcf.obligations_for(INDEX["signals"][0])
        second = wcf.obligations_for(INDEX["signals"][0])
        self.assertEqual(first, second)


class TestTheFeedDecidesNothing(unittest.TestCase):
    def setUp(self):
        self.feed = wcf.build(INDEX)

    def test_every_row_is_hold_and_cannot_apply(self):
        for row in self.feed["rows"]:
            self.assertEqual(row["human_decision"], "HOLD", row["row_id"])
            self.assertFalse(row["may_apply"], row["row_id"])
            self.assertFalse(row["approval_may_be_inferred"], row["row_id"])

    def test_no_row_opens_a_challenge(self):
        for row in self.feed["rows"]:
            self.assertFalse(row["challenge_opened"], row["row_id"])
            self.assertIn("/api/hitl", row["challenge_note"])

    def test_no_row_asserts_a_determination(self):
        banned = ("satisfied", "compliant", "non-compliant", "violation", "breach", "approved")
        for row in self.feed["rows"]:
            # Check the row's SUBSTANTIVE fields, not its `is_not` disclaimer list — a
            # disclaimer that says "this is not a determination" contains the word
            # "determination" by construction, and a test that cannot tell a denial
            # from an assertion is a test that proves nothing.
            substantive = {k: v for k, v in row.items() if k != "is_not"}
            blob = " ".join(str(v) for v in substantive.values()).lower()
            for word in banned:
                self.assertNotIn(word, blob, f"{row['row_id']} states a determination: {word}")

    def test_the_disclaimer_list_is_present_on_every_row(self):
        for row in self.feed["rows"]:
            self.assertTrue(row["is_not"], row["row_id"])
            self.assertTrue(any("determination" in n for n in row["is_not"]), row["row_id"])

    def test_the_feed_declares_what_it_is_not(self):
        for phrase in ("compliance determination", "certification", "approval"):
            self.assertTrue(any(phrase in n for n in self.feed["not_a"]), phrase)

    def test_the_feed_carries_no_score_or_rank_field(self):
        for row in self.feed["rows"]:
            for forbidden in ("score", "grade", "rank", "risk_level", "verdict"):
                self.assertNotIn(forbidden, row, f"{row['row_id']} carries a {forbidden} field")


class TestTheGapStaysVisible(unittest.TestCase):
    def setUp(self):
        self.feed = wcf.build(INDEX)

    def test_an_unreachable_watchdog_is_still_routed(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "dead-watchdog"]
        self.assertTrue(rows, "a watchdog that stopped answering must still reach a human")
        for row in rows:
            self.assertEqual(row["source_state"], "UNREACHABLE")
            self.assertIn("did not answer", row["routing_reason"])
            self.assertEqual(row["human_decision"], "HOLD")

    def test_an_unreachable_watchdog_lands_in_the_top_routing_bucket(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "dead-watchdog"]
        for row in rows:
            self.assertTrue(row["routing_bucket"].startswith("A"), row["routing_bucket"])

    def test_no_count_is_invented_for_a_silent_source(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "dead-watchdog"]
        for row in rows:
            self.assertIsNone(row["observed_count"])
            self.assertEqual(row["observed_count_kind"], "absent")

    def test_the_off_grid_source_raises_nothing_at_all(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "off-grid-source"]
        self.assertEqual(rows, [], "a source touching no obligation grid must not raise one")


class TestTheQueueIsCountableWithoutBeingAScore(unittest.TestCase):
    def test_the_row_count_is_a_routing_count(self):
        feed = wcf.build(INDEX)
        self.assertEqual(feed["totals"]["rows"], len(feed["rows"]))
        self.assertIn("routing count", feed["count_grammar"])
        self.assertIn("not a measurement", feed["count_grammar"])

    def test_the_digest_binds_what_the_human_saw(self):
        feed = wcf.build(INDEX)
        rows = [r for r in feed["rows"] if r["source_id"] == "reachable-advisory"]
        for row in rows:
            self.assertEqual(row["source_digest"], "a" * 64)



class TestAxisReports(unittest.TestCase):
    def setUp(self):
        self.names = ["axis-" + str(i) for i in range(34)]
        self.registry={"schema":"csoai.axis-specialist-registry/1.0","specialists":[{"axis":a,"reviewer_role":"declared reviewer"} for a in self.names]}
        self.charter={"schema":"council.axis-charter-map/1.0","axes":[{"axis":a,"articles":[1,2]} for a in self.names],"provenance":"fixture cross-reference only"}
        self.context={"kind":"model-comparison","bank_sha256":"a"*64,"method_sha":"b"*64,
                      "model_versions":["fixture-v1"],"applies_to":"fixture-subject","n_note":"paired cases"}
        self.current={"axes":{a:{"kind":"model-comparison","status":"MEASURED","n":0,"measurement_time":{"state":"DAY","observed_on":"2026-08-12"},
                                "separation":"TIE","comparison_identity":dict(self.context)} for a in self.names}}
        import copy
        self.previous=copy.deepcopy(self.current)
        self.reports={"state":"READ_HASH_BOUND_METADATA","previous_state":"EXACT_PREVIOUS_BYTES",
                      "current":self.current,"previous":self.previous,
                      "current_ref":{"sha256":"c"*64},"previous_ref":{"sha256":"d"*64}}
    def history(self):return wcf.axis_report_history(self.registry,self.charter,self.reports)
    def test_all34_unique_with_hold_and_no_appointment(self):
        h=self.history();self.assertEqual(len(h["rows"]),34)
        self.assertEqual(len({r["axis"] for r in h["rows"]}),34)
        for r in h["rows"]:
            self.assertEqual(r["human_decision"],"HOLD");self.assertFalse(r["may_apply"])
            self.assertFalse(r["challenge_opened"]);self.assertFalse(r["approval_may_be_inferred"])
            self.assertEqual(r["reviewer_acceptance"],"NOT_ESTABLISHED")
            self.assertEqual(r["current"]["n"],0)
            self.assertEqual(r["current"]["measurement_time"]["observed_on"],"2026-08-12")
    def test_tampered_axis_metadata_cannot_pass_build_boundary(self):
        import copy
        for field,value in [("human_decision","ALLOW"),("may_apply",True),
                            ("approval_may_be_inferred",True),("challenge_opened",True)]:
            h=copy.deepcopy(self.history());h["rows"][0][field]=value
            with self.assertRaises(ValueError):wcf.build(INDEX,h)
    def test_source_population_stays_separate(self):
        original=wcf.build(INDEX);combined=wcf.build(INDEX,self.history())
        self.assertEqual(original["rows"],combined["rows"])
        self.assertEqual(original["totals"]["rows"],combined["totals"]["rows"])
        self.assertEqual(combined["totals"]["gspc_axis_report_rows"],34)
    def test_gain_loss_tie_and_incompatible_variation(self):
        a,b,c,d=self.names[:4]
        self.current["axes"][a]["separation"]="SEPARATED"
        self.previous["axes"][b]["separation"]="SEPARATED"
        self.previous["axes"][c]["separation"]="UNTESTED"
        self.current["axes"][d]["separation"]="SEPARATED"
        self.current["axes"][d]["comparison_identity"]["method_sha"]="e"*64
        rows={r["axis"]:r for r in self.history()["rows"]}
        self.assertEqual(rows[a]["event"],"SOURCE_DECLARED_SEPARATION_GAINED")
        self.assertEqual(rows[b]["event"],"SOURCE_DECLARED_SEPARATION_LOST")
        self.assertEqual(rows[c]["event"],"SOURCE_DECLARED_TIE")
        self.assertEqual(rows[d]["event"],"INCOMPARABLE_VARIATION")
    def test_absent_current_axis_and_unknown_previous_are_explicit(self):
        self.current["axes"].pop(self.names[0])
        self.reports["previous_state"]="PREVIOUS_REFERENCE_UNBOUND"
        h=self.history()
        self.assertEqual(h["coverage"]["current_rows_missing"],[self.names[0]])
        self.assertEqual(h["rows"][1]["event"],"PREVIOUS_UNRESOLVED")
        self.assertEqual(h["coverage"]["rows"],34)
    def test_duplicate_registry_refused(self):
        self.registry["specialists"].append(dict(self.registry["specialists"][0]))
        with self.assertRaises(ValueError):self.history()
    def test_numeric_regression_needs_identical_context_and_corrections_keep_zero(self):
        a=self.names[0]
        self.current["axes"][a].update(kind="model-comparison",accuracy=0.2,n=10)
        self.previous["axes"][a].update(kind="model-comparison",accuracy=0.8,n=10)
        self.current["corrections"]={"ledger_rows":0};self.previous["corrections"]={"ledger_rows":0}
        h=self.history()
        self.assertEqual(h["rows"][0]["observed_metric_direction"],"OBSERVED_DECREASE")
        self.assertEqual(h["correction_history"]["row_count_delta"],0)
        self.current["axes"][a]["comparison_identity"]["method_sha"]="f"*64
        self.assertEqual(self.history()["rows"][0]["observed_metric_direction"],"NOT_COMPARED")
    def test_context_only_variations_are_not_unchanged_evidence(self):
        import copy
        axis=self.names[0]
        template=copy.deepcopy(self.reports)
        for side in ("current","previous"):
            template[side]["axes"][axis].update(n=10,accuracy=0.8)
        self.reports=copy.deepcopy(template)
        baseline={r["axis"]:r for r in self.history()["rows"]}[axis]
        self.assertEqual(baseline["event"],"UNCHANGED_EVIDENCE")
        self.assertEqual(baseline["observed_metric_direction"],"UNCHANGED")
        self.assertEqual(baseline["changed_fields"],[])
        for field,value in [("bank_sha256","e"*64),("method_sha","f"*64),
                            ("model_versions",["fixture-v2"]),("applies_to","fixture-other-scope")]:
            with self.subTest(context_field=field):
                self.reports=copy.deepcopy(template)
                self.reports["current"]["axes"][axis]["comparison_identity"][field]=value
                row={r["axis"]:r for r in self.history()["rows"]}[axis]
                self.assertEqual(row["event"],"INCOMPARABLE_VARIATION")
                self.assertEqual(row["comparison_state"],"CONTEXT_VARIATION")
                self.assertEqual(row["changed_fields"],[])
                self.assertNotEqual(row["previous_context_sha256"],row["current_context_sha256"])
                self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
                self.assertEqual(row["human_decision"],"HOLD")
                self.assertFalse(row["may_apply"]);self.assertFalse(row["approval_may_be_inferred"])
                self.assertFalse(row["challenge_opened"])
    def test_zero_or_changed_sample_count_is_not_numeric_regression(self):
        a=self.names[0]
        self.current["axes"][a].update(accuracy=0.1,n=0)
        self.previous["axes"][a].update(accuracy=0.9,n=0)
        self.assertEqual(self.history()["rows"][0]["observed_metric_direction"],"NOT_COMPARED")
        self.current["axes"][a]["n"]=5;self.previous["axes"][a]["n"]=10
        self.assertEqual(self.history()["rows"][0]["observed_metric_direction"],"NOT_COMPARED")
    def test_exact_bytes_required_for_previous_join(self):
        import json,hashlib
        day="2026-11-06";previous="2026-11-05";rev="a"*40
        old={"schema":"csoai.daily-report/0.1","report_date":previous,"axes":{}}
        old_raw=json.dumps(old).encode()
        current={"schema":"csoai.daily-report/0.1","report_date":day,"axes":{},
                 "changes_vs_previous":{"previous_report":previous},
                 "source_hashes":{"previous_report":{"sha256":"0"*64}}}
        raw=json.dumps(current).encode()
        sig={"schema":"csoai.daily-report-sig/0.1","signed_file":f"daily-report-{day}.json",
             "signed_file_sha256":hashlib.sha256(raw).hexdigest(),"signature":None}
        def read(url):
            if "/api/datasets/" in url:return json.dumps({"sha":rev}).encode()
            if url.endswith(f"{previous}.json"):return old_raw
            if url.endswith(".sig"):return json.dumps(sig).encode()
            return raw
        result=wcf.published_reports(day,read)
        self.assertEqual(result["previous_state"],"PREVIOUS_BYTES_CONFLICT")
        self.assertIsNone(result["previous"])
    def test_retrieval_error_does_not_become_zero(self):
        def fail(url):raise TimeoutError()
        r=wcf.published_reports("2026-11-06",fail)
        self.assertEqual(r["state"],"UNAVAILABLE")
        self.reports=r
        h=self.history();self.assertEqual(len(h["coverage"]["current_rows_missing"]),34)
    def test_nonfinite_and_duplicate_metadata_refused(self):
        for raw in [b'{"x":1e999}',b'{"x":1,"x":2}']:
            with self.assertRaises(ValueError):wcf.strict_report(raw)


    def referee_fixture(self):
        return {"schema":"csoai.referee-observation/0.1", "human_decision":"HOLD", "may_apply":False,
                "observation_state":"SOURCE_DECLARED", "provenance_state":"DECLARED_BINDINGS_ONLY",
                "bindings":{k:("a"*64 if k.endswith("_sha256") else "fixture")
                            for k in ("artifact_sha256","source_sha256","bank_sha256","grader_sha256",
                                      "rubric_sha256","measured_at","subject","scope")},
                "referees":[{"id":"r1","implementation_sha256":"b"*64,"version":"v1","failure_domain":"d1",
                             "controller_id":"c1","decision_origin":"o1"}],
                "source_declared_verdict":"OBSERVED", "copied_decision_declared":False}
    def put_referees(self):
        import copy
        for side in ("current","previous"):
            for axis in self.names:
                self.reports[side]["axes"][axis]["referee_observation"]=copy.deepcopy(self.referee_fixture())
    def test_referee_all34_preserved_without_authority(self):
        self.put_referees()
        h=self.history()
        self.assertEqual([r["axis"] for r in h["rows"]],self.names)
        for row in h["rows"]:
            ref=row["referee_history"]
            self.assertEqual(ref["current"]["source_declared"]["source_declared_verdict"],"OBSERVED")
            self.assertEqual(ref["current"]["independence_state"],"NOT_ESTABLISHED")
            self.assertEqual(ref["current"]["bft_state"],"NOT_DEMONSTRATED")
            self.assertFalse(ref["may_apply"]);self.assertEqual(ref["human_decision"],"HOLD")
    def test_referee_missing_legacy_keeps_measurement_history(self):
        row=self.history()["rows"][0]
        self.assertEqual(row["event"],"UNCHANGED_EVIDENCE")
        self.assertEqual(row["referee_history"]["current"]["metadata_state"],"MISSING")
        self.assertEqual(row["referee_history"]["current"]["independence_state"],"UNKNOWN")
    def test_referee_verdict_change_is_visible(self):
        self.put_referees();axis=self.names[0]
        self.current["axes"][axis]["referee_observation"]["source_declared_verdict"]="CONTESTED"
        row=self.history()["rows"][0]
        self.assertIn("referee_observation",row["changed_fields"])
        self.assertNotEqual(row["event"],"UNCHANGED_EVIDENCE")
        self.assertEqual(row["referee_history"]["event"],"REFEREE_OBSERVATION_CHANGED")
    def test_referee_context_change_blocks_numeric_gain(self):
        import copy
        self.put_referees();axis=self.names[0]
        self.previous["axes"][axis].update(n=10,accuracy=0.2)
        self.current["axes"][axis].update(n=10,accuracy=0.9)
        original=copy.deepcopy(self.current["axes"][axis]["referee_observation"])
        for field in ("grader_sha256","rubric_sha256","bank_sha256","source_sha256"):
            with self.subTest(field=field):
                self.current["axes"][axis]["referee_observation"]=copy.deepcopy(original)
                self.current["axes"][axis]["referee_observation"]["bindings"][field]="e"*64
                row=self.history()["rows"][0]
                self.assertEqual(row["event"],"INCOMPARABLE_VARIATION")
                self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
    def test_referee_identity_change_is_context_change(self):
        import copy
        self.put_referees();axis=self.names[0]
        self.previous["axes"][axis].update(n=10,accuracy=0.2)
        self.current["axes"][axis].update(n=10,accuracy=0.9)
        original=copy.deepcopy(self.current["axes"][axis]["referee_observation"])
        for key,value in (("id","r2"),("implementation_sha256","e"*64),("version","v2"),
                          ("failure_domain","d2"),("controller_id","c2"),
                          ("quorum_geometry",{"n":7,"f":2,"q":5})):
            self.current["axes"][axis]["referee_observation"]=copy.deepcopy(original)
            raw=self.current["axes"][axis]["referee_observation"]
            if key=="quorum_geometry":raw[key]=value
            else:raw["referees"][0][key]=value
            row=self.history()["rows"][0]
            self.assertEqual(row["comparison_state"],"UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT")
            self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
        a=self.referee_fixture();b=copy.deepcopy(a)
        a["quorum_geometry"]={"n":4,"f":1,"q":3}
        b["quorum_geometry"]={"n":4,"f":True,"q":3}
        self.assertEqual(wcf.referee_history(a,b)["comparison_state"],
                         "UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT")
    def test_referee_disappearance_remains_visible(self):
        self.put_referees();axis=self.names[0]
        del self.current["axes"][axis]["referee_observation"]
        row=self.history()["rows"][0]
        self.assertEqual(row["referee_history"]["event"],"CURRENT_REFEREE_UNAVAILABLE")
        self.assertIn("referee_observation",row["changed_fields"])
        self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
    def test_referee_malformed_or_authority_claim_never_admitted(self):
        for raw in ([],{"schema":"unknown"},{**self.referee_fixture(),"may_apply":True},
                    {**self.referee_fixture(),"human_decision":"ALLOW"},
                    {**self.referee_fixture(),"referees":["bad"]}):
            ref=wcf.referee_projection(raw)
            self.assertEqual(ref["metadata_state"],"MALFORMED")
            self.assertFalse(ref["may_apply"]);self.assertEqual(ref["bft_state"],"NOT_DEMONSTRATED")
    def test_referee_copied_origins_and_forged_verified_claims(self):
        raw=self.referee_fixture()
        raw.update(independence_state="VERIFIED",source_declared_bft="VERIFIED",
                   signature_state="VERIFIED",observation_sha256="0"*64)
        raw["referees"].append({**raw["referees"][0],"id":"r2"})
        ref=wcf.referee_projection(raw)
        self.assertEqual(ref["independence_state"],"DEPENDENT")
        self.assertEqual(ref["bft_state"],"NOT_DEMONSTRATED")
        self.assertEqual(ref["signature_state"],"NOT_CHECKED_BY_CONSUMER")
        self.assertNotEqual(ref["observation_sha256"],"0"*64)
    def test_referee_repetition_neither_freshness_nor_compounding(self):
        self.put_referees();row=self.history()["rows"][0]
        self.assertEqual(row["referee_history"]["event"],"UNCHANGED_REFEREE_OBSERVATION")
        self.assertEqual(row["event"],"UNCHANGED_EVIDENCE")
        self.assertEqual(row["current"]["measurement_time"]["observed_on"],"2026-08-12")
        self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
        import copy
        unknown={"schema":"csoai.referee-observation/0.1","human_decision":"HOLD",
                 "may_apply":False,"observation_state":"UNKNOWN","independence_state":"UNKNOWN"}
        for side in ("current","previous"):
            self.reports[side]["axes"][self.names[0]]["referee_observation"]=copy.deepcopy(unknown)
        row=self.history()["rows"][0]
        self.assertEqual(row["event"],"UNCHANGED_EVIDENCE")
        self.assertEqual(row["comparison_state"],"UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT")
        self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
    def test_referee_input_is_not_mutated_or_aliased(self):
        import copy
        raw=self.referee_fixture();before=copy.deepcopy(raw)
        ref=wcf.referee_projection(raw);self.assertEqual(raw,before)
        ref["source_declared"]["bindings"]["subject"]="changed-output"
        self.assertEqual(raw,before)
    def test_referee_missing_previous_cannot_create_gain(self):
        self.put_referees();self.reports["previous_state"]="PREVIOUS_REFERENCE_UNBOUND"
        row=self.history()["rows"][0]
        self.assertEqual(row["event"],"PREVIOUS_UNRESOLVED")
        self.assertEqual(row["referee_history"]["event"],"PREVIOUS_REFEREE_UNAVAILABLE")
        self.assertEqual(row["observed_metric_direction"],"NOT_COMPARED")
    def test_referee_invalid_bindings_and_nonfinite_metadata(self):
        raw=self.referee_fixture();raw["bindings"]["grader_sha256"]="not-a-digest"
        hist=wcf.referee_history(raw,raw)
        self.assertEqual(hist["comparison_state"],"UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT")
        raw["quorum_geometry"]={"n":float("nan")}
        self.assertEqual(wcf.referee_projection(raw)["metadata_state"],"MALFORMED")
        for field in ("observation_state","provenance_state"):
            raw=self.referee_fixture();raw[field]="UNKNOWN"
            self.assertEqual(wcf.referee_history(raw,raw)["comparison_state"],
                             "UNRESOLVED_OR_CHANGED_REFEREE_CONTEXT")


    def test_referee_nested_authority_cannot_cross_build_boundary(self):
        import copy
        self.put_referees();original=self.history()
        self.assertEqual(wcf.build(INDEX,original)["totals"]["gspc_axis_report_rows"],34)
        cases=[("history","may_apply",True),("history","human_decision","ALLOW"),
               ("current","may_apply",True),("previous","human_decision","ALLOW"),
               ("current","bft_state","VERIFIED"),("previous","signature_state","VERIFIED"),
               ("current","independence_state","VERIFIED"),
               ("history","measurement_admission","APPROVED")]
        for target,field,value in cases:
            with self.subTest(target=target,field=field):
                tampered=copy.deepcopy(original);ref=tampered["rows"][0]["referee_history"]
                (ref if target=="history" else ref[target])[field]=value
                with self.assertRaises(ValueError):wcf.build(INDEX,tampered)

if __name__ == "__main__":
    unittest.main(verbosity=2)
