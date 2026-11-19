#!/usr/bin/env python3
"""test_watchdog_charter_feed.py — the routing queue must be PROVABLY unable to decide.

A charter feed that can open a challenge, approve an action, or assert that an
obligation is satisfied is not a routing queue — it is a machine in the human's seat,
which is the one thing the estate's HOLD gate exists to prevent.

These tests pin the properties that make the feed safe to publish:

  1. Every row's human_decision is HOLD and may_apply is False.
  2. No row opens a challenge, and no row asserts a determination.
  3. Relevance is a MECHANICAL grid intersection — a source whose grid does not meet
     an obligation's grid never raises it.
  4. A source that did NOT answer is still routed, with the reason stated, because a
     watchdog that stopped answering is a fact a human must see.
  5. The feed never invents a count: a source with no count carries none.

Run: python3 scripts/test_watchdog_charter_feed.py
"""
from __future__ import annotations

import pathlib
import sys
import unittest

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parent))
import watchdog_charter_feed as wcf  # noqa: E402

INDEX = {
    "run_id": "TESTRUN",
    "as_of": "2026-10-30T00:00:00Z",
    "run_artifact": "/interop/watchdog-intake/TESTRUN.json",
    "signals": [
        {
            "source_id": "reachable-advisory",
            "name": "A reachable advisory feed",
            "kind": "advisory-feed",
            "state": "REACHABLE",
            "count": 1764,
            "count_kind": "count",
            "grid": ["supply-chain", "provenance"],
            "body_sha256": "a" * 64,
        },
        {
            "source_id": "dead-watchdog",
            "name": "A watchdog that stopped answering",
            "kind": "advisory-feed",
            "state": "UNREACHABLE",
            "count": None,
            "count_kind": "absent",
            "grid": ["supply-chain"],
            "body_sha256": None,
        },
        {
            "source_id": "off-grid-source",
            "name": "A source touching no obligation grid",
            "kind": "advisory-feed",
            "state": "REACHABLE",
            "count": 3,
            "count_kind": "count",
            "grid": ["jail"],
            "body_sha256": "b" * 64,
        },
    ],
    "unpinned_findings": [],
}


class TestRelevanceIsMechanical(unittest.TestCase):
    def test_a_grid_intersection_raises_an_obligation(self):
        ids = wcf.obligations_for(INDEX["signals"][0])
        self.assertIn("dora", ids)
        self.assertIn("article-50", ids)

    def test_a_source_off_every_obligation_grid_raises_nothing(self):
        self.assertEqual(wcf.obligations_for(INDEX["signals"][2]), [])

    def test_the_rule_is_reproducible(self):
        # The same source must raise the same obligations every time — relevance that
        # drifts between runs is relevance that cannot be audited.
        first = wcf.obligations_for(INDEX["signals"][0])
        second = wcf.obligations_for(INDEX["signals"][0])
        self.assertEqual(first, second)


class TestTheFeedDecidesNothing(unittest.TestCase):
    def setUp(self):
        self.feed = wcf.build(INDEX)

    def test_every_row_is_hold_and_cannot_apply(self):
        for row in self.feed["rows"]:
            self.assertEqual(row["human_decision"], "HOLD", row["row_id"])
            self.assertFalse(row["may_apply"], row["row_id"])
            self.assertFalse(row["approval_may_be_inferred"], row["row_id"])

    def test_no_row_opens_a_challenge(self):
        for row in self.feed["rows"]:
            self.assertFalse(row["challenge_opened"], row["row_id"])
            self.assertIn("/api/hitl", row["challenge_note"])

    def test_no_row_asserts_a_determination(self):
        banned = ("satisfied", "compliant", "non-compliant", "violation", "breach", "approved")
        for row in self.feed["rows"]:
            # Check the row's SUBSTANTIVE fields, not its `is_not` disclaimer list — a
            # disclaimer that says "this is not a determination" contains the word
            # "determination" by construction, and a test that cannot tell a denial
            # from an assertion is a test that proves nothing.
            substantive = {k: v for k, v in row.items() if k != "is_not"}
            blob = " ".join(str(v) for v in substantive.values()).lower()
            for word in banned:
                self.assertNotIn(word, blob, f"{row['row_id']} states a determination: {word}")

    def test_the_disclaimer_list_is_present_on_every_row(self):
        for row in self.feed["rows"]:
            self.assertTrue(row["is_not"], row["row_id"])
            self.assertTrue(any("determination" in n for n in row["is_not"]), row["row_id"])

    def test_the_feed_declares_what_it_is_not(self):
        for phrase in ("compliance determination", "certification", "approval"):
            self.assertTrue(any(phrase in n for n in self.feed["not_a"]), phrase)

    def test_the_feed_carries_no_score_or_rank_field(self):
        for row in self.feed["rows"]:
            for forbidden in ("score", "grade", "rank", "risk_level", "verdict"):
                self.assertNotIn(forbidden, row, f"{row['row_id']} carries a {forbidden} field")


