"""mill_jobs_landing_plan: M-P1-6. Run: python3 -m unittest discover -s scripts/hf -p test_mill_jobs_landing_plan.py"""
import json
import subprocess
import sys
import tempfile
import unittest
from datetime import datetime, timezone
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
# #2815 on 2026-10-07: bot commits plus one "Merge branch 'master'" by a person (second parent on master).
MASTER_MERGE = {"authors": [{"email": "nicholas@csoai.org"}], "parents": ["p" * 40, "m" * 40], "merges_master": True}
NOW = datetime(2026, 10, 7, 12, 0, tzinfo=timezone.utc)


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

    def test_of_twins_the_human_touched_one_is_kept_even_when_newer(self):
        # A merge-lane commit on the newer twin means a human is working there: the bot-only
        # lower twin is the one that closes, so one HF Jobs PR stays open, not two.
        a, b = ("a" * 64, "b" * 64)
        prs = [lp.OpenPR(2843, "mill/land-hfjobs-3", True, {a, b}),
               lp.OpenPR(2846, "mill/land-hfjobs-4", False, {a, b})]
        p = lp.plan([], prs, set(), 10)
        self.assertEqual([c["number"] for c in p["close"]], [2843])
        self.assertIn("#2846", p["close"][0]["reason"])
        self.assertIn("#2846", p["hold_reason"])
        self.assertNotIn("#2843", p["hold_reason"])

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

    def test_a_commit_that_only_merged_master_in_is_not_human_work(self):
        self.assertTrue(lp.is_bot_only({"commits": BOT + [MASTER_MERGE]}))
        # A merge whose second parent is NOT on master brought other work in: human.
        self.assertFalse(lp.is_bot_only({"commits": BOT + [{**MASTER_MERGE, "merges_master": False}]}))
        # Parents unknown, or one parent: an ordinary commit, judged by its author.
        self.assertFalse(lp.is_bot_only({"commits": BOT + [{**MASTER_MERGE, "parents": ["p" * 40]}]}))
        no_parents = {k: v for k, v in MASTER_MERGE.items() if k != "parents"}
        self.assertFalse(lp.is_bot_only({"commits": BOT + [no_parents]}))
        # A person's ordinary commit beside the merge still marks the PR human-touched.
        self.assertFalse(lp.is_bot_only({"commits": HUMAN + [MASTER_MERGE]}))

    def test_live_2815_shape_closes_the_merge_only_twin_and_holds_one(self):
        # Read 2026-10-07 07:4xZ: #2815 (bot + one master merge by a person) adds 77 gradings over
        # master, all in #2843; #2846 adds exactly #2843's 112. One PR must stay open, not two.
        a, b, c = ("a" * 64, "b" * 64, "c" * 64)
        prs = [lp.OpenPR(2815, "mill/land-hfjobs-2", lp.is_bot_only({"commits": BOT + [MASTER_MERGE]}), {a}),
               lp.OpenPR(2843, "mill/land-hfjobs-3", lp.is_bot_only({"commits": BOT}), {a, b, c}),
               lp.OpenPR(2846, "mill/land-hfjobs-4", lp.is_bot_only({"commits": BOT}), {a, b, c})]
        p = lp.plan([], prs, set(), 10)
        self.assertEqual(sorted(c["number"] for c in p["close"]), [2815, 2846])
        self.assertIn("#2843", p["hold_reason"])
        for gone in ("#2815", "#2846"):
            self.assertNotIn(gone, p["hold_reason"])


def rollup(**checks):
    return [{"__typename": "CheckRun", "name": n, "status": "COMPLETED", "conclusion": c, "completedAt": t}
            for n, (c, t) in checks.items()]


