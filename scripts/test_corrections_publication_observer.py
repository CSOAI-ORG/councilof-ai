#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""No observed HTTP timestamp may be upgraded to an exact published_at."""
import copy
import hashlib
import unittest
from scripts.corrections_publication_observer import canonical,validate,otlp_logs

WRAPPER=["signature","signature_state","signature_check","correction_latency","note","fix_requires"]


def inputs():
    body={"schema":"csoai.corrections/0.1","policy":"source-maintained",
          "corrections":[
            {"id":"C-2026-1122-01","date":"2026-11-22","published_at":"UNRECORDED","detected_at":"2026-11-20"},
            {"id":"C-2026-1122-02","date":"2026-11-22","published_at":"2026-11-22T15:00:00Z",
             "detected_at":"2026-11-22T09:00:00Z"}]}
    cid=hashlib.sha256(canonical(body,ascii_only=True)).hexdigest()
    response={**body,"signature":{"attestation":{"content_id":cid},"id":cid},
              "signature_state":"VALID","signature_check":{"checked_at":"2026-11-23T00:00:00Z"}}
    check={"state":"VALID","ed25519_verified":True,"content_id_matches":True,
           "key_pin_matches_did":True,"recomputed_content_id":cid,
           "unsigned_wrapper_fields":WRAPPER}
    return response,check


class TestPublicationReadback(unittest.TestCase):
    def test_no_unrecorded_date_backfilled(self):
        response,check=inputs()
        r=validate(response,check,"2026-11-23T00:37:00Z")
        self.assertEqual(r["publication_time_unrecorded"],1)
        self.assertEqual(r["correction_published_at_fields_backfilled"],0)
        self.assertEqual(r["first_publicly_seen_at_or_before"],"2026-11-23T00:37:00Z")
        self.assertEqual(r["new_corrections_first_seen_in_this_run"],"UNMEASURED_WITHOUT_PRIOR_CAPTURE")
        self.assertFalse(r["deployed_bytes_mapped_to_trigger_commit"])

    def test_triggering_commit_does_not_prove_live_source_binding(self):
        response,check=inputs()
        r=validate(response,check,"2026-11-23T00:37:00Z","a"*40,
                   "https://github.com/CSOAI-ORG/councilof-ai/actions/runs/123")
        self.assertEqual(r["deploy_trigger_source_commit"],"a"*40)
        self.assertFalse(r["deployed_bytes_mapped_to_trigger_commit"])
        self.assertFalse(r["ots_inclusion_verified_for_each_correction"])
        self.assertFalse(r["rekor_inclusion_verified_for_each_correction"])

    def test_invalid_signature_rejected(self):
        response,check=inputs()
        check["ed25519_verified"]=False
        with self.assertRaises(ValueError):
            validate(response,check,"2026-11-23T00:37:00Z")

    def test_wrong_did_pin_rejected(self):
        response,check=inputs()
        check["key_pin_matches_did"]=False
        with self.assertRaises(ValueError):
            validate(response,check,"2026-11-23T00:37:00Z")

    def test_mutated_signed_corrections_rejected(self):
        response,check=inputs()
        response["corrections"][0]["published_at"]="2026-11-23T00:37:00Z"
        with self.assertRaises(ValueError):
            validate(response,check,"2026-11-23T00:37:00Z")

    def test_dynamic_signature_check_does_not_change_correction_digest(self):
        response,check=inputs()
        before=validate(response,check,"2026-11-23T00:37:00Z")
        response["signature_check"]["checked_at"]="2026-11-23T01:00:00Z"
        after=validate(response,check,"2026-11-23T00:37:00Z")
        self.assertEqual(before["corrections_records_sha256"],after["corrections_records_sha256"])
        self.assertEqual(before["receipt_sha256"],after["receipt_sha256"])

    def test_malformed_commit_ref_rejected(self):
        response,check=inputs()
        with self.assertRaises(ValueError):
            validate(response,check,"2026-11-23T00:37:00Z","invalid")

    def test_duplicate_source_rows_rejected(self):
        response,check=inputs()
        response["corrections"].append(copy.deepcopy(response["corrections"][0]))
        # Regenerate fixture signature binding to test actual duplicate-rejection.
        body={k:v for k,v in response.items() if k not in WRAPPER}
        cid=hashlib.sha256(canonical(body,ascii_only=True)).hexdigest()
        response["signature"]["attestation"]["content_id"]=cid
        response["signature"]["id"]=cid
        check["recomputed_content_id"]=cid
        with self.assertRaises(ValueError):
            validate(response,check,"2026-11-23T00:37:00Z")

    def test_naive_local_time_rejected(self):
        response,check=inputs()
        with self.assertRaises(ValueError):
            validate(response,check,"2026-11-23T00:37:00")

    def test_otlp_log_cannot_claim_pub_at(self):
        response,check=inputs()
        r=validate(response,check,"2026-11-23T00:37:00Z")
        o=otlp_logs(r)
        logs=o["resourceLogs"][0]["scopeLogs"][0]["logRecords"]
        self.assertEqual(len(logs),1)
        attributes={a["key"]:a["value"]["stringValue"] for a in logs[0]["attributes"]}
        self.assertEqual(attributes["csoai.corrections.published_at_established"],"false")
        self.assertEqual(attributes["csoai.corrections.publication_unknown"],"1")


if __name__=="__main__":
    unittest.main()
