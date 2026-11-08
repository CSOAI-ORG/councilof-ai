# SPDX-License-Identifier: Apache-2.0
import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest

import event
import regulation_projection as rp


def fixture_manifest():
    anchors = {"32024R1689:53": "1" * 64, "32024R1689:54": "2" * 64,
               "32016R0679:22": "3" * 64}
    root = hashlib.sha256("".join(k + anchors[k] for k in sorted(anchors)).encode()).hexdigest()
    return {"anchors": anchors, "provisions": len(anchors), "normaliser_version": "fixture-1",
            "corpus_root": root}


def fixture_run():
    config = {key: "a" * 64 for key in rp.CONFIG_DIGESTS}
    config.update({"model_id": "synthetic-fixture", "model_revision": "test-only-v1",
                   "serving_path": "fixture:no-provider-call"})
    return {"run_id": "fixture:projection-test", "configuration": config,
            "configuration_sha256": rp.digest(config), "source_kind": "ai-single",
            "evidence_kind": "synthetic-simulation", "observed_at": "2026-11-04T00:00:00Z",
            "context": {"jurisdictions": [], "actor_roles": [], "use_case": "synthetic test only"}}


def source_for(run):
    return event.build(subject={"kind": "sandbox_run", "locator": run["run_id"]},
                       claim={"text": "Synthetic fixture for routing tests."},
                       method={"id": "fixture", "version": "1", "holder": "csoai"},
                       declared={}, observed={"run_id": run["run_id"],
                       "configuration_sha256": run["configuration_sha256"],
                       "context_sha256": rp.digest(run["context"]), "source_kind": run["source_kind"],
                       "evidence_kind": run["evidence_kind"], "observed_at": run["observed_at"]},
                       state="UNMEASURED", limits=["Synthetic fixture only."])


def mapping_for(manifest, run):
    rows = rp.registry_rows(manifest)
    row = rows[0]
    return {"obligation_id": row["id"], "registry_sha256": rp.digest(rows),
            "configuration_sha256": run["configuration_sha256"],
            "context_sha256": rp.digest(run["context"]), "applicability": "APPLICABLE", "relation": "partial",
            "review": {"status": "REVIEWED", "reviewer_ref": "fixture:reviewer",
                       "event_id": "sha256:" + "b" * 64, "reason": "Synthetic supplied declaration only",
                       "source_version": row["instrument_version"], "source_sha256": row["source_sha256"],
                       "valid_from": "2026-11-01T00:00:00Z", "valid_until": "2026-12-01T00:00:00Z"}}


