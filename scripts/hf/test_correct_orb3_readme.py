#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Source-preserving ORB-III card regression tests; no network or tokens."""
import unittest
from pathlib import Path
from correct_orb3_readme import render,MARKER,LEGACY,GATE

from correct_orb3_readme import HEADER

def legacy_fixture():
    return ("---\nlicense: cc-by-4.0\n---\n" +
         HEADER+"\n\n## The module in this dataset\n" +
         LEGACY+"\n\n## Learning gate\n"+
         GATE+"\nhuman-oversight decision on an axis you have not been briefed on.\n")


class TestOrbCorrection(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.card=legacy_fixture()

    def test_notice_and_original_data_claim_separately_exposed(self):
        x=render(self.card)
        self.assertIn(MARKER,x)
        self.assertNotIn(LEGACY,x)
        self.assertNotIn(GATE,x)
        self.assertIn("model-only synthesiser achieved 9/12",x)
        self.assertIn("12/12 correct choices",x)
        self.assertIn("0/12",x)
        self.assertIn("not a blinded independent",x)
        self.assertIn("does not independently establish",x)
        self.assertIn("frozen learning rows remain unchanged",x)

    def test_idempotent_when_notice_complete(self):
        x=render(self.card)
        self.assertEqual(x,render(x))
        self.assertEqual(x.count(MARKER),1)

    def test_source_missing_performance_anchor_fail_closed(self):
        with self.assertRaises(ValueError):render(self.card.replace(LEGACY,"Other score"))

    def test_source_missing_human_grant_anchor_fail_closed(self):
        with self.assertRaises(ValueError):render(self.card.replace(GATE,"Authorisation not promised"))

    def test_partial_notice_fails_closed(self):
        with self.assertRaises(ValueError):render(self.card.replace("## The module in this dataset",MARKER+"\n## The module in this dataset"))

    def test_no_banned_research_certification_claim(self):
        x=render(self.card)
        self.assertNotIn("is certified",x.lower())
        self.assertIn("not a blinded independent council",x)


if __name__=="__main__":
    unittest.main()
