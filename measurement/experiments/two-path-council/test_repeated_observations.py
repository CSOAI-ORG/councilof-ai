#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Observed contradictions are not evidence of temporal causality."""
import copy
import unittest
from repeated_observations import analyse


def fixture():
    items=[{"axis":"safety","item_id":f"i{i}","expected":"ALLOW"} for i in range(4)]
    cells=[{"cell":"c1","axis":"safety","model":"m1","model_hf_revision":"rev1","provider_route":"host-A","bank_sha256":"a"*64},
           {"cell":"c2","axis":"safety","model":"m1","model_hf_revision":"rev1","provider_route":"host-A","bank_sha256":"a"*64},
           {"cell":"c3","axis":"safety","model":"m1","model_hf_revision":"rev1","provider_route":"host-B","bank_sha256":"a"*64}]
    rows=[]
    for i in range(4):
        for cell in cells:
            v=(i>0 or cell["cell"]=="c1")
            rows.append({"axis":"safety","item_id":f"i{i}","model":"m1","cell":cell["cell"],"expected":"ALLOW","ok":v,
                         "observed":"ALLOW" if v else "DENY"})
    return rows,items,cells


class TestRepeatedObservations(unittest.TestCase):
    def test_same_source_revision_can_still_have_variation(self):
        rows,items,cells=fixture()
        r=analyse(rows,items,cells)
        self.assertEqual(r["n_keys_observed_in_multiple_cells"],4)
        self.assertEqual(r["n_grade_conflict_keys"],1)
        self.assertEqual(r["grade_conflicts_by_recorded_metadata"]["ROUTE_CHANGED"],1)
        self.assertEqual(r["temporal_ordering"],"NOT_ESTABLISHED")
        self.assertEqual(r["model_weight_adaptation"],"NOT_ESTABLISHED")

    def test_same_metadata_conflict_not_drift(self):
        rows,items,cells=fixture()
        rows=[r for r in rows if r["cell"] in ("c1","c2")]
        r=analyse(rows,items,cells)
        self.assertEqual(r["grade_conflicts_by_recorded_metadata"]["SAME_RECORDED_METADATA"],1)
        self.assertEqual(r["individual_end_user_effect"],"NOT_MEASURED")

    def test_no_conflicts_when_all_answers_equal(self):
        rows,items,cells=fixture()
        for row in rows:row["ok"]=True;row["observed"]="ALLOW"
        r=analyse(rows,items,cells)
        self.assertEqual(r["n_grade_conflict_keys"],0)
        self.assertEqual(r["n_keys_observed_in_multiple_cells"],4)

    def test_bad_item_grade_excluded(self):
        rows,items,cells=fixture()
        rows[0]["expected"]="BAD"
        result=analyse(rows,items,cells)
        self.assertEqual(result["excluded_rows_by_reason"]["missing_or_mismatched_item"],1)

    def test_bad_cell_link_excluded(self):
        rows,items,cells=fixture()
        rows[0]["cell"]="missing"
        result=analyse(rows,items,cells)
        self.assertEqual(result["excluded_rows_by_reason"]["missing_or_mismatched_cell"],1)

    def test_no_unauthenticated_human_outcome(self):
        rows,items,cells=fixture()
        result=analyse(rows,items,cells)
        self.assertNotIn("humans_approved",result)
        self.assertEqual(result["referee_independence"],"NOT_ESTABLISHED")

    def test_duplicate_cell_id_rejected(self):
        rows,items,cells=fixture()
        cells.append(copy.deepcopy(cells[0]))
        with self.assertRaises(ValueError):
            analyse(rows,items,cells)

    def test_duplicate_item_id_rejected(self):
        rows,items,cells=fixture()
        items.append(copy.deepcopy(items[0]))
        with self.assertRaises(ValueError):
            analyse(rows,items,cells)

    def test_unattributed_not_counted(self):
        rows,items,cells=fixture()
        rows.append({**rows[0],"model":None})
        result=analyse(rows,items,cells)
        self.assertEqual(result["excluded_rows_by_reason"]["unattributed_model"],1)


if __name__=="__main__":
    unittest.main()
