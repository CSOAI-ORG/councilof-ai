#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Human-in-loop causal design cannot bootstrap human identities or outcomes."""
import copy
import unittest
from human_information_factorial import analyse,simulate,validate


class TestHumanFactorial(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.rows=simulate(80,seed=22)

    def rejected(self,rows):
        with self.assertRaises(ValueError):
            validate(rows)

    def test_all_conditions_matched(self):
        bytask,bank,model=validate(self.rows)
        self.assertEqual(len(bytask),80)
        self.assertEqual(len(next(iter(bytask.values()))),12)

    def test_outputs_not_consciousness_or_human_authority(self):
        x=analyse(self.rows,synthetic=True)
        self.assertEqual(x["evidence_state"],"SYNTHETIC")
        self.assertFalse(x["human_authority_established"])
        self.assertFalse(x["actual_end_user_outcome_measured"])
        self.assertFalse(x["model_weight_change_verified"])
        self.assertFalse(x["consciousness_inferred"])

    def test_repeatable(self):
        self.assertEqual(analyse(self.rows,synthetic=True),analyse(self.rows,synthetic=True))

    def test_missing_condition_rejected(self):
        self.rejected(self.rows[:-1])

    def test_extra_demographic_or_identity_rejected(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["personal_demographic"]="sensitive"
        self.rejected(rows)

    def test_duplicate_task_condition_rejected(self):
        self.rejected(self.rows+[copy.deepcopy(self.rows[0])])

    def test_mixed_bank_rejected(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["bank_sha256"]="0"*64
        self.rejected(rows)

    def test_mixed_model_revision_rejected(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["model_revision"]="another revision"
        self.rejected(rows)

    def test_too_small(self):
        self.rejected(simulate(30)[:29*12])

    def test_non_boolean_grade_rejected(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["correct"]=1
        self.rejected(rows)

    def test_effects_reported_not_only_success(self):
        x=analyse(self.rows,synthetic=True)
        self.assertIn("human_policy_interaction_at_t1",x["paired_effects"])
        self.assertIn("irrelevant_presence_vs_none_frozen_at_t0",x["paired_effects"])
        self.assertEqual(x["n_grade_observations"],960)


if __name__=="__main__":
    unittest.main()
