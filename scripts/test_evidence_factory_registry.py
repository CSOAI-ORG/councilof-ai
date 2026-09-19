"""Adversarial checks for identity, provenance, and non-execution boundaries."""
import copy
import importlib.util
import json
from pathlib import Path
import subprocess
import tempfile
import unittest

SPEC = importlib.util.spec_from_file_location("factory", Path(__file__).with_name("build_evidence_factory_registry.py"))
factory = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(factory)
STAMP = "2026-09-19T10:00:00Z"


class RegistryTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.root = Path(self.tmp.name)
        self.docs = {
            "stablecoins": {"schema": "index/1", "observed_at": "2026-09-12T00:00:00Z", "asset_count": 2,
                "assets": [{"id": "1", "name": "Alpha", "symbol": "DUP", "evidence_state": "MEASURED", "signature_state": "SIGNED"},
                           {"id": "2", "name": "Beta", "symbol": "DUP"}]},
            "stablecoin_sources": {"sources": [{"id": "1", "registration_state": "ATTESTATION_PAGE_REGISTERED"}]},
            "stablecoin_queue": {"rows": [{"id": "1", "measurement_state": "MEASURED"}]},
            "xrpl": {"as_of": "2026-09-01", "rows": [{"name": "Issuer Token A", "r_address": "rSame"},
                {"name": "Issuer Token B", "r_address": "rSame"}, {"name": "Unlocated", "r_address": None}]},
            "swift_seed": {"rows": [{"id": "a", "name": "Bank A"}]},
            "swift_registry": {"banks": [{"bank_id": "a", "bank": "Bank Alpha"}, {"bank_id": "b", "bank": "Bank B"}]},
            "benji": {"as_of": "2026-09-02", "cards": [{"chain": "Ethereum", "contract": "0xhistorical", "status": "MEASURED"}]},
        }
        self.save()
        for spec in factory.CONTRACTS:
            if spec[1]:
                p = self.root / spec[1]
                p.parent.mkdir(parents=True, exist_ok=True)
                p.write_text(f"def {spec[2]}():\n    raise AssertionError('must never execute a collector')\n")

    def tearDown(self):
        self.tmp.cleanup()

    def save(self):
        for key, data in self.docs.items():
            path = self.root / factory.INPUTS[key]
            path.parent.mkdir(parents=True, exist_ok=True)
            path.write_text(json.dumps(data))

    def build(self):
        return factory.build(self.root, STAMP)

    def test_population_is_derived_and_shared_issuer_is_not_collapsed(self):
        result = self.build()["subject-registry.json"]
        self.assertEqual(result["counts"]["catalogue_subject_rows"], 8)
        self.assertIsNone(result["counts"]["distinct_real_world_entities"])
        xrpl = [s for s in result["subjects"] if s["subject_kind"] == "xrpl_instrument"]
        self.assertEqual(len(xrpl), 3)
        self.assertEqual(len({s["subject_id"] for s in xrpl}), 3)
        self.assertEqual(result["reconciliation"]["swift_union_rows"], 2)

    def test_historical_claims_cannot_promote_fresh_or_proof_states(self):
        result = self.build()["subject-registry.json"]
        for row in result["subjects"]:
            self.assertEqual(row["measurement_state"], "DISCOVERED")
            self.assertEqual(row["signature_state"], "UNSIGNED")
            self.assertIsNone(row["measurement_run_id"])
            self.assertEqual(row["publication_state"], "LOCAL_GENERATED_NOT_PUBLISHED")
        alpha = next(s for s in result["subjects"] if s["subject_id"] == "stablecoin:llama:1")
        self.assertEqual(alpha["historical_source_claims"][0]["row"]["evidence_state"], "MEASURED")
        self.assertEqual(alpha["provenance"][0]["source_observed_at"], "2026-09-12T00:00:00Z")
        self.assertEqual(alpha["known_time"], STAMP)
        self.assertIsNone(alpha["valid_time"])

    def test_ids_survive_reordering_and_symbol_collision_is_only_candidate(self):
        before = self.build()["subject-registry.json"]
        self.docs["stablecoins"]["assets"].reverse()
        self.save()
        after = self.build()["subject-registry.json"]
        self.assertEqual([s["subject_id"] for s in before["subjects"]], [s["subject_id"] for s in after["subjects"]])
        overlap = next(c for c in after["overlap_candidates"] if c["alias_key"] == "dup")
        self.assertEqual(overlap["state"], "POSSIBLE_OVERLAP_NOT_MERGED")
        self.assertEqual(len(overlap["subject_ids"]), 2)

    def test_duplicate_source_identifier_fails_before_output(self):
        self.docs["stablecoins"]["assets"].append(copy.deepcopy(self.docs["stablecoins"]["assets"][0]))
        self.save()
        with self.assertRaisesRegex(ValueError, "duplicate id"):
            self.build()

    def test_punctuation_separates_identity_and_slug_collisions_fail(self):
        self.assertEqual(factory.slug("Archax×abrdn"), "archax-abrdn")
        self.assertEqual(factory.slug("Société Générale"), "societe-generale")
        self.docs["xrpl"]["rows"] = [{"name": "Archax×abrdn"}, {"name": "Archax-abrdn"}]
        self.save()
        with self.assertRaisesRegex(ValueError, "duplicate subject_id"):
            self.build()

    def test_callable_inspection_does_not_execute_and_plan_has_no_permissions(self):
        result = self.build()
        contracts = result["contract-registry.json"]["contracts"]
        self.assertEqual(contracts[0]["adapter_state"], "CALLABLE_INSPECTED_NOT_EXECUTED")
        self.assertEqual(contracts[-1]["adapter_state"], "CALLABLE_INSPECTED_NOT_EXECUTED")
        for job in result["job-matrix.json"]["jobs"]:
            self.assertEqual(job["state"], "PLANNED_NOT_SCHEDULED")
            self.assertFalse(job["signing_allowed"])
            self.assertFalse(job["publication_allowed"])
            self.assertEqual(job["cost_ceiling_usd"], 0)
            self.assertIsNone(job["executed_at"])

    def test_missing_entrypoint_is_not_callable(self):
        (self.root / factory.CONTRACTS[0][1]).write_text("x = 1\n")
        result = self.build()["contract-registry.json"]
        self.assertEqual(result["contracts"][0]["adapter_state"], "ENTRYPOINT_MISSING")

    def test_missing_collector_stays_unbound(self):
        (self.root / factory.CONTRACTS[-1][1]).unlink()
        self.assertEqual(self.build()["contract-registry.json"]["contracts"][-1]["adapter_state"], "UNBOUND")

    def test_commit_provenance_detects_modified_and_untracked_bytes(self):
        def run(*args):
            subprocess.run(["git", "-C", str(self.root), *args], check=True, capture_output=True)
        run("init", "-q")
        run("add", *factory.INPUTS.values())
        run("-c", "user.name=Registry Test", "-c", "user.email=registry@example.invalid", "commit", "-qm", "fixture")
        clean = self.build()["subject-registry.json"]
        self.assertTrue(all(s["source_state"] == "COMMITTED_AT_SOURCE_COMMIT" for s in clean["sources"]))
        self.docs["stablecoins"]["asset_count"] = 999
        self.save()
        dirty = self.build()["subject-registry.json"]
        src = next(s for s in dirty["sources"] if s["source_id"] == "stablecoins")
        self.assertEqual(src["source_state"], "LOCAL_MODIFICATION")
        self.assertNotEqual(src["input_artifact_sha256"], src["source_commit_blob_sha256"])
        self.assertFalse(dirty["reconciliation"]["stablecoin_index_count_matches"])

    def test_external_token_manifest_is_pinned_without_guessed_addresses(self):
        manifest = self.root.parent / (self.root.name + "-tokens.json")
        try:
            manifest.write_text(json.dumps({"sources": [{"subject_id": "token:ethereum:eth", "symbol": "ETH",
                "asset_kind": "native", "chain_id": 1, "contract_address": None, "official_url": "https://ethereum.org"}]}))
            result = factory.build(self.root, STAMP, manifest)["subject-registry.json"]
            token = next(s for s in result["subjects"] if s["subject_id"] == "token:ethereum:eth")
            self.assertEqual(token["subject_kind"], "native_token")
            self.assertIsNone(token["identity"]["contract_address_claim"])
            source = next(s for s in result["sources"] if s["source_id"] == "token_identities")
            self.assertEqual(source["source_state"], "EXTERNAL_INPUT")
            self.assertIsNone(source["path"])
            self.assertIn("embedded_document", source)
        finally:
            manifest.unlink(missing_ok=True)

    def test_frozen_inputs_generate_identical_outputs(self):
        self.assertEqual(self.build(), self.build())

    def test_fresh_index_override_preserves_new_rows_and_exact_source_provenance(self):
        fresh = copy.deepcopy(self.docs["stablecoins"])
        fresh["observed_at"] = "2026-09-19T09:19:19Z"
        fresh["asset_count"] = 3
        fresh["assets"].append({"id": "441", "name": "New asset", "symbol": "NEW"})
        override = self.root / "public/interop/evidence-factory/current-index.json"
        override.parent.mkdir(parents=True, exist_ok=True)
        override.write_text(json.dumps(fresh))
        result = factory.build(self.root, STAMP, stablecoin_index=override)["subject-registry.json"]
        self.assertEqual(result["reconciliation"]["stablecoin_index_rows"], 3)
        self.assertEqual(result["reconciliation"]["stablecoin_source_ids_missing"], ["2", "441"])
        new = next(s for s in result["subjects"] if s["subject_id"] == "stablecoin:llama:441")
        self.assertEqual(new["measurement_state"], "DISCOVERED")
        self.assertEqual(len(new["provenance"]), 1)
        source = next(s for s in result["sources"] if s["source_id"] == "stablecoins")
        self.assertEqual(source["path"], "public/interop/evidence-factory/current-index.json")
        self.assertEqual(source["input_artifact_sha256"], factory.digest(override.read_bytes()))
        self.assertEqual(source["source_state"], "UNTRACKED")
        self.assertEqual(source["source_observed_at"], fresh["observed_at"])
        self.assertEqual(self.build()["subject-registry.json"]["reconciliation"]["stablecoin_index_rows"], 2)

    def test_shared_cohort_instrument_is_collected_once_across_family_bindings(self):
        receipt_path = self.root / factory.COHORT_RECEIPT
        receipt_path.parent.mkdir(parents=True, exist_ok=True)
        instrument_sha = factory.digest((self.root / factory.COHORT_INSTRUMENT).read_bytes())
        receipt_path.write_text(json.dumps({"instrument_sha256": instrument_sha, "run_status": "COMPLETED",
                                            "run_finished_at": "2026-09-19T09:24:09Z"}))
        result = self.build()
        families = {"stablecoin.disclosure", "xrpl.public_facts", "institution.disclosure"}
        jobs = [j for j in result["job-matrix.json"]["jobs"] if j["contract_id"] in families]
        self.assertGreater(len(jobs), 3)
        self.assertEqual({j["deduplication_key"] for j in jobs}, {factory.COHORT_INSTRUMENT})
        self.assertTrue(all(j["state"] == "PLANNED_NOT_SCHEDULED" for j in jobs))
        contracts = [c for c in result["contract-registry.json"]["contracts"] if c["contract_id"] in families]
        for contract in contracts:
            evidence = contract["external_execution_evidence"][0]
            self.assertEqual(evidence["receipt_sha256"], factory.digest(receipt_path.read_bytes()))
            self.assertTrue(evidence["instrument_digest_matches"])
            self.assertEqual(contract["execution_state"], "NOT_RUN_BY_REGISTRY")
        self.assertTrue(all(s["measurement_state"] == "DISCOVERED" for s in result["subject-registry.json"]["subjects"]))


if __name__ == "__main__":
    unittest.main()
