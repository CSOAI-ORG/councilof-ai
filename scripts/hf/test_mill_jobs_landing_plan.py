"""mill_jobs_landing_plan: M-P1-6. Run: python3 -m unittest discover -s scripts/hf -p test_mill_jobs_landing_plan.py"""
import json
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path

HERE = Path(__file__).resolve().parent
sys.path.insert(0, str(HERE))
import mill_jobs_landing_plan as lp  # noqa: E402


def card(model: str, axis: str, n: int, digest_seed: str, cid: str = "") -> dict:
    digest = (digest_seed * 64)[:64]
    return {"id": cid or (digest_seed * 64)[:64][::-1], "body": {
        "kind": "gspc.measurement-card", "model": model, "axis": axis, "n": n, "status": "UNMEASURED",
        "evidence": {"items_sha256": digest}}}


def g(model, axis, n, seed, cid="", path=""):
    return lp.grading_of(card(model, axis, n, seed, cid), path or f"{axis}/{model}-{seed}.json")


BOT = [{"authors": [{"email": "board@csoai.org"}]}]
HUMAN = BOT + [{"authors": [{"email": "nicholas@csoai.org"}]}]


class PlanRulesTest(unittest.TestCase):
    def test_on_master_in_open_pr_low_yield_and_duplicate_cells_are_kept_out(self):
        staged = [
            g("org/a", "safety", 36, "a"),                    # on master already
            g("org/b", "safety", 36, "b"),                    # digest in an open PR
            g("org/c", "safety", 36, "c"),                    # cell in flight in an open PR (other digest)
            g("org/d", "safety", 4, "d"),                     # low-yield route
            g("org/e", "safety", 22, "e", cid="2" * 64),      # unquotable duplicate of a quotable cell
            g("org/e", "safety", 33, "f", cid="9" * 64),      # kept: quotable beats unquotable
            g("org/h", "governance", 31, "1", cid="b" * 64),  # tie on n: smaller card id kept
            g("org/h", "governance", 31, "2", cid="a" * 64),
            g("org/k", "governance", 40, "3"),                # new and clean
        ]
        prs = [lp.OpenPR(2843, "mill/land-hfjobs-1", True, {staged[1].digest, "x" * 64}, {("org/c", "safety")})]
        p = lp.plan(staged, prs, {staged[0].digest}, 10)
        kept = {(r["model"], r["axis"], r["n"]) for r in p["admitted"]}
        self.assertEqual(kept, {("org/e", "safety", 33), ("org/h", "governance", 31), ("org/k", "governance", 40)})
        reasons = " | ".join(r["reason"] for r in p["excluded"])
        for want in ("already on master", "in open PR #2843", "in flight in open PR #2843", "low-yield route",
                     "another grading of this cell is kept"):
            self.assertIn(want, reasons)
        kept_h = [r for r in p["admitted"] if r["model"] == "org/h"][0]
        self.assertTrue(kept_h["path"].endswith("-2.json"), "the smaller card id wins a tie, never the accuracy")
        self.assertTrue(p["hold"], "an open HF Jobs PR holds the landing")
        self.assertIn("#2843", p["hold_reason"])

    def test_no_open_pr_and_nothing_new_lands_nothing_and_holds_nothing(self):
        staged = [g("org/a", "safety", 36, "a")]
        p = lp.plan(staged, [], {staged[0].digest}, 10)
        self.assertEqual(p["admitted"], [])
        self.assertFalse(p["hold"])
        self.assertEqual(p["close"], [])

    def test_identical_and_subset_prs_collapse_to_one_and_a_landed_pr_closes(self):
        a, b, c, d = ("a" * 64, "b" * 64, "c" * 64, "d" * 64)
        prs = [
            lp.OpenPR(2802, "mill/land-hfjobs-1", True, {a}),          # all on master -> close
            lp.OpenPR(2815, "mill/land-hfjobs-2", True, {b}),          # subset of 2843 -> close
            lp.OpenPR(2843, "mill/land-hfjobs-3", True, {b, c}),       # kept (lowest of the identical pair)
            lp.OpenPR(2846, "mill/land-hfjobs-4", True, {b, c}),       # identical to 2843, newer -> close
        ]
        p = lp.plan([], prs, {a, d}, 10)
        closed = {c["number"]: c["reason"] for c in p["close"]}
        self.assertEqual(set(closed), {2802, 2815, 2846})
        self.assertIn("on master", closed[2802])
        self.assertIn("#2843", closed[2815])
        self.assertIn("#2843", closed[2846])
        self.assertTrue(p["hold"])
        self.assertIn("#2843", p["hold_reason"])
        self.assertNotIn("#2846", p["hold_reason"])

    def test_twins_that_differ_only_by_gradings_on_master_keep_the_lower_number(self):
        # Seen live on 2026-10-07: #2843 and #2846 carry the same 176 gradings, some already on
        # master. Comparing against the other PR's FULL set made the lower twin look like a strict
        # subset and closed it; the rule compares what each still adds over master.
        a, b, m = ("a" * 64, "b" * 64, "m" * 64)
        prs = [lp.OpenPR(2843, "mill/land-hfjobs-3", True, {a, b, m}),
               lp.OpenPR(2846, "mill/land-hfjobs-4", True, {a, b, m})]
        p = lp.plan([], prs, {m}, 10)
        self.assertEqual([c["number"] for c in p["close"]], [2846])
        self.assertIn("#2843", p["hold_reason"])

    def test_human_touched_unreadable_and_other_lane_prs_are_never_closed(self):
        a = "a" * 64
        prs = [
            lp.OpenPR(1, "mill/land-hfjobs-1", False, {a}),            # a human commit on it
            lp.OpenPR(2, "mill/land-hfjobs-2", True, set(), readable=False),
            lp.OpenPR(3, "mill/land-safety-3", True, {a}),             # hub-queue-land PR: not ours
        ]
        p = lp.plan([], prs, {a}, 10)
        self.assertEqual(p["close"], [])
        self.assertTrue(p["hold"])

    def test_bot_only_reads_every_author_and_unknown_is_not_bot(self):
        self.assertTrue(lp.is_bot_only({"commits": BOT}))
        self.assertFalse(lp.is_bot_only({"commits": HUMAN}))
        self.assertFalse(lp.is_bot_only({"commits": []}))
        self.assertFalse(lp.is_bot_only({}))

    def test_grading_needs_a_full_evidence_digest(self):
        self.assertIsNone(lp.grading_of({"body": {"model": "m", "axis": "a", "n": 30, "evidence": {"items_sha256": "ab"}}}))
        self.assertIsNone(lp.grading_of({"body": {"model": "m", "axis": "a", "n": True,
                                                  "evidence": {"items_sha256": "a" * 64}}}))


