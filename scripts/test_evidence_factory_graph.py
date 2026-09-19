import copy
import unittest

from build_evidence_factory_graph import build_graph, canonical, sha


STAMP = "2026-09-19T00:00:00Z"


class GraphTests(unittest.TestCase):
    def setUp(self):
        self.registry = {"subjects": [
            {"subject_id": "stablecoin:llama:1", "subject_kind": "stablecoin"},
            {"subject_id": "stablecoin:llama:2", "subject_kind": "stablecoin"},
        ]}
        self.document = {"schema": "csoai.factory-run-dispositions/0.1", "rows": [{
            "subject_id": "stablecoin:llama:1", "execution_state": "UNMEASURED",
            "observed_at": STAMP, "evidence_sha256": "a" * 64,
            "registry_admission": False, "raw_receipts": [{
                "source_url": "https://example.test/source", "retrieved_at": STAMP,
                "body_sha256": "b" * 64, "http": 403,
                "headers": "secret-cookie", "body_path": "/private/raw.body",
            }],
        }]}

    def build(self):
        return build_graph(self.registry, [("run.json", self.document, "c" * 64)], STAMP)

    def test_failed_dispositions_do_not_become_measurements(self):
        output = self.build()
        self.assertEqual(output["counts"]["by_execution_state"], {"UNMEASURED": 1})
        self.assertEqual(output["counts"]["admitted_measurements"], 0)
        self.assertEqual(output["observations"][0]["admission_state"], "NOT_ADMITTED")

    def test_unrun_population_remains_visible(self):
        output = self.build()
        self.assertEqual(output["counts"]["subjects_not_run_in_this_batch"], 1)
        self.assertEqual(output["subject_dispositions"][1]["state"], "NOT_RUN_IN_THIS_BATCH")

    def test_private_headers_and_paths_are_not_projected(self):
        output = repr(self.build())
        self.assertNotIn("secret-cookie", output)
        self.assertNotIn("/private", output)

    def test_alias_is_not_used_to_guess_a_join(self):
        self.document["rows"][0]["subject_id"] = "USDC"
        with self.assertRaisesRegex(ValueError, "no exact registry match"):
            self.build()

    def test_duplicate_rows_rejected(self):
        self.document["rows"].append(copy.deepcopy(self.document["rows"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate subject"):
            self.build()

    def test_collector_admission_claim_rejected(self):
        self.document["rows"][0]["registry_admission"] = True
        with self.assertRaisesRegex(ValueError, "cannot grant"):
            self.build()

    def test_missing_source_digest_rejected(self):
        self.document["rows"][0]["raw_receipts"][0]["body_sha256"] = None
        with self.assertRaisesRegex(ValueError, "source body"):
            self.build()

    def test_timestamp_without_timezone_rejected(self):
        self.document["rows"][0]["observed_at"] = "2026-09-19T00:00:00"
        with self.assertRaisesRegex(ValueError, "timezone"):
            self.build()

    def test_no_response_preserves_null_digest(self):
        receipt = self.document["rows"][0]["raw_receipts"][0]
        receipt.update(body_sha256=None, http=None, fetch_state="UNCHECKABLE")
        projected = self.build()["observations"][0]["source_receipts"][0]
        self.assertIsNone(projected["body_sha256"])
        self.assertEqual(projected["capture_state"], "NO_RESPONSE_BYTES")

    def test_token_payload_digest_and_identity_are_bound(self):
        self.document["schema"] = "csoai.public-token-observation-summary/1"
        row = self.document["rows"][0]
        row["evidence"] = {"identity": {"id": row["subject_id"]}, "source_receipts": []}
        row["evidence_sha256"] = sha(canonical(row["evidence"]))
        self.assertEqual(self.build()["observations"][0]["identity"]["id"], row["subject_id"])
        row["evidence"]["identity"]["id"] = "different:identity"
        with self.assertRaisesRegex(ValueError, "digest mismatch"):
            self.build()

    def test_unknown_schema_rejected(self):
        self.document["schema"] = "unreviewed/1"
        with self.assertRaisesRegex(ValueError, "unsupported observation schema"):
            self.build()

    def test_unsupported_states_cannot_enter_public_counts(self):
        for state in ("MEASURED", "SIGNED", "SIGNED_AND_ADMITTED", "CERTIFIED", "", None):
            with self.subTest(state=state):
                self.document["rows"][0]["execution_state"] = state
                with self.assertRaisesRegex(ValueError, "unsupported execution disposition"):
                    self.build()

    def test_successful_dispositions_need_hashed_http_200_bytes(self):
        row = self.document["rows"][0]
        for state in ("OBSERVED", "DEEP_PROBED"):
            row["execution_state"] = state
            for receipts in ([], [{"source_url": "https://example.test/source", "retrieved_at": STAMP,
                                   "http": 403, "body_sha256": "b" * 64}],
                             [{"source_url": "https://example.test/source", "retrieved_at": STAMP,
                               "http": None, "body_sha256": None, "fetch_state": "UNCHECKABLE"}]):
                row["raw_receipts"] = receipts
                with self.subTest(state=state, receipts=receipts), self.assertRaisesRegex(ValueError, "requires a hashed HTTP 200"):
                    self.build()
        row["raw_receipts"] = [{"source_url": "https://example.test/source", "retrieved_at": STAMP,
                                "http": 200, "body_sha256": "b" * 64}]
        self.assertEqual(self.build()["observations"][0]["execution_state"], "DEEP_PROBED")

    def test_unresolved_states_may_have_no_response_receipts(self):
        row = self.document["rows"][0]
        row["raw_receipts"] = []
        for state in ("UNMEASURED", "UNCHECKABLE", "ERROR", "NOT_RUN"):
            row["execution_state"] = state
            with self.subTest(state=state):
                self.assertEqual(self.build()["observations"][0]["execution_state"], state)

    def test_null_body_hash_requires_uncheckable_http_none(self):
        receipt = self.document["rows"][0]["raw_receipts"][0]
        for status, fetch_state in ((200, "UNCHECKABLE"), (None, "FETCHED"), (None, None)):
            receipt.update(body_sha256=None, http=status, fetch_state=fetch_state)
            with self.subTest(status=status, fetch_state=fetch_state), self.assertRaisesRegex(ValueError, "source body"):
                self.build()

    def token_row(self, evidence):
        self.document["schema"] = "csoai.public-token-observation-summary/1"
        row = self.document["rows"][0]
        row["evidence"] = {"identity": {"id": row["subject_id"]}, "source_receipts": [], **evidence}
        row["evidence_sha256"] = sha(canonical(row["evidence"]))
        return row

    def test_private_token_fields_rejected_even_with_a_valid_digest(self):
        for field in ("headers", "raw_body", "cookies", "authorization", "request_body", "rawBody"):
            with self.subTest(field=field):
                self.token_row({"observations": {"https://rpc.example.test": {
                    "rpc": "https://rpc.example.test", "fields": {field: "private-content"}}}})
                with self.assertRaisesRegex(ValueError, "private field forbidden"):
                    self.build()

    def test_unknown_token_fields_are_not_implicitly_public(self):
        self.token_row({"metadata": {"debug_blob": "unreviewed-field"}})
        with self.assertRaisesRegex(ValueError, "unsupported fields"):
            self.build()

    def test_token_field_types_are_checked(self):
        self.token_row({"metadata": {"name": {"nested": "unreviewed-content"}}})
        with self.assertRaisesRegex(ValueError, "invalid type"):
            self.build()

    def test_native_token_and_rpc_observations_keep_their_scopes(self):
        native = {"chain_id": 1, "finalized_block": {"number": "0x1", "hash": "0x" + "a" * 64,
                  "timestamp": "0x1", "stateRoot": "0x" + "b" * 64},
                  "gas_used": "1", "gas_limit": "2", "base_fee_per_gas_wei": None, "providers": ["https://rpc.example.test"]}
        self.token_row({"observations": native, "metadata": None, "provider_agreement": None, "unknowns": ["native supply not measured"]})
        self.assertEqual(self.build()["observations"][0]["observations"], native)
        provider = {"https://rpc.example.test": {"rpc": "https://rpc.example.test", "receipt_ids": ["r1"],
                    "fields": {"name": "Token", "symbol": "TOKEN", "decimals": "18", "totalSupply": "1000"},
                    "errors": {}, "code": {"bytes": 10, "sha256": "d" * 64, "verified_source": False}}}
        self.token_row({"observations": provider})
        self.assertEqual(self.build()["observations"][0]["observations"], provider)

    def test_token_schema_does_not_accept_cohort_deep_probe_state(self):
        row = self.token_row({})
        row["execution_state"] = "DEEP_PROBED"
        with self.assertRaisesRegex(ValueError, "unsupported execution disposition"):
            self.build()

    def test_cohort_observations_use_family_schema(self):
        row = self.document["rows"][0]
        row["observations"] = {"source_url": None, "source_bytes_observed": False, "source_fetch_states": [],
                               "extraction_review_state": "REVIEW_PENDING", "extraction_candidates": {
                                   "auditor": None, "cadence_claimed": None, "latest_report_date": None}}
        row["unknowns"] = ["extraction_semantics"]
        self.assertEqual(self.build()["observations"][0]["observations"], row["observations"])
        row["observations"]["extraction_candidates"]["headers"] = "private-content"
        with self.assertRaisesRegex(ValueError, "private field forbidden"):
            self.build()

    def test_xrpl_obligations_remain_bounded_and_not_asset_supply(self):
        self.registry["subjects"][0]["subject_kind"] = "xrpl_instrument"
        row = self.document["rows"][0]
        row["observations"] = {"account_state": "UNMEASURED", "issuer_attribution": "UNVERIFIED", "asset_supply": None,
                               "obligations_state": "UNMEASURED", "obligations_by_currency": {"USD": "12.3"}}
        self.assertIsNone(self.build()["observations"][0]["observations"]["asset_supply"])
        row["observations"]["obligations_by_currency"] = {str(i): "1" for i in range(51)}
        with self.assertRaisesRegex(ValueError, "bounded currency"):
            self.build()

    def test_swift_source_failures_preserve_nulls(self):
        self.registry["subjects"][0]["subject_kind"] = "institution_disclosure"
        row = self.document["rows"][0]
        row["observations"] = {"sources_expected": 1, "source_responses_archived": 1, "sources_fetched": 0,
                               "source_fetch_states": [{"url": "https://example.test/source", "state": "UNCHECKABLE", "http": None, "body_sha256": None}],
                               "source_content_claim_review": "NOT_PERFORMED", "client_relationship": "NOT_CLAIMED", "settlement_state": "UNMEASURED"}
        self.assertIsNone(self.build()["observations"][0]["observations"]["source_fetch_states"][0]["body_sha256"])

    def test_scalar_receipt_and_reason_fields_cannot_hide_nested_content(self):
        row = self.document["rows"][0]
        for field in ("reason", "source_as_of"):
            row[field] = {"headers": "private-content"}
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "must be null or a string"):
                self.build()
            del row[field]
        receipt = row["raw_receipts"][0]
        for field in ("id", "method", "fetch_state"):
            receipt[field] = {"headers": "private-content"}
            with self.subTest(field=field), self.assertRaisesRegex(ValueError, "must be a string"):
                self.build()
            del receipt[field]
        receipt["http"] = {"headers": "private-content"}
        with self.assertRaisesRegex(ValueError, "HTTP status integer"):
            self.build()


if __name__ == "__main__":
    unittest.main()
