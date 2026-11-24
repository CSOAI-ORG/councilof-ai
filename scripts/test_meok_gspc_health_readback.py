#!/usr/bin/env python3
"""Source-only, fail-closed tests for M4 MEOK + GSPC freshness readback."""
from __future__ import annotations

import copy
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch

import meok_gspc_health_readback as r

NOW = "2026-11-24T00:55:00Z"


def sources():
    def source(body):
        return {"status": 200, "body": body, "sha256": "a" * 64}
    return {
        "spine": source({
            "status": "ok", "version": "0.3.0-test-only",
            "timestamp": "2026-11-24T00:54:30Z",
            "awareness": {"generated_at": "2026-11-24T00:50:00Z",
                          "gspc_spine": {"observed_at": "2026-11-24T00:45:00Z"}},
            "mcp": {"total_tools": 4},
            "meok_api": {"up": True}, "him_studio": {"up": True},
        }),
        "meok_api": source({"status": "ok"}),
        "him_studio": source({"status": "ok"}),
        "gspc_public": source({"schema": "csoai.gspc-axes/0.5",
                              "axes": [{} for _ in range(34)]}),
    }


class MeokGspcReadbackTests(unittest.TestCase):
    def test_known_good_response_not_claiming_actual_safety(self):
        x = r.evaluate(sources(), NOW)
        self.assertEqual(x["state"], "SOURCES_RESPONDING_AWARENESS_WITHIN_POLICY")
        self.assertEqual(x["source_declared_public_axes"], 34)
        for k in ("actual_executor_authority_verified", "actual_human_authority_verified",
                  "independent_recipient_effect_verified", "instrument_calibration_verified",
                  "safety_certification_claimed"):
            self.assertFalse(x[k])

    def test_old_gspc_awareness_detected_separately_from_live_health(self):
        x = sources()
        x["spine"]["body"]["awareness"]["generated_at"] = "2026-11-13T02:20:05.658118Z"
        x["spine"]["body"]["awareness"]["gspc_spine"]["observed_at"] = "2026-11-13T02:20:05.658118Z"
        q = r.evaluate(x, NOW)
        self.assertEqual(q["state"], "GSPC_AWARENESS_STALE")
        self.assertTrue(all(z["http_observed"] for z in q["sources"].values()))
        self.assertEqual(q["response"], "OPERATOR_REVIEW_NO_AUTOMATED_ACTION")

    def test_source_reports_up_but_direct_meok_api_unreachable(self):
        x = sources()
        x["meok_api"] = {"status": None, "body": None}
        self.assertEqual(r.evaluate(x, NOW)["state"], "COMPONENT_UNCHECKABLE")

    def test_source_reports_up_but_him_unreachable(self):
        x = sources()
        x["him_studio"] = {"status": None, "body": None}
        self.assertEqual(r.evaluate(x, NOW)["state"], "COMPONENT_UNCHECKABLE")

    def test_spine_unreachable(self):
        x = sources()
        x["spine"] = None
        self.assertEqual(r.evaluate(x, NOW)["state"], "SPINE_UNCHECKABLE")

    def test_spine_reports_non_ok(self):
        x = sources()
        x["spine"]["body"]["status"] = "degraded"
        self.assertEqual(r.evaluate(x, NOW)["state"], "SPINE_UNCHECKABLE")

    def test_wrong_board_schema(self):
        x = sources()
        x["gspc_public"]["body"]["schema"] = "fake"
        self.assertEqual(r.evaluate(x, NOW)["state"], "PUBLIC_GSPC_UNCHECKABLE")

    def test_missing_public_board(self):
        x = sources()
        x["gspc_public"]["body"] = None
        self.assertEqual(r.evaluate(x, NOW)["state"], "PUBLIC_GSPC_UNCHECKABLE")

    def test_future_awareness_rejected(self):
        x = sources()
        x["spine"]["body"]["awareness"]["generated_at"] = "2026-11-24T00:56:00Z"
        self.assertEqual(r.evaluate(x, NOW)["state"], "SOURCE_CLOCK_UNCHECKABLE")

    def test_missing_source_time_rejected(self):
        x = sources()
        del x["spine"]["body"]["awareness"]["gspc_spine"]["observed_at"]
        self.assertEqual(r.evaluate(x, NOW)["state"], "SOURCE_CLOCK_UNCHECKABLE")

    def test_stale_current_health_rejected(self):
        x = sources()
        x["spine"]["body"]["timestamp"] = "2026-11-24T00:20:00Z"
        self.assertEqual(r.evaluate(x, NOW)["state"], "SPINE_HEALTH_REPORT_STALE")

    def test_strict_loopback_only(self):
        self.assertTrue(r.bounded_loopback("http://127.0.0.1:1234/api/health", "meok_api"))
        self.assertFalse(r.bounded_loopback("http://example.com/api/health", "meok_api"))
        self.assertFalse(r.bounded_loopback("http://127.0.0.1:1234/admin", "meok_api"))
        self.assertFalse(r.bounded_loopback("http://127.0.0.1:1234/api/health?token=foo", "meok_api"))
        self.assertFalse(r.bounded_loopback("http://user:password@localhost:1234/api/health", "meok_api"))
        self.assertFalse(r.bounded_loopback("https://127.0.0.1:1234/api/health", "meok_api"))

    def test_observe_rejects_nonallowlisted_external_destination_without_fetch(self):
        with patch.object(r, "urlopen", side_effect=AssertionError("network should never be called")):
            result = r.observe_url("https://example.com/secret")
        self.assertEqual(result["reason"], "URL_NOT_ALLOWLISTED")

    def test_self_reported_raw_body_private_data_not_echoed(self):
        x = sources()
        x["spine"]["body"]["private_token"] = "NEVER_ECHO_THIS"
        result = json.dumps(r.evaluate(x, NOW))
        self.assertNotIn("NEVER_ECHO_THIS", result)

    def test_no_silent_mutation(self):
        x = sources()
        clone = copy.deepcopy(x)
        r.evaluate(x, NOW)
        self.assertEqual(x, clone)

    def test_negative_or_fabricated_freshness_setting_fails(self):
        for v in (False, 0, -1, float("nan"), 24 * 31):
            with self.subTest(v=v), self.assertRaises(ValueError):
                r.evaluate(sources(), NOW, max_age_hours=v)

    def test_wrong_utc_format_fails(self):
        with self.assertRaises(ValueError):
            r.evaluate(sources(), "2026-11-24T00:55:00+00:00")

    def test_offline_fixture_stale_exits_four_and_preserves_nonclaims(self):
        with tempfile.TemporaryDirectory() as root:
            input_file = Path(root) / "fixture.json"
            output = Path(root) / "result.json"
            x = sources()
            x["spine"]["body"]["awareness"]["generated_at"] = "2026-11-13T02:20:05.658118Z"
            input_file.write_text(json.dumps(x))
            self.assertEqual(r.main(["--fixture", str(input_file), "--as-of", NOW,
                                     "--output", str(output)]), 4)
            result = json.loads(output.read_text())
            self.assertEqual(result["state"], "GSPC_AWARENESS_STALE")
            self.assertFalse(result["independent_recipient_effect_verified"])


if __name__ == "__main__":
    unittest.main(verbosity=2)
