#!/usr/bin/env python3
"""Stdlib tests for the SHIPPED catalog-trust financial wing (v0.1 latest.json)."""
from __future__ import annotations

import importlib.util
import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest import mock

_HERE = os.path.dirname(os.path.abspath(__file__))
_SPEC = importlib.util.spec_from_file_location(
    "catalog_trust_round", os.path.join(_HERE, "catalog-trust-round.py")
)
ctr = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
_SPEC.loader.exec_module(ctr)

V01 = {
    "kind": "csoai.x402-catalog-trust-snapshot/0.1",
    "as_of": "2026-09-07T07:10:00Z",
    "counts": {
        "challenge_402": 74,
        "serves_200": 2,
        "alive_but_needs_input": 7,
        "template_no_reply": 6,
        "dead_404_or_unreachable": 11,
        "total": 100,
    },
    "doctrine": "Counts only.",
}


class FinancialWingV01(unittest.TestCase):
    def test_counts_reject_hosts(self):
        self.assertTrue(ctr.counts_have_no_hosts({"financial_probed": 16, "financial_ok": 14}))
        self.assertFalse(ctr.counts_have_no_hosts({"note": "https://evil.example/x"}))

    def test_append_writes_latest_and_dated_v01_without_rounds(self):
        with tempfile.TemporaryDirectory() as td:
            Path(td, "latest.json").write_text(json.dumps(V01, indent=2) + "\n")
            Path(td, "2026-09-07.json").write_text(json.dumps(V01, indent=2) + "\n")
            with mock.patch.object(ctr, "financial_probe_code", return_value=200):
                rc = ctr.append_financial(td, force=True)
            self.assertEqual(rc, 0)
            latest = json.loads(Path(td, "latest.json").read_text())
            dated = json.loads(Path(td, "2026-09-07.json").read_text())
            self.assertEqual(latest, dated)
            self.assertEqual(latest["kind"], "csoai.x402-catalog-trust-snapshot/0.1")
            self.assertNotIn("rounds", latest)
            self.assertEqual(latest["counts"]["total"], 100)
            self.assertEqual(latest["counts"]["challenge_402"], 74)
            self.assertEqual(latest["counts"]["financial_axes"], 8)
            self.assertEqual(latest["counts"]["financial_probed"], 16)
            self.assertTrue(ctr.counts_have_no_hosts(
                {k: v for k, v in latest["counts"].items() if str(k).startswith("financial")}
            ))
            cat_sum = (
                latest["counts"]["challenge_402"]
                + latest["counts"]["serves_200"]
                + latest["counts"]["alive_but_needs_input"]
                + latest["counts"]["template_no_reply"]
                + latest["counts"]["dead_404_or_unreachable"]
            )
            self.assertEqual(latest["counts"]["total"], cat_sum)

    def test_refuse_v2_rounds(self):
        with tempfile.TemporaryDirectory() as td:
            Path(td, "latest.json").write_text(json.dumps({
                "kind": "csoai.x402-catalog-trust-snapshot/0.2",
                "rounds": [],
            }))
            rc = ctr.append_financial(td, force=True)
            self.assertEqual(rc, 2)

    def test_append_stamps_paid_step(self):
        with tempfile.TemporaryDirectory() as td:
            Path(td, "latest.json").write_text(json.dumps(V01, indent=2) + "\n")
            Path(td, "2026-09-07.json").write_text(json.dumps(V01, indent=2) + "\n")
            with mock.patch.object(ctr, "financial_probe_code", return_value=200):
                rc = ctr.append_financial(td, force=True)
            self.assertEqual(rc, 0)
            latest = json.loads(Path(td, "latest.json").read_text())
            self.assertEqual(latest["paid_step"], ctr.PAID_STEP)
            self.assertEqual(latest["paid_step"]["mcp"], "commission_card")


