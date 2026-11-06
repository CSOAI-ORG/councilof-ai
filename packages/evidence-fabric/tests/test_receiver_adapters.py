# SPDX-License-Identifier: Apache-2.0
"""Native contract projections with checksum, missing-source and semantic negative controls."""
import copy
import json
import os
import pathlib
import sys
import tempfile
import unittest
from unittest import mock

HERE = pathlib.Path(__file__).resolve().parents[1]
ROOT = pathlib.Path(os.environ.get("CSOAI_PILOT_SOURCE_ROOT", str(HERE.parents[1])))
sys.path.insert(0, str(ROOT / "packages/evidence-fabric"))
sys.path.insert(0, str(HERE))
import receiver_adapters as A

STAMP = "2026-11-06T04:00:00Z"
ARTIFACT = "1cb47b95-8bf8-3bad-a5a4-0d54d86e10ce"


def seed_event(state="PARTIAL"):
    return A.E.build(subject={"kind": "sandbox_run", "locator": "fixture://adapter-contract"},
                     claim={"text": "Synthetic carrier state, not a third-party run.", "read_at": STAMP},
                     method={"id": "adapter-contract-fixture", "version": "1", "holder": "csoai"},
                     declared={}, observed={}, state=state, value=None,
                     negative_control={"id": "supplied-fixture-control", "expected": "CONTROL_ONLY", "got": "CONTROL_ONLY"},
                     limits=["Synthetic contract fixture only."])


ROOT_ID = "da89e38e-95e7-44ca-aa7d-f3b6b34c7fab"
CLAIM_ID = "d0d067fa-dd0f-4df4-8a74-f9a38ae31001"
SOURCE_URL = "https://assuranceplatform.azurewebsites.net/api/public/discover/synthetic-contract-fixture"
EVIDENCE_URL = "https://example.invalid/retained-evidence"


def tree_node(node_id, kind, children=None):
    return {"id": node_id, "type": kind, "name": "synthetic node", "description": "do-not-copy-private-text",
            "inSandbox": False, "children": children or []}


def turing_snapshot():
    evidence = {**tree_node(ARTIFACT, "EVIDENCE"), "url": EVIDENCE_URL, "assertionStatus": "NEEDS_SUPPORT"}
    claim = tree_node(CLAIM_ID, "PROPERTY_CLAIM", [evidence])
    return {"id": "published-fixture-record-not-a-uuid", "type": "ASSURANCE_CASE", "slug": "synthetic-contract-fixture",
            "title": "Synthetic contract fixture", "publishedAt": STAMP, "archivedAt": None,
            "authors": None, "description": None, "sector": None, "featureImageUrl": None,
            "content": {"version": "1.0", "exportedAt": STAMP,
                        "case": {"name": "synthetic fixture", "description": "not a real assurance case"},
                        "tree": tree_node(ROOT_ID, "GOAL", [claim]),
                        "pluginData": {"opaque": {"private": "do-not-copy-plugin-content"}}}}


def turing_capture(snapshot_raw, evidence_raw):
    return {"source_url": SOURCE_URL, "captured_at": STAMP, "snapshot_sha256": A.sha(snapshot_raw),
            "source_kind": "SYNTHETIC_CONTRACT_FIXTURE", "evidence_pins": {
                ARTIFACT: {"url_sha256": A.sha(EVIDENCE_URL.encode()), "content_sha256": A.sha(evidence_raw)}}}


def moonshot():
    return {"id": "synthetic-contract-fixture", "start_time": 1.0, "end_time": 2.0, "duration": 1,
            "status": "COMPLETED", "raw_results": {}, "results": {"arbitrary_metric": 0.95}, "params": {}}


def pins(raw):
    return {"result_sha256": A.sha(raw), "toolkit_commit": A.MOONSHOT_COMMIT,
            "method_sha256": A.sha(b"synthetic-method"), "inputs_sha256": A.sha(b"synthetic-inputs"),
            "subject_ref": "fixture://not-a-model-run", "source_kind": "SYNTHETIC_CONTRACT_FIXTURE"}


