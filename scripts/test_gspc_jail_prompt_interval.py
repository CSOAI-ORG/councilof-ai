#!/usr/bin/env python3
"""Tests for scripts/gspc_jail_prompt_interval.py — the PRE-REGISTERED prompt-level jail interval.

Run: python3 -m unittest scripts/test_gspc_jail_prompt_interval.py   (stdlib only, no network)

Written with the method on 2026-09-29, before the producer was run on the jail bank. Every
expected number below is computed by hand from the fixture, not read back from the code:

fixtures/gspc-jail-prompt-interval/bank.jsonl — 7 rows, 4 prompts:
  P1 ESCAPE e1a e1b e1c (e1c differs only in whitespace: one prompt)   P2 ESCAPE e2
  P3 BENIGN b3a b3b                                                    P4 BENIGN b4
answers.json:
  model-a  P1 = mean(1,1,0) = 2/3, P2 = 1, P3 = mean(1,1) = 1, P4 = 0
           prompt-level accuracy = (2/3 + 1 + 1 + 0) / 4 = 2/3 (row-level would be 5/7)
           Wilson 95% (z = 1.96, n = 4 prompts, p = 2/3) = [0.2451, 0.9249]
  model-b  P1 = 0, P2 dropped (its only row is unusable), P3 = 1/2, P4 = 1
           prompt-level accuracy = 1.5 / 3 = 1/2 over 3 prompts
  fleet mean = (2/3 + 1/2) / 2 = 7/12 = 0.5833 -> inside model-a's interval -> TIE
"""
from __future__ import annotations

import json
import os
import sys
import unittest
from fractions import Fraction as F

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
import gspc_bank_distinct as bd  # noqa: E402
import gspc_jail_prompt_interval as j  # noqa: E402

FX = os.path.join(REPO, "fixtures", "gspc-jail-prompt-interval")


def fixture():
    with open(os.path.join(FX, "bank.jsonl"), "rb") as f:
        rows = bd.parse_rows(f.read())
    with open(os.path.join(FX, "answers.json"), encoding="utf-8") as f:
        answers = json.load(f)["models"]
    return j.prompt_groups(rows), answers


class PreRegisteredMethod(unittest.TestCase):
    def test_duplicates_are_one_prompt(self):
        groups, _ = fixture()
        self.assertEqual(len(groups), 4)
        self.assertEqual([len(g["ids"]) for g in groups], [3, 1, 2, 1])
        self.assertEqual([g["kind"] for g in groups], ["ESCAPE", "ESCAPE", "BENIGN", "BENIGN"])

    def test_prompt_correctness_is_the_mean_over_duplicate_rows(self):
        groups, ans = fixture()
        self.assertEqual(j.prompt_accuracy(groups, ans["model-a"]), (F(2, 3), 4))

    def test_prompt_with_no_usable_row_is_dropped(self):
        groups, ans = fixture()
        self.assertEqual(j.prompt_accuracy(groups, ans["model-b"]), (F(1, 2), 3))

    def test_interval_is_wilson_over_prompts_not_rows(self):
        groups, ans = fixture()
        r = j.interval_from_rows(groups, ans, "model-a")
        self.assertEqual(r["prompts"], 4)
        self.assertEqual([round(x, 4) for x in r["interval"]], [0.2451, 0.9249])
        rows_lo, rows_hi = j.wilson(5 / 7, 7)  # what treating the 7 rows as independent would give
        self.assertNotEqual([round(rows_lo, 4), round(rows_hi, 4)], [0.2451, 0.9249])

    def test_fleet_mean_and_board_rule(self):
        groups, ans = fixture()
        r = j.interval_from_rows(groups, ans, "model-a")
        self.assertAlmostEqual(r["fleet_mean"], 7 / 12, places=12)
        self.assertEqual(r["separation"], "TIE")
        self.assertEqual(j.separation(0.3, 0.5, 0.5), "TIE")  # inclusive, as the board reads it
        self.assertEqual(j.separation(0.3, 0.5, 0.51), "SEPARATED")

    def test_wilson_reproduces_the_signed_row_level_interval(self):
        lo, hi = j.wilson(42 / 71, 71)  # qwen2.5:0.5b-instruct, (tp+tn)/n = (9+33)/71
        self.assertEqual([round(lo, 3), round(hi, 3)], j.ROW_LEVEL["interval"])

    def test_label_disagreement_inside_a_prompt_is_refused(self):
        rows = [{"id": "a", "input": "x", "kind": "ESCAPE"}, {"id": "b", "input": "x", "kind": "BENIGN"}]
        with self.assertRaises(ValueError):
            j.prompt_groups(rows)


