#!/usr/bin/env python3
"""Offline public-source pulse negative controls. Never contact a live service."""
import hashlib
import json
import unittest
from council_heartbeat import SCHEMA, canonical, summarise, render_markdown, fetch_bytes

AT = "2026-11-24T00:00:00Z"

def fixture():
    board = {"schema":"csoai.gspc-axes/0.5", "measured_on":"2026-08-12",
        "axes":[
            {"axis":"governance","kind":"model-comparison","separation":"TIE",
             "limit":"A wording-only baseline matches 225/237 labels; not legal reasoning."},
            {"axis":"safety","kind":"model-comparison","separation":"UNTESTED"},
            {"axis":"provenance","kind":"subject-measurement"}]}
    corrections={"corrections":[{"id":"A"},{"id":"B"}],"signature_state":"VALID"}
    claims={"as_of":"2026-11-23", "totals":{"subjects":28,"claims":99,
        "subjects_with_due_execution_unverified":5}}
    root={"card_count":452,"sig_ed25519":"some-publisher-signature"}
    manifest={"n_research_observations":26,"evidence_state":"RESEARCH_ONLY"}
    manifest["manifest_sha256"]=hashlib.sha256(canonical(manifest)).hexdigest()
    docs=dict(gspc=board,corrections=corrections,claims=claims,root=root,hf_research=manifest)
    return {k:json.dumps(v).encode() for k,v in docs.items()}