class LangfuseTest(unittest.TestCase):
    def test_all_six_states_stay_native_categorical_strings(self):
        for state in A.E.STATES:
            with self.subTest(state=state):
                event = seed_event(state)
                result = A.langfuse_score(event, "1" * 32)
                A.validate_contract("langfuse-create-scores.schema.json", result)
                self.assertEqual(result["value"], state)
                self.assertIsInstance(result["value"], str)
                self.assertEqual(result["dataType"], "CATEGORICAL")
                self.assertEqual(result["source"], "API")
                self.assertEqual(result["metadata"]["event_id"], event["event_id"])

    def test_trace_binding_is_required_and_never_inferred_from_event_id(self):
        for trace in (None, "", "0" * 32, "trace", "A" * 32):
            with self.subTest(trace=trace), self.assertRaises(ValueError):
                A.langfuse_score(seed_event(), trace)
        self.assertEqual(A.langfuse_score(seed_event(), "1" * 32)["traceId"], "1" * 32)

    def test_observation_binding_and_deterministic_unique_payload_identity(self):
        event = seed_event()
        result = A.langfuse_score(event, "1" * 32, "2" * 16)
        self.assertEqual(result["observationId"], "2" * 16)
        self.assertEqual(result, A.langfuse_score(event, "1" * 32, "2" * 16))
        self.assertNotEqual(result["id"], A.langfuse_score(event, "3" * 32, "2" * 16)["id"])
        with self.assertRaises(ValueError):
            A.langfuse_score(event, "1" * 32, "0" * 16)

    def test_mutated_event_cannot_be_projected(self):
        event = seed_event()
        event["state"] = "CONSISTENT"
        with self.assertRaises(A.E.DoctrineError):
            A.langfuse_score(event, "1" * 32)


class TeaTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        self.root = pathlib.Path(self.temp.name)
        self.raw = b'{ "retained": true }\n'
        (self.root / "evidence.json").write_bytes(self.raw)
        self.snapshot = turing_snapshot()
        self.snapshot_raw = A.E.jcs(self.snapshot)
        self.capture = turing_capture(self.snapshot_raw, self.raw)

    def tearDown(self):
        self.temp.cleanup()

    def extract(self, mapping=None, snapshot_raw=None):
        return A.turing_tea_events(self.snapshot_raw if snapshot_raw is None else snapshot_raw, self.capture,
                                   {ARTIFACT: "evidence.json"} if mapping is None else mapping, self.root)

    def test_native_snapshot_core_evidence_and_parent_links_preserved_without_approval(self):
        event = self.extract()[0]
        self.assertEqual(event["state"], "PARTIAL")
        self.assertEqual(event["observed"]["parent_element_id"], CLAIM_ID)
        self.assertEqual(event["observed"]["evidence_node_id"], ARTIFACT)
        self.assertEqual(event["observed"]["author_assertion_status"], "NEEDS_SUPPORT")
        self.assertEqual(event["declared"]["published_snapshot_id"], "published-fixture-record-not-a-uuid")
        self.assertEqual(event["declared"]["capture_source_kind"], "SYNTHETIC_CONTRACT_FIXTURE")
        self.assertEqual(event["observed"]["response_sha256"], A.sha(self.snapshot_raw))
        self.assertEqual(event["observed"]["retained_reference_sha256"], A.sha(self.raw))
        self.assertEqual(A.E.validate(event), [])

    def test_response_and_core_and_opaque_extra_hashes_are_distinct(self):
        event = self.extract()[0]
        self.assertNotEqual(event["observed"]["response_sha256"], event["observed"]["export_core_sha256"])
        self.assertEqual(event["observed"]["opaque_extra_sha256"]["pluginData"],
                         A.sha(A.E.jcs(self.snapshot["content"]["pluginData"])))
        self.assertNotIn("do-not-copy", json.dumps(event))

    def test_changed_response_bytes_or_linked_bytes_are_detected(self):
        self.assertEqual(self.extract(snapshot_raw=self.snapshot_raw + b"\n")[0]["state"], "DIVERGENT")
        (self.root / "evidence.json").write_bytes(b'{"retained":true}')
        self.assertEqual(self.extract()[0]["state"], "DIVERGENT")

    def test_missing_expected_response_pin_is_uncheckable(self):
        self.capture["snapshot_sha256"] = None
        event = self.extract()[0]
        self.assertEqual(event["state"], "UNCHECKABLE")
        self.assertIsNone(event["value"])
        self.assertIsNone(event["declared"]["expected_response_sha256"])

    def test_missing_reference_or_missing_reference_pin_is_uncheckable(self):
        for mapping in ({}, {ARTIFACT: "not-present.json"}):
            with self.subTest(mapping=mapping):
                event = self.extract(mapping)[0]
                self.assertEqual(event["state"], "UNCHECKABLE")
                self.assertIsNone(event["observed"]["retained_reference_sha256"])
        self.capture["evidence_pins"] = {}
        self.assertEqual(self.extract()[0]["state"], "UNCHECKABLE")

    def test_missing_declared_url_remains_unknown_even_with_an_expected_url_pin(self):
        self.snapshot["content"]["tree"]["children"][0]["children"][0]["url"] = None
        self.snapshot_raw = A.E.jcs(self.snapshot)
        self.capture["snapshot_sha256"] = A.sha(self.snapshot_raw)
        event = self.extract()[0]
        self.assertEqual(event["state"], "UNCHECKABLE")
        self.assertIsNone(event["observed"]["declared_url_sha256"])

    def test_url_pin_mismatch_is_divergent_and_url_never_fetched(self):
        self.capture["evidence_pins"][ARTIFACT]["url_sha256"] = "a" * 64
        import socket
        with mock.patch.object(socket, "create_connection", side_effect=AssertionError("network disallowed")):
            event = self.extract()[0]
        self.assertEqual(event["state"], "DIVERGENT")
        self.assertNotIn(EVIDENCE_URL, json.dumps(event))

    def test_empty_evidence_tree_does_not_produce_vacuous_success(self):
        self.snapshot["content"]["tree"]["children"] = []
        self.snapshot_raw = A.E.jcs(self.snapshot)
        self.capture["snapshot_sha256"] = A.sha(self.snapshot_raw)
        events = self.extract()
        self.assertEqual(len(events), 1)
        self.assertEqual(events[0]["state"], "UNCHECKABLE")
        self.assertEqual(events[0]["observed"]["evidence_presence"], "NO_EVIDENCE_NODES")
        self.assertIsNone(events[0]["observed"]["evidence_node_id"])
        self.assertIn("no declared evidence nodes", events[0]["claim"]["text"])

    def test_duplicate_node_identity_and_depth_bound_are_refused(self):
        self.snapshot["content"]["tree"]["children"].append(copy.deepcopy(self.snapshot["content"]["tree"]["children"][0]))
        with self.assertRaisesRegex(ValueError, "duplicate"):
            self.extract(snapshot_raw=A.E.jcs(self.snapshot))
        import uuid
        node = tree_node(str(uuid.uuid4()), "GOAL")
        root = node
        for _index in range(50):
            child = tree_node(str(uuid.uuid4()), "GOAL")
            node["children"] = [child]
            node = child
        self.snapshot["content"]["tree"] = root
        with self.assertRaisesRegex(ValueError, "traversal bound"):
            self.extract(snapshot_raw=A.E.jcs(self.snapshot))

    def test_official_core_schema_rejects_invalid_node_uuid_and_missing_field(self):
        import jsonschema
        for change in ("uuid", "version"):
            self.snapshot = turing_snapshot()
            if change == "uuid":
                self.snapshot["content"]["tree"]["id"] = "not-an-official-node-uuid"
            else:
                self.snapshot["content"]["version"] = "unknown"
            with self.subTest(change=change), self.assertRaises(jsonschema.ValidationError):
                self.extract(snapshot_raw=A.E.jcs(self.snapshot))

    def test_mutable_slug_is_bound_to_capture_and_not_an_identity_claim(self):
        self.capture["source_url"] = SOURCE_URL + "-different"
        with self.assertRaisesRegex(ValueError, "slug"):
            self.extract()

    def test_mapping_cannot_escape_root_or_follow_symlink(self):
        with self.assertRaisesRegex(ValueError, "relative"):
            self.extract({ARTIFACT: "../outside.json"})
        (self.root / "linked.json").symlink_to(self.root / "evidence.json")
        with self.assertRaisesRegex(ValueError, "symlink"):
            self.extract({ARTIFACT: "linked.json"})

    def test_capture_time_and_official_export_time_are_validated(self):
        self.capture["captured_at"] = "not-a-timestamp"
        with self.assertRaisesRegex(ValueError, "time"):
            self.extract()
        self.capture["captured_at"] = STAMP
        self.snapshot["content"]["exportedAt"] = "not-a-timestamp"
        import jsonschema
        with self.assertRaises(jsonschema.ValidationError):
            self.extract(snapshot_raw=A.E.jcs(self.snapshot))


