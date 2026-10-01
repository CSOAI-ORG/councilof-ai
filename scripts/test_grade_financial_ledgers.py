#!/usr/bin/env python3
"""Stdlib tests for the shipped financial-ledger grader.

Drives scripts/grade_financial_ledgers.py grade_* on representative *fetched*
shapes (AccountRoot flags + series payloads). Does not hard-code live ledger
numbers. UNREACHABLE is never FAIL. n is an instrument/series count.
"""
from __future__ import annotations

import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from gspc_financial_facts import (  # noqa: E402
    LSF,
    decode_flags,
    eurostat_latest,
    grade_control_facts,
    grade_custody,
    grade_distribution,
    grade_humanoid,
    grade_regime,
    grade_reserve,
    grade_series_values,
    jsonstat_cells,
)


def hex_domain(s: str) -> str:
    return s.encode("utf-8").hex()


class ControlFacts(unittest.TestCase):
    def test_require_auth_and_domain_measured(self):
        data = {"Flags": LSF["RequireAuth"] | LSF["DefaultRipple"], "Domain": hex_domain("ripple.com")}
        g = grade_control_facts(data)
        self.assertEqual(g["status"], "MEASURED")
        self.assertTrue(g["facts"]["allowlisting_enforced"])
        self.assertTrue(g["facts"]["issuer_can_freeze"])  # NoFreeze absent
        self.assertTrue(g["facts"]["identity_domain_declared"])
        self.assertEqual(g["domain"], "ripple.com")
        self.assertEqual(g["risk_verdict"], "UNMEASURED")

    def test_nofreeze_means_issuer_cannot_freeze(self):
        data = {"Flags": LSF["NoFreeze"], "Domain": None}
        g = grade_control_facts(data)
        self.assertEqual(g["status"], "MEASURED")
        self.assertFalse(g["facts"]["issuer_can_freeze"])
        self.assertFalse(g["facts"]["identity_domain_declared"])

    def test_unreachable_quotes_no_flags(self):
        g = grade_control_facts(None, unreachable=True)
        self.assertEqual(g["status"], "UNREACHABLE")
        self.assertIsNone(g["facts"])
        self.assertIsNone(g["raw_flags"])
        self.assertEqual(g["risk_verdict"], "UNMEASURED")

    def test_decode_flags_roundtrip(self):
        flags = LSF["RequireAuth"] | LSF["NoFreeze"] | LSF["GlobalFreeze"]
        d = decode_flags(flags)
        self.assertTrue(d["RequireAuth"])
        self.assertTrue(d["NoFreeze"])
        self.assertTrue(d["GlobalFreeze"])
        self.assertFalse(d["RequireDest"])


class PageLanguage(unittest.TestCase):
    def test_reserve_pass_on_attestation_language(self):
        self.assertEqual(grade_reserve("See the independent Reserve Report from EY.", "OK"), "PASS")

    def test_reserve_fail_on_self_declare(self):
        self.assertEqual(grade_reserve("We fully back every token 1:1 with cash.", "OK"), "FAIL")

    def test_unreachable_page_is_uncheckable_never_fail(self):
        self.assertEqual(grade_reserve(None, "UNREACHABLE"), "UNCHECKABLE")
        self.assertEqual(grade_regime("", "UNREACHABLE"), "UNCHECKABLE")
        c = grade_custody(None, "UNREACHABLE")
        self.assertEqual(c["custodian_named_confirmable"], "UNCHECKABLE")
        self.assertEqual(c["auditor_named_confirmable"], "UNCHECKABLE")

    def test_regime_pass_nydfs(self):
        self.assertEqual(grade_regime("Issued under NYDFS limited purpose trust charter.", "OK"), "PASS")

    def test_custody_split(self):
        both = grade_custody("Custodian: Standard Custody. Auditor: Deloitte.", "OK")
        self.assertEqual(both["custodian_named_confirmable"], "PASS")
        self.assertEqual(both["auditor_named_confirmable"], "PASS")
        none = grade_custody("Welcome to our marketing site.", "OK")
        self.assertEqual(none["custodian_named_confirmable"], "FAIL")
        self.assertEqual(none["auditor_named_confirmable"], "FAIL")