class GrowthStamp(unittest.TestCase):
    def test_two_rounds_on_one_day_are_both_preserved(self):
        catalog = [{"resource": "https://example.com/a"}]

        class Fake:
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

            def read(self, n=-1):
                return json.dumps(catalog).encode()

        observed = [
            ctr.datetime(2026, 9, 12, 4, 42, 56, tzinfo=ctr.timezone.utc),
            ctr.datetime(2026, 9, 12, 15, 37, 1, tzinfo=ctr.timezone.utc),
        ]
        with tempfile.TemporaryDirectory() as td:
            with mock.patch.object(ctr.urllib.request, "urlopen", return_value=Fake()):
                with mock.patch.object(ctr, "fetch", return_value=(402, "application/json", '{"accepts":[]}')):
                    with mock.patch.object(ctr, "utc_now", side_effect=observed):
                        self.assertEqual(ctr.run(td, "https://example.com/catalog"), 0)
                        self.assertEqual(ctr.run(td, "https://example.com/catalog"), 0)
            first = json.loads(Path(td, "20260912T044256Z.json").read_text())
            second = json.loads(Path(td, "20260912T153701Z.json").read_text())
            latest = json.loads(Path(td, "latest.json").read_text())
            self.assertEqual(first["as_of"], "2026-09-12T04:42:56Z")
            self.assertEqual(second["as_of"], "2026-09-12T15:37:01Z")
            self.assertEqual(latest, second)

    def test_settlement_copied_not_typed(self):
        eligible, refused = 7, 2
        pct = round(100.0 * refused / eligible, 1)
        with tempfile.TemporaryDirectory() as td:
            Path(td, "settlement-census-counts.json").write_text(json.dumps({
                "source": "fixture",
                "as_of": "2026-09-06T00:00:00Z",
                "counts": {
                    "eligible_probed": eligible,
                    "take_and_refuse": refused,
                    "take_and_refuse_pct": pct,
                },
            }))
            got = ctr.load_settlement_census(Path(td, "settlement-census-counts.json"))
        self.assertEqual(got["eligible_probed"], eligible)
        self.assertEqual(got["take_and_refuse"], refused)
        self.assertEqual(got["take_and_refuse_pct"], pct)

    def test_run_mocked_catalog_writes_paid_step(self):
        catalog = [{"resource": "https://example.com/a"}, {"resource": "https://example.com/b"}]

        class Fake:
            def __enter__(self):
                return self

            def __exit__(self, *a):
                return False

            def read(self, n=-1):
                return json.dumps(catalog).encode()

        with tempfile.TemporaryDirectory() as td:
            Path(td, "settlement-census-counts.json").write_text(json.dumps({
                "source": "fixture",
                "as_of": "2026-09-06T00:00:00Z",
                "counts": {"eligible_probed": 7, "take_and_refuse": 2, "take_and_refuse_pct": round(100.0 * 2 / 7, 1)},
            }))
            Path(td, "latest.json").write_text(json.dumps({
                **V01,
                "counts": {**V01["counts"], "financial_probed": 16, "financial_ok": 15},
                "financial_as_of": "2026-09-07T11:00:00Z",
            }))
            with mock.patch.object(ctr.urllib.request, "urlopen", return_value=Fake()):
                with mock.patch.object(ctr, "fetch", return_value=(402, "application/json", '{"accepts":[]}')):
                    rc = ctr.run(td, "https://facilitator.payai.network/discovery/resources")
            self.assertEqual(rc, 0)
            latest = json.loads(Path(td, "latest.json").read_text())
            self.assertEqual(latest["paid_step"]["mcp"], "commission_card")
            self.assertEqual(latest["paid_step"]["feed"], "https://councilof.ai/api/eunomia-data?feed=1")
            self.assertEqual(latest["settlement_census"]["take_and_refuse"], 2)
            self.assertEqual(latest["counts"]["financial_probed"], 16)
            self.assertEqual(latest["financial_as_of"], "2026-09-07T11:00:00Z")
            self.assertEqual(latest["counts"]["challenge_402"], 2)
            self.assertEqual(latest["counts"]["total"], 2)


if __name__ == "__main__":
    unittest.main()
