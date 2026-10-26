# SPDX-License-Identifier: Apache-2.0
"""A CONSISTENT verdict must carry the control that made it CONSISTENT.

The gap this file closes: an evidence event could carry `state: CONSISTENT`
with a negative control that was never identified and never expected — it just
*declared* that the control came out CONSISTENT — and pass both the event
rules and the JSON Schema. A record that way asserts "the method worked"
without ever showing a method that could have failed.

Owner invariant 4 says it already: *all-pass is not competent measurement.* The
instrument census applies that at the instrument level; this file is the same
rule at the record level.

The rule, in one line: a CONSISTENT event must carry an identified control, an
expected outcome for it, the fact that it ran, and the fact that it behaved as
expected. Anything less is PARTIAL (we did not check) or NOT_DISCRIMINATING
(the method cannot separate), and those states exist for exactly this.
"""
import copy
import importlib.util
import json
import os
import sys

import pytest

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(os.path.dirname(HERE)))
PKG_LIB = os.path.join(REPO, "packages", "evidence-fabric")
SAFE_LIB = os.path.join(REPO, "docs", "standards", "osaia-safe-evidence-pack", "lib")


def _load(name, path):
    """Load a module by path under a distinct name.

    Two copies of event.py exist and both are under test, so neither is
    imported by bare name: an import that resolved to the wrong copy would
    make the drift test prove nothing.
    """
    spec = importlib.util.spec_from_file_location(name, path)
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


E = _load("evidence_fabric_event", os.path.join(PKG_LIB, "event.py"))


def _subject():
    return {"kind": "mcp_server", "locator": "https://example.org/mcp"}


def _claim():
    return {"text": "The server declares tools/list returns 3 tools.",
            "source_sha256": "0" * 64,
            "source_url": "https://example.org/server.json"}


def _method():
    return {"id": "tools/count", "version": "1.0.0", "holder": "csoai"}


def _limits():
    return ["FIXTURE: synthetic event; it measures nothing."]


def _build(state="CONSISTENT", negative_control=None):
    """A minimal event, built through the real builder so the rules apply."""
    return E.build(
        subject=_subject(), claim=_claim(), method=_method(),
        declared={"tools": 3}, observed={"tools": 3},
        state=state, value=1.0 if state not in ("UNMEASURED", "UNCHECKABLE") else None,
        negative_control=negative_control, limits=_limits(),
    )


# The record that used to pass: CONSISTENT, a control that was never
# identified, never expected, and simply declared to have come out CONSISTENT.
UNDECLARED_CONTROL = {"id": None, "expected": None, "got": "CONSISTENT"}

# The control that makes it honest: identified, expected, run, and it behaved
# as expected — which is what "the method discriminated" means.
DISCRIMINATING_CONTROL = {"id": "known-bad-server", "expected": "DIVERGENT",
                          "got": "DIVERGENT"}


class TestTheGapIsClosed:
    def test_consistent_with_an_undeclared_control_is_rejected(self):
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control=UNDECLARED_CONTROL)
        msg = str(exc.value)
        assert "identified negative control" in msg
        assert "expected outcome" in msg

    def test_the_error_names_the_state_to_use_instead(self):
        """An admission error that does not say what to do is half an error."""
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control=UNDECLARED_CONTROL)
        msg = str(exc.value)
        assert "PARTIAL" in msg or "NOT_DISCRIMINATING" in msg

    def test_a_control_that_was_never_run_is_rejected(self):
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control={"id": "known-bad-server", "expected": "DIVERGENT",
                                     "got": "NOT_RUN"})
        assert "no negative control run" in str(exc.value)

    def test_a_control_with_no_expected_outcome_is_rejected(self):
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control={"id": "known-bad-server", "expected": None,
                                     "got": "DIVERGENT"})
        assert "expected outcome" in str(exc.value)

    def test_a_control_that_did_not_discriminate_is_rejected(self):
        """The control came back as the claim, so the method separated nothing."""
        with pytest.raises(E.DoctrineError) as exc:
            _build(negative_control={"id": "known-bad-server", "expected": "DIVERGENT",
                                     "got": "CONSISTENT"})
        assert "did not discriminate" in str(exc.value)


