#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Small synthetic fixtures for frozen stage1→stage2 transfer machinery."""
import copy
import unittest

from stage1_stage2_transfer import analyse


def make(n=120,prefix="train",source="synthetic_source"):
    names=["bl_first_token_logprob","bl_mean_logprob","bl_min_logprob","bl_answer_len"]
    names += [f"ws_test_{i:02d}" for i in range(27)]
    rows=[]
    for i in range(n):
        y=i%2
        features={k:(float(y*2 + (i%5)*.01) if k!="bl_answer_len" else float(i%17))
                  for k in names}
        rows.append({"example_id":f"{prefix}-{i:04d}","source_dataset":source,
                     "split_group":prefix, "label":y,"features":features})
    return rows


class TestStageTransfer(unittest.TestCase):
    def test_fit_and_validate(self):
        r=analyse(make(prefix="train"),make(prefix="test"),steps=30)
        self.assertEqual(r["evidence_state"],"RETROSPECTIVE_PUBLIC_TRANSFER")
        self.assertEqual(r["train"]["n_valid"],120)
        self.assertEqual(r["test"]["n_valid"],120)
        self.assertEqual(r["results"]["output_only"]["features"],4)
        self.assertEqual(r["results"]["workspace_only"]["features"],27)
        self.assertEqual(r["results"]["combined"]["features"],31)

    def test_repeatable(self):
        a=analyse(make(prefix="train"),make(prefix="test"),steps=25)
        b=analyse(make(prefix="train"),make(prefix="test"),steps=25)
        self.assertEqual(a,b)

    def test_cross_split_same_example_rejected(self):
        with self.assertRaises(ValueError):
            analyse(make(prefix="train"),make(prefix="train"),steps=10)

    def test_one_class_train_rejected(self):
        train=make(prefix="train")
        for r in train:r["label"]=0
        with self.assertRaises(ValueError):
            analyse(train,make(prefix="test"),steps=10)

    def test_wrong_feature_count_rejected(self):
        train=make(prefix="train")
        for r in train:r["features"].pop("ws_test_00")
        with self.assertRaises(ValueError):
            analyse(train,make(prefix="test"),steps=10)

    def test_missing_stage2_label_tracked(self):
        test=make(prefix="test")
        test[0]["label"]=None
        r=analyse(make(prefix="train"),test,steps=10)
        self.assertEqual(r["test"]["missing_label"],1)
        self.assertEqual(r["test"]["n_valid"],119)


if __name__=="__main__":
    unittest.main()
