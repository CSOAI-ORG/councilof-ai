#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Release invariants; never upload in CI or inspect HF_TOKEN."""
from __future__ import annotations
import copy
import json
import math
import os
import tempfile
import unittest
from pathlib import Path

from publish_evidence_adaptation import validate_rows,stage,publish,REL,FILE_NAMES


class ResearchReleaseTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.root=Path(__file__).resolve().parents[2]
        cls.raw=(cls.root/REL/"data/research_observations.jsonl").read_bytes()
        cls.rows=validate_rows(cls.raw)

    def test_curated_release_has_machine_rows(self):
        self.assertGreaterEqual(len(self.rows),20)
        self.assertIn("SYNTHETIC",{x["evidence_state"] for x in self.rows})
        self.assertIn("PUBLIC_SOURCE_OBSERVATION",{x["evidence_state"] for x in self.rows})

    def test_no_duplicate_observation_keys(self):
        rows=[self.rows[0],self.rows[0]]
        with self.assertRaises(ValueError):
            validate_rows(("\n".join(json.dumps(x) for x in rows)+"\n").encode())

    def test_rejects_missing_disclosure(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["limitations"]=""
        with self.assertRaises(ValueError):
            validate_rows(("\n".join(json.dumps(x) for x in rows)+"\n").encode())

    def test_rejects_unrecognised_evidence_state(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["evidence_state"]="CERTIFIED"
        with self.assertRaises(ValueError):
            validate_rows(("\n".join(json.dumps(x) for x in rows)+"\n").encode())

    def test_rejects_nan_or_inf(self):
        rows=copy.deepcopy(self.rows)
        rows[0]["numeric_value"]=math.inf
        with self.assertRaises(ValueError):
            validate_rows(("\n".join(json.dumps(x) for x in rows)+"\n").encode())

    def test_stage_is_deterministic_for_same_commit(self):
        with tempfile.TemporaryDirectory() as a,tempfile.TemporaryDirectory() as b:
            x=stage(self.root,"e"*40,Path(a))
            y=stage(self.root,"e"*40,Path(b))
            self.assertEqual(x,y)
            self.assertEqual(x["source_commit_sha"],"e"*40)
            self.assertFalse(x["is_certification"])
            self.assertEqual(x["independent_peer_review"],"NOT_ESTABLISHED")
            self.assertEqual(len(x["file_sha256"]),len(FILE_NAMES))
            self.assertTrue((Path(a)/"manifest.json").is_file())

    def test_pull_request_event_refused_even_if_ref_is_forged_master(self):
        with tempfile.TemporaryDirectory() as tmp:
            prior_ref=os.environ.get("GITHUB_REF")
            prior_event=os.environ.get("GITHUB_EVENT_NAME")
            try:
                os.environ["GITHUB_REF"]="refs/heads/master"
                os.environ["GITHUB_EVENT_NAME"]="pull_request"
                with self.assertRaises(RuntimeError):
                    publish(Path(tmp),{"file_sha256":{}})
            finally:
                if prior_ref is None:os.environ.pop("GITHUB_REF",None)
                else:os.environ["GITHUB_REF"]=prior_ref
                if prior_event is None:os.environ.pop("GITHUB_EVENT_NAME",None)
                else:os.environ["GITHUB_EVENT_NAME"]=prior_event

    def test_unprivileged_publish_refused_before_network(self):
        with tempfile.TemporaryDirectory() as tmp:
            prior=os.environ.get("GITHUB_REF")
            try:
                os.environ["GITHUB_REF"]="refs/pull/22/merge"
                with self.assertRaises(RuntimeError):
                    publish(Path(tmp),{"file_sha256":{}})
            finally:
                if prior is None:os.environ.pop("GITHUB_REF",None)
                else:os.environ["GITHUB_REF"]=prior


if __name__=="__main__":
    unittest.main()
