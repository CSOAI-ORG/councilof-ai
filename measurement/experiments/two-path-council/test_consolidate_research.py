#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Meta-lab fail-closed state qualification checks."""
import copy
import hashlib
import json
import unittest
from consolidate_research import ACCEPT, compose, validate_record, digest, canonical


def fixtures():
    reports={}
    for kind,(schema,field,state) in ACCEPT.items():
        reports[kind]={"schema":schema,field:state}
    reports["two_path"]["independent_referee_established"]=False
    reports["historical"]["not_blind"]=True
    reports["fact"]["errors"]=[]
    reports["fact"]["cell_count_mismatches"]=0
    reports["blind"]["randomisation"]="deterministic synthetic PRNG"
    reports["jspace"]["source_revision"]="b176b283b82f5b7fa786bc0c67842299cadf1803"
    reports["trajectory"]["not_live_agent"]=True
    return reports


class TestConsolidation(unittest.TestCase):
    def test_compose_exact_supported_inputs(self):
        output=compose(fixtures())
        self.assertEqual(output["n_entries"],6)
        self.assertEqual(output["state"],"RESEARCH_COMPOSITE_UNVERIFIED")
        self.assertEqual(output["gspc_board_mutations"],0)
        self.assertEqual(output["independent_external_verifications"],0)

    def test_missing_experiment_rejected(self):
        rows=fixtures()
        del rows["jspace"]
        with self.assertRaises(ValueError):
            compose(rows)

    def test_fake_measured_promotion_rejected(self):
        rows=fixtures()
        rows["two_path"]["evidence_state"]="MEASURED"
        with self.assertRaises(ValueError):
            compose(rows)

    def test_fact_replay_failure_rejected(self):
        rows=fixtures()
        rows["fact"]["cell_count_mismatches"]=2
        with self.assertRaises(ValueError):
            compose(rows)

    def test_live_target_mislabel_rejected(self):
        rows=fixtures()
        rows["blind"]["randomisation"]="OS CSPRNG in same-owner generator"
        with self.assertRaises(ValueError):
            compose(rows)

    def test_wrong_source_revision_rejected(self):
        rows=fixtures()
        rows["jspace"]["source_revision"]="main"
        with self.assertRaises(ValueError):
            compose(rows)

    def test_claimed_receipt_is_checked(self):
        rows=fixtures()
        rows["trajectory"]["receipt_sha256"]="0"*64
        with self.assertRaises(ValueError):
            compose(rows)
        rows["trajectory"].pop("receipt_sha256")
        rows["trajectory"]["receipt_sha256"]=digest(canonical(rows["trajectory"]))
        self.assertEqual(compose(rows)["n_entries"],6)

    def test_false_referee_independence_rejected(self):
        rows=fixtures()
        rows["two_path"]["independent_referee_established"]=True
        with self.assertRaises(ValueError):
            compose(rows)

    def test_stable_output(self):
        self.assertEqual(compose(fixtures()),compose(fixtures()))


if __name__=="__main__":
    unittest.main()
