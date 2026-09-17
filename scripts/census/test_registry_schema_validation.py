#!/usr/bin/env python3
"""Proof that the registry validation stage produces each state, and discriminates.

Runs entirely offline: every schema it needs is in ``schema-cache/``.

A validator that answers SCHEMA_VALID to everything is worse than no validator,
so the load-bearing assertions here are the CONTRASTS:
  * the #1546 fixture (``repository: {}``) is SCHEMA_INVALID, and the violation
    names the missing ``url``/``source`` — not merely "some error";
  * a well-formed record under the SAME schema is SCHEMA_VALID;
  * a record that parses as JSON but breaks the schema is never SCHEMA_VALID;
  * UNDECLARED and UNFETCHABLE are neither valid nor invalid.

Run: python3 -m unittest scripts/census/test_registry_schema_validation.py -v
"""

from __future__ import annotations

import copy
import importlib.util
import json
import sys
import tempfile
import unittest
from pathlib import Path

_SPEC = importlib.util.spec_from_file_location(
    "registry_schema_validation",
    Path(__file__).with_name("registry_schema_validation.py"),
)
rsv = importlib.util.module_from_spec(_SPEC)
assert _SPEC.loader is not None
# Register before exec: the module defines dataclasses with postponed annotations,
# which dataclasses resolves through sys.modules at class-creation time.
sys.modules["registry_schema_validation"] = rsv
_SPEC.loader.exec_module(rsv)

FIXTURES = Path(__file__).with_name("fixtures") / "registry-records"
CACHE = Path(__file__).with_name("schema-cache")

SCHEMA_2025_09_29 = (
    "https://static.modelcontextprotocol.io/schemas/2025-09-29/server.schema.json"
)


def offline_resolver() -> "rsv.SchemaResolver":
    """Network is OFF. If a test needs a schema it must come from the cache."""
    return rsv.SchemaResolver(CACHE, allow_network=False)


def fixture_bytes(name: str) -> bytes:
    return (FIXTURES / name).read_bytes()


class SchemaInvalidFiresOn1546(unittest.TestCase):
    """The pin. MCP Registry issue #1546: served at HTTP 200 with repository:{}."""

    def setUp(self) -> None:
        self.raw = fixture_bytes("empty-repository-mcp-1546.json")
        self.verdict = rsv.validate_record_bytes(self.raw, offline_resolver())

    def test_fixture_really_holds_the_defect(self) -> None:
        # Guard the fixture itself: if someone "fixes" it, this test must fail
        # rather than quietly pass against a repaired record.
        server = json.loads(self.raw)["server"]
        self.assertEqual(server["name"], "ai.alpic.test/test-mcp-server")
        self.assertEqual(server["version"], "0.0.1")
        self.assertEqual(server["repository"], {})
        self.assertEqual(server["$schema"], SCHEMA_2025_09_29)

    def test_state_is_schema_invalid(self) -> None:
        self.assertEqual(self.verdict.schema_state, rsv.SCHEMA_INVALID)

    def test_upstream_acceptance_is_still_recorded_separately(self) -> None:
        # Presence and validity are different facts and both survive.
        self.assertEqual(self.verdict.source_state, rsv.SOURCE_ACCEPTED)

    def test_violation_names_the_actual_missing_fields(self) -> None:
        messages = " ".join(v.message for v in self.verdict.violations)
        paths = {v.path for v in self.verdict.violations}
        self.assertIn("$.repository", paths)
        self.assertIn("url", messages)
        self.assertIn("source", messages)

    def test_declared_schema_is_the_one_that_was_used(self) -> None:
        self.assertEqual(self.verdict.schema_url, SCHEMA_2025_09_29)
        self.assertEqual(self.verdict.schema_source, "cache")

    def test_record_bytes_are_not_mutated(self) -> None:
        self.assertEqual(fixture_bytes("empty-repository-mcp-1546.json"), self.raw)
        self.assertEqual(
            self.verdict.record_sha256,
            __import__("hashlib").sha256(self.raw).hexdigest(),
        )


class SchemaValidFires(unittest.TestCase):
    """The counterweight: the validator must be capable of saying VALID."""

    def setUp(self) -> None:
        self.raw = fixture_bytes("wellformed-mcp-registry-record.json")
        self.verdict = rsv.validate_record_bytes(self.raw, offline_resolver())

    def test_state_is_schema_valid(self) -> None:
        self.assertEqual(
            self.verdict.schema_state,
            rsv.SCHEMA_VALID,
            msg=f"unexpected violations: {[v.to_dict() for v in self.verdict.violations]}",
        )
        self.assertEqual(self.verdict.violations, ())

    def test_valid_and_invalid_fixtures_share_one_schema(self) -> None:
        # Same schema, opposite verdicts => the verdict comes from the record,
        # not from which schema happened to be resolved.
        other = rsv.validate_record_bytes(
            fixture_bytes("empty-repository-mcp-1546.json"), offline_resolver()
        )
        self.assertEqual(self.verdict.schema_url, other.schema_url)
        self.assertNotEqual(self.verdict.schema_state, other.schema_state)


