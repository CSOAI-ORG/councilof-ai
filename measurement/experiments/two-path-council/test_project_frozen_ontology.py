#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""JSON-LD frozen public measurement projection regression tests."""
import copy
import unittest
from project_frozen_ontology import project

S="a"*64
C="b"*64
SRC="c"*64
REV="d"*40


def fixture(*, bank=S, grade=True):
    item={"axis":"care","item_id":"item-00"}
    cells=[{"cell":"cell-00.jsonl","cell_sha256":C,"bank_sha256":bank,
            "bank_dataset":"csoai/gspc-care","axis":"care","model":"toy/one",
            "n_rows":30,"n_graded":30 if grade else 0,"n_ok":30 if grade else 0}]
    observations=[{"axis":"care","item_id":"item-00","cell":"cell-00.jsonl",
                   "model":"toy/one","ok":True if grade else None} for _ in range(30)]
    manifest={"counts":{"measurements":30,"items":1,"cells":1,
                        "rows_not_graded":0 if grade else 30,
                        "rows_without_a_model":0}}
    return manifest,observations,[item],cells


def run_fixture(args):
    return project(*args,source_bytes_sha256=SRC,revision=REV)


class TestFrozenOntology(unittest.TestCase):
    def test_deterministic(self):
        a=run_fixture(fixture())
        b=run_fixture(fixture())
        self.assertEqual(a,b)
        self.assertEqual(a["counts"]["banks"],1)
        self.assertEqual(a["counts"]["cells"],1)
        self.assertEqual(len(a["graph"]["@graph"]),3)
        self.assertFalse(a["signed_card_not_established"] is False)

    def test_unknown_bank_not_invented(self):
        a=run_fixture(fixture(bank=None))
        self.assertEqual(a["counts"]["banks"],0)
        self.assertEqual(a["counts"]["cells_missing_bank_digest"],1)
        self.assertEqual(a["graph"]["@graph"][1]["source"],"urn:sha256:"+SRC)

    def test_missing_grade_not_zero_percent(self):
        a=run_fixture(fixture(grade=False))
        cell=a["graph"]["@graph"][-1]
        self.assertNotIn("accuracy",cell)
        self.assertEqual(a["counts"]["rows_ungraded"],30)

    def test_invalid_source_digest_rejected(self):
        with self.assertRaises(ValueError):
            project(*fixture(),source_bytes_sha256="invalid",revision=REV)

    def test_malformed_known_bank_rejected(self):
        with self.assertRaises(ValueError):
            run_fixture(fixture(bank="not-a-sha"))

    def test_source_count_mismatch_rejected(self):
        args=list(fixture())
        args[0]=copy.deepcopy(args[0])
        args[0]["counts"]["measurements"]=31
        with self.assertRaises(ValueError):
            run_fixture(tuple(args))


if __name__=="__main__":
    unittest.main()