class ProjectionTests(unittest.TestCase):
    def setUp(self):
        self.manifest = fixture_manifest()
        self.run = fixture_run()

    def test_full_disposition_coverage_does_not_establish_obligations(self):
        out = rp.project(self.manifest, self.run)
        self.assertEqual({e["declared"]["obligation"]["id"] for e in out["events"]}, set(self.manifest["anchors"]))
        self.assertEqual(out["counts"]["routing_dispositions"], 3)
        self.assertEqual(out["counts"]["obligation_checks_executed"], 0)
        self.assertTrue(all(e["state"] == "UNMEASURED" and e["value"] is None for e in out["events"]))
        self.assertTrue(all(e["observed"]["applicability"] == "UNKNOWN" for e in out["events"]))
        self.assertTrue(all(e["signature"] is None and event.validate(e) == [] for e in out["events"]))

    def test_deterministic_events_and_ids(self):
        a = rp.project(self.manifest, self.run)
        b = rp.project(self.manifest, self.run)
        self.assertEqual(event.jcs(a), event.jcs(b))

    def test_actual_frozen_manifest_has_417_dispositions_and_six_instruments(self):
        path = Path(__file__).resolve().parents[2] / "public/interop/frozen-provision-hashes.json"
        manifest = rp.read_json(path)
        out = rp.project(manifest, self.run)
        self.assertEqual(out["counts"]["registered_provisions"], 417)
        self.assertEqual(out["counts"]["routing_dispositions"], 417)
        self.assertEqual(out["counts"]["instruments"], 6)
        self.assertEqual(out["mapping_states"], {"UNMAPPED": 417})

    def test_duplicate_json_keys_rejected(self):
        with tempfile.TemporaryDirectory() as tmp:
            path = Path(tmp) / "duplicate.json"
            path.write_text('{"anchors":{},"anchors":{}}')
            with self.assertRaisesRegex(ValueError, "duplicate"):
                rp.read_json(path)

    def test_count_and_root_tampering_rejected(self):
        for field, value in (("provisions", 4), ("corpus_root", "0" * 64)):
            altered = copy.deepcopy(self.manifest); altered[field] = value
            with self.assertRaises(ValueError):
                rp.project(altered, self.run)

    def test_incomplete_or_unbound_configuration_rejected(self):
        for field in rp.CONFIG_DIGESTS + rp.CONFIG_TEXT:
            run = copy.deepcopy(self.run); del run["configuration"][field]
            with self.assertRaises(ValueError):
                rp.project(self.manifest, run)
        run = copy.deepcopy(self.run); run["configuration"]["mcp_sha256"] = "c" * 64
        with self.assertRaisesRegex(ValueError, "configuration digest mismatch"):
            rp.project(self.manifest, run)

    def test_config_change_makes_new_events_and_invalidates_reused_source(self):
        source = source_for(self.run)
        first = rp.project(self.manifest, self.run, source_event=source)
        changed = copy.deepcopy(self.run)
        changed["configuration"]["skills_sha256"] = "c" * 64
        changed["configuration_sha256"] = rp.digest(changed["configuration"])
        second = rp.project(self.manifest, changed)
        self.assertNotEqual(first["events"][0]["event_id"], second["events"][0]["event_id"])
        with self.assertRaisesRegex(ValueError, "binding mismatch"):
            rp.project(self.manifest, changed, source_event=source)

    def test_simulation_cannot_be_relabelled_as_observed(self):
        source = source_for(self.run)
        out = rp.project(self.manifest, self.run, source_event=source)
        self.assertFalse(out["events"][0]["observed"]["observed_live_record_supplied"])
        changed = copy.deepcopy(self.run); changed["evidence_kind"] = "observed-live"
        with self.assertRaisesRegex(ValueError, "evidence_kind"):
            rp.project(self.manifest, changed, source_event=source)

    def test_source_event_tampering_rejected(self):
        source = source_for(self.run); source["observed"]["run_id"] = "different"
        with self.assertRaises(event.DoctrineError):
            rp.project(self.manifest, self.run, source_event=source)

    def test_unreviewed_pointer_preserves_unknown(self):
        mapping = mapping_for(self.manifest, self.run); mapping["review"]["status"] = "DRAFT"
        out = rp.project(self.manifest, self.run, mappings=[mapping])
        row = out["events"][0]
        self.assertEqual(row["observed"]["applicability"], "UNKNOWN")
        self.assertEqual(row["observed"]["mapping_state"], "UNREVIEWED_POINTER")

    def test_review_record_is_not_satisfaction_or_authenticated_human(self):
        mapping = mapping_for(self.manifest, self.run)
        out = rp.project(self.manifest, self.run, mappings=[mapping])
        row = out["events"][0]
        self.assertEqual(row["observed"]["applicability"], "APPLICABLE")
        self.assertEqual(row["observed"]["applicability_basis"], "SUPPLIED_REVIEW_RECORD_NOT_AUTHENTICATED")
        self.assertEqual(row["observed"]["assessment"], "NOT_RUN")
        self.assertEqual(row["state"], "UNMEASURED")

    def test_stale_review_becomes_unknown(self):
        mapping = mapping_for(self.manifest, self.run)
        mapping["review"]["valid_until"] = "2026-11-03T00:00:00Z"
        out = rp.project(self.manifest, self.run, mappings=[mapping])
        self.assertEqual(out["events"][0]["observed"]["mapping_state"], "STALE_POINTER")
        self.assertEqual(out["events"][0]["observed"]["applicability"], "UNKNOWN")

    def test_changed_context_or_registry_cannot_reuse_review(self):
        mapping = mapping_for(self.manifest, self.run)
        for field in ("context_sha256", "registry_sha256", "configuration_sha256"):
            wrong = copy.deepcopy(mapping); wrong[field] = "0" * 64
            with self.assertRaises(ValueError):
                rp.project(self.manifest, self.run, mappings=[wrong])

    def test_duplicate_or_unknown_mapping_rejected(self):
        mapping = mapping_for(self.manifest, self.run)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            rp.project(self.manifest, self.run, mappings=[mapping, mapping])
        mapping["obligation_id"] = "UNKNOWN:1"
        with self.assertRaisesRegex(ValueError, "unregistered"):
            rp.project(self.manifest, self.run, mappings=[mapping])

    def test_global_extension_is_explicit_and_deduplicated(self):
        extension = {"id": "fixture:GB:v1:clause-1", "instrument_id": "fixture-GB-instrument",
                     "instrument_version": "fixture-v1", "clause_locator": "1", "jurisdiction": "GB",
                     "source_url": "https://example.invalid/synthetic-fixture", "source_sha256": "f" * 64,
                     "licence_provenance": "synthetic test fixture", "reviewer_ref": "fixture:reviewer",
                     "review_event_id": "sha256:" + "e" * 64}
        out = rp.project(self.manifest, self.run, extensions=[extension])
        self.assertEqual(out["counts"]["registered_provisions"], 4)
        with self.assertRaisesRegex(ValueError, "duplicate"):
            rp.project(self.manifest, self.run, extensions=[extension, extension])
        renamed = {**extension, "id": "another-id"}
        with self.assertRaisesRegex(ValueError, "duplicate"):
            rp.project(self.manifest, self.run, extensions=[extension, renamed])

    def test_human_assistance_and_invalid_context(self):
        run = copy.deepcopy(self.run); run["source_kind"] = "human-unassisted"; run["assistance"] = "AI hints"
        with self.assertRaisesRegex(ValueError, "assistance"):
            rp.project(self.manifest, run)
        run["source_kind"] = "human-assisted"
        self.assertEqual(rp.project(self.manifest, run)["events"][0]["observed"]["source_kind"], "human-assisted")
        run["context"]["jurisdictions"] = "EU"
        with self.assertRaisesRegex(ValueError, "jurisdictions"):
            rp.project(self.manifest, run)

    def test_unavailable_api_or_human_model_digest_is_explicit(self):
        run = copy.deepcopy(self.run)
        run["configuration"]["model_sha256"] = None
        run["configuration_sha256"] = rp.digest(run["configuration"])
        with self.assertRaisesRegex(ValueError, "unavailability reason"):
            rp.project(self.manifest, run)
        run["configuration"]["model_digest_unavailable_reason"] = "API does not expose model bytes"
        run["configuration_sha256"] = rp.digest(run["configuration"])
        out = rp.project(self.manifest, run)
        self.assertTrue(any("Exact model-byte identity is unavailable" in x for x in out["events"][0]["limits"]))


if __name__ == "__main__":
    unittest.main()
