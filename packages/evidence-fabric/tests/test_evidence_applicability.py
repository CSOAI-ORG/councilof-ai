# SPDX-License-Identifier: Apache-2.0
"""Effects, cryptographic scope, missingness and tamper controls for a local fixture."""
import copy
import importlib.util
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
import evidence_applicability as P


class PilotTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.pilot = P.make_pilot(ROOT)
        cls.material, cls.immaterial, cls.missing = cls.pilot["scenarios"]

    def test_real_timeout_causes_changed_external_effect(self):
        old = {r["mode"]: r for r in self.material["r1_run"]["tests"]}
        new = {r["mode"]: r for r in self.material["r2_run"]["tests"]}
        self.assertEqual(old["timeout"]["sink_request_count"], 0)
        self.assertEqual(new["timeout"]["sink_request_count"], 1)
        self.assertFalse(new["timeout"]["token_valid"])
        self.assertGreaterEqual(old["timeout"]["elapsed_ns"], 50_000_000)
        self.assertEqual(P.claim_observation(self.material["r1_run"]), True)
        self.assertEqual(P.claim_observation(self.material["r2_run"]), False)

    def test_scoped_positive_and_four_distinct_negative_controls(self):
        for release in (self.material["r1_run"], self.material["r2_run"]):
            modes = {r["mode"]: r for r in release["tests"]}
            self.assertEqual(modes["valid"]["sink_request_count"], 1)
            self.assertTrue(modes["valid"]["token_valid"])
            for mode in ("denied", "forged", "wrong_scope", "expired"):
                self.assertEqual(modes[mode]["sink_request_count"], 0, mode)
                self.assertFalse(modes[mode]["token_valid"], mode)

    def test_material_release_diff_is_only_one_policy_field(self):
        old, new = self.material["r1_config"], self.material["r2_config"]
        self.assertEqual([k for k in old if old[k] != new[k]], ["timeout_fallback"])
        self.assertEqual(self.material["screen"]["changed_dependencies"], ["timeout_fallback"])
        self.assertEqual(self.pilot["model_state"], "NO_MODEL_USED")

    def test_no_impact_change_is_observed_without_forced_retest_conclusion(self):
        self.assertEqual(self.immaterial["screen"]["state"], "CONSISTENT")
        self.assertTrue(P.claim_observation(self.immaterial["r2_run"]))
        old, new = self.immaterial["r1_config"], self.immaterial["r2_config"]
        self.assertEqual([k for k in old if old[k] != new[k]], ["audit_label"])

    def test_missing_dependency_never_becomes_false_or_zero(self):
        self.assertIsNone(self.missing["r2_run"])
        self.assertEqual(self.missing["screen"]["state"], "UNCHECKABLE")
        self.assertIsNone(self.pilot["events"][2]["value"])
        self.assertIsNone(self.pilot["events"][2]["observed"]["new_release_result"])
        config = {"timeout_fallback": "suppress"}
        self.assertEqual(P.screen_applicability(config, config, {"test": "retained"})["state"], "UNCHECKABLE")

    def test_signatures_remain_valid_while_inherited_result_changes(self):
        for scenario in self.pilot["scenarios"]:
            self.assertTrue(scenario["historical_integrity"]["declaration_valid"])
            self.assertTrue(scenario["historical_integrity"]["observation_valid"])
        self.assertTrue(self.material["declaration_matches_executed_config"])
        self.assertFalse(P.claim_observation(self.material["r2_run"]))

    def test_tampered_history_and_untrusted_fresh_key_are_rejected(self):
        scenario = self.material
        modified = {**scenario["r1_config"], "timeout_fallback": "send"}
        pinned = self.pilot["fixture_public_key_b64"]
        self.assertFalse(P.check_seal(modified, scenario["historical_declaration_seal"], pinned))
        attacker = P.Ed25519PrivateKey.generate()
        self.assertFalse(P.check_seal(modified, P.seal(modified, attacker), pinned))

    def test_canonical_events_and_capsules_do_not_grant_authority(self):
        sys.path.insert(0, str(ROOT / "packages/venturi-capsule"))
        import venturi_capsule as V
        for event, capsule in zip(self.pilot["events"], self.pilot["capsules"]):
            self.assertEqual(P.E.validate(event), [])
            self.assertIsNone(event["signature"])
            self.assertIsNone(event["value"])
            self.assertEqual(V.authority_violations(capsule), [])
            self.assertEqual(V.capsule_id(capsule), capsule["capsule_id"])
            self.assertEqual(V.non_digest_sources(capsule["sources"]), [])

    def test_existing_schema_accepts_events(self):
        import jsonschema
        schema = json.loads((ROOT / "packages/evidence-fabric/schema/evidence-event-0.1.schema.json").read_text())
        for event in self.pilot["events"]:
            jsonschema.Draft7Validator(schema).validate(event)

    def test_otel_preserves_event_ids_and_missing_measurement(self):
        rendered = P.render_batch(self.pilot["events"])
        rows = rendered["resourceLogs"][0]["scopeLogs"][0]["logRecords"]
        for event, row in zip(self.pilot["events"], rows):
            attrs = {a["key"]: a["value"] for a in row["attributes"]}
            self.assertEqual(attrs["csoai.event_id"]["stringValue"], event["event_id"])
            self.assertNotIn("gen_ai.evaluation.score.value", attrs)
            self.assertNotIn("traceId", row)

    def test_offline_manifest_verification_and_tamper(self):
        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            root = pathlib.Path(output)
            digest = P.sha((root / "manifest.json").read_bytes())
            self.assertEqual(P.verify_directory(output, digest)["publisher_identity"], "NOT_ESTABLISHED")
            with self.assertRaisesRegex(ValueError, "manifest differs"):
                P.verify_directory(output, "0" * 64)
            (root / "events.jsonl").write_text("{}\n")
            with self.assertRaisesRegex(ValueError, "member digest mismatch"):
                P.verify_directory(output, digest)

    def test_no_silent_overwrite(self):
        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            with self.assertRaisesRegex(ValueError, "output must be empty"):
                P.write_pilot(self.pilot, output)

    def test_manifest_must_cover_every_consumed_member(self):
        for missing in P.REQUIRED_MEMBERS:
            with tempfile.TemporaryDirectory() as output, self.subTest(missing=missing):
                P.write_pilot(self.pilot, output)
                path = pathlib.Path(output) / "manifest.json"
                manifest = json.loads(path.read_text())
                del manifest["files"][missing]
                path.write_bytes(P.E.jcs(manifest))
                with self.assertRaisesRegex(ValueError, "five required"):
                    P.verify_directory(output, P.sha(path.read_bytes()))

    def test_manifest_digest_format_and_file_bounds(self):
        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            path = pathlib.Path(output) / "manifest.json"
            manifest = json.loads(path.read_text())
            manifest["files"]["pilot.json"] = "invalid"
            path.write_bytes(P.E.jcs(manifest))
            with self.assertRaisesRegex(ValueError, "malformed member digest"):
                P.verify_directory(output, P.sha(path.read_bytes()))
        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            path = pathlib.Path(output) / "manifest.json"
            with mock.patch.object(P, "MAX_MEMBER_BYTES", 16):
                with self.assertRaisesRegex(ValueError, "byte bound"):
                    P.verify_directory(output, P.sha(path.read_bytes()))

    def test_record_and_receiver_references_are_checked_beyond_manifest(self):
        def repin(output):
            root = pathlib.Path(output)
            manifest = {"files": {name: P.sha((root / name).read_bytes()) for name in P.REQUIRED_MEMBERS}}
            (root / "manifest.json").write_bytes(P.E.jcs(manifest))
            return P.sha((root / "manifest.json").read_bytes())

        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            root = pathlib.Path(output)
            pilot = json.loads((root / "pilot.json").read_text())
            pilot["scenarios"][0]["r2_config"]["audit_label"] = "changed-after-capture"
            (root / "pilot.json").write_bytes(P.E.jcs(pilot))
            with self.assertRaisesRegex(ValueError, "scenario source references"):
                P.verify_directory(output, repin(output))
        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            root = pathlib.Path(output)
            refs = json.loads((root / "reference-projections.json").read_text())
            refs["evidence_refs"][0]["sha256"] = "0" * 64
            (root / "reference-projections.json").write_bytes(P.E.jcs(refs))
            with self.assertRaisesRegex(ValueError, "receiver references"):
                P.verify_directory(output, repin(output))

    def test_receiver_projection_has_no_asserted_native_acceptance(self):
        with tempfile.TemporaryDirectory() as output:
            P.write_pilot(self.pilot, output)
            refs = json.loads((pathlib.Path(output) / "reference-projections.json").read_text())
            for receiver in refs["receivers"].values():
                self.assertEqual(receiver["acceptance"], "NOT_ESTABLISHED")
                self.assertEqual(receiver["state"], "NOT_CONNECTED")
            path = pathlib.Path(output) / "arbitrary-upstream.json"
            path.write_text('{"not_a_runtime_test":true}')
            ref = P.evidence_reference(path, "Moonshot")
            self.assertEqual(ref["semantic_result"], "UNMEASURED")
            self.assertEqual(ref["sha256"], P.sha(path.read_bytes()))

    def test_nonloopback_upload_refused_before_network(self):
        deceptive = ("https://example.invalid/upload", "http://127.0.0.1:80@external.example/effect",
                     "http://127.0.0.1:80#fragment", "http://127.0.0.1:bad/effect",
                     "http://127.0.0.1/effect", "http://127.0.0.1:0/effect",
                     "http://127.0.0.1:65536/effect", "http://127.0.0.1:80\n/effect")
        with mock.patch.object(P.urllib.request, "build_opener") as opener:
            for url in deceptive:
                with self.subTest(url=url), self.assertRaisesRegex(ValueError, "loopback"):
                    P.post_local(url, {}, 1)
            opener.assert_not_called()

    def test_redirect_from_real_local_server_is_refused(self):
        class Redirect(P.http.server.BaseHTTPRequestHandler):
            def log_message(self, *_args):
                pass

            def do_POST(self):
                self.send_response(302)
                self.send_header("Location", "https://example.invalid/never-contact")
                self.end_headers()

        server = P.QuietServer(("127.0.0.1", 0), Redirect)
        thread = P.threading.Thread(target=server.serve_forever, kwargs={"poll_interval": 0.01}, daemon=True)
        thread.start()
        try:
            with self.assertRaisesRegex(ValueError, "redirect refused"):
                P.post_local(f"http://127.0.0.1:{server.server_port}/effect", {}, 1)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)


if __name__ == "__main__":
    unittest.main()
