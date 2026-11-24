#!/usr/bin/env python3
"""Offline negative controls for the read-only operational evidence heartbeat."""
import datetime as dt
import importlib.util
import pathlib
import unittest

HERE = pathlib.Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location("heartbeat", HERE / "evidence-heartbeat.py")
heartbeat = importlib.util.module_from_spec(spec)
spec.loader.exec_module(heartbeat)
NOW = dt.datetime(2026, 11, 24, tzinfo=dt.timezone.utc)


def sample():
    return {
        "board": {"state": "READ", "payload": {
            "axes": [{"axis": "governance", "kind": "model-comparison", "status": "MEASURED", "separation": "TIE"},
                     {"axis": "safety", "kind": "model-comparison", "status": "MEASURED", "separation": "UNTESTED"},
                     {"axis": "effect-binding", "kind": "deterministic-facts", "status": "MEASURED"}],
            "totals": {"axes": 3, "measured_axes": 3, "unmeasured_axes": 0,
                       "comparison_axes": 2, "ties": 1, "untested_separations": 1, "separated_leads": 0}}},
        "root": {"state": "READ", "payload": {
            "as_of": "2026-11-23T00:00:00Z", "card_count": 2,
            "card_sha256": ["a" * 64, "b" * 64], "merkle_root": "f" * 64,
            "sig_ed25519": "signed-byte-field-present"}},
        "distribution": {"state": "READ", "payload": {
            "as_of": "2026-11-23T00:00:00Z", "stale_after": "2026-11-25T00:00:00Z",
            "by_entity": {"downloads_all_time": {
                "csoai": {"value": 10, "state": "READ", "covered": 1, "attempted": 1},
                "meok": {"value": 20, "state": "PARTIAL", "covered": 1, "attempted": 2}}}}},
        "revenue": {"state": "READ", "payload": {
            "settled_usdc": {"count": 60000, "status": "MEASURED"}}},
    }


class HeartbeatTests(unittest.TestCase):
    def test_consistent_public_sources_do_not_claim_end_to_end_success(self):
        report = heartbeat.assess(sample(), now=NOW)
        self.assertEqual(report["rollup"], "OBSERVATIONS_ONLY_WITH_OPEN_GATES")
        self.assertEqual(report["checks"]["board_consistency"]["state"], "OBSERVED_CONSISTENT")
        self.assertFalse(report["metrics"]["root"]["signature_verified"])
        self.assertEqual(report["checks"]["receiving_party_acceptance"]["state"], "NOT_EVALUATED")
        self.assertEqual(report["metrics"]["distribution"]["by_entity_all_time"]["meok"]["state"], "PARTIAL")

    def test_board_count_mismatch_fails(self):
        observations = sample()
        observations["board"]["payload"]["totals"]["measured_axes"] = 100
        report = heartbeat.assess(observations, now=NOW)
        self.assertIn("board_consistency", report["failed_invariants"])

    def test_hidden_tie_fails(self):
        observations = sample()
        observations["board"]["payload"]["totals"]["ties"] = 0
        report = heartbeat.assess(observations, now=NOW)
        self.assertIn("board_consistency", report["failed_invariants"])

    def test_root_membership_count_mismatch_fails(self):
        observations = sample()
        observations["root"]["payload"]["card_count"] = 3
        self.assertIn("root_internal_consistency", heartbeat.assess(observations, now=NOW)["failed_invariants"])

    def test_exact_byte_crypto_replay_promotes_only_matching_root(self):
        observations = sample()
        observations["root"]["sha256"] = "a" * 64
        crypto = {"verdict": "VALID", "root_source_sha256": "a" * 64,
                  "sampled_proofs": 4,
                  "checks": {"merkle_tree": {"state": "VALID"},
                             "root_signature": {"state": "VALID"},
                             "proof_0": {"state": "VALID"}}}
        report = heartbeat.assess(observations, now=NOW, crypto_report=crypto)
        self.assertEqual(report["checks"]["root_crypto_verification"]["state"], "VALID")
        self.assertNotIn("root_crypto_verification", report["open_or_uncheckable_gates"])
        self.assertEqual(report["metrics"]["root"]["sampled_proofs_verified"], 4)

    def test_crypto_report_with_other_bytes_is_unknown(self):
        observations = sample()
        observations["root"]["sha256"] = "a" * 64
        crypto = {"verdict": "VALID", "root_source_sha256": "b" * 64,
                  "sampled_proofs": 4,
                  "checks": {"merkle_tree": {"state": "VALID"}, "root_signature": {"state": "VALID"}}}
        report = heartbeat.assess(observations, now=NOW, crypto_report=crypto)
        self.assertEqual(report["checks"]["root_crypto_verification"]["state"], "UNCHECKABLE")

    def test_crypto_invalid_same_bytes_fails(self):
        observations = sample()
        observations["root"]["sha256"] = "a" * 64
        crypto = {"verdict": "INVALID", "root_source_sha256": "a" * 64}
        report = heartbeat.assess(observations, now=NOW, crypto_report=crypto)
        self.assertIn("root_crypto_verification", report["failed_invariants"])

    def test_missing_source_is_unknown_not_clean(self):
        observations = sample()
        observations["root"] = {"state": "UNCHECKABLE", "reason": "HTTP 403"}
        report = heartbeat.assess(observations, now=NOW)
        self.assertEqual(report["rollup"], "UNCHECKABLE_SOURCES")
        self.assertEqual(report["checks"]["root_source"]["state"], "UNCHECKABLE")

    def test_stale_census_never_claims_current(self):
        observations = sample()
        observations["distribution"]["payload"]["stale_after"] = "2026-11-23T00:00:00Z"
        report = heartbeat.assess(observations, now=NOW)
        self.assertEqual(report["checks"]["distribution_freshness"]["state"], "STALE")
        self.assertEqual(report["rollup"], "STALE_SOURCES")
        self.assertEqual(report["stale_sources"], ["distribution_freshness"])

    def test_missing_entity_is_unknown_not_a_combined_count(self):
        observations = sample()
        del observations["distribution"]["payload"]["by_entity"]["downloads_all_time"]["meok"]
        report = heartbeat.assess(observations, now=NOW)
        self.assertEqual(report["checks"]["distribution_entity_scope"]["state"], "UNCHECKABLE")

    def test_invalid_census_timestamp_never_claims_current(self):
        observations = sample()
        observations["distribution"]["payload"]["stale_after"] = "invalid"
        report = heartbeat.assess(observations, now=NOW)
        self.assertEqual(report["checks"]["distribution_freshness"]["state"], "UNCHECKABLE")


if __name__ == "__main__":
    unittest.main()
