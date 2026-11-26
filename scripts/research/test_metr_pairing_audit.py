# SPDX-License-Identifier: Apache-2.0
"""Synthetic controls only; the exact upstream replay is separate."""
import copy
import hashlib
import json
import unittest
from metr_pairing_audit import audit

def encode(rows):
    return ("\n".join(json.dumps(r) for r in rows) + "\n").encode()

def row(run, model, version=None, source="baseline"):
    return {"run_id": run, "model": model, "task_id": "fixture/task", "task_version": version,
            "human_source": source, "human_minutes": 3.0, "score_binarized": 1}

class PairingAudit(unittest.TestCase):
    def setUp(self):
        self.h = row(1, "human")
        self.m = row(2, "o3_inspect", "1.0")
    def read(self, rows):
        b = encode(rows)
        return audit(b, hashlib.sha256(b).hexdigest())
    def test_unknown_version(self):
        r = self.read([self.h, self.m])
        self.assertEqual(r["shared_task_ids"], 1)
        self.assertEqual(r["shared_non_null_task_version_keys"], 0)
        self.assertEqual(r["state"], "TASK_ID_OVERLAP_VERSION_EQUIVALENCE_UNESTABLISHED")
        self.assertFalse(r["comparison_admitted"])
    def test_matching_version(self):
        self.h["task_version"] = "1.0"
        self.assertEqual(self.read([self.h, self.m])["state"], "VERSION_KEYS_OVERLAP_ONLY")
    def test_estimate_not_human_attempt(self):
        self.h["human_source"] = "estimate"
        r = self.read([self.h, self.m])
        self.assertEqual(r["human_baseline_rows"], 0)
        self.assertEqual(r["state"], "UNCHECKABLE_MISSING_COMPARATOR")
    def test_nonintersecting_task_ids(self):
        self.m["task_id"] = "fixture/other"
        self.assertEqual(self.read([self.h, self.m])["state"], "NO_OBSERVED_TASK_ID_OVERLAP")
    def test_bad_digest(self):
        with self.assertRaises(ValueError):
            audit(encode([self.h, self.m]), "0" * 64)
    def test_bad_rows(self):
        for key, value in [("score_binarized", True), ("human_minutes", 0), ("task_version", 3), ("task_id", "")]:
            with self.subTest(key=key):
                bad = copy.deepcopy(self.h); bad[key] = value
                with self.assertRaises(ValueError):
                    self.read([bad, self.m])
    def test_duplicate_run(self):
        with self.assertRaises(ValueError):
            self.read([self.h, self.h, self.m])
    def test_absent_version_field(self):
        del self.h["task_version"]
        with self.assertRaises(ValueError):
            self.read([self.h, self.m])
    def test_duplicate_json_key(self):
        b = b'{"task_id":"a","task_id":"b"}\n'
        with self.assertRaises(ValueError):
            audit(b, hashlib.sha256(b).hexdigest())
if __name__ == "__main__":
    unittest.main()
