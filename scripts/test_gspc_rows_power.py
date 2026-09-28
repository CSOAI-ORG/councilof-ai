#!/usr/bin/env python3
"""Tests for the power additions to scripts/gspc_separation_from_rows.py (2026-09-28, board honesty).

Run: python3 -m unittest scripts/test_gspc_rows_power.py   (stdlib only)

What is held here:
  * the rejection region is the board's own exact McNemar body, not an approximation of it;
  * the test keeps its size (power at delta = 0 is <= alpha);
  * the MDE is the smallest difference that reaches 80% power (just under it does not);
  * an axis that cannot reach 80% power at any difference says NOT_REACHABLE, never a number;
  * no discordant item is UNDEFINED, never 0;
  * the exact MDE sits within a point of the textbook normal approximation where n is large;
  * the fleet is counted from the model ids in the rows (own fine-tunes counted, never listed);
  * --board refuses to change the bytes a .signed.json binds.
"""
from __future__ import annotations

import hashlib
import json
import math
import os
import sys
import tempfile
import unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
import gspc_separation_from_rows as g  # noqa: E402


def normal_mde(n, psi, za=1.959964, zb=0.841621):
    """Connor (1987) normal-approximation MDE, solved by bisection. Cross-check only."""
    lo, hi = 0.0, psi
    for _ in range(80):
        mid = (lo + hi) / 2
        lhs = math.sqrt(n) * mid
        rhs = za * math.sqrt(psi) + zb * math.sqrt(max(0.0, psi - mid * mid))
        if lhs >= rhs:
            hi = mid
        else:
            lo = mid
    return hi


class RejectionRegion(unittest.TestCase):
    def test_kmax_matches_the_board_test_by_brute_force(self):
        table = g.reject_kmax(60)
        for d, k in enumerate(table):
            rejecting = [b for b in range(d + 1) if (g.mcnemar(b, d - b) or 1.0) < 0.05]
            lower = [b for b in rejecting if b <= d - b]
            self.assertEqual(k, max(lower) if lower else -1, f"D={d}")

    def test_no_split_of_five_or_fewer_discordant_items_can_reject(self):
        self.assertEqual(g.reject_kmax(5), [-1] * 6)
        self.assertEqual(g.reject_kmax(6)[6], 0)  # 6-0 gives p = 2/64 = 0.03125


class Power(unittest.TestCase):
    def test_size_is_kept_at_delta_zero(self):
        for n, psi in ((30, 0.3), (100, 0.5), (237, 0.5443)):
            self.assertLessEqual(g.mcnemar_power(n, psi, 0.0), 0.05 + 1e-9, (n, psi))

    def test_power_rises_with_delta(self):
        ps = [g.mcnemar_power(80, 0.4, d) for d in (0.0, 0.1, 0.2, 0.3, 0.4)]
        self.assertEqual(ps, sorted(ps))

    def test_bad_arguments_are_refused(self):
        with self.assertRaises(ValueError):
            g.mcnemar_power(30, 0.2, 0.3)


class MDE(unittest.TestCase):
    def test_mde_is_the_smallest_difference_reaching_80_percent(self):
        for n, psi in ((237, 129 / 237), (199, 57 / 199), (41, 9 / 41)):
            mde, state = g.mcnemar_mde(n, psi)
            self.assertEqual(state, "MEASURED", (n, psi))
            self.assertGreaterEqual(g.mcnemar_power(n, psi, mde), 0.80, (n, psi, mde))
            self.assertLess(g.mcnemar_power(n, psi, max(0.0, mde - 0.002)), 0.80, (n, psi, mde))

    def test_exact_mde_is_near_the_normal_approximation_when_n_is_large(self):
        for n, psi in ((237, 129 / 237), (199, 57 / 199)):
            mde, _ = g.mcnemar_mde(n, psi)
            self.assertLess(abs(mde - normal_mde(n, psi)), 0.01, (n, psi, mde))

    def test_three_items_can_never_reach_power(self):
        # the retired swarm bank: 3 distinct paired items
        self.assertEqual(g.mcnemar_mde(3, 1 / 3), (None, "NOT_REACHABLE"))

    def test_small_discordance_on_a_small_bank_is_not_reachable(self):
        # 36 items, 6 discordant (psi 0.1667): even all six one way rejects only when D >= 6
        self.assertEqual(g.mcnemar_mde(36, 6 / 36), (None, "NOT_REACHABLE"))

    def test_no_discordant_item_is_undefined_never_zero(self):
        self.assertEqual(g.mcnemar_mde(40, 0.0), (None, "UNDEFINED"))
        self.assertEqual(g.mcnemar_mde(0, 0.0), (None, "UNDEFINED"))


