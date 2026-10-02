from __future__ import annotations

import hashlib
import base64
import importlib.util
import io
import json
import tempfile
import unittest
from unittest.mock import patch
from pathlib import Path

SCRIPT = Path(__file__).with_name("revenue_loop.py")
SPEC = importlib.util.spec_from_file_location("growth_revenue_loop", SCRIPT)
assert SPEC and SPEC.loader
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class ProductFunnelTests(unittest.TestCase):
    def test_measured_recent_cohort_creates_bounded_product_actions(self):
        funnel = MODULE.normalize_product_funnel({
            "status": "MEASURED",
            "paid_settlements_by_product": {"csoai.product.bundle": 3},
            "distinct_nonself_payers_by_product": {"csoai.product.bundle": 1},
            "self_settlements_by_product": {},
            "paid_settlements_by_product_last_30d": {"csoai.product.bundle": 3},
            "distinct_nonself_payers_by_product_last_30d": {"csoai.product.bundle": 1},
            "repeat_nonself_payers_by_product_last_30d": {"csoai.product.bundle": 1},
            "self_settlements_by_product_last_30d": {},
            "unclassified_external_paid_settlements": 0,
            "window_days": 30,
        })
        self.assertEqual(funnel["state"], "MEASURED")
        self.assertEqual(funnel["window_days"], 30)
        decision = MODULE.derive_product_growth_actions(funnel)[0]
        self.assertEqual(decision["state"], "REPEAT_SIGNAL_REQUIRES_DELIVERY_VALIDATION")
        self.assertIn("acceptance", decision["action"])
        for private_value in ("0x", "transaction", "wallet"):
            self.assertNotIn(private_value, json.dumps(decision).lower())

    def test_old_or_incomplete_public_response_holds_without_inventing_zero(self):
        old = MODULE.normalize_product_funnel({
            "status": "MEASURED", "paid_settlements_by_product": {},
            "distinct_nonself_payers_by_product": {}, "self_settlements_by_product": {},
            "unclassified_external_paid_settlements": 0,
        })
        self.assertEqual(old["recent_window_state"], "NOT_PUBLISHED")
        self.assertEqual(MODULE.derive_product_growth_actions(old)[0]["state"], "HOLD")
        incomplete = MODULE.normalize_product_funnel({"status": "INCOMPLETE"})
        self.assertEqual(incomplete["state"], "INCOMPLETE")
        self.assertEqual(MODULE.derive_product_growth_actions(incomplete)[0]["state"], "HOLD")

    def test_partial_recent_maps_and_invalid_counts_are_rejected(self):
        partial = MODULE.normalize_product_funnel({
            "status": "MEASURED", "paid_settlements_by_product": {},
            "distinct_nonself_payers_by_product": {}, "self_settlements_by_product": {},
            "paid_settlements_by_product_last_30d": {}, "window_days": 30,
            "unclassified_external_paid_settlements": 0,
        })
        self.assertEqual(partial["state"], "INVALID_SUMMARY")
        invalid = MODULE.normalize_product_funnel({
            "status": "MEASURED", "paid_settlements_by_product": {"bad id": 1},
            "distinct_nonself_payers_by_product": {}, "self_settlements_by_product": {},
            "unclassified_external_paid_settlements": 0,
        })
        self.assertEqual(invalid["state"], "INVALID_SUMMARY")

    def test_empty_measured_window_validates_one_existing_path_before_expansion(self):
        funnel = MODULE.normalize_product_funnel({
            "status": "MEASURED", "paid_settlements_by_product": {},
            "distinct_nonself_payers_by_product": {}, "self_settlements_by_product": {},
            "paid_settlements_by_product_last_30d": {},
            "distinct_nonself_payers_by_product_last_30d": {},
            "repeat_nonself_payers_by_product_last_30d": {},
            "self_settlements_by_product_last_30d": {},
            "unclassified_external_paid_settlements": 0, "window_days": 30,
        })
        decision = MODULE.derive_product_growth_actions(funnel)[0]
        self.assertEqual(decision["state"], "MEASURED_NO_RECENT_EXTERNAL_PAID_SIGNAL")
        self.assertIn("before adding more listings", decision["action"])