class Distribution(unittest.TestCase):
    def test_distributed_row_pass(self):
        g = grade_distribution({"kind": "distributed", "supply": 12.5, "holders": 3})
        self.assertEqual(g["classified_distributed_on_reader"], "PASS")
        self.assertEqual(g["chain_supply"], 12.5)
        self.assertIsNone(g["holders"])
        self.assertEqual(g["holders_state"], "UNMEASURED")
        self.assertEqual(g["represented_gt_distributed"], "UNCHECKABLE")

    def test_holder_count_requires_complete_paginated_evidence(self):
        g = grade_distribution({
            "kind": "distributed",
            "supply": 12.5,
            "holders": 3,
            "holders_method": "account_lines_paginated_complete",
        })
        self.assertEqual(g["holders"], 3)
        self.assertEqual(g["holders_state"], "MEASURED")

    def test_reader_unreachable_uncheckable_no_numbers(self):
        g = grade_distribution({"kind": "distributed", "supply": 99, "holders": 99}, reader_unreachable=True)
        self.assertEqual(g["classified_distributed_on_reader"], "UNCHECKABLE")
        self.assertIsNone(g["chain_supply"])
        self.assertIsNone(g["holders"])
        self.assertIn("UNREACHABLE", g["represented_note"])


class SeriesAndHumanoid(unittest.TestCase):
    def test_series_unreachable(self):
        g = grade_series_values(None, unreachable=True)
        self.assertEqual(g["status"], "UNREACHABLE")
        self.assertEqual(g["n"], 0)
        self.assertEqual(g["risk_verdict"], "UNMEASURED")

    def test_series_measured_n_is_count(self):
        g = grade_series_values([13.48, 41.17])
        self.assertEqual(g["status"], "MEASURED")
        self.assertEqual(g["n"], 2)

    # Shaped like the LIVE isoc_eb_ai response: a flat row-major value map over
    # size_emp x time. The fixture this replaces was {"value": {"0": 8.06, "1": 13.48}}
    # -- a shape Eurostat never returns, with no dimensions to walk. It passed while
    # the extractor was taking an arbitrary cell and stamping 2024 on it.
    EUROSTAT_AI_FIXTURE = {
        "id": ["size_emp", "time"],
        "size_emp": None,
        "size": [2, 2],
        "dimension": {
            "size_emp": {"category": {"index": {"GE10": 0, "GE250": 1}}},
            "time": {"category": {"index": {"2024": 0, "2025": 1}}},
        },
        "value": {"0": 13.48, "1": 19.95, "2": 41.17, "3": 55.03},
    }

    def test_eurostat_isolates_each_size_class(self):
        for selector, value in (({"size_emp": "GE10"}, 19.95), ({"size_emp": "GE250"}, 55.03)):
            val, year = eurostat_latest(self.EUROSTAT_AI_FIXTURE, selector)
            self.assertEqual((val, year), (value, "2025"))

    def test_eurostat_never_reports_another_size_class_cell(self):
        """The defect: 55.03 is the 250+/2025 cell and was published as the 2024 headline."""
        val, year = eurostat_latest(self.EUROSTAT_AI_FIXTURE, {"size_emp": "GE10"})
        self.assertNotEqual(val, 55.03)
        self.assertEqual(year, "2025")

    def test_eurostat_year_is_read_not_assumed(self):
        """A control that CAN fail: shift the response a year and the year must move."""
        shifted = {
            **self.EUROSTAT_AI_FIXTURE,
            "dimension": {
                "size_emp": {"category": {"index": {"GE10": 0, "GE250": 1}}},
                "time": {"category": {"index": {"2030": 0, "2031": 1}}},
            },
        }
        _val, year = eurostat_latest(shifted, {"size_emp": "GE10"})
        self.assertEqual(year, "2031")

    def test_eurostat_missing_series_is_uncheckable_not_substituted(self):
        val, year = eurostat_latest(self.EUROSTAT_AI_FIXTURE, {"size_emp": "GE1000"})
        self.assertIsNone(val)
        self.assertIsNone(year)

    def test_jsonstat_unrecognised_shape_yields_no_cells(self):
        """The old fixture's shape: values with nothing to label them by."""
        self.assertEqual(jsonstat_cells({"value": {"0": 8.06, "1": 13.48}}), [])

    def test_humanoid_unreachable_uncheckable(self):
        g = grade_humanoid(0, "", "UNREACHABLE")
        self.assertEqual(g["three_state"], "UNCHECKABLE")
        self.assertFalse(g["dated_deployment_count_published"])
        self.assertEqual(g["fleet_size_status"], "UNMEASURED")

    def test_humanoid_fail_without_dated_count(self):
        g = grade_humanoid(200, "<html>Welcome to our robot company</html>", "OK")
        self.assertEqual(g["three_state"], "FAIL")

    def test_humanoid_pass_dated_count(self):
        g = grade_humanoid(200, "<p>In 2025 we deployed 40 robots to BMW.</p>", "OK")
        self.assertEqual(g["three_state"], "PASS")
        self.assertTrue(g["dated_deployment_count_published"])
        # A PASS must carry the sentence it was read from, or a stranger cannot
        # check it on the page. That is the whole difference from the 2026-09-07 run.
        self.assertEqual(g["evidence"]["count_phrase"], "40 robots")
        self.assertIn("deployed", g["evidence"]["quote"])