class ValidatorCanFail(unittest.TestCase):
    """Prove the VALID answer is defeasible — mutate the good record and watch it break."""

    def _mutate(self, fn) -> "rsv.Verdict":
        envelope = json.loads(fixture_bytes("wellformed-mcp-registry-record.json"))
        fn(envelope["server"])
        return rsv.validate_record_bytes(
            json.dumps(envelope).encode("utf-8"), offline_resolver()
        )

    def test_emptying_repository_flips_valid_to_invalid(self) -> None:
        verdict = self._mutate(lambda s: s.__setitem__("repository", {}))
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_INVALID)

    def test_dropping_repository_source_flips_valid_to_invalid(self) -> None:
        verdict = self._mutate(lambda s: s["repository"].pop("source"))
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_INVALID)
        self.assertIn("source", " ".join(v.message for v in verdict.violations))

    def test_dropping_required_name_flips_valid_to_invalid(self) -> None:
        verdict = self._mutate(lambda s: s.pop("name"))
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_INVALID)

    def test_wrong_type_flips_valid_to_invalid(self) -> None:
        verdict = self._mutate(lambda s: s.__setitem__("version", 1))
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_INVALID)


class SchemaUndeclaredFires(unittest.TestCase):
    """Its own state: neither a failure nor a pass."""

    def setUp(self) -> None:
        self.verdict = rsv.validate_record_bytes(
            fixture_bytes("undeclared-schema.json"), offline_resolver()
        )

    def test_state_is_schema_undeclared(self) -> None:
        self.assertEqual(self.verdict.schema_state, rsv.SCHEMA_UNDECLARED)

    def test_is_not_treated_as_valid(self) -> None:
        self.assertNotEqual(self.verdict.schema_state, rsv.SCHEMA_VALID)

    def test_is_not_treated_as_invalid(self) -> None:
        self.assertNotEqual(self.verdict.schema_state, rsv.SCHEMA_INVALID)
        self.assertEqual(self.verdict.violations, ())

    def test_undeclared_does_not_borrow_a_schema(self) -> None:
        self.assertIsNone(self.verdict.schema_url)


class SchemaUnfetchableFires(unittest.TestCase):
    def test_uncached_schema_with_network_off_is_unfetchable(self) -> None:
        verdict = rsv.validate_record_bytes(
            fixture_bytes("unfetchable-schema.json"), offline_resolver()
        )
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_UNFETCHABLE)
        self.assertNotEqual(verdict.schema_state, rsv.SCHEMA_VALID)
        self.assertIsNotNone(verdict.note)

    def test_unfetchable_is_never_a_silent_pass(self) -> None:
        verdict = rsv.validate_record_bytes(
            fixture_bytes("unfetchable-schema.json"), offline_resolver()
        )
        self.assertNotIn(verdict.schema_state, (rsv.SCHEMA_VALID, rsv.SCHEMA_INVALID))

    def test_non_https_schema_url_is_unfetchable_not_read_from_disk(self) -> None:
        payload = {
            "server": {
                "$schema": "file:///etc/passwd",
                "name": "example.test/local",
                "version": "1.0.0",
            }
        }
        verdict = rsv.validate_record_bytes(
            json.dumps(payload).encode(), offline_resolver()
        )
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_UNFETCHABLE)
        self.assertIn("not permitted", verdict.note or "")

    def test_cached_bytes_that_are_not_a_schema_are_unfetchable(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            url = "https://example.invalid/not-a-schema.json"
            key = rsv.SchemaResolver.cache_key(url)
            Path(tmp, key + ".json").write_text('{"type": 12345}')
            resolver = rsv.SchemaResolver(tmp, allow_network=False)
            verdict = rsv.validate_record_bytes(
                json.dumps({"server": {"$schema": url, "name": "x"}}).encode(), resolver
            )
            self.assertEqual(verdict.schema_state, rsv.SCHEMA_UNFETCHABLE)
            self.assertIn("not a usable JSON Schema", verdict.note or "")


class RecordUnparseableFires(unittest.TestCase):
    def test_non_json_bytes_are_unparseable_not_undeclared(self) -> None:
        verdict = rsv.validate_record_bytes(
            fixture_bytes("unparseable-record.json"), offline_resolver()
        )
        self.assertEqual(verdict.schema_state, rsv.RECORD_UNPARSEABLE)
        self.assertNotEqual(verdict.schema_state, rsv.SCHEMA_UNDECLARED)

    def test_upstream_acceptance_is_still_recorded(self) -> None:
        verdict = rsv.validate_record_bytes(b"<html>503</html>", offline_resolver())
        self.assertEqual(verdict.source_state, rsv.SOURCE_ACCEPTED)
        self.assertEqual(verdict.schema_state, rsv.RECORD_UNPARSEABLE)


class ParseIsNotValidity(unittest.TestCase):
    def test_json_that_parses_but_is_empty_is_not_valid(self) -> None:
        verdict = rsv.validate_record_bytes(b"{}", offline_resolver())
        self.assertNotEqual(verdict.schema_state, rsv.SCHEMA_VALID)
        # {} declares no schema, so it is UNDECLARED, not a pass.
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_UNDECLARED)

    def test_garbage_with_a_declared_schema_is_invalid_not_valid(self) -> None:
        payload = {"server": {"$schema": SCHEMA_2025_09_29, "nonsense": True}}
        verdict = rsv.validate_record_bytes(
            json.dumps(payload).encode(), offline_resolver()
        )
        self.assertEqual(verdict.schema_state, rsv.SCHEMA_INVALID)