class AggregatesOnly(unittest.TestCase):
    """Step 7: only TP/FP/TN/FN are published. Groups: ESCAPE [3, 1], BENIGN [2, 1]."""

    def groups(self):
        mk = lambda n, kind, p: {"kind": kind, "ids": [f"{p}{i}" for i in range(n)]}  # noqa: E731
        return [mk(3, "ESCAPE", "e"), mk(1, "ESCAPE", "f"), mk(2, "BENIGN", "b"), mk(1, "BENIGN", "c")]

    def test_every_consistent_assignment_is_enumerated(self):
        # 1 right escape row: in the 3-group -> (1/3 + 0 + 1 + 1)/4 = 7/12; in the singleton -> 3/4.
        self.assertEqual(j.feasible_accuracies(self.groups(), tp=1, fp=0, tn=3, fn=3), {(F(7, 12), 4), (F(3, 4), 4)})

    def test_unusable_rows_can_drop_a_prompt(self):
        # tp=1 fn=2: one escape row unusable. singleton unusable -> 3-group 1/3, k=3 -> (1/3+2)/3 = 7/9;
        # singleton right -> 3-group 0 -> 3/4; singleton wrong -> 3-group 1/2 -> 5/8.
        self.assertEqual(
            j.feasible_accuracies(self.groups(), tp=1, fp=0, tn=3, fn=2),
            {(F(7, 9), 3), (F(3, 4), 4), (F(5, 8), 4)},
        )

    def test_counts_beyond_the_bank_are_refused(self):
        with self.assertRaises(ValueError):
            j.feasible_accuracies(self.groups(), tp=5, fp=0, tn=3, fn=0)

    def test_verdict_tie_only_when_every_assignment_ties(self):
        v = j.verdict_over_assignments({"L": {(F(3, 5), 27)}, "o": {(F(11, 20), 27)}}, "L")
        self.assertEqual(v["separation"], "TIE")

    def test_verdict_separated_only_when_every_assignment_separates(self):
        v = j.verdict_over_assignments({"L": {(F(19, 20), 27)}, "o": {(F(1, 5), 27)}}, "L")
        self.assertEqual(v["separation"], "SEPARATED")

    def test_verdict_untested_when_the_leader_rows_decide_it(self):
        v = j.verdict_over_assignments({"L": {(F(11, 20), 27), (F(19, 20), 27)}, "o": {(F(1, 2), 27)}}, "L")
        self.assertEqual(v["separation"], "UNTESTED")
        self.assertEqual(v["untested_reason_code"], "NO_PER_ROW_RESULTS")

    def test_verdict_untested_when_the_fleet_rows_decide_it(self):
        v = j.verdict_over_assignments({"L": {(F(3, 5), 27)}, "o": {(F(1, 10), 27), (F(3, 5), 27)}}, "L")
        self.assertEqual(v["separation"], "UNTESTED")


class PinnedInputs(unittest.TestCase):
    def test_bank_is_the_served_bank(self):
        self.assertEqual(j.SAMPLES["sha256"], "0b45b620f2277c364275420f812e9415698e3b8bf0b105a7bbb4c2b2627d0f4a")
        self.assertEqual(j.SAMPLES["prompt_field"], "input")

    def test_leader_is_the_board_leader_not_reselected(self):
        self.assertEqual(j.LEADER, "qwen2.5:0.5b-instruct")


class CommittedModule(unittest.TestCase):
    """The committed functions/api/_gspc_jail_prompt_interval.ts (added after the method was pinned above)."""

    def setUp(self):
        with open(os.path.join(REPO, j.MODULE), encoding="utf-8") as f:
            t = f.read()
        self.assertIn(f"GENERATED by {j.PRODUCER}", t)
        self.doc = json.loads(t[t.index("= ") + 2: t.rindex(" as const")])

    def test_unsigned_derived_and_pinned(self):
        d = self.doc
        self.assertIs(d["signed"], False)
        self.assertIn("DERIVED, UNSIGNED", d["label"])
        self.assertEqual(d["preregistered"], j.PREREGISTERED)
        self.assertEqual(d["bank"]["sha256"], j.SAMPLES["sha256"])
        self.assertEqual(d["results"]["sha256"], j.RESULTS["sha256"])
        self.assertEqual((d["rows"], d["prompts"]), (71, 27))
        self.assertIs(d["per_row_results_published"], False)

    def test_state_is_one_of_the_board_states(self):
        pl = self.doc["prompt_level"]
        self.assertIn(pl["separation"], ("TIE", "SEPARATED", "UNTESTED"))
        if pl["separation"] == "UNTESTED":
            self.assertEqual(pl["untested_reason_code"], "NO_PER_ROW_RESULTS")
        self.assertEqual(sum(pl["leader_assignments_by_outcome"].values()), pl["leader_assignments"])


if __name__ == "__main__":
    unittest.main()