class LatestReceiptTests(unittest.TestCase):
    def test_aggregate_feed_preserves_states_and_does_not_call_receipts_buyers(self):
        published = MODULE.normalize_latest_receipts({
            "status": "PUBLISHED", "count": 21, "demand_eligible_count": 1,
            "internal_count": 17, "zero_value_count": 3,
        })
        self.assertEqual(published["state"], "PUBLISHED")
        self.assertEqual(published["demand_eligible_count"], 1)
        self.assertEqual(published["window_limit"], 50)
        self.assertNotIn("distinct_buyers", published)

    def test_unrecorded_and_invalid_receipt_summaries_never_become_zero(self):
        unrecorded = MODULE.normalize_latest_receipts({"status": "UNRECORDED"})
        self.assertEqual(unrecorded["state"], "UNRECORDED")
        self.assertIsNone(unrecorded["count"])
        invalid = MODULE.normalize_latest_receipts({
            "status": "PUBLISHED", "count": 0, "demand_eligible_count": True,
            "internal_count": 0, "zero_value_count": 0,
        })
        self.assertEqual(invalid["state"], "INVALID_SUMMARY")
        self.assertIsNone(invalid["count"])


class OfficialMcpRegistryTests(unittest.TestCase):
    def test_exact_namespace_versions_are_distinct_from_neighbor_entries(self):
        payload = {"servers": [
            {"server": {"name": "ai.councilof/gspc", "version": "1.4.3"},
             "_meta": {"io.modelcontextprotocol.registry/official": {"status": "active"}}},
            {"server": {"name": "ai.councilof/gspc", "version": "1.4.4"},
             "_meta": {"io.modelcontextprotocol.registry/official": {"status": "active"}}},
            {"server": {"name": "ai.councilof/gspc", "version": "1.4.5"},
             "_meta": {"io.modelcontextprotocol.registry/official": {"status": "deprecated"}}},
            {"server": {"name": "ai.councilof/gspc-free", "version": "9.0.0"},
             "_meta": {"io.modelcontextprotocol.registry/official": {"status": "active"}}},
        ]}
        result = MODULE.normalize_mcp_registry_search("ai.councilof/gspc", payload)
        self.assertEqual(result["state"], "MEASURED")
        self.assertEqual(result["latest_active_version"], "1.4.4")
        self.assertEqual(len(result["versions"]), 3)

    def test_successful_empty_search_is_not_unavailable(self):
        result = MODULE.normalize_mcp_registry_search("io.github.CSOAI-ORG/gspc", {"servers": []})
        self.assertEqual(result["state"], "MEASURED_NOT_LISTED")
        self.assertIsNone(result["latest_active_version"])


class SettledUsdcTests(unittest.TestCase):
    def test_measured_amount_is_exact_decimal_and_excludes_self(self):
        result = MODULE.normalize_settled_usdc({
            "status": "MEASURED", "count": 20000,
            "unit": "USDC atomic (6dp) on Base", "excludes_self": True,
        })
        self.assertEqual(result["amount_atomic"], 20000)
        self.assertEqual(result["amount_usdc"], "0.02")
        self.assertEqual(result["state"], "MEASURED")

    def test_invalid_or_non_external_amount_stays_unknown(self):
        for payload in (
            {"status": "MEASURED", "count": True, "unit": "USDC atomic (6dp) on Base", "excludes_self": True},
            {"status": "MEASURED", "count": 10, "unit": "USDC atomic (6dp) on Base", "excludes_self": False},
        ):
            result = MODULE.normalize_settled_usdc(payload)
            self.assertEqual(result["state"], "INVALID_SUMMARY")
            self.assertIsNone(result["amount_usdc"])


