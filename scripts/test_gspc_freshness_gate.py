import unittest

from gspc_freshness_gate import evaluate_axis


NOW = "2026-10-01T12:00:00Z"
DAY = 24 * 60 * 60


class FreshnessGateTests(unittest.TestCase):
    def test_exact_fresh(self):
        out = evaluate_axis(
            {
                "axis": "financial",
                "status": "MEASURED",
                "measurement_time": {
                    "state": "EXACT",
                    "observed_at": "2026-10-01T11:00:00Z",
                },
            },
            now=NOW,
            max_age_seconds=2 * DAY,
        )
        self.assertEqual(out["state"], "FRESH")
        self.assertTrue(out["admit_current"])

    def test_exact_stale(self):
        out = evaluate_axis(
            {
                "axis": "financial",
                "status": "MEASURED",
                "measurement_time": {
                    "state": "EXACT",
                    "observed_at": "2026-09-20T00:00:00Z",
                },
            },
            now=NOW,
            max_age_seconds=2 * DAY,
        )
        self.assertEqual(out["state"], "STALE")
        self.assertFalse(out["admit_current"])

    def test_old_day_is_stale_without_inventing_midnight(self):
        out = evaluate_axis(
            {
                "axis": "governance",
                "status": "MEASURED",
                "measurement_time": {
                    "state": "DAY",
                    "observed_on": "2026-08-12",
                },
            },
            now=NOW,
            max_age_seconds=14 * DAY,
        )
        self.assertEqual(out["state"], "STALE")
        self.assertEqual(out["reason"], "WHOLE_DAY_OLDER_THAN_BOUND")
        self.assertFalse(out["admit_current"])

    def test_day_crossing_bound_is_uncheckable(self):
        out = evaluate_axis(
            {
                "axis": "example",
                "status": "MEASURED",
                "measurement_time": {
                    "state": "DAY",
                    "observed_on": "2026-09-30",
                },
            },
            now="2026-10-01T12:00:00Z",
            max_age_seconds=DAY,
        )
        self.assertEqual(out["state"], "UNCHECKABLE")
        self.assertEqual(out["reason"], "BOUND_CROSSES_DAY_PRECISION")
        self.assertFalse(out["admit_current"])

    def test_not_after_old_upper_bound_is_stale(self):
        out = evaluate_axis(
            {
                "axis": "swarm",
                "status": "MEASURED",
                "measurement_time": {
                    "state": "NOT_AFTER",
                    "not_after": "2026-08-19T09:24:39.162060+00:00",
                },
            },
            now=NOW,
            max_age_seconds=14 * DAY,
        )
        self.assertEqual(out["state"], "STALE")
        self.assertEqual(out["reason"], "UPPER_BOUND_ALREADY_OLDER_THAN_BOUND")

    def test_not_after_recent_upper_bound_cannot_prove_fresh(self):
        out = evaluate_axis(
            {
                "axis": "example",
                "status": "MEASURED",
                "measurement_time": {
                    "state": "NOT_AFTER",
                    "not_after": "2026-10-01T11:00:00Z",
                },
            },
            now=NOW,
            max_age_seconds=DAY,
        )
        self.assertEqual(out["state"], "UNCHECKABLE")
        self.assertEqual(out["reason"], "UPPER_BOUND_CANNOT_PROVE_FRESH")
        self.assertFalse(out["admit_current"])

    def test_missing_measurement_time_is_uncheckable(self):
        out = evaluate_axis(
            {"axis": "example", "status": "MEASURED"},
            now=NOW,
            max_age_seconds=DAY,
        )
        self.assertEqual(out["state"], "UNCHECKABLE")
        self.assertEqual(out["reason"], "MISSING_MEASUREMENT_TIME")

    def test_unmeasured_axis_never_becomes_current(self):
        out = evaluate_axis(
            {
                "axis": "example",
                "status": "UNMEASURED",
                "measurement_time": {
                    "state": "EXACT",
                    "observed_at": NOW,
                },
            },
            now=NOW,
            max_age_seconds=DAY,
        )
        self.assertEqual(out["state"], "NOT_MEASURED")
        self.assertFalse(out["admit_current"])


if __name__ == "__main__":
    unittest.main()
