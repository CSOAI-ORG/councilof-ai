#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""A unanimous but unverified 12-agent panel cannot override counted evidence."""
import json
import unittest

from evidence_rule_referee import RULE_ID,RULE_SHA256,sha,judge,aggregates


def source():
    return json.dumps({
        "schema":"csoai.gspc-axes/0.5",
        "axes":[
            {"axis":"governance","kind":"model-comparison","status":"MEASURED","separation":"TIE"},
            {"axis":"safety","kind":"model-comparison","status":"MEASURED","separation":"UNTESTED"},
            {"axis":"care","kind":"model-comparison","status":"MEASURED","separation":"UNTESTED"},
            {"axis":"provenance-controls","kind":"deterministic-facts","status":"MEASURED","separation":None},
        ],
    },sort_keys=True).encode()

def proposal(raw,field,asserted):
    return {"rule_id":RULE_ID,"rule_sha256":RULE_SHA256,
            "source_sha256":sha(raw),"field":field,"asserted":asserted}


class TestRuleReferee(unittest.TestCase):
    def test_honest_observed_count(self):
        raw=source()
        x=judge(raw,proposal(raw,"axes",4),{"declared_votes":12,"advisory_concur":0})
        self.assertEqual(x["verdict"],"CONCUR")
        self.assertEqual(x["derived_public_source_value"],4)
        self.assertFalse(x["new_gspc_measurement"])
        self.assertEqual(x["panel"],"NOT_CONVENED")

    def test_twelve_votes_cannot_overrule_false_claim(self):
        raw=source()
        x=judge(raw,proposal(raw,"separated_leaders",1),{"declared_votes":12,"advisory_concur":12})
        self.assertEqual(x["verdict"],"DISSENT")
        self.assertEqual(x["derived_public_source_value"],0)
        self.assertEqual(x["independent_reviewers"],0)
        self.assertEqual(x["human_approval"],"NOT_ESTABLISHED")

    def test_unanimous_disagreement_cannot_veto_source(self):
        raw=source()
        x=judge(raw,proposal(raw,"measured_axes",4),{"declared_votes":12,"advisory_concur":0})
        self.assertEqual(x["verdict"],"CONCUR")
        self.assertEqual(x["ruling_authority"],"NONE")

    def test_bad_source_digest_fails_closed(self):
        raw=source()
        p=proposal(raw,"axes",4);p["source_sha256"]="0"*64
        self.assertEqual(judge(raw,p)["verdict"],"CANNOT_REPRODUCE")

    def test_bad_rule_digest_fails_closed(self):
        raw=source()
        p=proposal(raw,"axes",4);p["rule_sha256"]="1"*64
        self.assertEqual(judge(raw,p)["verdict"],"CANNOT_REPRODUCE")

    def test_missing_or_extraneous_inputs_rejected(self):
        raw=source()
        p=proposal(raw,"axes",4);p["faux_authority"]="owner"
        self.assertEqual(judge(raw,p)["verdict"],"CANNOT_REPRODUCE")

    def test_duplicate_axis_fails_closed(self):
        original=json.loads(source())
        original["axes"].append(original["axes"][0])
        bad=json.dumps(original).encode()
        self.assertEqual(judge(bad,proposal(bad,"axes",5))["verdict"],"CANNOT_REPRODUCE")

    def test_nonmodel_axis_may_omit_separation(self):
        original=json.loads(source())
        del original["axes"][-1]["separation"]
        raw=json.dumps(original).encode()
        self.assertEqual(judge(raw,proposal(raw,"axes",4))["verdict"],"CONCUR")
        self.assertEqual(judge(raw,proposal(raw,"separated_leaders",0))["verdict"],"CONCUR")

    def test_model_only_separation(self):
        original=json.loads(source())
        original["axes"][-1]["separation"]="SEPARATED"
        bad=json.dumps(original).encode()
        self.assertEqual(judge(bad,proposal(bad,"separated_leaders",1))["verdict"],"CANNOT_REPRODUCE")

    def test_float_count_rejected(self):
        raw=source()
        p=proposal(raw,"axes",4);p["asserted"]=4.0
        self.assertEqual(judge(raw,p)["verdict"],"CANNOT_REPRODUCE")

    def test_unknown_field_rejected(self):
        raw=source()
        p=proposal(raw,"float_accuracy",99)
        self.assertEqual(judge(raw,p)["verdict"],"CANNOT_REPRODUCE")

    def test_malformed_source_rejected(self):
        raw=b'{"schema":"csoai.gspc-axes/0.5","axes": ['
        self.assertEqual(judge(raw,proposal(raw,"axes",4))["verdict"],"CANNOT_REPRODUCE")

    def test_aggregation_method_fixed(self):
        count=aggregates(source())
        self.assertEqual(count,{"axes":4,"measured_axes":4,"model_comparison_axes":3,
                                "separated_leaders":0,"ties":1,"untested":2})

    def test_untrusted_panel_totals_invalid(self):
        raw=source()
        with self.assertRaises(ValueError):
            judge(raw,proposal(raw,"axes",4),{"declared_votes":13,"advisory_concur":13})


if __name__=="__main__":
    unittest.main()
