#!/usr/bin/env python3
"""Offline source-state negative controls for public evidence-bundle time windows."""
from __future__ import annotations
import copy
import unittest
from datetime import datetime, timezone
from evidence_bundle_freshness import assess_payload

NOW=datetime(2026,11,23,7,25,0,tzinfo=timezone.utc)
OLD="2026-11-02T13:40:00Z"
NEW="2026-11-22T06:00:00Z"
SHA_NEW="f"*64

def make(n=54,new=NEW):
    cards=[{"sha256":format(i,"064x"),"as_of":OLD} for i in range(1,min(n,40)+1)]
    return {"schema":"csoai.evidence-bundle/0.1","kind":"preview",
            "relevant_signed_cards":n,"cards":cards,
            "freshness":{"scope":"ALL_RELEVANT_SIGNED_CARDS",
              "source_state":"SOURCE_DECLARED_NOT_INDEPENDENTLY_VERIFIED",
              "relevant_card_count":n,"returned_card_count":len(cards),
              "card_list_truncated":n>40,"dated_card_count":n,
              "timing_coverage":"COMPLETE",
              "newest_relevant_card_as_of":new,
              "newest_relevant_card_sha256":SHA_NEW}}

class MonitorTests(unittest.TestCase):
    def state(self,p):
        return assess_payload("dora",p,NOW)["state"]

    def test_truncated_legacy_preview_cannot_claim_stale(self):
        p=make()
        p.pop("freshness")
        r=assess_payload("dora",p,NOW)
        self.assertEqual(r["state"],"UNREADABLE")
        self.assertEqual(r["reason"],"TRUNCATED_PREVIEW_NO_FULL_SET_TIMESTAMP")

    def test_full_source_metadata_recovers_latest_not_sha_first(self):
        r=assess_payload("dora",make(),NOW)
        self.assertEqual(r["state"],"FRESH")
        self.assertEqual(r["relevant"],54)
        self.assertEqual(r["returned"],40)
        self.assertEqual(r["timing_source"],"ALL_SELECTED_SOURCE_DECLARATION")
        self.assertFalse(r["independent_signature_verification"])

    def test_actual_stale_newest_not_bypassed(self):
        self.assertEqual(self.state(make(new=OLD)),"STALE")

    def test_future_not_fresh(self):
        p=make(new="2026-12-01T00:00:00Z")
        r=assess_payload("dora",p,NOW)
        self.assertEqual(r["reason"],"FUTURE_CARD_TIMESTAMP")

    def test_empty_means_no_relevant_cards_not_freshness(self):
        p={"relevant_signed_cards":0,"cards":[]}
        r=assess_payload("article-50",p,NOW)
        self.assertEqual(r["state"],"EMPTY")
        self.assertNotIn("newest_as_of",r)

    def test_partial_timestamp_coverage_invalidates_latest_only_claim(self):
        p=make()
        p["freshness"]["dated_card_count"]=53
        p["freshness"]["timing_coverage"]="PARTIAL"
        r=assess_payload("dora",p,NOW)
        self.assertEqual(r["state"],"UNREADABLE")
        self.assertEqual(r["reason"],"INCOMPLETE_TIMESTAMP_COVERAGE")

    def test_metadata_count_injection_rejected(self):
        for k,v in [("relevant_card_count",40),("returned_card_count",54),
                    ("dated_card_count",55),("card_list_truncated",False)]:
            with self.subTest(key=k):
                p=make()
                p["freshness"][k]=v
                self.assertEqual(self.state(p),"UNREADABLE")

    def test_source_id_and_date_cross_check(self):
        p=make(n=1,new=NEW)
        p["freshness"]["newest_relevant_card_sha256"]=p["cards"][0]["sha256"]
        self.assertEqual(assess_payload("dora",p,NOW)["reason"],
                         "NEWEST_CARD_CONTRADICTS_PREVIEW")

    def test_untruncated_legacy_complete_is_usable(self):
        p={"relevant_signed_cards":2,"cards":[{"as_of":OLD},{"as_of":NEW}]}
        self.assertEqual(self.state(p),"FRESH")

    def test_invalid_or_naive_timestamp_refused(self):
        for date in ["2026-11-22T06:00:00","not_a_date","2026-11-22T06:00:00Z"*5]:
            p=make(new=date)
            self.assertEqual(self.state(p),"UNREADABLE")

    def test_missing_or_invalid_count_refused(self):
        for count in [None,True,-1,"54"]:
            p=make()
            p["relevant_signed_cards"]=count
            self.assertEqual(self.state(p),"UNREADABLE")

if __name__=="__main__":
    unittest.main()