class HumanoidFalsePassControl(unittest.TestCase):
    """grade_humanoid's side of the 2026-09-07 false PASS.

    The detector itself is controlled in scripts/test_humanoid_dated_count.py,
    against the real bytes of the page and the three markup leaks. What is checked
    here is the row grade_humanoid publishes: a PASS must carry the sentence it was
    read from, and an unreachable page must never be reported as an absence.
    """

    FIXTURE = os.path.join(
        os.path.dirname(os.path.abspath(__file__)),
        "fixtures", "humanoid", "sanctuary-ai-2026-09-17-excerpt.html")

    def test_real_sanctuary_bytes_are_graded_fail_with_a_reason(self):
        with open(self.FIXTURE, encoding="utf-8") as f:
            g = grade_humanoid(200, f.read(), "OK")
        self.assertEqual(g["three_state"], "FAIL")
        self.assertFalse(g["dated_deployment_count_published"])
        self.assertIsNone(g["evidence"])
        self.assertIn("visible text", g["reason"])

    def test_a_pass_row_carries_the_sentence_it_was_read_from(self):
        g = grade_humanoid(200, "<p>In March 2026 Agility delivered 40 robots to GXO.</p>", "OK")
        self.assertEqual(g["three_state"], "PASS")
        self.assertEqual(g["evidence"]["count_phrase"], "40 robots")
        self.assertIn("delivered", g["evidence"]["quote"])
        self.assertIsNone(g["reason"])

    def test_unreachable_says_it_never_looked(self):
        g = grade_humanoid(0, "", "UNREACHABLE")
        self.assertEqual(g["three_state"], "UNCHECKABLE")
        self.assertIn("never observed", g["reason"])


class RiskStaysUnmeasured(unittest.TestCase):
    def test_every_grader_refuses_a_risk_verdict(self):
        g = grade_control_facts({"Flags": 0})
        self.assertEqual(g["risk_verdict"], "UNMEASURED")
        self.assertEqual(grade_series_values([1.0])["risk_verdict"], "UNMEASURED")


if __name__ == "__main__":
    unittest.main()