class PlanCliTest(unittest.TestCase):
    def test_cli_moves_excluded_cards_out_of_the_staged_tree(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            repo = root / "repo"
            (repo / lp.UNSIGNED).mkdir(parents=True)
            (repo / lp.SIGNED).mkdir(parents=True)
            (repo / lp.UNSIGNED / "unsigned-safety-aaaaaaaaaaaa.json").write_text(json.dumps(card("org/a", "safety", 36, "a")))
            subprocess.run(["git", "init", "-q", str(repo)], check=True)
            staged = root / "staged" / "safety" / "shard-0-of-1"
            staged.mkdir(parents=True)
            (staged / "unsigned-safety-1.json").write_text(json.dumps(card("org/a", "safety", 36, "a")))
            (staged / "unsigned-safety-2.json").write_text(json.dumps(card("org/z", "safety", 38, "z")))
            (staged / "unsigned-safety-3.json").write_text(json.dumps(card("org/y", "safety", 3, "y")))
            prs = root / "prs.json"
            prs.write_text("[]")
            out = root / "plan.json"
            gho = root / "gho.txt"
            rc = lp.main(["--staged", str(root / "staged"), "--open-prs", str(prs), "--repo", str(repo),
                          "--excluded-dir", str(root / "excluded"), "--out", str(out), "--github-output", str(gho)])
            self.assertEqual(rc, 0)
            left = sorted(p.name for p in (root / "staged").rglob("unsigned-*.json"))
            self.assertEqual(left, ["unsigned-safety-2.json"])
            self.assertEqual(len(list((root / "excluded").rglob("unsigned-*.json"))), 2)
            self.assertIn("hold=false", gho.read_text())
            self.assertIn("admitted=1", gho.read_text())
            self.assertEqual(json.loads(out.read_text())["admitted"][0]["model"], "org/z")


if __name__ == "__main__":
    unittest.main()
