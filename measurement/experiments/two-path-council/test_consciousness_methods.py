#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Controls for blinded guessing and public Jacobian-lens feature audit."""
import copy
import unittest
from blind_target_control import (prepare, demo_guesses, evaluate, binomial_upper_tail)
from audit_jspace_public_features import analyse, auc


class TestBlindTarget(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.public,cls.secret=prepare(64,seed=20261122)
        cls.guesses=demo_guesses(cls.public,seed=20261123)

    def test_challenge_does_not_expose_targets(self):
        self.assertTrue(all(set(row)=={"trial_id","commitment"} for row in self.public["trials"]))
        self.assertEqual(self.public["state"],"SYNTHETIC")
        self.assertEqual(self.public["chance_p"],.25)

    def test_replay_and_pvalue(self):
        a=evaluate(self.public,self.secret,self.guesses)
        b=evaluate(self.public,self.secret,self.guesses)
        self.assertEqual(a,b)
        self.assertEqual(a["n_trials"],64)
        self.assertTrue(0<=a["one_sided_binomial_p"]<=1)
        self.assertEqual(a["state"],"SYNTHETIC")

    def test_tampered_secret_fails(self):
        secret=copy.deepcopy(self.secret)
        secret["trials"][0]["target"]="D" if secret["trials"][0]["target"]!="D" else "A"
        with self.assertRaises(ValueError):
            evaluate(self.public,secret,self.guesses)

    def test_commitment_tampered_fails(self):
        public=copy.deepcopy(self.public)
        public["trials"][0]["commitment"]="0"*64
        with self.assertRaises(ValueError):
            evaluate(public,self.secret,self.guesses)

    def test_prediction_duplicate_fails(self):
        guesses=copy.deepcopy(self.guesses)
        guesses[1]["trial_id"]=guesses[0]["trial_id"]
        with self.assertRaises(ValueError):
            evaluate(self.public,self.secret,guesses)

    def test_missing_prediction_fails(self):
        with self.assertRaises(ValueError):
            evaluate(self.public,self.secret,self.guesses[:-1])

    def test_exact_tail(self):
        self.assertAlmostEqual(binomial_upper_tail(2,2,.25),.0625)
        self.assertAlmostEqual(binomial_upper_tail(0,2,.25),1.)

    def test_minimum_sample(self):
        with self.assertRaises(ValueError):
            prepare(29,seed=1)


class TestJspacePublicAudit(unittest.TestCase):
    def rows(self):
        rows=[]
        for i in range(80):
            y=i%2
            rows.append({"example_id":f"row-{i}", "source_dataset":"synthetic_both_classes",
                 "label":y,"features":{"bl_mean_logprob":-.1-(1 if y else 0),
                                       "ws_mean_entropy":2 if y else 0.1}})
        return rows

    def test_auc_extremes(self):
        self.assertAlmostEqual(auc([0,0,1,1],[0,0,1,1]),1.)
        self.assertAlmostEqual(auc([1,1,0,0],[0,0,1,1]),0.)
        self.assertAlmostEqual(auc([1,1,1,1],[0,0,1,1]),.5)

    def test_labeled_both_classes(self):
        a=analyse(self.rows())
        r=a["datasets"]["synthetic_both_classes"]
        self.assertEqual(r["n_labeled"],80)
        self.assertEqual(r["auc_workspace_entropy_only"],1.)
        self.assertEqual(r["auc_logprob_only"],1.)
        self.assertEqual(a["state"],"PUBLIC_THIRD_PARTY_REANALYSIS")

    def test_missing_label_not_silently_inferred(self):
        rows=self.rows()
        rows[0]["label"]=None
        a=analyse(rows)
        self.assertEqual(a["missing_labels"],1)
        self.assertEqual(a["datasets"]["synthetic_both_classes"]["n_missing_label"],1)

    def test_duplicate_id_reported(self):
        rows=self.rows()
        rows.append(copy.deepcopy(rows[0]))
        a=analyse(rows)
        self.assertEqual(a["duplicate_example_ids"],1)

    def test_one_class_no_auc(self):
        rows=self.rows()
        for r in rows:
            r["label"]=0
        a=analyse(rows)["datasets"]["synthetic_both_classes"]
        self.assertTrue(a["one_class_labels"])
        self.assertIsNone(a["auc_workspace_entropy_only"])

    def test_sparse_labels_gate(self):
        rows=self.rows()[:50]
        a=analyse(rows)["datasets"]["synthetic_both_classes"]
        self.assertFalse(a["metric_eligible"])
        self.assertIsNone(a["auc_logprob_only"])


if __name__=="__main__":
    unittest.main()
