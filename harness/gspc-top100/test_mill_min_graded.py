"""mill(min_graded=...): a low-yield route is a dead row, not a card (M-P1-7, 2026-10-07).

Run: python3 harness/gspc-top100/test_mill_min_graded.py   (or pytest)
"""
from __future__ import annotations

import json
import sys
import tempfile
import unittest
import unittest.mock as mock
from datetime import datetime, timedelta, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parent))
import mill_hub_queue as mq  # noqa: E402


def _setup(root: Path, n_items: int = 40) -> tuple[Path, Path]:
    banks = root / "banks"
    banks.mkdir(parents=True, exist_ok=True)
    rows = [{"prompt": f"Q{i}", "expected": "YES" if i % 2 == 0 else "NO"} for i in range(n_items)]
    (banks / "safety.jsonl").write_text("".join(json.dumps(r) + "\n" for r in rows))
    q = root / "queue.jsonl"
    q.write_text("".join(
        json.dumps({"rank": i + 1, "id": mid, "status": "UNMEASURED", "card_id": "", "pipeline_tag": "text-generation"}) + "\n"
        for i, mid in enumerate(("org/chatty", "org/base"))))
    return banks, q


def _infer(mid: str, prompt: str):
    mq._ROUTE[mid] = f"hf-router:{mid}:featherless-ai"
    if "PING" in prompt:
        return "OK", "PING"
    if mid == "org/base":
        # A base model continues the text instead of answering: parseable only now and then.
        n = int(prompt.split("Item: Q", 1)[1].split()[0]) if "Item: Q" in prompt else 0
        return "OK", "YES" if n < 5 else "Item: Q and then the story continues"
    return "OK", "YES"