class StaleRollingPrTest(unittest.TestCase):
    def test_stale_reason_reads_conflicts_failed_and_missing_required_checks(self):
        old, recent = "2026-10-06T06:00:00Z", "2026-10-07T10:00:00Z"
        head_old = [{"committedDate": old}]
        self.assertIn("conflicts", lp.stale_reason({"mergeable": "CONFLICTING"}, NOW, 24))
        red = {"mergeable": "MERGEABLE", "statusCheckRollup": rollup(gates=("FAILURE", old), build=("SUCCESS", old))}
        self.assertIn("gates", lp.stale_reason(red, NOW, 24))
        self.assertEqual(lp.stale_reason({**red, "statusCheckRollup": rollup(gates=("FAILURE", recent))}, NOW, 24), "")
        # A later green run of the same check on the same head is what counts.
        rerun = rollup(gates=("FAILURE", old), build=("SUCCESS", old)) + rollup(gates=("SUCCESS", recent))
        self.assertEqual(lp.stale_reason({"statusCheckRollup": rerun, "commits": head_old}, NOW, 24), "")
        no_build = {"statusCheckRollup": rollup(gates=("SUCCESS", old)), "commits": head_old}
        self.assertIn("build", lp.stale_reason(no_build, NOW, 24))
        self.assertEqual(lp.stale_reason({**no_build, "commits": [{"committedDate": recent}]}, NOW, 24), "")
        green = {"mergeable": "UNKNOWN", "statusCheckRollup": rollup(gates=("SUCCESS", old), build=("SUCCESS", old)),
                 "commits": head_old}
        self.assertEqual(lp.stale_reason(green, NOW, 24), "")

    def test_a_stale_bot_pr_is_replaced_from_staging_and_stops_holding(self):
        old_x, old_y = g("org/x", "safety", 33, "1"), g("org/y", "safety", 3, "2")   # y: below the floor
        stale = lp.OpenPR.from_gradings(2843, "mill/land-hfjobs-3", True, [old_x, old_y], stale="it conflicts with master")
        staged = [g("org/x", "safety", 33, "1"), g("org/z", "governance", 31, "3")]
        p = lp.plan(staged, [stale], set(), 10)
        self.assertFalse(p["hold"], p["hold_reason"])
        self.assertEqual({(r["model"], r["n"]) for r in p["admitted"]}, {("org/x", 33), ("org/z", 31)})
        self.assertEqual(p["close"], [])
        self.assertEqual(p["replace"], [{"number": 2843, "branch": "mill/land-hfjobs-3",
                                         "reason": "it conflicts with master", "needs_cells": [["org/x", "safety"]]}])

    def test_live_replay_closes_the_twins_and_replaces_the_conflicting_one(self):
        # 2026-10-07 07:50Z as read from the public API: #2815 (bot + a master merge) and #2846 add
        # nothing #2843 lacks; #2843 and #2846 conflict with master. Staging still holds #2843's
        # gradings, so one run leaves exactly one HF Jobs PR: the fresh one it opens.
        x, y = g("org/x", "safety", 33, "1"), g("org/y", "care", 31, "2")
        prs = [lp.OpenPR.from_gradings(2815, "mill/land-hfjobs-2", lp.is_bot_only({"commits": BOT + [MASTER_MERGE]}), [x]),
               lp.OpenPR.from_gradings(2843, "mill/land-hfjobs-3", True, [x, y], stale="it conflicts with master"),
               lp.OpenPR.from_gradings(2846, "mill/land-hfjobs-4", True, [x, y], stale="it conflicts with master")]
        p = lp.plan([g("org/x", "safety", 33, "1"), g("org/y", "care", 31, "2")], prs, set(), 10)
        self.assertEqual(sorted(c["number"] for c in p["close"]), [2815, 2846])
        self.assertTrue(all("#2843 is itself replaced in this run" in c["reason"] for c in p["close"]))
        self.assertEqual([r["number"] for r in p["replace"]], [2843])
        self.assertFalse(p["hold"])
        self.assertEqual(len(p["admitted"]), 2)

    def test_a_stale_pr_whose_gradings_are_all_settled_closes_now(self):
        on_master, low = g("org/x", "safety", 33, "1"), g("org/y", "safety", 3, "2")
        stale = lp.OpenPR.from_gradings(2843, "mill/land-hfjobs-3", True, [on_master, low], stale="it conflicts with master")
        p = lp.plan([], [stale], {on_master.digest}, 10)
        self.assertEqual([c["number"] for c in p["close"]], [2843])
        self.assertIn("conflicts", p["close"][0]["reason"])
        self.assertEqual(p["replace"], [])
        self.assertFalse(p["hold"])

    def test_a_stale_pr_with_a_grading_staging_no_longer_holds_keeps_holding(self):
        gone = g("org/x", "safety", 33, "1")
        stale = lp.OpenPR.from_gradings(2843, "mill/land-hfjobs-3", True, [gone], stale="it conflicts with master")
        p = lp.plan([g("org/z", "governance", 31, "3")], [stale], set(), 10)
        self.assertTrue(p["hold"])
        self.assertEqual(p["replace"], [])
        self.assertEqual(p["close"], [])
        self.assertIn("#2843", p["hold_reason"])
        self.assertIn("not replaced", p["hold_reason"])

    def test_human_touched_or_healthy_prs_are_never_replaced(self):
        x = g("org/x", "safety", 33, "1")
        human = lp.OpenPR.from_gradings(2843, "mill/land-hfjobs-3", False, [x], stale="it conflicts with master")
        p = lp.plan([g("org/x", "safety", 33, "1")], [human], set(), 10)
        self.assertTrue(p["hold"])
        self.assertEqual((p["replace"], p["close"]), ([], []))
        self.assertIn("a human has committed to it", p["hold_reason"])
        # A healthy rolling PR holds the slot, so a stale one beside it cannot be replaced this run.
        healthy = lp.OpenPR.from_gradings(2850, "mill/land-hfjobs-5", True, [g("org/q", "care", 31, "4")])
        stale = lp.OpenPR.from_gradings(2843, "mill/land-hfjobs-3", True, [x], stale="it conflicts with master")
        p = lp.plan([g("org/x", "safety", 33, "1")], [healthy, stale], set(), 10)
        self.assertTrue(p["hold"])
        self.assertEqual(p["replace"], [])
        self.assertIn("#2850", p["hold_reason"])
        self.assertIn("#2843", p["hold_reason"])

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