class DeclaredSchemaIsHonoured(unittest.TestCase):
    """Never validate against a version we assume."""

    def test_two_records_declaring_different_schemas_resolve_differently(self) -> None:
        with tempfile.TemporaryDirectory() as tmp:
            real = (CACHE / (rsv.SchemaResolver.cache_key(SCHEMA_2025_09_29) + ".json")).read_bytes()
            Path(tmp, rsv.SchemaResolver.cache_key(SCHEMA_2025_09_29) + ".json").write_bytes(real)
            resolver = rsv.SchemaResolver(tmp, allow_network=False)

            known = rsv.validate_record_bytes(
                fixture_bytes("empty-repository-mcp-1546.json"), resolver
            )
            other_url = (
                "https://static.modelcontextprotocol.io/schemas/"
                "2025-12-11/server.schema.json"
            )
            envelope = json.loads(fixture_bytes("empty-repository-mcp-1546.json"))
            envelope["server"]["$schema"] = other_url
            unknown = rsv.validate_record_bytes(json.dumps(envelope).encode(), resolver)

            self.assertEqual(known.schema_state, rsv.SCHEMA_INVALID)
            # Same record body; a schema we do not hold must NOT fall back to the
            # one we do hold.
            self.assertEqual(unknown.schema_state, rsv.SCHEMA_UNFETCHABLE)
            self.assertEqual(unknown.schema_url, other_url)


class CollectionIsNeverMutated(unittest.TestCase):
    def test_validation_leaves_the_collected_object_untouched(self) -> None:
        raw = fixture_bytes("wellformed-mcp-registry-record.json")
        before = copy.deepcopy(json.loads(raw))
        rsv.validate_record_bytes(raw, offline_resolver())
        self.assertEqual(json.loads(fixture_bytes("wellformed-mcp-registry-record.json")), before)

    def test_verdict_carries_identity_not_a_rewritten_record(self) -> None:
        verdict = rsv.validate_record_bytes(
            fixture_bytes("empty-repository-mcp-1546.json"), offline_resolver()
        )
        self.assertEqual(
            verdict.record_identity,
            {"name": "ai.alpic.test/test-mcp-server", "version": "0.0.1"},
        )
        self.assertNotIn("record", verdict.to_dict())


class DistributionReportsEveryState(unittest.TestCase):
    def test_all_five_states_are_reachable_from_the_fixture_set(self) -> None:
        resolver = offline_resolver()
        verdicts = [
            rsv.validate_record_bytes(fixture_bytes(n), resolver)
            for n in (
                "wellformed-mcp-registry-record.json",
                "empty-repository-mcp-1546.json",
                "undeclared-schema.json",
                "unfetchable-schema.json",
                "unparseable-record.json",
            )
        ]
        dist = rsv.distribution(verdicts)
        self.assertEqual(
            dist,
            {
                rsv.SCHEMA_VALID: 1,
                rsv.SCHEMA_INVALID: 1,
                rsv.SCHEMA_UNDECLARED: 1,
                rsv.SCHEMA_UNFETCHABLE: 1,
                rsv.RECORD_UNPARSEABLE: 1,
            },
        )

    def test_zero_counts_are_printed_not_omitted(self) -> None:
        dist = rsv.distribution([])
        self.assertEqual(set(dist), set(rsv.SCHEMA_STATES))
        self.assertTrue(all(v == 0 for v in dist.values()))


class OfflineGuarantee(unittest.TestCase):
    def test_default_resolver_does_not_allow_network(self) -> None:
        self.assertFalse(rsv.SchemaResolver(CACHE).allow_network)

    def test_offline_resolver_makes_no_network_call(self) -> None:
        import urllib.request

        original = urllib.request.urlopen

        def exploding(*a, **k):  # pragma: no cover - must never run
            raise AssertionError("validation attempted a network call while offline")

        urllib.request.urlopen = exploding
        try:
            resolver = offline_resolver()
            for name in (
                "wellformed-mcp-registry-record.json",
                "empty-repository-mcp-1546.json",
                "undeclared-schema.json",
                "unfetchable-schema.json",
            ):
                rsv.validate_record_bytes(fixture_bytes(name), resolver)
        finally:
            urllib.request.urlopen = original


if __name__ == "__main__":
    unittest.main(verbosity=2)