class GrowthComparisonTests(unittest.TestCase):
    def test_only_compares_verified_prior_run_when_public_source_bytes_match(self):
        current_one = {"status": "MEASURED", "all_time": 1}
        current_amount = MODULE.normalize_settled_usdc({
            "status": "MEASURED", "count": 20000,
            "unit": "USDC atomic (6dp) on Base", "excludes_self": True,
        })
        current_source = {"url": "https://councilof.ai/api/revenue", "sha256": "a" * 64}
        baseline = {"state": "MEASURED", "as_of": "2026-10-01T12:22:52Z", "payer_count": 1,
                    "settled_usdc_atomic": 20000, "source_url": current_source["url"],
                    "source_sha256": current_source["sha256"], "loop_sha256": "b" * 64,
                    "receipt_sha256": "c" * 64}
        result = MODULE.compare_growth_metrics(current_one, current_amount, current_source, baseline)
        self.assertEqual(result["state"], "COMPARABLE_IDENTICAL_SOURCE")
        self.assertEqual(result["payer_count_state"], "UNCHANGED")
        self.assertEqual(result["settled_usdc_state"], "UNCHANGED")
        changed = MODULE.compare_growth_metrics(current_one, current_amount,
            {**current_source, "sha256": "d" * 64}, baseline)
        self.assertEqual(changed["state"], "SOURCE_DEFINITION_CHANGED_OR_MISSING")
        self.assertIsNone(changed["payer_count_delta"])

    def test_growth_is_detected_when_source_bytes_change_but_definition_and_unit_match(self):
        source = {"url": "https://councilof.ai/api/revenue", "sha256": "d" * 64}
        definition = "distinct non-self wallets with a nonzero facilitator-confirmed settlement"
        current_one = {"status": "MEASURED", "all_time": 2, "definition": definition}
        current_amount = {"state": "MEASURED", "amount_atomic": 35000,
                          "unit": "USDC atomic (6dp) on Base"}
        baseline = {"state": "MEASURED", "payer_count": 1, "settled_usdc_atomic": 20000,
                    "source_url": source["url"], "source_sha256": "a" * 64,
                    "definition": definition, "settled_usdc_unit": "USDC atomic (6dp) on Base"}
        result = MODULE.compare_growth_metrics(current_one, current_amount, source, baseline)
        self.assertEqual(result["state"], "COMPARABLE_SAME_DEFINITION")
        self.assertEqual(result["payer_count_delta"], 1)
        self.assertEqual(result["settled_usdc_atomic_delta"], 15000)

    def test_missing_baseline_does_not_claim_flat_growth(self):
        result = MODULE.compare_growth_metrics({"status": "MEASURED", "all_time": 1},
            {"state": "MEASURED", "amount_atomic": 20000}, {}, MODULE.load_growth_baseline(None))
        self.assertEqual(result["state"], "BASELINE_MISSING")
        self.assertIsNone(result["payer_count_delta"])


class EvidenceReceiptTests(unittest.TestCase):
    def test_read_only_receipt_check_matches_exact_bytes_and_detects_drift(self):
        with tempfile.TemporaryDirectory() as tmp:
            root = Path(tmp)
            payloads = {"loop.json": b'{"v":1}', "loop.md": b"# evidence\n"}
            for name, data in payloads.items(): (root / name).write_bytes(data)
            receipt = {"schema": "csoai.growth-loop-receipt/1.0", "date": "2026-10-01",
                       "files": {name: hashlib.sha256(data).hexdigest() for name, data in payloads.items()}}
            (root / "loop.receipt.json").write_text(json.dumps(receipt))
            before = {p.name: p.read_bytes() for p in root.iterdir()}
            self.assertEqual(MODULE.check_receipt(root, "2026-10-01"), (True, "exact output hashes match receipt"))
            self.assertEqual({p.name: p.read_bytes() for p in root.iterdir()}, before)
            (root / "loop.md").write_text("drift")
            ok, message = MODULE.check_receipt(root, "2026-10-01")
            self.assertFalse(ok)
            self.assertIn("loop.md", message)


