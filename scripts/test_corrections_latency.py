#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Regression: latency counts and true median never imply independent publishing."""
import copy
import unittest
from scripts.corrections_latency import analyse, time_to_correct


def source():
    rows=[
      {"id":"C1","date":"2026-11-23","detected_at":"2026-11-23T10:00:00Z",
       "published_at":"2026-11-23T11:00:00Z","what_was_wrong":"x","how_caught":"test","fix":"x","status":"FIXED"},
      {"id":"C2","date":"2026-11-23","detected_at":"2026-11-23T10:00:00Z",
       "published_at":"2026-11-23T13:00:00Z","what_was_wrong":"x","how_caught":"test","fix":"x","status":"FIXED"},
      {"id":"C3","date":"2026-11-22","detected_at":"2026-11-22",
       "published_at":"2026-11-23T10:00:00Z","what_was_wrong":"x","how_caught":"test","fix":"x","status":"FIXED"},
      {"id":"C4","date":"2026-11-21","detected_at":"UNRECORDED",
       "published_at":"UNRECORDED","what_was_wrong":"x","how_caught":"test","fix":"x","status":"FIXED"},
    ]
    return {"schema":"csoai.corrections/0.1","corrections":rows,
            "correction_latency":{"exact":2,"upper_bound":1,"unmeasured":1,
                                  "median_seconds_exact":10800}}


class CorrectionsLatencyTests(unittest.TestCase):
    def test_true_median_and_source_bug_are_visible(self):
        r=analyse(source(),"2026-11-23T11:00:00Z")
        self.assertEqual(r["correction_latency"]["median_seconds_exact_conventional"],7200)
        self.assertEqual(r["correction_latency"]["median_seconds_exact_source_reported"],10800)
        self.assertEqual(r["correction_latency"]["median_source_comparison"],"DIVERGENT")
        self.assertEqual(r["correction_latency"]["source_interval_count_comparison"],"CONSISTENT")

    def test_source_fixed_median_reads_consistent(self):
        s=source()
        s["correction_latency"]["median_seconds_exact"]=7200
        self.assertEqual(analyse(s)["correction_latency"]["median_source_comparison"],"CONSISTENT")

    def test_unknown_publication_unmeasured(self):
        v=time_to_correct({"detected_at":"2026-11-20T10:00:00Z","published_at":"UNRECORDED"})
        self.assertEqual(v["kind"],"UNMEASURED")
        r=analyse(source())
        self.assertEqual(r["correction_latency"]["published_at_unrecorded_or_invalid"],1)
        self.assertTrue(r["correction_latency"]["no_backfill"])

    def test_day_only_detection_is_upper_bound_not_exact(self):
        v=time_to_correct({"detected_at":"2026-11-22","published_at":"2026-11-23T10:00:00Z"})
        self.assertEqual(v["kind"],"UPPER_BOUND")
        self.assertEqual(v["seconds"],34*3600)
        self.assertEqual(v["lower_bound_seconds"],10*3600)

    def test_precise_window_tightens_bound(self):
        v=time_to_correct({"detected_at":"2026-11-22",
             "detected_window":{"not_before":"2026-11-22T13:00:00Z",
                                "not_after":"2026-11-22T15:00:00Z"},
             "published_at":"2026-11-23T10:00:00Z"})
        self.assertEqual(v["kind"],"UPPER_BOUND")
        self.assertEqual(v["seconds"],21*3600)
        self.assertEqual(v["lower_bound_seconds"],19*3600)

    def test_negative_latency_is_invalid_not_positive(self):
        self.assertEqual(time_to_correct({"detected_at":"2026-11-23T12:00:00Z",
         "published_at":"2026-11-23T11:00:00Z"})["kind"],"INVALID_ORDER")

    def test_no_tz_keeps_latency_unmeasured(self):
        self.assertEqual(time_to_correct({"detected_at":"2026-11-23T10:00:00",
         "published_at":"2026-11-23T11:00:00Z"})["kind"],"UNMEASURED")

    def test_source_does_not_claim_independent_publication(self):
        r=analyse(source())
        self.assertFalse(r["signature_independently_verified"])
        self.assertEqual(r["correction_latency"]["independent_deployment_evidence"],"NOT_VERIFIED")
        self.assertEqual(r["correction_latency"]["ots_and_rekor_per_correction_inclusion"],"NOT_VERIFIED")

    def test_wrong_source_schema_refused(self):
        s=source();s["schema"]="csoai.corrections/999"
        with self.assertRaises(ValueError):analyse(s)


if __name__=="__main__":
    unittest.main()
