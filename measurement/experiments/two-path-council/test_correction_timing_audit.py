#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Date-only, unknown and ambiguous dates must never imply exact latency."""
import copy
import unittest

from correction_timing_audit import parse_date_kind,reanalyse


def example():
    return {"schema":"csoai.corrections/0.1","corrections":[
      {"id":"A","date":"2026-11-22","detected_at":"2026-11-21T10:00:00Z",
       "published_at":"2026-11-22T12:00:00Z","timing_evidence":["signed source"]},
      {"id":"B","date":"2026-11-20","detected_at":"2026-11-15",
       "published_at":"2026-11-20T12:00:00Z","timing_evidence":["day only"]},
      {"id":"C","date":"2026-11-19","detected_at":"UNRECORDED",
       "published_at":"UNRECORDED"},
    ]}


class TestTimingAudit(unittest.TestCase):
    def test_exact_and_day_only_are_separate(self):
        result=reanalyse(example())
        self.assertEqual(result["n_corrections"],3)
        self.assertEqual(result["n_exact_timing_pairs_with_nonnegative_latency"],1)
        self.assertEqual(result["exact_latency_seconds"],[93600.0])
        self.assertEqual(result["timestamp_coverage"]["detected_at"],{"DAY_ONLY":1,"INSTANT":1,"UNRECORDED":1})
        self.assertTrue(result["no_append_only_proof"])
        self.assertEqual(result["effect_of_correction_on_users"],"NOT_MEASURED")

    def test_unknown_published_at_does_not_create_latency(self):
        r=example()
        r["corrections"][0]["published_at"]="UNRECORDED"
        s=reanalyse(r)
        self.assertEqual(s["n_exact_timing_pairs_with_nonnegative_latency"],0)

    def test_reversed_publication_detected(self):
        r=example()
        r["corrections"][0]["published_at"]="2026-11-20T12:00:00Z"
        s=reanalyse(r)
        self.assertEqual(s["n_reverse_calendar_or_instant_order"],1)
        self.assertEqual(s["reversed_record_ids"],["A"])

    def test_day_earlier_than_detection_is_anomaly(self):
        r=example()
        r["corrections"][1]["published_at"]="2026-11-14"
        s=reanalyse(r)
        self.assertEqual(s["reversed_record_ids"],["B"])

    def test_missing_timezone_unqualified(self):
        self.assertEqual(parse_date_kind("2026-11-22T12:00:00")[0],"INVALID")

    def test_invalid_calendar_rejected_as_invalid(self):
        self.assertEqual(parse_date_kind("2026-02-31")[0],"INVALID")

    def test_source_row_order_is_observed_not_proof(self):
        r=example()
        r["corrections"][0]["date"]="2026-11-16"
        s=reanalyse(r)
        self.assertEqual(s["n_source_row_order_violations"],1)

    def test_duplicate_ids_not_silently_accepted(self):
        r=example()
        r["corrections"][1]["id"]="A"
        s=reanalyse(r)
        self.assertEqual(s["duplicate_or_invalid_ids"],["A"])

    def test_malformed_source_rejected(self):
        with self.assertRaises(ValueError):
            reanalyse({"schema":"csoai.corrections/0.2","corrections":[]})

    def test_dynamic_signature_check_metadata_does_not_mutate_stable_corrections_digest(self):
        first=example()
        second=copy.deepcopy(first)
        second["signature_check"]={"runtime":"another time"}
        a=reanalyse(first)
        b=reanalyse(second)
        self.assertEqual(a["corrections_content_sha256"],b["corrections_content_sha256"])
        self.assertEqual(a["report_sha256"],b["report_sha256"])

    def test_repeatable_report(self):
        self.assertEqual(reanalyse(example()),reanalyse(example()))


if __name__=="__main__":
    unittest.main()