class X402CatalogueTests(unittest.TestCase):
    def test_payai_measured_scan_preserves_exact_presence_and_versions(self):
        result = MODULE.normalize_x402_catalog({
            "kind": "MEASURED", "as_of": "2026-10-01T13:00:00Z",
            "declared_total": 11025, "scanned": 11025, "pages": 23,
            "absence_determinate": True,
            "rows": [
                {"route_key": "https://councilof.ai/api/a", "x402_version": 2, "last_updated": "2026-09-01T00:00:00Z"},
                {"route_key": "https://councilof.ai/api/a", "x402_version": 2, "last_updated": "2026-09-02T00:00:00Z"},
                {"route_key": "https://csoai.org/api/b", "x402_version": 1},
            ],
        }, "PayAI")
        self.assertEqual(result["state"], "MEASURED")
        self.assertEqual(result["listed_resources"], 3)
        self.assertEqual(result["distinct_routes"], 2)
        self.assertEqual(result["x402_version_counts"], {"1": 1, "2": 2})
        self.assertEqual(result["absence_determinate"], True)
        self.assertIn("revenue", result["does_not_prove"])

    def test_incomplete_scan_with_rows_is_not_misreported_as_complete_or_zero(self):
        result = MODULE.normalize_x402_catalog({
            "kind": "UNCHECKABLE", "declared_total": 100, "scanned": 50,
            "pages": 1, "absence_determinate": False,
            "rows": [{"route_key": "https://councilof.ai/api/a", "health_status": "healthy"}],
        }, "402 Index")
        self.assertEqual(result["state"], "UNCHECKABLE")
        self.assertEqual(result["listed_resources"], 1)
        self.assertFalse(result["absence_determinate"])
        self.assertEqual(result["domain_verified_counts"], {"unknown": 1})

    def test_402_index_counts_health_and_domain_verification_separately(self):
        result = MODULE.normalize_x402_catalog({
            "kind": "MEASURED", "declared_total": 2, "scanned": 2,
            "pages": 1, "absence_determinate": True,
            "rows": [
                {"route_key": "https://councilof.ai/api/a", "health_status": "healthy", "probe_status": "probeable", "domain_verified": False},
                {"route_key": "https://councilof.ai/api/b", "health_status": "unhealthy", "probe_status": "probeable", "domain_verified": True},
            ],
        }, "402 Index")
        self.assertEqual(result["health_status_counts"], {"healthy": 1, "unhealthy": 1})
        self.assertEqual(result["probe_status_counts"], {"probeable": 2})
        self.assertEqual(result["domain_verified_counts"], {"false": 1, "true": 1})

    def test_bad_catalogue_shape_fails_closed(self):
        result = MODULE.normalize_x402_catalog({
            "kind": "MEASURED", "declared_total": True, "scanned": 0,
            "pages": 0, "absence_determinate": True, "rows": [],
        }, "PayAI")
        self.assertEqual(result["state"], "INVALID_SUMMARY")
        self.assertIsNone(result["listed_resources"])

    def test_measured_catalogue_claim_with_partial_scan_fails_closed(self):
        result = MODULE.normalize_x402_catalog({
            "kind": "MEASURED", "declared_total": 10, "scanned": 9, "pages": 1,
            "absence_determinate": False, "rows": [],
        }, "PayAI")
        self.assertEqual(result["state"], "INCONSISTENT_SUMMARY")
        self.assertIsNone(result["listed_resources"])

    def test_public_reads_keep_exact_hashes_and_catalogues_separate_from_revenue(self):
        payai = {"kind": "MEASURED", "declared_total": 2, "scanned": 2, "pages": 1,
                 "absence_determinate": True, "rows": [
                     {"route_key": "https://csoai.org/a", "x402_version": 2},
                     {"route_key": "https://csoai.org/b", "x402_version": 2}]}
        index = {"kind": "MEASURED", "declared_total": 1, "scanned": 1, "pages": 1,
                 "absence_determinate": True, "rows": [
                     {"route_key": "https://csoai.org/b", "health_status": "healthy",
                      "probe_status": "probeable", "domain_verified": False}]}
        digests = [{"sha256": "a" * 64}, {"sha256": "b" * 64}]
        with patch.object(MODULE, "getjson_with_digest", side_effect=[(payai, digests[0]), (index, digests[1])]):
            source_reads = {}
            result = MODULE.read_x402_catalogues(source_reads)
        self.assertEqual(result["cross_catalogue"]["overlap_route_count"], 1)
        self.assertEqual(result["cross_catalogue"]["state"], "MEASURED")
        self.assertEqual(source_reads["x402_catalog:payai"]["sha256"], "a" * 64)
        self.assertEqual(source_reads["x402_catalog:index402"]["sha256"], "b" * 64)
        self.assertIn("settlement", result["payai"]["does_not_prove"])

    def test_crosswalk_incomplete_if_either_catalogue_is_unavailable(self):
        responses = [({"kind": "MEASURED", "declared_total": 0, "scanned": 0, "pages": 0,
                      "absence_determinate": True, "rows": []}, {"sha256": "a" * 64})]
        with patch.object(MODULE, "getjson_with_digest", side_effect=responses + [OSError("timeout")]):
            result = MODULE.read_x402_catalogues({})
        self.assertEqual(result["cross_catalogue"]["state"], "INCOMPLETE")
        self.assertEqual(result["index402"]["state"], "UNAVAILABLE")


