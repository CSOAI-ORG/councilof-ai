#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Research cards must remain bounded, non-authoritative and source-verified."""
import copy
import json
import unittest

from him_research_cards import render,markdown
from temporal_observatory import project
from repeated_observations import analyse as repeats
from error_complementarity import analyse as pairs
from human_information_factorial import analyse as factorial,simulate
from evidence_rule_referee import judge,RULE_ID,RULE_SHA256,sha
from correction_timing_audit import reanalyse as correction_audit


def fixtures():
    public={"schema":"csoai.gspc-axes/0.5","axes":[
        {"axis":"care","family":"gspc","kind":"model-comparison","status":"MEASURED","n":30,"separation":"TIE"}]}
    t=project(json.dumps(public).encode(),"2026-11-22T18:00:00Z")
    cells=[{"cell":"cell1","axis":"care","model":"m1","model_hf_revision":"rev","provider_route":"route","bank_sha256":"b"*64},
           {"cell":"cell2","axis":"care","model":"m1","model_hf_revision":"rev","provider_route":"route","bank_sha256":"b"*64}]
    items=[{"axis":"care","item_id":f"i{k}","expected":"ALLOW"} for k in range(30)]
    rows=[]
    for k in range(30):
        for m in ("m1","m2"):
            r={"axis":"care","model":m,"item_id":f"i{k}","cell":"cell1","expected":"ALLOW","ok":(k%2==0 if m=="m1" else k%2!=0)}
            rows.append(r)
    repeat_rows=[{**rows[0],"cell":"cell1","observed":"ALLOW"},{**rows[0],"cell":"cell2","ok":False,"observed":"DENY"}]
    repeat_rows += [r for r in rows if r["model"]=="m1" and r["item_id"]!="i0"]
    r=repeats(repeat_rows,items,cells)
    p=pairs(rows,items)
    h=factorial(simulate(30),synthetic=True)
    raw=json.dumps(public).encode()
    proposal={"rule_id":RULE_ID,"rule_sha256":RULE_SHA256,"source_sha256":sha(raw),
              "field":"separated_leaders","asserted":1}
    referee=judge(raw,proposal,{"declared_votes":12,"advisory_concur":12})
    corrections=correction_audit({"schema":"csoai.corrections/0.1","corrections":[
        {"id":"t1","date":"2026-11-22","detected_at":"2026-11-22",
         "published_at":"UNRECORDED"}]})
    return {"temporal":t,"repeat":r,"complementarity":p,"human":h,
            "referee":referee,"corrections":corrections}


class TestHumanResearchProjection(unittest.TestCase):
    def test_all_six_cards_have_source_receipts(self):
        x=render(fixtures())
        self.assertEqual(x["source_report_count"],6)
        self.assertEqual(len(x["cards"]),6)
        self.assertTrue(all(len(c["source_receipt_sha256"])==64 for c in x["cards"]))
        self.assertEqual(x["human_authority"],"NOT_GRANTED")
        self.assertEqual(x["gspc_board_mutations"],0)
        self.assertEqual(x["model_weight_updates"],0)
        self.assertTrue(x["not_neural_jspace"])

    def test_markdown_is_copyable_without_user_info(self):
        a=markdown(render(fixtures()))
        self.assertIn("Human-review question",a)
        self.assertIn("not certification",a)
        self.assertNotIn("customer@example",a)

    def test_tampered_repeatability_rejected(self):
        f=fixtures()
        f["repeat"]["n_grade_conflict_keys"]=99
        with self.assertRaises(ValueError):
            render(f)

    def test_fake_human_model_update_rejected(self):
        f=fixtures()
        f["human"]["human_authority_established"]=True
        with self.assertRaises(ValueError):
            render(f)

    def test_unverified_votes_cannot_turn_referee_into_human_authority(self):
        f=fixtures()
        f["referee"]["ruling_authority"]="OWNER_APPROVED"
        with self.assertRaises(ValueError):
            render(f)

    def test_tampered_corrections_record_rejected(self):
        f=fixtures()
        f["corrections"]["n_corrections"]=99
        with self.assertRaises(ValueError):
            render(f)

    def test_claimed_append_only_corrections_rejected(self):
        f=fixtures()
        f["corrections"]["no_append_only_proof"]=False
        with self.assertRaises(ValueError):
            render(f)

    def test_missing_source_rejected(self):
        f=fixtures()
        del f["temporal"]
        with self.assertRaises(ValueError):
            render(f)

    def test_replay_stable(self):
        self.assertEqual(render(fixtures()),render(fixtures()))


if __name__=="__main__":
    unittest.main()
