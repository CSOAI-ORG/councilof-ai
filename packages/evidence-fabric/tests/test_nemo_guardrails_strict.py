#!/usr/bin/env python3
# SPDX-License-Identifier: Apache-2.0
"""Offline synthetic controls for the existing normalised NeMo trace importer."""
import copy
import hashlib
import importlib.util
import itertools
import json
from pathlib import Path
import subprocess
import sys
import tempfile
import unittest
from unittest.mock import patch

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT))
import event as E
from ingest import nemo_guardrails_in as N

READ_AT = "2026-11-09T08:00:00Z"

def trace(turn=None, **metadata):
    default = {"turn_id": "synthetic-1", "expected_action": "allow",
               "activated_rails": [{"name": "fixture", "decision": "allow"}]}
    return {**metadata, "turns": [default if turn is None else turn]}

def raw(doc):
    return json.dumps(doc, separators=(",", ":"), allow_nan=False).encode()

def event(doc):
    return N.ingest(raw(doc), read_at=READ_AT)[0]


class StrictTraceTests(unittest.TestCase):
    def test_explicit_allow_still_consistent(self):
        ev = event(trace())
        self.assertEqual(ev["state"], "CONSISTENT")
        self.assertEqual(ev["observed"]["observed_action"], "allow")

    def test_existing_blocking_aliases_supported(self):
        for label in ("block", "refuse", "stop", "reject", " BLOCK "):
            with self.subTest(label=label):
                ev = event(trace({"expected_action": label, "activated_rails": [{"decision": label}]}))
                self.assertEqual(ev["state"], "CONSISTENT")
                self.assertEqual(ev["observed"]["observed_action"], "block")

    def test_error_unknown_and_nonstring_are_not_allow(self):
        for value in ("ERROR", "UNKNOWN", "blocked", "passed", "", " ", False, True, 0, 1, -1, 1.5, [], {}):
            with self.subTest(value=value):
                ev = event(trace({"expected_action": "allow", "activated_rails": [{"decision": value}]}))
                self.assertEqual(ev["state"], "UNCHECKABLE")
                self.assertIsNone(ev["observed"]["observed_action"])
                self.assertIsNone(ev["value"])
                self.assertEqual(ev["negative_control"]["got"], "NOT_RUN")

    def test_missing_expected_action_is_not_default_allow(self):
        ev = event(trace({"activated_rails": [{"decision": "allow"}]}))
        self.assertEqual(ev["state"], "UNCHECKABLE")
        self.assertIsNone(ev["declared"]["expected_action"])
        self.assertEqual(ev["observed"]["observed_action"], "allow")
        self.assertIsNone(ev["observed"]["recount_matches_declared"])

    def test_bad_expected_action_cannot_claim_consistency(self):
        for expected in (None, "UNKNOWN", False, 0, "", {}, []):
            with self.subTest(expected=expected):
                ev = event(trace({"expected_action": expected, "activated_rails": [{"decision": "allow"}]}))
                self.assertEqual(ev["state"], "UNCHECKABLE")

    def test_absent_null_and_empty_traces_remain_unmeasured(self):
        for turn in ({"expected_action": "allow"}, {"activated_rails": None}, {"activated_rails": []}):
            with self.subTest(turn=turn):
                ev = event(trace(turn));self.assertEqual(ev["state"], "UNMEASURED")
                self.assertIsNone(ev["value"])

    def test_missing_individual_decision_is_unmeasured(self):
        for rail in ({"name": "guard"}, {"decision": None}, {"decision": None, "status": None}):
            ev = event(trace({"expected_action": "allow", "activated_rails": [rail]}))
            self.assertEqual(ev["state"], "UNMEASURED")
            self.assertEqual(ev["observed"]["reason_code"], "MISSING_RAIL_DECISION")

    def test_missing_decision_among_known_rails_withholds_aggregate(self):
        for rails in ([{"decision": "block"}, {}], [{}, {"decision": "block"}]):
            ev = event(trace({"expected_action": "block", "activated_rails": rails}))
            self.assertEqual(ev["state"], "UNMEASURED")
            self.assertIsNone(ev["observed"]["observed_action"])
            self.assertEqual(ev["negative_control"]["got"], "NOT_RUN")

    def test_nullable_decision_fallback_is_preserved(self):
        for rail in ({"status": "block"}, {"decision": None, "status": "block"}):
            ev = event(trace({"expected_action": "block", "activated_rails": [rail]}))
            self.assertEqual(ev["state"], "CONSISTENT")

    def test_conflicting_aliases_are_not_silently_chosen(self):
        ev = event(trace({"expected_action": "allow", "activated_rails": [{"decision": "allow", "status": "block"}]}))
        self.assertEqual(ev["state"], "UNCHECKABLE")
        self.assertEqual(ev["observed"]["reason_code"], "CONFLICTING_RAIL_DECISIONS")

    def test_equivalent_blocking_aliases_agree(self):
        ev = event(trace({"expected_action": "block", "activated_rails": [{"decision": "reject", "status": "refuse"}]}))
        self.assertEqual(ev["state"], "CONSISTENT")

    def test_invalid_secondary_field_is_not_hidden(self):
        ev = event(trace({"expected_action": "allow", "activated_rails": [{"decision": "allow", "status": "error"}]}))
        self.assertEqual(ev["state"], "UNCHECKABLE")

    def test_invalid_primary_field_does_not_fall_back(self):
        ev = event(trace({"expected_action": "allow", "activated_rails": [{"decision": False, "status": "allow"}]}))
        self.assertEqual(ev["state"], "UNCHECKABLE")

    def test_malformed_rails_in_either_position_are_uncheckable(self):
        for rails in ([42, {"decision": "allow"}], [{"decision": "allow"}, 42], [None]):
            ev = event(trace({"expected_action": "allow", "activated_rails": rails}))
            self.assertEqual(ev["state"], "UNCHECKABLE")
            self.assertIsNone(ev["observed"]["observed_action"])

    def test_bad_rail_container_is_not_absent(self):
        for rails in (False, 0, "", {}, "allow"):
            ev = event(trace({"expected_action": "allow", "activated_rails": rails}))
            self.assertEqual(ev["state"], "UNCHECKABLE")

    def test_recount_refuses_nonempty_invalid_trace(self):
        with self.assertRaises(ValueError):N.recount_turn({"activated_rails": [42]})

    def test_negative_control_reports_actual_consistent_to_divergent(self):
        ev = event(trace())
        self.assertEqual(ev["negative_control"], {"id": N.CONTROL_ID, "expected": "DIVERGENT", "got": "DIVERGENT"})

    def test_negative_control_reports_actual_divergent_to_consistent(self):
        ev = event(trace({"expected_action": "block", "activated_rails": [{"decision": "allow"}]}))
        self.assertEqual(ev["state"], "DIVERGENT")
        self.assertEqual(ev["negative_control"], {"id": N.CONTROL_ID, "expected": "CONSISTENT", "got": "CONSISTENT"})

    def test_control_name_and_mechanics_cover_multiple_blockers(self):
        turn = {"expected_action": "block", "activated_rails": [{"decision": "block"}, {"status": "refuse"}, {"decision": "allow"}]}
        before = copy.deepcopy(turn)
        changed = N.invert_aggregate_outcome(turn)
        self.assertEqual(turn, before)
        self.assertEqual(N.recount_turn(changed)["observed_action"], "allow")
        self.assertEqual(changed["activated_rails"][2], before["activated_rails"][2])
        self.assertEqual(event(trace(turn))["negative_control"]["id"], "aggregate-rail-outcome-inverted")

    def test_disabled_control_is_detected(self):
        with patch.object(N, "invert_aggregate_outcome", side_effect=copy.deepcopy):
            ev = event(trace())
        self.assertEqual(ev["state"], "NOT_DISCRIMINATING")
        self.assertEqual(ev["negative_control"]["got"], "CONSISTENT")

    def test_input_turn_order_does_not_change_aggregate(self):
        rails = [{"decision": "allow"}, {"decision": "block"}, {"status": "reject"}]
        for perm in itertools.permutations(rails):
            self.assertEqual(event(trace({"expected_action": "block", "activated_rails": list(perm)}))["state"], "CONSISTENT")

    def test_source_hash_binds_original_bytes(self):
        doc = trace();data = raw(doc)
        self.assertEqual(event(doc)["claim"]["source_sha256"], hashlib.sha256(data).hexdigest())

    def test_replay_deterministic_and_inputs_unchanged(self):
        doc = trace();before = copy.deepcopy(doc)
        self.assertEqual(event(doc), event(doc));self.assertEqual(doc, before)

    def test_event_schema_and_authority_boundary_preserved(self):
        ev = event(trace())
        self.assertEqual(E.validate(ev), [])
        self.assertEqual(ev["schema"], "csoai.evidence-event/0.1")
        self.assertIsNone(ev["value"]);self.assertIsNone(ev["signature"])
        self.assertEqual(ev["anchors"]["ots"], "none")
        self.assertNotIn("execution_authorized", ev)

    def test_importer_version_is_not_claimed_upstream_version(self):
        ev = event(trace(nemo_guardrails_version="0.11.0"))
        self.assertEqual(ev["method"]["holder"], "csoai")
        self.assertEqual(ev["method"]["version"], "0.2.0")
        self.assertEqual(ev["declared"]["source_nemo_guardrails_version"], "0.11.0")

    def test_missing_upstream_version_not_fabricated(self):
        ev = event(trace());self.assertIsNone(ev["declared"]["source_nemo_guardrails_version"])
        self.assertNotIn("0.11.0", json.dumps(ev))

    def test_nonfinite_json_literals_rejected(self):
        for value in ("NaN", "Infinity", "-Infinity", "1e999"):
            with self.subTest(value=value), self.assertRaises(ValueError):
                N.ingest(('{"turns":[],"irrelevant":'+value+'}').encode(), read_at=READ_AT)

    def test_duplicate_json_keys_rejected(self):
        for text in ('{"turns":[],"turns":[]}', '{"turns":[{"expected_action":"block","expected_action":"allow"}]}'):
            with self.assertRaises(ValueError):N.ingest(text.encode(), read_at=READ_AT)

    def test_native_or_malformed_envelopes_do_not_become_empty_success(self):
        for doc in ({}, {"log": {"activated_rails": []}}, [], {"turns": None}, {"turns": {}}, {"turns": [None]}):
            with self.subTest(doc=doc), self.assertRaises(ValueError):N.ingest(raw(doc), read_at=READ_AT)

    def test_explicit_empty_turn_list_is_empty_not_absent(self):
        self.assertEqual(N.ingest(b'{"turns":[]}', read_at=READ_AT), [])

    def test_duplicate_turn_id_rejected(self):
        one = trace()["turns"][0]
        with self.assertRaises(ValueError):N.ingest(raw({"turns": [one, one]}), read_at=READ_AT)

    def test_declared_rails_string_not_coerced_into_characters(self):
        doc = trace();doc["turns"][0]["declared_rails"] = "guard"
        with self.assertRaises(ValueError):event(doc)

    def test_oversize_bytes_and_turn_rosters_rejected(self):
        with self.assertRaises(ValueError):N.ingest(b' '*(N.MAX_TRACE_BYTES+1), read_at=READ_AT)
        with self.assertRaises(ValueError):N.ingest(raw({"turns": [{}]*(N.MAX_TURNS+1)}), read_at=READ_AT)

    def test_oversize_rails_remain_uncheckable(self):
        ev = event(trace({"expected_action":"allow", "activated_rails":[{"decision":"allow"}]*(N.MAX_RAILS+1)}))
        self.assertEqual(ev["state"], "UNCHECKABLE")

    def test_naive_read_time_rejected(self):
        with self.assertRaises(ValueError):N.ingest(raw(trace()), read_at="2026-11-09T08:00:00")

    def test_cli_validates_late_input_before_emission(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder)/'input.json';p.write_bytes(raw({"turns":[trace()["turns"][0], {"turn_id": "synthetic-1"}]}))
            run = subprocess.run([sys.executable, '-B', str(ROOT/'ingest/nemo_guardrails_in.py'), str(p), '--read-at', READ_AT], capture_output=True, text=True, timeout=10)
        self.assertNotEqual(run.returncode, 0);self.assertEqual(run.stdout, "")

    def test_cli_emits_original_event_schema(self):
        with tempfile.TemporaryDirectory() as folder:
            p = Path(folder)/'input.json';p.write_bytes(raw(trace()))
            run = subprocess.run([sys.executable, '-B', str(ROOT/'ingest/nemo_guardrails_in.py'), str(p), '--read-at', READ_AT], capture_output=True, text=True, timeout=10)
        self.assertEqual(run.returncode, 0, run.stderr)
        self.assertEqual(E.validate(json.loads(run.stdout)), [])

    def test_legacy_mutator_alias_does_not_mutate_source(self):
        turn = trace()["turns"][0];before = copy.deepcopy(turn)
        self.assertEqual(N.flip_one_rail(turn), N.invert_aggregate_outcome(turn));self.assertEqual(turn,before)

    def test_upstream_format_is_explicitly_outside_scope(self):
        self.assertIn("not arbitrary native NeMo SDK output", " ".join(event(trace())["limits"]))


if __name__ == '__main__':
    unittest.main(verbosity=2)