class X402RouteProbeTests(unittest.TestCase):
    def test_valid_v2_bazaar_challenge_is_summarized_without_retaining_header(self):
        token = base64.b64encode(json.dumps({
            "x402Version": 2, "extensions": {"bazaar": {"info": {"input": {"type": "http"}}}},
        }).encode()).decode()
        class Response:
            status = 402
            headers = {"payment-required": token}
            def __enter__(self): return self
            def __exit__(self, *args): return False
            def read(self, size): return b"challenge"
        class Opener:
            def open(self, req, timeout):
                self.requested_url = req.full_url
                return Response()
        opener = Opener()
        with patch.object(MODULE.urllib.request, "build_opener", return_value=opener) as build_opener:
            result = MODULE.probe_x402_route("https://councilof.ai/api/example")
        self.assertIs(build_opener.call_args.args[0], MODULE._NoRedirectHandler)
        self.assertEqual(opener.requested_url, "https://councilof.ai/api/example")
        self.assertEqual(result["state"], "VALID_X402_V2_BAZAAR_CHALLENGE")
        self.assertEqual(result["x402_version"], 2)
        self.assertTrue(result["bazaar_extension_present"])
        self.assertNotIn(token, json.dumps(result))

    def test_bad_challenge_and_public_or_input_responses_remain_distinct(self):
        bad = MODULE._x402_route_result("https://councilof.ai/api/a", 402,
                                        {"payment-required": "not-base64"}, b"bad")
        public = MODULE._x402_route_result("https://councilof.ai/api/a", 200, {}, b"ok")
        input_needed = MODULE._x402_route_result("https://councilof.ai/api/a", 400, {}, b"id required")
        self.assertEqual(bad["state"], "INVALID_OR_UNCHECKABLE_CHALLENGE")
        self.assertEqual(public["state"], "PUBLIC_RESPONSE")
        self.assertEqual(input_needed["state"], "INPUT_REQUIRED_OR_REJECTED")

    def test_redirect_target_is_retained_only_for_allowlisted_https_host_without_query(self):
        safe = MODULE._x402_route_result("https://councilof.ai/api/a", 308,
            {"location": "/api/signed-data-feed"}, b"")
        external = MODULE._x402_route_result("https://councilof.ai/api/a", 302,
            {"location": "https://outside.example/path?token=private"}, b"")
        self.assertEqual(safe["state"], "REDIRECT_REVIEW_REQUIRED")
        self.assertEqual(safe["redirect_target"], "https://councilof.ai/api/signed-data-feed")
        self.assertEqual(external["redirect_target"], None)
        self.assertEqual(external["redirect_target_state"], "WITHHELD_OR_MISSING")

    def test_owned_canonical_redirects_are_not_growth_failures(self):
        feed = MODULE._x402_route_result(
            "https://councilof.ai/api/eunomia-data", 308,
            {"location": "https://councilof.ai/api/signed-data-feed",
             "link": '<https://councilof.ai/api/signed-data-feed>; rel="canonical"'}, b"")
        proof = MODULE._x402_route_result(
            "https://councilof.ai/api/proof", 307,
            {"location": "https://councilof.ai/api/proof?bundle=1"}, b"")
        self.assertEqual(feed["state"], "CANONICAL_REDIRECT")
        self.assertEqual(feed["redirect_target_state"], "SAME_OWNED_HOST_CANONICAL")
        self.assertEqual(feed["redirect_target"], "https://councilof.ai/api/signed-data-feed")
        self.assertEqual(proof["state"], "CANONICAL_REDIRECT")
        self.assertEqual(proof["redirect_target_state"], "SAME_OWNED_HOST_CANONICAL")
        self.assertEqual(proof["redirect_target"], "https://councilof.ai/api/proof?bundle=1")
        actions = MODULE.derive_x402_route_actions({
            "state": "MEASURED", "route_count": 2,
            "route_states": {"CANONICAL_REDIRECT": 2},
            "routes": [feed, proof],
        })
        self.assertEqual(actions, [])

    def test_external_or_unsupported_urls_are_not_probed(self):
        with patch.object(MODULE.urllib.request, "urlopen") as open_url:
            result = MODULE.probe_x402_route("https://other.example/api")
        self.assertEqual(result["state"], "NOT_PROBED_UNTRUSTED_OR_UNSUPPORTED_URL")
        open_url.assert_not_called()

    def test_nonstandard_ports_and_query_values_are_never_requested_or_retained(self):
        urls = ["https://councilof.ai:8443/api/proof",
                "https://councilof.ai/api/proof?token=secret"]
        with patch.object(MODULE.urllib.request, "urlopen") as open_url:
            results = [MODULE.probe_x402_route(url) for url in urls]
        self.assertTrue(all(r["state"] == "NOT_PROBED_UNTRUSTED_OR_UNSUPPORTED_URL" for r in results))
        self.assertNotIn("secret", json.dumps(results))
        open_url.assert_not_called()

    def test_nonstandard_or_sensitive_redirect_target_is_withheld(self):
        for target in ["https://councilof.ai:8443/path", "https://councilof.ai/path?token=secret"]:
            result = MODULE._x402_route_result("https://councilof.ai/start", 308,
                                               {"location": target}, b"")
            self.assertEqual(result["redirect_target"], None)
            self.assertEqual(result["redirect_target_state"], "WITHHELD_OR_MISSING")
            self.assertNotIn("secret", json.dumps(result))

    def test_probe_does_not_follow_redirect_to_external_host(self):
        class Opener:
            calls = 0
            def open(self, req, timeout):
                self.calls += 1
                raise MODULE.urllib.error.HTTPError(
                    req.full_url, 302, "Found",
                    {"Location": "https://outside.example/collect?token=secret"},
                    io.BytesIO(b""),
                )
        opener = Opener()
        with patch.object(MODULE.urllib.request, "build_opener", return_value=opener):
            result = MODULE.probe_x402_route("https://councilof.ai/api/listed")
        self.assertEqual(opener.calls, 1)
        self.assertEqual(result["state"], "REDIRECT_REVIEW_REQUIRED")
        self.assertIsNone(result["redirect_target"])
        self.assertNotIn("secret", json.dumps(result))

    def test_no_redirect_handler_rejects_redirect_request(self):
        handler = MODULE._NoRedirectHandler()
        self.assertIsNone(handler.redirect_request(None, None, 302, "Found", {}, "https://outside.example/"))

    def test_route_probe_union_requires_complete_catalogues_and_deduplicates(self):
        catalogues = {"cross_catalogue": {"state": "MEASURED"},
                      "payai": {"route_keys": ["https://councilof.ai/a", "https://councilof.ai/shared"]},
                      "index402": {"route_keys": ["https://councilof.ai/shared", "https://councilof.ai/b"]}}
        with patch.object(MODULE, "probe_x402_route", side_effect=lambda url: {"url": url, "state": "PUBLIC_RESPONSE"}) as probe:
            result = MODULE.read_x402_route_probes(catalogues)
        self.assertEqual(result["state"], "MEASURED")
        self.assertEqual(result["route_count"], 3)
        self.assertEqual(probe.call_count, 3)
        held = MODULE.read_x402_route_probes({"cross_catalogue": {"state": "INCOMPLETE"}})
        self.assertEqual(held["state"], "UNCHECKABLE")

    def test_unexpected_redirect_creates_specific_review_move(self):
        route_probes = {"state": "MEASURED", "route_count": 2,
                        "route_states": {"REDIRECT_REVIEW_REQUIRED": 1, "VALID_X402_V2_BAZAAR_CHALLENGE": 1},
                        "routes": [{"url": "https://councilof.ai/api/eunomia-data", "state": "REDIRECT_REVIEW_REQUIRED"},
                                   {"url": "https://councilof.ai/api/proof", "state": "VALID_X402_V2_BAZAAR_CHALLENGE"}]}
        action = MODULE.derive_x402_route_actions(route_probes)[0]
        self.assertEqual(action["state"], "X402_ROUTE_REVIEW_REQUIRED")
        self.assertIn("REDIRECT_REVIEW_REQUIRED", action["evidence"])
        self.assertIn("eunomia-data", action["evidence"])


if __name__ == "__main__":
    unittest.main()
