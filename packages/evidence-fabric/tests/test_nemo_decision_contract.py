#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Unsupported or incomplete rail evidence must not become an allow observation."""
import copy
import json
import os
import sys
import unittest
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
import event as E
from ingest import nemo_guardrails_in as N

class DecisionContractTest(unittest.TestCase):
    def event(self, turn):
        out=N.ingest(json.dumps({'model':'contract-fixture','turns':[turn]}).encode(),read_at='2026-11-10T02:00:00Z')
        self.assertEqual(len(out),1)
        self.assertEqual(E.validate(out[0]),[])
        return out[0]
    def test_unknown_observed_actions(self):
        for value in ('timeout','error','pending','',False,0,{},[]):
            with self.subTest(value=value):
                e=self.event({'expected_action':'allow','activated_rails':[{'decision':value}]})
                self.assertEqual(e['state'],'UNMEASURED')
                self.assertIsNone(e['value'])
    def test_missing_declaration(self):
        self.assertEqual(self.event({'activated_rails':[{'decision':'allow'}]})['state'],'UNMEASURED')
    def test_unknown_declarations(self):
        for value in (None,'error','',False,{},[]):
            with self.subTest(value=value):
                self.assertEqual(self.event({'expected_action':value,'activated_rails':[{'decision':'allow'}]})['state'],'UNMEASURED')
    def test_malformed_rail_cannot_be_skipped(self):
        for rails in ([{'decision':'allow'},'bad'],[None,{'decision':'block'}]):
            with self.subTest(rails=rails):
                self.assertEqual(self.event({'expected_action':'allow','activated_rails':rails})['state'],'UNMEASURED')
    def test_known_allow_and_block(self):
        for value in ('allow','block','refuse','stop','reject'):
            with self.subTest(value=value):
                self.assertEqual(self.event({'expected_action':value,'activated_rails':[{'decision':value}]})['state'],'CONSISTENT')
    def test_mismatch_remains_divergent(self):
        self.assertEqual(self.event({'expected_action':'block','activated_rails':[{'decision':'allow'}]})['state'],'DIVERGENT')
    def test_status_fallback(self):
        self.assertEqual(self.event({'expected_action':'allow','activated_rails':[{'status':'allow'}]})['state'],'CONSISTENT')
    def test_whitespace_and_case(self):
        self.assertEqual(self.event({'expected_action':' BLOCK ','activated_rails':[{'decision':' REFUSE '}]})['state'],'CONSISTENT')
    def test_no_input_mutation(self):
        turn={'expected_action':'block','activated_rails':[{'decision':'block'},{'decision':'allow'}]};saved=copy.deepcopy(turn)
        self.event(turn);self.assertEqual(turn,saved)
    def test_missing_trace(self):
        self.assertEqual(self.event({'expected_action':'allow'})['state'],'UNMEASURED')

if __name__=='__main__':unittest.main()
