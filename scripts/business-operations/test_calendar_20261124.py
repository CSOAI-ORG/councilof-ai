"""Offline controls for a source-checked, non-authorizing current operating calendar."""
import datetime as dt
import json
import unittest
from pathlib import Path

from observe import deadline_state

DATA = json.loads(Path(__file__).with_name("calendar.json").read_text())
EVENTS = {row["id"]: row for row in DATA["events"]}
UTC = dt.timezone.utc


class Calendar20261124Tests(unittest.TestCase):
    def test_reviewed_period_has_future_recheck(self):
        p = DATA["period"]
        self.assertEqual(p["reviewed_at"], "2026-11-24")
        self.assertGreaterEqual(p["end"], "2027-01-16")
        self.assertIn("not exhaustive", p["scope"])

    def test_old_historical_events_are_preserved(self):
        for event in ["cra-reporting-in-force", "eu-data-sovereignty", "nist-documentation", "business-review"]:
            self.assertIn(event, EVENTS)

    def test_no_duplicate_source_or_event_id(self):
        self.assertEqual(len(DATA["events"]), len(EVENTS))
        self.assertEqual(len(DATA["sources"]), len({x["id"] for x in DATA["sources"]}))

    def test_ofgem_current_official_source_and_exact_uk_winter_deadline(self):
        x = EVENTS["ofgem-ai-assurance-consultation-2027-01-15"]
        self.assertEqual(x["deadline_at"], "2027-01-15T23:59:00Z")
        self.assertTrue(x["url"].startswith("https://www.ofgem.gov.uk/consultation/"))
        self.assertIn("authoris", x["action"])
        self.assertIn("not a grant", x["action"].lower())

    def test_ofgem_not_due_before_window_and_due_at_known_cutoff(self):
        x = EVENTS["ofgem-ai-assurance-consultation-2027-01-15"]
        self.assertEqual(deadline_state(x, dt.datetime(2026, 11, 24, tzinfo=UTC)), "UPCOMING")
        self.assertEqual(deadline_state(x, dt.datetime(2027, 1, 15, 23, 58, tzinfo=UTC)), "DUE_WITHIN_72H")
        self.assertEqual(deadline_state(x, dt.datetime(2027, 1, 16, tzinfo=UTC)), "PASSED")

    def test_eu_article50_is_date_only_and_scope_undetermined(self):
        x = EVENTS["eu-ai-act-article50-transition-2026-12-02"]
        self.assertNotIn("deadline_at", x)
        self.assertIn("applicability not determined", x["title"])
        self.assertEqual(deadline_state(x, dt.datetime(2026, 11, 30, tzinfo=UTC)), "DUE_WITHIN_3_DAYS")
        self.assertEqual(deadline_state(x, dt.datetime(2026, 12, 2, tzinfo=UTC)), "DUE_DATE_TODAY_TIME_UNSPECIFIED")

    def test_workshop_is_not_mislabelled_submission_deadline(self):
        x = EVENTS["ofgem-ai-assurance-workshop-2026-12-07"]
        self.assertNotIn("deadline_at", x)
        self.assertIn("optional", x["title"].lower())
        self.assertIn("registration requires separately authorised", x["action"])

    def test_internal_review_not_promoted_to_external_deadline(self):
        x = EVENTS["internal-business-evidence-review-2026-12-01"]
        self.assertNotIn("deadline_at", x)
        self.assertIn("internal", x["title"].lower())
        self.assertIn("NOT an external deadline", x["title"])


if __name__ == "__main__":
    unittest.main()