class Fleet(unittest.TestCase):
    def test_roster_counts_own_and_names_only_base(self):
        f = g.fleet_roster(["gemma3:12b", "mistral:7b", "sov6-logic-v3-light", "council-x", "gpt-x"])
        self.assertEqual(f["models_in_rows"], 5)
        self.assertEqual((f["base_count"], f["own_count"], f["other_count"]), (2, 2, 1))
        self.assertEqual(f["base_models"], ["gemma3:12b", "mistral:7b"])
        self.assertNotIn("own_models", f)
        self.assertEqual(f["other_models"], ["gpt-x"])


class SignedBytesGuard(unittest.TestCase):
    def _repo(self):
        d = tempfile.mkdtemp()
        os.makedirs(os.path.join(d, "public", "interop"))
        os.makedirs(os.path.join(d, "public", "signed"))
        os.makedirs(os.path.join(d, "functions", "api"))
        with open(os.path.join(d, "public", "signed", "card_index.json"), "w") as fh:
            json.dump({"cards": []}, fh)
        return d

    def _results(self):
        rows = []
        for i in range(40):
            rows.append({"item": f"i{i}", "model": "gemma3:12b", "correct": i % 3 == 0})
            rows.append({"item": f"i{i}", "model": "mistral:7b", "correct": i % 2 == 0})
        ext = g.run(rows, lambda m: True)
        return {"governance": {"file": "peritem_gov.jsonl", "sha256": "0" * 64, "rows": 80, "distinct_items": 40,
                               "own_model_excluded": ext,
                               "control": {"nperm": 0, "seed": g.SEED, "shuffle_reselect_separated_rate": None,
                                           "shuffle_fixed_pair_separated_rate": None}}}

    def test_refuses_to_change_bytes_a_signature_binds(self):
        repo = self._repo()
        signed = os.path.join(repo, "public", "interop", "gspc-peritem-rows-2026-08-12.signed.json")
        with open(signed, "w") as fh:
            json.dump({"payload": {"artifact": {"sha256": "f" * 64}}}, fh)
        os.environ["CREATED_UTC"] = "2026-09-27T04:38:00Z"
        try:
            with self.assertRaises(SystemExit) as cm:
                g.board(repo, "a" * 64, {"peritem_gov.jsonl": "0" * 64}, self._results(), "rev")
            self.assertIn("Refusing to change signed bytes", str(cm.exception))
            self.assertFalse(os.path.exists(os.path.join(repo, "functions", "api", "_gspc_rows_separation.ts")))
        finally:
            os.environ.pop("CREATED_UTC", None)

    def test_writes_when_the_bytes_are_the_signed_ones(self):
        repo = self._repo()
        os.environ["CREATED_UTC"] = "2026-09-27T04:38:00Z"
        try:
            g.board(repo, "a" * 64, {"peritem_gov.jsonl": "0" * 64}, self._results(), "rev")  # no signature yet
            rec = os.path.join(repo, "public", "interop", "gspc-peritem-rows-2026-08-12.json")
            sha = hashlib.sha256(open(rec, "rb").read()).hexdigest()
            with open(rec[: -len(".json")] + ".signed.json", "w") as fh:
                json.dump({"payload": {"artifact": {"sha256": sha}}}, fh)
            g.board(repo, "a" * 64, {"peritem_gov.jsonl": "0" * 64}, self._results(), "rev")  # same bytes: allowed
            self.assertEqual(hashlib.sha256(open(rec, "rb").read()).hexdigest(), sha)
        finally:
            os.environ.pop("CREATED_UTC", None)


if __name__ == "__main__":
    unittest.main()