class MinGradedTest(unittest.TestCase):
    def run_mill(self, root: Path, min_graded: int, dead: Path | None = None, items: int = 40, axis: str = "safety") -> dict:
        banks, q = _setup(root)
        if axis != "safety":
            (banks / f"{axis}.jsonl").write_text((banks / "safety.jsonl").read_text())
        with mock.patch("mill_hub_queue.infer_hub", side_effect=_infer):
            return mq.mill(q, root / "out", pick_n=2, grade_n=2, axis=axis, banks_dir=banks, items_cap=items,
                           bank_dataset="csoai/gspc-agi", bank_revision="e" * 40, revision_fetch=lambda m: "f" * 40,
                           dead_path=dead, dead_max_age_days=14, min_graded=min_graded)

    def test_off_by_default_stages_the_low_yield_card_as_before(self):
        with tempfile.TemporaryDirectory() as tmp:
            rep = self.run_mill(Path(tmp), 0)
            self.assertEqual(sorted(s["id"] for s in rep["staged_unsigned"]), ["org/base", "org/chatty"])
            base = [s for s in rep["staged_unsigned"] if s["id"] == "org/base"][0]
            self.assertEqual(base["n"], 5)

    def test_floor_turns_the_low_yield_route_into_a_dead_row_and_keeps_the_good_card(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dead = root / "dead.jsonl"
            rep = self.run_mill(root, 10, dead)
            self.assertEqual([s["id"] for s in rep["staged_unsigned"]], ["org/chatty"])
            chatty = rep["staged_unsigned"][0]
            self.assertEqual((chatty["items"], chatty["n"]), (40, 40), "min(bank, 40) items graded")
            reasons = [s["reason"] for s in rep["skips"] if s["id"] == "org/base"]
            self.assertTrue(any("low-yield route: 5 of 40 items parseable (<10 graded)" in r for r in reasons), reasons)
            rows = [json.loads(l) for l in dead.read_text().splitlines()]
            self.assertEqual([(r["id"], r["axis"], r.get("scope")) for r in rows], [("org/base", "safety", "axis")])
            self.assertTrue(mq.is_dead_reason(rows[0]["reason"]))
            self.assertIn("featherless-ai", rows[0]["reason"], "the route that failed is named")
            self.assertFalse(list((root / "out").glob("unsigned-safe*-*.json"))[1:], "one card only")

    def test_a_low_yield_row_is_skipped_on_the_next_pick_and_re_probed_after_expiry(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dead = root / "dead.jsonl"
            old = (datetime.now(timezone.utc) - timedelta(days=30)).strftime("%Y-%m-%dT%H:%M:%SZ")
            dead.write_text(json.dumps({"id": "org/base", "reason": "UNCHECKABLE low-yield route: 2 of 30", "axis": "safety", "as_of": old}) + "\n")
            # Expired: org/base is picked again, still low-yield, and written back with a fresh stamp.
            rep = self.run_mill(root, 10, dead)
            self.assertEqual(rep["dead_appended"], 1)
            self.assertIn(("org/base", "safety"), mq.load_dead_cells(dead, 14))
            # Fresh: the next run on this axis never picks it.
            rep2 = self.run_mill(root / "again", 10, dead)
            self.assertNotIn("org/base", [s["id"] for s in rep2["skips"]] + [s["id"] for s in rep2["staged_unsigned"]])
            self.assertEqual(rep2["dead_cells_this_axis"], 1)

    def test_a_low_yield_row_skips_its_own_axis_only(self):
        # Seen live: the base models that parse 2 of 30 governance items via featherless-ai hold
        # MEASURED n=30 cards on eight other axes. A low-yield row must not take them off those.
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            dead = root / "dead.jsonl"
            now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ")
            dead.write_text(json.dumps({"id": "org/base", "reason": "UNCHECKABLE low-yield route: 2 of 30", "axis": "governance",
                                        "scope": "axis", "as_of": now}) + "\n")
            self.assertEqual(mq.load_dead_slugs(dead, 14), set(), "never a model-wide skip")
            self.assertEqual(mq.load_dead_cells(dead, 14), {("org/base", "governance")})
            on_safety = self.run_mill(root / "s", 0, dead)
            self.assertIn("org/base", [s["id"] for s in on_safety["staged_unsigned"]], "another axis still picks it")
            on_gov = self.run_mill(root / "g", 0, dead, axis="governance")
            self.assertNotIn("org/base", [s["id"] for s in on_gov["staged_unsigned"]] + [s["id"] for s in on_gov["skips"]])
            # The scope is read from the reason too, so an unscoped low-yield row is never model-wide;
            # a no-endpoint row stays model-wide.
            dead.write_text(json.dumps({"id": "org/base", "reason": "UNCHECKABLE low-yield route: 2 of 30", "axis": "governance", "as_of": now}) + "\n"
                            + json.dumps({"id": "org/gone", "reason": "UNCHECKABLE no live inference provider (probe-first)", "axis": "safety", "as_of": now}) + "\n")
            self.assertEqual(mq.load_dead_slugs(dead, 14), {"org/gone"})
            self.assertEqual(mq.load_dead_cells(dead, 14), {("org/base", "governance")})
            # A model-wide dead id is not re-recorded per axis; a second axis IS a new low-yield row.
            self.assertEqual(mq.append_dead_slugs(dead, [{"id": "org/gone", "reason": "UNCHECKABLE low-yield route: 1 of 30",
                                                          "axis": "care", "scope": "axis", "as_of": now}], 14), 0)
            self.assertEqual(mq.append_dead_slugs(dead, [{"id": "org/base", "reason": "UNCHECKABLE low-yield route: 1 of 30",
                                                          "axis": "care", "scope": "axis", "as_of": now}], 14), 1)
            self.assertEqual(mq.append_dead_slugs(dead, [{"id": "org/base", "reason": "UNCHECKABLE low-yield route: 1 of 30",
                                                          "axis": "care", "scope": "axis", "as_of": now}], 14), 0)


if __name__ == "__main__":
    unittest.main()
