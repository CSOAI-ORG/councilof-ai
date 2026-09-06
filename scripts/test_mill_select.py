#!/usr/bin/env python3
"""Shipped mill selector tests. Two successive hours at limit 8 on 40 slugs
are disjoint and cover 16 distinct models. An empty shard is not coverage success.
"""
from __future__ import annotations

import unittest

from mill_lock_update import apply_mill
from mill_select import classify_run, n_measured_from_lock, select_window


class SelectWindowTests(unittest.TestCase):
    def test_two_hours_limit_8_on_40_are_disjoint_and_cover_16(self):
        slugs = [f"m{i:02d}" for i in range(40)]
        w0, s0 = select_window(slugs, limit=8, hour=0, n_shards=1, shard=0)
        w1, s1 = select_window(slugs, limit=8, hour=1, n_shards=1, shard=0)
        self.assertEqual(len(w0), 8)
        self.assertEqual(len(w1), 8)
        self.assertEqual(s0, 0)
        self.assertEqual(s1, 8)
        self.assertEqual(set(w0) & set(w1), set())
        self.assertEqual(len(set(w0) | set(w1)), 16)
        self.assertEqual(w0, slugs[0:8])
        self.assertEqual(w1, slugs[8:16])

    def test_shards_are_adjacent_not_copies(self):
        slugs = [f"m{i:03d}" for i in range(2200)]
        seen: set[str] = set()
        for shard in range(20):
            w, _ = select_window(slugs, limit=30, hour=0, n_shards=20, shard=shard)
            self.assertEqual(len(w), 30)
            overlap = set(w) & seen
            self.assertEqual(overlap, set(), f"shard {shard} overlapped {overlap}")
            seen.update(w)
        self.assertEqual(len(seen), 600)

    def test_empty_slugs(self):
        w, start = select_window([], limit=8, hour=0)
        self.assertEqual(w, [])
        self.assertEqual(start, 0)


class ClassifyRunTests(unittest.TestCase):
    def test_probe_fail_is_visible_inference_fail_not_coverage(self):
        r = classify_run(probe_ok=False, n_measured_this_shard=0)
        self.assertFalse(r["coverage_success"])
        self.assertEqual(r["status"], "INFERENCE_FAIL")
        self.assertTrue(r["visible"])

    def test_zero_measured_is_not_coverage_success(self):
        r = classify_run(probe_ok=True, n_measured_this_shard=0)
        self.assertFalse(r["coverage_success"])
        self.assertEqual(r["status"], "MEASURED_NOTHING")

    def test_positive_measured_is_coverage(self):
        r = classify_run(probe_ok=True, n_measured_this_shard=30)
        self.assertTrue(r["coverage_success"])
        self.assertEqual(r["status"], "COVERAGE")


class LockReadTests(unittest.TestCase):
    def test_n_measured_is_read_not_typed(self):
        lock = {
            "n_measured": 0,
            "models": [{"status": "UNMEASURED"}] * 5 + [{"status": "practice-mill"}] * 3,
        }
        # field present wins (honest ledger)
        self.assertEqual(n_measured_from_lock(lock), 0)
        lock.pop("n_measured")
        self.assertEqual(n_measured_from_lock(lock), 3)

    def test_apply_mill_counts_practice_mill_rows(self):
        lock = {
            "n_measured": 0,
            "models": [{"slug": "a", "status": "UNMEASURED"}, {"slug": "b", "status": "UNMEASURED"}],
        }
        mill = {
            "as_of": "2026-09-06T00:00:00Z",
            "rows": [{"slug": "a", "status": "practice-mill", "n": 1}],
        }
        out = apply_mill(lock, mill)
        self.assertEqual(out["n_measured"], 1)
        self.assertEqual(out["models"][0]["status"], "practice-mill")
        self.assertEqual(out["models"][1]["status"], "UNMEASURED")


if __name__ == "__main__":
    unittest.main()