class TestTheGapStaysVisible(unittest.TestCase):
    def setUp(self):
        self.feed = wcf.build(INDEX)

    def test_an_unreachable_watchdog_is_still_routed(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "dead-watchdog"]
        self.assertTrue(rows, "a watchdog that stopped answering must still reach a human")
        for row in rows:
            self.assertEqual(row["source_state"], "UNREACHABLE")
            self.assertIn("did not answer", row["routing_reason"])
            self.assertEqual(row["human_decision"], "HOLD")

    def test_an_unreachable_watchdog_lands_in_the_top_routing_bucket(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "dead-watchdog"]
        for row in rows:
            self.assertTrue(row["routing_bucket"].startswith("A"), row["routing_bucket"])

    def test_no_count_is_invented_for_a_silent_source(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "dead-watchdog"]
        for row in rows:
            self.assertIsNone(row["observed_count"])
            self.assertEqual(row["observed_count_kind"], "absent")

    def test_the_off_grid_source_raises_nothing_at_all(self):
        rows = [r for r in self.feed["rows"] if r["source_id"] == "off-grid-source"]
        self.assertEqual(rows, [], "a source touching no obligation grid must not raise one")


class TestTheQueueIsCountableWithoutBeingAScore(unittest.TestCase):
    def test_the_row_count_is_a_routing_count(self):
        feed = wcf.build(INDEX)
        self.assertEqual(feed["totals"]["rows"], len(feed["rows"]))
        self.assertIn("routing count", feed["count_grammar"])
        self.assertIn("not a measurement", feed["count_grammar"])

    def test_the_digest_binds_what_the_human_saw(self):
        feed = wcf.build(INDEX)
        rows = [r for r in feed["rows"] if r["source_id"] == "reachable-advisory"]
        for row in rows:
            self.assertEqual(row["source_digest"], "a" * 64)


class TestCharterAttribution(unittest.TestCase):
    """A Council control must not acquire external authority through its label."""

    def setUp(self):
        self.index = {
            "signals": [{
                "source_id": "runtime-control",
                "name": "Synthetic runtime control",
                "kind": "standard-body",
                "state": "REACHABLE",
                "grid": ["hitl", "effect-binding"],
                "body_sha256": "c" * 64,
            }],
        }
        self.rows = wcf.build(self.index)["rows"]
        self.row = next(row for row in self.rows if row["obligation"] == "charter")

    def test_control_is_attributed_to_council_candidate(self):
        self.assertEqual(
            self.row["obligation_label"],
            "Council of AI candidate profile — runtime enforcement and human oversight",
        )
        source = self.row["obligation_source"]
        self.assertEqual(source["owner"], "Council of AI")
        self.assertEqual(source["kind"], "CANDIDATE_PROFILE")
        self.assertEqual(source["adoption"], "NOT_ESTABLISHED")
        self.assertEqual(source["profile"], "csoai.hitl-authority-effect/0.2")
        self.assertIn("/blob/b5cef696a1ae17d756bd73897d2e68293d05d94e/", source["source_url"])
        self.assertEqual(source["git_blob_sha"], "f7c9af51d7ab897c62e2fa46cb63998e0cea9719")

    def test_external_status_is_dated_reference_not_adoption(self):
        source = self.row["obligation_source"]["external_reference"]
        self.assertEqual(source["relationship"], "REFERENCE_ONLY")
        self.assertEqual(source["status_at_check"], "UNDER_DEVELOPMENT")
        self.assertEqual(source["checked_on"], "2026-11-11")
        self.assertEqual(source["source_url"],
                         "https://github.com/OpenSecureAIAlliance/wg-safe/blob/"
                         "3769437209edac11d745dd58c165b951ed474e27/CHARTER.md")
        self.assertEqual(source["git_blob_sha"], "c74309c122a465a88731f3f7842beb812c89cac4")

    def test_attribution_changes_no_routing_identity_or_authority(self):
        self.assertEqual(self.row["row_id"], "runtime-control::charter")
        self.assertEqual(self.row["axis_touched"], ["effect-binding", "hitl"])
        self.assertEqual(self.row["source_digest"], "c" * 64)
        self.assertEqual(self.row["human_decision"], "HOLD")
        for field in ("may_apply", "approval_may_be_inferred", "challenge_opened"):
            self.assertIs(self.row[field], False)
        self.assertIn("proposal for review", self.row["challenge_note"])
        self.assertIn("/api/hitl", self.row["challenge_note"])
        self.assertEqual([row["obligation"] for row in self.rows], ["charter", "cra"])
        self.assertNotIn("obligation_source", self.rows[1])

    def test_returned_reference_cannot_change_later_outputs(self):
        self.row["obligation_source"]["external_reference"]["status_at_check"] = "ADOPTED"
        next_row = next(row for row in wcf.build(self.index)["rows"]
                        if row["obligation"] == "charter")
        self.assertEqual(next_row["obligation_source"]["external_reference"]["status_at_check"],
                         "UNDER_DEVELOPMENT")


if __name__ == "__main__":
    unittest.main(verbosity=2)