class MoonshotTest(unittest.TestCase):
    def test_native_lifecycle_is_preserved_without_inventing_metric_semantics(self):
        raw = A.E.jcs(moonshot())
        event = A.moonshot_event(raw, pins(raw), STAMP)
        self.assertEqual(event["state"], "PARTIAL")
        self.assertEqual(event["observed"]["upstream_lifecycle_status"], "COMPLETED")
        self.assertIsNone(event["value"])
        self.assertNotIn("arbitrary_metric", json.dumps(event))
        self.assertEqual(event["observed"]["results_sha256"], A.sha(A.E.jcs(moonshot()["results"])))

    def test_missing_pins_remain_uncheckable_even_if_lifecycle_completed(self):
        raw = A.E.jcs(moonshot())
        incomplete = pins(raw)
        del incomplete["inputs_sha256"]
        event = A.moonshot_event(raw, incomplete, STAMP)
        self.assertEqual(event["state"], "UNCHECKABLE")
        self.assertEqual(event["observed"]["missing_pins"], ["inputs_sha256"])
        self.assertIsNone(event["value"])

    def test_null_subject_pin_stays_uncheckable_instead_of_becoming_an_error(self):
        raw = A.E.jcs(moonshot())
        missing = pins(raw)
        missing["subject_ref"] = None
        event = A.moonshot_event(raw, missing, STAMP)
        self.assertEqual(event["state"], "UNCHECKABLE")
        self.assertEqual(event["observed"]["missing_pins"], ["subject_ref"])

    def test_changed_source_digest_is_divergent_without_becoming_a_model_score(self):
        raw = A.E.jcs(moonshot())
        event = A.moonshot_event(raw + b"\n", pins(raw), STAMP)
        self.assertEqual(event["state"], "DIVERGENT")
        self.assertIsNone(event["value"])

    def test_uninspected_version_and_claimed_authenticated_execution_are_refused(self):
        raw = A.E.jcs(moonshot())
        for field, value in (("toolkit_commit", "a" * 40), ("source_kind", "AUTHENTICATED_REAL_RUN")):
            changed = pins(raw)
            changed[field] = value
            with self.subTest(field=field), self.assertRaises(ValueError):
                A.moonshot_event(raw, changed, STAMP)

    def test_distinct_upstream_lifecycle_errors_are_not_collapsed(self):
        result = moonshot()
        result["status"] = "COMPLETED_WITH_ERRORS"
        raw = A.E.jcs(result)
        event = A.moonshot_event(raw, pins(raw), STAMP)
        self.assertEqual(event["observed"]["upstream_lifecycle_status"], "COMPLETED_WITH_ERRORS")
        self.assertEqual(event["state"], "PARTIAL")

    def test_malformed_contract_and_nonfinite_duplicate_json_are_refused(self):
        for raw in (b'{"id":"x","id":"y"}', b'{"x":NaN}', b'{"opaque":{"overflow":1e999}}', b'{}'):
            with self.subTest(raw=raw), self.assertRaises(ValueError):
                A.moonshot_event(raw, {}, STAMP)
        result = moonshot()
        result["end_time"] = 0
        raw = A.E.jcs(result)
        with self.assertRaisesRegex(ValueError, "ends before"):
            A.moonshot_event(raw, pins(raw), STAMP)


class CliTest(unittest.TestCase):
    def test_shared_parser_rejects_numeric_overflow_inside_opaque_json(self):
        for raw in (b'{"opaque":{"overflow":1e999}}', b'{"opaque":{"nan":NaN}}'):
            with self.subTest(raw=raw), self.assertRaisesRegex(ValueError, "nonfinite"):
                A.strict_json(raw)

    def test_real_cli_writes_native_payload_and_refuses_overwrite(self):
        with tempfile.TemporaryDirectory() as output:
            root = pathlib.Path(output)
            event = seed_event("UNCHECKABLE")
            A.E.write_jsonl(str(root / "events.jsonl"), [event])
            (root / "map.json").write_bytes(A.E.jcs({event["event_id"]: {"trace_id": "1" * 32}}))
            argv = ["langfuse", "--events", str(root / "events.jsonl"), "--trace-map", str(root / "map.json"),
                    "--out", str(root / "payload.json")]
            with mock.patch("builtins.print"):
                A.main(argv)
            payload = json.loads((root / "payload.json").read_bytes())
            A.validate_contract("langfuse-create-scores.schema.json", payload)
            self.assertEqual(payload[0]["dataType"], "CATEGORICAL")
            self.assertEqual(payload[0]["value"], "UNCHECKABLE")
            with mock.patch("builtins.print"), self.assertRaises(FileExistsError):
                A.main(argv)


if __name__ == "__main__":
    unittest.main()