class TestTheHonestRecordStillPasses:
    def test_a_discriminating_control_admits_the_record(self):
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        assert E.validate(ev) == []
        assert ev["state"] == "CONSISTENT"

    def test_an_empty_control_id_is_not_an_identification(self):
        with pytest.raises(E.DoctrineError):
            _build(negative_control={"id": "   ", "expected": "DIVERGENT", "got": "DIVERGENT"})


class TestOtherStatesAreUnaffected:
    """Only CONSISTENT claims the method worked. The weaker states may have no control."""

    @pytest.mark.parametrize("state", ["PARTIAL", "DIVERGENT", "NOT_DISCRIMINATING",
                                       "UNMEASURED", "UNCHECKABLE"])
    def test_a_record_without_a_control_is_still_admitted_in_weaker_states(self, state):
        ev = E.build(
            subject=_subject(), claim=_claim(), method=_method(),
            declared={"tools": 3}, observed={"tools": 3},
            state=state,
            value=None if state in ("UNMEASURED", "UNCHECKABLE") else 1.0,
            negative_control={"id": None, "expected": None, "got": "NOT_RUN"},
            limits=_limits(),
        )
        assert E.validate(ev) == []


class TestTheJsonSchemaLayerAgrees:
    """The schema is the second gate. It must close the same hole."""

    @staticmethod
    def _validator():
        from jsonschema import Draft7Validator
        path = os.path.join(PKG_LIB, "schema", "evidence-event-0.1.schema.json")
        with open(path, encoding="utf-8") as fh:
            return Draft7Validator(json.load(fh))

    def test_the_schema_rejects_an_undeclared_control(self):
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        # Make it schema-legal except for the control, so the rejection is
        # attributable to the control rule and nothing else.
        ev = copy.deepcopy(ev)
        ev["negative_control"] = UNDECLARED_CONTROL
        ev["event_id"] = E.compute_event_id(ev)
        errors = list(self._validator().iter_errors(ev))
        assert errors, "the JSON Schema must reject a CONSISTENT record with no identified control"

    def test_the_schema_admits_the_honest_record(self):
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        assert list(self._validator().iter_errors(ev)) == []


class TestBothCopiesOfTheRuleStayInStep:
    """Two copies of the validator exist. A fix in one and not the other is drift.

    The SAFE evidence pack ships its own copy of event.py so the standard can be
    read without the package. They have to enforce the same admission rule, or
    a record rejected by the standard is accepted by the implementation.
    """

    @staticmethod
    def _safe_event_module():
        return _load("safe_evidence_event", os.path.join(SAFE_LIB, "event.py"))

    def test_the_safe_copy_rejects_the_same_record(self):
        safe = self._safe_event_module()
        ev = _build(negative_control=DISCRIMINATING_CONTROL)
        ev["negative_control"] = UNDECLARED_CONTROL
        errs = safe.validate(ev)
        assert errs, "the SAFE pack copy of the rule must reject an undeclared control"
        assert any("identified negative control" in e for e in errs)


class TestTheExistingCorpusIsUnaffected:
    """No published record breaks. The corpus is the regression proof."""

    def test_every_fixture_still_validates(self):
        path = os.path.join(HERE, "fixtures", "events.jsonl")
        with open(path, encoding="utf-8") as fh:
            for line in fh:
                line = line.strip()
                if not line:
                    continue
                assert E.validate(json.loads(line)) == [], line[:120]

    def test_the_safe_pack_records_still_validate(self):
        rec_dir = os.path.join(os.path.dirname(SAFE_LIB), "records")
        if not os.path.isdir(rec_dir):
            pytest.skip("no SAFE pack records in this checkout")
        safe = _load("safe_evidence_event_records", os.path.join(SAFE_LIB, "event.py"))
        for name in sorted(os.listdir(rec_dir)):
            if not name.endswith(".json"):
                continue
            with open(os.path.join(rec_dir, name), encoding="utf-8") as fh:
                doc = json.load(fh)
            for rec in (doc if isinstance(doc, list) else [doc]):
                if isinstance(rec, dict) and rec.get("schema") == E.SCHEMA:
                    assert safe.validate(rec) == [], f"{name}: {safe.validate(rec)}"
