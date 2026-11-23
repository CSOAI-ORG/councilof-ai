#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Regression checks for retrospective public-bank aggregation."""
import copy
import unittest
from historical_twelve import analyse


def fixture(n_models=12,n_items=30,correct_models=3):
    items=[]
    rows=[]
    for i in range(n_items):
        item=f"item-{i:02d}"
        truth="YES" if i%2 else "NO"
        items.append({"axis":"care","item_id":item,"expected":truth})
        for m in range(n_models):
            answer=truth if m<correct_models else ("NO" if truth=="YES" else "YES")
            rows.append({"axis":"care","item_id":item,"model":f"model-{m:02d}",
                         "expected":truth,"observed":answer,"ok":answer==truth})
    return rows,items


class TestHistoricalTwelve(unittest.TestCase):
    def test_majority_can_amplify_bad_models(self):
        rows,items=fixture()
        result=analyse(rows,items)
        panel=result["axis_panels"]["care"]
        self.assertEqual(panel["n_paired_public_items"],30)
        self.assertEqual(panel["n_distinct_model_ids"],12)
        self.assertEqual(panel["model_vote_accuracy_mean"],0.25)
        self.assertEqual(panel["majority_accuracy_all_items"],0)
        self.assertEqual(panel["majority_coverage"],1)
        self.assertTrue(result["not_bft_consensus"])

    def test_six_six_tie_abstains(self):
        rows,items=fixture(correct_models=6)
        panel=analyse(rows,items)["axis_panels"]["care"]
        self.assertEqual(panel["majority_accuracy_all_items"],0)
        self.assertEqual(panel["majority_coverage"],0)
        self.assertEqual(panel["majority_abstentions"],30)

    def test_duplicate_observations_excluded(self):
        rows,items=fixture()
        rows.append(copy.deepcopy(rows[0]))
        self.assertNotIn("care",analyse(rows,items)["axis_panels"])

    def test_inconsistent_grader_excluded(self):
        rows,items=fixture()
        for r in rows:
            r["ok"]=not r["ok"]
        self.assertNotIn("care",analyse(rows,items)["axis_panels"])

    def test_insufficient_tasks_disallows_panel(self):
        rows,items=fixture(n_items=29)
        self.assertNotIn("care",analyse(rows,items)["axis_panels"])


if __name__ == "__main__":
    unittest.main()
