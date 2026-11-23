#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Negative controls: an oracle ceiling must never be called a council win."""
import copy
import unittest
from error_complementarity import analyse


def fixture(n=30, mode="complementary"):
    items=[]
    rows=[]
    for i in range(n):
        t=f"item-{i:03d}"
        items.append({"axis":"care","item_id":t,"expected":"YES"})
        for model in ("a","b"):
            if mode=="complementary":
                correct=(i<n//2) if model=="a" else (i>=n//2)
            elif mode=="shared_fail":
                correct=i>=10
            else:
                correct=True
            rows.append({"axis":"care","model":model,"item_id":t,
                         "expected":"YES","ok":correct})
    return rows,items


class TestComplementarity(unittest.TestCase):
    def test_complementary_oracle_is_not_actual_router(self):
        rows,items=fixture()
        report=analyse(rows,items)
        p=report["axes"]["care"]["coverage_selected_pair"]
        self.assertEqual(p["single_a"],.5)
        self.assertEqual(p["single_b"],.5)
        self.assertEqual(p["either_correct_oracle_ceiling"],1.)
        self.assertEqual(p["both_wrong"],0.)
        self.assertIn("oracle",report["methods"]["either_correct"].lower())
        self.assertEqual(report["evidence_state"],"RETROSPECTIVE_PUBLIC_REUSE")

    def test_correlated_failures_limit_oracle(self):
        r,i=fixture(mode="shared_fail")
        p=analyse(r,i)["axes"]["care"]["coverage_selected_pair"]
        self.assertAlmostEqual(p["both_wrong"],10/30,places=4)
        self.assertAlmostEqual(p["either_correct_oracle_ceiling"],20/30,places=4)
        self.assertEqual(p["complementary_disagreements"],0)

    def test_perfect_clones_cannot_improve(self):
        r,i=fixture(mode="all_correct")
        p=analyse(r,i)["axes"]["care"]["coverage_selected_pair"]
        self.assertEqual(p["single_a"],p["either_correct_oracle_ceiling"])
        self.assertEqual(p["both_wrong"],0)

    def test_ungraded_and_unknown_models_excluded(self):
        r,i=fixture()
        r.append({"axis":"care","item_id":i[0]["item_id"],"model":None,"expected":"YES","ok":True})
        r.append({"axis":"care","item_id":i[1]["item_id"],"model":"b","expected":"YES","ok":None})
        result=analyse(r,i)
        self.assertEqual(result["excluded_rows"],2)

    def test_duplicated_model_item_excluded(self):
        r,i=fixture()
        r.append(copy.deepcopy(r[0]))
        report=analyse(r,i)
        self.assertEqual(report["excluded_duplicated_model_axis_item_keys"],1)
        # one model now has only 29 unique items, not eligible
        self.assertEqual(report["n_eligible_axes"],0)

    def test_mismatched_truth_rejected_as_ineligible(self):
        r,i=fixture()
        for row in r:
            if row["model"]=="a":
                row["expected"]="WRONG"
        report=analyse(r,i)
        self.assertEqual(report["n_eligible_axes"],0)
        self.assertEqual(report["excluded_rows"],30)

    def test_unmatched_items_not_silently_joined(self):
        r,i=fixture()
        r[0]["item_id"]="different"
        a=analyse(r,i)
        self.assertEqual(a["excluded_rows"],1)
        self.assertEqual(a["n_eligible_axes"],0)

    def test_duplicate_item_index_rejected(self):
        r,i=fixture()
        i.append(copy.deepcopy(i[0]))
        with self.assertRaises(ValueError):
            analyse(r,i)

    def test_minimum_overlap(self):
        r,i=fixture(n=29)
        self.assertEqual(analyse(r,i)["n_eligible_axes"],0)


if __name__=="__main__":
    unittest.main()
