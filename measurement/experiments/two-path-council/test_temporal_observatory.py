#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Temporal source-change guards, including no false longitudinal measurement."""
import copy
import datetime as dt
import json
import unittest
from temporal_observatory import project,compare,verify_snapshot,sha,canonical


def sample(n=3):
    return {"schema":"csoai.gspc-axes/0.5","axes":[
      {"axis":f"m-{i}","family":"gspc","kind":"model-comparison","status":"MEASURED","n":30,"separation":"TIE","historical_measurement_record":{"source_date":"2026-08-12"}}
      for i in range(n)
    ]+[{"axis":"subject-A","family":"subject","kind":"measured-subject","status":"MEASURED","n":31,"separation":None}]}


def snap(data, when):
    return project(json.dumps(data,sort_keys=True).encode(),when)


class TestTemporalObservatory(unittest.TestCase):
    def test_live_like_projection(self):
        s=snap(sample(),"2026-11-22T18:00:00Z")
        self.assertEqual(s["n_axes"],4)
        self.assertEqual(s["n_measured_declared"],4)
        self.assertEqual(s["n_separated_model_axes"],0)
        self.assertTrue(s["not_new_measurement"])
        verify_snapshot(s)

    def test_two_identical_fetches_are_not_new_tests(self):
        s1=snap(sample(),"2026-11-22T18:00:00Z")
        s2=snap(sample(),"2026-11-23T18:00:00Z")
        delta=compare(s1,s2)
        self.assertTrue(delta["same_source_content"])
        self.assertEqual(delta["conclusion"],"REOBSERVATION_NO_SOURCE_CHANGE")
        self.assertIsNone(delta["new_model_runs_verified"])
        self.assertEqual(delta["n_changed_axes"],0)

    def test_n_increase_does_not_prove_new_benchmark(self):
        baseline=sample()
        changed=copy.deepcopy(baseline)
        changed["axes"][0]["n"]=40
        delta=compare(snap(baseline,"2026-11-22T18:00:00Z"),
                     snap(changed,"2026-11-23T18:00:00Z"))
        self.assertEqual(delta["conclusion"],"BOARD_SOURCE_CHANGED_FURTHER_EVIDENCE_REQUIRED")
        self.assertFalse(delta["independent_measurement_verified"])
        self.assertEqual(delta["changed_axis_fields"]["m-0"]["n"],{"before":30,"after":40})

    def test_axis_add_and_remove_are_explicit(self):
        x=sample(2)
        y=sample(3)
        y["axes"][-1]["axis"]="subject-B"
        diff=compare(snap(x,"2026-11-22T17:00:00Z"),snap(y,"2026-11-23T17:00:00Z"))
        self.assertEqual(diff["added_axis_names"],["m-2","subject-B"])
        self.assertEqual(diff["removed_axis_names"],["subject-A"])

    def test_snapshot_tamper_rejected(self):
        s=snap(sample(),"2026-11-22T18:00:00Z")
        s["axes"]["m-1"]["n"]=0
        with self.assertRaises(ValueError):
            verify_snapshot(s)

    def test_malformed_and_duplicate_axes_rejected(self):
        x=sample()
        x["axes"].append(copy.deepcopy(x["axes"][0]))
        with self.assertRaises(ValueError):
            snap(x,"2026-11-22T18:00:00Z")
        x=sample()
        x["axes"][0]["n"]="30"
        with self.assertRaises(ValueError):
            snap(x,"2026-11-22T18:00:00Z")

    def test_no_timezone_rejected(self):
        with self.assertRaises(ValueError):
            snap(sample(),"2026-11-22T18:00:00")

    def test_out_of_order_rejected(self):
        a=snap(sample(),"2026-11-23T18:00:00Z")
        b=snap(sample(),"2026-11-22T18:00:00Z")
        with self.assertRaises(ValueError):
            compare(a,b)

    def test_not_canonical_grader_or_human_outcome(self):
        a=snap(sample(),"2026-11-22T18:00:00Z")
        self.assertTrue(a["no_human_outcome_derived"])
        self.assertNotIn("users",a)
        self.assertNotIn("consciousness",a)


if __name__=="__main__":
    unittest.main()
