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
    eurostat_extract_2024,
    grade_control_facts,
    grade_custody,
    grade_distribution,
    grade_humanoid,
    grade_regime,
    grade_reserve,
    grade_series_values,
    worldbank_latest,
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
        self.assertEqual(g["holders"], 3)
        self.assertEqual(g["represented_gt_distributed"], "UNCHECKABLE")

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

    def test_eurostat_extract_from_jsonstat_value_map(self):
        payload = {"value": {"0": 8.06, "1": 13.48}}
        self.assertEqual(eurostat_extract_2024(payload), 13.48)

    def test_worldbank_latest_skips_nulls(self):
        payload = [{"page": 1}, [{"date": "2025", "value": None}, {"date": "2024", "value": 57.58}]]
        val, year = worldbank_latest(payload)
        self.assertEqual(val, 57.58)
        self.assertEqual(year, "2024")

    def test_humanoid_unreachable_uncheckable(self):
        g = grade_humanoid(0, "", "UNREACHABLE")
        self.assertEqual(g["three_state"], "UNCHECKABLE")
        self.assertFalse(g["dated_deployment_count_published"])
        self.assertEqual(g["fleet_size_status"], "UNMEASURED")

    def test_humanoid_fail_without_dated_count(self):
        g = grade_humanoid(200, "<html>Welcome to our robot company</html>", "OK")
        self.assertEqual(g["three_state"], "FAIL")

    def test_humanoid_pass_dated_count(self):
        g = grade_humanoid(200, "In 2025 we deployed 40 robots to BMW.", "OK")
        self.assertEqual(g["three_state"], "PASS")
        self.assertTrue(g["dated_deployment_count_published"])


class RiskStaysUnmeasured(unittest.TestCase):
    def test_every_grader_refuses_a_risk_verdict(self):
        g = grade_control_facts({"Flags": 0})
        self.assertEqual(g["risk_verdict"], "UNMEASURED")
        self.assertEqual(grade_series_values([1.0])["risk_verdict"], "UNMEASURED")


if __name__ == "__main__":
    unittest.main()