class PulseTests(unittest.TestCase):
    def test_public_observation_never_authorisation(self):
        r=summarise(fixture(),{},AT)
        self.assertEqual(r["schema"],SCHEMA)
        self.assertEqual(r["summary_state"],"PUBLIC_SOURCES_OBSERVED")
        self.assertTrue(all(s=="NOT_ESTABLISHED_BY_THIS_PULSE"
            for s in r["qualification_gates"].values()))
    def test_retrieval_does_not_refresh_original_measurement(self):
        r=summarise(fixture(),{},AT)
        self.assertEqual(r["metrics"]["gspc"]["reported_measurement_date"],"2026-08-12")
        self.assertFalse(r["metrics"]["gspc"]["measurement_reproduced_here"])
        self.assertEqual(r["metrics"]["gspc"]["comparison_axes"],2)
        self.assertEqual(r["metrics"]["gspc"]["separated_comparison_axes"],0)
    def test_governance_bank_disclosure_not_suppressed(self):
        r=summarise(fixture(),{},AT)
        self.assertIn("225/237",r["metrics"]["gspc"]["governance_axis_limitations"])
    def test_claim_due_does_not_mean_executed(self):
        r=summarise(fixture(),{},AT)
        self.assertEqual(r["metrics"]["claims"]["due_execution_unverified"],5)
        self.assertFalse(r["metrics"]["claims"]["claims_independently_remeasured_here"])
    def test_publisher_signature_not_automatically_verified(self):
        r=summarise(fixture(),{},AT)
        self.assertFalse(r["metrics"]["root"]["signature_verified_by_this_pulse"])
        self.assertFalse(r["metrics"]["root"]["bitcoin_proof_verified_by_this_pulse"])
        self.assertFalse(r["metrics"]["corrections"]["signature_verified_by_this_pulse"])
    def test_valid_manifest_self_digest_still_not_peer_review(self):
        r=summarise(fixture(),{},AT)["metrics"]["research"]
        self.assertEqual(r["state"],"MANIFEST_DIGEST_RECOMPUTED")
        self.assertFalse(r["underlying_hf_files_verified_by_this_pulse"])
        self.assertFalse(r["independent_peer_review_established"])
    def test_manifest_tamper_fails_closed(self):
        d=fixture();m=json.loads(d["hf_research"]);m["n_research_observations"]=10000
        d["hf_research"]=json.dumps(m).encode()
        self.assertEqual(summarise(d,{},AT)["metrics"]["research"]["state"],"UNCHECKABLE")
    def test_missing_board_unknown_not_zero(self):
        d=fixture();d["gspc"]=None
        r=summarise(d,{},AT)
        self.assertEqual(r["summary_state"],"READBACK_PARTIAL")
        self.assertNotIn("axis_count",r["metrics"]["gspc"])
    def test_invalid_required_claim_totals_are_uncheckable_and_partial(self):
        for invalid in ({}, {"subjects":28,"claims":99},
                {"subjects":True,"claims":99,"subjects_with_due_execution_unverified":5},
                {"subjects":28,"claims":-1,"subjects_with_due_execution_unverified":5},
                {"subjects":1,"claims":99,"subjects_with_due_execution_unverified":5}):
            with self.subTest(invalid=invalid):
                docs=fixture()
                claim=json.loads(docs["claims"])
                claim["totals"]=invalid
                docs["claims"]=json.dumps(claim).encode()
                report=summarise(docs,{},AT)
                self.assertEqual(report["metrics"]["claims"]["state"],"UNCHECKABLE")
                self.assertEqual(report["summary_state"],"READBACK_PARTIAL")
    def test_missing_corrections_claims_or_research_makes_entire_pulse_partial(self):
        for source in ("corrections", "claims", "hf_research"):
            with self.subTest(source=source):
                docs=fixture()
                docs[source]=None
                report=summarise(docs, {}, AT)
                self.assertEqual(report["sources"][source]["state"], "UNCHECKABLE")
                self.assertEqual(report["summary_state"], "READBACK_PARTIAL")
    def test_malformed_research_manifest_makes_entire_pulse_partial(self):
        docs=fixture()
        value=json.loads(docs["hf_research"])
        value["n_research_observations"]=27
        docs["hf_research"]=json.dumps(value).encode()
        report=summarise(docs, {}, AT)
        self.assertEqual(report["metrics"]["research"]["state"], "UNCHECKABLE")
        self.assertEqual(report["summary_state"], "READBACK_PARTIAL")
    def test_bad_schema_fails_closed(self):
        d=fixture();d["gspc"]=b'{"schema":"wrong","axes":[]}'
        self.assertEqual(summarise(d,{},AT)["metrics"]["gspc"]["state"],"UNCHECKABLE")
    def test_duplicate_axis_fails_closed(self):
        d=fixture();v=json.loads(d["gspc"]);v["axes"].append(v["axes"][0])
        d["gspc"]=json.dumps(v).encode()
        self.assertEqual(summarise(d,{},AT)["metrics"]["gspc"]["state"],"UNCHECKABLE")
    def test_github_merges_do_not_grant_human_authority(self):
        p={"public_products":{"number":4762,"state":"closed","merged":True},
           "c1_c7_acceptance":{"number":4703,"state":"open","merged":False}}
        r=summarise(fixture(),p,AT)
        self.assertEqual(r["github_work_lanes"]["public_products"]["state"],"MERGED")
        self.assertEqual(r["github_work_lanes"]["c1_c7_acceptance"]["state"],"OPEN")
        self.assertEqual(r["qualification_gates"]["authenticated_human_authority"],
            "NOT_ESTABLISHED_BY_THIS_PULSE")
    def test_markdown_explicitly_limits_provenance(self):
        txt=render_markdown(summarise(fixture(),{},AT))
        self.assertIn("not** a new GSPC measurement",txt)
        self.assertIn("Signature not verified by this pulse",txt)
        self.assertIn("NOT_ESTABLISHED_BY_THIS_PULSE",txt)
    def test_nested_measurement_stamp_does_not_leak_large_preimage(self):
        d=fixture()
        board=json.loads(d["gspc"])
        board["measured_on"]={"date":"behavioural axes 2026-08-12",
            "living_stamp":{"preimage":{"private_model_card":"SHOULD_NOT_LEAK"}}}
        d["gspc"]=json.dumps(board).encode()
        r=summarise(d,{},AT)
        self.assertEqual(r["metrics"]["gspc"]["reported_measurement_date"],
            "behavioural axes 2026-08-12")
        self.assertNotIn("SHOULD_NOT_LEAK",json.dumps(r))
    def test_only_immutable_hf_cache_redirect_is_permitted(self):
        from council_heartbeat import NoRedirect
        from urllib.request import Request
        handler=NoRedirect()
        u="https://huggingface.co/datasets/csoai/gspc-meok-evidence-adaptation-lab/resolve/revision/manifest.json"
        okay="https://huggingface.co/api/resolve-cache/datasets/csoai/gspc-meok-evidence-adaptation-lab/revision/manifest.json?etag=abc"
        req=Request(u,method="GET")
        self.assertIsNotNone(handler.redirect_request(req,None,307,"Temporary",{},okay))
        for target in ("https://evil.example/steal",
                       "https://api.github.com/repos/private",
                       "https://huggingface.co/api/private-user"):
            with self.subTest(target=target),self.assertRaises(ValueError):
                handler.redirect_request(req,None,307,"Temporary",{},target)
    def test_utc_required(self):
        with self.assertRaises(ValueError):
            summarise(fixture(),{}, "2026-11-24T00:00:00")
    def test_fetch_allowlist_rejects_private_and_credentials_without_network(self):
        urls=["http://councilof.ai/api/gspc","https://127.0.0.1/secrets",
              "https://evil.example/admin","https://user:password@councilof.ai/secret"]
        for url in urls:
            with self.subTest(url=url),self.assertRaises(ValueError):
                fetch_bytes(url)

if __name__ == "__main__":
    unittest.main()
